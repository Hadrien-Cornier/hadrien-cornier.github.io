---
title: 'Putting the goal ahead: from feedforward to MPC'
description: 'Fourteen controllers for a cheap servo arm, each one a different answer to the same question: where do I put the goal?'
date: '2026-10-05'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 4
---

The first three parts were about the problem: the servo only makes torque from a gap, every force on the joint needs more of that gap, and the arm only sees itself through ticks. This part is about the fixes. Every controller here answers the same question, where should I put the goal, and they mostly differ in what they use to answer it: a fixed rule, the past error, a model of the servo, or the path that's coming.

```so101-widget
{"type": "family-tree", "fallback": "Family tree of the controllers. Base: direct, then lead, then inv. Feedback and gravity: pi, sag, grav, pisag. Adaptive: adapt, rls. Model-based: solve, mpc, mpca. Repeated paths: ilc, ilcmpc. Each controller starts from an earlier one and adds one part.", "links": {"direct": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "lead": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "inv": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "pi": "/robotics/so101-4-goal-ahead/#feedback-pi", "sag": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "grav": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "pisag": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "adapt": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "rls": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "mpca": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "solve": "/robotics/so101-4-goal-ahead/#planning-solve-and-mpc", "mpc": "/robotics/so101-4-goal-ahead/#planning-solve-and-mpc", "ilc": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc", "ilcmpc": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc"}}
```

## Predicting the future: lead and inv

![Two panels from the real arm on the same motion. With direct, the goal sits on the target and the joint arrives late. With inv, the goal leads the target and the joint lands closer to it.](/assets/robotics/so101-series/inv-goal.png "Real arm, 30 Hz. `inv` sends the goal ahead of the target, so the joint arrives closer to on time.")

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/sig-inv.png" aria-label="Three copies of the real arm on the same motion with direct, lead and inv, each with its error drawn larger and plotted beside it">
<source src="/assets/robotics/so101-series/sig-inv.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/sig-inv.mp4">Watch the video</a>
</video>
<figcaption>Real arm on the same motion with `direct`, `lead` and `inv` at 30 Hz. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. <a class="video-link" href="/assets/robotics/so101-series/sig-inv.mp4">Open video</a></figcaption>
</figure>

The simplest fixes don't look at the arm at all, only at the target. `lead` just sends the target one tick early. `inv` goes further and inverts a simple model of the servo, with the dead time and the lag from the step test on my arm:

$$
\text{goal}(t) = q^*(t + 33\ \text{ms}) + 0.106\ \text{s}\cdot\dot q^*(t) + 0.0023\ \text{s}^2\cdot\ddot q^*(t)
$$

The first term reads the target one dead time ahead, the second moves the goal ahead by the speed times the servo lag, and the third adds a small push for the acceleration. With a fitted constants file, each joint uses its own dead time, lag and acceleration term instead.

This is feedforward: the goal comes from what we know about the target and the servo, not from the error. It's also the only thing that can deal with dead time, since any feedback arrives at least one dead time late. And because `inv` takes the speed and acceleration of the target from the planned path, it doesn't suffer from the derivative noise of part 3.

<details>
<summary>Is a fixed goal offset enough for the dead band?</summary>

Almost, with one change: the offset has to follow the direction. To push up you add the band, and to push down you subtract it. The trouble is near zero speed, where the sign flips, so the goal jumps by twice the band and can zig-zag. A smooth ramp near zero helps. A model that simulates the band handles the sign, the size and the dynamics together, which is one of the reasons for `solve` and `mpc` below.

</details>

## Gravity: sag and grav

`sag` adds a goal offset that depends on the pose, using the fitted sag terms from part 2 with the sines and cosines of the link angles. `grav` does the same thing from a gravity model. Both put in the gap that gravity needs ahead of time, so the joint doesn't have to sag into it.

## Feedback: pi

`pi` adds an outer PI loop on top of `inv`. It looks at the error $e$, the target minus the reading, and moves the goal a little:

$$
\text{goal} = \text{goal}_{inv} + 0.2\,e + 2\ \text{s}^{-1}\textstyle\int e\,dt
$$

On the real arm the gains are small on purpose: 0.2 for the proportional part and 2 per second for the integral, with limits on both. The integral is the part that matters, because it slowly builds up whatever offset the model is missing, like a steady sag, until it's gone. On my "cat" motion at 60 Hz, `pi` gets 8.4 mrad.

