---
title: 'A pen holder that shows the arm’s error, not its own'
description: 'I want to see my SO-101 trajectory errors as ink on paper. For that, the pen must not add an error of its own. Here is the holder I designed, the lever rule behind it, and the numbers I will test after I print it this weekend.'
date: '2026-10-05'
draft: false
---

I want to make my SO-101 arm follow a path more accurately. For that, I need a way to see whether a change makes the path better or worse. Joint logs give me numbers, but numbers are easy to fool myself with. So I had an idea: put a pen on the arm and let it draw. When the arm leaves the path, the drawing goes wrong, and anyone can see it.

Today the pen is strapped into the gripper with tape. The gripper is taped shut, and its motor is off. It draws, but it raises a problem: the drawing shows the error of the arm plus the error of the strap. When the paper pulls on the tip, the pen moves in the strap. And I do not know exactly where the tip is. My best fit puts it about 110 mm from the gripper, with a 3.0 mm residual. That is larger than the error I want to see, which is 1.75 mm across the path.

So the question of this article is simple: **how do I hold a pen on the SO-101 so that the ink shows the arm's error, and not the holder's?**

## What the holder must do

I wrote the requirements before I looked for a design. Each one removes one source of error that is not the arm:

| Requirement | Goal | Why |
|---|---|---|
| Rigid sideways | under 0.1 mm of play at 0.5 N | The paper drag must not move the pen in the holder. |
| Keyed | under 0.2 mm spread over 10 reinsertions | After I change the pen, it must go back to the same place. |
| Tip set by construction | the tip on the wrist_roll axis | The model must know the tip position without a 3 mm guess. |
| One sleeve for each pen | an ink pen and a Wacom pen | I also want a drawing tablet under the pen later. A Wacom tablet senses only its own pen. |
| Free up and down, by gravity | the pen rests on the paper by its own weight | The paper is not flat, and the arm height is not exact. |
| Light | near the mass of the present pen and strap | Each 10 g at the end of the arm changes the shoulder sag by 2 to 4 mrad. |

Why gravity and not a spring for the vertical motion? A spring and the moving pen make a mass on a spring. With a light pen, I estimate that this system vibrates at about 4 to 8 Hz. That is inside the frequencies at which the arm draws. With gravity, the force on the paper is the weight of the moving part, and it stays the same at any height. This is what pen plotters such as the AxiDraw do.

I searched GitHub, the official SO-ARM100 repository, Printables, Thingiverse, MakerWorld, Cults3D and the LeRobot forum. I found grippers and camera mounts, but no pen holder for the SO-100 or the SO-101. So I designed one.

## The design

![The pen holder on the SO-101 gripper, front and side views](/assets/robotics/so101-pen-holder/assembly.png "The holder on the gripper. Blue: the bracket that clamps on the fixed finger. Red: the carriage that slides up and down. Green: the sleeve for the pen. Yellow, transparent: the vendor gripper. The thin black line is the wrist_roll axis.")

The holder has three printed parts and a few metal parts:

- a **bracket** that clamps onto the fixed finger of the gripper;
- a **carriage** that slides up and down on two steel shafts;
- a **sleeve** for each pen, which goes into the carriage.

The gripper stays on the arm. I can take the holder off in a few minutes.

### The pen goes on the roll axis

The last joint of the arm turns the gripper about its own axis (wrist_roll). If the tip is on that axis, two good things happen. The tip position has only one unknown, its distance along the axis. And the drag of the paper cannot turn that joint.

I checked the space with the gripper's CAD meshes. A pen-sized cylinder on the roll axis is free between the fingers, up to the gripper motor. The longest pen is 145 mm and the pen needs 12 mm of travel. So the tip hangs about 92 mm below the end of the finger.

I also looked at a pen beside the gripper, 32 mm off the axis. That puts the tip 36 mm higher, but it gives the drag a lever on the roll joint and puts the mass off center. The on-axis layout also puts the tip 161 mm from the nearest motor magnet, which is good for the tablet.

### The lever rule

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

In my design, L = 40 mm and d = 21.5 mm, so the factor is 2.08. The pen length and the end of the finger limit L. The travel limits d, because the bracket must stay above the paper when the carriage is fully up.

The clearance is the number that matters most. With inch-size parts (1/8 in stainless rod and standard bronze bushings), c is 0.025 to 0.064 mm, so the tip moves 0.06 to 0.14 mm. That can fail my 0.1 mm goal. With 3 mm ground metric shafts (tolerance class g6) and sized bushings, c is 0.004 to 0.020 mm. The tip then moves 0.016 to 0.049 mm, including the bending of the plastic parts.

<details>
<summary>Where the formula comes from</summary>

