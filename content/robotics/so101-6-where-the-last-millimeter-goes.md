---
title: 'Where the last millimeter of my drawing arm goes'
description: 'My SO-101 arm cannot see its own pen tip. A tablet can. Here is what the tablet showed: how much error a learned correction removes, which causes are left, and why the base joint matters most.'
date: '2026-10-11'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 6
tags: ['so-101', 'calibration', 'measurement']
thumbnail: /assets/robotics/thumbnails/so101-6-where-the-last-millimeter-goes.jpg
thumbnail_alt: 'Overhead view of the SO-101 arm drawing on the tablet.'
---

## Where the series stands

This is part 6 of a series about the last mile of robot control: how a goal reaches a servo and what the arm does with it.

- [Part 1](/robotics/so101-1-target-and-goal/) writes one joint as one equation. Gravity, friction, a payload, dead time and a dead band are each one way the arm misses its target.
- [Part 2](/robotics/so101-2-finer-than-the-sensor/) is about the sensor: why differences of encoder ticks explode the noise, and how a filter can estimate an angle finer than one tick.
- [Part 3](/robotics/so101-3-choosing-the-goal/) writes every controller I built as one formula for the goal, from a plain look-ahead to MPC.
- [Part 4](/robotics/so101-4-learning-what-physics-misses/) asks where a neural network fits: a network that learns only what the physics model gets wrong.
- [Part 5](/robotics/so101-pen-holder/) builds a pen holder, so that the arm's error shows up as ink.

Those parts measured the arm in joint angles. This part measures it where it matters, at the pen tip, and it starts with what the joint sensors cannot tell me.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-controllers/kitty-overhead-v6c-poster.jpg" aria-label="Overhead view of the SO-101 arm drawing the kitten on the tablet. The arm holds the pen against the black tablet and moves it along the drawing.">
<source src="/assets/robotics/so101-controllers/kitty-overhead-v6c.mp4" type="video/mp4">
<a href="/assets/robotics/so101-controllers/kitty-overhead-v6c.mp4">Watch the video</a>
</video>
<figcaption>The real arm drawing the kitten, 40 s, real speed. Overhead camera, 11 Oct. This run used the frozen correction head (v6c) and servo gain P32. The black rectangle is the tablet.</figcaption>
</figure>

## The limits of the encoders

My SO-101 arm measures each joint with an encoder. An encoder reads a joint angle in whole steps called ticks. The first joint, the shoulder pan, turns the whole arm about a vertical axis. One tick of the pan is $2\pi/4096 = 1.534$ mrad. The pen is 231 mm from the pan axis, so one tick moves the pen 0.354 mm.

![Left: side view of the arm with the pan, shoulder lift, elbow flex, wrist flex and wrist roll joints named, and the distance R from the pan axis to the pen. Right: top view of the arm. One tick of the pan, drawn 100 times too big, moves the pen 0.354 mm, which is 231 mm times 1.534 mrad.](/assets/robotics/so101-controllers/arm-pan-lever.png "The pan sits at the base, so its lever to the pen is long. One tick of the pan is 0.354 mm at the pen.")

So the encoder is a coarse ruler at the pen. Rounding alone gives up to ±0.18 mm of error, and about 0.10 mm RMS. The controller can only command whole ticks. This is the first limit, and it is not the worst one.

### What goes wrong in the servos

- **Friction sets the floor today.** The pan holds a goal only within about 2.6 ticks, which is about 0.9 mm at the pen. At the servo gain setting P32, it does not move at all for steps of 10 ticks or less (Measured, 11 Oct).
- **A firmware dead zone** of about 1.5 ticks (2.3 mrad) sits inside the servo.
- **A delay** of 20 to 25 ms separates the joint from the controller, which runs at 60 Hz.
- **Gravity and the gain** make a held joint sag: the servo needs a steady gap between goal and angle to carry a load.
- **Heat** weakens the motor.

### What the encoders cannot see

- **Between two ticks,** they say nothing.
- **A slow gap** opens between the joint angles and the real pen position. The pen lags 86 ms behind the encoder reading along the pan direction, with a direction offset and a position error on top. Play and bending outside the servo, in the base, the table or the pen holder, hide here.
- **Backlash inside the servo** is small. The encoder sits on the output shaft (project notes, not checked against a datasheet), so the loop sees about 1 mrad of it or less.

