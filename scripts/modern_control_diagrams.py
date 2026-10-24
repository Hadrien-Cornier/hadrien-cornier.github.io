"""Chalk redraws of four paper diagrams in content/robotics/how-robot-control-is-changing.md.

Each function redraws one figure (CC BY 4.0) on the board. The boxes, arrows and text
are drawn again, and every label is copied word for word from the original PNG. The
photos, video frames and noise tiles are crops of the original PNG pixels, scaled and
pasted after chalk.save(), so the grain and the 256-color palette do not change them.
The original files stay next to the redraws because this script reads the crops from
them. The wide two-part layouts are stacked vertically so the text stays readable on a
phone.

- v3/expo-ft-architecture-chalk.png: Figure 2 of Dong et al., EXPO-FT, arXiv 2605.25477.
- v3/mem-architecture-chalk.png: Figure 2 of Torne et al., MEM, arXiv 2603.03596.
- v3/dreamzero-architecture-chalk.png: Figure 4 of Ye et al., World Action Models are
  Zero-shot Policies, arXiv 2602.15922.
- vjepa-planning-chalk.png: Figure 7 of Assran et al., V-JEPA 2, arXiv 2506.09985.

Run from the repository root:
    python3 scripts/modern_control_diagrams.py
"""

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import patheffects
from matplotlib.colors import to_rgb
from matplotlib.patches import (Arc, Circle, Ellipse, FancyArrowPatch, FancyBboxPatch, PathPatch,
                                Polygon, Rectangle)
from matplotlib.path import Path as MplPath
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/modern-control"
V3 = OUT / "v3"


# ---------------------------------------------------------------- drawing helpers

def board(width, height):
    """A figure whose data units are inches, so the photo crops can be pasted at known pixels."""
    fig = plt.figure(figsize=(width, height))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, width)
    ax.set_ylim(0, height)
    ax.set_autoscale_on(False)
    ax.axis("off")
    return fig, ax


def mix(color, amount):
    """An opaque color part way from the board to a chalk color."""
    board_rgb, ink = np.array(to_rgb(chalk.BOARD)), np.array(to_rgb(color))
    return tuple(board_rgb + (ink - board_rgb) * amount)


def box(ax, x, y, w, h, edge, face=None, alpha=0.16, lw=1.7, r=0.07, ls="-", z=2):
    """A rounded box: a chalk outline and a light wash (face=None: no wash)."""
    style = f"round,pad=0,rounding_size={r}" if r > 0 else "square,pad=0"
    if face is not None:
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor=face, alpha=alpha,
                                    edgecolor="none", zorder=z))
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor="none", edgecolor=edge,
                                lw=lw, ls=ls, zorder=z + 0.1))


def solid_box(ax, x, y, w, h, edge, face, lw=1.7, r=0.07, z=2):
    """A rounded box with an opaque fill, for boxes that cover the shapes behind them."""
    style = f"round,pad=0,rounding_size={r}" if r > 0 else "square,pad=0"
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor=face, edgecolor=edge,
                                lw=lw, zorder=z))


def label(ax, x, y, text, size=15, color=chalk.CHALK, ha="center", va="center", bold=False,
          z=6, **kw):
    """Hand lettering. bold=True thickens the strokes, because Patrick Hand has no bold face."""
    kw.setdefault("linespacing", 1.05)
    item = ax.text(x, y, text, fontsize=size, color=color, ha=ha, va=va, zorder=z, **kw)
    if bold:
        item.set_path_effects([patheffects.withStroke(linewidth=0.7, foreground=color)])
    return item


def arrow(ax, points, color=chalk.CHALK, lw=1.7, size=13, dashed=False, dotted=False,
          both=False, z=4):
    """A polyline with an arrowhead at the last point (both=True: at the first point too)."""
    points = np.asarray(points, dtype=float)

    def head(end, before):
        direction = (end - before) / np.hypot(*(end - before))
        ax.add_patch(FancyArrowPatch(tuple(end - direction * 0.1), tuple(end), arrowstyle="-|>",
                                     mutation_scale=size, color=color, lw=lw, shrinkA=0,
                                     shrinkB=0, zorder=z))
        return end - direction * 0.09

    line = points.copy()
    line[-1] = head(points[-1], points[-2])
    if both:
        line[0] = head(points[0], points[1])
    style = (0, (1, 2.2)) if dotted else (0, (4, 3)) if dashed else "-"
    ax.plot(line[:, 0], line[:, 1], color=color, lw=lw, zorder=z, ls=style,
            solid_capstyle="butt", solid_joinstyle="miter")


def line(ax, points, color=chalk.CHALK, lw=1.7, dashed=False, z=4):
    points = np.asarray(points, dtype=float)
    ax.plot(points[:, 0], points[:, 1], color=color, lw=lw, zorder=z,
            ls=(0, (4, 3)) if dashed else "-", solid_capstyle="butt")


def dots(ax, x, y, step=(0.0, -0.055), color=chalk.CHALK, r=0.013):
    """Three dots, as the vertical or diagonal ellipsis marks of the original figures."""
    for k in range(3):
        ax.add_patch(Circle((x + step[0] * k, y + step[1] * k), r, color=color, zorder=5))


def closed_path(xs, ys):
    """A closed outline through the points (CLOSEPOLY ignores its own vertex, so repeat the first)."""
    points = np.column_stack([np.append(xs, xs[0]), np.append(ys, ys[0])])
    return MplPath(points, closed=True)


def shape_patch(ax, path, edge, face, alpha=0.14, lw=1.7, z=2):
    ax.add_patch(PathPatch(path, facecolor=face, alpha=alpha, edgecolor="none", zorder=z))
    ax.add_patch(PathPatch(path, facecolor="none", edgecolor=edge, lw=lw, zorder=z + 0.1))


def trapezoid(ax, x, w, left, right, edge, alpha=0.2, z=2):
    """An encoder or decoder: the left and right sides span (bottom, top) heights."""
    corners = [(x, left[0]), (x + w, right[0]), (x + w, right[1]), (x, left[1])]
    ax.add_patch(Polygon(corners, closed=True, facecolor=edge, alpha=alpha, edgecolor="none",
                         zorder=z))
    ax.add_patch(Polygon(corners, closed=True, facecolor="none", edgecolor=edge, lw=1.7,
                         zorder=z + 0.1))


