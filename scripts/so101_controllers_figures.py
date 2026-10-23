#!/usr/bin/env python3
"""Chalk (blackboard) figures of SO-101 part 6, "Where the last millimeter of my drawing arm goes".

The script writes these 14 figures and the time-lapse video in assets/robotics/so101-controllers/ (same names as
the light versions):

  Video, made again from the Measured run logs (method: regen; target name "timelapse"):
    timelapse.mp4           the four test drawings with four controllers in turn, 8x speed, 20 frames per second,
                            1136 frames (56.8 s), as timelapse.py made it
    timelapse-poster.jpg    frame 60 (3.0 s) of the same render; the old poster is the same frame of the old video
  Data plots, made again from the Measured run logs (method: regen):
    kitten-timeline.png     the kitten drawn with four controllers, tablet pen trace over the reference strokes
    four-drawings.png       the four test drawings, no correction and frozen head
    goal-chatter.png        lift goal chatter and joint response, strongest 2.5 s of the head-off kitten
    head-offset.png         offset that the frozen head adds to the pan goal (kitten)
    pan-reversal.png        mean goal and joint angle after a direction change, pan and lift
    nib-error-vs-speed.png  tablet minus encoder position against the planned nib speed, x and y
  Diagrams and value charts, drawn again from the original figure scripts (method: redraw; every value and
  every label is a constant in this file, copied from those scripts):
    arm-pan-lever.png, system.png, head-schematic.png, numbers.png, kalman-intuition.png,
    controllers-map.png, error-parts.png, learning-curve.png

Adapted from:
  - The light figure scripts of 11 Oct 2026 (blog base commit 3f56632 has their PNG output). They are archived in
    github.com/Hadrien-Cornier/bcw-ops, commit 0c1afcffb0c0, file archive/learning/learning-figure-scripts.md:
    figs.py (controllers-map, error-parts, learning-curve), drawdata.py and drawfigs.py (kitten-timeline,
    four-drawings), timelapse.py with drawdata.py (timelapse), chatterfig.py (goal-chatter), headfig.py (head-offset), armfig.py (arm-pan-lever),
    sysdiagram.py (system), headdiagram.py (head-schematic), provdiagram.py (numbers), kalman.html
    (kalman-intuition, KaTeX).
  - The error-budget scripts of the same night (data_figs.py with budget/lib.py, a3_phys.py, a3b_pan.py and
    a4_dsplit.py; pan-reversal, nib-error-vs-speed). They lived in a scratch folder only and were recovered from the
    agent session logs of that night. The parts that these two figures use are copied below; they reproduce the
    printed values of the old figures exactly.
  - Score and geometry code of robot-self-calibration (github.com/Hadrien-Cornier/robot-self-calibration),
    commit 76c4c9fd663f (branch workshop-1010, the checkout that made the figures):
    studies/workshop-1010/draw/score_core.py and score_io.py, src/robot_calibration/hardware/draw_check.py,
    assets/so101/so101.xml.

Data: the Measured run folders <runs>/<run>/pass01 (01-phys.npz, tablet-raw.jsonl, session.json,
inputs/*.plan.json) of 10 and 11 Oct 2026. They are not in git; locally they are in the arm-workshop checkout under
runs/ws-online/rand. The run names are in RUNS_* below.

Run from the blog repository root. The Python needs numpy, matplotlib 3.8 or later and Pillow, and also torch and
mujoco for nib-error-vs-speed (the robot-self-calibration .venv has all of them). The video also needs ffmpeg
(with libx264) on PATH:

  git -C <robot-self-calibration> archive 76c4c9fd studies/workshop-1010/draw src assets/so101 | tar -x -C <rsc>
  PYTHONDONTWRITEBYTECODE=1 <python> scripts/so101_controllers_figures.py --runs <arm-workshop>/runs/ws-online/rand --rsc <rsc>

Add --only <name> [<name> ...] to make some outputs only (names without the extension; "timelapse" makes the video
and its poster). The diagrams and the value charts need neither --runs nor --rsc. For example:

  PYTHONDONTWRITEBYTECODE=1 <python> scripts/so101_controllers_figures.py --runs <runs> --rsc <rsc> --only timelapse
"""

import argparse
import os
import re
import subprocess
import sys
from collections import deque
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "assets/robotics/chalk"))
import chalk  # noqa: E402

import matplotlib  # noqa: E402

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import patheffects  # noqa: E402
from matplotlib.colors import to_rgba  # noqa: E402
from matplotlib.ticker import MultipleLocator  # noqa: E402
from matplotlib.patches import Circle, FancyBboxPatch, PathPatch, Polygon, Rectangle, Wedge  # noqa: E402
from matplotlib.path import Path as MPath  # noqa: E402

OUT = REPO / "assets/robotics/so101-controllers"

# One color for each meaning in this article. Old light colors (figs.py and the other scripts) to chalk:
#   blue   #2a78d6  frozen correction head; runs without the tablet; goal sent; tablet x axis; new belief  -> BLUE
#   orange #eb6834  pan axis; neural-network corrections; lab-only tablet step; kernel model (learning curve);
#                   goal chatter; joint angle; tablet y axis; gain K; Simulation                          -> RED
#   aqua   #1baf7a  linear hysteresis and kernel models (controllers map); surprise; Offline              -> GREEN
#   purple #8e44ad  uncertainty P                                                                         -> LAVENDER
#   gray   #8a8985  baseline bars and series, scatter points                                              -> DIM
#   ink    #0b0b0b, dark pen #2b2a28                                                                      -> CHALK
#   ink 2  #52514e  secondary text, old belief                                                            -> DIM
#   reference line #bdbcb7 (the article calls it gray)                                                    -> FAINT
C_BLUE = chalk.BLUE
C_ORANGE = chalk.RED
C_AQUA = chalk.GREEN
C_PURPLE = chalk.LAVENDER
C_GRAY = chalk.DIM
C_INK = chalk.CHALK
C_INK2 = chalk.DIM
C_REF = chalk.FAINT
# The light figure says "the pan axis (orange)". Chalk has no orange: the old orange is RED here, so the title
# names it "red". The article caption needs the same change (see the chalk-b report).
PAN_COLOR_WORD = "red"

DRAWINGS = ("kitty", "star", "spiral", "square")
DRAWING_NAMES = {"kitty": "Kitten", "star": "Star", "spiral": "Spiral", "square": "Square"}
# drawdata.py STAGES: run name pattern and panel title.
STAGES = [("base-m1z-pr15-{f}", "Physics base, no correction"),
          ("physr-m-prm1z-{f}", "Physics base + learned torque (PhysR)"),
          ("nn-v5b-val-{f}-m1z", "Neural-network correction"),
          ("v6-val-after-005-{f}", "Frozen correction head")]
STAGE_COLORS = [C_INK, C_INK, C_ORANGE, C_BLUE]
# a3b_pan.RUNS: head-off runs of tablet pose m1z.
RUNS_PAN = [f"base-m1z-pr15-{f}" for f in DRAWINGS] + ["check-m1z-pr15-s40-a", "check-m1z-pr15-s40-rep"]
# a4_dsplit.run_list() group "off" over the budget copy of the runs (sorted by name, as the folder listing was).
RUNS_SPEED = sorted([f"base-m1z-pr15-{f}" for f in DRAWINGS] + [f"phys-m-prm1z-{f}" for f in DRAWINGS]
                    + [f"physr-m-prm1z-{f}" for f in DRAWINGS] + ["check-m1z-pr15-s40-a", "check-m1z-pr15-s40-rep"])


# ----------------------------------------------------------------------------------------------------------------
# Text helpers


def _measure_fig():
    fig = plt.figure(figsize=(4, 2))
    return fig, fig.canvas.get_renderer()


_MFIG, _MREN = None, None


def text_width_in(text, size):
    """Width in inches of one line of text (or mathtext) at a font size in points."""
    global _MFIG, _MREN
    if _MFIG is None:
        _MFIG, _MREN = _measure_fig()
    t = _MFIG.text(0, 0, text, fontsize=size)
    w = t.get_window_extent(_MREN).width / _MFIG.dpi
    t.remove()
    return w


def wrap(text, size, width_in):
    """Break text at spaces so that each line fits width_in (inches). Keeps every word and its order."""
    words = text.split(" ")
    lines, line = [], ""
    for w in words:
        cand = w if not line else line + " " + w
        if line and text_width_in(cand, size) > width_in:
            lines.append(line)
            line = w
        else:
            line = cand
    lines.append(line)
    return lines


