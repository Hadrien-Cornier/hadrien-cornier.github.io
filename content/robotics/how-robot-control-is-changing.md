---
title: 'How robot control is changing'
description: 'What changed in robot control since 2010, from modular stacks to learned actions, predictions and memory.'
date: '2026-09-30'
draft: false
---

You ask a robot to clear a table. There is a plate, a mug, and a bowl. The mug partly hides the bowl. Someone moves the plate while the robot reaches for it.

The instruction is short. The control problem is not. The robot must identify objects, estimate where they are, choose an order, reach without hitting anything, grasp, and check what happened. After a miss, it must decide what to do next.

Around 2010, researchers usually built these abilities as communicating parts. Learning has since moved into more of those parts. Some models turn images into movements. Others connect language to actions, predict consequences, or remember earlier events. The motors still need commands that match the robot's body and arrive on time.

What changed is how much of that chain can be learned, what experience it can learn from, and which information it carries between decisions.

![Branches from modular control to learned policies, learned dynamics, VLAs and memory](/assets/robotics/modern-control/branching-timeline.png "Examples overlap in time. The arrows group related approaches that continue together.")

## Around 2010: turn measurements into a plan, then close the loop

A camera gives pixels. A range sensor gives distances. Neither directly supplies the command “pick up the mug.” A conventional system turns those measurements into several intermediate answers.

**Perception** receives sensor measurements and returns a description of the scene. It might identify the table surface, estimate the mug's shape, and build an obstacle map. That map includes things the arm should avoid, even when it cannot name them.

**State estimation** combines measurements with earlier estimates. It returns the robot's estimated position, joint configuration, motion, and relevant uncertainty. A mug location expressed in camera coordinates must be related to the arm's coordinates. Joint sensors tell the controller where the arm actually is.

**Task planning** receives the goal and scene information. It selects steps: pick up the mug, place it in a tray, then handle the bowl. A task executive tracks which step is running and whether it succeeded. It can request a new grasp after a failure.

**Motion planning** receives a target, estimated robot state, obstacle geometry, and the robot's movement limits. It returns a feasible path or trajectory. A path describes where to move. A trajectory also specifies when. Reaching the mug requires a sequence of arm configurations that avoids the bowl and table.

**Motor control** receives the desired movement and measured joint state. It repeatedly adjusts motor commands to reduce the tracking error. The physical arm moves, sensors produce new measurements, and the loop continues.

![Six control stages with their inputs and outputs and a feedback path](/assets/robotics/modern-control/control-stack.png "A teaching stack. Real implementations share information across stages and can run them at different rates.")

This was already more than a fixed script. In a 2009 PR2 paper, Radu Rusu and colleagues built perception and motion replanning toward clearing a table with a person nearby. Their tested sequence used a simplified horizontal gripper approach and ended with the object in a graspable state. A general partial-view grasp planner remained planned work. [Rusu et al., pp. 7–8](https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=7)

The system combined three-dimensional perception, obstacle maps, motion replanning, and a higher-level executive. Its hardware control loop ran at 1 kHz, or 1,000 updates per second. The paper's architecture shows the messages passed between these parts. [Rusu et al., p. 2](https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=2)

If someone moved an object, fresh measurements could change the obstacle map and trigger replanning. The difficult work was making the representations and interfaces reliable. A good motion planner could still fail because the mug's estimated position was wrong.

The table task therefore needed both fast feedback and slower decisions. That division did not begin with today's foundation models.

## The 2010s: learn movements and learn what movements do

Writing every grasping rule becomes difficult when cups differ in shape or sit at unfamiliar angles. One response is to learn a **policy**, a rule that chooses an action from the information available to the robot.

