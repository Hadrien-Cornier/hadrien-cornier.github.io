---
title: 'What the network learned, and why the offline tests lied'
description: 'A network that halved its offline error made the arm 81 times worse in closed loop. What it learned, why it failed, and what I test next.'
date: '2026-10-05'
draft: true
series: 'Control systems'
part: 5
---

> **In this series.** [ROUGH DRAFT: series box. Part 5 of 5.]

My research question was whether a controller can be more accurate than the classical ones. So after building the classical controllers, I tried to learn the goal with a neural network. This part is about what it learned, where it won, and one result that changed how I test everything.

## The simulation study

I started in simulation, where I know the true robot. Five ways to choose the goal, on 96 new test paths of 6 s each:

| Controller | What it uses | Error (mrad) |
|---|---|---:|
| Out of the box | goal = target | 37.2 |
| Classical model + PID | a physics model of the torque, plus PI feedback | 1.117 |
| Neural network | a learned goal correction | 0.446 |
| Fitted servo model | a model fitted from 24 s of data, solved step by step | 0.398 |
| Exact model | the same method with the true robot numbers | 0.398 |

> **[FIGURE: bar chart, log scale]**

<details>
<summary>Predict first: rank the five (exam X1)</summary>

[ROUGH DRAFT: predict box X1.]

</details>

<details>
<summary>Where I was wrong: does the exact model see the true angle?</summary>

I thought "Exact" meant it got the true joint angle. It doesn't. It reads the same rounded reading as everyone else. It only gets the true robot numbers (supply, damping, friction, payload), once, when it's built. Same eyes, better instruction manual.

</details>

## A trajectory is continuous, not a list of steps

Why does Classical lose to the network and to Fitted, even though Classical has a correct physics model of the simulated robot?

Classical picks the goal so that the torque is right at one instant: it solves $k_p(\text{goal} - q) = \tau$ for the next target. But the servo holds that goal for a whole 33 ms step, and the arm moves during the step. At the start of the step, the joint is further behind, so the gap and the torque are larger than Classical assumed. At the end, it's about right.

> **[FIGURE: one 33 ms hold]** The joint path inside the step. The torque Classical assumed (right only at the end) and the torque the servo really gave (bigger at the start).

Fitted fixes this by simulating the step in 8 small substeps and solving for the goal that lands the joint on the target at the end of the step. With the true numbers, Classical's one-instant rule is still 3.4 times worse.

A test makes the cause clearer. The same Classical rule gets 4.13 mrad with a 30 Hz goal rate and 0.91 mrad at 240 Hz. When the steps get short, the one-instant mistake fades.

So there's a ladder:

1. One instant (Classical).
2. One step, simulated inside (Fitted).
3. Many steps ahead (`solve`, `mpc` from part 4).

A trajectory is continuous. Every rung up the ladder sees more of it.

<details>
<summary>Where I was wrong: does Fitted try a list of goals?</summary>

I thought Fitted tries goals and keeps the best one, like `solve`. Same idea, different method. Fitted uses Newton's method, a gradient method, on a MuJoCo copy of the arm. `solve` tries a list of whole-tick goals because the dead band makes the gradient useless.

</details>

<details>
<summary>Why Fitted's cost has a speed term</summary>

[ROUGH DRAFT: J = |q1 − r|² + (0.5 dt)²|v1 − rv|². Two goals can land the arm on the same point, one still and one moving fast. The fast arrival overshoots next step. Velocity weight sweep 0.25 → 0.516, 0.5 → 0.396, 1 → 0.528, 2 → 1.556 mrad.]

</details>

## What the network learns

> **[FIGURE: hindsight label]** The worked example on a number line: reading 100, goal 150, next reading 110, label 40.

> **[FIGURE: network inputs and output]** Block diagram: q, r_k, r_k+1, step*, past goal → network → offset → goal.

The network doesn't output a goal from scratch. It outputs a correction on top of a simple rule:

$$
\text{goal} = q + \text{step}^* + \text{offset}_{NN} + 3I
$$

where $\text{step}^*$ is the move the controller wants this step: the target move plus 0.75 of the distance the joint is behind.

Its label comes from hindsight. Take a logged step: the reading was 100, the goal sent was 150, the next reading was 110. The joint moved 10, and the goal sat 40 past where it ended. So the label is 40: "from this state, to move 10, put the goal 40 past the end point".

<details>
<summary>The network has the same shape as Classical</summary>

$q + \text{step}^* = r_{k+1} - 0.25\,e$. So Classical is $r_{k+1} + \tau/k_p + 4e + 10I$, and the network is $r_{k+1} - 0.25e + \text{NN} + 3I$. The network learns the part Classical computes from physics, $\tau/k_p$, and it learns it with the 33 ms step built in.

</details>

That's why it beats Classical: it learns the right lead for a goal that's held for a whole step, which the one-instant rule gets wrong. It isn't mainly about knowing gravity in advance. Classical knows gravity too.

## Offline against closed loop

This is the result that changed how I test everything.

There are two ways to test a network.

- **Offline:** feed it recorded data and compare its output with the label. Its outputs never move anything.
- **Closed loop:** let it drive the arm. Its goals move the arm, and its next inputs come from that motion, including its own past goals.

