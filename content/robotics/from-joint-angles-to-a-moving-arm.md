---
title: 'How an arm moves: joints, geometry, and motor control'
description: 'From encoder readings to gripper position: a visual guide to robot geometry, servos, and the commands that connect them.'
date: '2026-09-26'
updated: '2026-10-01'
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

<details id="section-how-does-the-encoder-find-the-angle">
<summary>Optional deep dive: how does the encoder find the angle?</summary>

The magnetic encoder was one of the details I found most clever. A magnet turns with the shaft while a sensor chip stays fixed beneath it. Take the Hall-based [AS5600](https://www.infineon.com/assets/row/public/documents/24/49/infineon-as5600-datasheet-en.pdf) as an example.

![A rotating magnet above a fixed AS5600 chip, with the signal path from Hall voltages through digitization and CORDIC to shaft angle](/assets/robotics/arm-control/v4/magnet_chip_signal_path.png)

A ready-to-connect [Seeed Grove board with this chip](https://www.seeedstudio.com/Grove-12-bit-Magnetic-Rotary-Position-Sensor-AS5600-p-4192.html) was listed at **US$6.50 for one** on September 28, 2026, before tax and shipping. I find it remarkable that this much sensing and computation fits on a board that costs so little.

The **[Hall effect](https://www.ti.com/document-viewer/lit/html/sszt164)** turns a magnetic field into a voltage. Current flows through a semiconductor; the field pushes the moving charges sideways, creating a voltage across it. As the magnet turns, the sensor array and its electronics produce two signed signals, a quarter-cycle apart:

$$
X=A\cos\theta,\qquad Y=A\sin\theta.
$$

Here $A$ is the signal amplitude and $\theta$ is the shaft angle. The two signals act like perpendicular coordinates. The rotating magnetic field supplies the sine and cosine signals. The chip's job is to recover the angle.

One signal leaves an ambiguity: 30° and 150° have the same sine. Their cosine signs differ, so the pair distinguishes them. The calculation is $\theta=\operatorname{atan2}(Y,X)$, which keeps both signs to identify the quadrant. [TI's encoder guide](https://www.ti.com/lit/ug/tiduc07/tiduc07.pdf) explains this signal pair.

![The unit-circle positions at 30 and 150 degrees share Y equals 0.5, while X has opposite signs](/assets/robotics/arm-control/v4/equal_sine_opposite_cosine.png)

An analog-to-digital converter turns the voltages into numbers. How does a tiny chip recover the angle? Does it evaluate a Taylor expansion? That sounds like a lot of calculations.

**CORDIC**, short for *Coordinate Rotation Digital Computer*, does it with additions, subtractions, bit shifts, and a small lookup table. The AS5600 has a hardwired CORDIC block.

Imagine the measured vector is $(X,Y)=(0.866,0.5)$, pointing at roughly 30°. CORDIC rotates its coordinates toward the horizontal axis. Positive Y means turn clockwise; negative Y means turn back. It adds each signed turn to an angle estimate:

| Turn | Angle estimate |
|---|---:|
| Clockwise by 45° | 45° |
| Back by 26.565° | 18.435° |
| Clockwise by 14.036° | 32.471° |
| Back by 7.125° | 25.346° |

Smaller corrections bring the estimate toward 30°. These are rotations of numbers in registers; the magnet supplies the original measurement.

#### Why do additions and shifts rotate a vector?

Start with $(x,y)=(1,0)$. A 45° clockwise rotation gives $(0.707\ldots,-0.707\ldots)$. The update $(x+y,y-x)$ gives $(1,-1)$. Both point in the same direction. The second vector is simply longer.

Here is why. Write the original vector as $(r\cos\theta,r\sin\theta)$. Turning clockwise by $\phi$ changes its angle to $\theta-\phi$. The angle-subtraction identities give:

$$
\begin{aligned}
x_{\rm rot}&=x\cos\phi+y\sin\phi,\\
y_{\rm rot}&=y\cos\phi-x\sin\phi.
\end{aligned}
$$

Factor out the same cosine from both coordinates:

$$
\begin{aligned}
x_{\rm rot}&=\cos\phi\,(x+y\tan\phi),\\
y_{\rm rot}&=\cos\phi\,(y-x\tan\phi).
\end{aligned}
$$

For our turns between 0° and 45°, $\cos\phi$ is positive. Multiplying both coordinates by this common factor changes the length while preserving the direction. We only need the angle, so we can leave that factor out.

Now choose $\tan\phi_i=2^{-i}$. The remaining update becomes:

$$
x_{\rm new}=x+2^{-i}y,\qquad
y_{\rm new}=y-2^{-i}x.
$$

That is the whole trick. At $i=0$, add and subtract the coordinates directly. At $i=1$, use half of each coordinate. At $i=2$, use a quarter. With scaled integers, these divisions become right shifts. For a counterclockwise turn, reverse the two signs. Both updates use the old coordinates.

**This is an exact rotation followed by a stretch.** The approximation comes from stopping after finitely many turns and rounding the stored numbers. Each chosen angle $\phi_i=\arctan(2^{-i})$ is computed ahead of time and kept in the lookup table. [ST's CORDIC explanation](https://www.st.com/resource/en/application_note/an5325-how-to-use-the-cordic-to-perform-mathematical-functions-on-stm32-mcus-stmicroelectronics.pdf).

Watch the same process with small integers. Start at $(X,Y)=(887,512)$, whose angle is about 29.995°. The first update gives $x=887+512=1399$ and $y=512-887=-375$. We have turned too far, so the next step turns back. A right shift divides by a power of two and rounds down: `1399 >> 1 = 699`.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v4/cordic_walkthrough_poster.png" aria-label="Twelve CORDIC steps showing each integer shift, addition, subtraction, and angle estimate">
<source src="/assets/robotics/arm-control/v4/cordic_walkthrough.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v4/cordic_walkthrough.mp4">Watch the video</a>
</video>
<figcaption>Each step shows the old numbers, their shifted values, and the new angle estimate. The vector approaches horizontal as the estimate approaches 30°. <a class="video-link" href="/assets/robotics/arm-control/v4/cordic_walkthrough.mp4">Open video</a></figcaption>
</figure>

<details>
<summary>The shift-and-add update</summary>

For the 30° example, start with $x_0=X$, $y_0=Y$, and $a_0=0$. At step $i$, choose $d_i=+1$ if $y_i\geq0$, otherwise $d_i=-1$:

$$
x_{i+1}=x_i+d_i\,2^{-i}y_i,\qquad
y_{i+1}=y_i-d_i\,2^{-i}x_i,\qquad
a_{i+1}=a_i+d_i\phi_i.
$$

Both coordinate updates use the old values. At the first step, $i=0$, this gives $x_1=0.866+0.5=1.366$ and $y_1=0.5-0.866=-0.366$. The negative Y tells us we overshot, so the next step turns back.

These updates scale the vector's length while preserving the direction of each rotation. For angle recovery, the direction is what matters. Once Y is close to zero, the accumulated angle $a$ is close to the original angle.

</details>

#### Is CORDIC actually faster than a Taylor expansion?

I implemented both and tested them on the same inputs. For Taylor, the series is:

$$
\arctan z=z-\frac{z^3}{3}+\frac{z^5}{5}-\cdots.
$$

Near $z=1$, the powers $z^3,z^5,\ldots$ shrink slowly. **Range reduction** means using an identity to replace the input with a smaller one, applying the series there, then restoring the known angle.

Here, first use signs and axis swaps to reduce the angle to between 0° and 45°, with $z$ between 0 and 1. If it is above 22.5°, compute its small offset from 45°. The tangent-subtraction identity gives:

$$
\tan\left(\alpha-\frac{\pi}{4}\right)
=\frac{\tan\alpha-1}{1+\tan\alpha}
=\frac{z-1}{z+1},\qquad \alpha=\arctan z.
$$

So we can recover the angle with:

$$
\arctan z=\frac{\pi}{4}+\arctan\left(\frac{z-1}{z+1}\right).
$$

For example, $z=0.8$ becomes $(0.8-1)/(0.8+1)=-1/9$. We evaluate the series at about $-0.111$, then add 45°. Using the same three terms, $w-w^3/3+w^5/5$:

- Directly at $w=0.8$: about **39.81308°**.
- At $w=-1/9$, then adding 45°: about **38.6598066°**.
- Reference value: about **38.6598083°**.

The same short polynomial becomes much more accurate because its input is smaller. Across the full reduced interval, the series now sees inputs with magnitude at most $\tan(22.5°)\approx0.4142$.

I set the error target to half a 12-bit encoder step: $360°/8192\approx0.0439°$. All three methods passed on 1,114,197 coordinate pairs. These are native C++ results on an Apple M1 Max, using the median of 11 timing trials:

| Method | Steps or terms | Largest tested angle error | Time per angle in a batch |
|---|---:|---:|---:|
| Basic Taylor | 326 terms | 0.04394° | 590.6 ns |
| CORDIC | 12 steps | 0.02798° | 10.78 ns |
| Taylor after extra range reduction | 3 terms | 0.01512° | 1.79 ns |

CORDIC was about **55 times faster than basic Taylor**. But the range-reduced Taylor method was about **6 times faster than CORDIC** on this laptop. I expected the shifts and additions to win; reducing the problem before doing the arithmetic mattered more here.

The appeal of CORDIC in a chip is its simple repeated step: shift, add or subtract, read a stored angle. A dedicated circuit can implement that directly. The AS5600 has such a CORDIC block.

<details>
<summary>Operation counts and benchmark setup</summary>

These counts describe the core calculation in the source code:

| Core calculation | Additions / subtractions | Multiplications | Right shifts | Table entries |
|---|---:|---:|---:|---:|
| CORDIC, 12 steps | 36 integer | 0 | 24 | 12 |
| Basic Taylor, 326 terms | 325 floating-point | 327 | 0 | 326 |
| Reduced Taylor, 3 terms | 2 floating-point | 4 | 0 | 3 |

CORDIC also makes 12 sign checks. Full-circle handling adds sign tests and possible negations. Returning its result as floating-point radians adds one conversion and one multiplication.

Both Taylor methods form a coordinate ratio with one division and handle signs and axis swaps. The reduced method sometimes uses a second division to replace $z$ with $(z-1)/(z+1)$, then adds $\pi/4$ to the answer. The polynomial's input then has magnitude at most $\tan(\pi/8)\approx0.4142$. Averaged over the timing inputs, this version uses 4 multiplications, 4.50 additions/subtractions, and 1.50 divisions, plus sign handling.

Operation types matter: a division and a shift have different costs. These are source-level counts; the compiler chooses the machine instructions. Loop bookkeeping and checksums are excluded from the counts.

Each method receives the same coordinate pairs, rounded to 30 fractional bits. Taylor receives exact floating-point versions of those values. Input preparation happens before timing. The reference is the system's double-precision `atan2`. Timing uses 65,536 fixed-seed inputs, 64 passes per trial, and rotating method order. Apple Clang 21 compiles with `-O3` and floating-point contraction disabled. Media rendering was stopped during the timing run.

[Implementations, raw timings, operation counts, and accuracy checks](https://github.com/Hadrien-Cornier/maniskill-playground/tree/main/experiments/encoder-benchmark).

</details>

</details>

## How does a motor follow an angle?

Sending “30°” does not tell a bare motor how long to turn. A **servo**, short for servomechanism, is an actuator with feedback: it compares a measured quantity with a target and corrects the error. In the SO-101, the smart servo packages the motor, encoder, driver, gears, and controller together.

![Laptop commands pass through the USB adapter to a local controller and encoder loop inside each servo](/assets/robotics/arm-control/so101_servo_feedback.png)

The USB board passes messages to the servo bus. Each servo runs its own feedback loop between laptop commands. A magnetic encoder senses a rotating magnet to measure angle. The [adapter documentation](https://docs.waveshare.com/Bus_Servo_Adapter_A/FAQ) and [STS3215 datasheet](https://files.seeedstudio.com/products/Feetech/108090023_STS3215-C001_Datasheet.pdf) describe this hardware.

Suppose the desired angle is $q_d=30°$ and the measured angle is $q=20°$. The error is $e=10°$. The target command is an **action**; the encoder reading is an observation of the current state. A standard **PID controller** turns that error into a drive command:

$$
e(t)=q_d(t)-q(t),\qquad
u(t)=K_Pe(t)+K_I\int_0^t e(s)\,ds+K_D\dot e(t).
$$

Here $u$ is the requested motor drive. The three gains $K_P,K_I,K_D$ set the strength of three corrections:

- **Proportional:** react to the current error. A larger gap produces a larger correction.
- **Integral:** accumulate error over time. The stored correction keeps producing torque even after the error reaches zero.
- **Derivative:** react to changing error. For a fixed target, $\dot e=-\dot q$, so this term opposes motion and helps brake before overshoot.

![The proportional term reads error, the integral accumulates its area, and the derivative reads its slope](/assets/robotics/arm-control/03_pid_terms.png)

Why keep past error? Imagine the arm stops a little below its target under a steady load. The proportional correction balances the load, so the arm stays still. But the error is still positive. The integral keeps growing, adds more torque, and lifts the arm closer to the target. Once the error reaches zero, the integral stops growing. Its stored value supplies the torque that holds the load.

[PID control under a load](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-4-motion-control-with-torque-or-force-inputs-part-2-of-3/).

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v4/why_integral_helps.png" aria-label="The integral term builds torque to support a constant load as the angle error shrinks">
<source src="/assets/robotics/arm-control/v4/why_integral_helps.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v4/why_integral_helps.mp4">Watch the video</a>
</video>
<figcaption>The orange area records past error. As the arm reaches its target, the stored integral supplies the 2 N·m needed to hold the load. <a class="video-link" href="/assets/robotics/arm-control/v4/why_integral_helps.mp4">Open video</a></figcaption>
</figure>

### What happens if we remove P, I, or D?

I simulated one rotary link under a constant clockwise load. Every run starts at rest at 0°, with a target of 45.8°. I kept the same gains and set one to zero. This is an **ablation test**: change one part and watch what happens.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v4/pid_ablation_comparison.png" aria-label="Four synchronized simulations compare full PID with removal of I, D, or P">
<source src="/assets/robotics/arm-control/v4/pid_ablation_comparison.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v4/pid_ablation_comparison.mp4">Watch the video</a>
</video>
<figcaption>Same link, target, load, and starting state. Each panel removes one term from the same controller. The video shows 24 simulated seconds at twice normal speed. <a class="video-link" href="/assets/robotics/arm-control/v4/pid_ablation_comparison.mp4">Open video</a></figcaption>
</figure>

| Controller | What happened | What the missing term was doing |
|---|---|---|
| Full PID | Reaches within 2% of the target in 2.20 s and stays there | All three corrections work together |
| Remove I | Stops 7.16° short | I supplies the holding torque at zero error |
| Remove D | Overshoots by 64.3% and rings; settles in about 30 s | D brakes the motion |
| Remove P | Initially falls away from the target, then oscillates more and more | P supplies an immediate correction toward the target |

The no-I result has a simple explanation. At rest, D is zero, so P must balance the 2 N·m load. With $K_P=16$, this requires an error of $2/16=0.125$ rad, or 7.16°. With I enabled, the stored integral supplies that torque while the error approaches zero.

Removing D still leaves passive friction, so those oscillations eventually decay. Removing P produces growing oscillations with these gains. The arm and load stay fixed; each run removes one gain and keeps the others unchanged.

<details>
<summary>Simulation setup and checks</summary>

The link rotates in a horizontal plane with inertia $M=1$ kg·m² and viscous friction $b=0.5$ N·m·s/rad. A constant external torque of 2 N·m opposes positive rotation. The controller supplies torque directly:

$$
M\ddot q=u-b\dot q-2,\qquad
u=16e+4\int_0^t e(s)\,ds-7\dot q.
$$

The initial angle, velocity, and integrated error are zero. Each ablation sets one gain to zero. Actuation is continuous, with unlimited torque. The derivative uses measured velocity to avoid a kick when the target changes.

I integrated at 2 ms, repeated at 1 ms, and checked against the exact solution of this linear system. Angle differences were below $10^{-7}$ rad. Settling means staying within 2% of the target over an 80-second run. The system's poles confirm that the no-P response is unstable.

[Code, parameters, full traces, and results](https://github.com/Hadrien-Cornier/maniskill-playground/tree/main/experiments/pid-ablation).

</details>

### Why does the arm overshoot?

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/damping_joint_responses_poster.png" aria-label="Three joint responses to the same angle target">
<source src="/assets/robotics/arm-control/v3/damping_joint_responses.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/damping_joint_responses.mp4">Watch the video</a>
</video>
<figcaption>Simulated underdamped, critically damped, and overdamped responses. <a class="video-link" href="/assets/robotics/arm-control/v3/damping_joint_responses.mp4">Open video</a></figcaption>
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

The gripper has the same position **and orientation** in both configurations, while the elbow moves about 38 cm. The cube marks the shared target.

**Inverse kinematics (IK)** searches for joint angles matching a target:

$$
\{q\in Q_{valid}:g(q)=p^*\}.
$$

$Q_{valid}$ imposes joint limits and the chosen collision constraints. The answer may be empty or contain many configurations. IK is not a single-valued inverse function, and an IK solution is not a motion path.

This ambiguity matters during motion. A numerical solver seeded with the current configuration tends to select nearby solutions. Otherwise, repeated solves can choose different branches and produce abrupt target jumps.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/ik_branch_selection_poster.png" aria-label="IK branch jumps compared with continuous branch selection">
<source src="/assets/robotics/arm-control/v3/ik_branch_selection.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/ik_branch_selection.mp4">Watch the video</a>
</video>
<figcaption>Alternating IK solutions versus choosing the solution nearest the previous one. <a class="video-link" href="/assets/robotics/arm-control/v3/ik_branch_selection.mp4">Open video</a></figcaption>
</figure>

On the left, the animation alternates between two valid solutions. On the right, it selects the solution nearest the previous one.

## How do we describe gripper position mathematically?

Seven joints make the geometry look complicated. Let's start with a simpler arm: a fixed base and links that all bend in one plane.

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

Folding past the pan axis can make $r$ negative; horizontal distance is $|r|$.

Try two links with lengths 1 and 0.8. The shoulder angle is $q_1$. The elbow adds $q_2$, so the second link points at $q_1+q_2$. In the top view below:

$$
x=\cos q_1+0.8\cos(q_1+q_2),\qquad
y=\sin q_1+0.8\sin(q_1+q_2).
$$

```robotics-arm
```

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

The Jacobian is a **matrix-valued field over configuration space**. Its value changes with the whole arm configuration. For small changes, $\Delta p\approx J(q)\Delta q$.

At an interior point of $Q_{valid}$, its image contains the attainable instantaneous position velocities. Its kernel contains joint velocities that preserve hand position to first order. Rank 3 means the position derivative is surjective.

I kept mixing up three words. Their roots helped me separate them:

- **Kinematics** comes from Greek *kīnēma*, “motion,” from *kīnein*, “to move.” It describes positions, velocities, and accelerations without considering the forces that produce them. [Word origin](https://ahdictionary.com/word/search.html?q=kinematics).
- **Dynamics** comes from Greek *dynamis*, “power.” It connects forces and torques to motion. The same arm configuration with different velocities is a different state: a moving arm may need braking where a stationary arm does not. [Word origin](https://ahdictionary.com/word/search.html?q=dynamic).
- **Proprioception** combines Latin *proprius*, “one's own,” with the ending of *reception*, “receiving.” It means sensing your own body's state. For a robot, joint encoders provide this kind of information. [Word origin](https://www.ahdictionary.com/word/search.html?q=proprioception).

## Where can the hand actually go?

Looking at my arm on its table, I wondered about the whole reachable region. It cannot pass through the tabletop or its own links. The thickness of the hardware matters, as do objects around it.

My first guess was part of a sphere. Suppose pan is limited to 180° and the arm stays above a table. That leaves half of the upper hemisphere: a quarter-ball envelope.

![A hypothetical arm above a table with a 180-degree pan sweep gives a quarter-ball outer guess](/assets/robotics/arm-control/v3/hypothetical_quarter_ball.png)

Even two ideal links cannot fold closer than $|L_1-L_2|$ to the shoulder. Joint limits, thickness, and obstacles can exclude more space.

I tested the question on the Franka model. For each sampled set of joint angles, I computed the gripper position and checked collisions. This samples the workspace $g(Q_{valid})$.

![A highlighted slab through the sampled Franka workspace is shown beside the corresponding face-on cut](/assets/robotics/arm-control/v3/franka_workspace_slab.png)

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/franka_workspace_slab.png" aria-label="Moving slab through the Franka workspace with a matching side view">
<source src="/assets/robotics/arm-control/v3/franka_workspace_slab.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/franka_workspace_slab.mp4">Watch the video</a>
</video>
<figcaption>Sampled workspace: the highlighted slab in 3D corresponds to the 2D cut beside it. <a class="video-link" href="/assets/robotics/arm-control/v3/franka_workspace_slab.mp4">Open video</a></figcaption>
</figure>

The orange slab is a **6 cm thick band**, moving sideways through the cloud. The right panel looks straight at that band: signed forward/back position relative to the base versus height, grouped into 4 cm cells. It shows only the above-table portion of the data. Teal means at least one valid hand position was found in that cell. Blank cells contain no accepted sample. The arm stays fixed as a spatial reference while the slab scans the cloud.

<details>
<summary>What did the experiment actually measure?</summary>

I sampled 300,000 configurations uniformly within the seven arm joints' model limits, with the fingers open. Of these, 263,270 passed the recorded self-collision and environment checks. The table, ground, and task cube were included. Uniform joint sampling is not uniform sampling of hand positions.

Sampling gives a partial picture of the workspace; blank regions may still contain reachable points. [Model, joint limits, collision rules, data, and reproduction](https://github.com/Hadrien-Cornier/maniskill-playground/tree/main/experiments/workspace).

</details>

## Reaching the stem is not enough

Suppose I want to grasp a wine glass by its stem. Reaching the stem's position is only part of the problem: the gripper must approach in a useful orientation, with room for its fingers.

![A gripper reaches a schematic wine-glass stem with different orientations at the same target](/assets/robotics/arm-control/v3/franka_wine_orientation_comparison.png)

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/arm-control/v3/franka_wine_orientation.png" aria-label="Gripper orientations around a fixed wine-stem target">
<source src="/assets/robotics/arm-control/v3/franka_wine_orientation.mp4" type="video/mp4">
<a href="/assets/robotics/arm-control/v3/franka_wine_orientation.mp4">Watch the video</a>
</video>
<figcaption>Changing gripper orientation around a fixed target. <a class="video-link" href="/assets/robotics/arm-control/v3/franka_wine_orientation.mp4">Open video</a></figcaption>
</figure>

In the simulation, the hand keeps the same target point while changing orientation.

So the hand needs more than an XYZ point. Attach an orthonormal frame to it. Express its three unit axes in world coordinates and put them in the columns of a matrix:

$$
R=\begin{bmatrix}|&|&|\\\mathbf x_g&\mathbf y_g&\mathbf z_g\\|&|&|\end{bmatrix},\qquad
R^TR=I,\quad\det R=1.
$$

This is a rotation matrix, $R\in SO(3)$. Position and orientation together give a **pose**, $(p,R)\in SE(3)$. $R=I$ means aligned axes.

Imagine looking straight down at the arm in the video. Put two perpendicular arrows on the gripper, lying in the tabletop plane: X points right and Y points up the page. Now turn both arrows counterclockwise by $\theta$. Where does each arrow point? Those coordinates become the columns of the rotation matrix.

![Two perpendicular axes rotate together, giving cosine and negative sine in the first row](/assets/robotics/arm-control/04_rotation_columns.png)

$$
R_z(\theta)=\begin{bmatrix}
\cos\theta&-\sin\theta&0\\
\sin\theta&\cos\theta&0\\
0&0&1
\end{bmatrix}.
$$

The first axis becomes $(\cos\theta,\sin\theta,0)$. The second stays $\pi/2$ ahead, hence $(-\sin\theta,\cos\theta,0)$. At 90°, it points left. A twist about the gripper's local Z axis composes as $R_{new}=R_{old}R_z(\theta)$.

The **pose workspace** contains reachable position-orientation pairs. The **dexterous workspace** contains positions reachable at every orientation.

## Who chooses the next target?

We can now work backward from the motor. In the SO-101 position-control setup, the servo needs a joint-angle target. It cannot interpret “grasp the cup.” Something above it must turn that goal into commands.

![A question tree branches between planning, learned joint targets, and learned hand targets, then joins at the servo feedback loop](/assets/robotics/arm-control/v3/command_questions.png)

**Classical planning:** choose a grasp pose, use IK to find a joint configuration, then plan and time a collision-free path into intermediate joint targets. IK chooses an endpoint; planning supplies the motion between endpoints.

**ACT:** predicts a chunk of future joint targets from images and measured joint positions in the original ALOHA setup. Execution selects or combines chunk targets as fresh observations produce new predictions. Temporal ensembling can combine overlapping chunks. [ACT paper](https://tonyzhaozh.github.io/aloha/).

**Learned task-space targets:** a model can instead propose a hand pose or displacement. An interface then uses IK or a Cartesian controller to produce commands the robot accepts.

One way to combine models is to let a **vision-language model (VLM)** select a high-level goal and a **vision-language-action model (VLA)** predict motion commands. Some VLAs take images and instructions directly; their outputs may be joint or task-space commands. [PaLM-E](https://palm-e.github.io/), [OpenVLA](https://arxiv.org/html/2406.09246v3#S3).

Other robots accept velocity or torque commands. The common requirement is to match the controller's interface, units, frame, and timing.

---

**Sources and inspiration.** Jacob Rothschild's [control article](https://x.com/ja_rothschild/article/2100633491432239411) helped inspire this report. Also: [Modern Robotics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/), [SO-101 joint guide](https://huggingface.co/docs/lerobot/so101), and [asset credits and licenses](/assets/robotics/arm-control/ASSET-NOTICES.md). Robot renderings use the simulated model; the planar and control animations are teaching schematics.
