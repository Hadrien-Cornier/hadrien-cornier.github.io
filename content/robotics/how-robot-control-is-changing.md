---
title: 'How robot control is changing'
description: 'What changed in robot control since 2010, from modular stacks to learned actions, predictions and memory.'
date: '2026-09-30'
draft: false
---

You ask a robot to clear a table. There is a plate, a mug, and a bowl. The mug partly hides the bowl. Someone moves the plate while the robot reaches for it.

The instruction is simple, but the control problem isn't. The robot has to figure out what objects are there, where they are, what order to pick them up in, how to reach without bumping into things, how to grasp, and then check if it actually succeeded. If it misses, what should it do next?

Around 2010, researchers usually built these abilities as separate parts that talked to each other. Learning has since moved into more of those parts. Some models can turn images straight into movements. Others connect language to actions, predict what might happen, or remember what happened before. The motors still need the right commands, and those commands have to show up at the right time for the robot's body.

What's really changed is how much of this whole chain can be learned, what kind of experience the robot can actually learn from, and what information gets carried from one decision to the next.

![Branches from modular control to learned policies, learned dynamics, VLAs and memory](/assets/robotics/modern-control/branching-timeline.png "Examples overlap in time. The arrows group related approaches that continue together.")

## Around 2010: turn measurements into a plan, then close the loop

A camera just gives you pixels. A range sensor gives you distances. Neither one tells the robot to 'pick up the mug.' Usually, the system has to turn those raw measurements into a bunch of intermediate steps first.

**Perception** receives sensor measurements and returns a description of the scene. It might identify the table surface, estimate the mug's shape, and build an obstacle map. That map includes things the arm should avoid, even when it cannot name them.

**State estimation** combines measurements with earlier estimates. It returns the robot's estimated position, joint configuration, motion, and relevant uncertainty. A mug location expressed in camera coordinates must be related to the arm's coordinates. Joint sensors tell the controller where the arm actually is.

**Task planning** receives the goal and scene information. It selects steps: pick up the mug, place it in a tray, then handle the bowl. A task executive tracks which step is running and whether it succeeded. It can request a new grasp after a failure.

**Motion planning** receives a target, estimated robot state, obstacle geometry, and the robot's movement limits. It returns a feasible path or trajectory. A path describes where to move. A trajectory also specifies when. Reaching the mug requires a sequence of arm configurations that avoids the bowl and table.

**Motor control** receives the desired movement and measured joint state. It repeatedly adjusts motor commands to reduce the tracking error. The physical arm moves, sensors produce new measurements, and the loop continues.

![Six control stages with their inputs and outputs and a feedback path](/assets/robotics/modern-control/control-stack.png "A teaching stack. Real implementations share information across stages and can run them at different rates.")

This was already more than a fixed script. In a 2009 PR2 paper, Radu Rusu and colleagues built perception and motion replanning toward clearing a table with a person nearby. Their tested sequence used a simplified horizontal gripper approach and ended with the object in a graspable state. A general partial-view grasp planner remained planned work. [Rusu et al., pp. 7–8](https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=7)

The system combined three-dimensional perception, obstacle maps, motion replanning, and a higher-level executive. Its hardware control loop ran at 1 kHz, or 1,000 updates per second. The paper's architecture shows the messages passed between these parts. [Rusu et al., p. 2](https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=2)

If someone moved an object, fresh measurements could change the obstacle map and trigger replanning. The difficult work was making the representations and interfaces reliable. A good motion planner could still fail because the mug's estimated position was wrong.

So for the table task, you need both fast feedback and slower, higher-level decisions. This split isn't something that started with today's big models.

## The 2010s: learn movements and learn what movements do

Writing every grasping rule becomes difficult when cups differ in shape or sit at unfamiliar angles. One response is to learn a **policy**, a rule that chooses an action from the information available to the robot.

