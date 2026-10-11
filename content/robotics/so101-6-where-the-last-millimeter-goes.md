---
title: 'Where the last millimeter of my drawing arm goes'
description: 'My SO-101 arm draws a kitten with 1 mm of error. Here are the drawings, the controllers that made them better, and what still limits the arm: the pan joint.'
date: '2026-10-11'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 6
---

My SO-101 arm holds a pen and draws on a tablet. The tablet records where the pen really goes, so I can lay every drawing over its reference line and measure the gap in millimeters. This part shows how the drawings got better when I changed the controller, and what still limits the arm.

The question: **my arm draws with about 1 mm of error. Where does the rest come from, and which controller ideas reduced it?**

Short on time? Read the picture below, watch the replay, and read the five findings. The rest of the page explains each finding, and the long parts are in closed drawers.

## The drawing gets better with each change

Here is the whole story in one picture. It is the same kitten, drawn by the real arm with four controllers. Gray is the reference line. The colored line is where the pen really went, as measured by a tablet under the pen. The number is the error of the whole drawing: the root mean square (RMS) distance between the pen and the line, in millimeters. All four are Measured, which means the real arm drew them.

![Four drawings of a kitten, each over its gray reference line. Physics base without correction: 2.52 mm, the pen trails behind the line and wanders off it. With a learned torque (PhysR): 2.10 mm. With a neural-network correction: 1.05 mm. With the frozen correction head: 1.01 mm, the pen sits on the line.](/assets/robotics/so101-controllers/kitten-timeline.png "The top row is the physics controller from parts 3 and 4. The bottom row adds a learned correction.")

The top two drawings show the problem: the pen trails behind the line and wanders off it. The bottom two show what a learned correction does: the pen follows the line.

## What the arm is doing

The arm holds a pen in the sleeve from [part 5](/robotics/so101-pen-holder/). A Wacom Intuos tablet sits under the pen. The tablet is a lab instrument: it scores drawings and gives training data. It is never part of the final product.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-controllers/replay-kitten-poster.jpg" aria-label="Replay of two drawings of a kitten. Left, no correction, the pen trace drifts off the gray reference line by several millimeters. Right, with the frozen correction head, the trace stays close to the line.">
<source src="/assets/robotics/so101-controllers/replay-kitten.mp4" type="video/mp4">
<a href="/assets/robotics/so101-controllers/replay-kitten.mp4">Watch the video</a>
</video>
<figcaption>Replay of two real runs, 26 s at 4x speed. This is the tablet recording, drawn again, not camera footage. Gray: the reference line. Dot: the pen. Ring: where the pen should be.</figcaption>
</figure>

The replay above is the tablet recording of two real runs. For the arm itself, this is the setup: the pen sleeve on the arm and the tablet in front.

<figure class="article-figure" style="max-width:300px">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-pen-holder/on-the-arm-poster.jpg" aria-label="The printed sleeve on the fixed finger of the SO-101, with a pen in both clamps, and the Wacom Intuos S tablet in front of the arm.">
<source src="/assets/robotics/so101-pen-holder/on-the-arm.mp4" type="video/mp4">
<a href="/assets/robotics/so101-pen-holder/on-the-arm.mp4">Watch the video</a>
</video>
<figcaption>The setup, 13 s: pen sleeve on the arm, tablet in front.</figcaption>
</figure>

Two words appear in every number of this part.

- **Nib error.** The distance between where the pen tip (the nib) should be and where the tablet says it is, at each moment. RMS averages it over a drawing: square each error, average, take the root. Errors of 1 mm and 3 mm give $\sqrt{(1^2 + 3^2)/2} = 2.24$ mm. Big misses count more.
- **Validation drawings.** A kitten, a star, a spiral and a square that I made up. They never train anything.

Every number has a label. **Measured** means the real arm drew it and the tablet scored it. **Offline** means a computer scored a model on recorded data. **Simulation** means a software copy of the arm. Only Measured numbers rank controllers.

All four validation drawings show the same pattern. Each column is one drawing: no correction on top, the frozen head below.

![Eight drawings. Top row: kitten 2.52 mm, star 2.86, spiral 2.88, square 2.69 without correction. Bottom row: kitten 1.01, star 1.08, spiral 1.10, square 0.91 with the frozen correction head.](/assets/robotics/so101-controllers/four-drawings.png "All four validation drawings, Measured. The frozen head cuts the error to 0.91 to 1.10 mm.")

