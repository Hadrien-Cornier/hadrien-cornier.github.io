---
title: 'The deadly triad: three useful ideas that fail together'
description: 'Function approximation, bootstrapping and off-policy learning each fix a real problem in reinforcement learning. Combined, they can make value estimates grow far beyond any possible reward.'
date: '2026-10-17'
draft: true
layout: essay
---

A small robot learned to balance a broom, using three standard ideas from reinforcement learning. Each idea is sensible. Put together, they produced this.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-naive-101" controls muted loop playsinline preload="none" src="/assets/robotics/the-deadly-triad/clips/cart-naive-101-desktop.mp4"></video><figcaption><b>All three ideas together: the broom falls almost at once</b>The robot after a full round of training. The real fall takes less than a fifth of a second, so the clip plays at quarter speed.</figcaption></figure>
</div>

The robot rides a cart on a rail. It pushes the cart left or right, and it earns a point for every moment the broom stays up. That failure is the subject of this article. The three ideas are called function approximation, bootstrapping and off-policy learning, and together they are known as the **deadly triad**. Each one solves a problem that the one before it left open, so the easiest way to understand them is to meet the problems in order.

The pictures come from [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), a small game I made in which real learning code runs in your browser and fails in front of you. Every level of the game is a designed counterexample: a tiny world built to break one method and so to show why the next method exists. Before I use a level, I say what the robot must do there and what the level was built to show.

## The first problem: a learner that stops trying

Start with the simplest world there is. A robot faces ten slot machines. Each pays a random amount around its own hidden average, and the robot has a thousand pulls to find the best machine. Nothing else happens in this world: no position, no future, only the question of which lever to pull.

![The slot machine level of Breaking Bellman: ten machines and a small robot that asks which one pays best.](/assets/robotics/the-deadly-triad/problem-slots.png "The first level of Breaking Bellman: ten slot machines. Each machine pays a hidden average plus noise. Simulation.")

The robot keeps an estimate of each machine's average payout and always pulls the machine with the best estimate. After each pull it nudges that machine's estimate toward the payout it just saw:

$$Q(a) \leftarrow Q(a) + \alpha\,\bigl(r - Q(a)\bigr)$$

Here $Q(a)$ is the estimate for machine $a$, $r$ is the payout just received, and $\alpha$ (alpha) is a small step size that sets how far one payout moves the estimate. In words: move the estimate a little toward what just happened.

This learner is easy to fool. The first machine that pays better than the starting guess becomes its favorite, and because only the pulled machine gets updated, nothing ever tells the robot that another machine would have paid more. In the game, the robot ends up on the best machine in only about one run out of three.

The remedy is to explore. One pull in ten, the robot picks a machine at random, whatever its estimates say. Keep this remedy in mind, because it has a price. The robot now acts differently from how it believes it should act. That gap comes back as the third idea.

## The second problem: rewards that arrive late

Slot machines pay at once. Most tasks do not. The second level puts the robot at the left end of a grid and the goal at the right end, with a cliff along the bottom row between them. Every step costs one point. A step off the edge costs a hundred and sends the robot back to the start. The level differs from the casino in one respect on purpose: the consequence of a move may show up many moves later, so the robot has to work out which of its steps deserve the credit.

The obvious strategy is to wait. The robot finishes a walk, adds up every reward it received afterward, and credits that total to each step along the way:

$$y = r_t + \gamma r_{t+1} + \dots + \gamma^{T-t} r_T$$

Here $t$ is the current step, $T$ is the last step of the walk, $r_t$ is the reward at step $t$, and $\gamma$ (gamma) is a discount just below 1, which makes near rewards count a little more than far ones. The number $y$ is the **target**: the value that the estimate should move toward. In words: the value of a step is everything that actually came after it.

This target is honest, and on the cliff it is almost useless. A robot that wanders at random almost never reaches a goal eleven squares away before time runs out. Every walk ends with the same bad total, and that total says nothing about which steps were the bad ones. In the game, the waiting learner never found a path to the goal.

