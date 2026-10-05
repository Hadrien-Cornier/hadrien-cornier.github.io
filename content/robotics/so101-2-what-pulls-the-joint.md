---
title: 'What pulls the joint off its target'
description: 'Ticks, dead time, friction, heat, gravity, speed coupling and a payload: each effect that makes a cheap servo miss, and how large each one is.'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 2
---

> **In this series.** [ROUGH DRAFT: series box. Part 2 of 5. Recap in one line: the servo needs a gap between the goal and the joint to make torque, so every force needs more gap.]

In [part 1](/robotics/so101-1-target-and-goal/) I ended on one rule: the servo makes torque only from a gap, so every force on the joint needs more gap. If the goal stays on the target, that gap is the error.

So which forces are there? And how large is each one on my arm? This part goes through them one at a time. For each one I give an example, the size of the error it causes when a test measured it, and the controller that fixes it.

> **[FIGURE: error matrix, columns only]** The list of errors from part 1, as a menu for this article.

## The arm doesn't know where it is: ticks

Let's start before any force. The encoder doesn't give a continuous angle. It gives whole ticks: 4096 per turn, so one tick is 1.534 mrad.

If the true angle is anywhere inside a tick, the reading is the same. So there's a reading error at the root of everything. How big is it on average?

If the error is spread evenly over one tick, from −0.5 to +0.5, its root mean square is

$$
\sqrt{\int_{-1/2}^{1/2} e^2\,de} = \frac{1}{\sqrt{12}} \approx 0.289\ \text{tick} = 0.443\ \text{mrad}
$$

> **[FIGURE: sqrt(12) rounding]** A ramp of true angles, the staircase of readings, and the error sawtooth between them.

<details>
<summary>Where I was wrong (half): the sqrt(1/3) step</summary>

For an error spread from −1 to +1, I got $\sqrt{1/3}$ only after a hint to divide by the width of 2. Then it clicked: the same calculation over a width of 1 gives $1/\sqrt{12}$.

</details>

Can a controller do better than half a tick? Surprisingly, yes. The score measures the true angle, not the reading. The spring, the damping and the inertia smooth the motion between readings. And many readings together carry more information than one. Part 3 is about how to use that.

## Three kinds of delay

> **[FIGURE: one step response, three delays marked]** Real step test on one joint: the goal jumps, nothing for the dead time (31 to 36 ms), then the first-order rise (lag). A staircase goal on a ramp target shows the goal hold.

"The arm is late" turns out to mean three different things.

### Dead time

> **[FIGURE: per-joint dead time]** Bars per joint: step test against fit.

When I send a new goal, nothing happens for a while. Then the joint starts to move. That pause is the dead time.

On my real arm, a step test measured 31 to 36 ms. A per-joint fit of the servo model gives 15.6 to 26.6 ms. [ROUGH DRAFT: explain why the step test and the fit differ]

The simulator I used at first had almost none. That made dead time one of the biggest gaps between the simulator and the real arm.

Here's why dead time is nasty. Feedback can't fix it. Any correction I send arrives at least one dead time late. If I push hard on old information, I overshoot. The only fix is to predict: send the goal for where the target will be one dead time from now. That's what the `inv` controller does.

Dead time also doesn't go away when the loop runs faster. 33 ms is close to one step at 30 Hz, but at 60 or 100 Hz the dead time is still there.

> **[WIDGET: servo-playground, dead-time mode]** A step goal. Sliders: dead time and P gain. Watch the loop start to oscillate as the gain rises. Toggle `inv` to see the fix by prediction.

### Goal hold

> **[FIGURE: staircase goal]** A ramp target and the goal that changes once per 33 ms step, at 30 Hz and at 60 Hz.

My controller sends a new goal once per step: every 33.3 ms at 30 Hz. Between two steps the goal stays still while the target keeps moving. On average the goal is half a step old: 16.7 ms. This one does shrink with a faster loop.

### Servo lag

> **[FIGURE: lag on a sine]** Target and joint on a sine path. The time shift between the peaks is the lag.

This is the damping lag from part 1, $d/k_p$. It's 78 ms in the simulator and 87 to 105 ms on the real arm.

<details>
<summary>Am I limited to 33 ms?</summary>

No. 33 ms is the LeRobot loop rate (30 fps), picked for the cameras and the policy. The servo runs its own loop much faster inside. The real limits are the serial bus, the USB adapter latency, and the Python overhead. [ROUGH DRAFT: keep or cut; numbers not measured]

</details>

## Friction, part by part

Friction was one of the most interesting parts of this project for me, because it isn't one thing. Here are the parts, added one at a time.

