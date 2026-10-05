---
title: 'What pulls the joint off its target'
description: 'Ticks, dead time, friction, heat, gravity, speed coupling and a payload: each effect that makes a cheap servo miss, and how large each one is.'
date: '2026-10-05'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 2
---

In [part 1](/robotics/so101-1-target-and-goal/) I ended on one rule: the servo only makes torque from a gap between the goal and the joint, so every force on the joint needs a bit more gap, and if the goal stays on the target that gap becomes the error. The natural next question is which forces those are, and how large each one is on my arm. In this part I go through them one at a time, and for each one I give an example, the size of the error it causes when a test measured it, and the controller that deals with it.

The table below uses the short lab names of my controllers. This is what each name means.

| Name | What it sends to the servo as the goal | What it needs |
|---|---|---|
| `direct` | The target itself. This is what LeRobot does by default. | Nothing. |
| `lead` | The target of the next control step, so the goal is one step early. | Nothing. |
| `inv` | The target one servo dead time ahead, plus the target speed times the servo lag, plus a small acceleration term. It reverses a simple model of the servo, which is where the name comes from. | The dead time and the lag of the servo, from a step test on the arm. |
| `pi` | The `inv` goal plus a feedback correction: one part is proportional to the error now (P), and one part is proportional to the sum of past errors (I). The sum removes a steady sag over time. | Nothing more than `inv`. |
| `sag` | The `inv` goal plus a fixed offset for each pose. The offset comes from the steady error that the real arm showed in earlier holds. | A sag model, fitted on hold data from the arm. |
| `grav` | The `inv` goal plus the gravity torque at the target pose, divided by the servo stiffness. | A physics model of the arm (MuJoCo) and a stiffness value. |
| `pisag` | The `sag` goal plus the `pi` correction. | The same as `sag` and `pi`. |
| `adapt` | The `inv` goal minus an estimate of the disturbance. During the run, a Kalman filter estimates a fast load part, a slow sag part and a friction part from the difference between the predicted and the measured angle. | The servo constants of the arm. |
| `rls` | The goal that makes a small joint model reach the target. The model starts from the servo constants and continues to learn during the run (recursive least squares). | The servo constants of the arm. |
| `solve` | A search for each joint. It tries many destination goals, simulates the servo model 0.25 s ahead for each one, and keeps the goal with the smallest predicted error. | The servo constants of the arm. |
| `mpc` | Model predictive control. It uses the same model and look-ahead as `solve`, but it chooses a different goal for each step of the 0.25 s plan. It sends the first goal and makes a new plan at the next step. | The servo constants of the arm. |
| `mpca` | `mpc` plus a Kalman filter that estimates a load and a sag during the run. The "a" means adaptive. | The servo constants of the arm. |
| `ilc` | Iterative learning control. The `inv` goal plus a correction for each step of the motion, learned from the error of the earlier runs of the same motion. | The same motion, played many times. |
| `ilcmpc` | `ilc` with `mpc` as the base, in place of `inv`. | The same as `ilc` and `mpc`. |

The "servo constants" are a file with the dead time, the lag, the dead band, the stiffness and the sag of each joint, fitted on logs from my arm. A Kalman filter is an estimator: at each step it combines what a model predicts with the new reading. [Part 3](/robotics/so101-3-finer-than-the-sensor/) explains it.

```so101-widget
{"type": "error-matrix", "fallback": "Which error each controller removes. direct: none. lead: part of the delay. inv: the delay. pi, sag, grav, pisag: the gravity sag, pi also part of a load change. solve and mpc: delay, dead band, sag and part of the model error. mpca, adapt, rls: load changes. ilc, ilcmpc: repeated errors. This matrix is a teaching summary, made from the design of each controller and simulated tests. The real arm checked it only for pi on one motion.", "columnLinks": {"delay": "/robotics/so101-2-what-pulls-the-joint/#three-kinds-of-delay", "band": "/robotics/so101-2-what-pulls-the-joint/#low-speed-is-the-hard-case", "sag": "/robotics/so101-2-what-pulls-the-joint/#gravity-changes-with-the-pose", "load": "/robotics/so101-2-what-pulls-the-joint/#a-payload-and-the-torque-limit", "model": "/robotics/so101-2-what-pulls-the-joint/#simulator-against-measured", "rep": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc"}}
```

