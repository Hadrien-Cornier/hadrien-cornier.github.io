"""Chalk redraw of the two encoder diagrams in "From joint angles to a moving arm".

Figures (written under assets/robotics/arm-control/):

- v4/magnet_chip_signal_path.png: a magnet turns above a fixed AS5600 chip; the
  chip turns two Hall signals into numbers and CORDIC turns them into an angle.
- v4/equal_sine_opposite_cosine.png: 30 and 150 degrees share Y = 0.5 and have
  opposite X signs.

Adapted from github.com/Hadrien-Cornier/maniskill-playground at commit 81e2a65,
experiments/encoder-visuals/render.py, functions mechanism() and ambiguity().

Only the style and the phone layout change. Every text, value, shape and signal
comes from the original functions. The original canvases are 960 CSS px wide
with text of 10.8 to 23 pt, which is 5.6 to 12 px tall at a 358 px phone column.
Here the canvas is the chalk 6.4 in width, every text is at least 13.5 pt, and the
two columns of each diagram are rearranged to hold the larger text. The figures
need no data files, so this script takes no --source argument. The original SVG
copies are not made.

Run from the blog repository root:

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/encoder_visuals.py

It needs matplotlib 3.8 or later, numpy and Pillow. Use --out DIR to write the
PNG files to another folder (as DIR/v4/<name>.png).
"""

import argparse
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import (
    Arc,
    Ellipse,
    FancyArrowPatch,
    FancyBboxPatch,
    Rectangle,
    Wedge,
)
from matplotlib.transforms import Affine2D

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/arm-control"

# Layout units: 820 units across a 6.4 in figure (128 units per inch).
UNITS = 820
FIG_WIDTH = 6.4

# Old colors mapped by meaning, the same as in the other figures of the article:
# teal is GREEN, purple is LAVENDER, gold (the shared value, CORDIC and the
# output angle) is YELLOW, the N pole stays RED.
BG = chalk.BOARD  # old #142e32
WHITE = chalk.CHALK  # old #f6f5e9
MUTED = chalk.DIM  # old #b8ccca
TEAL = chalk.GREEN  # old #7edacb
PURPLE = chalk.LAVENDER  # old #d1b1f1
GOLD = chalk.YELLOW  # old #ffcd7b
RED = chalk.RED  # old #f28b82
PANEL = chalk.BOARD_2  # old fills #365455 (disk side) and #275953 (chip board)
SHAFT = chalk.FAINT  # old fill #627b7b
# Patrick Hand has a tall line box: linespacing 0.88 gives about 1.18 em per line.
LINE = 0.88


def canvas(height):
    fig = plt.figure(figsize=(FIG_WIDTH, FIG_WIDTH * height / UNITS))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set(xlim=(0, UNITS), ylim=(height, 0))
    ax.axis("off")
    return fig, ax


def text(ax, x, y, s, size=15, color=WHITE, ha="center", **kwargs):
    return ax.text(
        x, y, s, fontsize=size, color=color, ha=ha, va="center", linespacing=LINE, **kwargs
    )


def arrow(ax, a, b, color=MUTED, lw=2.4, style="->"):
    ax.add_patch(
        FancyArrowPatch(a, b, arrowstyle=style, mutation_scale=16, color=color, lw=lw)
    )


def box(ax, x, y, w, h, s, color=TEAL, size=16):
    ax.add_patch(
        FancyBboxPatch(
            (x - w / 2, y - h / 2),
            w,
            h,
            boxstyle="round,pad=0,rounding_size=12",
            fc=BG,
            ec=color,
            lw=2.2,
        )
    )
    text(ax, x, y, s, size, color)


