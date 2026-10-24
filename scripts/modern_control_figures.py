"""Chalk figures for the article How robot control is changing.

Run from the repository root:
    python3 scripts/modern_control_figures.py

Writes three bar charts drawn from paper tables, the candidate-paths teaching
diagram (geometry from v2/candidate-paths.svg), and a chalk redraw of the
Robostral Navigate system figure. The redraw keeps the camera frames as crops
of the original PNG, so the original file must stay next to it.
"""

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D
from matplotlib.patches import (Circle, Ellipse, FancyArrowPatch, FancyBboxPatch, Patch, PathPatch,
                                Polygon)
from matplotlib.path import Path as MplPath
from matplotlib.transforms import Affine2D
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/modern-control"
NOTE_SIZE = 13

# EXPO-FT Table 2 (arXiv 2605.25477, CC BY 4.0): successful trials out of 30
# for the same base VLA. Integers read from the bar lengths of the old chart and
# checked against its alt text: SFT mean 20.5, HG-DAgger mean 22.1, mean 19.1
# minutes of online robot data for EXPO-FT.
EXPO_TASKS = [
    # (task, minutes of online robot data for EXPO-FT, SFT, HG-DAgger, EXPO-FT)
    ("Egg Flip", 18, 16, 18, 30),
    ("String lights: route I", 18, 23, 18, 30),
    ("String lights: route II", 35, 21, 25, 30),
    ("String lights: insert", 16, 23, 24, 30),
    ("Candy Scoop", 20, 22, 28, 30),
    ("Cube Pick", 14, 22, 26, 30),
    ("Flower Insert", 14, 14, 24, 30),
    ("Pool Shot", 18, 23, 14, 30),
]

# RoboMME main results table (arXiv 2603.04639, CC BY 4.0): average success
# over 16 memory tasks, same pi0.5 backbone in every row.
ROBOMME = [
    ("π0.5, current view only", 17.9),
    ("π0.5 + past actions", 19.7),
    ("Recurrent memory (best, TTT)", 22.4),
    ("Language subgoals (MemER)", 42.4),
    ("Sampled past frames (best)", 44.5),
]

# Robostral Navigate Table 1 and Section 4.1 (arXiv 2607.20785, CC BY 4.0):
# success rate on R2R-CE, unseen buildings (val-unseen).
R2R = [
    ("StreamVLN (1 camera)", 56.9),
    ("Qwen-RobotNav-4B (1 camera)", 66.9),
    ("OmniNav (depth or more cameras)", 69.5),
    ("Qwen-RobotNav-8B (depth or more cameras)", 72.1),
    ("Robostral Navigate before RL (1 camera)", 73.4),
    ("Robostral Navigate after RL (1 camera)", 77.4),
]


def note(ax, text, offset=-58):
    """Data note under the plot, in the secondary ink."""
    ax.annotate(text, xy=(0, 0), xycoords="axes fraction", xytext=(0, offset),
                textcoords="offset points", ha="left", va="top",
                fontsize=NOTE_SIZE, color=chalk.DIM, linespacing=1.3)


def label_above(ax, x, y, text):
    """Category label just above a bar (y axis points down), on a board patch over the grid."""
    ax.text(x, y, text, ha="left", va="bottom", color=chalk.CHALK,
            bbox=chalk.label_box(pad=0.05))


def bar_axes(ax, xlim, ticks, xlabel, rows, pitch):
    """x axis as in the old chart; the y axis points down, one row per pitch."""
    ax.set_xlim(*xlim)
    ax.set_xticks(ticks)
    ax.set_xlabel(xlabel)
    ax.set_ylim(rows * pitch - 0.55, -0.78)
    ax.set_yticks([])
    ax.grid(True, axis="x")
    ax.set_axisbelow(True)


