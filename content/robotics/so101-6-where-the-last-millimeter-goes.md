---
title: 'Where the last millimeter of my drawing arm goes'
description: 'My SO-101 arm draws with about 1 mm of error. I split that error into causes, tested several controller ideas against it, and found that the pan joint owns most of what is left. This part teaches each controller and each test as a tool you can reuse.'
date: '2026-10-11'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 6
---

[Part 4](/robotics/so101-4-learning-what-physics-misses/) ended with one rule: choose a controller by its closed-loop error on the real arm, never by offline loss alone. [Part 5](/robotics/so101-pen-holder/) built the pen holder that turns the arm's error into ink. This part follows the rule. The arm draws, a tablet scores the drawing, and I test every controller idea against that score.

The question of this part: **my arm draws with about 1 mm of error. Where does the rest of the error come from, and which controller ideas reduced it?**

## The answer in short

Take a concrete case. The physics controller from parts 3 and 4, with no correction, draws my four validation drawings (kitten, star, spiral, square) with an error of **2.74 mm** (Measured, real arm). The best controller that I tested on the arm reduces this to **1.057 mm** (Measured). That controller is the physics controller plus a small learned correction that stops learning before the test. I call it the frozen correction head.

Here is what I learned, in five lines.

1. A better torque model alone cannot get below 2.22 mm. Even a perfect servo, with zero tracking error, leaves 2.22 mm (Offline, computed on recorded data).
2. The shoulder pan joint causes 61 % of the squared error of the uncorrected controller. It starts about 267 ms late after each direction change, and the pen lags behind the encoder reading on the same axis.
3. A correction learned from the planned motion removes most of that error. The gain comes from the features, not from a bigger model. In my Offline tests, features for backlash and for the memory of the last direction helped most.
4. A neural network fits its training drawings perfectly (0.85 mm) and gains at most 0.02 mm on new drawings. Planning the whole drawing ahead did not help in simulation.
5. I do not know why the pan joint misbehaves. Three mechanical causes fit the data, and I describe the tests that can separate them.

The figure shows every controller of this part on one axis. The two groups use different tests, so only the top group, Measured on the real arm, ranks controllers.

![Bar chart of the nib error in mm. Measured on the real arm: physics base without correction 2.74, with a residual network 2.27, neural-network corrections 1.14 to 1.15, frozen correction head 1.057. Offline on sealed motions: old linear model 1.131, linear hysteresis model 1.029, kernel model 1.008.](/assets/robotics/so101-controllers/controllers-map.png "Measured numbers rank controllers. The Offline group shows candidates that I did not yet test on the arm.")

## How I score a drawing

The arm holds a pen. A Wacom Intuos tablet under the pen reports where the pen tip, the nib, really touches. The tablet is a lab instrument. It scores drawings and it gives training data. It is never part of the final product, so a controller that needs the tablet while it draws is a lab tool, not a product.

Three words appear in every number of this part.

- **Nib error.** The distance between the planned nib position and the position that the tablet reports, at each moment.
- **RMS.** Root mean square. Square each error, take the mean, take the square root. For errors of 1 mm and 3 mm, the RMS is $\sqrt{(1^2 + 3^2)/2} = 2.24$ mm. It punishes big misses more than the plain average.
- **Validation drawings.** Four made-up drawings: a kitten, a star, a spiral and a square. They never train anything. Every score in this part comes from them or from other held-out motions.

I label every number with where it comes from.

| Label | What it means | Can it rank controllers? |
|---|---|---|
| Measured | The real arm drew it, and the tablet scored it | Yes |
| Offline | A computer scored a model on recorded arm data, with no new arm run | No, it only proposes candidates |
| Simulation | A software copy of the arm, built from my model of the servo | No |

## The controllers in this part

I need a short name for each controller. Parts 3 and 4 defined `phys` and PhysR. The other names are new. The table lists each one before I use it.