### Where my model and my simulator are wrong

The physics controller from parts 3 and 4 and my simulator share one model of the arm. It contains friction, gravity and motor terms, the delays and the firmware dead zone. It does not contain these things.

- **Backlash.** There is no backlash term.
- **Compliance.** The base, the table and the holder can bend. The model treats them as rigid.
- **The real pan friction.** The pan needs a much larger force to start moving than to keep moving. A single friction value misses that, so the model underestimates the late start of the pan.

The error shows up as a gap. When the model predicts 10 ticks ahead (about 0.17 s), its error at the pen is 1.81 mm, larger than the tracking error that it tries to fix (1.24 mm). A simulator built from this model inherits the same blind spots. To make it better, I would have to model every defect of every joint.

### The shaking

The shaking that I see on the arm is mostly the controller's own goal chatter. It excites a mode of the shoulder lift at about 4.3 to 4.5 Hz (Offline). In the figure, the goal that the controller sends to the lift servo swings by up to 20 mrad in a 2.5 s window, and the joint answers with about 2 mrad, which is one to two ticks.

![Two stacked plots over 2.5 seconds. Top: the goal chatter on the shoulder lift, swinging between minus 20 and plus 20 mrad about 10 times per second. Bottom: the joint response, a few mrad.](/assets/robotics/so101-controllers/goal-chatter.png "The strongest 2.5 s of one drawing. Over the whole drawing, the chatter is 6.0 mrad RMS and the joint response is 1.4 mrad RMS. Offline, from Measured logs.")

The encoders see this shaking. In an Offline study of tablet and encoder logs, the tablet showed nothing that the encoders miss between 2 and 12 Hz, and the ring after a stop was about one encoder tick. So the shaking is a controller problem, and it is not hidden from the sensor.

I also filmed it. The gripper camera rides on the arm, so a shake of the arm would shake the picture. I recorded the kitten twice: with the correction head on (v6c) and with it off. My prediction was a visible shake with the head off and less with the head on. The clips do not show that.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-controllers/kitty-gripper-headoff-poster.jpg" aria-label="View from the gripper camera while the arm draws the kitten with the correction head off. The pen mount stays in the lower middle of the picture. The tablet and the table move slowly past.">
<source src="/assets/robotics/so101-controllers/kitty-gripper-headoff.mp4" type="video/mp4">
<a href="/assets/robotics/so101-controllers/kitty-gripper-headoff.mp4">Watch the video</a>
</video>
<figcaption>Gripper camera, correction head off, 30 s excerpt, real speed. The pen mount is the object at the bottom center.</figcaption>
</figure>

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-controllers/kitty-gripper-v6c-poster.jpg" aria-label="View from the gripper camera while the arm draws the kitten with the frozen correction head v6c. It looks the same as the head-off clip.">
<source src="/assets/robotics/so101-controllers/kitty-gripper-v6c.mp4" type="video/mp4">
<a href="/assets/robotics/so101-controllers/kitty-gripper-v6c.mp4">Watch the video</a>
</video>
<figcaption>Gripper camera, correction head v6c, 30 s excerpt, real speed.</figcaption>
</figure>

I measured the picture instead of trusting my eyes. For each frame, I computed how far the picture moved against the previous frame, and removed the slow drawing motion (below 2 Hz). Over 70 s of each clip, the remaining motion is 0.25 px RMS with the head off and 0.28 px RMS with it on (Measured, 960 px wide pictures at 30 frames per second). Neither spectrum has a peak at 4 to 5 Hz.

So these clips do not show the lift shaking. They do not contradict the Offline result either. The camera is a wide-angle lens at 30 frames per second, and the joint answers the chatter with only one to two ticks. A shake that small may be below what this camera shows. An accelerometer on the arm is a better test, and it is on the list below.

### So I need an outside judge

What the encoders miss is mostly slow: the lag, the offset, and the position error of the pen. To measure that, I need a second opinion on where the pen tip is. A tablet gives one.

## Why a tablet?

A tablet reports where a pen touches it. It was the cheapest outside judge of the pen tip that I could find. If the arm draws a path that I know exactly, the tablet tells me, moment by moment, how far the pen is from where it should be.

