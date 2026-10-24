#!/usr/bin/env python3
"""Make the chalk figures of the SO-101 pen holder article (part 5).

Article: content/robotics/so101-pen-holder.md. Base commit of the blog: 3f56632.
Outputs go to assets/robotics/so101-pen-holder/ and assets/robotics/thumbnails/.

Figures and how each one is made. Each figure is saved with chalk.save(..., panel=True), which also
writes the vector panel <name>.svg for the long-form canvas, plus one <name>.svg.image<n>.png file for
each render tile or map in it. chalk.save() keeps those image pixels exactly and then writes a
full-color PNG.

  clamp-section.png    regen. Adapted from so101-pen-holder cad/figure_clamp_section.py
                       (github.com/Hadrien-Cornier/so101-pen-holder, commit 7cfe352). The section
                       comes from the CAD functions in cad/build.py of that checkout.
  lever.png            redraw. No source exists. The values come from the old figure:
                       L = 40 mm, d = 21.5 mm, c = 0.012 mm drawn 250 times larger (3 mm),
                       bushings 12 mm x 6 mm, pen drawn 70 mm long, tip motion c (1 + 2d/L) = 2.08 c.
  design5-on-arm.png   rerender in MuJoCo on a dark scene. Arm: MuJoCo Menagerie robotstudio_so101
                       at commit 822c2d8 (the commit in cad/meshes/PROVENANCE.md). Sleeve:
                       results/sleeve_in_gripper_frame.stl. Thumbscrews and pen placement: cad/build.py
                       (pen 13 mm, 145 mm long, a 1.5 mm ball tip). Jaw: results/checks.json
                       moving_jaw_stop_rad. Pose: inverse kinematics for the tip at x = 240 mm, y = 0,
                       z = 1 mm with the pen vertical (a 3 mm pad, tip 2 mm into it). The floor is a
                       mid-tone chalk checker of 1 cm squares, and the black pen gets a thin light rim
                       where it meets the board. No render script of the old figures exists: the
                       cameras were fitted to the old renders by silhouette matching (part outlines per
                       color, Nelder-Mead), and the fitted values are fixed constants below. ARM_CAM,
                       ARM_PAD and the floor centre come from one fit of the camera, the pad and the far
                       floor edge together, with the MuJoCo default fovy of 45° (fit_arm_scene();
                       `--refit` runs it again). The gripper tile cameras (HIH_*, FIT_STEPS, SLEEVE_*,
                       SCREW_TILE) come from an earlier fit of the part outlines.
  how-it-holds-sleeve.png, how-it-holds-pen.png
                       rerender, same sources and method. The two views of the old how-it-holds.png are
                       two figures for the phone, and the callouts are drawn again in chalk with the
                       same words and anchors.
  design5-fit.png      rerender, same sources and method, with the titles drawn again in chalk.
  design1-on-arm.png   old render pixels. No geometry of design 1 exists. The light sky is replaced
                       by the board, the floor and the parts stay as they are.
  design-history.png   old render pixels of each tile (designs 1 to 4 have no geometry), backdrop
  three-options.png,   replaced by the board with a matte connected to the tile edge, a light rim
  three-options-parts.png   around the dark parts (in all-layouts only around the pen), and every
  all-layouts-1.png ... all-layouts-4.png   word, title and line drawn again in chalk. The old
                       three-options.png and all-layouts.png are cut into these files for the phone.
                       The reach maps and the color bar strip are the old pixels (no data exists); the
                       red ring on each map is drawn again in chalk red over the old cell colors.
  thumbnails/so101-pen-holder.jpg   chalk.thumbnail(..., crop=True) of the design5-on-arm render made
                       wider with the same camera, so the card keeps the old vertical framing.

The old figures are read from git: `git -C <blog repo> show 3f56632:<path>`.

Run from the blog repo root, with Python 3.11 or later and matplotlib >= 3.8, numpy, Pillow, scipy,
trimesh, manifold3d 3.5.4 and mujoco >= 3.3:

    git clone https://github.com/Hadrien-Cornier/so101-pen-holder <pen-holder checkout>
    git clone --filter=blob:none --sparse https://github.com/google-deepmind/mujoco_menagerie <menagerie>
    git -C <menagerie> sparse-checkout set robotstudio_so101
    git -C <menagerie> checkout 822c2d8f877dd166c5b7d3c9f7e3c3b6589473b7
    MUJOCO_GL=cgl PYTHONDONTWRITEBYTECODE=1 python scripts/so101_pen_holder_figures.py \\
        --source <pen-holder checkout> --menagerie <menagerie>/robotstudio_so101

On Linux, use MUJOCO_GL=egl. `--only lever clamp-section` makes a subset. `--refit` prints the fitted
ARM_CAM, ARM_PAD and ARM_FLOOR again (it needs --menagerie) and makes no figure.
"""

from __future__ import annotations

import argparse
import contextlib
import io
import math
import subprocess
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, FancyArrowPatch, PathPatch, Rectangle
from matplotlib.path import Path as MPath
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/so101-pen-holder"
THUMB = ROOT / "assets/robotics/thumbnails/so101-pen-holder.jpg"
BASE_COMMIT = "3f56632"


def old_image(name: str) -> Image.Image:
    """The figure as it was at the base commit, read from git."""
    blob = subprocess.run(["git", "-C", str(ROOT), "show", f"{BASE_COMMIT}:assets/robotics/so101-pen-holder/{name}"],
                          check=True, capture_output=True).stdout
    return Image.open(io.BytesIO(blob)).convert("RGB")


def load_build(source: Path):
    """Import cad/build.py of the so101-pen-holder checkout."""
    sys.path.insert(0, str(Path(source) / "cad"))
    import build  # noqa: E402

    return build


def save_figure(fig, name: str, **kw) -> Path:
    """Save a figure with chalk.save(..., panel=True): OUT/<name> and the vector panel OUT/<stem>.svg.

    chalk.save() keeps the pixels of every imshow and figimage (the render tiles and the reach maps)
    exactly as they are, without grain, and then writes a full-color PNG. In the panel, matplotlib
    writes each image to a file <stem>.svg.image<n>.png and puts its path, as given, into the SVG.
    So the save runs in OUT with a bare file name, and chalk.clean_svg() makes that name a site path.
    The image files of an earlier run are removed first, so that no stale file stays.
    """
    for stale in OUT.glob(f"{Path(name).stem}.svg.image*.png"):
        stale.unlink()
    with contextlib.chdir(OUT):
        chalk.save(fig, Path(name), panel=True, **kw)
    return OUT / name


def save_render(rgb, name: str) -> Path:
    """Save one render as a figure of its own, with no margin: the PNG holds the render pixels as they
    are, at the same size. The figure is made at the save dpi, so figimage puts one render pixel on
    one PNG pixel."""
    dpi = matplotlib.rcParams["savefig.dpi"]
    height, width = rgb.shape[:2]
    fig = plt.figure(figsize=((width + 0.25) / dpi, (height + 0.25) / dpi), dpi=dpi)
    fig.figimage(rgb, xo=0, yo=0, origin="upper")
    return save_figure(fig, name, tight=False)


# ---------------------------------------------------------------------------------------------- clamp section
def fig_clamp_section(source: Path) -> None:
    """Section of one pen clamp from the CAD model, with a 13 mm and an 8 mm pen."""
    b = load_build(source)
    tc = 69.0  # the upper clamp, in the pen frame (z = along the pen)
    polys = [np.asarray(p) for p in b.clamp(tc).slice(tc).to_polygons()]
    fig, axs = plt.subplots(1, 2, figsize=(6.4, 6.0))
    fig.subplots_adjust(left=0.01, right=0.99, top=0.70, bottom=0.01, wspace=0.04)
    for ax, D in zip(axs, (13.0, 8.0)):
        r = D / 2
        shift = math.sqrt(2) * (b.R_REF - r)
        # the clamp: outer outlines filled, holes (the bore and the thread) cleared by the even-odd rule
        verts, codes = [], []
        for p in polys:
            verts += p.tolist() + [p[0].tolist()]
            codes += [MPath.MOVETO] + [MPath.LINETO] * (len(p) - 1) + [MPath.CLOSEPOLY]
        ax.add_patch(PathPatch(MPath(verts, codes), fc=matplotlib.colors.to_rgba(chalk.BLUE, 0.22), ec=chalk.BLUE, lw=1.6))
        # the pen and its two contact lines with the V
        ax.add_patch(Circle((0, shift), r, fc=matplotlib.colors.to_rgba(chalk.DIM, 0.30), ec=chalk.CHALK, lw=2))
        ax.plot(0, shift, "+", color=chalk.CHALK, ms=12, mew=2)
        ax.plot(0, 0, "+", color=chalk.RED, ms=12, mew=2.4)
        for sgn in (-1, 1):
            ax.plot(sgn * r / math.sqrt(2), shift + r / math.sqrt(2), "o", color=chalk.RED, ms=9)
        # the thumbscrew, turned in until it touches the pen
        tip = shift - r
        ax.add_patch(Rectangle((-b.M8_D / 2 + 0.15, tip - b.SCREW_L), b.M8_D - 0.3, b.SCREW_L,
                               fc=matplotlib.colors.to_rgba(chalk.YELLOW, 0.22), ec=chalk.YELLOW, lw=1.6))
        ax.add_patch(Rectangle((-b.HEAD_D / 2, tip - b.SCREW_L - b.HEAD_H), b.HEAD_D, b.HEAD_H,
                               fc=matplotlib.colors.to_rgba(chalk.YELLOW, 0.40), ec=chalk.YELLOW, lw=1.6))
        ax.annotate("", xy=(0, tip + 0.3), xytext=(0, tip - 5),
                    arrowprops=dict(arrowstyle="-|>", color=chalk.RED, lw=3, mutation_scale=18))
        ax.text(b.HEAD_D / 2 + 0.8, tip - b.SCREW_L - b.HEAD_H / 2, "printed M8\nthumbscrew", va="center", fontsize=14,
                color=chalk.CHALK)
        ax.text(0, 15.2, "V on the gripper side", fontsize=14, color=chalk.BLUE, ha="center", va="bottom")
        ax.text(-10.6, -1.0, "3 mm\nring wall", fontsize=14, color=chalk.BLUE, ha="right", va="center")
        ax.set_title(f"{D:.0f} mm pen: its axis moves\n{shift:.1f} mm toward the V", fontsize=15, loc="center")
        ax.set_xlim(-20, 20)
        ax.set_ylim(tip - b.SCREW_L - b.HEAD_H - 1.5, 19)
        ax.set_aspect("equal")
        ax.axis("off")
    fig.text(0.5, 0.995,
             "Section of one pen clamp (true CAD geometry). The screw pushes the pen\n"
             "into the 90° V, so the pen touches the V on two lines (red dots).\n"
             "A thinner pen sits deeper in the V: its axis moves √2 × (6.5 mm − r)\n"
             "toward the gripper. Red cross: the axis of a 13 mm pen.",
             ha="center", va="top", fontsize=14, color=chalk.CHALK, linespacing=1.15)
    save_figure(fig, "clamp-section.png")


