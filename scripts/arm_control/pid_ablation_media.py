"""Chalk versions of the two PID ablation videos and their posters in the arm-control article.

Figures (under assets/robotics/arm-control/v4/):
    pid_ablation_comparison.mp4 and pid_ablation_comparison.png
    why_integral_helps.mp4 and why_integral_helps.png

Adapted from github.com/Hadrien-Cornier/maniskill-playground, commit 81e2a65,
experiments/pid-ablation/pid_ablation.py (plotting part only). The script does
not run the simulation again: it reads the saved traces
experiments/pid-ablation/results/traces.npz and the parameters in
experiments/pid-ablation/results/metrics.json of that checkout. The source
hash in metrics.json matches pid_ablation.py at that commit. Frame count (289),
frame rate (24 fps), the 2x playback of 24 simulated seconds, every label and
every printed number are the same as in the source. The changes are the chalk
style (assets/robotics/chalk) and a tall layout for a 358 px phone column
(960 px wide frames, no font under 13 pt): the four panels of the ablation
video are stacked, each error readout moves to the right end of its panel
header, and the integral video puts its arm and readouts above its two
stacked charts. Colors map by meaning: teal -> GREEN, orange -> RED,
purple -> LAVENDER, crimson -> PINK, the brown load arrow -> YELLOW, and the
gray-green target -> DIM. The y ticks of the integral charts are set to the
values the source showed (0 to 0.8 by 0.2, and -5 to 10 by 5). The error-chart
title says "Red area" where the source said "Orange area", because chalk has no
orange and the area is chalk RED (the article caption says "red area" too).

Run from the blog repository root (Python with matplotlib >= 3.8, numpy,
Pillow, and ffmpeg on PATH):

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/pid_ablation_media.py \
        --source <maniskill-playground checkout>

Add --no-video to make only the two posters, and --out DIR to write somewhere
else than assets/robotics/arm-control.
"""

import argparse
import json
import os
import subprocess
import sys
from collections import deque
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "assets/robotics/chalk"))
import chalk  # noqa: E402

RESULTS = Path("experiments/pid-ablation/results")
# Case colors, old -> chalk by meaning, the same as in the article's other figures:
# teal -> GREEN, orange -> RED, purple -> LAVENDER, crimson -> PINK.
CASES = [
    {"id": "pid", "label": "Full PID", "gains": [16.0, 4.0, 7.0], "color": chalk.GREEN},
    {"id": "no_i", "label": "Remove I", "gains": [16.0, 0.0, 7.0], "color": chalk.RED},
    {"id": "no_d", "label": "Remove D", "gains": [16.0, 4.0, 0.0], "color": chalk.LAVENDER},
    {"id": "no_p", "label": "Remove P", "gains": [0.0, 4.0, 7.0], "color": chalk.PINK},
]
INK, MUTED = chalk.CHALK, chalk.DIM          # were #243747 and #63727a
TARGET_INK = chalk.DIM                       # target line and marker, were #90a59a, #638371, #6c9177
LOAD_INK = chalk.YELLOW                      # clockwise load arrow and line, was #8f4548
I_INK = chalk.RED                            # integral term (orange area, I bar, I text), was #dd862e / #ba6c20

WIDTH = 6.4
VIDEO_DPI = 150
FPS = 24
FRAMES = 289


def line_height(fontsize, lines=1):
    """Height in inches of `lines` lines of Patrick Hand at linespacing 1.0."""
    return lines * 1.333 * fontsize / 72


class Sheet:
    """A figure laid out in inches, with y measured down from the top edge."""

    def __init__(self, height, width=WIDTH):
        # Round the height so that video frames have an even pixel height (yuv420p).
        height = round(height * VIDEO_DPI / 2) * 2 / VIDEO_DPI
        self.w, self.h = width, height
        self.fig = plt.figure(figsize=(width, height))

    def axes(self, left, top, width, height, **kw):
        box = [left / self.w, 1 - (top + height) / self.h, width / self.w, height / self.h]
        return self.fig.add_axes(box, **kw)

    def text(self, x, y, s, **kw):
        kw.setdefault("va", "top")
        kw.setdefault("linespacing", 1.0)
        return self.fig.text(x / self.w, 1 - y / self.h, s, **kw)


