---
title: 'The deadly triad'
description: 'How three useful ideas can feed each other''s errors.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, one idea at a time'
part: 5
layout: essay
---

Two simulated robots balance a broom on a cart, and both learn with a neural network. One of them also keeps a memory of old moves and a frozen copy of its network.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-naive-101" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-naive-101-desktop.mp4"></video><figcaption><b>No memory, no frozen copy: the broom falls after 9 steps</b>The greedy test of one real recorded run, at quarter speed because the real fall takes under a fifth of a second. At the end of training this robot's largest estimate was about 2.2 million, in a world where no estimate above 100 can be right. Simulation.</figcaption></figure>
<figure class="tri-clip"><video class="tri-video" data-clip="cart-dqn-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-dqn-202-desktop.mp4"></video><figcaption><b>Memory and a frozen copy: the broom stays up</b>The greedy test of one real recorded run, 12 seconds. Its largest estimate at the end was about 60. This is the best of five runs: in the other four tests the cart reached the end of the rail after 99 to 272 steps. Simulation.</figcaption></figure>
</div>

The clips are recorded runs of [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/). They illustrate and do not explain. The rest of the article follows a mechanism in a small case, and then compares robots that differ in one component at a time.

## The question: how do three good ideas make errors grow

The question for this article is: how can bootstrapping, a shared formula and an off-policy target amplify each other's errors, when each exists for a good reason? Parts 2 to 4 introduced them. **Bootstrapping** puts the robot's own guess inside the target, so it learns before a walk ends. **Function approximation** lets one formula produce every number, so one visit teaches about situations never seen. **Off-policy learning** lets the target describe a different rule from the one that acts, so a robot can aim at the greedy rule while it explores. Together they are the **deadly triad** of Sutton and Barto. The book shows the danger in planning with a fully known world, so it needs neither noisy data nor the choice of actions.

## The smallest case: two situations that share a number

A walk goes from situation A to situation B and ends. Every reward is 0, so both true values are 0. The robot shares one weight $w$: its estimate for A is $w$ and for B is $2w$. Updating A moves $w$ toward the target for A:

$$w \leftarrow w + \alpha\,\bigl(\gamma \cdot 2w - w\bigr)$$

In words: the target for A is the discount $\gamma$ times the estimate for B, and the estimate for A moves toward it by a fraction $\alpha$ (the step size). The gap is $(2\gamma - 1)\,w$, which is positive for any positive $w$ when $\gamma$ is above one half. So every update raises $w$, which also raises the estimate for B and with it the next target. A round is one walk: one update at A and, when B is also updated, one update at B after it. Part 2 gave the multiplier, $1 + \alpha(2\gamma - 1)$ for each update at A, which is 1.098 for $\gamma = 0.99$ and $\alpha = 0.1$.

Three links make the loop, and removing one breaks it.

- **The guess.** With the real return, 0, as the target, $w$ moves toward 0.
- **The shared number.** With separate numbers, an update at A leaves B's number alone, and the target stays put.
- **The missing pull-back.** B's own update has a target of 0, because its next step ends the walk. It pushes $w$ down about four times as hard as A's update pushes it up. If B is updated after every update of A, with the settings below, $w$ shrinks. If B is never updated, nothing opposes the growth.

The third link is a mismatch in which updates happen. The toy has no choice of actions, so it is not an off-policy task but an analogue. Part 4 defined off-policy learning as a target that describes a different rule from the one that acts, which lets updates visit situations in other proportions than that rule would. Here I take the extreme case and leave B out.

## Try the switches

Each box turns one link on or off. The chart shows the estimate for A over 100 rounds, on a log scale. Each round updates A once, and B is also updated once when the third box is off. The third box is the missing pull-back, not a full off-policy setting.

<div class="tri-switches"><noscript>With all three links on, the estimate for A grows from 10 to 25.5 after 10 rounds and to about 115,000 after 100. With any one link off it does not grow: it shrinks toward 0, or, with separate numbers and B never updated, it settles at 19.8.</noscript></div>

Only the setting with all three on grows. Of the other seven, one is bounded but wrong: with separate numbers and B never updated, A settles at 19.8, a copy of a number that no update corrects.

This is a fragment, and the repeated multiplier shows growth only in the fragment, not in a network in a full task. The off-policy result comes from the book's complete seven-state task, with a behavior rule and a different target rule: there the same combination diverges for any positive step size, and changing only the distribution of its expected updates to the on-policy one restores convergence.