# ---------------------------------------------------------------------------------------------- lever
def fig_lever() -> None:
    """The carriage tilts across the bushing clearance; the tip moves c (1 + 2d/L)."""
    L, d = 40.0, 21.5  # span between the bushings, overhang from the lower bushing to the tip (mm)
    c_draw = 0.012 * 250  # diametral clearance, drawn 250 times larger (mm)
    bw, bh = 12.0, 6.0  # bushing width and height as drawn (mm)
    pen_top = 70.0  # pen drawn from the tip up to this height (mm)
    fig, axs = plt.subplots(1, 2, figsize=(6.4, 6.6))
    fig.subplots_adjust(left=0.0, right=1.0, top=0.80, bottom=0.0, wspace=0.0)
    for ax, side, title in ((axs[0], 1, "Load to the right"), (axs[1], -1, "Load to the left")):
        y_lo, y_hi = d, d + L  # bushing centres above the tip
        ax.plot([0, 0], [-6, 72], ls=(0, (4, 3)), color=chalk.DIM, lw=1.3, zorder=1)
        for yc in (y_lo, y_hi):
            ax.add_patch(Rectangle((-bw / 2, yc - bh / 2), bw, bh, fc=matplotlib.colors.to_rgba(chalk.YELLOW, 0.30),
                                   ec=chalk.YELLOW, lw=1.6, zorder=2))
        # the pen touches opposite walls at the two bushings: +c/2 at the lower one, -c/2 at the upper one
        slope = -side * c_draw / L
        x_at = lambda y: side * c_draw / 2 + slope * (y - y_lo)  # noqa: E731
        pen, = ax.plot([x_at(0), x_at(pen_top)], [0, pen_top], color=chalk.RED, lw=4, solid_capstyle="butt", zorder=3)
        for yc in (y_lo, y_hi):  # the label sits beside the pen, not across it
            sgn = -np.sign(x_at(yc))
            ax.text(sgn * 0.7, yc + bh / 2 + 0.8, "bushing", ha="left" if sgn > 0 else "right", va="bottom",
                    fontsize=14, color=chalk.CHALK)
        ax.plot(x_at(0), 0, "o", color=chalk.RED, ms=10, zorder=4)
        # span on the left and overhang on the right in both panels, as in the old figure
        xs = -9.6
        ax.add_patch(FancyArrowPatch((xs, y_lo - 0.6), (xs, y_hi + 0.3), arrowstyle="<->", mutation_scale=14,
                                     color=chalk.CHALK, lw=1.6))
        ax.text(xs - 1.4, (y_lo + y_hi) / 2, "span L = 40 mm", rotation=90, ha="center", va="center",
                fontsize=14, color=chalk.CHALK)
        xo = 12.0
        ax.add_patch(FancyArrowPatch((xo, 0.6), (xo, y_lo - 0.5), arrowstyle="<->", mutation_scale=14,
                                     color=chalk.CHALK, lw=1.6))
        ax.text(xo + 1.8, y_lo / 2, "overhang d = 21.5 mm", rotation=90, ha="center", va="center",
                fontsize=14, color=chalk.CHALK)
        # the paper drag pushes the tip
        ax.add_patch(FancyArrowPatch((-side * 8.7, 0), (-side * 2.7, 0), arrowstyle="->", mutation_scale=16,
                                     color=chalk.BLUE, lw=1.8))
        ax.text(-side * 9.2, -2.2, "paper drag", ha="center", va="top", fontsize=14, color=chalk.BLUE)
        ax.set_title(title, loc="center", fontsize=16)
        ax.set_xlim(-17, 17)
        ax.set_ylim(-8, 73)
        ax.set_aspect("equal")
        ax.axis("off")
    fig.text(0.5, 0.995,
             "Tip motion when the drag reverses = c (1 + 2d/L) = 2.08 c\n"
             "(c = diametral clearance; drawn 250 times larger\n"
             "than a typical c = 0.012 mm)",
             ha="center", va="top", fontsize=15.5, color=chalk.YELLOW, linespacing=1.15)
    save_figure(fig, "lever.png")


# ---------------------------------------------------------------------------------------------- MuJoCo renders
# Colors of the old renders. The captions name them: blue for the printed part, yellow for the parts
# that stay (the Menagerie material of the arm), orange for the printed thumbscrews.
RGBA_SLEEVE = [0.15, 0.42, 0.80, 1]
RGBA_SCREW = [0.95, 0.56, 0.20, 1]
RGBA_PEN = [0.12, 0.12, 0.14, 1]
RGBA_PAD = [0.45, 0.61, 0.45, 1]
RGBA_TIP = [0.80, 0.80, 0.80, 1]
RGBA_YELLOW = [1, 0.82, 0.12, 1]  # the Menagerie material of the 3D printed arm parts
RGBA_MOTOR = [0.1, 0.1, 0.1, 1]  # the Menagerie material of the STS3215 motors
JAW_REST = 0.015  # results/checks.json "moving_jaw_stop_rad": the moving jaw closes onto the sleeve
PEN_D, PEN_LEN = 13.0, 145.0  # the 13 mm pen of cad/build.py PENS
PEN_END, PEN_BALL = 3.0, 1.5  # the flat pen end sits 3 mm above the tip; a 1.5 mm ball point


def _rgb(color) -> list:
    return list(matplotlib.colors.to_rgb(color))


def _simple_screw(b):
    """The thumbscrew as the old assembly renders show it: a plain M8 shaft and a plain head (axis +z)."""
    import manifold3d as m3d

    shaft = m3d.Manifold.cylinder(b.SCREW_L, b.M8_D / 2, circular_segments=48)
    head = m3d.Manifold.cylinder(b.HEAD_H, b.HEAD_D / 2, circular_segments=96).translate((0, 0, b.SCREW_L))
    return {"shaft": shaft, "head": head}


def design5_parts(source: Path, pen=True, pen_screws=True, side_screw=True, sleeve_dz=0.0):
    """Design-5 meshes in the `gripper` body frame (mm): {name: (trimesh, kind)}.

    kind is sleeve, head (screw head), shaft (screw shaft), pen or tip. sleeve_dz moves the sleeve and
    its side screw along z (negative: below its seat, while it slides on).
    """
    import trimesh

    b = load_build(source)
    g = b.gripper()
    zs, _, hwv = b.finger_profile(g["fixed_jaw"])
    hw = float(np.interp(-b.PINCH[1], -zs, hwv))
    M = b.pen_frame()
    r = PEN_D / 2
    shift = math.sqrt(2) * (b.R_REF - r)
    tip_y = shift - r
    lift = trimesh.transformations.translation_matrix([0, 0, sleeve_dz])
    out = {}
    sleeve = trimesh.load(Path(source) / "results/sleeve_in_gripper_frame.stl")
    sleeve.apply_transform(lift)
    out["sleeve"] = (sleeve, "sleeve")
    screw = _simple_screw(b)
    for piece, part in screw.items():
        if pen_screws:  # turned in until the tip touches the pen, as in build.pen_screw()
            for i, tc in enumerate(b.CLAMPS):
                placed = b.moved(part.rotate((90, 0, 0)).translate((0, tip_y, tc)), M)
                out[f"pen_screw_{i}_{piece}"] = (b.to_trimesh(placed), piece)
        if side_screw:  # pressed on the finger flank, as in build.main()
            m = b.to_trimesh(b.moved(part, b.pinch_frame(hw)))
            m.apply_transform(lift)
            out[f"side_screw_{piece}"] = (m, piece)
    if pen:
        U = b.U
        tip = M[:3, :3] @ np.array([0, shift, 0]) + b.TIP
        body = trimesh.creation.cylinder(radius=r, segment=[tip + U * PEN_END, tip + U * PEN_LEN], sections=64)
        out["pen"] = (body, "pen")
        ball = trimesh.creation.capsule(height=PEN_END - PEN_BALL, radius=PEN_BALL, count=[24, 24])
        ball.apply_transform(trimesh.geometry.align_vectors([0, 0, 1], U))
        ball.apply_translation(tip + U * (PEN_END + PEN_BALL) / 2)
        out["pen_tip"] = (ball, "tip")
    return out, b


