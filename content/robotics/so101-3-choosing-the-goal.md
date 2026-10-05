---
title: 'Six ways to choose the goal'
description: 'One general formula for the goal sent to a servo. Every controller I built, from a plain look-ahead to MPC and a neural network, is that formula with some terms set to zero.'
date: '2026-10-05'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 3
---

[Part 1](/robotics/so101-1-target-and-goal/) ended with one equation for a joint of my arm, and one rule: the servo only makes torque from the gap between the goal and the joint, so every term of the equation needs a bit more gap. [Part 2](/robotics/so101-2-finer-than-the-sensor/) was about the reading the controller sees. This part is about the fixes.

I built close to twenty controllers during this project, and each one has a short lab name. Taken one by one, they look like a long list of small variations. They become much simpler once you write them all as one formula for the goal: each controller is that formula with some terms switched on and the others set to zero. They fall into six families, and each family exists to solve one kind of problem from the equation of part 1.

## One formula for the goal

Part 1 gave the ideal goal, if I knew every term of the joint equation exactly:

$$
\text{goal}(t) = q^*(t + D) + \frac{M\ddot q^* + G + d\,\dot q^* + f\,\text{sign}(\dot q^*) + C\,\dot q^*}{k_p}
$$

I don't know the terms exactly, so a real controller uses estimates, written with a hat ($\hat M$, $\hat G$ and so on). It can also correct the goal from the error it measures, and from what it learned on earlier runs. With all of that, one formula covers every controller in this series:

$$
\text{goal}(t) = q^*(t + T) + \frac{\hat M\ddot q^* + \hat C\dot q^* + \hat G(q^*) + \hat d\,\dot q^* + \hat f\,\text{sign}(\dot q^*)}{k_p} + \hat w + K_P\,e + K_I\!\int e\,dt + u_k
$$

Each new term has one meaning:

- $T$ is the **look-ahead**: how far ahead on the target path the controller reads. $T = D$ cancels the dead time.
- $\hat w$ is a **disturbance estimate**: a running guess of the torque the model is missing, already divided by $k_p$ so it is in goal units. A payload is the typical example.
- $e = q^* - \hat q$ is the **error** the controller measures. $K_P$ and $K_I$ are the gains of the proportional and the integral feedback.
- $u_k$ is a **correction learned for step $k$** of a motion, from earlier runs of the same motion.

The widget shows the formula. Select a family, then a controller: the terms that the controller uses stay bright, and the others are set to zero.

```so101-widget
{"type": "goal-equation", "fallback": "goal(t) = q*(t + T) + (M̂ q̈* + Ĉ q̇* + Ĝ(q*) + d̂ q̇* + f̂ sign(q̇*)) / kp + ŵ + K_P e + K_I ∫e dt + u_k. direct: every term is 0. lead: T = one step. inv: T = 33 ms, d̂/kp = 0.106 s, M̂/kp = 0.0023 s². sag and grav: inv + Ĝ. pi: inv + K_P = 0.2, K_I = 2 per second. adapt: inv + ŵ from a Kalman filter. solve, mpc, mpca: a servo model with T, M̂, d̂, Ĝ, the dead band and ŵ, inverted by search. ilc: inv + u_k. The network: T = one step, the τ̂/kp part learned from data, K_P = -0.25, K_I = 3."}
```

The table gives the same information for every controller. Part 1 defines the terms.

| Controller | Family | $T$ | $\hat\tau/k_p$ terms | $\hat w$ | $K_P$, $K_I$ | $u_k$ | Goal found by |
|---|:---:|---|---|---|---|---|---|
| `direct` | 1 | 0 | none | 0 | 0, 0 | 0 | formula |
| `lead` | 2 | 1 step | none | 0 | 0, 0 | 0 | formula |
| `inv` | 2 | $D$ | $\hat d$, $\hat M$, fitted on a step test | 0 | 0, 0 | 0 | formula |
| `sag` | 3 | $D$ | as `inv`, plus $\hat G$ fitted on holds | 0 | 0, 0 | 0 | formula |
| `grav` | 3 | $D$ | as `inv`, plus $\hat G$ from MuJoCo | 0 | 0, 0 | 0 | formula |
| Classical | 3 | 1 step | $\hat M$, $\hat G$, $\hat d$, $\hat f$ | 0 | 4, 10 | 0 | formula |
| `pi` | 4 | $D$ | as `inv` | 0 | 0.2, 2 | 0 | formula |
| `pisag` | 4 | $D$ | as `sag` | 0 | 0.2, 2 | 0 | formula |
| `adapt` | 4 | $D$ | as `inv` | Kalman filter | 0, 0 | 0 | formula |
| `rls` | 4 | $D$ | re-fitted during the run | 0 | 0, 0 | 0 | model inverse |
| `solve` | 5 | in the model | servo model: $\hat M$, $\hat d$, $\hat G$, dead band | slow estimate | 0, 0 | 0 | search, 0.25 s ahead |
| `mpc` | 5 | in the model | as `solve` | slow estimate | 0, 0 | 0 | search, 0.25 s plan |
| `mpca` | 5 | in the model | as `solve` | Kalman filter | 0, 0 | 0 | search, 0.25 s plan |
| Fitted | 5 | 1 step | all, from a fitted MuJoCo copy | 0 | 0, 3 | 0 | Newton, one step |
| `ilc` | 6 | $D$ | as `inv` | 0 | 0, 0 | learned | formula |
| `ilcmpc` | 6 | in the model | as `solve` | slow estimate | 0, 0 | learned | search, 0.25 s plan |
| Network | 6 | 1 step | learned by a network | 0 | −0.25, 3 | 0 | formula |

