---
title: 'Target, goal, and the servo in the middle'
description: 'Why a cheap robot arm misses the angle you ask for, and why every fix comes down to one question: where do I put the goal?'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 1
---

> **In this series.** I'm researching whether a robot controller can be more accurate than the classical controllers. That question took me on a journey. First I had to understand the classical controllers and the problems they fix. Then I tested them on my real SO-101 arm and in the Genesis simulator. This is part 1 of 5.
> [ROUGH DRAFT: series box with links to parts 2 to 5]

I tell my arm to follow a path. It's a smooth motion, nothing fancy. The shoulder lifts, the elbow bends, the wrist turns. And the arm doesn't quite follow. It's late. It stops short. When it holds still, it sags a little below where I asked.

How bad is it? With the default LeRobot setup at 30 Hz, the joints miss the path by 22.5 mrad on average. That's about 1.3 degrees. It doesn't sound like much until you put a gripper 30 cm out at the end of the arm and try to pick up a screw.

> **[MEDIA: tracking viewer clip]** The real arm on the "cat" motion with the `direct` controller. A ghost arm shows the target. The error is magnified 20 times so you can see it. The arm turns red where it misses most.

So why does the arm miss? And what does each fix actually buy? This series is my attempt to answer that, one problem at a time.

## The map: fourteen controllers, one motion

Before I explain anything, here's the whole picture. I ran the same motion with each controller I built. Each one changes one thing compared with the one before it.

> **[MEDIA: side-by-side viewer grid]** The same real motion with `direct`, `inv`, `pi`, `solve` and `mpc`, error magnified. Bar chart under it: total error per controller. Real arm, cat motion, 60 Hz: pi 8.4, solve 6.2, mpc 6.0 mrad. direct at 30 Hz: 22.5 mrad. [ROUGH DRAFT: decide which runs share the same rate; check that the grid uses one rate]

The controllers form a family tree. Every arrow means "starts from this controller and adds one part".

> **[FIGURE: family tree]** Base: direct, lead, inv. Feedback and gravity: pi, sag, grav, pisag. Adaptive: adapt, rls. Model-based: solve, mpc, mpca. Repeated paths: ilc, ilcmpc. Click a name to jump to its section in part 4.

And here's the table I wish I had on day one. Each row is a controller. Each column is a kind of error. Read a column to find what fixes the error you see.

> **[FIGURE: error matrix "Which error does each controller remove?"]** Columns link to part 2.
> Note under the matrix: this is a teaching summary. I made it from the design of each controller and from simulated tests. The real arm checked it only for `pi` on one motion.

The rest of this article sets up the one idea you need to read that table.

## Target, goal, gap

> **[FIGURE: spring picture]** A joint on a spring. The goal is the anchor of the spring, the target is a dashed line. Gravity stretches the spring until kp × gap = G. Three panels: no load (gap 0), gravity (gap 28.7 mrad), gravity plus a tool (larger gap).

Here are the three words that confused me the most. I'll use each one with exactly one meaning for the whole series.

- The **target** is where I want the joint to be. It comes from the policy, or from a path I planned.
- The **goal** is the number I actually send to the servo.
- The **gap** is the goal minus the measured position of the joint.

Why would the goal ever differ from the target? Because of the gap.

Think of the servo as a spring. The goal is where you attach one end of the spring. The joint is on the other end. Gravity pulls the joint down, and the spring stretches until it pulls back just as hard. The spring only pulls when it's stretched. No stretch, no force.

So if I put the goal exactly on the target, the joint can't sit on the target. It must sag until the stretch makes enough torque to hold the arm up. The size of that sag is the torque divided by the stiffness:

$$
\text{sag} = \frac{G}{k_p}
$$

Units: N·m ÷ (N·m/rad) = rad. A torque over a stiffness is an angle.

On the simulated shoulder at the example hold pose, gravity is 0.391 N·m and the servo stiffness is 13.64 N·m/rad. That's a sag of 28.7 mrad.

Now the important part. **Every extra force needs more gap.** Gravity, friction, a tool in the gripper, the force to speed the joint up, the damping that resists motion. If the goal stays on the target, all of that shows up as error.

So the whole problem is this: **where do I put the goal?** Every controller in this series is one answer to that question.

<details>
<summary>Predict first: what does the servo need to hold the arm still? (exam S1)</summary>

[ROUGH DRAFT: predict box S1. P-only servo, static sag G/kp.]

</details>

<details>
<summary>Units: ticks, mrad and degrees</summary>