## What the robots measured

The toy shows a mechanism. It does not predict what a network does or why one blows up. So I compared robots on the balance task, five runs of 20,000 steps each, starting from the network with the Q-learning target, the one that blew up. Each network arm changes one recorded setting of that network. The table also changes the optimizer and step size, as part 3 says. No estimate above 100 can be right in this task, so I compare the largest estimate at the end with that bound.

- **Table**, same guess and target, no sharing: score 50.4 of 200, largest estimate 30.
- **Network with real returns**, no guess: score 33.9, largest estimate 18.
- **Network, one-step guess, Q-learning target**, all three links: score 9.4, largest estimate 2.1 million.
- **Network, one-step guess, Sarsa target**, the on-policy target: score 9.4, largest estimate 0.92 million.

Removing the shared formula or the guess removed the blow-up. Changing the target to the on-policy one did not. A stable estimate is not a good policy either: the table is stable and scores 50 of 200. The toy suggests a mechanism that could act in a network: an update at one situation also changes the numbers of similar situations, including the next one, whose number is the target. The DQN authors give a similar account. It is a possible mechanism, not a measurement.

## What the repairs do

Two repairs from DQN are a memory of old moves, replayed in random order, and a frozen copy of the network that computes the targets. The frozen copy delays the effect of an update on the target, and the authors say that makes divergence "much more unlikely", not impossible. The memory keeps the current estimates from deciding alone what the next updates see. Neither removes bootstrapping, sharing or the off-policy target, and replay makes the data more off-policy.

In the game, the memory without the frozen copy still ended far above 100: median 31,000, from 800 to 75,000, with a score of 90.6. With the Sarsa target and the memory the median was 263, from 67 to 1,780, and the score 70.0. Only the memory and the frozen copy together ended between 60 and 65, with a score of 143, not 200. I did not run the frozen copy alone.

On Atari, van Hasselt and colleagues found the same shape. Q-learning soft-diverged, with an estimate above 100, in 61 percent of its runs across their settings. These are finite excursions seen in finite runs. Values often passed a million and then fell back. The authors report no unbounded divergence, which in their runs means no floating-point NaNs. It does not show that the true iterates stay bounded. The growth without end in the toy is a statement about repeated multiplication, a different thing from an observed excursion. Target networks lowered the rate, and heavier prioritised replay, which is more off-policy, raised it. These repairs reduce the loop and do not prove it away.

## What I could not explain

Two of three does not guarantee stability here. The book says that if any two elements are present but not all three, instability can be avoided, and the analysis around that sentence is for linear formulas. My Sarsa network has the guess and the network, and no off-policy target, and still blew up. Tsitsiklis and Van Roy proved convergence for on-policy learning with a linear formula, gave a nonlinear example of divergence that they call somewhat contrived, and left neural networks open. So the guarantee does not cover my network. It does not tell me why the network blew up, and I do not know.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-sarsa-net-101" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-sarsa-net-101-desktop.mp4"></video><figcaption><b>The Sarsa target with a network: the broom falls after 10 steps</b>The same task and budget, with no memory of old moves and no frozen copy. At the end of this run the largest estimate was about 1.0 million. I did not find out why. Quarter speed. Simulation, one real recorded run.</figcaption></figure>
</div>

## What this shows, and what it does not

The two-situation case shows a loop: a guess, a shared number and a missing pull-back make an estimate grow. In the game, removing the shared formula or the guess removed the blow-up, the on-policy target did not, and the repairs reduced it. The results do not show that the triad is the cause in the network, that two of three is safe for networks, or how the repairs behave elsewhere. It is one task, one network and five runs per arm.

One cheap check follows: when rewards are bounded, compare the largest estimate with the highest return the task allows. Above that bound the estimates are wrong, even when the score looks fine.

The series gave five answers. A table of action values estimates how good each move is, and taking its largest entry chooses a greedy action. The optimal values, $Q^*$, are the relationship that part 1 explained under its convergence conditions; finishing a run does not by itself give them. Bootstrapping builds a number from other numbers. A formula lets numbers share. A target can describe a rule that is not the one acting. Together they let errors feed on errors.

<details>
<summary>Source checks and what each claim depends on</summary>

Section and equation numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), which I checked in the published text.