In *End-to-End Training of Deep Visuomotor Policies*, first released in 2015, Sergey Levine and colleagues learned a mapping from camera images and robot measurements to joint motor torques. A torque is a turning force applied at a joint. Their robot learned particular manipulation skills, including screwing on a bottle cap and hanging a coat hanger. The training process used richer state information to help teach the visual policy. [Levine et al. v5, §§1, 5](https://www.alphaxiv.org/pdf/1504.00702v5?page=13)

In these PR2 experiments, the effort interface implemented those commands by setting motor voltages roughly proportional to torque. These were feedforward commands, chosen without measured torque feedback. [Levine et al. v5, Appendix B.2, p. 33](https://www.alphaxiv.org/pdf/1504.00702v5?page=33)

For the table example, the same idea is to learn how to use the mug's appearance and the arm's position to decide the next move. Instead of a bunch of hand-designed steps, you can have one learned mapping. But the policy still depends on what the sensors see, what it's trained on, and how it sends commands.

There's another way to look at it: Before picking an action, can the robot learn what will actually happen if it does that?

This branch was already active in 2011. In **PILCO**, Marc Peter Deisenroth and Carl Edward Rasmussen learned uncertain dynamics from experience. Dynamics describe how a state changes after a control input. Their model predicted distributions over changes, rather than pretending that a small dataset determined one certain future. Those predictions helped evaluate and improve a policy. [PILCO, §§1–2](https://icml.cc/2011/papers/323_icmlpaper.pdf)

The paper states: “Second, model uncertainty must be incorporated into planning and policy evaluation.” [PILCO, p. 1](https://icml.cc/2011/papers/323_icmlpaper.pdf)

Think about learning how far a plate slides when you push it in different ways. A policy tells you, 'Which push should I try?' A dynamics model tells you, 'What will happen if I push like this?' Uncertainty becomes important when the proposed push differs from the examples you've already seen.

These choices overlap. You can use a learned model to help train a policy, so the policy can act without having to search through possible futures every time. Or you can have a controller that uses predictions while it's running. In PILCO, the main loop was about improving the policy.

Learning movements, learning how things change, and dealing with uncertainty all came before the big image-language models.

## The 2020s: connect images and language to robot actions

“Clear the table” leaves room for interpretation. Should the robot move the flowers? Is a bowl still being used? A **vision-language model**, or VLM, connects visual information with language. It can receive an image and a question or instruction, then produce a description, answer, or proposed step.

A VLM might say, 'put the empty mug in the tray.' But the robot still has to turn that sentence into something it can actually do. The skill needs the mug's location, a reachable grasp, and a movement interface. Just having a language plan isn't enough.

A **vision-language-action model**, or VLA, also produces robot actions. RT-2, published in 2023, adapted image-language models using robot trajectories alongside web tasks. It represented robot actions with tokens, the discrete symbols a model predicts. In its robot setting, those symbols encoded changes in gripper position and orientation, gripper opening, and an episode-ending command. Each continuous action dimension used 256 bins, or ranges, each encoded as a token. [RT-2 v1, §3.2, p. 5](https://www.alphaxiv.org/pdf/2307.15818v1?page=5)

The difference is in what comes out. A VLM might just say 'move right.' A VLA can actually give you a numerical movement in the robot's action representation. The system has to turn those predicted tokens back into numerical robot commands. [RT-2 v1, §3.2, p. 6](https://www.alphaxiv.org/pdf/2307.15818v1?page=6) Pretraining on images and language can help the model interpret new objects or instructions, while robot training data connects that understanding to real movements.

There are lots of ways to represent actions. The model might give you desired joint positions, a change in the gripper's pose, motor torques, or even a short sequence of commands (an **action chunk**). Each of these needs a different way to execute. For example, a gripper pose is just its position and orientation, not a list of motor currents.

Say the model asks for a small upward movement of the gripper. Some interface has to turn that into the robot's own coordinates and control convention. Then a lower-level controller uses the robot's geometry and measured state to actually move the joints. If the model gives torques directly, more of that decision has moved into the learned policy. That's why RT-2's commands and Levine's torque policy are at different points in the stack.

Timing also matters. As a teaching example, let $H$ be the number of commands in a chunk and $f$ the execution rate in commands per second. The chunk duration $T$ is:

$$
T=\frac{H}{f}=\frac{10}{20}=0.5\ \mathrm{s}.
$$

If the plate moves during that half-second, the robot needs a way to update or interrupt the queued movement. Longer chunks mean you don't need new outputs as often, but they can commit the robot further before it reacts.

Language planning and action generation can also run at separate levels. **Hi Robot** studies a hierarchy in which a higher-level model interprets the task and observations, then supplies instructions to lower-level learned control. The natural-language instruction is the interface between them. [Hi Robot v2, §4](https://www.alphaxiv.org/pdf/2502.19417v2)

These models give the robot more information to choose actions. But in the real world, the robot still needs a full loop: it has to execute commands, see what actually happened, and deal with failures.

## 2025: predict candidate futures before acting

The robot can approach the plate in several ways. It could lift before moving sideways, or slide too close to the mug. Choosing between them requires some account of the consequences.

An **action-conditioned world model** takes in what's happening now and some possible actions, and then predicts what might happen next. A planner can use a goal or a score to compare those predictions. When I say 'world model,' I mean a predictive role. Its output doesn't have to be a photorealistic video.

![Two hypothetical futures from the same side view, contrasting lifting with moving too low](/assets/robotics/modern-control/candidate-futures.png "Teaching comparison. The initial state and goal stay fixed. Only the candidate movement changes. No robot or model produced these outcomes.")

**V-JEPA 2-AC** makes this loop concrete. Meta's 2025 work first learned visual representations from broad video. Its action-conditioned version then learned to predict future visual features using robot video and gripper-state information from the DROID robot dataset. Here, a feature is a learned numerical description of an image. The training actions were constructed from changes in measured gripper state between frames. “Unlabeled” robot video meant no task or success labels, rather than no movement information. [V-JEPA 2, §3.1](https://www.alphaxiv.org/pdf/2506.09985?page=9)

During planning, it receives a current image, the current gripper state, and candidate action sequences. It predicts future features. A separate goal image specifies the desired result. The planner searches for actions whose predicted final features are close to the goal's features. It executes the first action, observes again, and repeats. This is **receding-horizon control**: plan ahead, carry out a short part, then revise the plan. [V-JEPA 2, §3.2](https://www.alphaxiv.org/pdf/2506.09985?page=10)

For the plate, the planner would compare predictions for lifting it and sliding it. It needs a way to tell the difference between clearing the mug and bumping into it. A fancy-looking prediction that misses that contact isn't as useful as a rough prediction that actually ranks the actions correctly.

The authors demonstrated image-goal reaching and object manipulation on Franka arms in two labs. Pick-and-place used supplied intermediate goal images, with goal switches after fixed numbers of steps. [V-JEPA 2 v1, §4.2, p. 13](https://www.alphaxiv.org/pdf/2506.09985v1?page=13) A lower-level controller moved the arm for each chosen gripper command. The planner waited for that command to finish before sending another. Their single-step planning test on an RTX 4090 took 16 seconds per action. Camera placement affected performance, and prediction errors limited longer planning. [V-JEPA 2, §§4.1–4.3](https://www.alphaxiv.org/pdf/2506.09985?page=12), [Table 3](https://www.alphaxiv.org/pdf/2506.09985?page=15)

This example shows that you can connect predictions to control for specific, limited tasks. But it doesn't answer how to make that connection fast and reliable when the job keeps changing, like in a real household.

<details>
<summary>Original planning figure and other ways to use predictions</summary>

![Original V-JEPA 2 planning diagram showing observations, candidate actions and a goal-image comparison](/assets/robotics/modern-control/vjepa-planning.png "V-JEPA 2, original Figure 7, PDF p. 11. The model rolls candidate actions forward in feature space. The planner minimizes distance to the goal features.")

Figure 7 from Assran et al., *V-JEPA 2*, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cropped from PDF page 11; original labels preserved.

In the original diagram, $E$ encodes an image as features, $P$ predicts features after candidate actions, and $L_1$ measures their distance from goal features. The full-image link opens the original labels at a larger size. [Original paper, p. 11](https://www.alphaxiv.org/pdf/2506.09985?page=11)

Predicting futures and searching through them as you go are two different things. PILCO used uncertain dynamics to make the policy better. Dreamer trains policies by imagining what could happen. Some systems predict future video and then figure out actions from that, or they learn both action and prediction at the same time. A VLA can use predictive training or work with a world model. These categories overlap.

[DreamerV3 v2](https://www.alphaxiv.org/pdf/2301.04104v2?page=2) illustrates learning behavior from imagined trajectories.

V-JEPA 2's Table 3 reports 800 sampled action sequences, ten refinement rounds, and a planning horizon of one for its 16-second action computation on a single RTX 4090. These settings describe the reported test. [Table 3](https://www.alphaxiv.org/pdf/2506.09985?page=15)

For pick-and-place, the supplied images showed the object grasped, near the destination, and at the final goal. The planner followed these goals for four, ten, and four steps respectively. [V-JEPA 2 v1, Appendix B.2, p. 37](https://www.alphaxiv.org/pdf/2506.09985v1?page=37)

</details>

## 2025–2026: supply physical structure and uncertainty

A mug has a certain shape. The table has a height. The robot arm can only reach so far. Sometimes sensors aren't reliable. A model can learn some of this from data, but a system can also compute this information and supply it directly.

In Brian Heater's A3 interview, **Ali Agha, Field AI's founder**, describes combining raw measurements with computed geometry and uncertainty. At 30:09, he explains that the network also receives representations of shapes, elevations, traversability, and localizability. Traversability concerns where a robot can move. Localizability concerns how well it can determine its position. His surrounding account describes tokenized representations supplied inside the network. [A3 transcript, 28:01–30:09](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha)

From 32:04 onward, Agha describes calculating confidence in different sensing channels. The learned component receives those uncertainty estimates alongside raw data. He says: “You do all of that calculation, and that's just a suggestion to the network.” [A3 transcript, 32:04 onward](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha) [Watch the architecture explanation](https://www.youtube.com/watch?v=twIy5ZSGU8U&t=1809s).

**Waymo** describes another use of structure in its December 2025 architecture article. Learned representations are accompanied by explicit objects, semantic attributes, and road structure. The article also describes a separate onboard layer that validates generated trajectories. [Waymo's architecture](https://waymo.com/blog/2025/12/demonstrably-safe-ai-for-autonomous-driving/)

In his YC talk, **Dmitri Dolgov** argues for combining useful explicit structure with learned representations. [Official transcript, lesson 4](https://www.ycrootaccess.com/p/dmitri-dolgov-seven-lessons-from) [Watch from 30:09](https://www.youtube.com/watch?v=Gp4zrV3-6N8&t=1809s).

For the table example, if you give the model an estimate of the mug's shape and some uncertainty, it has more to work with. If you set a rule that blocks planned movements through that estimated shape, it changes which actions can run. **Supplying information and enforcing constraints aren't the same thing.** The model might ignore or misuse uncertainty inputs. And a constraint only works as well as the measurements and assumptions behind it.

If the bowl is hidden, uncertainty should change what the robot does next. Maybe it should move to get a better view before reaching. The real question is: does using uncertainty actually help the robot behave better when it doesn't have good information?

## 2026: remember what the current view cannot tell you

The table is almost clear. There's a plate next to the sink. Has it already been washed, or did someone just put it there? The current image could look the same either way. What the robot should do next depends on what happened before.

![The same current plate image with two histories leading to different next subtasks](/assets/robotics/modern-control/different-history.png "Teaching comparison. The current view and instruction stay fixed. Earlier events determine whether washing or storage should come next.")

Robots have long used things like maps, object tracking, task state, and recurrent models to keep track of history. Modern VLAs are different in how much history they actually get. How you use memory is a design choice in robot learning.

**MEM, Multi-Scale Embodied Memory**, combines two forms. Recent visual history preserves details such as a slipped grasp or an object briefly hidden by the arm. Longer text records summarize events that remain useful after their images have disappeared. In its March 2026 paper, Marcel Torne and colleagues integrate both into a VLA system. [MEM v2, §III](https://www.alphaxiv.org/pdf/2603.03596v2?page=3)

Its higher-level policy receives observations, the task, and the earlier text summary. It produces a subtask instruction and an updated summary. Its lower-level policy receives recent observations and instructions, then produces continuous action chunks. The text record could retain “the plate was washed.” Recent video could retain how it slipped during the last attempted lift. [MEM v2, §§III-A–D](https://www.alphaxiv.org/pdf/2603.03596v2?page=3)

The authors report memory use during kitchen tasks lasting up to fifteen minutes. Their comparisons test visual memory, text memory, and their combination within their system. [MEM v2, §IV-A](https://www.alphaxiv.org/pdf/2603.03596v2?page=6) [Marcel Torne's explanation, 7:59](https://www.youtube.com/watch?v=myDCd0hNqQU&t=479s) [Memory mechanisms, 11:10](https://www.youtube.com/watch?v=myDCd0hNqQU&t=670s).

How long you keep memory and how you organize decisions are separate questions. Recent video keeps details, while longer text keeps summaries. Fast movement control is different from slower, higher-level planning. A fast policy can use history, but a slower planner might still forget things.

## How does a modern stack fit together?

So here's how it fits together: The instruction, current measurements, and any history go into a task-level model that picks the next subtask. The action policy might just generate movements directly, or a prediction-based planner might compare different moves before picking one. History fills in facts you can't see right now. Geometry and uncertainty can be extra inputs. You can also have a validation step to check movements before the motors actually do them.

![Instruction, observations and history feed task selection, then movement choice, validation, motor control and feedback](/assets/robotics/modern-control/modern-stack.png "A teaching composition. Policy, prediction, memory and validation are design choices that can be combined. Fresh observations return to task selection, movement choice and history updates.")

New observations update both the next decision and the task record. The real design question is: which parts do you combine, where do you connect them, and how do you know the whole loop actually works?

## What is still missing?

Robots now have more ways to understand instructions, pick movements, predict what will happen, and keep track of progress. But their reliability depends on how well all those pieces work together.

A good prediction has to tell the difference between actions that lead to different results, especially when things touch. Good memory needs to update after observed success, survive interruptions, and fix earlier mistakes. Useful uncertainty should change what the robot does before a bad guess turns into a real problem.

Say the gripper closes next to the mug, but doesn't actually lift it. If the memory says 'mug cleared,' that's going to mess up the next decision. A world model that predicts a successful lift would favor repeating the same mistake. To recover, the robot has to notice the failure and try something else.

That's the key test: keep the task and starting point the same, and see if adding prediction, memory, or uncertainty actually helps the robot finish and recover. Count things like missed grasps, retries, interventions, time taken, and any damage. Don't just look at whether some internal state looks good. Check if the whole job gets done better.

Since 2010, more parts of robot control can be learned, and the robot can use more knowledge and history. But clearing the table still means you have to pick a good action, do it right, see what really happened, and then adjust your next move.

<details>
<summary>Sources, versions, and proposed next questions</summary>

Sources were checked on September 30, 2026. The archive preserves original PDFs, official transcripts and articles, retrieved text, reading locations, hashes, and live Notion context. No robot experiment was run for this article.

Historical anchors: Rusu et al., IROS 2009; PILCO, ICML 2011; Levine et al., first preprint in 2015, using the checked 2016 v5 text; RT-2 v1, July 2023. Prediction anchor: V-JEPA 2 v1, June 2025, especially its action-conditioned robot sections. Memory anchor: MEM v2, March 8, 2026. Field AI's architecture is attributed to Agha's published interview account. Waymo's description comes from its December 9, 2025 article and Dolgov's YC talk.

The table scenes, timing calculation, and five teaching diagrams are explanatory examples. The V-JEPA planning figure is reproduced from the original paper. Published task demonstrations establish behavior under their own protocols. They do not establish a ranking across these different systems.

Three proposals remain open. First, test whether predicted futures rank candidate actions correctly around contact. Reject the added model's usefulness if it does not improve action ranking or recovery over the same controller without it. Second, test whether memory can detect and repair a false completion record. A system that stores an attempted grasp as a completed step has failed that check. Third, test whether uncertainty inputs improve recovery when sensing degrades, using the same sensing changes and controller in both conditions. These questions need controlled tests and a prior-work check.

The best first source follow-up is a closer audit of memory-update failures and their outcome checks. It tests a connection the table example makes essential: the difference between intending a step and completing it.

</details>
