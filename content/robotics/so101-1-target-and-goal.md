---
title: 'Target, goal, and the servo in the middle'
description: 'Why a cheap robot arm misses the angle you ask for, and why every fix comes down to one question: where do I put the goal?'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 1
---

> **In this series.** I've been trying to find out whether a robot controller can be more accurate than the classical ones. To answer that, I first had to understand how the classical controllers work and which problems each of them fixes, and then test them on my own SO-101 arm and in the Genesis simulator. This is part 1 of 5.
> [ROUGH DRAFT: series box with links to parts 2 to 5]

When I send my arm a smooth path to follow, it doesn't quite follow it. It arrives a little late, it stops a little short, and when it's supposed to hold still it sags slightly below the angle I asked for. With the default LeRobot setup running at 30 Hz, the joints end up 22.5 mrad away from the path on average, which is about 1.3 degrees. That doesn't sound like a lot until you remember the gripper sits 30 cm out at the end of the arm, and that I'd like it to pick up something as small as a screw.

> **[MEDIA: tracking viewer clip]** The real arm on the "cat" motion with the `direct` controller. A ghost arm shows the target. The error is magnified 20 times so you can see it. The arm turns red where it misses most.

So I wanted to understand why the arm misses, and what each of the usual fixes actually buys me. This series goes through it one problem at a time It starts with the gap between the goal and the joint, because the rest of the series builds on it.

## The map: fourteen controllers, one motion

Here is the same motion run with each of the controllers I built. Each one starts from an earlier controller and adds a single part to it.

> **[MEDIA: side-by-side viewer grid]** The same real motion with `direct`, `inv`, `pi`, `solve` and `mpc`, error magnified. Bar chart under it: total error per controller. Real arm, cat motion, 60 Hz: pi 8.4, solve 6.2, mpc 6.0 mrad. direct at 30 Hz: 22.5 mrad. [ROUGH DRAFT: decide which runs share the same rate; check that the grid uses one rate]

If you draw which controller grows out of which, you get a family tree with five branches.

> **[FIGURE: family tree]** Base: direct, lead, inv. Feedback and gravity: pi, sag, grav, pisag. Adaptive: adapt, rls. Model-based: solve, mpc, mpca. Repeated paths: ilc, ilcmpc. Click a name to jump to its section in part 4.

This table shows which errors each controller deals with. Each row is a controller and each column is a kind of error, so if you see a particular error on your arm, you can read down its column.

> **[FIGURE: error matrix "Which error does each controller remove?"]** Columns link to part 2.
> Note under the matrix: this is a teaching summary. I made it from the design of each controller and from simulated tests. The real arm checked it only for `pi` on one motion.

The rest of this article explains the idea behind that table.

## Target, goal, gap


Three words confused me for a long time, mostly because I used them as if they meant the same thing. In this series each one has a single meaning:

- the **target** is where I want the joint to be, either from a policy or from a path I planned;
- the **goal** is the number I actually send to the servo;
- the **gap** is the difference between the goal and where the joint really is.

Why would I ever send a goal that isn't the target? The easiest way I found to think about it is to picture the servo as a spring. The goal is where you attach one end of the spring and the joint hangs on the other end. Gravity pulls the joint down, and the spring stretches until it pulls back just as hard. The important part is that the spring only pulls when it's stretched, so the servo can only make torque when there's a gap.

![Three drawings of one joint as a torsion spring. With no load, the goal and the joint sit on the target. With gravity and the goal on the target, the joint sags below and the spring between goal and joint stretches. With the goal moved up past the target, the stretched spring holds the joint on the target.](/assets/robotics/so101-series/spring-goal.png "The servo acts like a torsion spring between the goal and the joint. Angles are exaggerated.")

As far as I can tell the picture is accurate for the main part of the servo. Its P term follows a spring law: the torque is $k_p$ times the gap, the same way a torsion spring pushes back harder the more you twist it. The real servo adds a few things on top of that spring, like damping, a small dead band where it makes no torque, and a maximum torque, and I come back to each of them later.

That means if I put the goal exactly on the target, the joint can't actually stay on the target. It has to sag until the stretch is large enough to hold the arm up, and the size of that sag is the gravity torque divided by the stiffness of the spring:

$$
\text{sag} = \frac{G}{k_p}
$$

The units are N·m ÷ (N·m/rad) = rad, so a torque divided by a stiffness gives you an angle. On the simulated shoulder at the example hold pose, gravity is 0.391 N·m and the servo stiffness is 13.64 N·m/rad, which gives a sag of 28.7 mrad.

The same reasoning works for every other force on the joint: friction, a tool in the gripper, the force needed to speed the joint up, the damping that resists motion. Each of them needs a bit more gap, and if the goal stays on the target, all of that extra gap shows up as error.

So the problem I kept coming back to was really just this one: where should I put the goal? Every controller in the series is a different answer to that question.

<details>
<summary>Predict first: what does the servo need to hold the arm still? (exam S1)</summary>

[ROUGH DRAFT: predict box S1. P-only servo, static sag G/kp.]

</details>