def rl_finetune_results():
    fig, ax = plt.subplots(figsize=(6.4, 8.6))
    series = [
        ("Imitation fine-tuning (SFT)", chalk.FAINT),
        ("Imitation + human corrections (HG-DAgger)", chalk.DIM),
        ("EXPO-FT (reinforcement learning)", chalk.RED),
    ]
    pitch, height = 1.6, 0.3
    for i, (task, minutes, *values) in enumerate(EXPO_TASKS):
        top = i * pitch
        for k, (value, (_, color)) in enumerate(zip(values, series)):
            ax.barh(top + (k + 0.5) * height, value, height=height * 0.92, color=color)
        label_above(ax, 0.3, top - 0.1, f"{task}  ({minutes} min)")
    bar_axes(ax, (0, 30.6), [0, 10, 20, 30], "Successful trials out of 30", len(EXPO_TASKS), pitch)
    ax.legend(handles=[Patch(color=c, label=name) for name, c in series],
              loc="lower left", bbox_to_anchor=(0, 1.0), ncol=1, borderaxespad=0.2,
              handlelength=1.4, labelspacing=0.35, alignment="left")
    ax.set_title("Same base VLA, same tasks:\npractice versus more copying", pad=104)
    note(ax, "Data: EXPO-FT, Table 2 (arXiv 2605.25477, CC BY 4.0).\n"
             "In brackets: minutes of online robot data for EXPO-FT.")
    chalk.save(fig, OUT / "v3/rl-finetune-results.png")


def value_bars(ax, rows, colors, left, pitch=1.0, height=0.46):
    for i, ((name, value), color) in enumerate(zip(rows, colors)):
        y = i * pitch
        if isinstance(color, tuple):  # (color, fill alpha): a lighter tint of the same color
            color, alpha = color
            ax.barh(y, value - left, left=left, height=height, color=color, alpha=alpha)
            ax.barh(y, value - left, left=left, height=height, facecolor="none",
                    edgecolor=color, linewidth=1.6)
        else:
            ax.barh(y, value - left, left=left, height=height, color=color)
        ax.text(value + 0.6, y, f"{value}%", va="center", color=chalk.CHALK,
                bbox=chalk.label_box(pad=0.08))
        label_above(ax, left + 0.45, y - height / 2 - 0.05, name)


def robomme_memory():
    fig, ax = plt.subplots(figsize=(6.4, 5.2))
    # The old chart drew the no-memory baseline darkest, the other memory types
    # in mid gray, and the best one in red.
    colors = [chalk.CHALK, chalk.DIM, chalk.DIM, chalk.DIM, chalk.RED]
    value_bars(ax, ROBOMME, colors, left=0)
    bar_axes(ax, (0, 52), [0, 10, 20, 30, 40, 50], "Average success over 16 memory tasks (%)",
             len(ROBOMME), 1.0)
    ax.set_title("RoboMME: the same π0.5 policy\nwith and without memory", pad=12)
    note(ax, "Data: RoboMME, main results table (arXiv 2603.04639,\n"
             "CC BY 4.0). Simulation benchmark.")
    chalk.save(fig, OUT / "v3/robomme-memory.png")


def robostral_r2r():
    fig, ax = plt.subplots(figsize=(6.4, 6.0))
    # Old chart colors, bar by bar: light gray for StreamVLN and OmniNav, dark
    # gray for the two Qwen-RobotNav models, a pale red for Robostral before RL
    # and the strong red for Robostral after RL.
    colors = [chalk.FAINT, chalk.DIM, chalk.FAINT, chalk.DIM, (chalk.RED, 0.42), chalk.RED]
    value_bars(ax, R2R, colors, left=40)
    bar_axes(ax, (40, 82), [40, 50, 60, 70, 80], "Success rate on R2R-CE, unseen buildings (%)",
             len(R2R), 1.0)
    ax.set_title("Navigation from one camera\nand a stack of past frames", pad=12)
    note(ax, "Data: Robostral Navigate, Table 1 and Section 4.1\n"
             "(arXiv 2607.20785, CC BY 4.0). Axis starts at 40%.")
    chalk.save(fig, OUT / "v3/robostral-r2r.png")


# ---------------------------------------------------------------------------
# Candidate paths: the geometry of v2/candidate-paths.svg (600 x 310 units,
# y down). Each panel is drawn in its own 280 x 235 frame.

SVG_W, SVG_H = 600, 310
FIG_W = 6.4
PT = FIG_W * 72 / SVG_W  # points per SVG unit

