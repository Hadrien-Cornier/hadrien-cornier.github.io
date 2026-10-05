---
title: 'A pen holder that shows the arm’s error, not its own'
description: 'I want to see my SO-101 trajectory errors as ink on paper. For that, the pen must not add an error of its own. Here are the two holders I designed, every way to hold the pen that I compared, and the numbers I will test after I print the second design this weekend.'
date: '2026-10-05'
draft: false
series: 'From policy to action: the last mile of robotics control'
part: 5
track: hardware
---

This is the hardware part of the series. [Parts 1 to 4](/robotics/so101-1-target-and-goal/) measure the arm's error in joint angles. This part builds the tool that will show the same error as ink on paper.

I want to make my SO-101 arm follow a path more accurately. For that, I need a way to see whether a change makes the path better or worse. Joint logs give me numbers, but numbers are easy to fool myself with. So I had an idea: put a pen on the arm and let it draw. When the arm leaves the path, the drawing goes wrong, and anyone can see it.

Today the pen is strapped into the gripper with tape. The gripper is taped shut, and its motor is off. It draws, but it raises a problem: the drawing shows the error of the arm plus the error of the strap. When the paper pulls on the tip, the pen moves in the strap. And I do not know exactly where the tip is. My best fit puts it about 110 mm from the gripper, with a 3.0 mm residual. That is larger than the error I want to see, which is 1.75 mm across the path.

So the question of this article is simple: **how do I hold a pen on the SO-101 so that the ink shows the arm's error, and not the holder's?**

## What the holder must do

I wrote the requirements before I looked for a design. Each one removes one source of error that is not the arm:

| Requirement | Goal | Why |
|---|---|---|
| Rigid sideways | under 0.1 mm of play at 0.5 N | The paper drag must not move the pen in the holder. |
| Keyed | under 0.2 mm spread over 10 reinsertions | After I change the pen, it must go back to the same place. |
| Tip set by construction | the tip at a known point, near the wrist_roll axis | The model must know the tip position without a 3 mm guess. |
| One sleeve for each pen | an ink pen and a Wacom pen | I also want a drawing tablet under the pen later. A Wacom tablet senses only its own pen. |
| Free up and down, by gravity | the pen rests on the paper by its own weight | The paper is not flat, and the arm height is not exact. |
| Light | near the mass of the present pen and strap | Each 10 g at the end of the arm changes the shoulder sag by 2 to 4 mrad. |

Why gravity and not a spring for the vertical motion? A spring and the moving pen make a mass on a spring. With a light pen, I estimate that this system vibrates at about 4 to 8 Hz. That is inside the frequencies at which the arm draws. With gravity, the force on the paper is the weight of the moving part, and it stays the same at any height. This is what pen plotters such as the AxiDraw do.

I searched GitHub, the official SO-ARM100 repository, Printables, Thingiverse, MakerWorld, Cults3D and the LeRobot forum. I found grippers and camera mounts, but no pen holder for the SO-100 or the SO-101. So I designed one. Then I designed it again.

## The parts that every design shares

Each holder has three printed parts and a few metal parts:

- a **bracket** that clamps onto the fixed finger of the gripper;
- a **carriage** that slides along the pen on two steel shafts;
- a **sleeve** for each pen, which goes into the carriage.

The gripper stays on the arm. I can take the holder off in a few minutes.

### The lever rule for the guide

The carriage slides on two shafts through bronze bushings. A bushing must be a little larger than its shaft, or the carriage cannot slide. That small gap is the clearance, c. When the paper drag pushes the tip to the right, the carriage moves across the clearance and tilts. When the drag reverses, it tilts the other way.

![How the bushing span sets the tip play](/assets/robotics/so101-pen-holder/lever.png "The carriage touches opposite walls at the two bushings. The clearance is drawn 250 times larger than it is.")

The tilt is the clearance divided by the span between the two bushings, L. The tip is a distance d below the lower bushing, so the tilt moves the tip again. When the drag reverses, the tip moves by:

$$
\Delta_{tip} = c \left(1 + \frac{2d}{L}\right)
$$