def load(source):
    config = json.loads((source / RESULTS / "metrics.json").read_text())
    data = np.load(source / RESULTS / "traces.npz")
    keys = ["t", "q", "velocity", "integral", "error", "P", "I", "D", "torque"]
    traces = {case["id"]: {key: data[f"{case['id']}_{key}"] for key in keys} for case in CASES}
    for case in CASES:
        assert config["metrics"][case["id"]]["gains_Kp_Ki_Kd"] == case["gains"], case["id"]
    return config, traces


def chart(ax):
    ax.grid(True, alpha=0.4)
    ax.set_axisbelow(True)


def arm(ax, q, color, target, scale=1.0):
    """One frame of the rotary link: target (dashed), link, pivot, and the clockwise load arrow."""
    ax.clear()
    ax.set(xlim=(-1.18, 1.18), ylim=(-1.15, 1.18), aspect="equal")
    ax.axis("off")
    goal = np.array([np.cos(target), np.sin(target)])
    actual = np.array([np.cos(q), np.sin(q)])
    ax.plot([0, goal[0]], [0, goal[1]], "--", color=TARGET_INK, lw=3 * scale)
    ax.scatter(*goal, s=70 * scale**2, facecolor=chalk.BOARD, edgecolor=TARGET_INK, lw=2 * scale, zorder=4)
    ax.plot([0, actual[0]], [0, actual[1]], color=color, lw=10 * scale, solid_capstyle="round")
    ax.scatter(*actual, s=95 * scale**2, color=color, edgecolor=chalk.BOARD, lw=1.2 * scale, zorder=5)
    ax.scatter(0, 0, s=95 * scale**2, color=INK, edgecolor=chalk.BOARD, lw=1.5 * scale, zorder=6)
    angle = np.linspace(-0.2, -1.65, 35)
    curve = np.stack([0.31 * np.cos(angle), 0.31 * np.sin(angle)])
    ax.plot(*curve, color=LOAD_INK, lw=1.6)
    ax.annotate("", xy=curve[:, -1], xytext=curve[:, -4],
                arrowprops={"arrowstyle": "->", "lw": 1.8, "color": LOAD_INK})


def drawn_rgb(fig):
    """Draw the figure and return a copy of its RGB pixels."""
    fig.canvas.draw()
    return np.asarray(fig.canvas.buffer_rgba())[..., :3].copy()


def chalk_frame(rgb):
    """The chalk grain of chalk.save(), applied to one video frame (runs in a worker process)."""
    return chalk.chalk_grain(rgb, scale=rgb.shape[1] / 720.0).tobytes()


