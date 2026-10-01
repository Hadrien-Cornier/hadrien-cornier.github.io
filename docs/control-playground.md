# Control playground

The homepage asks one question: **What changes when the object moves?**

This is a rule-based tabletop simulation. The methods illustrate different parts of a control system. No trained model, real robot, or measured policy score runs here. The methods can overlap in a real system.

## Shared setup

All modes share the same normalized workspace, starting pose, cubes, tray, speed limit, grasp rule, collision check, and time limit. Speed is 0.27 workspace units per second. The action horizon is 0.60 seconds. The default compute delay is 0.30 seconds, with a slider from 0 to 0.60 seconds. Physics advances at 120 steps per second, with a 12 second trial limit. Readers can move either cube, choose red or blue, add an obstacle, and change the planning delay. Replay and mode changes preserve the reader's edited setup.

The display separates the solid trail of actual movement from the dashed plan. Diffusion candidates and world-model predictions are drawn before physical movement. They do not move the actual gripper.

## Six mechanisms

| Mode | What the rule illustrates | Read it with |
| --- | --- | --- |
| Scripted path | A taught route follows its saved target position. Moving the cube does not update the route. | Blind replay, rather than all classical control. |
| Synchronous chunks | Observe, wait for a short plan, execute the chunk, then repeat. | A blocking planning loop. ACT itself can query at every timestep and combine overlapping predictions. |
| Real-time chunks | Compute the next plan while executing the previous one. Preserve commands that will execute during the delay. | Finite response delay remains. Continuous motion does not imply instant reaction. |
| Diffusion plans | Refine seeded noisy candidate routes, then execute part of the selected route and observe again. | A visual analogy for action denoising. The geometric planner here is hand-written. |
| Instruction-conditioned | Choose the red or blue cube from the scene and task. | A finite rule that represents one ability of a generalist policy. It does not represent pretrained model performance. |
| World-model lookahead | Predict candidate tip positions, score their route, execute the next step, then predict again. | A state predictor. Real world models can predict state, features, or video. These frames are predicted toy states. |

The clearest timing comparison is synchronous chunks versus real-time chunks. They use the same speed and compute delay. A stopped arm spends time waiting between synchronous chunks. Real-time planning overlaps that computation with movement.

The non-generalist sketches are fixed to the red-cube task. The generalist sketch additionally reads the red/blue instruction. This choice isolates instruction conditioning in the demo. Chunking, diffusion, and world-model planning can also use instructions in real systems.

Other modes explain different mechanisms. Their success and failure depend on this scene and its rules. They do not form a ranking of research methods.

## Research sources

- [ACT, section IV-A](https://arxiv.org/html/2304.13705v1#S4.SS1): action sequences and temporal ensembling.
- [Real-Time Chunking, sections 3 and 4](https://arxiv.org/html/2506.07339v1#S4): overlap computation with execution, with a committed prefix and guidance over later actions.
- [Diffusion Policy, section II-C](https://www.roboticsproceedings.org/rss19/p026.pdf#page=3): denoise an action sequence, execute a portion, and update from new observations. [Official project](https://diffusion-policy.cs.columbia.edu/).
- [π₀ paper](https://www.pi.website/download/pi0.pdf): a generalist policy combines a pretrained vision-language model with a continuous action expert.
- [OpenVLA evaluations](https://openvla.github.io/): instructions, broad training, and examples of failures. Generalist training does not guarantee success on every task.
- [V-JEPA 2, sections 3 and 4](https://arxiv.org/html/2506.09985v1#S3.SS2): predict future features, evaluate candidate actions, execute one action, and replan.

## Files and checks

`assets/control-simulator.mjs` owns simulation state and transitions. It has no page dependencies. `assets/control-playground.js` turns browser input into state changes and draws the scene. `assets/control-playground.css` stays scoped to the homepage widget. The HTML template supplies a static scene and explanation before scripts load.

Run `npm test` for the builder and simulation contracts. Run `npm run build` to generate the public pages. Check the browser at desktop and phone widths. Exercise Run, Pause, Replay, moved cubes, obstacles, both tasks, all modes, keyboard cube movement, and delay changes. Check that changing modes preserves the edited setup.

The two-link geometry game is an empty `robotics-arm` Markdown fence in the moving-arm article. Only pages with that fence load its controls. Ordinary articles retain static math, media, and native drawers.

## Verification on October 1, 2026

All 25 builder and simulator tests passed. In the untouched red-cube scene at 300 ms delay, synchronous chunks waited 1.80 seconds in total. Real-time chunks waited 0.30 seconds. They used the same speed, horizon, and total traveled distance. These numbers describe this simulator.

Chrome checks covered all six modes, fixed-script success and moved-object failure, both task choices, obstacle planning, chosen future frames, the committed path, pause/resume, replay setup, delay edits after a result, cube dragging after scrolling, and keyboard movement. The homepage and article game fit a 390 pixel phone viewport. Article sliders, equations, and loaded images were checked. No browser errors appeared.

The no-mistakes service did not start after setup and a second start attempt. Its pipeline did not run. A separate agent reviewed the code and public explanations before publication. Real robot and trained-model performance were not tested.