In *End-to-End Training of Deep Visuomotor Policies*, first released in 2015, Sergey Levine and colleagues learned a mapping from camera images and robot measurements to joint motor torques. A torque is a turning force applied at a joint. Their robot learned particular manipulation skills, including screwing on a bottle cap and hanging a coat hanger. The training process used richer state information to help teach the visual policy. [Levine et al. v5, §§1, 5](https://www.alphaxiv.org/pdf/1504.00702v5?page=13)

In these PR2 experiments, the effort interface implemented those commands by setting motor voltages roughly proportional to torque. These were feedforward commands, chosen without measured torque feedback. [Levine et al. v5, Appendix B.2, p. 33](https://www.alphaxiv.org/pdf/1504.00702v5?page=33)

For our table, the analogous idea is to learn how the mug's appearance and the arm's position should change the next movement. Several hand-designed stages can become one learned mapping. The policy still depends on sensors, training experience, and the command interface.

A second branch asks a different question: before choosing an action, can the robot learn what that action will do?

This branch was already active in 2011. In **PILCO**, Marc Peter Deisenroth and Carl Edward Rasmussen learned uncertain dynamics from experience. Dynamics describe how a state changes after a control input. Their model predicted distributions over changes, rather than pretending that a small dataset determined one certain future. Those predictions helped evaluate and improve a policy. [PILCO, §§1–2](https://icml.cc/2011/papers/323_icmlpaper.pdf)

The paper states: “Second, model uncertainty must be incorporated into planning and policy evaluation.” [PILCO, p. 1](https://icml.cc/2011/papers/323_icmlpaper.pdf)

Imagine learning how far a plate slides after different pushes. A policy answers “which push should I make?” A dynamics model answers “what movement would this push cause?” Uncertainty matters when the proposed push differs from the examples already observed.

These are overlapping choices. A learned model can help train a policy, which then acts without searching through futures at every decision. Another controller can use predictions during execution. PILCO's main learning loop improved a policy.

Learning movements, learning dynamics, and accounting for uncertainty all preceded large image-language models.

## The 2020s: connect images and language to robot actions

“Clear the table” leaves room for interpretation. Should the robot move the flowers? Is a bowl still being used? A **vision-language model**, or VLM, connects visual information with language. It can receive an image and a question or instruction, then produce a description, answer, or proposed step.

A VLM could suggest “put the empty mug in the tray.” A robot system must connect that sentence to an executable skill. The skill needs an object location, a reachable grasp, and a movement interface. A language plan alone does not supply those details.

A **vision-language-action model**, or VLA, also produces robot actions. RT-2, published in 2023, adapted image-language models using robot trajectories alongside web tasks. It represented robot actions with tokens, the discrete symbols a model predicts. In its robot setting, those symbols encoded changes in gripper position and orientation, gripper opening, and an episode-ending command. Each continuous action dimension used 256 bins, or ranges, each encoded as a token. [RT-2 v1, §3.2, p. 5](https://www.alphaxiv.org/pdf/2307.15818v1?page=5)

The distinction is in the output. A VLM might say “move right.” A VLA can output a numerical movement in the robot's action representation. The system converts the predicted tokens back into numerical robot commands. [RT-2 v1, §3.2, p. 6](https://www.alphaxiv.org/pdf/2307.15818v1?page=6) Image-language pretraining can help interpret an unfamiliar object or instruction, while robot experience connects that interpretation to movements the body can perform.

Action representations vary. A model might produce desired joint positions, a change in the gripper's pose, motor torques, or a short sequence of commands called an **action chunk**. These outputs require different execution machinery. A gripper pose is its position and orientation, not a list of motor currents.

Suppose our model requests a small upward gripper movement. An interface translates that request into the robot's coordinates and control convention. A lower-level controller uses the robot's geometry and measured state to drive the joints. If the model directly supplies torques, more of that decision has moved into the learned policy. RT-2's commands and Levine's torque policy therefore sit at different interfaces.

Timing also matters. As a teaching example, let $H$ be the number of commands in a chunk and $f$ the execution rate in commands per second. The chunk duration $T$ is:

$$
T=\frac{H}{f}=\frac{10}{20}=0.5\ \mathrm{s}.
$$

If the plate moves during that half-second, the system needs a way to update or interrupt the queued movement. Longer chunks reduce how often new outputs are needed, but can commit the robot further before it reacts.

Language planning and action generation can also run at separate levels. **Hi Robot** studies a hierarchy in which a higher-level model interprets the task and observations, then supplies instructions to lower-level learned control. The natural-language instruction is the interface between them. [Hi Robot v2, §4](https://www.alphaxiv.org/pdf/2502.19417v2)

These models expand the information available for choosing actions. A deployed robot still needs a complete loop for executing commands, observing results, and handling failure.

## 2025: predict candidate futures before acting

The robot can approach the plate in several ways. It could lift before moving sideways, or slide too close to the mug. Choosing between them requires some account of the consequences.

An **action-conditioned world model** receives information about the current situation and proposed actions. It predicts what could follow. A planner uses a goal or score to compare those predictions. “World model” names a predictive role; its output need not be a photorealistic video.

![Two hypothetical futures from the same side view, contrasting lifting with moving too low](/assets/robotics/modern-control/candidate-futures.png "Teaching comparison. The initial state and goal stay fixed. Only the candidate movement changes. No robot or model produced these outcomes.")

**V-JEPA 2-AC** makes this loop concrete. Meta's 2025 work first learned visual representations from broad video. Its action-conditioned version then learned to predict future visual features using robot video and gripper-state information from the DROID robot dataset. Here, a feature is a learned numerical description of an image. The training actions were constructed from changes in measured gripper state between frames. “Unlabeled” robot video meant no task or success labels, rather than no movement information. [V-JEPA 2, §3.1](https://www.alphaxiv.org/pdf/2506.09985?page=9)

During planning, it receives a current image, the current gripper state, and candidate action sequences. It predicts future features. A separate goal image specifies the desired result. The planner searches for actions whose predicted final features are close to the goal's features. It executes the first action, observes again, and repeats. This is **receding-horizon control**: plan ahead, carry out a short part, then revise the plan. [V-JEPA 2, §3.2](https://www.alphaxiv.org/pdf/2506.09985?page=10)

For the plate, the planner would compare the predicted results of lifting and sliding. It needs a representation that preserves the difference between clearing the mug and striking it. A beautifully rendered future that misses that contact would be less useful than rough features that rank the actions correctly.

The authors demonstrated image-goal reaching and object manipulation on Franka arms in two labs. Pick-and-place used supplied intermediate goal images, with goal switches after fixed numbers of steps. [V-JEPA 2 v1, §4.2, p. 13](https://www.alphaxiv.org/pdf/2506.09985v1?page=13) A lower-level controller moved the arm for each chosen gripper command. The planner waited for that command to finish before sending another. Their single-step planning test on an RTX 4090 took 16 seconds per action. Camera placement affected performance, and prediction errors limited longer planning. [V-JEPA 2, §§4.1–4.3](https://www.alphaxiv.org/pdf/2506.09985?page=12), [Table 3](https://www.alphaxiv.org/pdf/2506.09985?page=15)

The example shows a working prediction-to-control connection for bounded tasks. It leaves open how to make that connection fast and reliable during a changing household job.

<details>
<summary>Original planning figure and other ways to use predictions</summary>

![Original V-JEPA 2 planning diagram showing observations, candidate actions and a goal-image comparison](/assets/robotics/modern-control/vjepa-planning.png "V-JEPA 2, original Figure 7, PDF p. 11. The model rolls candidate actions forward in feature space. The planner minimizes distance to the goal features.")

Figure 7 from Assran et al., *V-JEPA 2*, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cropped from PDF page 11; original labels preserved.

In the original diagram, $E$ encodes an image as features, $P$ predicts features after candidate actions, and $L_1$ measures their distance from goal features. The full-image link opens the original labels at a larger size. [Original paper, p. 11](https://www.alphaxiv.org/pdf/2506.09985?page=11)

Predicting futures and searching through them online are separate choices. PILCO used uncertain dynamics to improve a policy. Dreamer trains policies using imagined trajectories. Other systems predict future video and infer actions from it, or learn action and future prediction together. A VLA can also use predictive training or work with a world model. These categories overlap.

[DreamerV3 v2](https://www.alphaxiv.org/pdf/2301.04104v2?page=2) illustrates learning behavior from imagined trajectories.

V-JEPA 2's Table 3 reports 800 sampled action sequences, ten refinement rounds, and a planning horizon of one for its 16-second action computation on a single RTX 4090. These settings describe the reported test. [Table 3](https://www.alphaxiv.org/pdf/2506.09985?page=15)

For pick-and-place, the supplied images showed the object grasped, near the destination, and at the final goal. The planner followed these goals for four, ten, and four steps respectively. [V-JEPA 2 v1, Appendix B.2, p. 37](https://www.alphaxiv.org/pdf/2506.09985v1?page=37)

</details>

## 2025–2026: supply physical structure and uncertainty

A mug has a shape. The table has a height. The arm has a reach limit. Sensors can become unreliable. A model can learn some of this from data, but a system can also compute information and supply it directly.

In Brian Heater's A3 interview, **Ali Agha, Field AI's founder**, describes combining raw measurements with computed geometry and uncertainty. At 30:09, he explains that the network also receives representations of shapes, elevations, traversability, and localizability. Traversability concerns where a robot can move. Localizability concerns how well it can determine its position. His surrounding account describes tokenized representations supplied inside the network. [A3 transcript, 28:01–30:09](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha)

From 32:04 onward, Agha describes calculating confidence in different sensing channels. The learned component receives those uncertainty estimates alongside raw data. He says: “You do all of that calculation, and that's just a suggestion to the network.” [A3 transcript, 32:04 onward](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha) [Watch the architecture explanation](https://www.youtube.com/watch?v=twIy5ZSGU8U&t=1809s).

**Waymo** describes another use of structure in its December 2025 architecture article. Learned representations are accompanied by explicit objects, semantic attributes, and road structure. The article also describes a separate onboard layer that validates generated trajectories. [Waymo's architecture](https://waymo.com/blog/2025/12/demonstrably-safe-ai-for-autonomous-driving/)

In his YC talk, **Dmitri Dolgov** argues for combining useful explicit structure with learned representations. [Official transcript, lesson 4](https://www.ycrootaccess.com/p/dmitri-dolgov-seven-lessons-from) [Watch from 30:09](https://www.youtube.com/watch?v=Gp4zrV3-6N8&t=1809s).

For our table, supplying estimated mug geometry and uncertainty gives a model more evidence. Enforcing a rule that rejects arm trajectories through that geometry changes which outputs may execute. **Supplying information and enforcing constraints are different mechanisms.** An uncertainty input can be ignored or misused. A constraint also depends on the measurements and assumptions behind it.

If the bowl is hidden, uncertainty should affect the next decision. The robot might change its viewpoint before reaching. The useful question is whether uncertainty produces better behavior when information is weak.

## 2026: remember what the current view cannot tell you

The table is almost clear. A plate sits beside the sink. Has it already been washed, or has it just arrived? The current image could look identical in both cases. The correct next action depends on history.

![The same current plate image with two histories leading to different next subtasks](/assets/robotics/modern-control/different-history.png "Teaching comparison. The current view and instruction stay fixed. Earlier events determine whether washing or storage should come next.")

Robots have long used maps, tracked objects, task state, and recurrent models to retain history. Modern VLAs also differ in how much history they receive. Memory is a design choice within robot learning.

**MEM, Multi-Scale Embodied Memory**, combines two forms. Recent visual history preserves details such as a slipped grasp or an object briefly hidden by the arm. Longer text records summarize events that remain useful after their images have disappeared. In its March 2026 paper, Marcel Torne and colleagues integrate both into a VLA system. [MEM v2, §III](https://www.alphaxiv.org/pdf/2603.03596v2?page=3)

Its higher-level policy receives observations, the task, and the earlier text summary. It produces a subtask instruction and an updated summary. Its lower-level policy receives recent observations and instructions, then produces continuous action chunks. The text record could retain “the plate was washed.” Recent video could retain how it slipped during the last attempted lift. [MEM v2, §§III-A–D](https://www.alphaxiv.org/pdf/2603.03596v2?page=3)

The authors report memory use during kitchen tasks lasting up to fifteen minutes. Their comparisons test visual memory, text memory, and their combination within their system. [MEM v2, §IV-A](https://www.alphaxiv.org/pdf/2603.03596v2?page=6) [Marcel Torne's explanation, 7:59](https://www.youtube.com/watch?v=myDCd0hNqQU&t=479s) [Memory mechanisms, 11:10](https://www.youtube.com/watch?v=myDCd0hNqQU&t=670s).

Memory timescales and decision hierarchy answer different questions. Recent video versus longer text describes what information is retained. Fast movement control versus slower task reasoning describes how decisions are organized. A fast policy can use history, and a slower planner can still forget.

## How does a modern stack fit together?

The instruction, current observations, and retained history enter a task-level model that selects the next subtask. An action policy can generate its movements directly. A prediction-based planner can instead compare candidate movements before choosing one. Retained history supplies facts missing from the current view. Geometry and uncertainty can supply additional inputs. A validation layer can check proposed movements before motor control carries them out.

![Instruction, observations and history feed task selection, then movement choice, validation, motor control and feedback](/assets/robotics/modern-control/modern-stack.png "A teaching composition. Policy, prediction, memory and validation are design choices that can be combined. Fresh observations return to task selection, movement choice and history updates.")

New observations then update the next decision and the task record. The design question is which parts to combine, at which interfaces, and with what evidence that the complete loop works.

## What is still missing?

The robot now has more ways to understand our instruction, select movements, predict outcomes, and retain progress. Reliability depends on how those abilities connect.

A useful prediction must distinguish actions that lead to different physical outcomes, especially during contact. Useful memory must update after observed success, survive interruptions, and correct earlier mistakes. Useful uncertainty must change behavior before a bad estimate becomes a damaging action.

Suppose the gripper closes beside the mug. The action was attempted, but the mug was not lifted. A memory update that says “mug cleared” would corrupt the next task decision. A world model that predicts a successful lift would favor repeating the same error. Recovery requires noticing the failed outcome and choosing a different attempt.

That is also the strongest next check: hold the task and starting conditions fixed, then test whether the added prediction, memory, or uncertainty improves completion and recovery. Count missed grasps, retries, interventions, elapsed time, and damage. Check the complete job, not just whether an intermediate representation looks sensible.

Since 2010, more of robot control has become learnable, with broader knowledge and richer history entering the loop. Clearing the table still comes down to an exacting sequence: choose a useful action, execute it faithfully, observe what actually happened, and revise the next decision.

<details>
<summary>Sources, versions, and proposed next questions</summary>

Sources were checked on September 30, 2026. The archive preserves original PDFs, official transcripts and articles, retrieved text, reading locations, hashes, and live Notion context. No robot experiment was run for this article.

Historical anchors: Rusu et al., IROS 2009; PILCO, ICML 2011; Levine et al., first preprint in 2015, using the checked 2016 v5 text; RT-2 v1, July 2023. Prediction anchor: V-JEPA 2 v1, June 2025, especially its action-conditioned robot sections. Memory anchor: MEM v2, March 8, 2026. Field AI's architecture is attributed to Agha's published interview account. Waymo's description comes from its December 9, 2025 article and Dolgov's YC talk.

The table scenes, timing calculation, and five teaching diagrams are explanatory examples. The V-JEPA planning figure is reproduced from the original paper. Published task demonstrations establish behavior under their own protocols. They do not establish a ranking across these different systems.

Three proposals remain open. First, test whether predicted futures rank candidate actions correctly around contact. Reject the added model's usefulness if it does not improve action ranking or recovery over the same controller without it. Second, test whether memory can detect and repair a false completion record. A system that stores an attempted grasp as a completed step has failed that check. Third, test whether uncertainty inputs improve recovery when sensing degrades, using the same sensing changes and controller in both conditions. These questions need controlled tests and a prior-work check.

The best first source follow-up is a closer audit of memory-update failures and their outcome checks. It tests a connection the table example makes essential: the difference between intending a step and completing it.

</details>