| Name | What it does | What it needs while it draws | Best result |
|---|---|---|---|
| Physics base (`phys`) | Predicts the next 15 ticks with a physical model of the arm and picks the goal that best follows the path | The encoder readings | 2.74 mm, no correction. Measured |
| Online correction head | Adds a learned offset to the joint goals. It learns while the arm draws, from the tablet error | The tablet, during the run | No separate arm score. I measure its frozen copy, in the next row |
| Frozen correction head | The same head with learning stopped | Only the planned path | 1.057 mm in the control block of an A B A test, and 1.03 and 1.14 mm in two earlier blocks. Measured |
| Hysteresis models | A correction learned from the planned path, with features for backlash and the last direction. Two versions: linear and kernel | Only the planned path | 1.029 mm (linear) and 1.008 mm (kernel) on sealed motions. Offline |
| Neural-network correction | A network that learns the correction from the planned path, trained even on the exact test examples | Only the planned path | 0.847 mm on its own training motions (in-sample), 1.14 to 1.15 mm on the arm. Measured |
| Fast Kalman head | A head that follows the tablet error of the last few ticks | The tablet, during the run | 0.74 to 0.84 mm. Offline, not for production |
| Whole-path planner (seqplan) | Plans the full drawing at once instead of 15 ticks ahead | The path and a model | At most 5 % better. Simulation |

A tick is one step of the control loop, about 16.7 ms.

## The physics base: what it does and why it is not enough

A servo only makes torque from the gap between its goal and its joint angle. [Part 1](/robotics/so101-1-target-and-goal/) built that idea into one equation per joint. The physics base uses all of it. At each tick it does three things.

1. **Estimate the state.** An extended Kalman filter (EKF) reads the joint angles and keeps an estimate of the joint speeds and of a missing torque $d$ for each joint. The EKF is a filter that blends a model prediction with each new reading, weighted by how much it trusts each one.
2. **Compute the torque the path needs.** Inverse dynamics takes the planned motion and returns the torque that the physical model says each joint needs. The feedforward term is this torque, divided by the servo stiffness, added to the goal.
3. **Search for the best goal.** Coordinate descent tries small changes of one joint goal at a time. For each try, it rolls the model forward for 15 ticks, about 0.25 s, and scores how far the nib ends from the path. It keeps the best goal.

The physics base is a good start. But when I draw with it, the nib is 2.74 mm off. The next step is to find out where that error comes from.

## Test 1: the error budget

A budget splits one big error into parts that add up. The method is to remove one cause at a time and measure what is left. I need to name the parts first. They are the chain that goes from the plan to the ink.

- $c$ is the command minus the plan. It is the correction that a head adds. For the physics base with no head, $c = 0$.
- $tr$ is the tracking error. It is the encoder nib position minus the command. The servo did not do what I asked.
- $u$ is the gap that the encoders cannot see (u for unseen). It is the tablet position minus the encoder nib position. The encoders read the joint angles, so they miss anything that bends or slips after the encoder.

The three parts add up to the nib error:

$$
e = u + tr + c
$$

Here are the numbers for the physics base. They are the mean of the four validation drawings, with the plan and the tablet compared at the same moment (Measured, Offline fits on Measured logs):

$$
e^2 = 7.51\ \text{mm}^2 = \underbrace{4.97}_{u^2} + \underbrace{1.69}_{tr^2} + \underbrace{0.85}_{\text{cross term}}, \qquad e = \sqrt{7.51} = 2.74\ \text{mm}
$$

The cross term appears because $u$ and $tr$ are not independent. Now remove one part. If tracking were perfect ($tr = 0$), the error would be $u$ alone, which is **2.22 mm**. This number matters. It is the best case for any torque model, physical or neural, that acts only on tracking. It stops at 2.22 mm, far above the 1.06 mm that a correction head already reaches. So a better torque model alone is a dead end for accuracy.

Where does the rest come from? The figure splits the squared error into ten parts. The parts add up to 100 %.

![Bar chart of ten error parts. Pen lag on the x axis, the pan direction, 39 percent. Pan start after a direction change 18 percent. Unexplained rest 10. Tablet stream delay 10. Static map 9. Wrist flex 4. Pan steady and hold 4. Elbow, lift and roll 3. Pen lag on y 2. Nib height, pressure and acceleration 1.](/assets/robotics/so101-controllers/error-parts.png "The three orange bars are the pan axis: 39 + 18 + 4 = 61 %.")

A timing view shows the same story. If I shift the plan 115 ms earlier before I score, the physics base error falls from 2.74 mm to 1.74 mm (Measured). At 20 mm/s, 115 ms is 2.3 mm of path. The frozen head learned this advance, and its best shift is 0 ms.

