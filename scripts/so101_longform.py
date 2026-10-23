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
    "so101-1-target-and-goal": {
        "spring-goal.png": "The joint as a torsion spring",
        "servo-inside.png": "Inside a smart servo",
        "two-loops.png": "Two nested loops",
        "pid-parts.png": "P, D and I on a sagging joint",
        "calibration-columns.png": "What calibration stores",
        "three-delays.png": "Three delays",
        "dead-time-ranges.png": "Dead time, measured two ways",
        "torque-limit.png": "A late brake hits the torque limit",
        "heat-torque.png": "Heat lowers the torque",
        "lag-on-path.png": "The joint follows later",
        "worn-hold-motion.png": "Friction on a hold and in motion",
        "friction-models.png": "Four friction models",
        "speed-coupling.png": "Speed coupling",
        "error-vs-kp.png": "Error against stiffness",
        "constants-dumbbell.png": "Simulator against my arm",
    },
    "so101-2-finer-than-the-sensor": {
        "tick-rounding.png": "Rounding error of one tick",
        "accel-pipelines.png": "Two ways to get an acceleration",
        "one-step-gain.png": "One goal tick, 0.15 tick of motion",
        "observer-step.png": "One observer step",
        "two-observers.png": "Two observers, one loop",
    },
    "so101-3-choosing-the-goal": {
        "map-errors.png": "Real-arm error by controller",
        "sim-five.png": "Simulation error by controller",
        "inv-goal.png": "Sending the goal ahead",
        "pi-five.png": "Five times the stiffness",
        "shake-test.png": "The shake test",
        "hold-torque.png": "Torque during one step",
        "deadband-cost.png": "A flat cost in the dead band",
        "real-arm-joints.png": "Error per joint on the real arm",
        "known-timeline.png": "Known methods and their history",
    },
    "so101-4-learning-what-physics-misses": {
        "hindsight-label.png": "The hindsight label",
        "network-io.png": "What the network learns",
        "nn-vs-fitted.png": "Network against Fitted",
        "sensitivity.png": "Trusting the model more",
        "data-curves.png": "Error against minutes of data",
        "residual.png": "First try: a residual",
    },
    "so101-8-measuring-the-tool-in-3d": {
        "plane.svg": "The tablet sees only its plane",
        "camera.svg": "A camera and a ChArUco target",
        "pinhole.svg": "Depth changes the target size",
        "stations.svg": "Sweeping base stations",
        "mocap.svg": "Infrared motion capture",
        "laser.svg": "A laser tracker",
        "accuracy.svg": "Accuracy on one log axis",
        "rate.svg": "Sample rates on one log axis",
        "chain.svg": "From the sensor target to the nib",
    },
    # Part 6 figures belong to the so101-controllers figure script (scripts/so101_controllers_figures.py).
    "so101-6-where-the-last-millimeter-goes": {
        "arm-pan-lever.png": "The pan has the longest lever",
        "goal-chatter.png": "Goal chatter",
        "kitten-timeline.png": "The kitten, drawing after drawing",
        "four-drawings.png": "The four test drawings",
        "system.png": "Where each error part enters",
        "head-schematic.png": "The correction head",
        "head-offset.png": "What the head adds",
        "kalman-intuition.png": "Two online estimators",
        "controllers-map.png": "All controllers of this part",
        "error-parts.png": "Ten error parts",
        "pan-reversal.png": "The pan waits at a reversal",
        "nib-error-vs-speed.png": "Nib error against speed",
        "learning-curve.png": "Error against training motions",
        "numbers.png": "The three labels",
    },
    "so101-7-learning-between-and-during-strokes": {
        "timing-and-shape.png": "Timing and shape",
        "repeat-budget.png": "Seeing an error, predicting it",
        "twin-across-days.png": "The twin across days",
    },
}


# Part 8 draws its figures by hand in SVG. They become panel files in this folder.
PART8 = "/assets/robotics/so101-series/part8"
INLINE = re.compile(r'<figure class="article-figure">\n(<svg class="chalk[^"]*"[^\n]*</svg>)\n<figcaption>(.*)</figcaption>\n</figure>')


def extract_inline(text, folder):
    """Move each inline SVG figure to a panel file and leave a markdown figure in its place."""
    def move(m):
        svg, caption = m.group(1), m.group(2)
        key = re.search(r'aria-labelledby="fig-([a-z0-9-]+)-t', svg).group(1)
        title = re.search(r"<title[^>]*>(.*?)</title>", svg).group(1)
        desc = re.search(r"<desc[^>]*>(.*?)</desc>", svg).group(1)
        # The board draws the grain; the slot keeps the title and the description for screen readers.
        panel = re.sub(r"<title[^>]*>.*?</title><desc[^>]*>.*?</desc>", "", svg)
        panel = panel.replace('class="chalk chalk-filter"', 'class="chalk"')
        panel = re.sub(r' (?:role|aria-labelledby|style)="[^"]*"', "", panel, count=3)
        (ROOT / folder.lstrip("/") / f"{key}.svg").write_text(panel + "\n")
        alt = f"{title}. {desc}".replace("]", ")").replace("[", "(")
        return f'![{alt}]({folder}/{key}.svg "{caption}")'
    (ROOT / folder.lstrip("/")).mkdir(parents=True, exist_ok=True)
    text = INLINE.sub(move, text)
    # The grain filter of chalk.css now comes from the board.
    return re.sub(r'<svg class="chalk-defs".*?</svg>\n', "", text, count=1)


def title_of(text):
    return re.search(r"^title: ['\"]?(.*?)['\"]?$", text, flags=re.M).group(1)


def build(path):
    text = path.read_text()
    path.write_text(canvas.build(text, f"Figures of {title_of(text)}",
                                 "One blackboard panel for each figure of the article, in reading order."))


def main(argv):
    if argv[:1] == ["convert"] and len(argv) == 2:
        path = CONTENT / f"{argv[1]}.md"
        text = path.read_text()
        if argv[1].startswith("so101-8-"):
            text = extract_inline(text, PART8)
        path.write_text(canvas.convert(text, TITLES[argv[1]]))
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