Two things in this table aren't a plain "switch a term on". First, the integral $K_I\!\int e\,dt$ and the estimate $\hat w$ do the same job: both build up, during the run, the steady goal offset that the model misses. The integral is the simplest possible estimator of a constant $\hat w$. A Kalman filter is a better one, because it uses a model to tell a load from a sag from noise. Second, the planners in family 5 use the same terms, but they don't add them up. The servo has parts with no formula inverse: the dead band, the ticks, the goal hold and the torque limit. So the planners simulate a model of the servo for many candidate goals and keep the best one.

## Six families, six problems

This table gives each family, the problem it solves, and the controllers in it. The families differ only in the problem they attack.

| Family | Problem it solves | Controllers |
|---|---|---|
| 1. Do nothing | Nothing. It is the baseline that shows every problem. | `direct` |
| 2. Look ahead in time | The goal acts late: dead time, goal hold, and the lag from wet friction. | `lead`, `inv` |
| 3. Add the forces you know | Forces you can compute before the run: gravity, inertia, friction. | `sag`, `grav`, Classical, preview |
| 4. Estimate what you don't know | Forces you can't compute before the run: a payload, wear, model error. | `pi`, `pisag`, `adapt`, `rls` |
| 5. Plan with a servo model | Parts with no formula inverse: the dead band, ticks, the goal hold and the torque limit. | `solve`, `mpc`, `mpca`, Fitted |
| 6. Learn from repeats or data | Errors that repeat on the same path, or that the form of the model misses. | `ilc`, `ilcmpc`, the network |

Many controllers combine two families. `pi` is the `inv` look-ahead plus feedback, and `mpca` is a planner plus a Kalman estimate. I put each controller in the family of the part it adds.

I tested these controllers in two places. On my real arm, I ran them on recorded motions such as "cat", a test motion of 120 s. In a simulation study, I ran five ways of choosing the goal on 96 test paths of 6 s each, against a simulated robot whose true numbers I know.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/cat-four.png" aria-label="The same real motion with four controllers side by side: direct, pi, solve and mpc, each with its error drawn larger and plotted under it">
<source src="/assets/robotics/so101-series/cat-four.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/cat-four.mp4">Watch the video</a>
</video>
<figcaption>Real arm on the cat motion with one controller from each of three families: `direct` (family 1) at 30 Hz, `pi` (family 4), `solve` and `mpc` (family 5) at 60 Hz, so the loop rate is part of the difference. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. The numbers cover this 16 s window only. <a class="video-link" href="/assets/robotics/so101-series/cat-four.mp4">Open video</a></figcaption>
</figure>

![Bar chart of the real-arm tracking error. Cat motion: direct 22.5 mrad at 30 Hz, pi 8.4, solve 6.2 and mpc 6.0 at 60 Hz. Signature motion: direct 28.3, lead 23.7 and inv 13.4 mrad.](/assets/robotics/so101-series/map-errors.png "Real arm, RMS error over all five joints and the whole motion. The two motions are different, so compare bars within a motion.")

![Simulation, log scale: out of the box 37.2 mrad, Classical model plus PID 1.117, neural network 0.446, Fitted servo model 0.398 and Exact model 0.398. A dashed line marks the one-reading rounding RMS of 0.443 mrad.](/assets/robotics/so101-series/sim-five.png "Simulation, fixed test set of 96 paths that no controller saw during tuning. The best controllers land below the RMS of one rounded reading.")

The simulation study compared these five controllers. All five read the same rounded encoder reading.

| Controller | Family | How it chooses the goal | Error (mrad) |
|---|:---:|---|---:|
| Out of the box | 1 | It sends the target as the goal, like `direct`. | 37.2 |
| Classical model + PID | 3 | It adds to the next target the torque that a fixed physics model predicts, divided by $k_p$, then PI feedback. | 1.117 |
| Neural network | 6 | It adds to the next target an offset that a small network learned. | 0.446 |
| Fitted servo model | 5 | It simulates the next 33 ms step on a model fitted on 24 s of data, and solves for the goal. | 0.398 |
| Exact model | 5 | The same method as Fitted, with the true robot numbers. | 0.398 |

```so101-widget
{"type": "predict", "fallback": "Predict first. Order these four controllers by their frozen-test nominal RMSE, from the largest error to the smallest. The controller cards hide their RMSE until you answer this question. Answer: Out of the box (37.166), Classical model + PID (1.117), Neural network (0.446), Fitted servo model (24 s) (0.398 mrad).", "id": "X1"}
```

<details>
<summary>Which error each controller removes, controller by controller</summary>

This matrix is the older view of the same information. Each row is a controller and each column is a kind of error, so if you see a particular error on your arm, you can read down its column.

```so101-widget
{"type": "error-matrix", "fallback": "Which error each controller removes. direct: none. lead: part of the delay. inv: the delay. pi, sag, grav, pisag: the gravity sag, pi also part of a load change. solve and mpc: delay, dead band, sag and part of the model error. mpca, adapt, rls: load changes. ilc, ilcmpc: repeated errors. This matrix is a teaching summary, made from the design of each controller and simulated tests. The real arm checked it only for pi on one motion.", "columnLinks": {"delay": "/robotics/so101-1-target-and-goal/#section-dead-time", "band": "/robotics/so101-1-target-and-goal/#section-dead-band", "sag": "/robotics/so101-1-target-and-goal/#section-gravity-changes-with-the-pose", "load": "/robotics/so101-1-target-and-goal/#section-the-mass-term-inertia-and-a-payload", "model": "/robotics/so101-1-target-and-goal/#section-simulator-against-measured", "rep": "#section-family-6-learn-from-repeats-or-data"}}
```