Two bars of the chart are not arm errors. The tablet stream delay is a timing offset of the tablet data, about 20 ms. It changes the score but not the ink. The unexplained rest holds the random noise of the tablet and the encoders, about 0.4 mm.

The three orange bars are all the pan axis. They add up to 61 % of the squared error. If the pan error were gone, the error would fall from 2.74 mm to 1.63 mm (Offline).

<details>
<summary>The full error budget and the remove-one table</summary>

The first table gives the ranked parts, with the size of each part alone and the error that is left if its share goes away. All rows are Offline fits on Measured logs, lag 0, mean of the four validation drawings.

| Part of the error | Own RMS (mm) | Share of $e^2$ | Error left if the share goes (mm) |
|---|---|---|---|
| Pen lag on x beyond the stream delay, plus direction offset (pan axis) | 1.30 | 39 % | 2.14 |
| Pan start and reversal tracking | 0.94 | 18 % | 2.49 |
| Unexplained rest of $u$ | 0.97 | 10 % | 2.59 |
| Tablet stream delay (20 ms times the speed) | 0.37 | 10 % | 2.59 |
| Static map (constant, x and y position) | 0.64 | 9 % | 2.61 |
| Wrist flex tracking | 0.56 | 4 % | 2.68 |
| Pan tracking, steady and hold | 0.50 | 4 % | 2.69 |
| Elbow, lift and roll tracking | 0.45 | 3 % | 2.70 |
| Pen lag on y beyond the stream delay | 0.24 | 2 % | 2.71 |
| Nib height, pressure, acceleration | 0.42 | 1 % | 2.73 |

The second table removes one cause at a time and keeps all the others. The rows overlap, so the gains do not add up.

| Remove this alone | Error left (mm) | Gain (mm) |
|---|---|---|
| All tracking ($tr = 0$) | 2.22 | 0.51 |
| Pan start and reversal tracking | 2.39 | 0.34 |
| Tablet stream delay | 2.47 | 0.27 |
| Pan direction offset | 2.36 | 0.38 |
| Everything the pan axis does, beyond the stream delay | 1.63 | 1.11 |
| The learnable part of $u$ (held-out fit) | 1.44 | 1.29 |
| Learnable $u$ and all tracking | 1.04 | 1.70 |

The last row says that a linear learner of $u$ plus perfect tracking reaches 1.04 mm. The frozen correction head measures 1.03 to 1.14 mm, so it already sits at that level. It is not a bound for a better learner.

</details>

## The pan axis: what it does wrong

The pan is the joint at the base that turns the whole arm left and right. On my tablet, the pan moves the nib mostly along the x axis. One milliradian (mrad) of pan angle moves the nib by 0.231 mm on x and by 0.019 mm on y. The pan has two problems.

**Problem 1: the pan starts late.** The planner reverses a goal. The lift and the elbow follow within 50 ms. The pan follows 267 ms later (Measured, median of 46 events). Then it lags by about 10 mrad at its peak. At 0.231 mm per mrad, that is about 2.3 mm of nib on x. The pan then recovers in about 1 s. This is 18 % of the squared error.

![Two panels of the mean goal and the mean joint angle in mrad after a direction change. Pan joint: the goal rises at once and the joint angle starts 267 ms later. Shoulder lift joint: the joint starts 0 ms after the goal.](/assets/robotics/so101-controllers/pan-reversal.png "Left: the pan joint waits about 267 ms after its goal moves. Right: the shoulder lift joint follows at once. Measured, median of the direction changes.")

**Problem 2: the pen lags behind the encoders on x.** The tablet minus the encoder nib position grows in a straight line with the nib speed along x. The slope is a lag of 86 ms on x and 35 ms on y. The y lag is the 20 ms tablet delay plus 15 ms. The x lag has 66 ms more. This part is invisible to the encoders. It repeats from run to run. It is 39 % of the squared error.

![Two scatter plots of tablet minus encoder position against planned nib speed. Left, x axis, the pan direction: a steep line down, from plus 2.7 mm at minus 28 mm per second to minus 2.4 mm at plus 28. Right, y axis: a gentle slope.](/assets/robotics/so101-controllers/nib-error-vs-speed.png "The x axis has a steep slope. The y axis has a gentle one. Measured.")

