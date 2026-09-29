---
title: 'Why I am learning robotics'
description: 'New robot companies, new ways to learn, and unresolved questions about bodies, data, and reliable progress.'
date: '2026-09-28'
updated: '2026-09-29'
slug: 'why-i-am-learning-robotics'
---

In September 2025, Figure announced [more than $1 billion in committed Series C funding](https://www.figure.ai/news/series-c), at a $39 billion valuation. The company was [founded in 2022](https://www.figure.ai/culture). Three years from starting a company to a round of that size is striking. In August 2026, it announced [Index](https://www.figure.ai/news/introducing-index), an app that pays people to record everyday activities. Figure reported more than **16 million videos** and **44,000 weekly active users**. A humanoid company is building a human-data collection business.

The wider industry is already substantial. The International Federation of Robotics counted [944 service-robot producers in its 2025 report](https://ifr.org/img/worldrobotics/Executive_Summary_WR_2025_Service_Robots.pdf), excluding system integrators. Its latest report puts the [industrial robot population at five million in 2025](https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally). What feels young is the attempt to make one robot useful across many changing tasks and places.

It reminds me of AI around 2019 and 2020. Alongside better models, companies were building the machinery for creating training data: [Scale, founded in 2016](https://scale.com/about), [Labelbox in 2018](https://labelbox.com/company/about/), and [Snorkel AI in 2019](https://snorkel.ai/company/). Robotics now has its own version of that problem. The internet contains plenty of descriptions of opening a drawer. It contains much less synchronized evidence of what a robot saw, commanded, and felt while doing it.

That combination makes the field interesting: substantial investment, visible technical progress, and basic choices that remain open. What body should a robot have? What experience should it learn from? How do we know that it is getting better?

## What changed in robot learning?

[Unimate began factory work in 1961](https://www.thehenryford.org/collections/explore/artifact/183434). Robots have been useful for 65 years. The harder ambition is a machine that can take a familiar skill into an unfamiliar situation. Change the cup, lighting, table height, or clutter, and the same instruction can require a different movement. This ability to carry learning into new situations is **generalization**.

[ACT, Action Chunking with Transformers](https://arxiv.org/html/2304.13705v1), made that problem feel accessible to experiment with. Its 2023 paper trained a transformer to take camera images and joint positions and predict a short sequence of joint targets. That is a **policy**: a rule for choosing actions from what the robot observes. Five of the six real tasks used **50 demonstrations each**; threading Velcro used 100. The recorded motion amounted to 10 to 20 minutes per task. Collecting it took 30 to 60 minutes, including resets and mistakes.

A separate advance brought in knowledge learned from images and text. A **vision-language model**, or VLM, connects what it sees with language. A **vision-language-action model**, or VLA, also produces robot actions. [RT-2](https://deepmind.google/blog/rt-2-new-model-translates-vision-and-language-into-action/) trained on web and robot data together. In its 2023 evaluations, success on unseen scenarios rose from RT-1's **32% to 62%**. Objects, backgrounds, and environments were varied to test that transfer.

Some systems split the work across different levels. In [Gemini Robotics 1.5](https://deepmind.google/blog/gemini-robotics-15-brings-ai-agents-into-the-physical-world/), a reasoning model plans steps and calls tools, then gives instructions to a VLA that controls movement. A request such as "put the groceries away" can become a sequence of smaller goals, with new observations changing the plan. This connects broad knowledge to learned physical skills.

The progress is large enough to change what is worth trying. Reliability is still the test. On September 17, 2026, [Figure reported](https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization) **56% task success across three behaviors in 30 unseen homes**, compared with 9% without Index pretraining. The tasks were tidying toys, folding towels, and making beds. Both models received the same task-specific training data from other locations. That result shows why human data is attractive, and how much room remains before a robot can be trusted to finish a household job.

## Does the robot need a human body?

Amazon offers a useful contrast. By June 2025, it had [deployed its millionth robot across a network of more than 300 facilities](https://www.aboutamazon.com/news/operations/amazon-million-robots-ai-foundation-model). Its fleet includes mobile machines and arms designed around warehouse work. A machine can be extremely useful without looking like a person.

The humanoid argument starts from the environment: doors, shelves, tools, and workstations were built for human reach and movement. Two arms and legs may let a robot use more of that infrastructure. They also bring balance, power, and mechanical complexity.

There is already measurable work behind some humanoid demonstrations. [BMW reports](https://www.press.bmwgroup.com/global/article/attachment/T0455864EN/644966) that Figure 02 moved **more than 90,000 components in about 1,250 operating hours** during its ten-month Spartanburg deployment. The job was positioning sheet-metal parts for welding. Agility reported [more than 100,000 tote movements](https://www.agilityrobotics.com/content/digit-moves-over-100k-totes) by Digit at a GXO facility in November 2025. Those are repeated industrial jobs with defined conditions.

The approaches also differ within humanoids: [Agility's Digit](https://www.agilityrobotics.com/solutions) focuses on logistics, [Apptronik's Apollo](https://apptronik.com/news-collection/apptronik-raises-350-million-in-series-a-funding) on industrial work, [1X's NEO](https://www.1x.tech/discover/neo-home-robot) on homes, and [Unitree's G1](https://www.unitree.com/g1/) is a platform people can buy and develop on. Apptronik announced a **$350 million Series A in February 2025**. Funding gives these designs room to develop; useful work per hour will decide where they fit.

The interesting comparison is the whole job: how often the robot succeeds, how much human help it needs, how long it runs, and what it costs to maintain. In some places, wheels and a gripper may be enough. In others, a more general body may earn its complexity.

## Where should the experience come from?

Several sources can contribute to the same robot. Each supplies different information.

| Source | What it gives the learner | What remains difficult |
|---|---|---|
| Teleoperation: a person controls the robot | Camera views paired with actual robot commands and measured motion | Operator time, scene resets, and collecting enough varied examples |
| Physics simulation | Repeatable trials, known state, and many experiments running in parallel | Matching real contact, friction, deformable objects, and sensor behavior |
| Human video, including egocentric views filmed from the person's perspective | Everyday tasks across many people, objects, and places | Recovering motion and contact, then translating them to a different body |

Human video makes the missing information easy to picture. A hand goes behind a mug. The camera loses the fingers just as they make contact. A pose estimator may infer their positions, but it does not directly measure the grip force. Even a perfect human hand trajectory has to become a movement the robot can perform. [EgoMimic](https://egomimic.github.io/), for example, combines tracked human hand movements with robot demonstrations. Other approaches use video to learn useful visual features before training on robot actions.

Simulation offers a different route to scale. NVIDIA's [Isaac Sim and Isaac Lab](https://developer.nvidia.com/isaac/lab) support simulated robots, sensors, and learning experiments. [World Labs' Marble can generate 3D environments that are imported into Isaac Sim](https://developer.nvidia.com/blog/simulate-robotic-environments-faster-with-nvidia-isaac-sim-and-world-labs-marble/). The scene supplies geometry and appearance; the simulator supplies physical interaction. Testing a grasp still depends on the contact and object properties being right.

A useful data collection system therefore needs more than hours of footage. It needs coverage of relevant situations, consistent measurements, and a way to connect new data to better performance. Figure is building that system internally through Index. Providers such as [micro1](https://www.micro1.ai/research/robotics-is-entering-a-phase-of-rapid-diversification) are also building robotics data services. The question is which missing experiences actually improve the robot.

## Should a robot predict actions, or their consequences?

A policy can look at the scene and choose a movement. For control, an **action-conditioned world model** predicts what could happen after a proposed movement. Push here: will the cup slide, tip, or hit something? A planner can compare those predicted futures before choosing an action.

The model can predict useful features of a scene instead of drawing every future pixel. This is the idea behind **JEPA**, Joint Embedding Predictive Architecture. Meta's [V-JEPA 2](https://arxiv.org/abs/2506.09985) first learned from over one million hours of internet video without action labels. Its control version then learned from less than **62 hours of robot data** and used predicted outcomes to plan movements. Yann LeCun's new company, [AMI](https://amilabs.xyz/), is pursuing world models that predict in this kind of learned representation space.

Another choice is how much physical structure to build into the system. Should a model learn the path from camera image to command directly? Or should parts of the system explicitly represent physical constraints and uncertainty? [FieldAI describes its approach](https://www.fieldai.com/news/fieldai-and-nvidia-omniverse-building-the-next-generation-of-industrial-ai) as combining learned models with physics-based reasoning and uncertainty awareness. The useful test is how those choices change behavior when the robot meets unfamiliar terrain or obstacles.

Reinforcement learning provides another way to improve behavior: try actions, observe outcomes, and optimize a reward. Bellman's equations connect the value of a decision to its immediate reward and the value of what comes next. Two widely used methods, [PPO](https://arxiv.org/abs/1707.06347) and [SAC](https://arxiv.org/abs/1812.05905), both support continuous actions such as joint commands. PPO learns from recent experience with controlled policy updates. SAC reuses past experience and balances reward with exploration. That reuse matters when each physical trial takes time.

These methods are still being adapted to robot learning. [RL Tokens](https://www.pi.website/research/rlt), for example, uses compact features from a VLA to help reinforcement learning refine precise skills. Demonstrations can teach the rough behavior, while rewards and corrections improve difficult parts. World models, imitation, and reinforcement learning can work together.

## Could a coding agent teach or control the robot?

[EmbodiedSWE](https://arxiv.org/html/2609.27308v1), released on September 23, 2026, treats simulated robot tasks as programming problems. A coding agent writes a solution, runs it, inspects the outcome, and tries again. Verified programs then generate varied demonstrations for training a policy. Its strongest reported agent solved about **82% of 28 simulated tasks**, with a four-hour budget per task and access to the simulator's full state.

The physical test shows the next hurdle. After fine-tuning a pretrained robot policy on **500 simulated demonstrations**, it completed a four-stage lamp disassembly in **2 of 10 real trials**, compared with 0 of 10 before fine-tuning. Generating a working simulation program and producing a reliable physical skill are two steps that both need testing.

[Agent as Policy](https://arxiv.org/html/2609.12541v1) tries a different arrangement: the coding agent stays in the loop while a real robot works. It observes, writes code, calls robot tools, and revises its actions. The robot interface handles trajectories and motor control. In three block-manipulation setups, the paper reports **5/5, 5/5, and 4/5 successful trials**; successful runs averaged roughly **21 to 35 minutes**, depending on the setup.

That is a fascinating possibility. The same kind of agent that edits files and calls software tools can request movements from a robot. The open question is how to turn that flexibility into fast, dependable behavior.

## How do we measure progress?

A new algorithm is easy to propose. A convincing comparison needs a fixed task, a clear definition of success, and enough trials to show what happens repeatedly.

Simulation helps make that possible. [LIBERO](https://github.com/Lifelong-Robot-Learning/LIBERO) provides **130 manipulation tasks** organized around different kinds of knowledge transfer. [RoboCasa365](https://arxiv.org/abs/2603.04356) includes **365 household tasks**, from individual skills to longer sequences. The [DeepMind Control Suite](https://arxiv.org/abs/1801.00690) supplies standardized continuous-control tasks. They let researchers rerun policies under controlled conditions and compare changes.

The scores show how much remains open even in simulation. In the [RoboCasa leaderboard updated September 23, 2026](https://robocasa.ai/leaderboard.html), the leading entry, Paimon-0, achieved **58.1% average success on the 50-task benchmark**. Its score on 16 held-out multi-step tasks was **36.7%**. Those tests used kitchens present during pretraining; the new challenge was the task.

The physical test adds work that software benchmarks can hide. Someone must put the objects back. Lighting shifts, batteries discharge, parts wear, and a slightly different cup changes the grasp. Two labs need to agree on the scene, starting conditions, time limit, permitted human help, and success rule.

Long tasks make reliability especially demanding. If a job requires 20 steps, each succeeds independently with probability 95%, and every step must work, the chance of finishing is $0.95^{20} \approx 36\%$. Recovery matters because one failed grasp need not end the task. An evaluation should count recoveries, interventions, elapsed time, and damage as well as completion.

This is where datasets and evaluations become central. A dataset determines which situations the robot has a chance to learn. An evaluation tells us whether it learned something that survives a change of scene. Reliable collection, useful coverage, and repeatable testing can become a lasting advantage.

## The hardware still has to survive

Hands make the connection between software and hardware concrete. A policy might choose a good grasp, but the mechanism must produce it thousands of times.

Tendons let designers put motors farther from the fingers and transmit force through cables. That leaves more space in the hand and reduces its mass. But a cable pulls; it cannot push. An opposing cable or spring must provide the return force. Cable routing brings friction, wear, and tension control. Bending the wrist can change the cable path and disturb finger motion unless the design accounts for it. [MM-Hand](https://arxiv.org/abs/2604.17245) studies these transmission problems directly.

Putting motors near the finger joints shortens that transmission, but puts more mass, heat, and machinery into a small space. The hand also has to survive impacts. Its ability to yield under a load depends on the motors, gears, elastic parts, and control working together.

In August 2026, [Figure founder Brett Adcock called its first tendon-based hand his biggest engineering mistake at the company](https://x.com/adcock_brett/status/2087927278458327179). Other teams keep developing the approach. [Shadow's hand](https://shadow-robot-company-dexterous-hand.readthedocs-hosted.com/en/latest/user_guide/md_motor_unit.html) uses twenty forearm motors and paired tendons. There are real design choices here: where to put the motors, how to sense force, and which parts will wear out.

It makes me appreciate the human hand. We get strength, touch, flexibility, and healing in one small structure. A robot needs a plan for repair: replaceable fingers, accessible cables, and parts that can be serviced without rebuilding the arm. Hardware design shapes what the software can learn and how long the result remains useful.

## Learning quickly without skipping the thinking

I have just started learning robotics, and these open questions make it a good time to begin. Papers, simulation tools, affordable arms, and coding agents make it possible to follow a question into an experiment quickly.

That speed creates its own problem. If I follow every interesting branch, I can explore for hours without making anything concrete. And when an agent builds the experiment for me, it can skip the design decisions that would have forced me to understand it. A clear answer can arrive before I've done the thinking.

I want to keep the speed while making room for the work that changes my understanding: predicting a result, choosing the experiment, explaining a failure, and finding the example that makes an idea click.

[Jacob Rothschild's writing about robot control](https://x.com/ja_rothschild/article/2100633491432239411) helped inspire these posts. Writing gives that learning a finish line. Turning scattered notes into an explanation forces me to decide what matters and connect the steps. If I can explain it clearly without the conversation that led there, I have something I can return to and test later.

I will publish articles about the questions I explore, with examples and experiments where they help. The first technical report starts with [joint angles, hand poses, and motor control](/robotics/from-joint-angles-to-a-moving-arm/).