class Board:
    """A figure with one axes in points: x to the right, y down, (0, 0) at the top left."""

    def __init__(self, width_in=6.4, height_in=12.0):
        self.fig = plt.figure(figsize=(width_in, height_in))
        self.ax = self.fig.add_axes([0, 0, 1, 1])
        self.W = width_in * 72.0
        self.ax.set_xlim(0, self.W)
        self.ax.set_ylim(height_in * 72.0, 0)
        self.ax.axis("off")
        self.ren = self.fig.canvas.get_renderer()
        self._cache = {}

    def finish(self, height_pt):
        self.fig.set_size_inches(self.W / 72.0, height_pt / 72.0)
        self.ax.set_ylim(height_pt, 0)
        return self.fig

    def measure(self, text, size):
        """(width, ascent, descent) in points of text placed on its baseline."""
        key = (text, size)
        if key not in self._cache:
            t = self.ax.text(0, 100, text, fontsize=size, va="baseline", ha="left")
            bb = t.get_window_extent(self.ren)
            yb = self.ax.transData.transform((0, 100))[1]
            k = 72.0 / self.fig.dpi
            self._cache[key] = (bb.width * k, (bb.y1 - yb) * k, (yb - bb.y0) * k)
            t.remove()
        return self._cache[key]

    def width(self, text, size):
        return self.measure(text, size)[0]

    def space(self, size):
        return self.width("a a", size) - self.width("aa", size)

    def wrap(self, text, size, width):
        words = text.split(" ")
        lines, line = [], ""
        for w in words:
            cand = w if not line else line + " " + w
            if line and self.width(cand, size) > width:
                lines.append(line)
                line = w
            else:
                line = cand
        lines.append(line)
        return lines

    def text(self, x, y, s, size, color=C_INK, ha="left", va="baseline", **kw):
        return self.ax.text(x, y, s, fontsize=size, color=color, ha=ha, va=va, **kw)

    def lines(self, x, y, lines, size, color=C_INK, ha="left", gap=1.28):
        """Lines of text, the first baseline at y + size; returns the y under the last line."""
        for i, s in enumerate(lines):
            self.text(x, y + size * 0.98 + i * size * gap, s, size, color, ha=ha)
        return y + len(lines) * size * gap

    def rich(self, x, y, width, runs, size, gap=1.32, ha="left"):
        """A paragraph of colored runs [(text, color)], wrapped at spaces to width. Returns the y under it."""
        words, cur = [], []
        for text, color in runs:
            for part in re.split(r"(\s+)", text):
                if not part:
                    continue
                if part.isspace():
                    if cur:
                        words.append(cur)
                        cur = []
                else:
                    cur.append((part, color))
        if cur:
            words.append(cur)
        sp = self.space(size)
        lines, line, lw = [], [], 0.0
        for w in words:
            ww = sum(self.width(f, size) for f, _ in w)
            add = ww if not line else lw + sp + ww
            if line and add > width:
                lines.append((line, lw))
                line, lw = [w], ww
            else:
                line.append(w)
                lw = add
        lines.append((line, lw))
        for i, (line, lw) in enumerate(lines):
            yb = y + size * 0.98 + i * size * gap
            cx = x if ha == "left" else x - lw / 2
            for w in line:
                for f, c in w:
                    self.text(cx, yb, f, size, c)
                    cx += self.width(f, size)
                cx += sp
        return y + len(lines) * size * gap

    def box(self, x, y, w, title, body, color, size=14.0, title_size=16.0, pad=8.0, tint=0.10, h=None, title_color=C_INK,
            body_color=C_INK2):
        """A rounded box with a title and body lines (each line wrapped to the box). Returns its geometry."""
        tl = self.wrap(title, title_size, w - 2 * pad) if title else []
        bl = []
        for line in body:
            bl += self.wrap(line, size, w - 2 * pad)
        need = 2 * pad + len(tl) * title_size * 1.22 + len(bl) * size * 1.28
        h = max(h or 0.0, need)
        fc = to_rgba(color, tint) if tint else chalk.BOARD
        self.ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=7", fc=fc, ec=color, lw=2.0))
        ty = y + (h - (need - 2 * pad)) / 2
        ty = self.lines(x + w / 2, ty, tl, title_size, title_color, ha="center", gap=1.22)
        self.lines(x + w / 2, ty, bl, size, body_color, ha="center")
        return dict(x=x, y=y, w=w, h=h, cx=x + w / 2, cy=y + h / 2, right=x + w, bottom=y + h)

    def arrow(self, pts, color=C_INK2, dashed=False, lw=2.0, head=8.0):
        """A polyline with a filled arrowhead at the last point."""
        pts = [tuple(map(float, p)) for p in pts]
        (x0, y0), (x1, y1) = pts[-2], pts[-1]
        d = np.hypot(x1 - x0, y1 - y0)
        ux, uy = (x1 - x0) / d, (y1 - y0) / d
        end = (x1 - ux * head * 0.9, y1 - uy * head * 0.9)
        xs, ys = zip(*(pts[:-1] + [end]))
        self.ax.plot(xs, ys, color=color, lw=lw, ls=(0, (5, 4)) if dashed else "-", solid_joinstyle="miter",
                     solid_capstyle="butt")
        bx, by = x1 - ux * head, y1 - uy * head
        hw = head * 0.5
        self.ax.add_patch(Polygon([(x1, y1), (bx - uy * hw, by + ux * hw), (bx + uy * hw, by - ux * hw)], closed=True,
                                  fc=color, ec=color, lw=1.0))

    def pill(self, x, cy, s, color, size=15.0):
        w = self.width(s, size) + 16
        self.ax.add_patch(FancyBboxPatch((x, cy - 10.5), w, 21, boxstyle="round,pad=0,rounding_size=10.5", fc=color, ec=color,
                                         lw=1.0))
        self.text(x + w / 2, cy + size * 0.33, s, size, chalk.BOARD, ha="center")
        return x + w

    def plus(self, cx, cy, r=10.5):
        self.ax.add_patch(Circle((cx, cy), r, fc=chalk.BOARD, ec=C_INK, lw=2.0))
        self.text(cx, cy, "+", 17, C_INK, ha="center", va="center_baseline")


def brace(ax, x0, x1, y, h, color, lw=1.8):
    """A curly brace under a term: ends at y, tip at y + h (y grows downwards)."""
    q = min(h / 2.0, (x1 - x0) / 4.0)
    xm = (x0 + x1) / 2.0
    verts = [(x0, y), (x0, y + q), (x0 + q, y + q), (xm - q, y + q), (xm, y + q), (xm, y + h),
             (xm, y + q), (xm + q, y + q), (x1 - q, y + q), (x1, y + q), (x1, y)]
    codes = [MPath.MOVETO, MPath.CURVE3, MPath.CURVE3, MPath.LINETO, MPath.CURVE3, MPath.CURVE3,
             MPath.CURVE3, MPath.CURVE3, MPath.LINETO, MPath.CURVE3, MPath.CURVE3]
    ax.add_patch(PathPatch(MPath(verts, codes), fc="none", ec=color, lw=lw))


# ----------------------------------------------------------------------------------------------------------------
# Measured data (regen)


