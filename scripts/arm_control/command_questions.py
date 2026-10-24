"""Chalk redraw of the question tree in "From joint angles to a moving arm".

Figure (written under assets/robotics/arm-control/):

- v3/command_questions.png: planning, learned joint targets and learned hand
  targets join at the next joint-angle target and the servo feedback loop.

Adapted from github.com/Hadrien-Cornier/maniskill-playground at commit 81e2a65,
experiments/workspace/teaching-v3/command_questions.py (the site file is
teaching-v3/command_questions.png).

Only the style and the phone layout change. The tree, its texts, its branches and
the color of each branch are the same. The original was laid out in CSS pixels
for an 820 px column with text of 10.8 to 22 pt; at a 358 px phone column its
smallest text was about 6.5 px tall. Here the canvas is the chalk 6.4 in width,
every text is at least 13.5 pt, and the boxes and gaps grow to hold the larger
text. The figure needs no data files, so this script takes no --source argument.
The original SVG copy is not made.

Run from the blog repository root:

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/command_questions.py

It needs matplotlib 3.8 or later, numpy and Pillow. Use --out DIR to write the
PNG file to another folder (as DIR/v3/command_questions.png).
"""

import argparse
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, PathPatch
from matplotlib.path import Path as DrawPath

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/arm-control"

# Layout units: 820 units across a 6.4 in figure (128 units per inch).
WIDTH, HEIGHT = 820, 1150
FIG_WIDTH = 6.4

# Old colors mapped by meaning, the same as in the other figures of the article:
# teal (planning, task-space route) is GREEN, purple (joint targets) is
# LAVENDER, gold (servo and motor) is YELLOW.
WHITE = chalk.CHALK  # old #f6f5e9
MUTED = chalk.DIM  # old #b8ccca
TEAL = chalk.GREEN  # old #7edacb
PURPLE = chalk.LAVENDER  # old #d1b1f1
GOLD = chalk.YELLOW  # old #ffcd7b
# Patrick Hand has a tall line box: linespacing 0.88 gives about 1.18 em per line.
LINE = 0.88


def render(out):
    chalk.use()
    fig = plt.figure(figsize=(FIG_WIDTH, FIG_WIDTH * HEIGHT / WIDTH))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set(xlim=(0, WIDTH), ylim=(HEIGHT, 0))
    ax.axis("off")

    def text(x, y, value, size=15, color=WHITE):
        return ax.text(
            x,
            y,
            value,
            ha="center",
            va="center",
            fontsize=size,
            color=color,
            linespacing=LINE,
        )

    def arrow(points, color=MUTED):
        codes = [DrawPath.MOVETO] + [DrawPath.LINETO] * (len(points) - 1)
        ax.add_patch(
            FancyArrowPatch(
                path=DrawPath(points, codes),
                arrowstyle="->",
                linewidth=2.2,
                mutation_scale=15,
                color=color,
                capstyle="round",
                joinstyle="round",
            )
        )

    def line(points, color=MUTED):
        ax.add_patch(
            PathPatch(DrawPath(points), fill=False, color=color, lw=2.2, capstyle="round")
        )

    def box(x, y, width, height, value, color, size=15.5):
        ax.add_patch(
            FancyBboxPatch(
                (x - width / 2, y - height / 2),
                width,
                height,
                boxstyle="round,pad=0,rounding_size=14",
                facecolor=chalk.BOARD,
                edgecolor=color,
                linewidth=2.2,
            )
        )
        text(x, y, value, size=size, color=color)

    text(410, 34, "A JOINT-POSITION CONTROL EXAMPLE", 13.5, MUTED)
    ax.text(
        410,
        110,
        "How will we choose\nthe next joint target?",
        ha="center",
        va="center",
        fontsize=21,
        color=chalk.YELLOW,
        linespacing=0.85,
    )
    line([(250, 168), (440, 172), (570, 168)], TEAL)

    # The branches describe architecture choices, not runtime yes/no decisions.
    arrow([(410, 190), (410, 212), (170, 212), (170, 250)], TEAL)
    arrow([(410, 212), (590, 212), (590, 250)], PURPLE)
    text(170, 275, "Plan from a goal", 17, TEAL)
    text(590, 275, "Use a learned policy", 17, PURPLE)
    text(590, 312, "images + joint state", 14, MUTED)

    arrow([(170, 300), (170, 352)], TEAL)
    arrow([(590, 330), (590, 352)], PURPLE)
    text(170, 392, "Where should\nthe hand go?", 17, TEAL)
    text(590, 392, "What does the\npolicy output?", 17, PURPLE)

    arrow([(170, 434), (170, 470)], TEAL)
    box(170, 505, 236, 62, "A grasp pose", TEAL, 16)
    text(170, 560, "position + orientation", 14, MUTED)
    arrow([(170, 580), (170, 612)], TEAL)
    box(170, 664, 248, 92, "IK, then plan\nand time a path", TEAL, 16)

    arrow([(590, 434), (590, 452), (450, 452), (450, 472)], PURPLE)
    arrow([(590, 452), (690, 452), (690, 467)], PURPLE)
    box(450, 505, 186, 62, "Joint targets", PURPLE, 16)
    box(690, 505, 226, 76, "Hand pose\nor displacement", TEAL, 15)
    text(450, 574, "ACT on ALOHA:\nfuture target chunks", 14, MUTED)
    arrow([(450, 606), (450, 632)], PURPLE)
    text(450, 668, "Select the\nnext target", 15.5, PURPLE)
    arrow([(690, 545), (690, 616)], TEAL)
    box(690, 664, 228, 92, "IK / Cartesian\ncontrol interface", TEAL, 15)

    # One command interface is shared by all three example routes.
    line([(170, 712), (170, 750), (410, 750)], TEAL)
    line([(450, 702), (450, 750), (410, 750)], PURPLE)
    line([(690, 712), (690, 750), (450, 750)], TEAL)
    arrow([(410, 750), (410, 784)], PURPLE)
    box(410, 822, 360, 66, "Next joint-angle target", PURPLE, 17)
    arrow([(410, 857), (410, 884)], PURPLE)
    box(410, 928, 360, 78, "Servo feedback control", GOLD, 17)
    text(410, 990, "motor drive", 15, GOLD)
    arrow([(410, 1010), (410, 1038)], GOLD)
    box(410, 1075, 260, 62, "Motor motion", GOLD, 17)

    # Encoder readings close the servo's local feedback loop.
    arrow([(278, 1075), (128, 1075), (128, 928), (228, 928)], MUTED)
    text(184, 1002, "encoder\nangle", 14, MUTED)

    path = Path(out) / "v3" / "command_questions.png"
    return chalk.save(fig, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=OUT, help="arm-control asset folder")
    print(render(parser.parse_args().out))


if __name__ == "__main__":
    main()
