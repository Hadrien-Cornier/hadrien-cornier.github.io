"""Chalk figures for content/robotics/why-i-am-learning-robotics.md.

- long-task-reliability.png, robot-density.png and human-robot-tsne-schematic.png are
  my own charts. They are drawn from the data below and overwrite the old light files.
- openvla-architecture-chalk.png and vjepa2-ac-chalk.png redraw two paper diagrams
  (CC BY 4.0) on the board. Every label is copied from the original figure. The photos
  and video frames are crops of the original PNG pixels, scaled and pasted after
  chalk.save(), so the grain and the 256-color palette do not change them. The original
  files stay next to the redraws because this script reads the crops from them.
- The article card is made from the OpenVLA redraw.

Run from the repository root:
    python3 scripts/why_robotics_figures.py
"""

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, PathPatch, Rectangle
from matplotlib.path import Path as MplPath
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/why-robotics"
THUMB = ROOT / "assets/robotics/thumbnails/why-i-am-learning-robotics.jpg"


# ---------------------------------------------------------------- own charts

def note_below(fig, artist, text, gap=0.12):
    """Put a left-aligned note gap inches under an artist (an axis label), whatever its height."""
    fig.canvas.draw()
    box = artist.get_window_extent().transformed(fig.transFigure.inverted())
    return fig.text(0.0, box.y0 - gap / fig.get_figheight(), text, ha="left", va="top",
                    color=chalk.DIM, fontsize=14)


def long_task_reliability():
    """Chance to finish = p ** n with no recovery. Labels copied from the old figure."""
    steps = np.arange(1, 51)
    # (success per step, end label, color, line width, label height in %). The 95% series
    # is the highlighted one, as in the old figure (red there too).
    series = [
        (0.99, "99% per step", chalk.DIM, 2.2, None),
        (0.95, "95% per step", chalk.RED, 3.2, 12.0),
        (0.90, "90% per step", chalk.CHALK, 2.6, 1.5),
    ]
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    # Room on the right for the end labels, inside the 6.4 in width.
    fig.subplots_adjust(left=0.13, right=0.79, top=0.86, bottom=0.15)
    for p, label, color, width, label_y in series:
        chance = 100 * p ** steps
        ax.plot(steps, chance, color=color, lw=width, clip_on=False, zorder=3)
        ax.text(51.2, chance[-1] if label_y is None else label_y, label, color=color,
                va="center", ha="left", clip_on=False)
    marked = 100 * 0.95 ** 20  # 35.8 %, printed as 36 %
    ax.plot([20], [marked], "o", color=chalk.RED, ms=8, zorder=4, clip_on=False)
    # The note sits in the free space between the 99% and 95% curves, so it hides no line.
    ax.annotate("20 steps at 95%:\n36% of jobs finish", xy=(20, marked), xytext=(24, 41),
                color=chalk.RED, ha="left", va="bottom", linespacing=1.15,
                arrowprops={"arrowstyle": "-|>", "color": chalk.RED, "lw": 1.6,
                            "mutation_scale": 14, "shrinkA": 3, "shrinkB": 6,
                            "relpos": (0.0, 0.2)})
    ax.set_xlim(1, 50)
    ax.set_ylim(0, 101)
    ax.set_xticks([1, 10, 20, 30, 40, 50])
    ax.set_yticks(range(0, 101, 20))
    ax.set_xlabel("Number of steps in the task")
    ax.set_ylabel("Chance to finish (%)")
    ax.grid(True)
    # The 90% curve runs along 0% at the end: move the axis lines out so the curve stays visible.
    for side in ("bottom", "left"):
        ax.spines[side].set_position(("outward", 6))
    ax.set_title("Long tasks multiply small errors (no recovery)", loc="left", pad=12)
    chalk.save(fig, OUT / "long-task-reliability.png")


