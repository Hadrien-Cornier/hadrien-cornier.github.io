---
title: 'Target, goal, and the servo in the middle'
description: 'Why a cheap robot arm misses the angle you ask for, and why every fix comes down to one question: where do I put the goal?'
date: '2026-10-05'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 1
---

I've been trying to find out whether a robot controller can be more accurate than the classical ones. To answer that, I first had to understand how the classical controllers work and which problems each of them fixes, and then test them on my own SO-101 arm and in the Genesis simulator. This series is what I learned along the way.

When I send my arm a smooth path to follow, it doesn't quite follow it. It arrives a little late, it stops a little short, and when it's supposed to hold still it sags slightly below the angle I asked for. With the default LeRobot setup running at 30 Hz, the joints end up 22.5 mrad away from the path on average, which is about 1.3 degrees. That doesn't sound like a lot until you remember the gripper sits 30 cm out at the end of the arm, and that I'd like it to pick up something as small as a screw.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/cat-direct.png" aria-label="The real SO-101 arm following a recorded motion with the default controller, with its joint error plotted under it">
<source src="/assets/robotics/so101-series/cat-direct.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/cat-direct.mp4">Watch the video</a>
</video>
<figcaption>My real arm on the "cat" motion with the default controller (`direct`, 30 Hz), replayed from the recorded joint angles. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. The numbers cover this 16 s window only. <a class="video-link" href="/assets/robotics/so101-series/cat-direct.mp4">Open video</a></figcaption>
</figure>

So I wanted to understand why the arm misses, and what each of the usual fixes actually buys me. This series goes through it one problem at a time. It starts with the gap between the goal and the joint, because the rest of the series builds on it.

## The map: fourteen controllers, one motion

Here is the same motion run with each of the controllers I built. Each one starts from an earlier controller and adds a single part to it.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/cat-four.png" aria-label="The same real motion with four controllers side by side: direct, pi, solve and mpc, each with its error drawn larger and plotted under it">
<source src="/assets/robotics/so101-series/cat-four.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/cat-four.mp4">Watch the video</a>
</video>
<figcaption>The same motion on the real arm with four controllers. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. `direct` ran at 30 Hz and the other three at 60 Hz, so the loop rate is part of the difference. The numbers cover this 16 s window only. <a class="video-link" href="/assets/robotics/so101-series/cat-four.mp4">Open video</a></figcaption>
</figure>

![Bar chart of the real-arm tracking error. Cat motion: direct 22.5 mrad at 30 Hz, pi 8.4, solve 6.2 and mpc 6.0 at 60 Hz. Signature motion: direct 28.3, lead 23.7 and inv 13.4 mrad.](/assets/robotics/so101-series/map-errors.png "Real arm, RMS error over all five joints and the whole motion. The two motions are different, so compare bars within a motion.")

If you draw which controller grows out of which, you get a family tree with five branches.

```so101-widget
{"type": "family-tree", "fallback": "Family tree of the controllers. Base: direct, then lead, then inv. Feedback and gravity: pi, sag, grav, pisag. Adaptive: adapt, rls. Model-based: solve, mpc, mpca. Repeated paths: ilc, ilcmpc. Each controller starts from an earlier one and adds one part.", "links": {"direct": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "lead": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "inv": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "pi": "/robotics/so101-4-goal-ahead/#feedback-pi", "sag": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "grav": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "pisag": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "adapt": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "rls": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "mpca": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "solve": "/robotics/so101-4-goal-ahead/#planning-solve-and-mpc", "mpc": "/robotics/so101-4-goal-ahead/#planning-solve-and-mpc", "ilc": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc", "ilcmpc": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc"}}
```

This table shows which errors each controller deals with. Each row is a controller and each column is a kind of error, so if you see a particular error on your arm, you can read down its column.