</details>

## Family 1: do nothing

`direct` sends the target as the goal. Every term of the formula is zero. It's what LeRobot does, and on my real arm it gives 22.5 mrad on the cat motion at 30 Hz. All the other families are measured against it.

## Family 2: look ahead in time

**Problem:** the goal acts late. The servo waits a dead time before it moves, the goal is held for a whole step, and wet friction adds a lag of $d/k_p$.

**Terms:** $T$, and the $\hat d$ and $\hat M$ terms that turn the lag into a time shift.

![Two panels from the real arm on the same motion. With direct, the goal sits on the target and the joint arrives late. With inv, the goal leads the target and the joint lands closer to it.](/assets/robotics/so101-series/inv-goal.png "Real arm, 30 Hz. `inv` sends the goal ahead of the target, so the joint arrives closer to on time.")

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/sig-inv.png" aria-label="Three copies of the real arm on the same motion with direct, lead and inv, each with its error drawn larger and plotted beside it">
<source src="/assets/robotics/so101-series/sig-inv.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/sig-inv.mp4">Watch the video</a>
</video>
<figcaption>Real arm on the same motion with `direct`, `lead` and `inv` at 30 Hz. The error is drawn 10 times larger, and large errors are compressed so the arm stays clear of the table and the base. The gray shape is the target pose. The red line joins the gripper tip to where the tip should be. The plot under each arm gives the true joint error in mrad, with the same scale in every plot. <a class="video-link" href="/assets/robotics/so101-series/sig-inv.mp4">Open video</a></figcaption>
</figure>

The simplest fixes don't look at the arm at all, only at the target. `lead` just sends the target one step early: $T$ = 33 ms at 30 Hz, and nothing else. `inv` goes further and inverts a simple model of the servo, with the dead time and the lag from the step test on my arm:

$$
\text{goal}(t) = q^*(t + 33\ \text{ms}) + 0.106\ \text{s}\cdot\dot q^*(t) + 0.0023\ \text{s}^2\cdot\ddot q^*(t)
$$

In the general formula, that's $T$ = 33 ms, $\hat d/k_p$ = 0.106 s and $\hat M/k_p$ = 0.0023 s². The second term is the wet-friction lag of part 1, and 0.106 s is close to the 87 to 105 ms lag of my real servo. The third term isn't computed from the masses of the arm: it's a coefficient fitted on the same step test, so it also absorbs whatever else makes the servo slow to accelerate. With a fitted constants file, each joint uses its own dead time, lag and acceleration term instead.

On the real arm, on a motion I call the signature, `direct` gave 28.3 mrad, `lead` 23.7 and `inv` 13.4.

This is feedforward: the goal comes from what I know about the target and the servo, not from the error. It's also the only thing that can deal with dead time, since any feedback arrives at least one dead time late. And because `inv` takes the speed and acceleration from the planned path, it doesn't suffer from the derivative noise of part 2. What it doesn't have is a gravity term, so the steady sag stays.

<details>
<summary>Is a fixed goal offset enough for the dead band?</summary>

Almost, with one change: the offset has to follow the direction. To push up you add the band, and to push down you subtract it. The trouble is near zero speed, where the sign flips, so the goal jumps by twice the band and can zig-zag. A smooth ramp near zero helps. A model that simulates the band handles the sign, the size and the dynamics together, which is one of the reasons for the planners of family 5.

</details>

## Family 3: add the forces you know

**Problem:** forces that I can compute before the run, with a model of the arm: mostly gravity, and in simulation also inertia and friction.

**Terms:** $\hat G$, and in the full version all of $\hat\tau/k_p$.

`sag` and `grav` add a gravity term to `inv`. They differ only in where $\hat G$ comes from. `sag` fits it on steady holds of my real arm, using the sines and cosines of the link angles from part 1. `grav` computes it from a MuJoCo model of the arm at the target pose, divided by the stiffness. Both put in the gap that gravity needs ahead of time, so the joint doesn't have to sag into it. On my 3 Oct logs, friction hid the pose effect, so the fitted `sag` model came out almost as a constant offset for each joint.

The full version of this family is computed-torque control: compute every term of $\hat\tau$ from a physics model and add $\hat\tau/k_p$ to the goal. In the simulation study, Classical model + PID did that with the nominal robot numbers (inertia, gravity, damping and friction), plus PI feedback, and went from 37.2 mrad out of the box to 1.117. A version I call preview did the same with the MuJoCo inverse dynamics of the planned path, and I used it in the shake test of family 4.

The known forces did most of the work in both cases. Part of what was left came from how Classical uses its model, and family 5 explains that.

## Family 4: estimate what you don't know

**Problem:** forces that no model knows before the run: a tool in the gripper, a worn joint, a simulator that is wrong about my arm.

**Terms:** $K_P$, $K_I$ and $\hat w$.

### Feedback: pi

`pi` adds an outer PI loop on top of `inv`. It looks at the error $e$, the target minus the reading, and moves the goal a little:

$$
\text{goal} = \text{goal}_{inv} + 0.2\,e + 2\ \text{s}^{-1}\textstyle\int e\,dt
$$

