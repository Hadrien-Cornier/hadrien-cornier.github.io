"""Chalk versions of the analytic teaching figures and videos in the arm-control article.

Figures (under assets/robotics/arm-control/v3/):
    link_projections_one_two_three.png
    jacobian_extended_folded.png
    so101_radial_side_top.png
    hypothetical_quarter_ball.png
    damping_joint_responses.mp4 and damping_joint_responses_poster.png
    ik_branch_selection.mp4 and ik_branch_selection_poster.png

Adapted from github.com/Hadrien-Cornier/maniskill-playground, commit 81e2a65,
experiments/workspace/teaching-v3/generate_media_v3.py. The geometry, the
analytic step responses, the IK branch rule, every label and every printed
number are the same, and the videos keep 241 frames at 24 fps. The changes
are the chalk style (assets/robotics/chalk) and a layout for a 358 px phone
column: figures 6.4 in wide with no font under 13 pt, text that sat beside a
3D view moved under it, long subtitles and footers broken in two, and taller
video frames (960 x 1110 px). Colors map by meaning: teal -> GREEN,
orange -> RED, purple -> LAVENDER. Small drawing changes for the dark board:
the shoulder-turn arrow of the Jacobian figure is drawn over the arm, and the
faint after-turn arm and faint damping traces use a little more opacity. The
SciPy ODE cross-check and validation.json of the source are left out; the
figures do not use them. The figures are analytic, so the script needs no
source data.

Run from the blog repository root (Python with matplotlib >= 3.8, numpy,
Pillow, and ffmpeg on PATH):

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/teaching_media.py

Add --static-only to skip the two videos (their posters are still made), and
--out DIR to write somewhere else than assets/robotics/arm-control.
"""

import argparse
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
from matplotlib.patches import Arc, FancyArrowPatch
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "assets/robotics/chalk"))
import chalk  # noqa: E402

# Old palette -> chalk, by meaning. The same mapping is used in every figure of
# the article: teal -> GREEN, orange -> RED, purple -> LAVENDER.
INK = chalk.CHALK      # was #203747
TEAL = chalk.GREEN     # was #168b92
PURPLE = chalk.LAVENDER  # was #8056a3
ORANGE = chalk.RED     # was #db862d
GRAY = chalk.DIM       # was #83949f
LIGHT = chalk.FAINT    # was #dbe4e8
PAPER = chalk.BOARD    # was #fbfcfd
COLORS = [TEAL, ORANGE, PURPLE]

WIDTH = 6.4  # inches; the figure scales to the 358 px phone column
VIDEO_DPI = 150  # 960 px wide video frames
FPS = 24


def line_height(fontsize, lines=1):
    """Height in inches of `lines` lines of Patrick Hand at linespacing 1.0."""
    return lines * 1.333 * fontsize / 72


class Sheet:
    """A figure laid out in inches, with y measured down from the top edge."""

    def __init__(self, height, width=WIDTH, dpi=None):
        # Round the height so that video frames have an even pixel height (yuv420p).
        height = round(height * VIDEO_DPI / 2) * 2 / VIDEO_DPI
        self.w, self.h = width, height
        self.fig = plt.figure(figsize=(width, height), dpi=dpi or 100)

    def axes(self, left, top, width, height, **kw):
        box = [left / self.w, 1 - (top + height) / self.h, width / self.w, height / self.h]
        return self.fig.add_axes(box, **kw)

    def text(self, x, y, s, **kw):
        kw.setdefault("va", "top")
        kw.setdefault("linespacing", 1.0)
        return self.fig.text(x / self.w, 1 - y / self.h, s, **kw)


def title(sheet, main, sub_lines):
    """Title (YELLOW) and subtitle (DIM). Returns the y of the subtitle bottom."""
    sheet.text(0.25, 0.15, main, fontsize=19, color=chalk.YELLOW)
    sheet.text(0.25, 0.6, "\n".join(sub_lines), fontsize=15, color=GRAY)
    return 0.6 + line_height(15, len(sub_lines))


