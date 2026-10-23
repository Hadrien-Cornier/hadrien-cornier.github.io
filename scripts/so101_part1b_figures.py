"""Figures for SO-101 part 1 (second half, and the spring figure): content/robotics/so101-1-target-and-goal.md.

Run: python3 scripts/so101_figures.py 1b

speed_coupling plots from scripts/so101_data/speed-coupling.json. To rebuild that file,
run compute_speed_coupling() with a Python that has mujoco and the robot_calibration package
(see its docstring).

spring_goal takes a layout: "stack" (the article figure, readable at 390 px) or "row"
(three panels in one row, for the card thumbnail; it needs an out path).
"""

import json
import os
from pathlib import Path

from so101_common import *  # noqa: F401,F403

NOTE_SIZE = 14  # footnotes under a figure, in points
SPEED_COUPLING_JSON = DATA_DIR / "speed-coupling.json"


def worn_hold_motion():
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 8.4))
    ax = axes[0]
    vals = [14.0, 0.7]
    bars = ax.bar([0, 1], vals, width=0.58, color=[BLUE, ORANGE])
    ax.set_xticks([0, 1], ["healthy", "worn"])
    ax.set_ylabel("sag (mrad)")
    ax.set_title("On a hold\n(sag after 0.17 s)", linespacing=0.9)
    ax.set_ylim(0, 18)
    ax.set_yticks(range(0, 19, 2))
    for bar, value in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 0.5, f"{value:g}",
                ha="center")
    ax.text(0.5, 0.88, "friction helps", transform=ax.transAxes, ha="center",
            color=TEAL)
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
    ax.set_title("In motion at 0.7 rad/s")
    ax.set_ylim(0, 104)
    ax.set_yticks(range(0, 81, 20))
    for bars in (bars1, bars2):
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
                    f"{bar.get_height():g}", ha="center")
    ax.text(0.77, 0.92, "friction hurts", transform=ax.transAxes, ha="center",
            color=RED)
    ax.legend(loc="upper left", bbox_to_anchor=(0.0, 1.0))
    clean_axis(ax, "y")
    fig.suptitle("More friction can help a hold and hurt motion", x=0.02, y=0.995,
                 ha="left", color=YELLOW)
    fig.text(0.5, 0.012, "Simulation. Worn friction is 2.5 times the healthy value.",
             ha="center", fontsize=NOTE_SIZE, color=MUTED)
    fig.subplots_adjust(left=0.16, right=0.97, top=0.84, bottom=0.09, hspace=0.50)
    save_figure(fig, "worn-hold-motion.png")


def friction_models():
    velocity = np.linspace(-0.3, 0.3, 601)
    f_c = 0.196
    damping = 1.058
    fig, axes = plt.subplots(4, 1, figsize=(6.2, 11.4), sharex=True, sharey=True)

    ax = axes[0]
    coulomb = f_c * np.sign(velocity) + damping * velocity
    ax.plot(velocity, coulomb, color=BLUE)
    ax.set_title("Coulomb + viscous")
    ax.text(0.03, 0.93, "f = 0.196, d = 1.058", transform=ax.transAxes,
            va="top", color=MUTED, bbox=chalk.label_box())

    ax = axes[1]
    f_s, v_s = 0.3, 0.02
    stribeck = (f_c + (f_s - f_c) * np.exp(-(velocity / v_s) ** 2)) * np.sign(velocity) + damping * velocity
    ax.plot(velocity, stribeck, color=ORANGE)
    ax.set_title("Stiction + Stribeck")
    ax.text(0.03, 0.93, "fs = 0.3, fc = 0.196, vs = 0.02, plus viscous",
            transform=ax.transAxes, va="top", color=MUTED, bbox=chalk.label_box())

    ax = axes[2]
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
    ax.plot(speed, lugre_friction, color=TEAL, lw=2.2)
    ax.set_title("LuGre: memory")
    ax.text(0.03, 0.93, "sigma0 = 100, sigma1 = 1; slow reversal",
            transform=ax.transAxes, va="top", color=MUTED, bbox=chalk.label_box())

    ax = axes[3]
    for load, color in zip([0, 0.5, 1.0], [LIGHT_BLUE, PURPLE, RED]):
        friction = (f_c + 0.4 * abs(load)) * np.sign(velocity) + damping * velocity
        ax.plot(velocity, friction, color=color, label=f"|tau| = {load:g} N m")
    ax.set_title("Load-dependent")
    ax.legend(loc="lower right")

    for ax in axes:
        ax.axhline(0, color=GRID, lw=1.0, zorder=0)
        ax.axvline(0, color=GRID, lw=1.0, zorder=0)
        ax.set_xlim(-0.3, 0.3)
        ax.set_ylim(-1.0, 1.0)
        ax.set_ylabel("friction torque (N m)")
        clean_axis(ax, "y")
        ax.tick_params(labelbottom=True)
    axes[3].set_xlabel("speed (rad/s)")
    fig.suptitle("Four models describe friction in different ways", x=0.02, y=0.995,
                 ha="left", color=YELLOW)
    fig.text(0.5, 0.008, "Teaching curves with simulator-scale numbers.",
             ha="center", fontsize=NOTE_SIZE, color=MUTED)
    fig.subplots_adjust(left=0.16, right=0.97, top=0.925, bottom=0.10, hspace=0.45)
    save_figure(fig, "friction-models.png")


