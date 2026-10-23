"""Figures for SO-101 part 1: content/robotics/so101-1-target-and-goal.md.

Run: python3 scripts/so101_figures.py 1
"""

from so101_common import *  # noqa: F401,F403


def pid_parts():
    fig, axes = plt.subplots(1, 3, figsize=(9.5, 5.0), sharex=True, sharey=True)
    panels = [
        ("p", "P: spring", r"$\tau=13.64(goal-q)$"),
        ("pd", "P + D: spring in\nhoney", r"$\tau=13.64(goal-q)-v$"),
        ("pi", "P + I: spring that keeps\npushing",
         r"$\tau=13.64(goal-q)$" + "\n" + r"$+20\int e\,dt$"),
    ]
    for ax, (kind, title, equation) in zip(axes, panels):
        time, q = simulate_joint(kind)
        ax.plot(time, q * 1000, color=BLUE, lw=2.1, label="joint position q")
        ax.axhline(100, color=ORANGE, lw=1.5, ls="--", label="goal")
        ax.text(0.04, 0.92, equation, transform=ax.transAxes, fontsize=11,
                color=MUTED, va="top", linespacing=1.2,
                bbox={"facecolor": "white", "edgecolor": "none", "alpha": 0.88, "pad": 1.5})
        ax.set_title(title, fontsize=11, weight="bold", pad=8, linespacing=1.05)
        ax.set_xlim(0, 1.5)
        ax.set_ylim(-5, 125)
        ax.set_xlabel("time (s)")
        clean_axis(ax, "y")
    axes[0].set_ylabel("joint angle (mrad)")
    axes[0].legend(loc="lower right", fontsize=9.5)
    fig.suptitle("A gravity-loaded joint responds to a goal step", x=0.08, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.text(0.5, 0.035, "Teaching model, not the real servo.",
             ha="center", fontsize=11, color=MUTED)
    fig.subplots_adjust(left=0.09, right=0.99, top=0.79, bottom=0.18, wspace=0.20)
    save_figure(fig, "pid-parts.png")


def two_loops():
    fig, ax = plt.subplots(figsize=(8, 3.5))
    setup_diagram(ax, (0, 8), (0, 3.5))
    outer = Rectangle((0.18, 1.18), 3.12, 1.83, fill=False, ec=BLUE, lw=1.6)
    inner = Rectangle((3.56, 1.18), 4.25, 1.83, fill=False, ec=TEAL, lw=1.6)
    ax.add_patch(outer)
    ax.add_patch(inner)
    ax.text(1.74, 3.12, "Computer, 30 or 60 Hz (outer loop)", ha="center",
            va="bottom", fontsize=11.5, weight="bold", color=BLUE)
    ax.text(5.68, 3.12, "Servo firmware (inner loop, fast)", ha="center",
            va="bottom", fontsize=11.5, weight="bold", color=TEAL)
    outer_boxes = [(0.38, "target"), (1.43, "controller"), (2.48, "goal")]
    for x, text in outer_boxes:
        draw_box(ax, (x, 1.82), 0.72, 0.55, text, edge=BLUE, face="#eff6ff", fontsize=10.5)
    add_arrow(ax, (1.10, 2.095), (1.40, 2.095), BLUE)
    add_arrow(ax, (2.15, 2.095), (2.45, 2.095), BLUE)
    servo_boxes = [
        (3.74, 0.83, "gap = goal\n- encoder"), (4.63, 0.62, "P/D"),
        (5.37, 0.67, "motor\npower"), (6.16, 0.86, "motor +\ngearbox"),
        (7.12, 0.53, "joint"),
    ]
    for x, width, text in servo_boxes:
        draw_box(ax, (x, 1.84), width, 0.5, text, edge=TEAL, face="#ecfdf5", fontsize=9.7)
    for start, end in [(4.57, 4.61), (5.25, 5.35), (6.04, 6.14), (7.04, 7.10)]:
        add_arrow(ax, (start, 2.09), (end, 2.09), TEAL, lw=1.3, mutation_scale=10)
    add_arrow(ax, (3.20, 2.08), (3.70, 2.08), BLUE)
    draw_box(ax, (6.72, 0.42), 0.98, 0.48, "encoder\n(ticks)", edge=PURPLE,
             face="#f5f3ff", fontsize=10)
    add_arrow(ax, (7.38, 1.82), (7.22, 0.92), PURPLE, connectionstyle="angle3,angleA=-90,angleB=180")
    ax.plot([6.72, 5.00, 5.00], [0.66, 0.66, 1.80], color=PURPLE, lw=1.3)
    add_arrow(ax, (5.00, 1.12), (5.00, 1.80), PURPLE, lw=1.3)
    ax.plot([7.70, 7.83, 7.83, 1.78], [0.66, 0.66, 0.20, 0.20], color=PURPLE, lw=1.2)
    add_arrow(ax, (1.78, 0.20), (1.78, 1.78), PURPLE, lw=1.2)
    ax.text(3.82, 0.17, "encoder feedback", ha="center", va="bottom", fontsize=9.5, color=MUTED)
    fig.suptitle("Two feedback loops run at different speeds", x=0.04, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.99, top=0.80, bottom=0.06)
    save_figure(fig, "two-loops.png")


def servo_inside():
    fig, ax = plt.subplots(figsize=(8, 5.0))
    setup_diagram(ax, (0, 8), (0, 5))
    case = Rectangle((0.48, 0.76), 6.65, 3.75, facecolor="#f9fafb", edgecolor=INK, lw=1.8)
    ax.add_patch(case)
    ax.text(0.68, 4.27, "case", fontsize=11, weight="bold", color=INK)
    draw_box(ax, (0.82, 2.55), 1.12, 0.88, "DC motor", edge=ORANGE,
             face="#fff7ed", fontsize=11)
    draw_box(ax, (2.28, 2.44), 1.44, 1.08, "gear train", edge=BLUE,
             face="#eff6ff", fontsize=11)
    ax.add_patch(Rectangle((3.72, 2.82), 2.20, 0.22, facecolor=LIGHT_BLUE,
                           edgecolor=INK, lw=1.0))
    ax.text(4.70, 3.24, "output shaft", ha="center", fontsize=10.5, color=INK)
    ax.add_patch(Circle((5.08, 2.93), 0.18, facecolor=YELLOW, edgecolor=INK, lw=1.0))
    ax.text(5.08, 2.54, "magnet on\nthe shaft", ha="center", va="top", fontsize=9.8)
    draw_box(ax, (5.80, 3.30), 0.94, 0.55, "magnetic\nencoder chip", edge=PURPLE,
             face="#f5f3ff", fontsize=9.5)
    draw_box(ax, (2.32, 1.02), 2.34, 0.82, "control board\nMCU runs P/D loop", edge=TEAL,
             face="#ecfdf5", fontsize=10.5)
    add_arrow(ax, (1.96, 2.98), (2.24, 2.98), ORANGE)
    add_arrow(ax, (3.74, 2.98), (3.95, 2.98), BLUE)
    add_arrow(ax, (5.38, 3.98), (5.88, 3.84), PURPLE, connectionstyle="arc3,rad=-0.2")
    ax.plot([4.66, 5.08], [1.72, 2.74], color=TEAL, lw=1.2, ls="--")
    ax.plot([5.08, 6.24], [2.74, 2.74], color=TEAL, lw=1.2, ls="--")
    draw_box(ax, (5.80, 1.02), 1.18, 0.82,
             "serial bus\ncommands in: goal\nreadings out: position", edge=MUTED,
             face="white", fontsize=8.8)
    add_arrow(ax, (4.70, 1.43), (5.76, 1.43), TEAL)
    ax.text(3.95, 0.36, "Simplified cutaway of a smart servo", ha="center",
            fontsize=10.5, color=MUTED)
    fig.suptitle("Inside a smart servo (STS3215, simplified)", x=0.05, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.98, top=0.88, bottom=0.04)
    save_figure(fig, "servo-inside.png")


def calibration_columns():
    fig, ax = plt.subplots(figsize=(8, 5.0))
    setup_diagram(ax, (0, 8), (0, 5))
    ax.text(1.95, 4.82, "What LeRobot calibration stores\n(per motor)", ha="center",
            va="center", fontsize=12.5, weight="bold", color=INK)
    ax.text(5.95, 4.82, "What the controllers needed", ha="center",
            va="center", fontsize=12.5, weight="bold", color=TEAL)
    left = ["id", "drive_mode", "homing_offset", "range_min", "range_max"]
    right = ["stiffness kp", "damping d", "dead time", "dead band",
             "dry friction", "gravity by pose", "servo lag"]
    for index, text in enumerate(left):
        y = 3.88 - index * 0.72
        draw_box(ax, (0.62, y), 2.66, 0.52, text, edge="#9ca3af", face="#f3f4f6",
                 fontsize=11)
    for index, text in enumerate(right):
        y = 4.08 - index * 0.55
        draw_box(ax, (4.52, y), 2.86, 0.43, text, edge=TEAL, face="white",
                 fontsize=11, linewidth=1.5)
    ax.text(3.90, 2.45, "≠", fontsize=26, ha="center", va="center", color=MUTED)
    fig.suptitle("Calibration fields do not describe servo dynamics", x=0.05, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.97, top=0.91, bottom=0.04)
    save_figure(fig, "calibration-columns.png")


def error_vs_kp():
    kp = np.linspace(8, 60, 400)
    error = 32.2 * (13.64 / kp) + 5.0
    all_scaled = 37.2 * 13.64 / kp
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.plot(kp, error, color=TEAL, lw=2.5, label=r"$e(k_p)=32.2(13.64/k_p)+5.0$")
    ax.plot(kp, all_scaled, color=LIGHT_BLUE, lw=1.8, ls=":",
            label=r"if all error scaled with $1/k_p$: $37.2(13.64/k_p)$")
    ax.axhline(5.0, color=ORANGE, lw=1.5, ls="--",
               label="goal hold, does not depend on kp")
    points = [
        (13.64, 37.2, "nominal", BLUE, (16.5, 13.0)),
        (12.31, 40.5, "weak_supply", RED, (16.0, 47.0)),
        (22.1, 24.8, "stiff_servo", PURPLE, (29.0, 33.0)),
    ]
    for x, y, label, color, offset in points:
        ax.scatter(x, y, s=55, color=color, edgecolor="white", linewidth=0.7, zorder=4)
        ax.annotate(f"{label} ({x:g}, {y:g})", (x, y), xytext=offset,
                    textcoords="data", fontsize=10, color=INK,
                    arrowprops={"arrowstyle": "->", "color": color, "lw": 1.2,
                                "shrinkA": 4, "shrinkB": 5})
    ax.set_xlim(8, 60)
    ax.set_ylim(0, 66)
    ax.set_xlabel(r"servo stiffness $k_p$ (N m/rad)")
    ax.set_ylabel("tracking error (mrad)")
    ax.set_title("A stiffer servo cannot remove every error", loc="left", pad=12, weight="bold")
    clean_axis(ax, "y")
    ax.legend(loc="upper right", fontsize=9.5)
    fig.text(0.125, 0.035, "Simulation, Out of the box controller.",
             fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.97, top=0.88, bottom=0.17)
    save_figure(fig, "error-vs-kp.png")


def three_delays():
    fig, axes = plt.subplots(2, 1, figsize=(8, 6.0))
    t = np.linspace(0, 450, 901)
    dead_time = 33.0
    tau = 95.0
    response = np.where(t < dead_time, 0.0,
                        100 * (1 - np.exp(-(t - dead_time) / tau)))
    axes[0].axvspan(0, dead_time, color=YELLOW, alpha=0.24)
    axes[0].plot(t, response, color=BLUE, lw=2.2, label="joint response")
    axes[0].axhline(100, color=MUTED, lw=1.2, ls="--", label="goal")
    axes[0].axvline(dead_time, color=ORANGE, lw=1.2, ls=":")
    axes[0].scatter([dead_time + tau], [63.2], color=TEAL, zorder=4)
    axes[0].annotate("dead time\n33 ms", (16, 8), ha="center", fontsize=10, color=INK)
    axes[0].annotate("lag\n95 ms to 63%", (dead_time + tau, 63.2),
                     xytext=(42, -28), textcoords="offset points", fontsize=10,
                     arrowprops={"arrowstyle": "->", "color": TEAL}, color=TEAL)
    axes[0].set_xlim(-15, 450)
    axes[0].set_ylim(-5, 112)
    axes[0].set_ylabel("response (% of goal)")
    axes[0].set_xlabel("time after goal step (ms)")
    axes[0].legend(loc="lower right", fontsize=9.5)
    clean_axis(axes[0], "y")

    t2 = np.linspace(0, 300, 1201)
    target = 0.45 * t2
    axes[1].plot(t2, target, color=INK, lw=1.8, label="ramp target")
    for period, color, label in [(1000 / 30, BLUE, "goal hold, 30 Hz"),
                                 (1000 / 60, TEAL, "goal hold, 60 Hz")]:
        updates = np.arange(0, 300 + period, period)
        held = 0.45 * updates
        valid = updates <= 300
        axes[1].step(updates[valid], held[valid], where="post", color=color,
                     lw=1.6, label=label)
    axes[1].text(0.02, 0.91,
                 "Average goal age: 16.7 ms at 30 Hz; 8.3 ms at 60 Hz",
                 transform=axes[1].transAxes, va="top", fontsize=10.2, color=INK,
                 bbox={"facecolor": "white", "edgecolor": GRID, "boxstyle": "round,pad=0.3"})
    axes[1].set_xlim(0, 300)
    axes[1].set_ylabel("target angle (mrad)")
    axes[1].set_xlabel("time (ms)")
    axes[1].legend(loc="lower right", fontsize=9.5, ncol=3)
    clean_axis(axes[1], "y")
    fig.suptitle("Dead time, servo lag, and goal hold are different delays", x=0.08, y=0.99,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.12, right=0.98, top=0.88, bottom=0.09, hspace=0.37)
    save_figure(fig, "three-delays.png")


def dead_time_ranges():
    labels = ["step test (real arm)", "per-joint servo fit (real arm)", "first simulator"]
    ranges = [(31, 36), (15.6, 26.6), (0, 0)]
    y = np.arange(3)
    fig, ax = plt.subplots(figsize=(8, 3.8))
    for yi, (lo, hi) in zip(y, ranges):
        if hi == lo:
            ax.scatter([lo], [yi], s=90, color=LIGHT_BLUE, edgecolor=INK, zorder=3)
            ax.text(lo + 1.1, yi, "about 0", va="center", fontsize=11)
        else:
            ax.hlines(yi, lo, hi, color=TEAL if yi == 1 else BLUE, linewidth=8, zorder=3)
            ax.vlines([lo, hi], yi - 0.14, yi + 0.14,
                      color=TEAL if yi == 1 else BLUE, linewidth=1.5)
            ax.text((lo + hi) / 2, yi - 0.27, f"{lo:g} to {hi:g}",
                    ha="center", va="bottom", fontsize=11)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(-3, 43)
    ax.set_ylim(2.65, -0.65)
    ax.set_xlabel("dead time (ms)")
    ax.set_title("Measured dead time differs from the first simulator", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.34, right=0.97, top=0.85, bottom=0.18)
    save_figure(fig, "dead-time-ranges.png")


def lag_on_path():
    path = DATA_ROOT / "blog-renders/media/blog-renders/inputs/cat-direct.npz"
    with np.load(path) as data:
        time_all = data["time_s"]
        q_all = data["q"][:, 1]
        target_all = data["target_q"][:, 1]
    duration = 6.0
    sample_step = float(np.median(np.diff(time_all)))
    starts = np.arange(time_all[0], time_all[-1] - duration, sample_step)
    start = max(starts, key=lambda value: np.ptp(
        q_all[(time_all >= value) & (time_all <= value + duration)]))
    end = start + duration
    mask = (time_all >= start) & (time_all <= end)
    time = time_all[mask]
    q = q_all[mask]
    target = target_all[mask]
    dt = float(np.median(np.diff(time)))
    uniform_time = np.arange(time[0], time[-1], dt)
    target_uniform = np.interp(uniform_time, time, target)
    q_uniform = np.interp(uniform_time, time, q)
    target_velocity = np.gradient(target_uniform, dt)
    q_velocity = np.gradient(q_uniform, dt)
    target_velocity -= target_velocity.mean()
    q_velocity -= q_velocity.mean()
    corr = np.correlate(q_velocity, target_velocity, mode="full")
    lags = np.arange(-len(target_velocity) + 1, len(target_velocity))
    allowed = np.abs(lags) <= int(0.75 / dt)
    lag_samples = int(lags[allowed][np.argmax(corr[allowed])])
    lag_s = lag_samples * dt
    print(f"lag-on-path cross-correlation: shoulder_lift is about {lag_s * 1000:.0f} ms late")

    fig, ax = plt.subplots(figsize=(8, 4.5))
    relative_time = time - start
    ax.plot(relative_time, np.rad2deg(target), color=BLUE, lw=1.8, label="target")
    ax.plot(relative_time, np.rad2deg(q), color=ORANGE, lw=1.6, label="shoulder_lift")
    feature_time = float(relative_time[np.argmax(np.abs(np.gradient(target, dt)))])
    delayed_feature_time = feature_time + lag_s
    y_annot = np.nanmax(np.rad2deg(target)) + 2.0
    if lag_s > 0:
        ax.annotate("", xy=(delayed_feature_time, y_annot), xytext=(feature_time, y_annot),
                    arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 1.6})
        ax.text((feature_time + delayed_feature_time) / 2, y_annot + 2.5,
                f"about {abs(lag_s) * 1000:.0f} ms late", ha="center",
                fontsize=10, color=PURPLE)
    else:
        ax.text(0.5, 0.88, "Target and joint velocity align in this window",
                transform=ax.transAxes, fontsize=10, color=PURPLE,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.set_xlim(0, 6)
    ax.set_xlabel("time (s)")
    ax.set_ylabel("shoulder_lift angle (degrees)")
    ax.set_title("Real arm, direct control: the joint runs behind the target",
                 loc="left", pad=12, weight="bold")
    ax.legend(loc="lower right", fontsize=10)
    clean_axis(ax, "y")
    fig.subplots_adjust(left=0.13, right=0.98, top=0.85, bottom=0.17)
    save_figure(fig, "lag-on-path.png")


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


FIGURES = [pid_parts, two_loops, servo_inside, calibration_columns, error_vs_kp, three_delays, dead_time_ranges, lag_on_path, worn_hold_motion, friction_models, heat_torque, torque_limit, constants_dumbbell, speed_coupling]