class Runs:
    """Reads the Measured run folders with the score code of robot-self-calibration 76c4c9fd."""

    def __init__(self, runs, rsc):
        self.root = Path(runs)
        rsc = Path(rsc)
        for p in (rsc / "studies/workshop-1010/draw", rsc / "src"):
            if not p.is_dir():
                raise SystemExit(f"missing {p}: pass --rsc, an export of robot-self-calibration 76c4c9fd")
            sys.path.insert(0, str(p))
        import score_core
        import score_io
        self.sc, self.sio = score_core, score_io
        self._geo = {}

    def folder(self, name):
        p = self.root / name / "pass01"
        return p if p.is_dir() else self.root / name

    def arrays(self, name):
        p = self.folder(name)
        with np.load(sorted(p.glob("[0-9][0-9]-*.npz"))[0], allow_pickle=False) as z:
            return {k: z[k] for k in z.files}

    def drawing(self, name):
        """drawdata.load: tablet samples inside the strokes at lag 0, and the RMS of tablet minus plan."""
        p = self.folder(name)
        plan = self.sc.load_plan(next((p / "inputs").glob("*.plan.json")))
        run = self.sio.load_run(p, None)
        tr = self.sio.trace_from_jsonl(p / "tablet-raw.jsonl", run)
        ok, idx, m, r = self.sc.aligned_pairs(tr, plan, 0.0)
        rms = float(np.sqrt(((m - r) ** 2).sum(1).mean()))
        return dict(plan=plan, tm=tr["tm"][ok], idx=idx, m=m, r=r, rms=rms)

    def ref_strokes(self, plan):
        return [self.sc.plan_xy(plan, np.arange(t0, t1, 0.01)) for t0, t1 in plan["strokes"]]

    # budget/lib.py load(grid=False) and a3b_pan.collect_events, for the joints 0 (pan) and 1 (lift).
    def reversal_events(self, joints=(0, 1)):
        out = {j: [] for j in joints}
        for name in RUNS_PAN:
            p = self.folder(name)
            plan = self.sc.load_plan(next((p / "inputs").glob("*.plan.json")))
            run = self.sio.load_run(p, None)
            a = run["arrays"]
            t = a["time_s"] * run["speed"]
            dt = float(np.median(np.diff(t)))
            qcmd = a["target_q"] + (a["ctl_oh_delta"] if "ctl_oh_delta" in a else 0.0)
            qref = np.where(np.isfinite(qcmd), qcmd, a["target_q"])
            q, goal = a["q"], a["goal_sent"]
            w = smooth_w(qref, dt)
            events = phase_events(w, dt)
            inwin = np.zeros(len(t), bool)
            for t0, t1 in plan["strokes"]:
                inwin |= (t >= t0) & (t <= t1)
            gv = np.gradient(goal, dt, axis=0)
            qv = np.gradient(q, dt, axis=0)
            for j in joints:
                for s0 in events[j]:
                    i0, i1 = s0 - int(PAN_PRE / dt), s0 + int(PAN_POST / dt)
                    if not inwin[s0] or i0 < 0 or i1 >= len(t):
                        continue
                    seg = w[s0:s0 + int(1.0 / dt), j]
                    nd = np.sign(np.sum(seg * (np.abs(seg) >= W_STILL)))
                    if nd == 0:
                        continue
                    sl = slice(i0, i1)
                    rec = dict(t=(np.arange(i0, i1) - s0) * dt, lag=(q[sl, j] - qref[sl, j]) * -nd * 1e3,
                               lead=(goal[sl, j] - qref[sl, j]) * nd * 1e3)
                    ig = sustained(gv[s0:i1, j], nd)
                    iq = sustained(qv[s0:i1, j], nd)
                    rec["delay_ms"] = None if (ig is None or iq is None) else (iq - ig) * dt * 1e3
                    out[j].append(rec)
        return out

    def geometry(self, pose):
        import json
        key = json.dumps(pose, sort_keys=True)
        if key not in self._geo:
            from robot_calibration.hardware.draw_check import Geometry
            self._geo[key] = Geometry(pose)
        return self._geo[key]

    # budget/lib.py load() + strokes_grid() and a4_dsplit.gather(): d = tablet - FK(q measured), v = plan velocity,
    # on a 100 Hz grid inside each stroke, lag 0.
    def speed_rows(self):
        rows = []
        for name in RUNS_SPEED:
            p = self.folder(name)
            plan = self.sc.load_plan(next((p / "inputs").glob("*.plan.json")))
            run = self.sio.load_run(p, None)
            a = run["arrays"]
            tr = self.sio.trace_from_jsonl(p / "tablet-raw.jsonl", run)
            fk_m = self.geometry(plan["pose"]).nib_tablet_mm(a["q"])
            t_run = a["time_s"] * run["speed"]
            ok, idx, m, r = self.sc.aligned_pairs(tr, plan, 0.0)
            tm = tr["tm"][ok]
            ds, vs = [], []
            for s, (t0, t1) in enumerate(plan["strokes"]):
                k = idx == s
                g = np.arange(t0, t1, 1.0 / 100.0)
                if len(g) < 40 or k.sum() < 20:
                    continue
                tab = np.column_stack([np.interp(g, tm[k], m[k][:, j]) for j in range(2)])
                fm = np.column_stack([np.interp(g, t_run, fk_m[:, j]) for j in range(2)])
                v = (self.sc.plan_xy(plan, g + 1e-2) - self.sc.plan_xy(plan, g - 1e-2)) / 2e-2
                ds.append(tab - fm)
                vs.append(v)
            if ds:
                rows.append(dict(name=name, d=np.vstack(ds), v=np.vstack(vs)))
        return rows


# a3_phys.py constants and helpers (pan reversal).
W_STILL = 0.010     # rad/s
HOLD_MIN_S = 0.5
PAN_PRE, PAN_POST = 0.3, 1.2


def smooth_w(q, dt):
    w = np.gradient(q, dt, axis=0)
    k = np.ones(5) / 5
    return np.column_stack([np.convolve(w[:, j], k, mode="same") for j in range(q.shape[1])])


def phase_events(w, dt):
    """a3_phys.phase_labels, the event list only: the tick where each planned direction change of a joint starts."""
    n = len(w)
    events = [[] for _ in range(w.shape[1])]
    for j in range(w.shape[1]):
        x = w[:, j]
        mov = np.abs(x) >= W_STILL
        sg = np.sign(x)
        hold = np.zeros(n, bool)
        i = 0
        while i < n:
            if not mov[i]:
                k = i
                while k < n and not mov[k]:
                    k += 1
                if (k - i) * dt >= HOLD_MIN_S:
                    hold[i:k] = True
                i = k
            else:
                i += 1
        last_sign = 0
        i = 0
        while i < n:
            if mov[i]:
                k = i
                while k < n and mov[k] and sg[k] == sg[i]:
                    k += 1
                new_dir = (last_sign == 0) or (sg[i] != last_sign)
                after_hold = i > 0 and hold[i - 1]
                if new_dir or after_hold:
                    s0 = i
                    while s0 > 0 and not mov[s0 - 1] and not hold[s0 - 1]:
                        s0 -= 1
                    events[j].append(s0)
                last_sign = sg[i]
                i = k
            else:
                i += 1
    return events


def sustained(x, sign, n=3):
    ok = (np.sign(x) == sign) & (np.abs(x) > 0)
    for i in range(len(x) - n + 1):
        if ok[i:i + n].all():
            return i
    return None


def draw_panel(ax, src, d, color, title, title_size=15, rms_size=17, lw=1.3, rms_below=False):
    """drawfigs.draw_panel: gray reference strokes, the pen trace of each stroke, and the RMS."""
    for xy in src.ref_strokes(d["plan"]):
        ax.plot(xy[:, 0], xy[:, 1], color=C_REF, lw=3.2, solid_capstyle="round", zorder=1)
    for s in np.unique(d["idx"]):
        k = d["idx"] == s
        ax.plot(d["m"][k, 0], d["m"][k, 1], color=color, lw=lw, zorder=2)
    ax.set_aspect("equal")
    ax.invert_yaxis()
    ax.set_xticks([])
    ax.set_yticks([])
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.set_title(title, loc="left", fontsize=title_size)
    halo = [patheffects.withStroke(linewidth=3.5, foreground=chalk.BOARD)]
    if rms_below:
        ax.text(1.0, -0.02, f"{d['rms']:.2f} mm", transform=ax.transAxes, ha="right", va="top", fontsize=rms_size, color=color,
                zorder=3, path_effects=halo)
    else:
        ax.text(0.98, 0.02, f"{d['rms']:.2f} mm", transform=ax.transAxes, ha="right", va="bottom", fontsize=rms_size,
                color=color, zorder=3, path_effects=halo)


def fig_kitten_timeline(src):
    fig, axes = plt.subplots(2, 2, figsize=(6.4, 7.2))
    for ax, (pat, label), c in zip(axes.ravel(), STAGES, STAGE_COLORS):
        d = src.drawing(pat.format(f="kitty"))
        print(f"  kitten-timeline {pat.format(f='kitty')}: {d['rms']:.3f} mm")
        draw_panel(ax, src, d, c, "\n".join(wrap(label, 15, 3.0)))
    sub = "The same kitten, drawn four ways by the real arm. Gray: the reference line. Colour: where the pen really went."
    fig.suptitle("\n".join(wrap(sub, 14, 6.2)), x=0.01, ha="left", fontsize=14, color=C_INK2)
    fig.tight_layout(rect=(0, 0, 1, 0.94), h_pad=2.2, w_pad=0.8)
    chalk.save(fig, OUT / "kitten-timeline.png")


def fig_four_drawings(src):
    fig, axes = plt.subplots(2, 4, figsize=(6.4, 5.0))
    for j, f in enumerate(DRAWINGS):
        for i, (stage, col, what) in enumerate(((STAGES[0], C_INK, "no correction"), (STAGES[3], C_BLUE, "frozen head"))):
            d = src.drawing(stage[0].format(f=f))
            print(f"  four-drawings {stage[0].format(f=f)}: {d['rms']:.3f} mm")
            draw_panel(axes[i, j], src, d, col, f"{DRAWING_NAMES[f]}:\n{what}", title_size=13.5, rms_size=14, lw=1.1,
                       rms_below=True)
    fig.tight_layout(h_pad=2.4, w_pad=0.3)
    chalk.save(fig, OUT / "four-drawings.png")