def robot_density():
    """IFR robot density, 2024 data, as printed on the old figure."""
    # Source: International Federation of Robotics press release, April 2026 (2024 data).
    countries = ["South Korea", "Singapore", "Germany", "Japan", "United States"]
    density = [1220, 818, 449, 446, 307]
    highlighted = {"Germany", "United States"}
    rows = np.arange(len(countries))[::-1]
    # Neutral bars are dim chalk at part strength, so the two highlighted bars stand out.
    fig, ax = plt.subplots(figsize=(6.1, 4.5))
    fig.subplots_adjust(left=0.25, right=0.94, top=0.88, bottom=0.22)
    for row, name, value in zip(rows, countries, density):
        color, alpha = (chalk.RED, 1.0) if name in highlighted else (chalk.DIM, 0.6)
        ax.barh(row, value, height=0.6, color=color, alpha=alpha, edgecolor="none", zorder=3)
        ax.text(value + 18, row, f"{value:,}", va="center", ha="left", color=chalk.CHALK)
    ax.set_yticks(rows, countries)
    ax.tick_params(axis="y", labelsize=15)
    ax.set_xlim(0, 1400)
    ax.set_xticks(range(0, 1401, 200))
    ax.set_ylim(-0.55, len(countries) - 0.45)
    label = ax.set_xlabel("Industrial robots per 10,000\nmanufacturing employees (2024)")
    ax.grid(True, axis="x")
    ax.set_title("Robot density by country", loc="left", pad=12)
    note_below(fig, label, "Data: International Federation of Robotics press release,\n"
               "April 2026 (2024 data)")
    chalk.save(fig, OUT / "robot-density.png")


def _arch(center, n, rng, width=0.07):
    """Points along an arch: a schematic of the shared shape in the third panel."""
    cx, cy, rx, ry = center
    angle = rng.uniform(0.05 * np.pi, 0.95 * np.pi, n)
    x = cx + rx * np.cos(angle) + rng.normal(0, width * 1.4, n)
    y = cy + ry * np.sin(angle) + rng.normal(0, width, n)
    return np.column_stack([x, y])


def human_robot_tsne_schematic():
    """A schematic of the trend in Kareer et al. (2025), not data: seeded point clouds."""
    rng = np.random.default_rng(2025)
    n = 130
    panels = []
    # 1. No robot pre-training: two separate clusters.
    panels.append((rng.normal([-1.05, -0.35], [0.5, 0.42], (n, 2)),
                   rng.normal([1.0, 0.45], [0.45, 0.42], (n, 2))))
    # 2. Some pre-training: the clusters start to overlap.
    panels.append((rng.normal([0.35, 0.25], [0.6, 0.65], (n, 2)),
                   rng.normal([-0.45, -0.25], [0.65, 0.45], (n, 2))))
    # 3. Large, diverse pre-training: both groups mixed along one shared shape.
    outer, inner = (0.0, -1.1, 1.75, 2.35), (0.0, -0.55, 1.05, 1.15)
    panels.append((np.vstack([_arch(outer, 90, rng), _arch(inner, 40, rng)]),
                   np.vstack([_arch(outer, 90, rng), _arch(inner, 40, rng)])))
    titles = ["No robot\npre-training", "Some\npre-training", "Large, diverse\npre-training"]
    # The labels of the first panel get a clear patch of board: drop the points under them.
    labels = [("robot", 1.0, 1.9, chalk.BLUE), ("human", -1.05, -1.9, chalk.YELLOW)]
    human, robot = panels[0]
    for _, lx, ly, _ in labels:
        human = human[~((abs(human[:, 0] - lx) < 0.8) & (abs(human[:, 1] - ly) < 0.35))]
        robot = robot[~((abs(robot[:, 0] - lx) < 0.8) & (abs(robot[:, 1] - ly) < 0.35))]
    panels[0] = (human, robot)

    fig, axes = plt.subplots(1, 3, figsize=(6.1, 3.0))
    fig.subplots_adjust(left=0.0, right=1.0, top=0.80, bottom=0.12, wspace=0.08)
    for ax, (human, robot), title in zip(axes, panels, titles):
        ax.scatter(*human.T, s=11, color=chalk.YELLOW, alpha=0.9, linewidths=0, zorder=3)
        ax.scatter(*robot.T, s=11, color=chalk.BLUE, alpha=0.9, linewidths=0, zorder=3)
        ax.set_xlim(-2.4, 2.4)
        ax.set_ylim(-2.3, 2.3)
        ax.set_xticks([])
        ax.set_yticks([])
        for side in ["top", "right", "bottom", "left"]:
            ax.spines[side].set_visible(True)
            ax.spines[side].set_color(chalk.FAINT)
        # Titles stay chalk white: yellow is the human points here.
        ax.set_title(title, loc="center", color=chalk.CHALK, fontsize=15, linespacing=1.05)
    for text, lx, ly, color in labels:
        axes[0].text(lx, ly, text, color=color, ha="center", va="center", fontsize=15)
    arrow_note = fig.text(0.5, 0.03, "more diverse robot pre-training  \u2192", color=chalk.DIM,
                          ha="center", va="center", fontsize=15)
    note_below(fig, arrow_note, "Schematic I drew to show the trend; not the paper's data.\n"
               "The real plot is in Kareer et al. (2025).", gap=0.1)
    chalk.save(fig, OUT / "human-robot-tsne-schematic.png")


