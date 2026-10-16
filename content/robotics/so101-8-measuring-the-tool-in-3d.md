---
title: "How do I get the XYZ position of my robot's tool tip?"
description: 'The drawing arm project needs a smooth, precise controller beyond the tablet plane. I compare cameras, marker tracking, and a laser tracker for measuring the tool tip in space.'
date: '2026-10-15'
updated: '2026-10-16'
draft: true
series: 'From policy to action: the last mile of robotics control'
part: 8
---

How do I get the precise x, y, and z coordinates of the tip of my robot's gripper?

I use an SO-101, a small robot arm, to develop a smooth, precise controller: a program that turns a desired path into motor commands. I call this the drawing arm project, but drawing is one showcase for a controller that should also work in space. The gripper holds a pen; a Wacom drawing tablet, a flat position sensor, measures its tip, or nib. The tablet reports x and y along its surface, so this post asks how to add z, the height above that plane.

## From the drawing plane to space

Measuring the actual tip path lets me judge a controller change by the motion it produces. I want the arm to follow the intended path smoothly, whether it draws or carries a tool above the table.

With free-space measurements, I could test whether corrections learned while drawing still help above the tablet. The same data would help me fit and test a model of the arm's motion.

An encoder is a sensor that reads a joint angle. The arm's encoders report those angles, but they do not measure the tool tip directly. Bending between a joint and the tip can change the path. I need an outside reference that follows the tip through space.

A friend who works on robots described three routes. A calibrated camera can locate a known pattern on the tool. Sweeping base stations or infrared motion-capture cameras can follow markers on the arm. A laser tracker can follow a reflector. Each route gives a different balance of accuracy, coverage, setup work, and cost.

After reading papers and specifications, I propose keeping the tablet for drawing scores and starting a camera study with the Pixel phone I already have. A ChArUco board, a checkerboard with coded markers, would give the camera a known scale and reference frame. A small target fixed to the tool would let me estimate the nib position. I would compare that estimate with the tablet before using it for free-space paths.

## Compare the measurement systems

This is a research draft. **All external specifications, paper results, calculations, budgets, and proposed tests below are Dry run.** Each numerical claim also names its source type: **Datasheet**, **Paper**, or **Estimate**. A vendor product specification counts as Datasheet. Only Measured results from the real arm can rank its controllers.

Costs are incremental USD planning costs with the existing computer available. Setup effort is my Estimate. Rate counts samples per second. Latency is the time from physical motion to a usable sample in my program.

Mean absolute error (MAE) averages the size of the errors. Root mean square error (RMSE) squares the errors before averaging and taking the square root, so large errors count more. A tolerance or maximum permissible error states a bound under specified conditions.

