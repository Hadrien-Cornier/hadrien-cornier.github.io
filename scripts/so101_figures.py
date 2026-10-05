#!/usr/bin/env python3
"""Generate the static figures for the SO-101 blog series."""

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.ticker
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle, Circle
import numpy as np


OUTPUT_DIR = Path("/Users/HCornier/Documents/Personal/Hadrien-Cornier/assets/robotics/so101-series")
DATA_ROOT = Path("/Users/HCornier/Documents/Personal/LeRobot/robot-self-calibration/.claude/worktrees")

INK = "#1f2933"
MUTED = "#6b7280"
BLUE = "#1d4ed8"
ORANGE = "#c2410c"
TEAL = "#0f766e"
RED = "#dc2626"
PURPLE = "#7c3aed"
YELLOW = "#eab308"
LIGHT_BLUE = "#94a3b8"
PALE = "#f3f4f6"
GRID = "#e5e7eb"

CONTROLLER = {
    "direct": "#6b7280",
    "lead": "#94a3b8",
    "inv": "#0f766e",
    "pi": "#1d4ed8",
    "solve": "#7c3aed",
    "mpc": "#c2410c",
    "network": "#dc2626",
}
MODEL = {
    "Fitted": "#0f766e",
    "Classical": "#1d4ed8",
    "Exact": "#94a3b8",
    "Out of the box": "#6b7280",
}


def set_style():
    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "font.size": 11,
        "axes.titlesize": 13,
        "axes.labelsize": 11,
        "xtick.labelsize": 11,
        "ytick.labelsize": 11,
        "text.color": INK,
        "axes.labelcolor": INK,
        "axes.edgecolor": MUTED,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "savefig.facecolor": "white",
        "savefig.edgecolor": "white",
        "axes.grid": False,
        "grid.color": GRID,
        "grid.linewidth": 0.7,
        "grid.alpha": 1.0,
        "legend.frameon": False,
    })


def clean_axis(ax, grid=None):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(MUTED)
    ax.spines["bottom"].set_color(MUTED)
    ax.tick_params(colors=MUTED, length=3)
    if grid:
        ax.grid(True, axis=grid, color=GRID, linewidth=0.7)
        ax.set_axisbelow(True)


def save_figure(fig, filename):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUTPUT_DIR / filename, dpi=200, facecolor="white")
    plt.close(fig)


def add_arrow(ax, start, end, color=INK, lw=1.5, mutation_scale=12, connectionstyle="arc3"):
    arrow = FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=mutation_scale,
        linewidth=lw, color=color, connectionstyle=connectionstyle,
    )
    ax.add_patch(arrow)
    return arrow


def draw_box(ax, xy, width, height, text, edge=INK, face="white", fontsize=11,
             linewidth=1.4, textcolor=INK, radius=0.08, zorder=2):
    patch = Rectangle(
        xy, width, height, facecolor=face, edgecolor=edge, linewidth=linewidth,
        joinstyle="round", zorder=zorder,
    )
    ax.add_patch(patch)
    ax.text(xy[0] + width / 2, xy[1] + height / 2, text,
            ha="center", va="center", fontsize=fontsize, color=textcolor,
            linespacing=1.25, zorder=zorder + 1)
    return patch


def setup_diagram(ax, xlim=(0, 8), ylim=(0, 4)):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_aspect("auto")
    ax.axis("off")


def simulate_joint(kind, dt=0.002, duration=1.5):
    inertia = 0.02
    gravity = 0.391
    physical_damping = 0.2
    kp = 13.64
    ki = 20.0 if kind == "pi" else 0.0
    kd = 1.0 if kind == "pd" else 0.0
    time = np.arange(0.0, duration + dt / 2, dt)
    state = np.zeros(3, dtype=float)  # position, speed, integrated error
    goal = 0.1

    def derivative(y):
        q, speed, integral = y
        error = goal - q
        torque = kp * error - kd * speed + ki * integral
        acceleration = (torque - physical_damping * speed - gravity) / inertia
        return np.array([speed, acceleration, error])

    positions = np.empty_like(time)
    for index, _ in enumerate(time):
        positions[index] = state[0]
        if index == len(time) - 1:
            break
        k1 = derivative(state)
        k2 = derivative(state + 0.5 * dt * k1)
        k3 = derivative(state + 0.5 * dt * k2)
        k4 = derivative(state + dt * k3)
        state = state + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6
    return time, positions


def map_errors():
    labels = [
        "Cat motion: direct, 30 Hz", "Cat motion: pi, 60 Hz",
        "Cat motion: solve, 60 Hz", "Cat motion: mpc, 60 Hz",
        "Signature motion: direct", "Signature motion: lead",
        "Signature motion: inv",
    ]
    values = [22.5, 8.4, 6.2, 6.0, 28.3, 23.7, 13.4]
    controllers = ["direct", "pi", "solve", "mpc", "direct", "lead", "inv"]
    y = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.barh(y, values, height=0.64,
            color=[CONTROLLER[name] for name in controllers], zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 34)
    ax.set_xlabel("RMS tracking error (mrad)")
    ax.set_title("Real arm: tracking error by controller", loc="left", pad=13, weight="bold")
    ax.axhline(3.5, color=GRID, lw=1.2)
    for yi, value in zip(y, values):
        ax.text(value + 0.55, yi, f"{value:.1f}", va="center", fontsize=11, color=INK)
    clean_axis(ax, "x")
    fig.text(0.125, 0.035, "RMS over all 5 joints and the whole motion.",
             fontsize=11, color=MUTED)
    fig.subplots_adjust(left=0.34, right=0.96, top=0.86, bottom=0.16)
    save_figure(fig, "map-errors.png")


