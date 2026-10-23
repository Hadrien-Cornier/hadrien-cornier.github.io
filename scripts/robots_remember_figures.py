"""Figures for content/robotics/why-cant-robots-remember.md in the shared chalk style.

- The MemER Object Search bar chart as a PNG (the article thumbnail source) and its card thumbnail.
- The four inline SVG figures fig-day, fig-memer, fig-mem and fig-mme. The script replaces each
  <svg> element in the article, found by its aria-labelledby ids, and leaves the rest of the file as it is.

Data:
- MemER: Sridhar et al., arXiv 2510.20328, Table 1 (Object Search, real robot, 20 trials per task,
  3 objects per trial, so 60 objects in all). The same numbers as the old figure and PNG.
- RoboMME: Dai et al., arXiv 2603.04639, Table 3 (v3), success rate in percent, as printed in the old fig-mme.
- fig-day and fig-mem are schematics; their labels are copied from the old inline SVGs.

Run from the repository root:
    python3 scripts/robots_remember_figures.py          # PNG, thumbnail and inline SVGs
    python3 scripts/robots_remember_figures.py png      # PNG and thumbnail only
    python3 scripts/robots_remember_figures.py svg      # inline SVGs only
"""

import html
import re
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.transforms import blended_transform_factory  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

ARTICLE = ROOT / "content/robotics/why-cant-robots-remember.md"
PNG = ROOT / "assets/robotics/why-cant-robots-remember/memer-object-search.png"
THUMB = ROOT / "assets/robotics/thumbnails/why-cant-robots-remember.jpg"

# MemER Table 1, Object Search: objects retrieved out of 60. "kind" keeps the old color meaning:
# base = gray baseline, memer = the highlighted result, human = the lighter upper-bound bar.
MEMER_TITLE = "Object Search, real robot: objects retrieved (of 60)"
MEMER_TOTAL = 60
MEMER = [
    ("No history", 32, "base"),
    ("8 recent frames", 38, "base"),
    ("32 recent frames", 47, "base"),
    ("MemER (8 key frames)", 59, "memer"),
    ("Human gives subtasks", 58, "human"),
]
MEMER_NOTE = "Source: MemER paper, Table 1. 20 trials per task. Human row: upper bound."

# RoboMME Table 3 (v3), success rate (%): (task, text subgoals, visual tokens).
MME_TITLE = "RoboMME success rate by task (%)"
MME_SERIES = ["Text subgoals (SimpleSG + Qwen)", "Visual tokens (FrameSamp + Modul)"]
MME = [
    ("BinFill", 77.56, 39.56),
    ("PickXTimes", 95.33, 87.33),
    ("SwingXTimes", 5.11, 92.00),
    ("StopCube", 0.44, 42.00),
    ("PatternLock", 12.67, 53.56),
]

# fig-day: pieces of knowledge in hand at the start of Monday, Tuesday and Wednesday.
DAYS = ["Monday", "Tuesday", "Wednesday"]
WORKERS = [
    ("Coworker", ["keeps what", "they learn"], [2, 3, 5], "c-blue"),
    ("Coding agent", ["rereads the", "same notes"], [4, 4, 4], "c-dim"),
    ("Robot policy", ["sees its", "last frames"], [2, 2, 2], "c-red"),
]
DAY_NOTE = "Each square is one piece of knowledge in hand when the day starts."

# fig-mem: the frame strip, the six memory routes (title, papers and weakness) and the policy box.
FRAMES = ["start", "past door 1", "past door 2", "blue box (now)"]
ROUTES = [
    ("Keep more frames", "RT-1, Robostral Navigate. Weak: cost, copycat"),
    ("Write a text note", "RoboMME symbolic, MemER. Weak: drops detail"),
    ("Compress to vectors", "MemoryVLA. Weak: unreadable, hard to train"),
    ("Keep key frames", "MemER, SAM2Act+. Weak: choosing the frames"),
    ("Draw a map", "ViNT, VLMaps. Weak: drift, static scene"),
    ("Keep skills after the episode", "ASPIRE. Weak: stale or redundant notes"),
]
KEPT_AFTER_EPISODE = {5}  # the red route
MEM_NOTE = "Red: kept after the episode ends. Blue arrow: the direct window."