def fig_goal_chatter(src):
    """chatterfig.py: lift joint (j = 1) of the head-off kitten, high-passed by a 15-tick moving mean."""
    z = src.arrays("base-m1z-pr15-kitty")
    t = z["time_s"]
    j = 1
    tq, q, g = z["target_q"][:, j] * 1000, z["q"][:, j] * 1000, z["goal_sent"][:, j] * 1000

    def hp(x, n=15):
        return x - np.convolve(x, np.ones(n) / n, mode="same")

    gh, qh = hp(g - tq), hp(q - tq)
    win = 150
    best = max(range(300, len(t) - win, 30), key=lambda i: np.std(gh[i:i + win]))
    sel = np.zeros(len(t), bool)
    sel[best:best + win] = True
    print(f"  goal-chatter: window {t[sel][0]:.2f} to {t[sel][-1]:.2f} s; RMS in window goal {gh[sel].std():.2f}, "
          f"joint {qh[sel].std():.2f} mrad; whole drawing goal {gh.std():.2f}, joint {qh.std():.2f} mrad")
    fig, ax = plt.subplots(2, 1, figsize=(6.4, 6.6), sharex=True)
    ax[0].plot(t[sel], gh[sel], color=C_ORANGE, lw=2.0)
    ax[0].axhline(0, color=C_INK2, lw=0.9)
    ax[0].set_ylabel("goal chatter\n(above ~4 Hz, mrad)", color=C_ORANGE)
    ax[1].plot(t[sel], qh[sel], color=C_INK2, lw=2.2)
    ax[1].axhline(0, color=C_INK2, lw=0.9)
    ax[1].set_ylabel("joint response\n(above ~4 Hz, mrad)", color=C_INK2)
    ax[1].set_xlabel("time (s)")
    ax[1].set_ylim(ax[0].get_ylim())
    ax[0].set_title("Lift joint, strongest 2.5 s of one drawing", loc="left")
    fig.tight_layout()
    chalk.save(fig, OUT / "goal-chatter.png")


def fig_head_offset(src):
    """headfig.py: the frozen head (v6) on the kitten, 25 s to 60 s."""
    z = src.arrays("v6-val-after-005-kitty")
    t = z["time_s"]
    q = z["target_q"][:, 0] * 1000
    g = z["ctl_oh_delta"][:, 0] * 1000
    dq = np.gradient(q, t)
    sel = (t > 25) & (t < 60)
    print(f"  head-offset: max |offset| {np.abs(g[sel]).max():.1f} mrad")
    fig, ax = plt.subplots(3, 1, figsize=(6.4, 7.6), sharex=True)
    ax[0].plot(t[sel], q[sel] - q[sel].mean(), color=C_INK, lw=2.2)
    ax[0].set_ylabel("planned pan angle\n(mrad)")
    ax[1].plot(t[sel], dq[sel], color=C_GRAY, lw=2.2)
    ax[1].axhline(0, color=C_INK2, lw=0.9)
    ax[1].set_ylabel("planned pan speed\n(mrad/s)")
    ax[2].plot(t[sel], g[sel], color=C_BLUE, lw=2.2)
    ax[2].axhline(0, color=C_INK2, lw=0.9)
    ax[2].set_ylabel("offset added by\nthe frozen head (mrad)")
    ax[2].set_xlabel("time (s)")
    for a, step in zip(ax, (50, 100, 10)):
        a.margins(x=0)
        a.yaxis.set_major_locator(MultipleLocator(step))
    ax[0].set_title("Offset that the frozen head adds to the\npan goal (kitten, Measured)", loc="left")
    fig.tight_layout(h_pad=0.8)
    chalk.save(fig, OUT / "head-offset.png")


def fig_pan_reversal(src):
    """data_figs.pan_reversal. Layout: the two panels are stacked (pan on top) for phone reading."""
    ev = src.reversal_events()
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 8.8))
    for ax, j, title in ((axes[0], 0, "Pan joint"), (axes[1], 1, "Shoulder lift joint")):
        E = ev[j]
        n = min(len(e["t"]) for e in E)
        T = E[0]["t"][:n]
        for key, col, lab in (("lead", C_BLUE, "goal sent, ahead of the plan"), ("lag", C_ORANGE, "joint angle, behind the plan")):
            M = np.array([e[key][:n] for e in E])
            ax.plot(T, M.mean(0), color=col, lw=2.6, label=lab)
            ax.fill_between(T, np.percentile(M, 25, axis=0), np.percentile(M, 75, axis=0), color=col, alpha=0.2, linewidth=0)
        ax.axhline(0, color=C_INK2, lw=0.9)
        delays = [e["delay_ms"] for e in E if e["delay_ms"] is not None]
        print(f"  pan-reversal {title}: {len(E)} events, median delay {np.median(delays):.2f} ms")
        ax.set_title(f"{title}: joint starts {np.median(delays):.0f} ms after the goal", fontsize=16)
        ax.set_xlabel("time since the planned speed crosses zero (s)")
        ax.set_ylabel("milliradians (mrad)")
        ax.yaxis.set_major_locator(MultipleLocator(10 if j == 0 else 20))
        ax.xaxis.set_major_locator(MultipleLocator(0.25))
    axes[0].legend(loc="upper left")
    fig.tight_layout(h_pad=1.6)
    chalk.save(fig, OUT / "pan-reversal.png")


def fig_nib_error_vs_speed(src):
    """data_figs.nib_error_vs_speed. Layout: the two panels are stacked (x on top) for phone reading."""
    rows = src.speed_rows()
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 8.6), sharey=True)
    for k, (ax, nm, col) in enumerate(zip(axes, ("x axis (the pan direction)", "y axis (lift, elbow, wrist flex)"), (C_BLUE, C_ORANGE))):
        v = np.concatenate([r["v"][:, k] for r in rows])
        d = np.concatenate([r["d"][:, k] for r in rows])
        edges = np.array([-35, -25, -15, -8, -3, 3, 8, 15, 25, 35])
        c, mu, sd = [], [], []
        for a, b in zip(edges[:-1], edges[1:]):
            s = (v >= a) & (v < b)
            if s.sum() > 40:
                c.append(v[s].mean())
                mu.append(d[s].mean())
                sd.append(d[s].std() / np.sqrt(s.sum() / 30))
        ax.scatter(v[::25], d[::25], s=5, color=C_GRAY, alpha=0.35, linewidths=0)
        ax.errorbar(c, mu, yerr=np.array(sd) * 2, color=col, lw=2.6, marker="o", ms=6.5, capsize=3.5, capthick=2.0)
        A = np.column_stack([np.ones_like(v), v])
        Wfit = np.linalg.lstsq(A, d, rcond=None)[0]
        vv = np.linspace(-35, 35, 200)
        ax.plot(vv, Wfit[0] + Wfit[1] * vv, color=C_INK, lw=1.3, ls="--")
        ax.axhline(0, color=C_REF, lw=1.0)
        ax.axvline(0, color=C_REF, lw=1.0)
        ax.set_title(f"Tablet {nm}", fontsize=16)
        ax.set_xlabel(f"planned nib speed along {'xy'[k]} (mm/s)")
        ax.set_ylim(-3.2, 3.2)
        print(f"  nib-error-vs-speed {'xy'[k]}: {len(rows)} runs, {len(v)} samples, straight-line slope {-Wfit[1] * 1e3:.1f} ms")
    axes[1].tick_params(labelleft=True)
    fig.supylabel("tablet position minus encoder position (mm)", fontsize=15, color=C_INK)
    fig.tight_layout(h_pad=1.6)
    chalk.save(fig, OUT / "nib-error-vs-speed.png")


# ----------------------------------------------------------------------------------------------------------------
# Value charts (redraw). Every value comes from figs.py of the light figures.


def bar_rows(ax, rows, xmax, value_pad, label_size=14.5, value_size=14.5, header_size=15.0):
    """Horizontal bars with the label above each bar. rows: (label, value, color, value text) or (header, None, ...)."""
    y = 0.0
    for name, v, col, txt in rows:
        if v is None:
            ax.text(0.0, y + 0.35, name, ha="left", va="baseline", fontsize=header_size, color=C_INK)
            y += 0.85
            continue
        ax.text(xmax * 0.004, y + 0.28, name, ha="left", va="baseline", fontsize=label_size, color=C_INK2)
        ax.barh(y + 0.62, v, color=col, height=0.5)
        ax.text(v + value_pad, y + 0.62, txt, va="center", fontsize=value_size, color=C_INK)
        y += 1.18
    ax.set_ylim(y - 0.2, -0.45)
    ax.set_yticks([])
    ax.set_xlim(0, xmax)


def fig_controllers_map():
    rows = [
        ("Measured, real arm, test drawings", None, None, None),
        ("Physics base, no correction", 2.74, C_GRAY, "2.74"),
        ("Physics base + residual network (PhysR)", 2.27, C_GRAY, "2.27"),
        ("Neural-network corrections", 1.15, C_ORANGE, "1.14 to 1.15"),
        ("Frozen correction head", 1.057, C_BLUE, "1.057"),
        ("Offline, held-out motions", None, None, None),
        ("Old linear model (30 features)", 1.131, C_GRAY, "1.131"),
        ("Linear hysteresis model", 1.029, C_AQUA, "1.029"),
        ("Kernel model", 1.008, C_AQUA, "1.008"),
    ]
    fig, ax = plt.subplots(figsize=(6.4, 6.6))
    bar_rows(ax, rows, 3.2, 0.04)
    ax.set_xticks([0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0])
    ax.set_xlabel("nib error, RMS (mm). Lower is better.")
    ax.set_title("Nib error of each controller", loc="left")
    fig.tight_layout()
    chalk.save(fig, OUT / "controllers-map.png")