def crop(source, box_px, x, y, width, mask=None):
    """A photo crop: its source pixels and the place (inches, lower left) where it goes."""
    left, top, right, bottom = box_px
    height = width * (bottom - top) / (right - left)
    return {"source": source, "box": box_px, "place": (x, y, width, height), "mask": mask}


def rounded_mask(box_px, radius):
    """Alpha mask of a rounded rectangle the size of the crop (radius in source pixels)."""
    left, top, right, bottom = box_px
    mask = Image.new("L", ((right - left) * 4, (bottom - top) * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, mask.width - 1, mask.height - 1),
                                           radius=radius * 4, fill=255)
    return mask


def stack_mask(box_px, frames):
    """Alpha mask of stacked video frames: the union of their rectangles (source pixels)."""
    left, top, right, bottom = box_px
    mask = Image.new("L", (right - left, bottom - top), 0)
    for x0, y0, x1, y1 in frames:
        mask.paste(255, (x0 - left, y0 - top, x1 - left, y1 - top))
    return mask


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


# ---------------------------------------------------------------- EXPO-FT

def cylinder(ax, cx, cy, w=0.52, h=0.56, color=chalk.CHALK):
    """The database icon of the original: a cylinder of three stacked disks."""
    ry = h * 0.13
    top, bottom = cy + h / 2 - ry, cy - h / 2 + ry
    ax.add_patch(Rectangle((cx - w / 2, bottom), w, top - bottom, facecolor=chalk.BOARD,
                           edgecolor="none", zorder=3))
    ax.add_patch(Ellipse((cx, bottom), w, 2 * ry, facecolor=chalk.BOARD, edgecolor="none",
                         zorder=3))
    ax.add_patch(Ellipse((cx, top), w, 2 * ry, facecolor=chalk.BOARD, edgecolor=color, lw=1.8,
                         zorder=3.2))
    for k in (1, 2, 3):
        level = top - (top - bottom) * k / 3
        ax.add_patch(Arc((cx, level), w, 2 * ry, theta1=180, theta2=360, color=color, lw=1.8,
                         zorder=3.2))
    for side in (-1, 1):
        line(ax, [(cx + side * w / 2, top), (cx + side * w / 2, bottom)], color=color, lw=1.8,
             z=3.2)


def tag(ax, cx, cy, text, w=0.58, h=0.36):
    """A small policy tag: red outline, as the orange tags of the original."""
    box(ax, cx - w / 2, cy - h / 2, w, h, chalk.RED, chalk.RED, alpha=0.12, lw=1.9, r=0.07)
    label(ax, cx, cy, text, size=15)


def panel_tab(ax, x, y, text):
    """The grey tab with an orange title on top of a panel border."""
    ax.add_patch(Rectangle((x, y - 0.14), 0.86, 0.28, facecolor=chalk.BOARD_2,
                           edgecolor=chalk.FAINT, lw=1.4, zorder=3))
    label(ax, x + 0.43, y, text, size=15, color=chalk.RED)