The encoder counts 4096 ticks per turn. One turn is 2π rad, so 1 tick = 1.534 mrad = 0.088°. One degree is 17.45 mrad, or about 11.4 ticks. I use mrad in this series because the errors are a few mrad to a few tens of mrad.

</details>

<details>
<summary>Glossary</summary>

[ROUGH DRAFT: shared glossary. Target, goal, measured q, tick, gap, stiffness, damping time constant, dead time, dead band, wet and dry friction, sag, feedforward, feedback, inner and outer loop, preview, horizon, observer, w.]

</details>

## The servo sits in the middle

> **[PHOTO: the STS3215 opened]** Motor, gearbox, encoder magnet and control board, labelled. [ROUGH DRAFT: photo source and license, or a drawing]

Here's something that took me a while to accept. I can't drive the motor of my arm. I can only talk to the servo.

Each joint of the SO-101 is a smart servo, an STS3215. Inside it there's a motor, a gearbox, an encoder and a small controller. That controller runs its own loop: it reads the encoder, compares it with the goal I sent, and sets the motor power. I never touch the motor power. I send goals.

So there are two loops.

1. The **inner loop** runs inside the servo, fast, on the motor.
2. The **outer loop** runs on my computer at 30 or 60 Hz. It reads the joint angles and sends goals.

> **[FIGURE: two nested loops]** Outer loop (computer): target → controller → goal. Inner loop (servo firmware): goal − encoder → P/D → motor power → joint. The encoder feeds both loops.

Every controller in this series lives in the outer loop. None of them changes how the servo works inside. They only choose a better goal.

> **[WIDGET: servo-equation]** The full loop as one equation. Hover or tap a term to see what it is, its unit, and its typical value: target, outer PI, goal, firmware P/D, dead time, friction, sag, joint.

## What PID means

> **[FIGURE: P, I, D as physical parts]** P as a spring, I as a slowly filling bucket that adds push, D as a damper in honey. Each panel shows the joint response to a step goal with only that term.

If you've seen anything about robot control, you've probably seen "PID". I had seen it many times without knowing what it really did. On a servo, each letter is something physical.

- **P (proportional)** pushes in proportion to the gap. That's the spring. Its gain $k_p$ is a stiffness, in N·m/rad. A bigger P makes a stiffer spring.
- **I (integral)** adds up the error over time. If a small error stays, the integral keeps growing until it pushes hard enough to remove it.
- **D (derivative)** pushes against the speed. That's damping, like moving through honey.

<details>
<summary>Where I was wrong: is kp the inertia?</summary>

I first thought $k_p$ was some kind of inertia. It isn't. Inertia (kg·m²) resists a change of speed and doesn't care where the goal is. $k_p$ is a stiffness: torque per radian of gap. It depends on the firmware P register, the supply voltage, the motor and the gearbox.

</details>

So what does LeRobot set? I expected a careful calibration of each joint. Here's what my calibration file actually stores for each motor: five integers. The motor id, the turn direction, a homing offset, and a minimum and a maximum position. For example, my shoulder_lift has a homing offset of 941 and a range of 844 to 3214 ticks.

At each connect, LeRobot writes the same servo settings to every motor: position mode, P = 16, I = 0, D = 32. The gripper also gets a 50 % torque cap. [ROUGH DRAFT: check MotorCalibration and configure() in the current LeRobot source]

So the control loop is the same on every SO-101 in the world. Nothing measures the stiffness, the damping, the friction, the dead time or the gravity of my own arm. LeRobot's calibration is geometric: where zero is and where the limits are. It's not a dynamic calibration: how this joint responds to a goal. The rest of this series is about the second kind.

> **[FIGURE: two columns]** "What LeRobot stores" (id, drive_mode, homing_offset, range_min, range_max) against "What the controllers needed" (stiffness, damping, dead time, dead band, friction, gravity, lag).

<details>
<summary>Predict first: what does the calibration file store? (exam D1)</summary>

[ROUGH DRAFT: predict box D1.]

</details>

Why I = 0? It isn't documented. My best guess is the gripper. When the gripper squeezes an object, it never reaches its goal. An integral would keep growing until the motor gives full torque and heats up. That's a guess, not a fact. The cost of I = 0 is the steady sag $G/k_p$ we saw above. Our outer `pi` controller adds the integral back, outside the servo.

## From torque to milliradians to milliseconds

This was the most useful tool I picked up in the whole project. Three units kept showing up: N·m of torque, mrad of error, and ms of lag. When can you convert between them?

**Torque to gap.** The servo makes torque only from the gap, so gap = torque / $k_p$. This is servo physics. It holds for every controller.

