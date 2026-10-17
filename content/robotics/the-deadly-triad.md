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

Each technique changes one part of the learning rule. Read the rule first. Every later section points back to it.

### The update rule, with every symbol

A value-learning method keeps an estimate $Q(s,a)$: the total reward to expect if you take action $a$ in situation $s$ and then act well. These symbols appear in the rule:

- $s$ is the current situation, $a$ is the action taken, $r$ is the reward received, and $s'$ is the next situation.
- $\gamma$ (gamma) is the discount. A reward $k$ steps later counts $\gamma^k$ times. The game uses $\gamma = 0.99$.
- $\alpha$ (alpha) is the step size. It sets how far one update moves the estimate.
- $\theta$ (theta) holds the weights of the network: the numbers it learns. $Q_\theta(s,a)$ is the estimate that the network gives.
- $y$ is the target: the number that the estimate should move toward.

The learner repeats one update. It moves the estimate toward the target:

$$\theta \leftarrow \theta + \alpha\,\bigl(y - Q_\theta(s,a)\bigr)\,\nabla_\theta Q_\theta(s,a)$$

The bracket is the **TD error** (temporal-difference error): target minus current estimate. The symbol $\nabla_\theta Q_\theta(s,a)$ is the gradient: how much the estimate changes when each weight changes. The rule is called a **semi-gradient** update because it treats $y$ as a fixed number, although $y$ can also depend on $\theta$.

The three techniques differ in how they build $y$. One-step Q-learning, the method in the game's naive network, uses this target:

$$y = r + \gamma \max_{a'} Q_{\bar\theta}(s', a')$$

Here $a'$ is any action in the next situation $s'$. The weights $\bar\theta$ are the weights that make the target. In the naive learner, $\bar\theta = \theta$. In DQN, $\bar\theta$ is a frozen copy of $\theta$. Waiting for the whole episode gives the **Monte Carlo** target instead. Here $t$ is the step number inside the episode, $r_t$ is the reward received at step $t$ (so $r = r_t$ in the one-step target), and $T$ is the last step of the episode. The target adds the real rewards from step $t$ to step $T$:

$$y = r_t + \gamma r_{t+1} + \dots + \gamma^{T-t} r_T$$

The next table shows where each technique enters the rule.

| Technique | Where it enters | In the symbols |
| --- | --- | --- |
| Function approximation | One set of weights $\theta$ gives the estimate for all situations. An update for $(s,a)$ also changes the estimate for $s'$. | $\nabla_\theta Q_\theta(s,a)$ is not zero for other situations |
| Bootstrapping | The target holds an estimate in place of the rewards that follow. | $\gamma \max_{a'} Q_{\bar\theta}(s', a')$ |
| Off-policy learning | The target uses the best next action, not the action taken. The data can come from random or old moves. | $\max_{a'}$, and where $(s,a,r,s')$ comes from |

A **table** has one entry for each $(s,a)$. Its update changes only that entry, so the rule becomes $Q(s,a) \leftarrow Q(s,a) + \alpha\,(y - Q(s,a))$. No other estimate moves. This is why a table cannot start the loop that the next sections describe.

### 1. Function approximation: replace the table

The simplest value learner keeps a table. This works on a small grid. It fails when the sensors are real numbers.

You can cut each broom sensor into 6 bins. That gives 6 × 6 × 6 × 6 = 1,296 cells. In 20,000 steps, each cell gets about 15 visits on average. A cell learns nothing from its neighbors, even when they describe almost the same situation.

**Function approximation** replaces the table with a formula, for example a neural network. The formula estimates the value of any situation, including ones it never saw. It uses fixed memory. What it learns in one situation carries over to similar situations.

In the game, a table scored 50 of 200 after 20,000 steps. A network with the stabilizers described below scored 143 of 200. Both are runs with 5 seeds.

### 2. Bootstrapping: use the estimate in place of the rest of the rewards

An **episode** is one attempt, from the start until the broom falls or time runs out. **Bootstrapping** builds the target from one real reward plus the learner's own estimate of what follows. People say that it "trains faster". That sentence has two different meanings. This article names the meaning for each claim.

**Meaning A: learning can start before the episode ends.** The Monte Carlo target needs every reward to the last step. So the learner cannot update until the episode ends. A bootstrapped target needs one reward and an estimate. So the learner updates at every step. This claim is about *when* learning starts. It does not say how many samples the learner needs.

<div class="tri-anim" data-anim="timing"><p class="tri-fallback">Chart, measured. In the cliff world, with a table and seed 101, the one-reward learner had used 177 training rows before its first episode ended. The all-rewards learner had used 0, then used 200 at once. After 400 steps, both had used 400 rows. This chart needs JavaScript.</p></div>

**Meaning B: fewer samples to reach a score.** This claim is about **sample efficiency**: how many environment steps a learner needs to reach a given score. It has two parts that the game does not separate. One part is how many *samples* the learner collects. The other is how many *updates* it makes. The game makes one update for each step, so it cannot show what happens with more updates on the same data. Theory adds a third claim: bootstrapped targets have lower variance, but they add bias. The game does not measure variance.

| Claim | Meaning | Status |
| --- | --- | --- |
| The learner can update before the episode ends. | A: when learning starts | Confirmed in the timing run above. |
| Bootstrapping reaches a score in fewer environment steps. | B: samples | Mixed. See the measured steps below. |
| Bootstrapped targets have lower variance and add bias. | B: variance | Theory only. Not measured here. |
| Bootstrapping needs fewer updates on the same fixed data. | B: updates | Not tested. The game makes one update for each step. |

The measured steps use the first test point with a score above a threshold, median over seeds. Cliff walking, table, threshold −20, 20 seeds: 1 real reward needed 2,750 steps, 2 needed 1,750, 4 needed 1,750, 8 needed 3,625, and all rewards never reached it in 10,000 steps. CartPole, DQN, threshold 150, 5 seeds: 1 real reward needed 2,500 steps, and 2, 4, 8 and all rewards each needed 1,500. So "bootstrapping needs fewer samples" is not a rule. In CartPole, the pure one-step target was the slowest. On the cliff, a target with 2 or 4 real rewards was faster than one with 1. The [dial section](#how-many-real-rewards-in-a-target) shows the full curves.

**Fixed-budget scores (measured performance, meaning B).** These scores compare performance after a fixed number of steps. They are not evidence about when updates start, and the game does not show why the results differ. On the cliff after 10,000 steps (20 seeds), a table with one real reward plus a guess scored −13, and a table that waited for the whole episode scored −200. In CartPole after 20,000 steps (5 seeds), a table that waited scored 95.4 against 50.4 for a table that bootstrapped. So bootstrapping did not always give the higher score.

### 3. Off-policy learning: learn about the best action while acting differently

A **policy** is a rule for choosing actions. The learner must try new actions to find good ones, so the policy that collects data is not the best policy. It acts at random some of the time, for example with probability ε (epsilon).

**Off-policy** learning separates two things. One is the policy that collects the data. The other is the policy that the value describes. Q-learning, a common method, always scores the next state with its best action, $\max_{a'}$, even when the robot took a random action there. Sarsa replaces $\max_{a'} Q(s',a')$ with $Q(s',a')$ for the action $a'$ that the robot really took. This lets you explore, reuse old experience from a memory, and learn from data that another system collected.

Some methods also split a value network from a separate policy network. That is a different split, called actor-critic. This article is about the split between the data and the target.

The cliff shows the benefit again. Q-learning found the best path (score −13). Sarsa, the version that scores the action it really took, ended with a worse greedy score while ε was on: −82 ± 47 (20 seeds).

## Why the three fail together

Each technique has a real reason, so you use all three. Then you get this loop in the broom world:

1. The update moves the estimate for the current situation toward the target $y$.
2. The target contains the estimate for the next situation, $Q_{\bar\theta}(s', a')$.
3. The network shares weights, so raising one estimate also raises the estimate for the next situation. In CartPole, consecutive situations are almost the same.
4. The target is now higher. The next update raises the estimate again.

The learner chases a target that moves with it. Reward is at most 1 per step and the discount is $\gamma = 0.99$. So no policy can earn more than $1 / (1 - 0.99) = 100$. Nothing in the loop knows that bound.

### The smallest case, in numbers

[Sutton and Barto, section 11.2](http://incompleteideas.net/book/RLbook2020.pdf) give the smallest case. It has two states. State 1 has estimated value $w$. State 2 has estimated value $2w$, because one weight sets both. The only transition goes from state 1 to state 2, with reward 0. So the true value of both states is 0. The learner replays this transition and updates only state 1, as off-policy data does.

The target for state 1 is $y = 0 + \gamma \cdot 2w$. The gradient of the estimate $w$ with respect to $w$ is 1. So the update is:

$$w \leftarrow w + \alpha\,(2\gamma w - w) = \bigl(1 + \alpha(2\gamma - 1)\bigr)\,w$$

With $\gamma = 0.99$ and $\alpha = 0.1$ the factor is 1.098. A starting $w$ of 10 becomes 10.98, then about 25.5 after 10 updates and about 115,000 after 100. The estimate grows even though every true value is 0. Run it below. Switch the rule and see which leg you remove.

<div class="tri-anim" data-anim="two-state"><p class="tri-fallback">Conceptual example, not game data. With one shared weight and off-policy updates, the value of state 1 starts at 10 and grows by a factor of 1.098 at every update, to about 115,000 after 100 updates. The true value is 0. This animation needs JavaScript.</p></div>

### What happens in the game

Level **Values explode** takes the network and keeps the other two techniques. It is the plain combination: a network, one-step bootstrapping, and Q-learning with random moves. I ran it with 5 seeds for 20,000 steps, then ran DQN on the same seeds. DQN keeps the network and bootstrapping but changes two things. **Replay** trains on random old moves from a memory. A **frozen copy** of the network, refreshed every 250 updates, makes the target ($\bar\theta$ in the rule). The target no longer moves with each update.

The next animation replays the logged values of both runs. The score is the greedy test score of 200. The loss is the mean squared TD error of the latest training batch.

<div class="tri-anim" data-anim="run"><p class="tri-fallback">Measured game runs, 5 seeds, 20,000 steps. The naive network ends with a score of about 9 of 200 and a largest estimate of millions. DQN ends with a score of 143 of 200 and a largest estimate near 65. This animation needs JavaScript.</p></div>

The naive estimates grew to millions, against a limit of 100, and they were still rising at the end of the run. The policy was poor: score 9 of 200. I call this a blow-up: the estimate left the range any policy can earn, and it kept growing until the run ended. The game logs do not show whether it grows forever.

The next animation replays a recorded greedy test episode of each kind of run. The naive network drops the broom after 9 steps. Choose a DQN run to see a long balance. The DQN score is noisy: one run held the broom for the whole test, another run ended after 118 steps when the cart reached the rail end.

<div class="tri-anim" data-anim="episode"><p class="tri-fallback">Measured test episodes of the game. The naive network lets the broom fall after 9 steps (0.18 s). A DQN run balances for 600 steps. This animation needs JavaScript.</p></div>

![The game's comparison panel: the new run scores 143 of 200 with largest Q 65.4, against the pinned naive run at 9 of 200 and 5 million. The sentence differs in three words.](/assets/robotics/the-deadly-triad/naive-vs-dqn-words.png "The game lists the three words that changed: learn from random old moves, and choose and score the next action with a frozen copy. Simulation.")

<details>
<summary>Screenshots of the same runs on the game page</summary>

![Three charts from Breaking Bellman. Score per test episode stays near 10 of 200. The predicted value rises to the 10,000 chart ceiling while the value earned stays near 0. The largest absolute Q value rises past one million on a log scale.](/assets/robotics/the-deadly-triad/naive-charts.png "Level Values explode, naive network, 5 seeds (101 to 505), 20,000 steps. Top: the score stays near 9 of 200. Middle: the predicted value rises to the chart ceiling of 10,000 while the value earned stays near 0. Bottom: the largest estimate, on a log scale, reaches 5 million, the largest over the 5 seeds. Simulation.")

![The CartPole stage after training: the robot has fallen and the broom lies sideways. The caption reads: Fell after 0.2 s.](/assets/robotics/the-deadly-triad/naive-broom-falls.png "The same run, seed 1, greedy test: the broom falls after 0.2 seconds. Simulation.")

![Three charts from Breaking Bellman comparing two runs. The dashed run is the naive network. The solid run, with replay and a frozen copy, keeps the largest Q near 65 and reaches a score of about 150.](/assets/robotics/the-deadly-triad/naive-vs-dqn-charts.png "Level Values explode, 5 seeds, 20,000 steps. Dashed: the naive network. Solid: replay and a frozen copy (the method called DQN). The largest estimate stays near 65 and the score ends at 143 of 200. The score is noisy and falls after an early peak near 200. Simulation.")

</details>

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

Bootstrapping is a dial. In the target $y$, the number $n$ is how many real rewards come before the estimate. As before, $t$ is the step number and $r_{t+k}$ is the reward received $k$ steps after step $t$. The symbol $s_{t+n}$ is the situation that the learner reaches $n$ steps after step $t$, where the estimate takes over:

$$y = r_t + \gamma r_{t+1} + \dots + \gamma^{n-1} r_{t+n-1} + \gamma^{n}\,\max_{a'} Q_{\bar\theta}(s_{t+n}, a')$$

A target can use $n = 1$, 2, 4 or 8 real rewards and then a guess, or all rewards to the end of the episode. All rewards is the Monte Carlo method. One reward is pure bootstrapping. The animation draws the mean test score against environment steps (meaning B above), and lists the steps that each setting needed to pass a threshold.

<div class="tri-anim" data-anim="dial"><p class="tri-fallback">Measured game runs. Cliff, table, 20 seeds: the first test point at or above −20 came at a median of 2,750 steps for 1 real reward, 1,750 for 2, 1,750 for 4, 3,625 for 8, and never for all rewards. CartPole, DQN, 5 seeds, threshold 150: 2,500 steps for 1 real reward, and 1,500 for each other setting. This animation needs JavaScript.</p></div>

The table lists the final score for each setting. Higher is better.

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
- **Confirmed (meaning A):** bootstrapping lets learning start before the episode ends. In the timing run, the one-reward learner used 177 rows before the first episode ended. The all-rewards learner used 0.
- **Mixed (meaning B, samples):** bootstrapping did not always need fewer steps. A target with 2 or 4 real rewards beat 1 on the cliff, and 1 was the slowest on CartPole.
- **Contradicted:** "the off-policy leg is required for the blow-up". The on-policy network also blew up.
- **Contradicted:** "more real rewards are always better". The best number was 1 on the cliff and 4 on CartPole.
- **Not tested:** a linear formula, reversibility as the cause of the cost of ε, a schedule over the number of rewards, the variance of the targets, and the number of updates needed on fixed data.
- **Limits:** 5 and 20 seeds, one game, one network design. Largest estimate means the largest value at a test point. It does not prove that growth never stops. The two-state animation is a conceptual computation, not game data.

<details id="source-note">
<summary>Source note: settings, seeds and where the numbers come from</summary>

The screenshots are real captures of the game page, built at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73) and run in a browser on October 17, 2026. The page uses seeds 101, 202, and so on. Numbers in a caption are the page's own headline figures. The largest estimate there is the largest value over all seeds and test points.

Numbers outside a caption come from the game's own `RLA.run` code at the same commit, the code path the page trains with. Arms in a world share seeds. The run script and raw results are stored locally and are not published.

**CartPole runs.** Levels **Too many cells** and **Values explode**. 20,000 steps, seeds 101 to 505. ε falls from 1.0 to 0.05 over 5,000 steps. The network has two hidden layers of 32 units and Adam at 0.001. DQN adds a memory of 10,000 moves and a frozen copy refreshed every 250 updates. In the script batch, the median of the per-seed largest estimate was 4.1 million for the naive network and 61.7 for DQN. The page shows 5 million and 65.4, which are maxima over seeds and points, so the figures differ by design.

**Cliff runs.** A 4 by 12 grid. A fall costs −100 and returns to the start. 10,000 steps, 20 seeds, ε = 0.1, table learning rate 0.5. The page shows 0.32 falls per episode for Q-learning in the second half of training. My batch measured 0.30. I did not resolve that gap.

**Scores.** The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of the test points. The ± value is the standard deviation across seeds.

**Animations.** The two-state animation is computed in your browser from the rules in the text. It is conceptual. The other animations replay measured data stored in `triad-data.js`, built from the same raw results: loss, score and largest estimate at the logged points (every 500 steps), the median over 5 seeds, and recorded greedy test episodes (seeds 101 and 202 for the network, seed 303 for the table). Episodes play at 0.02 s per step, slowed when they are short.

**Timing run.** The cliff world, a table, seed 101 and the first 400 steps, run with the game's `RLA.session` code. I counted the training rows that the learner used, not the update calls, because one call can use many rows. The one-reward learner finished episode 1 at step 178 and episode 2 at step 378. The all-rewards learner finished at steps 200 and 400.

**Steps to the threshold.** The first test point with a mean score at or above the threshold (−20 on the cliff, 150 on CartPole), per seed. The animation shows the median over the seeds that reached it. Test points come every 250 steps on the cliff and every 500 steps on CartPole. The game makes one update for each environment step, so the steps and the updates are the same here.

**Not shown.** The runs measure no linear approximation, no recovery behavior, no schedule over the number of rewards, no variance of the targets and no updates on fixed data.

</details>

<script src="/assets/robotics/the-deadly-triad/triad-data.js" defer></script>
<script src="/assets/robotics/the-deadly-triad/triad-animations.js" defer></script>
