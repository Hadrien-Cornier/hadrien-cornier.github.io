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

I use an SO-101, a small robot arm, to develop a smooth, precise controller: a program that turns a desired path into motor commands. I call this the drawing arm project, but drawing is one showcase for a controller that should also work in space. The gripper holds a pen; a Wacom drawing tablet, a flat position sensor, measures its tip, or nib. The tablet reports x and y along its surface, so this post asks how to add z, the height above that plane.

## Why measure the tip in space?

The tip path shows what a controller change does to the motion. That matters when the arm draws, but also when it carries a tool above the table. Free-space measurements can show whether corrections learned while drawing still help elsewhere. They also provide data for a model of the arm's motion.

An encoder is a sensor that reads a joint angle. The arm's encoders report those angles, but bending between a joint and the tip can change the path. An outside reference measures the result of the whole chain, including the tool holder.

A friend who works on robots described three routes. A camera can locate a ChArUco board, a checkerboard with coded markers. Markers on the arm can be tracked by sweeping base stations or infrared motion-capture cameras. A laser tracker can follow a reflector. These routes extend measurement beyond the tablet plane in different ways.

For a small arm, the tablet and a calibrated camera serve complementary roles. The tablet gives a direct reference while drawing. A camera adds a view above the surface. A phone such as the Pixel makes this route accessible without a dedicated motion-capture installation.

## Compare the measurement systems

Rate counts samples per second. Latency is the time from physical motion to a usable sample in the program. Mean absolute error (MAE) averages error magnitude; root mean square error (RMSE) gives large misses more weight; a tolerance or maximum permissible error states a bound under specified conditions.

