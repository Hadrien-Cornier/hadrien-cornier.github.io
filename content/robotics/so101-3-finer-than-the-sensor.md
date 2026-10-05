---
title: 'Seeing finer than the sensor'
description: 'Why differentiating encoder ticks explodes the noise, and how an observer or a Kalman filter can estimate an angle finer than one tick.'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 3
---

> **In this series.** [ROUGH DRAFT: series box. Part 3 of 5.]

My arm only sees itself through whole encoder ticks of 1.534 mrad, and every controller in this series reads that staircase. Two questions kept coming back while I worked on it. What happens when a controller needs more than the angle, like the speed or the acceleration? And can a controller know the angle better than the sensor tells it?

## Two differences make a lot of noise

To push the arm along a path, you need to know how much torque it takes, and the equation of motion from part 2 needs the acceleration $\ddot q$ for that:

$$
\tau = M(q)\,\ddot q + C(q,\dot q)\,\dot q + G(q)
$$

A friend who works on robots told me that taking the acceleration from noisy encoder readings is a classic trap, and I wanted to see why with actual numbers. [ROUGH DRAFT: check the claim against a source] The simplest way to get the speed is from two readings, $v \approx (q_k - q_{k-1})/\Delta t$, and the acceleration from three, $a \approx (q_k - 2q_{k-1} + q_{k-2})/\Delta t^2$. Now suppose the reading is off by one tick. At 30 Hz, that one tick turns into an acceleration error of

$$
\frac{1.534\ \text{mrad}}{(1/30\ \text{s})^2} \approx 1.4\ \text{rad/s}^2
$$

which is about the same size as the real accelerations of a fast motion. What surprised me more is that it gets worse with a faster loop. The noise grows with the square of the rate, so at 60 Hz it's four times bigger. A faster loop gives you a worse acceleration estimate, not a better one.

> **[WIDGET: derivative-noise]** A smooth true path, its tick readings, then the speed and acceleration from differences at 30, 60 and 120 Hz.

### Did I run into it?

> **[FIGURE: where the acceleration comes from]** Two pipelines side by side: "encoder → two differences → noisy q̈" against "planned path → exact q̈*". The lab controllers use the second.

Partly. The model-based controllers avoid it, because `inv`, `solve` and `mpc` take the acceleration from the target path, which I know exactly and which has no sensor noise. One of my networks probably did run into it, though. It had 4 past readings as inputs, which in effect gave it a noisy acceleration estimate, and it did terribly in closed loop, as I describe in part 5. The study listed this as a likely cause, but I never tested it directly. Fitting a model from logs has the same problem, and the usual answer in the literature is to fit smooth periodic motions instead of differentiating raw readings (Swevers and colleagues, 1997).

### A second amplifier: the one-step inverse

> **[FIGURE: goal step and response in one step]** A one-tick goal change and the joint response over 33 ms: only 0.15 tick. Then the 7-tick goal needed for a 1-tick move.

There's another way to amplify noise, and this one shows up in almost all of my controllers. A one-step inverse asks which goal will put the joint on the target at the next step. The difficulty is that the servo responds slowly. In the simulator, moving the goal by one tick moves the joint by only 0.14 to 0.17 tick in one 33 ms step. The reason is that one goal tick only adds 13.64 × 0.001534 = 0.021 N·m of torque, and that torque first has to accelerate the arm against the damping, with a servo time constant of 78 ms, longer than two steps.

So to move the joint by one tick in one step, the inverse has to move the goal by about 1/0.15, roughly 7 ticks. Whatever the inverse sees gets multiplied by about 7, including the reading noise and any error in the model.

<details>
<summary>Predict first: one-step gain (exam F2)</summary>

[ROUGH DRAFT: predict box F2; self-contained, all numbers in the prompt.]

</details>

## Estimate the angle instead of reading it

> **[FIGURE: predict, compare, correct]** One step drawn on a number line: last estimate, prediction, reading, innovation, corrected estimate.

