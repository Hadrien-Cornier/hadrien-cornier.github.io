"""Shared blackboard chalk style for the site's matplotlib figures.

Usage from a figure script anywhere in the repo:

    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "assets/robotics/chalk"))
    import chalk

    chalk.use()
    fig, ax = plt.subplots()
    ax.plot(x, y, color=chalk.BLUE)
    chalk.save(fig, "assets/robotics/<article>/<figure>.png")
    chalk.thumbnail("assets/robotics/<article>/<figure>.png",
                    "assets/robotics/thumbnails/<article>.jpg")

Colors match the RL series boards (assets/robotics/rl/series.css, --bb-*).
The grain in save() is the raster form of the #bb-chalk SVG filter in the RL
articles: a slow wobble plus a fine grain that thins the chalk. It moves
pixels by at most about one screen pixel, so data, labels and numbers stay put.
"""

from pathlib import Path

import matplotlib
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


def _smooth_noise(rng, height, width, cell):
    """Smooth noise in [-1, 1]: random values on a coarse grid, resized with bicubic steps."""
    coarse = rng.uniform(0, 255, (max(2, height // cell + 2), max(2, width // cell + 2))).astype(np.uint8)
    field = Image.fromarray(coarse, mode="L").resize((width, height), Image.BICUBIC)
    return np.asarray(field, dtype=np.float32) / 127.5 - 1.0


def chalk_grain(rgb, scale=1.0, seed=7):
    """Apply the chalk look to an RGB array drawn on BOARD.

    rgb: uint8 array [H, W, 3]. scale: output pixels per CSS pixel at the size
    the figure shows on a desktop column (about 2 for a 220 dpi, 6.4 in figure).
    """
    rng = np.random.default_rng(seed)
    height, width, _ = rgb.shape
    board = np.array(matplotlib.colors.to_rgb(BOARD), dtype=np.float32) * 255
    image = rgb.astype(np.float32)

    # 1. Slow wobble: shift each pixel by a smooth field of at most 0.9 CSS px.
    amplitude = 0.9 * scale
    cell = int(90 * scale)
    dx = _smooth_noise(rng, height, width, cell) * amplitude
    dy = _smooth_noise(rng, height, width, cell) * amplitude
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    sx = np.clip(xx + dx, 0, width - 1)
    sy = np.clip(yy + dy, 0, height - 1)
    x0 = np.floor(sx).astype(int)
    y0 = np.floor(sy).astype(int)
    x1 = np.minimum(x0 + 1, width - 1)
    y1 = np.minimum(y0 + 1, height - 1)
    fx = (sx - x0)[..., None]
    fy = (sy - y0)[..., None]
    moved = (image[y0, x0] * (1 - fx) * (1 - fy) + image[y0, x1] * fx * (1 - fy)
             + image[y1, x0] * (1 - fx) * fy + image[y1, x1] * fx * fy)

    # 2. Fine grain: thin the chalk by up to 22 % in small specks, as the SVG filter does.
    speck = max(1, int(round(scale)))
    grain = rng.normal(0.5, 0.2, (height // speck + 1, width // speck + 1)).astype(np.float32)
    grain = np.repeat(np.repeat(grain, speck, axis=0), speck, axis=1)[:height, :width]
    keep = np.clip(1.12 - 0.45 * grain, 0.78, 1.0)[..., None]
    out = board + (moved - board) * keep
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def save(fig, path, grain=True, display_width_px=720, tight=True):
    """Save a figure as a chalk PNG on the board.

    display_width_px: the CSS width the figure shows at in the desktop column,
    used to size the grain. Keep the default for figures that fill the column.
    tight: crop to the drawn content plus a small margin, so no label is cut off.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    # The board itself is not drawn by hand: a wobbly figure edge would show the canvas.
    fig.patch.set_sketch_params(None)
    dpi = matplotlib.rcParams["savefig.dpi"]
    fig.savefig(path, dpi=dpi, facecolor=BOARD, edgecolor=BOARD,
                bbox_inches="tight" if tight else None, pad_inches=0.16)
    plt.close(fig)
    image = Image.open(path).convert("RGBA")
    flat = Image.new("RGBA", image.size, BOARD)
    flat.alpha_composite(image)
    image = flat.convert("RGB")
    if grain:
        scale = image.width / float(display_width_px)
        image = Image.fromarray(chalk_grain(np.asarray(image), scale=scale))
    # A 256-color palette keeps the chalk look and makes the file about three times smaller.
    image = image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    image.save(path, optimize=True)
    return path


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
