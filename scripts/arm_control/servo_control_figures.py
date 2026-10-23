"""Chalk redraw of two servo-control figures in "From joint angles to a moving arm".

Figures (written under assets/robotics/arm-control/):

- so101_servo_feedback.png: the SO-101 signal path, from the laptop through the USB
  bus adapter to the local feedback loop inside one smart servo.
- 03_pid_terms.png: one error history read three ways (P, I, D).

Adapted from github.com/Hadrien-Cornier/maniskill-playground at commit 81e2a65:

- experiments/workspace/control_spaces_figures.py, function servo()
  (so101_servo_feedback.png; the site file is figures-control/so101_servo_feedback.png)
- experiments/workspace/servo_control_figures.py, functions pid_terms(),
  error_history() and error_slope() (03_pid_terms.png)

Only the style and the phone layout change. Every label, number and curve comes
from the original functions. The two figures need no data files, so this script
takes no --source argument. The other outputs of the original scripts
(01_damping_step_responses, 02_fixed_gains_changing_inertia,
control_spaces_overview, task_joint_mapping, the SVG copies and the check files)
are not used by the site and are not made here.

Run from the blog repository root:

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/servo_control_figures.py

It needs matplotlib 3.8 or later, numpy and Pillow. Use --out DIR to write the
PNG files to another folder.
"""

import argparse
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/arm-control"

# Old colors mapped by meaning. The same meaning keeps the same chalk color in
# every figure of the article: joint-space commands (purple) are LAVENDER,
# motor effort (amber) is YELLOW, teal is GREEN, the integral (orange) is RED.
JOINT = chalk.LAVENDER  # old #8051a8 / #8459A2
MOTOR = chalk.YELLOW  # old #bf782d
NEUTRAL = chalk.DIM  # old #526777 / #8C9BA7
INK = chalk.CHALK  # old #263e4e / #243747
P_COLOR = chalk.GREEN  # old teal #248A91
I_COLOR = chalk.RED  # old orange #DD862E
D_COLOR = chalk.LAVENDER  # old purple #8459A2
# Patrick Hand has a tall line box: linespacing 0.9 gives about 1.2 em per line.
LINE = 0.9


# ---------------------------------------------------------------------------
# so101_servo_feedback.png
# ---------------------------------------------------------------------------


def arrow(ax, a, b, color=NEUTRAL, style="-|>"):
    ax.add_patch(
        FancyArrowPatch(a, b, arrowstyle=style, mutation_scale=17, color=color, linewidth=2.2)
    )


def elbow_arrow(ax, points, color):
    """A path of straight segments with an arrow head at the last point."""
    xs, ys = zip(*points)
    ax.plot(xs[:-1], ys[:-1], color=color, linewidth=2.2, solid_capstyle="round")
    arrow(ax, points[-2], points[-1], color)


def box(ax, x, y, w, h, title, body, color=NEUTRAL):
    """A rounded box. (x, y) is the top-left corner in a y-down frame."""
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle="round,pad=0,rounding_size=0.12",
            facecolor=chalk.BOARD,
            edgecolor=color,
            linewidth=2.2,
        )
    )
    ax.text(x + w / 2, y + 0.13, title, color=color, fontsize=16.5, va="top", ha="center")
    ax.text(
        x + w / 2,
        y + 0.5,
        body,
        color=INK,
        fontsize=14.5,
        va="top",
        ha="center",
        linespacing=LINE,
    )