def fig_error_parts():
    parts = [
        ("Pen lags the encoder reading on the x axis (pan direction)", 39, C_ORANGE),
        ("Pan starts late after a direction change", 18, C_ORANGE),
        ("Unexplained rest (includes tablet and encoder noise)", 10, C_GRAY),
        ("Tablet stream delay (a score artifact, no effect on ink)", 10, C_GRAY),
        ("Static map error (offset and position)", 9, C_GRAY),
        ("Wrist flex tracking", 4, C_GRAY),
        ("Pan tracking in steady motion and hold", 4, C_ORANGE),
        ("Elbow, lift and roll tracking", 3, C_GRAY),
        ("Pen lag on the y axis", 2, C_GRAY),
        ("Nib height, pressure, acceleration", 1, C_GRAY),
    ]
    fig, ax = plt.subplots(figsize=(6.4, 7.6))
    bar_rows(ax, [(n, v, c, f"{v} %") for n, v, c in parts], 47, 0.8)
    ax.set_xticks([0, 10, 20, 30, 40])
    ax.set_xlabel("share of the mean square error\n(Offline fit on Measured logs)")
    ax.set_title(f"Where the 2.74 mm goes:\nthe pan axis ({PAN_COLOR_WORD}) owns 61 %", loc="left")
    fig.tight_layout()
    chalk.save(fig, OUT / "error-parts.png")


def fig_learning_curve():
    N = [3, 6, 9, 12]
    curves = {"Old linear model": ([1.239, 1.211, 1.189, 1.177], (1.14, 1.16), (1.11, 1.14), C_GRAY),
              "Linear hysteresis model": ([1.120, 1.085, 1.049, 1.033], (0.98, 1.00), (0.93, 0.97), C_AQUA),
              "Kernel model": ([1.172, 1.067, 1.016, 0.985], (0.90, 0.94), (0.83, 0.91), C_ORANGE)}
    fig, ax = plt.subplots(figsize=(6.4, 5.4))
    for name, (v, r24, r48, c) in curves.items():
        ax.plot(N, v, color=c, lw=2.6, marker="o", label=name)
        for x, (lo, hi) in ((24, r24), (48, r48)):
            ax.plot([x, x], [lo, hi], color=c, lw=7, alpha=0.6, solid_capstyle="butt")
    ax.set_xscale("log")
    ax.minorticks_off()
    ax.set_xticks([3, 6, 12, 24, 48])
    ax.set_xticklabels(["3", "6", "12", "24", "48"])
    ax.set_xlabel("number of distinct training motions (log scale)")
    ax.set_ylabel("held-out nib error, RMS (mm)")
    ax.axvline(12, color=C_INK2, lw=1.0, ls=":")
    ax.text(12.6, 1.262, "my data stops here;\nthe bars on the right\nare extrapolations", fontsize=13, color=C_INK2, va="top")
    ax.set_title("More distinct motions keep helping\nthe kernel model (all Offline)", loc="left")
    ax.legend(loc="lower left")
    fig.tight_layout()
    chalk.save(fig, OUT / "learning-curve.png")


# ----------------------------------------------------------------------------------------------------------------
# Diagrams (redraw). The words come from armfig.py, sysdiagram.py, headdiagram.py, provdiagram.py and kalman.html.


def fig_arm_pan_lever():
    """armfig.py: side view of the arm and top view of one pan tick."""
    fig, (a, b) = plt.subplots(2, 1, figsize=(6.4, 9.7), gridspec_kw={"height_ratios": [1.25, 0.85]})
    a.set_xlim(-90, 500)
    a.set_ylim(-55, 480)
    a.set_aspect("equal")
    a.axis("off")
    a.add_patch(Rectangle((-50, -30), 150, 30, fc=chalk.BOARD_2, ec=C_INK2, lw=2))      # base
    a.add_patch(Rectangle((-10, 0), 50, 60, fc=chalk.BOARD_2, ec=C_INK2, lw=2))         # pan housing
    sh, el, wr, pen = (15, 100), (120, 310), (270, 300), (330, 215)
    a.plot([sh[0], el[0]], [sh[1], el[1]], color=C_INK2, lw=11, solid_capstyle="round")
    a.plot([el[0], wr[0]], [el[1], wr[1]], color=C_INK2, lw=11, solid_capstyle="round")
    a.plot([15, 15], [60, 100], color=C_INK2, lw=11, solid_capstyle="round")
    a.plot([wr[0], pen[0]], [wr[1], pen[1]], color=C_INK2, lw=9, solid_capstyle="round")
    a.plot([pen[0], pen[0] + 3], [pen[1], 149], color=C_INK, lw=4)                     # pen
    a.add_patch(Rectangle((200, 135), 210, 14, fc=chalk.BOARD_2, ec=C_BLUE, lw=1.8))     # tablet
    a.text(305, 112, "tablet", color=C_BLUE, ha="center", fontsize=14)
    for p, c in ((sh, C_INK2), (el, C_INK2), (wr, C_INK2), ((15, 45), C_ORANGE)):
        a.add_patch(Circle(p, 12, fc=chalk.BOARD, ec=c, lw=3))
    a.annotate("", xy=(15, 95), xytext=(333, 95), arrowprops=dict(arrowstyle="<->", color=C_ORANGE, lw=2))
    a.text(178, 66, "R: pan axis to pen", color=C_ORANGE, ha="center", fontsize=14)
    a.plot([15, 15], [-5, 430], color=C_ORANGE, lw=1.6, ls="--")
    a.annotate("", xy=(60, 400), xytext=(-30, 400),
               arrowprops=dict(arrowstyle="->", color=C_ORANGE, lw=2.5, connectionstyle="arc3,rad=-0.4"))
    a.text(15, 418, "shoulder pan:\nturns the whole arm\nabout a vertical axis", color=C_ORANGE, ha="center", va="bottom", fontsize=16)

    def lab(x, y, s, tx, ty):
        a.annotate(s, xy=(x, y), xytext=(tx, ty), fontsize=16, color=C_INK, ha="left", va="center",
                   arrowprops=dict(arrowstyle="-", color=C_INK2, lw=1.2))

    lab(sh[0] + 12, sh[1], "shoulder lift", 70, 40)
    lab(el[0], el[1] + 12, "elbow flex", 95, 375)
    lab(wr[0], wr[1] + 12, "wrist flex", 250, 350)
    lab(pen[0] + 8, pen[1] + 4, "wrist roll,\ngripper, pen", 345, 222)
    a.text(-55, -38, "side view, not to scale", fontsize=14, color=C_INK2, va="top")
    # top view
    b.set_xlim(-40, 330)
    b.set_ylim(-120, 100)
    b.set_aspect("equal")
    b.axis("off")
    R = 231
    b.add_patch(Circle((0, 0), 20, fc=chalk.BOARD_2, ec=C_INK2, lw=2))
    b.plot([0, R], [0, 0], color=C_INK2, lw=9, solid_capstyle="round")
    b.plot([R, R], [0, -8], color=C_INK, lw=3)
    th = np.deg2rad(8.8)
    b.plot([0, R * np.cos(th)], [0, R * np.sin(th)], color=C_ORANGE, lw=2.5, ls="--")
    b.add_patch(Wedge((0, 0), R, 0, 8.8, fc=C_ORANGE, alpha=0.22, ec="none"))
    b.annotate("", xy=(R * np.cos(th), R * np.sin(th)), xytext=(R, 0), arrowprops=dict(arrowstyle="<->", color=C_ORANGE, lw=2.5))
    b.text(R * 0.55, 62, "one tick of the pan moves\nthe pen 0.354 mm", color=C_ORANGE, fontsize=16, va="center", ha="center")
    b.text(115, -16, "R = 231 mm", color=C_INK2, ha="center", fontsize=14)
    b.text(150, -48, "0.354 mm  =  R × tick angle\n= 231 mm × 1.534 mrad\n(one tick = 2π / 4096)", fontsize=17, color=C_INK,
           ha="center", va="top")
    b.text(-38, 98, "top view: the tick angle is drawn 100 times too big", fontsize=14, color=C_INK2, va="top")
    b.text(0, -26, "pan axis", fontsize=14, color=C_INK2, ha="center", va="top")
    fig.tight_layout()
    chalk.save(fig, OUT / "arm-pan-lever.png")


