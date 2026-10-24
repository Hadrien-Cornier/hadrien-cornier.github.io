"""Render the Franka figures and videos of "How an arm moves" on the chalk board.

Figures, written to assets/robotics/arm-control/v3/:

- franka_joint_names.png
- franka_same_pose_two_configs.png
- franka_wine_orientation_comparison.png
- franka_wine_orientation.mp4 and franka_wine_orientation.png (its poster)
- franka_workspace_slab.mp4 and franka_workspace_slab.png (its poster and a still figure)
- franka_wrist_motion.mp4 and franka_wrist_motion.png (its poster)

It also writes the article thumbnail
assets/robotics/thumbnails/from-joint-angles-to-a-moving-arm.jpg from franka_joint_names.png.

Adapted from github.com/Hadrien-Cornier/maniskill-playground at commit 81e2a65:
experiments/workspace/robot_visuals_v3.py (its render stage), with draw_robot() and
occupancy_cut() from src/maniskill_playground/workspace_viewer.py. The poses, cameras, labels
and numbers are the same. Only the style and the phone layout change.

The script reads the saved data of that checkout and needs no ManiSkill, SAPIEN or GPU:

- experiments/workspace/results/seed7-dense/robot_geometry.json (Franka visual meshes)
- experiments/workspace/results/seed7-dense/metadata.json (robot base pose)
- experiments/workspace/results/seed7-dense/samples.npz (sampled workspace)
- experiments/workspace/figures-v3/robot-motion-checks.json (the checked poses that
  robot_visuals_v3.py --stage prepare saved; the audit in native-motion-audit.json covers them)

Color words: the chalk set has no orange and no teal. The old orange slab is RED, and the slab
title says "Red slab". The old orange hand point and target cube are YELLOW in every figure, so
they differ from the red x axis; the wrist and wine text says "yellow". The old teal cells are
GREEN, and the footer says "Green cells". The original figures said "orange" and "teal".

The meshes come from ManiSkill 3.0.1 (CC BY-NC 4.0, Franka notices). The script does not copy
them into this repository. See assets/robotics/arm-control/ASSET-NOTICES.md.

Run from the blog repository root (Python with matplotlib 3.8 or later, numpy, Pillow, and
FFmpeg on PATH):

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/franka_visuals.py \
        --source <maniskill-playground checkout>

Add --only labels same-pose wine-still wrist workspace wine to make a subset, and --output DIR
to write somewhere else than the site folders.
"""

import argparse
import contextlib
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import colors as mcolors
from matplotlib import patheffects, transforms
from matplotlib.colors import ListedColormap
from mpl_toolkits.mplot3d import proj3d
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "assets/robotics/chalk"))
import chalk  # noqa: E402

SITE = REPO / "assets/robotics/arm-control/v3"
THUMBNAIL = REPO / "assets/robotics/thumbnails/from-joint-angles-to-a-moving-arm.jpg"

# Colors by meaning. The figure text names some of them, so keep these pairs:
# "Red / green / blue are the carried hand axes", "Red x and green y", "its own blue axis".
AXES = [chalk.RED, chalk.GREEN, chalk.BLUE]
# The old orange marks. The chalk set has no orange. The slab uses RED ("Red slab: 6 cm thick").
SLAB = chalk.RED
# The hand point and the target cube use YELLOW in every figure, so they differ from the red x
# axis ("The yellow hand point stays fixed", "Fixed yellow target").
TARGET = chalk.YELLOW
# The sampled workspace cells. The chalk set has no teal; chalk.FROM_LIGHT maps teal-700 to GREEN
# ("Green cells contain a valid sampled hand position").
CELLS = chalk.GREEN
GLASS = chalk.SLATE
INK = chalk.CHALK
NOTE = chalk.DIM
TITLE = chalk.YELLOW
# Old J1 to J7 colors: blue, orange, purple, green, crimson, ochre, teal.
JOINT_COLORS = [chalk.BLUE, chalk.RED, chalk.LAVENDER, chalk.GREEN, chalk.PINK, chalk.YELLOW,
                chalk.SLATE]