This is the lever effect, and it gives three rules:

1. Make the span L long.
2. Make the overhang d short.
3. Make the clearance c small.

In my design, L = 40 mm and d = 21.5 mm, so the factor is 2.08. The clearance is the number that matters most. With inch-size parts (1/8 in stainless rod and standard bronze bushings), c is 0.025 to 0.064 mm, so the tip moves 0.06 to 0.14 mm. That can fail my 0.1 mm goal. With 3 mm ground metric shafts (tolerance class g6) and sized bushings, c is 0.004 to 0.020 mm. The tip then moves 0.016 to 0.049 mm.

<details>
<summary>Where the formula comes from</summary>

Put the carriage axis on a line. When a side force F pushes the tip to the right, the carriage turns until it touches the left wall at the upper bushing and the right wall at the lower bushing. Each contact is c/2 from the center line, and the two contacts are L apart. So the carriage tilts by c / L. The lower bushing center is c/2 to the right, and the tip is d further down. So the tip is at c/2 + d c / L to the right. When the force reverses, the tip is at the same distance to the left. The difference is c (1 + 2d / L).

For the first design I also calculated the bending of the plastic. The neck of the bracket at the end of the finger bends by about 0.003 mm at ±0.5 N, the pen by about 0.004 mm, and the steel shafts by 0.001 mm. I have not yet done this calculation for the second bracket.

</details>

### The sleeve: a V and a screw

A round pen in a round hole always has a gap. Instead, each sleeve has a V-groove inside, at two heights. A nylon thumbscrew on the other side pushes the pen into the V. A round part in a V touches it on two lines, so it can sit in only one place. The sleeve goes into the carriage in the same way, with a V in the carriage.

The V of a sleeve centers one diameter exactly. So I made one sleeve for each pen: the Wacom Pen 4K, a Pilot V5 rollerball and a BIC 4-colour. I also made one adjustable sleeve for any round pen from 8 to 12.2 mm. A thinner pen sits deeper in the V, so its tip moves a known distance. A short script calculates that offset from two caliper readings.

### The writing forces

Three forces act on the tip, and the design gives each one a short path:

- **The push on the paper** is the weight of the moving part: 23 to 27 g, so 0.22 to 0.26 N. It does not change with the arm height. The Wacom pen registers contact at 1 g, so 26 g is well inside its range.
- **The drag of the paper** goes into the lower bushing, 21.5 mm above the tip, and then through the steel shafts into the bracket.
- **The moving jaw** is free, because its motor is off. If it touched the pen, it could push the pen. So the jaw closes on a stop pad of the bracket, and a rubber band holds it there.

## First design: the pen on the roll axis

The last joint of the arm turns the gripper about its own axis (wrist_roll). My first idea was to put the pen on that axis, between the fingers. The tip position then has only one unknown, its distance along the axis, and the drag of the paper cannot turn that joint.

![Design 1 on the SO-101 gripper, front and side views](/assets/robotics/so101-pen-holder/assembly.png "Design 1. Blue: the bracket that clamps on the fixed finger. Red: the carriage. Green: the sleeve. Yellow, transparent: the vendor gripper. The thin black line is the wrist_roll axis.")

The pen is 145 mm long and must fit below the jaw motor, so the tip hangs 196 mm below the gripper origin. The bracket slides up onto the fixed finger from below. Its pocket has the exact shape of the finger, from the vendor CAD mesh, and two M2 bolts go through two small holes that are already in the finger.

The design passed every collision check on the gripper alone. Then I put it on the full arm model.

### What the full arm showed

![Design 1 on the full arm, with the base on a riser](/assets/robotics/so101-pen-holder/design1-on-arm.png "Design 1 on the full SO-101 model. The pen is vertical and the tip touches the paper 200 mm in front of the base. The base must sit on a riser.")

Two problems appeared.

First, the arm cannot reach paper that is level with its base. With the wrist pointing down and a tip 196 mm out, the wrist_flex joint reaches its limit. The paper must be at least 30 mm below the base, so the base needs a riser.

Second, the long tip makes every joint error bigger on the paper. A joint error moves the tip by the error times a lever:

- For a joint that turns about a horizontal axis (shoulder_lift, elbow_flex and wrist_flex), the lever on the paper is the height of that joint above the tip.
- For shoulder_pan, the lever is the reach.
- For wrist_roll, the lever is the distance of the tip from the roll axis.

With the wrist vertical above a long pen, the wrist and the elbow sit high above the paper, so their levers are long. At 240 mm from the base, 1 mrad of error on every joint moves the tip of design 1 by 0.42 mm along the reach.

The rule also has a limit. The shoulder_lift lever is the shoulder height above the paper, and the shoulder_pan lever is the reach. No holder changes them. A holder can shorten only the elbow, wrist_flex and wrist_roll levers.

## Every way to hold the pen

So I compared every way that I could find to attach the pen. For each one, a script finds the tip position nearest to the gripper that keeps the fingers above the paper and the pen clear of the gripper. Then it maps where the arm can reach the paper with the pen vertical, and it calculates the tip error for 1 mrad on every joint.

![Seven ways to attach the pen, with a close-up, the arm in a drawing pose, and the reach map of each](/assets/robotics/so101-pen-holder/all-layouts.png "Each row is one layout: a close-up, the arm in a drawing pose (the red circle on the map), and the region where the pen can draw. The color is the tip error along the reach for 1 mrad on every joint. Gray: the arm cannot reach. The pens and the brackets in these renders are simple shapes.")

The table compares the layouts at 240 mm from the base, with the paper level with the base:

| Layout | How the pen attaches | Tip to the pinch | Tip error per mrad |
|---|---|---|---|
| A | Design 1: on the roll axis, through the gripper | 94 mm | cannot reach |
| B0 | Beside the gripper, fully parallel | 42 mm | 0.31 mm |
| Sy10 | Beside the fingers, tilted 10° out of the open side of the jaws | 30 mm | 0.32 mm |
| Sy20 | Beside the fingers, tilted 20° out of the open side of the jaws | 22 mm | 0.31 mm |
| Sx20 | Beside the fixed finger, tilted 20° over its back | 35 mm | cannot reach |
| P60 | Through the pinch, tilted 60° | 68 mm | 0.26 mm |
| H | Like a hand: gripper horizontal, pen across the jaws | 43 mm | cannot reach |

The "pinch" is the point between the two fingertips, where the gripper holds an object.

This comparison taught me four things:

1. **The tip cannot be at the pinch.** The fingers extend past it, so they would touch the paper first.
2. **The hand layout has the shortest levers, but it cannot reach.** With the gripper horizontal, the joint limits let the pen touch the paper only far from the base, and only if the paper is above the base.
3. **A tip near the pinch is not the same as a short lever.** Sy20 has its tip nearest to the pinch, but the gripper stays almost vertical, so the wrist stays high. P60 tilts the gripper down and has shorter levers, but it covers less paper and puts the tip 59 mm off the roll axis.
4. **The direction of the tilt matters.** A pen that leans over the fixed finger (Sx20) needs the wrist to roll almost half a turn, past the joint limit.

I chose Sy20. It reaches the largest area of paper, it needs no riser, and its tip stays near the roll axis, so a wrist_roll error barely moves it.

## Second design: the pen beside the fingers

In design 2, the pen runs beside the fingers and leans 20° out through the open side of the jaws. The carriage, the sleeves, the shafts and the bushings are the same parts as in design 1. Only the bracket is new.

![Design 2 on the gripper, from four sides](/assets/robotics/so101-pen-holder/design2-gripper.png "Design 2 on the vendor gripper, from the front, the side, three-quarters and below. Blue: the bracket. Purple: the carriage. Black: the pen. On the arm, the gripper tilts so that the pen is vertical.")

![Design 2 on the full arm, drawing at the base level](/assets/robotics/so101-pen-holder/design2-on-arm.png "Design 2 on the full SO-101 model, with the pen vertical on paper level with the base, 240 mm in front of it.")

The first version of the new bracket failed its checks in two ways:

- The carriage hit both fingertips. I moved the whole guide 6 mm out of the jaws. With a 4 mm move, the parts still touched. With 5 mm, they touched by a fraction of a cubic millimeter.
- The spine that holds the top plate was too thin: one cross-section was only 41.6 mm². I made the spine 6 × 18 mm, and the thinnest section is now 108 mm².

![Design 2 construction sheet: exploded view and each printed part](/assets/robotics/so101-pen-holder/design2-construction.png "Left: the exploded view, in assembly order. Right: each printed part in 3D, from two sides, with its mass.")

The table compares the two designs:

| | Design 1 | Design 2 |
|---|---|---|
| Tip position | on the roll axis, 196 mm out | 6 mm off the roll axis, 22 mm past the pinch |
| Paper at the base level | cannot reach | reaches |
| Tip error per mrad, 240 mm out, base on a 60 mm riser | 0.42 mm | 0.38 mm |
| Tip error per mrad, 240 mm out, paper at the base level | cannot reach | 0.31 mm |
| Fixed mass (bracket, shafts, bolts) | 40.3 g | 33.1 g |
| Total mass with a pen | 63 to 67 g | 56 to 60 g |

### Different pens

The pens are not the same size, so I checked each sleeve and each pen over the full 12 mm travel of the carriage. In the adjustable sleeve, a thinner pen sits deeper in the V. In design 2 the V faces the gripper, so a thin pen moves toward the gripper:

| Pen | Barrel diameter | Tip off the roll axis | Clear over the full travel |
|---|---|---|---|
| Wacom Pen 4K | 12.0 mm | 6.0 mm | yes |
| Pilot V5 | 10.6 mm | 6.0 mm | yes |
| BIC 4-Colour | 11.0 mm (11.6 mm maximum) | 6.0 mm | yes |
| Adjustable sleeve, 12 mm pen | 12.0 mm | 6.0 mm | yes |
| Adjustable sleeve, 10 mm pen | 10.0 mm | 4.7 mm | yes |
| Adjustable sleeve, 8 mm pen | 8.0 mm | 3.3 mm | yes |

Every pen stays at least 5.8 mm away from the gripper. The smallest gap is 1.2 mm, between an 8 mm pen and the hole in the top plate of the bracket. A first version of that hole left only 0.2 mm, so I made it larger.

<details>
<summary>How I built the designs</summary>

Each design is one Python script with build123d and manifold3d. The script reads the vendor gripper meshes, cuts the finger pocket, builds every part from parameters, and checks for collisions:

- the bracket against the fixed jaw and the jaw motor, also along the path where it slides onto the finger;
- the carriage and each sleeve against the bracket and the gripper at the bottom, the middle and the top of the travel;
- each pen over the full travel against the gripper and the bracket.

The same script writes the STL files, the mass of each part, and the tip position. A second script poses the full MuJoCo arm model to compare the layouts.

The checks also found errors in my own tools. A collision test that used only the corners of the meshes let a pen pass through a flat face of the gripper, and it made one layout look much better than it was. I replaced it with a test against the surfaces.

</details>

## What I will test

I will print design 2 this weekend at HICAM, a manufacturing center in East Austin. First I print a small test coupon to tune the hole sizes on their printer. Then I do these tests:

1. **Play:** a 51 g weight pulls the pen to each side, and a dial indicator reads the tip. Goal: under 0.1 mm.
2. **Reinsertion:** I take the pen out and put it back 10 times, and make a dot each time. I scan the dots. Goal: under 0.2 mm spread.
3. **Free slide:** the carriage must fall freely along the tilted shafts, and the force on a scale must be the same going up and going down.
4. **Contact:** I replay one motion in the air and one on the paper. If the joint errors are the same, the vertical slide is not necessary.
5. **Tip position:** I turn only the roll joint with the pen on the paper. The tip draws a small arc. Its radius should be the 6 mm offset.

I do the first three tests on the bench, with a printed copy of the finger in a vise, so the arm does not move.

The numbers in this article are design values from CAD and the arm model. None of them is measured yet. In the next post I will show the measured play and the first drawings, and whether the ink makes the arm's errors as obvious as I hope.