def footer(sheet, y, lines):
    """Footer note (CHALK) with the TEACHING SCHEMATIC label under it, as in the source.

    Returns the y of the label bottom."""
    sheet.text(0.25, y, "\n".join(lines), fontsize=13, color=INK)
    label = y + line_height(13, len(lines)) + 0.04
    sheet.text(0.25, label, "TEACHING SCHEMATIC", fontsize=13, color=GRAY)
    return label + line_height(13)


def arrow(ax, start, end, color=INK, width=2, scale=14, **kw):
    patch = FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=scale, color=color, linewidth=width, **kw
    )
    ax.add_patch(patch)
    return patch


def axes2(ax, xlim, ylim, labels=("x", "y"), ticks=False):
    ax.set(xlim=xlim, ylim=ylim, aspect="equal")
    for spine in ax.spines.values():
        spine.set_visible(False)
    if not ticks:
        ax.set_xticks([])
        ax.set_yticks([])
    arrow(ax, (xlim[0], 0), (xlim[1], 0), GRAY, 1.2, 10)
    arrow(ax, (0, ylim[0]), (0, ylim[1]), GRAY, 1.2, 10)
    ax.text(xlim[1], -0.06, labels[0], fontsize=14, ha="right", va="top")
    ax.text(-0.06, ylim[1], labels[1], fontsize=14, ha="right", va="top")


def unclip(ax):
    """The zoomed 3D views reach past their axes box; do not cut the arrows and planes there."""
    for artist in ax.get_children():
        artist.set_clip_on(False)


def fk(q, lengths):
    a = np.cumsum(q, axis=-1)
    steps = np.stack((np.cos(a), np.sin(a)), axis=-1) * np.asarray(lengths)[..., None]
    return np.concatenate((np.zeros((*steps.shape[:-2], 1, 2)), np.cumsum(steps, axis=-2)), axis=-2)


def arm(ax, points, color=PURPLE, alpha=1, lw=6, zorder=3):
    (line,) = ax.plot(
        points[:, 0], points[:, 1], "o-", color=color, alpha=alpha, lw=lw, ms=7,
        solid_capstyle="round", zorder=zorder,
    )
    return line


def angle_arc(ax, origin, start, end, radius, label, color=INK):
    lo, hi = sorted([np.rad2deg(start), np.rad2deg(end)])
    ax.add_patch(Arc(origin, 2 * radius, 2 * radius, theta1=lo, theta2=hi, lw=1.7, color=color, zorder=6))
    mid = (start + end) / 2
    ax.text(
        origin[0] + 1.4 * radius * np.cos(mid), origin[1] + 1.4 * radius * np.sin(mid), label,
        color=color, fontsize=16, ha="center", va="center",
    )


# --------------------------------------------------------------------------- static figures