# Robot shading on the board: a light shell, mid-gray rubber parts, chalk outlines.
SHELL, RUBBER, OUTLINE = chalk.CHALK, chalk.FAINT, chalk.CHALK
LEDS = {(255, 0, 0): chalk.RED, (0, 255, 0): chalk.GREEN, (10, 138, 199): chalk.BLUE}

LABELS = [
    "Base turn",
    "Shoulder bend",
    "Upper-arm twist",
    "Elbow bend",
    "Forearm twist",
    "Wrist bend",
    "Tool turn",
]
HAND_LINKS = {"panda_hand", "panda_leftfinger", "panda_rightfinger", "panda_link7"}

WIDTH = 6.4  # inches: the phone column rule of the chalk style
VIDEO_DPI = 200  # 1280 px wide frames
FPS = 20
LIGHT = mcolors.LightSource(azdeg=225, altdeg=19.4712).direction  # matplotlib's shade=True light


@contextlib.contextmanager
def chalk_palette():
    """Keep the chalk colors in the 256-color palette that chalk.save writes.

    chalk.save quantizes with a median cut. The small hand-axis arrows have too few pixels to get
    their own palette entries, so their red, green and blue moved toward teal and gray. Inside this
    context the median cut makes the other entries, and each chalk color (full and grain-thinned)
    gets a fixed entry. Report to the style owner: chalk.save itself could seed its palette.
    """
    original = Image.Image.quantize
    board = np.array(mcolors.to_rgb(chalk.BOARD)) * 255
    seeds = []
    for name in ["CHALK", "DIM", "FAINT", "YELLOW", "RED", "PINK", "BLUE", "GREEN", "LAVENDER",
                 "SLATE"]:
        rgb = np.array(mcolors.to_rgb(getattr(chalk, name))) * 255
        seeds += [rgb, board + (rgb - board) * 0.85]
    seeds = np.rint(seeds).astype(int).ravel().tolist()

    def quantize(self, colors=256, method=None, kmeans=0, palette=None,
                 dither=Image.Dither.FLOYDSTEINBERG):
        if palette is not None or self.mode != "RGB":
            return original(self, colors=colors, method=method, kmeans=kmeans, palette=palette,
                            dither=dither)
        free = colors - len(seeds) // 3
        cut = original(self, colors=free, method=method, kmeans=kmeans, dither=dither)
        reference = Image.new("P", (1, 1))
        reference.putpalette(cut.getpalette()[: 3 * free] + seeds)
        return original(self, palette=reference, dither=dither)

    Image.Image.quantize = quantize
    try:
        yield
    finally:
        Image.Image.quantize = original


def save(fig, path, **kwargs):
    """chalk.save with the chalk colors kept in the palette."""
    with chalk_palette():
        chalk.save(fig, path, **kwargs)


def halo(width=3.0):
    """A board-colored edge under chalk strokes and labels, so they read over the robot."""
    return [patheffects.withStroke(linewidth=width, foreground=chalk.HALO)]


# --------------------------------------------------------------------------- data


def load(source):
    workspace = Path(source) / "experiments/workspace"
    inputs = workspace / "results/seed7-dense"
    geometry_bytes = (inputs / "robot_geometry.json").read_bytes()
    audit = json.loads((workspace / "figures-v3/native-motion-audit.json").read_text())
    assert hashlib.sha256(geometry_bytes).hexdigest() == audit["input_geometry_sha256"], (
        "robot_geometry.json differs from the geometry that the saved poses were audited with"
    )
    geometry = json.loads(geometry_bytes)
    metadata = json.loads((inputs / "metadata.json").read_text())
    data = json.loads((workspace / "figures-v3/robot-motion-checks.json").read_text())
    samples = np.load(inputs / "samples.npz")
    offset = np.asarray(metadata["robot_root_world_matrix"])[:3, 3]
    meshes = [prepare_mesh(mesh) for mesh in geometry["meshes"]]
    return geometry, meshes, data, samples, offset


