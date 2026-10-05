---
title: 'What pulls the joint off its target'
description: 'Ticks, dead time, friction, heat, gravity, speed coupling and a payload: each effect that makes a cheap servo miss, and how large each one is.'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 2
---

> **In this series.** [ROUGH DRAFT: series box. Part 2 of 5.]

In [part 1](/robotics/so101-1-target-and-goal/) I ended on one rule: the servo only makes torque from a gap between the goal and the joint, so every force on the joint needs a bit more gap, and if the goal stays on the target that gap becomes the error. The natural next question is which forces those are, and how large each one is on my arm. In this part I go through them one at a time, and for each one I give an example, the size of the error it causes when a test measured it, and the controller that deals with it.

> **[FIGURE: error matrix, columns only]** The list of errors from part 1, as a menu for this article.

## Ticks: the arm doesn't know exactly where it is

The first problem comes before any force. The encoder doesn't give a continuous angle, it gives whole ticks, 4096 per turn, so one tick is 1.534 mrad. If the true angle is anywhere inside a tick, the reading is the same, which means there's a reading error underneath everything else the controller does.

How big is it on average? If the true angle is equally likely to be anywhere in the tick, the error is spread evenly from −0.5 to +0.5 tick, and its root mean square is

$$
\sqrt{\int_{-1/2}^{1/2} e^2\,de} = \frac{1}{\sqrt{12}} \approx 0.289\ \text{tick} = 0.443\ \text{mrad}
$$

> **[FIGURE: sqrt(12) rounding]** A ramp of true angles, the staircase of readings, and the error sawtooth between them.

<details>
<summary>Where I was wrong (half): the sqrt(1/3) step</summary>

When I tried this for an error spread from −1 to +1, I only got $\sqrt{1/3}$ after a hint to divide by the width of 2. Once I saw that, the same calculation over a width of 1 gave $1/\sqrt{12}$.

</details>

I assumed this meant no controller could do better than about half a tick, but that's not quite right. The score measures the true angle, not the reading, and the joint doesn't jump between ticks: the spring, the damping and the inertia smooth its motion between two readings. Many readings together also carry more information than one, so a controller that uses them well can land closer than the tick suggests. That's what part 3 is about.

## Three kinds of delay

> **[FIGURE: one step response, three delays marked]** Real step test on one joint: the goal jumps, nothing for the dead time (31 to 36 ms), then the first-order rise (lag). A staircase goal on a ramp target shows the goal hold.

When I first said "the arm is late", I was mixing up three different things, and they don't have the same fix.

### Dead time

> **[FIGURE: per-joint dead time]** Bars per joint: step test against fit.

When I send a new goal, nothing happens for a short while, and only then does the joint start to move. That pause is the dead time. On my real arm a step test measured 31 to 36 ms, and a per-joint fit of the servo model gives 15.6 to 26.6 ms. [ROUGH DRAFT: explain why the step test and the fit differ] The simulator I started with had almost no dead time at all, which made it one of the biggest differences between the simulator and the real arm.

Dead time is hard to deal with because feedback can't fix it. Any correction I send arrives at least one dead time late, so if I push hard on information that's already old, I overshoot. The only real fix is to predict, and send the goal for where the target will be one dead time from now, which is what the `inv` controller does. It also doesn't go away with a faster loop. 33 ms happens to be close to one step at 30 Hz, but at 60 or 100 Hz the dead time is still there.

> **[WIDGET: servo-playground, dead-time mode]** A step goal. Sliders: dead time and P gain. Watch the loop start to oscillate as the gain rises. Toggle `inv` to see the fix by prediction.

### Goal hold

> **[FIGURE: staircase goal]** A ramp target and the goal that changes once per 33 ms step, at 30 Hz and at 60 Hz.

My controller sends a new goal once per step, every 33.3 ms at 30 Hz. Between two steps the goal stays still while the target keeps moving, so on average the goal I'm following is half a step old, about 16.7 ms. This one does shrink with a faster loop.

### Servo lag

> **[FIGURE: lag on a sine]** Target and joint on a sine path. The time shift between the peaks is the lag.

The last one is the damping lag from part 1, $d/k_p$. It's 78 ms in the simulator and somewhere between 87 and 105 ms on the real arm.

<details>
<summary>Am I limited to 33 ms?</summary>

No. 33 ms is the LeRobot loop rate (30 fps), which was picked for the cameras and the policy. The servo runs its own loop much faster inside. The practical limits are the serial bus, the latency of the USB adapter, and the Python overhead. [ROUGH DRAFT: keep or cut; numbers not measured]

</details>

## Friction, part by part