def fig_system():
    """sysdiagram.py. Same boxes, arrows and words; text sizes for a phone."""
    B = Board()
    L, LW = 38.0, 228.0            # main column
    RX, RW = 292.0, 132.0          # right column
    GAP = 26.0
    ref = B.box(L, 12, LW, "Reference drawing", ["a path in tablet millimeters"], C_BLUE)
    ik = B.box(L, ref["bottom"] + GAP, LW, "Inverse kinematics", ["joint path q*(t) for the five joints"], C_BLUE)
    hd_h = 2 * 8 + 16 * 1.22 + 2 * 14 * 1.28 + 6
    head = B.box(RX, ik["cy"] - hd_h / 2, RW, "Correction head", ["path features in,", "joint offsets out"], C_BLUE, h=hd_h)
    py = max(ik["bottom"], head["bottom"]) + 30
    B.plus(ik["cx"], py)
    phys = B.box(L, py + 34, LW, "Physics controller", ["EKF state estimate", "inverse dynamics", "goal search, 15 ticks ahead"], C_BLUE)
    servo = B.box(L, phys["bottom"] + 36, LW, "Servo", ["P loop in each joint: goal in, torque out"], C_BLUE)
    arm = B.box(L, servo["bottom"] + 36, LW, "Arm", ["5 joints and links, pen in the sleeve"], C_BLUE)
    tab = B.box(L, arm["bottom"] + 40, LW, "Tablet", ["reads the pen tip position"], C_ORANGE)
    err = B.box(RX, tab["y"], RW, "Error", ["tablet minus reference"], C_ORANGE, h=tab["h"])
    score = B.box(RX, err["bottom"] + 36, RW, "Score", ["RMS error in mm"], C_ORANGE)
    cx = ik["cx"]
    B.arrow([(cx, ref["bottom"]), (cx, ik["y"])])
    B.arrow([(cx, ik["bottom"]), (cx, py - 10.5)])
    B.arrow([(cx, py + 10.5), (cx, phys["y"])])
    B.arrow([(cx, phys["bottom"]), (cx, servo["y"])])
    B.arrow([(cx, servo["bottom"]), (cx, arm["y"])])
    B.arrow([(cx, arm["bottom"]), (cx, tab["y"])])
    B.arrow([(ik["right"], ik["cy"]), (head["x"], ik["cy"])])
    hx = head["x"] + 30
    B.arrow([(hx, head["bottom"]), (hx, py), (cx + 10.5, py)])
    B.arrow([(tab["right"], tab["cy"]), (err["x"], tab["cy"])], C_ORANGE)
    B.arrow([(err["cx"], err["bottom"]), (err["cx"], score["y"])], C_ORANGE)
    xr = B.W - 8
    B.arrow([(ref["right"], ref["cy"]), (xr, ref["cy"]), (xr, err["y"] + err["h"] * 0.72), (err["right"], err["y"] + err["h"] * 0.72)],
            C_ORANGE)
    xd = err["x"] + err["w"] * 0.82
    B.arrow([(xd, err["y"]), (xd, head["bottom"])], C_ORANGE, dashed=True)
    xe = L - 22
    B.arrow([(L, arm["cy"]), (xe, arm["cy"]), (xe, phys["cy"]), (L, phys["cy"])])
    B.text(xd + 13, (head["bottom"] + err["y"]) / 2, "online head only: learns from the tablet error", 14, C_ORANGE, ha="center",
           va="center", rotation=90)
    B.text(xe - 10, (phys["cy"] + arm["cy"]) / 2, "encoder readings", 14, C_INK2, ha="center", va="center", rotation=90)
    x = B.pill(cx + 26, py - 12, "c", C_BLUE)
    B.text(x + 6, py - 6.5, "correction", 14, C_INK2)
    yb = (servo["bottom"] + arm["y"]) / 2
    x = B.pill(cx + 12, yb, "tr", C_BLUE)
    B.text(x + 6, yb + 5, "servo lag: goal vs encoders", 14, C_INK2)
    yb = (arm["bottom"] + tab["y"]) / 2
    x = B.pill(cx + 12, yb, "u", C_ORANGE)
    B.text(x + 6, yb + 5, "bending, play, drag, tablet delay", 14, C_INK2)
    y = score["bottom"] + 26
    for col, label in ((C_BLUE, "runs without the tablet (encoders and the path only)"), (C_ORANGE, "lab only (the tablet)")):
        B.ax.add_patch(FancyBboxPatch((L - 8, y), 14, 14, boxstyle="round,pad=0,rounding_size=3", fc=to_rgba(col, 0.10), ec=col, lw=2))
        B.text(L + 14, y + 11.5, label, 14, C_INK2)
        y += 22
    chalk.save(B.finish(y + 6), OUT / "system.png")


def fig_head_schematic():
    """headdiagram.py."""
    B = Board()
    L, LW = 38.0, 232.0
    RX, RW = 300.0, 152.0
    p1 = B.box(L, 12, LW, "Planned joint path q*(t)", ["from the drawing, five joints"], C_BLUE)
    feat = B.box(L, p1["bottom"] + 30, LW, "Features of the path",
                 ["for each joint: sin, cos, angle,", "speed, acceleration, saturated speed", "30 numbers + 1 constant"], C_BLUE)
    wmap = B.box(L, feat["bottom"] + 30, LW, "Linear map W", ["5 × 31 weights, one row per joint"], C_BLUE)
    offs = B.box(L, wmap["bottom"] + 30, LW, "Joint offsets g", ["a few mrad, added to the goals"], C_BLUE)
    py = offs["bottom"] + 34
    B.plus(offs["cx"], py)
    to = B.box(L, py + 32, LW, "To the physics controller", ["goal = path + offsets"], C_BLUE)
    cx = p1["cx"]
    B.arrow([(cx, p1["bottom"]), (cx, feat["y"])])
    B.arrow([(cx, feat["bottom"]), (cx, wmap["y"])])
    B.arrow([(cx, wmap["bottom"]), (cx, offs["y"])])
    B.arrow([(cx, offs["bottom"]), (cx, py - 10.5)])
    B.arrow([(cx, py + 10.5), (cx, to["y"])])
    xb = L - 22
    B.arrow([(L, p1["cy"]), (xb, p1["cy"]), (xb, py), (cx - 10.5, py)])
    te = B.box(RX, feat["y"], RW, "Tablet error", ["lab only, in mm"], C_ORANGE)
    lab = B.box(RX, te["bottom"] + 26, RW, "Label y", ["the joint offset that", "would have cancelled", "that error"], C_ORANGE)
    rls = B.box(RX, lab["bottom"] + 26, RW, "RLS update", ["changes W a little"], C_ORANGE)
    B.arrow([(rls["cx"], te["bottom"]), (rls["cx"], lab["y"])], C_ORANGE)
    B.arrow([(rls["cx"], lab["bottom"]), (rls["cx"], rls["y"])], C_ORANGE)
    xm = (L + LW + RX) / 2
    B.arrow([(RX, rls["cy"]), (xm, rls["cy"]), (xm, wmap["cy"]), (L + LW, wmap["cy"])], C_ORANGE, dashed=True)
    y = rls["bottom"] + 22
    y = B.lines(RX - 6, y, B.wrap("The online head does this while the arm draws.", 15, B.W - RX), 15, C_ORANGE)
    y = B.lines(RX - 6, y + 12, B.wrap("The frozen head stops this step. It needs only the path.", 15, B.W - RX), 15, C_INK)
    chalk.save(B.finish(max(to["bottom"], y) + 10), OUT / "head-schematic.png")


def fig_numbers():
    """provdiagram.py: three columns, one for each label of a number."""
    B = Board()
    # The line breaks of provdiagram.py; a line that is too wide for a phone column is wrapped again.
    cols = [("Measured", "real arm", C_BLUE,
             [["The arm draws a", "test drawing."], ["The tablet and the", "encoders log the run."],
              ["Pen minus reference at", "the same moment, as RMS."], ["2.74 mm, 1.057 mm"], ["Ranks controllers"]]),
            ("Offline", "recorded data", C_AQUA,
             [["Logs of real runs,", "split by whole motion."], ["Fit a model on some", "motions. Test on others."],
              ["Predict the pen error", "with a frozen scorer."], ["2.22 mm, 1.008 mm,", "0.847 mm"], ["Proposes candidates"]]),
            ("Simulation", "software arm", C_ORANGE,
             [["A model of the arm,", "fitted on real logs."], ["The model plays the arm.", "The controller draws on it."],
              ["Score the drawing", "as for the real arm."], ["seqplan: at most 5 %", "better"], ["Never ranks learned", "models"]])]
    gap, m = 9.0, 4.0
    cw = (B.W - 2 * m - 2 * gap) / 3
    xs = [m + i * (cw + gap) for i in range(3)]
    size, pad = 13.5, 5.0
    for x, (name, sub, col, _) in zip(xs, cols):
        B.ax.add_patch(FancyBboxPatch((x, 8), cw, 50, boxstyle="round,pad=0,rounding_size=7", fc=to_rgba(col, 0.22), ec=col, lw=2.6))
        B.text(x + cw / 2, 31, name, 19, col, ha="center")
        B.text(x + cw / 2, 50, sub, 14, C_INK, ha="center")
    y = 76.0
    for r in range(5):
        wrapped = [sum((B.wrap(line, size, cw - 2 * pad) for line in c[3][r]), []) for c in cols]
        n = max(len(w) for w in wrapped)
        h = 2 * pad + n * size * 1.28 + 4
        for x, (name, sub, col, _), lines in zip(xs, cols, wrapped):
            fc = to_rgba(col, 0.10) if r < 4 else chalk.BOARD
            B.ax.add_patch(FancyBboxPatch((x, y), cw, h, boxstyle="round,pad=0,rounding_size=7", fc=fc, ec=col, lw=2.0))
            B.lines(x + cw / 2, y + (h - len(lines) * size * 1.28) / 2 - 1, lines, size, C_INK, ha="center")
            if r < 4:
                B.arrow([(x + cw / 2, y + h), (x + cw / 2, y + h + 22)], col, lw=2.2)
        y += h + 22
    y = B.lines(B.W / 2, y + 2, ["Every number in this part carries one of these three labels.",
                                 "Only the left column ranks controllers."], 14.5, C_INK2, ha="center")
    chalk.save(B.finish(y + 6), OUT / "numbers.png")


