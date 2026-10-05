---
title: 'Putting the goal ahead: from feedforward to MPC'
description: 'Fourteen controllers for a cheap servo arm, each one a different answer to the same question: where do I put the goal?'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 4
---

> **In this series.** [ROUGH DRAFT: series box. Part 4 of 5.]

The first three parts were about the problem: the servo only makes torque from a gap, every force on the joint needs more of that gap, and the arm only sees itself through ticks. This part is about the fixes. Every controller here answers the same question, where should I put the goal, and they mostly differ in what they use to answer it: a fixed rule, the past error, a model of the servo, or the path that's coming.

> **[FIGURE: family tree, all families]** Click a family to jump to its section.

## Predicting the future: lead and inv

> **[FIGURE: target, inv goal, joint]** On a real trace: the target, the inv goal shifted ahead, and the joint landing on the target. Compare with direct.

> **[MEDIA: viewer clip]** direct against inv on the same real motion, error magnified.

The simplest fixes don't look at the arm at all, only at the target. `lead` just sends the target one tick early. `inv` goes further and inverts the lag of the servo: it sends the target from $t + D$, where $D$ is the fitted dead time plus half a step, and it moves the goal ahead by the speed times the servo lag.

$$
\text{goal}(t) = \text{target}(t + D) + \frac{d}{k_p}\,\dot q^*(t + D)
$$

[ROUGH DRAFT: check the exact inv formula in model_controllers.py, including the accel term]

This is feedforward: the goal comes from what we know about the target and the servo, not from the error. It's also the only thing that can deal with dead time, since any feedback arrives at least one dead time late. And because `inv` takes the speed and acceleration of the target from the planned path, it doesn't suffer from the derivative noise of part 3.

<details>
<summary>Is a fixed goal offset enough for the dead band?</summary>

Almost, with one change: the offset has to follow the direction. To push up you add the band, and to push down you subtract it. The trouble is near zero speed, where the sign flips, so the goal jumps by twice the band and can zig-zag. A smooth ramp near zero helps. A model that simulates the band handles the sign, the size and the dynamics together, which is one of the reasons for `solve` and `mpc` below.

</details>

## Gravity: sag and grav

> **[FIGURE: sag map]** Sag offset of shoulder_lift against the pose, from the fitted sin/cos terms. Two arm poses drawn at the extremes.

`sag` adds a goal offset that depends on the pose, using the fitted sag terms from part 2 with the sines and cosines of the link angles. `grav` does the same thing from a gravity model. Both put in the gap that gravity needs ahead of time, so the joint doesn't have to sag into it.

## Feedback: pi

> **[FIGURE: 5e, not 4e]** The servo gap split into its parts: the target error e from the servo spring, plus 4e from the outer loop, plus the model offset.

`pi` adds an outer PI loop on top of the servo. It looks at the error, the target minus the reading, and moves the goal:

$$
\text{goal} = \text{target} + \text{offset} + 4\,e + k_i \textstyle\int e\,dt
$$

The outer gain is 4, so I assumed the joint would get 4 times stiffer, and that's where I went wrong.

<details>
<summary>Predict first: how much stiffer? (exam C1)</summary>

[ROUGH DRAFT: predict box C1. The model lacks 0.378 N·m. Outer P gain 4. Static error? Answer 5.5 mrad.]

</details>

It's 5 times, not 4. The servo gap is the goal minus the joint, which works out to

$$
\text{goal} - q = (\text{target} - q) + \text{offset} + 4e = 5e + \text{offset}
$$

The extra 1 is the servo spring itself. The goal already sits on the target, so a joint that's $e$ behind already has a gap of $e$, and the outer loop adds 4 more on top. Against a missing torque, the stiffness is then 13.64 × 5 = 68.2 N·m/rad.

<details>
<summary>Where I was wrong: kp × 4</summary>

I multiplied $k_p$ by 4 and got about 7 mrad. I found the mistake myself after a while: I'd left out the servo spring.

</details>

Why 4 and not 100? In one 33 ms step, the arm only covers about 0.15 of a goal change. With a gain of 4 it covers about 0.6 of the error per step, which is stable. With a gain of 100 it would try to cover 15 times the error, so it overshoots, the next error is larger on the other side, and the oscillation keeps growing. A gain of 100 would also turn a single tick of reading noise into a 153 mrad jump of the goal.

