---
title: 'Why I am learning robotics'
description: 'What drew me to robotics, what I want to try with my SO-101, and why I am writing as I learn.'
date: '2026-09-28'
slug: 'why-i-am-learning-robotics'
---

I started learning robotics because I want to understand how a machine turns knowledge into physical action. "Pick up the cup" is a simple request. Carrying it out means finding the cup, reaching it, closing a gripper, and adjusting if it slips. I want to understand how those pieces fit together.

Part of the appeal is the gap between the robots I expected from science fiction and what we can actually use. [ACT, Action Chunking with Transformers](https://tonyzhaozh.github.io/aloha/), made experimenting feel within reach. In 2023, it learned tasks such as opening a condiment cup and inserting a battery from 50 demonstrations per task, about ten minutes of human operation. That felt like something I could try myself.

I own an SO-101 arm and have started exploring a Franka arm in simulation. [Jacob Rothschild's writing about robot control](https://x.com/ja_rothschild/article/2100633491432239411) helped inspire this project. I am starting with basic questions: how do joint angles determine where the gripper goes, and how does a motor follow the angle I ask for?

From there, I want to understand how to give a robot useful experience. I can guide an arm through a task and record demonstrations. In simulation, I can repeat an experiment and change one thing at a time. With reinforcement learning, I can give rewards for progress and let the robot learn through trial and error. What does each approach teach it? What still fails when the objects or surroundings change?

The data question becomes especially interesting when the examples come from people. [Figure's Index](https://www.figure.ai/news/introducing-index) pays contributors to record everyday tasks, such as folding laundry or stocking shelves. A person and a robot have different bodies. What can the robot learn from watching us, and what does it need to try for itself?

That leads to questions about the body itself. When does a humanoid make sense, and when is a purpose-built arm enough? I am curious about hands driven by tendons, which transmit motor force through cables. I also want to understand memory: if a robot turns away from a cup, how does it keep track of where the cup is?

My guess is that general-purpose robots could become useful in homes within five to ten years. Whether that happens depends on their reliability, cost, and the range of tasks they can handle. Learning how they work should help me judge their progress and revise that guess.

AI makes this easier to begin. I can ask a basic question, follow it into equations or code, and get help setting up an experiment. But a clear answer can arrive before I've done the thinking. Working through a derivative or testing a prediction helps me find what I haven't understood.

Writing gives me another way to check. To explain a result, I have to trace the steps, check the claims, and choose an example that makes sense without the conversation that led to it. I plan to publish weekly as I learn. The first technical report starts with [joint angles, hand poses, and motor control](/robotics/from-joint-angles-to-a-moving-arm/).