# ---------------------------------------------------------------- paper diagrams

def board(width, height):
    """A figure whose data units are inches, so the photo crops can be pasted at known pixels."""
    fig = plt.figure(figsize=(width, height))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, width)
    ax.set_ylim(0, height)
    ax.set_autoscale_on(False)
    ax.axis("off")
    return fig, ax


def box(ax, x, y, w, h, edge, face=None, alpha=0.18, lw=1.8, r=0.07, ls="-", z=2):
    """A rounded box: a chalk outline and a light wash of the same color."""
    style = f"round,pad=0,rounding_size={r}"
    if face is not None:
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor=face, alpha=alpha,
                                    edgecolor="none", zorder=z))
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor="none", edgecolor=edge,
                                lw=lw, ls=ls, zorder=z + 0.1))


def mixed_box(ax, x, y, w, h, left, right, alpha=0.2, lw=1.8, r=0.07, z=2, strips=16):
    """A box whose wash and outline fade from one color to another (a mix of two inputs)."""
    style = f"round,pad=0,rounding_size={r}"
    shape = FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor="none", edgecolor="none")
    ax.add_patch(shape)
    cmap = LinearSegmentedColormap.from_list("mix", [left, right])
    wash = ax.imshow(np.linspace(0, 1, 256)[None, :], extent=(x, x + w, y, y + h), cmap=cmap,
                     alpha=alpha, aspect="auto", interpolation="bilinear", zorder=z)
    wash.set_clip_path(shape)
    for i in range(strips):
        edge = FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor="none",
                              edgecolor=cmap((i + 0.5) / strips), lw=lw, zorder=z + 0.1)
        ax.add_patch(edge)
        x0 = x - 0.1 if i == 0 else x + w * i / strips
        x1 = x + w + 0.1 if i == strips - 1 else x + w * (i + 1) / strips
        edge.set_clip_path(Rectangle((x0, y - 0.1), x1 - x0, h + 0.2, transform=ax.transData))


def label(ax, x, y, text, size=15, color=chalk.CHALK, ha="center", va="center", **kw):
    return ax.text(x, y, text, fontsize=size, color=color, ha=ha, va=va, zorder=6, **kw)


def arrow(ax, points, color=chalk.DIM, lw=1.7, head="-|>", size=13, dashed=False, z=4):
    """A polyline with an arrowhead at the last point."""
    points = np.asarray(points, dtype=float)
    end, before = points[-1], points[-2]
    direction = (end - before) / np.hypot(*(end - before))
    tail = end - direction * 0.09
    line = np.vstack([points[:-1], tail if head == "-|>" else end])
    ax.plot(line[:, 0], line[:, 1], color=color, lw=lw, zorder=z,
            ls=(0, (4, 3)) if dashed else "-", solid_capstyle="butt")
    ax.add_patch(FancyArrowPatch(tuple(end - direction * 0.1), tuple(end), arrowstyle=head,
                                 mutation_scale=size, color=color, lw=lw, shrinkA=0, shrinkB=0,
                                 zorder=z))


def step_circle(ax, x, y, number, r=0.13):
    ax.add_patch(Circle((x, y), r, facecolor=chalk.BOARD, edgecolor=chalk.DIM, lw=1.5, zorder=7))
    label(ax, x, y - 0.01, number, size=15, color=chalk.CHALK).set_zorder(8)


def crop(source, box_px, x, y, width, mask=None):
    """A photo crop: its source pixels and the place (inches, lower left) where it goes."""
    left, top, right, bottom = box_px
    height = width * (bottom - top) / (right - left)
    return {"source": source, "box": box_px, "place": (x, y, width, height), "mask": mask}


def paste_crops(path, fig_height, crops):
    """Paste the photo crops over the chalk PNG, after the grain and the 256-color palette."""
    dpi = matplotlib.rcParams["savefig.dpi"]
    image = Image.open(path).convert("RGB")
    for item in crops:
        x, y, width, height = item["place"]
        left, top = round(x * dpi), round((fig_height - y - height) * dpi)
        size = (round(width * dpi), round(height * dpi))
        pixels = Image.open(item["source"]).convert("RGB").crop(item["box"]).resize(size, Image.LANCZOS)
        mask = item["mask"].resize(size, Image.LANCZOS) if item["mask"] is not None else None
        image.paste(pixels, (left, top), mask)
    image.save(path, optimize=True)