The controller expects the pan to follow its goal at once. It does not. So the planner leads the pan too little and too late.

### Three suspects for the cause

I do not know why the pan lags. Three mechanical causes fit the data. I define each one first.

| Suspect | What it is | What it predicts |
|---|---|---|
| Friction (stiction) | The pan joint does not move until the servo torque beats a breakaway torque | A dead zone around the goal, and a delay at a start from rest |
| Backlash | A gap between gear teeth. The motor crosses the gap before the joint moves | A fixed-angle gap at each reversal, whatever the torque |
| Compliance | A part bends like a spring under load: deflection = torque ÷ stiffness. The base, the table or the pen holder can bend | An error that grows with the torque, and that the encoders cannot see |

The data lean toward compliance. The pan load reading (a percentage of maximum torque) predicts the x error: $-0.77$ mm for each 10 % of load. When I add the load to the fit, the direction offset falls from $-0.54$ mm to $-0.14$ mm (Offline fit on Measured logs). A fixed backlash gap would not follow the torque. But the data cannot separate the three suspects.

### Pen drag: supported, not decided

A fourth suspect is the pen itself. A pen pressed on the tablet drags. The drag acts against the motion, so it flips sign when the direction flips. I ran a press sweep: the same motions at four press depths. The direction offset on x grows with press, and the y offset stays at zero (Measured, Offline fit):

| Press depth (mm) | Direction offset on x (mm) | Direction offset on y (mm) |
|---|---|---|
| 0.5 | −0.44 | +0.02 |
| 1.0 | −0.67 | −0.02 |
| 1.5 | −0.70 | −0.02 |
| 2.0 | −1.01 | −0.01 |

The offset is also about zero when the pen hovers above the tablet. That supports drag for the direction offset. But 32 to 36 ms of the x lag stays in hover. So drag does not explain all of it. A hover replay on the arm would decide the rest. I have not run it.

### Tests that can split the suspects

Each test changes one thing and watches which number moves.

1. **A speed sweep at 10, 20 and 40 mm/s.** All validation drawings run at 20 mm/s, so a lag (in ms) and a direction offset (in mm) move together. Different speeds split them.
2. **A hover replay at about 2 mm above the tablet.** If drag explains the offset, the offset goes to about zero. If the arm explains it, the offset stays near −0.4 to −0.7 mm.
3. **A low-friction nib.** PTFE tape on the nib cuts drag. Arm-side effects do not change.
4. **The servo P register from 16 to 32.** The servo torque is $P \times$ the position error. A larger $P$ gives more torque for the same error.

Test 4 deserves a worked example, because it separates friction from backlash. With stiction, the joint starts to move only when $P \times e$ exceeds the breakaway torque $T$. So the dead zone is $e = T / P$. If I double $P$, the dead zone halves. A hold offset of 3 mrad, which I measured when the pan stands still, would fall to about 1.5 mrad. A backlash gap is an angle fixed by the gears. Doubling $P$ does not change it. So the hold offset stays at 3 mrad. This is my reasoning, not a measurement. I have not run this test, because it writes servo registers on the arm, and a higher $P$ can also add chatter.

## Controller 2: the correction head

The physics base is wrong in a repeatable way. The same drawing gives almost the same error each time. In fact, 98 % of its error is repeatable (2.58 mm repeatable, 0.58 mm random, from two runs of the same motion). An error that repeats can be learned, so I add a correction head.

The head is a linear map from features of the planned motion to five joint-angle offsets. The features are the sine, the cosine, the angle, the speed, the acceleration and a saturated speed of each joint: 30 numbers plus a constant. The head adds the offsets to the joint goals. The head learns online with recursive least squares (RLS). RLS updates the weights after each tick, so that the offsets shrink the error that the tablet just reported.

<details>
<summary>The math of the RLS head</summary>

Call the feature vector $\phi_k$, with the constant appended (31 numbers), and the weights $W$ (5 × 31 = 155 numbers). The head outputs the joint offsets

$$
g_k = W \phi_k
$$

When the tablet error arrives, convert it to a joint-space label $y_k$ (the offset that would have cancelled it, through the nib Jacobian). Then RLS runs these three steps:

$$
K_k = \frac{P_{k-1}\phi_k}{\lambda + \phi_k^\top P_{k-1}\phi_k}, \qquad
W_k = W_{k-1} + (y_k - W_{k-1}\phi_k)\,K_k^\top, \qquad
P_k = \frac{1}{\lambda}\left(P_{k-1} - K_k \phi_k^\top P_{k-1}\right)
$$

Here $P$ is the inverse of the data matrix. It is the filter's memory of how sure it is, and it shrinks as data comes in. The forgetting factor $\lambda \le 1$ weighs old data. With $\lambda = 1$, nothing is forgotten. In my deployed code, a cap on $P$ binds on 96 % of the updates, so a $\lambda$ of 0.999 does almost nothing (tested with real features and synthetic labels).

</details>

Do the features matter? I ran an ablation: the same head, with fewer features. Each row is Measured on the arm.

| Head | Validation mean (mm) |
|---|---|
| No head | 2.74 |
| Constant offsets only | 2.64 |
| Pose features only | 2.65 |
| All features | 1.03 |

Offsets alone give almost nothing. The speed and acceleration features carry the gain. This is the lesson that I use for the rest of the part: **the features carry the gain.**

The online head still needs the tablet while it draws, because it learns from the tablet error. So I freeze it. A frozen head keeps the weights and stops learning. The frozen head scores **1.057 mm** (Measured, validation mean). It is the best controller that I measured.

## Test 2: A B A ordering

Two runs of the same controller do not give the same score. How big is that scatter? I ran the frozen head twice, an hour apart, on the same four drawings. Block 1 gave 1.03 mm. Block 2 gave 1.14 mm. It was worse on all four drawings (Measured). I do not know the cause. Drift (a warm arm, a tablet that shifts, wear) is my first guess. But repeated runs without any correction show no trend with the time between them, so I cannot confirm it.

So the test-retest drift of one validation mean is **0.12 mm**. A new controller must beat the baseline by more than 0.12 mm before I believe it.

The fix for drift is the ordering of the runs. If I run the baseline first and the new controller second, drift hits only the new controller. If I run baseline (A), new controller (B), baseline (A), drift hits both. The three runs have one rule:

1. Run the baseline A.
2. Run the new controller B.
3. Run the baseline A again.

Then compare B with the mean of the two A runs. The two A runs also show the drift. My stack test (a new correction on the head) started as the B block at 01:04. The arm computer went offline at about 01:30, and the result had not come back when I wrote this part. So I have the A and not yet the B.

A similar rule protects my choice of press depth. I tested a press of 1.0 mm instead of 1.5 mm. The score was 1.17 mm, against about 1.06 mm (Measured). The first pass of each stroke costs 0.3 mm, and the head recovers it in 3 to 5 passes. I keep 1.5 mm.

## Controller 3: hysteresis features and the fork-and-flush search

Part 4 said that a correction should learn what the physics misses. The first fork-and-flush round found that the winning features are hysteresis features. Hysteresis means that the output depends on the history of the input, not only on its current value. A gear with a gap has hysteresis: the joint position depends on which way the motor came from. I use the word for the features, not as a proven cause. The error budget found no backlash signature in the unexplained part of the gap $u$: it has the same size when a joint stands still and when it moves.

A **play operator** is the textbook tool for this. It is a tiny model of a gap. It tracks a state $s$ with a gap of width $w$. The state stays still while the input moves inside the gap, and it follows when the input pushes against an edge of the gap:

$$
s_k = \min\!\big(\max(s_{k-1},\, q_k - w/2),\ q_k + w/2\big)
$$

I feed several play operators, with different widths, into the correction as features. Together with the sign of the last motion, they give the model a memory of the backlash state of each joint.

I did not find the best feature set myself. I used fork-and-flush auto research (Cai et al., Microsoft Research). One lead starts several agents from the same workspace state. Each agent has a fresh context. A frozen scorer, which the agents cannot edit, scores them all. The lead continues from the winner.

<details>
<summary>The rules of my fork-and-flush runs</summary>

I fixed these rules before round 1.

1. Each round has three forks, each running for 45 to 50 minutes.
2. The winner is the lowest score of the frozen scorer on the dev motions. I do not use the number that a fork reports.
3. A new round starts from the winner only if it gains 0.02 mm or more.
4. The sealed motions are scored once, on the final winner, after a check that no fork read them.
5. A candidate gets an arm slot only if it gains 0.05 mm or more on both dev and sealed.
6. The arm test is A B A against the frozen head, with the 0.12 mm threshold.