On the real arm the gains are small on purpose: 0.2 for the proportional part and 2 per second for the integral, with limits on both. The integral is the part that matters, because it slowly builds up whatever offset the model is missing, like a steady sag, until it's gone. On the cat motion at 60 Hz, `pi` gets 8.4 mrad. `pisag` is the same feedback on top of `sag`.

The gains are small because of everything from part 1. The arm only covers about 0.15 of a goal change in one 33 ms step, and the dead time means the loop always acts on old information. In the simulation study, the Classical controller used a much larger proportional gain of 4, without any dead time, and that's where I learned the next lesson.

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

<details>
<summary>Why not a gain of 100?</summary>

With a gain of 4, the arm covers about 0.6 of the error per step, which is stable. With a gain of 100 it would try to cover 15 times the error, so it overshoots, the next error is larger on the other side, and the oscillation keeps growing. A gain of 100 would also turn a single tick of reading noise into a 153 mrad jump of the goal. Add a 33 ms dead time and even a gain of 4 is too much: when I tried the Classical gains (4 and 10) with the dead time of my real arm in the shake test below, the servo spent about 95 % of the time at its torque limit.

The model also helps the feedback. A plain outer PID with no model saturated the servo on 10.9 % of the steps on a stiff simulated robot, while the same feedback on top of a model offset saturated on 0 %. The model does most of the work, so the feedback gains can stay low.

</details>

```so101-widget
{"type": "servo-playground", "mode": "pi", "fallback": "Interactive: one joint following a sine with a load step at 3 s. Sliders for the outer P and I gains show the load being absorbed, and oscillation at high gains."}
```

### Shaking a load up and down, or left and right

This is the example that made the difference between families 3 and 4 click for me. Suppose I hold a weight in the gripper and shake it up and down. Gravity on the weight is a steady extra load, so the integral of `pi` should slowly build up the extra torque and hold it. Now suppose I shake it left and right instead. Gravity on the weight doesn't change, but the weight has to be stopped and turned around at each end of the stroke, and that inertia torque reverses every half stroke, so the integral is always half a cycle late. What should help there is something that sees the end of the stroke coming and starts pushing before it gets there.

I tested this in simulation, with the SO-101 model in MuJoCo, a 150 g load in the gripper, the simulated servo, a 33 ms dead time and a 30 Hz loop. The arm reaches forward and either the shoulder lifts the load up and down, or the base swings it left and right, by 0.1 rad at 1 Hz. I compared five controllers: `direct`, `pi` with the real-arm gains, `inv` plus `pi`, and two preview controllers from family 3, one with a model that doesn't know about the load and one that does.

![Two panels of error over time and two bar charts. In the vertical shake, direct has an error of 88 mrad with a mean of 50, pi has 77 with a mean of 0, and preview without the payload has 6. In the horizontal shake, direct has 65, pi has 66, and preview without the payload has 1.8.](/assets/robotics/so101-series/shake-test.png "Simulation. The integral removes the steady sag of the vertical shake but not the shake itself, and it does nothing for the horizontal shake.")

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-series/shake.png" aria-label="Four simulated arms shaking a 150 gram load, vertically and horizontally, with pi and with preview, each with the error of the shaken joint plotted under it">
<source src="/assets/robotics/so101-series/shake.mp4" type="video/mp4">
<a href="/assets/robotics/so101-series/shake.mp4">Watch the video</a>
</video>
<figcaption>Simulated SO-101 shaking a 150 g load at 1 Hz, error drawn 10 times larger. Top row vertical (plot: shoulder_lift), bottom row horizontal (plot: shoulder_pan); left `pi`, right preview. The four plots use the same scale. <a class="video-link" href="/assets/robotics/so101-series/shake.mp4">Open video</a></figcaption>
</figure>

The result was half what I expected. In the vertical shake, the integral did remove the steady part: the mean error went from 50 mrad with `direct` to 0 with `pi`. But the shake itself stayed, with an RMS error of 77 mrad against 88, because the vertical shake also has to accelerate and stop the load, and that part reverses just like in the horizontal case. In the horizontal shake there was no steady part to remove, and `pi` did nothing at all, 66 mrad against 65.

What fixed both was looking ahead. `inv` plus `pi` brought the errors down to 22 and 11 mrad, and the preview controller to 6 and 1.8 mrad, even with a model that didn't know about the load. With the load in its model, both went under 1 mrad. So the integral handles what stays the same, and the path ahead handles what changes. In the formula: $K_I$ fills the constant part, and $T$ with $\hat M\ddot q^*$ fills the part that changes.

I didn't push this test hard enough to reach the torque limit, so the second half of my idea, that braking early is the only way to stop a heavy load in time, is still untested here. I also used a simple preview feedforward rather than the full `mpc`, so this shows what the path ahead is worth, not how well `mpc` itself uses it.

### Better estimators: adapt and rls

The integral treats every missing force as one constant. The other two controllers in this family estimate more.

`adapt` keeps the plain `inv` goal and subtracts a $\hat w$ from a Kalman filter for each joint. The filter compares the angle that a fixed servo model predicts with the reading, and splits the difference into three parts: a fast load part, a slow sag part and a friction part. Part 2 explains the Kalman filter.

`rls` goes one step further: it changes the coefficients themselves during the run. It starts from the fitted servo model and updates a small linear model of the last two positions and goals with recursive least squares, forgetting old data slowly, then picks the goal that makes that model reach the target.