The gains are small because of everything from part 2. The arm only covers about 0.15 of a goal change in one 33 ms step, and the dead time means the loop always acts on old information. In the simulation study, the Classical controller used a much larger proportional gain of 4, without any dead time, and that's where I learned the next lesson.

![The servo gap split into three parts: e from the servo spring, 4e from the outer loop, and the model offset, adding up to 5e plus the offset.](/assets/robotics/so101-series/pi-five.png "With an outer gain of 4, the joint feels 5 times the servo stiffness against a missing torque.")

```so101-widget
{"type": "predict", "id": "C1", "fallback": "Exam question C1: with an outer gain of 4, how much stiffer does the joint get against a missing torque?"}
```

I assumed an outer gain of 4 would make the joint 4 times stiffer. It's 5 times. The servo gap is the goal minus the joint, which works out to

$$
\text{goal} - q = (\text{target} - q) + \text{offset} + 4e = 5e + \text{offset}
$$

The extra 1 is the servo spring itself. The goal already sits on the target, so a joint that's $e$ behind already has a gap of $e$, and the outer loop adds 4 more on top. Against a missing torque, the stiffness is then 13.64 × 5 = 68.2 N·m/rad.

<details>
<summary>Where I was wrong: kp × 4</summary>

I multiplied $k_p$ by 4 and got about 7 mrad. I found the mistake myself after a while: I'd left out the servo spring.

</details>

Why not a gain of 100, then? With a gain of 4, the arm covers about 0.6 of the error per step, which is stable. With a gain of 100 it would try to cover 15 times the error, so it overshoots, the next error is larger on the other side, and the oscillation keeps growing. A gain of 100 would also turn a single tick of reading noise into a 153 mrad jump of the goal. Add a 33 ms dead time and even a gain of 4 is too much: when I tried the Classical gains (4 and 10) with the dead time of my real arm in the shake test below, the servo spent about 95 % of the time at its torque limit.

The model also helps the feedback. A plain outer PID with no model saturated the servo on 10.9 % of the steps on a stiff simulated robot, while the same feedback on top of a model offset saturated on 0 %. The model does most of the work, so the feedback gains can stay low.

```so101-widget
{"type": "servo-playground", "mode": "pi", "fallback": "Interactive: one joint following a sine with a load step at 3 s. Sliders for the outer P and I gains show the load being absorbed, and oscillation at high gains."}
```

## Shaking a load up and down, or left and right

This is the example that made the planners click for me. Suppose I hold a weight in the gripper and shake it up and down. Gravity on the weight is a steady extra load, so the integral of `pi` should slowly build up the extra torque and hold it. Now suppose I shake it left and right instead. Gravity on the weight doesn't change, but the weight has to be stopped and turned around at each end of the stroke, and that inertia torque reverses every half stroke, so the integral is always half a cycle late. What should help there is something that sees the end of the stroke coming and starts pushing before it gets there.

I tested this in simulation, with the SO-101 model in MuJoCo, a 150 g load in the gripper, the simulated servo, a 33 ms dead time and a 30 Hz loop. The arm reaches forward and either the shoulder lifts the load up and down, or the base swings it left and right, by 0.1 rad at 1 Hz. I compared five controllers: `direct`, `pi` with the real-arm gains, `inv` plus `pi`, and two "preview" controllers that compute the torque the planned path needs from the arm's inverse dynamics, one with a model that doesn't know about the load and one that does.

![Two panels of error over time and two bar charts. In the vertical shake, direct has an error of 88 mrad with a mean of 50, pi has 77 with a mean of 0, and preview without the payload has 6. In the horizontal shake, direct has 65, pi has 66, and preview without the payload has 1.8.](/assets/robotics/so101-series/shake-test.png "Simulation. The integral removes the steady sag of the vertical shake but not the shake itself, and it does nothing for the horizontal shake.")

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/shake.png" aria-label="Four simulated arms shaking a 150 gram load, vertically and horizontally, with pi and with preview, each with the error of the shaken joint plotted under it">
<source src="/assets/robotics/so101-series/shake.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/shake.mp4">Watch the video</a>
</video>
<figcaption>Simulated SO-101 shaking a 150 g load at 1 Hz, error drawn 10 times larger. Top row vertical (plot: shoulder_lift), bottom row horizontal (plot: shoulder_pan); left `pi`, right preview. The four plots use the same scale. <a class="video-link" href="/assets/robotics/so101-series/shake.mp4">Open video</a></figcaption>
</figure>

