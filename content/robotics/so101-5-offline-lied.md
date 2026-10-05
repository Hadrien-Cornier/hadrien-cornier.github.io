---
title: 'What the network learned, and why the offline tests lied'
description: 'A network that halved its offline error made the arm 81 times worse in closed loop. What it learned, why it failed, and what I test next.'
date: '2026-10-05'
draft: true
series: 'Where to put the goal'
part: 5
---

The question behind this whole series was whether a controller can be more accurate than the classical ones. So once the classical controllers were working, I tried learning the goal with a neural network. This part is about what the network learned, where it did well, and one result that changed how I test everything.

## The simulation study

I started in simulation, where I know the true robot and can compare against it. I tried five ways of choosing the goal on 96 new test paths of 6 s each:

| Controller | What it uses | Error (mrad) |
|---|---|---:|
| Out of the box | goal = target | 37.2 |
| Classical model + PID | a physics model of the torque, plus PI feedback | 1.117 |
| Neural network | a learned goal correction | 0.446 |
| Fitted servo model | a model fitted from 24 s of data, solved step by step | 0.398 |
| Exact model | the same method with the true robot numbers | 0.398 |

![Simulation, log scale: out of the box 37.2 mrad, Classical model plus PID 1.117, neural network 0.446, Fitted servo model 0.398 and Exact model 0.398. A dashed line marks the one-reading rounding RMS of 0.443 mrad.](/assets/robotics/so101-series/sim-five.png "Simulation, frozen test of 96 paths. The best controllers land below the RMS of one rounded reading.")

```so101-widget
{"type": "predict", "fallback": "Predict first. Order these four controllers by their frozen-test nominal RMSE, from the largest error to the smallest. The controller cards hide their RMSE until you answer this question. Answer: Out of the box (37.166), Classical model + PID (1.117), Neural network (0.446), Fitted servo model (24 s) (0.398 mrad).", "id": "X1"}
```

```so101-widget
{"type": "predict", "fallback": "Predict first. What does the Exact-model reference get that the Fitted servo model does not get? Answer: Only the true plant numbers, given one time at build.", "id": "O1"}
```

<details>
<summary>Where I was wrong: does the exact model see the true angle?</summary>

I thought "Exact" meant the controller got the true joint angle. It doesn't. It reads the same rounded reading as everyone else, and only gets the true robot numbers (supply, damping, friction, payload) once, when it's built. It has the same eyes as the others, just a better instruction manual.

</details>

## A trajectory is continuous, not a list of steps

![Servo torque during one 33 ms step at 0.84 rad/s. The real torque starts at 1.27 N·m and falls to 0.886 N·m at the end of the step. Classical assumes 0.886 N·m for the whole step.](/assets/robotics/so101-series/hold-torque.png "Classical gets the torque right only at the end of the step. The shaded part is torque it did not plan.")

The result that puzzled me first was that Classical loses to both the network and Fitted, even though it has a correct physics model of the simulated robot. The reason is how it uses that model. Classical picks the goal so that the torque is right at a single instant: it solves $k_p(\text{goal} - q) = \tau$ for the next target. But the servo holds that goal for a whole 33 ms step, and the arm keeps moving during the step. At the start of the step the joint is further behind, so the gap and the torque are larger than Classical assumed, and only by the end of the step are they about right.

Fitted gets around this by simulating the step in 8 small substeps and solving for the goal that puts the joint on the target at the end of the step. Even with the true robot numbers, Classical's one-instant rule is still 3.4 times worse. A simple test made the cause clearer for me: the same Classical rule gets 4.13 mrad with a 30 Hz goal rate and 0.91 mrad at 240 Hz, so when the steps get shorter, the one-instant mistake mostly goes away.

```so101-widget
{"type": "predict", "fallback": "Predict first. Give Classical model + PID the true robot numbers (run label oracle_ff_fb). Its geometric-mean RMSE over the six conditions is 1.312 mrad. The Exact-model reference has the same numbers and gets 0.385 mrad. It simulates the 8 substeps of each step (part 6). Each controller uses its own tuned outer gains. A MuJoCo test (not Genesis) changed one factor at a time. Which cause of the 3.4x gap does it support best? Answer: The quasi-static rule. It treats the 33 ms goal hold as one instant.", "id": "C3"}
```

So I started to think of it as a ladder. Classical looks at one instant, Fitted simulates one step from the inside, and `solve` and `mpc` from part 4 look many steps ahead. A trajectory is continuous, and each rung of the ladder sees more of it.

<details>
<summary>Where I was wrong: does Fitted try a list of goals?</summary>

I thought Fitted tried goals and kept the best one, like `solve`. It's the same idea with a different method. Fitted uses Newton's method, which is a gradient method, on a MuJoCo copy of the arm. `solve` tries a list of whole-tick goals because the dead band makes the gradient useless.

</details>

<details>
<summary>Why Fitted's cost has a speed term</summary>

Fitted's cost is

$$
J = |q_1 - r_{k+1}|^2 + (0.5\,\Delta t)^2\,|v_1 - \dot r_{k+1}|^2
$$