def expo_ft_architecture():
    """Redraw of Figure 2 of EXPO-FT (Dong et al., 2026, CC BY 4.0).

    Labels and math follow assets/robotics/modern-control/v3/expo-ft-architecture.png. The
    "Learning Procedure" part is drawn above the "Policy Architecture" part, which sat to
    its right. Orange in the original is RED here, light grey boxes are DIM.
    """
    width, height = 6.4, 8.0
    fig, ax = board(width, height)

    # Learning Procedure.
    label(ax, 3.2, 7.78, "Learning Procedure", size=17.5, color=chalk.YELLOW)
    top, bottom = 7.38, 3.72
    box(ax, 0.04, bottom, 1.38, top - bottom, chalk.FAINT, lw=1.6, r=0.09)
    box(ax, 1.52, bottom, 4.84, top - bottom, chalk.FAINT, lw=1.6, r=0.09)
    panel_tab(ax, 0.14, top, "1.Offline")
    panel_tab(ax, 1.62, top, "2.Online")

    ox, sx, dx, axx = 0.73, 2.62, 4.20, 5.62
    store = top - 1.36
    label(ax, ox, top - 0.62, "Offline\nDataset(Opt.)")
    cylinder(ax, ox, store)
    arrow(ax, [(ox, store - 0.33), (ox, top - 1.92)])
    label(ax, ox, top - 2.24, "Offline\nPretrain $L_{IL}$")
    tag(ax, ox, top - 2.78, r"$\pi_{VLA}$")

    label(ax, dx, top - 0.27, "Sync/Async(Opt.)")
    label(ax, sx, top - 0.58, "Server Learner", color=chalk.RED)
    label(ax, axx, top - 0.58, "Actor", color=chalk.RED)
    arrow(ax, [(3.36, top - 0.58), (5.30, top - 0.58)], both=True)
    line(ax, [(dx, top - 0.74), (dx, bottom + 0.12)], color=chalk.DIM, lw=1.6, dashed=True, z=1)
    label(ax, sx, top - 0.92, "Replay Buffer")
    cylinder(ax, sx, store)
    arrow(ax, [(sx, store - 0.33), (sx, top - 1.92)])
    label(ax, sx, top - 2.08, "Online Finetune")
    label(ax, sx, top - 2.38, "$L_{IL} + L_{RL}$")
    tags_y = top - 2.78
    tag(ax, 2.04, tags_y, r"$\pi_{VLA}$", w=0.56)
    tag(ax, 2.66, tags_y, r"$\pi_{edit}$", w=0.56)
    tag(ax, 3.20, tags_y, "$Q$", w=0.36)
    label(ax, sx, top - 3.32, "Update per step/\nepisode/large batch")
    arrow(ax, [(ox + 0.27, store), (sx - 0.30, store)], dashed=True)
    arrow(ax, [(ox + 0.29, tags_y), (2.04 - 0.30, tags_y)])

    env_bottom = top - 2.36
    box(ax, 5.00, env_bottom, 1.24, 1.58, chalk.DIM, chalk.DIM, alpha=0.12, r=0.1)
    label(ax, axx, top - 0.97, "Environment")
    label(ax, axx, top - 1.26, "Sensors", color=chalk.DIM)
    label(ax, axx, top - 1.54, "Controller", color=chalk.DIM)
    label(ax, axx, top - 2.04, "Success\nDetector", color=chalk.DIM)
    arrow(ax, [(5.00, store), (sx + 0.30, store)])
    label(ax, 3.92, store + 0.19, "$(s, a, r, s')$", bbox=chalk.label_box(pad=0.15))
    arrow(ax, [(3.40, tags_y), (5.12, tags_y), (5.12, env_bottom)])
    arrow(ax, [(5.84, tags_y - 0.17), (5.84, env_bottom)])
    label(ax, 5.03, top - 3.24, "Online\nRollout", size=14)
    label(ax, 5.84, top - 3.24, "Human\nIntervention", size=14)

    # Policy Architecture.
    label(ax, 3.2, 3.46, "Policy Architecture", size=17.5, color=chalk.YELLOW)
    ptop = 3.20
    box(ax, 0.04, 0.04, 6.32, ptop - 0.04, chalk.FAINT, lw=1.6, r=0.09)
    label(ax, 2.68, ptop - 0.27, "Action Proposals")
    label(ax, 5.16, ptop - 0.27, "Edit Actions")
    row = ptop - 1.15

    label(ax, 0.95, ptop - 0.60, r"$\pi_{VLA}$", size=18)
    solid_box(ax, 0.30, row - 0.36, 1.30, 0.72, chalk.RED, chalk.RED, r=0.1)
    label(ax, 0.95, row, "VLA Model", size=16, color=chalk.BOARD)
    label(ax, 0.95, ptop - 1.74, "States")
    label(ax, 1.00, ptop - 2.03, "Prompt  Images  Proprios", size=13.5)

    label(ax, 3.92, ptop - 0.66, r"$\pi_{edit}$", size=18)
    box(ax, 3.46, row - 0.34, 0.92, 0.68, chalk.RED, chalk.RED, alpha=0.12, lw=1.9, r=0.1)
    label(ax, 3.92, row, "Edit\nActor")
    label(ax, 3.92, ptop - 1.74, "States")

    for cx, rows in ((2.68, [r"$a^1_{t{:}t{+}H}$", r"$a^2_{t{:}t{+}H}$", "...", r"$a^N_{t{:}t{+}H}$"]),
                     (5.16, [r"$â^1_{t{:}t{+}C}$", r"$â^2_{t{:}t{+}C}$", "...",
                             r"$â^N_{t{:}t{+}C}$"])):
        box(ax, cx - 0.37, ptop - 2.14, 0.74, 1.68, chalk.DIM, chalk.DIM, alpha=0.12, r=0.1)
        for k, text in enumerate(rows):
            label(ax, cx, ptop - 0.74 - 0.37 * k, text, size=16, bold=text == "...")
        arrow(ax, [(cx, ptop - 2.16), (cx, ptop - 2.50)])
    arrow(ax, [(1.62, row), (2.27, row)])
    arrow(ax, [(3.07, row), (3.43, row)])
    arrow(ax, [(4.40, row), (4.76, row)])

    label(ax, 3.92, ptop - 2.30, r"$argmax_aQ(s, a_{t{:}t{+}C})$", size=16)
    mid = ptop - 2.77
    box(ax, 2.22, mid - 0.24, 3.30, 0.48, chalk.CHALK, lw=1.7, r=0.1, ls=(0, (4, 3)))
    label(ax, 2.34, mid, "$a_{t{:}t{+}C}$", size=16, ha="left")
    label(ax, 2.84, mid - 0.05, "xN", size=13, color=chalk.RED, ha="left")
    label(ax, 5.10, mid, r"$a_{t{:}t{+}C} + â_{t{:}t{+}C}$", size=16, ha="right")
    label(ax, 5.14, mid - 0.05, "xN", size=13, color=chalk.RED, ha="left")
    arrow(ax, [(5.55, mid), (5.82, mid)])
    label(ax, 5.86, mid + 0.02, r"$a^*_{t{:}t{+}C}$", size=16, ha="left")

    path = V3 / "expo-ft-architecture-chalk.png"
    chalk.save(fig, path, tight=False)
    return path


# ---------------------------------------------------------------- MEM

def token_row(ax, x0, x1, y, count, color, w=0.22, h=0.12):
    """A row of token ovals, evenly spread between x0 and x1."""
    step = (x1 - x0) / count
    for k in range(count):
        cx = x0 + step * (k + 0.5)
        box(ax, cx - w / 2, y - h / 2, w, h, color, lw=1.3, r=h / 2, z=3)


def encoder_mound(ax, x, y, w, h, color=chalk.BLUE):
    """The MEM image encoder: a trapezoid, narrow at the top, wide at the bottom."""
    inset = w * 0.16
    corners = [(x, y), (x + w, y), (x + w - inset, y + h), (x + inset, y + h)]
    ax.add_patch(Polygon(corners, closed=True, facecolor=color, alpha=0.22, edgecolor="none",
                         zorder=2))
    ax.add_patch(Polygon(corners, closed=True, facecolor="none", edgecolor=color, lw=1.7,
                         zorder=2.1))


def memory_box(ax, x, y, w, h, text, size=15, bold_line=None):
    """A language box (pink in the original). bold_line: a second line in bold, as printed."""
    box(ax, x, y, w, h, chalk.PINK, chalk.PINK, alpha=0.14, r=0.07)
    if bold_line is None:
        label(ax, x + w / 2, y + h / 2, text, size=size, linespacing=0.98)
    else:
        label(ax, x + w / 2, y + h * 0.71, text, size=size)
        label(ax, x + w / 2, y + h * 0.29, bold_line, size=size, bold=True)


def model_band(ax, x0, x1, y0, y1, count, title, x_box=None):
    """The VLM token band: two rows of tokens and the model name box across the middle."""
    box(ax, x0, y0, x1 - x0, y1 - y0, chalk.BLUE, chalk.BLUE, alpha=0.16, r=0.06)
    token_row(ax, x0 + 0.04, x1 - 0.04, y1 - 0.11, count, chalk.BLUE)
    token_row(ax, x0 + 0.04, x1 - 0.04, y0 + 0.11, count, chalk.BLUE)
    left, right = x_box if x_box else (x0 - 0.08, x1 + 0.08)
    solid_box(ax, left, y0 + 0.24, right - left, y1 - y0 - 0.48, chalk.CHALK, chalk.BOARD, r=0.09,
              z=5)
    cx, cy = (left + right) / 2, (y0 + y1) / 2
    label(ax, cx, cy + 0.14, title)
    label(ax, cx, cy - 0.13, "pre-trained VLM: SigLIP (400M) + Gemma (4B)", color=chalk.DIM)


