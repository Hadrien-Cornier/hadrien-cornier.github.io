# Control playground

The homepage compares five architecture examples on one task: move a cube into a tray. Each card explains the real method and links its paper. Execution timing and scene challenges are separate controls.

The scene, architecture and task choices, Run, Replay, and Try a failure stay visible. Native drawers start closed. About this approach holds the summary, paper, action generation, and training. Experiment settings holds timing, challenges, scene edits, delay, and counters. Predicted futures appears for the world model. Why it failed appears after a failed run. What this shows holds the shared assumptions and sources. Readers choose when to open each drawer. With scripts unavailable, settings and simulation buttons stay hidden while the static scene and explanation drawers remain available.

The simulator uses supplied rules. Its failures come from the executed movement, observed scene, and physical task checks. It runs no trained policy and provides no paper benchmark scores.

## Architecture examples

| Example | Supplied rule in this simulator | Link to the real method |
| --- | --- | --- |
| Fixed script | Replay a taught pickup position and route. New observations do not change it. | A blind replay baseline. Classical control can also use feedback and planning. |
| Action transformer | Turn the latest observed target into a short action batch. | ACT learns action sequences from demonstrations. It combines predictions for the same moment to smooth movement, called temporal ensembling. |
| Diffusion Policy | Refine seeded noisy action plans toward supplied routes, then execute a prefix. | Diffusion Policy learns observation-conditioned action denoising from demonstrations. |
| Generalist VLA | Read a red/blue instruction and use a supplied obstacle route. | π₀ combines pretrained image and language knowledge with an action expert. The expert learns to turn noise into actions through flow matching. Robot training covers many tasks and bodies. |
| World model + planner | Predict candidate tip positions, choose a route, execute one waypoint, then predict again. | V-JEPA 2-AC predicts learned scene features and plans toward an image goal. The widget draws toy state predictions. |

The action-transformer, diffusion, and world-model sketches use the red-cube task. The VLA sketch also reads the red/blue instruction. This isolates instruction conditioning here. Those other methods can also use instructions in real systems.

Architecture, action generation, training breadth, and execution timing are separate choices. A pretrained policy can use diffusion or flow matching. A model can generate action batches and execute them with real-time chunking.

## Execution timing

Action transformer, Diffusion Policy, and Generalist VLA offer two schedules:

- **Wait between batches:** execute a batch, then wait for the next plan.
- **Plan while moving:** compute the next batch while committed commands continue. New observations can change later commands after the compute delay.

Compare these settings on the same architecture, scene, and delay. Continuous movement still has a response delay. The original ACT can query at every timestep and combine predictions; the blocking setting here is an execution choice.

The RTC paper applies its method to diffusion and flow policies. The action-transformer sketch borrows the timing idea through a simple queue. The fixed script has no planning delay. The world planner executes its next waypoint, then predicts again.

## Shared physics

All examples share the same workspace, starting arm position, cubes, tray, speed limit, grasp check, collision check, and time limit.

- Arm speed: 0.27 workspace units per second.
- Action-batch horizon: 0.60 seconds.
- Default compute delay: 300 ms, adjustable from 0 to 600 ms.
- Physics: 120 steps per second.
- Trial limit: 12 seconds.

A delay change applies to the next planning request. A plan already being computed keeps its earlier delay.

A grasp uses the real distance to a physical cube. The carried cube follows the arm and cannot be dragged away. Collision checks use the actual movement segment. Success requires the requested physical cube to be released within 0.035 workspace units of the real tray. A failure label is never assigned just because an architecture or challenge was selected.

The solid trail shows actual movement. Dashed lines show plans. The blue segment shows committed commands. Diffusion candidates change during planning, while the actual arm waits or executes its earlier batch. World frames show predicted tip positions; a predicted collision stops at contact.

## Scene challenges and injected errors

Choosing a challenge loads its prepared scene. **Try a failure** selects a relevant challenge and starts the run. Readers can also drag cubes, use arrow keys, add an obstacle, and change the task. Replay and architecture changes preserve the reader's starting scene edits.

| Challenge | What is changed | Why a run can fail |
| --- | --- | --- |
| Clean scene | Stationary cubes and a correctly observed scene. | Establishes the baseline before changing one factor. |
| Moving target | The red cube circles at 0.60 units/s, faster than the 0.27 units/s arm. | These rules chase an observed position. Compute delay and execution make that position stale. They do not plan an interception. The blue cube stays still. |
| Late obstacle | After 0.18 units of travel, a blocker is placed on the current queued movement segment. | Earlier commands still point through the new blocker. Contact ends the trial through the shared collision check. |
| Swapped visual cues | An injected visual error swaps the observed red and blue labels. The physical cubes keep their identities. | A planner that reads those labels can grasp the wrong physical cube. The fixed script does not read them. |
| Wrong camera frame | The world planner's observed scene is rotated 25 degrees around the fixed arm base. The real table stays unchanged. | Predictions use the wrong coordinates. Physical grasp checks still use the real table, so the arm can repeatedly close at an empty point. Other examples do not receive this rotation. |