PART_RGBA = {"sleeve": RGBA_SLEEVE, "head": RGBA_SCREW, "shaft": RGBA_SCREW, "pen": RGBA_PEN, "tip": RGBA_TIP}


def _add_mesh_geom(spec, body, name, tm, rgba, alpha=1.0):
    mesh = spec.add_mesh()
    mesh.name = name
    mesh.uservert = (np.asarray(tm.vertices, float) / 1000.0).ravel().tolist()
    mesh.userface = np.asarray(tm.faces, int).ravel().tolist()
    geom = body.add_geom()
    geom.name = name
    geom.type = mujoco_types().mjGEOM_MESH
    geom.meshname = name
    geom.rgba = list(rgba[:3]) + [alpha]
    geom.contype = 0
    geom.conaffinity = 0
    geom.group = 2
    return geom


def mujoco_types():
    import mujoco

    return mujoco.mjtGeom


def _scene_common(spec, width, height, headlight=0.6):
    """Board backdrop, the light of the old renders, and an offscreen buffer."""
    import mujoco

    spec.visual.global_.offwidth = max(width, 640)
    spec.visual.global_.offheight = max(height, 480)
    spec.visual.headlight.ambient = [0.4] * 3  # matched to the brightness of the old renders
    spec.visual.headlight.diffuse = [headlight] * 3
    spec.visual.headlight.specular = [0.5] * 3
    spec.visual.quality.shadowsize = 4096
    spec.visual.quality.offsamples = 8
    sky = spec.add_texture()
    sky.name = "board"
    sky.type = mujoco.mjtTexture.mjTEXTURE_SKYBOX
    sky.builtin = mujoco.mjtBuiltin.mjBUILTIN_GRADIENT
    sky.rgb1 = _rgb(chalk.BOARD)
    sky.rgb2 = _rgb(chalk.BOARD)
    sky.width, sky.height = 64, 384
    spec.visual.rgba.haze = _rgb(chalk.BOARD) + [1.0]


def render(model, data, cam, width, height):
    """RGB image and geom-id segmentation of one free-camera view. cam: lookat (3), distance, azimuth,
    elevation, fovy."""
    import mujoco

    model.vis.global_.fovy = cam[6]
    view = mujoco.MjvCamera()
    view.lookat[:] = cam[:3]
    view.distance, view.azimuth, view.elevation = cam[3], cam[4], cam[5]
    renderer = mujoco.Renderer(model, height, width)
    renderer.update_scene(data, view)
    rgb = renderer.render().copy()
    renderer.enable_segmentation_rendering()
    renderer.update_scene(data, view)
    seg = renderer.render()[..., 0].copy()
    renderer.close()
    return rgb, seg


def light_rim(rgb, dark, free, width_px, color=None):
    """Draw a light rim just outside the dark parts (`dark` mask) where they meet `free` pixels (the board).

    The pen stays black; only board pixels next to it turn light, so its outline reads on the dark board.
    """
    from scipy import ndimage

    color = np.array(_rgb(color or chalk.DIM)) * 255
    dist = ndimage.distance_transform_edt(~dark)
    alpha = np.clip(width_px + 0.5 - dist, 0, 1) * (dist > 0) * free
    out = rgb.astype(np.float32)
    out = out * (1 - alpha[..., None]) + color * alpha[..., None]
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


# The drawing pose of design5-on-arm. The camera (lookat x, y, z in m, distance in m, azimuth,
# elevation and fovy in degrees), the pad and the floor centre are fitted to the old render with
# fit_arm_scene(); `--refit` runs the fit again and prints them.
ARM_CAM = [0.23359, 0.00084, 0.04136, 0.30701, 119.88979, -8.02148, 45.0]
ARM_TIP = [0.240, 0.0, 0.001]  # 240 mm in front of the base, 2 mm into a 3 mm pad
ARM_FLOOR = [0.7063, -0.1949, -0.1056]  # half size, centre x, centre y (m): the centre places the far floor edge
ARM_PAD = [0.2394, 0.0028, 0.0798, 0.0629, 0.0015]  # centre x, y, half sizes x, y, z (m)
ARM_SIZE = (1400, 1000)


def _solve_pose(model, data, U, target, jaw):
    """Joint angles that put the pen tip on `target` with the pen vertical (pen axis U in the gripper frame)."""
    import mujoco
    from scipy.optimize import least_squares

    names = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll"]
    adr = [model.jnt_qposadr[model.joint(n).id] for n in names]
    lo = np.array([model.jnt_range[model.joint(n).id][0] for n in names])
    hi = np.array([model.jnt_range[model.joint(n).id][1] for n in names])
    site, body = model.site("pen_tip").id, model.body("gripper").id
    data.qpos[model.jnt_qposadr[model.joint("gripper").id]] = jaw

    def residual(q):
        data.qpos[adr] = q
        mujoco.mj_kinematics(model, data)
        axis = data.xmat[body].reshape(3, 3) @ U
        return np.r_[(data.site_xpos[site] - target) * 1000.0, (axis - [0, 0, 1]) * 100.0]

    best = min((least_squares(residual, q0, bounds=(lo, hi)) for q0 in
                ([0, -0.5, 0.5, 1.0, 0], [0, 0.5, 0.5, 1.0, 1.5], [0, -1, 1.2, 1.0, 1.6])), key=lambda r: r.cost)
    if best.cost > 1e-8:
        raise RuntimeError(f"no pose reaches the tip target, cost {best.cost}")
    residual(best.x)
    mujoco.mj_forward(model, data)  # also places the lights (mj_camlight), which mj_kinematics does not
    return best.x


def arm_model(source: Path, menagerie: Path, size=ARM_SIZE):
    """The Menagerie SO-101 with design 5 on its gripper, posed to draw, on a mid-tone floor and the pad."""
    import mujoco

    spec = mujoco.MjSpec.from_file(str(Path(menagerie) / "so101.xml"))
    _scene_common(spec, *size)
    parts, b = design5_parts(source)
    gripper = spec.body("gripper")
    for name, (tm, kind) in parts.items():
        _add_mesh_geom(spec, gripper, "ph_" + name, tm, PART_RGBA[kind])
    shift = math.sqrt(2) * (b.R_REF - PEN_D / 2)
    tip = b.pen_frame()[:3, :3] @ np.array([0, shift, 0]) + b.TIP
    site = gripper.add_site()
    site.name = "pen_tip"
    site.pos = tip / 1000.0
    site.rgba = [0, 0, 0, 0]
    # A mid-tone checker floor, so the black pen and the shadows read on the board.
    tex = spec.add_texture()
    tex.name = "floor"
    tex.type = mujoco.mjtTexture.mjTEXTURE_2D
    tex.builtin = mujoco.mjtBuiltin.mjBUILTIN_CHECKER
    tex.rgb1 = _rgb(chalk.FAINT)
    tex.rgb2 = list(np.array(_rgb(chalk.FAINT)) * 0.86)
    tex.width = tex.height = 256
    mat = spec.add_material()
    mat.name = "floor"
    mat.textures = ["", "floor"] + [""] * 8  # role 1: rgb
    mat.texuniform = True
    mat.texrepeat = [FLOOR_REPEAT, FLOOR_REPEAT]
    world = spec.worldbody
    floor = world.add_geom()
    floor.name = "floor"
    floor.type = mujoco.mjtGeom.mjGEOM_PLANE
    floor.size = [ARM_FLOOR[0], ARM_FLOOR[0], 0.01]
    floor.pos = [ARM_FLOOR[1], ARM_FLOOR[2], 0]
    floor.material = "floor"
    pad = world.add_geom()
    pad.name = "pad"
    pad.type = mujoco.mjtGeom.mjGEOM_BOX
    pad.size = ARM_PAD[2:5]
    pad.pos = [ARM_PAD[0], ARM_PAD[1], ARM_PAD[4]]
    pad.rgba = RGBA_PAD
    pad.contype = pad.conaffinity = 0
    light = world.add_light()
    light.pos = [0, 0, 3.5]
    light.dir = [0, 0, -1]
    light.type = mujoco.mjtLightType.mjLIGHT_DIRECTIONAL
    light.castshadow = True
    light.diffuse = [0.5] * 3
    model = spec.compile()
    data = mujoco.MjData(model)
    _solve_pose(model, data, b.U / np.linalg.norm(b.U), np.array(ARM_TIP), JAW_REST)
    return model, data


FLOOR_REPEAT = 50.0  # checker squares of 1 cm, as in the old render


def _arm_render(source: Path, menagerie: Path, width: int, height: int) -> np.ndarray:
    model, data = arm_model(source, menagerie, (width, height))
    rgb, seg = render(model, data, ARM_CAM, width, height)
    pen = np.isin(seg, [model.geom("ph_pen").id])
    return light_rim(rgb, pen, seg < 0, width_px=4)  # about 1 px on a 358 px wide phone column


def fig_design5_on_arm(source: Path, menagerie: Path) -> None:
    """Design 5 on the full arm in the drawing pose, on the board."""
    save_render(_arm_render(source, menagerie, *ARM_SIZE), "design5-on-arm.png")