| System | Accuracy evidence, mm | Rate, Hz | Latency evidence | Working area or volume | What it measures | USD cost and setup effort |
| --- | --- | --- | --- | --- | --- | --- |
| Existing Wacom Intuos S | **±0.25 mm**, digital accuracy tolerance (Datasheet, [Wacom](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html)) | **133 Hz** maximum reports (Datasheet) | Host-chain latency not specified by the cited datasheet | **152 × 95 mm** active plane (Datasheet) | Pen x and y, pressure, proximity; no calibrated z or orientation | **$0** added (Estimate); low effort: fix tablet pose, map coordinates, log timestamps |
| High-resolution camera plus ChArUco; Pixel first | Pixel nib accuracy untested. A different omnidirectional calibration rig reported **1.32 mm** translation MAE (Paper, [An et al.](https://doi.org/10.3390/electronics7120421)); this is calibration evidence, not Pixel trajectory accuracy | **30 Hz** proposed starting mode (Estimate); Google documents Pixel video up to **60 Hz** (Datasheet, [Pixel Camera Help](https://support.google.com/pixelcamera/answer/7064897)) | End-to-end latency unknown; at the proposed mode the frame period is **33.3 ms** (Estimate, reciprocal of rate), not a latency bound | Proposed **0.4 × 0.4 × 0.3 m** test volume (Estimate), subject to visible target size and focus | Calibrated target position and orientation; nib position through a measured rigid offset | **$200–300** added with the existing phone (Estimate); medium effort: camera calibration, rigid mounts, tool offset, timestamps |
| Sweeping base stations: VIVE Tracker with SteamVR Tracking | Static translation RMSE **0.155 mm** with four stations; dynamic aggregate RMSE **2.164 mm** at **25 mm/s** (Paper, [Tables 2 and 4](https://doi.org/10.3390/s23020725)); these are the authors' metrics | **100 Hz** recorded tracker stream (Paper) | Current tracker-to-program latency not established by that study | Coverage up to **5 × 5 m** with two stations or **10 × 10 m** with four (Paper); not a uniform accuracy guarantee | Tracker position and orientation; nib through a rigid offset | Tracker **$149**, each station **$229** (Datasheet, [tracker](https://shop-us.vive.com/collections/accessories/products/vive-tracker-3-0-full-body-tracking), [station](https://shop-us.vive.com/collections/accessories/products/2104005)); four-station equipment subtotal **$1,065** (Estimate); medium effort: mounts, SteamVR host, frame registration |
| Infrared motion capture: OptiTrack PrimeX cameras | PrimeX 13 product page: **±0.3 mm** typical position accuracy (Datasheet, [specifications](https://www.optitrack.com/cameras/primex-13/specs)); applies to the marker system | **240 Hz** at full resolution (Datasheet) | **4.2 ms** listed camera latency (Datasheet); application latency still needs measurement | Vendor accuracy context: **9 × 9 m** tracking area (Datasheet, [conditions](https://www.optitrack.com/cameras/primex-13)); usable volume depends on camera overlap | Marker positions; a rigid cluster gives tool position and orientation | **$15,000–30,000** complete small system allowance (Estimate, not a quote; [vendor pricing](https://www.optitrack.com/cameras/primex-13/buy)); high effort: camera network, calibration wand, mounts, license, tool cluster |
| Laser tracker: Leica AT960 with reflector | **±(0.015 + 0.006 × L) mm**, with L in meters (Datasheet, [Hexagon brochure, specifications](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf)); **±0.027 mm at 2 m** (Estimate, substitution) | **1,000 Hz** output (Datasheet) | Application latency not specified in the cited brochure; output period is **1 ms** (Estimate), not a latency guarantee | AT960-MR: **40 m** diameter for reflector position, **20 m** for the pose accessory (Datasheet, same brochure) | Reflector center position; orientation needs a pose accessory such as T-Mac | **$100,000–200,000** purchase allowance (Estimate, not a quote; [vendor sales](https://nexus.hexagon.com/home/product/laser-trackers-at960/)); high effort: instrument setup, software, reference frame, reflector mount |

These error definitions are not interchangeable. I would use the table to choose a validation route and a common nib test to compare systems.

## Choose a ruler for the nib

The requested nib run-to-run target is **0.6 mm (Dry run, Estimate: design requirement)**. Before testing, I would define this as the root mean square (RMS) distance between time-aligned repetitions of the same nib path. That proposed definition needs to stay fixed across sensors and controllers.

A sensor must resolve changes smaller than that target. I propose a sensor contribution of **0.2 mm RMS or less (Dry run, Estimate: engineering allocation)** at the nib. This allocation includes calibration, timing, and the target mount. It sets the gate for the proposed study.

Accuracy is agreement with an independent reference. Repeatability is agreement across repeated readings or runs. A stable bias can leave repeatability good and accuracy poor. The study must report both in physical units.

### What the tablet gives me today

The Wacom Intuos S reports pen coordinates and pressure. It gives me a direct reference for a drawing, without estimating the arm geometry. [Wacom specifications](https://estore.wacom.com/en-au/wacom-intuos-small-without-bluetooth-black-ctl-4100-k0-cx.html)

In the existing recording chain, the estimated tablet-stream delay is **20 ms (Offline, real drawing logs)**. [Optional background: tablet delay analysis](/robotics/so101-6-where-the-last-millimeter-goes/#section-what-the-physics-misses)

## How cameras become a ruler in space

The codes on a ChArUco board identify visible parts of the pattern. The corners support camera calibration and pose estimation. The known square size supplies metric scale. OpenCV explains how to recover a board pose from calibrated image points. [OpenCV ChArUco guide](https://docs.opencv.org/4.x/df/d4a/tutorial_charuco_detection.html)

A board beside the tablet establishes the tablet frame in the camera view. A light target fixed to the tool supplies its position and orientation. The target needs a known relation to the nib. A second synchronized view adds a triangulation baseline and helps when the arm blocks the first view.

I would start with the existing Pixel on a rigid support. I would record to the phone and process the footage offline. That avoids making a network video stream part of the first measurement chain. I would record the phone model, lens, capture resolution, exposure, focus, stabilization settings, frame timestamps, and calibration software version. The calibration and trajectory footage must use the same image geometry.

For scale, suppose a **400 mm** field spans **3,840 pixels**. The spacing is **0.104 mm per pixel (Dry run, Estimate: field width divided by image width)**. This gives the table width covered by an image sample.

The ChArUco paper in the table also reports **0.90°** rotation MAE **(Dry run, Paper)**. I would report rotation error alongside translation error in the camera study. [An et al., calibration results](https://doi.org/10.3390/electronics7120421)

## How markers become a tool pose

Sweeping base stations and infrared motion capture both use targets on the arm, but they detect different signals.

With Lighthouse, the base stations sweep infrared laser light across photodiodes on the tracker. The system estimates the tracker pose from those observations and its inertial measurements. With optical motion capture, cameras illuminate and observe reflective markers, then triangulate their positions. A rigid cluster of non-collinear markers supplies orientation as well as position. [SteamVR study](https://doi.org/10.3390/s23020725), [OptiTrack marker tracking](https://www.optitrack.com/cameras/primex-13)

For the first nib study, I would put a light cluster near the tool. Markers on arm links can later show link motion and bending. A marker on an upstream link alone leaves the flex between that link and the nib unmeasured.

The SteamVR results are a reason to test motion before buying. The same paper reports a dynamic aggregate RMSE of **0.574 mm** at **12.5 mm/s**, rising to **4.237 mm** at **50 mm/s**, with four stations **(Dry run, Paper, Table 4)**. I would consider Lighthouse for coarse play trajectories before considering it as the nib reference. [Dynamic results and processing method](https://doi.org/10.3390/s23020725)

For optical motion capture, I would ask for a demonstration over the arm's actual motions. I would request nib error, visible-marker count, dropout rate, and timestamps. That gives a better buying test than the camera model alone.

## What a laser tracker buys

A laser tracker combines distance measurement with angular encoders. It follows a reflector and reports its center in space. This gives an independent metric reference with substantial accuracy margin for a small arm. The quoted Leica accuracy is a maximum permissible error under the brochure's reflector and test conditions. [Hexagon specifications](https://solutions-ds.com/wp-content/uploads/2017/06/Hexagon_MI_AT960_Brochure_EN.pdf)

A reflector gives position. A dedicated pose target adds orientation. That matters if the reflector sits away from the nib and the tool rotates. For my arm, I would seek a loan or a paid reference session before considering ownership. The purchase allowance in the table is a planning estimate. A supplier quote must include the target, software, support, and calibration.

## Measure the offset and the time

Every external target needs a transform to the nib. If the target pose is $(R,t)$ and the nib offset in target coordinates is $r$, then

$$
p_{\text{nib}} = t + Rr.
$$

For a small orientation error $\delta\theta$, the added nib error is about $\lVert r\rVert\delta\theta$. A **100 mm** offset with **0.1°** orientation error adds about **0.175 mm (Dry run, Estimate: lever-arm calculation)**. A target near the nib reduces the lever arm.

Timing also becomes position error. At **20 mm/s**, a **10 ms** time error creates **0.2 mm** of apparent path error **(Dry run, Estimate: speed multiplied by time)**. The test must therefore measure delay and jitter for the full recording chain.

## My recommendation and the test that decides it

I would choose among these routes in this order:

1. **Pixel feasibility study.** Prediction: low-cost calibrated images will add useful free-space labels. Passing the nib allocation is an open test. I propose an initial added-hardware ceiling of **$300 (Dry run, Estimate: proposed budget, pending approval)**.
2. **Borrow optical motion capture if the camera fails.** Prediction: synchronized views and a rigid tool cluster will improve coverage and timing. A demonstration must establish nib uncertainty before a purchase.
3. **Use a laser tracker for an independent reference session.** Prediction: its metric position accuracy will expose systematic camera or motion-capture bias. The budget favors access to an instrument over ownership.

I would keep the tablet throughout. The next study starts with a static target, then checks camera-versus-tablet nib coordinates while drawing. Fit the camera-to-tablet transform on calibration data. Keep that transform fixed on held-out paths. Estimate timing on separate data and preserve the raw timestamps. Report bias, repeated-position spread, path error, delay, jitter, and missing detections.

For the height check, I would use an independent fixture with known height steps and stated uncertainty, or a reference session with motion capture or a laser tracker.

Only after these checks would I use the camera to score pen-clear play trajectories. Any arm collection belongs to the arm operator and the normal test queue. This draft does not start a test or authorize an order.

## Limits

- **The recommendation's weakest point is unvalidated nib depth.** Phone calibration, rolling shutter, image processing, occlusion, target orientation, and holder flex all enter the result. Pixel spacing and image-fit error alone do not establish depth accuracy. A rigid target-to-nib transform also cannot remove holder flex.
- **The tablet is a plane reference with its own error.** Hover detection does not supply calibrated height, and this model does not report tilt. Its datasheet tolerance is not a measured uncertainty for this installation. Tablet agreement alone cannot certify the proposed sensor allocation. That needs a reference with characterized uncertainty and an error budget for the comparison. Pressure and pen angle also need controlled conditions.
- **The literature describes other systems.** The ChArUco paper evaluates an omnidirectional calibration structure, not Pixel nib trajectories. The SteamVR paper uses a robot reference and post-processes coordinate systems and sample rates. Its aggregate RMSE is not a uniform spatial bound or an isolated latency measurement.
- **Vendor claims depend on conditions.** OptiTrack's product page lists the accuracy used here; its [family sheet](https://optitrack-documents.s3.us-west-2.amazonaws.com/primex-family-spec-sheet-26.01.16.pdf) lists **±0.2 mm (Dry run, Datasheet)**. A quote must fix the specification and test volume. Leica's reflector specification does not establish the error of a custom nib mount.
- **Latency is incomplete.** The cited sources do not establish end-to-end delay for my proposed Pixel, SteamVR, motion-capture, or tracker host chains. Timestamp accuracy, camera latency, frame period, and program delivery delay are separate quantities. The earlier tablet delay estimate applies only to its recording chain. The exact Pixel model and supported capture modes also need confirmation.
- **Costs and approval remain open.** The camera, motion-capture, and laser-tracker totals are Estimates, with existing compute assumed. Tax, shipping, service, and any new host are extra. The ChArUco board order remains pending. No new real-arm measurement or controller ranking is claimed here.