## What I found

1. **A learned correction does most of the work.** Physics alone gives 2.74 mm. The frozen correction head gives 1.057 mm (Measured, mean of the four drawings).
2. **A better torque model alone cannot do it.** Even a perfect servo, with zero tracking error, leaves 2.22 mm (Offline).
3. **The shoulder pan joint owns 61 % of the squared error** of the uncorrected controller. It starts about 267 ms late after each direction change, and the pen lags the encoder reading on the same axis.
4. **Features beat bigger models.** A neural network fits its training drawings to 0.85 mm and gains at most 0.02 mm on new drawings. Features that remember backlash and the last direction helped most (Offline).
5. **The pan dead band is friction, not backlash.** The lag on the pen is still unexplained. Compliance is my leading suspect.

![Bar chart of the nib error of each controller. Measured on the real arm: physics base 2.74, with a residual network 2.27, neural-network corrections 1.14 to 1.15, frozen correction head 1.057. Offline on sealed motions: old linear model 1.131, linear hysteresis model 1.029, kernel model 1.008.](/assets/robotics/so101-controllers/controllers-map.png "All controllers of this part. The Measured group ranks controllers. The Offline group are candidates that I did not yet test on the arm.")

## The controllers

Each controller sends a joint-angle goal to the servo at every tick. A tick is one step of the control loop, about 16.7 ms. The table gives what each one does and what it needs while it draws.

| Name | What it does | Needs while drawing | Best result |
|---|---|---|---|
| Physics base (`phys`) | Predicts 15 ticks ahead with a physical model of the arm and picks the best goal. An extended Kalman filter estimates a missing torque for each joint | The encoder readings | 2.74 mm, no correction. Measured |
| PhysR | The physics base plus a small learned torque | The encoder readings | 2.27 mm. Measured |
| Online correction head | Adds a learned offset to the joint goals. It learns while the arm draws, from the tablet error | The tablet | No separate arm score |
| Frozen correction head | The same head, with learning stopped | The planned path only | 1.057 mm. Measured |
| Hysteresis models | A correction learned from the planned path, with features for backlash and the last direction. Linear and kernel versions | The planned path only | 1.029 mm (linear) and 1.008 mm (kernel), sealed motions. Offline |
| Neural-network correction | A network that learns the correction, trained even on the exact test examples | The planned path only | 0.847 mm on its own training motions, 1.14 to 1.15 mm on the arm |
| Fast Kalman head | Follows the tablet error of the last few ticks | The tablet | 0.74 to 0.84 mm. Offline, not for production |
| Whole-path planner (seqplan) | Plans the full drawing at once | The path and a model | At most 5 % better. Simulation |

## Where the error comes from

To find the causes, I remove one cause at a time and measure what is left. This is an **error budget**. It needs three parts that add up to the error $e$:

$$
e = u + tr + c
$$

- $tr$ is tracking: where the encoders say the pen is, minus where I told it to go.
- $u$ is the gap the encoders cannot see (u for unseen): where the tablet says the pen is, minus where the encoders say. Anything that bends or slips after the encoder lands here.
- $c$ is the correction that a head adds. For the uncorrected controller, $c = 0$.

If tracking were perfect, $tr = 0$ and the error would be $u$ alone: **2.22 mm**. A torque model acts on tracking only, so this is its best case. It stops far above the 1.06 mm of the head.

The chart splits the squared error of the uncorrected controller into ten parts. They add up to 100 %.

![Bar chart of ten error parts. Pen lag on the x axis, the pan direction, 39 percent. Pan start after a direction change 18 percent. Unexplained rest 10. Tablet stream delay 10. Static map 9. Wrist flex 4. Pan steady and hold 4. Elbow, lift and roll 3. Pen lag on y 2. Nib height, pressure and acceleration 1.](/assets/robotics/so101-controllers/error-parts.png "The three orange bars are the pan axis: 39 + 18 + 4 = 61 %. Offline fit on Measured logs.")

Two bars are not arm errors. The tablet stream delay (about 20 ms) changes the score and not the ink. The unexplained rest holds tablet and encoder noise, about 0.4 mm. If the pan error were gone, the error would fall from 2.74 mm to 1.63 mm (Offline).

<details>
<summary>The numbers behind the budget</summary>