These errors are inserted by the simulator. They illustrate what follows from a stale observation, blocked command, wrong label, or wrong coordinate frame. Their frequency and size are chosen for this scene. They are not measurements of neural perception, pretrained generalization, or learned prediction accuracy.

## Research sources

- [ACT, section IV-A](https://arxiv.org/html/2304.13705v1#S4.SS1): action sequences and temporal ensembling.
- [Real-Time Chunking, sections 3 and 4](https://arxiv.org/html/2506.07339v1#S4): overlapping computation and execution, preserving a committed prefix, and guiding later actions.
- [Diffusion Policy, section II-C](https://www.roboticsproceedings.org/rss19/p026.pdf#page=3): denoise an action sequence, execute a portion, and observe again. [Official project](https://diffusion-policy.cs.columbia.edu/).
- [π₀ paper](https://www.pi.website/download/pi0.pdf): vision-language pretraining, a flow-matching action expert, broad robot training, and task-specific refinement.
- [V-JEPA 2, sections 3 and 4](https://arxiv.org/html/2506.09985v1#S3.SS2): future feature prediction, candidate action evaluation, and planning toward image goals.

The papers also report limits:

- [ACT, Appendix F](https://arxiv.org/html/2304.13705v1): failures involving visual cues, including seams.
- [Diffusion Policy, PDF page 11](https://www.roboticsproceedings.org/rss19/p026.pdf#page=11): training-data coverage and inference latency.
- [π₀, section VII](https://arxiv.org/html/2410.24164v1#S7): unreliable tasks and the role of task-specific post-training.
- [V-JEPA 2-AC, section 4.3](https://arxiv.org/html/2506.09985v1#S4.SS3): camera placement and prediction errors over longer planning horizons.

## Files and checks

`assets/control-approaches.mjs` supplies the source-grounded cards and timing explanations. `assets/control-simulator.mjs` owns deterministic simulation state, observations, injected challenges, and physical checks. It has no page dependencies. `assets/control-playground.js` handles browser input and drawing. `assets/control-playground.css` stays scoped to the homepage widget. The HTML template supplies a static scene and explanation before scripts load.

Run `npm test` for the builder and simulation contracts. Run `npm run build` to generate public pages. Check desktop and phone layouts. Exercise all five examples, both schedules where supported, all five challenges, both tasks, delay changes, Pause, Replay, dragging after scrolling, and keyboard cube movement. Check that scene edits survive architecture changes and replay.

The two-link geometry game uses an empty `robotics-arm` Markdown fence in the moving-arm article. Only pages with that fence load its controls. Ordinary articles keep static math, media, and native drawers.

## Current verification

On October 1, 2026, all 33 builder and simulator tests passed. Tests cover both execution schedules on all three action-sequence examples, controlled failures, delivery at the physical tray, and replay at 30, 60, and 120 display frames per second. A separate agent reviewed the paper summaries, simulator, and browser state handling. Review found and fixed an off-tray delivery that could count as success.

Browser checks covered all five architecture cards and their paper links. Their suggested challenges produced an empty fixed-script grasp, an action-transformer collision, a diffusion timeout, a wrong-cube VLA delivery, and a world-planner timeout. The scene shows swapped observed labels and displaced model targets. Real-time diffusion completed the clean task; its committed path, Pause, and Resume worked. The VLA completed the blue-cube task. Keyboard scene edits survived an architecture change. The page fit a measured 389-pixel phone width with no horizontal overflow. No browser errors appeared.

The no-mistakes service did not become responsive during setup, so its full pipeline did not run. These checks cover supplied rules and the website. Trained-model or real-robot results were not measured.

The compact drawer layout was also checked on October 1. The full 33-test suite passed again. Browser checks covered opening and closing drawers, changing an approach while its explanation is open, real-time timing, delay, scene edits, Pause, and Replay. Try a failure ran with settings closed. The world model's failure explanation appeared in a closed drawer, and its predicted frames were visible when their drawer opened. A 389-pixel phone view had no horizontal overflow. A separate agent checked DOM hooks, default states, and the static fallback. The review service was still unavailable.