ARM = [(48, 171), (21.40839626533961, 43.74872648645595), (114, 135)]
OBSTACLE = chalk.LAVENDER
AROUND = chalk.BLUE
THROUGH = chalk.YELLOW
CONFLICT = chalk.RED
# Paint order of the SVG. Line2D draws above patches by default, so every
# artist of the diagram gets its layer explicitly.
TABLE, PATH, ARM_LAYER, JOINT, GRIPPER, BLOCK, MARK = 1, 2, 3, 4, 5, 6, 7


def svg_line(ax, points, color, width, **kw):
    xs, ys = zip(*points)
    ax.add_line(Line2D(xs, ys, color=color, linewidth=width * PT, **kw))


def chevron(ax, tip, direction, color, stroke=4):
    """The open arrowhead of the SVG marker: M0 0L6 3L0 6, in stroke-width units."""
    d = np.asarray(direction, float)
    d /= np.linalg.norm(d)
    n = np.array([-d[1], d[0]])
    tip = np.asarray(tip, float)
    back, side = 6 * stroke, 3 * stroke
    pts = [tip - back * d + side * n, tip, tip - back * d - side * n]
    svg_line(ax, pts, color, 1.5 * stroke, solid_joinstyle="miter", solid_capstyle="butt",
             zorder=PATH)


def scene(ax, ox, oy):
    """Table, tray, obstacle, arm, gripper and block of one panel, offset by (ox, oy)."""
    def at(x, y):
        return ox + x, oy + y

    ax.add_patch(FancyBboxPatch(at(0, 0), 280, 235, boxstyle="round,pad=0,rounding_size=18",
                                facecolor=chalk.BOARD_2, edgecolor=chalk.FAINT, linewidth=1.4,
                                zorder=TABLE))
    # Tray
    ax.add_patch(FancyBboxPatch(at(207, 24), 51, 41, boxstyle="round,pad=0,rounding_size=8",
                                facecolor=chalk.FAINT, edgecolor=chalk.SLATE, linewidth=2 * PT,
                                zorder=TABLE))
    ax.add_patch(FancyBboxPatch(at(214, 31), 37, 27, boxstyle="round,pad=0,rounding_size=4",
                                facecolor=chalk.BOARD_2, edgecolor="none", zorder=TABLE))
    # Round obstacle: the lower ellipse is its side, the upper one its top.
    ax.add_patch(Ellipse(at(161, 133), 40, 34, facecolor=OBSTACLE, edgecolor=OBSTACLE,
                         linewidth=2 * PT, alpha=0.55, zorder=TABLE))
    ax.add_patch(Ellipse(at(161, 126), 40, 34, facecolor=chalk.BOARD_2, edgecolor=OBSTACLE,
                         linewidth=2 * PT, zorder=TABLE))
    ax.add_patch(Ellipse(at(161, 126), 40, 34, facecolor=OBSTACLE, edgecolor="none", alpha=0.3,
                         zorder=TABLE))
    # Arm: base shadow, base, two links, two joints.
    ax.add_patch(Ellipse(at(48, 185), 56, 22, facecolor=chalk.FAINT, edgecolor="none",
                         zorder=ARM_LAYER))
    ax.add_patch(FancyBboxPatch(at(23, 170), 50, 14, boxstyle="round,pad=0,rounding_size=5",
                                facecolor=chalk.SLATE, edgecolor="none", zorder=ARM_LAYER))
    arm = [at(*p) for p in ARM]
    svg_line(ax, arm, chalk.SLATE, 22, solid_capstyle="round", solid_joinstyle="round",
             zorder=ARM_LAYER)
    svg_line(ax, arm, chalk.BOARD_2, 15, solid_capstyle="round", solid_joinstyle="round",
             zorder=ARM_LAYER)
    # Joint hubs: a disc with a light center dot, over the links.
    for (x, y), outer, inner in [(ARM[0], 15, 6), (ARM[1], 12, 5)]:
        ax.add_patch(Circle(at(x, y), outer, facecolor=chalk.SLATE, edgecolor="none", zorder=JOINT))
        ax.add_patch(Circle(at(x, y), inner, facecolor=chalk.CHALK, edgecolor="none", zorder=JOINT))
    # Gripper at (114, 155): the palm over the arm end, and two open fingers.
    ax.add_patch(FancyBboxPatch(at(103, 137), 22, 18, boxstyle="round,pad=0,rounding_size=4",
                                facecolor=chalk.CHALK, edgecolor="none", zorder=GRIPPER))
    for finger in ([(87, 153), (87, 173), (92, 173)], [(141, 153), (141, 173), (136, 173)]):
        svg_line(ax, [at(*p) for p in finger], chalk.CHALK, 5, solid_joinstyle="round",
                 zorder=GRIPPER)
    # Block at (222, 124), turned by -14 degrees.
    turn = Affine2D().rotate_deg(-14).translate(*at(222, 124)) + ax.transData
    ax.add_patch(Polygon([(-17, -10), (15, -10), (19, -6), (19, 12), (-13, 12), (-17, 8)],
                         closed=True, facecolor=chalk.GREEN, edgecolor="none", alpha=0.5,
                         transform=turn, zorder=BLOCK))
    ax.add_patch(FancyBboxPatch((-17, -10), 32, 18, boxstyle="round,pad=0,rounding_size=5",
                                facecolor=chalk.GREEN, edgecolor="none", transform=turn,
                                zorder=BLOCK))
    ax.add_line(Line2D([-11, 8], [-5, -5], color=chalk.CHALK, linewidth=3 * PT,
                       solid_capstyle="round", transform=turn, zorder=BLOCK))