def prepare_mesh(mesh):
    """Mesh arrays, its chalk base color, and its edge-to-face adjacency (for outlines)."""
    faces = np.asarray(mesh["faces"])
    rgb = tuple(int(x) for x in mesh["color"][4:-1].split(","))
    if min(rgb) > 200:
        base, floor = SHELL, 0.3
    elif max(rgb) < 30:
        base, floor = RUBBER, 0.6
    else:
        base, floor = LEDS[rgb], 0.6
    edges = np.sort(np.concatenate([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]), axis=1)
    owner = np.tile(np.arange(len(faces)), 3)
    order = np.lexsort((edges[:, 1], edges[:, 0]))
    edges, owner = edges[order], owner[order]
    pair = np.flatnonzero(np.all(edges[1:] == edges[:-1], axis=1))
    lone = np.ones(len(edges), bool)
    lone[pair] = lone[pair + 1] = False
    return {
        "link": mesh["link"],
        "vertices": np.asarray(mesh["vertices"], dtype=float),
        "faces": faces,
        "base": np.asarray(mcolors.to_rgb(base)),
        "floor": floor,
        "pair_a": owner[pair],
        "pair_b": owner[pair + 1],
        "lone": np.unique(owner[lone]),
    }


# --------------------------------------------------------------------------- drawing


def view_vector(ax):
    """Unit vector from the scene toward the viewer (the box aspect equals the data ranges)."""
    elev, azim = np.deg2rad(ax.elev), np.deg2rad(ax.azim)
    return np.array([np.cos(elev) * np.cos(azim), np.cos(elev) * np.sin(azim), np.sin(elev)])


def draw_robot(ax, meshes, pose, offset, links=None):
    """workspace_viewer.draw_robot on the board: the same meshes, poses and hand frame."""
    eye = view_vector(ax)
    outline = np.r_[mcolors.to_rgb(OUTLINE), 1.0]
    for mesh in meshes:
        if links is not None and mesh["link"] not in links:
            continue
        matrix = np.asarray(pose["link_matrices"][mesh["link"]])
        vertices = mesh["vertices"] @ matrix[:3, :3].T + matrix[:3, 3] - offset
        triangles = vertices[mesh["faces"]]
        normals = np.cross(triangles[:, 0] - triangles[:, 1], triangles[:, 1] - triangles[:, 2])
        with np.errstate(invalid="ignore"):
            normals /= np.linalg.norm(normals, axis=1, keepdims=True)
        normals = np.nan_to_num(normals)
        # The same light and the same shade formula as matplotlib's shade=True.
        light = mesh["floor"] + (1 - mesh["floor"]) * (normals @ LIGHT + 1) / 2
        face = np.ones((len(triangles), 4))
        face[:, :3] = light[:, None] * mesh["base"]
        # Chalk outline: front faces next to a back face (the contour) or at an open border.
        outward = np.sign(np.sum(normals * (triangles.mean(axis=1) - vertices.mean(axis=0)))) or 1
        front = outward * (normals @ eye) > 0
        contour = np.zeros(len(triangles), bool)
        turn = front[mesh["pair_a"]] != front[mesh["pair_b"]]
        contour[mesh["pair_a"][turn]] = True
        contour[mesh["pair_b"][turn]] = True
        contour[mesh["lone"]] = True
        contour &= front
        edge = face.copy()
        edge[contour] = outline
        widths = np.where(contour, 0.55, 0.3)  # the thin same-color edge hides the seams
        collection = Poly3DCollection(triangles, facecolors=face, edgecolors=edge,
                                      linewidths=widths)
        collection.set_sketch_params(None)
        ax.add_collection3d(collection)
    tip = np.asarray(pose["p"]) - offset
    # The hand frame is drawn above the meshes, the glass and the labels, at full chalk color.
    ax.scatter(*tip, s=35, c=TARGET, depthshade=False, zorder=6)
    for i, color in enumerate(AXES):
        ax.quiver(*tip, *np.asarray(pose["R"])[:, i], length=0.12, color=color, linewidth=3.6,
                  zorder=5)


def clean(ax, limits=((-0.2, 0.9), (-0.55, 0.55), (-0.015, 0.95)), eye=(20, -65), zoom=1.0):
    ax.set(xlim=limits[0], ylim=limits[1], zlim=limits[2])
    ax.set_box_aspect([b - a for a, b in limits], zoom=zoom)
    ax.view_init(*eye)
    ax.set_axis_off()
    ax.set_proj_type("ortho")
    ax.patch.set_visible(False)  # panels may overlap the empty corners of their neighbors