def _old_classes(old):
    """Part masks of the old design5-on-arm render, by color: sky, pad, yellow, orange, blue, dark."""
    from scipy import ndimage

    o = old.astype(int)
    r, g, b = o[..., 0], o[..., 1], o[..., 2]
    light = (o.min(-1) > 215) & (np.ptp(o, axis=-1) < 20)
    lab, _ = ndimage.label(light)
    return {
        "sky": np.isin(lab, np.unique(lab[0][lab[0] > 0])),  # the light backdrop, connected to the top edge
        "pad": (g > r + 25) & (g > b + 20),
        "yellow": (r - b > 80) & (g > 0.6 * r),
        "orange": (r - b > 80) & (g <= 0.6 * r) & (g > 0.2 * r),
        "blue": (b > r + 50) & (b > g),
        "dark": (o.max(-1) < 50) & (np.ptp(o, axis=-1) < 20),
    }


def fit_arm_scene(source: Path, menagerie: Path) -> None:
    """Fit ARM_CAM, ARM_PAD and the floor centre to the old design5-on-arm render, and print them.

    Silhouette matching: each part class of the old render (found by color, _old_classes) is compared
    with the same class in a segmentation render of the scene, and Nelder-Mead minimizes the number of
    pixels that differ, summed over the classes. The parameters are the camera (lookat, distance,
    azimuth, elevation), the pad (centre x, y and half sizes x, y) and the floor centre (x, y). The
    fovy stays at 45°, the MuJoCo default of a free camera. With a free fovy, an earlier fit of the arm
    alone stopped at 30° and 0.47 m: the arm matched, but the pad and the far floor edge did not. The
    floor size stays fixed (MuJoCo makes the plane when it compiles the model), so the floor centre
    places the far floor edge. The fit starts at the constants above and runs at the full size.
    """
    import mujoco
    from scipy.optimize import minimize

    old = _old_classes(np.asarray(old_image("design5-on-arm.png")))
    names = list(old)
    width, height = ARM_SIZE
    model, data = arm_model(source, menagerie, ARM_SIZE)
    pad, floor = model.geom("pad").id, model.geom("floor").id
    cls = np.full(model.ngeom + 1, -1)  # geom id -> class index; the last entry is the backdrop
    for i in range(model.ngeom):
        mat = model.geom_matid[i]
        rgba = model.mat_rgba[mat] if mat >= 0 else model.geom_rgba[i]
        name, shown = model.geom(i).name, model.geom_group[i] == 2
        kind = ("pad" if i == pad else "blue" if name == "ph_sleeve" else "orange" if "screw" in name
                else "dark" if name == "ph_pen" or (shown and rgba[0] < 0.2)
                else "yellow" if shown and rgba[0] > 0.9 and rgba[2] < 0.2 else None)
        cls[i] = names.index(kind) if kind else -1
    cls[-1] = names.index("sky")
    view = mujoco.MjvCamera()
    renderer = mujoco.Renderer(model, height, width)
    renderer.enable_segmentation_rendering()
    model.vis.global_.fovy = 45.0

    def loss(p):
        view.lookat[:] = p[:3]
        view.distance, view.azimuth, view.elevation = p[3:6]
        model.geom_pos[pad][:2] = p[6:8]
        model.geom_size[pad][:2] = p[8:10]
        model.geom_pos[floor][:2] = p[10:12]
        mujoco.mj_kinematics(model, data)
        renderer.update_scene(data, view)
        seg = renderer.render()[..., 0]
        c = cls[np.where(seg < 0, model.ngeom, seg)]
        return float(sum(((c == k) != old[n]).sum() for k, n in enumerate(names)))

    x = np.r_[ARM_CAM[:6], ARM_PAD[:4], ARM_FLOOR[1:]]
    steps = np.array([0.002, 0.002, 0.002, 0.005, 0.3, 0.3, 0.003, 0.003, 0.003, 0.003, 0.01, 0.01])
    print("start: pixels that differ", loss(x))
    for k in range(3):
        simplex = np.vstack([x] + [x + np.eye(len(x))[i] * steps[i] / (k + 2) for i in range(len(x))])
        x = minimize(loss, x, method="Nelder-Mead",
                     options=dict(initial_simplex=simplex, maxfev=3000, xatol=1e-7, fatol=0.5)).x
    print("fit: pixels that differ", loss(x))
    renderer.close()
    print("ARM_CAM =", [round(float(v), 5) for v in x[:6]] + [45.0])
    print("ARM_PAD =", [round(float(v), 4) for v in x[6:10]] + [ARM_PAD[4]])
    print("ARM_FLOOR =", [ARM_FLOOR[0]] + [round(float(v), 4) for v in x[10:12]])


def fig_thumbnail(source: Path, menagerie: Path) -> None:
    """The card: the design5-on-arm render, widened to the card shape, then chalk.thumbnail(crop=True).

    The old card showed the whole render (full height, pads at the sides). The same camera with a wider
    viewport keeps that vertical framing; its middle 1400 columns are the pixels of design5-on-arm.png.
    """
    import tempfile

    height = ARM_SIZE[1]
    width = round(height * 720 / 424)
    with tempfile.TemporaryDirectory() as tmp:
        wide = Path(tmp) / "design5-on-arm-wide.png"
        Image.fromarray(_arm_render(source, menagerie, width, height)).save(wide)
        chalk.thumbnail(wide, THUMB, crop=True)


STOCK = ("fixed_jaw", "jaw_servo", "moving_jaw")  # the three meshes of cad/meshes; the old tiles show no camera mount


def gripper_model(source: Path, menagerie: Path, size, alpha=None, stock=STOCK, jaw=JAW_REST, **part_options):
    """The stock gripper (fixed jaw, jaw motor, moving jaw at rest, camera mount) with design-5 parts.

    The world frame is the `gripper` body frame, so z is the wrist_roll axis and the fingers point down.
    alpha: {part kind: opacity}, for example {"sleeve": 0.45} for a see-through sleeve.
    """
    import mujoco
    import trimesh

    spec = mujoco.MjSpec()
    _scene_common(spec, *size, headlight=0.5)  # the gripper tiles were a little darker than the arm render
    parts, b = design5_parts(source, **part_options)
    world = spec.worldbody
    meshes = b.gripper(jaw)
    for name in ("fixed_jaw", "jaw_servo", "moving_jaw"):
        if name in stock:
            _add_mesh_geom(spec, world, name, meshes[name], RGBA_MOTOR if name == "jaw_servo" else RGBA_YELLOW)
    if "camera_mount" in stock:
        cam_mount = trimesh.load(Path(menagerie) / "assets/wrist_roll_follower_so101_camera_mount.stl")
        cam_mount.apply_scale(1000)
        cam_mount.apply_transform(b.quat_T([0, -0.000218, 0.00095], [0, 1, 0, 0]))
        _add_mesh_geom(spec, world, "camera_mount", cam_mount, RGBA_YELLOW)
    alpha = alpha or {}
    for name, (tm, kind) in parts.items():
        _add_mesh_geom(spec, world, "ph_" + name, tm, PART_RGBA[kind], alpha.get(kind, 1.0))
    light = world.add_light()
    light.pos = [0, 0, 3.5]
    light.dir = [0, 0, -1]
    light.type = mujoco.mjtLightType.mjLIGHT_DIRECTIONAL
    light.castshadow = False
    light.diffuse = [0.5] * 3
    model = spec.compile()
    data = mujoco.MjData(model)
    mujoco.mj_forward(model, data)
    return model, data


# Fitted free cameras of the gripper tiles (lookat x, y, z in m in the gripper frame, distance in m,
# azimuth, elevation, fovy in degrees), and the size of each old tile in pixels.
HIH_LEFT = dict(cam=[-0.01345, -0.00015, -0.05254, 0.25301, -0.99753, 4.34603, 33.4538], size=(607, 530))
HIH_RIGHT = dict(cam=[-0.00186, -0.01457, -0.05749, 0.30259, 134.4519, -10.69391, 29.29642], size=(607, 530))
FIT_STEPS = dict(cam=[0.01613, -0.01623, -0.08085, 0.28829, 329.05455, -9.92444, 45.81802], size=(357, 459),
                 sleeve_dz=(-45.0, -20.0, 0.0))  # the sleeve below the finger, sliding on, on its seat
SLEEVE_A = dict(cam=[-0.01259, -0.00406, -0.08563, 0.23919, 118.38175, -24.76029, 29.41211], size=(426, 425))
SLEEVE_B = dict(cam=[-0.00867, -0.01208, -0.08105, 0.30653, 299.15572, 22.43644, 22.37195], size=(426, 425))
SCREW_TILE = dict(cam=[0.00138, -0.00072, 0.01163, 0.06909, 330.93282, 25.22702, 29.92197], size=(426, 425))
TILE_SCALE = 2  # render each tile at twice the old tile size


def part_model(meshes, size):
    """A scene with single parts: [(name, trimesh in mm, rgba)], with the light of the gripper tiles."""
    import mujoco

    spec = mujoco.MjSpec()
    _scene_common(spec, *size, headlight=0.5)
    for name, tm, rgba in meshes:
        _add_mesh_geom(spec, spec.worldbody, name, tm, rgba)
    light = spec.worldbody.add_light()
    light.pos = [0, 0, 3.5]
    light.dir = [0, 0, -1]
    light.type = mujoco.mjtLightType.mjLIGHT_DIRECTIONAL
    light.diffuse = [0.5] * 3
    model = spec.compile()
    data = mujoco.MjData(model)
    mujoco.mj_forward(model, data)
    return model, data


def render_tile(model, data, tile, rim_px):
    """Render one tile at TILE_SCALE times the old tile size, with a light rim on the dark parts."""
    width, height = (TILE_SCALE * v for v in tile["size"])
    rgb, seg = render(model, data, tile["cam"], width, height)
    dark = [model.geom(i).id for i in range(model.ngeom) if model.geom(i).name in ("ph_pen", "jaw_servo")]
    if dark:
        rgb = light_rim(rgb, np.isin(seg, dark), seg < 0, width_px=rim_px)
    return rgb


