#!/usr/bin/env python3
"""Make the 720 x 424 chalk card thumbnails of the SO-101 series from the article figures.

Run after the figures:
    python3 scripts/so101_figures.py && python3 scripts/so101_part7_figures.py
    python3 scripts/so101_thumbnails.py

The sources match content/robotics/thumbnail-sources.json. Parts 1 and 2 draw their
figure again in a wide layout, because the article versions are tall for phones.
Part 6 uses a so101-controllers figure and part 8 a camera frame; they are not made here.
"""

import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

SERIES = ROOT / "assets/robotics/so101-series"
THUMBS = ROOT / "assets/robotics/thumbnails"
CARDS = {
    "so101-3-choosing-the-goal": SERIES / "map-errors.png",
    "so101-4-learning-what-physics-misses": SERIES / "hindsight-label.png",
    "so101-7-learning-between-and-during-strokes": ROOT / "assets/robotics/so101-after-part6/timing-and-shape.png",
}


def main():
    from so101_common import set_style
    from so101_part1b_figures import spring_goal
    from so101_part2_figures import tick_rounding

    set_style()
    with tempfile.TemporaryDirectory() as folder:
        row = Path(folder) / "spring-goal-row.png"
        spring_goal(layout="row", out=row)
        chalk.thumbnail(row, THUMBS / "so101-1-target-and-goal.jpg")
        print("wrote so101-1-target-and-goal.jpg")
        wide = Path(folder) / "tick-rounding-card.png"
        tick_rounding(card=True, out=wide)
        chalk.thumbnail(wide, THUMBS / "so101-2-finer-than-the-sensor.jpg")
        print("wrote so101-2-finer-than-the-sensor.jpg")
    for slug, source in CARDS.items():
        chalk.thumbnail(source, THUMBS / f"{slug}.jpg")
        print(f"wrote {slug}.jpg")


if __name__ == "__main__":
    main()
