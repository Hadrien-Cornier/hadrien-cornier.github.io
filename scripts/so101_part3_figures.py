"""Figures for SO-101 part 3: content/robotics/so101-3-choosing-the-goal.md.

Run: python3 scripts/so101_figures.py 3

Data extracts in scripts/so101_data/ (the source of each is stored in the file):
  inv-goal.npz               the 62 s to 66 s window of two real-arm recordings (inv_goal)
  blog-shake-results.json    results.json of studies/blog-shake, branch blog-renders of
                             robot-self-calibration (shake_test)
  blog-shake-traces.npz      the arrays of traces.npz that shake_test plots

Every figure is 6.4 in wide, so the text keeps its size on a phone.
"""

import json

from so101_common import *  # noqa: F401,F403


def _axes(fig, left, top, width, height, **kwargs):
    """Add an axes placed in inches, measured from the top-left corner of the figure."""
    fig_w, fig_h = fig.get_size_inches()
    return fig.add_axes([left / fig_w, 1 - (top + height) / fig_h,
                         width / fig_w, height / fig_h], **kwargs)


def _text(fig, x, y, text, **kwargs):
    """Add figure text placed in inches, measured from the top-left corner of the figure."""
    fig_w, fig_h = fig.get_size_inches()
    return fig.text(x / fig_w, 1 - y / fig_h, text, **kwargs)


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
    fig = plt.figure(figsize=(6.4, 5.0))
    ax = _axes(fig, 2.35, 0.55, 3.95, 3.15)
    ax.barh(y, values, height=0.64,
            color=[CONTROLLER[name] for name in controllers], zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 34)
    ax.set_xticks(range(0, 35, 5))
    ax.set_xlabel("RMS tracking error (mrad)")
    ax.set_title("Real arm: tracking error by controller", loc="left", pad=12,
                 x=-0.59)
    ax.axhline(3.5, color=GRID, lw=1.4)
    for yi, value in zip(y, values):
        ax.text(value + 0.55, yi, f"{value:.1f}", va="center", color=INK,
                bbox=chalk.label_box(pad=0.15), zorder=5)
    clean_axis(ax, "x")
    _text(fig, 0.15, 4.7, "RMS over all 5 joints and the whole motion.", color=MUTED)
    save_figure(fig, "map-errors.png")


def _load_inv_goal(controller):
    """The 62 s to 66 s window of one recording: time from 62 s, and angles in degrees."""
    with np.load(DATA_DIR / "inv-goal.npz") as data:
        t = data[f"{controller}_time_s"] - 62
        target = np.rad2deg(data[f"{controller}_target_q"])
        q = np.rad2deg(data[f"{controller}_q"])
        goal = np.rad2deg(data[f"{controller}_goal_sent"])
    return t, target, q, goal


def inv_goal():
    fig = plt.figure(figsize=(6.4, 6.3))
    top_ax = _axes(fig, 0.95, 1.35, 5.3, 2.0)
    bottom_ax = _axes(fig, 0.95, 3.95, 5.3, 2.0, sharex=top_ax)
    for ax, controller in zip((top_ax, bottom_ax), ("direct", "inv")):
        t, target, q, goal = _load_inv_goal(controller)
        if controller == "direct":
            ax.plot(t, goal, color=TEAL, lw=2.4, label="goal_sent")
            ax.plot(t, target, color=BLUE, lw=2.4, ls="--", label="target", zorder=4)
        else:
            ax.plot(t, target, color=BLUE, lw=2.4, label="target")
            ax.plot(t, goal, color=TEAL, lw=2.4, label="goal_sent")
        ax.plot(t, q, color=ORANGE, lw=2.4, label="shoulder_lift")
        ax.set_ylabel("angle (degrees)")
        if controller == "direct":
            ax.set_yticks([25, 27.5, 30, 32.5, 35])
        ax.set_title(controller, loc="left", color=CONTROLLER[controller])
        clean_axis(ax, "y")
    top_ax.tick_params(labelbottom=False)
    handles, labels = top_ax.get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=3,
               bbox_to_anchor=(0.5, 1 - 0.55 / 6.3), frameon=False)
    bottom_ax.set_xlabel("time (s), window starts at 62 s")
    fig.suptitle("inv puts the goal ahead of the target", x=0.03, y=0.995,
                 ha="left", color=YELLOW)
    save_figure(fig, "inv-goal.png")