This is the idea I found most fascinating in the whole project. Instead of trusting the reading alone, you use a model of the joint to predict where it is, and then you use the reading to correct that prediction, but only partly. The model knows the physics between two readings, and many readings together carry more information than a single one, so the estimate can end up finer than one tick.

The loop goes like this:

1. **Predict:** use the model to move the last estimate forward by one step.
2. **Compare:** subtract the prediction from the new reading. This difference is called the innovation.
3. **Correct:** move the estimate by a fraction α of the innovation.
4. **Repeat** at the next step.

This is called an observer. The simplest one is the alpha-beta filter, which estimates the position and the speed, and where you choose the fraction α by hand.

> **[WIDGET: observer]** The true angle, the tick staircase of the readings, and the estimate. An α slider. Live RMS of the reading and of the estimate. A toggle adds a model error.

Does it actually help a controller? In the simulation study, the best model-based controller, Fitted, had an error of 0.398 mrad. With an alpha-beta observer feeding it (α = 0.4), the error went down to 0.268 mrad, and with a perfect sensor it would have been 0.228. The goal also stopped jittering: it changed by 39.1 mrad per step before the observer and by 5.9 after.

<details>
<summary>Predict first: the rounding floor (exam F4)</summary>

[ROUGH DRAFT: predict box F4.]

</details>

## The Kalman filter

The obvious question is how to choose α, and that's where the Kalman filter comes in. A Kalman filter runs the same predict, compare and correct loop, but it computes the fraction from two noise sizes: the noise of the reading, which here is the tick rounding of $1/\sqrt{12}$ tick, and the error of the model, which is how wrong a one-step prediction can be. If the sensor is noisy and the model is good, the gain comes out small and the filter mostly trusts the model. If the model is poor and the sensor is good, the gain comes out large and the filter mostly trusts the reading.

When both noise sizes stay constant, the Kalman gain settles to a fixed value, and at that point the Kalman filter is an alpha-beta filter with the right α. So the way I think about it now is that the alpha-beta filter is a Kalman filter where you picked the gain by hand and froze it.

> **[WIDGET: observer, Kalman mode]** Sliders for the reading noise and the model noise. Shows the computed gain settling to a fixed α.

## Two things you can observe

> **[FIGURE: two observers]** Two block diagrams with the same predict-compare-correct loop. Left output: true angle and speed. Right output: the missing force (w, or the mpca load and sag parts).

The same idea can estimate two quite different things, which confused me for a while. A state observer estimates the true position and speed, and the alpha-beta filter above is one. A disturbance observer estimates what the model is missing, like a tool in the gripper or a sag the model didn't expect.

My `solve` and `mpc` controllers already keep a simple disturbance observer called $w$. At each step the model predicts the next reading, the prediction error tells the controller that something is missing, and $w$ moves a small part of the way toward explaining it, dt / 0.3 s of the way each step. `mpca` replaces that with a Kalman filter that has a fast part for a load and a slow part for sag. I go through both in part 4.

> **[MEDIA: viewer clip]** mpc with and without an observer on the same hold: goal jitter visible on the goal trace.

<details>
<summary>Where I was wrong: is mpca the observer?</summary>

When I first learned about observers, I thought that was exactly what mpca adds. It's the same family, but it estimates something else. mpca's Kalman filter is a disturbance observer that estimates the missing force, while the alpha-beta filter is a state observer that estimates the true angle.

</details>

<details>
<summary>Where I was wrong: is w a Kalman parameter?</summary>

I thought $w$ was a setting. It's actually an estimate that changes during the run. For each joint, it's the steady part of the error that the model doesn't explain, in goal units, and the controller subtracts it from the goal.

</details>

<details>
<summary>A prediction I got right: would mpc chatter less with an observer?</summary>

Yes. The observer's position is smoother than the reading, so the goal flips between two ticks less often, which removes one cause of chatter. The reversal gate in part 4 handles another cause, which is plans that keep crossing the dead band back and forth.

</details>

## What's next

With a model, a controller can see the joint more finely than one tick. In [part 4](/robotics/so101-4-goal-ahead/) I put that to work and go through where each controller puts the goal.