The result was half what I expected. In the vertical shake, the integral did remove the steady part: the mean error went from 50 mrad with `direct` to 0 with `pi`. But the shake itself stayed, with an RMS error of 77 mrad against 88, because the vertical shake also has to accelerate and stop the load, and that part reverses just like in the horizontal case. In the horizontal shake there was no steady part to remove, and `pi` did nothing at all, 66 mrad against 65.

What fixed both was looking ahead. `inv` plus `pi` brought the errors down to 22 and 11 mrad, and the preview controller to 6 and 1.8 mrad, even with a model that didn't know about the load. With the load in its model, both went under 1 mrad. So the integral handles what stays the same, and the path ahead handles what changes, which is exactly the job of the planners below.

I didn't push this test hard enough to reach the torque limit, so the second half of my idea, that braking early is the only way to stop a heavy load in time, is still untested here. I also used a simple preview feedforward rather than the full `mpc`, so this shows what the path ahead is worth, not how well `mpc` itself uses it.

## Planning: solve and mpc

This is the part I understood least, so I'll go slowly. Both controllers do the same thing at each step:

1. Take the current reading and the target path for the next 0.25 s.
2. Use a model of the servo to predict where the joint will go for a given plan of goals.
3. Pick the plan with the smallest predicted error.
4. Send only the first goal of that plan.
5. At the next step, plan again from the new reading.

That last part is called a receding horizon: the plan itself is never executed, only its first step. The 0.25 s look-ahead is about the dead time plus two servo lags, because a shorter one wouldn't see the effect of the goal I send now.

### The difference is the plan they can choose

```so101-widget
{"type": "plan-compare", "fallback": "solve chooses one destination goal and the steps follow a fixed rule toward it. mpc chooses a free goal for each step of the 0.25 s horizon. With a dead band, a constant goal between 90 and 110 mrad does nothing, so the cost is flat there and a gradient method does not move."}
```

`solve` chooses one number per joint, a destination goal on whole encoder ticks, and the goals in between follow a fixed rule toward that destination. So it searches a family of plans with a single knob. `mpc` chooses one goal for each step of the horizon, 8 goals at 30 Hz, 15 at 60 Hz and 25 at 100 Hz, so its plan can do anything: overshoot, brake early, or hold.

The mpc cost has three parts: the mean squared tracking error, a small cost on goal changes beyond what `inv` would do, and a tiny cost on straying away from `inv`.

```so101-widget
{"type": "predict", "fallback": "Predict first. At each tick, what does solve choose for one joint? Answer: One destination goal per joint, on whole encoder ticks.", "id": "L1"}
```

### Why mpc needs 50 warm starts

![Cost after one step against a constant goal. The cost is flat from 90 to 110 mrad, inside the dead band, then falls to its minimum at 125 mrad and rises again.](/assets/robotics/so101-series/deadband-cost.png "The toy dead-band case: a gradient method that starts in the flat part has nothing to follow.")

A toy example helped me here. Suppose the joint is at 100 mrad, the target is 115, and the dead band is 10 mrad on each side. Any goal between 90 and 110 makes no torque at all, so the joint stays at 100 and the error stays at 15. Above 110, the joint follows the goal minus 10. If you plot the cost against the goal, it's flat from 90 to 110 and then falls. A gradient method that starts somewhere in the flat part sees a slope of zero and doesn't move.

So `mpc` starts from 50 different plans: 49 plans of the form "`inv` plus a constant offset", spread across the band, plus the previous step's plan shifted by one step. Then it takes two Gauss-Newton steps from the best one. `solve` doesn't have this problem because it tries a list of whole-tick destinations directly.

```so101-widget
{"type": "predict", "fallback": "Predict first. Why does mpc test 49 'inv goal + constant offset' plans before its Gauss-Newton steps? Answer: The flat cost in the dead band stops a gradient method. The 49 plans find the correct side of the band first.", "id": "L5"}
```