def heat_torque():
    temperature = np.linspace(20, 80, 400)
    copper_alpha = 0.00393
    torque_percent = 100 / (1 + copper_alpha * (temperature - 25))
    fig, ax = plt.subplots(figsize=(6.4, 5.2))
    ax.plot(temperature, torque_percent, color=ORANGE, lw=3.2)
    ax.scatter([25], [100], color=BLUE, s=70, zorder=4)
    ax.annotate("100% at 25 °C", (25, 100), xytext=(14, 26),
                textcoords="offset points", color=BLUE,
                arrowprops={"arrowstyle": "->", "color": BLUE, "lw": 1.8})
    ax.text(0.04, 0.15, "explained, not measured\non my arm", transform=ax.transAxes,
            ha="left", va="bottom", color=INK, linespacing=0.9,
            bbox={"facecolor": BOARD, "edgecolor": GRID, "boxstyle": "round,pad=0.45"})
    ax.set_xlim(20, 80)
    ax.set_ylim(75, 104)
    ax.set_xlabel("winding temperature (°C)")
    ax.set_ylabel("torque available (% of 25 °C value)")
    ax.set_title("Heat reduces torque at constant voltage", pad=12)
    clean_axis(ax, "y")
    ax.text(0.04, 0.04, "Copper resistance rises about 0.4% per °C.",
            transform=ax.transAxes, color=MUTED)
    fig.subplots_adjust(left=0.16, right=0.97, top=0.88, bottom=0.13)
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

    fig, ax = plt.subplots(figsize=(6.4, 5.6))
    ax.plot(time, late_curve, color=RED,
            label=f"late brake, {late_torque:g} N m")
    ax.plot(time, early_curve, color=TEAL,
            label=f"early brake, {early_torque:g} N m")
    ax.axhline(5.107, color=RED, ls="--", lw=2.0, label="torque clamp = 5.107 N m")
    ax.axvline(0, color=INK, lw=1.8)
    ax.text(-0.15, 7.25, "wall", ha="right", va="bottom", color=INK)
    ax.text(-7.85, 5.5, f"late brake needs {late_torque:g} N m", color=RED)
    ax.text(-7.85, 3.4, f"early brake needs {early_torque:g} N m", color=TEAL)
    ax.set_xlim(-8, 0.6)
    ax.set_ylim(-0.2, 9.4)
    ax.set_yticks(range(0, 9))
    ax.set_xlabel("time before wall (ms)")
    ax.set_ylabel("braking torque required (N m)")
    ax.set_title("Late braking can exceed\nthe servo torque limit", pad=12, linespacing=0.9)
    ax.legend(loc="upper left", bbox_to_anchor=(0.0, 1.0))
    clean_axis(ax, "y")
    fig.text(0.02, 0.012,
             "A planner that sees the stop coming can brake early\nand stay under the torque limit. J = 0.06 kg m².",
             fontsize=NOTE_SIZE, color=MUTED, va="bottom", linespacing=0.9)
    fig.subplots_adjust(left=0.14, right=0.97, top=0.85, bottom=0.25)
    save_figure(fig, "torque-limit.png")