| System | Accuracy evidence | Rate | Latency | Working area or volume | Position and orientation | Cost and setup |
| --- | --- | --- | --- | --- | --- | --- |
| Wacom Intuos S | [±0.25 mm digital accuracy tolerance](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html) | [133 reports/s maximum](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html) | No host-chain figure in the cited specifications | [152 × 95 mm active plane](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html) | Pen x and y, pressure, proximity | Already in this setup; fix the tablet pose and map its coordinates |
| High-resolution camera with ChArUco | An [omnidirectional calibration rig reported 1.32 mm translation MAE](https://doi.org/10.3390/electronics7120421) | Pixel video supports [up to 60 frames/s](https://support.google.com/pixelcamera/answer/7064897), depending on model and mode | Capture, processing, and transfer all contribute; no end-to-end figure in the cited sources | Set by field of view, target size, and visible corners | Target position and orientation; a calibrated offset gives the nib position | Existing phone plus a [printed target](https://docs.opencv.org/4.x/df/d4a/tutorial_charuco_detection.html) or [rigid board](https://calib.io/collections/products/products/charuco-targets?variant=9400454905903); requires lens calibration, mounting, and timing alignment |
| Sweeping base stations: SteamVR Tracking | With four stations: [0.155 mm static translation RMSE; 2.164 mm dynamic aggregate RMSE at 25 mm/s](https://doi.org/10.3390/s23020725) | [100 Hz tracker stream](https://doi.org/10.3390/s23020725) in that study | Tracker-to-program delay not established by that study | Reported coverage [up to 10 × 10 m with four stations](https://doi.org/10.3390/s23020725) | Tracker position and orientation; calibrated offset to the nib | [US$149 tracker; US$229 per station](https://shop-us.vive.com/collections/accessories), plus mounts and a compatible host; requires frame registration |
| Infrared motion capture: OptiTrack PrimeX | PrimeX 13: [±0.3 mm typical position accuracy](https://www.optitrack.com/cameras/primex-13/specs) | [240 Hz at full resolution](https://www.optitrack.com/cameras/primex-13/specs) | [4.2 ms listed camera latency](https://www.optitrack.com/cameras/primex-13/specs) | Vendor accuracy context: [9 × 9 m tracking area](https://www.optitrack.com/cameras/primex-13); camera overlap defines the usable volume | Marker positions; a rigid marker cluster supplies orientation | [System quote required](https://www.optitrack.com/cameras/primex-13/buy); cameras, network, software, and calibration equipment |
| Laser tracker: Leica AT960 | [±(0.015 + 0.006L) mm](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf) maximum permissible error, with distance L in meters | [1,000 Hz output](https://nexus.hexagon.com/home/product/laser-trackers-at960/) | No application-delay figure in the cited specifications | AT960-MR: [40 m diameter for reflector position; 20 m with the pose accessory](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf) | Reflector center position; a dedicated target adds orientation | [System quote required](https://nexus.hexagon.com/home/product/laser-trackers-at960/); instrument, target, software, and frame registration |

## How a camera gets a position

The codes on a ChArUco board identify visible parts of the pattern. Its corners and known square size give the camera geometric reference points. Calibration relates image coordinates to rays in space. A known target then supports an estimate of its position and orientation. [OpenCV ChArUco guide](https://docs.opencv.org/4.x/df/d4a/tutorial_charuco_detection.html)

A board beside the tablet establishes a reference frame. A target attached to the tool moves with it. The fixed relation between that target and the nib turns the target pose into a nib position. Multiple calibrated views add a triangulation baseline and help maintain visibility as the arm moves.

Higher image resolution puts more samples across the target. The geometry matters too: lateral movement shifts the pattern across the image, while depth changes its apparent scale. This makes depth sensitive to target size, viewing angle, and lens calibration.

## How marker tracking differs

Sweeping base stations send infrared laser scans across photodiodes on a tracker. The system combines these observations with inertial measurements to estimate its position and orientation. Infrared motion capture instead uses cameras to observe reflective markers and triangulate their positions. A rigid cluster of non-collinear markers gives the tool's orientation as well. [SteamVR study](https://doi.org/10.3390/s23020725), [OptiTrack marker tracking](https://www.optitrack.com/cameras/primex-13)

Static and moving accuracy can differ substantially. The SteamVR study's four-station setup reached [0.574 mm aggregate RMSE at 12.5 mm/s, rising to 4.237 mm at 50 mm/s](https://doi.org/10.3390/s23020725). The dynamic result matters for a moving tool even when a stationary tracker looks stable.

Markers near the tool measure its motion. Markers on separate arm links can also reveal where bending occurs. Their placement determines which part of the mechanical chain the measurement includes.

## What a laser tracker measures

A laser tracker combines a distance measurement with angular encoders to locate a reflector. The result is the reflector center in space. A dedicated pose target adds orientation, which matters when the reflector is offset from a rotating tool tip. [Hexagon tracker specifications](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf)

This is industrial dimensional measurement equipment. Its appeal is an independent metric reference with tight specified error bounds. The target and its mounting geometry are part of the measurement system.

## From the sensor target to the nib

All these external systems need a geometric relation to the point of interest. If the target position is $t$, its rotation is $R$, and the nib offset in target coordinates is $r$, then

$$
p_{\text{nib}} = t + Rr.
$$

An orientation error rotates that offset and shifts the estimated nib position. A target close to the nib reduces this lever arm. Timing has a similar effect: a delayed sample describes where the tool was, so speed turns delay into apparent path error.

## Limits

- **Camera depth is the weakest point of the accessible route.** Image resolution alone does not establish depth accuracy. Lens calibration, rolling shutter, occlusion, target orientation, and holder flex all affect the result. The ChArUco paper measures a different calibration rig, not a Pixel tracking this arm.
- **The reference point and error metric matter.** The tablet has its own tolerance and supplies no calibrated height or tilt. Camera and tracker figures apply to their targets. A rigid offset cannot account for flex between target and nib. Accuracy, repeatability, and the table's error metrics describe different properties.
- **The quoted conditions differ.** SteamVR results include coordinate and sample-rate post-processing. OptiTrack's product page and [family sheet, which lists ±0.2 mm](https://optitrack-documents.s3.us-west-2.amazonaws.com/primex-family-spec-sheet-26.01.16.pdf), differ. Leica's bound uses specified precision reflectors. These figures do not establish nib accuracy on this arm.
- **Rate is not latency.** OptiTrack's listed camera latency excludes the rest of the application. The other cited sources do not establish end-to-end delay for the complete recording chains. Tracking volume also depends on visibility, and component prices exclude a complete installation.

## Which route fits a small arm?

For a small arm like the SO-101, a calibrated camera is an accessible route from the drawing plane to space. A phone already provides the images, and coded targets supply a geometric reference. The tablet remains useful because it measures the pen directly on the surface.

Sweeping base stations provide wider coverage with compact tracking hardware, but their dynamic error matters for precise paths. Optical motion capture adds synchronized views and rigid-body tracking at the cost of a dedicated installation. A laser tracker fits work that needs an independent dimensional reference. The choice follows the motion, the point being measured, and the conditions behind each accuracy figure.