> **[WIDGET: friction-curve]** Friction torque against speed. A toggle for each part: viscous, Coulomb, stiction, Stribeck, load-dependent, dead band.

**Viscous (wet) friction** grows with speed. In a servo, much of it comes from the motor itself: a spinning motor makes a back voltage (back-EMF) that resists the motion. In the simulator it's part of the damping: 1.058 N·m·s/rad.

**Coulomb (dry) friction** has a fixed size: 0.196 N·m in the simulator. It doesn't depend on speed. It just opposes motion.

<details>
<summary>Where I was wrong: does dry friction become wet friction?</summary>

I thought dry friction turns into wet friction as the joint speeds up. It doesn't. They're two separate terms that add up. Dry friction seemed to disappear in one test only because the joint crept, so the spring carried more of the load and friction had to carry less.

</details>

### The friction band

This is the part I found most surprising. Dry friction can help or hurt, depending on where the joint comes from.

Friction always opposes the last motion.

- If the joint comes **from below**, it moves up against gravity. Friction adds to gravity. The servo has to give $G + f$.
- If the joint comes **from above**, gravity pulls it down and friction holds it back. Friction carries part of the load. The servo only has to give $G - f$.

So there isn't one rest point. There's a band of gaps where the spring plus friction can balance gravity:

$$
\frac{G - f}{k_p} = 14.3\ \text{mrad} \quad\text{to}\quad \frac{G + f}{k_p} = 43.0\ \text{mrad}
$$

Without friction, the sag would be $G/k_p$ = 28.7 mrad, right in the middle. The joint stops at the edge of the side it comes from. In the simulated hold, the arm starts at rest on the target and sags down into the band, so it stops near the low edge.

> **[WIDGET: friction-curve, band mode]** Choose "approach from below" or "approach from above". The joint slides into the band and stops at one edge.

The consequence for control: the same target gives two different errors, depending on the direction of approach. A fixed goal offset can't fix both.

<details>
<summary>Is the creep real?</summary>

In Genesis, like MuJoCo, dry friction is a soft constraint. Instead of a hard "speed is exactly zero", friction grows very steeply from a tiny speed. That's stable, but a loaded joint slides slowly: after 6 s the error is 23.45 mrad, still less than 28.7. A real geared servo usually sticks instead. Nobody measured this on my arm.

</details>

<details>
<summary>Predict first: stop band and creep (exam S3)</summary>

[ROUGH DRAFT: predict box S3.]

</details>

### The same friction helps on a hold and hurts in motion

Now make the robot worn: friction × 2.5, so $f$ = 0.49 N·m. That's more than the gravity torque of the example hold (0.391 N·m).

- **On a hold, friction helps.** It carries the whole load at first. The joint sags only 0.7 mrad after 0.17 s, against 14.0 mrad on the healthy robot. The soft friction then creeps to 17.2 mrad at 6 s.
- **In motion, friction hurts.** It adds 36 mrad of lag, against 14.4 mrad on the healthy robot. And damping at 0.7 rad/s adds 81 mrad, against 54 mrad.

Moving paths set most of the score. On the worn robot, a multisine path gives 64.8 mrad and a policy-like path gives 73.4 mrad.

> **[FIGURE: two panels]** Hold and motion. Healthy and worn bars side by side.

### Low speed is the hard case

> **[FIGURE: friction model curves]** Torque against speed for each model: Coulomb + viscous, Stribeck dip, LuGre loop (pre-sliding), load-dependent. Same axes.

> **[MEDIA: real-arm clip]** A slow back-and-forth on shoulder_lift: stick, jump, stick, error magnified. [ROUGH DRAFT: pick from saved real traces]

Real friction has more parts than the simulator's Coulomb plus viscous model.

- **Stiction and breakaway.** At rest, the joint needs more torque to start than to keep moving.
- **Stribeck effect.** Just after breakaway, friction drops as the speed rises, before viscous friction takes over. That dip makes low speed unstable: stick, jump, stick.
- **LuGre.** Friction has memory. There's a tiny "pre-sliding" motion before a real slide.
- **Load-dependent friction.** Friction grows with the torque the servo pushes: $F = F_c + \mu\,|\tau|$.
- **The servo dead band.** The firmware has a small band of gap where it makes no torque at all, so it doesn't buzz while holding still. On my arm it's 8.1 to 21.0 mrad depending on the joint.

Which of these mattered on my arm? I fitted a Genesis model of the arm to real logs and compared friction models one at a time on held-out real motions (simulated replay):

| Friction model | shoulder_lift error (mrad) |
|---|---:|
| Coulomb only | 21.8 |
| Load-dependent | 18.9 to 19.2 |
| Load-dependent + LuGre | 15.9 to 16.2 |
| Fitted servo model, for reference | 15.9 |