def openvla_architecture():
    """Redraw of the OpenVLA architecture figure (Kim et al., 2024, CC BY 4.0).

    Labels, numbers, arrows and color meanings follow the original figure. The input image and
    the robot arm are crops of assets/robotics/why-robotics/openvla-architecture.png.
    """
    source = OUT / "openvla-architecture.png"
    width, height = 6.4, 4.1
    fig, ax = board(width, height)
    vision_left, vision_right = chalk.YELLOW, chalk.BLUE   # DinoV2 yellow, SigLIP blue
    language, action = chalk.GREEN, chalk.LAVENDER

    # OpenVLA: the dashed outline holds the whole model.
    box(ax, 1.30, 0.10, 4.02, 3.90, chalk.FAINT, lw=2.0, r=0.14, ls=(0, (5, 4)))
    label(ax, 1.48, 3.70, "OpenVLA", size=22, ha="left")

    # 1. The two vision encoders, in one dashed group.
    box(ax, 1.58, 0.73, 1.85, 0.56, chalk.FAINT, lw=1.6, r=0.09, ls=(0, (4, 3)))
    box(ax, 1.66, 0.80, 0.80, 0.42, vision_left, face=vision_left)
    label(ax, 2.06, 1.01, "DinoV2")
    box(ax, 2.54, 0.80, 0.80, 0.42, vision_right, face=vision_right)
    label(ax, 2.94, 1.01, "SigLIP")
    step_circle(ax, 1.66, 0.82, "1")
    # 2. The projector mixes the two feature sets into the vision tokens.
    mixed_box(ax, 1.66, 1.36, 1.68, 0.34, vision_left, vision_right)
    label(ax, 2.50, 1.53, "MLP Projector", size=14)
    step_circle(ax, 1.66, 1.68, "2")
    vision_x = np.linspace(1.66, 3.34 - 0.26, 5)
    for x in vision_x:
        arrow(ax, [(x + 0.13, 1.72), (x + 0.13, 1.94)], size=10, lw=1.5)
        mixed_box(ax, x, 1.97, 0.26, 0.20, vision_left, vision_right, alpha=0.4, lw=1.4,
                  r=0.06, strips=6)
    # The language side: the prompt template, the tokenizer and its tokens.
    box(ax, 3.52, 1.00, 1.68, 0.70, language, face=language)
    label(ax, 4.36, 1.35, "Llama Tokenizer")
    language_x = np.linspace(3.52, 5.20 - 0.26, 5)
    for x in language_x:
        arrow(ax, [(x + 0.13, 1.72), (x + 0.13, 1.94)], size=10, lw=1.5)
        box(ax, x, 1.97, 0.26, 0.20, language, face=language, alpha=0.4, lw=1.4, r=0.06)
    label(ax, 2.30, 0.34, "\u201cWhat should the robot do to {task}? A:\u201d", size=14,
          color=chalk.DIM, ha="left")
    arrow(ax, [(4.36, 0.50), (4.36, 0.98)])
    # 3. The language model reads both token rows and writes the action tokens.
    box(ax, 1.66, 2.30, 3.54, 0.55, chalk.DIM, face=chalk.BOARD_2, alpha=1.0)
    label(ax, 3.43, 2.575, "Llama 2 7B", size=20)
    step_circle(ax, 1.66, 2.83, "3")
    action_x = np.linspace(3.80, 5.20 - 0.26, 3)
    for x in action_x:
        box(ax, x, 2.98, 0.26, 0.20, action, face=action, alpha=0.4, lw=1.4, r=0.06)
        arrow(ax, [(x + 0.13, 3.19), (x + 0.13, 3.38)], size=10, lw=1.5)
    box(ax, 3.44, 3.40, 1.76, 0.40, action, face=action)
    label(ax, 4.32, 3.60, "Action De-Tokenizer")

    # Inputs on the left, and their lines into the model.
    image = crop(source, (26, 73, 154, 200), 0.06, 2.56, 0.95)
    label(ax, 0.535, 2.37, "Input Image", size=14, color=chalk.DIM)
    box(ax, 0.02, 1.15, 1.16, 0.62, chalk.DIM, lw=1.6, r=0.08)
    label(ax, 0.60, 1.46, "\u201cPut eggplant\nin bowl\u201d", linespacing=0.95)
    label(ax, 0.60, 0.84, "Language\nInstruction", size=14, color=chalk.DIM, linespacing=0.95)
    ax.plot([1.01, 1.48, 1.48, 2.94], [3.03, 3.03, 0.62, 0.62], color=chalk.DIM, lw=1.7, zorder=4)
    ax.add_patch(Circle((2.06, 0.62), 0.035, color=chalk.DIM, zorder=5))
    arrow(ax, [(2.06, 0.62), (2.06, 0.79)], size=10, lw=1.5)
    arrow(ax, [(2.94, 0.62), (2.94, 0.79)], size=10, lw=1.5)
    arrow(ax, [(1.18, 1.46), (1.40, 1.46), (1.40, 0.34), (2.26, 0.34)])

    # Output on the right: the 7D action, then the robot.
    arrow(ax, [(5.20, 3.60), (5.93, 3.60), (5.93, 3.36)])
    bracket_x0, bracket_x1, top, bottom = 5.56, 6.30, 3.32, 2.36
    for x, tip in ((bracket_x0, 0.08), (bracket_x1, -0.08)):
        ax.plot([x + tip, x, x, x + tip], [top, top, bottom, bottom], color=chalk.CHALK, lw=1.6,
                zorder=4)
    for row, text in enumerate(["\u0394x", "\u0394\u03b8", "\u0394Grip"]):
        label(ax, 5.93, 3.17 - 0.32 * row, text, size=17)
    label(ax, 5.93, 2.02, "7D Robot\nAction", size=14, color=chalk.DIM, linespacing=0.95)
    arrow(ax, [(5.93, 1.76), (5.93, 1.56)], size=10, lw=1.5)
    arm = crop(source, (923, 256, 1050, 397), 5.52, 0.56, 0.84)

    path = OUT / "openvla-architecture-chalk.png"
    chalk.save(fig, path, tight=False)
    paste_crops(path, height, [image, arm])
    return path