```so101-widget
{"type": "error-matrix", "fallback": "Which error each controller removes. direct: none. lead: part of the delay. inv: the delay. pi, sag, grav, pisag: the gravity sag, pi also part of a load change. solve and mpc: delay, dead band, sag and part of the model error. mpca, adapt, rls: load changes. ilc, ilcmpc: repeated errors. This matrix is a teaching summary, made from the design of each controller and simulated tests. The real arm checked it only for pi on one motion.", "columnLinks": {"delay": "/robotics/so101-2-what-pulls-the-joint/#three-kinds-of-delay", "band": "/robotics/so101-2-what-pulls-the-joint/#low-speed-is-the-hard-case", "sag": "/robotics/so101-2-what-pulls-the-joint/#gravity-changes-with-the-pose", "load": "/robotics/so101-2-what-pulls-the-joint/#a-payload-and-the-torque-limit", "model": "/robotics/so101-2-what-pulls-the-joint/#simulator-against-measured", "rep": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc"}}
```

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

```so101-widget
{"type": "predict", "fallback": "Predict first. First, suppose that friction is zero. The target and the goal both stay at -0.321 rad. G = 0.391 N m and kp = 13.64 N m/rad. How far from the target (-0.321 rad) does the true angle q stop? Give the answer in mrad (1 mrad = 0.001 rad = 0.057 degree). Answer: At rest, kp (goal - q) = G. So |goal - q| = 0.391 / 13.64 = 0.0287 rad = 28.7 mrad. That is 18.7 ticks.", "id": "S1"}
```

<details>
<summary>Units: ticks, mrad and degrees</summary>

The encoder counts 4096 ticks per turn. One turn is 2π rad, so 1 tick is 1.534 mrad, or 0.088°. One degree is 17.45 mrad, which is about 11.4 ticks. I use mrad in this series because most of the errors are somewhere between a few mrad and a few tens of mrad.

</details>

<details>
<summary>Glossary</summary>

- **Target:** where I want the joint to be.
- **Goal:** the number I send to the servo.
- **Reading ($q$):** the angle the encoder reports, in whole ticks.
- **Tick:** one encoder step, 1.534 mrad.
- **Gap:** the goal minus the true joint angle. The servo makes torque only from the gap.
- **Stiffness ($k_p$):** torque per radian of gap, in N·m/rad.
- **Damping ($d$):** torque per rad/s of speed that resists motion. $d/k_p$ is the lag it causes.
- **Dead time:** the pause between a new goal and the first motion of the joint.
- **Goal hold:** the goal stays the same for a whole control step.
- **Dead band:** a small gap where the servo makes no torque.
- **Wet (viscous) friction:** friction that grows with speed. **Dry (Coulomb) friction:** friction of a fixed size that opposes motion.
- **Sag:** the steady error under gravity, $G/k_p$ when the goal is on the target.
- **Feedforward:** moving the goal ahead using what I know in advance, like the path and the physics.
- **Feedback:** correcting the goal from the error I measure.
- **Inner loop:** the servo's own loop. **Outer loop:** my controller on the computer, which only sends goals.
- **Horizon:** how far ahead a planner looks, 0.25 s here.
- **Observer:** an estimate that combines a model with the readings.
- **$w$:** the slowly learned correction for what the model gets wrong, in `solve` and `mpc`.

</details>

## The servo sits in the middle

![Simplified cutaway of a smart servo: a DC motor drives a gear train and the output shaft. A magnet on the shaft faces a magnetic encoder chip. A control board runs the P/D loop and talks to the computer over a serial bus.](/assets/robotics/so101-series/servo-inside.png "Inside a smart servo like the STS3215, simplified. The computer only talks to the control board.")

Something that took me a while to accept is that I can't actually drive the motors of my arm. I can only talk to the servos. Each joint of the SO-101 is a smart servo, the STS3215, with a motor, a gearbox, an encoder and a small controller inside. That little controller runs its own loop: it reads the encoder, compares it with the goal I sent, and decides how much power to give the motor. I never get to set the motor power myself. All I can do is send goals.

So there are really two loops stacked on top of each other. The inner loop runs fast inside the servo and drives the motor. The outer loop runs on my computer at 30 or 60 Hz, reads the joint angles and sends new goals.

![Two nested loops. On the computer, at 30 or 60 Hz: target, controller, goal. In the servo firmware: gap equals goal minus encoder, P/D, motor power, motor and gearbox, joint. The encoder feeds both loops.](/assets/robotics/so101-series/two-loops.png "The outer loop on my computer only sends goals. The inner loop inside the servo turns the gap into motor power.")