def _tile_axes(fig, rect, rgb, crop=None):
    """Show a render (cropped to `crop` = x0, y0, x1, y1 in old tile pixels) in figure rectangle `rect`.
    The axes data coordinates are old tile pixels, so old anchor points can be used as they are."""
    x0, y0, x1, y1 = crop or (0, 0, rgb.shape[1] / TILE_SCALE, rgb.shape[0] / TILE_SCALE)
    sub = rgb[int(y0 * TILE_SCALE):int(y1 * TILE_SCALE), int(x0 * TILE_SCALE):int(x1 * TILE_SCALE)]
    ax = fig.add_axes(rect)
    ax.imshow(sub, extent=(x0, x1, y1, y0), interpolation="lanczos")
    ax.set_xlim(x0, x1)
    ax.set_ylim(y1, y0)
    ax.axis("off")
    return ax


def _callouts(fig, ax, items, x, ha, gap_in=0.08):
    """Callout boxes in one column at figure x, each with a red chalk arrow to its anchor (tile pixels of ax).

    Each box sits at the height of its anchor when it can; boxes that would overlap are pushed down.
    Returns the lowest box bottom in figure fraction.
    The text position uses fig.transFigure, not "figure fraction": with the crop of chalk.save()
    (bbox_inches), matplotlib 3.11 measures "figure fraction" in the cropped figure, so the boxes
    moved right by the left crop width and the right column fell off the edge.
    """
    anns = []
    for text, anchor in items:
        ann = ax.annotate(text, xy=anchor, xycoords="data", xytext=(x, 0.5), textcoords=fig.transFigure,
                          ha=ha, va="center", fontsize=13, color=chalk.CHALK, linespacing=0.95,
                          bbox=dict(boxstyle="round,pad=0.3", fc=chalk.BOARD, ec=chalk.DIM, lw=1.1),
                          arrowprops=dict(arrowstyle="-|>", color=chalk.RED, lw=2.0, mutation_scale=14,
                                          shrinkA=0, shrinkB=0), annotation_clip=False)
        anns.append(ann)
    fig.canvas.draw()
    inv = fig.transFigure.inverted()
    heights = [float(np.ptp(inv.transform(a.get_bbox_patch().get_window_extent())[:, 1])) for a in anns]
    wanted = [inv.transform(ax.transData.transform(anchor))[1] for _, anchor in items]
    gap = gap_in / fig.get_figheight()
    order = np.argsort(wanted)[::-1]  # top first
    prev_bottom = None
    bottom = 1.0
    for i in order:
        y = wanted[i]
        if prev_bottom is not None:
            y = min(y, prev_bottom - gap - heights[i] / 2)
        anns[i].set_position((x, y))
        prev_bottom = y - heights[i] / 2
        bottom = min(bottom, prev_bottom)
    return bottom


def _center_title(fig, title) -> None:
    """Put a figure title at the horizontal centre of the other drawn content.

    chalk.save() crops the figure to its content, so a title at the centre of the full figure
    sits to one side of the crop when the content is not centred.
    """
    title.set_visible(False)
    fig.canvas.draw()
    box = fig.get_tightbbox(fig.canvas.get_renderer())  # inches
    title.set_visible(True)
    title.set_x((box.x0 + box.x1) / 2 / fig.get_figwidth())


def fig_how_it_holds(source: Path, menagerie: Path) -> None:
    """What holds the sleeve (from behind the finger) and what holds the pen (three-quarter view).

    The old figure put the two views side by side with callouts on both sides; on a phone its text
    was about 2 px tall. Here each view is a figure of its own (how-it-holds-sleeve.png and
    how-it-holds-pen.png), each render is cropped to its parts, and the callouts sit beside it with the
    same words. The arrows point at the same render pixels as before.
    """
    size = tuple(TILE_SCALE * v for v in HIH_LEFT["size"])
    model, data = gripper_model(source, menagerie, size, alpha={"sleeve": 0.45})
    left = render_tile(model, data, HIH_LEFT, rim_px=5)
    right = render_tile(model, data, HIH_RIGHT, rim_px=5)
    FW, FH = 6.4, 6.0  # the tight crop of chalk.save() trims the unused board below

    def rect(x, y, w, h):  # inches from the top left -> figure fraction
        return [x / FW, 1 - (y + h) / FH, w / FW, h / FH]

    def at(x, y):
        return (x / FW, 1 - y / FH)

    # view 1: behind the finger
    fig = plt.figure(figsize=(FW, FH))
    title = fig.text(*at(FW / 2, 0.08), "Behind the finger: what holds the sleeve", ha="center", va="top", fontsize=17,
             color=chalk.YELLOW)
    crop = (165, 25, 530, 500)
    w = 2.15
    h = w * (crop[3] - crop[1]) / (crop[2] - crop[0])
    x0, y0 = 2.62, 0.55
    axl = _tile_axes(fig, rect(x0, y0, w, h), left, crop)
    _callouts(fig, axl, [
        ("The stock fixed finger,\nunchanged", (309, 297)),
        ("Side thumbscrew: it presses\nthe finger. Friction holds\nthe sleeve DOWN.", (201, 338)),
        ("The finger gets narrower\ntoward its end. The sleeve\nstops on it like a wedge,\n"
         "so it cannot go UP. The paper\npushes the pen up, onto\nthis seat.", (315, 433)),
    ], (x0 - 0.17) / FW, "right")
    _callouts(fig, axl, [("The pen leans\n20°, so it is\nvertical when\nthe arm draws", (440, 181))],
              (x0 + w + 0.12) / FW, "left")
    _center_title(fig, title)
    save_figure(fig, "how-it-holds-sleeve.png")
    # view 2: three-quarter view
    fig = plt.figure(figsize=(FW, FH))
    y1 = 0.08
    title = fig.text(*at(FW / 2, y1), "Three-quarter view: what holds the pen", ha="center", va="top", fontsize=17,
             color=chalk.YELLOW)
    crop = (155, 0, 480, 480)
    w2 = 2.2
    h2 = w2 * (crop[3] - crop[1]) / (crop[2] - crop[0])
    y2 = y1 + 0.45
    axr = _tile_axes(fig, rect(0.15, y2, w2, h2), right, crop)
    _callouts(fig, axr, [
        ("Upper V clamp", (227, 299)),
        ("Lower V clamp, 43 mm lower.\nEach clamp: a 90° V and a\nprinted M8 thumbscrew", (268, 425)),
        ("The tip position is known\nfor every pen from 8 to 13 mm", (332, 455)),
    ], (0.15 + w2 + 0.45) / FW, "left")
    _center_title(fig, title)
    save_figure(fig, "how-it-holds-pen.png")


def fig_design5_fit(source: Path, menagerie: Path) -> None:
    """Fitting steps (three renders) and the printed parts (two views of the sleeve and the thumbscrew)."""
    b = load_build(source)
    steps = []
    for k, dz in enumerate(FIT_STEPS["sleeve_dz"]):
        size = tuple(TILE_SCALE * v for v in FIT_STEPS["size"])
        last = k == len(FIT_STEPS["sleeve_dz"]) - 1
        model, data = gripper_model(source, menagerie, size, pen=last, pen_screws=last, sleeve_dz=dz)
        steps.append(render_tile(model, data, FIT_STEPS, rim_px=3))
    import trimesh

    sleeve = trimesh.load(Path(source) / "results/sleeve_in_gripper_frame.stl")
    screw = b.to_trimesh(b.thumbscrew())  # the real printed thumbscrew, as in the old tile
    size = tuple(TILE_SCALE * v for v in SLEEVE_A["size"])
    model, data = part_model([("ph_sleeve", sleeve, RGBA_SLEEVE)], size)
    prints = [render_tile(model, data, SLEEVE_A, 0), render_tile(model, data, SLEEVE_B, 0)]
    model, data = part_model([("ph_screw", screw, RGBA_SCREW)], size)
    prints.append(render_tile(model, data, SCREW_TILE, 0))

    H = 7.55
    fig = plt.figure(figsize=(6.4, H))
    fig.text(0.5, 1 - 0.1 / H, "SO-101 pen holder, design 5:\na sleeve on the stock fixed finger", ha="center",
             va="top", fontsize=17.5, color=chalk.YELLOW, linespacing=1.15)
    fig.text(0.5, 1 - 0.95 / H, "Fit it: slide the sleeve up onto the finger until it stops,\n"
             "turn the side thumbscrew onto the finger, put the pen in both rings", ha="center", va="top",
             fontsize=14, color=chalk.CHALK, linespacing=1.15)
    crop = (0, 30, 357, 390)
    w = 6.4 / 3
    h = w * (crop[3] - crop[1]) / (crop[2] - crop[0])
    axes = []
    for k, rgb in enumerate(steps):
        axes.append(_tile_axes(fig, [k / 3, 1 - (1.55 + h) / H, 1 / 3, h / H], rgb, crop))
    y = 1.55 + h + 0.2
    fig.text(0.5, 1 - y / H, "Print: 1 sleeve (27.2 g) and 3 identical M8 thumbscrews\n(2.1 g each). Nothing to buy.",
             ha="center", va="top", fontsize=14, color=chalk.CHALK, linespacing=1.15)
    crop = (40, 50, 386, 396)
    h = w * 0.93
    for k, rgb in enumerate(prints):
        axes.append(_tile_axes(fig, [k / 3, 1 - (y + 0.6 + h) / H, 1 / 3, h / H], rgb, (40, 62, 386, 384)))
    save_figure(fig, "design5-fit.png")