For the uncorrected controller, the mean of the four drawings gives (Measured, Offline fits):

$$
e^2 = 7.51\ \text{mm}^2 = \underbrace{4.97}_{u^2} + \underbrace{1.69}_{tr^2} + \underbrace{0.85}_{\text{cross term}}, \qquad e = \sqrt{7.51} = 2.74\ \text{mm}
$$

The cross term exists because $u$ and $tr$ are not independent.

| Part of the error | Own RMS (mm) | Share of $e^2$ |
|---|---|---|
| Pen lag on x beyond the stream delay, plus direction offset (pan axis) | 1.30 | 39 % |
| Pan start and reversal tracking | 0.94 | 18 % |
| Unexplained rest of $u$ | 0.97 | 10 % |
| Tablet stream delay (20 ms times the speed) | 0.37 | 10 % |
| Static map (constant, x and y position) | 0.64 | 9 % |
| Wrist flex tracking | 0.56 | 4 % |
| Pan tracking, steady and hold | 0.50 | 4 % |
| Elbow, lift and roll tracking | 0.45 | 3 % |
| Pen lag on y beyond the stream delay | 0.24 | 2 % |
| Nib height, pressure, acceleration | 0.42 | 1 % |

A timing view shows the same story. If I shift the plan 115 ms earlier before I score, the error falls from 2.74 mm to 1.74 mm (Measured). At 20 mm/s, 115 ms is 2.3 mm of path. The frozen head learned this advance.

</details>

## The pan axis

The pan is the joint at the base that turns the whole arm left and right. On my tablet it moves the pen mostly along x. One milliradian (mrad) of pan angle moves the pen 0.231 mm on x and 0.019 mm on y. The pan has two problems.

**It starts late.** The planner reverses a goal. The lift and the elbow follow within 50 ms. The pan follows 267 ms later (Measured, median of 46 events), then lags by about 10 mrad. At 0.231 mm per mrad, that is about 2.3 mm of pen.

![Two panels of the mean goal and the mean joint angle in mrad after a direction change. Pan joint: the goal rises at once and the joint angle starts 267 ms later. Shoulder lift joint: the joint starts 0 ms after the goal.](/assets/robotics/so101-controllers/pan-reversal.png "Left: the pan waits about 267 ms after its goal moves. Right: the lift follows at once. Measured.")

**The pen lags the encoders on x.** The gap between the tablet and the encoders grows in a straight line with the pen speed along x. The slope is a lag of 86 ms on x and 35 ms on y. The encoders do not see this lag.

![Two scatter plots of tablet minus encoder position against planned pen speed. Left, x axis, the pan direction: a steep line down. Right, y axis: a gentle slope.](/assets/robotics/so101-controllers/nib-error-vs-speed.png "The x axis, the pan direction, has a steep slope. The y axis has a gentle one. Measured.")

### Why does the pan lag?

Three mechanical causes can make a joint lag. The table defines each one.

| Suspect | What it is | What it predicts |
|---|---|---|
| Friction (stiction) | The joint does not move until the servo torque beats a breakaway torque | A dead zone around the goal, and a delay at a start from rest |
| Backlash | A gap between gear teeth. The motor crosses the gap before the joint moves | A fixed-angle gap at each reversal, whatever the torque |
| Compliance | A part bends like a spring: deflection = torque ÷ stiffness. The base, the table or the pen holder can bend | An error that grows with the torque. The encoders cannot see it |

**Friction explains the dead band.** The servo torque is $P \times e$, where $P$ is the servo gain register and $e$ is the position error. With friction, the joint moves only when $P e$ beats the breakaway torque $T$, so the dead band is $e = T / P$. Doubling $P$ halves it. A backlash gap is an angle that the gears fix, so doubling $P$ does not change it. I held the pan at a goal at four values of $P$ (Measured, direct holds from older logs):

| $P$ | Pan dead band (mrad) | Dead band times $P$ |
|---|---|---|
| 4 | 26.2 | about 105 |
| 16 | 9.2 to 9.7 | about 150 |
| 32 | 3.8 to 4.1 | about 125 |
| 128 | 0.04 to 0.13 | near zero, below one encoder tick |

From $P$ = 4 to 32, the product stays between 100 and 160. That is the signature of friction. Backlash in the loop is at most about 1 mrad. During drawing, the physics model removes part of the friction: the dead band is only 2.2 mrad, but the start after a pan reversal is still late.