The model also helps the feedback. A plain outer PID with no model saturated the servo on 10.9 % of the steps on a stiff simulated robot, while the same feedback on top of a model offset saturated on 0 %. The model does most of the work, so the feedback gains can stay low.

> **[WIDGET: servo-playground, pi mode]** Sliders for the outer P and I gains. Watch the response to a load step, and the oscillation at a high gain.

On the real arm, on my "cat" motion at 60 Hz, `pi` gets 8.4 mrad.

## Shaking a load up and down, or left and right

> **[MEDIA: side-by-side clip]** Vertical and horizontal shake, pi and mpc.

This is the example that made the planners click for me. Suppose I hold a weight in the gripper and shake it up and down. Gravity on the weight is a steady extra load, so the integral of `pi` slowly builds up the extra torque and holds it. Now suppose I shake it left and right instead. Gravity on the weight doesn't change, but the weight has to be stopped and turned around at each end of the stroke, and that inertia torque reverses every half stroke. The integral is always half a cycle late.

What would help there is something that sees the end of the stroke coming and starts braking before it gets there. And since the servo has a maximum torque, braking early may be the only way to stop in time.

That's my hypothesis, and here is the test. [ROUGH DRAFT: shake experiment, stand-in simulation, pi against mpc, vertical and horizontal, same amplitude and frequency. Report the result even if it goes against the story.]

## Planning: solve and mpc

This is the part I understood least, so I'll go slowly. Both controllers do the same thing at each step:

1. Take the current reading and the target path for the next 0.25 s.
2. Use a model of the servo to predict where the joint will go for a given plan of goals.
3. Pick the plan with the smallest predicted error.
4. Send only the first goal of that plan.
5. At the next step, plan again from the new reading.

That last part is called a receding horizon: the plan itself is never executed, only its first step. The 0.25 s look-ahead is about the dead time plus two servo lags, because a shorter one wouldn't see the effect of the goal I send now.

### The difference is the plan they can choose

> **[WIDGET: plan-compare]** The target over the next 0.25 s. A solve plan with one slider (the destination). An mpc plan with one handle per step. Both show the predicted joint path and the cost.

`solve` chooses one number per joint, a destination goal on whole encoder ticks, and the goals in between follow a fixed rule toward that destination. So it searches a family of plans with a single knob. `mpc` chooses one goal for each step of the horizon, 8 goals at 30 Hz, 15 at 60 Hz and 25 at 100 Hz, so its plan can do anything: overshoot, brake early, or hold.

The mpc cost has three parts: the mean squared tracking error, a small cost on goal changes beyond what `inv` would do, and a tiny cost on straying away from `inv`.

<details>
<summary>Predict first: what does solve choose each step? (exam L1)</summary>

[ROUGH DRAFT: predict box L1.]

</details>

### Why mpc needs 50 warm starts

> **[FIGURE: toy cost curve]** Cost against goal. Flat from 90 to 110, then falling to zero at 125.

A toy example helped me here. Suppose the joint is at 100 mrad, the target is 115, and the dead band is 10 mrad on each side. Any goal between 90 and 110 makes no torque at all, so the joint stays at 100 and the error stays at 15. Above 110, the joint follows the goal minus 10. If you plot the cost against the goal, it's flat from 90 to 110 and then falls. A gradient method that starts somewhere in the flat part sees a slope of zero and doesn't move.

So `mpc` starts from 50 different plans: 49 plans of the form "`inv` plus a constant offset", spread across the band, plus the previous step's plan shifted by one step. Then it takes two Gauss-Newton steps from the best one. `solve` doesn't have this problem because it tries a list of whole-tick destinations directly.

<details>
<summary>Predict first: why 50 starts? (exam L5)</summary>

[ROUGH DRAFT: predict box L5.]

</details>

### Two rules against chatter

> **[FIGURE: goal trace with and without the gate]** Real or stand-in trace: the goal reverses 17 times per second without the gate, 1.8 with it.

Left alone, both planners chatter, and two rules fix most of it. The hold rule keeps the last goal if a new plan would gain less than half a tick, which stops the goal from flipping every time the reading flips between two ticks. The reversal gate deals with the dead band: a correction that reverses across the band costs a big goal jump, so the gate only allows it if it gains at least 1.5 ticks (2.3 mrad) and at least about 0.2 s have passed since the last reversal. Without the gate the goal reversed up to 17 times per second, and with it 1.8 times or fewer. The price is 0.4 to 1.0 mrad more error on holds.

<details>
<summary>The reversal gate, with numbers</summary>