def link_projections(out):
    row_h = 2.72
    top0 = 1.05
    s = Sheet(top0 + 3 * row_h + 1.0)
    title(s, "One link, then two, then three", ["Each link adds one horizontal and one vertical projection."])
    lengths = np.array([1.25, 1.0, 0.95])
    q = np.deg2rad([25, 50, -40])
    points = fk(q, lengths)
    for i in range(3):
        top = top0 + i * row_h
        ax = s.axes(0.3, top, 2.64, 2.5)
        axes2(ax, (-0.15, 2.70), (-0.3, 2.40))
        ax.text(0.16, 1.01, f"{i + 1} LINK" + ("S" if i else ""), transform=ax.transAxes,
                fontsize=14, color=GRAY, va="top")
        for j in range(i + 1):
            a, b = points[j : j + 2]
            arm(ax, points[j : j + 2], COLORS[j], lw=6)
            corner = np.array([b[0], a[1]])
            ax.plot([a[0], corner[0], b[0]], [a[1], corner[1], b[1]], "--", lw=1.5,
                    color=COLORS[j], alpha=0.8)
            middle = (a + b) / 2
            ax.text(middle[0] - (0.22 if j == 1 else 0.06), middle[1] + 0.14, rf"$L_{j + 1}$",
                    fontsize=17, color=COLORS[j])
            old = np.sum(q[:j])
            if j:
                ray = a + 0.48 * np.array([np.cos(old), np.sin(old)])
                ax.plot([a[0], ray[0]], [a[1], ray[1]], ":", color=GRAY, lw=1.3)
            angle_arc(ax, a, old, old + q[j], 0.24 if j == 0 else 0.2, rf"$\theta_{j + 1}$")
        end = points[i + 1]
        ax.scatter(*end, s=90, color=INK, zorder=8)
        ax.text(end[0] + 0.07, end[1] + 0.01, "hand", fontsize=14)
        xterms = [
            r"L_1\cos\theta_1",
            r"L_2\cos(\theta_1+\theta_2)",
            r"L_3\cos(\theta_1+\theta_2+\theta_3)",
        ]
        yterms = [t.replace("cos", "sin") for t in xterms]
        for terms, coord, block in [(xterms, "x", 0.0), (yterms, "y", 1.12)]:
            y0 = top + 0.32 + block
            s.text(3.25, y0, rf"${coord}=" + terms[0] + "$", fontsize=16)
            for k in range(1, i + 1):
                s.text(3.55, y0 + 0.31 * k, "$+" + terms[k] + "$", fontsize=15)
    footer(s, top0 + 3 * row_h + 0.1,
           ["Each θ is a relative joint turn. Add the turns to get a link’s angle in the world frame."])
    chalk.save(s.fig, out / "link_projections_one_two_three.png")


def jacobian(out):
    delta = np.deg2rad(10)
    qs = [np.deg2rad([20, 0]), np.deg2rad([-50, 140])]
    panel_w = 2.95
    panel_h = panel_w * 2.15 / 2.6
    top = 1.45
    s = Sheet(top + panel_h + 2.0)
    title(s, "Same shoulder turn. Different hand motion.",
          ["The position derivative is larger when the hand is farther from the shoulder."])
    for i, (q, name) in enumerate(zip(qs, ["EXTENDED", "FOLDED"])):
        left = 0.3 + i * 3.1
        ax = s.axes(left, top, panel_w, panel_h)
        axes2(ax, (-0.35, 2.25), (-1.0, 1.15), labels=("x (m)", "y (m)"))
        p = fk(q, [1, 1])
        after = fk(q + [delta, 0], [1, 1])
        j = np.array([-p[-1, 1], p[-1, 0]])
        ax.set_title(name, fontsize=17, color=TEAL if i == 0 else PURPLE, loc="center", pad=8)
        arm(ax, after, GRAY, 0.45, lw=5, zorder=2)
        arm(ax, p, TEAL if i == 0 else PURPLE)
        # Drawn over the arm: at phone scale the 11.9 cm arrow is shorter than the arm stroke.
        arrow(ax, p[-1], after[-1], ORANGE, width=2.5, scale=18, zorder=4)
        ax.text(after[-1, 0] - 0.02, after[-1, 1] + 0.10, "after 10°", fontsize=13, ha="center", color=GRAY)
        arc = np.linspace(q[0], q[0] + delta, 30)
        ax.plot(0.5 * np.cos(arc), 0.5 * np.sin(arc), lw=4, color=ORANGE)
        ax.text(0.1, -0.2, "10°", fontsize=14, color=ORANGE)
        norm = float(np.linalg.norm(j))
        displacement = float(np.linalg.norm(after[-1] - p[-1]))
        s.text(left, top + panel_h + 0.2,
               rf"$\left\|\partial p/\partial\theta_1\right\|={norm:.3f}$ m/rad", fontsize=17)
        s.text(left, top + panel_h + 0.68, f"10° turn → {100 * displacement:.1f} cm hand displacement",
               fontsize=14)
        eps = 1e-6
        fd = (fk(q + [eps, 0], [1, 1])[-1] - fk(q - [eps, 0], [1, 1])[-1]) / (2 * eps)
        assert np.max(np.abs(fd - j)) < 1e-8
    footer(s, top + panel_h + 1.15, [
        "Two 1 m links. Only shoulder angle θ₁ changes; the elbow angle stays fixed.",
        "Faint arm = after the turn.",
    ])
    chalk.save(s.fig, out / "jacobian_extended_folded.png")


