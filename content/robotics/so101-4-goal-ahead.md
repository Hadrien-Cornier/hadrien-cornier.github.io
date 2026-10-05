---
title: 'Putting the goal ahead: from feedforward to MPC'
description: 'Fourteen controllers for a cheap servo arm, each one a different answer to the same question: where do I put the goal?'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 4
---

> **In this series.** [ROUGH DRAFT: series box. Part 4 of 5.]

Parts 1 to 3 were about the problem. The servo only makes torque from a gap, every force needs more gap, and the arm sees itself through ticks. Now the fixes.

Every controller here answers the same question: **where do I put the goal?** They differ in what they use to answer it: a fixed rule, the past error, a model of the servo, or the path ahead.

> **[FIGURE: family tree, all families]** Click a family to jump to its section.

## Predict the future: lead and inv

> **[FIGURE: target, inv goal, joint]** On a real trace: the target, the inv goal shifted ahead, and the joint landing on the target. Compare with direct.

> **[MEDIA: viewer clip]** direct against inv on the same real motion, error magnified.

The simplest fixes don't look at the arm at all. They look at the target.

- **`lead`** sends the target one tick early.
- **`inv`** inverts the lag. It sends the target from $t + D$, where $D$ is the fitted dead time plus half a step. It also adds a term for the servo lag: the goal moves ahead of the target by the speed times the lag.

$$
\text{goal}(t) = \text{target}(t + D) + \frac{d}{k_p}\,\dot q^*(t + D)
$$

[ROUGH DRAFT: check the exact inv formula in model_controllers.py, including the accel term]

This is *feedforward*: the goal comes from what we know about the target and the servo, not from the error. It's the only thing that can handle dead time, because any feedback is late by at least one dead time.

Notice that `inv` takes the target's speed and acceleration from the planned path. That's why it doesn't suffer from the derivative noise of part 3.

<details>
<summary>Is a fixed goal offset enough for the dead band?</summary>

Almost, with one change: the offset has to follow the direction. To push up, add the band; to push down, subtract it. The trouble is near zero speed, where the sign flips. The goal jumps by twice the band and can zig-zag. A smooth ramp near zero helps. A model that simulates the band handles the sign, the size and the dynamics together. That's one reason for `solve` and `mpc` below.

</details>

## Gravity: sag and grav

> **[FIGURE: sag map]** Sag offset of shoulder_lift against the pose, from the fitted sin/cos terms. Two arm poses drawn at the extremes.

**`sag`** adds a goal offset that depends on the pose: the fitted sag terms from part 2, with the sines and cosines of the link angles. **`grav`** does the same from a gravity model. Both add the gap that gravity needs before the joint has to sag into it.

## Feedback: pi

> **[FIGURE: 5e, not 4e]** The servo gap split into its parts: the target error e from the servo spring, plus 4e from the outer loop, plus the model offset.

> **[WIDGET: servo-playground, pi mode]** Sliders for the outer P and I gains. Watch the response to a load step, and the oscillation at a high gain.

`pi` adds an outer PI loop on top of the servo. It looks at the error (target minus reading) and moves the goal.

$$
\text{goal} = \text{target} + \text{offset} + 4\,e + k_i \textstyle\int e\,dt
$$

Here's a thing I got wrong. The outer gain is 4. So how much stiffer does the joint get?

<details>
<summary>Predict first: how much stiffer? (exam C1)</summary>

[ROUGH DRAFT: predict box C1. The model lacks 0.378 N·m. Outer P gain 4. Static error? Answer 5.5 mrad.]

</details>

Five times, not four. The servo gap is the goal minus the joint:

$$
\text{goal} - q = (\text{target} - q) + \text{offset} + 4e = 5e + \text{offset}
$$

The extra 1 is the servo spring itself. The goal already sits on the target, so a joint that's $e$ behind already has a gap of $e$. The outer loop adds 4 more. So the stiffness against a missing torque is 13.64 × 5 = 68.2 N·m/rad.

<details>
<summary>Where I was wrong: kp × 4</summary>

I multiplied $k_p$ by 4 and got about 7 mrad. I found the mistake myself: I'd forgotten the servo spring.

</details>

Why 4 and not 100? In one 33 ms step, the arm covers only about 0.15 of a goal change. With a gain of 4, it covers about 0.6 of the error per step. That's stable. With 100, it tries to cover 15 times the error. It overshoots, the next error is bigger on the other side, and the oscillation grows. A gain of 100 also turns 1 tick of reading noise into a 153 mrad goal jump.