## Ticks: the arm doesn't know exactly where it is

The first problem comes before any force. The encoder doesn't give a continuous angle, it gives whole ticks, 4096 per turn, so one tick is 1.534 mrad. If the true angle is anywhere inside a tick, the reading is the same, which means there's a reading error underneath everything else the controller does.

How big is it on average? If the true angle is equally likely to be anywhere in the tick, the error is spread evenly from −0.5 to +0.5 tick, and its root mean square is

$$
\sqrt{\int_{-1/2}^{1/2} e^2\,de} = \frac{1}{\sqrt{12}} \approx 0.289\ \text{tick} = 0.443\ \text{mrad}
$$

![Top: a ramp of true angles and the staircase of readings rounded to the nearest tick. Bottom: the reading error, a sawtooth between minus and plus half a tick, with an RMS of 1 over the square root of 12 tick, 0.443 mrad.](/assets/robotics/so101-series/tick-rounding.png "Rounding to whole ticks leaves a sawtooth error with an RMS of 0.289 tick.")

<details>
<summary>Where I was wrong (half): the sqrt(1/3) step</summary>

When I tried this for an error spread from −1 to +1, I only got $\sqrt{1/3}$ after a hint to divide by the width of 2. Once I saw that, the same calculation over a width of 1 gave $1/\sqrt{12}$.

</details>

I assumed this meant no controller could do better than about half a tick, but that's not quite right. The score measures the true angle, not the reading, and the joint doesn't jump between ticks: the spring, the damping and the inertia smooth its motion between two readings. Many readings together also carry more information than one, so a controller that uses them well can land closer than the tick suggests. That's what part 3 is about.

## Three kinds of delay

![Top: the response to a goal step. Nothing happens for a dead time of 33 ms, then the joint rises with a lag of 95 ms to 63 percent. Bottom: a ramp target and the goal held for each control step, at 30 Hz and at 60 Hz.](/assets/robotics/so101-series/three-delays.png "Three delays: dead time before any motion, lag while the joint catches up, and the goal hold of each step. Teaching model with real-arm-sized numbers.")

When I first said "the arm is late", I was mixing up three different things, and they don't have the same fix.

### Dead time

![Measured dead time: 31 to 36 ms from the step test on the real arm, 15.6 to 26.6 ms from the per-joint servo fit, and about 0 in the first simulator.](/assets/robotics/so101-series/dead-time-ranges.png "Two ways of measuring the dead time on my arm, and the simulator I started with.")

When I send a new goal, nothing happens for a short while, and only then does the joint start to move. That pause is the dead time. On my real arm a step test measured 31 to 36 ms, and a per-joint fit of the servo model gives 15.6 to 26.6 ms. The two methods don't measure quite the same thing: the step test looks for the first visible motion after a jump of the goal, while the fit picks the delay that best explains whole recorded motions together with a lag and a dead band. I haven't fully resolved the difference between them. The simulator I started with had almost no dead time at all, which made it one of the biggest differences between the simulator and the real arm.

Dead time is hard to deal with because feedback can't fix it. Any correction I send arrives at least one dead time late, so if I push hard on information that's already old, I overshoot. The only real fix is to predict, and send the goal for where the target will be one dead time from now, which is what the `inv` controller does. It also doesn't go away with a faster loop. 33 ms happens to be close to one step at 30 Hz, but at 60 or 100 Hz the dead time is still there.

```so101-widget
{"type": "servo-playground", "fallback": "A step goal sent through a dead time of 33 ms. With feedback alone, a larger outer gain overshoots and then oscillates, because each correction arrives late. Sending the goal for where the target will be one dead time from now (inv) removes most of the delay.", "mode": "dead-time"}
```