def constants_dumbbell():
    rows = [
        ("stiffness kp", "N m/rad", 13.64, 15.6, 16.5, 18, np.arange(0, 19, 2)),
        ("damping d", "N m s/rad", 1.058, 1.66, 1.77, 2.0, np.arange(0, 2.01, 0.25)),
        ("damping ratio", "ratio", 0.68, 1.15, 1.20, 1.35, np.arange(0, 1.21, 0.2)),
        ("dead time", "ms", 0.0, 31, 36, 42, np.arange(0, 41, 5)),
        ("lag", "ms", 78, 87, 105, 120, np.arange(0, 121, 20)),
        ("dead band", "mrad", 0.0, 8.1, 21.0, 24, np.arange(0, 21, 5)),
    ]
    fig, axes = plt.subplots(len(rows), 1, figsize=(6.3, 11.6))
    for ax, (name, unit, sim, lo, hi, xmax, xticks) in zip(axes, rows):
        ax.axvspan(lo, hi, color=TEAL, alpha=0.22, zorder=1)
        ax.hlines(0, lo, hi, color=TEAL, lw=8, zorder=2)
        ax.scatter([sim], [0], facecolor=BOARD, edgecolor=BLUE, s=110,
                   linewidth=2.4, zorder=4, clip_on=False)
        ax.set_xlim(0, xmax)
        ax.set_xticks(xticks)
        ax.set_ylim(-0.8, 0.8)
        ax.set_yticks([0], [f"{name}\n({unit})"])
        for tick in ax.get_yticklabels():
            tick.set_multialignment("right")
        ax.tick_params(axis="y", length=0, pad=10)
        ax.set_xlabel(f"{name} ({unit})", labelpad=2)
        ax.grid(True, axis="x", color=GRID, linewidth=0.9)
        ax.set_axisbelow(True)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_visible(False)
        ax.tick_params(axis="x", colors=MUTED, length=3)
        ax.text(0.0, 1.06, f"simulator: {sim:g}", transform=ax.transAxes,
                ha="left", va="bottom", color=BLUE)
        ax.text(1.0, 1.06, f"real range: {lo:g} to {hi:g}", transform=ax.transAxes,
                ha="right", va="bottom", color=TEAL)
    fig.suptitle("Simulator against my real arm", x=0.02, y=0.995,
                 ha="left", color=YELLOW)
    fig.subplots_adjust(left=0.27, right=0.96, top=0.925, bottom=0.04, hspace=1.25)
    save_figure(fig, "constants-dumbbell.png")


def compute_speed_coupling(src=None, out=SPEED_COUPLING_JSON, commit=None):
    """Rebuild scripts/so101_data/speed-coupling.json with MuJoCo inverse dynamics.

    Needs a Python with mujoco 3.x and the robot_calibration package from the
    robot-self-calibration repository (branch origin/blog-renders). src is its
    `src` folder; the MJCF model is read from the `assets/so101` folder next to it.
    Default src: $SO101_RSC_SRC, else SOURCE_ROOT/src. For example:

        git -C <repo> archive origin/blog-renders src assets | tar -x -C <folder>
        PYTHONDONTWRITEBYTECODE=1 <repo>/.venv/bin/python -c \\
            "import so101_part1b_figures as m; m.compute_speed_coupling(src='<folder>/src')"

    Run it from the scripts folder. Curves: the error in the shoulder_lift joint
    (mrad) from the velocity terms of the dynamics at the real reach pose, while
    the base spins ("pan") or the lift and elbow move together ("pair").
    """
    import sys

    import mujoco

    src = Path(src or os.environ.get("SO101_RSC_SRC") or SOURCE_ROOT / "src")
    sys.path.insert(0, str(src))
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

    def rounded(values):
        return [float(f"{value:.8g}") for value in values]

    result = {
        "description": "Speed coupling against gravity on shoulder_lift, MuJoCo SO-101 at the real reach pose "
                       "(inverse dynamics). Torque is converted to mrad by kp.",
        "source": {
            "repository": "robot-self-calibration",
            "ref": "origin/blog-renders",
            "commit": commit,
            "code": "src/robot_calibration/so101/robot.py: build_spec(plant_for('nominal')), mujoco 3.14",
            "reach_pose_rad": reach.tolist(),
        },
        "units": {"speeds": "rad/s", "pan": "mrad", "pair": "mrad", "sag": "mrad", "tick": "mrad",
                  "kp": "N m/rad"},
        "kp": kp,
        "sag": float(sag),
        "tick": 1.534,
        "pan_at_1p1": float(np.interp(1.1, speeds, pan)),
        "pair_at_1p1": float(np.interp(1.1, speeds, pair)),
        "speeds": rounded(speeds),
        "pan": rounded(pan),
        "pair": rounded(pair),
    }
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=1) + "\n")
    return result