def radial(out):
    s = Sheet(9.75)
    title(s, "One arm plane, seen from two directions",
          ["First find signed reach r and height z. Shoulder pan then splits r into x and y."])
    phi = np.deg2rad(35)
    v = np.array([np.cos(phi), np.sin(phi), 0])
    side = np.array([-np.sin(phi), np.cos(phi), 0])
    q = np.deg2rad([25, 50, -45])
    points2 = fk(q, [1.0, 0.8, 0.7])
    r, z = points2[-1]
    points3 = points2[:, 0, None] * v + points2[:, 1, None] * np.array([0, 0, 1])
    end = points3[-1]
    ax = s.axes(0.0, 0.8, 6.4, 4.6, projection="3d")
    ax.set_facecolor(PAPER)
    plane = np.array([[0, 0, 0], 2.4 * v, 2.4 * v + [0, 0, 2.1], [0, 0, 2.1]])
    ax.add_collection3d(Poly3DCollection([plane], facecolor=TEAL, alpha=0.10, edgecolor=TEAL, linewidth=0.8))
    ax.plot(*points3.T, "o-", color=PURPLE, lw=5, ms=6)
    proj = end.copy()
    proj[2] = 0
    ax.plot(*np.stack([end, proj]).T, ":", color=GRAY, lw=2)
    ax.plot(*np.stack([np.zeros(3), proj]).T, color=TEAL, lw=3)
    ax.text(*(proj * 0.55 + [0, 0, 0.07]), "r", fontsize=19, color=TEAL)
    for tip, label in [(np.array([2.3, 0, 0]), "x"), (np.array([0, 2.1, 0]), "y"), (np.array([0, 0, 2.25]), "z")]:
        ax.quiver(0, 0, 0, *tip, color=GRAY, arrow_length_ratio=0.06, lw=1.3)
        ax.text(*tip, label, fontsize=15)
    center = 1.25 * v + np.array([0, 0, 1.1])
    eye = center + 1.3 * side
    ax.quiver(*eye, *(-1.15 * side), color=ORANGE, arrow_length_ratio=0.14, lw=2)
    ax.scatter(*eye, color=ORANGE, s=35)
    ax.text(*(eye + [0, 0, 0.12]), "SIDE view", color=ORANGE, fontsize=14)
    top = 0.7 * v + np.array([0, 0, 2.5])
    ax.quiver(*top, 0, 0, -0.7, color=TEAL, arrow_length_ratio=0.18, lw=2)
    ax.scatter(*top, color=TEAL, s=35)
    ax.text(*(top + [0.06, 0, 0.07]), "TOP view", color=TEAL, fontsize=14)
    ax.text(*(1.7 * v + [0, 0, 1.85]), "arm’s plane", fontsize=14, color=TEAL)
    ax.view_init(elev=24, azim=-10)
    ax.set_box_aspect((1, 1, 1), zoom=1.4)
    ax.set(xlim=(-0.3, 2.4), ylim=(-0.3, 2.4), zlim=(0, 2.7))
    ax.set_axis_off()
    unclip(ax)

    row = 6.45
    a = s.axes(0.45, row, 2.75, 2.75 * 2.0 / 2.57)
    axes2(a, (-0.12, 2.45), (-0.15, 1.85), labels=("r", "z"))
    s.text(0.25, row - 0.42, "SIDE: look across the arm’s plane", fontsize=14, color=ORANGE)
    arm(a, points2)
    a.plot([r, r, 0], [0, z, z], ":", lw=1.5, color=GRAY)
    a.plot([0, r], [0, 0], color=TEAL, lw=3)
    a.text(r / 2, -0.20, "signed reach r", fontsize=13, color=TEAL, ha="center", va="top")
    a.text(r + 0.08, z / 2, "z", fontsize=17)
    a = s.axes(3.6, row, 2.6, 2.6 * 1.67 / 2.12)
    axes2(a, (-0.12, 2.0), (-0.12, 1.55), labels=("x", "y"))
    s.text(3.45, row - 0.42, "TOP: look down along vertical z", fontsize=14, color=TEAL)
    xy = points3[:, :2]
    arm(a, xy, lw=5)
    a.plot([end[0], end[0], 0], [0, end[1], end[1]], "--", color=GRAY, lw=1.5)
    a.text(end[0] / 2, -0.20, "x = r cos φ", fontsize=14, ha="center", va="top")
    a.text(end[0] + 0.09, end[1] / 2, "y = r sin φ", fontsize=13, rotation=90, va="center")
    a.text(end[0] * 0.5 - 0.16, end[1] * 0.5 + 0.1, "r", fontsize=18, color=TEAL)
    angle_arc(a, [0, 0], 0, phi, 0.43, "φ", color=INK)
    footer(s, 9.0, [
        "Simplified SO-101 geometry, not the exact model. φ is shoulder pan.",
        "Real link and axis offsets are omitted.",
    ])
    chalk.save(s.fig, out / "so101_radial_side_top.png")
    assert np.allclose(end, [r * np.cos(phi), r * np.sin(phi), z])