def closed_path(xs, ys):
    """A closed outline through the points (CLOSEPOLY ignores its own vertex, so repeat the first)."""
    points = np.column_stack([np.append(xs, xs[0]), np.append(ys, ys[0])])
    return MplPath(points, closed=True)


def encoder_shape(x, y, w, h, corner=0.08):
    """The V-JEPA encoder outline: straight sides, a round top, small round lower corners."""
    r = w / 2
    top = np.linspace(0, np.pi, 40)
    lower_right = np.linspace(-np.pi / 2, 0, 8)
    lower_left = np.linspace(np.pi, 1.5 * np.pi, 8)
    xs = np.concatenate([x + corner + corner * np.cos(lower_left),
                         x + w - corner + corner * np.cos(lower_right),
                         x + r + r * np.cos(top)])
    ys = np.concatenate([y + corner + corner * np.sin(lower_left),
                         y + corner + corner * np.sin(lower_right),
                         y + h - r + r * np.sin(top)])
    return closed_path(xs, ys)


def predictor_shape(x, y, w, h, corner=0.08):
    """The V-JEPA predictor outline: a flat left side and a round right end."""
    r = h / 2
    right = np.linspace(-np.pi / 2, np.pi / 2, 30)
    upper_left = np.linspace(np.pi / 2, np.pi, 8)
    lower_left = np.linspace(np.pi, 1.5 * np.pi, 8)
    xs = np.concatenate([x + w - r + r * np.cos(right), x + corner + corner * np.cos(upper_left),
                         x + corner + corner * np.cos(lower_left)])
    ys = np.concatenate([y + r + r * np.sin(right), y + h - corner + corner * np.sin(upper_left),
                         y + corner + corner * np.sin(lower_left)])
    return closed_path(xs, ys)


def shape_patch(ax, path, edge, face, alpha=0.14, lw=1.8, z=2):
    ax.add_patch(PathPatch(path, facecolor=face, alpha=alpha, edgecolor="none", zorder=z))
    ax.add_patch(PathPatch(path, facecolor="none", edgecolor=edge, lw=lw, zorder=z + 0.1))


def time_label(ax, x, y, digit):
    """A time label such as t0: the digit is its own 14 pt text, low and to the right of the t.

    Mathtext would shrink a subscript to about 70 %, too small on a phone. (x, y) is the t.
    """
    label(ax, x, y, "t", size=16)
    label(ax, x + 0.05, y - 0.08, digit, size=14, ha="left")


def frame_stack_mask(size=181, step=13, count=4):
    """Alpha mask of the four stacked video frames: the union of their rectangles."""
    side = size + step * (count - 1)
    mask = Image.new("L", (side, side), 0)
    for k in range(count):
        mask.paste(255, (step * k, step * k, step * k + size, step * k + size))
    return mask