def mem_architecture():
    """Redraw of Figure 2 of MEM (Torne et al., 2026, CC BY 4.0).

    Labels and the memory texts follow assets/robotics/modern-control/v3/mem-architecture.png.
    The high-level policy is drawn above the low-level policy, which sat to its right. The
    camera frames are crops of the original: three single frames (64 x 43 px from x = 245,
    313 and 382, y = 279) and three stacks of three frames (64 x 84 px from x = 1003, 1072
    and 1141, y = 279), each cut one pixel inside its rounded border.
    """
    source = V3 / "mem-architecture.png"
    width, height = 6.4, 8.60
    fig, ax = board(width, height)
    top = height
    crops = []

    # High level.
    label(ax, 1.95, top - 0.16, "m$_{t+1}$ : updated language memory")
    memory_box(ax, 0.45, top - 0.90, 3.00, 0.56, "“I prepared the pot and got ...",
               bold_line="I opened the drawer with the masher.”")
    label(ax, 5.10, top - 0.16, "language subtask")
    memory_box(ax, 4.25, top - 0.72, 1.70, 0.36, "“Pick up the masher”")
    model_band(ax, 0.30, 6.10, top - 2.12, top - 1.02, 21, r"$\pi_{0.6}$-mem high-level")
    arrow(ax, [(1.95, top - 1.02), (1.95, top - 0.91)], size=11)
    arrow(ax, [(5.10, top - 1.02), (5.10, top - 0.73)], size=11)
    memory_box(ax, 0.30, top - 2.62, 2.05, 0.34, "“Prepare the recipe.”")
    arrow(ax, [(1.33, top - 2.28), (1.33, top - 2.13)], size=11)
    # The original memory text has no closing quote mark; it is kept as printed.
    memory_box(ax, 0.30, top - 3.98, 2.05, 1.22,
               "“I prepared the pot\nand got the potatoes,\nmilk, and butter. I\nmoved to the drawer.")
    label(ax, 1.33, top - 4.14, "m$_t$ : language memory")
    for k, left in enumerate((245, 313, 382)):
        x = 2.60 + 1.15 * k
        encoder_mound(ax, x, top - 2.85, 1.05, 0.60)
        box_px = (left + 1, 280, left + 63, 321)
        crops.append(crop(source, box_px, x, top - 3.66, 1.05, mask=rounded_mask(box_px, 7)))
    arrow(ax, [(0.45, top - 0.62), (0.10, top - 0.62), (0.10, top - 3.32), (0.30, top - 3.32)],
          dashed=True, lw=1.5, size=11)

    # Low level.
    low = top - 4.56
    columns = [4.78 + 0.38 * k for k in range(4)]
    label(ax, 5.35, low - 0.08, "continuous actions")
    box(ax, 4.50, low - 0.58, 1.70, 0.36, chalk.YELLOW, chalk.YELLOW, alpha=0.14, r=0.08)
    for cx, value in zip(columns, ["-1.7", "1.25", "3.14", "1.42"]):
        box(ax, cx - 0.175, low - 0.51, 0.35, 0.22, chalk.YELLOW, chalk.YELLOW, alpha=0.3, lw=1.3,
            r=0.11, z=3)
        label(ax, cx, low - 0.40, value, size=13)
    box(ax, 4.45, low - 2.40, 1.80, 1.66, chalk.DIM, chalk.DIM, alpha=0.08, r=0.08)
    box(ax, 4.57, low - 2.10, 1.56, 1.10, chalk.GREEN, chalk.GREEN, alpha=0.16, r=0.07)
    for cx in columns:
        for y in (low - 1.11, low - 1.99):
            box(ax, cx - 0.15, y - 0.06, 0.30, 0.12, chalk.GREEN, lw=1.3, r=0.06, z=3)
        box(ax, cx - 0.06, low - 2.32, 0.12, 1.50, chalk.CHALK, lw=1.3, r=0.06, ls=(0, (2.5, 2)),
            z=3.5)
        arrow(ax, [(cx - 0.06, low - 2.36), (cx - 0.06, low - 2.22)], lw=1.3, size=9)
        arrow(ax, [(cx - 0.06, low - 0.74), (cx - 0.06, low - 0.59)], lw=1.5, size=10)
    model_band(ax, 0.30, 4.45, low - 2.10, low - 1.00, 13, r"$\pi_{0.6}$-mem low-level",
               x_box=(0.22, 4.38))
    solid_box(ax, 4.40, low - 1.86, 1.94, 0.62, chalk.CHALK, chalk.BOARD, r=0.09, z=5)
    label(ax, 5.37, low - 1.41, "action expert")
    label(ax, 5.37, low - 1.68, "(860M)", color=chalk.DIM)
    line(ax, [(5.35, low - 2.40), (5.35, low - 2.66)], lw=1.5)
    label(ax, 5.35, low - 2.82, "noise")

    memory_box(ax, 0.30, low - 2.58, 1.80, 0.34, "“Pick up the masher”")
    arrow(ax, [(1.20, low - 2.24), (1.20, low - 2.11)], size=11)
    label(ax, 1.20, low - 2.78, "language subtask")
    for k, left in enumerate((1003, 1072, 1141)):
        x = 2.15 + 0.77 * k
        encoder_mound(ax, x, low - 2.62, 0.72, 0.44)
        box_px = (left + 1, 280, left + 63, 362)
        crops.append(crop(source, box_px, x, low - 3.66, 0.72, mask=rounded_mask(box_px, 7)))
    label(ax, 3.28, low - 3.84, "video memory encoder")
    label(ax, 4.70, low - 2.98, "time")
    arrow(ax, [(4.70, low - 3.62), (4.70, low - 3.13)], lw=1.5, size=11)

    # The subtask goes from the high level to the low level.
    arrow(ax, [(5.95, top - 0.54), (6.33, top - 0.54), (6.33, top - 4.33), (0.08, top - 4.33),
               (0.08, low - 2.41), (0.30, low - 2.41)], dashed=True, lw=1.5, size=11)

    path = V3 / "mem-architecture-chalk.png"
    chalk.save(fig, path, tight=False)
    paste_crops(path, height, crops)
    return path


# ---------------------------------------------------------------- DreamZero