Put the carriage axis on a line. When a side force F pushes the tip to the right, the carriage turns until it touches the left wall at the upper bushing and the right wall at the lower bushing. Each contact is c/2 from the center line, and the two contacts are L apart. So the carriage tilts by c / L. The lower bushing center is c/2 to the right, and the tip is d further down. So the tip is at c/2 + d c / L to the right. When the force reverses, the tip is at the same distance to the left. The difference is c (1 + 2d / L).

The elastic terms are much smaller. The plastic neck of the bracket at the end of the finger bends by about 0.003 mm, peak to peak, at ±0.5 N. I calculated it from the real cross-section of the part. The pen bends by about 0.004 mm below its lower support, and the steel shafts by 0.001 mm. Before I added two struts beside the end of the finger, the neck alone gave 0.03 mm.

</details>

### The writing forces

Three forces act on the tip, and the design gives each one a short path:

- **The push on the paper** is the weight of the moving part: 23 to 27 g, so 0.22 to 0.26 N. It does not change with the arm height. The Wacom pen registers contact at 1 g, so 26 g is well inside its range.
- **The drag of the paper** goes into the lower bushing, 21.5 mm above the tip, and then through the steel shafts into the bracket.
- **The moving jaw** is free, because its motor is off. If it touched the pen, it could push the pen. So the jaw closes on a stop pad of the bracket, and a rubber band holds it there.

### The clamp

The bracket slides up onto the fixed finger from below. Its pocket has the exact shape of the finger, from the vendor CAD mesh. The finger gets narrower toward its end, so the pocket fits like a wedge. Two M2 bolts go through two small holes that are already in the finger, drilled out from 1.5 mm to 2.2 mm. The two bolts are 20 mm apart, so the clamp also uses the lever rule.

### The sleeve: a V and a screw

A round pen in a round hole always has a gap. Instead, each sleeve has a V-groove inside, at two heights. A nylon thumbscrew on the other side pushes the pen into the V. A round part in a V touches it on two lines, so it can sit in only one place. The sleeve goes into the carriage in the same way, with a V in the carriage.

The V of a sleeve centers one diameter exactly. So I made one sleeve for each pen: the Wacom Pen 4K, a Pilot V5 rollerball and a BIC 4-colour. I also made one adjustable sleeve for any round pen from 8 to 12.2 mm. A thinner pen sits deeper in the V, so its tip moves a known distance off the axis. A short script calculates that offset from two caliper readings.

![Exploded view of the holder](/assets/robotics/so101-pen-holder/exploded.png "From left to right: the bracket with the two shafts, the carriage, and the sleeve with the pen.")

## The cost: mass

The design is not light. The total is about 63 to 67 g with the pen. The present pen with its strap and tape is maybe 17 g, but I have not weighed it yet. Most of the added mass is the price of the rigidity: 11 g for the shafts and the bushings, and 31 g for the printed bracket.

By my earlier rule (10 g changes the shoulder sag by 2 to 4 mrad), the holder can change the sag by 10 to 20 mrad. That is large, but the holder is a known mass at a known place. So I will weigh it, put it in the model, and treat it as a new setup. I will not compare it directly with the old strapped-pen runs.

<details>
<summary>How I built the design</summary>

The design is one Python script with build123d and manifold3d. It reads the vendor gripper meshes, cuts the finger pocket, builds every part from parameters, and checks for collisions:

- the bracket against the fixed jaw and the jaw motor;
- the carriage against the bracket at three heights;
- each pen at full lift against the gripper.

The same script writes the STL and STEP files, the mass of each part, and a MuJoCo model snippet with the new masses and the tip position.

The first versions failed in useful ways. One bracket weighed 64 g. In another, the moving jaw closed onto the pen. A third cut away its own stop pad, because I swept the finger pocket in the wrong direction.

</details>

## What I will test

I will print the holder this weekend at HICAM, a manufacturing center in East Austin. First I print a small test coupon to tune the hole sizes on their printer. Then I do these tests:

1. **Play:** a 51 g weight pulls the pen to each side, and a dial indicator reads the tip. Goal: under 0.1 mm.
2. **Reinsertion:** I take the pen out and put it back 10 times, and make a dot each time. I scan the dots. Goal: under 0.2 mm spread.
3. **Free slide:** the carriage must fall freely, and the force on a scale must be the same going up and going down.
4. **Contact:** I replay one motion in the air and one on the paper. If the joint errors are the same, the vertical slide is not necessary.
5. **Tip on the axis:** I turn only the roll joint with the pen on the paper. The tip draws a small arc, and its radius is the tip distance from the axis.

I do the first three tests on the bench, with a printed copy of the finger in a vise, so the arm does not move.

The numbers in this article are design values. None of them is measured yet. In the next post I will show the measured play and the first drawings, and whether the ink makes the arm's errors as obvious as I hope.
