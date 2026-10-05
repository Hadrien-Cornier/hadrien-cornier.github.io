---
title: 'How robot control is changing'
description: 'From copying a person to practicing and imagining: how a robot chooses its next movement in 2026, and what is still missing.'
date: '2026-09-30'
updated: '2026-10-05'
draft: false
---

Ask a robot arm to pick up a small green block and put it in a tray. The camera sees the block. The arm starts reaching. Then someone moves the block a few centimetres to the right.

The motors can follow their commands perfectly and still miss. Something has to notice the change and choose a different movement. So the real question of robot control isn't "how do I make the motor follow?" anymore. It's this: **how does the robot choose its next movement?**

![The same arm and table before and after a green block moves. The old location is outlined. A dashed new reach ends at the moved block.](/assets/robotics/modern-control/v2/observe-again.png "Left: the reach fits the observed block. Right: the block moves while the gripper stays in the same place. A fresh observation can change the next reach. The dashed line is a proposed revised reach.")

Here's the short answer. Between 2023 and 2026, that choice moved out of hand-written planners and into one learned network, in five steps:

1. **Copy a person** (ACT, 2023): learn from about 50 demonstrations and predict a short chunk of future movements.
2. **Borrow the web** (VLA, 2023 to 2024): start from a model that already knows objects and words.
3. **Train one model for many robots** (π0 to π0.7, 2024 to 2026): one generalist policy, many bodies, many tasks.
4. **Practice** (reinforcement learning, 2024 to 2026): improve the generalist on the real robot until it stops failing.
5. **Imagine** (world action models, 2026): predict the future video and the action together.

What's still missing is **memory** and a **cheap way to imagine**. The timeline below shows which part of the loop each step changed. The rest of the post goes through them one at a time.