def mechanism(out):
    height = 805
    fig, ax = canvas(height)
    text(ax, 410, 32, "FROM A ROTATING MAGNET TO AN ANGLE", 13.5, MUTED)
    text(ax, 410, 78, "The magnet moves. The chip stays still.", 21, chalk.YELLOW)

    # Left column: axial shaft and diametrically magnetized disk in an oblique view.
    cx = 190
    # Dashed shaft axis from the shaft top down behind the chip pins, with gaps
    # only where the two magnet text lines sit on it.
    for top, bottom in [(150, 335), (402, 492)]:
        ax.plot([cx, cx], [top, bottom], ls=(0, (4, 5)), color=MUTED, lw=1.3, zorder=0)
    ax.add_patch(Rectangle((cx - 13, 145), 26, 103, fc=SHAFT, ec=MUTED, lw=1.5))
    text(ax, 300, 168, "shaft", 15, MUTED)
    ax.plot([272, cx + 17], [176, 196], color=MUTED, lw=1)
    ax.add_patch(Ellipse((cx, 282), 192, 68, fc=PANEL, ec=MUTED, lw=1.5))
    ax.add_patch(Rectangle((cx - 96, 260), 192, 22, fc=PANEL, ec="none"))
    # Two halves of one disk show poles across its diameter.
    for start, end, col in [(90, 270, RED), (-90, 90, TEAL)]:
        half = Wedge((0, 0), 1, start, end, fc=col, ec=BG, lw=1)
        half.set_transform(Affine2D().scale(96, 34).translate(cx, 260) + ax.transData)
        ax.add_patch(half)
    text(ax, cx - 47, 260, "N", 17, BG)
    text(ax, cx + 46, 260, "S", 17, BG)
    # Sweep arrow in a horizontal ring around the shaft.
    t = np.linspace(np.deg2rad(215), np.deg2rad(520), 100)
    xx = cx + 124 * np.cos(t)
    yy = 240 + 48 * np.sin(t)
    ax.plot(xx[:-3], yy[:-3], color=GOLD, lw=2.4)
    arrow(ax, (xx[-5], yy[-5]), (xx[-1], yy[-1]), GOLD)
    text(ax, cx, 352, "Magnet turns with shaft", 17, WHITE)
    text(ax, cx, 388, "N and S lie across its diameter", 14, MUTED)
    # Board and stationary 8-pin chip.
    ax.add_patch(
        FancyBboxPatch(
            (cx - 133, 500),
            266,
            75,
            boxstyle="round,pad=0,rounding_size=8",
            fc=PANEL,
            ec=TEAL,
            lw=1.6,
        )
    )
    for x in [cx - 48, cx - 17, cx + 14, cx + 45]:
        ax.add_patch(Rectangle((x - 6, 483), 12, 29, fc=MUTED, ec="none"))
        ax.add_patch(Rectangle((x - 6, 562), 12, 27, fc=MUTED, ec="none"))
    ax.add_patch(
        FancyBboxPatch(
            (cx - 70, 511),
            140,
            52,
            boxstyle="round,pad=0,rounding_size=4",
            fc=BG,
            ec=MUTED,
            lw=1.4,
        )
    )
    text(ax, cx, 537, "AS5600", 17, WHITE)
    text(ax, cx, 622, "Fixed Hall-sensor chip", 17, TEAL)
    text(ax, cx, 656, "Its sensor array reads the field", 14, MUTED)
    ax.plot([cx, cx], [408, 472], ls=":", color=GOLD, lw=2.5)
    text(ax, cx + 82, 438, "field reaches\nsensor", 14, GOLD)

    # Right column: abstract signal processing chain; no physical Hall plate
    # orientation implied.
    rx = 615
    box(ax, rx, 175, 390, 62, "Hall array + analog processing", TEAL, 16)
    arrow(ax, (cx + 136, 537), (390, 537), TEAL)
    ax.plot([390, 390, 390], [537, 175, 175], color=TEAL, lw=2.4)
    arrow(ax, (390, 175), (418, 175), TEAL)
    arrow(ax, (rx, 208), (rx, 242), TEAL)
    text(ax, rx, 266, "Two signed voltage signals", 16.5, WHITE)
    sig = fig.add_axes([440 / UNITS, 1 - 397 / height, 350 / UNITS, 105 / height], facecolor=BG)
    s = np.linspace(0, 2 * np.pi, 240)
    sig.plot(s, np.cos(s), color=TEAL, lw=2.6)
    sig.plot(s, np.sin(s), color=PURPLE, lw=2.6)
    sig.axhline(0, color=MUTED, lw=0.9, alpha=0.5)
    sig.set(xlim=(0, 2 * np.pi), ylim=(-1.2, 1.2))
    sig.axis("off")
    text(ax, 525, 422, "X = A cos θ", 16, TEAL)
    text(ax, 715, 422, "Y = A sin θ", 16, PURPLE)
    arrow(ax, (rx, 442), (rx, 476))
    box(ax, rx, 506, 340, 52, "ADC: voltages → numbers", MUTED, 16)
    arrow(ax, (rx, 533), (rx, 566))
    box(ax, rx, 597, 320, 56, "CORDIC: atan2(Y, X)", GOLD, 17)
    arrow(ax, (rx, 626), (rx, 657), GOLD)
    text(ax, rx, 688, "Shaft angle θ", 20, GOLD)
    text(ax, 410, 765, "AS5600 teaching schematic • ideal sine/cosine signals", 13.5, MUTED)
    return chalk.save(fig, Path(out) / "v4" / "magnet_chip_signal_path.png")