def dashed_path(ax, path, color):
    ax.add_patch(PathPatch(
        path, facecolor="none", edgecolor=color, linewidth=4 * PT,
        linestyle=(0, (7 / 4, 4 / 4)), capstyle="butt", zorder=PATH))


def candidate_paths():
    fig = plt.figure(figsize=(FIG_W, FIG_W * SVG_H / SVG_W))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, SVG_W)
    ax.set_ylim(SVG_H, 0)
    ax.set_aspect("equal")
    ax.axis("off")
    for x, title in [(20, "(a) Around"), (318, "(b) Through")]:
        ax.text(x, 38, title, ha="left", va="baseline", fontsize=26 * PT, color=chalk.YELLOW)

    # (a) Around: M114 173 C85 140 99 75 151 75 S205 85 213 110
    ox, oy = 12, 55
    scene(ax, ox, oy)
    around = [(114, 173), (85, 140), (99, 75), (151, 75), (203, 75), (205, 85), (213, 110)]
    codes = [MplPath.MOVETO] + [MplPath.CURVE4] * 6
    dashed_path(ax, MplPath([(ox + x, oy + y) for x, y in around], codes), AROUND)
    chevron(ax, (ox + 213, oy + 110), (213 - 205, 110 - 85), AROUND)

    # (b) Through: M114 173 L211 111, and the conflict circled on the obstacle.
    ox, oy = 308, 55
    scene(ax, ox, oy)
    dashed_path(ax, MplPath([(ox + 114, oy + 173), (ox + 211, oy + 111)]), THROUGH)
    chevron(ax, (ox + 211, oy + 111), (211 - 114, 111 - 173), THROUGH)
    ax.add_patch(Circle((469, 188), 24, facecolor="none", edgecolor=CONFLICT, linewidth=3 * PT,
                        zorder=MARK))
    svg_line(ax, [(458, 177), (480, 199)], CONFLICT, 3, zorder=MARK)
    svg_line(ax, [(480, 177), (458, 199)], CONFLICT, 3, zorder=MARK)
    chalk.save(fig, OUT / "v2/candidate-paths-chalk.png", tight=False)


# ---------------------------------------------------------------------------
# Robostral Navigate system, redrawn from Figure 1 of Bounhar et al. (arXiv
# 2607.20785, CC BY 4.0). The boxes, arrows and labels are chalk, with the
# labels copied word for word, re-laid out in rows for a phone. The camera
# frames are pixel crops of the original PNG (boxes measured on that 1200 x 556
# file), each pixel repeated 2 x 2, so the photos keep their exact colors.