def speed_coupling():
    """Speed coupling against gravity on shoulder_lift: plots the curves stored in speed-coupling.json."""
    result = json.loads(SPEED_COUPLING_JSON.read_text())
    speeds = np.array(result["speeds"])
    pan = np.array(result["pan"])
    pair = np.array(result["pair"])
    sag = result["sag"]
    tick = result["tick"]
    kp = result["kp"]
    at = result["pan_at_1p1"]
    fig, ax = plt.subplots(figsize=(6.4, 5.4))
    ax.axvspan(0, 1.1, color=PALE, zorder=0)
    ax.text(0.55, 28, "speeds in my\nreal recordings", ha="center", va="top",
            fontsize=13.5, color=MUTED)
    ax.axhline(sag, color=ORANGE, lw=2.8)
    ax.text(4.45, sag * 1.15, f"gravity sag {sag:.0f} mrad", ha="right", va="bottom", color=ORANGE)
    ax.axhline(tick, color=MUTED, lw=1.6, ls="--")
    ax.text(4.45, tick / 1.15, "1 encoder tick", ha="right", va="top", color=MUTED)
    ax.plot(speeds, pan, color=BLUE, lw=3.0, label="base (pan) spins")
    ax.plot(speeds, pair, color=TEAL, lw=2.8, ls="-.", label="lift and elbow move together")
    ax.scatter([1.1], [at], color=BLUE, s=60, zorder=4)
    ax.annotate(f"{at:.2f} mrad at 1.1 rad/s", (1.1, at), xytext=(14, -4), textcoords="offset points",
                color=BLUE, va="top")
    ax.set_yscale("log")
    ax.set_ylim(0.01, 200)
    ax.set_xlim(0, 4.5)
    ax.set_xticks(np.arange(0, 4.6, 0.5))
    ax.set_xlabel("joint speed (rad/s)")
    ax.set_ylabel("shoulder_lift error it causes (mrad)")
    ax.set_title("Speed coupling is real,\nbut small on this arm", pad=12, linespacing=0.9)
    ax.legend(loc="lower right")
    clean_axis(ax, "y")
    fig.text(0.02, 0.012, f"Simulated SO-101 (MuJoCo), arm reaching out.\nTorque converted to mrad by kp = {kp:.2f} N m/rad.",
             fontsize=NOTE_SIZE, color=MUTED, va="bottom", linespacing=0.9)
    fig.subplots_adjust(left=0.17, right=0.96, top=0.86, bottom=0.26)
    save_figure(fig, "speed-coupling.png")
    print(f"speed coupling: sag {sag:.1f} mrad, pan {at:.2f} mrad and lift+elbow "
          f"{result['pair_at_1p1']:.2f} mrad at 1.1 rad/s; at 4.5 rad/s {pan[-1]:.1f} and {pair[-1]:.1f}")


def _spring_coil(start, end, turns=5, radius=0.30, lead=0.12):
    """Points of a coil spring from start to end: straight leads and a looped coil between."""
    start = np.asarray(start, float)
    end = np.asarray(end, float)
    delta = end - start
    length = float(np.hypot(*delta))
    along = delta / length
    side = np.array([-along[1], along[0]])
    t = np.linspace(0, 1, 600)
    s = np.clip((t - lead) / (1 - 2 * lead), 0, 1)
    inside = (s > 0) & (s < 1)
    phase = 2 * np.pi * turns * s
    axial = t * length + 0.5 * radius * (np.cos(phase) - 1) * inside
    lateral = radius * np.sin(phase) * inside
    return start[None, :] + axial[:, None] * along[None, :] + lateral[:, None] * side[None, :]