### Goal hold

My controller sends a new goal once per step, every 33.3 ms at 30 Hz. Between two steps the goal stays still while the target keeps moving, so on average the goal I'm following is half a step old, about 16.7 ms. This one does shrink with a faster loop.

### Servo lag

![Real arm with direct control: the target and the measured joint angle over 6 seconds. The joint follows the same shape later than the target.](/assets/robotics/so101-series/lag-on-path.png "Real arm, `direct` at 30 Hz. The joint follows the target, but later.")

The last one is the damping lag from part 1, $d/k_p$. It's 78 ms in the simulator and somewhere between 87 and 105 ms on the real arm.

<details>
<summary>Am I limited to 33 ms?</summary>

No. 33 ms is the LeRobot loop rate (30 fps), which was picked for the cameras and the policy. The servo runs its own loop much faster inside. The practical limits are the serial bus, the latency of the USB adapter, and the Python overhead. I haven't measured those yet.

</details>

## Friction, part by part

Friction ended up being one of the most interesting parts of this project for me, mostly because it isn't one thing. It's easier to understand by adding the pieces one at a time.

```so101-widget
{"type": "friction-curve", "fallback": "Friction torque against speed. Viscous friction grows with speed (d = 1.058 N·m·s/rad). Coulomb friction has a fixed size (0.196 N·m) and flips sign with the direction. Stiction needs more torque to start. The Stribeck dip makes friction fall just after breakaway. Load-dependent friction grows with the servo torque.", "mode": "curve"}
```

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

```so101-widget
{"type": "friction-curve", "fallback": "The friction band. Coming from below, the joint stops at a gap of (G + f) / kp = 43.0 mrad because friction adds to gravity. Coming from above, it stops at (G - f) / kp = 14.3 mrad because friction carries part of the load. Without friction it would stop at 28.7 mrad.", "mode": "band"}
```

![The band of possible hold gaps from 14.3 to 43.0 mrad, with G over kp at 28.7 mrad in the middle. Approaching from below, friction adds to gravity and the joint stops at the top edge. Approaching from above, friction carries part of the load and the joint stops at the bottom edge.](/assets/robotics/so101-series/friction-band.png "Dry friction turns one rest point into a band. Simulation numbers: G = 0.391 N·m, f = 0.196 N·m, kp = 13.64 N·m/rad.")

For control, this means the same target can give two different errors depending on the direction the joint came from, so a fixed goal offset can't fix both.

<details>
<summary>Is the creep real?</summary>

In Genesis, like in MuJoCo, dry friction is a soft constraint. Instead of forcing the speed to be exactly zero, friction grows very steeply from a tiny speed. That keeps the simulation stable, but it means a loaded joint slides slowly: after 6 s the error is 23.45 mrad, which is still less than 28.7. A real geared servo usually sticks instead. I haven't measured this on my arm.

</details>

```so101-widget
{"type": "predict", "fallback": "Predict first. On this hold the measured tracking error is 14.0 mrad at 0.17 s, 17.1 mrad at 1 s and 23.45 mrad at 6 s. The true angle is on the side that gravity pulls. G/kp is 28.7 mrad. Which statements explain these numbers? Select all that apply. Answer: The first and third statements. Friction carries part of the load at first. The soft friction model then lets the joint creep toward G/kp.", "id": "S3"}
```

### The same friction helps on a hold and hurts in motion

To see how the different terms interact, I like to look at a worn robot, with friction multiplied by 2.5, so $f$ = 0.49 N·m. That's more than the gravity torque at the example hold, 0.391 N·m. On a hold, friction helps: it carries the whole load at first, and the joint sags only 0.7 mrad after 0.17 s, against 14.0 mrad on the healthy robot, before the soft friction slowly creeps to 17.2 mrad at 6 s. In motion it's the opposite. Friction adds 36 mrad of lag, against 14.4 mrad on the healthy robot, and the extra damping at 0.7 rad/s adds 81 mrad, against 54 mrad.