def fig_kalman_intuition():
    """kalman.html: the shape of the update, the RLS head and the EKF, with the same color for each role."""
    B = Board()
    X0, X1 = 6.0, B.W - 6.0
    eq_size, body = 21.0, 14.5
    blue, gray, org, grn, pur, ink = C_BLUE, C_INK2, C_ORANGE, C_AQUA, C_PURPLE, C_INK

    def row(segs, y, size=eq_size, center=True):
        """One equation line of colored segments. A segment is (mathtext, color) or ("frac", num, den)."""
        def seg_w(s):
            if s[0] == "frac":
                return max(sum(B.width(t, size) for t, _ in s[1]), sum(B.width(t, size) for t, _ in s[2])) + 6
            return B.width(s[0], size)

        widths = [seg_w(s) for s in segs]
        gaps = [(s[3] if len(s) > 3 else 0.0) if s[0] == "frac" else (s[2] if len(s) > 2 else 0.0) for s in segs]
        total = sum(widths) + sum(gaps)
        x = (X0 + X1 - total) / 2 if center else X0 + 14
        placed = []
        for s, w, g in zip(segs, widths, gaps):
            if s[0] == "frac":
                nw = sum(B.width(t, size) for t, _ in s[1])
                dw = sum(B.width(t, size) for t, _ in s[2])
                yb = y - size * 0.32
                B.ax.plot([x + 1, x + w - 1], [yb, yb], color=ink, lw=1.6)
                xx = x + (w - nw) / 2
                for t, c in s[1]:
                    B.text(xx, yb - size * 0.28, t, size, c)
                    xx += B.width(t, size)
                xx = x + (w - dw) / 2
                for t, c in s[2]:
                    B.text(xx, yb + size * 1.0, t, size, c)
                    xx += B.width(t, size)
            else:
                B.text(x, y, s[0], size, s[1])
            placed.append((x, x + w))
            x += w + g
        return placed

    def card(y, title, build):
        top = y
        y = B.rich(X0 + 12, y + 10, X1 - X0 - 24, [(title, ink)], 16.5, gap=1.25)
        y = build(y + 4)
        B.ax.add_patch(FancyBboxPatch((X0, top), X1 - X0, y + 10 - top, boxstyle="round,pad=0,rounding_size=10", fc="none",
                                      ec=chalk.FAINT, lw=2.0))
        return y + 10

    y = B.rich(X0, 6, X1 - X0, [("The two online estimators update in one shape", chalk.YELLOW)], 19, gap=1.2)
    y = B.rich(X0, y + 2, X1 - X0, [("New belief = old belief + gain × surprise. (The EKF of the physics controller and the RLS head both do this.)",
                                     C_INK2)], 14.5)
    y += 10

    def card1(y):
        yb = y + 34
        segs = [(r"$\hat{x}_{\mathrm{new}}$", blue, 16), (r"$=$", ink, 16), (r"$\hat{x}_{\mathrm{old}}$", gray, 16),
                (r"$+$", ink, 16), (r"$K$", org, 22), (r"$(y-\hat{y})$", grn)]
        placed = row(segs, yb)
        for (x0, x1), lab in zip([placed[0], placed[2], placed[4], placed[5]], ["new belief", "old belief", "gain", "surprise"]):
            brace(B.ax, x0 - 2, x1 + 2, yb + 9, 9, ink)
            B.text((x0 + x1) / 2, yb + 37, lab, 15, ink, ha="center")
        y = yb + 50
        y = B.rich(X0 + 12, y, X1 - X0 - 24, [("new belief", blue), (": my estimate after the reading. ", ink), ("old belief", gray),
                                              (": my estimate before it. ", ink), ("surprise", grn), (": the reading minus what I predicted. ", ink),
                                              ("gain K", org), (": how much I trust the reading. For one number it runs from 0 (ignore it) "
                                                                "to 1 (copy it).", ink)], body)
        ex_top = y + 8
        y2 = B.rich(X0 + 22, ex_top + 6, X1 - X0 - 44,
                    [("Example (one number): the head offers a 2 mrad joint offset. The label says 5 mrad would have cancelled the error. "
                      "The surprise is 3 mrad. With a gain of 0.1, the new offset is 2 + 0.1 × 3 = 2.3 mrad.", ink)], body)
        patch = FancyBboxPatch((X0 + 12, ex_top), X1 - X0 - 24, y2 + 8 - ex_top, boxstyle="round,pad=0,rounding_size=8",
                               fc=chalk.BOARD_2, ec="none", zorder=0)
        B.ax.add_patch(patch)
        return y2 + 8

    y = card(y, "1. The shape", card1) + 14

    def card2(y):
        segs = [(r"$K$", org, 8), (r"$=$", ink, 8),
                ("frac", [(r"$P$", pur), (r"$\,\phi$", ink)], [(r"$\lambda+\phi^{\top}$", ink), (r"$P$", pur), (r"$\,\phi$", ink)])]
        yb = y + 40
        row(segs, yb)
        y = B.rich(X0 + 12, yb + 30, X1 - X0 - 24, [("Gain.", org), (" Big when the head is unsure (large ", ink), ("P", pur),
                                                     (") and the feature φ is active. Small when it is sure.", ink)], body)
        yb = y + 32
        row([(r"$W_{\mathrm{new}}$", blue, 8), (r"$=$", ink, 8), (r"$W_{\mathrm{old}}$", gray, 8), (r"$+$", ink, 8),
             (r"$(y-W\phi)$", grn, 5), (r"$K^{\top}$", org)], yb)
        y = B.rich(X0 + 12, yb + 12, X1 - X0 - 24, [("Weights", blue), (" move by ", ink), ("gain", org), (" × ", ink), ("surprise", grn),
                                                     (", where the surprise is the label y minus what the head predicted.", ink)], body)
        yb = y + 40
        row([(r"$P_{\mathrm{new}}$", pur, 8), (r"$=$", ink, 8), ("frac", [(r"$1$", ink)], [(r"$\lambda$", ink)], 4),
             (r"$($", ink, 1), (r"$P$", pur, 4), (r"$-$", ink, 4), (r"$K$", org, 3), (r"$\phi^{\top}$", ink, 2), (r"$P$", pur, 1),
             (r"$)$", ink)], yb)
        y = B.rich(X0 + 12, yb + 30, X1 - X0 - 24, [("Uncertainty", pur), (" shrinks after every reading. A forgetting factor λ below 1 "
                                                                         "would let it grow back, so old data count less.", ink)], body)
        return y

    y = card(y, "2. The correction head (RLS): the same shape with weights W and an uncertainty P", card2) + 14

    def card3(y):
        yb = y + 30
        row([(r"$\hat{d}_{\mathrm{new}}$", blue, 7), (r"$=$", ink, 7), (r"$\hat{d}_{\mathrm{old}}$", gray, 7), (r"$+$", ink, 7),
             (r"$K$", org, 4), (r"$(q_{\mathrm{encoder}}-\hat{q}{}_{\mathrm{model}})$", grn)], yb, size=19)
        y = B.rich(X0 + 12, yb + 14, X1 - X0 - 24, [("The state holds each joint's speed and a missing torque d. The ", ink), ("surprise", grn),
                                                     (" is the encoder reading minus the model's prediction. If the arm lags more than "
                                                      "the model says, the missing torque estimate grows.", ink)], body)
        return y

    y = card(y, "3. The physics controller's extended Kalman filter (EKF): the same shape again", card3)
    chalk.save(B.finish(y + 6), OUT / "kalman-intuition.png")


# ----------------------------------------------------------------------------------------------------------------
# Time-lapse video (timelapse.py)