**Compliance is my leading suspect for the lag on x.** The pan load reading (a percentage of maximum torque) predicts the x gap: $-0.77$ mm for each 10 % of load. With the load in the fit, the direction offset falls from $-0.54$ to $-0.14$ mm (Offline fit on Measured logs). A fixed gap would not follow the torque. The encoders cannot see play or bending outside the servo, so a $P$ test cannot test it.

**Pen drag is a fourth suspect.** A pressed pen drags against the motion. The direction offset on x grows with press depth, from −0.44 mm at 0.5 mm press to −1.01 mm at 2.0 mm. It is zero on y and about zero in hover. But 32 to 36 ms of the x lag stays in hover, so drag is not the whole story. I have not run the hover replay that would decide it.

## What worked

### A correction learned from the planned path

The physics base is wrong in a repeatable way. 98 % of its error repeats from run to run (2.58 mm repeatable, 0.58 mm random). An error that repeats can be learned.

The correction head is a linear map from features of the planned motion to five joint-angle offsets. The features are the sine, cosine, angle, speed, acceleration and a saturated speed of each joint: 30 numbers plus a constant. The head learns online with recursive least squares (RLS): after each tick, it adjusts its weights to shrink the error that the tablet just reported.

The features do the work. I ran the same head with fewer features (Measured):

| Head | Validation mean (mm) |
|---|---|
| No head | 2.74 |
| Constant offsets only | 2.64 |
| Pose features only | 2.65 |
| All features | 1.03 |

The online head needs the tablet while it draws. So I freeze it: the weights stay, learning stops, and the head needs only the planned path. The frozen head scores **1.057 mm** in the control block of my A B A test. That is the best controller that I measured.

<details>
<summary>The math of the RLS head</summary>

Call the feature vector $\phi_k$, with the constant appended (31 numbers), and the weights $W$ (5 × 31 = 155 numbers). The head outputs the joint offsets

$$
g_k = W \phi_k
$$

When the tablet error arrives, convert it to a joint-space label $y_k$ (the offset that would have cancelled it, through the nib Jacobian). RLS then runs three steps:

$$
K_k = \frac{P_{k-1}\phi_k}{\lambda + \phi_k^\top P_{k-1}\phi_k}, \qquad
W_k = W_{k-1} + (y_k - W_{k-1}\phi_k)\,K_k^\top, \qquad
P_k = \frac{1}{\lambda}\left(P_{k-1} - K_k \phi_k^\top P_{k-1}\right)
$$

$P$ is the inverse of the data matrix. It is the filter's memory of how sure it is, and it shrinks as data comes in. The forgetting factor $\lambda \le 1$ weighs old data. With $\lambda = 1$, nothing is forgotten. In my deployed code, a cap on $P$ binds on 96 % of the updates, so $\lambda = 0.999$ does almost nothing (tested with real features and synthetic labels).

</details>

### Hysteresis features

The first fork-and-flush round found that the winning features are hysteresis features. Hysteresis means that the output depends on the history of the input. A gear with a gap has it: the joint position depends on which way the motor came from. A **play operator** is a tiny model of a gap. It keeps a state $s$ that stays still while the input $q$ moves inside a gap of width $w$, and follows when the input pushes against an edge:

$$
s_k = \min\!\big(\max(s_{k-1},\, q_k - w/2),\ q_k + w/2\big)
$$

Play operators of several widths, plus the sign of the last motion, give the correction a memory of the backlash state of each joint. I use the word for the features, not as a proven cause: the unexplained part of the gap has the same size when a joint stands still and when it moves.

I did not find these features myself. I used fork-and-flush auto research (Cai et al., Microsoft Research): a lead starts several agents from the same workspace state, each with a fresh context. A frozen scorer that the agents cannot edit scores them. The lead continues from the winner. The dev motions chose the models. The sealed motions are four drawings that nobody used until the end.

| Model | Dev score (mm) | Sealed score (mm) |
|---|---|---|
| Old linear model (30 features) | 1.1766 | 1.1314 |
| Linear hysteresis model | 1.0341 | 1.0285 |
| Kernel model | 0.9852 | 1.0077 |

All Offline. The kernel adds only 0.02 mm over the linear model on the sealed motions. The gain comes from the features, not from the model class.

<details>
<summary>The rules of my fork-and-flush runs</summary>

I fixed these rules before round 1.