def quarter_ball(out):
    s = Sheet(7.25)
    title(s, "Why a quarter-ball might be a first guess", [
        "Hypothesis: 180° of shoulder pan, above the table,",
        "with every radius from 0 to R reachable.",
    ])
    ax = s.axes(-0.2, 0.45, 6.8, 3.9, projection="3d")
    ax.set_facecolor(PAPER)
    radius = 1.1
    phi = np.linspace(0, np.pi, 60)
    polar = np.linspace(0, np.pi / 2, 36)
    ph, po = np.meshgrid(phi, polar)
    x = radius * np.sin(po) * np.cos(ph)
    y = radius * np.sin(po) * np.sin(ph)
    z = radius * np.cos(po)
    ax.plot_surface(x, y, z, color=TEAL, alpha=0.16, linewidth=0, rstride=3, cstride=3, shade=False)
    ax.plot_wireframe(x, y, z, color=TEAL, alpha=0.30, lw=0.6, rstride=7, cstride=10)
    for ang in [0, np.pi]:
        ax.plot(radius * np.sin(polar) * np.cos(ang), radius * np.sin(polar) * np.sin(ang),
                radius * np.cos(polar), color=TEAL, lw=2)
    ax.plot(radius * np.cos(phi), radius * np.sin(phi), np.zeros_like(phi), color=TEAL, lw=2)
    table = [[-1.4, -0.4, 0], [1.4, -0.4, 0], [1.4, 1.5, 0], [-1.4, 1.5, 0]]
    ax.add_collection3d(Poly3DCollection([table], facecolor=LIGHT, alpha=0.25, edgecolor=GRAY, lw=0.8))
    points = fk(np.deg2rad([55, -35]), [0.55, 0.55])
    v = np.array([np.cos(0.95), np.sin(0.95), 0])
    points3 = points[:, 0, None] * v + points[:, 1, None] * np.array([0, 0, 1])
    ax.plot(*points3.T, "o-", color=PURPLE, lw=5, ms=7, zorder=8)
    ax.scatter(0, 0, 0, s=130, color=INK, marker="s")
    arc = 0.62 * np.stack([np.cos(phi), np.sin(phi), np.zeros_like(phi)], axis=-1)
    ax.plot(*arc.T, color=ORANGE, lw=3)
    ax.text(0, 0.74, 0.02, "assumed 180° pan", color=ORANGE, fontsize=14, ha="center", zorder=20)
    ax.plot([0, 0], [0, 0], [0, radius], ":", color=GRAY, lw=1.5)
    ax.text(0, 0, 0.65, "  R", fontsize=18)
    ax.text(-1.15, -0.30, 0, "table", fontsize=15, color=GRAY)
    ax.view_init(elev=22, azim=-64)
    ax.set_box_aspect((1.6, 1.3, 0.95), zoom=1.4)
    ax.set_axis_off()
    ax.set(xlim=(-1.4, 1.4), ylim=(-0.4, 1.5), zlim=(0, 1.35))
    unclip(ax)
    y0 = 4.35
    s.text(0.25, y0, "Start with a ball.", fontsize=19)
    s.text(0.25, y0 + 0.5, "Keep its upper half:\nabove-table assumption.", fontsize=15, linespacing=1.05)
    s.text(3.4, y0 + 0.5, "Keep half of that:\n180° pan assumption.", fontsize=15, linespacing=1.05)
    s.text(0.25, y0 + 1.2, "A quarter of a ball.", fontsize=19, color=TEAL)
    footer(s, y0 + 1.8, [
        "Not a measured workspace or an SO-101 limit. Joint limits,",
        "folding, and collisions can change this shape.",
    ])
    chalk.save(s.fig, out / "hypothetical_quarter_ball.png")