<details open>
<summary>Predict first (exam N3)</summary>

An earlier network got 4 past readings and 4 past goals as extra inputs. It trained on smooth wiggle data only. Its offline label error fell from 6.19 to 3.03 mrad. In closed loop on validation paths, the same network with no history had 0.552 times the tracking error of Classical. What's the closed-loop error of the network with history, as a multiple of Classical?

[ROUGH DRAFT: answer choices, then reveal]

</details>

The answer: **81.3 times** worse than Classical, with 77 % of the steps hitting the torque clamp.

Offline, the history halved its error. In closed loop, it was a disaster. Why?

One of its inputs is its own past goal. In the training data, the past goals came from a different controller. The network never saw its own goals. Once it drives, a small mistake changes its next input. That input is a bit outside the data, so the next output is a bit more wrong, and so on. The errors compound. The data the network sees in closed loop isn't the data it learned from. This is called distribution shift.

> **[WIDGET: closed-loop-drift]** Left: offline replay, the network's goals next to the recorded ones. Right: closed-loop rollout from the same start, drifting away.

There's a second suspect from part 3: past readings give the network a noisy acceleration estimate, which the loop can amplify. That wasn't tested.

So the lesson: **choose a model by its closed-loop error.** Offline training is simpler to run and simpler to think about. But only the closed loop tests the controller. From then on, every model choice in the project used closed-loop runs on validation paths.

Memory wasn't useless, by the way. With broadband training data (a 0.2 to 14 Hz wiggle), a network with memory had 0.834 of the error of the old no-memory network. The same network without memory had 1.45. The final network keeps one past step.

<details>
<summary>Where I was wrong: Classical doesn't look ahead</summary>

I said Classical doesn't look ahead. It does look one step ahead: it uses the next target. Its weakness is treating the 33 ms step as one instant.

</details>

## Where the network wins and loses

> **[FIGURE: NN / Fitted ratio by path family]** Holds below 1, moving paths above 1, with confidence intervals.

Against Fitted, the network wins on holds (0.83 to 0.99 of Fitted's error) and loses on moving paths (1.05 to 1.70).

At a hold, the right goal is simple: the target plus a steady offset for gravity and friction. On a moving path, the goal has to sit far ahead of the joint, and the right lead depends on speed, acceleration and the 33 ms step. A model with the right structure gets that from physics. The network has to learn it from data.

### Is this overfitting?

> **[FIGURE: sensitivity]** solve and pi with the right lag and with a 30 % wrong lag. **[FIGURE: learning curves]** Error against minutes of data for the physics model, the observer version and the network, showing the physics model worse at 1 to 2 min.

I wondered if a more complex physics model is just more likely to be wrong. That's related, but it's a different idea: sensitivity to model error.

A controller that trusts its model more is better when the model is right and loses more when it's wrong. Give `solve` a lag that's 30 % off, and its error goes from 2.3 to 4.1 mrad (× 1.78). The same error moves `pi` from 6.7 to 7.9 (× 1.18). But `solve` with the wrong lag is still better than `pi`. More terms aren't the problem. Wrong terms are.

Real overfitting did show up once, with a physics model fitted on too little data. With 1 to 2 minutes of real data, the fitted servo model had 30.6 and 19.0 mrad of error on new motions. A network with no physics had 12.0 and 11.0. The model's gain, offset and sag map didn't transfer to new poses.

## Known territory

> **[FIGURE: timeline]** Computed torque (1980s), adaptive control (Slotine and Li 1987), offset-free MPC, and where each lab controller sits.

Am I reinventing control? Mostly, yes, and that's fine.

- Classical model + PID is computed-torque control: inverse-dynamics feedforward plus feedback, from the 1980s.
- Estimating a payload during the run is adaptive control. Robot dynamics are linear in the mass parameters, so a payload can be estimated online with a stability proof (Slotine and Li, 1987).
- `mpca` is offset-free MPC: a planner with a disturbance state from a Kalman filter.

What's left open is the real arm, and conditions that change during a task.

## What I test next

> **[FIGURE: residual architecture]** Physics servo model + observer as a frozen base, a small network on top that learns the residual. Offline and closed-loop bars from the table.

My summary of round one: a network with no physics didn't work well on the real logs. So the next idea is a residual: a network that learns only what a physics model gets wrong.

On the real logs, the first round of that is already done (offline error over 0.2 s, and a stand-in closed loop):

| Model | Offline (mrad) | Stand-in closed loop (mrad) |
|---|---:|---:|
| Network, no physics | 3.90 | 5.50 |
| Servo model + observer | 3.70 | 2.76 |
| Network residual on servo model + observer | 3.01 | 3.12 |

Most of the gain is classical. The observer alone halves the servo model's error, from 7.37 to 3.70 mrad. The residual adds another 19 % to 23 % offline. But in the stand-in closed loop, the physics model alone still wins. The stand-in has the same structure as the servo model, so it favors it. It doesn't tell me which one wins on the real arm.

So, next:

1. Test the residual in closed loop on the real arm.
2. Train it on data from its own closed loop, not on another controller's logs.
3. Keep choosing by closed-loop error.

That last rule is the one I'll keep from this whole series.

[ROUGH DRAFT: series wrap-up and link back to part 1's map]