# Titles and descriptions of the inline figures, unchanged from the old SVGs.
META = {
    "fig-day": ("What each worker knows at the start of each day",
                "Three rows, three days each. A coworker starts Monday with 2 pieces of knowledge, Tuesday with 3 "
                "and Wednesday with 5, because they keep what they learn. A coding agent starts every day with the "
                "same 4 notes it reads from a file and keeps nothing new. A robot policy starts every step with only "
                "its last 2 frames and has no notes file at all."),
    "fig-memer": ("MemER object search: objects retrieved out of 60",
                  "Horizontal bars. No history: 32. Eight recent frames: 38. Thirty-two recent frames: 47. MemER "
                  "with up to eight stored keyframes: 59. A human giving the subtasks: 58."),
    "fig-mem": ("Where the past goes when the policy only reads a short window",
                "A strip of four frames from oldest to newest: start, past door 1, past door 2, blue box now. The "
                "two oldest frames sit outside the policy's window, so the policy cannot read where the robot "
                "started. The two newest frames go straight to the policy. A write line carries what happened into "
                "six memory routes: keep more frames, write a text note, compress to vectors, keep key frames, draw "
                "a map, and keep skills after the episode. A read line carries what each route kept back to the "
                "policy, which then chooses the next action."),
    "fig-mme": ("RoboMME: text memory against visual-token memory on five tasks",
                "Success rates in percent. BinFill: text 77.56, visual tokens 39.56. PickXTimes: text 95.33, visual "
                "tokens 87.33. SwingXTimes: text 5.11, visual tokens 92.00. StopCube: text 0.44, visual tokens "
                "42.00. PatternLock: text 12.67, visual tokens 53.56."),
}

# Inline SVG text sizes in a 480-unit-wide drawing (16 reads at about 11.7 px in the 350 px phone column).
TITLE, NAME, LABEL, NOTE = 18, 17, 16, 16
BAR_CLASS = {"base": "c-dim", "memer": "c-red", "human": "c-faint"}


# ---------- PNG: MemER bar chart ----------

def memer_png():
    """Redraw the MemER Object Search chart with matplotlib and make the card thumbnail."""
    chalk.use()
    fig, ax = plt.subplots(figsize=(6.4, 3.7))
    fig.subplots_adjust(left=0.36, right=0.97, top=0.84, bottom=0.17)
    colors = {"base": chalk.DIM, "memer": chalk.RED, "human": chalk.FAINT}
    rows = list(range(len(MEMER)))
    ax.barh(rows, [value for _, value, _ in MEMER], height=0.62,
            color=[colors[kind] for _, _, kind in MEMER], linewidth=0)
    labels = blended_transform_factory(fig.transFigure, ax.transData)
    for row, (label, value, _) in zip(rows, MEMER):
        ax.text(0.035, row, label, transform=labels, ha="left", va="center", color=chalk.CHALK)
        ax.text(value + 0.9, row, str(value), ha="left", va="center", color=chalk.CHALK)
    ax.set_xlim(0, MEMER_TOTAL + 5)
    ax.set_ylim(len(MEMER) - 0.45, -0.55)
    ax.axis("off")
    fig.text(0.035, 0.93, MEMER_TITLE, ha="left", va="center", color=chalk.YELLOW,
             fontsize=matplotlib.rcParams["axes.titlesize"])
    fig.text(0.035, 0.07, MEMER_NOTE, ha="left", va="center", color=chalk.DIM)
    chalk.save(fig, PNG)
    chalk.thumbnail(PNG, THUMB)
    print(f"wrote {PNG.relative_to(ROOT)} and {THUMB.relative_to(ROOT)}")


# ---------- inline SVG helpers ----------

def num(value):
    """Short number for SVG coordinates."""
    value = round(value, 1)
    return str(int(value)) if value == int(value) else str(value)


def text(x, y, value, size, cls="c-chalk", anchor=None):
    middle = f' text-anchor="{anchor}"' if anchor else ""
    return f'<text x="{num(x)}" y="{num(y)}" font-size="{size}" class="{cls}"{middle}>{html.escape(value)}</text>'


def rect(x, y, w, h, cls, extra=""):
    return f'<rect x="{num(x)}" y="{num(y)}" width="{num(w)}" height="{num(h)}" class="{cls}"{extra}/>'


def path(d, cls, width=1.8, extra=""):
    return f'<path d="{d}" class="c-none {cls}" stroke-width="{width}"{extra}/>'


def svg(fig_id, height, body):
    title, desc = META[fig_id]
    return (f'<svg class="chalk chalk-filter" viewBox="0 0 480 {num(height)}" role="img" '
            f'aria-labelledby="{fig_id}-t {fig_id}-d" '
            'style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" '
            'xmlns="http://www.w3.org/2000/svg">'
            f'<title id="{fig_id}-t">{html.escape(title, quote=False)}</title>'
            f'<desc id="{fig_id}-d">{html.escape(desc, quote=False)}</desc>'
            f'{body}</svg>')