Friction ended up being one of the most interesting parts of this project for me, mostly because it isn't one thing. It's easier to understand by adding the pieces one at a time.

> **[WIDGET: friction-curve]** Friction torque against speed. A toggle for each part: viscous, Coulomb, stiction, Stribeck, load-dependent, dead band.

The first piece is viscous friction, which I kept calling wet friction. It grows with speed, and in a servo a lot of it comes from the motor itself: a spinning motor produces a back voltage, the back-EMF, that resists the motion. In the simulator it's folded into the damping, 1.058 N·m·s/rad.

The second piece is Coulomb friction, or dry friction. It has a fixed size, 0.196 N·m in the simulator, and it doesn't depend on speed. It just opposes the motion.

<details>
<summary>Where I was wrong: does dry friction become wet friction?</summary>

I thought dry friction turned into wet friction as the joint sped up. It doesn't. They're two separate terms that add together. In one test the dry friction seemed to disappear, but that was only because the joint crept, so the spring ended up carrying more of the load and friction had less to carry.

</details>

### The friction band

The part I found most surprising is that dry friction can either help the servo or work against it, depending on where the joint comes from. Friction always opposes the last motion. Suppose the joint arrives from below: it's moving up against gravity, so friction adds to gravity and the servo has to provide $G + f$. Now suppose it arrives from above: gravity pulls it down, friction holds it back, and so friction carries part of the load and the servo only has to provide $G - f$.

That means there isn't one rest point. There's a whole band of gaps where the spring plus friction can balance gravity:

$$
\frac{G - f}{k_p} = 14.3\ \text{mrad} \quad\text{to}\quad \frac{G + f}{k_p} = 43.0\ \text{mrad}
$$

Without friction, the sag would be $G/k_p$ = 28.7 mrad, right in the middle of that band. With friction, the joint stops at the edge of the side it comes from. In the simulated hold, the arm starts at rest on the target and sags down into the band, so it stops near the low edge.

> **[WIDGET: friction-curve, band mode]** Choose "approach from below" or "approach from above". The joint slides into the band and stops at one edge.

For control, this means the same target can give two different errors depending on the direction the joint came from, so a fixed goal offset can't fix both.

<details>
<summary>Is the creep real?</summary>

In Genesis, like in MuJoCo, dry friction is a soft constraint. Instead of forcing the speed to be exactly zero, friction grows very steeply from a tiny speed. That keeps the simulation stable, but it means a loaded joint slides slowly: after 6 s the error is 23.45 mrad, which is still less than 28.7. A real geared servo usually sticks instead. I haven't measured this on my arm.

</details>

<details>
<summary>Predict first: stop band and creep (exam S3)</summary>

[ROUGH DRAFT: predict box S3.]

</details>

### The same friction helps on a hold and hurts in motion

To see how the different terms interact, I like to look at a worn robot, with friction multiplied by 2.5, so $f$ = 0.49 N·m. That's more than the gravity torque at the example hold, 0.391 N·m. On a hold, friction helps: it carries the whole load at first, and the joint sags only 0.7 mrad after 0.17 s, against 14.0 mrad on the healthy robot, before the soft friction slowly creeps to 17.2 mrad at 6 s. In motion it's the opposite. Friction adds 36 mrad of lag, against 14.4 mrad on the healthy robot, and the extra damping at 0.7 rad/s adds 81 mrad, against 54 mrad.

Since most of the score comes from paths that move, the worn robot ends up much worse overall: 64.8 mrad on a multisine path and 73.4 mrad on a policy-like path.

> **[FIGURE: two panels]** Hold and motion. Healthy and worn bars side by side.

### Low speed is the hard case

> **[FIGURE: friction model curves]** Torque against speed for each model: Coulomb + viscous, Stribeck dip, LuGre loop (pre-sliding), load-dependent. Same axes.

> **[MEDIA: real-arm clip]** A slow back-and-forth on shoulder_lift: stick, jump, stick, error magnified. [ROUGH DRAFT: pick from saved real traces]

Real friction has more pieces than the simulator's Coulomb plus viscous model, and most of them show up at low speed:

- **stiction and breakaway:** at rest, the joint needs more torque to start than to keep moving;
- **the Stribeck effect:** right after breakaway, friction drops as the speed rises, before viscous friction takes over, and that dip is what makes low speed unstable, with the joint sticking, jumping and sticking again;
- **LuGre friction:** friction has a memory, with a tiny "pre-sliding" motion before a real slide;
- **load-dependent friction:** friction grows with the torque the servo is pushing, $F = F_c + \mu\,|\tau|$;
- **the servo dead band:** the firmware has a small band of gap where it makes no torque at all, so the motor doesn't buzz while it holds still, and on my arm it's between 8.1 and 21.0 mrad depending on the joint.