# ---------------------------------------------------------------------------------------------- kept render pixels
# design1-on-arm, design-history, three-options and all-layouts have no geometry to render again
# (designs 1 to 4, option 2 and the concept layouts exist only as old render pixels). These
# functions keep the render pixels, put the board behind them, and draw every word again in chalk.


def _kp_rgb255(color):
    return np.array(matplotlib.colors.to_rgb(color), np.float32) * 255.0


def _kp_matte(tile, mode="edge", tol=8.0, grow=2, rim_px=0.0, rim_dark=45, hole_px=12, rim_stop=None,
              rim_open=2, rim_parts="dark"):
    """Put a light render backdrop on the board and keep every part pixel.

    tile: uint8 [H, W, 3] render on a light vertical-gradient backdrop.
    mode: "edge" removes the backdrop connected to any tile edge (renders without a floor);
          "sky" removes only the backdrop connected to the top edge (renders with a floor).
    The backdrop color is estimated per row. Pixels within `tol` of it and connected to the
    chosen edge are the backdrop. In a band of `grow` px on the part side, an alpha is solved
    against the nearest inner part color, and only the backdrop share of each edge pixel is
    swapped for the board, so no light halo stays and the part pixels inside are unchanged.
    rim_px > 0 draws a light rim (chalk.DIM) of that width outside the silhouette where a dark
    part (a neutral region darker than rim_dark and at least 5 px thick: the black pen, the black
    motors; not the 1 px dark edge of the floor) meets the board. rim_stop: no rim from this row down
    (the floor horizon, where a cast shadow meets the sky).
    rim_open: the iterations of the binary opening that removes thin dark lines before the rim. With 2,
    a dark part must be 5 px thick; with 1, 3 px (the pen tip of a small tile).
    rim_parts: "dark" puts the rim on every dark part; "pen" only on the pen, the long, thin, upright
    dark part (at least 30 px tall and at least 5 times as tall as its median row width), so the
    black motors and the shadows at the arm edges get no rim.
    """
    from scipy import ndimage

    img = tile.astype(np.float32)
    height, width, _ = img.shape
    light = (img.min(-1) > 200) & (img.max(-1) - img.min(-1) < 25)
    bg = np.zeros((height, 3), np.float32)
    have = np.zeros(height, bool)
    for y in range(height):
        if light[y].sum() > 5:
            bg[y] = np.median(img[y, light[y]], axis=0)
            have[y] = True
    rows = np.arange(height)
    for c in range(3):
        bg[:, c] = np.interp(rows, rows[have], bg[have, c])
    bgimg = np.broadcast_to(bg[:, None, :], img.shape)
    near = np.abs(img - bgimg).max(-1) < tol
    lab, _ = ndimage.label(near)
    seeds = lab[0] if mode == "sky" else np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]
    back = np.isin(lab, np.unique(seeds[seeds > 0]))
    # backdrop seen through a gap between parts (for example under the arm arch) is not connected
    # to the edge: take every near-backdrop region of at least `hole_px` pixels as backdrop too
    sizes = np.bincount(lab.ravel())
    holes = np.nonzero(sizes >= hole_px)[0]
    back |= np.isin(lab, holes[holes > 0])
    band = ndimage.binary_dilation(back, iterations=grow) & ~back
    inner = ~back & ~band
    _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
    part = img[iy, ix]
    d = part - bgimg
    a = np.clip(((img - bgimg) * d).sum(-1) / np.maximum((d * d).sum(-1), 1.0), 0.0, 1.0)
    alpha = np.where(back, 0.0, np.where(band, a, 1.0)).astype(np.float32)
    under = np.broadcast_to(_kp_rgb255(chalk.BOARD), img.shape).copy()
    if rim_px > 0:
        dark = ~back & (img.max(-1) < rim_dark) & (np.ptp(img, axis=-1) < 15)
        dark = ndimage.binary_closing(dark, iterations=2)  # join the two sides of a pen around its highlight
        dark = ndimage.binary_opening(dark, iterations=rim_open)
        if rim_parts == "pen":
            lab, n = ndimage.label(dark)
            keep = np.zeros(n + 1, bool)
            for i, sl in enumerate(ndimage.find_objects(lab)):
                rows = (lab[sl] == i + 1).sum(1)
                tall = sl[0].stop - sl[0].start
                keep[i + 1] = tall >= 30 and tall >= 5 * np.median(rows[rows > 0])
            dark = keep[lab]
        dark = ndimage.binary_dilation(dark, iterations=grow + 1) & ~back
        edge = dark & ndimage.binary_dilation(back, iterations=1)
        if rim_stop is not None:
            edge[rim_stop:] = False
        dist = ndimage.distance_transform_edt(~edge) if edge.any() else np.full(edge.shape, np.inf)
        strength = np.clip(rim_px + 0.5 - dist, 0.0, 1.0)[..., None]
        under = under * (1 - strength) + _kp_rgb255(chalk.DIM) * strength
    out = img + (1.0 - alpha)[..., None] * (under - bgimg)
    out[back] = under[back]  # no residual of the backdrop gradient on the board
    return np.clip(np.rint(out), 0, 255).astype(np.uint8), alpha


def _kp_tile_boxes(rgb, min_area=20000):
    """Bounding boxes (x0, y0, x1, y1) of the render tiles: opaque regions that are not page white."""
    from scipy import ndimage

    lab, n = ndimage.label(rgb.min(-1) < 250)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if (lab[sl] == i + 1).sum() > min_area:
            boxes.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    return boxes


def _kp_show(ax, img, frame=None):
    ax.imshow(img, interpolation="lanczos")
    ax.set_axis_off()
    if frame:
        ax.patch.set_visible(False)
        h, w = img.shape[:2]
        ax.add_patch(matplotlib.patches.Rectangle((-0.5, -0.5), w, h, fill=False, ec=frame, lw=2.4,
                                                  clip_on=False))


def fig_design1_on_arm() -> None:
    """Design 1 on the full arm: the sky becomes the board, the floor, riser and parts stay."""
    old = np.asarray(old_image("design1-on-arm.png"))
    rim = 3.0 * old.shape[1] / 1200.0  # about 1 px at 358 px display width
    horizon = int(np.nonzero(old[:, 5].min(-1) < 200)[0][0])  # far edge of the floor at the left side
    new, _ = _kp_matte(old, mode="sky", rim_px=rim, rim_stop=horizon - 20)
    save_render(new, "design1-on-arm.png")


def fig_design_history() -> None:
    """The five designs with the same camera: five tiles in a row, the titles and notes in a list below."""
    old = np.asarray(old_image("design-history.png"))
    x_tiles = (11, 388, 764, 1141, 1518)  # tile origins in the old figure; tiles are 369 x 286 px from y = 222
    crop = (100, 0, 260, 256)  # one window for every tile (same camera): the union of the parts plus a margin
    titles = ("Pen on the roll axis", "Pen beside the fingers", "Two V clamps, one part", "A new fixed jaw",
              "A sleeve on the stock finger")
    notes = ("a slide and 4 sleeves\nthe arm cannot reach the table",
             "the same slide, about 20 parts\nto print, buy and glue",
             "any pen from 8 to 13 mm\nbut you must drill the finger",
             "no bolts, no slip\nbut a large print and disassembly",
             "4 small printed parts\nnothing to buy, no disassembly")
    tiles = []
    for x0 in x_tiles:
        t = old[222 + crop[1]:222 + crop[3], x0 + crop[0]:x0 + crop[2]]
        tiles.append(_kp_matte(t, mode="edge", rim_px=2.4, rim_open=1)[0])  # 1: the pen tip of tile 1 is 4 px tall
    fig_h = 5.85
    fig = plt.figure(figsize=(6.4, fig_h))
    fig.text(0.5, 0.995, "Five designs, from the first idea to the sleeve. Same camera,\n"
                         "same gripper (yellow). The printed holder parts are in color.",
             ha="center", va="top", fontsize=15, color=chalk.CHALK, linespacing=1.05)
    w, gap = 0.184, 0.0125
    h = w * 6.4 / fig_h * (crop[3] - crop[1]) / (crop[2] - crop[0])
    top = 1 - 1.08 / fig_h
    axes = []
    for i, t in enumerate(tiles):
        chosen = i == 4
        ax = fig.add_axes([0.004 + i * (w + gap), top - h, w, h])
        _kp_show(ax, t, frame=chalk.GREEN if chosen else None)
        axes.append(ax)
        fig.text(0.004 + i * (w + gap) + w / 2, top + 0.008, str(i + 1), ha="center", va="bottom", fontsize=19,
                 color=chalk.GREEN if chosen else chalk.YELLOW)
    y0 = top - h - 0.16 / fig_h
    step = 0.80 / fig_h
    for i, (title, note) in enumerate(zip(titles, notes)):
        chosen = i == 4
        x = 0.01 if i < 3 else 0.52
        y = y0 - (i if i < 3 else i - 3) * step
        fig.text(x, y, f"{i + 1}  {title}", ha="left", va="top", fontsize=16,
                 color=chalk.GREEN if chosen else chalk.YELLOW)
        fig.text(x + 0.045, y - 0.27 / fig_h, note, ha="left", va="top", fontsize=14, color=chalk.CHALK,
                 linespacing=1.0)
    save_figure(fig, "design-history.png")


