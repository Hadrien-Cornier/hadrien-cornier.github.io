"""Figures for SO-101 part 3: content/robotics/so101-3-choosing-the-goal.md.

Run: python3 scripts/so101_figures.py 3
"""

from so101_common import *  # noqa: F401,F403


def map_errors():
    labels = [
        "Cat motion: direct, 30 Hz", "Cat motion: pi, 60 Hz",
        "Cat motion: solve, 60 Hz", "Cat motion: mpc, 60 Hz",
        "Signature motion: direct", "Signature motion: lead",
        "Signature motion: inv",
    ]
    values = [22.5, 8.4, 6.2, 6.0, 28.3, 23.7, 13.4]
    controllers = ["direct", "pi", "solve", "mpc", "direct", "lead", "inv"]
    y = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.barh(y, values, height=0.64,
            color=[CONTROLLER[name] for name in controllers], zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 34)
    ax.set_xlabel("RMS tracking error (mrad)")
    ax.set_title("Real arm: tracking error by controller", loc="left", pad=13, weight="bold")
    ax.axhline(3.5, color=GRID, lw=1.2)
    for yi, value in zip(y, values):
        ax.text(value + 0.55, yi, f"{value:.1f}", va="center", fontsize=11, color=INK)
    clean_axis(ax, "x")
    fig.text(0.125, 0.035, "RMS over all 5 joints and the whole motion.",
             fontsize=11, color=MUTED)
    fig.subplots_adjust(left=0.34, right=0.96, top=0.86, bottom=0.16)
    save_figure(fig, "map-errors.png")


def inv_goal():
    root = DATA_ROOT / "hw-ready/runs/so101-replay"
    records = [
        ("direct", root / "20261003-194838-live/01-direct.npz"),
        ("inv", root / "20261003-195246-live/01-inv.npz"),
    ]
    fig, axes = plt.subplots(2, 1, figsize=(8, 6.0), sharex=True)
    for ax, (controller, path) in zip(axes, records):
        with np.load(path) as data:
            t_all = data["time_s"]
            mask = (t_all >= 62) & (t_all <= 66)
            t = t_all[mask] - 62
            target = np.rad2deg(data["target_q"][mask, 1])
            q = np.rad2deg(data["q"][mask, 1])
            goal = np.rad2deg(data["goal_sent"][mask, 1])
        if controller == "direct":
            ax.plot(t, goal, color=TEAL, lw=1.6, label="goal_sent")
            ax.plot(t, target, color=BLUE, lw=1.7, ls="--", label="target", zorder=4)
        else:
            ax.plot(t, target, color=BLUE, lw=1.7, label="target")
            ax.plot(t, goal, color=TEAL, lw=1.6, label="goal_sent")
        ax.plot(t, q, color=ORANGE, lw=1.6, label="shoulder_lift")
        ax.set_ylabel("angle (degrees)")
        ax.set_title(controller, loc="left", fontsize=11.5, weight="bold", color=CONTROLLER[controller])
        clean_axis(ax, "y")
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=3, fontsize=9.5,
               bbox_to_anchor=(0.55, 0.93), frameon=False)
    axes[1].set_xlabel("time (s), window starts at 62 s")
    fig.suptitle("inv puts the goal ahead of the target", x=0.08, y=0.99,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.11, right=0.98, top=0.82, bottom=0.11, hspace=0.30)
    save_figure(fig, "inv-goal.png")


def pi_five():
    fig, ax = plt.subplots(figsize=(8, 4.5))
    setup_diagram(ax, (0, 8), (0, 4.5))
    ax.text(4, 4.03, "A gap split across the inner and outer loops", ha="center",
            fontsize=13, weight="bold", color=INK)
    segments = [(0.40, 1.34, "e servo spring", LIGHT_BLUE),
                (1.80, 3.52, "4e\nouter P", BLUE),
                (5.40, 2.20, "offset", PALE)]
    for x, width, label, color in segments:
        ax.add_patch(Rectangle((x, 2.43), width, 0.73, facecolor=color,
                               edgecolor=INK, lw=1.1))
        ax.text(x + width / 2, 2.79, label, ha="center", va="center",
                fontsize=11, color="white" if color == BLUE else INK, weight="bold")
    ax.text(0.40, 2.06, "gap = e", fontsize=10, color=MUTED)
    ax.text(1.80, 2.06, "+ 4e", fontsize=10, color=MUTED)
    ax.text(5.40, 2.06, "+ offset", fontsize=10, color=MUTED)
    ax.text(4, 1.24, "goal - q = 5e + offset", ha="center", fontsize=15,
            weight="bold", color=INK)
    ax.text(4, 0.54,
            "stiffness against a missing torque: 13.64 × 5 = 68.2 N m/rad",
            ha="center", fontsize=12, color=TEAL)
    fig.suptitle("The outer P loop multiplies the apparent servo stiffness", x=0.06, y=0.98,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.97, top=0.82, bottom=0.06)
    save_figure(fig, "pi-five.png")