# --------------------------------------------------------------------------- videos


def drawn_rgb(fig):
    """Draw the figure and return a copy of its RGB pixels."""
    fig.canvas.draw()
    return np.asarray(fig.canvas.buffer_rgba())[..., :3].copy()


def chalk_frame(rgb):
    """The chalk grain of chalk.save(), applied to one video frame (runs in a worker process)."""
    return chalk.chalk_grain(rgb, scale=rgb.shape[1] / 720.0).tobytes()


def encode(fig, update, frames, path, fps=FPS, crf=24):
    """Pipe chalk frames to ffmpeg: H.264, yuv420p, faststart, same frame count and rate.

    The grain is the slow step, so worker processes apply it while this process draws."""
    fig.patch.set_sketch_params(None)
    fig.set_dpi(VIDEO_DPI)
    update(0)
    first = drawn_rgb(fig)
    height, width, _ = first.shape
    assert width % 2 == 0 and height % 2 == 0, (width, height)
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{width}x{height}", "-r", str(fps), "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    workers = os.cpu_count() or 2
    queue = deque()
    with ProcessPoolExecutor(max_workers=workers) as pool:
        queue.append(pool.submit(chalk_frame, first))
        for k in range(1, frames):
            update(k)
            queue.append(pool.submit(chalk_frame, drawn_rgb(fig)))
            while len(queue) > 2 * workers:
                proc.stdin.write(queue.popleft().result())
        while queue:
            proc.stdin.write(queue.popleft().result())
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError(f"ffmpeg failed for {path}")


def ik_branches(target):
    c = (np.sum(target**2, axis=-1) - 2) / 2
    b = np.arccos(c)
    results = []
    for sign in [1, -1]:
        q2 = sign * b
        q1 = np.arctan2(target[:, 1], target[:, 0]) - np.arctan2(np.sin(q2), 1 + np.cos(q2))
        results.append(np.column_stack([q1, q2]))
    return np.stack(results, axis=1)