def pi_five():
    fig = plt.figure(figsize=(6.4, 4.5))
    ax = _axes(fig, 0.1, 0.85, 6.2, 3.55)
    setup_diagram(ax, (0, 8), (0, 4.6))
    ax.text(4, 4.22, "A gap split across the inner and outer loops", ha="center",
            color=INK)
    segments = [(0.40, 1.34, "e servo\nspring", LIGHT_BLUE, BOARD),
                (1.80, 3.52, "4e\nouter P", BLUE, BOARD),
                (5.40, 2.20, "offset", PALE, INK)]
    for x, width, label, color, text_color in segments:
        ax.add_patch(Rectangle((x, 2.50), width, 0.98, facecolor=color,
                               edgecolor=INK, lw=1.6))
        ax.text(x + width / 2, 2.99, label, ha="center", va="center",
                color=text_color, linespacing=1.15)
    ax.text(0.40, 2.12, "gap = e", color=MUTED, va="center")
    ax.text(1.80, 2.12, "+ 4e", color=MUTED, va="center")
    ax.text(5.40, 2.12, "+ offset", color=MUTED, va="center")
    ax.text(4, 1.36, "goal - q = 5e + offset", ha="center", va="center",
            fontsize=19, color=INK)
    ax.text(4, 0.50,
            "stiffness against a missing torque:\n13.64 × 5 = 68.2 N m/rad",
            ha="center", va="center", color=TEAL, linespacing=1.2)
    fig.suptitle("The outer P loop multiplies the\napparent servo stiffness",
                 x=0.03, y=0.995, ha="left", color=YELLOW)
    save_figure(fig, "pi-five.png")


def deadband_cost():
    goal = np.linspace(80, 170, 901)
    joint, target, deadband = 100.0, 115.0, 10.0
    next_position = np.where(np.abs(goal - joint) <= deadband,
                             joint, goal - deadband * np.sign(goal - joint))
    cost = (next_position - target) ** 2
    fig = plt.figure(figsize=(6.4, 4.6))
    ax = _axes(fig, 1.0, 0.6, 5.25, 3.1)
    ax.plot(goal, cost, color=BLUE, lw=2.6)
    ax.axvspan(90, 110, color=YELLOW, alpha=0.22, lw=0)
    ax.scatter([125], [0], color=RED, s=85, zorder=4, clip_on=False)
    ax.annotate("minimum at 125 mrad", (125, 0), xytext=(125, 330), ha="center",
                color=RED, bbox=chalk.label_box(),
                arrowprops={"arrowstyle": "->", "color": RED, "lw": 1.8})
    ax.annotate("flat: a gradient method\nstarting here does not move",
                xy=(100, 225), xytext=(112, 790), color=INK, bbox=chalk.label_box(),
                arrowprops={"arrowstyle": "->", "color": MUTED, "lw": 1.8})
    ax.set_xlim(80, 170)
    ax.set_ylim(-45, 1250)
    ax.set_xlabel("constant goal (mrad)")
    ax.set_ylabel("cost after one step (mrad²)")
    ax.set_title("A dead band makes the goal search locally flat", loc="left", pad=12,
                 x=-0.18)
    clean_axis(ax, "y")
    save_figure(fig, "deadband-cost.png")