The first part asks whether the joint reaches the next target at the end of the 33 ms step, and the second asks whether it moves at the target speed when it arrives. Two goals can put the arm on the same point, one with the arm still and one with it still moving fast, and the fast arrival overshoots in the next step. The factor $(0.5\,\Delta t)^2$ turns a speed error into a position error: $0.5\,\Delta t$ = 16.7 ms, so 0.1 rad/s counts like 1.7 mrad. In simulation, a speed weight of 0.25 gave 0.516 mrad, 0.5 gave 0.396, 1.0 gave 0.528 and 2.0 gave 1.556. The lab `mpc` doesn't need this term, because it plans 0.25 s ahead and sees the overshoot directly.

</details>

## What the network learns

![Number line in ticks: reading 100, next reading 110, goal sent 150. The joint moved 10 and the label, the goal minus the next reading, is 40.](/assets/robotics/so101-series/hindsight-label.png "The hindsight label: how far past the landing point the goal had to be.")

![Block diagram: the reading q, the targets r_k and r_k+1 and the past goal go into a small network, which outputs an offset. The goal is q plus step star plus the offset plus 3 I.](/assets/robotics/so101-series/network-io.png "The network only learns an offset on top of a simple rule.")

The network doesn't output a goal from scratch. It outputs a correction on top of a simple rule,

$$
\text{goal} = q + \text{step}^* + \text{offset}_{NN} + 3I
$$

where $\text{step}^*$ is the move the controller wants this step: the target move, plus 0.75 of the distance the joint is behind.

Its label comes from hindsight. Suppose a logged step where the reading was 100, the goal sent was 150 and the next reading was 110. The joint moved 10, and the goal sat 40 past where it ended up, so the label is 40. In words, the row teaches the network that from this state, to move 10, the goal has to go 40 past the end point.

<details>
<summary>The network has the same shape as Classical</summary>

$q + \text{step}^* = r_{k+1} - 0.25\,e$. So Classical is $r_{k+1} + \tau/k_p + 4e + 10I$, and the network is $r_{k+1} - 0.25e + \text{NN} + 3I$. The network learns the part that Classical computes from physics, $\tau/k_p$, and it learns it with the 33 ms step built in.

</details>

That's why it beats Classical: it learns the right lead for a goal that's held for a whole step, which is exactly what the one-instant rule gets wrong. I first thought it was about knowing gravity in advance, but Classical knows gravity too.

## Offline against closed loop

This is the result that changed how I test everything. There are two ways to test a network. Offline, you feed it recorded data and compare its output with the label, and its outputs never move anything. In closed loop, you let it drive the arm, so its goals move the arm and its next inputs come from that motion, including its own past goals.

```so101-widget
{"type": "predict", "fallback": "Predict first. Two ways to test a network. Offline: feed it recorded data and compare its output with the label; its outputs never move the arm. Closed loop: let it drive the simulated arm; its goals move the arm, and its next inputs come from that motion, including its own past goals. Nominal = the default robot, with no change. An earlier network got 4 past readings and 4 past goals as extra inputs. It trained on smooth wiggle data only. Its offline label error fell from 6.19 to 3.03 mrad. In closed loop on nominal validation paths, the same network with no history had 0.552x the tracking error of Classical model + PID. Predict the closed-loop error of the network with history on nominal, as a multiple of the error of Classical model + PID. Answer: About 80x: 81.3x Classical model + PID, with 77% of steps saturated.", "id": "N3"}
```

The answer was 81.3 times worse than Classical, with 77 % of the steps hitting the torque clamp. The history had halved the network's offline error, and in closed loop it was a disaster.

```so101-widget
{"type": "closed-loop-drift", "fallback": "Offline, the network sees recorded inputs and its outputs sit close to the labels. In closed loop, its own past goal is an input, so each small error changes the next input and the errors build on each other. Illustration, not the measured network."}
```

The reason is that one of its inputs is its own past goal. In the training data, the past goals came from a different controller, so the network never saw its own goals. Once it drives, a small mistake changes its next input, that input is a bit outside the data it learned from, so the next output is a bit more wrong, and the errors build on each other. The data the network sees in closed loop isn't the data it was trained on, which is called distribution shift. There's also a second suspect from part 3: the past readings give the network a noisy acceleration estimate, which the loop can amplify. I didn't test that one.

What I took from this is that a model has to be chosen by its closed-loop error. Offline training is simpler to run and simpler to think about, but only the closed loop actually tests the controller. From then on, every model choice in the project used closed-loop runs on validation paths.

Memory wasn't useless, by the way. With broadband training data, a wiggle from 0.2 to 14 Hz, a network with memory had 0.834 of the error of the old no-memory network, while the same network without memory had 1.45. The final network keeps one past step.

<details>
<summary>Where I was wrong: Classical doesn't look ahead</summary>

I said Classical doesn't look ahead. It does look one step ahead, since it uses the next target. Its weakness is treating the 33 ms step as a single instant.