Round 2 gained 0.005 mm. By rule 3, the run stopped after two rounds. My prediction before round 1 was 1.10 to 1.14 mm. The result was 0.99 mm. I was too pessimistic.

</details>

Here are the results. The dev motions chose the models. The sealed motions are four drawings that nobody used until the end. All numbers are Offline.

| Model | Dev score (mm) | Sealed score (mm) | How it runs |
|---|---|---|---|
| Old linear model (30 features) | 1.1766 | 1.1314 | Inside the online head |
| Linear hysteresis model | 1.0341 | 1.0285 | Inside the online head |
| Kernel model | 0.9852 | 1.0077 | As a fixed correction, played back |

A kernel model is a model that builds many curved features from the inputs, through a similarity function, and fits a linear map on top. The kernel adds about 0.02 mm over the linear hysteresis model on the sealed motions. The gain comes from the hysteresis features, not from the model class. This agrees with the ablation above.

## Test 3: dev, sealed and one look

A model that you tune on a score drifts toward that score. You can fool yourself with a lot of tries. The fix is a **sealed test set**. It is a set of motions that nobody reads or scores during the search. I score it once, on the final winner. About 35 dev scores chose the fork details, so differences below 0.01 mm on dev are noise. The sealed score is the one that I trust more. It also shrank the kernel's lead: 0.9852 on dev, 1.0077 on sealed.

## Controller 4: the strongest neural network

Part 4 left an open question: does a network beat the features? I gave the network every advantage. I trained it even on the exact motions that I scored it on. If it still fails on new drawings, the failure is not a lack of data or of tuning.

| What I scored | Neural network | Ridge, kernel, or frozen head |
|---|---|---|
| Its own training motions | 0.847 mm | n/a |
| New motions, best network | 1.025 mm | 1.047 mm (ridge, same features) |
| New motions, 50/50 blend with the kernel model | 0.983 mm | 0.985 mm (kernel alone) |
| On the arm, two earlier network corrections | 1.14 to 1.15 mm | 1.03 mm (frozen head, first block) |

The first row hits the run-to-run scatter floor, 0.86 mm. The network memorizes every tick. Its correction is jerky. On new motions, it gains 0.02 mm or less, below my 0.05 mm bar for a gain. On the arm, the two network corrections lost to the frozen head.

Why does it fail? The error that is left on a repeated motion is about 0.5 to 0.6 mm. It is specific to that motion. No feature that I tried predicts it on a new motion: the held-out $R^2$ is at most 0. A network cannot learn a pattern that the inputs do not contain.

## Controller 5: the fast Kalman head, and why it stays in the lab

One more idea uses the tablet while it draws. A Kalman head treats its weights as a random walk. It follows the tablet error of the last few ticks, with a memory of about 5 ticks. Offline, on top of the kernel model, it scores 0.738 mm if the tablet label arrives after 6 ticks and the plant has no lag. If it is tuned for a 60 ms lag, it scores 0.82 to 0.84 mm. That is a big gain, because it removes part of the random error between runs.

But this head is tablet feedback at run time. My rule is that the tablet stays in the lab. So it is not a production controller. It also breaks easily. If I tune it for no lag and the real lag is 30 ms or more, it diverges to 4 to 6 mm (Offline). The lesson is a rule. Measure the label delay and the plant lag first, then tune for the worst case.

It does show one thing: the run-to-run scatter, the 0.70 mm floor of a frozen head, is fast. I think only a production sensor on the nib, such as a camera, could remove it. That is a later stage, and not this part.

## Test 4: the learning curve

How much data does a correction need? A learning curve answers this. It retrains each model on 3, 6, 9 and 12 distinct motions and scores held-out motions (Offline, leave-one-group-out).

![Line chart of the held-out nib error against the number of training motions on a log axis. Old linear model: 1.239 at 3 motions to 1.177 at 12. Linear hysteresis model: 1.120 to 1.033. Kernel model: 1.172 to 0.985. Shaded bars at 24 and 48 motions show extrapolated ranges: kernel 0.90 to 0.94 at 24 and 0.83 to 0.91 at 48.](/assets/robotics/so101-controllers/learning-curve.png "The old linear model is nearly flat. The kernel model still falls at 12 motions, about 0.008 mm per added motion. The bars at 24 and 48 are extrapolations.")

