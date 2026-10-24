"""Long-form canvas for chalk figures, in the format of the RL series articles.

On a wide screen the figures sit on one board beside the text, and scrolling moves the
board to the figure of the current passage. On a phone each figure is drawn inline, at
the place where it stood in the text. The page runs assets/robotics/rl/canvas.js and
assets/robotics/rl/series.css, the same code as the RL series.

The markdown article stays the source. Each figure is two lines in it:

    <div class="rc-mark" id="fig-KEY" data-panel="KEY" data-title="Short title"></div>
    <div class="rc-slot" data-for="fig-KEY" data-src="/assets/.../NAME.svg" data-caption="Caption."><span class="rc-sr">Alt text.</span></div>

The mark is where the board moves to the figure on a wide screen. The slot is where the
figure shows on a phone, and it names the panel file and the caption. build() makes the
board again from the slots, so a new figure or caption needs only a new build:

    python3 assets/robotics/chalk/canvas.py build content/robotics/<article>.md

convert() turns an article with markdown figures, ![alt](/assets/.../NAME.png "Caption"),
into this form once. A panel file is the .svg next to the .png, written by
chalk.save(..., panel=True), or a hand-drawn SVG.
"""

import html
import json
import re
import sys
from pathlib import Path

from PIL import ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FONT = HERE / "fonts" / "PatrickHand-Regular.ttf"

# Board geometry in board units. A panel is 400 wide, as on the RL boards.
BOARD_W = 840
COLS = 2
PANEL_W = 400
GAP = 20
PAD = 10
TITLE_H = 40       # the panel title row, shown only on the whole board
CAPTION = 15       # caption font size
CAPTION_LINE = 19
# On a phone a figure keeps the shape of its panel up to this height-to-width ratio
# (canvas.js data-fig-max), so stacked plots stay at full width and readable.
FIG_MAX = 2.8

START = '<div class="rc rls-canvas" id="rc">'
BODY = '<div class="rc-body">'

# The page head: the RL series styles, and the chalk filter of the RL boards without its
# displacement. The grain thins the chalk; no pixel moves, so lines stay straight and
# text stays on its baseline. The series box keeps the part numbers of this series.
HEAD = """<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<style>
/* The RL series counts parts from 0; this series keeps the list numbers. */
.series-box ol { list-style: decimal inside; } .series-box ol > li::before { content: none; }
/* Captions on the board read as notes under the figure. */
.article-body .rls-canvas .rc-svg .rc-caption { fill: var(--bb-dim); }
.article-body .rls-canvas .rc-svg .rc-caption .rc-code { font-family: ui-monospace, Menlo, Consolas, monospace !important; }
/* Matplotlib positions each math word separately; extra CSS tracking joins those words. */
.article-body .rls-canvas .rc-svg .rc-panel svg text { letter-spacing: 0; }
/* A tall panel can have a two-column wide view; the phone keeps the original stacked drawing. */
.rc-narrow-full { display: none; }
@media (max-width: 999px) { .rc-wide-split { display: none; } .rc-narrow-full { display: inline; } }
/* Drawers have their own padding; the full-bleed phone figure must not cover their borders. */
@media (max-width: 700px) {
.article-body .rls-canvas details .rc-fig { margin-inline: 0; }
.article-body .rls-canvas details .rc-fig .rc-fig-cap { padding-inline: 0; }
}
</style>
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.32 1.16" result="mask"/><feComposite in="SourceGraphic" in2="mask" operator="in"/></filter></svg>"""
TAIL = '<script src="/assets/robotics/rl/canvas.js" defer></script>'

_font = {}


def text_width(text, size, code=False):
    if code:
        return 0.6 * size * len(text)
    if size not in _font:
        _font[size] = ImageFont.truetype(str(FONT), size)
    return _font[size].getlength(text)


def runs(caption):
    """Split a caption into (text, is_code) runs; `code` spans become code runs."""
    parts = re.split(r"`([^`]*)`", caption)
    return [(part, i % 2 == 1) for i, part in enumerate(parts) if part]