## Family 5: plan with a servo model

**Problem:** the parts of the servo with no formula inverse. The dead band makes the right goal jump when the motion reverses. The ticks make the goal a whole number. The goal hold means the goal acts for a whole step, not an instant. The torque limit means some motions need braking to start early.

**Terms:** the same as families 2 to 4, but the goal comes from a search on a simulated servo, not from a sum.

### One instant is not one step

![Servo torque during one 33 ms step at 0.84 rad/s. The real torque starts at 1.27 N·m and falls to 0.886 N·m at the end of the step. Classical assumes 0.886 N·m for the whole step.](/assets/robotics/so101-series/hold-torque.png "Classical gets the torque right only at the end of the step. The shaded part is torque it did not plan.")

The result that puzzled me first in the simulation study was that Classical loses to the Fitted servo model, even though it has a correct physics model of the simulated robot. The reason is how it uses that model. Classical picks the goal so that the torque is right at a single instant: it solves $k_p(\text{goal} - q) = \tau$ for the next target. But the servo holds that goal for a whole 33 ms step, and the arm keeps moving during the step. At the start of the step the joint is further behind, so the gap and the torque are larger than Classical assumed, and only by the end of the step are they about right.

Fitted gets around this by simulating the step in 8 small substeps and solving for the goal that puts the joint on the target at the end of the step, with Newton's method. Even with the true robot numbers, Classical's one-instant rule is still 3.4 times worse. A simple test made the cause clearer for me: the same Classical rule gets 4.13 mrad with a 30 Hz goal rate and 0.91 mrad at 240 Hz, so when the steps get shorter, the one-instant mistake mostly goes away.

```so101-widget
{"type": "predict", "fallback": "Predict first. Give Classical model + PID the true robot numbers. Its geometric-mean RMSE over the six conditions is 1.312 mrad. The Exact-model reference has the same numbers and gets 0.385 mrad. It simulates the 8 substeps of each step. Each controller uses its own tuned outer gains. A MuJoCo test (not Genesis) changed one factor at a time. Which cause of the 3.4x gap does it support best? Answer: The quasi-static rule. It treats the 33 ms goal hold as one instant.", "id": "C3"}
```

So I started to think of it as a ladder. Classical looks at one instant, Fitted simulates one step from the inside, and `solve` and `mpc` look many steps ahead. A trajectory is continuous, and each rung of the ladder sees more of it.

<details>
<summary>Where I was wrong: does the exact model see the true angle?</summary>

I thought "Exact" meant the controller got the true joint angle. It doesn't. It reads the same rounded reading as everyone else, and only gets the true robot numbers (supply, damping, friction, payload) once, when it's built. It has the same eyes as the others, just a better instruction manual.

</details>

<details>
<summary>Why Fitted's cost has a speed term</summary>

Fitted's cost is

$$
J = |q_1 - r_{k+1}|^2 + (0.5\,\Delta t)^2\,|v_1 - \dot r_{k+1}|^2
$$

The first part asks whether the joint reaches the next target at the end of the 33 ms step, and the second asks whether it moves at the target speed when it arrives. Two goals can put the arm on the same point, one with the arm still and one with it still moving fast, and the fast arrival overshoots in the next step. The factor $(0.5\,\Delta t)^2$ turns a speed error into a position error: $0.5\,\Delta t$ = 16.7 ms, so 0.1 rad/s counts like 1.7 mrad. In simulation, a speed weight of 0.25 gave 0.516 mrad, 0.5 gave 0.396, 1.0 gave 0.528 and 2.0 gave 1.556. The lab `mpc` doesn't need this term, because it plans 0.25 s ahead and sees the overshoot directly.

</details>

### Planning many steps ahead: solve and mpc

This is the part I understood least, so I'll go slowly. On the real arm, both planners do the same thing at each step:

1. Take the current reading and the target path for the next 0.25 s.
2. Use a model of the servo to predict where the joint will go for a given plan of goals.
3. Pick the plan with the smallest predicted error.
4. Send only the first goal of that plan.
5. At the next step, plan again from the new reading.

That last part is called a receding horizon: the plan itself is never executed, only its first step. The 0.25 s look-ahead is about the dead time plus two servo lags, because a shorter one wouldn't see the effect of the goal I send now. The servo model has the dead time, the lag, the dead band, the stiffness and the sag of each joint, fitted on logs from my arm, plus a slow $\hat w$ that moves dt / 0.3 s of the way toward the unexplained error at each step.

```so101-widget
{"type": "plan-compare", "fallback": "solve chooses one destination goal and the steps follow a fixed rule toward it. mpc chooses a free goal for each step of the 0.25 s horizon. With a dead band, a constant goal between 90 and 110 mrad does nothing, so the cost is flat there and a gradient method does not move."}
```

The two planners differ only in the plans they can choose. `solve` chooses one number per joint, a destination goal on whole encoder ticks, and the goals in between follow a fixed rule toward that destination. So it searches a family of plans with a single knob. `mpc`, model predictive control, chooses one goal for each step of the horizon, 8 goals at 30 Hz, 15 at 60 Hz and 25 at 100 Hz, so its plan can do anything: overshoot, brake early, or hold. Its cost has three parts: the mean squared tracking error, a small cost on goal changes beyond what `inv` would do, and a tiny cost on straying away from `inv`.

```so101-widget
{"type": "predict", "fallback": "Predict first. At each tick, what does solve choose for one joint? Answer: One destination goal per joint, on whole encoder ticks.", "id": "L1"}
```