TL_SPEED, TL_FPS = 8, 20                       # timelapse.py: SPEED = 8 (8x speed), FPS = 20
TL_DRAW = int(100 / (TL_SPEED / TL_FPS)) + 10  # timelapse.py nfr: 260 drawing frames in each stage (104 s of arm time)
TL_HOLD = int(TL_FPS * 1.2)                    # 24 frames that hold the end of each stage
TL_POSTER = 60                                 # the old poster is frame 60 (3.0 s) of the old video
TL_CRF = 24                                    # timelapse.py: libx264, CRF 24
# Layout for the phone column: a 6.4 in frame (as the figures) with the four drawings in one row and the bars under
# them, and the RMS of each drawing under it (four-drawings.png does the same). timelapse.py had a 12.8 x 7.2 in
# frame with the drawings in a 2 x 2 grid, each RMS beside the drawing name, and the bars on the right.
TL_W, TL_H = 6.4, 5.84                         # inches
TL_DPI = 150                                   # 960 x 876 px frames
TL_LEFT = 0.12                                 # left margin (in)
TL_PANEL, TL_GAP, TL_PANEL_TOP = 1.48, 0.08, 1.22
TL_BAR_TOP, TL_BAR_PITCH, TL_BAR_H = 3.12, 0.53, 0.22
TL_XMAX = 3.9                                  # timelapse.py: bar axis from 0 to 3.9 mm


def _grain_frame(rgb):
    """The chalk grain of chalk.save() on one video frame (runs in a worker process)."""
    return chalk.chalk_grain(rgb, scale=rgb.shape[1] / 720.0)


def fig_timelapse(src):
    """timelapse.py: the tablet trace of each test drawing drawn again at 8x speed, one controller per stage.

    The frames, their timing and every printed text are those of timelapse.py. The poster is frame TL_POSTER of the
    same render, with the same chalk grain."""
    data = [[src.drawing(pat.format(f=f)) for f in DRAWINGS] for pat, _ in STAGES]
    means = [float(np.mean([d["rms"] for d in row])) for row in data]
    print("  timelapse stage means (mm):", [round(m, 3) for m in means])

    fig = plt.figure(figsize=(TL_W, TL_H), dpi=TL_DPI)
    fig.patch.set_sketch_params(None)
    top = fig.add_axes([0, 0, 1, 1])
    top.set_xlim(0, TL_W)
    top.set_ylim(TL_H, 0)
    top.axis("off")

    def inch_axes(x, y, w, h):
        return fig.add_axes([x / TL_W, 1 - (y + h) / TL_H, w / TL_W, h / TL_H])

    L = TL_LEFT
    axs = [inch_axes(L + i * (TL_PANEL + TL_GAP), TL_PANEL_TOP, TL_PANEL, TL_PANEL) for i in range(4)]
    title = top.text(L, 0.10, "", fontsize=20, va="top")
    sub = top.text(L, 0.56, "", fontsize=15, color=C_INK2, va="top")
    note_y = TL_BAR_TOP + 4 * TL_BAR_PITCH + 0.02
    top.text(L, note_y, "nib error, RMS (lower is better)", fontsize=14, color=C_INK2, va="top")
    top.text(L, note_y + 0.30, "8x speed. Same night, same tablet pose. Tablet recordings of the real arm.", fontsize=14,
             color=C_INK2, va="top")
    inch_per_mm = (TL_W - 2 * L) / TL_XMAX

    def frames():
        stage_artists = []
        for si, ((_, label), col) in enumerate(zip(STAGES, STAGE_COLORS)):
            for a in stage_artists:
                a.remove()
            stage_artists = []
            objs = []
            for ax, d, f in zip(axs, data[si], DRAWINGS):
                ax.cla()
                ax.set_aspect("equal", adjustable="datalim")
                ax.invert_yaxis()
                ax.set_xticks([])
                ax.set_yticks([])
                for sp in ax.spines.values():
                    sp.set_visible(False)
                for xy in src.ref_strokes(d["plan"]):
                    ax.plot(xy[:, 0], xy[:, 1], color=C_REF, lw=3.2, solid_capstyle="round")
                lines = {s: ax.plot([], [], color=col, lw=1.1)[0] for s in np.unique(d["idx"])}
                dot, = ax.plot([], [], "o", color=col, ms=5, zorder=5)
                ax.set_title(DRAWING_NAMES[f], loc="left", fontsize=15, color=C_INK2)
                lab = ax.text(1.0, -0.02, "", transform=ax.transAxes, ha="right", va="top", fontsize=16, color=col)
                objs.append((d, lines, dot, lab, d["tm"].min()))
            title.set_text(f"Stage {si + 1} of 4: {label}")
            title.set_color(col)
            sub.set_text(f"Mean error of the four test drawings: {means[si]:.2f} mm")
            for k in range(4):
                y = TL_BAR_TOP + k * TL_BAR_PITCH
                now = k == si
                stage_artists.append(top.text(L, y, STAGES[k][1], fontsize=14, color=C_INK if now else C_INK2, va="top"))
                if k <= si:
                    v = means[k]
                    # timelapse.py: the bar of the stage on screen in its pen color, earlier stages in light gray.
                    c = STAGE_COLORS[k] if now else C_REF
                    stage_artists.append(top.add_patch(Rectangle((L, y + 0.25), v * inch_per_mm, TL_BAR_H, fc=c, ec="none")))
                    stage_artists.append(top.text(L + v * inch_per_mm + 0.06, y + 0.25 + TL_BAR_H / 2, f"{v:.2f} mm",
                                                  fontsize=16, va="center", color=c if now else C_INK2))
            for i in range(TL_DRAW):
                tau = i * TL_SPEED / TL_FPS
                for d, lines, dot, lab, t0 in objs:
                    for s, ln in lines.items():
                        k = (d["idx"] == s) & ((d["tm"] - t0) <= tau)
                        ln.set_data(d["m"][k, 0], d["m"][k, 1])
                    k = np.flatnonzero((d["tm"] - t0) <= tau)
                    done = tau >= (d["tm"].max() - t0)
                    if len(k) and not done and tau - (d["tm"][k[-1]] - t0) < 0.3:
                        j = k[-1]
                        dot.set_data([d["m"][j, 0]], [d["m"][j, 1]])
                    else:
                        dot.set_data([], [])
                    lab.set_text(f"{d['rms']:.2f} mm" if done else "")
                yield
            for _ in range(TL_HOLD):
                yield

    width, height = round(TL_W * TL_DPI), round(TL_H * TL_DPI)
    video, poster = OUT / "timelapse.mp4", OUT / "timelapse-poster.jpg"
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
           "-r", str(TL_FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(TL_CRF),
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    count = 0

    def write(rgb):
        nonlocal count
        if count == TL_POSTER:
            Image.fromarray(rgb).save(poster, quality=75, optimize=True)  # about the size of the old poster
        proc.stdin.write(rgb.tobytes())
        count += 1

    queue = deque()
    with ProcessPoolExecutor(max_workers=os.cpu_count() or 2) as pool:
        for _ in frames():
            fig.canvas.draw()
            rgb = np.ascontiguousarray(np.asarray(fig.canvas.buffer_rgba())[..., :3])
            assert rgb.shape == (height, width, 3), rgb.shape
            queue.append(pool.submit(_grain_frame, rgb))
            while len(queue) > 4 * (os.cpu_count() or 2):
                write(queue.popleft().result())
        while queue:
            write(queue.popleft().result())
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError("ffmpeg failed for timelapse.mp4")
    plt.close(fig)
    print(f"  timelapse: {count} frames at {TL_FPS} fps ({count / TL_FPS:.1f} s), {width} x {height} px")


# ----------------------------------------------------------------------------------------------------------------

DATA_FIGS = {"kitten-timeline": fig_kitten_timeline, "four-drawings": fig_four_drawings, "goal-chatter": fig_goal_chatter,
             "head-offset": fig_head_offset, "pan-reversal": fig_pan_reversal, "nib-error-vs-speed": fig_nib_error_vs_speed,
             "timelapse": fig_timelapse}
PLAIN_FIGS = {"arm-pan-lever": fig_arm_pan_lever, "system": fig_system, "head-schematic": fig_head_schematic,
              "numbers": fig_numbers, "kalman-intuition": fig_kalman_intuition, "controllers-map": fig_controllers_map,
              "error-parts": fig_error_parts, "learning-curve": fig_learning_curve}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--runs", help="folder of the Measured run folders (arm-workshop runs/ws-online/rand)")
    ap.add_argument("--rsc", help="export of robot-self-calibration 76c4c9fd (studies/workshop-1010/draw, src, assets/so101)")
    ap.add_argument("--only", nargs="*", default=None, help="figure names without .png")
    args = ap.parse_args()
    names = args.only or list(PLAIN_FIGS) + list(DATA_FIGS)
    unknown = [n for n in names if n not in PLAIN_FIGS and n not in DATA_FIGS]
    if unknown:
        raise SystemExit(f"unknown figure names: {unknown}")
    chalk.use()
    src = None
    if any(n in DATA_FIGS for n in names):
        if not (args.runs and args.rsc):
            raise SystemExit("the data figures need --runs and --rsc")
        src = Runs(args.runs, args.rsc)
    for n in names:
        print(n)
        if n in PLAIN_FIGS:
            PLAIN_FIGS[n]()
        else:
            DATA_FIGS[n](src)


if __name__ == "__main__":
    main()