There are better judges. Three strings attached to the pen tip, one for each axis, could measure the 3D position. A very precise camera could too. I did not build either one.

All three have the same problem for a fleet of robots: nobody will calibrate every robot every day with strings, a camera rig or a tablet. So the tablet is a stepping stone. It labels where the pen really went, so that I can learn what a cheap on-board sensor must see. My next candidate is an accelerometer on the arm.

The goal behind all this: my arm will do kitting and carry tools. These are 3D motions with a payload that changes. The final controller can use only what the arm carries. So I want to know how accurate a cheap arm can be, which controller ideas make it better, and which physical effects set the limit.

The question of this part: **my arm draws with about 1 mm of error. Where does the rest come from, and which controller ideas reduced it?**

Short on time? Watch the time-lapse, look at the drawings, and read the five findings. The long parts are in closed drawers.

## The drawings

This is the same kitten, drawn by the real arm with four controllers. Gray is the reference line. The colored line is where the pen really went, as measured by the tablet. The number is the error of the whole drawing: the root mean square (RMS) distance between the pen and the line, in millimeters. Square each error, average, take the root. Big misses count more.

![Four drawings of a kitten, each over its gray reference line. Physics base without correction: 2.52 mm, the pen trails behind the line and wanders off it. With a learned torque (PhysR): 2.10 mm. With a neural-network correction: 1.05 mm. With the frozen correction head: 1.01 mm, the pen sits on the line.](/assets/robotics/so101-controllers/kitten-timeline.png "The top row is the physics controller from parts 3 and 4. The bottom row adds a learned correction. All Measured.")

The top two drawings show the problem: the pen trails behind the line and wanders off it. The bottom two show a learned correction: the pen follows the line.

I use two sets of drawings. The **test drawings** (kitten, star, spiral, square) are the ones I choose controllers on. The **validation drawings** (circle, plus) are held out and only report how well a controller generalizes. Every number in this part is on the test drawings unless it says otherwise. I have not scored the validation drawings here.

![Eight drawings. Top row: kitten 2.52 mm, star 2.86, spiral 2.88, square 2.69 without correction. Bottom row: kitten 1.01, star 1.08, spiral 1.10, square 0.91 with the frozen correction head.](/assets/robotics/so101-controllers/four-drawings.png "The four test drawings, Measured. Each column is one drawing: no correction on top, the frozen head below.")

### Time-lapse: the drawings get more precise

The video draws all four test drawings at once, with four controllers in a row. Each stage is the real arm, drawn again from the tablet recording at 8 times speed. The bars on the right keep the error of every stage. The four stages ran the same night, at the same tablet pose. They are ordered by error and not by clock time.

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-controllers/timelapse-poster.jpg" aria-label="Time-lapse of four drawings, a kitten, a star, a spiral and a square, drawn with four controllers in turn. The pen trace sits further from the gray reference line for the physics base, closer with a learned torque, close with a neural-network correction and closest with the frozen correction head. The bars show the mean error: 2.74, 2.27, 1.15 and 1.03 millimeters.">
<source src="/assets/robotics/so101-controllers/timelapse.mp4" type="video/mp4">
<a href="/assets/robotics/so101-controllers/timelapse.mp4">Watch the video</a>
</video>
<figcaption>Time-lapse of the four test drawings with four controllers, 57 s. This is the tablet recording of the real runs, drawn again, not camera footage. Gray: the reference line. Dot: the pen. Mean errors: 2.74, 2.27, 1.15 and 1.03 mm (Measured). The last stage is the first block of the frozen head; the control block of the baseline test gave 1.057 mm.</figcaption>
</figure>

### Before the tablet: the arm in the camera view

Before I had the tablet, I measured the pen with an overhead camera. This clip is real camera footage from 6 Oct. A pencil taped in the gripper hovers over a circle, with no contact. A grid is drawn over the table for scale. The left half is the default controller, `direct`, which sends the target angle unchanged. The right half is the physics controller. Purple is the pen trace that the camera sees. After 67 s, the error so far is 10.1 mm for `direct` and 1.3 mm for the physics controller (Measured with the camera, not with the tablet).