![Cost after one step against a constant goal. The cost is flat from 90 to 110 mrad, inside the dead band, then falls to its minimum at 125 mrad and rises again.](/assets/robotics/so101-series/deadband-cost.png "The toy dead-band case: a gradient method that starts in the flat part has nothing to follow.")

A toy example shows why a search is needed. Suppose the joint is at 100 mrad, the target is 115, and the dead band is 10 mrad on each side. Any goal between 90 and 110 makes no torque at all, so the joint stays at 100 and the error stays at 15. Above 110, the joint follows the goal minus 10. If you plot the cost against the goal, it's flat from 90 to 110 and then falls. A gradient method that starts somewhere in the flat part sees a slope of zero and doesn't move. `solve` avoids this by trying a list of whole-tick destinations directly.

```so101-widget
{"type": "predict", "fallback": "Predict first. Why does mpc test 49 'inv goal + constant offset' plans before its Gauss-Newton steps? Answer: The flat cost in the dead band stops a gradient method. The 49 plans find the correct side of the band first.", "id": "L5"}
```

<details>
<summary>How mpc gets out of the flat part: 50 warm starts</summary>

`mpc` starts from 50 different plans: 49 plans of the form "`inv` plus a constant offset", spread across the band, plus the previous step's plan shifted by one step. Then it takes two Gauss-Newton steps from the best one.

</details>

<details>
<summary>Two rules against chatter, and the reversal gate with numbers</summary>

Left alone, both planners chatter, and two rules fix most of it. The hold rule keeps the last goal if a new plan would gain less than half a tick, which stops the goal from flipping every time the reading flips between two ticks. The reversal gate deals with the dead band: a correction that reverses across the band costs a big goal jump, so the gate only allows it if it gains at least 1.5 ticks (2.3 mrad) and at least about 0.2 s have passed since the last reversal. Without the gate the goal reversed up to 17 times per second, and with it 1.8 times or fewer. The price is 0.4 to 1.0 mrad more error on holds.

Suppose the dead band is 10 mrad on each side and the last push was up: the goal is at 110 and the joint sits at 100. The target is 99. To move the joint down even 1 mrad, the goal has to drop below 90, a jump of more than 20 mrad. With a goal of 88, the joint goes to 98, now 1 below the target. To fix that, the goal has to go back above 108, another 20 mrad jump. Each small fix overshoots, so the goal bounces up and down. The gate only lets a goal reverse against its last push if the model predicts at least 1.5 ticks less error, and if the last reversal of that joint is at least about 0.2 s old. A reversal in the direction the target is moving is always allowed. The price is that a static error below about 1.5 ticks can stay.

</details>

<details>
<summary>Can they model gravity at different poses?</summary>

Partly. The servo model has the sag terms from the link angles, as in part 1. They're in goal units, radians of steady error, rather than in torque.

</details>

<details>
<summary>Why not run a full physics simulator inside?</summary>

I asked this too. They do simulate a model and keep the best goal, but the model is small: one fitted model per joint, from real logs. There are three reasons. The first is time: one 0.25 s MuJoCo rollout of the SO-101 takes about 0.75 ms on my Mac, the budget at 100 Hz is about 2 ms per step, and the planners test dozens of plans. The second is coupling: in the full arm, the shoulder goal changes the elbow load, so the search would have to try combinations of all five joints instead of five separate searches. The third is accuracy, which matters most. A physics model is only as good as its constants, and the masses in the model aren't measured on my arm. A Genesis model fitted to my arm predicted held-out logs only a little better than the small servo model (elbow 13.5 against 16.1 mrad, in simulation). So the real question isn't physics or no physics, it's which model predicts my arm best and fast enough.

</details>

<details>
<summary>Where I was wrong: is solve the same as Mink?</summary>

I thought `solve` was basically Mink. It isn't. Mink is inverse kinematics: it turns a gripper pose into joint motions from the geometry of the arm, it doesn't know about the servo, and it doesn't look ahead in time. `solve` comes after that step. The joint target is already known, and it chooses the servo goal over time.

</details>

On the real arm, on the cat motion at 60 Hz, the errors in mrad were:

| Controller | Total | pan | lift | elbow | wrist flex | roll |
|---|---:|---:|---:|---:|---:|---:|
| pi | 8.4 | 6.6 | 10.8 | 11.0 | 7.0 | 4.9 |
| solve | 6.2 | 3.2 | 7.4 | 6.7 | 8.7 | 2.8 |
| mpc | 6.0 | 3.0 | 7.0 | 6.1 | 8.6 | 2.8 |

![Left: RMS error per joint on the real arm for pi, solve and mpc. The planners win on pan, lift, elbow and roll, and lose on wrist flex. Right: at the fastest speeds pi has 11.7 mrad against 14.2 for solve and 13.4 for mpc.](/assets/robotics/so101-series/real-arm-joints.png "Real arm, cat motion, 60 Hz. The planners win overall, and pi wins at the fastest speeds.")

The planners win overall, but the picture changes with speed. On the fastest parts of the motions, `pi` does better, 11.7 mrad against 14.2 for `solve` and 13.4 for `mpc`. Most of that comes from wrist_flex, with 24.7 and 24.8 mrad for `solve` and `mpc` against 16.0 for `pi`. One possible cause is a step limit that the planners hit on 1 % to 3 % of the steps, but I haven't verified it, and each controller ran only once.

### Planning with a better estimate: mpca

