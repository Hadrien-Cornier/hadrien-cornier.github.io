---
title: 'Why I am learning robotics'
description: 'A new learning project: robot data, bodies, and control, with AI as a tool and writing as a way to test my understanding.'
date: '2026-09-28'
slug: 'why-i-am-learning-robotics'
---

I started learning robotics recently. Part of the appeal is the gap between the robots I expected from science fiction and what we can actually use. It feels like an especially interesting time to try to understand that gap. AI is changing how robots learn, and there are still basic questions about what to build and how to teach it.

[ACT, Action Chunking with Transformers](https://tonyzhaozh.github.io/aloha/), was one of the things that drew me in. In 2023, it learned selected manipulation tasks from 50 demonstrations per task, about ten minutes of human operation. That felt like something I could try myself.

What interests me most is connecting language and knowledge to physical action. A model can identify an object or explain a task. Making an arm carry it out requires choosing movements, coordinating joints, and reacting to what happens. Systems such as [PaLM-E](https://palm-e.github.io/), which connects language commands to a robot policy, make that connection worth exploring.

There are several ways into the problem. Teleoperation can supply demonstrations. Simulation gives us environments to experiment in. Reinforcement learning can improve behavior through rewards, in simulation or on a real robot. These can be combined. I want to understand what each contributes, where it fails, and what useful training data actually looks like.

The data question became more concrete when Figure announced [Index on August 25, 2026](https://www.figure.ai/news/introducing-index). The app pays contributors to record everyday tasks at home or work. Its [product page](https://www.figure.ai/index-app) describes providing a recording device and paying by the minute. Figure's earlier [Project Go-Big](https://www.figure.ai/news/project-go-big) used egocentric video, filmed from a person's perspective, to train robot navigation. Watching human activity become training data makes me curious about what transfers to a robot and what still requires robot experience.

The bodies are just as interesting. When does a humanoid make sense? When is a purpose-built arm enough? How do tendon-driven hands compare with other ways of transmitting motor force? The answers could differ across factories, construction sites, and homes. I also want to understand what a robot remembers and whether it maintains a useful map beyond its latest camera image.

My guess is that general-purpose robots could become useful in homes within five to ten years. That is speculation, not a forecast I can defend yet. Reliability, cost, and the range of tasks they can handle matter more than an impressive demonstration. I would like to understand those limits well enough to revise my guess.

[Jacob Rothschild's writing about robot control](https://x.com/ja_rothschild/article/2100633491432239411) helped inspire this project. I want to learn by trying things and writing down the parts I can explain. I own an SO-101 and have started exploring a Franka arm in simulation.

AI makes this easier to begin. I can ask a basic question, follow it into equations or code, and get help setting up an experiment. But a clear answer can arrive before I've done the thinking. Some friction is useful: working through a derivative, checking an assumption, or finding the example that exposes what I haven't understood.

That is why I want to write these reports. A post makes me sit down, check the claims, choose the diagrams, and explain the result in my own order. I plan to publish weekly as I learn. The first technical report starts with [joint angles, hand poses, and motor control](/robotics/from-joint-angles-to-a-moving-arm/).