def table(ax, geometry, offset, clip=False):
    b = np.asarray(geometry["table_bounds"]) - offset
    v = [
        [b[0, 0], b[0, 1], b[1, 2]],
        [b[1, 0], b[0, 1], b[1, 2]],
        [b[1, 0], b[1, 1], b[1, 2]],
        [b[0, 0], b[1, 1], b[1, 2]],
    ]
    # Keep the whole tabletop, as in the source figure. Clipping it to a 3D axes cut its right
    # and near edges out of the redraw; the board crop still bounds the finished figure.
    ax.add_collection3d(Poly3DCollection([v], facecolor=mcolors.to_rgba(chalk.DIM, 0.045),
                                         edgecolor=mcolors.to_rgba(chalk.DIM, 0.45),
                                         linewidth=1.2, zorder=-2, clip_on=clip))


def base_marker(ax):
    # The marker is drawn above the label halo; the label sits centered under it, clear of the
    # hand frame.
    ax.scatter(0, 0, 0, color=INK, s=28, edgecolors=chalk.HALO, linewidths=1.0, zorder=7)
    shift = transforms.offset_copy(ax.transData, fig=ax.figure, x=0, y=-4, units="points")
    ax.text(0, 0, 0, "fixed base", color=INK, fontsize=15, path_effects=halo(), ha="center",
            va="top", transform=shift, zorder=4)


def title(fig, text, y):
    fig.text(0.5, y, text, ha="center", va="top", fontsize=19, color=TITLE)


def panel_title(fig, x, y, text, size=16, va="baseline"):
    """A panel title; y is its baseline (or its top for va="top")."""
    fig.text(x, y, text, ha="center", va=va, fontsize=size, color=TITLE, linespacing=0.95)


def footer(fig, message, y):
    fig.text(0.5, y, message, ha="center", va="bottom", fontsize=14, color=NOTE,
             linespacing=0.95)


def add_3d(fig, rect, anchor="C"):
    ax = fig.add_axes(rect, projection="3d", computed_zorder=False)
    ax.set_anchor(anchor)
    return ax


# --------------------------------------------------------------------------- stills


def inches(fig, value):
    """Figure fraction of a height in inches."""
    return value / fig.get_size_inches()[1]


def labeled_arm(geometry, meshes, rest, offset, path):
    fig = plt.figure(figsize=(WIDTH, 5.4))
    title(fig, "Seven joints, seven ways to turn", 0.985)
    # Keep the source renderer's projection and axes rectangle: its whole tabletop then fits
    # beside the joint labels, with no change to the physical table relative to the robot.
    ax = add_3d(fig, [0.0, 0.10, 0.63, 0.78])
    clean(ax, zoom=1.0)
    draw_robot(ax, meshes, rest, offset)
    table(ax, geometry, offset)
    for number, radius in enumerate([0.055, 0.083, 0.050, 0.057, 0.051, 0.077, 0.048], 1):
        matrix = np.asarray(rest["link_matrices"][f"panda_link{number}"])
        center, axis = matrix[:3, 3] - offset, matrix[:3, 2]
        axis = axis / np.linalg.norm(axis)
        u = np.cross(axis, np.eye(3)[np.argmin(np.abs(axis))])
        u /= np.linalg.norm(u)
        v = np.cross(axis, u)
        theta = np.deg2rad(np.linspace(20, 290, 80))
        radial = np.cos(theta)[:, None] * u + np.sin(theta)[:, None] * v
        assert np.max(np.abs(radial @ axis)) < 1e-12
        curve = center + radius * radial
        color = JOINT_COLORS[number - 1]
        ax.plot(*curve.T, color=color, lw=2.4, zorder=40, path_effects=halo(4.2))
        tangent = -np.sin(theta[-1]) * u + np.cos(theta[-1]) * v
        assert np.linalg.norm(np.cross(radial[-1], tangent) - axis) < 1e-12
        ax.quiver(*curve[-1], *tangent, length=radius * 0.35, normalize=True, color=color,
                  linewidth=2.5, arrow_length_ratio=0.6, zorder=41)
    fig.canvas.draw()
    positions = [
        (0.10, 0.25),
        (0.05, 0.47),
        (0.15, 0.80),
        (0.50, 0.86),
        (0.83, 0.70),
        (0.88, 0.52),
        (0.86, 0.30),
    ]
    for i, (where, color) in enumerate(zip(positions, JOINT_COLORS, strict=True), 1):
        p = np.asarray(rest["link_matrices"][f"panda_link{i}"])[:3, 3] - offset
        x, y, _ = proj3d.proj_transform(*p, ax.get_proj())
        ax.annotate(
            f"J{i}",
            xy=(x, y),
            xytext=where,
            textcoords="axes fraction",
            fontsize=17,
            color=color,
            ha="center",
            va="center",
            path_effects=halo(3.5),
            arrowprops={"arrowstyle": "-", "lw": 1.5, "color": color, "shrinkA": 7,
                        "path_effects": halo(3.5)},
        )
    for i, (label, color) in enumerate(zip(LABELS, JOINT_COLORS, strict=True)):
        fig.text(0.74, 0.80 - 0.074 * i, f"J{i + 1}  {label}", color=color, fontsize=15)
    fig.text(0.74, 0.215, "Fingers slide\nopen / closed", color=INK, fontsize=15,
             linespacing=0.95)
    footer(
        fig,
        "Franka Panda. Informal motion labels beside the official joint numbers.\n"
        "These are not the SO-101's joint names.",
        0.015,
    )
    save(fig, path)


