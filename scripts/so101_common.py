"""Shared constants and helpers for the SO-101 series figures (parts 1 to 4).

The figures use the shared chalk style in assets/robotics/chalk/. Each color
name below keeps the meaning it had in the light figures, so the same
controller has the same chalk color in every part.
"""

import os
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.ticker
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle, Circle
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUTPUT_DIR = ROOT / "assets/robotics/so101-series"
# Small extracts of the recorded runs that some figures plot, with their provenance.
DATA_DIR = ROOT / "scripts/so101_data"
# The robot-self-calibration checkout, only needed to rebuild the extracts in DATA_DIR.
SOURCE_ROOT = Path(os.environ.get("SO101_SOURCE", Path.home() / "Robotics/LeRobot/robot-self-calibration"))

INK = chalk.CHALK
MUTED = chalk.DIM
BLUE = chalk.BLUE
ORANGE = chalk.RED
TEAL = chalk.GREEN
RED = chalk.PINK
PURPLE = chalk.LAVENDER
YELLOW = chalk.YELLOW
LIGHT_BLUE = chalk.SLATE
PALE = chalk.BOARD_2
GRID = chalk.FAINT
BOARD = chalk.BOARD

CONTROLLER = {
    "direct": chalk.DIM,
    "lead": chalk.SLATE,
    "inv": chalk.GREEN,
    "pi": chalk.BLUE,
    "solve": chalk.LAVENDER,
    "mpc": chalk.RED,
    "network": chalk.PINK,
}
MODEL = {
    "Fitted": chalk.GREEN,
    "Classical": chalk.BLUE,
    "Exact": chalk.SLATE,
    "Out of the box": chalk.DIM,
}


def set_style():
    chalk.use()


def save_figure(fig, filename):
    # The .svg panel next to each PNG is the figure on the long-form canvas of its article.
    chalk.save(fig, OUTPUT_DIR / filename, panel=True)


def clean_axis(ax, grid=None):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(MUTED)
    ax.spines["bottom"].set_color(MUTED)
    ax.tick_params(colors=MUTED, length=3)
    if grid:
        ax.grid(True, axis=grid, color=GRID, linewidth=0.7)
        ax.set_axisbelow(True)


def add_arrow(ax, start, end, color=INK, lw=1.9, mutation_scale=16, connectionstyle="arc3"):
    arrow = FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=mutation_scale,
        linewidth=lw, color=color, connectionstyle=connectionstyle,
    )
    ax.add_patch(arrow)
    return arrow


def draw_box(ax, xy, width, height, text, edge=INK, face=BOARD, fontsize=15,
             linewidth=1.8, textcolor=INK, radius=0.08, zorder=2):
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