def write(fig, out, name, draw, duration, video, crf):
    """Encode FRAMES frames over the simulated duration (2x playback), then the last frame as poster.

    The grain is the slow step, so worker processes apply it while this process draws."""
    times = [i / (FRAMES - 1) * duration for i in range(FRAMES)]
    if video:
        fig.patch.set_sketch_params(None)
        fig.set_dpi(VIDEO_DPI)
        draw(times[0])
        first = drawn_rgb(fig)
        height, width, _ = first.shape
        assert width % 2 == 0 and height % 2 == 0, (width, height)
        cmd = [
            "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{width}x{height}", "-r", str(FPS), "-i", "-",
            "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out / f"{name}.mp4"),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        workers = os.cpu_count() or 2
        queue = deque()
        with ProcessPoolExecutor(max_workers=workers) as pool:
            queue.append(pool.submit(chalk_frame, first))
            for i, time in enumerate(times[1:], start=1):
                draw(time)
                queue.append(pool.submit(chalk_frame, drawn_rgb(fig)))
                while len(queue) > 2 * workers:
                    proc.stdin.write(queue.popleft().result())
                if i % 72 == 0:
                    print(f"{name}: {i}/{FRAMES}", flush=True)
            while queue:
                proc.stdin.write(queue.popleft().result())
        proc.stdin.close()
        if proc.wait():
            raise RuntimeError(f"ffmpeg failed for {name}")
    draw(times[-1])
    chalk.save(fig, out / f"{name}.png", tight=False)


def ablation_video(config, traces, out, video):
    target, dt = config["target_rad"], config["dt_s"]
    row_h = 2.08
    top0 = 1.05
    s = Sheet(top0 + 4 * row_h + 0.86)
    s.text(WIDTH / 2, 0.15, "Remove one term. Keep the same arm and load.", fontsize=19,
           color=chalk.YELLOW, ha="center")
    s.text(WIDTH / 2, 0.6, "Dashed target: 45.8°  |  Clockwise load: 2 N·m  |  Start: 0°, at rest",
           fontsize=15, ha="center")
    summaries = [
        "Tracks the target",
        "Steady bias remains",
        "Rings, but eventually settles",
        "Growing oscillations",
    ]
    arms, lines, dots, numbers = [], [], [], []
    for i, case in enumerate(CASES):
        top = top0 + i * row_h
        s.text(0.25, top + 0.3, case["label"], fontsize=18, color=case["color"], va="baseline")
        s.text(1.6, top + 0.3, summaries[i], fontsize=14, color=MUTED, va="baseline")
        ax_arm = s.axes(0.15, top + 0.4, 1.45, 1.45)
        ax = s.axes(2.35, top + 0.45, 3.85, 1.05)
        chart(ax)
        ax.set(xlim=(0, 24), ylim=(-55, 165), yticks=[0, 45.8, 120], xticks=[0, 12, 24])
        ax.axhline(np.rad2deg(target), color=TARGET_INK, linestyle="--", lw=1.2)
        ax.axhspan(np.rad2deg(target * 0.98), np.rad2deg(target * 1.02), color=TARGET_INK, alpha=0.16)
        ax.set_ylabel("Angle (°)", fontsize=14)
        ax.set_xlabel("Time (s)", fontsize=14, labelpad=0)
        (line,) = ax.plot([], [], lw=2.4, color=case["color"])
        (dot,) = ax.plot([], [], "o", color=case["color"], ms=5)
        # The error readout moves from under the arm to the right end of the panel header.
        numbers.append(s.text(6.2, top + 0.3, "", fontsize=15, color=case["color"], ha="right", va="baseline"))
        arms.append(ax_arm)
        lines.append(line)
        dots.append(dot)
    bottom = top0 + 4 * row_h
    clock = s.text(WIDTH / 2, bottom + 0.08, "", ha="center", fontsize=15)
    s.text(WIDTH / 2, bottom + 0.46,
           "Simulated rotary link. Same gains: Kp = 16, Ki = 4, Kd = 7; one is set to zero.",
           ha="center", fontsize=13, color=MUTED)

    def draw(time):
        index = min(round(time / dt), len(traces["pid"]["t"]) - 1)
        for i, case in enumerate(CASES):
            tr = traces[case["id"]]
            arm(arms[i], tr["q"][index], case["color"], target, scale=0.8)
            shown = np.arange(0, index + 1, 8)
            lines[i].set_data(tr["t"][shown], np.rad2deg(tr["q"][shown]))
            dots[i].set_data([time], [np.rad2deg(tr["q"][index])])
            numbers[i].set_text(f"Error: {np.rad2deg(tr['error'][index]):+.1f}°")
        clock.set_text(f"Simulated time: {time:04.1f} s    |    Playback: 2× speed")

    write(s.fig, out, "pid_ablation_comparison", draw, config["duration_s"], video, crf=25)


def integral_video(config, traces, out, video):
    tr = traces["pid"]
    target, dt, load_nm = config["target_rad"], config["dt_s"], config["constant_clockwise_load_Nm"]
    s = Sheet(9.36)
    s.text(WIDTH / 2, 0.15, "Why keep a memory of past error?", fontsize=19, color=chalk.YELLOW, ha="center")
    s.text(WIDTH / 2, 0.6, "A constant load still needs torque after the arm stops.", fontsize=15, ha="center")
    ax_arm = s.axes(0.35, 1.05, 2.3, 2.3)
    current = s.text(4.45, 1.45, "", fontsize=16, ha="center", color=INK, linespacing=1.35)
    clock = s.text(4.45, 2.45, "", ha="center", fontsize=16, linespacing=1.35)

    error_ax = s.axes(1.0, 3.85, 5.2, 1.3)
    chart(error_ax)
    error_ax.set(xlim=(0, 24), ylim=(0, 0.84), ylabel="Error (rad)", xticks=[0, 6, 12, 18, 24],
                 yticks=[0, 0.2, 0.4, 0.6, 0.8])
    error_ax.set_title("Red area = accumulated past error", fontsize=16, color=INK, loc="center", pad=10)
    error_ax.set_xlabel("Time (s)", fontsize=14)
    (line,) = error_ax.plot([], [], color=CASES[0]["color"], lw=2.7)
    fill = [None]

    torque_ax = s.axes(1.0, 5.85, 5.2, 1.75)
    chart(torque_ax)
    torque_ax.set(ylim=(-7, 14), ylabel="Motor torque (N·m)", yticks=[-5, 0, 5, 10])
    bars = torque_ax.bar(np.arange(4), [0] * 4, color=[chalk.GREEN, I_INK, chalk.LAVENDER, INK], width=0.55)
    torque_ax.set_xticks(np.arange(4), ["P", "I", "D", "Total"])
    torque_ax.set_xlim(-0.5, 3.5)
    torque_ax.tick_params(axis="x", labelsize=15, pad=6)
    torque_ax.axhline(load_nm, color=LOAD_INK, linestyle="--", lw=1.8)
    torque_ax.text(3.5, load_nm + 0.7, "load: 2", color=LOAD_INK, ha="right", fontsize=13)
    memory = s.text(3.6, 8.0, "", ha="center", fontsize=16, color=I_INK)
    s.text(WIDTH / 2, 8.5,
           "At the target, P and D can fade while the stored I term keeps supporting the load.",
           ha="center", fontsize=15)
    s.text(WIDTH / 2, 8.88,
           "Without I: persistent error supplies load through P. Here: 2 / 16 = 0.125 rad = 7.16°.",
           ha="center", fontsize=14, color=MUTED)

    def draw(time):
        index = min(round(time / dt), len(tr["t"]) - 1)
        arm(ax_arm, tr["q"][index], CASES[0]["color"], target)
        points = np.arange(0, index + 1, 8)
        line.set_data(tr["t"][points], tr["error"][points])
        if fill[0] is not None:
            fill[0].remove()
        fill[0] = error_ax.fill_between(tr["t"][points], 0, tr["error"][points], color=I_INK, alpha=0.55)
        values = [tr[key][index] for key in ["P", "I", "D", "torque"]]
        for bar, value in zip(bars, values, strict=True):
            bar.set_height(value)
        current.set_text(f"Full PID\nError: {np.rad2deg(tr['error'][index]):.3f}°")
        memory.set_text(f"I = 4 × {tr['integral'][index]:.3f} rad·s = {tr['I'][index]:.3f} N·m")
        clock.set_text(f"Time: {time:04.1f} s\nPlayback: 2×")

    write(s.fig, out, "why_integral_helps", draw, config["duration_s"], video, crf=25)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", type=Path, required=True, help="maniskill-playground checkout")
    parser.add_argument("--out", type=Path, default=REPO / "assets/robotics/arm-control")
    parser.add_argument("--no-video", action="store_true")
    parser.add_argument("--only", nargs="*", help="subset: ablation integral")
    args = parser.parse_args()
    out = args.out / "v4"
    out.mkdir(parents=True, exist_ok=True)
    chalk.use()
    config, traces = load(args.source)
    if not args.only or "ablation" in args.only:
        ablation_video(config, traces, out, not args.no_video)
    if not args.only or "integral" in args.only:
        integral_video(config, traces, out, not args.no_video)


if __name__ == "__main__":
    main()