def pid_parts():
    fig, axes = plt.subplots(1, 3, figsize=(9.5, 5.0), sharex=True, sharey=True)
    panels = [
        ("p", "P: spring", r"$\tau=13.64(goal-q)$"),
        ("pd", "P + D: spring in\nhoney", r"$\tau=13.64(goal-q)-v$"),
        ("pi", "P + I: spring that keeps\npushing",
         r"$\tau=13.64(goal-q)$" + "\n" + r"$+20\int e\,dt$"),
    ]
    for ax, (kind, title, equation) in zip(axes, panels):
        time, q = simulate_joint(kind)
        ax.plot(time, q * 1000, color=BLUE, lw=2.1, label="joint position q")
        ax.axhline(100, color=ORANGE, lw=1.5, ls="--", label="goal")
        ax.text(0.04, 0.92, equation, transform=ax.transAxes, fontsize=11,
                color=MUTED, va="top", linespacing=1.2,
                bbox={"facecolor": "white", "edgecolor": "none", "alpha": 0.88, "pad": 1.5})
        ax.set_title(title, fontsize=11, weight="bold", pad=8, linespacing=1.05)
        ax.set_xlim(0, 1.5)
        ax.set_ylim(-5, 125)
        ax.set_xlabel("time (s)")
        clean_axis(ax, "y")
    axes[0].set_ylabel("joint angle (mrad)")
    axes[0].legend(loc="lower right", fontsize=9.5)
    fig.suptitle("A gravity-loaded joint responds to a goal step", x=0.08, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.text(0.5, 0.035, "Teaching model, not the real servo.",
             ha="center", fontsize=11, color=MUTED)
    fig.subplots_adjust(left=0.09, right=0.99, top=0.79, bottom=0.18, wspace=0.20)
    save_figure(fig, "pid-parts.png")


def two_loops():
    fig, ax = plt.subplots(figsize=(8, 3.5))
    setup_diagram(ax, (0, 8), (0, 3.5))
    outer = Rectangle((0.18, 1.18), 3.12, 1.83, fill=False, ec=BLUE, lw=1.6)
    inner = Rectangle((3.56, 1.18), 4.25, 1.83, fill=False, ec=TEAL, lw=1.6)
    ax.add_patch(outer)
    ax.add_patch(inner)
    ax.text(1.74, 3.12, "Computer, 30 or 60 Hz (outer loop)", ha="center",
            va="bottom", fontsize=11.5, weight="bold", color=BLUE)
    ax.text(5.68, 3.12, "Servo firmware (inner loop, fast)", ha="center",
            va="bottom", fontsize=11.5, weight="bold", color=TEAL)
    outer_boxes = [(0.38, "target"), (1.43, "controller"), (2.48, "goal")]
    for x, text in outer_boxes:
        draw_box(ax, (x, 1.82), 0.72, 0.55, text, edge=BLUE, face="#eff6ff", fontsize=10.5)
    add_arrow(ax, (1.10, 2.095), (1.40, 2.095), BLUE)
    add_arrow(ax, (2.15, 2.095), (2.45, 2.095), BLUE)
    servo_boxes = [
        (3.74, 0.83, "gap = goal\n- encoder"), (4.63, 0.62, "P/D"),
        (5.37, 0.67, "motor\npower"), (6.16, 0.86, "motor +\ngearbox"),
        (7.12, 0.53, "joint"),
    ]
    for x, width, text in servo_boxes:
        draw_box(ax, (x, 1.84), width, 0.5, text, edge=TEAL, face="#ecfdf5", fontsize=9.7)
    for start, end in [(4.57, 4.61), (5.25, 5.35), (6.04, 6.14), (7.04, 7.10)]:
        add_arrow(ax, (start, 2.09), (end, 2.09), TEAL, lw=1.3, mutation_scale=10)
    add_arrow(ax, (3.20, 2.08), (3.70, 2.08), BLUE)
    draw_box(ax, (6.72, 0.42), 0.98, 0.48, "encoder\n(ticks)", edge=PURPLE,
             face="#f5f3ff", fontsize=10)
    add_arrow(ax, (7.38, 1.82), (7.22, 0.92), PURPLE, connectionstyle="angle3,angleA=-90,angleB=180")
    ax.plot([6.72, 5.00, 5.00], [0.66, 0.66, 1.80], color=PURPLE, lw=1.3)
    add_arrow(ax, (5.00, 1.12), (5.00, 1.80), PURPLE, lw=1.3)
    ax.plot([7.70, 7.83, 7.83, 1.78], [0.66, 0.66, 0.20, 0.20], color=PURPLE, lw=1.2)
    add_arrow(ax, (1.78, 0.20), (1.78, 1.78), PURPLE, lw=1.2)
    ax.text(3.82, 0.17, "encoder feedback", ha="center", va="bottom", fontsize=9.5, color=MUTED)
    fig.suptitle("Two feedback loops run at different speeds", x=0.04, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.99, top=0.80, bottom=0.06)
    save_figure(fig, "two-loops.png")


def servo_inside():
    fig, ax = plt.subplots(figsize=(8, 5.0))
    setup_diagram(ax, (0, 8), (0, 5))
    case = Rectangle((0.48, 0.76), 6.65, 3.75, facecolor="#f9fafb", edgecolor=INK, lw=1.8)
    ax.add_patch(case)
    ax.text(0.68, 4.27, "case", fontsize=11, weight="bold", color=INK)
    draw_box(ax, (0.82, 2.55), 1.12, 0.88, "DC motor", edge=ORANGE,
             face="#fff7ed", fontsize=11)
    draw_box(ax, (2.28, 2.44), 1.44, 1.08, "gear train", edge=BLUE,
             face="#eff6ff", fontsize=11)
    ax.add_patch(Rectangle((3.72, 2.82), 2.20, 0.22, facecolor=LIGHT_BLUE,
                           edgecolor=INK, lw=1.0))
    ax.text(4.70, 3.24, "output shaft", ha="center", fontsize=10.5, color=INK)
    ax.add_patch(Circle((5.08, 2.93), 0.18, facecolor=YELLOW, edgecolor=INK, lw=1.0))
    ax.text(5.08, 2.54, "magnet on\nthe shaft", ha="center", va="top", fontsize=9.8)
    draw_box(ax, (5.80, 3.30), 0.94, 0.55, "magnetic\nencoder chip", edge=PURPLE,
             face="#f5f3ff", fontsize=9.5)
    draw_box(ax, (2.32, 1.02), 2.34, 0.82, "control board\nMCU runs P/D loop", edge=TEAL,
             face="#ecfdf5", fontsize=10.5)
    add_arrow(ax, (1.96, 2.98), (2.24, 2.98), ORANGE)
    add_arrow(ax, (3.74, 2.98), (3.95, 2.98), BLUE)
    add_arrow(ax, (5.38, 3.98), (5.88, 3.84), PURPLE, connectionstyle="arc3,rad=-0.2")
    ax.plot([4.66, 5.08], [1.72, 2.74], color=TEAL, lw=1.2, ls="--")
    ax.plot([5.08, 6.24], [2.74, 2.74], color=TEAL, lw=1.2, ls="--")
    draw_box(ax, (5.80, 1.02), 1.18, 0.82,
             "serial bus\ncommands in: goal\nreadings out: position", edge=MUTED,
             face="white", fontsize=8.8)
    add_arrow(ax, (4.70, 1.43), (5.76, 1.43), TEAL)
    ax.text(3.95, 0.36, "Simplified cutaway of a smart servo", ha="center",
            fontsize=10.5, color=MUTED)
    fig.suptitle("Inside a smart servo (STS3215, simplified)", x=0.05, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.98, top=0.88, bottom=0.04)
    save_figure(fig, "servo-inside.png")


def calibration_columns():
    fig, ax = plt.subplots(figsize=(8, 5.0))
    setup_diagram(ax, (0, 8), (0, 5))
    ax.text(1.95, 4.82, "What LeRobot calibration stores\n(per motor)", ha="center",
            va="center", fontsize=12.5, weight="bold", color=INK)
    ax.text(5.95, 4.82, "What the controllers needed", ha="center",
            va="center", fontsize=12.5, weight="bold", color=TEAL)
    left = ["id", "drive_mode", "homing_offset", "range_min", "range_max"]
    right = ["stiffness kp", "damping d", "dead time", "dead band",
             "dry friction", "gravity by pose", "servo lag"]
    for index, text in enumerate(left):
        y = 3.88 - index * 0.72
        draw_box(ax, (0.62, y), 2.66, 0.52, text, edge="#9ca3af", face="#f3f4f6",
                 fontsize=11)
    for index, text in enumerate(right):
        y = 4.08 - index * 0.55
        draw_box(ax, (4.52, y), 2.86, 0.43, text, edge=TEAL, face="white",
                 fontsize=11, linewidth=1.5)
    ax.text(3.90, 2.45, "≠", fontsize=26, ha="center", va="center", color=MUTED)
    fig.suptitle("Calibration fields do not describe servo dynamics", x=0.05, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.97, top=0.91, bottom=0.04)
    save_figure(fig, "calibration-columns.png")


def error_vs_kp():
    kp = np.linspace(8, 60, 400)
    error = 32.2 * (13.64 / kp) + 5.0
    all_scaled = 37.2 * 13.64 / kp
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.plot(kp, error, color=TEAL, lw=2.5, label=r"$e(k_p)=32.2(13.64/k_p)+5.0$")
    ax.plot(kp, all_scaled, color=LIGHT_BLUE, lw=1.8, ls=":",
            label=r"if all error scaled with $1/k_p$: $37.2(13.64/k_p)$")
    ax.axhline(5.0, color=ORANGE, lw=1.5, ls="--",
               label="goal hold, does not depend on kp")
    points = [
        (13.64, 37.2, "nominal", BLUE, (16.5, 13.0)),
        (12.31, 40.5, "weak_supply", RED, (16.0, 47.0)),
        (22.1, 24.8, "stiff_servo", PURPLE, (29.0, 33.0)),
    ]
    for x, y, label, color, offset in points:
        ax.scatter(x, y, s=55, color=color, edgecolor="white", linewidth=0.7, zorder=4)
        ax.annotate(f"{label} ({x:g}, {y:g})", (x, y), xytext=offset,
                    textcoords="data", fontsize=10, color=INK,
                    arrowprops={"arrowstyle": "->", "color": color, "lw": 1.2,
                                "shrinkA": 4, "shrinkB": 5})
    ax.set_xlim(8, 60)
    ax.set_ylim(0, 66)
    ax.set_xlabel(r"servo stiffness $k_p$ (N m/rad)")
    ax.set_ylabel("tracking error (mrad)")
    ax.set_title("A stiffer servo cannot remove every error", loc="left", pad=12, weight="bold")
    clean_axis(ax, "y")
    ax.legend(loc="upper right", fontsize=9.5)
    fig.text(0.125, 0.035, "Simulation, Out of the box controller.",
             fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.97, top=0.88, bottom=0.17)
    save_figure(fig, "error-vs-kp.png")


def tick_rounding():
    time = np.linspace(0, 10, 1001)
    true_angle = time * 0.8 + 0.1
    reading = np.round(true_angle)
    error = reading - true_angle
    fig, axes = plt.subplots(2, 1, figsize=(8, 5.4), sharex=True,
                             gridspec_kw={"height_ratios": [1.1, 1]})
    axes[0].plot(time, true_angle, color=BLUE, lw=2, label="true angle")
    axes[0].step(time, reading, where="mid", color=ORANGE, lw=1.8,
                 label="reading, rounded to nearest tick")
    axes[0].set_ylabel("angle (tick)")
    axes[0].legend(loc="upper left", fontsize=9.5, ncol=2)
    axes[1].plot(time, error, color=TEAL, lw=1.7)
    axes[1].fill_between(time, -1 / np.sqrt(12), 1 / np.sqrt(12), color=YELLOW,
                         alpha=0.20, label=r"$\pm1/\sqrt{12}=\pm0.289$ tick")
    axes[1].axhline(0, color=MUTED, lw=0.8)
    axes[1].set_ylim(-0.58, 0.58)
    axes[1].set_ylabel("reading error (tick)")
    axes[1].set_xlabel("time (tick intervals)")
    axes[1].legend(loc="upper right", fontsize=9.5)
    axes[1].text(0.02, 0.10, "RMS = 1/sqrt(12) tick = 0.443 mrad",
                 transform=axes[1].transAxes, color=INK, fontsize=10.5,
                 bbox={"facecolor": "white", "edgecolor": "none", "alpha": 0.85})
    for ax in axes:
        clean_axis(ax, "y")
    fig.suptitle("Encoder rounding creates a bounded reading error", x=0.08, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.12, right=0.98, top=0.88, bottom=0.12, hspace=0.22)
    save_figure(fig, "tick-rounding.png")


def three_delays():
    fig, axes = plt.subplots(2, 1, figsize=(8, 6.0))
    t = np.linspace(0, 450, 901)
    dead_time = 33.0
    tau = 95.0
    response = np.where(t < dead_time, 0.0,
                        100 * (1 - np.exp(-(t - dead_time) / tau)))
    axes[0].axvspan(0, dead_time, color=YELLOW, alpha=0.24)
    axes[0].plot(t, response, color=BLUE, lw=2.2, label="joint response")
    axes[0].axhline(100, color=MUTED, lw=1.2, ls="--", label="goal")
    axes[0].axvline(dead_time, color=ORANGE, lw=1.2, ls=":")
    axes[0].scatter([dead_time + tau], [63.2], color=TEAL, zorder=4)
    axes[0].annotate("dead time\n33 ms", (16, 8), ha="center", fontsize=10, color=INK)
    axes[0].annotate("lag\n95 ms to 63%", (dead_time + tau, 63.2),
                     xytext=(42, -28), textcoords="offset points", fontsize=10,
                     arrowprops={"arrowstyle": "->", "color": TEAL}, color=TEAL)
    axes[0].set_xlim(-15, 450)
    axes[0].set_ylim(-5, 112)
    axes[0].set_ylabel("response (% of goal)")
    axes[0].set_xlabel("time after goal step (ms)")
    axes[0].legend(loc="lower right", fontsize=9.5)
    clean_axis(axes[0], "y")

    t2 = np.linspace(0, 300, 1201)
    target = 0.45 * t2
    axes[1].plot(t2, target, color=INK, lw=1.8, label="ramp target")
    for period, color, label in [(1000 / 30, BLUE, "goal hold, 30 Hz"),
                                 (1000 / 60, TEAL, "goal hold, 60 Hz")]:
        updates = np.arange(0, 300 + period, period)
        held = 0.45 * updates
        valid = updates <= 300
        axes[1].step(updates[valid], held[valid], where="post", color=color,
                     lw=1.6, label=label)
    axes[1].text(0.02, 0.91,
                 "Average goal age: 16.7 ms at 30 Hz; 8.3 ms at 60 Hz",
                 transform=axes[1].transAxes, va="top", fontsize=10.2, color=INK,
                 bbox={"facecolor": "white", "edgecolor": GRID, "boxstyle": "round,pad=0.3"})
    axes[1].set_xlim(0, 300)
    axes[1].set_ylabel("target angle (mrad)")
    axes[1].set_xlabel("time (ms)")
    axes[1].legend(loc="lower right", fontsize=9.5, ncol=3)
    clean_axis(axes[1], "y")
    fig.suptitle("Dead time, servo lag, and goal hold are different delays", x=0.08, y=0.99,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.12, right=0.98, top=0.88, bottom=0.09, hspace=0.37)
    save_figure(fig, "three-delays.png")


def dead_time_ranges():
    labels = ["step test (real arm)", "per-joint servo fit (real arm)", "first simulator"]
    ranges = [(31, 36), (15.6, 26.6), (0, 0)]
    y = np.arange(3)
    fig, ax = plt.subplots(figsize=(8, 3.8))
    for yi, (lo, hi) in zip(y, ranges):
        if hi == lo:
            ax.scatter([lo], [yi], s=90, color=LIGHT_BLUE, edgecolor=INK, zorder=3)
            ax.text(lo + 1.1, yi, "about 0", va="center", fontsize=11)
        else:
            ax.hlines(yi, lo, hi, color=TEAL if yi == 1 else BLUE, linewidth=8, zorder=3)
            ax.vlines([lo, hi], yi - 0.14, yi + 0.14,
                      color=TEAL if yi == 1 else BLUE, linewidth=1.5)
            ax.text((lo + hi) / 2, yi - 0.27, f"{lo:g} to {hi:g}",
                    ha="center", va="bottom", fontsize=11)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(-3, 43)
    ax.set_ylim(2.65, -0.65)
    ax.set_xlabel("dead time (ms)")
    ax.set_title("Measured dead time differs from the first simulator", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.34, right=0.97, top=0.85, bottom=0.18)
    save_figure(fig, "dead-time-ranges.png")


def lag_on_path():
    path = DATA_ROOT / "blog-renders/media/blog-renders/inputs/cat-direct.npz"
    with np.load(path) as data:
        time_all = data["time_s"]
        q_all = data["q"][:, 1]
        target_all = data["target_q"][:, 1]
    duration = 6.0
    sample_step = float(np.median(np.diff(time_all)))
    starts = np.arange(time_all[0], time_all[-1] - duration, sample_step)
    start = max(starts, key=lambda value: np.ptp(
        q_all[(time_all >= value) & (time_all <= value + duration)]))
    end = start + duration
    mask = (time_all >= start) & (time_all <= end)
    time = time_all[mask]
    q = q_all[mask]
    target = target_all[mask]
    dt = float(np.median(np.diff(time)))
    uniform_time = np.arange(time[0], time[-1], dt)
    target_uniform = np.interp(uniform_time, time, target)
    q_uniform = np.interp(uniform_time, time, q)
    target_velocity = np.gradient(target_uniform, dt)
    q_velocity = np.gradient(q_uniform, dt)
    target_velocity -= target_velocity.mean()
    q_velocity -= q_velocity.mean()
    corr = np.correlate(q_velocity, target_velocity, mode="full")
    lags = np.arange(-len(target_velocity) + 1, len(target_velocity))
    allowed = np.abs(lags) <= int(0.75 / dt)
    lag_samples = int(lags[allowed][np.argmax(corr[allowed])])
    lag_s = lag_samples * dt
    print(f"lag-on-path cross-correlation: shoulder_lift is about {lag_s * 1000:.0f} ms late")

    fig, ax = plt.subplots(figsize=(8, 4.5))
    relative_time = time - start
    ax.plot(relative_time, np.rad2deg(target), color=BLUE, lw=1.8, label="target")
    ax.plot(relative_time, np.rad2deg(q), color=ORANGE, lw=1.6, label="shoulder_lift")
    feature_time = float(relative_time[np.argmax(np.abs(np.gradient(target, dt)))])
    delayed_feature_time = feature_time + lag_s
    y_annot = np.nanmax(np.rad2deg(target)) + 2.0
    if lag_s > 0:
        ax.annotate("", xy=(delayed_feature_time, y_annot), xytext=(feature_time, y_annot),
                    arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 1.6})
        ax.text((feature_time + delayed_feature_time) / 2, y_annot + 2.5,
                f"about {abs(lag_s) * 1000:.0f} ms late", ha="center",
                fontsize=10, color=PURPLE)
    else:
        ax.text(0.5, 0.88, "Target and joint velocity align in this window",
                transform=ax.transAxes, fontsize=10, color=PURPLE,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.set_xlim(0, 6)
    ax.set_xlabel("time (s)")
    ax.set_ylabel("shoulder_lift angle (degrees)")
    ax.set_title("Real arm, direct control: the joint runs behind the target",
                 loc="left", pad=12, weight="bold")
    ax.legend(loc="lower right", fontsize=10)
    clean_axis(ax, "y")
    fig.subplots_adjust(left=0.13, right=0.98, top=0.85, bottom=0.17)
    save_figure(fig, "lag-on-path.png")


def friction_band():
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.set_xlim(-1.2, 1.3)
    ax.set_ylim(0, 50)
    ax.axhspan(14.3, 43.0, color=TEAL, alpha=0.16)
    ax.axvline(0, color=INK, lw=2)
    ax.axhline(28.7, color=PURPLE, ls="--", lw=1.7)
    ax.scatter([0, 0, 0], [14.3, 28.7, 43.0], color=[BLUE, PURPLE, ORANGE], zorder=4)
    ax.text(0.12, 43.0, r"$(G+f)/k_p=43.0$ mrad", va="center", fontsize=10.5)
    ax.text(0.12, 30.0, r"$G/k_p=28.7$ mrad", va="bottom", fontsize=10.5, color=PURPLE,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.text(0.12, 14.3, r"$(G-f)/k_p=14.3$ mrad", va="center", fontsize=10.5)
    ax.annotate("approach from below: friction adds to gravity,\nservo gives G + f",
                xy=(0, 43), xytext=(-1.05, 35.8), ha="left", va="center",
                fontsize=9.7, color=ORANGE,
                arrowprops={"arrowstyle": "-|>", "color": ORANGE, "lw": 1.5})
    ax.annotate("approach from above: friction carries part of the load,\nservo gives G - f",
                xy=(0, 14.3), xytext=(-1.05, 5.3), ha="left", va="center",
                fontsize=9.7, color=BLUE,
                arrowprops={"arrowstyle": "-|>", "color": BLUE, "lw": 1.5})
    ax.set_xticks([])
    ax.set_ylabel("servo gap (mrad)")
    ax.set_title("Dry friction creates a band of possible hold positions",
                 loc="left", pad=12, weight="bold")
    clean_axis(ax)
    ax.spines["bottom"].set_visible(False)
    ax.text(0.02, 0.02, "Simulation: G = 0.391 N m, f = 0.196 N m, kp = 13.64 N m/rad",
            transform=ax.transAxes, fontsize=9.7, color=MUTED)
    fig.subplots_adjust(left=0.11, right=0.97, top=0.85, bottom=0.14)
    save_figure(fig, "friction-band.png")


def worn_hold_motion():
    fig, axes = plt.subplots(1, 2, figsize=(8, 4.5))
    ax = axes[0]
    vals = [14.0, 0.7]
    bars = ax.bar([0, 1], vals, width=0.58, color=[BLUE, ORANGE])
    ax.set_xticks([0, 1], ["healthy", "worn"])
    ax.set_ylabel("sag (mrad)")
    ax.set_title("On a hold\n(sag after 0.17 s)", fontsize=12, weight="bold")
    ax.set_ylim(0, 18)
    for bar, value in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 0.5, f"{value:g}",
                ha="center", fontsize=11)
    ax.text(0.5, 0.88, "friction helps", transform=ax.transAxes, ha="center",
            color=TEAL, fontsize=11, weight="bold")
    clean_axis(ax, "y")

    ax = axes[1]
    categories = ["friction", "damping"]
    healthy, worn = [14.4, 54], [36, 81]
    x = np.arange(2)
    width = 0.32
    bars1 = ax.bar(x - width / 2, healthy, width, label="healthy", color=BLUE)
    bars2 = ax.bar(x + width / 2, worn, width, label="worn", color=ORANGE)
    ax.set_xticks(x, categories)
    ax.set_ylabel("tracking error (mrad)")
    ax.set_title("In motion at 0.7 rad/s", fontsize=12, weight="bold")
    ax.set_ylim(0, 98)
    for bars in (bars1, bars2):
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
                    f"{bar.get_height():g}", ha="center", fontsize=10)
    ax.text(0.77, 0.91, "friction hurts", transform=ax.transAxes, ha="center",
            color=RED, fontsize=11, weight="bold")
    ax.legend(loc="upper left", fontsize=9.5, bbox_to_anchor=(0.0, 0.98))
    clean_axis(ax, "y")
    fig.suptitle("More friction can help a hold and hurt motion", x=0.06, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.text(0.5, 0.035, "Simulation. Worn friction is 2.5 times the healthy value.",
             ha="center", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.10, right=0.98, top=0.84, bottom=0.19, wspace=0.34)
    save_figure(fig, "worn-hold-motion.png")


def friction_models():
    velocity = np.linspace(-0.3, 0.3, 601)
    f_c = 0.196
    damping = 1.058
    fig, axes = plt.subplots(2, 2, figsize=(8, 6.0), sharex=True, sharey=True)

    ax = axes[0, 0]
    coulomb = f_c * np.sign(velocity) + damping * velocity
    ax.plot(velocity, coulomb, color=BLUE, lw=1.8)
    ax.set_title("Coulomb + viscous", fontsize=12, weight="bold")
    ax.text(0.04, 0.91, "f = 0.196, d = 1.058", transform=ax.transAxes,
            va="top", fontsize=9.8, color=MUTED)

    ax = axes[0, 1]
    f_s, v_s = 0.3, 0.02
    stribeck = (f_c + (f_s - f_c) * np.exp(-(velocity / v_s) ** 2)) * np.sign(velocity) + damping * velocity
    ax.plot(velocity, stribeck, color=ORANGE, lw=1.8)
    ax.set_title("Stiction + Stribeck", fontsize=12, weight="bold")
    ax.text(0.04, 0.91, "fs = 0.3, fc = 0.196, vs = 0.02, plus viscous",
            transform=ax.transAxes, va="top", fontsize=9.2, color=MUTED)

    ax = axes[1, 0]
    dt = 0.002
    duration = 20.0
    time = np.arange(0, duration, dt)
    speed = 0.3 * np.sin(2 * np.pi * time / duration)
    z = 0.0
    lugre_friction = np.empty_like(time)
    sigma0, sigma1 = 100.0, 1.0
    for index, v in enumerate(speed):
        g = (f_c + (f_s - f_c) * np.exp(-(v / v_s) ** 2)) / sigma0
        zdot = v - abs(v) * z / max(g, 1e-8)
        lugre_friction[index] = sigma0 * z + sigma1 * zdot + damping * v
        z += dt * zdot
    ax.plot(speed, lugre_friction, color=TEAL, lw=1.5)
    ax.set_title("LuGre: memory", fontsize=12, weight="bold")
    ax.text(0.04, 0.91, "sigma0 = 100, sigma1 = 1; slow reversal",
            transform=ax.transAxes, va="top", fontsize=9.5, color=MUTED)

    ax = axes[1, 1]
    for load, color in zip([0, 0.5, 1.0], [LIGHT_BLUE, PURPLE, RED]):
        friction = (f_c + 0.4 * abs(load)) * np.sign(velocity) + damping * velocity
        ax.plot(velocity, friction, color=color, lw=1.6, label=f"|tau| = {load:g} N m")
    ax.set_title("Load-dependent", fontsize=12, weight="bold")
    ax.legend(loc="lower right", fontsize=8.8)

    for ax in axes.flat:
        ax.axhline(0, color=GRID, lw=0.8)
        ax.axvline(0, color=GRID, lw=0.8)
        ax.set_xlim(-0.3, 0.3)
        ax.set_ylim(-1.0, 1.0)
        clean_axis(ax, "y")
    axes[1, 0].set_xlabel("speed (rad/s)")
    axes[1, 1].set_xlabel("speed (rad/s)")
    axes[0, 0].set_ylabel("friction torque (N m)")
    axes[1, 0].set_ylabel("friction torque (N m)")
    fig.suptitle("Four models describe friction in different ways", x=0.07, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.text(0.5, 0.025, "Teaching curves with simulator-scale numbers.",
             ha="center", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.12, right=0.98, top=0.87, bottom=0.12,
                        hspace=0.36, wspace=0.25)
    save_figure(fig, "friction-models.png")


def heat_torque():
    temperature = np.linspace(20, 80, 400)
    copper_alpha = 0.00393
    torque_percent = 100 / (1 + copper_alpha * (temperature - 25))
    fig, ax = plt.subplots(figsize=(8, 4.7))
    ax.plot(temperature, torque_percent, color=ORANGE, lw=2.7)
    ax.scatter([25], [100], color=BLUE, s=60, zorder=4)
    ax.annotate("100% at 25 °C", (25, 100), xytext=(10, 20),
                textcoords="offset points", fontsize=10.5, color=BLUE,
                arrowprops={"arrowstyle": "->", "color": BLUE})
    ax.text(0.97, 0.12, "explained, not measured\non my arm", transform=ax.transAxes,
            ha="right", va="bottom", fontsize=13, weight="bold", color=INK,
            bbox={"facecolor": "white", "edgecolor": GRID, "boxstyle": "round,pad=0.45"})
    ax.set_xlim(20, 80)
    ax.set_ylim(75, 104)
    ax.set_xlabel("winding temperature (°C)")
    ax.set_ylabel("torque available (% of 25 °C value)")
    ax.set_title("Heat reduces torque at constant voltage", loc="left", pad=12, weight="bold")
    clean_axis(ax, "y")
    ax.text(0.03, 0.04, "Copper resistance rises about 0.4% per °C.",
            transform=ax.transAxes, fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.14, right=0.97, top=0.86, bottom=0.17)
    save_figure(fig, "heat-torque.png")


def torque_limit():
    inertia = 0.06
    speed = 0.6
    wall_position = 0.1
    late_torque = 7.0
    early_torque = 3.0
    late_accel = late_torque / inertia
    early_accel = early_torque / inertia
    late_distance = speed**2 / (2 * late_accel)
    early_distance = speed**2 / (2 * early_accel)
    late_ms = late_distance / speed * 1000
    early_ms = early_distance / speed * 1000
    time = np.linspace(-8, 0, 401)
    late_curve = np.where(time >= -late_ms, late_torque, 0.0)
    early_curve = np.where(time >= -early_ms, early_torque, 0.0)

    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.plot(time, late_curve, color=RED, lw=2.2,
            label=f"late brake, {late_torque:g} N m")
    ax.plot(time, early_curve, color=TEAL, lw=2.2,
            label=f"early brake, {early_torque:g} N m")
    ax.axhline(5.107, color=RED, ls="--", lw=1.7, label="torque clamp = 5.107 N m")
    ax.axvline(0, color=INK, lw=1.5)
    ax.text(0, 7.5, "wall", ha="right", va="bottom", fontsize=10.5, color=INK)
    ax.text(-5.6, 5.8, f"late brake needs {late_torque:g} N m",
            color=RED, fontsize=10,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.annotate(f"early brake needs {early_torque:g} N m", (-early_ms, early_torque),
                xytext=(-110, 18), textcoords="offset points", color=TEAL, fontsize=10)
    ax.set_xlim(-8, 0.6)
    ax.set_ylim(-0.2, 8.3)
    ax.set_xlabel("time before wall (ms)")
    ax.set_ylabel("braking torque required (N m)")
    ax.set_title("Late braking can exceed the servo torque limit", loc="left",
                 pad=12, weight="bold")
    ax.legend(loc="upper left", fontsize=9.2)
    clean_axis(ax, "y")
    fig.text(0.08, 0.035,
             "A planner that sees the stop coming can brake early and stay under the torque limit. J = 0.06 kg m².",
             fontsize=9.8, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.97, top=0.85, bottom=0.19)
    save_figure(fig, "torque-limit.png")


def constants_dumbbell():
    rows = [
        ("stiffness kp", "N m/rad", 13.64, 15.6, 16.5, 18),
        ("damping d", "N m s/rad", 1.058, 1.66, 1.77, 2.0),
        ("damping ratio", "ratio", 0.68, 1.15, 1.20, 1.35),
        ("dead time", "ms", 0.0, 31, 36, 42),
        ("lag", "ms", 78, 87, 105, 120),
        ("dead band", "mrad", 0.0, 8.1, 21.0, 24),
    ]
    fig, axes = plt.subplots(len(rows), 1, figsize=(9, 8.4))
    for ax, (name, unit, sim, lo, hi, xmax) in zip(axes, rows):
        ax.axvspan(lo, hi, color=TEAL, alpha=0.22, zorder=1)
        ax.hlines(0, lo, hi, color=TEAL, lw=7, zorder=2)
        ax.scatter([sim], [0], facecolor="white", edgecolor=BLUE, s=72,
                   linewidth=2, zorder=4)
        ax.set_xlim(0, xmax)
        ax.set_ylim(-0.8, 0.8)
        ax.set_yticks([0], [f"{name} ({unit})"])
        ax.tick_params(axis="y", length=0, pad=10, labelsize=11)
        ax.set_xlabel(f"{name} ({unit})", labelpad=1, fontsize=11)
        ax.grid(True, axis="x", color=GRID, linewidth=0.65)
        ax.set_axisbelow(True)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_visible(False)
        ax.tick_params(axis="x", labelsize=11, colors=MUTED, length=2)
        ax.text(0.01, 0.82, f"simulator: {sim:g}", transform=ax.transAxes,
                ha="left", va="top", fontsize=11, color=BLUE,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
        ax.text(0.99, 0.82, f"real range: {lo:g} to {hi:g}", transform=ax.transAxes,
                ha="right", va="top", fontsize=11, color=TEAL,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    fig.suptitle("Simulator against my real arm", x=0.08, y=0.99,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.35, right=0.98, top=0.93, bottom=0.07, hspace=0.84)
    save_figure(fig, "constants-dumbbell.png")


def accel_pipelines():
    fig, ax = plt.subplots(figsize=(8, 4.2))
    setup_diagram(ax, (0, 8), (0, 4.2))
    ax.text(0.22, 3.64, "Encoder-based estimate", fontsize=12, weight="bold", color=RED)
    boxes_top = [(0.3, 1.45, "encoder\nticks"), (2.55, 1.55, "difference\ntwice"),
                 (4.95, 2.70, "noisy acceleration\n(one tick at 30 Hz = 1.4 rad/s²)")]
    for x, width, label in boxes_top:
        draw_box(ax, (x, 2.61), width, 0.72, label, edge=RED, face="#fef2f2", fontsize=10.4)
    add_arrow(ax, (1.80, 2.97), (2.51, 2.97), RED)
    add_arrow(ax, (4.12, 2.97), (4.91, 2.97), RED)
    ax.text(0.22, 1.84, "Target-path estimate", fontsize=12, weight="bold", color=TEAL)
    boxes_bottom = [(0.3, 1.68, "planned\ntarget path"), (2.55, 1.55, "exact\nderivative"),
                    (4.95, 2.70, "clean acceleration")]
    for x, width, label in boxes_bottom:
        draw_box(ax, (x, 0.78), width, 0.72, label, edge=TEAL, face="#ecfdf5", fontsize=10.8)
    add_arrow(ax, (2.00, 1.14), (2.51, 1.14), TEAL)
    add_arrow(ax, (4.12, 1.14), (4.91, 1.14), TEAL)
    ax.text(6.40, 0.34, "inv, solve and mpc use this one", ha="center",
            fontsize=10.2, color=TEAL)
    fig.suptitle("Controllers can estimate acceleration from different signals", x=0.05, y=0.98,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.82, bottom=0.06)
    save_figure(fig, "accel-pipelines.png")


def one_step_gain():
    tau = -0.0333 / np.log(0.85)
    time = np.linspace(0, 0.0333, 401)
    response = 1 - np.exp(-time / tau)
    fig, axes = plt.subplots(1, 2, figsize=(8, 4.6))
    axes[0].plot(time * 1000, response, color=TEAL, lw=2.4, label="joint response")
    axes[0].axhline(1, color=BLUE, ls="--", lw=1.4, label="goal: 1 tick")
    axes[0].scatter([33.3], [0.15], color=ORANGE, zorder=4)
    axes[0].annotate("0.15 tick after 33 ms", (33.3, 0.15), xytext=(-105, 25),
                     textcoords="offset points", fontsize=9.8,
                     arrowprops={"arrowstyle": "->", "color": ORANGE})
    axes[0].set_xlim(0, 35)
    axes[0].set_ylim(0, 1.15)
    axes[0].set_xlabel("time after goal step (ms)")
    axes[0].set_ylabel("joint motion (tick)")
    axes[0].set_title("A 1-tick goal step", fontsize=12, weight="bold")
    axes[0].legend(loc="center right", fontsize=9)
    clean_axis(axes[0], "y")

    axes[1].bar([0, 1], [7, 1], width=0.56, color=[ORANGE, TEAL])
    axes[1].set_xticks([0, 1], ["goal jump", "joint motion\nafter 33 ms"])
    axes[1].set_ylim(0, 8.2)
    axes[1].set_ylabel("angle change (tick)")
    axes[1].set_title("To move 1 tick in one step", fontsize=12, weight="bold")
    axes[1].text(0, 7.25, "about 7", ha="center", fontsize=11, weight="bold")
    axes[1].text(1, 1.25, "1", ha="center", fontsize=11, weight="bold")
    clean_axis(axes[1], "y")
    fig.suptitle("A slow servo needs a larger goal change", x=0.07, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.11, right=0.98, top=0.84, bottom=0.19, wspace=0.33)
    save_figure(fig, "one-step-gain.png")


def observer_step():
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.set_xlim(9.2, 13.4)
    ax.set_ylim(-0.2, 3.4)
    ax.axhline(1.05, color=GRID, lw=2)
    values = [(10.0, "last estimate\n10.0", MUTED, 0.45),
              (11.2, "prediction\n11.2", BLUE, 1.46),
              (11.64, "corrected estimate\n11.64", TEAL, 0.45),
              (12.3, "reading\n12.3", ORANGE, 1.46)]
    for x, label, color, y in values:
        ax.scatter([x], [1.05], s=75, color=color, zorder=4)
        ax.text(x, y, label, ha="center", va="center", fontsize=10.5, color=color)
    ax.annotate("", xy=(12.3, 2.25), xytext=(11.2, 2.25),
                arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 1.6})
    ax.text(11.75, 2.47, "innovation = 1.1", ha="center", fontsize=10.5, color=PURPLE)
    ax.text(9.42, 3.13, "1 predict", fontsize=10.5, weight="bold", color=BLUE)
    ax.text(10.95, 3.13, "2 compare", fontsize=10.5, weight="bold", color=PURPLE)
    ax.text(12.26, 3.13, "3 correct", fontsize=10.5, weight="bold", color=TEAL)
    ax.text(11.60, 0.05, "11.2 + 0.4 × 1.1; alpha = 0.4", ha="center",
            fontsize=10.5, color=INK)
    ax.set_yticks([])
    ax.set_xlabel("joint angle (mrad)")
    ax.set_title("One observer step: predict, compare, correct", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", left=False, labelleft=False)
    fig.subplots_adjust(left=0.08, right=0.98, top=0.85, bottom=0.17)
    save_figure(fig, "observer-step.png")


def two_observers():
    fig, axes = plt.subplots(1, 2, figsize=(8, 5.0))
    titles = ["State observer", "Disturbance observer"]
    descriptions = [
        "true angle and speed\n(state observer, alpha-beta filter)",
        "missing force: a tool, a sag\n(disturbance observer: w in solve and mpc,\nKalman filter in mpca)",
    ]
    for ax, title, description, color in zip(axes, titles, descriptions, [BLUE, TEAL]):
        setup_diagram(ax, (0, 4), (0, 5))
        ax.text(2, 4.58, title, ha="center", fontsize=12, weight="bold", color=color)
        draw_box(ax, (0.16, 3.35), 1.12, 0.64, "model\npredict", edge=color,
                 face="white", fontsize=10)
        draw_box(ax, (1.53, 3.35), 1.08, 0.64, "compare\nwith reading", edge=color,
                 face="white", fontsize=9.8)
        draw_box(ax, (2.86, 3.35), 1.00, 0.64, "correct", edge=color,
                 face="white", fontsize=10)
        add_arrow(ax, (1.30, 3.67), (1.50, 3.67), color, lw=1.2, mutation_scale=9)
        add_arrow(ax, (2.63, 3.67), (2.83, 3.67), color, lw=1.2, mutation_scale=9)
        ax.plot([3.36, 3.36, 0.70], [3.30, 2.87, 2.87], color=color, lw=1.2)
        add_arrow(ax, (0.70, 2.87), (0.70, 3.30), color, lw=1.2, mutation_scale=9)
        draw_box(ax, (0.35, 1.15), 3.30, 1.00, description, edge=color,
                 face="#f8fafc", fontsize=10.1)
        add_arrow(ax, (3.36, 3.33), (3.36, 2.19), color, lw=1.2, mutation_scale=9)
        ax.text(0.25, 0.45, "reading", fontsize=9.7, color=MUTED)
        add_arrow(ax, (0.63, 0.58), (1.00, 3.30), MUTED, lw=1.0, mutation_scale=8)
    fig.suptitle("Observers estimate different hidden quantities", x=0.06, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.89, bottom=0.04, wspace=0.04)
    save_figure(fig, "two-observers.png")


def inv_goal():
    root = DATA_ROOT / "hw-ready/runs/so101-replay"
    records = [
        ("direct", root / "20261003-194838-live/01-direct.npz"),
        ("inv", root / "20261003-195246-live/01-inv.npz"),
    ]
    fig, axes = plt.subplots(2, 1, figsize=(8, 6.0), sharex=True)
    for ax, (controller, path) in zip(axes, records):
        with np.load(path) as data:
            t_all = data["time_s"]
            mask = (t_all >= 62) & (t_all <= 66)
            t = t_all[mask] - 62
            target = np.rad2deg(data["target_q"][mask, 1])
            q = np.rad2deg(data["q"][mask, 1])
            goal = np.rad2deg(data["goal_sent"][mask, 1])
        if controller == "direct":
            ax.plot(t, goal, color=TEAL, lw=1.6, label="goal_sent")
            ax.plot(t, target, color=BLUE, lw=1.7, ls="--", label="target", zorder=4)
        else:
            ax.plot(t, target, color=BLUE, lw=1.7, label="target")
            ax.plot(t, goal, color=TEAL, lw=1.6, label="goal_sent")
        ax.plot(t, q, color=ORANGE, lw=1.6, label="shoulder_lift")
        ax.set_ylabel("angle (degrees)")
        ax.set_title(controller, loc="left", fontsize=11.5, weight="bold", color=CONTROLLER[controller])
        clean_axis(ax, "y")
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=3, fontsize=9.5,
               bbox_to_anchor=(0.55, 0.93), frameon=False)
    axes[1].set_xlabel("time (s), window starts at 62 s")
    fig.suptitle("inv puts the goal ahead of the target", x=0.08, y=0.99,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.11, right=0.98, top=0.82, bottom=0.11, hspace=0.30)
    save_figure(fig, "inv-goal.png")


def pi_five():
    fig, ax = plt.subplots(figsize=(8, 4.5))
    setup_diagram(ax, (0, 8), (0, 4.5))
    ax.text(4, 4.03, "A gap split across the inner and outer loops", ha="center",
            fontsize=13, weight="bold", color=INK)
    segments = [(0.40, 1.34, "e servo spring", LIGHT_BLUE),
                (1.80, 3.52, "4e\nouter P", BLUE),
                (5.40, 2.20, "offset", PALE)]
    for x, width, label, color in segments:
        ax.add_patch(Rectangle((x, 2.43), width, 0.73, facecolor=color,
                               edgecolor=INK, lw=1.1))
        ax.text(x + width / 2, 2.79, label, ha="center", va="center",
                fontsize=11, color="white" if color == BLUE else INK, weight="bold")
    ax.text(0.40, 2.06, "gap = e", fontsize=10, color=MUTED)
    ax.text(1.80, 2.06, "+ 4e", fontsize=10, color=MUTED)
    ax.text(5.40, 2.06, "+ offset", fontsize=10, color=MUTED)
    ax.text(4, 1.24, "goal - q = 5e + offset", ha="center", fontsize=15,
            weight="bold", color=INK)
    ax.text(4, 0.54,
            "stiffness against a missing torque: 13.64 × 5 = 68.2 N m/rad",
            ha="center", fontsize=12, color=TEAL)
    fig.suptitle("The outer P loop multiplies the apparent servo stiffness", x=0.06, y=0.98,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.97, top=0.82, bottom=0.06)
    save_figure(fig, "pi-five.png")


def deadband_cost():
    goal = np.linspace(80, 170, 901)
    joint, target, deadband = 100.0, 115.0, 10.0
    next_position = np.where(np.abs(goal - joint) <= deadband,
                             joint, goal - deadband * np.sign(goal - joint))
    cost = (next_position - target) ** 2
    fig, ax = plt.subplots(figsize=(8, 4.6))
    ax.plot(goal, cost, color=BLUE, lw=2.3)
    ax.axvspan(90, 110, color=YELLOW, alpha=0.22)
    ax.scatter([125], [0], color=RED, s=75, zorder=4)
    ax.annotate("minimum at 125 mrad", (125, 0), xytext=(15, 28),
                textcoords="offset points", fontsize=10.5, color=RED,
                arrowprops={"arrowstyle": "->", "color": RED})
    ax.annotate("flat: a gradient method\nstarting here does not move",
                xy=(100, 225), xytext=(82, 620), fontsize=10.2, color=INK,
                arrowprops={"arrowstyle": "->", "color": MUTED})
    ax.set_xlim(80, 170)
    ax.set_ylim(-45, 1250)
    ax.set_xlabel("constant goal (mrad)")
    ax.set_ylabel("cost after one step (mrad²)")
    ax.set_title("A dead band makes the goal search locally flat", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax, "y")
    fig.subplots_adjust(left=0.14, right=0.97, top=0.86, bottom=0.17)
    save_figure(fig, "deadband-cost.png")


def real_arm_joints():
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.7), gridspec_kw={"width_ratios": [2.4, 1]})
    joints = ["pan", "lift", "elbow", "wrist flex", "roll"]
    values = {
        "pi": [6.6, 10.8, 11.0, 7.0, 4.9],
        "solve": [3.2, 7.4, 6.7, 8.7, 2.8],
        "mpc": [3.0, 7.0, 6.1, 8.6, 2.8],
    }
    ax = axes[0]
    x = np.arange(len(joints))
    width = 0.24
    for index, name in enumerate(["pi", "solve", "mpc"]):
        bars = ax.bar(x + (index - 1) * width, values[name], width,
                      color=CONTROLLER[name], label=name)
        for bar_index, bar in enumerate(bars):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.2,
                    f"{bar.get_height():g}", ha="center", va="bottom", fontsize=7.8)
    ax.set_xticks(x, joints, rotation=0)
    ax.set_ylabel("RMS tracking error (mrad)")
    ax.set_ylim(0, 14.2)
    ax.legend(loc="upper left", ncol=3, fontsize=9)
    clean_axis(ax, "y")
    ax = axes[1]
    speed_names = ["pi", "solve", "mpc"]
    speeds = [11.7, 14.2, 13.4]
    bars = ax.bar(np.arange(3), speeds, color=[CONTROLLER[n] for n in speed_names], width=0.65)
    ax.set_xticks(np.arange(3), speed_names)
    ax.set_ylim(0, 17.5)
    ax.set_ylabel("RMS error, fastest speed bin (mrad)")
    ax.set_title("At the fastest speeds", fontsize=11.5, weight="bold")
    for bar, value in zip(bars, speeds):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 0.35, f"{value:g}",
                ha="center", fontsize=10)
    clean_axis(ax, "y")
    fig.suptitle("Real arm, cat motion, 60 Hz", x=0.07, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.11, right=0.98, top=0.84, bottom=0.18, wspace=0.45)
    save_figure(fig, "real-arm-joints.png")