A model helps the feedback too. A plain outer PID with no model saturated the servo on 10.9 % of steps on a stiff simulated robot. The same feedback on top of a model offset saturated on 0 %. The model does the heavy lifting, so the gains can stay low.

On the real arm, on my "cat" motion at 60 Hz, `pi` gets 8.4 mrad.

## Shake a load: up and down, or left and right

Here's a question that made the planners click for me.

Hold a weight in the gripper and shake it **up and down**. Gravity on the weight is a steady extra load. The integral of `pi` slowly builds up the extra torque and holds it.

Now shake it **left and right**. Gravity on the weight doesn't change. What changes is inertia: the weight has to be stopped and turned around at each end. That torque reverses every half stroke. The integral is always half a cycle late.

So what would help? Something that sees the end of the stroke coming and starts to brake before it gets there. And since the servo has a maximum torque, braking early may be the only way to stop in time.

That's my hypothesis. Here's the test. [ROUGH DRAFT: shake experiment, stand-in simulation, pi against mpc, vertical and horizontal, same amplitude and frequency. Report the result even if it goes against the story.]

> **[MEDIA: side-by-side clip]** Vertical and horizontal shake, pi and mpc.

## Planning: solve and mpc

This is the part I understood least. So let's go slowly.

Both controllers do the same thing at each step:

1. Take the current reading and the target path for the next 0.25 s.
2. Use a model of the servo to predict where the joint will go for a given plan of goals.
3. Pick the plan with the smallest predicted error.
4. Send only the first goal of that plan.
5. Next step, plan again from the new reading.

That last part is called a *receding horizon*. The plan is never executed. Only its first step is.

Why 0.25 s? It's about the dead time plus two servo lags. A shorter look-ahead doesn't see the effect of today's goal.

### The difference is the plan they can choose

- **`solve`** chooses **one number** per joint: a destination goal, on whole encoder ticks. The goals in between follow a fixed rule toward that destination. So `solve` searches a family of plans with one knob.
- **`mpc`** chooses **one goal per step** of the horizon: 8 goals at 30 Hz, 15 at 60 Hz, 25 at 100 Hz. The plan can do anything: overshoot, brake early, hold.

> **[WIDGET: plan-compare]** The target over the next 0.25 s. A solve plan with one slider (the destination). An mpc plan with one handle per step. Both show the predicted joint path and the cost.

The mpc cost has three parts: the mean squared tracking error, a small cost on goal changes beyond what `inv` would do, and a tiny cost on straying from `inv`.

<details>
<summary>Predict first: what does solve choose each step? (exam L1)</summary>

[ROUGH DRAFT: predict box L1.]

</details>

### Why mpc needs 50 warm starts

Here's a toy example. The joint is at 100 mrad, the target is 115, and the dead band is 10 mrad wide on each side. Any goal between 90 and 110 makes no torque, so the joint stays at 100 and the error stays 15. Above 110, the joint follows the goal minus 10.

> **[FIGURE: toy cost curve]** Cost against goal. Flat from 90 to 110, then falling to zero at 125.

A gradient method that starts in the flat part sees zero slope and doesn't move. So `mpc` starts from 50 different plans: 49 "`inv` plus a constant offset" plans spread across the band, plus last step's plan shifted by one step. Then it takes two Gauss-Newton steps from the best one.

`solve` doesn't have this problem, because it tries a list of whole-tick destinations directly.

<details>
<summary>Predict first: why 50 starts? (exam L5)</summary>

[ROUGH DRAFT: predict box L5.]

</details>

### Two rules against chatter

> **[FIGURE: goal trace with and without the gate]** Real or stand-in trace: the goal reverses 17 times per second without the gate, 1.8 with it.

Left alone, both planners chatter. Two rules fix most of it.

- **The hold rule.** If a new plan would gain less than half a tick, keep the last goal. This stops the goal from flipping each time the reading flips between two ticks.
- **The reversal gate.** A correction that reverses across the dead band costs a big goal jump. The gate allows it only if it gains at least 1.5 ticks (2.3 mrad) and at least about 0.2 s have passed since the last reversal. Without the gate, the goal reversed up to 17 times per second. With it, 1.8 or fewer. The price: 0.4 to 1.0 mrad worse on holds.