<details>
<summary>Units: ticks, mrad and degrees</summary>

The encoder counts 4096 ticks per turn. One turn is 2π rad, so 1 tick is 1.534 mrad, or 0.088°. One degree is 17.45 mrad, which is about 11.4 ticks. I use mrad in this series because most of the errors are somewhere between a few mrad and a few tens of mrad.

</details>

<details>
<summary>Glossary</summary>

[ROUGH DRAFT: shared glossary. Target, goal, measured q, tick, gap, stiffness, damping time constant, dead time, dead band, wet and dry friction, sag, feedforward, feedback, inner and outer loop, preview, horizon, observer, w.]

</details>

## The servo sits in the middle

> **[PHOTO: the STS3215 opened]** Motor, gearbox, encoder magnet and control board, labelled. [ROUGH DRAFT: photo source and license, or a drawing]

Something that took me a while to accept is that I can't actually drive the motors of my arm. I can only talk to the servos. Each joint of the SO-101 is a smart servo, the STS3215, with a motor, a gearbox, an encoder and a small controller inside. That little controller runs its own loop: it reads the encoder, compares it with the goal I sent, and decides how much power to give the motor. I never get to set the motor power myself. All I can do is send goals.

So there are really two loops stacked on top of each other. The inner loop runs fast inside the servo and drives the motor. The outer loop runs on my computer at 30 or 60 Hz, reads the joint angles and sends new goals.

> **[FIGURE: two nested loops]** Outer loop (computer): target → controller → goal. Inner loop (servo firmware): goal − encoder → P/D → motor power → joint. The encoder feeds both loops.

Every controller in this series lives in that outer loop. None of them changes how the servo works inside; they can only try to send it a better goal.

> **[WIDGET: servo-equation]** The full loop as one equation. Hover or tap a term to see what it is, its unit, and its typical value: target, outer PI, goal, firmware P/D, dead time, friction, sag, joint.

## What PID actually means

> **[FIGURE: P, I, D as physical parts]** P as a spring, I as a slowly filling bucket that adds push, D as a damper in honey. Each panel shows the joint response to a step goal with only that term.

I'd seen "PID" many times before this project without really knowing what it did. On a servo, each of the three letters turns out to be something you can picture physically. P, the proportional term, pushes in proportion to the gap, so it's the spring from earlier, and its gain $k_p$ is a stiffness in N·m/rad. I, the integral term, adds up the error over time, so if a small error refuses to go away, the integral keeps growing until it pushes hard enough to remove it. D, the derivative term, pushes against the speed, which acts like damping, a bit like moving the joint through honey.

<details>
<summary>Where I was wrong: is kp the inertia?</summary>

At first I thought $k_p$ was some kind of inertia. It isn't. Inertia (kg·m²) resists changes of speed and doesn't care where the goal is, while $k_p$ is a stiffness: how much torque you get per radian of gap. On this servo it depends on the firmware P register, the supply voltage, the motor and the gearbox.

</details>

Knowing that, I was curious what LeRobot actually sets up when you calibrate the arm. I expected some measurement of each joint, but my calibration file stores five integers per motor: the motor id, the turn direction, a homing offset, and a minimum and maximum position. My shoulder_lift, for example, has a homing offset of 941 and a range from 844 to 3214 ticks. Then, every time the arm connects, LeRobot writes the same servo settings to every motor: position mode with P = 16, I = 0 and D = 32, plus a 50 % torque cap on the gripper. [ROUGH DRAFT: check MotorCalibration and configure() in the current LeRobot source]

So the control loop is identical on every SO-101, and nothing in it knows the stiffness, damping, friction, delay or gravity of my particular arm. I'd describe LeRobot's calibration as geometric, because it finds where zero is and where the limits are. It isn't a dynamic calibration, which would tell you how this specific joint responds to a goal, and that second kind is what the rest of this series is about.

> **[FIGURE: two columns]** "What LeRobot stores" (id, drive_mode, homing_offset, range_min, range_max) against "What the controllers needed" (stiffness, damping, dead time, dead band, friction, gravity, lag).

<details>
<summary>Predict first: what does the calibration file store? (exam D1)</summary>

[ROUGH DRAFT: predict box D1.]

</details>

I also wondered why the integral is set to zero. As far as I can tell it isn't documented, so this is a guess, but I think the gripper is a likely reason. When the gripper closes on an object it never reaches its goal, and an integral term would keep growing until the motor is pushing at full torque and heating up. The price of I = 0 is the steady sag $G/k_p$ from earlier, and one of the first things our outer `pi` controller does is add an integral back, outside the servo.

## From torque to milliradians to milliseconds

Three units kept showing up in this project: N·m of torque, mrad of error, and ms of lag. I found it super striking that you can often convert one into another, as long as you know when the conversion is valid.

Going from torque to gap is the easy one. The servo only makes torque from the gap, so the gap is the torque divided by $k_p$, and that holds for every controller because it's just how the servo works.