The fix is **bootstrapping**: stop waiting for the future and guess it. After a single step, the robot takes the one reward it actually saw and adds its own current estimate of what comes next:

$$y = r + \gamma \max_{a'} Q(s', a')$$

Then it moves its estimate toward that target:

$$Q(s,a) \leftarrow Q(s,a) + \alpha\,\bigl(y - Q(s,a)\bigr)$$

Here $s$ is the situation the robot was in, $a$ is the move it made, $s'$ is the situation it reached, and $\max_{a'}$ picks the best next move $a'$ according to the robot's current estimates. The bracket $y - Q(s,a)$ is the surprise: how far the target is from the estimate. In words: the value of a move is the reward it brings plus the value of the best place it leads to. Now the robot learns from every step, and the news of the goal travels backward one square at a time. In the game, this learner found the shortest path along the edge in every run.

People often say that bootstrapping "trains faster", and that sentence hides two different claims. The first is about timing: learning can begin before the walk is over. That is clearly true, and the game measured it. By the end of its first walk, the guessing learner had already learned from about 180 steps, and the waiting learner had learned from none. The second claim is about efficiency: that guessing reaches a given score in fewer steps. The game does not support that as a rule. Sometimes a mix of a few real rewards followed by a guess did best, and in one world the pure one-step guess was the slowest of all. Textbooks add that guessed targets vary less but carry a bias, because they trust an estimate that may be wrong. I did not measure variance, and I did not test how many updates a method needs on a fixed pile of data.

Bootstrapping has a price, and the name says what it is. The target now contains the robot's own estimate, so the robot is learning from itself. If the estimate is wrong, the target is wrong too.

<details>
<summary>Exact numbers for waiting and guessing, and the dial between them</summary>

**Timing.** The world was the cliff, with a table, one seed, and the first 400 steps. The learner that used one real reward and then a guess used 177 training rows before its first walk ended, at step 178. The learner that waited for all rewards used none, then used 200 at once when its first walk ended at step 200. After 400 steps both had used 400.

**Scores after a fixed budget (performance, not timing).** On the cliff after 10,000 steps (20 seeds), a table with one real reward and a guess scored −13, the best possible, and a table that waited scored −200. In CartPole after 20,000 steps (5 seeds), a table that waited scored 95.4 of 200 against 50.4 for a table that guessed. So guessing did not always give the higher score. These numbers compare performance after the same budget. They say nothing about when updates can start.

**The dial.** The target can use a few real rewards before the guess. With $n$ real rewards, where $t$ is the step number, $r_{t+k}$ is the reward received $k$ steps after step $t$, and $s_{t+n}$ is the situation reached $n$ steps after step $t$:

$$y = r_t + \gamma r_{t+1} + \dots + \gamma^{n-1} r_{t+n-1} + \gamma^{n}\,\max_{a'} Q(s_{t+n}, a')$$

One real reward is pure bootstrapping. All rewards to the end of the walk is waiting. The next table lists the median number of environment steps that each setting needed to first pass a score threshold. The game makes one update per step, so steps and updates are the same here.

| Real rewards | Cliff, table, threshold −20 (20 seeds) | CartPole, network with replay and a frozen copy, threshold 150 (5 seeds) |
| --- | --- | --- |
| 1 | 2,750 | 2,500 |
| 2 | 1,750 | 1,500 |
| 4 | 1,750 | 1,500 |
| 8 | 3,625 | 1,500 |
| all | never in 10,000 | 1,500 |

The final scores differ by setting too. Cliff, table: −13, −21.9, −87.7, −131.9 and −200 for 1, 2, 4, 8 and all rewards. CartPole, network: 143.0, 169.2, 199.3, 189.5 and 193.9. The best number of real rewards depends on the world.

