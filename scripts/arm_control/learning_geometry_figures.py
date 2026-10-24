"""Chalk redraw of the rotation-columns figure in "From joint angles to a moving arm".

Figure (written under assets/robotics/arm-control/):

- 04_rotation_columns.png: two perpendicular unit axes at 0, 30 and 90 degrees,
  with the columns x' = (cos, sin) and y' = (-sin, cos).

Adapted from github.com/Hadrien-Cornier/maniskill-playground at commit 81e2a65,
experiments/workspace/learning_geometry_figures.py, function rotation_columns()
and its helpers (the site file is figures-lesson/04_rotation_columns.png).

Only the style and the phone layout change: the three panels are stacked, each
with its title and note to the right of its circle. Every label, vector and
projection comes from the original function. The figure needs no data files, so
this script takes no --source argument. The other outputs of the original script
(01_link_projections, 02_so101_signed_reach, 03_workspace_intuitions, the SVG
copies and the check files) are not used by the site and are not made here.

Run from the blog repository root:

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/learning_geometry_figures.py

It needs matplotlib 3.8 or later, numpy and Pillow. Use --out DIR to write the
PNG file to another folder.
"""

import argparse
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Arc, Circle

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/arm-control"

# Old colors mapped by meaning. The text in the figure says "the green arrow",
# so y' stays green.
NAVY = chalk.CHALK  # old #20354B
GRAY = chalk.DIM  # old #8796A4
LIGHT = chalk.FAINT  # old #E3EBEE
RED = chalk.RED  # old #e05252 (x')
GREEN = chalk.GREEN  # old #4caa68 (y')
# Patrick Hand has a tall line box: linespacing 0.9 gives about 1.2 em per line.
LINE = 0.9


def unit(degrees):
    angle = np.deg2rad(degrees)
    return np.array([np.cos(angle), np.sin(angle)])


def frame(ax, xlim, ylim):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_aspect("equal")
    ax.axis("off")


def arrow(ax, start, end, color=NAVY, lw=2, zorder=3, style="-|>"):
    ax.annotate(
        "",
        xy=end,
        xytext=start,
        arrowprops={
            "arrowstyle": style,
            "color": color,
            "lw": lw,
            "mutation_scale": 15,
            "shrinkA": 0,
            "shrinkB": 0,
        },
        zorder=zorder,
    )


def dashed(ax, start, end, color=GRAY, lw=1.6):
    ax.plot(*np.array([start, end]).T, color=color, lw=lw, linestyle=(0, (4, 3)), zorder=1)


def angle_arc(ax, center, start, stop, radius, label, color=NAVY, label_radius=None, fontsize=15):
    low, high = sorted((start, stop))
    ax.add_patch(
        Arc(center, 2 * radius, 2 * radius, theta1=low, theta2=high, color=color, lw=1.8, zorder=5)
    )
    previous = center + radius * unit(stop - np.sign(stop - start) * 3)
    endpoint = center + radius * unit(stop)
    arrow(ax, previous, endpoint, color=color, lw=1.4, zorder=5)
    position = center + (label_radius or radius * 1.4) * unit((start + stop) / 2)
    ax.text(*position, label, color=color, ha="center", va="center", fontsize=fontsize)


def label_position(endpoint, offset):
    """Label point for a unit arrow, as in the original: 1.13 times the tip plus an offset.

    An arrow along an axis would put its label on the gray axis arrowhead at the
    chalk text size, so that label moves to the side of the axis instead.
    """
    along_x = abs(endpoint[1]) < 1e-8
    along_y = abs(endpoint[0]) < 1e-8
    if along_x:
        return np.array([endpoint[0] * 1.12, 0.2])
    if along_y:
        return np.array([-0.18, endpoint[1] * 1.22])
    return endpoint * 1.13 + offset