```robotics-timeline
{
  "id": "control-evolution",
  "heading": "What changes inside action choice?",
  "intro": "Follow the moved block. Each stage shows how the observations become a movement command, and which parts are designed by hand or learned.",
  "caption": "Designed: written by engineers (rules, planners, search). Learned: trained from data. Persists: motor control and fresh sensor feedback stay in every stage. Approaches overlap in time.",
  "roles": [
    {"id": "goal", "label": "Goal and task selection"},
    {"id": "scene", "label": "Scene processing"},
    {"id": "choice", "label": "Movement choice"},
    {"id": "output", "label": "Action output"},
    {"id": "motor", "label": "Motor control", "persistent": true},
    {"id": "feedback", "label": "Fresh feedback", "persistent": true}
  ],
  "stages": [
    {
      "id": "planned-loop",
      "year": "Before 2023",
      "title": "Plan, then track",
      "summary": "The moved block changes the estimate, then the plan.",
      "mechanism": "Perception estimates where things are. A task planner picks the step. A motion planner finds a path. A controller tracks it.",
      "anchor": "section-before-2023-plan-then-track",
      "stack": [
        {"role": "goal", "text": "Task planner selects the pickup", "mode": "designed"},
        {"role": "scene", "text": "Designed estimates of block, obstacles and joints", "mode": "designed"},
        {"role": "choice", "text": "Motion planner finds a feasible reach", "mode": "designed"},
        {"role": "output", "text": "Path or timed joint targets", "mode": "designed"},
        {"role": "motor", "text": "Body-specific command execution", "mode": "persistent"},
        {"role": "feedback", "text": "New sensor measurements", "mode": "persistent"}
      ],
      "sources": [{"label": "PR2 architecture, 2009", "href": "https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=2"}]
    },
    {
      "id": "demonstration-chunks",
      "year": "2023",
      "title": "Copy a person, one chunk at a time",
      "summary": "Demonstrations connect camera images to future joint targets.",
      "mechanism": "ACT predicts a chunk of joint targets from images and joint readings, and blends overlapping chunks.",
      "anchor": "section-act-copy-a-person-one-chunk-at-a-time",
      "visual": {"src": "/assets/robotics/modern-control/v2/action-chunk.png", "alt": "Three top views of an arm reaching, grasping and carrying a block.", "caption": "One chunk: a short sequence of future targets."},
      "stack": [
        {"role": "goal", "text": "The one task shown in the demonstrations", "mode": "designed"},
        {"role": "scene", "text": "Learned image features; joint readings", "mode": "learned"},
        {"role": "choice", "text": "ACT predicts overlapping target chunks", "mode": "learned"},
        {"role": "output", "text": "Joint-position targets", "mode": "learned"},
        {"role": "motor", "text": "Body-specific command execution", "mode": "persistent"},
        {"role": "feedback", "text": "New sensor measurements", "mode": "persistent"}
      ],
      "sources": [{"label": "ACT, RSS 2023", "href": "https://www.roboticsproceedings.org/rss19/p016.pdf#page=5"}]
    },
    {
      "id": "language-actions",
      "year": "2023 to 2024",
      "title": "Borrow what the web knows",
      "summary": "A vision-language model learns to output robot actions.",
      "mechanism": "RT-2 and OpenVLA turn actions into tokens, so a model pretrained on images and text can predict them.",
      "anchor": "section-from-vlm-to-vla-borrow-what-the-web-knows",
      "visual": {"src": "/assets/robotics/why-robotics/openvla-architecture.png", "alt": "OpenVLA architecture: image encoders, a 7B language model, and an action de-tokenizer.", "caption": "OpenVLA (Kim et al., 2024), CC BY 4.0."},
      "stack": [
        {"role": "goal", "text": "A language instruction", "mode": "designed"},
        {"role": "scene", "text": "Pretrained vision-language features", "mode": "learned"},
        {"role": "choice", "text": "Vision-language-action model", "mode": "learned"},
        {"role": "output", "text": "Action tokens, decoded into gripper moves", "mode": "learned"},
        {"role": "motor", "text": "Body-specific command execution", "mode": "persistent"},
        {"role": "feedback", "text": "New sensor measurements", "mode": "persistent"}
      ],
      "sources": [{"label": "RT-2", "href": "https://arxiv.org/abs/2307.15818"}, {"label": "OpenVLA", "href": "https://arxiv.org/abs/2406.09246"}]
    },
    {
      "id": "generalist",
      "year": "2024 to 2026",
      "title": "One policy for many robots",
      "summary": "A generalist predicts subtasks and continuous action chunks.",
      "mechanism": "π0 adds a flow-matching action expert to a VLM. π0.5 predicts the subtask first. π0.7 also reads how to do the task: speed, quality, subgoal images.",
      "anchor": "section-generalist-models-one-policy-for-many-robots",
      "stack": [
        {"role": "goal", "text": "Learned subtask prediction from the instruction", "mode": "learned"},
        {"role": "scene", "text": "Images, language and robot state", "mode": "learned"},
        {"role": "choice", "text": "Flow-matching action expert", "mode": "learned"},
        {"role": "output", "text": "Continuous action chunks (joint or pose targets)", "mode": "learned"},
        {"role": "motor", "text": "PD control of the targets", "mode": "persistent"},
        {"role": "feedback", "text": "New sensor measurements", "mode": "persistent"}
      ],
      "sources": [{"label": "π0", "href": "https://arxiv.org/abs/2410.24164"}, {"label": "π0.5", "href": "https://arxiv.org/abs/2504.16054"}, {"label": "π0.7", "href": "https://arxiv.org/abs/2604.15483"}]
    },
    {
      "id": "practice",
      "year": "2024 to 2026",
      "title": "Practice on the real robot",
      "summary": "Reinforcement learning turns a policy that sometimes works into one that rarely fails.",
      "mechanism": "A critic scores actions. HIL-SERL, RECAP, RLT and EXPO-FT use those scores in different ways to improve the policy from real attempts.",
      "anchor": "section-practice-reinforcement-learning-on-real-robots",
      "visual": {"src": "/assets/robotics/modern-control/v3/expo-ft-architecture.png", "alt": "EXPO-FT: a VLA proposes action chunks, an edit actor adjusts them, and a critic picks the best.", "caption": "EXPO-FT (Dong et al., 2026), CC BY 4.0."},
      "stack": [
        {"role": "goal", "text": "A task with a success detector", "mode": "designed"},
        {"role": "scene", "text": "The generalist's learned features", "mode": "learned"},
        {"role": "choice", "text": "Policy improved by a learned critic", "mode": "learned"},
        {"role": "output", "text": "Continuous action chunks", "mode": "learned"},
        {"role": "motor", "text": "Body-specific command execution", "mode": "persistent"},
        {"role": "feedback", "text": "Rewards, corrections and new measurements", "mode": "persistent"}
      ],
      "sources": [{"label": "HIL-SERL", "href": "https://arxiv.org/abs/2410.21845"}, {"label": "π*0.6 (RECAP)", "href": "https://arxiv.org/abs/2511.14759"}, {"label": "EXPO-FT", "href": "https://arxiv.org/abs/2605.25477"}]
    },
    {
      "id": "world-action",
      "year": "2026",
      "title": "Imagine the future and the action together",
      "summary": "One model predicts the next video frames and the next actions.",
      "mechanism": "DreamZero starts from a 14B video model and denoises future video and action chunks together, at 7 Hz on the robot.",
      "anchor": "section-world-action-models-imagine-the-video-and-the-action-together",
      "visual": {"src": "/assets/robotics/modern-control/v3/dreamzero-architecture.png", "alt": "DreamZero: past frames, language and robot state go into a causal video transformer that outputs future frames and an action chunk.", "caption": "DreamZero (Ye et al., 2026), CC BY 4.0."},
      "stack": [
        {"role": "goal", "text": "A language instruction", "mode": "designed"},
        {"role": "scene", "text": "Video latents of past frames", "mode": "learned"},
        {"role": "choice", "text": "Joint video and action prediction", "mode": "learned"},
        {"role": "output", "text": "Action chunk, aligned with imagined frames", "mode": "learned"},
        {"role": "motor", "text": "Body-specific command execution", "mode": "persistent"},
        {"role": "feedback", "text": "Real frames replace imagined ones", "mode": "persistent"}
      ],
      "sources": [{"label": "DreamZero", "href": "https://arxiv.org/abs/2602.15922"}]
    },
    {
      "id": "retained-history",
      "year": "2026 and next",
      "title": "Remember what changes the next move",
      "summary": "The same image can need a different next step.",
      "mechanism": "MEM keeps recent video in a compact encoder and older events as a text summary.",
      "anchor": "section-memory-the-same-image-a-different-next-step",
      "visual": {"src": "/assets/robotics/modern-control/v3/mem-architecture.png", "alt": "MEM: a high-level policy updates a language memory and picks a subtask; a low-level policy with a video memory encoder outputs actions.", "caption": "MEM (Torne et al., 2026), CC BY 4.0."},
      "stack": [
        {"role": "goal", "text": "Subtask chosen from the task and a text memory", "mode": "learned"},
        {"role": "scene", "text": "Compressed video of recent frames", "mode": "learned"},
        {"role": "choice", "text": "History-conditioned action policy", "mode": "learned"},
        {"role": "output", "text": "Continuous action chunks", "mode": "learned"},
        {"role": "motor", "text": "Body-specific command execution", "mode": "persistent"},
        {"role": "feedback", "text": "New sensor measurements", "mode": "persistent"}
      ],
      "sources": [{"label": "MEM", "href": "https://arxiv.org/abs/2603.03596"}, {"label": "RoboMME", "href": "https://arxiv.org/abs/2603.04639"}]
    }
  ]
}
```