Since most of the score comes from paths that move, the worn robot ends up much worse overall: 64.8 mrad on a multisine path (a sum of sine waves) and 73.4 mrad on a path shaped like the output of a robot policy.

![Two panels. On a hold, the sag after 0.17 s is 14 mrad on the healthy robot and 0.7 mrad on the worn robot. In motion at 0.7 rad/s, friction adds 14.4 mrad healthy against 36 worn, and damping adds 54 against 81.](/assets/robotics/so101-series/worn-hold-motion.png "More friction helps a hold and hurts motion. Simulation, worn friction 2.5 times the healthy value.")

### Low speed is the hard case

![Four friction models as torque against speed: Coulomb plus viscous, stiction plus Stribeck with a dip after breakaway, LuGre with a different path on a slow reversal, and load-dependent friction that grows with the servo torque.](/assets/robotics/so101-series/friction-models.png "Four ways to describe friction. Teaching curves with simulator-sized numbers.")

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

Friction also decides where a stuck joint stops: at the first point where the drive torque falls below static friction. So the hold position can scatter by up to $h/\sqrt{3}$, which is 12.4 mrad on shoulder_lift. And compensating friction has its own risk, because a controller that overcompensates at low speed can make the loop unstable (Canudas de Wit and colleagues, 1991). That's why the controllers in part 4 smooth the friction term near zero speed and refuse small reversals across the dead band.

## Heat

![Torque available against winding temperature, falling from 100 percent at 25 degrees C to about 82 percent at 80 degrees C.](/assets/robotics/so101-series/heat-torque.png "Explained, not measured on my arm: copper resistance rises about 0.4 % per °C.")

A hot servo is weaker. The resistance of the copper rises by about 0.4 % per °C, so at the same voltage the current and the torque both drop, and the magnets also weaken a little when they get hot. The STS3215 has an over-temperature cut-off. I haven't measured any of this on my arm, and the simulator has no temperature model, so for now heat is on the list of effects I can describe but not yet correct.

## Gravity changes with the pose

The gravity torque on a joint depends on how far the links beyond it stick out horizontally. With the arm stretched out flat, the shoulder carries the largest torque, and with the arm pointing straight up it carries none.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/gravity-real.png" aria-label="Two recordings of the real arm with direct control making the same small lift steps, one tucked in and one reaching out, with the lift error plotted under each">
<source src="/assets/robotics/so101-series/gravity-real.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/gravity-real.mp4">Watch the video</a>
</video>
<figcaption>My real arm with `direct` at 60 Hz, making small shoulder_lift steps in two poses. The error is drawn 10 times larger, with large errors compressed, and the gray shape is the target pose. The plots give the true error. Tucked in, the lift error averages -3.8 mrad and the servo reports about 1 % load. Reaching out, the error averages +42 mrad and the load is about 11 %. The spread inside each plot is the friction band from the section above. <a class="video-link" href="/assets/robotics/so101-series/gravity-real.mp4">Open video</a></figcaption>
</figure>

One thing in the clip I can't explain yet: the elbow sits about 70 mrad off its target in both poses, and it does so in all my single-joint sweep recordings, even when the elbow target does not move.

The servo models I fitted capture this through the angle of each link from vertical, which is the shoulder angle, then shoulder plus elbow, then shoulder plus elbow plus wrist. The sines and cosines of those angles have the same shape as the gravity torque of a chain of links.

## Speed coupling

This one is even weirder: the speed of one joint creates a torque on another joint. The picture I have in mind is a trebuchet. When the arm swings fast, the sling flies outward. On the SO-101, when the base pan spins quickly, the elbow has to hold the forearm in, which is the centrifugal part. When two joints move at the same time, each one also feels a torque that depends on the product of the two speeds, which is the Coriolis part.

The full equation of motion puts all of these together:

$$
\tau = M(q)\,\ddot q + C(q,\dot q)\,\dot q + G(q)
$$

