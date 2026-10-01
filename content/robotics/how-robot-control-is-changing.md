---
title: 'How robot control is changing'
description: 'What changed in how a robot chooses its next movement, and what is still missing?'
date: '2026-09-30'
updated: '2026-10-01'
draft: false
---

Ask a robot arm to pick up a small green block and put it in a tray. The camera sees the block. The arm starts reaching. Then someone moves it a few centimetres to the right.

The motors can still follow their commands perfectly and miss the block. Something has to notice the change and choose a different movement.

This small task gives us a way to follow robot control from around 2010 to today. What changed in how a robot chooses its next movement, and what is still missing when the first attempt fails?

We'll keep the arm, block and tray fixed. What changes is the information used to choose a movement, how that choice is made, and the command sent to the body.

![The same arm and table before and after a green block moves. The old location is outlined. A dashed new reach ends at the moved block.](/assets/robotics/modern-control/v2/observe-again.png "Left: the reach fits the observed block. Right: the block moves while the gripper stays in the same place. A fresh observation can change the next reach. The dashed line is a proposed revised reach.")

```robotics-timeline
{
  "id": "control-evolution",
  "heading": "What changes inside action choice?",
  "intro": "Follow the moved block. Each stage shows how supplied observations become a movement command.",
  "caption": "Badges describe processing: Designed rules or search; Learned encoders, predictors or policies; Persistent motor control and feedback. Sensor values are supplied inputs. Approaches overlap.",
  "roles": [
    {
      "id": "goal",
      "label": "Goal and task selection"
    },
    {
      "id": "scene",
      "label": "Scene processing"
    },
    {
      "id": "choice",
      "label": "Movement choice"
    },
    {
      "id": "output",
      "label": "Action output processing"
    },
    {
      "id": "motor",
      "label": "Motor control",
      "persistent": true
    },
    {
      "id": "feedback",
      "label": "Fresh feedback",
      "persistent": true
    }
  ],
  "stages": [
    {
      "id": "planned-loop",
      "year": "Around 2010",
      "title": "Plan from estimated positions",
      "summary": "The moved block changes the estimate and reach.",
      "mechanism": "Perception and state estimates feed task and motion planning. Fresh measurements can trigger replanning.",
      "anchor": "section-around-2010-build-the-loop",
      "stack": [
        {
          "role": "goal",
          "text": "Task planner selects the pickup",
          "mode": "designed"
        },
        {
          "role": "scene",
          "text": "Designed estimates from supplied images and joint readings",
          "mode": "designed"
        },
        {
          "role": "choice",
          "text": "Motion planner finds a feasible reach",
          "mode": "designed"
        },
        {
          "role": "output",
          "text": "Path or timed joint targets",
          "mode": "designed"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "PR2 architecture, 2009",
          "href": "https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=2"
        }
      ]
    },
    {
      "id": "early-learning",
      "year": "2011 to 2016",
      "title": "Learn a policy or dynamics",
      "summary": "Learning enters action choice and prediction.",
      "mechanism": "A policy maps observations to commands. Uncertain learned dynamics can help improve that policy.",
      "anchor": "section-the-2010s-learn-movements-and-dynamics",
      "stack": [
        {
          "role": "goal",
          "text": "Supplied manipulation objective",
          "mode": "designed"
        },
        {
          "role": "scene",
          "text": "Learned image encoding; measured robot state supplied",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "Learned policy; model-assisted training",
          "mode": "learned"
        },
        {
          "role": "output",
          "text": "Levine: nominal torque commands",
          "mode": "learned"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "PILCO, 2011",
          "href": "https://icml.cc/2011/papers/323_icmlpaper.pdf"
        },
        {
          "label": "Levine v5: actual PR2 interface",
          "href": "https://www.alphaxiv.org/pdf/1504.00702v5?page=33"
        }
      ]
    },
    {
      "id": "demonstration-chunks",
      "year": "2023",
      "title": "Learn future targets",
      "summary": "Demonstrations connect observations to action chunks.",
      "mechanism": "ACT predicts joint targets. Temporal ensembling combines predictions for the same execution moment.",
      "anchor": "section-2023-learn-from-demonstrations",
      "stack": [
        {
          "role": "goal",
          "text": "The task taught by demonstrations",
          "mode": "designed"
        },
        {
          "role": "scene",
          "text": "Learned image features; measured joint positions supplied",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "ACT predicts overlapping target chunks",
          "mode": "learned"
        },
        {
          "role": "output",
          "text": "Joint-position targets",
          "mode": "learned"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "ACT: collection and execution",
          "href": "https://www.roboticsproceedings.org/rss19/p016.pdf#page=5"
        }
      ]
    },
    {
      "id": "action-distribution",
      "year": "2023",
      "title": "Keep several valid routes",
      "summary": "Different successful paths can remain distinct.",
      "mechanism": "Diffusion refines a numerical action sample using observations. Execute a portion, then update.",
      "anchor": "section-2023-choose-among-several-valid-movements",
      "stack": [
        {
          "role": "goal",
          "text": "The demonstrated task",
          "mode": "designed"
        },
        {
          "role": "scene",
          "text": "Learned encoding of supplied recent observations",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "Sample a coherent action sequence",
          "mode": "learned"
        },
        {
          "role": "output",
          "text": "Chosen position or velocity commands",
          "mode": "learned"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "Diffusion Policy, 2023",
          "href": "https://www.roboticsproceedings.org/rss19/p026.pdf#page=3"
        }
      ]
    },
    {
      "id": "language-actions",
      "year": "2023 to 2025",
      "title": "Connect language to action",
      "summary": "Broad semantic knowledge meets robot action data.",
      "mechanism": "RT-2 encodes actions as tokens. The pi family generates continuous chunks; pi0.5 also predicts subtasks.",
      "anchor": "section-2023-to-2025-add-images-and-language",
      "stack": [
        {
          "role": "goal",
          "text": "π0.5: subtask prediction from supplied language and images",
          "mode": "learned"
        },
        {
          "role": "scene",
          "text": "Learned encoding of supplied images, language and robot state",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "Vision-language-action policy",
          "mode": "learned"
        },
        {
          "role": "output",
          "text": "Tokens or continuous action chunks",
          "mode": "learned"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "RT-2 v1",
          "href": "https://www.alphaxiv.org/pdf/2307.15818v1?page=5"
        },
        {
          "label": "pi0.5 v1",
          "href": "https://www.alphaxiv.org/pdf/2504.16054v1?page=5"
        }
      ]
    },
    {
      "id": "predicted-futures",
      "year": "2023 to 2025",
      "title": "Use predicted consequences",
      "summary": "Prediction can serve execution, data or planning.",
      "mechanism": "V-JEPA 2-AC uses designed candidate sampling and refinement with a learned predictor. It compares future features with a supplied goal image, executes one action and replans.",
      "anchor": "section-2023-to-2025-use-possible-futures",
      "stack": [
        {
          "role": "goal",
          "text": "V-JEPA: supplied goal image",
          "mode": "designed"
        },
        {
          "role": "scene",
          "text": "Learned image features; measured end-effector state supplied",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "Candidate sampling and refinement with a learned predictor",
          "mode": "designed"
        },
        {
          "role": "output",
          "text": "Convert selected end-effector change into a command",
          "mode": "designed"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "V-JEPA 2 v1",
          "href": "https://www.alphaxiv.org/pdf/2506.09985v1?page=10"
        },
        {
          "label": "UniPi v1",
          "href": "https://www.alphaxiv.org/pdf/2302.00111v1?page=4"
        },
        {
          "label": "DreamGen v1",
          "href": "https://www.alphaxiv.org/pdf/2505.12705v1?page=3"
        }
      ]
    },
    {
      "id": "physical-information",
      "year": "2025 to 2026",
      "title": "Add structure and checks",
      "summary": "Computed inputs and enforcing constraints have different jobs.",
      "mechanism": "Agha describes geometry and uncertainty inputs. Waymo describes explicit scene structure and separate trajectory validation.",
      "anchor": "section-2025-to-2026-add-physical-structure",
      "stack": [
        {
          "role": "goal",
          "text": "Supplied task or destination",
          "mode": "designed"
        },
        {
          "role": "scene",
          "text": "Learned features plus computed geometry and uncertainty inputs",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "Use structure and uncertainty in action choice",
          "mode": "learned"
        },
        {
          "role": "output",
          "text": "Waymo: designed validation of learned commands",
          "mode": "designed"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "Agha official transcript",
          "href": "https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha"
        },
        {
          "label": "Waymo architecture, December 2025",
          "href": "https://waymo.com/blog/2025/12/demonstrably-safe-ai-for-autonomous-driving/"
        }
      ]
    },
    {
      "id": "retained-history",
      "year": "2026",
      "title": "Remember what changes the next move",
      "summary": "The same view can require a different subtask.",
      "mechanism": "MEM retains recent visual history and longer text records for task selection and movement generation.",
      "anchor": "section-2026-keep-the-history-that-changes-the-next-move",
      "stack": [
        {
          "role": "goal",
          "text": "Learned subtask selection from task, observations and record",
          "mode": "learned"
        },
        {
          "role": "scene",
          "text": "Learned visual encoding and text-summary updates",
          "mode": "learned"
        },
        {
          "role": "choice",
          "text": "History-conditioned action policy",
          "mode": "learned"
        },
        {
          "role": "output",
          "text": "Continuous action chunks",
          "mode": "learned"
        },
        {
          "role": "motor",
          "text": "Body-specific command execution",
          "mode": "persistent"
        },
        {
          "role": "feedback",
          "text": "New sensor measurements",
          "mode": "persistent"
        }
      ],
      "sources": [
        {
          "label": "MEM v2",
          "href": "https://www.alphaxiv.org/pdf/2603.03596v2?page=3"
        }
      ]
    }
  ]
}
```