def baseline(top, height, size):
    """Text baseline that centers a line of hand lettering on a bar or a box."""
    return top + height / 2 + 0.34 * size


# ---------- inline SVG figures ----------

def fig_day():
    box_w, box_h, gap, row_pitch, top = 104, 66, 6, 80, 44
    x0 = 480 - 14 - 3 * box_w - 2 * gap
    square, step, inset = 14, 18, 10
    parts = [text(x0 + i * (box_w + gap) + box_w / 2, 30, day, LABEL, anchor="middle") for i, day in enumerate(DAYS)]
    for r, (name, sub, counts, cls) in enumerate(WORKERS):
        y = top + r * row_pitch
        parts.append(text(14, y + 24, name, NAME))
        parts += [text(14, y + 44 + 18 * k, line, LABEL, "c-dim") for k, line in enumerate(sub)]
        for i, count in enumerate(counts):
            x = x0 + i * (box_w + gap)
            parts.append(rect(x, y, box_w, box_h, "c-none s-chalk", ' stroke-width="1.6"'))
            parts += [rect(x + inset + k * step, y + inset, square, square, cls) for k in range(count)]
    note_y = top + 2 * row_pitch + box_h + 30
    parts.append(text(240, note_y, DAY_NOTE, NOTE, "c-dim", anchor="middle"))
    return svg("fig-day", note_y + 14, "".join(parts))


def fig_memer():
    left, bar_x, bar_max = 16, 164, 276
    scale = bar_max / MEMER_TOTAL
    top, bar_h, pitch = 54, 24, 38
    parts = [text(left, 32, MEMER_TITLE, TITLE, "chalk-title")]
    for i, (label, value, kind) in enumerate(MEMER):
        y = top + i * pitch
        mid = baseline(y, bar_h, LABEL)
        parts.append(text(left, mid, label, LABEL))
        parts.append(rect(bar_x, y, value * scale, bar_h, BAR_CLASS[kind]))
        parts.append(text(bar_x + value * scale + 8, mid, str(value), LABEL))
    note_y = top + len(MEMER) * pitch + 16
    parts.append(text(left, note_y, MEMER_NOTE, NOTE, "c-dim"))
    return svg("fig-memer", note_y + 14, "".join(parts))


def fig_mme():
    left, bar_x, bar_max = 16, 108, 330
    scale = bar_max / 100
    bar_h, pair_gap, pitch, top = 18, 3, 64, 104
    colors = ["c-blue", "c-red"]
    parts = [text(left, 32, MME_TITLE, TITLE, "chalk-title")]
    for k, (series, cls) in enumerate(zip(MME_SERIES, colors)):
        y = 48 + 24 * k
        parts.append(rect(left, y, 14, 14, cls))
        parts.append(text(left + 22, baseline(y, 14, LABEL), series, LABEL))
    for i, (task, *values) in enumerate(MME):
        y = top + i * pitch
        parts.append(text(left, baseline(y, 2 * bar_h + pair_gap, LABEL), task, LABEL))
        for k, (value, cls) in enumerate(zip(values, colors)):
            bar_y = y + k * (bar_h + pair_gap)
            parts.append(rect(bar_x, bar_y, value * scale, bar_h, cls))
            parts.append(text(bar_x + value * scale + 7, baseline(bar_y, bar_h, NOTE), f"{value:.2f}", NOTE))
    height = top + (len(MME) - 1) * pitch + 2 * bar_h + pair_gap + 16
    return svg("fig-mme", height, "".join(parts))