<figure class="article-figure">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-controllers/overlay-direct-vs-phys-poster.jpg" aria-label="Overhead camera footage of the arm moving a hovering pencil around a circle, twice side by side. Left, the default controller, the purple trace of the pen wanders off the green circle. Right, the physics controller, the trace follows the circle.">
<source src="/assets/robotics/so101-controllers/overlay-direct-vs-phys.mp4" type="video/mp4">
<a href="/assets/robotics/so101-controllers/overlay-direct-vs-phys.mp4">Watch the video</a>
</video>
<figcaption>Overhead camera, 54 s, 6 Oct. Left: the default controller. Right: the physics controller. A grid of 1 cm squares is drawn over the table.</figcaption>
</figure>

<figure class="article-figure" style="max-width:300px">
<video controls muted playsinline preload="metadata" poster="/assets/robotics/so101-pen-holder/on-the-arm-poster.jpg" aria-label="The printed sleeve on the fixed finger of the SO-101, with a pen in both clamps, and the Wacom Intuos S tablet in front of the arm.">
<source src="/assets/robotics/so101-pen-holder/on-the-arm.mp4" type="video/mp4">
<a href="/assets/robotics/so101-pen-holder/on-the-arm.mp4">Watch the video</a>
</video>
<figcaption>The setup, 13 s: the pen sleeve from <a href="/robotics/so101-pen-holder/">part 5</a> on the arm, the tablet in front.</figcaption>
</figure>

## How the system works

The input is a drawing: a path in tablet millimeters. The output is where the pen tip really goes. The diagram shows the parts in between. The tablet is lab only. A correction can happen in three places.

![Block diagram. A reference drawing goes through inverse kinematics to a joint path. A correction head adds joint offsets at a plus node. The physics controller sends goals to the servo, which drives the arm and pen. Encoder readings go back to the controller. The tablet reads the pen tip. Its error against the reference gives the score, and an online head learns from it.](/assets/robotics/so101-controllers/system.png "The three letters mark the error parts: c is the correction, tr is servo lag, u is what the encoders cannot see.")

1. **Inside the physics controller.** It predicts the torque that the path needs and picks the best goal for the next 15 ticks (about 0.25 s). A learned torque (PhysR) is one more correction here.
2. **On the path, before the controller: the correction head.** It adds joint offsets that were learned from features of the planned path.
3. **From the tablet error: the online head.** The head learns from the tablet while the arm draws. This needs the tablet. I freeze the head before I use it, so that it needs only the path.

### The correction head

The head is a small linear map. The input is the planned joint path. The output is a few milliradians of offset for each joint, added to the goals. The head exists to stand in for effects that the physical model does not contain.

![Block diagram of the correction head. The planned joint path gives 31 features, which a 5 by 31 linear map W turns into joint offsets. The offsets are added to the path and go to the physics controller. In the lab, the tablet error becomes a label, and an RLS update changes W. The frozen head skips this step.](/assets/robotics/so101-controllers/head-schematic.png "The head: path features in, joint offsets out. Orange is the lab-only learning step.")

This is what the frozen head adds to the pan goal while the arm draws the kitten.

![Three stacked plots over 35 seconds. Top: the planned pan angle in mrad. Middle: the planned pan speed. Bottom: the offset the frozen head adds to the pan goal. The offset is near zero while the pan holds still or moves smoothly, and spikes of 10 to 14 mrad appear at quick back-and-forth moves.](/assets/robotics/so101-controllers/head-offset.png "The head adds nothing in a hold and spikes at the quick reversals. Measured.")

The offset is near zero while the pan holds or moves smoothly, and it spikes by 10 to 14 mrad around quick back-and-forth moves. This matches the weak spot of the pan: it starts late after a reversal, so the head asks for more angle ahead of time.

The head learns with recursive least squares (RLS): after each tick, it nudges its weights to shrink the error that the tablet just reported. The physics controller uses an extended Kalman filter (EKF) to estimate a missing torque. Both updates have the same shape: **new belief = old belief + gain × surprise.** The figure marks each part. The gain $K$ says how much to trust the new reading. The matrix $P$ says how unsure the learner is. It shrinks after every reading.