`mpca` is `mpc` with the Kalman estimate of `adapt` in place of its own slow $\hat w$, so it combines families 4 and 5. In a simulated load step, `mpca` got 2.5 mrad against 3.7 for `mpc` at 30 Hz.

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

## Family 6: learn from repeats or data

**Problem:** errors that the other families leave because the model has the wrong form, or that come back each time the arm repeats a motion.

**Terms:** $u_k$, or the whole $\hat\tau/k_p$ part learned by a network.

### Repeating the same path: ilc and ilcmpc

If the arm does the same motion over and over, it can learn from its own past runs. Iterative learning control (`ilc`) stores the error of the last run and uses it to correct the goals of the next one: after each run, $u_k$ adds half of the error that step $k$ caused one servo delay later, then goes through a smoothing filter. `ilcmpc` puts that rule on top of `mpc`. In a stand-in test (a software copy of the servo, built from the servo model of my arm, which I use for dry runs) on the fast motion sets at 100 Hz, `ilcmpc` had the lowest error: 1.04 mrad, against 1.15 for `mpc`, 1.28 for `mpca`, 1.36 for `solve`, 4.15 for `pi` and 4.90 for `adapt`. The stand-in arm uses the same servo model as the planners, so this test favors them.

### A network for the force terms

The question behind this whole series was whether a controller can be more accurate than the classical ones, so I also tried learning the goal with a neural network. In the general formula, the network fills the $\hat\tau/k_p$ slot: it doesn't output a goal from scratch, it outputs a correction on top of a simple rule,

$$
\text{goal} = q + \text{step}^* + \text{offset}_{NN} + 3I
$$

where $\text{step}^*$ is the move the controller wants this step: the target move, plus 0.75 of the distance the joint is behind.

![Number line in ticks: reading 100, next reading 110, goal sent 150. The joint moved 10 and the label, the goal minus the next reading, is 40.](/assets/robotics/so101-series/hindsight-label.png "The hindsight label: how far past the landing point the goal had to be.")

![Block diagram: the reading q, the targets r_k and r_k+1 and the past goal go into a small network, which outputs an offset. The goal is q plus step star plus the offset plus 3 I.](/assets/robotics/so101-series/network-io.png "The network only learns an offset on top of a simple rule.")

Its label comes from hindsight. Suppose a logged step where the reading was 100, the goal sent was 150 and the next reading was 110. The joint moved 10, and the goal sat 40 past where it ended up, so the label is 40. In words, the row teaches the network that from this state, to move 10, the goal has to go 40 past the end point.

<details>
<summary>The network has the same shape as Classical</summary>

$q + \text{step}^* = r_{k+1} - 0.25\,e$. So Classical is $r_{k+1} + \tau/k_p + 4e + 10I$, and the network is $r_{k+1} - 0.25e + \text{NN} + 3I$. The network learns the part that Classical computes from physics, $\tau/k_p$, and it learns it with the 33 ms step built in.

</details>

In the simulation study the network got 0.446 mrad, against 1.117 for Classical. That's because it learns the right lead for a goal that's held for a whole step, which is exactly what Classical's one-instant rule gets wrong. I first thought it was about knowing gravity in advance, but Classical knows gravity too.

### Offline against closed loop

This is the result that changed how I test everything. There are two ways to test a network. Offline, you feed it recorded data and compare its output with the label, and its outputs never move anything. In closed loop, you let it drive the arm, so its goals move the arm and its next inputs come from that motion, including its own past goals.

```so101-widget
{"type": "predict", "fallback": "Predict first. Two ways to test a network. Offline: feed it recorded data and compare its output with the label; its outputs never move the arm. Closed loop: let it drive the simulated arm; its goals move the arm, and its next inputs come from that motion, including its own past goals. Nominal = the default robot, with no change. An earlier network got 4 past readings and 4 past goals as extra inputs. It trained on smooth wiggle data only. Its offline label error fell from 6.19 to 3.03 mrad. In closed loop on nominal validation paths, the same network with no history had 0.552x the tracking error of Classical model + PID. Predict the closed-loop error of the network with history on nominal, as a multiple of the error of Classical model + PID. Answer: About 80x: 81.3x Classical model + PID, with 77% of steps saturated.", "id": "N3"}
```

The answer was 81.3 times worse than Classical, with 77 % of the steps hitting the torque clamp. The history had halved the network's offline error, and in closed loop it was a disaster.

```so101-widget
{"type": "closed-loop-drift", "fallback": "Offline, the network sees recorded inputs and its outputs sit close to the labels. In closed loop, its own past goal is an input, so each small error changes the next input and the errors build on each other. Illustration, not the measured network."}
```

The reason is that one of its inputs is its own past goal. In the training data, the past goals came from a different controller, so the network never saw its own goals. Once it drives, a small mistake changes its next input, that input is a bit outside the data it learned from, so the next output is a bit more wrong, and the errors build on each other. The data the network sees in closed loop isn't the data it was trained on, which is called distribution shift. There's also a second suspect from part 2: the past readings give the network a noisy acceleration estimate, which the loop can amplify. I didn't test that one.

What I took from this is that a model has to be chosen by its closed-loop error. Offline training is simpler to run and simpler to think about, but only the closed loop actually tests the controller. From then on, every model choice in the project used closed-loop runs on validation paths.

Memory wasn't useless, by the way. With broadband training data, a wiggle from 0.2 to 14 Hz, a network with memory had 0.834 of the error of the old no-memory network, while the same network without memory had 1.45. The final network keeps one past step.

