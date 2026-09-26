---
title: 'Learning robotics: from joint angles to a moving arm'
description: 'A learning checkpoint on robot geometry, action spaces, smart servos, and PID control, with diagrams and a reproducible workspace experiment.'
date: '2026-09-26'
slug: 'from-joint-angles-to-a-moving-arm'
---

I started learning robotics recently, and I keep finding new things I want to understand. I want to write weekly technical reports to help me learn and share what I find. This is a first checkpoint. I've already moved beyond some of these questions, but I want to keep a record of the steps that made the subject clearer.

The 2023 Action Chunking with Transformers paper, or ACT, was one of the things that got me excited. The idea of learning useful tasks from a small set of demonstrations made the field feel open to experimentation. In its selected tasks, [the ACT paper](https://arxiv.org/abs/2304.13705) used 50 demonstrations per task, about ten minutes of human operation. That made me want to understand what was happening between the demonstrations and the moving arm.

There are many directions I want to explore: collecting data through teleoperation, learning in simulation, and using reinforcement learning. I also want to understand what a robot remembers beyond its latest images, whether it keeps a usable map, and how language models might help it use common sense. It surprised me that [original OpenVLA](https://arxiv.org/html/2406.09246v3#S6) chose actions from a single image without observation history. Other systems add memory, so this is a design question rather than a rule. Even the body raises questions. When does a humanoid make sense? When is a simpler, purpose-built arm better? What changes when a hand uses tendons?

What I find especially interesting is that the decisions become physical motion. Whatever a model uses internally, it has to coordinate positions, speeds, and forces across many joints. There is a huge range of possible movements, and each one changes what happens next.

For this report, I came back to something smaller. I own an SO-101, and I've been exploring a Franka arm in simulation. Before thinking about a robot that understands a whole task, I wanted to connect the numbers in its software to the arm in front of me. What does a joint command mean? Where can the hand go? And what actually makes the motor move?

## Starting with the arm

This experiment uses the **Franka Panda** arm in ManiSkill, a robot simulation environment.

![Franka Panda with seven colored joint rotation arrows and separate sliding fingers](/assets/robotics/arm-control/franka_motion_arrows.png)

Seven arm joints give it seven **degrees of freedom**. Finger opening is separate. The SO-101 has five arm joints and one gripper actuator. Six motors do not mean six independent ways to place and aim its hand.

A distinction I wanted to make early was between asking for a movement and describing what the robot is doing.

Imagine asking the elbow to turn to 30 degrees. That is an **action**, a command. The elbow might currently be at 20 degrees and still moving.

The joint angles form the **configuration**, q. A simple arm **state** also includes joint speeds. A manipulation task needs object information too. A camera image is an observation of that state.

Commands have different meanings in different systems: an angle, an angle change, a speed, or a motor torque. Always check what the interface accepts.

The next distinction is about which numbers describe the goal.

“Put the hand 10 cm above the cup, facing down” is a **task-space target**: position plus orientation.

“Set these five SO-101 joint angles” is a **joint-space target**. Finger opening is separate.

![Joint angles map forward to hand pose; inverse kinematics searches for a set of joint solutions](/assets/robotics/arm-control/task_joint_mapping.png)

In these space and control diagrams: **teal = task space**, **purple = joint space**, **amber = motor effort**. Images and language are not coordinates in either space.

## Turning angles into a hand position

The geometry made more sense to me when I stopped treating each joint as if it controlled one world direction.

Start with two rigid bars, called links, joined at an elbow. From straight and horizontal, lifting the shoulder moves the hand upward **and inward**. A joint does not control just one world coordinate.

![One and two rigid links showing horizontal cosine and vertical sine projections](/assets/robotics/arm-control/01_link_projections.png)

Each link casts horizontal and vertical “shadows”: L cos(theta) and L sin(theta). Add them to locate the hand:

$$
x=L_1\cos q_1+L_2\cos(q_1+q_2),
$$

$$
y=L_1\sin q_1+L_2\sin(q_1+q_2).
$$

The second link's angle is q1 + q2 because the elbow turns relative to the upper arm. This mapping is **nonlinear**: doubling an angle change need not double hand displacement.

**Forward kinematics**, T = f(q), maps joint configuration q to hand pose T. **Inverse kinematics (IK)** searches for joint angles that produce a requested pose T*:

$$
\{q\in Q_{valid}:f(q)=T^*\}.
$$

There may be several answers, or none. A solver uses a starting guess and preferences to select a candidate. Q_valid includes the limits and constraints we impose; not every solver checks collisions.

Seeing an equation for motion brought up another question: **what is the Jacobian doing here?**

Turn only the elbow slightly. The hand follows an arc; its velocity points along the tangent.

![The same small joint turn produces different hand velocities in two arm configurations](/assets/robotics/arm-control/jacobian_local_motion.png)

The equation connecting joint speeds to hand velocity is:

$$
\dot p=J(q)\dot q.
$$

A dot means “rate of change.” The **Jacobian J** is the matrix of partial derivatives of hand position with respect to joint angles:

$$
J(q)=\begin{bmatrix}
\frac{\partial x}{\partial q_1}&\cdots&\frac{\partial x}{\partial q_n}\\
\frac{\partial y}{\partial q_1}&\cdots&\frac{\partial y}{\partial q_n}\\
\frac{\partial z}{\partial q_1}&\cdots&\frac{\partial z}{\partial q_n}
\end{bmatrix},\qquad J_{ij}(q)=\frac{\partial f_i}{\partial q_j}(q).
$$

For position p = f(q), entry (i, j) measures how coordinate i changes when joint j moves alone. The position Jacobian has **3 rows and n columns**. Each column gives one joint's contribution.

There is a matrix at every configuration q: a **matrix-valued field over configuration space**. Two elbow arrangements can put the hand at the same point but have different Jacobians. For small changes, delta-p ≈ J(q) delta-q.
<details>
<summary>Is it a tensor field? Optional math detail.</summary>

The differential $df_q:T_qQ\to T_{f(q)}X$ maps joint velocities to task velocities. This tangent-bundle map connects different spaces; it is not automatically an ordinary (1,1) tensor field on Q. [Differential and tangent bundles](https://math.stanford.edu/~conrad/diffgeomPage/handouts/bundle.pdf).

</details>

**Dynamics** instead describes how forces, inertia, gravity, and contact change motion. A simulator can evaluate forward kinematics directly; it need not chain Jacobian estimates to locate the hand.

I also wanted to connect this picture to my SO-101. The useful quantity was its horizontal reach, r.

Picture a simplified SO-101 from the side, then from above. Its q1 is shoulder pan; q2, q3, and q4 are shoulder lift, elbow flex, and wrist flex.

![Simplified SO-101 side and top views showing signed radial reach and shoulder pan](/assets/robotics/arm-control/02_so101_signed_reach.png)

From the side, add the links' horizontal shadows to get r. Add their vertical shadows to get height. From above, shoulder pan splits r into world X and Y:

$$
x=r\cos q_1,\qquad y=r\sin q_1.
$$

First project links horizontally. Then project that reach onto X and Y. Shoulder lift and elbow flex change both reach and height.

Here r is signed: folding past the pan axis can make it negative. Horizontal distance is |r|, not the full 3D distance. This sketch omits real offsets. Wrist roll q5 leaves our on-axis point fixed; finger opening is separate.

## Where can the hand actually go?

My first picture was something like part of a sphere.

Stretch the arm and sweep it around its base. Limited pan suggests a wedge, perhaps a quarter sphere. A table seems to remove the bottom.

But can the hand reach every point inside that outline?

![Ideal two-link arms showing why unequal link lengths can leave an inner unreachable hole](/assets/robotics/arm-control/03_workspace_intuitions.png)

Joint limits and collisions restrict folding. Unequal ideal links cannot fold closer to the shoulder than their length difference. Equal links can fold back completely. An inner hole is possible, not automatic.

Now look at the actual Franka model.

![Computed Franka workspace slices distinguish valid samples, rejected samples, and unsampled cells](/assets/robotics/arm-control/franka_workspace_cuts.png)

Teal means a valid configuration was found. Rose means only colliding configurations were sampled. Cream means no samples. Neither rose nor cream proves impossibility. Some valid points below the tabletop lie beyond its edge.

The **position workspace** says where the hand can be, without specifying its orientation.

## Carrying a little coordinate frame

Position was only half the question. I could picture the gripper carrying its own little Cartesian frame, but I still had to connect that picture to a matrix.

Point a screwdriver forward, then twist it. Its direction stays fixed, but its orientation changes. One arrow misses that twist.

![Three actual Franka wrist orientations with fixed tool position and local Z axis](/assets/robotics/arm-control/franka_wrist_roll.png)

Close-up in one fixed view. Only the last wrist joint turns; the arm joints before it stay still.

Attach three perpendicular unit arrows to the hand. Their directions, written in world coordinates, become the columns of a **rotation matrix R**. Position locates their origin. Position and orientation together form the **pose**.

R = I means aligned axes, not necessarily the starting configuration. Identity pose also requires coincident origins. Here wrist roll keeps local Z fixed while X and Y turn; axis labels depend on the model. Roll, pitch, yaw, and quaternions also represent orientation.

The part that bothered me was the **minus sign in the second column**. I could see why the first rotating arrow had cosine and sine coordinates. The second one was less obvious.

![Perpendicular arrows rotate together, showing why the second column has negative sine](/assets/robotics/arm-control/04_rotation_columns.png)

The first arrow is (cos theta, sin theta). The second stays 90 degrees ahead. Turning counterclockwise tilts it left: negative X. Its coordinates are **(-sin theta, cos theta)**.

At 90 degrees, the first arrow points up and the second points left. If joint 7 turns by theta while the other six arm joints stay fixed, the new orientation is:

$$
R_{new}=R_{old}\begin{bmatrix}\cos\theta&-\sin\theta&0\\\sin\theta&\cos\theta&0\\0&0&1\end{bmatrix}.
$$

This led back to the workspace: reaching a point does not mean the hand can face every way there.

![Three Franka configurations place their hands in one small box with different orientations](/assets/robotics/arm-control/franka_orientation_box.png)

These hands lie in the same 15 cm box, at slightly different positions. Their carried axes show different orientations. The **pose workspace** contains the position-orientation pairs the arm can achieve. We cannot freely combine a position from one configuration with an orientation from another.

The **dexterous workspace** asks where every required orientation is possible. The strict definition requires all orientations. A few examples cannot prove that. Plotting only the tool's Z direction also hides twist around Z.

## From a goal to the next command

With geometry in place, I could return to ACT and the larger question of who chooses the movement.

To “pick up the cup,” something must choose movements. Several systems can sit above the same motor controller.

![Classical control, ACT, VLM, and VLA routes with task, joint, and motor commands in distinct colors](/assets/robotics/arm-control/control_spaces_overview.png)

**Classical control:** choose a task-space grasp pose. IK finds a joint configuration. A planner finds a suitable motion under the stated constraints; timing turns it into targets to follow. These steps may be interleaved.

**ACT:** predicts action chunks from images and joint positions. Original ALOHA actions are **joint-position targets**, learned from the human-operated leader arms. They go toward joint controllers without first solving hand-target IK. ACT chooses targets; motor feedback tracks them. Other ACT setups must match their training data's action meaning. [ACT paper, section IV](https://arxiv.org/html/2304.13705v1#S4).

**A vision-language model (VLM):** can propose a next step from images and language. It still needs a bridge to motion. PaLM-E generates language commands for a separate robot policy. [PaLM-E](https://palm-e.github.io/).

**A vision-language-action model (VLA):** produces trained robot actions. These may be joint or hand commands. Original OpenVLA uses end-effector control. The output must match the robot's units, frames, and interface; “VLA” alone does not specify them. [OpenVLA paper](https://arxiv.org/html/2406.09246v3#S3).

A **dynamics model** predicts responses to actions. A planner can compare those futures. **Model predictive control** repeatedly plans, acts briefly, observes, and replans. Predicting, choosing, and tracking are different jobs.

This workspace calculation checks geometry and collisions, not policies or paths from the starting pose.

## The command still has to reach a motor

I wanted to follow the command past the software interface. On the SO-101, is the USB board controlling the motor, or is that happening inside the servo?

Suppose the laptop requests an elbow angle of 30 degrees. The joint is at 20 degrees. Where does the correction happen?

![Laptop commands pass through the USB adapter to a local controller and encoder loop inside each servo](/assets/robotics/arm-control/so101_servo_feedback.png)

The USB board carries messages to the shared servo bus. Each smart servo contains its own controller, sensor, driver, motor, and gears. The six local feedback loops run inside the servos.

The addressed servo receives its target, reads its position, compares them, and changes motor drive. This local feedback loop repeats between laptop commands.

A magnetic **encoder** measures angle by sensing a rotating magnet. It does not infer position from how long the motor runs.

The [Waveshare FAQ](https://docs.waveshare.com/Bus_Servo_Adapter_A/FAQ) confirms USB-to-serial conversion without a motor driver. The [STS3215 datasheet](https://files.seeedstudio.com/products/Feetech/108090023_STS3215-C001_Datasheet.pdf) documents magnetic sensing and PID. Exact firmware timing, filtering, and sensor-chip identity remain unverified.

That makes PID easier to place: it is part of following a target, not deciding which object to pick up.

Target 30 degrees, measured 20 degrees: **error = +10 degrees**. The actuator's controller uses this error to set motor drive. The policy chooses the target.

A common teaching model is **PID**, short for proportional, integral, and derivative:

- **P reacts to the present error.** Far from the target, push harder. Close to it, ease off.
- **I adds up past error.** If gravity keeps the joint a little below the target, the accumulated error can supply the extra sustained effort.
- **D reacts to the error's rate of change.** With a fixed target, this acts like braking based on joint speed. It helps stop the joint before it shoots past.

![P reads current error, I accumulates signed area, and D reads the slope of the same error curve](/assets/robotics/arm-control/03_pid_terms.png)

These terms use one prescribed error history, not a simulated controller response. For one joint, with desired angle q_d and measured angle q:

$$
e(t)=q_d(t)-q(t),\qquad
u(t)=K_Pe(t)+K_I\int_0^t e(s)\,ds+K_D\dot e(t).
$$

The gains set each term's strength. Here u requests drive, not guaranteed torque. This teaching equation does not establish the SO-101 firmware's exact implementation.

Integral action can accumulate during saturation. Derivative action amplifies noise. Practical controllers need limits and filtering.

The next question was what happens near the target. **Why does one response overshoot while another slowly creeps into place?**

P pulls toward the target. Inertia keeps the joint moving. D and friction can slow it down.

![Ideal underdamped, critically damped, and overdamped step responses at fixed natural frequency](/assets/robotics/arm-control/01_damping_step_responses.png)

For a step change in target, starting from rest in a simple second-order model:

- **Underdamped:** it overshoots and rings before settling.
- **Critically damped:** it reaches the target without oscillating at the boundary between the two cases.
- **Overdamped:** it returns without oscillating, but more slowly.

These describe the combined system, not universal PID settings. Inertia, load, delay, and pose affect the response.

<details>
<summary>Where do the damping labels come from?</summary>

Use one ideal joint with inertia M and viscous friction b. Hold the target fixed. Ignore integral action, gravity, contact, and limits. A PD controller then gives the error equation below.

$$
M\ddot e+(b+K_D)\dot e+K_Pe=0.
$$

With M > 0 and K_P > 0, its damping ratio is:

$$
\zeta=\frac{b+K_D}{2\sqrt{MK_P}}.
$$

Positive zeta below 1 gives the oscillating case; zeta = 1 is critical; zeta above 1 is overdamped. This result belongs to this linear, one-joint PD model. A full arm with integral action, delays, friction, or contact need not follow these curves.

</details>

A detail in Jacob Rothschild's explanation made me look more closely at the phrase “fixed damping.”

[His control article](https://x.com/ja_rothschild/article/2100633491432239411) says, “The controller's D, however, is fixed”. Here D is the controller's derivative gain, not a universal physical damping constant.

![Assigned inertias produce different damping ratios despite identical controller gains](/assets/robotics/arm-control/02_fixed_gains_changing_inertia.png)

Pose changes a joint's effective inertia. With fixed gains, its damping ratio can change. These curves use assigned inertias, not Franka measurements. Fixed gains are his example's design choice. Each joint can have different gains. Controllers can schedule gains by pose or load, or use a dynamics model. This does not identify any particular servo's strategy. [PD control and damping](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-4-motion-control-with-torque-or-force-inputs-part-1-of-3/).

---

**Experiment note.** Computed from the existing Franka model: 300,000 sampled configurations, 263,270 accepted under the recorded collision rules. The installed ManiSkill 3.0.1 setup lacks an SO-101 agent, so this experiment keeps Franka. Schematics are labeled separately. Robot mesh assets carry CC BY-NC 4.0 terms; see the [asset credits and licenses](/assets/robotics/arm-control/ASSET-NOTICES.md). [Code, limits, checks, and data](https://github.com/Hadrien-Cornier/maniskill-playground/tree/main/experiments/workspace). [Download the interactive viewer](https://github.com/Hadrien-Cornier/maniskill-playground/blob/main/experiments/workspace/figures-v2/workspace.html) and open it in a browser.

**Further reading.** [Modern Robotics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/), and [SO-101 joint guide](https://huggingface.co/docs/lerobot/so101).