![Annotated equations. Top: new belief equals old belief plus gain times surprise, with each part labeled. Middle: the RLS head, with K as the gain, W as the weights and P as the uncertainty, each with a one-line explanation. Bottom: the EKF of the physics controller, where the missing-torque estimate moves by gain times the difference between the encoder reading and the model prediction.](/assets/robotics/so101-controllers/kalman-intuition.png "The two online estimators in this post. Color marks the same role in each equation.")

## What I found

1. **A learned correction does most of the work.** Physics alone gives 2.74 mm. The frozen correction head gives 1.057 mm (Measured, mean of the four test drawings).
2. **A better torque model alone cannot do it.** Even a perfect servo, with zero tracking error, leaves 2.22 mm (Offline).
3. **The shoulder pan owns 61 % of the squared error** of the uncorrected controller. It starts about 267 ms late after each direction change, and the pen lags the encoder reading along the same axis.
4. **Features beat bigger models.** A neural network fits its training drawings to 0.85 mm and gains at most 0.02 mm on new drawings. Features that remember backlash and the last direction helped most (Offline).
5. **The pan dead band is friction, not backlash.** The lag on the pen is still unexplained.

![Bar chart of the nib error of each controller. Measured on the test drawings: physics base 2.74, with a residual network 2.27, neural-network corrections 1.14 to 1.15, frozen correction head 1.057. Offline on held-out motions: old linear model 1.131, linear hysteresis model 1.029, kernel model 1.008.](/assets/robotics/so101-controllers/controllers-map.png "All controllers of this part. The Measured group ranks controllers. The Offline group are candidates that I did not yet test on the arm.")

## What the physics misses

To find the causes, I remove one cause at a time and measure what is left. This is an **error budget**. It splits the error $e$ into three parts, marked on the system diagram:

$$
e = u + tr + c
$$

- $tr$ is tracking: where the encoders say the pen is, minus where I told it to go.
- $u$ is the gap the encoders cannot see (u for unseen): where the tablet says the pen is, minus where the encoders say.
- $c$ is the correction that a head adds. For the uncorrected controller, $c = 0$.

If tracking were perfect, the error would be $u$ alone: **2.22 mm**. A torque model acts on tracking only, so this is its best case. It stops far above the 1.06 mm of the head.

![Bar chart of ten error parts. Pen lag on the x axis, the pan direction, 39 percent. Pan start after a direction change 18 percent. Unexplained rest 10. Tablet stream delay 10. Static map 9. Wrist flex 4. Pan steady and hold 4. Elbow, lift and roll 3. Pen lag on y 2. Nib height, pressure and acceleration 1.](/assets/robotics/so101-controllers/error-parts.png "The three orange bars are the pan axis: 39 + 18 + 4 = 61 % of the squared error. Offline fit on Measured logs.")

Two bars are not arm errors. The tablet stream delay (about 20 ms) changes the score and not the ink. The unexplained rest holds tablet and encoder noise, about 0.4 mm. If the pan error were gone, the error would fall from 2.74 mm to 1.63 mm (Offline).

<details>
<summary>The numbers behind the budget</summary>

For the uncorrected controller, the mean of the four test drawings gives (Measured, Offline fits):

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

### The pan axis

On my tablet, the pan moves the pen mostly along x. One milliradian of pan angle moves the pen 0.231 mm on x and 0.019 mm on y. The pan has two problems.

**It starts late.** The planner reverses a goal. The lift and the elbow follow within 50 ms. The pan follows 267 ms later (Measured, median of 46 events), then lags by about 10 mrad. At 0.231 mm per mrad, that is about 2.3 mm of pen.

![Two panels of the mean goal and the mean joint angle in mrad after a direction change. Pan joint: the goal rises at once and the joint angle starts 267 ms later. Shoulder lift joint: the joint starts 0 ms after the goal.](/assets/robotics/so101-controllers/pan-reversal.png "Left: the pan waits about 267 ms after its goal moves. Right: the lift follows at once. Measured.")

**The pen lags the encoders on x.** The gap between the tablet and the encoders grows in a straight line with the pen speed along x. The slope is a lag of 86 ms on x and 35 ms on y.

![Two scatter plots of tablet minus encoder position against planned pen speed. Left, x axis, the pan direction: a steep line down. Right, y axis: a gentle slope.](/assets/robotics/so101-controllers/nib-error-vs-speed.png "The x axis, the pan direction, has a steep slope. The y axis has a gentle one. Measured.")

