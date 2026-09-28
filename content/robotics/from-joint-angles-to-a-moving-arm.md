---
title: 'How an arm moves: joints, geometry, and motor control'
description: 'From encoder readings to gripper position: a visual guide to robot geometry, servos, and the commands that connect them.'
date: '2026-09-26'
updated: '2026-09-28'
slug: 'from-joint-angles-to-a-moving-arm'
---

I own an SO-101 arm. I wanted to understand how a number sent from my laptop becomes a movement, and how joint angles determine where the gripper ends up. [Why I'm learning robotics](/robotics/why-i-am-learning-robotics/) is a separate post.

## How do we describe the arm?

Here is the Franka Panda used in my ManiSkill experiment. Its seven arm joints rotate; the fingers slide. The names below describe their motions, alongside the model's joint numbers.

![Franka arm with human-readable joint names and colored rotation arrows](/assets/robotics/arm-control/v3/franka_joint_names.png)

We could record the Cartesian position of every joint. But those coordinates are constrained by the rigid links, and joint-center positions alone miss rotation about a link's axis. A simpler description is the vector of **joint angles**, $q=(q_1,\ldots,q_7)$. Given the robot's geometry, these determine the positions and orientations of its arm links.

My SO-101 has five arm joints and a gripper actuator. An **encoder** inside each smart servo measures its angle. The arm's angles are its *configuration*. Its mechanical state also includes joint velocities, $(q,\dot q)$.

Watch the wrist rotate. The joints before it stay fixed; the gripper's pointing direction alone does not describe this motion.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/franka_wrist_motion.png" aria-label="Wrist twist with the upstream arm joints fixed">
<source src="/assets/robotics/arm-control/v3/franka_wrist_motion.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/franka_wrist_motion.mp4">Watch the video</a>
</video>
<figcaption>Simulated Franka wrist motion. Watch the local axes rotate with the gripper. <a class="video-link" href="/assets/robotics/arm-control/v3/franka_wrist_motion.mp4">Open video</a></figcaption>
</figure>

## How does a motor follow an angle?

Sending “30°” does not tell a bare motor how long to turn. A **servo**, short for servomechanism, is an actuator with feedback: it compares a measured quantity with a target and corrects the error. In the SO-101, the smart servo packages the motor, encoder, driver, gears, and controller together.

![Laptop commands pass through the USB adapter to a local controller and encoder loop inside each servo](/assets/robotics/arm-control/so101_servo_feedback.png)

The USB board passes messages to the servo bus. Each servo runs its own feedback loop between laptop commands. A magnetic encoder senses a rotating magnet to measure angle. The [adapter documentation](https://docs.waveshare.com/Bus_Servo_Adapter_A/FAQ) and [STS3215 datasheet](https://files.seeedstudio.com/products/Feetech/108090023_STS3215-C001_Datasheet.pdf) describe this hardware. The firmware's exact timing and filtering remain unverified.

Suppose the desired angle is $q_d=30°$ and the measured angle is $q=20°$. The error is $e=10°$. The target command is an **action**; the encoder reading is an observation of the current state. A standard **PID controller** turns that error into a drive command:

$$
e(t)=q_d(t)-q(t),\qquad
u(t)=K_Pe(t)+K_I\int_0^t e(s)\,ds+K_D\dot e(t).
$$

Here $u$ is the requested motor drive. The three gains $K_P,K_I,K_D$ set the strength of three corrections:

- **Proportional:** react to the current error. A larger gap produces a larger correction.
- **Integral:** accumulate past error. This can supply the sustained effort needed to hold against gravity.
- **Derivative:** react to changing error. For a fixed target, $\dot e=-\dot q$, so this term opposes motion and helps brake before overshoot.

![The proportional term reads error, the integral accumulates its area, and the derivative reads its slope](/assets/robotics/arm-control/03_pid_terms.png)

This is a teaching law, not a reconstruction of the servo firmware. Integral windup and derivative noise need handling. Motor drive is not automatically equal to torque.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/damping_joint_responses_poster.png" aria-label="Three joint responses to the same angle target">
<source src="/assets/robotics/arm-control/v3/damping_joint_responses.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/damping_joint_responses.mp4">Watch the video</a>
</video>
<figcaption>Teaching model: underdamped, critically damped, and overdamped responses. No physical robot measurement. <a class="video-link" href="/assets/robotics/arm-control/v3/damping_joint_responses.mp4">Open video</a></figcaption>
</figure>

The clips use the same target and clock. An **underdamped** joint overshoots and oscillates. An **overdamped** joint approaches slowly without oscillation. **Critical damping** is the boundary between those two responses in this ideal second-order model.

<details>
<summary>The equation behind the animation</summary>

For a single joint with inertia $M$, viscous friction $b$, and PD control at a fixed target:

$$
M\ddot e+(b+K_D)\dot e+K_Pe=0,\qquad
\zeta=\frac{b+K_D}{2\sqrt{MK_P}}.
$$

$M$ measures resistance to angular acceleration. $b$ measures friction proportional to speed. The dimensionless **damping ratio** $\zeta$ (zeta) compares damping with its critical value: between 0 and 1 is underdamped, 1 is critical, and above 1 is overdamped. The animation assumes positive inertia and proportional gain and omits integral action, gravity, delay, and contact.

Changing the load or arm configuration changes the response even with the same controller gains. Gains can differ by joint or vary with pose and load. [PD control and damping](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-4-motion-control-with-torque-or-force-inputs-part-1-of-3/).

</details>

## Joint angles or a gripper target?

The servo accepts a joint target. But I usually care about the gripper: “put it at this point above the cup.” These are two descriptions of the task.

**Joint space** contains configurations $q$. **Task space** contains the quantity we want to control: here, the gripper position $p=(x,y,z)$. Later we'll add orientation.

**Forward kinematics** is a function $g:Q\to\mathbb R^3$, with $p=g(q)$. For this arm, it is non-injective: distinct configurations can put the gripper at the same point. It is not surjective onto $\mathbb R^3$ because reach is bounded. It is surjective onto its image. With joint and collision constraints, the reachable position workspace is $g(Q_{valid})$.

![Two Franka configurations hold the gripper at the same target with different arm arrangements](/assets/robotics/arm-control/v3/franka_same_pose_two_configs.png)

The gripper has the same position **and orientation** in both configurations, while the elbow moves about 38 cm. The target object is schematic; this is a kinematic comparison, not a tested grasp.

**Inverse kinematics (IK)** searches for joint angles matching a target:

$$
\{q\in Q_{valid}:g(q)=p^*\}.
$$

$Q_{valid}$ imposes joint limits and the chosen collision constraints. The answer may be empty or contain many configurations. IK is not a single-valued inverse function, and an IK solution is not a motion path.

This ambiguity matters during motion. A numerical solver seeded with the current configuration tends to select nearby solutions. Otherwise, repeated solves can choose different branches and produce abrupt target jumps. Seeding helps continuity; it does not guarantee it or certify collision-free motion.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/ik_branch_selection_poster.png" aria-label="IK branch jumps compared with continuous branch selection">
<source src="/assets/robotics/arm-control/v3/ik_branch_selection.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/ik_branch_selection.mp4">Watch the video</a>
</video>
<figcaption>Teaching model: alternating solutions versus choosing the solution nearest the previous one. <a class="video-link" href="/assets/robotics/arm-control/v3/ik_branch_selection.mp4">Open video</a></figcaption>
</figure>

This schematic deliberately alternates between two valid analytic branches on the left. On the right it selects the solution nearest the previous one. It illustrates the continuity problem and the purpose of seeding, not the behavior of every unseeded solver.

## How do we describe gripper position mathematically?

Seven joints make the geometry look complicated. So first, simplify the model. Hold base pan fixed and replace the arm with links that all bend in one plane. This is a planar teaching model, not a claim that locking the Franka's base makes its other joints planar.

Start with one link of length $L_1$ at angle $\theta_1$. Its endpoint is $(L_1\cos\theta_1,L_1\sin\theta_1)$. Then add a second link, then a third:

![One, two, and three planar links show how relative joint angles add and projections sum](/assets/robotics/arm-control/v3/link_projections_one_two_three.png)

The second link's absolute angle is $\theta_1+\theta_2$. The third's is $\theta_1+\theta_2+\theta_3$. The diagram uses planar coordinates $(x,y)$. For the vertical arm plane, rename them $(r,z-h)$. For $n$ links:

$$
r=\sum_{i=1}^{n}L_i\cos\alpha_i,\qquad
z=h+\sum_{i=1}^{n}L_i\sin\alpha_i,\qquad
\alpha_i=\sum_{j=1}^{i}\theta_j.
$$

Here $h$ is shoulder height and $r$ is the signed horizontal reach. This gives a convenient parametrization of the simplified SO-101 geometry. From the side we compute $(r,z)$; from above, shoulder pan $\phi$ rotates that reach into $(x,y)$:

![A marked observer view connects the vertical arm plane, side view, and top view through horizontal reach r](/assets/robotics/arm-control/v3/so101_radial_side_top.png)

$$
x=r\cos\phi,\qquad y=r\sin\phi.
$$

Folding past the pan axis can make $r$ negative; horizontal distance is $|r|$. Real offsets require the full robot model.

## How does a small joint turn move the gripper?

Once $p=g(q)$ is defined, differentiate it:

$$
\dot p=Dg(q)\dot q=J(q)\dot q.
$$

That derivative is the **Jacobian**. For position control:

$$
J(q)=\begin{bmatrix}
\frac{\partial x}{\partial q_1}&\cdots&\frac{\partial x}{\partial q_n}\\
\frac{\partial y}{\partial q_1}&\cdots&\frac{\partial y}{\partial q_n}\\
\frac{\partial z}{\partial q_1}&\cdots&\frac{\partial z}{\partial q_n}
\end{bmatrix}.
$$

For example, $\partial x/\partial q_2$ is the change in gripper X per small change in joint 2, with other angles fixed. Repeat for every coordinate and joint. Column 2 gives the resulting 3D velocity per unit joint velocity.

![The same shoulder turn produces large and small gripper motion in extended and folded configurations](/assets/robotics/arm-control/v3/jacobian_extended_folded.png)

The Jacobian is a **matrix-valued field over configuration space**, not merely over gripper position. Its value changes with the whole arm configuration. For small changes, $\Delta p\approx J(q)\Delta q$.

At an interior point of $Q_{valid}$, its image contains the attainable instantaneous position velocities. Its kernel contains joint velocities that preserve hand position to first order. Rank 3 means the position derivative is surjective. This local condition says nothing about global reachability.

I also mixed up **kinematics**, **dynamics**, and **proprioception**. Their roots help: motion, power, and one's own body.

- **Kinematics** describes motion and geometry, including velocities and accelerations, without asking which forces cause them.
- **Dynamics** relates forces and torques to motion. The same configuration with different velocities is a different state: an arm passing through a point may need braking where a stationary arm does not.
- **Proprioception** is sensing the robot's own state, for example through joint encoders.

[Etymology and mechanics](https://people.ohio.edu/williams/html/PDF/HistoryOfMechanisms.pdf); [proprioceptive](https://ahdictionary.com/word/search.html?q=proprioceptive).

## Where can the hand actually go?

Looking at my arm on its table, I wondered about the whole reachable region. It cannot pass through the tabletop or its own links. The thickness of the hardware matters, as do objects around it.

My first guess was part of a sphere. Suppose, just for the sketch, pan were limited to 180° and the arm stayed above a table. That leaves half of the upper hemisphere: a quarter-ball envelope. It still does not follow that every point inside is reachable.

![A hypothetical arm above a table with a 180-degree pan sweep gives a quarter-ball outer guess](/assets/robotics/arm-control/v3/hypothetical_quarter_ball.png)

These are assumed limits, not measured SO-101 or Franka limits. Even two ideal links cannot fold closer than $|L_1-L_2|$ to the shoulder. Joint limits, thickness, and obstacles can exclude more space.

I tested the question on the Franka model. For each sampled set of joint angles, I computed the gripper position and checked collisions. The result is evidence about the image $g(Q_{valid})$.

![A highlighted slab through the sampled Franka workspace is shown beside the corresponding face-on cut](/assets/robotics/arm-control/v3/franka_workspace_slab.png)

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/franka_workspace_slab.png" aria-label="Moving slab through the Franka workspace with a matching side view">
<source src="/assets/robotics/arm-control/v3/franka_workspace_slab.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/franka_workspace_slab.mp4">Watch the video</a>
</video>
<figcaption>Sampled workspace: the highlighted slab in 3D corresponds to the 2D cut beside it. <a class="video-link" href="/assets/robotics/arm-control/v3/franka_workspace_slab.mp4">Open video</a></figcaption>
</figure>

The orange slab is a **6 cm thick band**, moving sideways through the cloud. The right panel looks straight at that band: signed forward/back position relative to the base versus height, grouped into 4 cm cells. It shows only the above-table portion of the data. Teal means at least one valid hand position was found in that cell. Blank means none was found, not that reaching it is impossible. The arm is a fixed spatial reference; the video scans the sampled positions, not an arm trajectory.

<details>
<summary>What did the experiment actually measure?</summary>

I sampled 300,000 configurations uniformly within the seven arm joints' model limits, with the fingers open. Of these, 263,270 passed the recorded self-collision and environment checks. The table, ground, and task cube were included. Uniform joint sampling is not uniform sampling of hand positions.

This is a static simulation experiment. An accepted configuration does not prove a safe path from the start. An empty region does not prove unreachability. The installed ManiSkill 3.0.1 setup lacks an SO-101 agent, so these results concern Franka. [Model, joint limits, collision rules, data, and reproduction](https://github.com/Hadrien-Cornier/maniskill-playground/tree/main/experiments/workspace).

</details>

## Reaching the stem is not enough

Suppose I want to grasp a wine glass by its stem. Reaching the stem's position is only part of the problem: the gripper must approach in a useful orientation, with room for its fingers.

![A gripper reaches a schematic wine-glass stem with different orientations at the same target](/assets/robotics/arm-control/v3/franka_wine_orientation_comparison.png)

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/franka_wine_orientation.png" aria-label="Gripper orientations around a fixed wine-stem target">
<source src="/assets/robotics/arm-control/v3/franka_wine_orientation.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/franka_wine_orientation.mp4">Watch the video</a>
</video>
<figcaption>Kinematic illustration with a schematic glass; not a demonstrated physical grasp. <a class="video-link" href="/assets/robotics/arm-control/v3/franka_wine_orientation.mp4">Open video</a></figcaption>
</figure>

The simulated hand keeps the same target point while changing orientation. The glass is a visual reference, not part of a validated grasp: contact, finger clearance against the glass, and forces are not modeled here.

So the hand needs more than an XYZ point. Attach an orthonormal frame to it. Express its three unit axes in world coordinates and put them in the columns of a matrix:

$$
R=\begin{bmatrix}|&|&|\\\mathbf x_g&\mathbf y_g&\mathbf z_g\\|&|&|\end{bmatrix},\qquad
R^TR=I,\quad\det R=1.
$$

This is a rotation matrix, $R\in SO(3)$. Position and orientation together give a **pose**, $(p,R)\in SE(3)$. $R=I$ means aligned axes, not necessarily the robot's neutral configuration.

Now the minus sign in a planar rotation has a picture:

![Two perpendicular axes rotate together, giving cosine and negative sine in the first row](/assets/robotics/arm-control/04_rotation_columns.png)

$$
R_z(\theta)=\begin{bmatrix}
\cos\theta&-\sin\theta&0\\
\sin\theta&\cos\theta&0\\
0&0&1
\end{bmatrix}.
$$

The first axis becomes $(\cos\theta,\sin\theta,0)$. The second stays $\pi/2$ ahead, hence $(-\sin\theta,\cos\theta,0)$. At 90°, it points left. A twist about the gripper's local Z axis composes as $R_{new}=R_{old}R_z(\theta)$.

The **pose workspace** contains reachable position-orientation pairs. The **dexterous workspace**, in its strict sense, contains positions reachable at every orientation. Position reachability alone establishes neither.

## Who chooses the next target?

We can now work backward from the motor. In the SO-101 position-control setup, the servo needs a joint-angle target. It cannot interpret “grasp the cup.” Something above it must turn that goal into commands.

![Three ways to produce joint targets: planned motion, ACT action chunks, or learned task-space targets with IK and planning](/assets/robotics/arm-control/v3/command_routes.png)

**Classical planning:** choose a grasp pose, use IK to find a joint configuration, then plan and time a collision-free path into intermediate joint targets. IK chooses an endpoint; planning supplies the motion between endpoints.

**ACT:** predicts a chunk of future joint targets from images and measured joint positions in the original ALOHA setup. Execution selects or combines chunk targets as fresh observations produce new predictions. Temporal ensembling can combine overlapping chunks. This is a learned policy, not a one-target-at-a-time autoregressive planner. [ACT paper](https://tonyzhaozh.github.io/aloha/).

**Learned task-space targets:** a model can instead propose a hand pose or displacement. An interface then uses IK or a Cartesian controller to produce commands the robot accepts. Continuity, timing, and collision handling still matter.

A **vision-language model (VLM)** can select a high-level goal, while a **vision-language-action model (VLA)** predicts motion commands. That is one possible hierarchy, not a universal modern stack. Some VLAs take images and instructions directly; their outputs may be joint or task-space commands. [PaLM-E](https://palm-e.github.io/), [OpenVLA](https://arxiv.org/html/2406.09246v3#S3).

Other robots accept velocity or torque commands. The common requirement is to match the controller's interface, units, frame, and timing. A model's output shape alone does not tell us what its actions mean.

---

**Sources and inspiration.** Jacob Rothschild's [control article](https://x.com/ja_rothschild/article/2100633491432239411) helped inspire this report. Also: [Modern Robotics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/), [SO-101 joint guide](https://huggingface.co/docs/lerobot/so101), and [asset credits and licenses](/assets/robotics/arm-control/ASSET-NOTICES.md). Robot renderings use the simulated model; the planar and control animations are teaching schematics.