# The five action curves of the two small action plots, read from the original PNG as
# (x, y) points in the plot box, both from 0 at the axes corner to 1 at the arrow tips.
# Colors follow the original curves: beige, grey, black, brown and green.
TRAIN_CURVES = [
    (chalk.YELLOW, [(0.03, 0.60), (0.11, 0.75), (0.26, 0.91), (0.39, 0.95), (0.49, 0.91),
                    (0.60, 0.80), (0.68, 0.68), (0.77, 0.56), (0.86, 0.48), (0.95, 0.46)]),
    (chalk.SLATE, [(0.03, 0.60), (0.17, 0.64), (0.36, 0.69), (0.44, 0.75), (0.52, 0.79),
                   (0.61, 0.76), (0.68, 0.70), (0.77, 0.66), (0.83, 0.66), (0.88, 0.69),
                   (0.95, 0.66)]),
    (chalk.CHALK, [(0.03, 0.60), (0.17, 0.58), (0.28, 0.51), (0.39, 0.44), (0.50, 0.40),
                   (0.57, 0.38), (0.64, 0.42), (0.73, 0.49), (0.81, 0.55), (0.95, 0.56)]),
    (chalk.RED, [(0.03, 0.60), (0.14, 0.58), (0.22, 0.51), (0.31, 0.42), (0.40, 0.36),
                 (0.48, 0.27), (0.55, 0.14), (0.62, 0.08), (0.68, 0.08), (0.76, 0.13),
                 (0.83, 0.25), (0.88, 0.30), (0.95, 0.28)]),
    (chalk.GREEN, [(0.03, 0.60), (0.07, 0.49), (0.15, 0.37), (0.26, 0.31), (0.37, 0.29),
                   (0.48, 0.31), (0.57, 0.29), (0.66, 0.25), (0.73, 0.28), (0.80, 0.25),
                   (0.87, 0.19), (0.95, 0.15)]),
]
# In the inference plot the past part of each curve is light grey and the future chunk
# (from x = 0.75) is colored.
INFER_CURVES = [
    (chalk.YELLOW, [(0.04, 0.62), (0.15, 0.79), (0.28, 0.90), (0.41, 0.93), (0.51, 0.90),
                    (0.62, 0.78), (0.75, 0.61), (0.83, 0.55), (0.89, 0.50), (0.96, 0.47)]),
    (chalk.SLATE, [(0.04, 0.62), (0.22, 0.67), (0.38, 0.71), (0.46, 0.78), (0.53, 0.81),
                   (0.61, 0.79), (0.68, 0.74), (0.75, 0.69), (0.83, 0.68), (0.89, 0.71),
                   (0.96, 0.67)]),
    (chalk.CHALK, [(0.04, 0.62), (0.17, 0.61), (0.28, 0.54), (0.41, 0.46), (0.51, 0.41),
                   (0.57, 0.39), (0.64, 0.41), (0.70, 0.47), (0.75, 0.52), (0.80, 0.56),
                   (0.87, 0.58), (0.96, 0.58)]),
    (chalk.RED, [(0.04, 0.62), (0.16, 0.60), (0.26, 0.50), (0.37, 0.41), (0.46, 0.31),
                 (0.54, 0.17), (0.62, 0.10), (0.68, 0.09), (0.75, 0.12), (0.80, 0.20),
                 (0.86, 0.28), (0.91, 0.30), (0.96, 0.28)]),
    (chalk.GREEN, [(0.04, 0.62), (0.07, 0.52), (0.15, 0.40), (0.26, 0.32), (0.39, 0.30),
                   (0.51, 0.31), (0.61, 0.29), (0.68, 0.27), (0.75, 0.29), (0.81, 0.25),
                   (0.88, 0.18), (0.96, 0.16)]),
]


def smooth(points, samples=12):
    """A Catmull-Rom curve through the points."""
    p = np.asarray(points, dtype=float)
    p = np.vstack([p[0], p, p[-1]])
    out = []
    for i in range(1, len(p) - 2):
        t = np.linspace(0, 1, samples, endpoint=False)[:, None]
        a, b, c, d = p[i - 1], p[i], p[i + 1], p[i + 2]
        out.append(0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t ** 2
                          + (-a + 3 * b - 3 * c + d) * t ** 3))
    out.append(p[-2][None, :])
    return np.vstack(out)


def action_plot(ax, x, y, w, h, curves, future_from=None):
    """The small action plot: two axis arrows and five curves."""
    arrow(ax, [(x, y), (x, y + h)], lw=1.7, size=10)
    arrow(ax, [(x, y), (x + w, y)], lw=1.7, size=10)
    for color, points in curves:
        curve = smooth(points)
        xs, ys = x + curve[:, 0] * w * 0.95, y + curve[:, 1] * h * 0.95
        if future_from is None:
            ax.plot(xs, ys, color=color, lw=1.5, zorder=4)
        else:
            past = curve[:, 0] <= future_from
            ax.plot(xs[past], ys[past], color=chalk.FAINT, lw=1.5, zorder=4)
            now = max(np.argmin(past) - 1, 0)
            ax.plot(xs[now:], ys[now:], color=color, lw=1.7, zorder=4.1)


def play_tile(ax, x, y, w=0.38, h=0.29):
    """A video latent: a green tile with a play icon."""
    box(ax, x, y, w, h, chalk.GREEN, chalk.GREEN, alpha=0.2, lw=1.4, r=0.06, z=3)
    ax.add_patch(Rectangle((x + w * 0.24, y + h * 0.26), w * 0.52, h * 0.48, facecolor="none",
                           edgecolor=chalk.CHALK, lw=1.6, zorder=4))
    cx, cy = x + w / 2, y + h / 2
    ax.add_patch(Polygon([(cx - 0.035, cy - 0.05), (cx - 0.035, cy + 0.05), (cx + 0.05, cy)],
                         closed=True, color=chalk.CHALK, zorder=4))


def arm_tile(ax, x, y, w=0.38, h=0.30):
    """An action latent: a tile with a robot arm icon."""
    box(ax, x, y, w, h, chalk.RED, chalk.RED, alpha=0.2, lw=1.4, r=0.06, z=3)

    def at(u, v):
        return x + w * (0.12 + 0.76 * u), y + h * (0.08 + 0.84 * v)

    ax.add_patch(Polygon([at(0.10, 0.06), at(0.52, 0.06), at(0.46, 0.20), at(0.16, 0.20)],
                         closed=True, color=chalk.CHALK, zorder=4))
    line(ax, [at(0.31, 0.20), at(0.22, 0.76), at(0.58, 0.62)], lw=2.6, z=4)
    ax.add_patch(Circle(at(0.22, 0.76), 0.022, color=chalk.CHALK, zorder=4.1))
    ax.add_patch(Arc(at(0.78, 0.62), w * 0.76 * 0.36, h * 0.84 * 0.50, theta1=45, theta2=315,
                     color=chalk.CHALK, lw=2.0, zorder=4))