def fig_three_options() -> None:
    """The three final options: 3 columns (options) by 3 rows (3/4 view, side view, printed part).

    For the phone the figure is cut in two. three-options.png holds the header, the column titles and
    the two render rows; three-options-parts.png holds the column titles again, the printed parts and
    the notes under them. Sizes and gaps are those of the one old figure.
    """
    old = np.asarray(old_image("three-options.png"))
    col_x = ((39, 57), (496, 515), (954, 973))  # tile origins: render rows, printed-part row
    rows = (  # (tile origin y, crop window in tile px: x0, y0, x1, y1), one window per row (same camera)
        (207, (128, 92, 308, 312)),
        (678, (110, 86, 292, 316)),
        (1149, (40, 48, 296, 308)),
    )
    titles = ("1  Sleeve on the stock\nfinger (design 5)", "2  New moving jaw", "3  New fixed jaw\n(design 4)")
    notes = ("The printed part\n27.2 g + 3 screws  |\nspan 43 mm\nno disassembly  |\nheld by a side screw\n(friction)",
             "The printed part\n40.1 g + 2 screws  |\nspan 80 mm\npen lift with the gripper  |\ntip 99 mm from its axis",
             "The printed part\n69.6 g + 2 screws  |\nspan 80 mm\nno slip, no backlash  |\nlargest print")
    fig_w = 6.4
    left, w, gap = 0.05, 0.30, 0.0175  # three columns end at 0.985 of the width
    title_gap, row_gap = 0.0636, 0.08  # inches: column titles to tiles, and between the tile rows

    def column_titles(fig, fig_h, top):  # top: inches from the figure top to the tile row
        for j, title in enumerate(titles):
            fig.text(left + j * (w + gap) + w / 2, 1 - (top - title_gap) / fig_h, title, ha="center",
                     va="bottom", fontsize=15, color=chalk.YELLOW, linespacing=1.0)

    def tile_row(fig, fig_h, r, top):  # returns the height of the row in inches
        y0, (cx0, cy0, cx1, cy1) = rows[r]
        h = w * fig_w * (cy1 - cy0) / (cx1 - cx0)
        for j in range(3):
            x0 = col_x[j][1 if r == 2 else 0]
            tile = old[y0 + cy0:y0 + cy1, x0 + cx0:x0 + cx1]
            ax = fig.add_axes([left + j * (w + gap), 1 - (top + h) / fig_h, w, h / fig_h])
            _kp_show(ax, _kp_matte(tile, mode="edge", rim_px=2.0)[0])
        if r < 2:
            fig.text(0.025, 1 - (top + h / 2) / fig_h, ("3/4 view", "Side view")[r], rotation=90, ha="center",
                     va="center", fontsize=14, color=chalk.DIM)
        return h

    # the header and the two render rows
    fig_h = 7.0
    fig = plt.figure(figsize=(fig_w, fig_h))
    fig.text(0.5, 1 - 0.0318 / fig_h,
             "SO-101 pen holder: three options. Blue = the part you print;\n"
             "yellow = the parts that stay; orange = printed M8 thumbscrews.\n"
             "Option 1 is design 5 and option 3 is design 4 (all checks pass).\n"
             "Option 2 is a concept (only collision and mass checked).",
             ha="center", va="top", fontsize=15, color=chalk.CHALK, linespacing=1.05)
    top = 1.86
    column_titles(fig, fig_h, top)
    top += tile_row(fig, fig_h, 0, top) + row_gap
    tile_row(fig, fig_h, 1, top)
    save_figure(fig, "three-options.png")
    # the printed parts and their notes
    fig_h = 4.4
    fig = plt.figure(figsize=(fig_w, fig_h))
    top = 0.62
    column_titles(fig, fig_h, top)
    top += tile_row(fig, fig_h, 2, top) + row_gap
    for j, note in enumerate(notes):
        fig.text(left + j * (w + gap) + w / 2, 1 - top / fig_h, note, ha="center", va="top", fontsize=13.5,
                 color=chalk.CHALK, linespacing=1.0)
    save_figure(fig, "three-options-parts.png")


_KP_LAYOUTS = (  # label, description, then the two text columns of each row of the old figure, words as they are
    ("A", "Design 1: on the roll axis, through the gripper",
     ("0 deg", "94 mm", "0 mm", "39.5 mm"), ("cannot reach", "0.42 mm", "47")),
    ("B0", "Beside the gripper, parallel (reference)",
     ("0 deg", "42 mm", "36 mm", "2.9 mm"), ("0.31 mm", "0.36 mm", "92")),
    ("Sy10", "Alongside, leans out the open side of the jaws, tilt 10 deg",
     ("10 deg", "30 mm", "18 mm", "15.5 mm"), ("0.32 mm", "0.38 mm", "109")),
    ("Sy20", "Alongside, leans out the open side of the jaws, tilt 20 deg",
     ("20 deg", "22 mm", "0 mm", "20.7 mm"), ("0.31 mm", "0.38 mm", "121")),
    ("Sx20", "Alongside the fixed finger, leans back over it, tilt 20 deg",
     ("20 deg", "35 mm", "15 mm", "39.1 mm"), ("cannot reach", "cannot reach", "43")),
    ("P60", "Through the pinch, tilt 60 deg",
     ("60 deg", "68 mm", "59 mm", "71.9 mm"), ("0.26 mm", "0.36 mm", "78")),
    ("H", "Hand: gripper horizontal, pen across the jaws",
     ("90 deg", "43 mm", "43 mm", "90.4 mm"), ("cannot reach", "cannot reach", "19")),
)


def _kp_ticks(line, values):
    """Least-squares map pixel -> data from tick-mark pixel positions of one old axis."""
    k, b = np.polyfit(np.asarray(line, float), np.asarray(values, float), 1)
    return lambda p: k * p + b


def _kp_map_axes(old, x0, x1, y0, y1):
    """Inner plot area of one old reach map and its data extent, found from the spines and tick marks.

    (x0, x1, y0, y1): a box that holds the map spines. Returns (pixels, (left, right, bottom, top)).
    """
    dark = old.max(-1) < 100
    sub = dark[y0:y1, x0:x1]
    cols = np.nonzero(sub.sum(0) > 0.8 * (y1 - y0) * 0.9)[0] + x0
    rows = np.nonzero(sub.sum(1) > 0.8 * (x1 - x0) * 0.9)[0] + y0
    left, right, top, bottom = cols.min(), cols.max(), rows.min(), rows.max()
    xt = np.nonzero(dark[bottom + 2, left:right + 1])[0] + left  # x tick marks below the bottom spine
    yt = np.nonzero(dark[top:bottom + 1, left - 2])[0] + top  # y tick marks left of the left spine
    fx = _kp_ticks(xt, (100, 150, 200, 250, 300))
    fy = _kp_ticks(yt, (100, 50, 0, -50, -100))
    pixels = old[top + 1:bottom, left + 1:right]
    extent = (fx(left + 0.5), fx(right - 0.5), fy(bottom - 0.5), fy(top + 0.5))
    return pixels, extent


def _kp_unring(pixels, extent):
    """Take the red ring off an old reach map. Returns (pixels, (x, y, diameter, width)), or (pixels, None).

    The old maps mark the pose of the arm tile with a pure red ring (about 14 px across, 3 px wide).
    Each pixel with red in it gets back the color of its map cell (the median of the cell pixels
    outside the ring), so every cell keeps its old color, and the ring is drawn again in chalk red. x, y: the ring
    centre in data units (mm). diameter, width: the centre line and the line width of the ring in map
    pixels, from the red share of each ring pixel.
    """
    p = pixels.astype(np.float32)
    core = (p[..., 0] > 200) & (p[..., 1] < 60) & (p[..., 2] < 60)
    if core.sum() < 20:
        return pixels, None
    ys, xs = np.nonzero(core)
    # the circle through the core pixels: x^2 + y^2 + D x + E y + F = 0 by least squares
    D, E, F0 = np.linalg.lstsq(np.c_[xs, ys, np.ones(len(xs))], -(xs ** 2 + ys ** 2).astype(float), rcond=None)[0]
    cx, cy = -D / 2, -E / 2
    radius = math.sqrt(cx * cx + cy * cy - F0)
    height, width = pixels.shape[:2]
    yy, xx = np.mgrid[0:height, 0:width]
    dist = np.hypot(xx - cx, yy - cy)
    core_dist = dist[ys, xs]
    band = (dist > core_dist.min() - 1.0) & (dist < core_dist.max() + 1.0)  # the ring and its antialiased edges
    left, right, bottom, top = extent
    col = np.floor((left + (xx + 0.5) / width * (right - left) - 90.0) / 20.0).astype(int)  # 20 mm cells from x = 90
    row = np.floor((130.0 - (top - (yy + 0.5) / height * (top - bottom))) / 20.0).astype(int)  # and from 130 down
    cell = row * 100 + col
    under = p.copy()
    for c in np.unique(cell[band]):
        inside = cell == c
        under[inside] = np.median(p[inside & ~band], axis=0)
    d = np.array([255.0, 0.0, 0.0]) - under
    share = np.clip(((p - under) * d).sum(-1) / np.maximum((d * d).sum(-1), 1.0), 0.0, 1.0) * band
    hit = share > 0.05  # only pixels with red in them: a band pixel past a cell edge keeps its old color
    out = pixels.copy()
    out[hit] = np.rint(under[hit]).astype(np.uint8)
    x = left + (cx + 0.5) / width * (right - left)
    y = top - (cy + 0.5) / height * (top - bottom)
    return out, (x, y, 2 * (share * dist).sum() / share.sum(), share.sum() / (2 * math.pi * radius))


RING_EDGE = 0.45  # pt: the dark edge on each side of the chalk-red ring, so it reads on yellow and green cells