def spring_goal(layout="stack", out=None):
    """Schematic of the servo as a torsion spring: goal, target, joint and the gap.

    layout="stack": three panels one under the other, 6.4 in wide, saved to
    assets/robotics/so101-series/spring-goal.png (or out).
    layout="row": three panels in one row, for the 720 x 424 card thumbnail. out is required.
    """
    if layout not in ("stack", "row"):
        raise ValueError(f"layout must be 'stack' or 'row', not {layout!r}")
    row = layout == "row"
    if row and out is None:
        raise ValueError("layout='row' needs an out path")
    out = Path(out) if out is not None else OUTPUT_DIR / "spring-goal.png"

    unit = 0.36 if row else 0.56          # inches per data unit
    xmax = 8.4
    theta = np.radians(20)
    pivot = np.array([0.7, 0.0])
    length = 5.2                          # link length
    goal_length = length + 0.4            # the goal line is a little longer than the link
    spring_x = pivot[0] + 3.4             # x of the spring
    arrow_len = (0.62 if not row else 0.62) / unit   # gravity arrow, 0.62 in long
    line_pitch = 0.28                     # inches between two caption lines (15 pt text)

    titles = ["1. No load", "2. Gravity, goal on the target", "3. Gravity, goal past the target"]
    if row:
        titles = ["1. No load", "2. Gravity, goal\non the target", "3. Gravity, goal\npast the target"]
        captions = ["Goal on the target.\nNo stretch, no torque needed.",
                    "The joint sags until\nthe stretch holds it:\ngap = G / kp = 28.7 mrad.",
                    "Move the goal up by G / kp.\nThe joint lands on the target."]
        footnote = "The servo acts like a torsion spring: torque = kp × gap. Angles are exaggerated."
    else:
        captions = ["Goal on the target.\nNo stretch, no torque needed.",
                    "The joint sags until the stretch\nholds it: gap = G / kp = 28.7 mrad.",
                    "Move the goal up by G / kp.\nThe joint lands on the target."]
        footnote = ("The servo acts like a torsion spring: torque = kp × gap.\n"
                    "Angles are exaggerated.")

    # Vertical extent of each panel in data units: the drawing plus room for its labels.
    drop = length * np.sin(theta)                       # how far the joint sags in panel 2
    low = -(0.38 + arrow_len)                           # the gravity arrow ends here, below the joint
    extents = [
        (-0.3 - 0.62 / unit, 0.3 + 0.55 / unit),
        (-drop + low - 0.2 / unit, 0.8 / unit),
        (low - 0.2 / unit, goal_length * np.sin(theta) + 0.55 / unit),
    ]
    if row:
        ymin = min(e[0] for e in extents)
        ymax = max(e[1] for e in extents)
        extents = [(ymin, ymax)] * 3
    heights = [(e[1] - e[0]) * unit for e in extents]
    caption_in = [line_pitch * c.count("\n") + 0.45 for c in captions]
    title_in = [0.5 + (line_pitch if "\n" in t else 0) for t in titles]
    note_in = line_pitch * footnote.count("\n") + 0.45

    width_in = xmax * unit
    margin = 0.1
    if row:
        spacing = 0.22
        fig_w = 3 * width_in + 2 * spacing + 2 * margin
        fig_h = max(title_in) + heights[0] + max(caption_in) + note_in
        lefts = [margin + index * (width_in + spacing) for index in range(3)]
        bottoms = [fig_h - max(title_in) - heights[0]] * 3
    else:
        gap = 0.25
        fig_w = 6.4
        fig_h = sum(title_in) + sum(heights) + sum(caption_in) + 2 * gap + note_in
        lefts = [margin + 0.1] * 3
        bottoms = []
        cursor = fig_h
        for index in range(3):
            cursor -= title_in[index] + heights[index]
            bottoms.append(cursor)
            cursor -= caption_in[index] + gap
    fig = plt.figure(figsize=(fig_w, fig_h))
    axes = [fig.add_axes([lefts[i] / fig_w, bottoms[i] / fig_h, width_in / fig_w, heights[i] / fig_h])
            for i in range(3)]

    def tag(ax, text, xy, dx, dy, color, ha="center", va="center"):
        ax.annotate(text, xy, xytext=(dx, dy), textcoords="offset points", ha=ha, va=va,
                    color=color, annotation_clip=False, linespacing=0.9)

    def line(ax, points, color, lw, **kwargs):
        points = np.asarray(points)
        ax.plot(points[:, 0], points[:, 1], color=color, lw=lw, solid_capstyle="round", **kwargs)

    for index, ax in enumerate(axes):
        ax.set_xlim(0, xmax)
        ax.set_ylim(*extents[index])
        ax.axis("off")
        ax.set_title(titles[index], loc="left", pad=4, linespacing=0.9)
        end_goal_x = pivot[0] + goal_length
        # the target: a dashed line past the end of the goal line
        line(ax, [(end_goal_x, 0), (end_goal_x + 1.1, 0)], MUTED, 2.6, ls=(0, (4, 3)), zorder=2)
        tag(ax, "target", (end_goal_x + 0.55, 0), 0, -20, MUTED)

        sag = index == 1
        up = index == 2
        link_angle = -theta if sag else 0.0
        goal_angle = theta if up else 0.0
        link_dir = np.array([np.cos(link_angle), np.sin(link_angle)])
        goal_dir = np.array([np.cos(goal_angle), np.sin(goal_angle)])
        joint = pivot + length * link_dir
        goal_tip = pivot + goal_length * goal_dir

        line(ax, [pivot, goal_tip], ORANGE, 3.4, zorder=3)
        line(ax, [pivot, joint], BLUE, 8.5, zorder=4)
        ax.add_patch(Circle(joint, 0.30, facecolor=BLUE, edgecolor=BLUE, zorder=5))
        ax.add_patch(Circle(pivot, 0.30, facecolor=INK, edgecolor=INK, zorder=6))

        if sag or up:
            top_y = (spring_x - pivot[0]) * np.tan(goal_angle)
            bottom_y = (spring_x - pivot[0]) * np.tan(link_angle)
            coil = _spring_coil((spring_x, bottom_y if up else top_y),
                                (spring_x, top_y if up else bottom_y))
            ax.plot(coil[:, 0], coil[:, 1], color=TEAL, lw=2.6, zorder=5, solid_joinstyle="round")
        if index == 0:
            tag(ax, "goal", (joint[0], 0), 0, 22, ORANGE)
            tag(ax, "joint", (joint[0] - 1.3, 0), 0, -24, BLUE)
        if sag:
            tag(ax, "goal", (end_goal_x, 0), 0, 16, ORANGE)
            tag(ax, "gap (stretch)", (spring_x, 0), 0, 14, TEAL, va="bottom")
            tag(ax, "joint", joint, -14, -26, BLUE, ha="right")
        if up:
            tag(ax, "goal", goal_tip, 0, 16, ORANGE)
            tag(ax, "gap", (spring_x, top_y), -8, 6, TEAL, ha="right", va="bottom")
            tag(ax, "joint", (joint[0], 0), -14, -26, BLUE, ha="right")
        if sag or up:
            start = joint + np.array([0, -0.38])
            stop = joint + np.array([0, low])
            ax.annotate("", xy=stop, xytext=start, annotation_clip=False,
                        arrowprops={"arrowstyle": "-|>", "color": INK, "lw": 2.6,
                                    "mutation_scale": 20, "shrinkA": 0, "shrinkB": 0})
            tag(ax, "gravity G", (joint[0], joint[1] + low + 0.15), 10, 0, INK, ha="left")
        for number, text in enumerate(captions[index].split("\n")):
            ax.annotate(text, (0.0, -0.01), xycoords="axes fraction",
                        xytext=(0, -number * line_pitch * 72), textcoords="offset points",
                        ha="left", va="top", color=INK, annotation_clip=False)

    fig.text(margin / fig_w + (0 if row else 0.1 / fig_w), 0.08 / fig_h, footnote, ha="left", va="bottom",
             fontsize=NOTE_SIZE, color=MUTED, linespacing=0.9)
    chalk.save(fig, out)


FIGURES = [worn_hold_motion, friction_models, heat_torque, torque_limit, constants_dumbbell, speed_coupling,
           spring_goal]