def same_pose(geometry, meshes, data, offset, path):
    fig = plt.figure(figsize=(WIDTH, 4.9))
    title(fig, "Different joint angles. The same hand pose.", 0.985)
    target = np.asarray(data["rest"]["p"]) - offset
    cube = np.array([[x, y, z] for x in [-0.03, 0.03] for y in [-0.03, 0.03] for z in [-0.03, 0.03]])
    cube = cube @ np.asarray(data["rest"]["R"]).T + target
    faces = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]]
    for i, name in enumerate(["rest", "alternate"]):
        # Raise the source axes rectangle within the taller phone canvas so the tabletop's
        # near edge stays above the three-line footer; the table and robot keep the same scale.
        ax = add_3d(fig, [i * 0.49 + 0.005, 0.32, 0.49, 0.53])
        clean(ax, ((-0.14, 0.85), (-0.22, 0.42), (-0.02, 0.78)), eye=(23, -65), zoom=1.0)
        draw_robot(ax, meshes, data[name], offset)
        table(ax, geometry, offset)
        ax.add_collection3d(
            Poly3DCollection(cube[faces], facecolors="none", edgecolors=TARGET, linewidths=1.3)
        )
        panel_title(fig, 0.25 + 0.5 * i, 1 - inches(fig, 0.74),
                    f"Configuration {'A' if i == 0 else 'B'}")
    check = data["same_pose_check"]
    footer(
        fig,
        "Same schematic cube and hand pose. No grasp/contact simulation.\n"
        "Position difference < 0.01 mm; orientation difference < 0.01°.\n"
        f"Elbow moves {check['elbow_separation_m'] * 100:.0f} cm.",
        0.015,
    )
    save(fig, path)


def glass(ax, target, offset):
    center = np.asarray(target) - offset
    theta = np.linspace(0, 2 * np.pi, 50)
    for radius, height in [(0.045, -0.18), (0.007, -0.015), (0.045, 0.06), (0.065, 0.14),
                           (0.055, 0.23)]:
        ax.plot(center[0] + radius * np.cos(theta), center[1] + radius * np.sin(theta),
                np.full_like(theta, center[2] + height), color=GLASS, alpha=0.85, lw=1.6)
    for angle in np.linspace(0, 2 * np.pi, 10, endpoint=False):
        radii = np.array([0.007, 0.007, 0.045, 0.065, 0.055])
        heights = np.array([-0.18, 0.00, 0.06, 0.14, 0.23])
        ax.plot(center[0] + radii * np.cos(angle), center[1] + radii * np.sin(angle),
                center[2] + heights, color=GLASS, alpha=0.45, lw=1)