def fig_all_layouts() -> None:
    """Seven ways to attach the pen: per row a close-up, the arm in the drawing pose, and the reach map.

    For the phone the figure is cut in four. all-layouts-1.png holds the title, the color bar, the
    column heads and layout A; all-layouts-2, 3 and 4 hold two layouts each (B0 and Sy10, Sy20 and Sx20,
    P60 and H) under the same color bar, so each map can be read alone. Each row keeps the sizes and
    places of the one old figure. The divider line between two layouts stays inside a file; at a cut
    there is no line.
    """
    old = np.asarray(old_image("all-layouts.png"))
    boxes = sorted(_kp_tile_boxes(old), key=lambda b: (b[1], b[0]))
    closeups = [b for b in boxes if b[0] < 500]
    arms = [b for b in boxes if 500 <= b[0] < 1045]
    maps = [b for b in boxes if b[0] >= 1045]
    assert len(closeups) == len(arms) == len(maps) == 7
    # the color strip of the color bar: inside its black frame; ticks 0.15 ... 0.45 to its right
    dark = old.max(-1) < 60
    cx = np.nonzero(dark[1000:1500, 1380:1440].sum(0) > 400)[0] + 1380  # left and right frame columns
    cy = np.nonzero(dark[800:1700, cx[0] + 3])[0] + 800  # top and bottom frame rows
    c_top, c_bottom = cy.min(), cy.max()
    ticks = np.nonzero(dark[c_top:c_bottom + 1, cx[-1] + 2])[0] + c_top
    fv = _kp_ticks(ticks, (0.45, 0.40, 0.35, 0.30, 0.25, 0.20, 0.15))
    strip = old[c_top + 1:c_bottom, cx[0] + 1:cx[-1]]
    v_low, v_high = fv(c_bottom - 0.5), fv(c_top + 0.5)

    fig_w, img_h = 6.4, 1.45
    row_h = 3.66
    col_heads = ("close-up", "arm in the drawing pose\n(red circle on the map)", "where the pen can draw")
    arm_x1 = 992  # the old map y label is drawn over the right end of each arm tile: stop before it
    x_close, x_arm, x_map = 0.0, 1.40, 4.52
    w_close = img_h * 254 / 276
    w_arm = img_h * (arm_x1 - 678) / 276
    w_map = img_h * 297 / 275
    for n, rows in enumerate(((0,), (1, 2), (3, 4), (5, 6)), 1):
        first = n == 1
        head = 2.12 if first else 0.95  # inches from the figure top to the first row (files 2-4: height <= 1.25 x width)
        bar = 0.70 if first else 0.19  # inches from the figure top to the bottom of the color bar
        fig_h = head + len(rows) * row_h
        fig = plt.figure(figsize=(fig_w, fig_h))
        X = lambda inch: inch / fig_w  # noqa: E731
        Y = lambda inch, fig_h=fig_h: 1 - inch / fig_h  # noqa: E731  (inches from the top)
        if first:
            fig.text(0.5, Y(0.03), "Ways to attach the pen to the SO-101 gripper (kinematics; concept shapes)",
                     ha="center", va="top", fontsize=15, color=chalk.CHALK)
        # the color bar, laid flat: the old strip pixels turned a quarter turn (low values left)
        cax = fig.add_axes([X(1.7), Y(bar), X(3.0), 0.16 / fig_h])
        cax.imshow(np.rot90(strip, k=-1), extent=(v_low, v_high, 0, 1), aspect="auto", interpolation="nearest")
        cax.set_xlim(v_low, v_high)
        cax.set_yticks([])
        cax.set_xticks([0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45])
        cax.tick_params(axis="x", labelsize=13)
        for side in ("top", "right"):
            cax.spines[side].set_visible(True)
        cax.set_xlabel("tip x error (mm) for 1 mrad on every joint", fontsize=14, labelpad=3)
        if first:
            for xc, text in zip((x_close + w_close / 2, x_arm + w_arm / 2, x_map + w_map / 2), col_heads):
                fig.text(X(xc), Y(head - 0.12), text, ha="center", va="bottom", fontsize=14, color=chalk.DIM,
                         linespacing=1.0)
        for i, k in enumerate(rows):
            label, desc, left_vals, right_vals = _KP_LAYOUTS[k]
            top = head + i * row_h
            fig.text(X(0.02), Y(top), label, ha="left", va="top", fontsize=18, color=chalk.YELLOW)
            fig.text(X(0.02 + 0.16 * len(label) + 0.18), Y(top + 0.04), desc, ha="left", va="top", fontsize=15,
                     color=chalk.CHALK)
            it = top + 0.36  # top of the images
            for (x_in, w_in, box) in ((x_close, w_close, closeups[k]), (x_arm, w_arm, arms[k])):
                bx0, by0, bx1, by1 = box
                bx1 = min(bx1, arm_x1)
                ax = fig.add_axes([X(x_in), Y(it + img_h), X(w_in), img_h / fig_h])
                _kp_show(ax, _kp_matte(old[by0:by1, bx0:bx1], mode="sky", rim_px=3.2, rim_parts="pen")[0])
            bx0, by0, bx1, by1 = maps[k]
            pixels, extent = _kp_map_axes(old, bx0, bx1, by0 - 2, by1 + 2)
            # The old #eee unreachable cells and #d3d3d3 grid are backgrounds, not data colors.
            # Put them on the board while leaving every viridis data cell and the red pose ring intact.
            pixels = pixels.copy()
            for old_gray, new_color in ((238, chalk.BOARD_2), (211, chalk.FAINT)):
                mask = (pixels == old_gray).all(axis=-1)
                pixels[mask] = np.rint(np.array(matplotlib.colors.to_rgb(new_color)) * 255)
            pixels, ring = _kp_unring(pixels, extent)
            ax = fig.add_axes([X(x_map), Y(it + img_h), X(w_map), img_h / fig_h])
            ax.imshow(pixels, extent=extent, aspect="auto", interpolation="nearest")
            if ring is not None:
                x, y, diameter, width = ring
                pt = w_map * 72 / pixels.shape[1]  # points per map pixel
                for color, lw in ((chalk.BOARD, width * pt + 2 * RING_EDGE), (chalk.RED, width * pt)):
                    ax.plot([x], [y], "o", ms=diameter * pt, mfc="none", mec=color, mew=lw, zorder=3)
            ax.set_xlim(extent[0], extent[1])
            ax.set_ylim(extent[2], extent[3])
            ax.set_xticks([100, 150, 200, 250, 300])
            ax.set_yticks([-100, -50, 0, 50, 100])
            ax.tick_params(labelsize=13)
            for side in ("top", "right"):
                ax.spines[side].set_visible(True)
            ax.set_xlabel("reach from the base axis (mm)", fontsize=13, labelpad=2)
            ax.set_ylabel("paper height above\nthe base plane (mm)", fontsize=13, labelpad=2, linespacing=1.0)
            tt = it + img_h + 0.68  # top of the two text columns, below the map x label
            fig.text(X(0.02), Y(tt),
                     f"pen tilt from the roll axis: {left_vals[0]}\ntip to the pinch: {left_vals[1]}\n"
                     f"tip off the roll axis: {left_vals[2]}\npen to wrist (one pose): {left_vals[3]}",
                     ha="left", va="top", fontsize=14, color=chalk.CHALK, linespacing=0.92)
            fig.text(X(3.22), Y(tt),
                     f"x error per mrad on all joints, 240 mm out:\n  paper at base level: {right_vals[0]}\n"
                     f"  base on 60 mm riser: {right_vals[1]}\nreachable cells: {right_vals[2]} of 144",
                     ha="left", va="top", fontsize=14, color=chalk.CHALK, linespacing=0.92)
            if i < len(rows) - 1:
                fig.add_artist(matplotlib.lines.Line2D([X(0.02), X(6.38)], [Y(top + row_h - 0.07)] * 2,
                                                       color=chalk.FAINT, lw=1.0))
        save_figure(fig, f"all-layouts-{n}.png")


FIGURES = {
    "clamp-section": lambda a: fig_clamp_section(a.source),
    "lever": lambda a: fig_lever(),
    "design5-on-arm": lambda a: fig_design5_on_arm(a.source, a.menagerie),
    "how-it-holds": lambda a: fig_how_it_holds(a.source, a.menagerie),
    "design5-fit": lambda a: fig_design5_fit(a.source, a.menagerie),
    "design1-on-arm": lambda a: fig_design1_on_arm(),
    "design-history": lambda a: fig_design_history(),
    "three-options": lambda a: fig_three_options(),
    "all-layouts": lambda a: fig_all_layouts(),
    "thumbnail": lambda a: fig_thumbnail(a.source, a.menagerie),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, required=True, help="so101-pen-holder checkout")
    parser.add_argument("--menagerie", type=Path, help="MuJoCo Menagerie robotstudio_so101 folder (commit 822c2d8)")
    parser.add_argument("--only", nargs="*", choices=sorted(FIGURES), help="make only these figures")
    parser.add_argument("--refit", action="store_true",
                        help="fit the design5-on-arm camera, pad and floor again and print them; make no figure")
    args = parser.parse_args()
    if args.refit:
        if args.menagerie is None:
            parser.error("--menagerie is needed for --refit")
        fit_arm_scene(args.source, args.menagerie)
        return
    names = args.only or list(FIGURES)
    rendered = {"design5-on-arm", "how-it-holds", "design5-fit", "thumbnail"}
    if args.menagerie is None and rendered & set(names):
        parser.error("--menagerie is needed for " + ", ".join(sorted(rendered & set(names))))
    chalk.use()
    for name in names:
        FIGURES[name](args)
        print("wrote", name)


if __name__ == "__main__":
    main()