### Two rules against chatter

Left alone, both planners chatter, and two rules fix most of it. The hold rule keeps the last goal if a new plan would gain less than half a tick, which stops the goal from flipping every time the reading flips between two ticks. The reversal gate deals with the dead band: a correction that reverses across the band costs a big goal jump, so the gate only allows it if it gains at least 1.5 ticks (2.3 mrad) and at least about 0.2 s have passed since the last reversal. Without the gate the goal reversed up to 17 times per second, and with it 1.8 times or fewer. The price is 0.4 to 1.0 mrad more error on holds.

<details>
<summary>The reversal gate, with numbers</summary>

Suppose the dead band is 10 mrad on each side and the last push was up: the goal is at 110 and the joint sits at 100. The target is 99. To move the joint down even 1 mrad, the goal has to drop below 90, a jump of more than 20 mrad. With a goal of 88, the joint goes to 98, now 1 below the target. To fix that, the goal has to go back above 108, another 20 mrad jump. Each small fix overshoots, so the goal bounces up and down. The gate only lets a goal reverse against its last push if the model predicts at least 1.5 ticks less error, and if the last reversal of that joint is at least about 0.2 s old. A reversal in the direction the target is moving is always allowed. The price is that a static error below about 1.5 ticks can stay.

</details>

### Can they model gravity at different poses?

Partly. The servo model has the sag terms from the link angles, as in part 2. They're in goal units, radians of steady error, rather than in torque.

### Why not run a full physics simulator inside?

I asked this too. They do simulate a model and keep the best goal, but the model is small: one fitted model per joint, from real logs. There are three reasons. The first is time: one 0.25 s MuJoCo rollout of the SO-101 takes about 0.75 ms on my Mac, the budget at 100 Hz is about 2 ms per step, and the planners test dozens of plans. The second is coupling: in the full arm, the shoulder goal changes the elbow load, so the search would have to try combinations of all five joints instead of five separate searches. The third is accuracy, which matters most. A physics model is only as good as its constants, and the masses in the model aren't measured on my arm. A Genesis model fitted to my arm predicted held-out logs only a little better than the small servo model (elbow 13.5 against 16.1 mrad, in simulation). So the real question isn't physics or no physics, it's which model predicts my arm best and fast enough.

<details>
<summary>Where I was wrong: is solve the same as Mink?</summary>

I thought `solve` was basically Mink. It isn't. Mink is inverse kinematics: it turns a gripper pose into joint motions from the geometry of the arm, it doesn't know about the servo, and it doesn't look ahead in time. `solve` comes after that step. The joint target is already known, and it chooses the servo goal over time.

</details>

### The real-arm numbers

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/cat-four.png" aria-label="The same real motion with four controllers side by side: direct, pi, solve and mpc, each with its error drawn larger and plotted under it">
<source src="/assets/robotics/so101-series/cat-four.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/cat-four.mp4">Watch the video</a>
</video>
<figcaption>Real arm on the cat motion: `direct` at 30 Hz, `pi`, `solve` and `mpc` at 60 Hz. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. <a class="video-link" href="/assets/robotics/so101-series/cat-four.mp4">Open video</a></figcaption>
</figure>

On the real arm, on the "cat" motion at 60 Hz, the errors in mrad were:

| Controller | Total | pan | lift | elbow | wrist flex | roll |
|---|---:|---:|---:|---:|---:|---:|
| pi | 8.4 | 6.6 | 10.8 | 11.0 | 7.0 | 4.9 |
| solve | 6.2 | 3.2 | 7.4 | 6.7 | 8.7 | 2.8 |
| mpc | 6.0 | 3.0 | 7.0 | 6.1 | 8.6 | 2.8 |

![Left: RMS error per joint on the real arm for pi, solve and mpc. The planners win on pan, lift, elbow and roll, and lose on wrist flex. Right: at the fastest speeds pi has 11.7 mrad against 14.2 for solve and 13.4 for mpc.](/assets/robotics/so101-series/real-arm-joints.png "Real arm, cat motion, 60 Hz. The planners win overall, and pi wins at the fastest speeds.")

