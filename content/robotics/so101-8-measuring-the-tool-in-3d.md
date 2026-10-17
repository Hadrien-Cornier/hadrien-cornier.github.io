---
title: "How do I get the XYZ position of my robot's tool tip?"
description: 'A drawing tablet measures a pen in a plane. Cameras, marker tracking, and laser trackers extend the view into space, with different costs and sources of error.'
date: '2026-10-15'
updated: '2026-10-16'
draft: true
series: 'From policy to action: the last mile of robotics control'
part: 8
---

How do I get the precise x, y, and z coordinates of the tip of my robot's gripper?

I ask because I use an SO-101, a small robot arm, to build a smooth, precise controller, which is the program that turns a desired path into motor commands. I call it the drawing arm project, but drawing is only one showcase. The real goal is a controller that also works in space, and this post is about generalizing away from the XY plane. Right now the gripper holds a pen, and a Wacom drawing tablet, a flat sensor that reports where a pen touches it, measures the tip of that pen, called the nib. The tablet gives me x and y along its surface. What it can't give me is z, the height above that plane, so that is the question.

## Why measure the tip in space?

The path of the tip shows what a change to the controller does to the motion. On the tablet, that tells me how well the arm draws. But the arm should also carry a tool above the table, and free-space measurements can show whether corrections learned while drawing still help there. They also give me data to build a model of how the arm moves.

The arm already reports something about its own pose, because its encoders, the sensors that read each joint angle, give me those angles. The catch is that the arm can bend between a joint and the tip, and that bending changes the path. So I want an outside reference that measures the result of the whole chain, including the tool holder.

## Three ways to measure in space

A friend who works on robots described three routes, and each one extends the measurement beyond the tablet plane in a different way. The first uses a camera that locates a ChArUco board, a checkerboard with coded markers. The second puts markers on the arm and tracks them with sweeping base stations or with infrared motion-capture cameras. The third uses a laser tracker that follows a reflector.

### A camera and a ChArUco board

