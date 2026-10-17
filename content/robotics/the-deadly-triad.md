---
title: 'The deadly triad: three useful ideas that fail together'
description: 'Function approximation, bootstrapping and off-policy learning each fix a real problem in reinforcement learning. Combined, they can make value estimates grow far beyond any possible reward.'
date: '2026-10-17'
draft: true
layout: essay
---

A robot on a rail must keep a broom upright. It pushes the cart left or right, and it earns 1 point for each step the broom stays up. It starts with no knowledge. It must learn by trying.

![The CartPole level of Breaking Bellman: a small robot on a rail holds a broom upright on a stage. The caption reads: Press Run, the robot learns to balance a broom.](/assets/robotics/the-deadly-triad/problem-cartpole.png "CartPole in Breaking Bellman, before training. The robot senses four numbers: cart position, cart speed, broom angle and broom speed. Simulation.")

This is a **reinforcement learning** problem. The learner acts, gets a reward, and must improve its choices. Many methods learn a **value**: how much total reward to expect from a situation if you act well afterward. With values, the choice is simple. Pick the action with the best value.

This article is about three techniques that make value learning practical. Each one helps. Together they can break the learner. The pictures come from [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), a game I made where real learning code runs in your browser and fails in front of you. The game is one example. The three techniques appear in many large reinforcement learning systems.

## What makes the problem hard

Four difficulties explain why the techniques exist.

- **Rewards come late.** A push now decides whether the broom is still up 100 steps later. The learner must work out which earlier action earned a later reward.
- **There are too many situations.** The broom world has four sensor numbers, and each can take any value in a range. You cannot list every situation and learn each one.
- **Actions can be numbers.** The pendulum below has a motor. Its action is a torque, a continuous number, not a choice from a short list.
- **Rewards are noisy.** Each slot machine pays a random amount around a hidden average. One payout tells you little.

![The Pendulum level of Breaking Bellman: a weak motor must swing a weight up to the top. The caption reads: Press Run, a weak motor learns to swing the weight up.](/assets/robotics/the-deadly-triad/problem-pendulum.png "Pendulum swing-up in Breaking Bellman. The action is a motor torque. Simulation.")

![The slot machine level of Breaking Bellman: ten machines and a small robot that asks which one pays best.](/assets/robotics/the-deadly-triad/problem-slots.png "Ten slot machines in Breaking Bellman. Each machine pays a hidden average plus noise. Simulation.")

## Three techniques that help

### 1. Function approximation: replace the table

The simplest value learner keeps a **table**: one number for each situation and action. This works on a small grid. It fails when the sensors are real numbers.

You can cut each broom sensor into 6 bins. That gives 6 × 6 × 6 × 6 = 1,296 cells. In 20,000 steps, each cell gets about 15 visits on average. A cell learns nothing from its neighbors, even when they describe almost the same situation.

**Function approximation** replaces the table with a formula, for example a neural network. The formula estimates the value of any situation, including ones it never saw. It uses fixed memory. What it learns in one situation carries over to similar situations.

In the game, a table scored 50 of 200 after 20,000 steps. A network with the stabilizers described below scored 143 of 200. Both are runs with 5 seeds.

### 2. Bootstrapping: learn before the episode ends

An **episode** is one attempt, from the start until the broom falls or time runs out. To learn the value of an action, you can wait for the episode to end and add up all the rewards. This is slow when episodes are long.

**Bootstrapping** shortens the wait. The target for an update is the next reward plus the learner's own current estimate of what follows. The learner uses its guess as a stand-in for the future. It learns after each step.

The cliff shows the benefit. In the game's cliff walking world, one reward plus a guess learned the best path (score −13). Waiting for the whole episode never learned it (score −200, 20 seeds). In CartPole the wait was cheap, because episodes are short: a table that waited scored 95.4 against 50.4 for a table that bootstrapped. So bootstrapping is not always better. It is a tool for long episodes.

### 3. Off-policy learning: learn about the best action while acting differently

A **policy** is a rule for choosing actions. The learner must try new actions to find good ones, so the policy that collects data is not the best policy. It acts at random some of the time, for example with probability ε (epsilon).

**Off-policy** learning separates two things. One is the policy that collects the data. The other is the policy that the value describes. Q-learning, a common method, always scores the next state with its best action, even when the robot took a random action there. This lets you explore, reuse old experience from a memory, and learn from data that another system collected.

Some methods also split a value network from a separate policy network. That is a different split, called actor-critic. This article is about the split between the data and the target.

The cliff shows the benefit again. Q-learning found the best path (score −13). Sarsa, the version that scores the action it really took, ended with a worse greedy score while ε was on: −82 ± 47 (20 seeds).

## Why the three fail together

Each technique has a real reason, so you use all three. Then you get this loop in the broom world:

1. The update moves the estimate for the current situation toward a target.
2. The target contains the estimate for the next situation.
3. The network shares weights, so raising one estimate also raises the estimate for the next situation. In CartPole, consecutive situations are almost the same.
4. The target is now higher. The next update raises the estimate again.