<details>
<summary>Where I was wrong: Classical doesn't look ahead</summary>

I said Classical doesn't look ahead. It does look one step ahead, since it uses the next target, so its $T$ is one step. Its weakness is treating the 33 ms step as a single instant.

</details>

### Where the network wins and loses

![Network error divided by Fitted error: 0.83 to 0.99 on holds, below 1, and 1.05 to 1.70 on moving paths, above 1.](/assets/robotics/so101-series/nn-vs-fitted.png "The network wins on holds and loses on moving paths. Simulation.")

Compared with Fitted, the network wins on holds, with 0.83 to 0.99 of Fitted's error, and loses on moving paths, with 1.05 to 1.70. At a hold, the right goal is simple: the target plus a steady offset for gravity and friction. On a moving path, the goal has to sit far ahead of the joint, and the right lead depends on the speed, the acceleration and the 33 ms step. A model with the right structure gets that from physics, while the network has to learn it from data.

<details>
<summary>Is this overfitting?</summary>

![Tracking error with the right lag and with a 30 percent wrong lag: solve 2.3 then 4.1 mrad, 1.78 times worse; pi 6.7 then 7.9, 1.18 times worse.](/assets/robotics/so101-series/sensitivity.png "A controller that trusts its model more loses more when the model is wrong, and still wins here.")

I wondered whether a more complex physics model is simply more likely to be wrong, like overfitting. It's related, but the better name for it is sensitivity to model error. A controller that trusts its model more does better when the model is right and loses more when it's wrong. If I give `solve` a lag that's 30 % off, its error goes from 2.3 to 4.1 mrad, which is 1.78 times worse, while the same error only moves `pi` from 6.7 to 7.9, 1.18 times worse. Even with the wrong lag, though, `solve` is still better than `pi`. More terms aren't the problem in themselves, wrong terms are.

Real overfitting did show up once, with a physics model fitted on too little data. With 1 to 2 minutes of real data, the fitted servo model had 30.6 and 19.0 mrad of error on new motions, while a network with no physics had 12.0 and 11.0. The model's gain, offset and sag didn't transfer to new poses.

![Offline error against minutes of real data, from 1 to 16 minutes. The servo model alone has 30.6 mrad at 1 minute and 19.0 at 2, falling to 7.4 at 16. With the observer it has 4.7 at 2 minutes and 3.7 at 16. The network alone falls from 12.0 to 3.9, and the residual from 10.7 to 3.0.](/assets/robotics/so101-series/data-curves.png "With 1 to 2 minutes of data the physics model alone overfits. The observer fixes most of it, and the residual is best with all the data.")

</details>

## Known territory

![Timeline of the known control methods behind the lab controllers: the Kalman filter, computed torque, iterative learning control, adaptive control by Slotine and Li, and offset-free MPC.](/assets/robotics/so101-series/known-timeline.png "Most of what I built has a name and a history.")

Am I reinventing control? Mostly, yes, and I think that's fine for learning it. Each family has a name in the textbooks. Family 3 with feedback, Classical model + PID, is computed-torque control, inverse-dynamics feedforward plus feedback, from the 1980s. Estimating a payload during the run, family 4, is adaptive control, and since robot dynamics are linear in the mass parameters, a payload can be estimated online with a stability proof (Slotine and Li, 1987). `mpca` is offset-free MPC: a planner with a disturbance state estimated by a Kalman filter. And `ilc` is iterative learning control. What's still open for me is the real arm, and conditions that change during a task.

## What I test next

![Left: a frozen servo model with an observer plus a small recurrent network (GRU) that learns the residual give a combined prediction. Right: offline and stand-in closed-loop errors: network only 3.90 and 5.50 mrad, servo model with observer 3.70 and 2.76, residual 3.01 and 3.12.](/assets/robotics/so101-series/residual.png "The residual helps offline, and the physics model alone still wins in the stand-in closed loop.")

My summary of the first round is that a network with no physics didn't work well on the real logs, so the next idea is a residual: a network that only learns what a physics model gets wrong. In the formula, that keeps the model terms and adds a learned term on top, rather than replacing $\hat\tau/k_p$. A first version of that already ran on the real logs, measured offline over 0.2 s and in a stand-in closed loop (a software copy of the servo model in place of the real arm):

| Model | Offline (mrad) | Stand-in closed loop (mrad) |
|---|---:|---:|
| Network, no physics | 3.90 | 5.50 |
| Servo model + observer | 3.70 | 2.76 |
| Network residual on servo model + observer | 3.01 | 3.12 |

Most of the gain is classical: the observer alone halves the servo model's error, from 7.37 to 3.70 mrad, and the residual adds another 19 % to 23 % offline. In the stand-in closed loop, though, the physics model alone still wins. The stand-in has the same structure as the servo model, so it favors it, and it doesn't tell me which one wins on the real arm.

So the next steps are to test the residual in closed loop on the real arm, to train it on data from its own closed loop rather than on another controller's logs, and to keep choosing models by their closed-loop error. That last rule is the one I'll keep from this whole series.

## Looking back

When I started, I thought the arm missed because it was cheap. Now I'd say it misses because the servo can only make torque from a gap, and every term of the joint equation, from gravity to damping to a tool in the gripper, needs a bit more of that gap. Every controller in this series is a guess at that gap, written as the same formula with different terms switched on. The best ones look ahead: they know the path, they know the servo, and they put the goal where the joint will need it, before it needs it.
