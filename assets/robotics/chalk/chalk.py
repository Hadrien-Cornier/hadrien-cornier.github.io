"""Shared blackboard chalk style for the site's matplotlib figures.

Usage from a figure script anywhere in the repo:

    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "assets/robotics/chalk"))
    import chalk

    chalk.use()
    fig, ax = plt.subplots()
    ax.plot(x, y, color=chalk.BLUE)
    chalk.save(fig, "assets/robotics/<article>/<figure>.png", panel=True)
    chalk.thumbnail("assets/robotics/<article>/<figure>.png",
                    "assets/robotics/thumbnails/<article>.jpg")

Colors match the RL series boards (assets/robotics/rl/series.css, --bb-*).
Lines are straight and text sits on a straight baseline, as on the RL boards.
The grain in save() is the raster form of the grain in the #bb-chalk filter:
it thins the chalk in fine specks and moves no pixel.
save(..., panel=True) also writes the figure as a vector panel (.svg) for the
long-form canvas (canvas.py). The page then draws its text in the hand font.
"""

import re
from pathlib import Path

import matplotlib
import matplotlib.image
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager
from PIL import Image

HERE = Path(__file__).resolve().parent
STYLE = HERE / "chalk.mplstyle"
FONT = HERE / "fonts" / "PatrickHand-Regular.ttf"

# Board surfaces.
BOARD = "#1d2824"
BOARD_2 = "#24312c"   # a raised panel or a shaded band on the board
# Chalk. CHALK is the main ink, DIM the secondary ink, FAINT the guides and grid.
CHALK = "#f4f1e8"
DIM = "#c3c9bd"
FAINT = "#6f7d75"
# Colored chalk. RL series meaning: red marks risk or the value that changes,
# blue a learned value or a choice, green a safe or good result, yellow the one
# thing to look at (and titles). PINK, LAVENDER and SLATE extend the set for
# figures that need more than four series.
RED = "#ff9f88"
PINK = "#ff93b8"
BLUE = "#93d4ff"
GREEN = "#a8e2a0"
YELLOW = "#ffe17c"
LAVENDER = "#c9b6ff"
SLATE = "#9fb4c4"

CYCLE = [BLUE, RED, GREEN, YELLOW, PINK, LAVENDER, DIM]

# Suggested replacements for the light palettes in the older figure scripts.
# Keep the meaning of each color: the same series keeps the same chalk color in
# every figure of an article.
FROM_LIGHT = {
    # Tailwind-like palette (so101_figures.py and similar scripts)
    "#1f2933": CHALK, "#111827": CHALK, "#000000": CHALK, "black": CHALK, "k": CHALK,
    "#6b7280": DIM, "#9ca3af": DIM, "#94a3b8": SLATE,
    "#1d4ed8": BLUE, "#2563eb": BLUE,
    "#c2410c": RED, "#ea580c": RED,
    "#dc2626": PINK, "#b91c1c": PINK,
    "#0f766e": GREEN, "#15803d": GREEN, "#16a34a": GREEN,
    "#7c3aed": LAVENDER, "#6d28d9": LAVENDER,
    "#eab308": YELLOW, "#ca8a04": YELLOW,
    "#e5e7eb": FAINT, "#f3f4f6": BOARD_2, "white": BOARD, "#ffffff": BOARD,
    # Site palette (assets/site.css light theme, inline SVG figures)
    "#242622": CHALK, "#50554e": DIM, "#656b62": DIM, "#b44c2c": RED,
    "#2b6a8e": BLUE, "#8f1d36": PINK, "#49724e": GREEN, "#5f7f4f": GREEN,
    "#dcded6": FAINT, "#f7f6f2": BOARD, "#f1f2ed": BOARD,
}

# A matplotlib color that marks the board itself, for halos behind labels.
HALO = BOARD


def use():
    """Register the hand font and apply the chalk style to matplotlib."""
    if FONT.exists() and "Patrick Hand" not in {f.name for f in font_manager.fontManager.ttflist}:
        font_manager.fontManager.addfont(str(FONT))
    plt.style.use(str(STYLE))


def label_box(color=BOARD, pad=0.25):
    """bbox dict for text that sits on lines or bands: a board patch behind it."""
    return {"boxstyle": f"square,pad={pad}", "facecolor": color, "edgecolor": "none"}


