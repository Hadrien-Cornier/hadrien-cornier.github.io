#!/usr/bin/env python3
"""Put the figures of the SO-101 series on the long-form canvas of the RL series.

    python3 scripts/so101_longform.py convert so101-2-finer-than-the-sensor   # once per article
    python3 scripts/so101_longform.py build                                    # every converted article

convert turns the markdown figures of an article into canvas steps (see
assets/robotics/chalk/canvas.py). build makes each board again from the panel files,
so run it after the figure scripts write new .svg panels.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import canvas  # noqa: E402

CONTENT = ROOT / "content/robotics"

# The short title of each step, by figure file. It names the step in the canvas menu
# and above the figure on a phone.
TITLES = {
    "so101-2-finer-than-the-sensor": {
        "tick-rounding.png": "Rounding error of one tick",
        "accel-pipelines.png": "Two ways to get an acceleration",
        "one-step-gain.png": "One goal tick, 0.15 tick of motion",
        "observer-step.png": "One observer step",
        "two-observers.png": "Two observers, one loop",
    },
}


def title_of(text):
    return re.search(r"^title: ['\"]?(.*?)['\"]?$", text, flags=re.M).group(1)


def build(path):
    text = path.read_text()
    path.write_text(canvas.build(text, f"Figures of {title_of(text)}",
                                 "One blackboard panel for each figure of the article, in reading order."))


def main(argv):
    if argv[:1] == ["convert"] and len(argv) == 2:
        path = CONTENT / f"{argv[1]}.md"
        path.write_text(canvas.convert(path.read_text(), TITLES[argv[1]]))
        build(path)
        print(f"converted {path.relative_to(ROOT)}")
    elif argv == ["build"]:
        for slug in TITLES:
            path = CONTENT / f"{slug}.md"
            if canvas.START in path.read_text():
                build(path)
                print(f"built {path.relative_to(ROOT)}")
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