The codes on a ChArUco board tell the camera which part of the pattern it is looking at, and the corners and the known square size give it geometric reference points. Once the camera is calibrated, which means relating image coordinates to rays in space, a known target lets me estimate its position and orientation. [OpenCV ChArUco guide](https://docs.opencv.org/4.x/df/d4a/tutorial_charuco_detection.html)

In practice, a board beside the tablet sets a reference frame, and a target attached to the tool moves with it. The relation between that target and the nib is fixed, so the target pose turns into a nib position. Using several calibrated views adds a triangulation baseline and helps keep the target visible as the arm moves. Higher image resolution puts more samples across the target, but the geometry matters too: lateral movement shifts the pattern across the image, while depth changes its apparent scale. That makes depth sensitive to target size, viewing angle, and lens calibration.

For a small arm, the tablet and a calibrated camera play complementary roles. The tablet gives a direct reference while drawing, and the camera adds a view above the surface. A phone such as the Pixel makes this route accessible without a dedicated motion-capture installation.

### Markers and base stations or motion-capture cameras

The second route follows markers on the arm. Sweeping base stations send infrared laser scans across photodiodes on a tracker, and the system combines these observations with inertial measurements to estimate the tracker's position and orientation. Infrared motion capture works differently: cameras observe reflective markers and triangulate their positions, and a rigid cluster of non-collinear markers gives the orientation of the tool as well. [SteamVR study](https://doi.org/10.3390/s23020725), [OptiTrack marker tracking](https://www.optitrack.com/cameras/primex-13)

Static and moving accuracy can differ substantially here. Root mean square error (RMSE) gives large misses more weight than small ones, and the SteamVR study's four-station setup reached [0.574 mm aggregate RMSE at 12.5 mm/s, rising to 4.237 mm at 50 mm/s](https://doi.org/10.3390/s23020725). The dynamic result matters for a moving tool, even when a stationary tracker looks stable.

Placement matters too. Markers near the tool measure its motion, while markers on separate arm links can also reveal where bending occurs. Where I put them determines which part of the mechanical chain the measurement includes.

### A laser tracker

A laser tracker combines a distance measurement with angular encoders to locate a reflector, so the result is the reflector center in space. A dedicated pose target adds orientation, which matters when the reflector is offset from a rotating tool tip. [Hexagon tracker specifications](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf)

This is industrial dimensional measurement equipment. Its appeal is an independent metric reference with tight specified error bounds, and the target and its mounting geometry are part of the measurement system.

## Comparing the systems

To compare these systems fairly, a few terms need defining. Rate counts samples per second. Latency is the time from a physical motion to a usable sample in the program. Mean absolute error (MAE) averages the size of the errors, and RMSE, as above, gives large misses more weight. A tolerance or maximum permissible error states a bound under specified conditions. The table puts the Wacom tablet next to the three routes.

| System | Accuracy evidence | Rate | Latency | Working area or volume | Position and orientation | Cost and setup |
| --- | --- | --- | --- | --- | --- | --- |
| Wacom Intuos S | [±0.25 mm digital accuracy tolerance](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html) | [133 reports/s maximum](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html) | No host-chain figure in the cited specifications | [152 × 95 mm active plane](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html) | Pen x and y, pressure, proximity | Already in this setup; fix the tablet pose and map its coordinates |
| High-resolution camera with ChArUco | An [omnidirectional calibration rig reported 1.32 mm translation MAE](https://doi.org/10.3390/electronics7120421) | Pixel video supports [up to 60 frames/s](https://support.google.com/pixelcamera/answer/7064897), depending on model and mode | Capture, processing, and transfer all contribute; no end-to-end figure in the cited sources | Set by field of view, target size, and visible corners | Target position and orientation; a calibrated offset gives the nib position | Existing phone plus a [printed target](https://docs.opencv.org/4.x/df/d4a/tutorial_charuco_detection.html) or [rigid board](https://calib.io/collections/products/products/charuco-targets?variant=9400454905903); requires lens calibration, mounting, and timing alignment |
| Sweeping base stations: SteamVR Tracking | With four stations: [0.155 mm static translation RMSE; 2.164 mm dynamic aggregate RMSE at 25 mm/s](https://doi.org/10.3390/s23020725) | [100 Hz tracker stream](https://doi.org/10.3390/s23020725) in that study | Tracker-to-program delay not established by that study | Reported coverage [up to 10 × 10 m with four stations](https://doi.org/10.3390/s23020725) | Tracker position and orientation; calibrated offset to the nib | [US$149 tracker; US$229 per station](https://shop-us.vive.com/collections/accessories), plus mounts and a compatible host; requires frame registration |
| Infrared motion capture: OptiTrack PrimeX | PrimeX 13: [±0.3 mm typical position accuracy](https://www.optitrack.com/cameras/primex-13/specs) | [240 Hz at full resolution](https://www.optitrack.com/cameras/primex-13/specs) | [4.2 ms listed camera latency](https://www.optitrack.com/cameras/primex-13/specs) | Vendor accuracy context: [9 × 9 m tracking area](https://www.optitrack.com/cameras/primex-13); camera overlap defines the usable volume | Marker positions; a rigid marker cluster supplies orientation | [System quote required](https://www.optitrack.com/cameras/primex-13/buy); cameras, network, software, and calibration equipment |
| Laser tracker: Leica AT960 | [±(0.015 + 0.006L) mm](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf) maximum permissible error, with distance L in meters | [1,000 Hz output](https://nexus.hexagon.com/home/product/laser-trackers-at960/) | No application-delay figure in the cited specifications | AT960-MR: [40 m diameter for reflector position; 20 m with the pose accessory](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf) | Reflector center position; a dedicated target adds orientation | [System quote required](https://nexus.hexagon.com/home/product/laser-trackers-at960/); instrument, target, software, and frame registration |

## From the sensor target to the nib

None of these systems reports the nib directly. Each one tracks something near it, so I need the geometric relation between what the system sees and the point I care about. If the target position is $t$, its rotation is $R$, and the nib offset in target coordinates is $r$, then

$$
p_{\text{nib}} = t + Rr.
$$

An orientation error rotates that offset and shifts the estimated nib position, so a target close to the nib reduces this lever arm. Timing has a similar effect: a delayed sample describes where the tool was, so speed turns delay into apparent path error.

## Limits

- **Camera depth is the weakest point of the accessible route.** Image resolution alone does not establish depth accuracy, and lens calibration, rolling shutter, occlusion, target orientation, and holder flex all affect the result. The ChArUco paper measured a different calibration rig than a Pixel tracking this arm.
- **The reference point and the error metric matter.** The tablet has its own tolerance and supplies no calibrated height or tilt. Camera and tracker figures apply to their targets, and a rigid offset cannot account for flex between target and nib. Accuracy, repeatability, and the table's error metrics describe different properties.
- **The quoted conditions differ.** SteamVR results include coordinate and sample-rate post-processing. OptiTrack's product page and [family sheet, which lists ±0.2 mm](https://optitrack-documents.s3.us-west-2.amazonaws.com/primex-family-spec-sheet-26.01.16.pdf), differ. Leica's bound uses specified precision reflectors. None of these figures establishes nib accuracy on this arm.
- **Rate is not latency.** OptiTrack's listed camera latency excludes the rest of the application, and the other cited sources do not establish end-to-end delay for the complete recording chains. Tracking volume also depends on visibility, and component prices exclude a complete installation.

## Which route fits a small arm?

For a small arm like the SO-101, a calibrated camera is an accessible route from the drawing plane to space. A phone already provides the images, and coded targets supply a geometric reference. The tablet stays useful because it measures the pen directly on the surface.

Sweeping base stations provide wider coverage with compact tracking hardware, but their dynamic error matters for precise paths. Optical motion capture adds synchronized views and rigid-body tracking at the cost of a dedicated installation. A laser tracker fits work that needs an independent dimensional reference. In the end, the choice follows the motion, the point being measured, and the conditions behind each accuracy figure.