## Around 2010: build the loop

A camera supplies pixels. Joint sensors supply measurements of the arm. A conventional system turns them into several useful answers before asking the motors to move.

**Perception** identifies the block, estimates its shape and builds a picture of obstacles. **State and position estimation** relates those measurements to the robot. Where is the block relative to the arm? Where are the joints now? How certain are those estimates?

**Task planning** receives the goal and scene information. It selects a step such as “pick up the block”, then “place it in the tray”. A task executive tracks progress and can request another attempt.

**Motion planning** receives the target, estimated arm state, obstacles and movement limits. It returns a path or a timed trajectory. The trajectory tells the arm how to approach the block without crossing the table or another object.

**Motor control** receives the selected targets and measured joint state. It adjusts actuation to follow the requested movement. New camera and joint measurements return to the system. A changed block position can trigger a new plan.

This was already a feedback loop. Rusu and colleagues' 2009 PR2 system combined three-dimensional perception, an obstacle map, motion replanning and a higher-level executive. Its tested grasp approach was simplified: it approached horizontally and left the object in a graspable state. A general partial-view grasp planner remained planned work. [Rusu et al., pp. 2, 7–8](https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=7)

A presentation illustrates a narrower case with a toy alligator. An arm replays a fixed movement and misses when the toy moves. The presenter also points to visual servoing, which uses visual error to guide corrections. Blind replay shows what happens when observations don't change the action choice. Classical robotics also includes methods that make those corrections.