Two lessons come out of it.

1. **Only the kernel model keeps learning.** It falls by about 7 % for each doubling of the data. The old linear model gains only 0.02 to 0.03 mm for a doubling.
2. **Distinct motions beat repeats at the same arm time.** Twelve motions with one run each (12 runs in total) give 1.039 mm. Six motions with 17.6 runs in total (about 3 each) give 1.067 mm. Three motions with 9.2 runs in total give 1.172 mm (Offline). The 12 distinct motions win with fewer runs. So new arm time is best spent on new drawings. Twelve new scribbles with one run each take about 27 minutes of wall time.

## What did not work, and what I still have to run

Three ideas lost before they reached the arm or are waiting.

| Idea | What it is | Result |
|---|---|---|
| Whole-path planning (seqplan) | Plan the entire drawing ahead, not 15 ticks | At most 5 % better on the exact model. With a small model error, 23 % to 364 % worse (Simulation). I recommend dropping it. No arm data yet |
| A better torque model alone | A better `phys`, PhysR or a torque network | Stops at 2.22 mm in the best case. PhysR measured 2.27 mm. Drop it as a stand-alone branch |
| Swapping the shoulder lift servo | A new servo for one joint | Lift tracking owns 0 to 2 % of the error. Drop it |

Whole-path planning fails for a reason that you can compute. The model error grows with the horizon: 0.40 mm at 1 tick and 1.81 mm at 10 ticks. A plan built on that model inherits the error. Fix the pan start model first.

Two ideas wait for the arm.

- **ILC on one repeated drawing.** Iterative learning control stores the error of the last run and corrects the next run of the same path. I expect it to land near the random floor, 0.6 to 0.7 mm. It is the same-path reference, not a proof of a bound.
- **The new hysteresis models on the arm.** My prediction before the test: a frozen linear hysteresis model or kernel model scores 1.05 to 1.15 mm on the arm, so it does not beat the frozen head by the 0.12 mm threshold. I give this a 65 % chance. An online head with the same features is the stronger candidate.

## Where this can be wrong

This section lists what I did not verify. Check these first.