- **The triad.** Section 11.3 defines the three elements and says the danger arises when all three are combined, that it is not due to control or to learning, that it occurs in planning with a known environment, and that if any two are present but not all three, instability can be avoided. The remarks name Sutton (1995) as the first to identify it, Tsitsiklis and Van Roy (1997) for the analysis, and Sutton (2015) for the name.
- **The two-situation case.** Section 11.2. The text gives the multiplier $1 + \alpha(2\gamma - 1)$, says it exceeds 1 whenever $\gamma > 0.5$ and that the step size changes the speed and not whether it diverges. It says the key is that the transition recurs without $w$ being updated on other transitions, and that under on-policy training each visit to the $2w$ state is followed by a transition out of it. My toy, with B updated once per walk, is my own arithmetic. In the version of Tsitsiklis and Van Roy that [van Hasselt and colleagues](https://arxiv.org/abs/1812.02648) draw, state 2 is updated several times per update of state 1 under the on-policy dynamics, and they note that updating it as often as state 1 still diverges for a large enough discount. My toy updates B once per walk and is stable with these settings, so it does not reproduce that case.
- **The complete example.** Section 11.2, Baird's counterexample: seven states, eight weights, reward 0, $\gamma = 0.99$. Semi-gradient TD(0) diverges for any positive step size, and so does an expected update as in dynamic programming. If only the distribution of the updates is changed to the on-policy one, convergence is guaranteed with the error bound of Eq. 9.14. I did not run it.
- **The limits of the two-of-three statement.** The sentence in Section 11.3 does not say "linear", but the analysis and examples around it (Sections 9.4 and 11.2) are for linear formulas. Whether it covers a nonlinear network is not settled by anything I read. Section 11.2 also says that Q-learning with exploring behavior close to the target has, to the authors' knowledge, never been found to diverge, with no theoretical analysis. The game's random-move rate starts at 1.0 and ends at 0.05, and its network is nonlinear. It blew up in 5 of 5 runs. I did not test a smaller final rate.
- **Tsitsiklis and Van Roy.** [*An analysis of temporal-difference learning with function approximation*](https://doi.org/10.1109/9.580874), IEEE Transactions on Automatic Control, 1997. The abstract proves convergence with probability one for a linear formula with on-line updating along trajectories of the chain, and shows divergence can occur when updates do not follow trajectories. Section X gives an example of divergence with a nonlinear approximator. They analyze its steady-state dynamics and do not give a rigorous proof. They call the example contrived and say it is unclear whether divergence occurs for neural networks.
- **DQN.** Mnih and colleagues, [*Human-level control through deep reinforcement learning*](https://www.nature.com/articles/nature14236), Nature 2015, Methods. Replay randomizes over the data to remove correlations and smooth changes in the data distribution. The target network is cloned every $C$ updates. An update that raises $Q(s_t,a_t)$ often raises $Q(s_{t+1},a)$ for all $a$ and so the target, and the delay makes divergence or oscillations "much more unlikely".
- **Van Hasselt and colleagues.** *Deep reinforcement learning and the deadly triad* (arXiv 1812.02648, a preprint). A run soft-diverges when an estimate exceeds the bound of 100 for rewards clipped to one at discount 0.99. Their runs are 3 replications of each of 336 settings per game over 57 games: four bootstrap targets, three bootstrap lengths (1, 3 and 10 steps), four network sizes and prioritisation settings. Figure 2 reports soft divergence by bootstrap target over all settings: Q-learning 61 percent, and the three other targets 14, 33 and 10 percent (target Q-learning, inverse double Q-learning and double Q-learning, in the order of the figure labels). Figure 3a splits the same runs by bootstrap length. For Q-learning, the one-step runs soft-diverged in 94 percent and the ten-step runs in 21 percent, each percentage taken across the other settings. So 61 percent is the aggregate over all three lengths, and 94 percent is its one-step part. I did not recount the runs. They say replay makes the updates even more off-policy. They report that values often grow past a million and then fall back below 100, and that no run was unbounded. Here that means no floating-point NaNs in finite runs. It is not a proof that the true iterates are bounded, and I read it as finite observed excursions. Heavier prioritisation raised the rate from 52 to 77 percent for Q-learning. They state that target networks do not suffice: on the two-situation example with a linear formula the weights still diverge, slowed by the copying period.
- **My reading, not a source's.** That the toy explains the network blow-up in the game is not shown by anything above. I give the DQN authors' account of the mechanism and did not test it in the game's network.

</details>

<details>
<summary>Exact numbers: the two-situation case and the balance task</summary>

**The two-situation case.** Discount 0.99, step size 0.1, A starts at 10 and B at 20, true values 0. One walk is A, B, end, and one round is one walk: A is updated once, and in the last column B is also updated once after it. B's own target is always 0. With one shared weight, A is $w$ and B is $2w$ and the update moves $w$ by the gradient of the estimate. In the last column B is updated once per round, after A, so one round multiplies $w$ by $1.098 \times 0.6 = 0.659$. The estimate for A after 10, 60 and 100 rounds:

| Guess | One number | B never updated | A after 10 rounds | A after 60 rounds | A after 100 rounds |
| --- | --- | --- | --- | --- | --- |
| yes | yes | yes | 25.5 | 2,730 | 114,900 |
| yes | yes | no | 0.154 | about 0 | about 0 |
| yes | no | yes | 16.4 | 19.78 | 19.80 |
| yes | no | no | 11.2 | 0.255 | 0.006 |
| no | yes | yes | 3.49 | 0.018 | 0.0003 |
| no | yes | no | 0.021 | about 0 | about 0 |
| no | no | yes | 3.49 | 0.018 | 0.0003 |
| no | no | no | 3.49 | 0.018 | 0.0003 |

The script `q5/toy.py` produces this table. The widget code reproduces the same 24 numbers to nine digits.

**The balance task.** CartPole, 5 runs (seeds 101 to 505), 20,000 steps, random moves from 1.0 to 0.05 over 5,000 steps, one-step updates unless noted, network of two hidden layers of 32 units with Adam at 0.001. The score is the greedy policy's reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of the test points. "End" is the last test point. "Run" is the largest estimate at any test point. The discounted return cannot pass 100 (reward 1 per step, discount 0.99). Medians over the five runs, with the range in brackets:

| Arm | Formula | Guess | Target | Data | Frozen copy | Score | Largest at the end | Largest in the run |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Table | table | yes | greedy next | latest | no | 50.4 | 29.5 (22.8 to 35.0) | 32.5 |
| Network, real returns | network | no | none | latest | no | 33.9 | 18.1 (11.9 to 24.2) | 25.8 |
| Network, Q-learning target | network | yes | greedy next | latest | no | 9.4 | 2.10 million (2.08 to 2.42 million) | 4.10 million |
| Network, Sarsa target | network | yes | taken next | latest | no | 9.4 | 0.92 million (0.80 to 1.90 million) | 1.02 million |
| Memory, Q-learning target | network | yes | greedy next | replay | no | 90.6 | 31,000 (800 to 75,000) | 70,400 |
| Memory, Sarsa target | network | yes | taken next | replay | no | 70.0 | 263 (67 to 1,780) | 9,260 |
| Memory and frozen copy | network | yes | greedy next | replay | yes | 143.0 | 61.7 (60.0 to 65.4) | 61.7 |

Part 2 quotes 4.1 million for the network with the Q-learning target, which is the largest at any test point. Parts 3 and 4 and this article quote the last test point, 2.1 million. The two memory arms scatter widely between runs. The recorded settings of the three network arms without memory differ from the Q-learning network in one setting each: the number of real rewards for the no-guess arm, and the target for the Sarsa arm. The memory arms change the data mode, and the last arm also uses the frozen copy. The table arm changes the formula, and with it the optimizer and the step size. I did not run the frozen copy without the memory.

The two online arms without a memory used the same data mode (latest), exploration schedule and budget. Their different targets make different policies, so the runs gathered different trajectories.

**Test lengths of the memory and frozen copy arm.** The five tests lasted 118, 600, 99, 104 and 272 steps. In four the cart reached the end of the rail. The clip is the one that held the broom for the full 600 steps.

</details>

<details>
<summary>How the clips and the switches were made</summary>

Clips are real recorded greedy tests from the saved run records of the game at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73), drawn by the game's own `web/scenes.js` in a real browser with a replaced clock at 30 frames per second, and encoded with ffmpeg (H.264). The first and the third clip play at quarter speed. The first two clips are the same files as in parts 2 and 3. The third is new and made with the same pipeline from the Sarsa network run with seed 101.

The switches are not a game run and not an off-policy task. They are a small program that follows the update rule written above, with the numbers in the note under the chart. The third switch leaves B's update out as an analogue of an update-distribution mismatch. No game code was changed, and no new training run was made for this article.

</details>

<script src="/assets/robotics/rl/rl-videos.js" defer></script>
<script src="/assets/robotics/rl/switches.js" defer></script>