def wine_visual(geometry, meshes, data, offset, path):
    fig = plt.figure(figsize=(WIDTH, 3.72))
    title(fig, "Same point on a stem. Different approach directions.", 0.985)
    center = np.asarray(data["wine_target"]) - offset
    for i, index in enumerate([0, 30, 60]):
        ax = add_3d(fig, [i / 3, inches(fig, 0.78), 1 / 3, inches(fig, 2.13)])
        clean(ax, tuple((x - 0.25, x + 0.25) for x in center), (19, -65), zoom=1.6)
        draw_robot(ax, meshes, data["wine"][index], offset, HAND_LINKS)
        glass(ax, data["wine_target"], offset)
        panel_title(fig, (i + 0.5) / 3, 1 - inches(fig, 0.74),
                    f"Approach {'A' if i == 0 else 'B' if i == 1 else 'C'}")
    footer(
        fig,
        "Fixed yellow target. Red / green / blue are the carried hand axes.\n"
        "Schematic glass, open fingers: orientation examples,\n"
        "not simulated grasp successes.",
        0.015,
    )
    save(fig, path)


# --------------------------------------------------------------------------- videos


def video(fig, path, count, draw, poster, preview=False, crf=26):
    """Write an H.264 video of count frames, then the poster PNG from the same render.

    crf keeps each file within about 1.5 times the size of the old light video.
    The encoder writes to a temporary folder outside the repository. The finished file
    replaces the site video only after FFmpeg succeeds, so a stopped render does not
    leave a truncated video in the site.
    """
    width, height = (int(round(x * VIDEO_DPI)) for x in fig.get_size_inches())
    assert width % 2 == 0 and height % 2 == 0, (width, height)
    if not preview:
        scratch = tempfile.TemporaryDirectory(prefix="franka_video_")
        partial = Path(scratch.name) / path.with_suffix(".mp4").name
        command = [
            "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{width}x{height}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
            "-crf", str(crf), "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(partial),
        ]
        encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
        fig.patch.set_sketch_params(None)
        for index in range(count):
            draw(index)
            fig.set_dpi(VIDEO_DPI)
            fig.canvas.draw()
            frame = np.asarray(fig.canvas.buffer_rgba())[..., :3]
            assert frame.shape == (height, width, 3), frame.shape
            encoder.stdin.write(chalk.chalk_grain(frame, scale=width / 720).tobytes())
            if index % 30 == 0:
                print(f"{path.stem}: {index}/{count}", flush=True)
        encoder.stdin.close()
        assert encoder.wait() == 0, f"ffmpeg failed for {path}"
        shutil.move(str(partial), str(path.with_suffix(".mp4")))
        scratch.cleanup()
    draw(poster)
    save(fig, path.with_suffix(".png"), tight=False)


def wrist_video(geometry, meshes, data, offset, path, preview=False):
    fig = plt.figure(figsize=(WIDTH, 5.2))
    title(fig, "J7 turns the hand around its own blue axis", 0.985)
    axes = [add_3d(fig, [0.0, 0.17, 0.53, 0.67]),
            add_3d(fig, [0.53, 0.17, 0.46, 0.67])]
    panel_title(fig, 0.25, 1 - inches(fig, 0.79), "Whole arm")
    panel_title(fig, 0.75, 1 - inches(fig, 0.79), "Hand close-up")
    r0 = np.asarray(data["rest"]["R"])
    p0 = np.asarray(data["rest"]["p"])
    view = np.eye(4)
    view[:3, :3] = r0.T
    view[:3, 3] = -r0.T @ p0
    subtitle = fig.text(0.5, inches(fig, 0.97), "", ha="center", va="top", fontsize=17,
                        color=INK)
    footer(fig, "Only J7 changes. The yellow hand point stays fixed.\n"
                "Red x and green y turn together.", 0.015)

    def frame(i):
        current = data["wrist"][i]
        for ax in axes:
            ax.clear()
        clean(axes[0], zoom=1.0)
        draw_robot(axes[0], meshes, current, offset)
        table(axes[0], geometry, offset)
        close = {
            "link_matrices": {
                k: (view @ np.asarray(v)).tolist() for k, v in current["link_matrices"].items()
            },
            "p": [0, 0, 0],
            "R": (r0.T @ np.asarray(current["R"])).tolist(),
        }
        clean(axes[1], ((-0.16, 0.16), (-0.16, 0.16), (-0.04, 0.22)), (25, -60))
        draw_robot(axes[1], meshes, close, np.zeros(3), HAND_LINKS)
        for j, color in enumerate(AXES):
            tip = np.asarray(close["R"])[:, j] * 0.145
            axes[1].text(*tip, "xyz"[j], color=color, fontsize=22, path_effects=halo())
        angle = np.rad2deg(current["q"][6] - data["rest"]["q"][6])
        subtitle.set_text(f"Joint 7: {angle:+.0f}° from its starting angle")

    video(fig, path, len(data["wrist"]), frame, poster=30, preview=preview)