def real_arm_joints():
    joints = ["pan", "lift", "elbow", "wrist flex", "roll"]
    values = {
        "pi": [6.6, 10.8, 11.0, 7.0, 4.9],
        "solve": [3.2, 7.4, 6.7, 8.7, 2.8],
        "mpc": [3.0, 7.0, 6.1, 8.6, 2.8],
    }
    fig = plt.figure(figsize=(6.4, 7.75))
    ax = _axes(fig, 0.95, 1.2, 5.3, 3.0)
    x = np.arange(len(joints))
    width = 0.27
    for index, name in enumerate(["pi", "solve", "mpc"]):
        bars = ax.bar(x + (index - 1) * width, values[name], width,
                      color=CONTROLLER[name], label=name)
        for bar_index, bar in enumerate(bars):
            ax.annotate(f"{bar.get_height():g}",
                        (bar.get_x() + bar.get_width() / 2, bar.get_height()),
                        xytext=(0, 4), textcoords="offset points", ha="center",
                        va="bottom", fontsize=13.5, bbox=chalk.label_box(pad=0.1),
                        zorder=5)
    ax.set_xticks(x, joints, rotation=0)
    ax.set_ylabel("RMS tracking error (mrad)")
    ax.set_ylim(0, 14.2)
    ax.set_yticks(range(0, 15, 2))
    ax.legend(loc="lower left", ncol=3, bbox_to_anchor=(0.0, 1.0),
              handlelength=1.2, columnspacing=1.2, borderaxespad=0.3)
    clean_axis(ax, "y")
    ax = _axes(fig, 1.55, 5.05, 4.7, 2.3)
    speed_names = ["pi", "solve", "mpc"]
    speeds = [11.7, 14.2, 13.4]
    bars = ax.bar(np.arange(3), speeds, color=[CONTROLLER[n] for n in speed_names], width=0.65)
    ax.set_xticks(np.arange(3), speed_names)
    ax.set_ylim(0, 17.5)
    ax.set_yticks(range(0, 17, 2))
    ax.set_ylabel("RMS error, fastest\nspeed bin (mrad)")
    ax.set_title("At the fastest speeds", x=-0.3)
    for bar, value in zip(bars, speeds):
        ax.annotate(f"{value:g}", (bar.get_x() + bar.get_width() / 2, value),
                    xytext=(0, 4), textcoords="offset points", ha="center",
                    va="bottom", bbox=chalk.label_box(pad=0.1), zorder=5)
    clean_axis(ax, "y")
    fig.suptitle("Real arm, cat motion, 60 Hz", x=0.03, y=0.995,
                 ha="left", color=YELLOW)
    save_figure(fig, "real-arm-joints.png")