[ROUGH DRAFT: toy example from the tutor: last push up, goal 110, joint at 100, target 99. To move down 1 mrad, the goal must jump below 90.]

</details>

### Can they model gravity at different poses?

> **[FIGURE: predicted against measured sag]** For a set of poses: the sag the model predicts and the sag measured.

Partly. The servo model has the sag terms from the link angles, as in part 2. They're in goal units, radians of steady error, rather than in torque.

### Why not run a full physics simulator inside?

> **[FIGURE: model sizes]** Per-joint servo model (a few numbers) against the full MuJoCo arm, with the rollout time and the fit data needed.

I asked this too. They do simulate a model and keep the best goal, but the model is small: one fitted model per joint, from real logs. Speed isn't the problem, since a full MuJoCo rollout of 0.25 s takes about 0.75 ms on my Mac. [ROUGH DRAFT: give the other reasons from the tutor: fit quality, robustness]

<details>
<summary>Where I was wrong: is solve the same as Mink?</summary>

I thought `solve` was basically Mink. It isn't. Mink is inverse kinematics: it turns a gripper pose into joint motions from the geometry of the arm, it doesn't know about the servo, and it doesn't look ahead in time. `solve` comes after that step. The joint target is already known, and it chooses the servo goal over time.

</details>

### The real-arm numbers

> **[MEDIA: 3D tracking viewer]** pi, solve and mpc on the cat motion, real traces, error magnified. Play, pause, change the magnification.

On the real arm, on the "cat" motion at 60 Hz, the errors in mrad were:

| Controller | Total | pan | lift | elbow | wrist flex | roll |
|---|---:|---:|---:|---:|---:|---:|
| pi | 8.4 | 6.6 | 10.8 | 11.0 | 7.0 | 4.9 |
| solve | 6.2 | 3.2 | 7.4 | 6.7 | 8.7 | 2.8 |
| mpc | 6.0 | 3.0 | 7.0 | 6.1 | 8.6 | 2.8 |

> **[FIGURE: per-joint bars]** The table as grouped bars. **[FIGURE: error by speed bin]** pi, solve and mpc across speed bins, showing pi ahead at the fastest speeds.

The planners win overall, but the picture changes with speed. On the fastest parts of the motions, `pi` does better, 11.7 mrad against 14.2 for `solve` and 13.4 for `mpc`. My guess is that a model that's slightly wrong costs more when the joint moves fast, and I come back to that in part 5. [ROUGH DRAFT: check that the speed bins come from the same runs as the table]

## Adapting during the run: w, mpca, rls, adapt

> **[FIGURE: load step]** Simulated load step: mpc and mpca error over time. mpca recovers faster (2.5 against 3.7 mrad).

> **[FIGURE: family tree, adaptive family highlighted]**

A model is fitted once, and then the arm picks up a tool, warms up, or simply isn't quite the arm the model was fitted on. `solve` and `mpc` already carry the simple disturbance observer $w$ from part 3. It learns slowly, dt / 0.3 s of the way per step, so it needs about 0.3 s to catch a change, and it stays within ±0.08 rad. `mpca` replaces $w$ with a Kalman filter that has a fast part for a load and a slow part for sag. In a simulated load step, `mpca` got 2.5 mrad against 3.7 for `mpc` at 30 Hz.

<details>
<summary>Is mpca state of the art?</summary>

It's a strong classical baseline of a known type rather than a new method. MPC with an extra disturbance state estimated by a Kalman filter is a standard design, often called offset-free MPC.

</details>

`rls` and `adapt` learn part of the servo model itself during the run. [ROUGH DRAFT: one line each from the controller cards]

## Repeating the same path: ilc and ilcmpc

> **[FIGURE: error per run]** Error of ilc over repeated runs of the same path, falling run after run.

If the arm does the same motion over and over, it can learn from its own past runs. Iterative learning control (`ilc`) stores the error of the last run and uses it to correct the goals of the next one, and `ilcmpc` puts that rule on top of `mpc`. In a stand-in test on fast paths, `ilcmpc` had the lowest error of all. [ROUGH DRAFT: give the numbers with their unit and setting: ilcmpc 1.04, mpc 1.15, mpca 1.28, solve 1.36, pi 4.15, adapt 4.90]

## What's next

Every controller in this part uses a model that I either wrote down or fitted. In [part 5](/robotics/so101-5-offline-lied/) I try learning the goal with a neural network instead, and explain why its offline scores misled me.