def servo(out):
    width, height = 6.4, 9.45
    fig = plt.figure(figsize=(width, height))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set(xlim=(0, width), ylim=(height, 0))
    ax.axis("off")

    # Long title and subtitle broken onto two lines each for the phone column.
    ax.text(
        0.1,
        0.1,
        "The USB board passes the message.\nEach smart servo follows its target.",
        fontsize=19,
        color=chalk.YELLOW,
        va="top",
        linespacing=0.85,
    )
    ax.text(
        0.1,
        0.86,
        "SO-101 signal path: one laptop coordinates several servos,\n"
        "each with its own local feedback loop.",
        fontsize=14,
        color=NEUTRAL,
        va="top",
        linespacing=LINE,
    )

    # Host side: laptop and USB adapter.
    box(ax, 0.1, 1.55, 2.75, 1.1, "Laptop / policy", "Send target angles\nfor servo IDs", JOINT)
    box(ax, 3.55, 1.55, 2.75, 1.1, "USB bus adapter", "USB to servo-bus\ncommunication", NEUTRAL)
    arrow(ax, (2.87, 2.1), (3.53, 2.1), JOINT)

    # One smart servo. The adapter arrow enters the box from above.
    ax.add_patch(
        FancyBboxPatch(
            (0.1, 3.12),
            6.2,
            3.45,
            boxstyle="round,pad=0,rounding_size=0.1",
            facecolor=chalk.BOARD_2,
            edgecolor=NEUTRAL,
            linewidth=1.5,
        )
    )
    elbow_arrow(ax, [(4.925, 2.67), (4.925, 2.9), (1.65, 2.9), (1.65, 3.6)], JOINT)
    ax.text(3.45, 3.24, "INSIDE ONE SMART SERVO", fontsize=14, color=INK, va="top")
    box(
        ax,
        0.3,
        3.62,
        2.7,
        1.1,
        "Local controller",
        "Compare target angle\nwith measured angle",
        NEUTRAL,
    )
    box(ax, 3.4, 3.62, 2.7, 1.1, "Driver + motor", "Current produces\nmotor torque", MOTOR)
    box(ax, 3.4, 5.27, 2.7, 1.1, "Gears + output", "Shaft turns\nunder load", JOINT)
    box(ax, 0.3, 5.27, 2.7, 1.1, "Magnetic encoder", "Measure output\nshaft angle", JOINT)
    arrow(ax, (3.02, 4.17), (3.38, 4.17), MOTOR)
    arrow(ax, (4.75, 4.74), (4.75, 5.25), MOTOR)
    arrow(ax, (3.38, 5.82), (3.02, 5.82), JOINT)
    arrow(ax, (1.65, 5.25), (1.65, 4.74), JOINT)

    # The two notes move from the left of the servo box to below it.
    ax.text(
        0.1,
        6.85,
        "The adapter also supports power/bus wiring.\nIt is not the position-feedback "
        "loop\ninside each servo.",
        fontsize=15.5,
        color=INK,
        va="top",
        linespacing=LINE,
    )
    ax.text(
        0.1,
        7.82,
        "One new target does not mean one motor pulse.\nThe local loop keeps correcting "
        "between\nhost commands while servo control is enabled.",
        fontsize=14.5,
        color=INK,
        va="top",
        linespacing=LINE,
    )
    ax.text(
        0.1,
        8.8,
        "SO-101 signal path: target angle, local correction, motor,\nand encoder feedback.",
        fontsize=13,
        color=NEUTRAL,
        va="top",
        linespacing=LINE,
    )
    return chalk.save(fig, out / "so101_servo_feedback.png")


# ---------------------------------------------------------------------------
# 03_pid_terms.png
# ---------------------------------------------------------------------------


def error_history(t):
    return np.exp(-0.55 * t) + 0.12 * np.sin(1.4 * t)


def error_slope(t):
    return -0.55 * np.exp(-0.55 * t) + 0.168 * np.cos(1.4 * t)