Going from speed to lag took me longer. Damping needs a torque $d\,v$ when the joint moves at speed $v$, so the servo needs a gap of $d\,v / k_p$ to provide it. But if you look at that gap from the target's point of view, it's exactly the distance the target travels in $d/k_p$ seconds. In other words, damping makes the joint behave as if it were running a fixed time behind the target:

$$
\text{lag} = \frac{d}{k_p} = \frac{1.058}{13.64} = 77.6\ \text{ms}
$$

The units work out as (N·m·s/rad) ÷ (N·m/rad) = s. The picture I use is pulling a box through honey with a spring: your hand always has to stay a fixed stretch ahead of the box. Pulling harder makes the box go faster, but your hand is still ahead of it. More torque doesn't remove the lag. What removes it is putting the goal ahead of the target by that amount, which is what control people call feedforward.

The last conversion closes the loop. If the joint runs $\Delta t$ behind and moves at speed $v$, the error is $v\,\Delta t$, and the units are s × rad/s = rad again.

> **[WIDGET: lag-vs-error]** Sliders: speed, stiffness, load, damping. Shows the lag in ms and the error in mrad side by side.

<details>
<summary>Predict first: how late does the joint arrive? (exam D2)</summary>

The target moves at a constant speed. Use $d$ = 1.058 N·m·s/rad, $k_p$ = 13.64 N·m/rad and a goal that changes only every 33.3 ms. How long after the target does the joint arrive?

[ROUGH DRAFT: answer box. 77.6 ms from damping + 16.7 ms from the goal hold ≈ 94 ms. Measured: 105.5 to 108.4 ms, the simple estimate is about 12 % low.]

</details>

<details>
<summary>Where I was wrong: 77 ms</summary>

My answer was 77 ms. I'd forgotten that the goal only changes once every 33 ms step, so on average the goal I'm following is already half a step old, which adds another 16.7 ms.

</details>

## The error budget of one real step

To see how this plays out, let's take one moment of one path. The shoulder_lift is moving at 0.70 rad/s against gravity, and the measured error at that moment is 115.2 mrad. Before reading on, which part do you think is the largest: gravity, damping, dry friction, inertia, or the fact that the goal is only updated every step?

<details>
<summary>Predict first (exam S4)</summary>

Gravity, damping, dry friction, inertia, or the goal hold?

</details>

If you turn each torque into a gap by dividing it by $k_p$, you get this budget:

| Part | Torque (N·m) | Gap (mrad) |
|---|---:|---:|
| Gravity | 0.442 | 32.4 |
| Damping, 1.058 × 0.70 | 0.744 | 54.6 |
| Dry friction | 0.196 | 14.4 |
| Inertia | 0.028 | 2.1 |
| Goal hold | | 12.0 |
| **Sum** | | **115.3** |

The parts add up to 115.3 mrad, against 115.2 measured, and the biggest one is damping. I expected gravity to dominate, but at this speed moving the joint costs more error than holding it up.

> **[WIDGET: error-budget]** Stacked bar. Sliders for speed and load. A "worn" toggle.

## Why not make the servo infinitely stiff?

Once I saw that the gap is the torque divided by $k_p$, my first thought was to just make $k_p$ huge so the gap, and the error with it, would go to zero. It seemed too easy, so I checked it against the simulation. One of the simulated robots, which I called stiff_servo, has a $k_p$ 1.62 times higher than normal. If all of the error scaled with $1/k_p$, the error should have dropped from 37.2 to 23 mrad, but it only dropped to 24.8.

The reason is that only part of the error depends on the stiffness. You can write the error roughly as

$$
e \approx \frac{G + d\,v + f + J\,a}{k_p} + \frac{v\,\Delta t}{2}
$$

where the first part is the torque divided by the stiffness and the last part is the goal hold, which doesn't care about $k_p$ at all. Fitting the normal and the stiff robots gives about 32.2 mrad for the torque part and 5.0 mrad for the goal hold, and that same fit predicts 40.6 mrad for a robot with a weaker supply ($k_p$ × 0.90). The measured value for that robot was 40.5, so the split also works on a third robot.

> **[FIGURE: error against kp]** The curve goes flat at the goal-hold part.

So even an infinitely stiff servo would still leave the goal hold, and on the real arm it would also leave the dead time we'll see in part 2. On top of that, a very stiff loop brings its own problems. The servo can't push more than about 5.1 N·m, so with a huge $k_p$ even a tiny gap asks for full torque and the motor ends up switching between pushing as hard as it can one way and the other. The encoder also only reads whole ticks, and every time the reading changes by one tick the torque jumps by $k_p$ times that tick, so the joint chatters between two ticks. And because the information the loop acts on is always a little old, a stiff loop pushes hard on a position that has already changed, overshoots, and then overshoots the other way. In practice, an outer gain of 4 stays stable and a gain of 100 oscillates.

## What's next

So the arm misses because the servo needs a gap to make torque, and every force on the joint needs a bit more of it. In [part 2](/robotics/so101-2-what-pulls-the-joint/) I go through those forces one at a time: ticks, dead time, friction, heat, gravity, speed coupling and carrying a payload. [ROUGH DRAFT: links]