The dead band is friction (Measured). The cause of the lag on x is not known: compliance and pen drag are suspects, and backlash is small. The drawer has the three tests.

<details>
<summary>Why does the pan lag? Friction, backlash, compliance and pen drag</summary>

Three mechanical causes can make a joint lag.

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

**Compliance remains a suspect for the lag on x.** The pan load reading predicts the x gap: $-0.77$ mm for each 10 % of load. With the load in the fit, the direction offset falls from $-0.54$ to $-0.14$ mm (Offline fit on Measured logs). But a separate Offline test found that load deflection does not explain the pose-dependent part of the error. So compliance is a suspect, not a result.

**Pen drag is a fourth suspect.** A pressed pen drags against the motion. The direction offset on x grows with press depth, from −0.44 mm at 0.5 mm press to −1.01 mm at 2.0 mm. It is zero on y and about zero in hover. But 32 to 36 ms of the x lag stays in hover, so drag is not the whole story. A hover replay would decide it. It has not run.

</details>

## What worked

The physics base is wrong in a repeatable way: 98 % of its error repeats from run to run (2.58 mm repeatable, 0.58 mm random). An error that repeats can be learned. The head's inputs are the sine, cosine, angle, speed, acceleration and a saturated speed of each joint: 30 numbers plus a constant. I ran the same head with fewer inputs (Measured, mean of the test drawings):

| Head | Error (mm) |
|---|---|
| No head | 2.74 |
| Constant offsets only | 2.64 |
| Pose features only | 2.65 |
| All features | 1.03 |

Offsets alone give almost nothing. The speed and acceleration features carry the gain.

**Hysteresis features.** Hysteresis means that the output depends on the history of the input. A gear with a gap has it: the joint position depends on which way the motor came from. An automated research process, which I will describe in a separate post, found that features of this kind help most.

<details>
<summary>How the hysteresis features work, and the scores</summary>

A **play operator** is a tiny model of a gap. It keeps a state $s$ that stays still while the input $q$ moves inside a gap of width $w$, and follows when the input pushes against an edge:

$$
s_k = \min\!\big(\max(s_{k-1},\, q_k - w/2),\ q_k + w/2\big)
$$

Play operators of several widths, plus the sign of the last motion, give the correction a memory of the backlash state of each joint. I use the word for the features, not as a proven cause: the unexplained part of the gap has the same size when a joint stands still and when it moves.

Models fit on the search motions and scored once on four held-out motions (Offline):

| Model | Search score (mm) | Held-out score (mm) |
|---|---|---|
| Old linear model (30 features) | 1.1766 | 1.1314 |
| Linear hysteresis model | 1.0341 | 1.0285 |
| Kernel model | 0.9852 | 1.0077 |

A kernel model builds many curved features through a similarity function and fits a linear map on top. It adds only 0.02 mm over the linear model on the held-out motions, so the gain comes from the features, not from the model class. These are candidates: none has been tested on the arm.

</details>

**More data.** A learning curve retrains each model on 3 to 12 distinct motions and scores held-out motions (Offline).

![Line chart of the held-out nib error against the number of training motions on a log axis. Old linear model: 1.239 at 3 motions to 1.177 at 12. Linear hysteresis model: 1.120 to 1.033. Kernel model: 1.172 to 0.985. Shaded bars at 24 and 48 motions show extrapolated ranges: kernel 0.90 to 0.94 at 24 and 0.83 to 0.91 at 48.](/assets/robotics/so101-controllers/learning-curve.png "Only the kernel model keeps falling: about 0.008 mm per added motion at 12 motions. The bars at 24 and 48 are extrapolations.")

Distinct motions beat repeats. Twelve motions with one run each (12 runs) give 1.039 mm. Six motions with 17.6 runs in total give 1.067 mm.

## What did not work