## The 2010s: learn movements and dynamics

Writing a rule for every object and approach becomes difficult. One response is to learn a **policy**, a rule that chooses an action from available information.

In work first released in 2015, Levine and colleagues learned manipulation policies from camera images and robot measurements. Their nominal outputs were joint torques, turning forces at the joints. On the PR2, the effort interface implemented these through feedforward motor voltages roughly proportional to torque, without measured torque feedback. [Levine et al. v5, p. 13](https://www.alphaxiv.org/pdf/1504.00702v5?page=13), [p. 33](https://www.alphaxiv.org/pdf/1504.00702v5?page=33)

For our block, a learned policy could connect its appearance and the arm's state directly to a movement command. The action interface determines what the rest of the robot must do with that output.

Learning consequences was another branch. **PILCO**, published in 2011, learned uncertain dynamics: how the state changes after a control input. It used those predictions to evaluate and improve a policy. The paper says: “Second, model uncertainty must be incorporated into planning and policy evaluation.” [PILCO, p. 1](https://icml.cc/2011/papers/323_icmlpaper.pdf)

A policy asks which push to make. A dynamics model asks how that push would move the block. Learning movements, predicting consequences and handling uncertainty already overlapped here.

## 2023: learn from demonstrations

Now let a person show the arm how to pick up the block from different positions. Record what the cameras see, what the robot measures and which commands the person supplies. Training can use these examples to learn the next movement.

**ALOHA** made this process concrete with paired leader and follower arms. A person moves the leaders. The followers mirror them. The recorded leader joint positions supply action targets; follower joint measurements and camera images supply observations. [ALOHA, pp. 3–5](https://www.roboticsproceedings.org/rss19/p016.pdf#page=4)

Collection and execution are different phases. During collection, a person supplies the movement. During training, a model learns from the records. During autonomous execution, the model receives observations and produces targets without the person moving the leader.

The accompanying method, **Action Chunking with Transformers**, or ACT, predicts a sequence of future joint targets from current images and measured joint positions. This is an **action chunk**. A lower-level controller tracks the targets. [ACT, p. 5](https://www.roboticsproceedings.org/rss19/p016.pdf#page=5)

![Three top views show the same arm reaching for the block, closing its gripper and carrying it toward the tray. Both links keep their lengths.](/assets/robotics/modern-control/v2/action-chunk.png "Three selected moments from a possible command sequence. Each command sets a target for the controller. The two arm links keep their lengths as the joints turn.")

Predicting ten targets doesn't require blindly executing all ten. ACT's temporal ensembling queries the policy every timestep. Several predictions then refer to the same future moment. It combines those predictions to choose that moment's target. The released code also supports sequential chunks when temporal aggregation is disabled. [ACT, §IV-A, p. 5](https://www.roboticsproceedings.org/rss19/p016.pdf#page=5), [official execution code](https://github.com/tonyzhaozh/act/blob/742c753c0d4a5d87076c8f69e5628c79a8cc5488/imitate_episodes.py#L191)

Three rates matter: how often the camera captures an image, how often the policy computes new actions, and how often the motor controller corrects the movement. They needn't be equal. Faster motor correction cannot compensate for an action choice based on an old block position.

## 2023: choose among several valid movements

Suppose an obstacle sits between the gripper and block. A person can approach from either side. Both paths work. Averaging their positions could produce a path straight through the obstacle.

**Diffusion Policy** learns a conditional distribution of action sequences. A distribution can represent several possible answers for the same observations. It can produce one coherent route instead of averaging incompatible routes together. [Diffusion Policy, §§II-C, IV-A, pp. 3–4](https://www.roboticsproceedings.org/rss19/p026.pdf#page=3)

At runtime, it starts with a random numerical action sample. It repeatedly refines that sample using the observations until it obtains an action sequence. These denoising steps happen inside the computation. The arm moves when the resulting commands are executed.

The original method predicts a sequence, executes a selected portion, then receives new observations and predicts again. The prediction horizon and execution horizon are separate choices. Its action representation can also vary, including position or velocity commands. [Diffusion Policy, pp. 3–4](https://www.roboticsproceedings.org/rss19/p026.pdf#page=3)

For a simple schedule, let $T$ be the nominal horizon covered by $H$ predicted targets, sent at a uniform rate $f$ in targets per second. Each target occupies $1/f$ seconds. Ten targets at twenty per second cover:

$$
T=\frac{H}{f}=\frac{10}{20}=0.5\ \mathrm{s}.
$$

Executing two targets before updating gives a nominal $2/f=0.1\ \mathrm{s}$ interval, assuming a fresh observation and the next prediction are ready at that boundary. Waiting or stale queued commands can extend the actual reaction time. A chunk's length alone doesn't tell us how quickly the robot reacts when the block moves.

## 2023 to 2025: add images and language

Demonstrations connect observations to movements. A broader question is whether the robot can also use knowledge of objects and instructions learned elsewhere.

A **vision-language model**, or VLM, receives images and language. It might answer a question or suggest “put the green block in the tray”. A robot system must turn that sentence into an executable movement.

A **vision-language-action model**, or VLA, also produces robot actions. **RT-2**, published in 2023, trained image-language models with robot trajectories alongside web tasks. Broad image-language training supplies semantic knowledge. Robot action data connects that knowledge to movements the body can perform. [RT-2 v1, §§3.1–3.2](https://www.alphaxiv.org/pdf/2307.15818v1?page=4)

RT-2 encoded gripper position and orientation changes, gripper opening and a discrete termination command as tokens, discrete symbols the model predicts. Each continuous action dimension used 256 bins, or ranges, each encoded as a token. The system converts predicted tokens back into numerical robot commands. [RT-2 v1, pp. 5–6](https://www.alphaxiv.org/pdf/2307.15818v1?page=5)

Physical Intelligence's **π0**, introduced in 2024, combines a pretrained VLM with an action expert that generates continuous action chunks. It receives images, language and robot state. Its flow-matching process turns a random numerical sample into actions conditioned on those inputs. As with diffusion, that computation happens before the commands move the arm. [π0, RSS 2025, §IV, pp. 4–5](https://www.roboticsproceedings.org/rss21/p010.pdf#page=4)

**π0.5**, introduced in April 2025, changes the training recipe and task-level inference. It combines data from different robots with web tasks, object localization, semantic subtask labels and human language instructions. Broad training uses discrete action tokens. Later training adds continuous action generation. At runtime, the same model first predicts a subtask, then generates actions conditioned on it. [π0.5 v1, §§IV-A–D, pp. 5–7](https://www.alphaxiv.org/pdf/2504.16054v1?page=5)

For our task, that could mean selecting “pick up the block”, then choosing its movements. The command still has to match the body. In the π0.5 study, targets for arms, grippers and lift, plus base velocities, were tracked by lower-level controllers. [π0.5 v1, §IV-E, p. 7](https://www.alphaxiv.org/pdf/2504.16054v1?page=7)

Joint targets, gripper poses and torques are different interfaces. A gripper pose specifies position and orientation. An execution system must translate it into joint movement. Adding language changes the information available for choosing an action; the body still needs a usable command.

## 2023 to 2025: use possible futures

The arm now has several candidate movements. Which one will reach the block without striking the obstacle? A **world model** predicts how a situation might change. The useful output could be video, numerical state or learned features.

![Two identical top views of an arm, block, tray and obstacle. One dashed path goes around the obstacle. The other passes through it, with the conflict circled.](/assets/robotics/modern-control/v2/candidate-paths.png "Top view. The start, goal and obstacle stay fixed. Left: a candidate goes around the obstacle. Right: a candidate crosses it. A predictive planner needs to distinguish their consequences. Dashed paths are hypothetical gripper paths.")

Predictions can serve three different jobs.

**UniPi**, from 2023, generates a proposed future video from a current image and language goal. A separately trained inverse dynamics model infers actions between frames. The generated video supplies a plan; the inferred actions supply commands. Its original experiments used open-loop execution: the robot executed the plan without replanning from fresh observations, to reduce computation. [UniPi v1, §3.2, p. 4](https://www.alphaxiv.org/pdf/2302.00111v1?page=4)

**DreamGen**, published in 2025, uses generated video to train another policy. It adapts a video model to the robot, generates videos from starting images and instructions, and infers pseudo-action labels. The resulting examples train a separate visuomotor policy. Video generation happens in the data pipeline, rather than being required for each movement of the deployed policy. [DreamGen v1, §§2.1–2.4, pp. 3–4](https://www.alphaxiv.org/pdf/2505.12705v1?page=3)

**V-JEPA 2-AC**, also from 2025, predicts consequences in feature space and uses them for planning. Features are learned numerical descriptions of images. Its action-conditioned model learned from video and measured end-effector state in the DROID robot dataset. Here, end-effector state means position, orientation and gripper opening. Movement information came from changes in that state. [V-JEPA 2 v1, §3.1, p. 9](https://www.alphaxiv.org/pdf/2506.09985v1?page=9)

At runtime, it receives the current image, end-effector state and candidate action sequences. It predicts future features. A goal image supplies the desired result. The planner samples and refines candidate actions to bring their predicted final features closer to the goal's features. It executes the first action, observes again and replans. This is **receding-horizon control**. [V-JEPA 2 v1, §3.2, p. 10](https://www.alphaxiv.org/pdf/2506.09985v1?page=10)

The authors tested image-goal reaching and manipulation on Franka arms in two labs. Pick-and-place used supplied intermediate goal images, switched after fixed numbers of steps. A lower-level controller completed each selected gripper command before the next was sent. Camera placement and prediction errors affected the reported behavior. [V-JEPA 2 v1, §§4.1–4.3, pp. 12–15](https://www.alphaxiv.org/pdf/2506.09985v1?page=12)

For our block, useful prediction means distinguishing the route around the obstacle from the route through it. Visual detail matters when it changes that choice. Training data generation, video-based action extraction and feature-based planning give predictions different jobs within the stack.

<details>
<summary>Prediction methods, original planning figure and execution details</summary>

![Original V-JEPA 2 planning diagram showing observations, candidate actions and a goal-image comparison](/assets/robotics/modern-control/vjepa-planning.png "V-JEPA 2, original Figure 7, PDF p. 11. Candidate actions are rolled forward in feature space and compared with goal features.")

Figure 7 from Assran et al., *V-JEPA 2*, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cropped from PDF page 11; original labels preserved. [Full image](/assets/robotics/modern-control/vjepa-planning.png), [paper, p. 11](https://www.alphaxiv.org/pdf/2506.09985v1?page=11).

Here, $E$ encodes an image as features, $P$ predicts future features, and $L_1$ measures their distance from goal features. Table 3 reports a 16-second single-step planning computation on one RTX 4090, with 800 sampled action sequences and ten refinement rounds. That setting describes this reported test. [V-JEPA 2 v1, p. 15](https://www.alphaxiv.org/pdf/2506.09985v1?page=15)

The cross-entropy method here is a designed search procedure: sample action sequences, retain useful candidates and refine the sampling distribution. The learned predictor supplies the future features. [V-JEPA 2 v1, p. 11](https://www.alphaxiv.org/pdf/2506.09985v1?page=11)

Pick-and-place followed supplied images of the object grasped, near its destination and at the goal for four, ten and four steps respectively. [Appendix B.2, p. 37](https://www.alphaxiv.org/pdf/2506.09985v1?page=37)

UniPi's v1 describes both open-loop and closed-loop possibilities, but uses open-loop action execution in its experiments. Its real-robot-video transfer section evaluates generated videos, rather than establishing that every generated plan was physically executed. An inverse dynamics model requires a suitable action interface and training data. [UniPi v1, §3.2, p. 4](https://www.alphaxiv.org/pdf/2302.00111v1?page=4), [§4.3, pp. 7–8](https://www.alphaxiv.org/pdf/2302.00111v1?page=7)

DreamGen offers inverse-dynamics pseudo-labels and latent action labels. Latent actions summarize visual change; they are not automatically calibrated motor commands. Its downstream policy recipe depends on which labels are used. [DreamGen v1, §§2.3–2.4, p. 4](https://www.alphaxiv.org/pdf/2505.12705v1?page=4)

Predictions can also improve a policy during training. PILCO used uncertain dynamics for policy search. [DreamerV3 v2](https://www.alphaxiv.org/pdf/2301.04104v2?page=2) trains behavior with imagined trajectories. A VLA can use predictive training or work with a planner. These choices overlap.

ACT's original hardware account separates 50 Hz target transmission from a motor controller operating above 1 kHz. That number does not establish camera capture or inference latency for another robot. Temporal ensembling is implemented as repeated chunk prediction and aggregation for the same execution timestep. [ACT, pp. 4–5](https://www.roboticsproceedings.org/rss19/p016.pdf#page=4)

</details>

## 2025 to 2026: add physical structure

The block has a shape. The arm has a reach limit. The obstacle occupies space. A learned model can infer some of this, and the system can also compute useful physical information explicitly.

In Brian Heater's A3 interview, **Ali Agha, Field AI's founder**, describes supplying computed geometry and uncertainty alongside raw measurements. Shapes, elevation, traversability and localizability become representations the network can use. Traversability concerns where a robot can move. Localizability concerns how well it can determine its position. [A3 transcript, 28:01–30:09](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha)

From 32:04, Agha describes calculated confidence in sensing channels. He says: “You do all of that calculation, and that's just a suggestion to the network.” [A3 transcript](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha), [architecture explanation, 30:09](https://www.youtube.com/watch?v=twIy5ZSGU8U&t=1809s).

**Waymo's December 2025 architecture account** combines learned representations with explicit objects, semantic attributes and road structure. It also describes a separate layer that validates generated trajectories. **Dmitri Dolgov** argues for useful explicit structure alongside learning in his YC talk. [Waymo architecture](https://waymo.com/blog/2025/12/demonstrably-safe-ai-for-autonomous-driving/), [Dolgov's transcript, lesson 4](https://www.ycrootaccess.com/p/dmitri-dolgov-seven-lessons-from), [talk, 30:09](https://www.youtube.com/watch?v=Gp4zrV3-6N8&t=1809s).

For our arm, an estimated obstacle shape is an input to action choice. A rule that rejects movements through that shape constrains execution. Supplying information and enforcing a constraint are different mechanisms. Both depend on useful measurements.

If the block's edge is hidden, uncertainty could make the robot seek a better view before reaching. The important connection is from weak information to a different next action.

## 2026: keep the history that changes the next move

Extend the job slightly: inspect the block before putting it away. The current image may look the same before and after inspection. The next subtask depends on what has already happened.

![One shared current view of the arm and block branches into two task records. Inspection pending leads to inspect first; inspection done leads to put away.](/assets/robotics/modern-control/v2/history-changes-action.png "The same current image supports different next subtasks when the recorded history differs. A longer language record keeps inspection status; recent visual history can keep details of the latest grasp.")

Robots have long retained maps, tracked objects and task state. Modern policies also differ in the history they receive. **MEM, Multi-Scale Embodied Memory**, combines recent visual history with longer text records in a VLA system. [MEM v2, §III, pp. 3–5](https://www.alphaxiv.org/pdf/2603.03596v2?page=3)

Recent images preserve details such as a slipped grasp or an object briefly hidden by the arm. Text summaries keep events useful after those images disappear. MEM's higher-level policy uses observations, the task and the earlier summary to choose a subtask and update the summary. Its lower-level policy uses recent observations and instructions to produce continuous action chunks. [MEM v2, §§III-A–D](https://www.alphaxiv.org/pdf/2603.03596v2?page=3)

The authors report kitchen tasks lasting up to fifteen minutes and compare visual memory, text memory and their combination. [MEM v2, §IV-A, p. 6](https://www.alphaxiv.org/pdf/2603.03596v2?page=6), [Marcel Torne's explanation, 7:59](https://www.youtube.com/watch?v=myDCd0hNqQU&t=479s), [mechanisms, 11:10](https://www.youtube.com/watch?v=myDCd0hNqQU&t=670s).

Recent versus longer memory describes what information is retained. A fast movement policy and a slower task-level planner describe how decisions are organized, sometimes called a System 1/System 2 hierarchy. These are separate design choices. A fast policy can use history. A slower planner can still forget.

## What is still missing?

Our arm now has several ways to choose its next movement. Demonstrations can teach a policy. Language can identify the job and subtask. Prediction can compare consequences. Physical information can inform a choice or constrain execution. Memory can supply facts missing from the current image.

The complete loop must connect them. Current observations and retained history should inform task selection and movement choice. Selected commands must match the body. Fresh feedback must update both the next action and the record of progress.

Suppose the gripper closes beside the block. The command finished, but the pickup failed. A summary saying “block put away” would corrupt the next decision. A prediction that keeps promising the same successful grasp could trap the arm in repeated attempts.

Recovery needs evidence of what happened, a corrected task record and a useful alternative movement. Prediction must preserve important contact effects. Constraints must remain meaningful when estimates weaken. Memory must distinguish an attempted step from a completed one.

The next research checks follow those connections. Does prediction rank candidate movements correctly around contact? Can memory repair a false completion record? Does uncertainty lead to better inspection or recovery? Controlled comparisons should count complete jobs, retries, interventions, time and damage.

Since 2010, more of action choice has become learnable. Broader knowledge and richer history can enter that choice. Picking up our moved block still requires the same discipline: observe, choose, execute, check the outcome and revise.

<details>
<summary>Sources, presentation boundaries and proposed checks</summary>

The original source archive was checked on September 30, 2026. New primary checks for this revision were read on October 1. ACT and Diffusion Policy use their RSS 2023 papers and pinned official runtime code. π0 uses its original RSS 2025 paper; the model was introduced in October 2024. π0.5 uses the April 2025 v1 paper. UniPi uses January 2023 v1, and DreamGen uses May 2025 v1. V-JEPA 2 v1, MEM v2, RT-2 v1, Levine v5 and PILCO retain the checked source versions.

The supplied presentation motivates the repeated pickup example and the three video roles. Its transcript does not establish an event date, reliable timestamps or externally verified speaker names. The alligator replay and policy demonstrations are teaching cases. Their outcomes do not measure a general success rate, establish a ranking, or identify why a trial failed. The later French conversation is separate from the presentation. The final demo's “fast WAM” identity remains unresolved, so no model-specific explanation is assigned to it.

The four new tabletop scenes and timing calculation are original teaching examples. The V-JEPA figure is the credited original. The main comparison holds a teaching arm fixed to expose roles; the cited systems use different bodies, commands and evaluation settings.

Three source-linked research proposals remain open:

- **Contact-sensitive prediction.** Following [V-JEPA 2's prediction limits](https://www.alphaxiv.org/pdf/2506.09985v1?page=14), compare candidate-action ranking and recovery with the same controller and observations. Reject the proposed benefit if adding prediction does not improve either.
- **Memory correction.** Following [MEM's update mechanism](https://www.alphaxiv.org/pdf/2603.03596v2?page=3), check whether a false completion record is detected and repaired after a failed grasp or interruption. Preserve the distinction between historical completion and what remains true now.
- **Uncertain sensing.** Following [Agha's uncertainty account](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha), compare recovery under the same sensing degradation, with and without the added uncertainty inputs. Evaluate any enforcing constraint separately.

These questions need a prior-work check and controlled tests. The best first source follow-up is MEM's handling of incorrect summaries and outcome evidence. Field AI's exact interfaces, uncertainty calibration and independent safety or data-efficiency measurements also remain unchecked. No experiments were run for this article.

</details>