The learner chases a target that moves with it. Reward is at most 1 per step and the discount is γ = 0.99. So no policy can earn more than 1 / (1 − 0.99) = 100. Nothing in the loop knows that bound.

<details>
<summary>A two-state example of the loop, with numbers</summary>

[Sutton and Barto, section 11.2](http://incompleteideas.net/book/RLbook2020.pdf) give the smallest case. State 1 has estimated value $w$. State 2 has estimated value $2w$, because one parameter sets both. The only transition goes from state 1 to state 2, with reward 0. So the true values are 0.

The target for state 1 is $0 + \gamma \cdot 2w = 1.98w$. The update with step size $\alpha$ changes $w$ by the factor $1 + \alpha(2\gamma - 1)$. With $\gamma = 0.99$ and $\alpha = 0.1$ the factor is 1.098. A starting $w$ of 10 becomes 10.98, then about 25.5 after 10 updates and about 115,000 after 100. The estimate grows even though every true value is 0.

</details>

### What happens in the game

Level **Values explode** takes the network and keeps the other two techniques. It is the plain combination: a network, one-step bootstrapping, and Q-learning with random moves. I ran it with 5 seeds for 20,000 steps.

![Three charts from Breaking Bellman. Score per test episode stays near 10 of 200. The predicted value rises to the 10,000 chart ceiling while the value earned stays near 0. The largest absolute Q value rises past one million on a log scale.](/assets/robotics/the-deadly-triad/naive-charts.png "Level Values explode, naive network, 5 seeds (101 to 505), 20,000 steps. Top: the score stays near 9 of 200. Middle: the predicted value rises to the chart ceiling of 10,000 while the value earned stays near 0. Bottom: the largest estimate, on a log scale, reaches 5 million, the largest over the 5 seeds. Simulation.")

![The CartPole stage after training: the robot has fallen and the broom lies sideways. The caption reads: Fell after 0.2 s.](/assets/robotics/the-deadly-triad/naive-broom-falls.png "The same run, seed 1, greedy test: the broom falls after 0.2 seconds. Simulation.")

The estimates grew to millions, against a limit of 100, and they were still rising at the end of the run. The policy was poor: score 9 of 200.

The standard repair holds the target still. The next run keeps the network and bootstrapping but changes two things. **Replay** trains on random old moves from a memory. A **frozen copy** of the network, refreshed every 250 updates, makes the target. The target no longer moves with each update.

![Three charts from Breaking Bellman comparing two runs. The dashed run is the naive network. The solid run, with replay and a frozen copy, keeps the largest Q near 65 and reaches a score of about 150.](/assets/robotics/the-deadly-triad/naive-vs-dqn-charts.png "Level Values explode, 5 seeds, 20,000 steps. Dashed: the naive network. Solid: replay and a frozen copy (the method called DQN). The largest estimate stays near 65 and the score ends at 143 of 200. The score is noisy and falls after an early peak near 200. Simulation.")

![The game's comparison panel: the new run scores 143 of 200 with largest Q 65.4, against the pinned naive run at 9 of 200 and 5 million. The sentence differs in three words.](/assets/robotics/the-deadly-triad/naive-vs-dqn-words.png "The game lists the three words that changed: learn from random old moves, and choose and score the next action with a frozen copy. Simulation.")

## What the theory says, and what the game adds

[Sutton and Barto](http://incompleteideas.net/book/RLbook2020.pdf) name the three techniques the **deadly triad**. They write: "If any two elements of the deadly triad are present, but not all three, then instability can be avoided." That statement has a setting. [Tsitsiklis and Van Roy (1997)](https://www.mit.edu/~jnt/Papers/J063-97-bvr-td.pdf) prove that on-policy TD learning (bootstrapping) with a linear formula converges. The same paper gives an example where it fails with a nonlinear formula. So "any two are safe" does not carry over to neural networks.

The game agrees. I removed the off-policy leg: the same network, still bootstrapping, but scoring the action it really took (Sarsa). Its estimates also grew to millions.

![The sentence panel of Breaking Bellman: a network, the move just made, one real reward and the action really taken next. The result reads: Does not work yet, score 9 of 200, largest Q 2M.](/assets/robotics/the-deadly-triad/on-policy-network.png "Level Values explode with one word changed: the target uses the action really taken. 5 seeds, 20,000 steps: score 9 of 200, largest estimate 2 million. Simulation.")

The game's formula is a nonlinear network. I did not test a linear formula, so this does not contradict the proof for linear formulas.

In practice the triad is a matter of degree. [van Hasselt and colleagues (2018)](https://arxiv.org/abs/1812.02648) trained DQN variants on Atari over 336 settings, 3 replications each. They call an estimate **soft-diverged** when it leaves the range any policy can earn, here −100 to 100. One-step Q-learning soft-diverged in 94% of runs. Ten-step returns lowered that to 21%.

## Exploration and reversibility

Random exploration is the usual source of off-policy data, and it has a cost. In cliff walking, a fall costs 100 and sends the robot back to the start. In [Cliff Walking, Example 6.6](http://incompleteideas.net/book/RLbook2020.pdf), Q-learning finds the best path but "occasionally" falls off the cliff "because of the ε-greedy action selection".

![The cliff walking level of Breaking Bellman replaying training: tan squares mark visited cells, two red minus 100 marks show falls, and the robot tumbles into the canyon.](/assets/robotics/the-deadly-triad/cliff-falls.png "Level Falling while learning, Q-learning with ε = 0.1, 20 seeds, 10,000 steps. Replay of run 1: red marks show falls. The autopsy reports 0.32 falls per episode in the second half of training. Simulation.")

In my batch of the same runs, falls happened only with ε on. Q-learning fell 0.30 times per episode against 0.00 without ε. Sarsa fell 0.10 against 0.00. [Moldovan and Abbeel (2012)](https://arxiv.org/abs/1205.4810) note that exploration with guarantees assumes you can get from any state back to any other, and that most physical systems do not allow this. **Whether ε teaches recovery is not tested here.** CartPole was mixed: with ε, a table scored higher at the end (50.4 against 39.4) and DQN scored lower (143.0 against 166.5).

## How many real rewards in a target?

Bootstrapping is a dial. A target can use 1 real reward and then a guess, or 2, 4, 8, or all rewards to the end of the episode. All rewards is the Monte Carlo method. One reward is pure bootstrapping. The table lists the final score for each setting. Higher is better.

| Real rewards | Cliff, table (20 seeds) | CartPole, DQN (5 seeds) |
| --- | --- | --- |
| 1 | −13 | 143.0 |
| 2 | −21.9 | 169.2 |
| 4 | −87.7 | 199.3 |
| 8 | −131.9 | 189.5 |
| all | −200 | 193.9 |

The best setting depends on the world. On the cliff, 1 is best. On CartPole with DQN, 4 is best. With replay and a frozen copy, the largest estimate stayed below 150 at every setting (median per seed, 62 to 141). The Atari result above says more real rewards can lower the risk of runaway estimates. I did not test that in the game, because the stabilized runs did not run away.

**Does it help to use more real rewards early and fewer later?** This is not tested. Every game run uses one fixed number. The closest published work I found is [Meta-Gradient Reinforcement Learning](https://proceedings.neurips.cc/paper_files/paper/2018/file/2715518c875999308842e3455eda2fe3-Paper.pdf) (Xu, van Hasselt and Silver, NeurIPS 2018). It adapts the discount γ and the mixing weight λ online. It does not learn the number of rewards. The paper also cites a hand-made schedule: start with a short-sighted discount and raise it once learning works.

## What the game shows, and what it does not

- **Confirmed:** a network, one-step bootstrapping and Q-learning with random moves led to estimates of millions in a world with a limit of 100. Replay and a frozen copy together prevented it.
- **Confirmed:** a network with those stabilizers beat the table (143 against 50 of 200).
- **Contradicted:** "the off-policy leg is required for the blow-up". The on-policy network also blew up.
- **Contradicted:** "more real rewards are always better". The best number was 1 on the cliff and 4 on CartPole.
- **Not tested:** a linear formula, reversibility as the cause of the cost of ε, and a schedule over the number of rewards.
- **Limits:** 5 and 20 seeds, one game, one network design. Largest estimate means the largest value seen at any test point. It does not prove that growth never stops.

<details id="source-note">
<summary>Source note: settings, seeds and where the numbers come from</summary>

The screenshots are real captures of the game page, built at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73) and run in a browser on October 17, 2026. The page uses seeds 101, 202, and so on. Numbers in a caption are the page's own headline figures. The largest estimate there is the largest value over all seeds and test points.

Numbers outside a caption come from the game's own `RLA.run` code at the same commit, the code path the page trains with. Arms in a world share seeds. The run script and raw results are stored locally and are not published.

**CartPole runs.** Levels **Too many cells** and **Values explode**. 20,000 steps, seeds 101 to 505. ε falls from 1.0 to 0.05 over 5,000 steps. The network has two hidden layers of 32 units and Adam at 0.001. DQN adds a memory of 10,000 moves and a frozen copy refreshed every 250 updates. In the script batch, the median of the per-seed largest estimate was 4.1 million for the naive network and 61.7 for DQN. The page shows 5 million and 65.4, which are maxima over seeds and points, so the figures differ by design.

**Cliff runs.** A 4 by 12 grid. A fall costs −100 and returns to the start. 10,000 steps, 20 seeds, ε = 0.1, table learning rate 0.5. The page shows 0.32 falls per episode for Q-learning in the second half of training. My batch measured 0.30. I did not resolve that gap.

**Scores.** The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of the test points. The ± value is the standard deviation across seeds.

**Not shown.** The runs measure no linear approximation, no recovery behavior and no schedule over the number of rewards.

</details>