<details>
<summary>The reversal gate, with numbers</summary>

[ROUGH DRAFT: toy example from the tutor: last push up, goal 110, joint at 100, target 99. To move down 1 mrad, the goal must jump below 90.]

</details>

### Can they model gravity at different poses?

> **[FIGURE: predicted against measured sag]** For a set of poses: the sag the model predicts and the sag measured.

Yes, partly. The servo model has sag terms from the link angles, as in part 2. They're in goal units (rad of steady error), not torque.

### Why not run a full physics simulator inside?

> **[FIGURE: model sizes]** Per-joint servo model (a few numbers) against the full MuJoCo arm, with the rollout time and the fit data needed.

I asked this too. They do simulate a model and keep the best goal. The model is just small: one fitted model per joint, from real logs. A full MuJoCo rollout of 0.25 s takes about 0.75 ms on my Mac, which is fine for speed. [ROUGH DRAFT: give the other reasons from the tutor: fit quality, robustness]

<details>
<summary>Where I was wrong: is solve the same as Mink?</summary>

No. Mink is inverse kinematics. It turns a gripper pose into joint motions, from the geometry of the arm. It doesn't know the servo and doesn't look ahead in time. `solve` starts after that step: the joint target is already known, and it chooses the servo goal in time.

</details>

### The real-arm numbers

> **[MEDIA: 3D tracking viewer]** pi, solve and mpc on the cat motion, real traces, error magnified. Play, pause, change the magnification.

> **[FIGURE: per-joint bars]** The table as grouped bars. **[FIGURE: error by speed bin]** pi, solve and mpc across speed bins, showing pi ahead at the fastest speeds.

On the real arm, "cat" motion, 60 Hz, error in mrad:

| Controller | Total | pan | lift | elbow | wrist flex | roll |
|---|---:|---:|---:|---:|---:|---:|
| pi | 8.4 | 6.6 | 10.8 | 11.0 | 7.0 | 4.9 |
| solve | 6.2 | 3.2 | 7.4 | 6.7 | 8.7 | 2.8 |
| mpc | 6.0 | 3.0 | 7.0 | 6.1 | 8.6 | 2.8 |

The planners win overall. But look at speed. On the fastest parts of the motions, `pi` is better: 11.7 mrad against 14.2 for `solve` and 13.4 for `mpc`. A model that's a bit wrong costs more when the joint moves fast. Part 5 comes back to that.

[ROUGH DRAFT: check that the speed bins come from the same runs as the table]

## Adapt during the run: w, mpca, rls, adapt

> **[FIGURE: load step]** Simulated load step: mpc and mpca error over time. mpca recovers faster (2.5 against 3.7 mrad).

> **[FIGURE: family tree, adaptive family highlighted]**

A model is fitted once. Then the arm picks up a tool, warms up, or just isn't the arm the model was fitted on.

`solve` and `mpc` already carry the simple disturbance observer $w$ from part 3. It learns slowly: dt / 0.3 s of the way per step, so it needs about 0.3 s to catch a change. It stays within ±0.08 rad.

**`mpca`** replaces $w$ with a Kalman filter that has two parts: a fast part for a load and a slow part for sag. In a simulated load step, `mpca` got 2.5 mrad against 3.7 for `mpc` at 30 Hz.

<details>
<summary>Is mpca state of the art?</summary>

It's a strong classical baseline of a known type, not a new method. MPC with an added disturbance state estimated by a Kalman filter is a standard design, often called offset-free MPC.

</details>

**`rls`** and **`adapt`** learn a part of the servo model during the run. [ROUGH DRAFT: one line each from the controller cards]

## Repeat the same path: ilc and ilcmpc

> **[FIGURE: error per run]** Error of ilc over repeated runs of the same path, falling run after run.

If the arm does the same motion again and again, it can learn from its own past runs. Iterative learning control (`ilc`) stores the error of the last run and corrects the next run's goals with it. `ilcmpc` puts that rule on top of `mpc`. In a stand-in test on fast paths, `ilcmpc` had the lowest error. [ROUGH DRAFT: give the numbers with their unit and setting: ilcmpc 1.04, mpc 1.15, mpca 1.28, solve 1.36, pi 4.15, adapt 4.90]

## What's next

Every controller here uses a model I wrote down or fitted. Could a neural network learn the goal instead? [Part 5](/robotics/so101-5-offline-lied/) is about what happened when I tried.