Every controller in this series lives in that outer loop. None of them changes how the servo works inside; they can only try to send it a better goal.

```so101-widget
{"type": "servo-equation", "fallback": "The full loop: the target r(t) goes into the outer controller, which sends a goal g. After a dead time D, the servo makes a torque kp times (g minus q) minus a damping term. The joint obeys J times acceleration = servo torque minus damping d times speed minus dry friction f minus gravity G(q). The encoder reads q in whole ticks."}
```

## What PID actually means

![Three panels of a gravity-loaded joint responding to a goal step. P only: the joint oscillates and settles below the goal. P plus D: it rises smoothly and settles below the goal. P plus I: it oscillates and then slowly climbs to the goal.](/assets/robotics/so101-series/pid-parts.png "P is a spring, D is the honey, and I is the part that keeps pushing until the sag is gone. Teaching model, not the real servo.")

I'd seen "PID" many times before this project without really knowing what it did. On a servo, each of the three letters turns out to be something you can picture physically. P, the proportional term, pushes in proportion to the gap, so it's the spring from earlier, and its gain $k_p$ is a stiffness in N·m/rad. I, the integral term, adds up the error over time, so if a small error refuses to go away, the integral keeps growing until it pushes hard enough to remove it. D, the derivative term, pushes against the speed, which acts like damping, a bit like moving the joint through honey.

<details>
<summary>Where I was wrong: is kp the inertia?</summary>

At first I thought $k_p$ was some kind of inertia. It isn't. Inertia (kg·m²) resists changes of speed and doesn't care where the goal is, while $k_p$ is a stiffness: how much torque you get per radian of gap. On this servo it depends on the firmware P register, the supply voltage, the motor and the gearbox.

</details>

Knowing that, I was curious what LeRobot actually sets up when you calibrate the arm. I expected some measurement of each joint, but my calibration file stores five integers per motor: the motor id, the turn direction, a homing offset, and a minimum and maximum position. My shoulder_lift, for example, has a homing offset of 941 and a range from 844 to 3214 ticks. Then, every time the arm connects, LeRobot writes the same default servo settings to every motor: position mode with P = 16, I = 0 and D = 32, plus a 50 % torque cap on the gripper, which the code comments say is there "to avoid burnout".

So the control loop is identical on every SO-101, and nothing in it knows the stiffness, damping, friction, delay or gravity of my particular arm. I'd describe LeRobot's calibration as geometric, because it finds where zero is and where the limits are. It isn't a dynamic calibration, which would tell you how this specific joint responds to a goal, and that second kind is what the rest of this series is about.

![Two columns. What LeRobot calibration stores per motor: id, drive_mode, homing_offset, range_min, range_max. What the controllers needed: stiffness, damping, dead time, dead band, dry friction, gravity by pose, servo lag.](/assets/robotics/so101-series/calibration-columns.png "LeRobot calibration is geometric. None of the dynamic numbers on the right are in it.")

```so101-widget
{"type": "predict", "fallback": "Predict first. Hadrien's file hadrien_follower.json holds the LeRobot calibration of his arm. What does it store for each motor? Answer: Five integers per motor: id, drive_mode, homing_offset, range_min, range_max.", "id": "D1"}
```

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

```so101-widget
{"type": "lag-vs-error", "fallback": "Lag = d / kp + dt / 2. With d = 1.058 N·m·s/rad, kp = 13.64 N·m/rad and 30 Hz, the lag is 77.6 + 16.7 = 94 ms. At 0.7 rad/s that lag gives about 66 mrad of error, plus a sag of G / kp = 32 mrad for a load of 0.442 N·m."}
```

```so101-widget
{"type": "predict", "fallback": "Predict first. The target moves at a constant speed v. The servo must supply the damping torque d v. How long after the target does the joint arrive? Use d = 1.058 N m s/rad, kp = 13.64 N m/rad and the 33.3 ms goal hold. Give the answer in ms. Answer: 1.058 / 13.64 = 77.6 ms, plus 33.3 / 2 = 16.7 ms from the goal hold, which gives about 94 ms.", "id": "D2"}
```

The measured lag on the simulated robot was 105.5 to 108.4 ms, so the simple estimate is about 12 % low, but it gets the size right.