1. Each round has three forks, each running for 45 to 50 minutes.
2. The winner is the lowest score of the frozen scorer on the dev motions. I do not use the number that a fork reports.
3. A new round starts from the winner only if it gains 0.02 mm or more.
4. The sealed motions are scored once, on the final winner, after a check that no fork read them.
5. A candidate gets an arm slot only if it gains 0.05 mm or more on both dev and sealed.
6. The arm test is A B A against the frozen head, with the 0.12 mm threshold.

Round 2 gained 0.005 mm, so the run stopped after two rounds. My prediction before round 1 was 1.10 to 1.14 mm. The result was 0.99 mm. I was too pessimistic. About 35 dev scores chose the details, so dev differences below 0.01 mm are noise.

</details>

## What did not work

| Idea | What I did | Result |
|---|---|---|
| A bigger neural network | Trained it even on the exact test motions | 0.847 mm on those motions, but only 0.022 mm better than a ridge (a linear fit with a penalty on big weights) on new ones: 1.025 against 1.047 mm (Offline). On the arm, two network corrections measured 1.14 to 1.15 mm, worse than the frozen head (Measured) |
| A better torque model alone | A better `phys`, PhysR or a torque network | Stops at 2.22 mm in the best case. PhysR measured 2.27 mm |
| Whole-path planning (seqplan) | Plan the entire drawing ahead, not 15 ticks | At most 5 % better on the exact model. With a small model error, 23 % to 364 % worse (Simulation). I recommend dropping it |
| A fast Kalman head | Follow the tablet error of the last ~5 ticks | 0.74 to 0.84 mm (Offline), a big gain. But it reads the tablet while it draws, so it is a lab tool. Tuned for no lag, it diverges to 4 to 6 mm if the real lag is 30 ms or more |
| A new shoulder lift servo | Swap one servo | Lift tracking owns 0 to 2 % of the error. Dropped |

Why does the network fail? The error that is left on a repeated motion, about 0.5 to 0.6 mm, is specific to that motion. No feature that I tried predicts it on a new motion: the held-out $R^2$ is at most 0. A network cannot learn a pattern that the inputs do not contain. Whole-path planning fails because the model error grows with the horizon: 0.40 mm at 1 tick and 1.81 mm at 10 ticks. A plan built on that model inherits the error.

## How much data does a correction need?

A learning curve retrains each model on 3, 6, 9 and 12 distinct motions and scores held-out motions (Offline).

![Line chart of the held-out nib error against the number of training motions on a log axis. Old linear model: 1.239 at 3 motions to 1.177 at 12. Linear hysteresis model: 1.120 to 1.033. Kernel model: 1.172 to 0.985. Shaded bars at 24 and 48 motions show extrapolated ranges: kernel 0.90 to 0.94 at 24 and 0.83 to 0.91 at 48.](/assets/robotics/so101-controllers/learning-curve.png "Only the kernel model keeps falling: about 0.008 mm per added motion at 12 motions. The bars at 24 and 48 are extrapolations.")

**Distinct motions beat repeats.** Twelve motions with one run each (12 runs) give 1.039 mm. Six motions with 17.6 runs in total give 1.067 mm. The 12 distinct motions win with fewer runs. New arm time is best spent on new drawings: 12 new scribbles take about 27 minutes.

## The tests I use

Each test answers one question and guards against one way to fool myself.

| Test | The question | How it works |
|---|---|---|
| Error budget | Which cause owns how much error? | Split $e$ into parts that add up, then remove one at a time |
| A B A ordering | Is the new controller really better? | Run baseline A, new B, baseline A. The same controller drifts by 0.12 mm in an hour (1.03 then 1.14 mm), so B must win by more than that |
| Sealed set | Did I tune to my own score? | Four motions that nobody sees until one final look |
| Learning curve | Do I need more data? | Retrain on 3, 6, 9, 12 motions and extrapolate |
| Press sweep | Is the pen drag a cause? | Same motions at four press depths |

The A B A test for the new hysteresis models on the arm has not run. My stack test started at 01:04, and the arm computer went offline at about 01:30 with the battery dead.

## Where this can be wrong