- **A bigger neural network.** Trained even on the exact test motions, it reached 0.847 mm on those motions. On new motions it beat a ridge model (a linear fit with a penalty on big weights) on the same features by only 0.022 mm: 1.025 against 1.047 mm (Offline). On the arm, two network corrections measured 1.14 to 1.15 mm, worse than the frozen head (Measured). The error that is left on a repeated motion, about 0.5 to 0.6 mm, is specific to that motion. No feature that I tried predicts it on a new motion.
- **A better torque model alone.** It stops at 2.22 mm in the best case. PhysR measured 2.27 mm.
- **Planning the whole drawing at once.** At most 5 % better with an exact model, and 23 % to 364 % worse with a small model error (Simulation). The model error grows with the horizon: 0.40 mm at 1 tick and 1.81 mm at 10 ticks, and a plan inherits it.
- **A fast Kalman head** that follows the tablet error of the last few ticks. It reached 0.74 to 0.84 mm (Offline), but it reads the tablet while it draws, so it is a lab tool. Tuned for no lag, it diverges to 4 to 6 mm if the real lag is 30 ms or more.
- **A new shoulder lift servo.** Lift tracking owns 0 to 2 % of the error.

## Does it transfer?

A reviewer would ask whether this correction is circular. The head learns from the tablet error, and then it is scored by the same tablet. What happens without a tablet, when the arm moves objects in 3D? The answer so far is that I do not know. These are the gaps.

- **The head needs the tablet to learn.** At run time the frozen head needs only the planned path. But its weights were fit with tablet labels from this arm. They carry this arm's friction, lag and tablet delay.
- **The correction lives in the tablet plane.** The tablet measures x and y. The scorer removes the pen-height part of the correction. So the head was fit in one plane, at one tablet pose, on one arm. Transfer to 3D motion is untested.
- **A payload changes the arm.** Kitting changes the payload mid-task. I trained the head with no payload changes. This is untested.
- **I chose controllers on the test drawings.** So 1.057 mm is a selection-set number. The held-out validation drawings are the fair check, and I have not scored them here.
- **The judge has its own error.** The datasheet accuracy of the tablet is ±0.25 mm at the center. I have not finished checking it, so a difference below that is weak evidence.

## The role of simulation

I also use a simulator. Its value is unclear to me, because every candidate ends up on the real arm anyway. It cannot rank learned models: a simulator built from my model of the arm favors the planner that uses the same model. Its real uses are a dry run before the arm moves, and ideas that need many runs.

The simulator is also flawed, for the reasons in the limits of the encoders above. The defect atlas below is the way to fix it.

## What comes next

- **A defect atlas of every joint.** Estimate every error source of every joint, with a method and an uncertainty for each: backlash, breakaway and running friction, the firmware dead band, compliance, the servo ramp and gain, temperature and drift. This work restarted on 11 October. It starts from the logs that exist, then runs a targeted arm battery for what the logs cannot separate.
- **Accelerometers on the arm.** Planned, not ordered. An accelerometer sees shaking and bending, so it is a cheap candidate for the unseen gap. Gyros measure the pan rotation rate but not the absolute pan angle, because gravity is vertical.
- **A gripper camera over a tag mat,** to see the shake and the parasitic motion of the pen tip. This is an idea. It is being scoped offline and is not queued.
- **A tilted tablet,** to measure height as well as x and y. This is an idea.
- **Strings or a precise camera** as lab references. This is an idea.
- **Servo gain P32.** I set P32 on four joints (pan, elbow, wrist flex, wrist roll; the lift stayed at P16). The error was 0.061 mm lower over four pairs of blocks (Measured, standard error 0.015 mm). My pre-written rule still scored it as a loss, because the lift rang past its stop. The lift had P16 in both arms, so the stop did not measure P32. The next test, elbow P32 with wrist flex P48, checks the same direction under a fairer ring rule.
- **The held-out drawings.** Score the validation drawings, circle and plus, with the best controller.
- **The hysteresis models on the arm,** with a baseline run before and after each one to cancel drift.

### The Mona Lisa test

At the end, the best controller will draw the Mona Lisa. I have not drawn it. It is a demo with many strokes and long reversals, so it should show the pan problems in a picture that anyone can judge. It ranks nothing.

## Where the numbers come from

Every number in this part has a label. The diagram shows how each kind of number is made. Only the Measured numbers rank controllers.

