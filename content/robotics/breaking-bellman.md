---
title: 'I learn by breaking things, so I made a game where RL breaks'
description: 'Breaking Bellman is a free, open-source game where real reinforcement learning algorithms train in your browser and fail in front of you. You fix them one word at a time and rediscover Q-learning, DQN, PPO and the robot-learning methods of today.'
date: '2026-10-15'
slug: 'breaking-bellman'
---

Give Q-learning a neural network on CartPole, and its value estimate climbs to **4.7 million**. CartPole is a simple task: keep a pole balanced on a cart, and earn a reward of 1 for every step it stays up. With the discount used here, no policy can earn more than 100. The network isn't a little optimistic. It's off by a factor of 47,000, and it keeps climbing.

This failure is famous. Sutton and Barto call it the deadly triad: a network, a target built from its own guesses, and data from moves the target doesn't assume. You can recite those three ingredients and still not know which fix works, or what the curve looks like when you pick the wrong one. Watching it happen shows you. That's how I learn best: I build something and watch it break.

So that's my question for this post: **can you learn reinforcement learning by watching it break?** My short answer is yes, if you have to predict what happens before you see it. This is how I learn best, so I turned it into a game. It's called **Breaking Bellman**. It's free, it's open source, and it runs in your browser.

[Play it](https://github.com/Hadrien-Cornier/breaking-bellman/releases/latest/download/breaking-bellman.html) (one HTML file: download it and open it) or [read the source](https://github.com/Hadrien-Cornier/breaking-bellman).

## What the game is

**Reinforcement learning (RL)** is learning from trial and error. An agent takes actions, gets **rewards**, and slowly changes its **policy**, the rule that picks its next action. Most RL methods also keep a **value estimate**: a guess at how much reward an action will lead to. The **Bellman equation** says how those guesses fit together. In the form Q-learning uses, the value of an action is, on average, the reward it gets plus the discounted value of the best action after it. Q-learning, DQN and most of the methods in between move their estimates toward that target. That's the "Bellman" the game breaks.

In Breaking Bellman, the update rule of a learner is a sentence made of words you can change, for example "move each estimate *a fixed share* toward *1 real reward*, then a guess: the value of *the best next action*, chosen by *the live estimate*". Every word is a real design choice. When you change one and press Run, real training starts in your browser, and you get real curves a few seconds later.

![A campaign level in Breaking Bellman: on the left, the map of 17 levels in 6 phases; on the right, ten slot machines with the true payouts as bars and the learner's beliefs as lines, and the update rule as a sentence with changeable words.](/assets/robotics/breaking-bellman/campaign.png "Level 1. The bars are the true payouts of ten slot machines. The lines are what the greedy learner believes after training. It found one good-looking machine and stopped looking. Simulation.")

The campaign has 17 levels in 6 phases. Each level breaks the method that won the level before:

| Phase | What breaks | What you rediscover |
|---|---|---|
| 1. Value learning | Greedy choice, falling off a cliff while exploring, values that explode, a mirage | ε-greedy, Q-learning, Sarsa, DQN, Double Q-learning |
| 2. Policy gradients | Whole-episode credit is noise, reusing a batch wrecks the policy | REINFORCE, PPO, GRPO |
| 3. Continuous control | A critic the policy can climb, a policy that stops exploring | DDPG, TD3, SAC |
| 4. Offline learning | A critic that trusts actions it never saw, copying bad data | TD3+BC, IQL, filtered copying |
| 5. The robotics frontier | Averaging two good paths into a bad one, a frozen policy in the mud | Flow policies, action chunks, steering with a critic, residual RL |
| 6. Bonus | A reward bonus that becomes the goal | Potential-based reward shaping |

When your sentence works, the codex shows the published method it matches, word by word, with a link to the paper. Most of the time you find that someone wrote your fix down years ago. That's the fun part: you don't learn PPO as a list of tricks. You hit the problem each trick solves, in that order.

## A level, from prediction to paper

Most levels follow the same six steps:

1. **Predict.** Before you run anything, you pick what you think will happen. Each answer is a short chain of reasoning, and if you're wrong, the feedback tells you at which step your chain breaks.
2. **Run.** Real training, in a Web Worker. Every curve on the screen comes from code that just ran, and the page labels all of it "Simulation".
3. **Diagnose.** You read the charts and an autopsy: a list of symptoms with numbers. You can also step through one single update of the learner, number by number.
4. **Repair.** You change words in the sentence and run again.
5. **Explain.** You say why your repair works.
6. **Compare.** The codex lines up your sentence with the published one.

When a run does something surprising, a "Did you notice?" card asks you to look at one chart and say what you see before it explains anything. That's the core of the design, and I'll come back to why.

## What breaking things teaches

Here are three failures the game shows, and what each one teaches. All numbers are from the game's own engine, logged in [the experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/main/EXPERIMENTS.md). They're simulations of toy worlds, not robot results.

### Values explode, and the famous fix doesn't stop them

Back to the 4.7 million. The diagnosis is that three things feed each other. A network shares weights between nearby states, so raising one estimate raises its neighbors. The target is built from the network's own estimate, which is called **bootstrapping**. And the data comes from moves that aren't the moves the target assumes. Weaken one leg and the loop should stop. So which fix works?

Here's each fix, measured on 5 seeds:

| Sentence | Final score (out of 200) | Largest value estimate |
|---|---|---|
| Network, learn from the newest move | 9 | 4.7 million |
| + learn from random old moves (replay) | 91 | 110,000 |
| + a frozen copy scores the next action (target network) | 57 | 81 |
| Both: this is DQN | 144 | 65 |

Replay alone, the famous half of DQN, didn't stop the explosion. It only slowed it down. The frozen copy stopped it, because the target no longer moves every time the learner updates. Dropping the guess and learning from whole-episode returns also worked, with replay, because CartPole episodes are short and always end. A 10 times smaller step size didn't fix it either: the values still reached 2,300. Many small steps in the same direction still add up.

One detail stands out. Before the run, the AI assistant that set up the experiment wrote down its prediction: the network would be "unstable but not divergent to millions". It diverged in all 5 seeds, and the largest estimate reached 4.7 million. Writing the prediction down first is what made the surprise visible.

### The experiment that changed the game

The plan was to teach Double DQN on CartPole too. DQN picks the best next action with a max, and the max of noisy estimates is biased upward, so DQN should overestimate. I ran it. It didn't. On CartPole, at the budgets the game can afford, the estimates stayed *below* what the policy actually earned. My guess is that value spreads too slowly through 200 steps at that budget for the bias to show.

So I moved the lesson to a tiny world from Sutton and Barto's book: two doors. The right door ends the episode with nothing. The left door leads to ten slot machines that each pay −0.1 on average, with a lot of noise. Going left is a bad deal. But the learner's target uses the *largest* of ten noisy estimates, and the largest of ten noisy numbers is almost always positive. Over 300 runs, Q-learning chose the left door in **82%** of episodes at its worst point. Double Q-learning, where one estimate picks the machine and another one scores it, peaked at **16%**.

That's a lesson that's hard to get from reading: a bias that is real in theory can be invisible in your setup, and you need the setup where it shows.

### The greedy player locks in

Level 1 is ten slot machines. A greedy learner always pulls the machine with the best average so far. It sounds sensible, and over 300 runs it played the best machine only **33%** of the time at the end. It tried one machine that paid well early and never looked again. Pulling a random machine 10% of the time (ε-greedy) raised that to **78%**. Exploration isn't a detail you add at the end. It's the first thing that breaks.

## The dog that learned to sit

The bonus level is about the reward itself. It's inspired by [Huggy](https://huggingface.co/learn/deep-rl-course/unitbonus1/introduction), the dog from the Hugging Face Deep RL course. Here, a 2D dog has to get a thrown stick. The learner is PPO, the same algorithm the course uses. This time you don't change the learner. You change the reward.

The starting reward looks reasonable: 1 for the stick, −0.01 for every step so the dog hurries, and a small bonus of up to 0.05 for every step the dog faces the stick, to help it learn to look first. The bonus shrinks as the dog turns away. What does the trained dog do?

It turns toward the stick and sits there.

<div class="video-pair">

![The field with the starting reward: the trained dog sits next to its owner at the bottom of the field and faces the stick at the top right. The caption says no stick after 60 steps.](/assets/robotics/breaking-bellman/fetch-sits.png "The starting reward. The dog turns to face the stick and sits: no stick after 60 steps. Over 3 seeds, it got the stick in 0% of test throws. Simulation.")

![The field after the repair: a straight line shows the path of the dog to the stick at the top left. The caption says got it in 16 steps.](/assets/robotics/breaking-bellman/fetch-fetches.png "After the repair, with potential-based shaping and no facing bonus. The same PPO learner runs straight to the stick: got it in 16 steps. Simulation.")

</div>

It got the stick in **0%** of test throws, and each throw paid it about **2.12**, more than the stick is worth. With 3 times more training it still never fetched, and it earned more per throw (2.24). More training made it better at staring. The same learner with no facing bonus fetched in **100%** of throws.

The arithmetic is simple once you see it. Use the sliders below.

```so101-widget
{"type":"fetch-reward","fallback":"Over one throw of 60 steps, with a facing bonus of 0.05 and a cost of 0.01 per step: sitting and staring earns 60 × 0.04 = 2.4. Fetching in 15 steps earns 15 × 0.04 + 1 = 1.6. Sitting wins when the bonus is above 0.01 + 1 / (60 − 15) = 0.032 per step."}
```

The calculator is a simplification: it assumes the dog faces the stick the whole time, and it adds up rewards without a discount, while the learner weighs later rewards a bit less. But it's close to what the game measured. A bonus of 0.03 per step did no harm, and 0.05 took over.

This has a name, **reward hacking**: the learner maximizes the reward you wrote, not the behavior you meant. The classic paper on the fix, by [Ng, Harada and Russell (1999)](https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf), opens with two examples. A bicycle agent rewarded for progress toward its goal "learned to ride in tiny circles near the start state because no penalty was incurred for riding away from the goal". And a soccer robot rewarded for touching the ball learned to stay next to it and vibrate.

Their fix is **potential-based shaping**. Pick a function of the state, the potential Φ, for example minus the distance to the stick. Then add γ·Φ(next state) − Φ(current state) to the reward, where γ is the discount. Along any path, each Φ appears once with a plus and once with a minus, so the extra terms collapse to $\gamma^T\,\Phi(\text{end}) - \Phi(\text{start})$. Without a discount, a loop that comes back to where it started earns exactly nothing extra. With a discount, a loop isn't exactly zero, but their Theorem 1 shows the best policy stays the same, and that any other form of bonus can change it in some world.

That's the lesson that carries over to a robot arm. Every robot reward is a guess at what you want. A bonus for "the gripper is near the object" can teach an arm to hover next to it.

## Why the game asks before it shows

I built the game around one habit: **predict first**. The research on learning backs it up.

- In a physics course, students who passively watched a demonstration [understood the concept no better than students who didn't see it at all](https://doi.org/10.1119/1.1707018). Students who predicted the outcome first understood it significantly better (Crouch and others, 2004).
- A [meta-analysis of 164 studies](https://doi.org/10.1037/a0021017) found that unassisted discovery does worse than explicit teaching (d = −0.38), but discovery with feedback, worked examples and explanations does better than the other kinds of teaching it was compared with (d = +0.30). So the game doesn't leave you alone with a blank page: it gives you a sentence with a few words to change, and it explains every wrong answer.
- [Trying a problem before you're taught the solution](https://doi.org/10.3102/00346543211019105) beats the reverse order in a meta-analysis of 53 studies (g = 0.36). That's the shape of every level: you fail first, then the codex shows you the published answer.
- Games for learning have a modest positive effect, [d = 0.29 in 77 comparisons](https://doi.org/10.1037/a0031311), larger when the game is combined with other teaching and played over several sessions.

The Review tab follows the same idea: it shows you a failure and a blank sentence, and you rebuild the method from memory, mixed across worlds.

## How I built it with AI

An AI assistant wrote most of the code. It also read papers with me and ran the experiments behind every number in the game: more than 250 configurations in 27 batches, logged with their settings and results, including the runs that failed. Most batches also record a prediction made before the run.

That speed is the point, and also the trap. I wrote about this in [why I'm learning robotics](/robotics/why-i-am-learning-robotics/): when an agent builds the experiment for you, it can skip the decisions that would have made you understand it. An explanation an AI wrote for me is something I've read, not something I know. The game is my answer to that trap. The AI builds the sandbox fast, and the sandbox makes me predict, fail and explain.

There's an optional AI tutor in the Chat tab. It can read the lab, change words and start runs. It uses your own API key (Anthropic, OpenAI, OpenRouter, or a local model with Ollama), and the page sends the key only to the provider you pick. There's no server in between, so I can't see your key and nobody spends it but you. That's also why there's no hosted version with a tutor on my key: every visitor would spend my money. The game works fully without it.

## Where the game breaks

A game about breaking things should say where it breaks too.

- **The worlds are toys.** CartPole isn't a robot, and a 2D dog that turns and walks isn't Huggy, which moves four legs with joint motors. A method that works here can still fail on a real arm, and the reverse.
- **The levels are tuned so the failure shows.** The budgets and settings were picked so each failure is clear in a few seconds. Real failures are messier and slower, and they don't come with an autopsy.
- **"Rediscover" is generous.** You choose from a menu of words. Inventing the frozen target network from scratch is much harder than picking it from a list.
- **Small samples.** On the bigger worlds, runs in the page use 1 to 5 seeds. Treat small differences between two sentences with caution.
- **Nobody has measured whether it teaches.** The research above comes from classrooms, mostly with school and university students. Nobody has tested yet whether players of this game learn more than readers of the book.

## Check yourself

Each question gives all the facts it needs. The reasoning is in the drawer.

**Question 1.** CartPole pays 1 per step, and the discount is 0.99. A network's largest value estimate is 4.7 million. What's the most any policy can earn?

- A. 200, the time limit.
- B. 100.
- C. 4.7 million, if the pole never falls.

<details>
<summary>Answer</summary>

B. A discounted sum of 1s is at most 1 + 0.99 + 0.99² + … = 1 / (1 − 0.99) = 100. With the 200-step limit it's even lower, about 87. A forgets the discount. C confuses the estimate with what a policy can earn: the estimate is the bug.

</details>

**Question 2.** Ten slot machines each pay −0.1 on average, with independent normal noise of standard deviation 1. You pull each machine once, and each estimate is that single payout. The target uses the largest of the ten estimates. About how big is it, on average?

- A. −0.1
- B. +1.4
- C. +10

<details>
<summary>Answer</summary>

B. The largest of ten standard normal numbers is about 1.54 on average, so the largest estimate is about −0.1 + 1.54 ≈ 1.4. A is the true value of each machine, not the max of noisy estimates. C adds the ten machines instead of taking the largest.

</details>

**Question 3.** A dog walks 1 m away from the stick, then 1 m back. Reward 1 pays +1 per meter closer and nothing for moving away. Reward 2 is potential-based, with Φ = −distance and no discount. What does the loop earn under each?

- A. +1 and 0
- B. 0 and 0
- C. +1 and +1

<details>
<summary>Answer</summary>

A. Reward 1 ignores the walk away and pays the walk back, so every loop earns +1: the bicycle that rides in circles. Reward 2 charges −1 for the walk away and pays +1 for the walk back, so the loop sums to Φ(end) − Φ(start) = 0. B misses that reward 1 never charges for leaving. C treats the potential like reward 1.

</details>

## Play it

- **Play:** [download `breaking-bellman.html`](https://github.com/Hadrien-Cornier/breaking-bellman/releases/latest/download/breaking-bellman.html) and open it in Chrome, Edge, Firefox or Safari. It works offline.
- **Source:** [github.com/Hadrien-Cornier/breaking-bellman](https://github.com/Hadrien-Cornier/breaking-bellman), MIT license. With Node.js installed, `npm start` builds it and serves it on your computer.
- **Add a world:** a world is one JavaScript file with `reset`, `step` and `render`. If you break something new, I'd love to see it.

Your progress stays in your browser. In Settings you can export a Markdown log of every method and failure you found.