def empty_tile(ax, x, y, w=0.38, h=0.29):
    box(ax, x, y, w, h, chalk.DIM, lw=1.4, r=0.06, ls=(0, (3, 2)), z=3)


def oplus(ax, x, y, r=0.055):
    ax.add_patch(Circle((x, y), r, facecolor="none", edgecolor=chalk.CHALK, lw=1.5, zorder=4))
    line(ax, [(x - r, y), (x + r, y)], lw=1.5)
    line(ax, [(x, y - r), (x, y + r)], lw=1.5)


def add_noise(ax, x0, x1, y, label_y):
    """Tile, plus noise, arrow to the noised tile; the noise comes from below."""
    cx = (x0 + x1) / 2
    line(ax, [(x0, y), (cx - 0.055, y)], lw=1.5)
    oplus(ax, cx, y)
    arrow(ax, [(cx + 0.055, y), (x1, y)], lw=1.5, size=10)
    line(ax, [(cx, y - 0.055), (cx, label_y + 0.10)], lw=1.5)
    label(ax, cx, label_y, "noise", size=14)


def sheets(ax, x, y, w=0.95, h=0.74):
    """The state and text encoder: two sheets, one behind the other."""
    # Back sheet first; each sheet is fill, wash, then outline, so the front one hides the back.
    for k, (dx, dy) in enumerate(((0.0, 0.0), (0.08, -0.10))):
        z = 3 + 0.3 * k
        solid_box(ax, x + dx, y + dy, w, h, "none", chalk.BOARD, lw=0, r=0.02, z=z)
        box(ax, x + dx, y + dy, w, h, chalk.DIM, chalk.DIM, alpha=0.12, lw=1.4, r=0.02, z=z + 0.05)
    label(ax, x + 0.08 + w / 2, y - 0.10 + h / 2, "State/Text\nEncoder", size=14)


def dit(ax, x, y, w, h, title, columns_bottom, text_y, grid_y):
    """The Joint Video-Action DiT: causal blocks and the causal attention grid."""
    label(ax, x + w / 2, y + h + 0.18, title, bold=True)
    box(ax, x, y, w, h, chalk.GREEN, chalk.GREEN, alpha=0.22, lw=1.9, r=0.16)
    col_w, gap = 0.26, 0.055
    left = x + (w - 4 * col_w - 3 * gap) / 2
    for k in range(4):
        box(ax, left + k * (col_w + gap), columns_bottom, col_w, y + h - 0.12 - columns_bottom,
            chalk.GREEN, chalk.GREEN, alpha=0.18, lw=1.0, r=0.03, z=2.5)
    # A patch of the DiT wash behind the label hides the column outlines under the letters.
    label(ax, x + w / 2, text_y, "Causal DiT\nBlocks",
          bbox=chalk.label_box(color=mix(chalk.GREEN, 0.22), pad=0.1))
    cell = 0.12
    for row in range(3):
        for col in range(3):
            open_cell = col <= row  # lower triangle: dark green, the rest grey
            color = mix(chalk.GREEN, 0.75) if open_cell else mix(chalk.DIM, 0.45)
            cx = x + w / 2 + (col - 1) * (cell + 0.025)
            cy = grid_y - (row - 1) * (cell + 0.025)
            solid_box(ax, cx - cell / 2, cy - cell / 2, cell, cell, "none", color, lw=0, r=0.02,
                      z=4)