def deadband_cost():
    goal = np.linspace(80, 170, 901)
    joint, target, deadband = 100.0, 115.0, 10.0
    next_position = np.where(np.abs(goal - joint) <= deadband,
                             joint, goal - deadband * np.sign(goal - joint))
    cost = (next_position - target) ** 2
    fig, ax = plt.subplots(figsize=(8, 4.6))
    ax.plot(goal, cost, color=BLUE, lw=2.3)
    ax.axvspan(90, 110, color=YELLOW, alpha=0.22)
    ax.scatter([125], [0], color=RED, s=75, zorder=4)
    ax.annotate("minimum at 125 mrad", (125, 0), xytext=(15, 28),
                textcoords="offset points", fontsize=10.5, color=RED,
                arrowprops={"arrowstyle": "->", "color": RED})
    ax.annotate("flat: a gradient method\nstarting here does not move",
                xy=(100, 225), xytext=(82, 620), fontsize=10.2, color=INK,
                arrowprops={"arrowstyle": "->", "color": MUTED})
    ax.set_xlim(80, 170)
    ax.set_ylim(-45, 1250)
    ax.set_xlabel("constant goal (mrad)")
    ax.set_ylabel("cost after one step (mrad²)")
    ax.set_title("A dead band makes the goal search locally flat", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax, "y")
    fig.subplots_adjust(left=0.14, right=0.97, top=0.86, bottom=0.17)
    save_figure(fig, "deadband-cost.png")


def real_arm_joints():
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.7), gridspec_kw={"width_ratios": [2.4, 1]})
    joints = ["pan", "lift", "elbow", "wrist flex", "roll"]
    values = {
        "pi": [6.6, 10.8, 11.0, 7.0, 4.9],
        "solve": [3.2, 7.4, 6.7, 8.7, 2.8],
        "mpc": [3.0, 7.0, 6.1, 8.6, 2.8],
    }
    ax = axes[0]
    x = np.arange(len(joints))
    width = 0.24
    for index, name in enumerate(["pi", "solve", "mpc"]):
        bars = ax.bar(x + (index - 1) * width, values[name], width,
                      color=CONTROLLER[name], label=name)
        for bar_index, bar in enumerate(bars):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.2,
                    f"{bar.get_height():g}", ha="center", va="bottom", fontsize=7.8)
    ax.set_xticks(x, joints, rotation=0)
    ax.set_ylabel("RMS tracking error (mrad)")
    ax.set_ylim(0, 14.2)
    ax.legend(loc="upper left", ncol=3, fontsize=9)
    clean_axis(ax, "y")
    ax = axes[1]
    speed_names = ["pi", "solve", "mpc"]
    speeds = [11.7, 14.2, 13.4]
    bars = ax.bar(np.arange(3), speeds, color=[CONTROLLER[n] for n in speed_names], width=0.65)
    ax.set_xticks(np.arange(3), speed_names)
    ax.set_ylim(0, 17.5)
    ax.set_ylabel("RMS error, fastest speed bin (mrad)")
    ax.set_title("At the fastest speeds", fontsize=11.5, weight="bold")
    for bar, value in zip(bars, speeds):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 0.35, f"{value:g}",
                ha="center", fontsize=10)
    clean_axis(ax, "y")
    fig.suptitle("Real arm, cat motion, 60 Hz", x=0.07, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.11, right=0.98, top=0.84, bottom=0.18, wspace=0.45)
    save_figure(fig, "real-arm-joints.png")