def ik_animation(out, static_only):
    t = np.arange(241) / FPS
    phase = 2 * np.pi * t / 10
    targets = np.column_stack([1.10 + 0.32 * np.cos(phase), 0.35 + 0.32 * np.sin(phase)])
    branches = ik_branches(targets)
    switches = np.floor(t / 1.25).astype(int) % 2
    jumping = branches[np.arange(len(t)), switches]
    continuous = [branches[0, 0]]
    for options in branches[1:]:
        dist = np.linalg.norm((options - continuous[-1] + np.pi) % (2 * np.pi) - np.pi, axis=-1)
        continuous.append(options[np.argmin(dist)])
    continuous = np.array(continuous)

    s = Sheet(7.4)
    title(s, "Same target path. Different IK branch choices.",
          ["Both arms reach the moving dot. One choice creates jumps in joint angles."])
    time_text = s.text(6.15, 1.0, "", fontsize=15, ha="right", color=INK)
    panel_w = 2.9
    panel_h = panel_w * 2.63 / 2.17
    top = 1.75
    lines, dots = [], []
    names = [
        ("Forced branch switches", "Alternate the two analytic solutions"),
        ("Keep the nearest solution", "Choose the solution closest\nto the previous one"),
    ]
    for i, (name, detail) in enumerate(names):
        left = 0.25 + 3.15 * i
        ax = s.axes(left, top, panel_w, panel_h)
        axes2(ax, (-0.22, 1.95), (-1.16, 1.47), labels=("x", "y"))
        ax.set_title(name, fontsize=16, color=ORANGE if i == 0 else TEAL, loc="center", pad=8)
        ax.plot(targets[:, 0], targets[:, 1], color=GRAY, lw=1.7, ls=":")
        ax.scatter(0, 0, s=180, marker="s", color=INK, zorder=5)
        lines.append(arm(ax, fk(jumping[0] if i == 0 else continuous[0], [1, 1]), ORANGE if i == 0 else TEAL))
        dots.append(ax.scatter(*targets[0], s=110, color=INK, edgecolors=PAPER, zorder=8))
        s.text(left + 0.1, top + panel_h + 0.1, detail, fontsize=13)
    notes = top + panel_h + 0.72
    s.text(0.35, notes, "Left: the switching is deliberate.", color=ORANGE, fontsize=15)
    s.text(3.5, notes, "Right: a simple continuity rule,\nnot a full IK solver.", color=TEAL, fontsize=13)
    footer(s, notes + 0.72, ["Two ideal links; no joint limits or collisions. An unseeded solver does not necessarily jump."])

    def update(k):
        for i, q in enumerate([jumping[k], continuous[k]]):
            points = fk(q, [1, 1])
            lines[i].set_data(points[:, 0], points[:, 1])
            dots[i].set_offsets(targets[k])
        time_text.set_text(f"t = {t[k]:.2f} s")

    if not static_only:
        encode(s.fig, update, len(t), out / "ik_branch_selection.mp4", crf=23)
    update(45)
    chalk.save(s.fig, out / "ik_branch_selection_poster.png", tight=False)
    errors = [float(np.max(np.linalg.norm(fk(q, [1, 1])[:, -1] - targets, axis=-1))) for q in [jumping, continuous]]
    jumps = [float(np.max(np.linalg.norm(np.diff(q, axis=0), axis=-1))) for q in [jumping, continuous]]
    assert max(errors) < 1e-12 and jumps[0] > 1 and jumps[1] < 0.04


def step(t, z, wn=2):
    t = np.asarray(t)
    if z == 1:
        return 1 - (1 + wn * t) * np.exp(-wn * t)
    r = np.sqrt(abs(1 - z * z))
    if z < 1:
        return 1 - np.exp(-z * wn * t) * (np.cos(wn * r * t) + z / r * np.sin(wn * r * t))
    a = -wn * (z - r)
    b = -wn * (z + r)
    return 1 + (b * np.exp(a * t) - a * np.exp(b * t)) / (a - b)