def occupancy_cut(p, valid, axis, coordinate, edges, thickness=0.06):
    """workspace_viewer.occupancy_cut: evidence in a finite slab, not an IK feasibility proof."""
    axes = [0, 2] if axis == 1 else [0, 1]
    selected = np.abs(p[:, axis] - coordinate) <= thickness / 2
    good, _, _ = np.histogram2d(*p[selected & valid][:, axes].T, bins=edges)
    bad, _, _ = np.histogram2d(*p[selected & ~valid][:, axes].T, bins=edges)
    categories = np.zeros_like(good, dtype=int)
    categories[bad > 0] = 1
    categories[good > 0] = 2
    return categories.T, good.T.astype(int), bad.T.astype(int)


def workspace_video(geometry, meshes, data, samples, offset, path, preview=False):
    p, valid = samples["p"] - offset, samples["valid"]
    subset = np.random.default_rng(28).choice(np.flatnonzero(valid), 3500, replace=False)
    edges = [np.arange(-1.08, 1.121, 0.04), np.arange(0, 1.281, 0.04)]
    fig = plt.figure(figsize=(WIDTH, 4.6))
    title(fig, "A thin band through the 3D workspace", 0.985)
    ax3 = add_3d(fig, [-0.075, inches(fig, 0.95), 0.52, inches(fig, 2.79)])
    ax2 = fig.add_axes([0.595, inches(fig, 1.55), 0.39, inches(fig, 1.45)])
    panel_title(fig, 0.25, 1 - inches(fig, 0.84), "Red slab: 6 cm thick")
    panel_title(fig, 0.79, inches(fig, 3.62), "Only this slab,\nviewed from the side", size=15,
                va="top")
    subtitle = fig.text(0.5, inches(fig, 0.92), "", ha="center", va="top", fontsize=16,
                        color=INK)
    footer(fig, "Green cells contain a valid sampled hand position.\n"
                "Blank cells are not proof of impossibility.", 0.015)

    def frame(i):
        coordinate = 0.48 * np.sin(2 * np.pi * i / 159)
        ax3.clear()
        clean(ax3, ((-1.1, 1.1), (-1.1, 1.1), (0, 1.25)),
              (22, -65 + 22 * np.sin(2 * np.pi * i / 159)), zoom=1.17)
        ax3.scatter(*p[subset].T, s=1.5, color=CELLS, alpha=0.10, depthshade=False)
        selected = subset[np.abs(p[subset, 1] - coordinate) <= 0.03]
        ax3.scatter(*p[selected].T, s=6, color=CELLS, alpha=0.9, depthshade=False)
        for y in [coordinate - 0.03, coordinate + 0.03]:
            face = [[-1.05, y, 0], [1.05, y, 0], [1.05, y, 1.22], [-1.05, y, 1.22]]
            ax3.add_collection3d(Poly3DCollection([face], facecolor=mcolors.to_rgba(SLAB, 0.15),
                                                  edgecolor=SLAB, linewidths=1.2,
                                                  clip_on=False))
        draw_robot(ax3, meshes, data["rest"], offset)
        table(ax3, geometry, offset, clip=False)  # the whole physical table, slab and cells
        base_marker(ax3)
        _, good, _ = occupancy_cut(p, valid, 1, coordinate, edges, thickness=0.06)
        ax2.clear()
        ax2.imshow(
            (good > 0).astype(int),
            origin="lower",
            extent=[edges[0][0], edges[0][-1], edges[1][0], edges[1][-1]],
            cmap=ListedColormap([chalk.BOARD_2, CELLS]),
            vmin=0,
            vmax=1,
            aspect="equal",
            interpolation="nearest",
            zorder=3,  # above the axis lines, so the bottom row of cells stays whole
        )
        ax2.set_xticks([-1.0, -0.5, 0.0, 0.5, 1.0])
        ax2.set_yticks(np.round(np.arange(0, 1.21, 0.2), 1))
        ax2.tick_params(labelsize=13)
        ax2.axhline(0, color=INK, lw=2, zorder=2)
        ax2.spines["bottom"].set_zorder(2)
        ax2.set_xlabel("Forward / back from base (m)", fontsize=14, labelpad=2)
        ax2.set_ylabel("Height above\ntable (m)", fontsize=14, linespacing=0.95, labelpad=3)
        subtitle.set_text(
            f"Slab center: {coordinate:+.2f} m sideways from the base   |   cells: 4 × 4 cm"
        )

    video(fig, path, 160, frame, poster=0, preview=preview)