- **Offline is not the arm.** The Offline scorer treats the uncorrected error as independent of the correction. On the frozen-head runs, it predicts the new linear model at 1.24 mm, while the frozen head measured 1.06 mm. [Part 4](/robotics/so101-4-learning-what-physics-misses/#section-offline-against-closed-loop) showed the same gap. The hysteresis numbers are candidates.
- **The tablet is the judge.** Its stream arrives about 20 ms late. I estimated this from three indirect methods that agree within 10 to 30 ms. There is no hardware sync. Tablet noise is about 0.4 mm.
- **The validation set is small.** Four drawings, and a test-retest drift of 0.12 mm.
- **The cause of the pan lag on x is unknown.** Friction explains the dead band, not the 86 ms lag. The project notes say that the servo encoder sits on the output shaft, so backlash inside the servo is at most about 1 mrad. I did not verify this against a datasheet. The late start is 267 ms in one count and 235 ms in another, so I quote about 250 ms.
- **The drag cause is only supported.** The hover replay did not run.
- **One arm, one tablet pose.** The pan result may change at another tablet place. The 24 and 48 motion values are extrapolations.

## Check yourself

Each question gives all the facts it needs. Pick an answer, then open the reasoning.

**Question 1.** A physics controller draws with an error of 2.74 mm. With perfect servo tracking it would be 2.22 mm. A friend says a better torque network will reach 1.0 mm. What do you reply?

- A. "Yes, a better network models the servo perfectly, so it reaches zero." This forgets the gap $u$.
- B. "No. A torque model acts on tracking only, and perfect tracking still leaves 2.22 mm." This uses the budget.
- C. "Maybe. The score has 0.12 mm of noise, so 1.0 is close to 2.22." The noise is far too small to close a 1.2 mm gap.

<details>
<summary>Answer</summary>

B. With $tr = 0$, the error is $u = 2.22$ mm. The encoders cannot see $u$, and a torque model acts only on tracking.

</details>

**Question 2.** A controller measures 1.057 mm. An hour later, the same controller measures 1.14 mm on the same drawings. A new controller scores 1.00 mm in one run. Is it better?

- A. "Yes. 1.00 is below 1.057." The gain, 0.057 mm, is smaller than the 0.08 mm that the same controller moved on its own.
- B. "Not shown. Run baseline, new, baseline and compare." This puts the drift on both sides of the new run.
- C. "No. The second baseline was 1.14, so the new one is worse." The new controller is 1.00, not 1.14.

<details>
<summary>Answer</summary>

B. One run of each cannot beat the drift. A B A can. In my notes the threshold is 0.12 mm.

</details>

**Question 3.** A servo makes torque $P \times e$. A joint with stiction starts to move only when this torque beats a breakaway torque $T$. A second joint has a backlash gap of 3 mrad. You double $P$. What happens?

- A. "Both halve, because a larger $P$ tightens everything." A gap is a geometry and does not depend on $P$.
- B. "The stiction dead zone $T/P$ halves. The backlash gap stays at 3 mrad." This follows from the formulas.
- C. "Neither changes. $P$ only changes the speed." $P$ sets the torque for a given error, so it moves the dead zone.

<details>
<summary>Answer</summary>

B. This is why the dead band table above points to friction. A real joint can have both, so the drop is then partial.

</details>

## What I test next

Each test has a prediction.

1. **A drawing block at $P$ = 16, 32, 16 on the pan (A B A).** It is running as I write. Rule: $P$ = 32 wins if it lowers the error by 0.12 mm or more. Earlier circles at $P$ = 32 had 6 to 12 % less total error than at $P$ = 16. Prediction: the gain is small, because the physics model already removes most of the friction effect.
2. **The hover replay and a low-friction nib.** Prediction: the direction offset on x falls to about zero in hover.
3. **A speed sweep at 10, 20 and 40 mm/s.** Prediction: it splits the 86 ms lag from the −0.54 mm offset.
4. **The hysteresis models on the arm, A B A against the frozen head.** Prediction: a frozen model scores 1.05 to 1.15 mm, so it does not beat the frozen head by 0.12 mm. I give this a 65 % chance. An online head with the same features is the stronger candidate.
5. **New distinct scribbles, and ILC on one repeated drawing.** Prediction: 27 minutes of arm time for 12 new motions lowers the held-out error more than the same time on repeats. I expect ILC (iterative learning control, which corrects the next run of a path from the last error) to reach about 0.6 to 0.7 mm. It is a same-path reference, not a proof of a bound.

I keep the rule from part 4: I choose models by their closed-loop error on the real arm.