<details>
<summary>Where I was wrong: 77 ms</summary>

My answer was 77 ms. I'd forgotten that the goal only changes once every 33 ms step, so on average the goal I'm following is already half a step old, which adds another 16.7 ms.

</details>

## The error budget of one real step

To see how this plays out, let's take one moment of one path. The shoulder_lift is moving at 0.70 rad/s against gravity, and the measured error at that moment is 115.2 mrad. Before reading on, which part do you think is the largest: gravity, damping, dry friction, inertia, or the fact that the goal is only updated every step?

```so101-widget
{"type": "predict", "fallback": "Predict first. Now the target moves. At one moment of a simulated path, shoulder_lift moves at 0.70 rad/s against gravity. The measured tracking error is 115.2 mrad. Use G = 0.442 N m, d = 1.058 N m s/rad and f = 0.196 N m. The inertia torque is J a = 0.028 N m, and kp = 13.64 N m/rad. Which part of the error is the largest? Answer: Damping: 1.058 x 0.7035 = 0.744 N m, so 54.6 mrad.", "id": "S4"}
```

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

```so101-widget
{"type": "error-budget", "fallback": "Error budget at 0.70 rad/s on shoulder_lift: gravity 32.4 mrad, damping 54.6, dry friction 14.4, inertia 2.1, goal hold 12.0. Sum 115.3 mrad, measured 115.2 mrad."}
```

## Why not make the servo infinitely stiff?

Once I saw that the gap is the torque divided by $k_p$, my first thought was to just make $k_p$ huge so the gap, and the error with it, would go to zero. It seemed too easy, so I checked it against the simulation. One of the simulated robots, which I called stiff_servo, has a $k_p$ 1.62 times higher than normal. If all of the error scaled with $1/k_p$, the error should have dropped from 37.2 to 23 mrad, but it only dropped to 24.8.

The reason is that only part of the error depends on the stiffness. You can write the error roughly as

$$
e \approx \frac{G + d\,v + f + J\,a}{k_p} + \frac{v\,\Delta t}{2}
$$

where the first part is the torque divided by the stiffness and the last part is the goal hold, which doesn't care about $k_p$ at all. Fitting the normal and the stiff robots gives about 32.2 mrad for the torque part and 5.0 mrad for the goal hold, and that same fit predicts 40.6 mrad for a robot with a weaker supply ($k_p$ × 0.90). The measured value for that robot was 40.5, so the split also works on a third robot.

![Tracking error against servo stiffness kp. The fitted curve 32.2 times 13.64 over kp plus 5.0 passes through nominal (13.64, 37.2), weak_supply (12.31, 40.5) and stiff_servo (22.1, 24.8), and flattens toward the 5 mrad goal-hold floor.](/assets/robotics/so101-series/error-vs-kp.png "Only the torque part of the error shrinks with stiffness. The goal hold stays. Simulation, out-of-the-box controller.")

So even an infinitely stiff servo would still leave the goal hold, and on the real arm it would also leave the dead time we'll see in part 2. On top of that, a very stiff loop brings its own problems. The servo can't push more than about 5.1 N·m, so with a huge $k_p$ even a tiny gap asks for full torque and the motor ends up switching between pushing as hard as it can one way and the other. The encoder also only reads whole ticks, and every time the reading changes by one tick the torque jumps by $k_p$ times that tick, so the joint chatters between two ticks. And because the information the loop acts on is always a little old, a stiff loop pushes hard on a position that has already changed, overshoots, and then overshoots the other way. In practice, an outer gain of 4 stays stable and a gain of 100 oscillates.

## What's next

So the arm misses because the servo needs a gap to make torque, and every force on the joint needs a bit more of it. In [part 2](/robotics/so101-2-what-pulls-the-joint/) I go through those forces one at a time: ticks, dead time, friction, heat, gravity, speed coupling and carrying a payload. Then [part 3](/robotics/so101-3-finer-than-the-sensor/) is about seeing the joint more finely than one tick, [part 4](/robotics/so101-4-goal-ahead/) about the controllers that put the goal ahead, and [part 5](/robotics/so101-5-offline-lied/) about what a neural network learned and why my offline tests misled me.