def ambiguity(out):
    height = 620
    fig, ax = canvas(height)
    text(ax, 410, 32, "WHY THE ENCODER NEEDS BOTH SIGNALS", 13.5, MUTED)
    text(ax, 410, 76, "Same sine. Different angles.", 22, chalk.YELLOW)
    # Circle uses isotropic data units, independent of page coordinates.
    a = fig.add_axes([0 / UNITS, 1 - 548 / height, 452 / UNITS, 440 / height], facecolor=BG)
    a.set_aspect("equal")
    a.set(xlim=(-1.27, 1.27), ylim=(-1.25, 1.25))
    a.axis("off")
    t = np.linspace(0, 2 * np.pi, 400)
    a.plot(np.cos(t), np.sin(t), color=MUTED, lw=1.8, alpha=0.65)
    for start, end in [((-1.15, 0), (1.16, 0)), ((0, -1.13), (0, 1.15))]:
        a.add_patch(
            FancyArrowPatch(start, end, arrowstyle="->", mutation_scale=13, lw=1.3, color=MUTED)
        )
    a.text(1.19, -0.05, "X", color=MUTED, fontsize=15)
    a.text(0.055, 1.16, "Y", color=MUTED, fontsize=15)
    x = np.sqrt(3) / 2
    y = 0.5
    a.plot([-x, x], [y, y], ls="--", color=GOLD, lw=2.2)
    a.text(
        0,
        y + 0.095,
        "Y = 0.5 for both",
        ha="center",
        color=GOLD,
        fontsize=15,
        bbox=chalk.label_box(pad=0.08),
    )
    for sign, col, label in [(1, TEAL, "30°"), (-1, PURPLE, "150°")]:
        a.add_patch(
            FancyArrowPatch((0, 0), (sign * x, y), arrowstyle="->", mutation_scale=18, lw=3, color=col)
        )
        a.plot([sign * x, sign * x], [0, y], ls=":", color=col, lw=2.2)
        a.scatter([sign * x], [y], s=60, color=col, zorder=5)
        a.text(sign * x, y + 0.25, label, ha="center", color=col, fontsize=20)
        # Centered a little inside the projection line so that the label sits
        # inside the circle and touches neither the circle nor the X axis.
        a.text(
            sign * 0.76,
            -0.19,
            f"{sign * x:+.3f}",
            ha="center",
            color=col,
            fontsize=14.5,
        )
    a.add_patch(Arc((0, 0), 0.68, 0.68, theta1=0, theta2=30, color=TEAL, lw=1.6))
    a.add_patch(Arc((0, 0), 0.95, 0.95, theta1=0, theta2=150, color=PURPLE, lw=1.4, alpha=0.8))
    # Just below the end of the Y axis, so that it needs no board patch.
    a.text(-0.1, -1.29, "Unit circle: A = 1", color=MUTED, ha="center", fontsize=14)
    box(ax, 640, 205, 330, 96, "30°\nX = +0.866    Y = +0.5", TEAL, 17)
    box(ax, 640, 330, 330, 96, "150°\nX = −0.866    Y = +0.5", PURPLE, 17)
    text(ax, 640, 428, "Y alone leaves two choices.", 16.5, GOLD)
    text(ax, 640, 468, "The sign of X separates them.", 15.5, WHITE)
    text(ax, 410, 585, "atan2(Y, X) uses both coordinates to recover the angle.", 17, WHITE)
    return chalk.save(fig, Path(out) / "v4" / "equal_sine_opposite_cosine.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=OUT, help="arm-control asset folder")
    args = parser.parse_args()
    assert np.isclose(np.sin(np.deg2rad(30)), np.sin(np.deg2rad(150)))
    assert np.isclose(np.cos(np.deg2rad(30)), -np.cos(np.deg2rad(150)))
    chalk.use()
    print(mechanism(args.out))
    print(ambiguity(args.out))


if __name__ == "__main__":
    main()