Does it help to trust many real rewards early and fewer later? The game did not test this, because every run uses one fixed number. The closest published work I found is [Meta-Gradient Reinforcement Learning](https://proceedings.neurips.cc/paper_files/paper/2018/file/2715518c875999308842e3455eda2fe3-Paper.pdf) (Xu, van Hasselt and Silver, NeurIPS 2018). It adapts the discount and a mixing weight online, and it does not learn the number of rewards.

</details>

## The third problem: learning while you can fall

The cliff robot found its path, but notice how it learned. It kept exploring, taking a random move one time in ten, and a random move at the edge can be the one that goes over. The third level, "Falling while learning", exists to make this cost visible. On a real arm, every fall during learning is a real crash.

The level also exposes something about the target above. The $\max$ in it says: assume that the best next move will be taken. The robot does not take it a tenth of the time. So Q-learning learns the value of a robot that never slips, while the real robot slips. To a robot that never slips, the edge is a perfectly safe shortcut. It hugs the edge and falls.

Learning about one way of behaving while acting in another is **off-policy** learning. A **policy** is just a rule for choosing moves, and here the policy that gathers the data (with random moves) differs from the policy that the values describe (always the best move). The benefit is real: an off-policy learner can explore freely, reuse old experience from a memory, and learn from data that someone else collected. The cost is this mismatch between what the robot assumes and what it does.

The alternative is to score the move the robot really makes next, $a'$, in place of the best one:

$$y = r + \gamma\,Q(s', a')$$

This method is called Sarsa. In words: the value of a move is its reward plus the value of what the robot will actually do next, random slips included. Now the edge squares look dangerous, because some of their targets contain a fall, and a path along the top of the grid looks better. Each clip below replays three walks from one finished run: the first walk of training, the last walk of training, and a final test with no random moves.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-q-202" controls muted loop playsinline preload="none" src="/assets/robotics/the-deadly-triad/clips/cliff-q-202-desktop.mp4"></video><figcaption><b>Q-learning: it falls while learning, then walks the edge</b>It falls many times in its first walk, and it still falls now and then late in training. The test walk takes the shortest path along the edge.</figcaption></figure>
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-sarsa-101" controls muted loop playsinline preload="none" src="/assets/robotics/the-deadly-triad/clips/cliff-sarsa-101-desktop.mp4"></video><figcaption><b>Sarsa: it falls early, then keeps away from the edge</b>It also falls often in its first walk. By the end of training it rarely falls, and its test walk takes a longer route across the top.</figcaption></figure>
</div>

Late in training, the Q-learning robot fell about once every three walks, and the Sarsa robot about once every sixteen. Sarsa pays for its safety. Its finished policy was less reliable: in about two of five runs, the robot stopped making progress and stayed on the grid until time ran out.

These falls come from exploring, and not from the numbers going wrong. Without random moves, the same learners did not fall late in training, and their value tables stayed in the range that one fall plus a few steps would explain. The cliff is a lesson about the cost of off-policy exploration. It is not the blow-up that the triad produces, which needs one more ingredient.

<details>
<summary>Exact numbers and settings for the cliff clips</summary>

Both runs use a table, random moves with probability 0.1, and 10,000 training steps. Falls cost 100. The clips show one run of each method: Q-learning seed 202 and Sarsa seed 101. I chose the first and the last of the ten training walks that the game stores for each run.

| | Q-learning, seed 202 | Sarsa, seed 101 |
| --- | --- | --- |
| First walk | 185 steps, 7 falls, return −878 | 200 steps (the limit), 9 falls, return −1,091 |
| Last walk | walk 485, 20 steps, 1 fall, return −119 | walk 355, 25 steps, no fall, return −25 |
| Final test | 13 steps, no falls, return −13 | 17 steps, no falls, return −17 |

The next table covers all 20 seeds. Falls are counted per walk in the second half of training steps.

| Measure | Q-learning, random moves | Q-learning, no random moves | Sarsa, random moves |
| --- | --- | --- | --- |
| Falls per walk, second half | 0.318 | 0.000 | 0.061 |
| Lowest and highest table value | −112.1 and 0.0 | −52.1 and 0.0 | −153.2 and 0.0 |
| Final tests that reach the goal | 20 of 20, in 13 steps | 20 of 20, in 13 steps | 12 of 20, in 17 or 19 steps |

In the 8 Sarsa tests that did not reach the goal, the robot did not fall. It stayed within 1 to 14 cells until the 200-step limit. I did not examine why. Without random moves, falls over the whole run were rare but not zero (0.017 per walk), because early guesses can also send the robot off the edge.

Whether random moves teach the robot to recover was not tested here. [Moldovan and Abbeel (2012)](https://arxiv.org/abs/1205.4810) note that exploration with guarantees assumes you can get from any state back to any other, which most physical systems do not allow. On the cliff a fall costs 100 and returns the robot to the start. A real fall could break the robot.

</details>

## The fourth problem: too many situations

So far every situation fits in a table, with one entry per square. The cliff has only 48 of them. The fourth level, "Too many cells", changes the world to break the table. It brings back the robot on the rail from the start of this article.

![The CartPole level of Breaking Bellman: a small robot on a rail holds a broom upright on a stage. The caption reads: Press Run, the robot learns to balance a broom.](/assets/robotics/the-deadly-triad/problem-cartpole.png "CartPole in Breaking Bellman, before training. The robot senses four numbers: cart position, cart speed, broom angle and broom speed. Simulation.")

The robot senses four numbers, namely the cart's position and speed and the broom's angle and speed, and each number can take any value in a range. A table must cut each sensor into bins. With six bins per sensor there are $6^4 = 1{,}296$ cells, and every cell learns on its own. What the robot learns in one cell tells it nothing about the next cell, even though the two describe almost the same moment. After 20,000 steps, the table scored about 50 out of 200, where 200 means that the broom stayed up for the whole test.

The fix is **function approximation**: replace the table with a formula, here a small neural network with weights $\theta$ (theta), that returns an estimate for any situation. Because the weights are shared, what it learns in one situation carries over to similar ones. The update now moves the weights instead of one table entry:

$$\theta \leftarrow \theta + \alpha\,\bigl(y - Q_\theta(s,a)\bigr)\,\nabla_\theta Q_\theta(s,a)$$

Here $Q_\theta(s,a)$ is the network's estimate, $y$ is the same target as before, and $\nabla_\theta Q_\theta(s,a)$ (the gradient) says how much the estimate changes when each weight changes. In words: change every weight a little, in the direction that moves the estimate toward the target. This rule treats the target as a fixed number even though the target can also depend on $\theta$, which is why it is called a semi-gradient update. A table is the special case where each weight belongs to one cell.

The price is the mirror image of the gift. Because the weights are shared, one update moves the estimates for many situations at once, including the situation that the next target is built from.

## All three together

Now combine everything. Use a network for the estimates, a bootstrapped target for late rewards, and Q-learning's best-move target while taking random moves. This is the fifth level, "Values explode", and it is the robot from the top of the page. It scored about 9 out of 200, and its largest value estimate grew into the millions. The best value any robot could ever earn here is 100: one point per step, discounted by 0.99, adds up to at most $1/(1-0.99) = 100$.

Follow a single update to see why. The network raises its estimate for the current situation toward a target. That target contains its estimate for the next situation. In CartPole the next situation is almost the same as the current one, and the weights are shared, so raising the first estimate also raises the second. The next target is therefore higher, the next update raises the estimate again, and so on. The learner chases a target that rises as it moves. Nothing in the loop knows about the limit of 100.

The smallest case that shows this loop comes from [Sutton and Barto, section 11.2](http://incompleteideas.net/book/RLbook2020.pdf). Two situations share one weight $w$. The first has estimated value $w$ and the second has estimated value $2w$. The only transition goes from the first to the second, with reward 0, so the true value of both is 0. The learner replays this transition and updates only the first. Its target is $y = 0 + \gamma \cdot 2w$, and the gradient of the estimate with respect to $w$ is 1, so the update is:

$$w \leftarrow w + \alpha\,(2\gamma w - w) = \bigl(1 + \alpha(2\gamma - 1)\bigr)\,w$$

In words: each update multiplies $w$ by a number larger than 1, so the estimate of something worth nothing grows without end. With $\gamma = 0.99$ and $\alpha = 0.1$, the factor is 1.098. Starting from $w = 10$, the estimate is about 25 after 10 updates and over 100,000 after 100.

Two changes break the loop, and together they form the method called DQN. **Replay** trains on random old moves from a memory, so that consecutive updates stop pushing the same neighborhood of situations. A **frozen copy** of the network builds the targets, and the game refreshes the copy only now and then, so that the target holds still while the estimate approaches it.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-dqn-101" controls muted loop playsinline preload="none" src="/assets/robotics/the-deadly-triad/clips/cart-dqn-101-desktop.mp4"></video><figcaption><b>The same network with replay and a frozen copy: it balances, then runs out of rail</b>A typical test. The broom stays up for a couple of seconds, until the cart reaches the end of the rail and the test ends.</figcaption></figure>
</div>

With these changes the largest estimate stayed near 65, well under the limit, and the score rose from about 9 to about 143 out of 200. That also beat the table (about 50). The result is a real improvement and not a solution. Most of the stabilized robot's tests still ended because the cart ran off the end of the rail, and only one of five runs held the broom for the whole test.

<details>
<summary>Exact numbers for the CartPole runs, and a full-length balance</summary>

Runs use 20,000 steps and seeds 101 to 505 (5 seeds). Random moves fall from 1.0 to 0.05 over the first 5,000 steps. The network has two hidden layers of 32 units and uses Adam at 0.001. DQN adds a memory of 10,000 moves and a frozen copy refreshed every 250 updates. The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of the test points.

The top clip is the naive network with seed 101, played at quarter speed. Its test lasted 9 steps (0.18 s). In all 5 seeds the broom fell after 8 to 10 steps. The DQN clip above is seed 101, 118 steps (2.4 s) in real time. The five DQN tests lasted 118, 600, 99, 104 and 272 steps. Four of them ended at the end of the rail, and the scores were 118, 200, 99, 104 and 200. The clip below is seed 202, the only run that held the broom for all 600 steps (12 s), in real time. I chose it to show what a full balance looks like. It is not a typical result.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-dqn-202" controls muted loop playsinline preload="none" src="/assets/robotics/the-deadly-triad/clips/cart-dqn-202-desktop.mp4"></video><figcaption><b>The only full-length balance among five runs</b>The same method as the previous clip, in another run. The broom stays up for the whole test.</figcaption></figure>
</div>

The median over seeds of each run's largest estimate was 4.1 million for the naive network and 61.7 for DQN. The game page shows 5 million and 65.4, which are maxima over seeds and test points, so the figures differ by design. Largest estimate means the largest value at a test point, and it does not prove that growth never stops.

![Three charts from Breaking Bellman. Score per test episode stays near 10 of 200. The predicted value rises to the 10,000 chart ceiling while the value earned stays near 0. The largest absolute Q value rises past one million on a log scale.](/assets/robotics/the-deadly-triad/naive-charts.png "Level Values explode, naive network, 5 seeds (101 to 505), 20,000 steps. Top: the score stays near 9 of 200. Middle: the predicted value rises to the chart ceiling of 10,000 while the value earned stays near 0. Bottom: the largest estimate, on a log scale, reaches 5 million. Simulation.")

![Three charts from Breaking Bellman comparing two runs. The dashed run is the naive network. The solid run, with replay and a frozen copy, keeps the largest Q near 65 and reaches a score of about 150.](/assets/robotics/the-deadly-triad/naive-vs-dqn-charts.png "Dashed: the naive network. Solid: replay and a frozen copy (DQN). The largest estimate stays near 65 and the score ends at 143 of 200. The score is noisy and falls after an early peak near 200. Simulation.")

![The game's comparison panel: the new run scores 143 of 200 with largest Q 65.4, against the pinned naive run at 9 of 200 and 5 million. The sentence differs in three words.](/assets/robotics/the-deadly-triad/naive-vs-dqn-words.png "The game lists the three words that changed: learn from random old moves, and choose and score the next action with a frozen copy. Simulation.")

</details>

## Which of the three is really to blame?

[Sutton and Barto](http://incompleteideas.net/book/RLbook2020.pdf) name the three ideas the deadly triad. They write: "If any two elements of the deadly triad are present, but not all three, then instability can be avoided." That statement has a setting. [Tsitsiklis and Van Roy (1997)](https://www.mit.edu/~jnt/Papers/J063-97-bvr-td.pdf) prove that on-policy bootstrapping with a linear formula converges, and the same paper gives an example of failure with a nonlinear formula.

The game agrees with the second part. I removed the off-policy idea: the same network, still guessing, but scoring the move it really made, as Sarsa does. Its estimates also grew into the millions.

![The sentence panel of Breaking Bellman: a network, the move just made, one real reward and the action really taken next. The result reads: Does not work yet, score 9 of 200, largest Q 2M.](/assets/robotics/the-deadly-triad/on-policy-network.png "The same network with one word changed: the target uses the action really taken. The score is about 9 of 200 and the largest estimate is about 2 million. Simulation.")

So in a network the triad is better understood as a matter of degree. The game's formula is a nonlinear network, and I did not test a linear one, so this does not contradict the proof for linear formulas. On a larger scale, [van Hasselt and colleagues (2018)](https://arxiv.org/abs/1812.02648) trained DQN variants on Atari across 336 settings. They call an estimate "soft-diverged" when it leaves the range any policy can earn. One-step Q-learning soft-diverged in 94% of runs, and trusting ten real rewards before the guess lowered that to 21%. The number of real rewards, the dial from the second problem, can act as a brake.

## What the game shows, and what it does not

The game shows that a network, a one-step guess and Q-learning with random moves can push estimates into the millions in a world whose limit is 100, and that replay with a frozen copy prevented it. Waiting for the whole walk failed where guessing succeeded. Cliff falls were the cost of exploring and not a sign of numbers going wrong. Two tidy stories failed: the off-policy idea was not needed for the blow-up in a network, and more real rewards in the target were not always better.

It does not show whether guessing needs fewer samples in general, because the results were mixed. It did not measure the variance of targets, the updates needed on a fixed pile of data, a linear formula, a schedule over the number of real rewards, or whether random moves teach recovery. The results come from one game, a few seeds and one network design. Read them as demonstrations of mechanisms, not as measurements of how often each failure happens in real systems.

<details id="source-note">
<summary>How the clips and numbers were made</summary>

The screenshots are real captures of the game page, built at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73) and run in a browser on October 17, 2026. The page uses seeds 101, 202 and so on. Numbers in a screenshot caption are the page's own headline figures.

Other numbers come from the game's own `RLA.run` code at the same commit, the code path that the page trains with. Arms in a world share seeds. The run script and raw results are stored locally and are not published.

**Robot clips.** Each clip is a real recorded episode from those runs. A real browser draws it with the game's own `web/scenes.js` at the same commit, unmodified, using the game's own sprites and fonts. The scene code gets the logged data: the sensor values of a CartPole test, or the training walks, the test path and the greedy arrows of a cliff run. I replaced only the clock, so that the scene runs at a fixed 30 frames per second, and I encoded the frames with ffmpeg (H.264). The naive CartPole clip plays at quarter speed, because the real episode lasts 0.18 s. All other clips play in real time. Desktop and phone clips differ only in canvas size. The game stores ten training walks per run, spread over the run, and the cliff clips use the first and the last of those ten. Each clip is a single selected run, so it is an example and not an average.

**Cliff runs.** A 4 by 12 grid. A fall costs −100 and returns the robot to the start. 10,000 steps, 20 seeds, random moves with probability 0.1, table learning rate 0.5. The page shows 0.32 falls per walk for Q-learning in the second half of training. I recomputed the figure from the raw results as 0.318, counting the second half in training steps, which matches the page.

**Steps to the threshold.** The first test point with a mean score at or above the threshold (−20 on the cliff, 150 on CartPole), per seed. The table shows the median over the seeds that reached it. Test points come every 250 steps on the cliff and every 500 steps on CartPole.

**Not shown.** The runs measure no linear approximation, no recovery behavior, no schedule over the number of real rewards, no variance of the targets and no updates on fixed data.

</details>

<script src="/assets/robotics/the-deadly-triad/triad-videos.js" defer></script>