Stribeck gave no gain. LuGre alone gave 3 % to 8 %. These runs didn't use exactly equal settings, so treat the ranking as a first pass. [ROUGH DRAFT: limit wording]

Where does a stuck joint stop? At the first point where the drive torque falls below static friction. So the hold position scatters by up to $h/\sqrt{3}$: 12.4 mrad on shoulder_lift.

And compensating friction is risky. If a controller overcompensates at low speed, the loop can go unstable (Canudas de Wit and colleagues, 1991). [ROUGH DRAFT: abstract only, check] That's why the controllers in part 4 smooth the friction term near zero speed and refuse small reversals across the dead band.

## Heat

> **[FIGURE: torque against temperature]** Illustration of the 0.4 %/°C copper effect. Labelled "explained, not measured".

A hot servo is weaker. Copper resistance rises by about 0.4 % per °C, so at the same voltage the current and the torque drop. The magnets also weaken when hot. The STS3215 has an over-temperature cut-off. I haven't measured this on my arm, and the simulator has no temperature model. It's on the list of effects I can't yet explain or correct.

## Gravity changes with the pose

The gravity torque on a joint depends on how far the links beyond it stick out horizontally. Arm stretched out flat: largest torque. Arm pointing straight up: zero.

> **[MEDIA: Genesis clip]** The same shoulder joint holding the arm out flat, then holding it up. Error magnified.

The servo models I fitted capture this with the angles of each link from vertical: the shoulder angle, shoulder + elbow, and shoulder + elbow + wrist. Their sines and cosines give the same shape as the gravity torque of a chain of links.

## Speed coupling

This one is even weirder. The speed of one joint makes a torque on another joint.

Think of a trebuchet. When the arm swings fast, the sling flies outward. On the SO-101, when the base pan spins, the elbow has to hold the forearm in. That's the centrifugal part. When two joints move at once, each feels a torque from the product of the two speeds. That's the Coriolis part.

The full equation of motion has all three:

$$
\tau = M(q)\,\ddot q + C(q,\dot q)\,\dot q + G(q)
$$

$M\ddot q$ is inertia, $C\dot q$ is speed coupling, and $G$ is gravity.

> **[MEDIA: Genesis clip]** A fast pan swing. The elbow error spikes while the pan speeds up and slows down. Simulation.

## A payload, and the torque limit

> **[MEDIA: Genesis clip]** The arm lifts a 150 g tool. Error magnified, before and after the pickup.

> **[FIGURE: torque limit]** Torque needed to stop a load against the 5.1 N·m clamp, for a late and an early brake.

Pick up a tool and the arm needs more torque to fight gravity. A 150 g tool at the home pose adds about 0.38 N·m on the shoulder. [ROUGH DRAFT: check the 0.378 N·m and its condition]

<details>
<summary>Where I was wrong: does the tool weight flip sign?</summary>

I thought the tool weight flips sign when the arm reverses. It doesn't. Gravity always pulls down. Friction flips with direction; gravity doesn't. What changes is the lever arm: the tool torque depends on the pose.

</details>

The servo also has a maximum torque: about 5.1 N·m in the simulator. If a motion needs more than that, no goal can deliver it. The only way out is to start earlier. Part 4 shows how a planner does that.

## Simulator against measured

> **[FIGURE: dumbbell chart]** For each constant: simulator dot, measured range bar. Shows at a glance that the real servo is stiffer, more damped, and late.

Every number in this article came either from the simulator, from a data sheet, or from my arm. They're not the same.

| Constant | Simulator | Measured on my arm | Source |
|---|---:|---:|---|
| Stiffness $k_p$ (N·m/rad) | 13.64 | 15.6 to 16.5 | step test |
| Damping $d$ (N·m·s/rad) | 1.058 | 1.66 to 1.77 | step test |
| Damping ratio | 0.68 | 1.15 to 1.20 | step test |
| Dead time (ms) | about 0 | 31 to 36 (step), 15.6 to 26.6 (fit) | step test, servo fit |
| Lag (ms) | 78 | 87 to 105 | servo fit |
| Dead band (mrad) | none | 8.1 to 21.0 | servo fit |
| Torque clamp (N·m) | 5.107 | | simulator |

[ROUGH DRAFT: check the source of 13.64 and the STS3215 data sheet stall torque. Label each value as data sheet, simulator or measured.]

## What's next

That's the list of what pulls the joint away. The tick shows up first, because every controller sees the arm through it. [Part 3](/robotics/so101-3-finer-than-the-sensor/) is about seeing past the tick.