def sim_five():
    labels = ["Out of the box", "Classical model + PID", "Neural network",
              "Fitted servo model", "Exact model"]
    values = [37.2, 1.117, 0.446, 0.398, 0.398]
    colors = [MODEL["Out of the box"], MODEL["Classical"], RED,
              MODEL["Fitted"], MODEL["Exact"]]
    y = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    ax.barh(y, values, color=colors, height=0.62, zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xscale("log")
    ax.set_xlim(0.25, 70)
    ax.axvline(0.443, color=ORANGE, ls="--", lw=1.7, label="one-reading rounding RMS")
    for yi, value in zip(y, values):
        if value < 0.443:
            ax.text(0.443 * 1.13, yi, f"{value:g}", va="center", ha="left",
                    fontsize=10.5, color=INK,
                    bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0},
                    zorder=5)
        else:
            ax.text(value * (0.93 if value > 20 else 1.08), yi, f"{value:g}",
                va="center", ha="right" if value > 20 else "left", fontsize=10.5)
    ax.text(0.443 * 1.13, 4.42, "0.443", fontsize=9.5, color=ORANGE,
            ha="left", bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.set_xlabel("RMS tracking error (mrad, log scale)")
    ax.set_title("A model-based controller approaches the rounding floor",
                 loc="left", pad=12, weight="bold", fontsize=12.2)
    ax.legend(loc="lower right", fontsize=9.5)
    clean_axis(ax, "x")
    fig.text(0.31, 0.035, "Simulation, frozen test, 96 paths.", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.31, right=0.97, top=0.86, bottom=0.17)
    save_figure(fig, "sim-five.png")


def hold_torque():
    kp = 13.64
    speed = 0.84
    duration_ms = 33.0
    final_torque = 0.886
    start_torque = 1.27
    time_ms = np.linspace(0, duration_ms, 300)
    torque = start_torque - (start_torque - final_torque) * time_ms / duration_ms
    classical = np.full_like(time_ms, final_torque)
    fig, ax = plt.subplots(figsize=(8, 4.6))
    ax.plot(time_ms, torque, color=TEAL, lw=2.4,
            label=r"servo torque $k_p(goal-q(t))$")
    ax.plot(time_ms, classical, color=BLUE, lw=1.8, ls="--",
            label="Classical assumption, 0.886 N m")
    ax.fill_between(time_ms, classical, torque, color=ORANGE, alpha=0.22,
                    label="extra torque Classical did not plan")
    ax.scatter([0, duration_ms], [start_torque, final_torque], color=[ORANGE, TEAL], zorder=4)
    ax.annotate("1.27 N m", (0, start_torque), xytext=(10, 8),
                textcoords="offset points", fontsize=10, color=ORANGE)
    ax.annotate("0.886 N m", (duration_ms, final_torque), xytext=(-78, -24),
                textcoords="offset points", fontsize=10, color=TEAL)
    ax.set_xlim(0, duration_ms)
    ax.set_ylim(0.78, 1.36)
    ax.set_xlabel("time inside the step (ms)")
    ax.set_ylabel("servo torque (N m)")
    ax.set_title("The servo torque changes during one held goal", loc="left",
                 pad=12, weight="bold")
    ax.legend(loc="upper right", fontsize=9.4)
    clean_axis(ax, "y")
    ax.text(0.02, 0.05, "Joint speed = 0.84 rad/s. The goal updates every 33 ms.",
            transform=ax.transAxes, fontsize=10, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.97, top=0.85, bottom=0.17)
    save_figure(fig, "hold-torque.png")


def hindsight_label():
    fig, ax = plt.subplots(figsize=(8, 4.2))
    ax.set_xlim(85, 165)
    ax.set_ylim(-0.3, 3.2)
    ax.axhline(1.12, color=GRID, lw=2)
    points = [(100, "reading q = 100", BLUE, 0.35),
              (110, "next reading q' = 110", TEAL, 2.58),
              (150, "goal sent u = 150", ORANGE, 0.35)]
    for x, label, color, y in points:
        ax.scatter([x], [1.12], color=color, s=70, zorder=4)
        ax.text(x, y, label, ha="center", va="center", fontsize=10.2, color=color)
    ax.annotate("", xy=(110, 2.05), xytext=(100, 2.05),
                arrowprops={"arrowstyle": "<->", "color": TEAL, "lw": 1.5})
    ax.text(105, 1.84, "joint moved 10", ha="center", fontsize=11, color=TEAL,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.annotate("", xy=(150, 2.95), xytext=(110, 2.95),
                arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 1.5})
    ax.text(130, 3.10, "label = u - q' = 40", ha="center", fontsize=11, color=PURPLE)
    ax.set_yticks([])
    ax.set_xlabel("encoder position (tick)")
    ax.set_title("The next reading changes the training label", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", left=False, labelleft=False)
    fig.subplots_adjust(left=0.07, right=0.98, top=0.85, bottom=0.17)
    save_figure(fig, "hindsight-label.png")


def network_io():
    fig, ax = plt.subplots(figsize=(8, 4.8))
    setup_diagram(ax, (0, 8), (0, 4.8))
    ax.text(0.56, 4.18, "inputs", fontsize=11, weight="bold", color=MUTED)
    input_labels = ["q (reading)", r"$r_k$", r"$r_{k+1}$", "past goal"]
    input_ys = [3.48, 2.87, 2.26, 1.05]
    for label, y in zip(input_labels, input_ys):
        draw_box(ax, (0.35, y), 1.52, 0.42, label, edge=BLUE,
                 face="#eff6ff", fontsize=10.2)
    draw_box(ax, (3.05, 2.78), 1.54, 0.75, "small\nnetwork", edge=RED,
             face="#fef2f2", fontsize=11, linewidth=1.6)
    draw_box(ax, (5.42, 2.94), 1.30, 0.48, "offset", edge=TEAL,
             face="#ecfdf5", fontsize=10.8)
    for y in input_ys[:3]:
        add_arrow(ax, (1.89, y + 0.21), (2.99, 3.16), BLUE, lw=1.0, mutation_scale=9)
    ax.plot([1.89, 2.15, 2.15, 2.70], [1.26, 1.26, 2.62, 2.62], color=MUTED, lw=1.0)
    add_arrow(ax, (2.28, 2.62), (2.98, 3.00), MUTED, lw=1.0, mutation_scale=9)
    add_arrow(ax, (4.61, 3.15), (5.38, 3.15), TEAL)
    ax.text(3.82, 2.12,
            r"$step^*=(r_{k+1}-r_k)+0.75(r_k-q)$",
            ha="center", fontsize=11, color=INK,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.text(5.58, 1.45, r"$goal=q+step^*+offset+3I$",
            ha="center", fontsize=12, weight="bold", color=INK)
    fig.suptitle("A small network predicts an offset to a model-based step", x=0.05, y=0.98,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.06)
    save_figure(fig, "network-io.png")


def nn_vs_fitted():
    labels = ["holds", "moving paths"]
    intervals = [(0.83, 0.99), (1.05, 1.70)]
    y = np.arange(2)
    fig, ax = plt.subplots(figsize=(8, 3.8))
    ax.axvline(1.0, color=INK, lw=1.5, ls="--", label="same as Fitted")
    for yi, (lo, hi) in zip(y, intervals):
        ax.hlines(yi, lo, hi, color=RED, lw=8, zorder=3)
        ax.vlines([lo, hi], yi - 0.13, yi + 0.13, color=RED, lw=1.5)
        ax.text((lo + hi) / 2, yi - 0.19, f"{lo:.2f} to {hi:.2f}",
                ha="center", va="top", fontsize=10.5)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0.65, 1.9)
    ax.set_ylim(1.55, -0.55)
    ax.set_xlabel("network error / Fitted error (ratio)")
    ax.set_title("The network helps on holds but not on every moving path",
                 loc="left", pad=12, weight="bold")
    ax.legend(loc="upper right", fontsize=9.8)
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.22, right=0.97, top=0.84, bottom=0.19)
    save_figure(fig, "nn-vs-fitted.png")


def sensitivity():
    labels = ["solve, right lag", "solve, 30% wrong lag", "pi, right lag", "pi, 30% wrong lag"]
    values = [2.3, 4.1, 6.7, 7.9]
    colors = [CONTROLLER["solve"], CONTROLLER["solve"], CONTROLLER["pi"], CONTROLLER["pi"]]
    ratios = ["", "×1.78", "", "×1.18"]
    y = np.arange(4)
    fig, ax = plt.subplots(figsize=(8, 4.1))
    ax.barh(y, values, color=colors, height=0.62, zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 10)
    for yi, value, ratio in zip(y, values, ratios):
        ax.text(value + 0.2, yi, f"{value:g}  {ratio}", va="center", fontsize=10.5)
    ax.set_xlabel("tracking error (mrad)")
    ax.set_title("Solve is more sensitive than pi to a wrong lag", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.30, right=0.97, top=0.85, bottom=0.17)
    save_figure(fig, "sensitivity.png")


def data_curves():
    minutes = np.array([1.1, 2.1, 4.1, 8.3, 15.9])
    series = {
        "P0, servo model": ([30.6, 19.0, 9.8, 7.8, 7.4],
                            [5.8, 8.1, 0.9, 0.6, 0.0], BLUE, "o"),
        "P0 + observer": ([12.9, 4.7, 4.1, 3.8, 3.7],
                           [8.2, 1.0, 0.1, 0.1, 0.0], TEAL, "D"),
        "N0, network only": ([12.0, 11.0, 7.8, 5.5, 3.9],
                             [0.4, 1.4, 0.7, 0.3, 0.1], RED, "s"),
        "H2o, residual on P0 + observer": ([10.7, 5.3, 4.5, 3.6, 3.0],
                                            [4.9, 1.1, 0.4, 0.2, 0.1], PURPLE, "^"),
    }
    fig, ax = plt.subplots(figsize=(8, 4.8))
    for label, (error, spread, color, marker) in series.items():
        ax.errorbar(minutes, error, yerr=spread, color=color, marker=marker,
                    lw=1.7, ms=6.5, capsize=3, label=label)
    ax.set_xscale("log")
    ax.set_xticks([1, 2, 4, 8, 16], ["1", "2", "4", "8", "16"])
    ax.set_yscale("log")
    ax.set_yticks([3, 5, 10, 20, 30], ["3", "5", "10", "20", "30"])
    ax.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
    ax.set_xlim(0.9, 19)
    ax.set_ylim(2.6, 45)
    ax.set_xlabel("real data (minutes, log scale)")
    ax.set_ylabel("offline R200 error (mrad, log scale)")
    ax.set_title("With little data, the physics model alone overfits", loc="left",
                 pad=12, weight="bold")
    ax.legend(loc="center right", fontsize=8.8, bbox_to_anchor=(1.0, 0.78))
    clean_axis(ax, "both")
    fig.text(0.5, 0.035,
             "Real-arm logs, offline error over 0.2 s, mean of 3 seeds.",
             ha="center", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.15, right=0.98, top=0.85, bottom=0.19)
    save_figure(fig, "data-curves.png")


def residual():
    fig, axes = plt.subplots(1, 2, figsize=(8, 4.8), gridspec_kw={"width_ratios": [1.08, 1.4]})
    ax = axes[0]
    setup_diagram(ax, (0, 4.6), (0, 4.8))
    draw_box(ax, (0.12, 3.13), 2.05, 0.72, "servo model\n+ observer, frozen",
             edge=BLUE, face="#eff6ff", fontsize=10.2)
    draw_box(ax, (0.12, 1.88), 1.88, 0.72, "small GRU\nlearns residual",
             edge=RED, face="#fef2f2", fontsize=10.2)
    draw_box(ax, (2.60, 2.50), 1.62, 0.86, "combined\nprediction",
             edge=TEAL, face="#ecfdf5", fontsize=10.5)
    add_arrow(ax, (2.02, 3.48), (2.54, 3.00), BLUE)
    add_arrow(ax, (2.02, 2.22), (2.54, 2.77), RED)
    ax.text(2.28, 2.92, "+", ha="center", va="center", fontsize=18, color=INK)
    ax.text(2.15, 1.62, "residual", ha="center", fontsize=9.5, color=RED)
    ax.text(2.15, 0.85, "physics + learned correction", ha="center",
            fontsize=9.3, color=MUTED)

    ax = axes[1]
    methods = ["N0", "P0", "H2o"]
    offline = [3.90, 3.70, 3.01]
    closed = [5.50, 2.76, 3.12]
    x = np.arange(3)
    width = 0.34
    bars1 = ax.bar(x - width / 2, offline, width, color=BLUE, label="offline error")
    bars2 = ax.bar(x + width / 2, closed, width, color=ORANGE,
                   label="stand-in closed loop")
    for bars in (bars1, bars2):
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.1,
                    f"{bar.get_height():.2f}", ha="center", fontsize=9.3)
    ax.set_xticks(x, methods)
    ax.set_ylim(0, 6.8)
    ax.set_ylabel("tracking error (mrad)")
    ax.legend(loc="upper right", fontsize=8.9)
    clean_axis(ax, "y")
    fig.text(0.5, 0.045, "P0 = servo model + observer.", ha="center",
             fontsize=9.5, color=MUTED)
    fig.suptitle("A learned residual improves the combined prediction", x=0.05, y=0.98,
                 ha="left", fontsize=13.2, weight="bold", color=INK)
    fig.subplots_adjust(left=0.04, right=0.98, top=0.84, bottom=0.21, wspace=0.20)
    save_figure(fig, "residual.png")