def damping_animation(out, static_only):
    t = np.arange(241) / FPS
    zs = [0.35, 1, 2]
    response = np.array([step(t, z) for z in zs])
    angles = 20 + 80 * response

    s = Sheet(7.4)
    title(s, "One target. Three amounts of damping.", [
        "Start at 20°. Target: 100°. Same inertia and proportional",
        "gain; change only derivative gain.",
    ])
    time_text = s.text(6.15, 1.3, "", fontsize=15, ha="right")
    pointers, numbers = [], []
    dial_w = 2.0
    dial_h = dial_w * 1.42 / 2.25
    top = 2.0
    for i, (label, detail) in enumerate([
        ("UNDERDAMPED", "Overshoots, then settles"),
        ("CRITICAL", "Fast, without oscillating"),
        ("OVERDAMPED", "Slower approach"),
    ]):
        left = 0.15 + i * 2.05
        ax = s.axes(left, top, dial_w, dial_h)
        ax.set(xlim=(-1.1, 1.15), ylim=(-0.22, 1.2), aspect="equal")
        ax.axis("off")
        ax.set_title(label, fontsize=16, color=COLORS[i], loc="center", pad=8)
        ph = np.linspace(np.deg2rad(20), np.deg2rad(140), 120)
        ax.plot(np.cos(ph), np.sin(ph), color=LIGHT, lw=2)
        target = np.deg2rad(100)
        ax.plot([0, np.cos(target)], [0, np.sin(target)], "--", color=GRAY, lw=2)
        ax.text(np.cos(target) - 0.06, np.sin(target) + 0.04, "100°", fontsize=13, color=GRAY, ha="right")
        pointers.append(arm(ax, np.array([[0, 0], [np.cos(np.deg2rad(20)), np.sin(np.deg2rad(20))]]),
                            COLORS[i], lw=6))
        ax.scatter(0, 0, s=110, color=INK, zorder=9)
        center = left + dial_w / 2
        numbers.append(s.text(center, top + dial_h + 0.1, "", fontsize=15, ha="center", color=COLORS[i]))
        s.text(center, top + dial_h + 0.45, detail, fontsize=13, ha="center")
    ax = s.axes(1.0, 4.2, 5.2, 1.7)
    ax.set(xlim=(0, 10), ylim=(15, 140), xlabel="Time (seconds)", ylabel="Angle (degrees)",
           yticks=[20, 60, 100, 140])
    ax.grid(True, alpha=0.4)
    ax.axhline(100, color=GRAY, ls="--", lw=1.4)
    traces, dots = [], []
    for col, values in zip(COLORS, angles):
        ax.plot(t, values, color=col, alpha=0.22, lw=2)
        traces.append(ax.plot([], [], color=col, lw=2.8)[0])
        dots.append(ax.plot([], [], "o", color=col, ms=6)[0])
    cursor = ax.axvline(0, color=GRAY, lw=1)
    footer(s, 6.75, ["Ideal one-joint PD model, starting at rest. No gravity, friction, delay, or motor limit."])

    def update(k):
        for i in range(3):
            phi = np.deg2rad(angles[i, k])
            pointers[i].set_data([0, np.cos(phi)], [0, np.sin(phi)])
            numbers[i].set_text(f"angle: {angles[i, k]:.1f}°")
            traces[i].set_data(t[: k + 1], angles[i, : k + 1])
            dots[i].set_data([t[k]], [angles[i, k]])
        cursor.set_xdata([t[k], t[k]])
        time_text.set_text(f"t = {t[k]:.2f} s")

    if not static_only:
        encode(s.fig, update, len(t), out / "damping_joint_responses.mp4", crf=23)
    update(40)
    chalk.save(s.fig, out / "damping_joint_responses_poster.png", tight=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=REPO / "assets/robotics/arm-control")
    parser.add_argument("--static-only", action="store_true")
    parser.add_argument("--only", nargs="*", help="subset: projections jacobian radial quarter_ball ik damping")
    args = parser.parse_args()
    out = args.out / "v3"
    out.mkdir(parents=True, exist_ok=True)
    chalk.use()
    jobs = {
        "projections": lambda: link_projections(out),
        "jacobian": lambda: jacobian(out),
        "radial": lambda: radial(out),
        "quarter_ball": lambda: quarter_ball(out),
        "ik": lambda: ik_animation(out, args.static_only),
        "damping": lambda: damping_animation(out, args.static_only),
    }
    for name, job in jobs.items():
        if args.only and name not in args.only:
            continue
        job()
        print(name, "complete", flush=True)


if __name__ == "__main__":
    main()