def wrap(caption, width, size=CAPTION):
    """Wrap a caption into lines of runs that fit width board units."""
    words = []
    for text, code in runs(caption):
        for i, word in enumerate(re.split(r"( )", text)):
            if word:
                words.append((word, code))
    lines, line, used = [], [], 0.0
    for word, code in words:
        w = text_width(word, size, code)
        if word == " ":
            if line:
                line.append((word, code))
                used += w
            continue
        if line and used + w > width:
            while line and line[-1][0] == " ":
                used -= text_width(" ", size)
                line.pop()
            lines.append(line)
            line, used = [], 0.0
        line.append((word, code))
        used += w
    if line:
        lines.append(line)
    return lines


def line_markup(line):
    out, run, code = [], "", None
    for word, is_code in line + [("", None)]:
        if is_code != code and run:
            esc = html.escape(run, quote=False)
            out.append(f'<tspan class="rc-code">{esc}</tspan>' if code else esc)
            run = ""
        code = is_code
        run += word
    return "".join(out)


def read_panel(src):
    """The view box size and the inner markup of a panel file, given its site path."""
    text = (ROOT / src.lstrip("/")).read_text()
    text = re.sub(r"<\?xml[^>]*\?>|<!--.*?-->", "", text, flags=re.S).strip()
    root = re.match(r"<svg\b([^>]*)>", text)
    if not root:
        raise ValueError(f"{src}: not an SVG file")
    attrs = root.group(1)
    box = re.search(r'viewBox="([^"]+)"', attrs)
    if not box:
        raise ValueError(f"{src}: the SVG has no viewBox")
    x, y, w, h = (float(v) for v in box.group(1).replace(",", " ").split())
    keep = " ".join(m.group(0) for m in re.finditer(r'\b(?:class|stroke-linejoin|stroke-linecap|font-size|font-family)="[^"]*"', attrs))
    inner = text[root.end():text.rindex("</svg>")].strip()
    inner = inner.replace("\n", " ")
    return (x, y, w, h), keep, inner


def n(value):
    text = f"{value:.1f}".rstrip("0").rstrip(".")
    return text


def prefix_ids(markup, prefix):
    """Give a reused SVG fragment new ids and follow its local references."""
    for old in re.findall(r'\bid="([^"]+)"', markup):
        new = prefix + old
        markup = markup.replace(f'id="{old}"', f'id="{new}"')
        markup = markup.replace(f'url(#{old})', f'url(#{new})')
        markup = markup.replace(f'href="#{old}"', f'href="#{new}"')
    return markup


def caption_markup(lines, x, y):
    if not lines:
        return ""
    tspans = "".join(f'<tspan x="{n(x)}" y="{n(y + i * CAPTION_LINE)}">{line_markup(line)}</tspan>'
                     for i, line in enumerate(lines))
    return f'<text class="rc-caption" font-size="{CAPTION}">{tspans}</text>'