def chalk_grain(rgb, scale=1.0, seed=7):
    """Thin the chalk in fine specks, as the grain of the #bb-chalk filter on the RL boards does.

    rgb: uint8 array [H, W, 3] drawn on BOARD. scale: output pixels per CSS pixel at the size
    the figure shows on a desktop column (about 2 for a 220 dpi, 6.4 in figure).
    No pixel moves, so lines stay straight and text stays on its baseline.
    """
    rng = np.random.default_rng(seed)
    height, width, _ = rgb.shape
    board = np.array(matplotlib.colors.to_rgb(BOARD), dtype=np.float32) * 255
    image = rgb.astype(np.float32)
    # Only chalk pixels change; the bare board stays as it is.
    ink = np.abs(image - board).max(axis=2) > 2
    # Each speck removes up to 22 % of the chalk.
    speck = max(1, int(round(scale)))
    grain = rng.normal(0.5, 0.2, (height // speck + 1, width // speck + 1)).astype(np.float32)
    keep = np.clip(1.12 - 0.45 * grain, 0.78, 1.0)
    keep = np.repeat(np.repeat(keep, speck, axis=0), speck, axis=1)[:height, :width, None]
    out = np.where(ink[..., None], board + (image - board) * keep, image)
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def _photo_mask(fig, path, dpi, bbox):
    """Pixels of the raster images (imshow, figimage) in the saved figure, as a bool array.

    Draws only the images, on a transparent canvas with the same crop as the real save.
    """
    images = [a for a in fig.findobj(matplotlib.image._ImageBase) if a.get_visible()]
    if not images:
        return None
    # Hide every artist that neither is an image nor holds one (axes, annotation boxes).
    hidden = [a for a in fig.findobj()
              if a.get_visible() and a is not fig
              and not any(isinstance(c, matplotlib.image._ImageBase) for c in a.findobj())]
    for artist in hidden:
        artist.set_visible(False)
    probe = path.with_suffix(".photos.png")
    try:
        fig.savefig(probe, dpi=dpi, transparent=True, bbox_inches=bbox)
        alpha = np.asarray(Image.open(probe).convert("RGBA"))[..., 3]
    finally:
        probe.unlink(missing_ok=True)
        for artist in hidden:
            artist.set_visible(True)
    return alpha > 0


def save(fig, path, grain=True, display_width_px=720, tight=True, photos=True, panel=False):
    """Save a figure as a chalk PNG on the board.

    display_width_px: the CSS width the figure shows at in the desktop column,
    used to size the grain. Keep the default for figures that fill the column.
    tight: crop to the drawn content plus a small margin, so no label is cut off.
    photos: keep raster images (imshow, figimage) exactly as they are: no grain,
    and the PNG keeps full color instead of a 256-color palette.
    panel: also write the figure as a vector panel for a long-form canvas, at the
    same path with the suffix .svg (see save_panel). The PNG and the panel have the same crop.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    dpi = matplotlib.rcParams["savefig.dpi"]
    has_photos = photos and any(a.get_visible() for a in fig.findobj(matplotlib.image._ImageBase))
    bbox = "tight" if tight else None
    if (has_photos or panel) and tight:
        # One fixed crop for the figure, its photo mask and its panel, so they line up.
        fig.canvas.draw()
        bbox = fig.get_tightbbox(fig.canvas.get_renderer()).padded(0.16)
    fig.savefig(path, dpi=dpi, facecolor=BOARD, edgecolor=BOARD, bbox_inches=bbox, pad_inches=0.16)
    mask = _photo_mask(fig, path, dpi, bbox) if has_photos else None
    if panel:
        save_panel(fig, path.with_suffix(".svg"), bbox=bbox)
    plt.close(fig)
    image = Image.open(path).convert("RGBA")
    flat = Image.new("RGBA", image.size, BOARD)
    flat.alpha_composite(image)
    image = flat.convert("RGB")
    if grain:
        scale = image.width / float(display_width_px)
        chalked = chalk_grain(np.asarray(image), scale=scale)
        if mask is not None and mask.shape == chalked.shape[:2]:
            chalked[mask] = np.asarray(image)[mask]
        image = Image.fromarray(chalked)
    if mask is None or not mask.any():
        # A 256-color palette keeps the chalk look and makes the file about three times smaller.
        image = image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    image.save(path, optimize=True)
    return path


def save_panel(fig, path, bbox="tight"):
    """Write a figure as a vector panel for a long-form canvas board (see canvas.py).

    The text stays text, so the page draws it in its hand font, on a straight baseline,
    with the same Patrick Hand metrics that matplotlib used to place it. The board is not
    painted: the panel sits on the board of the canvas, under its grain filter. A photo
    (imshow, figimage) goes to a PNG file next to the panel, not into it as base64.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Surfaces in the board color become clear; a raised panel (BOARD_2) keeps its color.
    clear = [ax for ax in fig.axes if matplotlib.colors.same_color(ax.get_facecolor(), BOARD)]
    for ax in clear:
        ax.set_facecolor("none")
    try:
        with matplotlib.rc_context({"svg.fonttype": "none", "svg.image_inline": False, "svg.hashsalt": path.stem}):
            fig.savefig(path, format="svg", facecolor="none", edgecolor="none",
                        bbox_inches=bbox, pad_inches=0.16, metadata={"Date": None})
    finally:
        for ax in clear:
            ax.set_facecolor(BOARD)
    path.write_text(clean_svg(path.read_text(), prefix=path.stem, base=_site_path(path.parent)))
    return path


def _site_path(folder):
    """The URL path of a repo folder: everything from 'assets' on."""
    parts = Path(folder).resolve().parts
    return "/" + "/".join(parts[parts.index("assets"):]) if "assets" in parts else ""


_HAND = re.compile(r"'?(Patrick Hand|DejaVu Sans|Chalk Hand|RL Chalk)'?$")
_MONO = "ui-monospace, Menlo, Consolas, monospace"
_GEOMETRY = {"d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height",
             "transform", "viewBox", "points", "style", "dx", "dy"}


def _font_family(value):
    """CSS font-family for a matplotlib family list, or None to inherit the page hand font."""
    names = [n.strip() for n in value.split(",")]
    if all(_HAND.match(n) for n in names):
        return None
    if any("Mono" in n or "Courier" in n for n in names):
        return _MONO
    if any(n.strip("'").startswith("STIX") for n in names):
        # Math symbols that the hand font lacks: a math font, then the system serif.
        return "'STIX Two Math', 'STIXGeneral', 'Cambria Math', 'Times New Roman', serif"
    return None


def _style(value):
    out = []
    for decl in value.split(";"):
        if not decl.strip():
            continue
        key, _, val = decl.partition(":")
        key, val = key.strip(), val.strip()
        if key == "font-family":
            val = _font_family(val)
            if val is None:
                continue
        out.append(f"{key}: {val}")
    return "; ".join(out)


def _round(value):
    def short(m):
        text = f"{float(m.group(0)):.2f}".rstrip("0").rstrip(".")
        return "0" if text == "-0" else text
    return re.sub(r"-?\d+\.\d+(?:e-?\d+)?", short, value)


def _unwrap_groups(text):
    """Drop the <g> wrappers that carry no attribute; they only nest the drawing."""
    out, keep, pos = [], [], 0
    for m in re.finditer(r"<g(\s[^>]*)?>|</g>", text):
        out.append(text[pos:m.start()])
        pos = m.end()
        if m.group(0) == "</g>":
            if keep.pop():
                out.append("</g>")
        else:
            keep.append(bool((m.group(1) or "").strip()))
            if keep[-1]:
                out.append(m.group(0))
    out.append(text[pos:])
    return "".join(out)


def clean_svg(text, prefix, base=""):
    """Make a matplotlib SVG safe to inline in a page beside other panels.

    It removes the page-wide <style> rule, the metadata and the comments, gives every id
    the prefix (and drops the ids that nothing references), rounds coordinates to 0.01,
    lets the text inherit the page hand font, and points image files at base.
    """
    text = re.sub(r"<\?xml[^>]*\?>|<!DOCTYPE[^>]*>|<metadata>.*?</metadata>|<!--.*?-->", "", text, flags=re.S)
    # Matplotlib writes *{stroke-linejoin: round; stroke-linecap: butt}; inline in a page it would style every SVG.
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.S)
    text = text.replace("xlink:href=", "href=").replace(' xmlns:xlink="http://www.w3.org/1999/xlink"', "")
    used = set(re.findall(r"url\(#([^)]+)\)", text)) | set(re.findall(r'href="#([^"]+)"', text))

    def ident(m):
        name = m.group(1)
        return f' id="{prefix}-{name}"' if name in used else ""
    text = re.sub(r' id="([^"]+)"', ident, text)
    text = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}-{m.group(1)})", text)
    text = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{prefix}-{m.group(1)}"', text)
    if base:
        text = re.sub(r'href="(?!#|data:|/|https?:)([^"]+)"', lambda m: f'href="{base}/{m.group(1)}"', text)

    def attr(m):
        name, value = m.group(1), m.group(2)
        if name == "style":
            value = _style(value)
        if name in _GEOMETRY:
            value = re.sub(r"\s+", " ", _round(value)).strip()
        return f' {name}="{value}"'
    text = re.sub(r' ([\w:-]+)="([^"]*)"', attr, text)
    text = re.sub(r' style=""', "", text)
    text = re.sub(r"<defs>\s*</defs>", "", text)
    text = re.sub(r">\s+<", "><", text).strip()
    text = _unwrap_groups(text)
    # The panel root: keep the view box, and draw strokes the way matplotlib drew them.
    text = re.sub(r'<svg [^>]*?(viewBox="[^"]*")[^>]*>',
                  r'<svg xmlns="http://www.w3.org/2000/svg" \1 stroke-linejoin="round" stroke-linecap="butt">', text, count=1)
    # The clear figure and axes patches draw nothing.
    text = re.sub(r'<path d="[^"]*" style="fill: none"/>', "", text)
    return text + "\n"


def thumbnail(source, target, size=(720, 424), pad=18, crop=False):
    """Make a site card thumbnail from a chalk figure: contain and pad on the board.

    crop=True fills the card instead (for photos and video frames).
    """
    image = Image.open(source).convert("RGB")
    width, height = size
    if crop:
        ratio = max(width / image.width, height / image.height)
        resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.LANCZOS)
        left = (resized.width - width) // 2
        top = (resized.height - height) // 2
        card = resized.crop((left, top, left + width, top + height))
    else:
        ratio = min((width - 2 * pad) / image.width, (height - 2 * pad) / image.height)
        resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.LANCZOS)
        card = Image.new("RGB", size, BOARD)
        card.paste(resized, ((width - resized.width) // 2, (height - resized.height) // 2))
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    card.save(target, quality=90, optimize=True, progressive=True)
    return target