The planners win overall, but the picture changes with speed. On the fastest parts of the motions, `pi` does better, 11.7 mrad against 14.2 for `solve` and 13.4 for `mpc`. Most of that comes from wrist_flex, with 24.7 and 24.8 mrad for `solve` and `mpc` against 16.0 for `pi`. One possible cause is a step limit that the planners hit on 1 % to 3 % of the steps, but I haven't verified it, and each controller ran only once. I come back to model error at speed in part 5.

## Adapting during the run: w, mpca, rls, adapt

```so101-widget
{"type": "family-tree", "fallback": "Family tree of the controllers. Base: direct, then lead, then inv. Feedback and gravity: pi, sag, grav, pisag. Adaptive: adapt, rls. Model-based: solve, mpc, mpca. Repeated paths: ilc, ilcmpc. Each controller starts from an earlier one and adds one part.", "links": {"direct": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "lead": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "inv": "/robotics/so101-4-goal-ahead/#predicting-the-future-lead-and-inv", "pi": "/robotics/so101-4-goal-ahead/#feedback-pi", "sag": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "grav": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "pisag": "/robotics/so101-4-goal-ahead/#gravity-sag-and-grav", "adapt": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "rls": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "mpca": "/robotics/so101-4-goal-ahead/#adapting-during-the-run-w-mpca-rls-adapt", "solve": "/robotics/so101-4-goal-ahead/#planning-solve-and-mpc", "mpc": "/robotics/so101-4-goal-ahead/#planning-solve-and-mpc", "ilc": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc", "ilcmpc": "/robotics/so101-4-goal-ahead/#repeating-the-same-path-ilc-and-ilcmpc"}, "highlight": "adaptive"}
```

A model is fitted once, and then the arm picks up a tool, warms up, or simply isn't quite the arm the model was fitted on. `solve` and `mpc` already carry the simple disturbance observer $w$ from part 3. It learns slowly, dt / 0.3 s of the way per step, so it needs about 0.3 s to catch a change, and it stays within ±0.08 rad. `mpca` replaces $w$ with a Kalman filter that has a fast part for a load and a slow part for sag. In a simulated load step, `mpca` got 2.5 mrad against 3.7 for `mpc` at 30 Hz.

On my real arm, `mpca` is the controller I ran the most. On one 120 s motion at 60 Hz, with the fitted constants of my arm, it kept shoulder_lift at 10.3 mrad RMS. `direct` on the same motion and at the same rate gave 87.6 mrad, mostly because the arm reaches out and sags (mean error 70 mrad).

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/real-mpca.png" aria-label="Two copies of the real arm on the same motion at 60 Hz, direct and mpca, each with its error drawn larger and plotted under it">
<source src="/assets/robotics/so101-series/real-mpca.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/real-mpca.mp4">Watch the video</a>
</video>
<figcaption>Real arm, same motion, 60 Hz: `direct` against `mpca`. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. The plots cover the first 16 s; the RMS numbers in the text cover the whole 120 s run. <a class="video-link" href="/assets/robotics/so101-series/real-mpca.mp4">Open video</a></figcaption>
</figure>

<details>
<summary>Is mpca state of the art?</summary>

It's a strong classical baseline of a known type rather than a new method. MPC with an extra disturbance state estimated by a Kalman filter is a standard design, often called offset-free MPC.

</details>

`adapt` keeps the plain `inv` goal but uses a Kalman filter per joint to estimate a fast load part, a slow sag part and a friction part, and subtracts them. `rls` learns the servo model itself during the run: it starts from the fitted model and updates a small linear model of the last two positions and goals with recursive least squares, forgetting old data slowly.

## Repeating the same path: ilc and ilcmpc

If the arm does the same motion over and over, it can learn from its own past runs. Iterative learning control (`ilc`) stores the error of the last run and uses it to correct the goals of the next one, and `ilcmpc` puts that rule on top of `mpc`. In a stand-in test on the fast motion sets at 100 Hz, `ilcmpc` had the lowest error: 1.04 mrad, against 1.15 for `mpc`, 1.28 for `mpca`, 1.36 for `solve`, 4.15 for `pi` and 4.90 for `adapt`. The stand-in arm uses the same servo model as the planners, so this test favors them.

## What's next

Every controller in this part uses a model that I either wrote down or fitted. In [part 5](/robotics/so101-5-offline-lied/) I try learning the goal with a neural network instead, and explain why its offline scores misled me.