where $M\ddot q$ is the inertia, $C\dot q$ is the speed coupling and $G$ is gravity.

![Error on shoulder_lift caused by speed coupling against joint speed, on a log scale. At the 1.1 rad/s of my fastest real recordings, a spinning base causes 0.38 mrad and the lift and elbow moving together cause 1.5 mrad, against 43 mrad of gravity sag.](/assets/robotics/so101-series/speed-coupling.png "Simulated SO-101 reaching out. Speed coupling grows with the square of the speed, but at the speeds I record it stays near or below one encoder tick.")

On this arm, the effect is small. With the arm reaching out, a base that spins at 1.1 rad/s (about the fastest speed in my real recordings) pushes shoulder_lift by 0.38 mrad, a quarter of one encoder tick. Lift and elbow moving together at that speed cost 1.5 mrad, about one tick. Gravity at the same pose costs 43 mrad. The coupling grows with the square of the speed, so it matters for a fast or heavy arm, but on a slow $100 arm it is near the bottom of the list.

## A payload, and the torque limit

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/payload-pickup.png" aria-label="Simulated arm holding a pose when a 200 gram load appears in the gripper, with the lift and elbow error plotted under it">
<source src="/assets/robotics/so101-series/payload-pickup.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/payload-pickup.mp4">Watch the video</a>
</video>
<figcaption>Simulated SO-101 (MuJoCo physics) with `direct`, holding the reach pose of my real arm. The error is drawn 10 times larger, with large errors compressed so the gripper stays above the table; the plot gives the true error. Before the load, gravity already pulls shoulder_lift 40 mrad below its target. At 2 s a 200 g load appears in the gripper and the sag grows to 83 mrad. <a class="video-link" href="/assets/robotics/so101-series/payload-pickup.mp4">Open video</a></figcaption>
</figure>

![Braking torque needed before a stop. A late brake needs 7 N·m, above the 5.107 N·m torque clamp. An early brake needs 3 N·m, below the clamp.](/assets/robotics/so101-series/torque-limit.png "A brake that starts late needs more torque than the servo has. A brake that starts early stays under the limit.")

When the arm picks up a tool, it needs more torque to hold it against gravity. In the simulator, a 150 g tool at the home pose adds about 0.38 N·m on the shoulder lift joint, and a 200 g tool adds about 0.50 N·m.

<details>
<summary>Where I was wrong: does the tool weight flip sign?</summary>

I thought the tool's weight flipped sign when the arm reversed. It doesn't, because gravity always pulls down. Friction flips with the direction of motion, gravity doesn't. What changes with the pose is the lever arm, so the tool torque depends on where the arm is.

</details>

The servo also has a maximum torque, about 5.1 N·m in the simulator. If a motion asks for more than that, there's no goal that can deliver it, and the only way out is to start braking or accelerating earlier. Part 4 shows how a planner can do that.

## Simulator against measured

![For each constant, the simulator value as a dot and the range measured on my arm as a bar: stiffness 13.64 against 15.6 to 16.5, damping 1.058 against 1.66 to 1.77, damping ratio 0.68 against 1.15 to 1.20, dead time about 0 against 31 to 36 ms, lag 78 against 87 to 105 ms, dead band none against 8.1 to 21.0 mrad.](/assets/robotics/so101-series/constants-dumbbell.png "Simulator against my real arm. The real servo is stiffer, more damped and later.")

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

The simulator values aren't measured on my arm. They come from a motor model of the 12 V STS3215 fitted by the open-source BAM project, with LeRobot's P = 16, and the 5.107 N·m torque limit comes from the same model. The measured column comes from a step test and a servo fit on my own arm.

The real servo is stiffer, more damped and later than the simulated one, which is a big part of why the controllers I tuned in simulation behaved differently on the arm.

## What's next

Every controller sees the arm through the encoder ticks, so that's where I go next. [Part 3](/robotics/so101-3-finer-than-the-sensor/) is about estimating the angle more finely than one tick.