def sim_five():
    labels = ["Out of the box", "Classical model + PID", "Neural network",
              "Fitted servo model", "Exact model"]
    values = [37.2, 1.117, 0.446, 0.398, 0.398]
    colors = [MODEL["Out of the box"], MODEL["Classical"], RED,
              MODEL["Fitted"], MODEL["Exact"]]
    y = np.arange(len(labels))
    fig = plt.figure(figsize=(6.4, 5.45))
    ax = _axes(fig, 2.2, 0.85, 4.05, 3.15)
    ax.barh(y, values, color=colors, height=0.62, zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xscale("log")
    ax.set_xlim(0.25, 70)
    ax.set_ylim(5.0, -0.55)
    ax.axvline(0.443, color=ORANGE, ls="--", lw=2.2, label="one-reading rounding RMS")
    for yi, value in zip(y, values):
        if value < 0.443:
            ax.text(0.443 * 1.13, yi, f"{value:g}", va="center", ha="left",
                    color=INK, bbox=chalk.label_box(), zorder=5)
        elif value > 20:
            ax.text(value * 0.93, yi, f"{value:g}", va="center", ha="right",
                    color=BOARD, zorder=5)
        else:
            ax.text(value * 1.08, yi, f"{value:g}", va="center", ha="left",
                    color=INK, zorder=5)
    ax.text(0.443 * 1.13, 4.62, "0.443", color=ORANGE, ha="left", va="center",
            bbox=chalk.label_box(), zorder=5)
    ax.set_xlabel("RMS tracking error (mrad, log scale)")
    ax.set_title("A model-based controller\napproaches the rounding floor",
                 loc="left", pad=12, x=-0.5)
    ax.legend(loc="lower right", frameon=True, facecolor=BOARD, edgecolor="none",
              framealpha=1.0)
    clean_axis(ax, "x")
    _text(fig, 0.15, 5.2, "Simulation, frozen test, 96 paths.", color=MUTED)
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
    fig = plt.figure(figsize=(6.4, 6.45))
    ax = _axes(fig, 1.0, 0.7, 5.25, 3.0)
    ax.plot(time_ms, torque, color=TEAL, lw=3.0,
            label=r"servo torque $k_p(goal-q(t))$")
    ax.plot(time_ms, classical, color=BLUE, lw=2.4, ls="--",
            label="Classical assumption, 0.886 N m")
    ax.fill_between(time_ms, classical, torque, color=ORANGE, alpha=0.4, lw=0,
                    label="extra torque Classical did not plan")
    ax.scatter([0, duration_ms], [start_torque, final_torque], color=[ORANGE, TEAL],
               zorder=4, s=60, clip_on=False)
    ax.annotate("1.27 N m", (0, start_torque), xytext=(10, 8),
                textcoords="offset points", color=ORANGE, bbox=chalk.label_box())
    ax.annotate("0.886 N m", (duration_ms, final_torque), xytext=(-84, -26),
                textcoords="offset points", color=TEAL, bbox=chalk.label_box())
    ax.set_xlim(0, duration_ms)
    ax.set_ylim(0.78, 1.36)
    ax.set_xlabel("time inside the step (ms)")
    ax.set_ylabel("servo torque (N m)")
    ax.set_title("The servo torque changes during one held goal", loc="left",
                 pad=12, x=-0.18)
    handles, legend_labels = ax.get_legend_handles_labels()
    fig.legend(handles, legend_labels, loc="upper left",
               bbox_to_anchor=(0.9 / 6.4, 1 - 4.55 / 6.45), frameon=False,
               handlelength=2.0, labelspacing=0.3)
    clean_axis(ax, "y")
    _text(fig, 0.15, 6.2,
          "Joint speed = 0.84 rad/s. The goal updates every 33 ms.", color=MUTED)
    save_figure(fig, "hold-torque.png")


def known_timeline():
    rows = [
        ("1960", "Kalman filter", "observer, mpca"),
        ("1981", "computed torque", "Classical model\n+ PID"),
        ("1984", "Arimoto iterative\nlearning control", "ilc"),
        ("1987", "Slotine and Li\nadaptive control", "adapt, rls"),
        ("1990s-2000s", "MPC and offset-free\nMPC", "solve, mpc, mpca"),
    ]
    fig = plt.figure(figsize=(6.4, 5.5))
    ax = _axes(fig, 0.0, 0.7, 6.4, 4.5)
    setup_diagram(ax, (0, 6.4), (0, 4.5))
    ax.text(0.2, 4.25, "Year", color=MUTED, va="center")
    ax.text(1.55, 4.25, "Method", color=MUTED, va="center")
    ax.text(4.1, 4.25, "Lab controllers", color=MUTED, va="center")
    ax.plot([0.15, 6.25], [3.95, 3.95], color=GRID, lw=1.6)
    pitch = 0.70
    for index, (year, method, lab) in enumerate(rows):
        y = 3.95 - pitch / 2 - index * pitch
        ax.text(0.2, y, year, color=INK, va="center")
        ax.text(1.55, y, method, color=INK, va="center", linespacing=1.0)
        lab_lines = lab.split("\n")
        lab_lines[0] = f"lab: {lab_lines[0]}"
        ax.text(4.1, y, "\n".join(lab_lines), color=MUTED, va="center", linespacing=1.0)
        if index < len(rows) - 1:
            ax.plot([0.15, 6.25], [y - pitch / 2, y - pitch / 2], color=GRID, lw=1.0)
    ax.text(0.2, 0.15, "Years are approximate.", color=MUTED, va="center")
    fig.suptitle("Control methods behind the lab controllers", x=0.03, y=0.995,
                 ha="left", color=YELLOW)
    save_figure(fig, "known-timeline.png")


def shake_test():
    results = json.loads((DATA_DIR / "blog-shake-results.json").read_text())
    traces = np.load(DATA_DIR / "blog-shake-traces.npz")
    colors = {"direct": MUTED, "pi": BLUE, "inv+pi": TEAL,
              "preview": ORANGE, "preview+payload": PURPLE}
    names = {"direct": "direct", "pi": "pi (integral)", "inv+pi": "inv + pi",
             "preview": "preview, no payload", "preview+payload": "preview + payload"}
    # Layout in inches, from the top: title, legend, then two blocks of a line plot
    # above a bar plot, then the note.
    line_left, line_width, line_height = 1.25, 5.0, 2.0
    bar_left, bar_width, bar_height = 1.95, 4.3, 1.9
    first_top = 1.95
    block = line_height + 0.95 + bar_height + 1.2
    note_top = first_top + 2 * block - 0.4
    height = note_top + 1.25
    fig = plt.figure(figsize=(6.4, height))
    line_axes = []
    for block_index, (shake, joint_name) in enumerate(
            (("vertical", "shoulder_lift"), ("horizontal", "shoulder_pan"))):
        joint = 1 if shake == "vertical" else 0
        top = first_top + block_index * block
        ax = _axes(fig, line_left, top, line_width, line_height)
        for controller in ("direct", "pi", "preview"):
            key = f"{shake}-1.0-{controller}"
            t = traces[f"{key}-t"]
            q = traces[f"{key}-q"]
            r = traces[f"{key}-r"]
            error = 1000 * (q[:-1] - r[1:])
            tt = t[1:]
            keep = (tt >= 4) & (tt < 6.5)
            ax.plot(tt[keep], error[keep], color=colors[controller], lw=2.4,
                    label=names[controller])
        # A thin guide line, in a different color from the gray "direct" series.
        ax.axhline(0, color=GRID, lw=1.3)
        ax.set_yticks([-100, -50, 0, 50, 100, 150] if shake == "vertical" else range(-100, 101, 25))
        ax.set_title(f"{shake.capitalize()} shake, {joint_name}, 1 Hz", loc="left",
                     pad=10, x=-(line_left - 0.15) / line_width)
        ax.set_xlabel("time (s)")
        ax.set_ylabel("joint minus target (mrad)")
        clean_axis(ax)
        line_axes.append(ax)
        ax = _axes(fig, bar_left, top + line_height + 0.95, bar_width, bar_height)
        rows = [row for row in results if row["shake"] == shake and row["freq_hz"] == 1.0]
        controllers = [row["controller"] for row in rows]
        y = np.arange(len(rows))[::-1]
        ax.barh(y, [row["rms_joint_mrad"] for row in rows],
                color=[colors[name] for name in controllers], height=0.6)
        for yy, row in zip(y, rows):
            ax.text(row["rms_joint_mrad"] + 2, yy,
                    f'{row["rms_joint_mrad"]:.1f}, mean {abs(row["mean_err_joint_mrad"]):.0f}',
                    va="center", color=INK)
        ax.set_yticks(y, [names[name] for name in controllers])
        ax.set_xlim(0, 125)
        ax.set_xlabel("RMS error (mrad)")
        clean_axis(ax)
    handles, labels = line_axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=3,
               bbox_to_anchor=(0.5, 1 - 0.95 / height), frameon=False,
               handlelength=1.4, columnspacing=1.0, handletextpad=0.5)
    _text(fig, 0.15, note_top,
          "Simulation: MuJoCo SO-101, simulated servo, 33 ms dead time,\n"
          "30 Hz loop, amplitude 0.1 rad.\n"
          "pi uses the lab gains. Preview = feedforward from the planned\n"
          "path through the arm's inverse dynamics.", color=MUTED, linespacing=1.25,
          va="top")
    fig.suptitle("Shaking a 150 g load: the integral\nfixes the sag, not the shake",
                 x=0.03, y=0.995, ha="left", color=YELLOW)
    save_figure(fig, "shake-test.png")


FIGURES = [map_errors, inv_goal, pi_five, deadband_cost, real_arm_joints, sim_five,
           hold_torque, known_timeline, shake_test]