def rotation_columns(out):
    width, height = 6.4, 12.0
    fig = plt.figure(figsize=(width, height))

    def axes_at(left, top, w, h):
        return fig.add_axes([left / width, 1 - (top + h) / height, w / width, h / height])

    def text_at(x, y, value, **kwargs):
        return fig.text(x / width, 1 - y / height, value, **kwargs)

    # The long title is broken onto two lines for the phone column.
    text_at(
        0.1,
        0.1,
        "Both local axes turn together.\nThe second axis stays 90° ahead.",
        fontsize=19,
        color=chalk.YELLOW,
        va="top",
        linespacing=0.85,
    )

    # The three panels sit side by side in the original. Here they are stacked:
    # the circle on the left, its title and note on the right.
    notes = {
        0: "x′ = (1, 0)     y′ = (0, 1)",
        30: "y′ points left and up",
        90: "x′ = (0, 1)     y′ = (−1, 0)",
    }
    xlim, ylim = (-1.37, 1.33), (-1.32, 1.40)
    circle_w = 3.15
    circle_h = circle_w * (ylim[1] - ylim[0]) / (xlim[1] - xlim[0])
    row_top, pitch = 0.95, 3.3
    for index, theta in enumerate((0, 30, 90)):
        top = row_top + index * pitch
        ax = axes_at(0.05, top, circle_w, circle_h)
        frame(ax, xlim, ylim)
        middle = top + circle_h / 2
        text_at(3.5, middle - 0.15, f"θ = {theta}°", fontsize=21, color=NAVY, va="bottom")
        text_at(3.5, middle + 0.12, notes[theta], fontsize=15, color=NAVY, va="top")

        ax.add_patch(Circle((0, 0), 1, fill=False, color=LIGHT, linewidth=2))
        arrow(ax, [-1.16, 0], [1.16, 0], color=GRAY, lw=1.2)
        arrow(ax, [0, -1.16], [0, 1.16], color=GRAY, lw=1.2)
        ax.text(1.25, -0.13, "x", color=GRAY, fontsize=15)
        ax.text(0.12, 1.27, "y", color=GRAY, fontsize=15)
        first, second = unit(theta), unit(theta + 90)
        arrow(ax, [0, 0], first, color=RED, lw=3.3)
        arrow(ax, [0, 0], second, color=GREEN, lw=3.3)
        for endpoint, color in ((first, RED), (second, GREEN)):
            if np.all(np.abs(endpoint) > 1e-8):
                dashed(ax, endpoint, [endpoint[0], 0], color=color, lw=1.5)
                dashed(ax, endpoint, [0, endpoint[1]], color=color, lw=1.5)
        ax.text(
            *label_position(first, np.array([0.03, -0.02])),
            "x′",
            color=RED,
            fontsize=19,
            ha="center",
            va="center",
        )
        ax.text(
            *label_position(second, np.array([-0.04, 0.02])),
            "y′",
            color=GREEN,
            fontsize=19,
            ha="center",
            va="center",
        )
        if theta == 30:
            angle_arc(ax, np.zeros(2), 0, theta, 0.28, "θ", label_radius=0.44)
            ax.text(second[0], -0.14, r"$-\sin\theta$", color=GREEN, ha="center", fontsize=15)
            ax.text(0.11, second[1] - 0.04, r"$\cos\theta$", color=GREEN, ha="left", fontsize=15)
            ax.text(
                1.16, 0.23, r"$\sin\theta$", color=RED, rotation=90, ha="center", fontsize=14.5
            )
            ax.text(0.58, -0.14, r"$\cos\theta$", color=RED, ha="center", fontsize=15)

    bottom = row_top + 2 * pitch + circle_h + 0.2
    text_at(
        width / 2,
        bottom + 0.3,
        r"$x^{\prime}=(\cos\theta,\;\sin\theta)$",
        ha="center",
        va="center",
        color=RED,
        fontsize=20,
    )
    text_at(
        width / 2,
        bottom + 0.85,
        r"$y^{\prime}=(-\sin\theta,\;\cos\theta)$",
        ha="center",
        va="center",
        color=GREEN,
        fontsize=20,
    )
    text_at(
        0.1,
        bottom + 1.3,
        "At 30°, the green arrow's horizontal projection\nis negative because it points left.",
        fontsize=15,
        color=NAVY,
        va="top",
        linespacing=LINE,
    )
    text_at(0.1, bottom + 2.05, "TEACHING SCHEMATIC", fontsize=13, color=GRAY, va="top")
    text_at(
        width - 0.1,
        bottom + 2.05,
        "Unit vectors in a fixed 2D basis; counterclockwise rotation",
        fontsize=13,
        color=GRAY,
        va="top",
        ha="right",
    )
    return chalk.save(fig, out / "04_rotation_columns.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=OUT, help="output folder")
    args = parser.parse_args()
    chalk.use()
    print(rotation_columns(args.out))


if __name__ == "__main__":
    main()