def known_timeline():
    rows = [
        ("1960", "Kalman filter", "observer, mpca"),
        ("1981", "computed torque", "Classical model + PID"),
        ("1984", "Arimoto iterative learning control", "ilc"),
        ("1987", "Slotine and Li adaptive control", "adapt, rls"),
        ("1990s-2000s", "MPC and offset-free MPC", "solve, mpc, mpca"),
    ]
    fig, ax = plt.subplots(figsize=(8, 5.2))
    setup_diagram(ax, (0, 10), (0, 6))
    ax.text(0.35, 5.52, "Year", fontsize=11, weight="bold", color=MUTED)
    ax.text(2.20, 5.52, "Method", fontsize=11, weight="bold", color=MUTED)
    ax.text(7.10, 5.52, "Lab controllers", fontsize=11, weight="bold", color=MUTED)
    ax.plot([0.30, 9.70], [5.35, 5.35], color=GRID, lw=1.2)
    for index, (year, method, lab) in enumerate(rows):
        y = 4.85 - index * 0.88
        ax.text(0.35, y, year, fontsize=11, color=INK, va="center", weight="bold")
        ax.text(2.20, y, method, fontsize=11, color=INK, va="center")
        ax.text(7.10, y, f"lab: {lab}", fontsize=11, color=MUTED, va="center")
        if index < len(rows) - 1:
            ax.plot([0.30, 9.70], [y - 0.43, y - 0.43], color=GRID, lw=0.8)
    ax.text(0.35, 0.22, "Years are approximate.", fontsize=11, color=MUTED)
    fig.suptitle("Control methods behind the lab controllers", x=0.06, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.98, top=0.88, bottom=0.05)
    save_figure(fig, "known-timeline.png")