## Before 2023: plan, then track

The classical answer splits the choice into separate programs. **Perception** finds the block and the obstacles. **State estimation** says where the block is relative to the arm. A **task planner** picks the step ("pick up the block"), a **motion planner** finds a path that doesn't hit the table, and a **controller** makes the joints follow that path. When the camera sees the block move, the estimate changes and the planner plans again.

This works, and it's still how most factory robots run. The trouble is that every piece is written by hand for a known world. Who writes the rule for a block that's half hidden, or slippery, or a sock instead of a block? Each new object asks for new code. That's the wall learning tries to get through.

<details>
<summary>Deep dive: the classical loop and the first learned policies</summary>

Rusu and colleagues' 2009 PR2 system already closed the loop: 3D perception, an obstacle map, motion replanning and a higher-level executive. Its tested grasp was simple: it approached horizontally, and a general grasp planner for partial views was left for later work. [Rusu et al., pp. 2, 7–8](https://www.kavrakilab.org/publications/rusu-sucan2009real-time-perception-guided-motion.pdf#page=7)

Learning entered in the 2010s from two directions. A **policy** is a rule that maps what the robot sees to an action. In work first released in 2015, Levine and colleagues learned policies straight from camera images to joint torques on a PR2. [Levine et al. v5, p. 13](https://www.alphaxiv.org/pdf/1504.00702v5?page=13) A **dynamics model** predicts how the state changes after an action. PILCO (2011) learned an uncertain dynamics model and used it to improve a policy. [PILCO, p. 1](https://icml.cc/2011/papers/323_icmlpaper.pdf)

The two ideas, "learn what to do" and "learn what will happen", come back at the end of this post as VLAs and world models.

</details>

## ACT: copy a person, one chunk at a time

Suppose a person shows the arm how to pick up the block, about 50 times, from different positions. You record what the cameras see, the joint angles, and the commands the person gave. Can a network learn the next movement from that?

**ALOHA** made this cheap. A person moves two small "leader" arms, and two "follower" arms copy them. The leader joint angles become the action labels; the follower cameras and joint readings become the observations. [ALOHA, pp. 3–5](https://www.roboticsproceedings.org/rss19/p016.pdf#page=4)

The method that came with it, **Action Chunking with Transformers (ACT)**, predicts a short sequence of future joint targets from the current images and joint angles. That sequence is an **action chunk**. A controller below tracks the targets. With only **10 minutes of demonstrations**, ACT learned six fine tasks, like slotting a battery, with **80 to 90% success**. [ACT abstract](https://arxiv.org/abs/2304.13705)

![Three top views show the same arm reaching for the block, closing its gripper and carrying it toward the tray. Both links keep their lengths.](/assets/robotics/modern-control/v2/action-chunk.png "Three moments from one action chunk. Each command sets a target for the controller below.")

Why a chunk and not one action at a time? Copying one step at a time compounds errors: a small mistake puts the arm somewhere the person never was, and the next prediction is worse. Predicting a whole chunk keeps the motion coherent. ACT then predicts a new chunk at every step and averages the overlapping predictions for the same moment, which it calls **temporal ensembling**. [ACT, §IV-A, p. 5](https://www.roboticsproceedings.org/rss19/p016.pdf#page=5)

A chunk's length doesn't set how fast the robot reacts. Say a chunk holds $H$ targets sent at $f$ targets per second, and the robot executes $k$ of them before it looks again:

$$
\begin{aligned}
T_\text{chunk}&=\frac{H}{f}=\frac{10}{20}=0.5\ \mathrm{s},\\
T_\text{react}&=\frac{k}{f}=\frac{2}{20}=0.1\ \mathrm{s}.
\end{aligned}
$$

Units: targets ÷ (targets/s) = s. The plan looks half a second ahead, but the arm sees the moved block after a tenth of a second, plus the computing time.

```so101-widget
{"type": "predict", "id": "RC1", "fallback": "Predict first. A policy predicts a chunk of H = 10 joint targets. The robot sends f = 20 targets per second. It executes 2 targets, then takes a new image and predicts a new chunk. Ignore the computing time. How long, at most, does the arm keep following the old chunk? (A) 0.5 s: H / f. (B) 0.1 s: 2 / 20. (C) 0.05 s: 1 / 20. (D) 2 s: f / H. Answer: 0.1 s. It executes 2 targets of 1/20 s each, then it looks again."}
```

Mobile ALOHA used the same recipe on a robot that drives around a house. Its authors trained with about 50 demonstrations per task, mixed with data from the static ALOHA tasks.

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/zMNumQ45pJ8" title="Mobile ALOHA, compilation of autonomous skills" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>Mobile ALOHA, autonomous skills learned by imitation (Zipeng Fu, co-author, 2024). <a href="https://www.youtube.com/watch?v=zMNumQ45pJ8">Watch on YouTube</a></figcaption>
</figure>

The limit shows up as soon as you change the task. An ACT policy knows one task, in one setup, on one robot. It has no idea what a "tray" is. It only knows the motions it saw.

<details>
<summary>Side path: when two routes are both right (Diffusion Policy)</summary>

Put an obstacle between the gripper and the block. A person goes around it on the left half the time and on the right half the time. A network trained to predict the average path goes straight through the obstacle.

**Diffusion Policy** (2023) learns the whole distribution of action sequences instead of their average. At run time it starts from random numbers and refines them, step by step, into one coherent route, left or right, never the average. [Diffusion Policy, §§II-C, IV-A, pp. 3–4](https://www.roboticsproceedings.org/rss19/p026.pdf#page=3) The π models below use a close relative, **flow matching**, for the same reason. It matters again in the RL section: this kind of policy has no simple formula for the probability of an action, which breaks some classic RL methods.

![Two identical top views of an arm, block, tray and obstacle. One dashed path goes around the obstacle. The other passes through it, with the conflict circled.](/assets/robotics/modern-control/v2/candidate-paths.png "Two candidate paths with the same start and goal. Averaging the left and right detours gives the path through the obstacle.")

</details>

## From VLM to VLA: borrow what the web knows

A person knows what a tray is without a single robot demonstration. Could a robot borrow that knowledge?

A **vision-language model (VLM)** reads images and text and answers in text. It learned from billions of web images, so it knows objects, colors and words. A **vision-language-action model (VLA)** is a VLM that is trained further on robot data, so that it also outputs robot actions. The table compares the three.

| Model | Input | Output | Learns from |
|---|---|---|---|
| LLM | text | text | web text |
| VLM | images + text | text | web images and text |
| VLA | camera images + instruction (+ robot state) | robot actions | web data, then robot demonstrations |

**RT-2** (2023) showed that the transfer is real. It wrote each action as tokens, the same discrete symbols the model uses for words: each action dimension was cut into 256 bins. [RT-2 v1, pp. 5–6](https://www.alphaxiv.org/pdf/2307.15818v1?page=5) On scenes with unseen objects, backgrounds and environments, success rose from 32% for RT-1 to 62%. [DeepMind, RT-2](https://deepmind.google/blog/rt-2-new-model-translates-vision-and-language-into-action/)

**OpenVLA** (2024) shows the recipe with open weights: two image encoders, a 7-billion-parameter language model, and a de-tokenizer that turns output tokens back into a small move of the gripper.

![Diagram of OpenVLA: the input image goes through DinoV2 and SigLIP encoders and an MLP projector, the instruction goes through the Llama tokenizer, Llama 2 7B processes both, and an action de-tokenizer outputs a 7D robot action: change in position, rotation and gripper.](/assets/robotics/why-robotics/openvla-architecture.png "OpenVLA architecture. Figure from Kim et al., OpenVLA (2024), CC BY 4.0.")

For our block, this means the instruction "put the green block in the tray" now means something to the model, even for a block color it never saw in the robot data. The cost is the action format: 256 bins per dimension, predicted one token at a time, is coarse and slow for a fast, precise arm.

## Generalist models: one policy for many robots

Physical Intelligence (PI) took the next step: one model, trained on many robots and many tasks, that you can prompt or fine-tune.

**π0** (October 2024) keeps a pretrained VLM but adds an **action expert**, a smaller network that outputs continuous action chunks by flow matching instead of tokens. It trained on data from single arms, two-arm robots and mobile manipulators, and it can fold laundry, bus a table and assemble a box. [π0 abstract](https://arxiv.org/abs/2410.24164), [π0, RSS 2025, §IV](https://www.roboticsproceedings.org/rss21/p010.pdf#page=4)

<figure class="video-embed video-pair">
<div><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/a6Ix6Vzuk0c" title="π0: Our First Generalist Robotic Policy" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>
<div><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/Zn8yMaepzVk" title="π0.5: a VLA with Open-World Generalization" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>
<figcaption>Left: π0 (November 2024). Right: π0.5 cleaning kitchens and bedrooms it never saw in training (April 2025). Both from Physical Intelligence. <a href="https://www.youtube.com/watch?v=a6Ix6Vzuk0c">π0 on YouTube</a>, <a href="https://www.youtube.com/watch?v=Zn8yMaepzVk">π0.5 on YouTube</a></figcaption>
</figure>

**π0.5** (April 2025) adds a step before the motion: the same model first predicts a subtask in words ("pick up the block"), then generates the actions for that subtask. It trains on many robots plus web data, which helps it work in homes it never saw. [π0.5 v1, §§IV-A–D](https://www.alphaxiv.org/pdf/2504.16054v1?page=5)

**π0.7** (April 2026) changes what the prompt can say. It reads not only *what* to do but *how*: metadata such as speed, quality and mistakes, and optional subgoal images. That lets it train on mixed data, including failed and slow attempts, because the labels tell good runs from bad ones. PI reports that π0.7 makes espresso out of the box about as well as specialist models fine-tuned with RL. [π0.7 abstract](https://arxiv.org/abs/2604.15483)

What does the generalist actually send to the robot? Still targets. In π*0.6, the output is joint angles and gripper commands at 50 Hz; in π0.7, joint targets or gripper poses, with inverse kinematics for poses, and a **proportional-derivative (PD) controller** that turns the targets into motor effort. [π*0.6, §V-A](https://arxiv.org/html/2511.14759v1#S5.SS1), [π0.7, §VIII](https://arxiv.org/html/2604.15483v2#S8) The learned part chooses where the joints should go. A classical loop still makes them get there. I spent a whole [series on that bottom loop on my $100 arm](/robotics/so101-1-target-and-goal/), and it's not a solved detail.

## Practice: reinforcement learning on real robots

A generalist that succeeds 80% of the time is impressive in a video. In a home, it's a broken glass every few days. Perry Dong and Chelsea Finn put it this way in [Towards Universal Post-Training for Robotics](https://pd-perry.github.io/posts/post-training.html) (September 2026): robot models today are where language models were around GPT-2 and GPT-3. They're capable enough for demos, not reliable enough to trust. Language models closed that gap with a standard **post-training** recipe, more training after the big pretraining: instruction tuning, then reinforcement learning from feedback. Their argument is that robots need the same thing.

Why not just collect more demonstrations? Because copying has a ceiling. The demonstrations never show how to recover from the robot's own mistakes, and the robot can't get better than the people who demonstrated. **Reinforcement learning (RL)** learns from the robot's own attempts and a score of how they went.

### Why RL is hard on a robot

Dong and Finn list the differences with RL on language models:

- **Data is expensive.** A language model can try a thousand answers in parallel in a second. A robot tries once, in real time, and someone may have to reset the scene.
- **Horizons are long.** Picking up a glass is about 500 decisions, each a 7-number action every 20 ms. The reward ("success") comes at the end. Which of the 500 decisions deserves the credit?
- **The world is random.** The same command doesn't give the same result twice.
- **The actions are continuous.** This one is the most technical, so here it is with a picture.

RL usually trains a **critic**: a network $Q(s,a)$ that predicts how good action $a$ is in situation $s$. Then the policy should pick the best action:

$$
a^\star=\arg\max_a\ Q(s,a).
$$

In a game with four buttons, you score the four buttons and pick the best. That's what DQN does. A robot action is 7 real numbers. Cut each into 20 bins and you get $20^7 \approx 1.28$ billion actions to score, 50 times per second. You can't enumerate them.

```so101-widget
{"type": "continuous-action", "fallback": "Interactive: the value Q of each action for a one-number action, with two hills: a wide one on the left (value 0.67) and a narrow, higher one on the right (value 1.00). Discretizing with 6 bins picks an action on the left hill at 65% of the best value. An actor that climbs the slope from a = -0.6 stops on the left hill. Sampling 16 actions from the base policy, editing each slightly uphill, and picking the best finds the right hill."}
```

Classic continuous-control RL answers this with an **actor-critic**: a second network, the actor, learns to output the action that the critic scores high, by following the slope of $Q$. DDPG, TD3 and **SAC** (soft actor-critic) all work this way. Play with the widget: the actor climbs the nearest hill. It's fast, but it can get stuck on a lower one.

```so101-widget
{"type": "predict", "id": "RC2", "fallback": "Predict first. A DQN-style agent picks the action with the highest Q by scoring every action. The arm has 7 joints. You cut each joint range into 20 bins. How many Q scores per control step? (A) 140. (B) 1.28 billion, 20^7. (C) 7^20. (D) 20. Answer: 20^7 = 1.28 billion. The choices multiply across joints."}
```

Modern VLAs add a second problem. Their action expert is a flow or diffusion model: great at keeping the left and right detours separate, but it has no simple formula for the probability of an action. PPO, the RL workhorse of language models, needs exactly that probability ratio. So the field had to find other ways to plug a critic into a VLA.

### Four ways to practice

These are the four methods I find most instructive. Each uses the critic differently.

| Method | Starts from | How the critic changes behavior | Reported result |
|---|---|---|---|
| **HIL-SERL** (Berkeley, 2024) | A few demonstrations, small policy from scratch | Actor-critic (SAC-style); a person takes over with a joystick when the robot gets stuck, and those corrections go into training | Near-perfect success in 1 to 2.5 hours of training per task; 2× success and 1.8× faster than imitation on average |
| **RECAP / π\*0.6** (PI, 2025) | The π0.6 generalist | The critic labels each recorded segment "good" or "bad"; the policy learns with that label as an input, and at run time PI asks for "good" | On some of the hardest tasks, more than 2× throughput and about half the failures |
| **RLT** (PI, 2026) | A frozen VLA | The VLA exposes a compact "RL token"; a small actor-critic head on it refines the action chunk, anchored near the VLA's own proposal | Up to 3× faster on the hardest part of the task, within minutes to a few hours |
| **EXPO-FT** (Stanford, 2026) | π0.5 | The VLA proposes several chunks; a small edit policy nudges each one; the critic picks the best | 30/30 on all 8 tasks, with 19.1 minutes of robot data on average |

Sources: [HIL-SERL](https://arxiv.org/abs/2410.21845), [π\*0.6](https://arxiv.org/abs/2511.14759), [RLT](https://arxiv.org/abs/2604.23073), [EXPO-FT](https://arxiv.org/abs/2605.25477).

<figure class="video-embed video-pair">
<div><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/GoJSW8e2qbI" title="HIL-SERL: Precise and Dexterous Robotic Manipulation via Human-in-the-Loop Reinforcement Learning" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>
<div><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/d1obFDstuVQ" title="π*0.6: four hours of robotic box assembling" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>
<figcaption>Left: HIL-SERL learns dynamic and precise tasks, like whipping a Jenga block out of a tower, directly on the robot (Berkeley RAIL, 2024). Right: π*0.6 after RECAP, assembling boxes for four hours (Physical Intelligence, 2025). <a href="https://www.youtube.com/watch?v=GoJSW8e2qbI">HIL-SERL on YouTube</a>, <a href="https://www.youtube.com/watch?v=d1obFDstuVQ">π*0.6 on YouTube</a></figcaption>
</figure>

**RECAP's trick** is the one I found most surprising, because it turns RL back into supervised learning. A value model $V$ predicts the future reward from an observation. For a segment of $N$ steps, the **advantage** says whether the segment did better than expected:

$$
\hat A_t=\sum_{k=t}^{t+N-1}r_k+V(o_{t+N})-V(o_t).
$$

A worked example with made-up numbers. Each step costs $-1$, so a 10-step segment has rewards summing to $-10$. Before the segment, $V$ predicts $-40$; after, $-25$. Then $\hat A=-10+(-25)-(-40)=+5$: the segment moved the robot 15 units closer to done for a cost of 10. If $+5$ is above the threshold, the segment gets the label "Advantage: positive", even if the whole attempt failed later. The policy learns every segment *under its label*, and at run time you ask for "positive". [π\*0.6, §§IV-A–B](https://arxiv.org/html/2511.14759v1#S4)

```so101-widget
{"type": "predict", "id": "RC3", "fallback": "Predict first. A segment inside a FAILED attempt has an estimated advantage of +5. The threshold for the positive label is +2. What does RECAP's policy learn from it? (A) Nothing: failed attempts are dropped. (B) To avoid these actions. (C) To reproduce them under the label 'Advantage: positive'. (D) To reproduce them under 'negative' because the attempt failed. Answer: (C). The label comes from the segment's advantage, not from the episode's final result."}
```

**EXPO-FT** is the method behind Dong and Finn's post, and its picture is the widget's third button. The big VLA proposes $N$ chunks $a^1,\dots,a^N$. A small edit policy proposes a bounded change $\hat a^i$ for each one. The robot runs whichever candidate the critic likes best:

$$
a^\star=\arg\max_{a\,\in\,\{a^i,\ a^i+\hat a^i\}}\ Q(s,a),\qquad \|\hat a^i\|\le\varepsilon .
$$

The VLA keeps the candidates in good regions. The edits stay small, so a wrong critic can't drag the robot far. Then the improvements are trained back into the VLA.

![EXPO-FT diagram. Left: offline pretraining, then online fine-tuning with a replay buffer, a success detector and human interventions. Right: the VLA proposes N action chunks, an edit actor adjusts each, and the chunk with the highest Q is executed.](/assets/robotics/modern-control/v3/expo-ft-architecture.png "EXPO-FT system. Figure 1 from Dong et al., EXPO-FT (2026), CC BY 4.0.")

The comparison I care about is controlled: same base model, same tasks, same 30 trials. More copying, even with a person correcting the robot (HG-DAgger), stays around 20 to 22 out of 30. Practice reaches 30 out of 30.

![Grouped bar chart over 8 tasks: imitation fine-tuning averages 20.5 of 30, imitation with human corrections 22.1 of 30, EXPO-FT 30 of 30 on every task, with 14 to 35 minutes of online data per task.](/assets/robotics/modern-control/v3/rl-finetune-results.png "My chart of Table 2 of EXPO-FT. The tasks include egg flipping, a pool shot and inserting a flower into a bottle.")

Two cautions before this sounds solved. First, 30/30 is 30 trials in the authors' lab, not a deployment. Second, Dong and Finn are clear that the algorithm is only half of the recipe. Nobody has a standard answer yet for the other half:

1. **Reward:** who decides that the egg flip succeeded? Today, a trained success detector or a person.
2. **Reset:** who puts the egg back?
3. **Human help:** when should the person step in, and how much?
4. **Defaults:** RL on robots is still sensitive to settings, with no agreed defaults.

That's the difference with language models, where "check the answer" and "run it again" are almost free. RL also works when the robot practices in simulation instead: Mistral trained Robostral Navigate on simulated buildings, then ran online RL there and gained 4 points of success (more on it below).

## World action models: imagine the video and the action together

A VLA maps an image to an action. It never has to say what the world will look like next. Does that matter?

NVIDIA's argument is yes. VLAs are good at semantics ("which object is the tray?") but weak at motions they never saw. A video model, trained on a huge amount of video, has seen how things fall, slide, open and pour. A **world action model (WAM)** is a policy built on such a video model: it predicts how the scene will change *and* the action that goes with it. [NVIDIA, The rise of world action models](https://developer.nvidia.com/blog/pretrained-to-imagine-fine-tuned-to-act-the-rise-of-world-action-models/)

**DreamZero** (February 2026) is the clearest example. It starts from a 14-billion-parameter video model. During training, it adds noise to both the future video frames and the future action chunk, and learns to remove the noise from both together. On the robot, it imagines the next frames and the next actions, executes the actions, and then replaces its imagined frames with the real camera frames, so its errors don't pile up. [DreamZero abstract](https://arxiv.org/abs/2602.15922)

![DreamZero architecture. Training: video and actions are encoded, noised, and denoised jointly by a causal video transformer. Inference: past frames, language and state go in; future frames and a future action chunk come out; real observations replace the imagined frames at each step.](/assets/robotics/modern-control/v3/dreamzero-architecture.png "DreamZero: joint video and action prediction. Figure from Ye et al., World Action Models are Zero-shot Policies (2026), CC BY 4.0.")

Here's what that looks like on tasks the model never trained on. The top row is what really happened; the bottom row is what the model imagined from the robot's cameras before acting.

![Two tasks, hit the cymbal and fry vegetables with a spatula. Top row: real-world execution frames. Bottom row: the frames DreamZero generated from the robot's cameras, which match the real motion.](/assets/robotics/modern-control/v3/dreamzero-real-vs-generated.png "Real execution (top) and imagined video (bottom) on unseen tasks. Figure from Ye et al. (2026), CC BY 4.0.")

The reported results:

- **More than 2× better generalization** to new tasks and environments than state-of-the-art VLAs, in real-robot tests.
- **Learning from video only:** 10 to 20 minutes of video of another robot or a person doing a task gave more than 42% relative improvement on that unseen task. No actions were needed for that data.
- **A new robot in 30 minutes** of play data, while keeping its zero-shot skills.
- On the public **RoboArena** ranking (April 2026 snapshot, reported by NVIDIA), DreamZero scored 1750 against 1622 for π0.5.

The price is compute. A 14B video model is slow: one action step first took **5.7 s**. With system work and a trick called DreamZero-Flash, the authors brought it to **150 ms**, 38× faster on NVIDIA's GB200 chips, enough for **7 Hz** closed-loop control. [DreamZero, real-time section](https://arxiv.org/html/2602.15922v1)

<details>
<summary>How this differs from "generate a video, then copy it"</summary>

Earlier systems split the two steps. **UniPi** (2023) generated a video of the plan, then a separate inverse dynamics model guessed the actions between frames, and the robot executed the plan without replanning. [UniPi v1, §3.2](https://www.alphaxiv.org/pdf/2302.00111v1?page=4) **DreamGen** (2025) generated videos to make training data for a separate policy. [DreamGen v1](https://www.alphaxiv.org/pdf/2505.12705v1?page=3) I wrote about DreamGen and the 1X world model in [why I'm learning robotics](/robotics/why-i-am-learning-robotics/).

A WAM does both in one network, at every control step, and corrects itself with real frames. The video isn't a separate plan to copy. It's the model's way of thinking about the next half second.

</details>

## Limits and what comes next

Two limits stand out to me: the robot forgets, and imagining every pixel is expensive.

### Memory: the same image, a different next step

Extend the job: inspect the block, then put it away. The camera image looks the same before and after the inspection. So which step comes next?

![One shared current view of the arm and block branches into two task records. Inspection pending leads to inspect first; inspection done leads to put away.](/assets/robotics/modern-control/v2/history-changes-action.png "The same current image supports different next steps when the history differs.")

Every policy in this post, ACT, π0.5 and most VLAs, decides from the current images, maybe the last one or two. That's fine for "pick up the block". It fails for "did I already add salt?", for counting, and for an object the arm itself is hiding.

**RoboMME** (2026) measured this on 16 simulated memory tasks with the same π0.5 policy. With the current view only, it averages **17.9%**. Giving it past actions barely helps (19.7%). Feeding it a sample of past frames reaches **44.5%**. The authors' main finding is that the best kind of memory depends on the task. [RoboMME abstract](https://arxiv.org/abs/2603.04639)

![Bar chart of average success over 16 RoboMME memory tasks: π0.5 with the current view only 17.9%, with past actions 19.7%, best recurrent memory 22.4%, language subgoals 42.4%, best sampled past frames 44.5%.](/assets/robotics/modern-control/v3/robomme-memory.png "My chart of the RoboMME main table. Simulation benchmark, same π0.5 backbone in every row.")

Then there's **Robostral Navigate**, Mistral's first robotics model (July 2026). It's an 8-billion-parameter navigation model, not a manipulation one: it drives a robot through buildings it never saw, from a spoken instruction and **one ordinary camera**, with no map, no depth sensor and no special memory module. It simply keeps every frame of the trip in its input. It was trained only in simulation, and it's first on the standard R2R-CE benchmark: **77.4%** success, ahead of systems that use depth sensors or several cameras. [Robostral Navigate, §§2.1, 4.1](https://arxiv.org/html/2607.20785v1)

![Robostral Navigate system: a stack of past camera frames and an instruction go to a VLM at 0.5 Hz, which outputs a waypoint such as go to pixel (48, 64) and move 4.5 m forward. A diffusion policy at 10 Hz turns the waypoint and the current frame into a short path, and a motion-tracking controller runs at 100 Hz.](/assets/robotics/modern-control/v3/robostral-architecture.png "Three loops at three rates: the VLM reads all past frames every 2 s, a diffusion policy plans at 10 Hz, a classical tracker runs at 100 Hz. Figure from Bounhar et al., Robostral Navigate (2026), CC BY 4.0.")

![Bar chart of R2R-CE success on unseen buildings: StreamVLN 56.9%, Qwen-RobotNav-4B 66.9%, OmniNav with depth 69.5%, Qwen-RobotNav-8B with depth 72.1%, Robostral before RL 73.4%, Robostral after RL 77.4%.](/assets/robotics/modern-control/v3/robostral-r2r.png "My chart of Table 1 of Robostral Navigate. The last two bars show the gain from online RL in simulation.")

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/7dpLB9NoY1A" title="Introducing Robostral Navigate" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>Mistral, "Introducing Robostral Navigate" (July 2026). <a href="https://www.youtube.com/watch?v=7dpLB9NoY1A">Watch on YouTube</a></figcaption>
</figure>

I find that striking: the simplest possible memory, "keep everything", wins a benchmark that used to need maps and depth. But it's a lucky case. A navigation episode is short, and the model only looks at its frames every 2 seconds. A 15-minute kitchen task at one frame per second is 900 frames. In the MEM paper, a VLA that reads raw frames already needs about **3.5 s for 16 frames**, against a real-time limit of 0.3 s.

![Line chart: inference time against number of frames. Without a video encoder it rises from about 0.07 s at 1 frame to about 3.5 s at 16 frames, crossing the 300 ms real-time barrier at 4 frames. With MEM's video encoder it stays near 0.2 s at 16 frames.](/assets/robotics/modern-control/v3/mem-latency.png "Inference time against the number of frames, for a VLA with and without a video encoder. Figure from Torne et al., MEM (2026), CC BY 4.0.")

**MEM** (Physical Intelligence, 2026) splits memory in two, like people do. Recent seconds go through a compact video encoder, so the arm remembers the object it's now hiding. Older events become a short text summary that a higher-level policy rewrites as it goes ("I opened the drawer with the masher"). On recipe setup and kitchen cleanup tasks lasting up to 15 minutes, π0.6 without memory reaches about a third of the task; with MEM, about 70%. [MEM abstract](https://arxiv.org/abs/2603.03596)

![MEM architecture: a high-level policy reads the task, recent images and its language memory, then writes an updated memory and a subtask; a low-level policy with a video memory encoder outputs continuous actions for that subtask.](/assets/robotics/modern-control/v3/mem-architecture.png "MEM: text memory for long-term events, video memory for the last seconds. Figure from Torne et al. (2026), CC BY 4.0.")

![Bar chart of task progress on Recipe Set Up and Clean Kitchen: π0.6 without memory about 35% on average, video-only, text-only and naive text plus video memory between about 30% and 37%, π0.6-MEM about 70%.](/assets/robotics/modern-control/v3/mem-results.png "Task progress with and without memory. Only the combination of text and compressed video memory works. Figure from Torne et al. (2026), CC BY 4.0.")

```so101-widget
{"type": "predict", "id": "RC4", "fallback": "Predict first. A VLA without a video encoder needs about 0.35 s for 4 frames and about 3.5 s for 16 frames; the real-time limit is 0.3 s. A kitchen task lasts 15 minutes, at one frame per second. Can the policy keep every frame? Answer: No. 15 x 60 = 900 frames, far beyond the 16 that already take 3.5 s. The memory must be compressed: video for recent frames, text for old events."}
```

Memory has its own failure mode, and it's the one I'd test first. Suppose the gripper closes beside the block. The command finished, but the pickup failed. If the text memory now says "block put away", every later decision builds on a false record. A memory that can't tell "I tried" from "it worked" is worse than no memory.

### World models without all the pixels

DreamZero imagines every pixel of the next frames. That's what makes it slow and big. And sometimes it's what makes it wrong: when the imagined video goes off, the robot follows it.

![Two tasks where the video prediction failed. Draw a line on the whiteboard: the generated video does not show the drawing, and the robot does not draw. Bake the croissant: the generated video drifts, and the robot follows the failed plan.](/assets/robotics/modern-control/v3/dreamzero-failed-plan.png "Imagined video (top) and execution (bottom) when the imagination fails. Figure from Ye et al. (2026), CC BY 4.0.")

Does the robot need the pixels at all? To choose between the detour and the collision, it needs to know where the gripper and the block will be, not the texture of the table.

**V-JEPA 2** (Meta, 2025) predicts the future in **features**, learned numerical summaries of an image, not in pixels. To plan, it tries many candidate action sequences, predicts their final features, and keeps the one whose features are closest to the features of a goal image. Then it executes the first action and plans again. [V-JEPA 2 v1, §3.2](https://www.alphaxiv.org/pdf/2506.09985v1?page=10)

![Original V-JEPA 2 planning diagram showing observations, candidate actions and a goal-image comparison](/assets/robotics/modern-control/vjepa-planning.png "V-JEPA 2 planning in feature space. Figure 7 from Assran et al., V-JEPA 2 (2025), CC BY 4.0.")

It isn't free either. In the paper, one planning step took 16 seconds on one GPU, with 800 sampled action sequences and ten rounds of refinement. [V-JEPA 2 v1, p. 15](https://www.alphaxiv.org/pdf/2506.09985v1?page=15) The pixels are gone, but the search is expensive.

DreamZero's own speed-up points the same way, which I didn't expect. DreamZero-Flash trains the model to predict clean actions from *very noisy* video, so at run time one denoising step is enough. The actions stay good while the imagined video stays rough. The authors also note that dropping the video and generating only actions barely saved time at this size: the number of denoising steps and layers sets the cost, not the pixels. [DreamZero, real-time section](https://arxiv.org/html/2602.15922v1) My reading: the useful part of imagining is the rough shape of the future, and the open question is how little of it you can predict and still choose well.

<details>
<summary>Side path: physical structure and safety checks</summary>

A different way to make a learned policy more reliable is to give it explicit physics: shapes, free space, uncertainty. Waymo combines learned models with explicit objects and road structure, and checks each planned path in a separate layer. Field AI feeds computed geometry and uncertainty to its networks. I wrote about both in [why I'm learning robotics](/robotics/why-i-am-learning-robotics/), and the previous version of this post quoted Ali Agha's [A3 interview](https://www.automate.org/automated-podcast/episodes/automated-podcast-episode-ali-agha). Giving the network information and enforcing a constraint are different mechanisms: the first can be ignored, the second can't.

</details>

### What I'd test next

The loop is the same as in 2010: observe, choose, act, check, revise. What changed is how much of "choose" is learned, and how many robots, tasks and minutes of practice feed it. Three checks would tell me whether the next steps are real:

1. **Memory under failure.** After a failed grasp, does a MEM-style text memory notice and correct a false "done"? Count complete jobs, retries and human interventions.
2. **Imagination at contact.** Does a world model rank the right action higher when contact matters, for example a grasp that slips, compared with the same policy without the imagined video?
3. **Practice without a person.** How much of RL's reliability gain survives when a learned success detector replaces the human judge and the robot resets its own scene?

<details>
<summary>Sources, licenses and what I didn't verify</summary>

Papers were checked on arXiv on October 5, 2026: ACT, π0, π0.5, π\*0.6, π0.7, RLT, HIL-SERL, EXPO-FT, DreamZero, MEM, RoboMME, Robostral Navigate, OpenVLA and V-JEPA 2. Figures copied from papers are from CC BY 4.0 papers and credited in their captions. For papers under the arXiv non-exclusive license (ACT, π0 to π0.7, RT-2, RLT), I made my own diagrams or used no figure. The three bar charts are mine, drawn from the papers' tables. Videos are embedded from the authors' or companies' own YouTube channels.

The EXPO-FT numbers come from its Table 2. The Dong and Finn post summarizes the same comparison; its "5.5/30" average belongs to HIL-SERL on a subset of four tasks, not to imitation fine-tuning. The RoboArena score is from NVIDIA's June 2026 blog, not from my own check of the leaderboard. The MEM latency and task-progress numbers are read from the paper's figures, so they are approximate. RECAP's advantage example uses made-up numbers. I haven't run any of these systems.

</details>