- **Offline is not the arm.** The Offline scorer treats the error of the uncorrected run as independent of the correction. In the real loop, the head changes the error. On the frozen-head runs, the scorer predicts the new linear model at 1.24 mm, but the frozen head measured 1.06 mm. On uncorrected runs, the same scorer predicts 0.90 mm. [Part 4](/robotics/so101-4-learning-what-physics-misses/#section-offline-against-closed-loop) showed the same gap in another form. Only the arm decides. The hysteresis numbers are candidates.
- **The tablet is the judge.** The tablet stream arrives about 20 ms late. I estimated this from three indirect methods that agree within 10 to 30 ms. There is no hardware sync. If the delay is larger, the tablet delay bar of the error chart grows and the pan bars shrink. The tablet noise itself is about 0.4 mm.
- **The validation set is small.** There are four drawings. The test-retest drift of the mean is 0.12 mm. The dev set has 13 groups and 14 motions. The sealed set has four motions. The sealed scores come from one look, but four motions are still few.
- **The pan cause is unknown.** Friction, backlash and compliance all fit. I do not know which shaft the servo encoder reads, the motor side or the output side. That changes how backlash shows up in the loop. I have not verified it.
- **The hysteresis name is about features.** The unexplained part of the gap has the same size when a joint stands still and when it moves. So I have no direct sign of backlash at reversals.
- **The drag cause is only supported.** The hover replay did not run. Part of the x lag (32 to 36 ms) stays in hover.
- **One arm, one tablet pose.** The x axis is the pan direction at this tablet place. The pan result may change at another place.
- **The ceilings are best cases.** The 0.42 mm ceiling needs perfect tracking and a correction learned on the same motion. The servo dead zone and the encoder resolution keep the real value higher.
- **Extrapolations.** The 24 and 48 motion values are fits that go past my data. The two fit forms disagree by 0.04 to 0.08 mm.
- **The remove-one gains overlap.** A real change of tracking changes the other parts too.

## Check yourself

Each question gives all the facts it needs. Pick an answer, then open the answer to see the reasoning.

**Question 1.** A physics controller draws with an error of 2.74 mm. You compute that, with perfect servo tracking, the error would be 2.22 mm. A friend proposes a better torque network and says it will reach 1.0 mm. What do you reply?

- A. "Yes. A better network can model the servo perfectly, so it gets to zero." This ignores that the nib error is $u + tr + c$.
- B. "No. A torque model acts on tracking only, and perfect tracking still leaves 2.22 mm." This uses the budget.
- C. "Maybe. The score has noise of 0.12 mm, so 1.0 is close to 2.22." The noise is far too small to close this gap.

<details>
<summary>Answer</summary>

B. With $tr = 0$, the error is $u = 2.22$ mm. The part $u$ is what the encoders cannot see. A torque model acts only on tracking. Option A forgets $u$. Option C compares a 0.12 mm noise with a 1.22 mm gap.

</details>

**Question 2.** You measure a frozen controller at 1.057 mm. Later, the same controller measures 1.14 mm on the same drawings. The test-retest drift is 0.12 mm. A new controller scores 1.00 mm in a single run. Is it better?

- A. "Yes. 1.00 is below 1.057." This ignores the drift. The gain of 0.057 mm is smaller than 0.12 mm.
- B. "Not shown. The gain is below the drift. Run baseline, new, baseline and compare." This uses A B A.
- C. "No. The second baseline run was 1.14, so the new one is worse." The new controller is 1.00, not 1.14.

<details>
<summary>Answer</summary>

B. A gain of 0.057 mm is smaller than the 0.12 mm that the same controller moves on its own. A B A puts the drift on both sides of the new run. Option C compares the wrong numbers.

</details>

**Question 3.** A network scores 0.85 mm on the exact motions that it trained on. On new motions, it scores 1.025 mm. A ridge model (a linear fit with a penalty on big weights) on the same features scores 1.047 mm. Which statement is the best reading?

- A. "The network is better, so use it. 0.85 is the lowest number." The 0.85 comes from motions that it trained on.
- B. "The network memorized its training motions. On new motions it gains 0.02 mm, so the features do the work." This separates in-sample from held-out.
- C. "Ridge and network are equal, so more data will not help." The learning curve shows that more distinct motions do help the kernel model.

<details>
<summary>Answer</summary>

B. The in-sample number says that the network can fit. The held-out gain says whether it generalizes: 1.047 − 1.025 = 0.022 mm, below the 0.05 mm bar. Option C is a different claim, and the learning curve disagrees with it.

</details>

**Question 4.** A servo makes torque $P \times e$, where $e$ is the position error. A joint with stiction starts to move only when this torque beats a breakaway torque $T$. A second joint has a backlash gap of 3 mrad. You double $P$. What happens to the size of each effect?

- A. "Both halve, because a larger $P$ makes everything tighter." A gap between gear teeth is a geometry and does not depend on $P$.
- B. "The stiction dead zone $T/P$ halves. The backlash gap stays at 3 mrad." This follows from the formulas.
- C. "Neither changes. $P$ only changes the speed of the joint." $P$ sets the torque for a given error, so it moves the dead zone.

<details>
<summary>Answer</summary>

B. The dead zone is $e = T/P$, so doubling $P$ halves it. A gap is an angle that the gears set, so it stays. This is why the $P$ register test can separate friction from backlash. A real joint can have both, so the drop is then partial.

</details>

## What I test next

These tests have a prediction each. I choose the next one by the number that it can move.

1. **The $P$ register from 16 to 32 on the pan.** Prediction: if friction dominates, the 3 mrad hold offset and the start delay shrink. If backlash dominates, the hold offset stays.
2. **The hover replay and the low-friction nib.** Prediction: the direction offset on x falls to about zero in hover.
3. **A speed sweep at 10, 20 and 40 mm/s.** Prediction: it splits the 86 ms lag from the −0.54 mm offset.
4. **The hysteresis models on the arm, A B A against the frozen head.** Prediction: no gain above 0.12 mm.
5. **New distinct scribbles.** Prediction: about 27 minutes of arm time for 12 new motions lowers the held-out error more than the same time on repeats.

I keep the rule from part 4. I choose models by their closed-loop error on the real arm.