def speed_coupling():
    """Speed coupling against gravity on shoulder_lift, MuJoCo SO-101 at the real reach pose (inverse dynamics)."""
    import sys

    import mujoco

    sys.path.insert(0, str(DATA_ROOT / "blog-renders" / "src"))
    from robot_calibration.so101 import robot as so101_robot

    model = so101_robot.build_spec(so101_robot.plant_for("nominal")).compile()
    data = mujoco.MjData(model)
    kp = float(model.actuator_gainprm[1][0])
    reach = np.array([0.0, 0.1, 0.23, 0.0, 0.0])  # real reach-out hold, collection F25, pan and roll at 0

    def bias(velocity):
        # qfrc_bias = C(q, qdot) qdot + G(q): no damping, friction or acceleration
        data.qpos[:] = 0
        data.qvel[:] = 0
        data.qpos[:5] = reach
        data.qvel[:5] = velocity
        mujoco.mj_forward(model, data)
        return data.qfrc_bias[:5].copy()

    gravity = bias(np.zeros(5))
    speeds = np.linspace(0.02, 4.5, 200)
    pan = np.array([abs(bias(np.array([w, 0, 0, 0, 0]))[1] - gravity[1]) for w in speeds]) / kp * 1000
    pair = np.array([abs(bias(np.array([0, w, w, 0, 0]))[1] - gravity[1]) for w in speeds]) / kp * 1000
    sag = abs(gravity[1]) / kp * 1000
    tick = 1.534
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.axvspan(0, 1.1, color=PALE, zorder=0)
    ax.text(0.55, 150, "speeds in my\nreal recordings", ha="center", va="top", fontsize=10, color=MUTED)
    ax.axhline(sag, color=ORANGE, lw=2.2)
    ax.text(4.45, sag * 1.15, f"gravity sag {sag:.0f} mrad", ha="right", va="bottom", fontsize=10.5, color=ORANGE)
    ax.axhline(tick, color=MUTED, lw=1.2, ls="--")
    ax.text(4.45, tick * 1.15, "1 encoder tick", ha="right", va="bottom", fontsize=10, color=MUTED)
    ax.plot(speeds, pan, color=BLUE, lw=2.4, label="base (pan) spins")
    ax.plot(speeds, pair, color=TEAL, lw=2.2, ls="-.", label="lift and elbow move together")
    at = float(np.interp(1.1, speeds, pan))
    ax.scatter([1.1], [at], color=BLUE, zorder=4)
    ax.annotate(f"{at:.2f} mrad at 1.1 rad/s", (1.1, at), xytext=(14, -4), textcoords="offset points",
                fontsize=10, color=BLUE, va="top")
    ax.set_yscale("log")
    ax.set_ylim(0.01, 200)
    ax.set_xlim(0, 4.5)
    ax.set_xlabel("joint speed (rad/s)")
    ax.set_ylabel("shoulder_lift error it causes (mrad)")
    ax.set_title("Speed coupling is real, but small on this arm", loc="left", pad=12, weight="bold")
    ax.legend(loc="lower right", fontsize=9.6)
    clean_axis(ax, "y")
    fig.text(0.13, 0.015, f"Simulated SO-101 (MuJoCo), arm reaching out. Torque converted to mrad by kp = {kp:.2f} N m/rad.",
             fontsize=9.2, color=MUTED)
    fig.subplots_adjust(left=0.12, right=0.97, top=0.88, bottom=0.17)
    save_figure(fig, "speed-coupling.png")
    print(f"speed coupling: sag {sag:.1f} mrad, pan {at:.2f} mrad and lift+elbow "
          f"{float(np.interp(1.1, speeds, pair)):.2f} mrad at 1.1 rad/s; at 4.5 rad/s {pan[-1]:.1f} and {pair[-1]:.1f}")


def main():
    set_style()
    figures = [
        map_errors, pid_parts, two_loops, servo_inside, calibration_columns,
        error_vs_kp, tick_rounding, three_delays, dead_time_ranges, lag_on_path,
        friction_band, worn_hold_motion, friction_models, heat_torque,
        torque_limit, constants_dumbbell, accel_pipelines, one_step_gain,
        observer_step, two_observers, inv_goal, pi_five, deadband_cost,
        real_arm_joints, sim_five, hold_torque, hindsight_label, network_io,
        nn_vs_fitted, sensitivity, data_curves, residual, known_timeline, speed_coupling,
    ]
    for make_figure in figures:
        make_figure()
        print(f"wrote {make_figure.__name__}")


if __name__ == "__main__":
    main()
