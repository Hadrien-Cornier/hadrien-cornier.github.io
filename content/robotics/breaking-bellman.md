---
title: 'I made a small game where RL algorithms break'
description: 'Breaking Bellman is a free browser game for learning reinforcement learning. Real algorithms train in your browser and fail, and you fix them one word at a time.'
date: '2026-10-15'
slug: 'breaking-bellman'
tags: ['reinforcement-learning', 'simulation', 'education']
thumbnail: /assets/robotics/thumbnails/breaking-bellman.jpg
thumbnail_alt: 'A casino with ten slot machines. A small robot stands in front of machine 8, which it pulled 995 times, and says: I pick #8! (Wrong.) A crown floats over machine 7.'
---

On CartPole, Q-learning with a neural network produces a value estimate of **4.7 million**. The most any policy can earn there is 100, so the estimate is too high by a factor of 47,000. And when the run ends, it's still climbing.

I learn more from this kind of failure than from derivations, so I turned these failures into a small game. It's called **Breaking Bellman**. It's free and runs in your browser.

**[Play it](https://hadrien-cornier.github.io/breaking-bellman/)** · [Source on GitHub](https://github.com/Hadrien-Cornier/breaking-bellman)

![A casino with ten slot machines. A small robot stands in front of machine 8, which it pulled 995 times, and says: I pick #8! (Wrong.) A crown floats over machine 7.](/assets/robotics/breaking-bellman/casino.png "Level 1. The robot plays ten slot machines with a greedy rule. Gold is each machine's true average payout, blue is what the robot believes. The crown marks the actual best machine. Simulation.")

## How it works

Each level gives you a learner with something broken that you can learn from. You guess what it'll do, then press Run and watch it train in your browser for a few seconds. Its update rule is written as a sentence, and you fix it by changing words. For example, "move the estimate toward *the payout*" becomes "toward *the payout plus the best next estimate*".

When your fix works, the game shows you which published method you've rebuilt and links to its paper. In this example, it's Q-learning, from 1989. You got there, just a few decades late.

You can play the 17 levels in any order. They cover slot machines, a cliff, CartPole, a mirage, policy gradients, continuous control, offline data, a fork in the road for a robot arm, and a dog.

![A grass plateau above a canyon. Sandy tiles show where the robot walked. It tumbles into the canyon, and two red −100 marks float where it fell. A flag marks the GOAL rock at the other end.](/assets/robotics/breaking-bellman/canyon.png "Cliff walking. The robot explores the cliff edge mostly by falling off it, at −100 per fall. Simulation.")

## Three things I learned by breaking stuff

**Replay alone doesn't fix DQN.** Here's what happened with that 4.7 million estimate when I ran the comparison on 5 seeds:

| Sentence | Score (out of 200) | Largest value estimate |
|---|---|---|
| Network, learn from the newest move | 9 | 4.7 million |
| + learn from random old moves (replay) | 91 | 110,000 |
| + a frozen copy scores the next move (target network) | 57 | 81 |
| Both: this is DQN | 144 | 65 |

Replay slowed the explosion down. The frozen copy stopped it.

**A bias can be real even when you can't see it in your runs.** I planned to use CartPole to teach Double DQN, because taking the max over noisy estimates should make DQN overestimate. But the estimates in my runs stayed below what the policy actually earned. So I moved the lesson to a tiny world with two doors from Sutton and Barto's book. Behind the left door are ten machines, each paying −0.1 on average. At its worst point, Q-learning chose that door in **82%** of episodes. Double Q-learning peaked at **16%**.

**A greedy learner settles for the first decent option.** With ten slot machines, it finishes on the best machine in **33%** of runs. If it pulls a random machine 10% of the time, that rises to **78%**.

All these numbers come from simulations of toy worlds using the game's own engine. They're recorded in [the experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/main/EXPERIMENTS.md).

I cover the trade-offs behind these settings in [Recipes for choosing a learning target](/robotics/recipes-for-choosing-a-learning-target/): frozen copies, second estimates, minimum targets and return-length blending.

## The dog that learned to sit

The bonus level takes its inspiration from [Huggy](https://huggingface.co/learn/deep-rl-course/unitbonus1/introduction), the dog in the Hugging Face Deep RL course. You use PPO to train a 2D dog to fetch a stick. Fetching earns +1, and each step costs −0.01 to encourage it to hurry. Facing the stick also earns a small bonus of up to 0.05 per step, to help it learn to look first.

After training, the dog turns toward the stick, sits down, and admires it.

<div class="video-pair">

![The field with the starting reward: the trained dog sits next to the robot that threw the stick and faces it at the top right. The caption says no stick after 60 steps.](/assets/robotics/breaking-bellman/fetch-sits.png "The starting reward. The dog faces the stick and sits: no stick after 60 steps, in 0% of test throws. Simulation.")

![The field after the repair: a straight line shows the dog's path to the stick. The caption says got it in 16 steps.](/assets/robotics/breaking-bellman/fetch-fetches.png "After the repair, with potential-based shaping and no facing bonus, the same PPO learner gets the stick in 16 steps. Simulation.")

</div>

The dog earned about 2.12 per throw by staring, more than the reward for the stick. I gave it 3 times more training, and it got better at staring without getting better at fetching. Here's the arithmetic:

```so101-widget
{"type":"fetch-reward","fallback":"Over one throw of 60 steps, with a facing bonus of 0.05 and a cost of 0.01 per step: sitting and staring earns 60 × 0.04 = 2.4. Fetching in 15 steps earns 15 × 0.04 + 1 = 1.6. Sitting wins when the bonus is above 0.01 + 1 / (60 − 15) = 0.032 per step."}
```

This is **reward hacking**. The learner maximizes the reward you wrote down, which can differ from what you meant. In the game, I fix it with potential-based shaping from [Ng, Harada and Russell (1999)](https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf). Getting closer earns a reward, and moving away costs the same amount, so a walk in circles earns nothing. Their paper opens with a bicycle agent that learned to ride in tiny circles. It reminds me of my dog.

## Why it makes you guess first

In a physics course, students who predicted what a demonstration would do before watching it [understood it better than students who only watched](https://doi.org/10.1119/1.1707018) (Crouch and others, 2004). That's why each level asks you to predict the outcome before you run it. Getting it wrong is part of the game.

I built the game with an AI assistant. It wrote most of the code and ran the 250+ experiment configurations with me. For me, that makes guessing more important: I can read an explanation the AI wrote for me without actually knowing it.

## Where the game breaks

- The worlds are toys. CartPole is not a robot, and a 2D dog is not Huggy.
- Picking the right word from a menu is much easier than inventing PPO.
- Nobody has measured yet whether players learn more than readers of the book.

## Check yourself

**Question 1.** The network's largest value estimate on CartPole is 4.7 million. But CartPole pays 1 per step, with a discount of 0.99. What's the most any policy can earn?

- A. 200, the time limit.
- B. 100.
- C. 4.7 million, if the pole never falls.

<details>
<summary>Answer</summary>

B. A discounted sum of 1s is at most 1 + 0.99 + 0.99² + … = 1 / (1 − 0.99) = 100. With the 200-step limit it is even lower, about 87. A forgets the discount. C confuses the estimate with what a policy can earn: the estimate is the bug.

</details>

**Question 2.** Suppose a dog walks 1 m away from the stick and then 1 m back. With reward 1, it earns +1 per meter closer and nothing for moving away. Reward 2 uses potential-based shaping, with Φ = −distance and no discount. How much does that loop earn under each reward?

- A. +1 and 0
- B. 0 and 0
- C. +1 and +1

<details>
<summary>Answer</summary>

A. Reward 1 ignores the walk away and pays the walk back, so every loop earns +1: the bicycle that rides in circles. Reward 2 charges −1 for the walk away and pays +1 for the walk back, so the loop sums to Φ(end) − Φ(start) = 0. B misses that reward 1 never charges for leaving. C treats the potential like reward 1.

</details>

The whole game fits in one HTML file, is MIT-licensed, and saves your progress in your browser. I'd love to see anything new you manage to break with it.