</details>

## Where the network wins and loses

![Network error divided by Fitted error: 0.83 to 0.99 on holds, below 1, and 1.05 to 1.70 on moving paths, above 1.](/assets/robotics/so101-series/nn-vs-fitted.png "The network wins on holds and loses on moving paths. Simulation.")

Compared with Fitted, the network wins on holds, with 0.83 to 0.99 of Fitted's error, and loses on moving paths, with 1.05 to 1.70. At a hold, the right goal is simple: the target plus a steady offset for gravity and friction. On a moving path, the goal has to sit far ahead of the joint, and the right lead depends on the speed, the acceleration and the 33 ms step. A model with the right structure gets that from physics, while the network has to learn it from data.

### Is this overfitting?

![Tracking error with the right lag and with a 30 percent wrong lag: solve 2.3 then 4.1 mrad, 1.78 times worse; pi 6.7 then 7.9, 1.18 times worse.](/assets/robotics/so101-series/sensitivity.png "A controller that trusts its model more loses more when the model is wrong, and still wins here.")

I wondered whether a more complex physics model is simply more likely to be wrong, like overfitting. It's related, but the better name for it is sensitivity to model error. A controller that trusts its model more does better when the model is right and loses more when it's wrong. If I give `solve` a lag that's 30 % off, its error goes from 2.3 to 4.1 mrad, which is 1.78 times worse, while the same error only moves `pi` from 6.7 to 7.9, 1.18 times worse. Even with the wrong lag, though, `solve` is still better than `pi`. More terms aren't the problem in themselves, wrong terms are.

Real overfitting did show up once, with a physics model fitted on too little data. With 1 to 2 minutes of real data, the fitted servo model had 30.6 and 19.0 mrad of error on new motions, while a network with no physics had 12.0 and 11.0. The model's gain, offset and sag didn't transfer to new poses.

![Offline error against minutes of real data, from 1 to 16 minutes. The servo model alone has 30.6 mrad at 1 minute and 19.0 at 2, falling to 7.4 at 16. With the observer it has 4.7 at 2 minutes and 3.7 at 16. The network alone falls from 12.0 to 3.9, and the residual from 10.7 to 3.0.](/assets/robotics/so101-series/data-curves.png "With 1 to 2 minutes of data the physics model alone overfits. The observer fixes most of it, and the residual is best with all the data.")

## Known territory

![Timeline of the known control methods behind the lab controllers: the Kalman filter, computed torque, iterative learning control, adaptive control by Slotine and Li, and offset-free MPC.](/assets/robotics/so101-series/known-timeline.png "Most of what I built has a name and a history.")

Am I reinventing control? Mostly, yes, and I think that's fine for learning it. Classical model + PID is computed-torque control, inverse-dynamics feedforward plus feedback, from the 1980s. Estimating a payload during the run is adaptive control, and since robot dynamics are linear in the mass parameters, a payload can be estimated online with a stability proof (Slotine and Li, 1987). And `mpca` is offset-free MPC: a planner with a disturbance state estimated by a Kalman filter. What's still open for me is the real arm, and conditions that change during a task.

## What I test next

![Left: a frozen servo model with an observer plus a small GRU that learns the residual give a combined prediction. Right: offline and stand-in closed-loop errors: network only 3.90 and 5.50 mrad, servo model with observer 3.70 and 2.76, residual 3.01 and 3.12.](/assets/robotics/so101-series/residual.png "The residual helps offline, and the physics model alone still wins in the stand-in closed loop.")

My summary of the first round is that a network with no physics didn't work well on the real logs, so the next idea is a residual: a network that only learns what a physics model gets wrong. A first version of that already ran on the real logs, measured offline over 0.2 s and in a stand-in closed loop:

| Model | Offline (mrad) | Stand-in closed loop (mrad) |
|---|---:|---:|
| Network, no physics | 3.90 | 5.50 |
| Servo model + observer | 3.70 | 2.76 |
| Network residual on servo model + observer | 3.01 | 3.12 |

Most of the gain is classical: the observer alone halves the servo model's error, from 7.37 to 3.70 mrad, and the residual adds another 19 % to 23 % offline. In the stand-in closed loop, though, the physics model alone still wins. The stand-in has the same structure as the servo model, so it favors it, and it doesn't tell me which one wins on the real arm.

So the next steps are to test the residual in closed loop on the real arm, to train it on data from its own closed loop rather than on another controller's logs, and to keep choosing models by their closed-loop error. That last rule is the one I'll keep from this whole series.

## Looking back

When I started, I thought the arm missed because it was cheap. Now I'd say it misses because the servo can only make torque from a gap, and every force on the joint, from gravity to damping to a tool in the gripper, needs a bit more of that gap. Every controller in this series is an answer to where to put the goal, and the [map in part 1](/robotics/so101-1-target-and-goal/#the-map-fourteen-controllers-one-motion) is really a list of those answers. The best ones look ahead: they know the path, they know the servo, and they put the goal where the joint will need it, before it needs it.