To find out which of these mattered on my arm, I fitted a Genesis model of the arm to real logs and compared friction models one at a time on real motions the fit hadn't seen (replayed in simulation):

| Friction model | shoulder_lift error (mrad) |
|---|---:|
| Coulomb only | 21.8 |
| Load-dependent | 18.9 to 19.2 |
| Load-dependent + LuGre | 15.9 to 16.2 |
| Fitted servo model, for reference | 15.9 |

Stribeck gave no gain, and LuGre alone gave 3 % to 8 %. These runs didn't use exactly the same settings, so I'd treat the ranking as a first pass rather than a final answer.

Friction also decides where a stuck joint stops: at the first point where the drive torque falls below static friction. So the hold position can scatter by up to $h/\sqrt{3}$, which is 12.4 mrad on shoulder_lift. And compensating friction has its own risk, because a controller that overcompensates at low speed can make the loop unstable (Canudas de Wit and colleagues, 1991). [ROUGH DRAFT: abstract only, check] That's why the controllers in part 4 smooth the friction term near zero speed and refuse small reversals across the dead band.

## Heat

> **[FIGURE: torque against temperature]** Illustration of the 0.4 %/°C copper effect. Labelled "explained, not measured".

A hot servo is weaker. The resistance of the copper rises by about 0.4 % per °C, so at the same voltage the current and the torque both drop, and the magnets also weaken a little when they get hot. The STS3215 has an over-temperature cut-off. I haven't measured any of this on my arm, and the simulator has no temperature model, so for now heat is on the list of effects I can describe but not yet correct.

## Gravity changes with the pose

The gravity torque on a joint depends on how far the links beyond it stick out horizontally. With the arm stretched out flat, the shoulder carries the largest torque, and with the arm pointing straight up it carries none.

> **[MEDIA: Genesis clip]** The same shoulder joint holding the arm out flat, then holding it up. Error magnified.

The servo models I fitted capture this through the angle of each link from vertical, which is the shoulder angle, then shoulder plus elbow, then shoulder plus elbow plus wrist. The sines and cosines of those angles have the same shape as the gravity torque of a chain of links.

## Speed coupling

This one is even weirder: the speed of one joint creates a torque on another joint. The picture I have in mind is a trebuchet. When the arm swings fast, the sling flies outward. On the SO-101, when the base pan spins quickly, the elbow has to hold the forearm in, which is the centrifugal part. When two joints move at the same time, each one also feels a torque that depends on the product of the two speeds, which is the Coriolis part.

The full equation of motion puts all of these together:

$$
\tau = M(q)\,\ddot q + C(q,\dot q)\,\dot q + G(q)
$$

where $M\ddot q$ is the inertia, $C\dot q$ is the speed coupling and $G$ is gravity.

> **[MEDIA: Genesis clip]** A fast pan swing. The elbow error spikes while the pan speeds up and slows down. Simulation.

## A payload, and the torque limit

> **[MEDIA: Genesis clip]** The arm lifts a 150 g tool. Error magnified, before and after the pickup.

> **[FIGURE: torque limit]** Torque needed to stop a load against the 5.1 N·m clamp, for a late and an early brake.

When the arm picks up a tool, it needs more torque to hold it against gravity. A 150 g tool at the home pose adds about 0.38 N·m on the shoulder. [ROUGH DRAFT: check the 0.378 N·m and its condition]

<details>
<summary>Where I was wrong: does the tool weight flip sign?</summary>

I thought the tool's weight flipped sign when the arm reversed. It doesn't, because gravity always pulls down. Friction flips with the direction of motion, gravity doesn't. What changes with the pose is the lever arm, so the tool torque depends on where the arm is.

</details>

The servo also has a maximum torque, about 5.1 N·m in the simulator. If a motion asks for more than that, there's no goal that can deliver it, and the only way out is to start braking or accelerating earlier. Part 4 shows how a planner can do that.

## Simulator against measured

> **[FIGURE: dumbbell chart]** For each constant: simulator dot, measured range bar. Shows at a glance that the real servo is stiffer, more damped, and late.

Most numbers in this article come from one of three places: the simulator, a data sheet, or my own arm, and they don't always agree. This table puts the main ones side by side.

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

The real servo is stiffer, more damped and later than the simulated one, which is a big part of why the controllers I tuned in simulation behaved differently on the arm.

## What's next

Every controller sees the arm through the encoder ticks, so that's where I go next. [Part 3](/robotics/so101-3-finer-than-the-sensor/) is about estimating the angle more finely than one tick.