ROBOSTRAL_SOURCE = OUT / "v3/robostral-architecture.png"
FRAMES = {
    "first": (20, 70, 211, 230),
    "second": (226, 70, 417, 230),
    "last": (514, 70, 705, 230),
    "context": (20, 358, 211, 518),
    "current": (226, 358, 417, 518),
    "path": (752, 361, 943, 521),
}
PHOTO_SCALE = 2         # output pixels per source pixel
PHOTO_CORNER = 0.07     # inches
PHOTO_FRAME = 0.015     # inches between the photo edge and the chalk frame line


def photo(ax, photos, box, x, y, dpi):
    """Chalk frame for one camera crop at (x, y) inches; returns (width, height).

    The crop itself goes in after chalk.save(), so the grain and the 256-color
    palette of the chalk drawing do not touch the photo.
    """
    width = (box[2] - box[0]) * PHOTO_SCALE / dpi
    height = (box[3] - box[1]) * PHOTO_SCALE / dpi
    o = PHOTO_FRAME
    ax.add_patch(FancyBboxPatch((x - o, y - o), width + 2 * o, height + 2 * o,
                                boxstyle=f"round,pad=0,rounding_size={PHOTO_CORNER}",
                                facecolor=chalk.BOARD_2, edgecolor=chalk.FAINT, linewidth=1.4))
    photos.append((box, x, y))
    return width, height


def paste_photos(path, source, photos, dpi):
    image = Image.open(path).convert("RGB")
    for box, x, y in photos:
        tile = source.crop(box)
        tile = tile.resize((tile.width * PHOTO_SCALE, tile.height * PHOTO_SCALE), Image.NEAREST)
        mask = Image.new("L", tile.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile.width - 1, tile.height - 1),
                                               radius=round(PHOTO_CORNER * dpi), fill=255)
        image.paste(tile, (round(x * dpi), round(y * dpi)), mask)
    image.save(path, optimize=True)


def model_box(ax, x, y, width, height, text):
    ax.add_patch(FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0,rounding_size=0.14",
                                facecolor=chalk.BOARD_2, edgecolor=chalk.RED, linewidth=2.4))
    ax.text(x + width / 2, y + height / 2, text, ha="center", va="center", fontsize=17,
            color=chalk.CHALK, linespacing=1.05)


def rate(ax, x, y, text, ha="center"):
    """Loop rate with the circular-arrow mark, bottom at y."""
    ax.text(x, y, f"↺ {text}", ha=ha, va="bottom", fontsize=16, color=chalk.CHALK)


def arrow(ax, start, end, dashed=False):
    ax.add_patch(FancyArrowPatch(start, end, arrowstyle="-|>", mutation_scale=17,
                                 color=chalk.RED, linewidth=2.4, shrinkA=0, shrinkB=0,
                                 linestyle="--" if dashed else "-"))


def dashed_line(ax, xs, ys):
    ax.plot(xs, ys, color=chalk.RED, linewidth=2.4, linestyle="--")


