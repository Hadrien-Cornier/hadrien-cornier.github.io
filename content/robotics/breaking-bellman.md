---
title: 'I made a small game where RL algorithms break'
description: 'Breaking Bellman is a free browser game for learning reinforcement learning. Real algorithms train in your browser and fail, and you fix them one word at a time.'
date: '2026-10-15'
slug: 'breaking-bellman'
tags: ['reinforcement-learning', 'simulation', 'education']
thumbnail: /assets/robotics/thumbnails/breaking-bellman.jpg
thumbnail_alt: 'A casino with ten slot machines. A small robot stands in front of machine 8, which it pulled 995 times, and says: I pick #8! (Wrong.) A crown floats over machine 7.'
---

Give Q-learning a neural network on CartPole and its value estimate climbs to **4.7 million**. The most any policy can earn there is 100. So the network is off by a factor of 47,000, and the estimate is still climbing when the run ends.

I learn more from failures like that than from derivations, so I made a small game out of them. It's called **Breaking Bellman**, it runs in your browser, and it's free.

**[Play it](https://hadrien-cornier.github.io/breaking-bellman/)** · [Source on GitHub](https://github.com/Hadrien-Cornier/breaking-bellman)

![A casino with ten slot machines. A small robot stands in front of machine 8, which it pulled 995 times, and says: I pick #8! (Wrong.) A crown floats over machine 7.](/assets/robotics/breaking-bellman/casino.png "Level 1. The robot plays ten slot machines with a greedy rule. Gold is each machine's true average payout, blue is what the robot believes. The crown marks the actual best machine. Simulation.")

## How it works

Each level hands you a learner that's broken in an educational way. You guess what it'll do, then press Run to watch it train for a few seconds in your browser. To fix it, you change words in its update rule, written as a sentence. For example, "move the estimate toward *the payout*" becomes "toward *the payout plus the best next estimate*".

If the fix works, the game shows the published method you just rebuilt, with its paper. That one is Q-learning, from 1989. You're a few decades late, but you got there.

There are 17 levels: slot machines, a cliff, CartPole, a mirage, policy gradients, continuous control, offline data, a fork in the road for a robot arm, and a dog. Play them in any order.

![A grass plateau above a canyon. Sandy tiles show where the robot walked. It tumbles into the canyon, and two red −100 marks float where it fell. A flag marks the GOAL rock at the other end.](/assets/robotics/breaking-bellman/canyon.png "Cliff walking. The robot explores the cliff edge mostly by falling off it, at −100 per fall. Simulation.")

## Three things I learned by breaking stuff

**Replay alone doesn't fix DQN.** Back to the 4.7 million, on 5 seeds:

| Sentence | Score (out of 200) | Largest value estimate |
|---|---|---|
| Network, learn from the newest move | 9 | 4.7 million |
| + learn from random old moves (replay) | 91 | 110,000 |
| + a frozen copy scores the next move (target network) | 57 | 81 |
| Both: this is DQN | 144 | 65 |

Replay slowed the explosion down. The frozen copy stopped it.

**A bias can be real and still invisible.** I planned to teach Double DQN on CartPole, because taking the max over noisy estimates should make DQN overestimate. But in my runs, the estimates stayed below what the policy earned. So I moved the lesson to a tiny two-door world from Sutton and Barto's book. The left door leads to ten machines that each pay −0.1 on average. Q-learning still went left in **82%** of episodes at its worst point. Double Q-learning peaked at **16%**.

**Greedy settles for the first decent option.** On ten slot machines, a greedy learner ends on the best machine in **33%** of runs. Pull a random machine 10% of the time and that goes up to **78%**.

All numbers come from the game's own engine and are logged in [the experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/main/EXPERIMENTS.md). They are simulations of toy worlds.

For the trade-offs behind these settings, see [Recipes for choosing a learning target](/robotics/recipes-for-choosing-a-learning-target/). It covers frozen copies, second estimates, minimum targets and return-length blending.

## The dog that learned to sit

The bonus level is inspired by [Huggy](https://huggingface.co/learn/deep-rl-course/unitbonus1/introduction), the dog from the Hugging Face Deep RL course. You train a 2D dog with PPO to fetch a stick. The reward is +1 for the stick, −0.01 per step so it hurries, and a small bonus of up to 0.05 per step for facing the stick, to help it learn to look first.

The trained dog turns toward the stick, sits down, and admires it.

<div class="video-pair">

![The field with the starting reward: the trained dog sits next to the robot that threw the stick and faces it at the top right. The caption says no stick after 60 steps.](/assets/robotics/breaking-bellman/fetch-sits.png "The starting reward. The dog faces the stick and sits: no stick after 60 steps, in 0% of test throws. Simulation.")

![The field after the repair: a straight line shows the dog's path to the stick. The caption says got it in 16 steps.](/assets/robotics/breaking-bellman/fetch-fetches.png "After the repair, with potential-based shaping and no facing bonus, the same PPO learner gets the stick in 16 steps. Simulation.")

</div>

Staring paid about 2.12 per throw, more than the stick is worth. With 3 times more training it got better at staring, not at fetching. Here's the arithmetic:

```so101-widget
{"type":"fetch-reward","fallback":"Over one throw of 60 steps, with a facing bonus of 0.05 and a cost of 0.01 per step: sitting and staring earns 60 × 0.04 = 2.4. Fetching in 15 steps earns 15 × 0.04 + 1 = 1.6. Sitting wins when the bonus is above 0.01 + 1 / (60 − 15) = 0.032 per step."}
```

This is **reward hacking**: the learner maximizes the reward you wrote, not the one you meant. The fix in the game is potential-based shaping from [Ng, Harada and Russell (1999)](https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf). It pays for getting closer and charges the same amount for moving away, so walking in circles earns nothing. Their paper opens with a bicycle agent that learned to ride in tiny circles. Same energy as my dog.

## Why it makes you guess first

In a physics course, students who predicted the outcome of a demonstration before watching it [understood it better than students who only watched](https://doi.org/10.1119/1.1707018) (Crouch and others, 2004). So every level asks for your prediction before you run it. Being wrong is part of the game.

I also built it with an AI assistant, which wrote most of the code and ran the 250+ experiment configurations with me. That makes the guessing more important, not less: reading an explanation an AI wrote for me isn't the same as knowing it.

## Where the game breaks

- The worlds are toys. CartPole is not a robot, and a 2D dog is not Huggy.
- Picking the right word from a menu is much easier than inventing PPO.
- Nobody has measured yet whether players learn more than readers of the book.

## Check yourself

**Question 1.** CartPole pays 1 per step, and the discount is 0.99. A network's largest value estimate is 4.7 million. What is the most any policy can earn?

- A. 200, the time limit.
- B. 100.
- C. 4.7 million, if the pole never falls.

<details>
<summary>Answer</summary>

B. A discounted sum of 1s is at most 1 + 0.99 + 0.99² + … = 1 / (1 − 0.99) = 100. With the 200-step limit it is even lower, about 87. A forgets the discount. C confuses the estimate with what a policy can earn: the estimate is the bug.

</details>

**Question 2.** A dog walks 1 m away from the stick, then 1 m back. Reward 1 pays +1 per meter closer and nothing for moving away. Reward 2 is potential-based, with Φ = −distance and no discount. What does the loop earn under each?

- A. +1 and 0
- B. 0 and 0
- C. +1 and +1

<details>
<summary>Answer</summary>

A. Reward 1 ignores the walk away and pays the walk back, so every loop earns +1: the bicycle that rides in circles. Reward 2 charges −1 for the walk away and pays +1 for the walk back, so the loop sums to Φ(end) − Φ(start) = 0. B misses that reward 1 never charges for leaving. C treats the potential like reward 1.

</details>

The game is MIT-licensed and fits in one HTML file. It saves your progress in your browser. If you break something new with it, I'd love to see it.