**Speed to lag.** Damping needs a torque $d\,v$ at speed $v$. So the servo needs a gap of $d\,v / k_p$. Now look at that gap differently: it's exactly the distance the target travels in $d/k_p$ seconds. So damping acts like a time delay.

$$
\text{lag} = \frac{d}{k_p} = \frac{1.058}{13.64} = 77.6\ \text{ms}
$$

Units: (N·m·s/rad) ÷ (N·m/rad) = s.

Picture pulling a box through honey with a spring. Your hand has to stay ahead of the box by a fixed stretch. Pull harder and the box goes faster, but your hand is still ahead. More torque doesn't remove the lag. Putting the goal ahead of the target does. That's called feedforward.

**Lag to error.** If the joint is late by a time $\Delta t$ and moves at speed $v$, the error is $v\,\Delta t$. Units: s × rad/s = rad.

> **[WIDGET: lag-vs-error]** Sliders: speed, stiffness, load, damping. Shows the lag in ms and the error in mrad side by side.

<details>
<summary>Predict first: how late does the joint arrive? (exam D2)</summary>

The target moves at a constant speed. Use $d$ = 1.058 N·m·s/rad, $k_p$ = 13.64 N·m/rad and a goal that changes only every 33.3 ms. How long after the target does the joint arrive?

[ROUGH DRAFT: answer box. 77.6 ms from damping + 16.7 ms from the goal hold ≈ 94 ms. Measured: 105.5 to 108.4 ms, the simple estimate is about 12 % low.]

</details>

<details>
<summary>Where I was wrong: 77 ms</summary>

I answered 77 ms. I forgot that the goal changes only once per 33 ms step. On average the goal is half a step old, which adds 16.7 ms.

</details>

## The error budget of one real step

Let's put it all together on one moment of one path. The shoulder_lift moves at 0.70 rad/s against gravity. The measured error is 115.2 mrad. Which part is the largest?

<details>
<summary>Predict first (exam S4)</summary>

Gravity, damping, dry friction, inertia, or the goal hold?

</details>

Here's the budget. Each torque becomes a gap through $k_p$.

| Part | Torque (N·m) | Gap (mrad) |
|---|---:|---:|
| Gravity | 0.442 | 32.4 |
| Damping, 1.058 × 0.70 | 0.744 | 54.6 |
| Dry friction | 0.196 | 14.4 |
| Inertia | 0.028 | 2.1 |
| Goal hold | | 12.0 |
| **Sum** | | **115.3** |

The measured value is 115.2 mrad. Damping wins. At this speed, moving costs more error than holding the arm up.

> **[WIDGET: error-budget]** Stacked bar. Sliders for speed and load. A "worn" toggle.

## Why not make the servo infinitely stiff?

When I saw gap = torque / $k_p$, my first thought was: just make $k_p$ huge. The gap goes to zero, the error goes to zero. Done?

The simulation has an answer. The "stiff_servo" robot has $k_p$ × 1.62. If all of the error scaled with $1/k_p$, it would drop from 37.2 to 23 mrad. It dropped to 24.8. Why not 23?

Because only the torque part of the error scales with $1/k_p$. Write the error as

$$
e \approx \frac{G + d\,v + f + J\,a}{k_p} + \frac{v\,\Delta t}{2}
$$

The last part is the goal hold. It doesn't care about stiffness. Fitting the two robots gives a torque part of 32.2 mrad and a goal-hold part of 5.0 mrad. That fit predicts 40.6 mrad for a robot with a weaker supply ($k_p$ × 0.90). The measured value was 40.5.

> **[FIGURE: error against kp]** The curve goes flat at the goal-hold part.

So even infinite stiffness leaves the goal hold. On the real arm it also leaves the dead time, which we'll meet in part 2.

And a very stiff loop causes its own problems:

1. **Torque clamp.** The servo can't push more than about 5.1 N·m. With a huge $k_p$, a tiny gap already asks for full torque. The motor ends up switching between full push and full pull.
2. **Ticks.** The encoder reads whole ticks. Each tick change becomes a torque jump of $k_p$ × 1 tick. With a huge $k_p$, the joint chatters between two ticks.
3. **Delay.** A stiff loop pushes hard on information that's already old. It overshoots, then overshoots the other way. In practice, an outer gain of 4 is stable and a gain of 100 oscillates.

## What's next

So the arm misses because the servo needs a gap, and every force needs more gap. In [part 2](/robotics/so101-2-what-pulls-the-joint/), I go through each force one by one: ticks, dead time, friction, heat, gravity, speed coupling and a payload. [ROUGH DRAFT: links]