![Three columns. Measured: the real arm draws, the tablet and encoders log it, pen minus reference is scored as RMS, examples 2.74 and 1.057 mm, ranks controllers. Offline: logs of real runs split by whole motion, a model fitted on some motions and tested on others with a frozen scorer, examples 2.22, 1.008 and 0.847 mm, proposes candidates. Simulation: a model of the arm plays the arm, examples planning at most 5 percent better, never ranks learned models.](/assets/robotics/so101-controllers/numbers.png "The three labels of this part.")

<details>
<summary>Where each key number comes from</summary>

| Number | How I got it |
|---|---|
| 2.74 mm (2.52 for the kitten) | The physics base with no correction draws the four test drawings on the real arm (pen press 1.5 mm, 20 mm/s). RMS of tablet minus plan at the same moment, mean of the four. Measured |
| 1.057 mm | The frozen head draws the same four drawings, in the control block of a baseline, new, baseline test. Measured. Two earlier blocks an hour apart gave 1.03 and 1.14 mm: the same controller drifts by about 0.1 mm |
| 2.27 mm, 1.14 to 1.15 mm | PhysR, and two neural-network corrections played back, on the same four drawings. Measured |
| 2.22 mm | The 2.74 mm runs, recomputed with the tracking error set to zero, so the error is $u$ alone. Offline |
| 61 %, and the other shares | Parts of $e = u + tr + c$ fitted on 44 recorded runs of 10 motions, each fit tested on a motion left out. Offline fits on Measured logs |
| 267 ms | The median delay of the pan after 46 goal reversals in the uncorrected runs. Measured |
| Pan dead band against $P$ | Direct holds of the pan from older logs, at four values of the servo gain register $P$. Measured |
| 1.131, 1.029, 1.008 mm | Models fitted on the search motions and scored once on four held-out motions, with a frozen scorer that predicts the nib error from logged runs. Offline |
| 0.847 mm | The same scorer, on the motions that the network trained on. Offline, in-sample |
| Learning curve | Models retrained on 3 to 12 motions and scored on held-out motions. Offline |
| Whole-path planning, at most 5 % | A software copy of the arm built from my model of it, which favors the planner. Simulation |

</details>

## Check yourself

Each question gives all the facts it needs. The reasoning is in the drawer.

**Question 1.** The pan axis is 231 mm from the pen. One pan tick is 1.534 mrad. How far does one tick move the pen?

- A. 0.0015 mm
- B. 0.354 mm
- C. 3.54 mm

<details>
<summary>Answer</summary>

B. Arc length = radius × angle = 231 mm × 0.001534 = 0.354 mm. A drops the lever (1.534 mrad is 0.0015 rad), and C is off by a factor of 10.

</details>

**Question 2.** A controller has an error of 2.74 mm. With perfect servo tracking it would be 2.22 mm. Can a better torque model reach 1.0 mm?

- A. Yes, the model can remove all of the error.
- B. No, a torque model acts on tracking only, and 2.22 mm is left.
- C. Yes, if the score noise is 0.12 mm.

<details>
<summary>Answer</summary>

B. With $tr = 0$, the error is $u = 2.22$ mm. The encoders cannot see $u$, and a torque model acts only on tracking. A forgets $u$. C compares a 0.12 mm noise with a 1.2 mm gap.

</details>

**Question 3.** A controller measures 1.057 mm, and an hour later 1.14 mm on the same drawings. A new controller scores 1.00 mm in one run. Is it better?

- A. Yes, 1.00 is below 1.057.
- B. Not shown. Run baseline, new, baseline and compare.
- C. No, the second baseline run was 1.14.

<details>
<summary>Answer</summary>

B. The same controller moved by 0.08 mm on its own, more than the 0.057 mm gain. A baseline, new, baseline order puts the drift on both sides of the new run. C compares the wrong numbers: the new run is 1.00, not 1.14.

</details>

**Question 4.** A servo makes torque $P \times e$. A joint with stiction starts to move only when this torque beats a breakaway torque $T$. A second joint has a backlash gap of 3 mrad. You double $P$.

- A. Both effects halve.
- B. The stiction dead zone $T/P$ halves, and the backlash gap stays 3 mrad.
- C. Neither effect changes.

<details>
<summary>Answer</summary>

B. The dead zone is $e = T/P$. A gap is an angle that the gears fix. This is why the dead band table points to friction. A real joint can have both, so the drop is then partial.

</details>
