---
title: 'Seeing finer than the sensor'
description: 'Why differentiating encoder ticks explodes the noise, and how an observer or a Kalman filter can estimate an angle finer than one tick.'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 3
---

> **In this series.** [ROUGH DRAFT: series box. Part 3 of 5.]

My arm sees itself through whole encoder ticks of 1.534 mrad. Every controller reads that staircase. So two questions kept coming back.

What happens when a controller needs more than the angle, like the speed or the acceleration? And can a controller know the angle better than the sensor tells it?

## Two differences make a lot of noise

To push the arm along a path, you need to know the torque it takes. The equation of motion from part 2 needs the acceleration $\ddot q$:

$$
\tau = M(q)\,\ddot q + C(q,\dot q)\,\dot q + G(q)
$$

A friend who works on robots told me that taking the acceleration from noisy encoder readings is a classic trap. [ROUGH DRAFT: name Olivier only with Hadrien's approval; check his exact claim] Let's see why with numbers.

Speed from two readings: $v \approx (q_k - q_{k-1})/\Delta t$. Acceleration from three: $a \approx (q_k - 2q_{k-1} + q_{k-2})/\Delta t^2$.

One tick of reading noise at 30 Hz becomes

$$
\frac{1.534\ \text{mrad}}{(1/30\ \text{s})^2} \approx 1.4\ \text{rad/s}^2
$$

Units: rad ÷ s² = rad/s². That's a noise of the same size as the real accelerations of a fast motion. And it gets worse with a faster loop. The noise grows with the square of the rate, so at 60 Hz it's 4 times bigger. A faster loop gives you a worse acceleration estimate, not a better one.

> **[WIDGET: derivative-noise]** A smooth true path, its tick readings, then the speed and acceleration from differences at 30, 60 and 120 Hz.

### Did I hit this?

> **[FIGURE: where the acceleration comes from]** Two pipelines side by side: "encoder → two differences → noisy q̈" against "planned path → exact q̈*". The lab controllers use the second.

Partly.

- **The model-based controllers avoid it.** `inv`, `solve` and `mpc` take the acceleration from the target path, which I know exactly. The target has no sensor noise.
- **One network probably hit it.** A network with 4 past readings as inputs got, in effect, a noisy acceleration estimate. In closed loop it did terribly (part 5). The study named this as a likely cause. It wasn't tested.
- **Fitting a model from logs has the same problem.** The usual answer in the literature is to fit smooth periodic motions instead of differentiating raw readings (Swevers and colleagues, 1997).

### A second amplifier: the one-step inverse

> **[FIGURE: goal step and response in one step]** A one-tick goal change and the joint response over 33 ms: only 0.15 tick. Then the 7-tick goal needed for a 1-tick move.

There's another way to amplify noise, and this one is everywhere in my controllers.

A one-step inverse asks: "which goal puts the joint on the target at the next step?" The trouble is that the servo responds slowly. In the simulator, one tick of goal change moves the joint only 0.14 to 0.17 tick in one 33 ms step. Why so little? One goal tick adds only 13.64 × 0.001534 = 0.021 N·m of torque, and that torque first has to accelerate the arm against damping. The servo time constant (78 ms) is longer than two steps.

So to move the joint 1 tick in one step, the inverse has to move the goal about 1/0.15 ≈ 7 ticks. It multiplies whatever it sees by about 7. That includes reading noise and model errors.

<details>
<summary>Predict first: one-step gain (exam F2)</summary>

[ROUGH DRAFT: predict box F2; self-contained, all numbers in the prompt.]

</details>

## Estimate the angle instead of reading it

> **[FIGURE: predict, compare, correct]** One step drawn on a number line: last estimate, prediction, reading, innovation, corrected estimate.

Here's the idea that fascinated me. Don't trust the reading alone. Use a model of the joint to predict where it is. Then use the reading to correct the prediction, but only partly.

Why can that beat the sensor? Because the model knows the physics between two readings, and many readings together carry more information than one. The estimate can be finer than one tick.

The loop has four steps:

1. **Predict.** Use the model to move the last estimate forward one step.
2. **Compare.** Subtract the prediction from the new reading. This difference is the *innovation*.
3. **Correct.** Move the estimate by a fraction α of the innovation.
4. **Repeat** at each step.

This is an *observer*. The simplest one is the alpha-beta filter: it estimates position and speed, and you pick the fraction α by hand.

> **[WIDGET: observer]** The true angle, the tick staircase of the readings, and the estimate. An α slider. Live RMS of the reading and of the estimate. A toggle adds a model error.

Does it help a controller? In the simulation study, the best model-based controller (Fitted) had 0.398 mrad of error. With an alpha-beta observer (α = 0.4) feeding it, it went to 0.268 mrad. With a perfect sensor, it would get 0.228. And the goal stopped jittering: the goal changed by 39.1 mrad per step before, 5.9 after.

<details>
<summary>Predict first: the rounding floor (exam F4)</summary>

[ROUGH DRAFT: predict box F4.]

</details>

## The Kalman filter

So how do you choose α? That's where the Kalman filter comes in.

A Kalman filter does the same predict-compare-correct loop. But it computes the fraction from two noise sizes:

- **The reading noise.** Here, the tick rounding: $1/\sqrt{12}$ tick.
- **The model error.** How wrong the prediction can be in one step.

If the sensor is noisy and the model is good, the gain is small: trust the model. If the model is poor and the sensor is good, the gain is large: trust the reading.

When both noise sizes stay constant, the Kalman gain settles to a fixed value. At that point the Kalman filter *is* an alpha-beta filter with the right α. So the alpha-beta filter is a Kalman filter with a hand-picked, fixed gain.

> **[WIDGET: observer, Kalman mode]** Sliders for the reading noise and the model noise. Shows the computed gain settling to a fixed α.

## Two things you can observe

> **[FIGURE: two observers]** Two block diagrams with the same predict-compare-correct loop. Left output: true angle and speed. Right output: the missing force (w, or the mpca load and sag parts).

> **[MEDIA: viewer clip]** mpc with and without an observer on the same hold: goal jitter visible on the goal trace.

The same idea can estimate two different things. This confused me for a while.

- A **state observer** estimates the true position and speed. The alpha-beta filter above is one.
- A **disturbance observer** estimates what the model is missing, like a tool in the gripper or a sag the model didn't expect.

My `solve` and `mpc` controllers keep a simple disturbance observer called $w$. Each step, the model predicts the next reading. The prediction error tells the controller something is missing, and $w$ moves a small part of the way toward explaining it (dt / 0.3 s of the way). `mpca` replaces that with a Kalman filter that has a fast part for a load and a slow part for sag. More on both in part 4.

<details>
<summary>Where I was wrong: is mpca the observer?</summary>

When I learned about the observer, I thought "that's exactly what mpca adds". Same family, different target. mpca's Kalman filter is a disturbance observer: it estimates the missing force. The alpha-beta filter is a state observer: it estimates the true angle.

</details>

<details>
<summary>Where I was wrong: is w a Kalman parameter?</summary>

I thought $w$ was a setting. It's an estimate that changes during the run. For each joint, it's the steady part of the error the model doesn't explain, in goal units. The goal subtracts it.

</details>

<details>
<summary>A prediction I got right: would mpc chatter less with an observer?</summary>

Yes. The observer's position is smoother than the reading, so the goal flips between two ticks less often. That covers one cause of chatter. The reversal gate in part 4 covers another one: plans that cross the dead band back and forth.

</details>

## What's next

So the sensor isn't the end of the story. With a model, a controller can see finer than one tick. [Part 4](/robotics/so101-4-goal-ahead/) puts that to work: where each controller puts the goal.
