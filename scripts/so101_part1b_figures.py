"""Figures for SO-101 part 1 (second half, and the spring figure): content/robotics/so101-1-target-and-goal.md.

Run: python3 scripts/so101_figures.py 1b
"""

from so101_common import *  # noqa: F401,F403


def worn_hold_motion():
    fig, axes = plt.subplots(1, 2, figsize=(8, 4.5))
    ax = axes[0]
    vals = [14.0, 0.7]
    bars = ax.bar([0, 1], vals, width=0.58, color=[BLUE, ORANGE])
    ax.set_xticks([0, 1], ["healthy", "worn"])
    ax.set_ylabel("sag (mrad)")
    ax.set_title("On a hold\n(sag after 0.17 s)", fontsize=12, weight="bold")
    ax.set_ylim(0, 18)
    for bar, value in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 0.5, f"{value:g}",
                ha="center", fontsize=11)
    ax.text(0.5, 0.88, "friction helps", transform=ax.transAxes, ha="center",
            color=TEAL, fontsize=11, weight="bold")
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
    ax.set_title("In motion at 0.7 rad/s", fontsize=12, weight="bold")
    ax.set_ylim(0, 98)
    for bars in (bars1, bars2):
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
                    f"{bar.get_height():g}", ha="center", fontsize=10)
    ax.text(0.77, 0.91, "friction hurts", transform=ax.transAxes, ha="center",
            color=RED, fontsize=11, weight="bold")
    ax.legend(loc="upper left", fontsize=9.5, bbox_to_anchor=(0.0, 0.98))
    clean_axis(ax, "y")
    fig.suptitle("More friction can help a hold and hurt motion", x=0.06, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.text(0.5, 0.035, "Simulation. Worn friction is 2.5 times the healthy value.",
             ha="center", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.10, right=0.98, top=0.84, bottom=0.19, wspace=0.34)
    save_figure(fig, "worn-hold-motion.png")


def friction_models():
    velocity = np.linspace(-0.3, 0.3, 601)
    f_c = 0.196
    damping = 1.058
    fig, axes = plt.subplots(2, 2, figsize=(8, 6.0), sharex=True, sharey=True)

    ax = axes[0, 0]
    coulomb = f_c * np.sign(velocity) + damping * velocity
    ax.plot(velocity, coulomb, color=BLUE, lw=1.8)
    ax.set_title("Coulomb + viscous", fontsize=12, weight="bold")
    ax.text(0.04, 0.91, "f = 0.196, d = 1.058", transform=ax.transAxes,
            va="top", fontsize=9.8, color=MUTED)

    ax = axes[0, 1]
    f_s, v_s = 0.3, 0.02
    stribeck = (f_c + (f_s - f_c) * np.exp(-(velocity / v_s) ** 2)) * np.sign(velocity) + damping * velocity
    ax.plot(velocity, stribeck, color=ORANGE, lw=1.8)
    ax.set_title("Stiction + Stribeck", fontsize=12, weight="bold")
    ax.text(0.04, 0.91, "fs = 0.3, fc = 0.196, vs = 0.02, plus viscous",
            transform=ax.transAxes, va="top", fontsize=9.2, color=MUTED)

    ax = axes[1, 0]
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
    ax.plot(speed, lugre_friction, color=TEAL, lw=1.5)
    ax.set_title("LuGre: memory", fontsize=12, weight="bold")
    ax.text(0.04, 0.91, "sigma0 = 100, sigma1 = 1; slow reversal",
            transform=ax.transAxes, va="top", fontsize=9.5, color=MUTED)

    ax = axes[1, 1]
    for load, color in zip([0, 0.5, 1.0], [LIGHT_BLUE, PURPLE, RED]):
        friction = (f_c + 0.4 * abs(load)) * np.sign(velocity) + damping * velocity
        ax.plot(velocity, friction, color=color, lw=1.6, label=f"|tau| = {load:g} N m")
    ax.set_title("Load-dependent", fontsize=12, weight="bold")
    ax.legend(loc="lower right", fontsize=8.8)

    for ax in axes.flat:
        ax.axhline(0, color=GRID, lw=0.8)
        ax.axvline(0, color=GRID, lw=0.8)
        ax.set_xlim(-0.3, 0.3)
        ax.set_ylim(-1.0, 1.0)
        clean_axis(ax, "y")
    axes[1, 0].set_xlabel("speed (rad/s)")
    axes[1, 1].set_xlabel("speed (rad/s)")
    axes[0, 0].set_ylabel("friction torque (N m)")
    axes[1, 0].set_ylabel("friction torque (N m)")
    fig.suptitle("Four models describe friction in different ways", x=0.07, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.text(0.5, 0.025, "Teaching curves with simulator-scale numbers.",
             ha="center", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.12, right=0.98, top=0.87, bottom=0.12,
                        hspace=0.36, wspace=0.25)
    save_figure(fig, "friction-models.png")


def heat_torque():
    temperature = np.linspace(20, 80, 400)
    copper_alpha = 0.00393
    torque_percent = 100 / (1 + copper_alpha * (temperature - 25))
    fig, ax = plt.subplots(figsize=(8, 4.7))
    ax.plot(temperature, torque_percent, color=ORANGE, lw=2.7)
    ax.scatter([25], [100], color=BLUE, s=60, zorder=4)
    ax.annotate("100% at 25 °C", (25, 100), xytext=(10, 20),
                textcoords="offset points", fontsize=10.5, color=BLUE,
                arrowprops={"arrowstyle": "->", "color": BLUE})
    ax.text(0.97, 0.12, "explained, not measured\non my arm", transform=ax.transAxes,
            ha="right", va="bottom", fontsize=13, weight="bold", color=INK,
            bbox={"facecolor": "white", "edgecolor": GRID, "boxstyle": "round,pad=0.45"})
    ax.set_xlim(20, 80)
    ax.set_ylim(75, 104)
    ax.set_xlabel("winding temperature (°C)")
    ax.set_ylabel("torque available (% of 25 °C value)")
    ax.set_title("Heat reduces torque at constant voltage", loc="left", pad=12, weight="bold")
    clean_axis(ax, "y")
    ax.text(0.03, 0.04, "Copper resistance rises about 0.4% per °C.",
            transform=ax.transAxes, fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.14, right=0.97, top=0.86, bottom=0.17)
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

    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.plot(time, late_curve, color=RED, lw=2.2,
            label=f"late brake, {late_torque:g} N m")
    ax.plot(time, early_curve, color=TEAL, lw=2.2,
            label=f"early brake, {early_torque:g} N m")
    ax.axhline(5.107, color=RED, ls="--", lw=1.7, label="torque clamp = 5.107 N m")
    ax.axvline(0, color=INK, lw=1.5)
    ax.text(0, 7.5, "wall", ha="right", va="bottom", fontsize=10.5, color=INK)
    ax.text(-5.6, 5.8, f"late brake needs {late_torque:g} N m",
            color=RED, fontsize=10,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.annotate(f"early brake needs {early_torque:g} N m", (-early_ms, early_torque),
                xytext=(-110, 18), textcoords="offset points", color=TEAL, fontsize=10)
    ax.set_xlim(-8, 0.6)
    ax.set_ylim(-0.2, 8.3)
    ax.set_xlabel("time before wall (ms)")
    ax.set_ylabel("braking torque required (N m)")
    ax.set_title("Late braking can exceed the servo torque limit", loc="left",
                 pad=12, weight="bold")
    ax.legend(loc="upper left", fontsize=9.2)
    clean_axis(ax, "y")
    fig.text(0.08, 0.035,
             "A planner that sees the stop coming can brake early and stay under the torque limit. J = 0.06 kg m².",
             fontsize=9.8, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.97, top=0.85, bottom=0.19)
    save_figure(fig, "torque-limit.png")


def constants_dumbbell():
    rows = [
        ("stiffness kp", "N m/rad", 13.64, 15.6, 16.5, 18),
        ("damping d", "N m s/rad", 1.058, 1.66, 1.77, 2.0),
        ("damping ratio", "ratio", 0.68, 1.15, 1.20, 1.35),
        ("dead time", "ms", 0.0, 31, 36, 42),
        ("lag", "ms", 78, 87, 105, 120),
        ("dead band", "mrad", 0.0, 8.1, 21.0, 24),
    ]
    fig, axes = plt.subplots(len(rows), 1, figsize=(9, 8.4))
    for ax, (name, unit, sim, lo, hi, xmax) in zip(axes, rows):
        ax.axvspan(lo, hi, color=TEAL, alpha=0.22, zorder=1)
        ax.hlines(0, lo, hi, color=TEAL, lw=7, zorder=2)
        ax.scatter([sim], [0], facecolor="white", edgecolor=BLUE, s=72,
                   linewidth=2, zorder=4)
        ax.set_xlim(0, xmax)
        ax.set_ylim(-0.8, 0.8)
        ax.set_yticks([0], [f"{name} ({unit})"])
        ax.tick_params(axis="y", length=0, pad=10, labelsize=11)
        ax.set_xlabel(f"{name} ({unit})", labelpad=1, fontsize=11)
        ax.grid(True, axis="x", color=GRID, linewidth=0.65)
        ax.set_axisbelow(True)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_visible(False)
        ax.tick_params(axis="x", labelsize=11, colors=MUTED, length=2)
        ax.text(0.01, 0.82, f"simulator: {sim:g}", transform=ax.transAxes,
                ha="left", va="top", fontsize=11, color=BLUE,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
        ax.text(0.99, 0.82, f"real range: {lo:g} to {hi:g}", transform=ax.transAxes,
                ha="right", va="top", fontsize=11, color=TEAL,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    fig.suptitle("Simulator against my real arm", x=0.08, y=0.99,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.35, right=0.98, top=0.93, bottom=0.07, hspace=0.84)
    save_figure(fig, "constants-dumbbell.png")


def speed_coupling():
    """Speed coupling against gravity on shoulder_lift, MuJoCo SO-101 at the real reach pose (inverse dynamics)."""
    import sys

    import mujoco

    sys.path.insert(0, str(DATA_ROOT / "blog-renders" / "src"))
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
    tick = 1.534
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.axvspan(0, 1.1, color=PALE, zorder=0)
    ax.text(0.55, 150, "speeds in my\nreal recordings", ha="center", va="top", fontsize=10, color=MUTED)
    ax.axhline(sag, color=ORANGE, lw=2.2)
    ax.text(4.45, sag * 1.15, f"gravity sag {sag:.0f} mrad", ha="right", va="bottom", fontsize=10.5, color=ORANGE)
    ax.axhline(tick, color=MUTED, lw=1.2, ls="--")
    ax.text(4.45, tick * 1.15, "1 encoder tick", ha="right", va="bottom", fontsize=10, color=MUTED)
    ax.plot(speeds, pan, color=BLUE, lw=2.4, label="base (pan) spins")
    ax.plot(speeds, pair, color=TEAL, lw=2.2, ls="-.", label="lift and elbow move together")
    at = float(np.interp(1.1, speeds, pan))
    ax.scatter([1.1], [at], color=BLUE, zorder=4)
    ax.annotate(f"{at:.2f} mrad at 1.1 rad/s", (1.1, at), xytext=(14, -4), textcoords="offset points",
                fontsize=10, color=BLUE, va="top")
    ax.set_yscale("log")
    ax.set_ylim(0.01, 200)
    ax.set_xlim(0, 4.5)
    ax.set_xlabel("joint speed (rad/s)")
    ax.set_ylabel("shoulder_lift error it causes (mrad)")
    ax.set_title("Speed coupling is real, but small on this arm", loc="left", pad=12, weight="bold")
    ax.legend(loc="lower right", fontsize=9.6)
    clean_axis(ax, "y")
    fig.text(0.13, 0.015, f"Simulated SO-101 (MuJoCo), arm reaching out. Torque converted to mrad by kp = {kp:.2f} N m/rad.",
             fontsize=9.2, color=MUTED)
    fig.subplots_adjust(left=0.12, right=0.97, top=0.88, bottom=0.17)
    save_figure(fig, "speed-coupling.png")
    print(f"speed coupling: sag {sag:.1f} mrad, pan {at:.2f} mrad and lift+elbow "
          f"{float(np.interp(1.1, speeds, pair)):.2f} mrad at 1.1 rad/s; at 4.5 rad/s {pan[-1]:.1f} and {pair[-1]:.1f}")


FIGURES = [worn_hold_motion, friction_models, heat_torque, torque_limit, constants_dumbbell, speed_coupling]