def sim_five():
    labels = ["Out of the box", "Classical model + PID", "Neural network",
              "Fitted servo model", "Exact model"]
    values = [37.2, 1.117, 0.446, 0.398, 0.398]
    colors = [MODEL["Out of the box"], MODEL["Classical"], RED,
              MODEL["Fitted"], MODEL["Exact"]]
    y = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    ax.barh(y, values, color=colors, height=0.62, zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xscale("log")
    ax.set_xlim(0.25, 70)
    ax.axvline(0.443, color=ORANGE, ls="--", lw=1.7, label="one-reading rounding RMS")
    for yi, value in zip(y, values):
        if value < 0.443:
            ax.text(0.443 * 1.13, yi, f"{value:g}", va="center", ha="left",
                    fontsize=10.5, color=INK,
                    bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0},
                    zorder=5)
        else:
            ax.text(value * (0.93 if value > 20 else 1.08), yi, f"{value:g}",
                va="center", ha="right" if value > 20 else "left", fontsize=10.5)
    ax.text(0.443 * 1.13, 4.42, "0.443", fontsize=9.5, color=ORANGE,
            ha="left", bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.set_xlabel("RMS tracking error (mrad, log scale)")
    ax.set_title("A model-based controller approaches the rounding floor",
                 loc="left", pad=12, weight="bold", fontsize=12.2)
    ax.legend(loc="lower right", fontsize=9.5)
    clean_axis(ax, "x")
    fig.text(0.31, 0.035, "Simulation, frozen test, 96 paths.", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.31, right=0.97, top=0.86, bottom=0.17)
    save_figure(fig, "sim-five.png")


def hold_torque():
    kp = 13.64
    speed = 0.84
    duration_ms = 33.0
    final_torque = 0.886
    start_torque = 1.27
    time_ms = np.linspace(0, duration_ms, 300)
    torque = start_torque - (start_torque - final_torque) * time_ms / duration_ms
    classical = np.full_like(time_ms, final_torque)
    fig, ax = plt.subplots(figsize=(8, 4.6))
    ax.plot(time_ms, torque, color=TEAL, lw=2.4,
            label=r"servo torque $k_p(goal-q(t))$")
    ax.plot(time_ms, classical, color=BLUE, lw=1.8, ls="--",
            label="Classical assumption, 0.886 N m")
    ax.fill_between(time_ms, classical, torque, color=ORANGE, alpha=0.22,
                    label="extra torque Classical did not plan")
    ax.scatter([0, duration_ms], [start_torque, final_torque], color=[ORANGE, TEAL], zorder=4)
    ax.annotate("1.27 N m", (0, start_torque), xytext=(10, 8),
                textcoords="offset points", fontsize=10, color=ORANGE)
    ax.annotate("0.886 N m", (duration_ms, final_torque), xytext=(-78, -24),
                textcoords="offset points", fontsize=10, color=TEAL)
    ax.set_xlim(0, duration_ms)
    ax.set_ylim(0.78, 1.36)
    ax.set_xlabel("time inside the step (ms)")
    ax.set_ylabel("servo torque (N m)")
    ax.set_title("The servo torque changes during one held goal", loc="left",
                 pad=12, weight="bold")
    ax.legend(loc="upper right", fontsize=9.4)
    clean_axis(ax, "y")
    ax.text(0.02, 0.05, "Joint speed = 0.84 rad/s. The goal updates every 33 ms.",
            transform=ax.transAxes, fontsize=10, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.97, top=0.85, bottom=0.17)
    save_figure(fig, "hold-torque.png")


def known_timeline():
    rows = [
        ("1960", "Kalman filter", "observer, mpca"),
        ("1981", "computed torque", "Classical model + PID"),
        ("1984", "Arimoto iterative learning control", "ilc"),
        ("1987", "Slotine and Li adaptive control", "adapt, rls"),
        ("1990s-2000s", "MPC and offset-free MPC", "solve, mpc, mpca"),
    ]
    fig, ax = plt.subplots(figsize=(8, 5.2))
    setup_diagram(ax, (0, 10), (0, 6))
    ax.text(0.35, 5.52, "Year", fontsize=11, weight="bold", color=MUTED)
    ax.text(2.20, 5.52, "Method", fontsize=11, weight="bold", color=MUTED)
    ax.text(7.10, 5.52, "Lab controllers", fontsize=11, weight="bold", color=MUTED)
    ax.plot([0.30, 9.70], [5.35, 5.35], color=GRID, lw=1.2)
    for index, (year, method, lab) in enumerate(rows):
        y = 4.85 - index * 0.88
        ax.text(0.35, y, year, fontsize=11, color=INK, va="center", weight="bold")
        ax.text(2.20, y, method, fontsize=11, color=INK, va="center")
        ax.text(7.10, y, f"lab: {lab}", fontsize=11, color=MUTED, va="center")
        if index < len(rows) - 1:
            ax.plot([0.30, 9.70], [y - 0.43, y - 0.43], color=GRID, lw=0.8)
    ax.text(0.35, 0.22, "Years are approximate.", fontsize=11, color=MUTED)
    fig.suptitle("Control methods behind the lab controllers", x=0.06, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.03, right=0.98, top=0.88, bottom=0.05)
    save_figure(fig, "known-timeline.png")


FIGURES = [map_errors, inv_goal, pi_five, deadband_cost, real_arm_joints, sim_five, hold_torque, known_timeline]