def panel_markup(index, figure, x, y):
    """One panel, with an optional two-column wide view of a tall stacked figure."""
    (bx, by, bw, bh), keep, inner = read_panel(figure["src"])
    inner_w = PANEL_W - 2 * PAD
    fig_h = inner_w * bh / bw
    # Room for the letter spacing of the page and for glyphs from a fallback font.
    lines = wrap(figure["caption"], inner_w - 26) if figure["caption"] else []
    cap_h = (len(lines) * CAPTION_LINE + 8) if lines else 0
    narrow_height = TITLE_H + fig_h + cap_h + PAD
    title = html.escape(f'{index}. {figure["title"]}', quote=False)
    split = figure.get("split")
    parts = [f'<g class="rc-panel" data-panel="{figure["key"]}">']
    if split is None:
        parts.extend([
            f'<rect x="{n(x)}" y="{n(y)}" width="{PANEL_W}" height="{n(narrow_height)}" rx="6" fill="none" stroke="#b6baaf"/>',
            f'<text class="rls-panel-title" x="{n(x + 14)}" y="{n(y + 28)}">{title}</text>',
            f'<svg x="{n(x + PAD)}" y="{n(y + TITLE_H)}" width="{n(inner_w)}" height="{n(fig_h)}" viewBox="{n(bx)} {n(by)} {n(bw)} {n(bh)}" {keep}>{inner}</svg>',
            caption_markup(lines, x + PAD, y + TITLE_H + fig_h + CAPTION_LINE),
            "</g>",
        ])
        return "".join(parts), narrow_height, narrow_height

    # The wide view spans both board columns. It shows two vertical slices of the same SVG,
    # side by side; the narrow view below is the untouched, complete figure. No paths change.
    wide_w = 2 * PANEL_W + GAP
    cell_w = (wide_w - 2 * PAD - GAP) / 2
    cut = by + bh * split
    heights = [cut - by, by + bh - cut]
    cell_heights = [cell_w * h / bw for h in heights]
    wide_fig_h = max(cell_heights)
    wide_height = TITLE_H + wide_fig_h + cap_h + PAD
    parts.extend([
        f'<rect class="rc-wide-split" x="{n(x)}" y="{n(y)}" width="{n(wide_w)}" height="{n(wide_height)}" rx="6" fill="none" stroke="#b6baaf"/>',
        f'<rect class="rc-narrow-full" x="{n(x)}" y="{n(y)}" width="{PANEL_W}" height="{n(narrow_height)}" rx="6" fill="none" stroke="#b6baaf"/>',
        f'<text class="rls-panel-title" x="{n(x + 14)}" y="{n(y + 28)}">{title}</text>',
        '<g class="rc-wide-split">',
    ])
    for i, (crop_y, crop_h, cell_h) in enumerate(zip((by, cut), heights, cell_heights)):
        fragment = prefix_ids(inner, f'{figure["key"]}-wide-{i}-')
        cell_x = x + PAD + i * (cell_w + GAP)
        parts.append(f'<svg x="{n(cell_x)}" y="{n(y + TITLE_H)}" width="{n(cell_w)}" height="{n(cell_h)}" viewBox="{n(bx)} {n(crop_y)} {n(bw)} {n(crop_h)}" overflow="hidden" {keep}>{fragment}</svg>')
    parts.extend([
        caption_markup(lines, x + PAD, y + TITLE_H + wide_fig_h + CAPTION_LINE),
        '</g>',
        '<g class="rc-narrow-full">',
        f'<svg x="{n(x + PAD)}" y="{n(y + TITLE_H)}" width="{n(inner_w)}" height="{n(fig_h)}" viewBox="{n(bx)} {n(by)} {n(bw)} {n(bh)}" {keep}>{prefix_ids(inner, figure["key"] + "-narrow-")}</svg>',
        caption_markup(lines, x + PAD, y + TITLE_H + fig_h + CAPTION_LINE),
        '</g></g>',
    ])
    return "".join(parts), wide_height, narrow_height


def board(figures, title, desc, prefix):
    """The board markup: the stage line and the panels, in rows of COLS."""
    panels, views = [], {}
    y, row, col = PAD, [], 0
    for i, figure in enumerate(figures):
        split = figure.get("split")
        if split is not None and row:
            y += max(row) + GAP
            row, col = [], 0
        x = PAD + col * (PANEL_W + GAP)
        markup, height, narrow_height = panel_markup(i + 1, figure, x, y)
        panels.append(markup)
        # The close-up skips the title row, which shows only on the whole board.
        width = 2 * PANEL_W + GAP if split is not None else PANEL_W
        views[figure["key"]] = [x, round(y + TITLE_H - 6, 1), width, round(height - TITLE_H + 6, 1)]
        if split is not None:
            views[figure["key"] + "_n"] = [x, round(y + TITLE_H - 6, 1), PANEL_W, round(narrow_height - TITLE_H + 6, 1)]
            y += height + GAP
            row, col = [], 0
            continue
        row.append(height)
        if col == COLS - 1 or i == len(figures) - 1:
            y += max(row) + GAP
            row, col = [], 0
        else:
            col += 1
    whole = f"0 0 {BOARD_W} {n(y - GAP + PAD)}"
    head = (f'<div class="rc-stage"><div class="rc-bar">'
            f'<div class="rc-where" aria-live="polite"></div></div><div class="rc-view">'
            f'<svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="{whole}" data-whole="{whole}" '
            f"data-views='{json.dumps(views, separators=(',', ':'))}' data-fig-max=\"{FIG_MAX}\" role=\"img\" aria-labelledby=\"{prefix}-title {prefix}-desc\">"
            f'<title id="{prefix}-title">{html.escape(title, quote=False)}</title><desc id="{prefix}-desc">{html.escape(desc, quote=False)}</desc>')
    return [head, *panels, "</svg></div></div>"]


SLOT = re.compile(r'<div class="rc-slot" data-for="fig-([^"]+)" data-src="([^"]+)" data-caption="([^"]*)">')
MARK = re.compile(r'<div class="rc-mark" id="fig-([^"]+)" data-panel="[^"]+" data-title="([^"]*)"></div>')