def wine_video(geometry, meshes, data, offset, path, preview=False):
    fig = plt.figure(figsize=(WIDTH, 5.4))
    title(fig, "Keep the same stem point. Change the approach.", 0.985)
    axes = [add_3d(fig, [0.0, 0.17, 0.53, 0.67]),
            add_3d(fig, [0.53, 0.17, 0.46, 0.67])]
    panel_title(fig, 0.25, 1 - inches(fig, 0.74), "The arm changes its joint angles", size=15)
    panel_title(fig, 0.75, 1 - inches(fig, 0.74), "The yellow target stays fixed", size=15)
    center = np.asarray(data["wine_target"]) - offset
    footer(
        fig,
        "Kinematic illustration with a schematic glass and open fingers.\n"
        "Each shown robot pose is checked.\n"
        "No grasp or continuous-path success is claimed.",
        0.015,
    )
    indices = list(range(len(data["wine"]))) + list(range(len(data["wine"]) - 2, 0, -1))

    def frame(i):
        pose = data["wine"][indices[i]]
        for ax in axes:
            ax.clear()
        clean(axes[0], eye=(22, -65), zoom=1.0)
        draw_robot(axes[0], meshes, pose, offset)
        table(axes[0], geometry, offset)
        glass(axes[0], data["wine_target"], offset)
        clean(axes[1], tuple((x - 0.25, x + 0.25) for x in center), (20, -65), zoom=1.35)
        draw_robot(axes[1], meshes, pose, offset, HAND_LINKS)
        glass(axes[1], data["wine_target"], offset)

    video(fig, path, len(indices), frame, poster=30, preview=preview, crf=27)


# --------------------------------------------------------------------------- main


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", type=Path, required=True,
                        help="maniskill-playground checkout (commit 81e2a65 or later data)")
    parser.add_argument("--output", type=Path, default=SITE)
    parser.add_argument("--only", nargs="+",
                        choices=["labels", "same-pose", "wine-still", "wrist", "workspace", "wine"])
    parser.add_argument("--posters-only", action="store_true",
                        help="write the video posters without the videos (for a layout check)")
    args = parser.parse_args()
    if not args.posters_only and shutil.which("ffmpeg") is None:
        raise SystemExit("FFmpeg is not on PATH")
    args.output.mkdir(parents=True, exist_ok=True)
    chalk.use()
    geometry, meshes, data, samples, offset = load(args.source)
    out = args.output
    preview = args.posters_only
    jobs = {
        "labels": lambda: labeled_arm(geometry, meshes, data["rest"], offset,
                                      out / "franka_joint_names.png"),
        "same-pose": lambda: same_pose(geometry, meshes, data, offset,
                                       out / "franka_same_pose_two_configs.png"),
        "wine-still": lambda: wine_visual(geometry, meshes, data, offset,
                                          out / "franka_wine_orientation_comparison.png"),
        "wrist": lambda: wrist_video(geometry, meshes, data, offset,
                                     out / "franka_wrist_motion.png", preview),
        "workspace": lambda: workspace_video(geometry, meshes, data, samples, offset,
                                             out / "franka_workspace_slab.png", preview),
        "wine": lambda: wine_video(geometry, meshes, data, offset,
                                   out / "franka_wine_orientation.png", preview),
    }
    for name in args.only or jobs:
        jobs[name]()
        print(f"done: {name}", flush=True)
    if "labels" in (args.only or jobs):
        thumbnail = THUMBNAIL if out.resolve() == SITE.resolve() else out / THUMBNAIL.name
        chalk.thumbnail(out / "franka_joint_names.png", thumbnail)


if __name__ == "__main__":
    main()
