"""Chalk thumbnails for two older articles whose cards had a light background.

- robot-brains-robot-bodies: the article's figure is HTML ("Cycle time and reliability",
  content/robotics/robot-brains-robot-bodies.md). The card redraws its two panels on the board,
  with the same words and numbers.
- breaking-bellman: the card is the game's casino screenshot (assets/robotics/breaking-bellman/casino.png),
  now padded on the board instead of light paper. The screenshot itself is unchanged.

Run from the repository root:
    python3 scripts/chalk_thumbnails.py
"""

import sys
import tempfile
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

THUMBS = ROOT / "assets/robotics/thumbnails"


def bar(ax, x, y, width, parts):
    """A cycle bar: (fraction, color) parts from left to right, on a faint track."""
    ax.add_patch(Rectangle((x, y), width, 0.035, facecolor=chalk.BOARD_2, edgecolor="none"))
    start = x
    for fraction, color in parts:
        ax.add_patch(Rectangle((start, y), width * fraction, 0.035, facecolor=color, edgecolor="none"))
        start += width * fraction


def robot_brains():
    """The two panels of the article figure: 90 s motion + 10 s decision, and 99% versus 99.9% success."""
    fig = plt.figure(figsize=(6.4, 3.77))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    ax.text(0.03, 0.95, "Illustrative assumptions", color=chalk.DIM, fontsize=13, va="top")
    ax.text(0.03, 0.88, "Cycle time and reliability", color=chalk.YELLOW, fontsize=19, va="top")

    left, right, top, bottom = (0.03, 0.485), (0.515, 0.97), 0.74, 0.03
    for (x0, x1), edge in ((left, chalk.CHALK), (right, chalk.GREEN)):
        ax.add_patch(Rectangle((x0, bottom), x1 - x0, top - bottom, facecolor="none", edgecolor=chalk.FAINT, linewidth=1.4))
        ax.plot([x0, x1], [top, top], color=edge, linewidth=3)

    x, w = left[0] + 0.025, left[1] - left[0] - 0.05
    ax.text(x, 0.69, "Less decision time", color=chalk.CHALK, fontsize=15, va="top")
    ax.text(x, 0.59, "100-second cycle", color=chalk.CHALK, fontsize=13, va="top")
    bar(ax, x, 0.49, w, [(0.9, chalk.GREEN), (0.1, chalk.RED)])
    ax.text(x, 0.465, "90 s motion + 10 s decision", color=chalk.DIM, fontsize=13, va="top")
    ax.text(x, 0.37, "90-second cycle", color=chalk.CHALK, fontsize=13, va="top")
    bar(ax, x, 0.27, w * 0.9, [(1.0, chalk.GREEN)])
    ax.text(x, 0.245, "90 s motion + 0 s decision", color=chalk.DIM, fontsize=13, va="top")
    ax.text(x, 0.175, "About 11% more throughput", color=chalk.YELLOW, fontsize=14, va="top")
    ax.text(x, 0.11, "Motion time stays fixed.", color=chalk.DIM, fontsize=13, va="top")

    x = right[0] + 0.025
    ax.text(x, 0.69, "Higher task reliability", color=chalk.CHALK, fontsize=15, va="top")
    for y, success, count, unit in ((0.59, "99% success", "10", "expected failures"),
                                    (0.40, "99.9% success", "1", "expected failure")):
        ax.text(x, y, success, color=chalk.CHALK, fontsize=13, va="top")
        ax.text(x, y - 0.065, count, color=chalk.GREEN, fontsize=24, va="top")
        ax.text(x + (0.075 if len(count) == 2 else 0.045), y - 0.09, unit, color=chalk.DIM, fontsize=13, va="top")
    ax.text(x, 0.175, "10× lower failure rate", color=chalk.GREEN, fontsize=14, va="top")
    ax.text(x, 0.11, "In 1,000 comparable attempts.", color=chalk.DIM, fontsize=13, va="top")

    with tempfile.TemporaryDirectory() as tmp:
        png = chalk.save(fig, Path(tmp) / "robot-brains-robot-bodies.png")
        chalk.thumbnail(png, THUMBS / "robot-brains-robot-bodies.jpg")


def breaking_bellman():
    """The casino screenshot, contained and padded on the board.

    The screenshot has rounded corners filled with light paper. Fill them with the board first,
    so no white wedge shows on the dark card.
    """
    shot = Image.open(ROOT / "assets/robotics/breaking-bellman/casino.png").convert("RGB")
    board = tuple(round(255 * c) for c in matplotlib.colors.to_rgb(chalk.BOARD))
    for corner in ((0, 0), (shot.width - 1, 0), (0, shot.height - 1), (shot.width - 1, shot.height - 1)):
        ImageDraw.floodfill(shot, corner, board, thresh=170)
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / "casino.png"
        shot.save(source)
        chalk.thumbnail(source, THUMBS / "breaking-bellman.jpg")


if __name__ == "__main__":
    chalk.use()
    robot_brains()
    breaking_bellman()