def build(text, title, desc, prefix="fig", splits=None):
    """Make the board again; splits maps panel keys to wide-view vertical cut fractions."""
    titles = {key: html.unescape(t) for key, t in MARK.findall(text)}
    figures = []
    for key, src, caption in SLOT.findall(text):
        if key not in titles:
            raise ValueError(f"slot fig-{key} has no mark")
        figure = {"key": key, "src": src, "caption": html.unescape(caption), "title": titles[key]}
        if splits and key in splits:
            figure["split"] = splits[key]
        figures.append(figure)
    lines = text.split("\n")
    head = lines.index('<link rel="stylesheet" href="/assets/robotics/rl/series.css">')
    start, body = lines.index(START), lines.index(BODY)
    return "\n".join(lines[:head] + HEAD.split("\n") + lines[start:start + 1]
                     + board(figures, title, desc, prefix) + lines[body:])


IMAGE = re.compile(r'^!\[(?P<alt>.*)\]\((?P<src>\S+?)(?: "(?P<caption>.*)")?\)\s*$')


def _plain(line):
    """True for a line that starts a paragraph of plain text."""
    s = line.lstrip()
    return bool(s) and not re.match(r"(<|#|!\[|\||\$\$|[-*+] |>|\d+\. |```)", s)


def convert(text, titles):
    """Turn the markdown figures of an article into canvas steps, once.

    titles maps the file name of each figure (for example "tick-rounding.png") to the short
    title of its step. Figures that are not in titles stay in the text as they are.
    The mark goes before the paragraph just above the figure, so the board shows the figure
    while that paragraph is read.
    """
    if START in text:
        raise ValueError("the article already has a canvas")
    end = text.index("\n---", 3) + 4
    front, body = text[:end], text[end:].strip("\n")
    # The essay layout gives the canvas the full width (no table of contents column).
    if not re.search(r"^layout:", front, flags=re.M):
        front = front[:-4] + "\nlayout: essay\n---"
    out = []
    for line in body.split("\n"):
        m = IMAGE.match(line)
        name = m and m.group("src").rsplit("/", 1)[-1]
        if not m or name not in titles:
            out.append(line)
            continue
        key = re.sub(r"\.[a-z]+$", "", name)
        src = re.sub(r"\.(png|jpg|jpeg|webp)$", ".svg", m.group("src"))
        mark = f'<div class="rc-mark" id="fig-{key}" data-panel="{key}" data-title="{html.escape(titles[name])}"></div>'
        slot = (f'<div class="rc-slot" data-for="fig-{key}" data-src="{src}" data-caption="{html.escape(m.group("caption") or "")}">'
                f'<span class="rc-sr">{html.escape(m.group("alt"), quote=False)}</span></div>')
        # Where the mark goes: walk up over display math and video figures to the paragraph
        # that introduces the figure. The walk stops at a heading, a drawer or another figure.
        # In a <details> drawer the mark stays in the drawer: canvas.js skips the marks of a
        # closed drawer, so the board shows that figure only to a reader who opens it.
        at = len(out)
        k = len(out) - 1
        while True:
            while k >= 0 and not out[k].strip():
                k -= 1
            s = k
            while s > 0 and out[s - 1].strip():
                s -= 1
            if k < 0 or "rc-slot" in out[k]:
                break
            if out[s].lstrip().startswith(("$$", "<figure")):
                k = s - 1
                continue
            # Not right after another figure: the two marks would then sit together and hide the first step.
            above = s - 1
            while above >= 0 and not out[above].strip():
                above -= 1
            if _plain(out[s]) and (above < 0 or "rc-slot" not in out[above]):
                at = s
            break
        out[at:at] = [mark, ""]
        out.append(slot)
    body = "\n".join(out)
    return f"{front}\n\n{HEAD}\n{START}\n{BODY}\n\n{body}\n\n</div>\n</div>\n{TAIL}\n"


def main(argv):
    if len(argv) != 3 or argv[1] != "build":
        print(__doc__)
        return 2
    path = Path(argv[2])
    text = path.read_text()
    title = re.search(r"^title: ['\"]?(.*?)['\"]?$", text, flags=re.M).group(1)
    path.write_text(build(text, f"Figures of {title}", "One blackboard panel for each figure of the article, in reading order."))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