def pid_terms(out):
    # The three panels sit side by side in the original. Here they are stacked so
    # the text stays readable in a 358 px phone column.
    width, height = 6.4, 12.85
    fig = plt.figure(figsize=(width, height))

    def axes_at(left, top, w, h):
        return fig.add_axes([left / width, 1 - (top + h) / height, w / width, h / height])

    fig.text(
        0.1 / width,
        1 - 0.12 / height,
        "P reads now. I adds history.\nD reads the local slope.",
        fontsize=19,
        color=chalk.YELLOW,
        va="top",
        linespacing=0.85,
    )
    fig.text(
        0.1 / width,
        1 - 0.86 / height,
        "Each panel shows the same error history:\ntarget angle minus measured angle.",
        fontsize=15,
        color=INK,
        va="top",
        linespacing=LINE,
    )

    t = np.linspace(0, 5.0, 601)
    now = 2.4
    current = error_history(now)
    titles = ["P: present error", "I: accumulated error", "D: rate of change"]
    colors = [P_COLOR, I_COLOR, D_COLOR]
    panel_top, panel_height, pitch = 1.95, 2.0, 3.2
    axes = []
    for index, (title, color) in enumerate(zip(titles, colors, strict=True)):
        ax = axes_at(0.95, panel_top + index * pitch, 5.2, panel_height)
        axes.append(ax)
        ax.grid(True, color=chalk.FAINT, alpha=0.55, linewidth=0.9)
        ax.set_axisbelow(True)
        ax.set_xlabel("Time (s)", labelpad=2)
        ax.plot(t, error_history(t), color=INK, lw=2.4)
        ax.axhline(0, color=NEUTRAL, lw=1.1)
        ax.axvline(now, color=NEUTRAL, lw=1.1, linestyle="--")
        ax.scatter(now, current, s=70, color=color, zorder=5)
        ax.set(xlim=(0, 5), ylim=(-0.10, 1.25))
        ax.set_yticks([0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2])
        ax.set_title(title, color=color, fontsize=17.5, loc="center", pad=8)
        ax.text(now + 0.06, 1.10, "now", color=NEUTRAL, fontsize=14)
    axes[0].set_ylabel("Error e(t) (rad)")

    axes[0].annotate(
        "",
        xy=(now, current),
        xytext=(now, 0),
        arrowprops={
            "arrowstyle": "<->,head_length=0.5,head_width=0.3",
            "mutation_scale": 11,
            "shrinkA": 0,
            "shrinkB": 0,
            "color": P_COLOR,
            "lw": 2.5,
        },
    )
    # At phone size the label sits left of the arrow, where it does not cover the curve.
    axes[0].text(
        now - 0.12,
        current * 0.47,
        "current gap",
        fontsize=15,
        color=P_COLOR,
        va="center",
        ha="right",
    )

    past = t[t <= now]
    axes[1].fill_between(past, 0, error_history(past), color=I_COLOR, alpha=0.3, linewidth=0)
    # Moved from (0.65, 0.37) so that the label stays inside the area in the wider panel.
    axes[1].text(
        0.5,
        0.3,
        "signed area\nup to now",
        fontsize=15,
        color=I_COLOR,
        linespacing=LINE,
    )

    slope = error_slope(now)
    tangent_t = np.array([now - 0.65, now + 0.65])
    tangent_e = current + slope * (tangent_t - now)
    axes[2].plot(tangent_t, tangent_e, color=D_COLOR, lw=3.4)
    axes[2].text(2.7, 0.66, "local slope", fontsize=15, color=D_COLOR)
    axes[2].annotate(
        "",
        xy=(now + 0.14, current + slope * 0.14),
        xytext=(3.1, 0.62),
        arrowprops={"arrowstyle": "->", "color": D_COLOR, "lw": 1.6},
    )

    bottom = panel_top + 2 * pitch + panel_height + 0.78
    fig.text(
        0.5,
        1 - (bottom + 0.3) / height,
        r"$u=K_p e(t)\;+\;K_i\int_0^t e(\tau)\,d\tau\;+\;K_d\frac{de}{dt}$",
        ha="center",
        va="center",
        fontsize=21,
        color=INK,
    )
    fig.text(
        0.1 / width,
        1 - (bottom + 0.78) / height,
        "Many controllers take D from the measured motion instead,\n"
        "so a sudden target change does not cause a derivative kick.",
        fontsize=14.5,
        color=INK,
        va="top",
        linespacing=LINE,
    )
    fig.text(
        0.1 / width,
        1 - (bottom + 1.55) / height,
        "TEACHING MODEL",
        fontsize=13,
        color=NEUTRAL,
        va="top",
    )
    fig.text(
        1 - 0.1 / width,
        1 - (bottom + 1.55) / height,
        "Each panel reads the same error history",
        fontsize=13,
        color=NEUTRAL,
        va="top",
        ha="right",
    )
    return chalk.save(fig, out / "03_pid_terms.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=OUT, help="output folder")
    args = parser.parse_args()
    chalk.use()
    for path in (servo(args.out), pid_terms(args.out)):
        print(path)


if __name__ == "__main__":
    main()