def vjepa2_ac():
    """Redraw of the V-JEPA 2-AC figure (Assran et al., 2025, CC BY 4.0).

    Labels, shapes, arrows and color meanings follow the original figure. The video frames are
    crops of assets/robotics/why-robotics/vjepa2-ac.png. In that file the previous frames
    are four 181 px frames, each 13 px lower and to the right of the one behind it, from
    (98, 650); the future frame is the 216 px square at (598, 651).
    """
    source = OUT / "vjepa2-ac.png"
    width, height = 6.4, 7.0
    fig, ax = board(width, height)
    shape_edge, shape_face = chalk.SLATE, chalk.SLATE

    label(ax, 3.98, 6.72, "V-JEPA 2-AC", size=21, color=chalk.YELLOW)
    # Predictor and the L1 loss.
    shape_patch(ax, predictor_shape(2.50, 5.40, 1.62, 0.90), shape_edge, shape_face)
    label(ax, 3.20, 5.85, "predictor", size=17)
    ax.add_patch(Rectangle((4.74, 5.56), 1.38, 0.58, facecolor=chalk.RED, alpha=0.15,
                           edgecolor="none", zorder=2))
    ax.add_patch(Rectangle((4.74, 5.56), 1.38, 0.58, facecolor="none", edgecolor=chalk.RED,
                           lw=3.2, zorder=2.1))
    label(ax, 5.43, 5.85, "L1", size=17)
    arrow(ax, [(4.16, 5.85), (4.70, 5.85)], dashed=True, lw=2.2)
    # The action input z.
    ax.add_patch(Circle((3.30, 4.65), 0.31, facecolor=chalk.BOARD, edgecolor=chalk.RED, lw=2.6,
                        zorder=3))
    label(ax, 3.30, 4.64, "z", size=19, color=chalk.RED)
    arrow(ax, [(3.30, 4.97), (3.30, 5.37)], color=chalk.RED, lw=2.6, head="->", size=16)
    label(ax, 3.76, 4.70, "Robot\nactions\n& poses", size=16, color=chalk.RED, ha="left",
          linespacing=0.95)
    # The two frozen encoders.
    for x in (0.78, 4.61):
        shape_patch(ax, encoder_shape(x, 3.05, 1.64, 1.50), shape_edge, shape_face)
        label(ax, x + 0.82, 3.88, "frozen", size=15)
        label(ax, x + 0.82, 3.58, "encoder", size=17)
    arrow(ax, [(1.60, 4.57), (1.60, 5.85), (2.47, 5.85)], lw=2.4, head="->", size=16)
    arrow(ax, [(5.43, 4.62), (5.43, 5.53)], dashed=True, lw=2.2)
    arrow(ax, [(1.60, 2.66), (1.60, 3.02)], lw=2.4, head="->", size=16)
    arrow(ax, [(5.43, 2.66), (5.43, 3.02)], lw=2.4, head="->", size=16)

    # Video frames: crops of the original, and their time labels.
    stack = crop(source, (98, 650, 318, 870), 0.75, 0.95, 1.69, mask=frame_stack_mask())
    future = crop(source, (598, 651, 814, 867), 4.60, 0.97, 1.66)
    dots = [(0.42, 1.29), (0.64, 1.08), (0.86, 0.87)]
    arrow(ax, dots[:1] + [(1.12, 0.63)], color=chalk.DIM, lw=2.2, size=13)
    for (x, y), digit in zip(dots, "012"):
        ax.add_patch(Circle((x, y), 0.035, color=chalk.CHALK, zorder=5))
        time_label(ax, x - 0.27, y + 0.02, digit)
    time_label(ax, 0.82, 0.62, "3")
    time_label(ax, 4.40, 0.82, "4")
    label(ax, 1.60, 0.30, "Previous\nvideo frames", size=16, color=chalk.DIM, linespacing=0.95)
    label(ax, 5.43, 0.30, "Future\nvideo frame", size=16, color=chalk.DIM, linespacing=0.95)

    path = OUT / "vjepa2-ac-chalk.png"
    chalk.save(fig, path, tight=False)
    paste_crops(path, height, [stack, future])
    return path


def main():
    chalk.use()
    long_task_reliability()
    robot_density()
    human_robot_tsne_schematic()
    card = openvla_architecture()
    vjepa2_ac()
    chalk.thumbnail(card, THUMB)


if __name__ == "__main__":
    main()