def dreamzero_architecture():
    """Redraw of Figure 4 of Ye et al., World Action Models are Zero-shot Policies (2026, CC BY 4.0).

    Labels follow assets/robotics/modern-control/v3/dreamzero-architecture.png. Training is
    drawn above inference, which sat to its right. Green is the video stream and the
    model, as in the original; the beige action stream is RED. The video frames, the
    robot photo and the four noised tiles are crops of the original. The training video
    is four stacked frames (15-106, 20-111, 26-117 and 31-124 px across, from y = 106 to
    177); the past frames at inference are three (739-842 px across, 113-178 down).
    """
    source = V3 / "dreamzero-architecture.png"
    width, height = 6.4, 9.45
    fig, ax = board(width, height)
    crops = []

    def tile_crop(box_px, x, y, w=0.38):
        crops.append(crop(source, box_px, x, y, w, mask=rounded_mask(box_px, 6)))

    # Training.
    top = height
    label(ax, 3.2, top - 0.22, "Training: Joint Video-Action Flow Matching", size=17.5,
          color=chalk.YELLOW)
    dit(ax, 3.35, top - 2.95, 1.40, 2.17, "Joint Video-Action DiT", top - 2.10, top - 1.22,
        top - 1.75)
    label(ax, 0.73, top - 0.66, "Video")
    stack = (15, 106, 124, 177)
    crops.append(crop(source, stack, 0.18, top - 1.67, 1.10, mask=stack_mask(
        stack, [(15, 106, 106, 157), (20, 111, 111, 163), (26, 117, 117, 169), (31, 124, 124, 177)])))
    dots(ax, 0.04, top - 0.95, step=(0.04, -0.04))
    trapezoid(ax, 1.40, 0.66, (top - 1.72, top - 0.86), (top - 1.62, top - 0.96), chalk.GREEN)
    label(ax, 1.73, top - 1.29, "VAE\nEncoder", size=14)
    label(ax, 2.34, top - 0.66, "Latents")
    dots(ax, 3.04, top - 0.64)
    for k in range(3):
        play_tile(ax, 2.15, top - 1.12 - 0.30 * k)
    for k in range(2):
        play_tile(ax, 2.85, top - 1.12 - 0.30 * k)
    tile_crop((285, 158, 324, 189), 2.85, top - 1.72)
    add_noise(ax, 2.53, 2.84, top - 1.57, top - 1.88)

    label(ax, 0.73, top - 1.92, "Action")
    action_plot(ax, 0.22, top - 2.95, 1.06, 0.84, TRAIN_CURVES)
    trapezoid(ax, 1.40, 0.66, (top - 3.00, top - 2.12), (top - 2.90, top - 2.22), chalk.RED)
    label(ax, 1.73, top - 2.56, "Action\nEncoder", size=14)
    arm_tile(ax, 2.15, top - 2.68)
    tile_crop((286, 236, 325, 267), 2.85, top - 2.68)
    add_noise(ax, 2.53, 2.84, top - 2.53, top - 2.88)

    dots(ax, 5.06, top - 0.64)
    empty_tile(ax, 4.87, top - 1.12)
    empty_tile(ax, 4.87, top - 1.42)
    play_tile(ax, 4.87, top - 1.72)
    arm_tile(ax, 4.87, top - 2.68)
    brace = [(5.27, top - 1.575), (5.36, top - 1.60), (5.38, top - 1.70), (5.38, top - 2.40),
             (5.36, top - 2.50), (5.27, top - 2.53)]
    line(ax, brace, color=chalk.RED, lw=2.2)
    arrow(ax, [(5.38, top - 2.05), (5.55, top - 2.05)], color=chalk.RED, lw=2.2, size=12)
    label(ax, 5.98, top - 1.92, "Joint flow\nmatching", color=chalk.RED)
    label(ax, 5.98, top - 2.37, "(Teacher\nforcing)", size=13, color=chalk.RED)

    label(ax, 0.73, top - 3.30, "Proprioception")
    label(ax, 0.73, top - 3.66, "Language")
    label(ax, 0.73, top - 4.03, "“Pack up the fruits\ninto the bag”", size=14, color=chalk.DIM)
    sheets(ax, 1.48, top - 3.93)
    arrow(ax, [(2.53, top - 3.66), (4.05, top - 3.66), (4.05, top - 2.97)])

    line(ax, [(0.10, top - 4.42), (6.30, top - 4.42)], color=chalk.FAINT, lw=1.6, dashed=True)

    # Inference.
    top = height - 4.55
    label(ax, 3.2, top - 0.22, "Inference: Closed-Loop Real World Execution", size=17.5,
          color=chalk.YELLOW)
    dit(ax, 2.60, top - 2.95, 1.36, 2.17, "Joint Video-Action DiT", top - 1.98, top - 1.20,
        top - 1.70)
    box(ax, 2.70, top - 2.82, 1.16, 0.66, chalk.GREEN, chalk.GREEN, alpha=0.2, lw=1.4, r=0.1, z=3)
    label(ax, 3.28, top - 2.49, "KV Cache", size=16)

    label(ax, 0.75, top - 0.66, "Past frames")
    stack = (739, 113, 842, 178)
    crops.append(crop(source, stack, 0.22, top - 1.63, 1.05, mask=stack_mask(
        stack, [(739, 113, 830, 164), (745, 120, 836, 171), (750, 126, 842, 178)])))
    dots(ax, 0.09, top - 0.98, step=(0.04, -0.04))
    trapezoid(ax, 1.37, 0.64, (top - 1.72, top - 0.86), (top - 1.62, top - 0.96), chalk.GREEN)
    label(ax, 1.69, top - 1.29, "VAE\nEncoder", size=14)
    dots(ax, 2.30, top - 0.64)
    play_tile(ax, 2.11, top - 1.12)
    play_tile(ax, 2.11, top - 1.42)
    tile_crop((937, 158, 976, 189), 2.11, top - 1.72)
    tile_crop((939, 236, 979, 267), 2.11, top - 2.68)

    dots(ax, 4.25, top - 0.64)
    empty_tile(ax, 4.06, top - 1.12)
    empty_tile(ax, 4.06, top - 1.42)
    play_tile(ax, 4.06, top - 1.72)
    arm_tile(ax, 4.06, top - 2.68)
    trapezoid(ax, 4.54, 0.64, (top - 1.62, top - 0.96), (top - 1.72, top - 0.86), chalk.GREEN)
    label(ax, 4.86, top - 1.29, "VAE\nDecoder", size=14)
    trapezoid(ax, 4.54, 0.64, (top - 2.90, top - 2.22), (top - 3.00, top - 2.12), chalk.RED)
    label(ax, 4.86, top - 2.56, "Action\nDecoder", size=14)
    label(ax, 5.78, top - 0.66, "Future frames")
    crops.append(crop(source, (1288, 115, 1382, 168), 5.28, top - 1.57, 1.00))
    label(ax, 5.78, top - 1.93, "Future action\nchunk")
    action_plot(ax, 5.32, top - 3.00, 0.98, 0.72, INFER_CURVES, future_from=0.75)

    box(ax, 5.14, top - 4.38, 1.24, 1.22, chalk.DIM, chalk.DIM, alpha=0.14, r=0.12)
    label(ax, 5.78, top - 3.42, "Async real-world\nexecution", size=13)
    box_px = (1287, 334, 1381, 396)
    crops.append(crop(source, box_px, 5.30, top - 4.31, 0.96, mask=rounded_mask(box_px, 9)))

    label(ax, 0.92, top - 2.40, "Proprioception")
    label(ax, 0.86, top - 2.84, "Language")
    label(ax, 0.86, top - 3.22, "“Pack up the fruits\ninto the bag”", size=14, color=chalk.DIM)
    sheets(ax, 1.55, top - 3.97)
    arrow(ax, [(2.60, top - 3.70), (3.05, top - 3.70), (3.05, top - 2.97)])

    # Autoregressive flow sampling: a dotted loop around the bottom of the DiT.
    theta = np.radians(np.linspace(28, -197, 90))
    loop = np.column_stack([3.28 + 0.86 * np.cos(theta), top - 2.95 + 0.25 * np.sin(theta)])
    arrow(ax, loop, color=chalk.DIM, lw=1.8, size=11, dotted=True)
    label(ax, 4.48, top - 3.45, "Autoregressive\nflow sampling", color=chalk.DIM)

    # Update with real observation: the green feedback loop.
    green = dict(color=chalk.GREEN, lw=3.0, size=14)
    line(ax, [(5.78, top - 3.00), (5.78, top - 3.16)], color=chalk.GREEN, lw=3.0)
    arrow(ax, [(5.78, top - 4.38), (5.78, top - 4.55), (0.06, top - 4.55), (0.06, top - 1.40),
               (0.21, top - 1.40)], **green)
    arrow(ax, [(0.06, top - 2.40), (0.36, top - 2.40)], **green)
    arrow(ax, [(3.55, top - 4.55), (3.55, top - 2.97)], **green)
    label(ax, 3.2, top - 4.77, "Update with Real Observation", size=16, color=chalk.GREEN,
          bold=True)

    path = V3 / "dreamzero-architecture-chalk.png"
    chalk.save(fig, path, tight=False)
    paste_crops(path, height, crops)
    return path


