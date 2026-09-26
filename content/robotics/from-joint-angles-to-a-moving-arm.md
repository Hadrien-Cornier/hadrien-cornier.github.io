---
title: 'Learning robotics: from joint angles to a moving arm'
description: 'Joint and task space, kinematics, and motor control, explored through an SO-101 and a simulated Franka arm.'
date: '2026-09-26'
slug: 'from-joint-angles-to-a-moving-arm'
---

I started learning robotics recently. These weekly reports are a way to keep track of what I try and what I understand. I've moved beyond some of the questions in this first entry, but they're a useful checkpoint.

[ACT, Action Chunking with Transformers](https://arxiv.org/abs/2304.13705), got me interested: in 2023, it learned selected manipulation tasks from just 50 demonstrations per task, about ten minutes of human operation. That seemed like something I could experiment with.

I want to explore how we collect training data, what simulation can teach, and what robots remember. [Original OpenVLA](https://arxiv.org/html/2406.09246v3#S6), surprisingly, acted from a single image without observation history. Other systems add memory or spatial maps. Then there are the bodies themselves: humanoids, purpose-built arms, tendon-driven hands. There's a lot to try.

I own an SO-101 and use a Franka arm in simulation. This first report follows a command from the geometry of the arm down to the motor.

## Starting with the arm

Here is the **Franka Panda** in ManiSkill. It has seven arm degrees of freedom, plus finger opening. My SO-101 has five arm joints and one gripper actuator. Its six motors do not give the hand six pose degrees of freedom.

![Franka Panda with seven colored joint rotation arrows and separate sliding fingers](/assets/robotics/arm-control/franka_motion_arrows.png)

The joint angles form the **configuration** $q$. A basic arm **state** is $(q,\dot q)$; a manipulation state also includes objects. Camera images are observations. An **action** is a command: a target angle, angle increment, velocity, or torque, depending on the interface.

“Hand above the cup, facing down” specifies a **task-space** target. A vector of joint angles specifies a **joint-space** target. I initially blurred the two.

![Joint angles map forward to hand pose; inverse kinematics searches for a set of joint solutions](/assets/robotics/arm-control/task_joint_mapping.png)

In the joint/task-space and control-flow diagrams: **teal = task space**, **purple = joint space**, **amber = motor effort**.

## Turning angles into a hand position

I first imagined each joint controlling a world direction. But lifting a straight arm moves the hand upward *and inward*. For two planar links:

![One and two rigid links showing horizontal cosine and vertical sine projections](/assets/robotics/arm-control/01_link_projections.png)

$$
x=L_1\cos q_1+L_2\cos(q_1+q_2),\qquad
y=L_1\sin q_1+L_2\sin(q_1+q_2).
$$

These are sums of projections. The second link's absolute angle is $q_1+q_2$ because the elbow angle is relative to the first link.

**Forward kinematics** is the smooth, nonlinear map $f:Q\to SE(3)$ from joint configurations to hand poses. Here $SE(3)$ is the space of rigid poses: a translation and a rotation. Joint limits and collision constraints select $Q_{valid}\subset Q$.

**Inverse kinematics (IK)** seeks a valid point in the preimage:

$$
f^{-1}(T^*)\cap Q_{valid}=\{q\in Q_{valid}:f(q)=T^*\}.
$$

The map is generally neither injective nor surjective onto $SE(3)$: several configurations can produce one pose, and some poses are unreachable. IK is therefore a constrained search, not a globally defined inverse function. A particular solver may omit collision checking.

When I saw $\dot p=J(q)\dot q$, I wanted to know where the Jacobian came from. Write the position component of forward kinematics as $p=g(q)$. The equation is just the chain rule:

$$
\dot p=J(q)\dot q,\qquad
J(q)=Dg(q)=\begin{bmatrix}
\frac{\partial x}{\partial q_1}&\cdots&\frac{\partial x}{\partial q_n}\\
\frac{\partial y}{\partial q_1}&\cdots&\frac{\partial y}{\partial q_n}\\
\frac{\partial z}{\partial q_1}&\cdots&\frac{\partial z}{\partial q_n}
\end{bmatrix}.
$$

![The same small joint turn produces different hand velocities in two arm configurations](/assets/robotics/arm-control/jacobian_local_motion.png)

The $3\times n$ position Jacobian is a **matrix-valued field over configuration space**. Each column gives the hand velocity produced by one joint's unit velocity. At an interior point of $Q_{valid}$, its image contains the attainable instantaneous hand velocities; its kernel contains joint velocities that leave hand position unchanged to first order. Rank 3 means the derivative is surjective onto position velocities. This is a local statement, not a claim about the whole workspace.

Two configurations with the same hand position can have different Jacobians. For a small displacement, $\Delta p\approx J(q)\Delta q$.

<details>
<summary>Is this a tensor field?</summary>

More precisely, $dg_q:T_qQ\to T_{g(q)}\mathbb R^3$ is a linear map between tangent spaces. The derivative is a section of $T^*Q\otimes g^*T\mathbb R^3$, not an ordinary $(1,1)$ tensor field on $Q$. [Tangent bundles](https://math.stanford.edu/~conrad/diffgeomPage/handouts/bundle.pdf).

</details>

For my SO-101, a useful simplification is to separate shoulder pan from the side-view geometry. Sum the links' horizontal projections to get signed reach $r$, then rotate it about the base:

![Simplified SO-101 side and top views showing signed radial reach and shoulder pan](/assets/robotics/arm-control/02_so101_signed_reach.png)

$$
x=r\cos q_1,\qquad y=r\sin q_1.
$$

Shoulder lift, elbow flex, and wrist flex change $r$ and height. Folding past the pan axis can make $r$ negative; horizontal distance is $|r|$. This schematic omits real offsets. Wrist roll leaves the chosen on-axis point fixed.

## Where can the hand actually go?

I pictured a sphere, then perhaps a quarter sphere once I considered the joint limits and table. But that assumes the arm can reach everything inside its outer boundary.

![Ideal two-link arms showing why unequal link lengths can leave an inner unreachable hole](/assets/robotics/arm-control/03_workspace_intuitions.png)

An ideal two-link arm has minimum reach $|L_1-L_2|$ when unrestricted folding is allowed. Real joint limits and collisions can exclude more space. There can be an inner hole, but there need not be one.

For the actual Franka model, I sampled joint configurations and computed their hand positions:

![Computed Franka workspace slices distinguish valid samples, rejected samples, and unsampled cells](/assets/robotics/arm-control/franka_workspace_cuts.png)

Teal cells contain valid samples. Rose cells contain only colliding samples. Cream cells contain none. **Neither rose nor cream proves unreachability.** Some valid points below tabletop height lie beyond its edge.

The **position workspace** is the image $g(Q_{valid})$. It ignores orientation and does not establish that a collision-free path exists from the starting configuration.

## Carrying a little coordinate frame

I found orientation easier to picture as three axes attached to the gripper. A single pointing direction is insufficient: a screwdriver can twist without changing where it points.

![Three actual Franka wrist orientations with fixed tool position and local Z axis](/assets/robotics/arm-control/franka_wrist_roll.png)

Only the last wrist joint turns here. The hand's local Z axis and position stay fixed while its X and Y axes rotate.

The three local unit axes, expressed in world coordinates, are the columns of $R\in SO(3)$. Thus $R^TR=I$ and $\det R=1$. Position $p$ and orientation $R$ together specify pose. $R=I$ means aligned axes, not the robot's neutral configuration.

I could see the first column of a planar rotation, $(\cos\theta,\sin\theta)$, but the minus sign in the second bothered me.

![Perpendicular arrows rotate together, showing why the second column has negative sine](/assets/robotics/arm-control/04_rotation_columns.png)

The second axis stays $\pi/2$ ahead:
$\cos(\theta+\pi/2)=-\sin\theta$ and $\sin(\theta+\pi/2)=\cos\theta$.
At $\theta=\pi/2$, the first arrow points up and the second points left. For the Franka wrist rotation shown above:

$$
R_{new}=R_{old}\begin{bmatrix}\cos\theta&-\sin\theta&0\\\sin\theta&\cos\theta&0\\0&0&1\end{bmatrix}.
$$

Reaching a position does not mean reaching it at every orientation:

![Three Franka configurations place their hands in one small box with different orientations](/assets/robotics/arm-control/franka_orientation_box.png)

These hands occupy the same 15 cm box, at slightly different positions. They illustrate orientation variation, not complete coverage at a fixed point.

The **pose workspace** is $f(Q_{valid})\subset SE(3)$. The **dexterous workspace**, in its strict sense, contains positions reachable at *every* orientation. Neither follows from a position cloud alone. Even a plot of tool-axis directions misses rotation about that axis.

## From a goal to the next command

So where does ACT fit? Geometry tells us which configurations produce a pose. Something still has to choose the motion.

![Classical control, ACT, VLM, and VLA routes with task, joint, and motor commands in distinct colors](/assets/robotics/arm-control/control_spaces_overview.png)

- **Classical pipeline:** choose a grasp pose, solve IK, plan a collision-free path, and time it into targets for the controller. These steps can be interleaved.
- **ACT:** predicts a chunk of future targets from images and joint positions. In the original ALOHA setup, these are joint-position targets learned from human-operated leader arms. No hand-target IK step is required. [ACT, §IV](https://arxiv.org/html/2304.13705v1#S4).
- **VLM:** a vision-language model can choose a high-level step. PaLM-E generates language commands for a separate robot policy. [PaLM-E](https://palm-e.github.io/).
- **VLA:** a vision-language-action model outputs robot actions. Original OpenVLA uses end-effector commands; other systems use joint commands. The action's units, frame, and absolute or relative convention must match the controller. [OpenVLA](https://arxiv.org/html/2406.09246v3#S3).

A **policy** selects actions from observations. A **dynamics model** predicts how actions change the state through forces, inertia, gravity, and contact. A **planner** searches for a motion; a **controller** tracks its targets through feedback. Model predictive control uses a dynamics model to replan as observations arrive. These roles can overlap.

## The command still has to reach a motor

I initially thought the SO-101's USB board might be the motor controller. It is a bus adapter. Each smart servo contains its own feedback loop, sensor, driver, motor, and gears.

![Laptop commands pass through the USB adapter to a local controller and encoder loop inside each servo](/assets/robotics/arm-control/so101_servo_feedback.png)

The servo receives a target, measures its angle with a magnetic encoder, and adjusts motor drive. That loop continues between laptop commands. [Waveshare's FAQ](https://docs.waveshare.com/Bus_Servo_Adapter_A/FAQ) documents the adapter; the [STS3215 datasheet](https://files.seeedstudio.com/products/Feetech/108090023_STS3215-C001_Datasheet.pdf) documents magnetic sensing and PID. I haven't verified the firmware's timing or filtering.

For desired angle $q_d$ and measured angle $q$, the standard **PID** law is:

$$
e(t)=q_d(t)-q(t),\qquad
u(t)=K_Pe(t)+K_I\int_0^t e(s)\,ds+K_D\dot e(t).
$$

- **P:** proportional correction for current error.
- **I:** accumulated error supplies sustained effort, for example against gravity. It needs protection against accumulation when the actuator saturates.
- **D:** derivative feedback. For a fixed target, $\dot e=-\dot q$, so it opposes velocity. Noise makes filtering necessary.

![P reads current error, I accumulates signed area, and D reads the slope of the same error curve](/assets/robotics/arm-control/03_pid_terms.png)

This figure uses a prescribed error curve. The equation is a teaching model, not a reconstruction of the servo firmware; $u$ requests drive, not guaranteed torque.

I then wanted to understand why one response overshoots while another creeps toward its target.

![Ideal underdamped, critically damped, and overdamped step responses at fixed natural frequency](/assets/robotics/arm-control/01_damping_step_responses.png)

In this second-order step response, underdamping produces oscillation, critical damping is the non-oscillatory boundary, and overdamping gives a slower non-oscillatory response.

<details>
<summary>The one-joint model</summary>

With inertia $M$, viscous friction $b$, a fixed target, and PD control:

$$
M\ddot e+(b+K_D)\dot e+K_Pe=0,\qquad
\zeta=\frac{b+K_D}{2\sqrt{MK_P}}.
$$

For $M,K_P>0$, $0<\zeta<1$ is underdamped, $\zeta=1$ critical, and $\zeta>1$ overdamped. This model omits integral action, gravity, contact, delay, and limits.

</details>

[Jacob Rothschild's article](https://x.com/ja_rothschild/article/2100633491432239411) says, “The controller's D, however, is fixed”. I read that as a global restriction. It is a fixed *gain* in his example, not a universal damping constant.

![Assigned inertias produce different damping ratios despite identical controller gains](/assets/robotics/arm-control/02_fixed_gains_changing_inertia.png)

Pose changes effective inertia. Consequently, fixed gains do not imply a fixed damping ratio. These curves use assigned inertias, not Franka measurements. Gains can differ by joint and vary with pose or load. [PD control and damping](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-4-motion-control-with-torque-or-force-inputs-part-1-of-3/).

---

**Experiment.** 300,000 Franka configurations sampled; 263,270 accepted under the recorded collision rules. The installed ManiSkill 3.0.1 setup lacks an SO-101 agent. These are simulated results; the simplified geometry and control plots are labeled separately. [Code, joint limits, sampling, collision checks, and data](https://github.com/Hadrien-Cornier/maniskill-playground/tree/main/experiments/workspace). [Interactive viewer: download and open locally](https://github.com/Hadrien-Cornier/maniskill-playground/blob/main/experiments/workspace/figures-v2/workspace.html).

**References and assets.** [Modern Robotics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/); [SO-101 joint guide](https://huggingface.co/docs/lerobot/so101); [robot asset credits and CC BY-NC 4.0 license](/assets/robotics/arm-control/ASSET-NOTICES.md).