def fig_mem():
    # Frame strip: the two oldest frames sit outside the window (red, dashed), the two newest inside it (blue).
    strip_y, strip_h, frame_y, frame_w, frame_h = 28, 62, 36, 96, 46
    frame_x = [16, 124, 244, 352]
    # Route boxes, write line on the left, read line on the right, policy box at the bottom.
    box_x, box_w, box_h, box_top, box_pitch = 60, 340, 54, 128, 62
    write_x, read_x, window_x, write_y = 24, 440, 472, 98
    mids = [box_top + i * box_pitch + box_h / 2 for i in range(len(ROUTES))]
    policy_y = box_top + len(ROUTES) * box_pitch + 22
    policy_x, policy_w, policy_h = 120, 244, 68
    window_in, read_in = policy_y + 24, policy_y + 50

    defs = ('<defs>'
            '<marker id="fig-mem-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="c-chalk"/></marker>'
            '<marker id="fig-mem-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="c-blue"/></marker></defs>')
    parts = [defs,
             text(12, 20, "outside the window", LABEL, "c-red"),
             text(244, 20, "what a short-window policy reads", LABEL, "c-blue"),
             rect(8, strip_y, 224, strip_h, "c-none s-red", ' stroke-width="1.6" stroke-dasharray="6 5"'),
             rect(236, strip_y, 224, strip_h, "c-none s-blue", ' stroke-width="2"')]
    for x, label in zip(frame_x, FRAMES):
        parts.append(rect(x, frame_y, frame_w, frame_h, "c-none s-chalk", ' stroke-width="1.6"'))
        parts.append(text(x + frame_w / 2, baseline(frame_y, frame_h, LABEL), label, LABEL, anchor="middle"))

    # The direct window: blue arrow from the strip into the policy box.
    parts.append(path(f"M460,{num(strip_y + strip_h / 2)} H{window_x} V{num(window_in)} H{policy_x + policy_w + 2}",
                      "s-blue", extra=' marker-end="url(#fig-mem-b)"'))
    # Write: what happened, from the whole strip down the left side into each route.
    parts.append(path(f"M{write_x},{write_y} H448 M{write_x},{write_y} V{num(mids[-1])}", "s-chalk"))
    parts.append(text(32, write_y + 18, "write: what happened", NOTE, "c-dim"))
    parts += [path(f"M{write_x},{num(m)} H{box_x - 2}", "s-chalk", extra=' marker-end="url(#fig-mem-a)"') for m in mids]
    # Read: from each route back to the policy.
    parts.append(path(" ".join(f"M{box_x + box_w},{num(m)} H{read_x}" for m in mids), "s-chalk"))
    parts.append(path(f"M{read_x},{num(mids[0])} V{num(read_in)} H{policy_x + policy_w + 2}", "s-chalk",
                      extra=' marker-end="url(#fig-mem-a)"'))
    parts.append(text(read_x + 6, box_top - 6, "read", NOTE, "c-dim", anchor="end"))

    for i, (title, detail) in enumerate(ROUTES):
        y = box_top + i * box_pitch
        if i in KEPT_AFTER_EPISODE:
            parts.append(rect(box_x, y, box_w, box_h, "s-red", ' fill="#f6e5e0" stroke-width="1.6"'))
        else:
            parts.append(rect(box_x, y, box_w, box_h, "c-none s-chalk", ' stroke-width="1.6"'))
        parts.append(text(box_x + 10, y + 22, title, NAME))
        parts.append(text(box_x + 10, y + 43, detail, LABEL, "c-dim"))

    parts.append(rect(policy_x, policy_y, policy_w, policy_h, "c-none s-chalk", ' stroke-width="2"'))
    parts.append(text(policy_x + policy_w / 2, policy_y + 28, "Policy: next action", NAME, anchor="middle"))
    parts.append(text(policy_x + policy_w / 2, policy_y + 52, "turn left, or head home?", LABEL, "c-dim",
                      anchor="middle"))
    note_y = policy_y + policy_h + 28
    parts.append(text(240, note_y, MEM_NOTE, NOTE, "c-dim", anchor="middle"))
    return svg("fig-mem", note_y + 14, "".join(parts))


def write_svgs():
    """Replace each inline figure in the article. Only the <svg> elements change."""
    figures = {"fig-day": fig_day(), "fig-memer": fig_memer(), "fig-mem": fig_mem(), "fig-mme": fig_mme()}
    source = ARTICLE.read_text()
    updated = source
    for fig_id, figure in figures.items():
        pattern = re.compile(rf'<svg [^>]*aria-labelledby="{fig_id}-t {fig_id}-d".*?</svg>', re.S)
        matches = pattern.findall(updated)
        if len(matches) != 1:
            raise SystemExit(f"{fig_id}: expected one <svg> in {ARTICLE.name}, found {len(matches)}")
        updated = pattern.sub(lambda _: figure, updated)
    if updated != source:
        ARTICLE.write_text(updated)
    print(f"{'updated' if updated != source else 'unchanged'}: {ARTICLE.relative_to(ROOT)}")


def main():
    task = sys.argv[1] if len(sys.argv) > 1 else "all"
    if task in ("all", "png"):
        memer_png()
    if task in ("all", "svg"):
        write_svgs()


if __name__ == "__main__":
    main()