# ---------------------------------------------------------------- V-JEPA 2 planning

# The action distributions under the two predictors: four rows from the back to the
# front, each a bump at a place across the row (0 to 1), read from the original figure.
# Original colors: blue, grey-purple, light blue and grey.
ACTIONS_FIRST = [(0.33, chalk.BLUE), (0.59, chalk.LAVENDER), (0.46, chalk.SLATE), (0.63, chalk.DIM)]
ACTIONS_LAST = [(0.59, chalk.BLUE), (0.47, chalk.LAVENDER), (0.57, chalk.SLATE), (0.52, chalk.DIM)]


def d_shape(x, y, w, h, corner=0.03):
    """The V-JEPA encoder and predictor outline: a flat left side and a round right end."""
    r = h / 2
    right = np.linspace(-np.pi / 2, np.pi / 2, 40)
    upper_left = np.linspace(np.pi / 2, np.pi, 6)
    lower_left = np.linspace(np.pi, 1.5 * np.pi, 6)
    xs = np.concatenate([x + w - r + r * np.cos(right), x + corner + corner * np.cos(upper_left),
                         x + corner + corner * np.cos(lower_left)])
    ys = np.concatenate([y + r + r * np.sin(right), y + h - corner + corner * np.sin(upper_left),
                         y + corner + corner * np.sin(lower_left)])
    return closed_path(xs, ys)


def feature_grid(ax, x, cy, highlight=False, cell=0.24, gap=0.015):
    """A 3 x 3 grid of patch features; the predicted grid is filled (purple in the original)."""
    side = 3 * cell + 2 * gap
    for row in range(3):
        for col in range(3):
            left, bottom = x + col * (cell + gap), cy - side / 2 + row * (cell + gap)
            if highlight:
                solid_box(ax, left, bottom, cell, cell, chalk.PINK, mix(chalk.PINK, 0.55), lw=1.2,
                          r=0, z=3)
            else:
                box(ax, left, bottom, cell, cell, chalk.SLATE, chalk.SLATE, alpha=0.14, lw=1.2,
                    r=0, z=3)
    return side


def action_ridges(ax, cx, y0, rows, w=0.80, step=0.10, bump=0.34):
    """Stacked action distributions: one bump on each of four lines, back rows first."""
    xs = np.linspace(cx - w / 2, cx + w / 2, 120)
    sigma = 0.085 * w
    for k, (place, color) in enumerate(rows):
        base = y0 + (len(rows) - 1 - k) * step
        ys = base + bump * np.exp(-((xs - (cx - w / 2 + place * w)) ** 2) / (2 * sigma ** 2))
        outline = np.column_stack([np.r_[xs, xs[-1], xs[0]], np.r_[ys, base, base]])
        ax.add_patch(Polygon(outline, closed=True, facecolor=mix(color, 0.6), edgecolor="none",
                             zorder=3 + k * 0.1))
        ax.plot(xs, ys, color=chalk.CHALK, lw=1.9, zorder=3.05 + k * 0.1, solid_capstyle="butt")


def vjepa_planning():
    """Redraw of Figure 7 of V-JEPA 2 (Assran et al., 2025, CC BY 4.0).

    Labels follow assets/robotics/modern-control/vjepa-planning.png. The original is one
    row that ends in the goal branch, drawn right to left. Here the rollout is the first
    row and the goal branch is a second row under it, drawn left to right, so both
    encoders face their feature grids. The two images are crops of the original, inside
    their thin frames: the current observation at (35, 127) and the goal image at
    (1282, 127), both about 123 px square.
    """
    source = OUT / "vjepa-planning.png"
    width, height = 6.4, 4.85
    fig, ax = board(width, height)
    label(ax, 3.2, height - 0.25, "VJEPA 2-AC Model Predictive Control", size=17.5,
          color=chalk.YELLOW, bold=True)
    rollout, goal = height - 1.15, height - 3.70
    crops = [crop(source, (35, 127, 158, 251), 0.35, rollout - 0.504, 1.00),
             crop(source, (1282, 127, 1404, 250), 0.35, goal - 0.504, 1.00)]
    label(ax, 0.85, rollout - 0.85, "Current\nObservation")
    label(ax, 0.85, goal - 0.85, "Goal\nImage")
    for cy in (rollout, goal):
        shape_patch(ax, d_shape(1.45, cy - 0.50, 0.95, 1.00), chalk.SLATE, chalk.SLATE)
        label(ax, 1.83, cy, r"E$_\theta$", size=19)
        feature_grid(ax, 2.50, cy)

    for x, rows, name in ((3.35, ACTIONS_FIRST, "$a_1$"), (4.49, ACTIONS_LAST, "$a_t$")):
        shape_patch(ax, d_shape(x, rollout - 0.31, 0.70, 0.62), chalk.SLATE, chalk.SLATE)
        label(ax, x + 0.30, rollout, r"P$_\phi$", size=19)
        action_ridges(ax, x + 0.30, rollout - 1.55, rows)
        arrow(ax, [(x + 0.30, rollout - 0.90), (x + 0.30, rollout - 0.34)], color=chalk.DIM,
              lw=1.9, size=12)
        label(ax, x + 0.30, rollout - 1.80, name, size=18, bold=True)
    arrow(ax, [(4.11, rollout), (4.45, rollout)], color=chalk.DIM, lw=1.9, size=12, dashed=True)
    side = feature_grid(ax, 5.29, rollout, highlight=True)

    loss_x = 5.29 + side / 2
    box(ax, loss_x - 0.33, goal - 0.24, 0.66, 0.48, chalk.RED, chalk.RED, alpha=0.15, lw=3.0, r=0)
    label(ax, loss_x, goal, r"L$_1$", size=18, bold=True)
    red = dict(color=chalk.RED, lw=2.6, size=13, dashed=True)
    arrow(ax, [(loss_x, rollout - side / 2 - 0.06), (loss_x, goal + 0.28)], **red)
    arrow(ax, [(3.31, goal), (loss_x - 0.37, goal)], **red)

    path = OUT / "vjepa-planning-chalk.png"
    chalk.save(fig, path, tight=False)
    paste_crops(path, height, crops)
    return path


def main():
    chalk.use()
    for make in (expo_ft_architecture, mem_architecture, dreamzero_architecture, vjepa_planning):
        print(make().relative_to(ROOT))


if __name__ == "__main__":
    main()