def robostral_architecture():
    source = Image.open(ROBOSTRAL_SOURCE).convert("RGB")
    dpi = matplotlib.rcParams["savefig.dpi"]
    W, H = 6.4, 8.2
    fig = plt.figure(figsize=(W, H))
    ax = fig.add_axes([0, 0, 1, 1])  # one data unit is one inch, y down
    ax.set_xlim(0, W)
    ax.set_ylim(H, 0)
    ax.axis("off")
    photos = []
    margin = 0.22

    # Row 1: the instruction and the stack of past frames.
    ax.text(W / 2, 0.12, "“Turn right after the wooden pillar and leave\nthe room through the doorway.”",
            ha="center", va="top", color=chalk.CHALK, fontsize=15, linespacing=1.25)
    y1 = 0.84
    w, h = photo(ax, photos, FRAMES["first"], margin, y1, dpi)
    photo(ax, photos, FRAMES["second"], margin + w + 0.1, y1, dpi)
    last_x = W - margin - w
    photo(ax, photos, FRAMES["last"], last_x, y1, dpi)
    dots_x = (margin + 2 * w + 0.1 + last_x) / 2
    ax.plot([dots_x - 0.18, dots_x, dots_x + 0.18], [y1 + h / 2] * 3, "o", color=chalk.CHALK,
            markersize=3.6)
    below_frames = y1 + h + 0.06
    link_x = last_x + w - 0.13  # where the dashed link leaves the last frame

    # Row 2: the VLM reads the whole frame row at 0.5 Hz and writes the waypoint.
    # A bracket under the row collects the frames into one arrow.
    bracket_y = y1 + h + 0.1
    left, right = margin + 0.15, link_x - 0.35
    ax.plot([left, left, right, right], [y1 + h + 0.02, bracket_y, bracket_y, y1 + h + 0.02],
            color=chalk.RED, linewidth=2.4, solid_joinstyle="round")
    vlm_w, vlm_y, vlm_h = 1.4, 2.85, 1.0
    mid = (left + right) / 2
    vlm_x = mid - vlm_w / 2
    arrow(ax, (mid, bracket_y), (mid, vlm_y - 0.05))
    rate(ax, mid + 0.12, vlm_y - 0.1, "0.5 Hz", ha="left")
    model_box(ax, vlm_x, vlm_y, vlm_w, vlm_h, "VLM")
    row2 = vlm_y + vlm_h / 2
    text_x = 4.25
    arrow(ax, (vlm_x + vlm_w + 0.08, row2), (text_x - 0.07, row2))
    ax.text(text_x, row2, "Go to pixel (48, 64),\nmove 4.5m forward,\n0.7m right and\nturn 5°.",
            ha="left", va="center", color=chalk.CHALK, fontsize=15, linespacing=1.2)

    # The dashed link: the last frame and the waypoint become the context frame + goal.
    join, y3 = 4.2, 4.62
    ctx_mid = margin + w / 2
    dashed_line(ax, [link_x, link_x], [below_frames, join])
    dashed_line(ax, [text_x + 0.7, text_x + 0.7], [row2 + 0.62, join])
    dashed_line(ax, [link_x, ctx_mid], [join, join])
    arrow(ax, (ctx_mid, join), (ctx_mid, y3 - 0.06), dashed=True)

    # Row 3: context frame + goal and current frame go to the diffusion policy at 10 Hz.
    cur_x = margin + w + 0.25
    photo(ax, photos, FRAMES["context"], margin, y3, dpi)
    photo(ax, photos, FRAMES["current"], cur_x, y3, dpi)
    for x, label in [(ctx_mid, "Context frame + goal"), (cur_x + w / 2, "Current frame")]:
        ax.text(x, y3 + h + 0.08, label, ha="center", va="top", color=chalk.CHALK, fontsize=15)
    box_x, box_w = 4.55, 1.6
    dp_y = y3 + h / 2 - 0.5
    arrow(ax, (cur_x + w + 0.07, y3 + h / 2), (box_x - 0.08, y3 + h / 2))
    model_box(ax, box_x, dp_y, box_w, 1.0, "Diffusion\nPolicy")
    rate(ax, box_x + box_w / 2, dp_y - 0.08, "10 Hz")

    # Row 4: the diffusion policy draws a short path; the controller tracks it at 100 Hz.
    y4 = 6.62
    path_x = box_x - 0.55 - w
    arrow(ax, (box_x + 0.12, dp_y + 1.06), (path_x + w - 0.15, y4 - 0.07))
    photo(ax, photos, FRAMES["path"], path_x, y4, dpi)
    arrow(ax, (path_x + w + 0.07, y4 + h / 2), (box_x - 0.08, y4 + h / 2))
    model_box(ax, box_x, y4, box_w, h, "Motion\nTracking\nController")
    rate(ax, box_x + box_w / 2, y4 - 0.08, "100 Hz")

    path = OUT / "v3/robostral-architecture-chalk.png"
    chalk.save(fig, path, tight=False)
    paste_photos(path, source, photos, dpi)


def main():
    chalk.use()
    rl_finetune_results()
    robomme_memory()
    robostral_r2r()
    candidate_paths()
    robostral_architecture()


if __name__ == "__main__":
    main()
