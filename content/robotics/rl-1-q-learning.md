---
title: 'Q-learning: one table for the value and the policy'
description: 'How one table of numbers can say both how good each choice is and which choice to make, why a robot that always trusts its table gets stuck, and when the largest number in a row misleads.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, one idea at a time'
part: 1
layout: essay
---

A robot walks into a casino with ten slot machines. Each pays a hidden average plus noise, so one pull says little. The robot has a thousand pulls and keeps one number per machine: the average payout it has seen so far. Below, two robots keep the same table and differ in one rule. The clips only illustrate; the rest explains why.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="slots-greedy-505" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/slots-greedy-505-desktop.mp4"></video><figcaption><b>A robot that always pulls the machine with the largest number: it never leaves its first pick</b>The counter on the machine shows its pulls. At the end, gold is each machine's true average payout, blue is what the robot believes, and the crown marks the best machine. Simulation, one real recorded run.</figcaption></figure>
<figure class="tri-clip"><video class="tri-video" data-clip="slots-eps-505" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/slots-eps-505-desktop.mp4"></video><figcaption><b>The same robot, same machines, same table, with one pull in ten at random: it finds the best machine</b>The only change is the random pulls. Simulation, one real recorded run.</figcaption></figure>
</div>

The clips are recorded runs of [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), a small game I made. They show the two rules. The next sections explain why the first one gets stuck.

## The question: one table, two jobs

The question for this article is: how can one table of numbers tell a robot both how good a situation is and what to do in it? Two ideas answer it. The table holds a number for each action and not only for each situation. And the robot reads its behavior straight from the table.

## A number for each action

A number for "the casino" cannot tell the robot which machine to pull. A number for each machine can. The payout the robot expects from pulling a machine is its **action value**, written $Q(a)$. After each pull the robot nudges that machine's number toward the payout it just saw:

$$Q(a) \leftarrow Q(a) + \tfrac{1}{n}\,\bigl(r - Q(a)\bigr)$$

In words: move the number a little toward what you just got, by a smaller step each time. Here $r$ is the payout and $n$ counts the pulls of this machine. With this step size the number ends as the plain average of the payouts.

## The table is the policy

A **policy** is a rule for what to do. Here the rule is greedy: pull the machine with the largest number. It needs no list of instructions and no model of how the machines work. The numbers say how good each choice looks, and the largest one says what to do. One table holds both.

## Why the first robot is stuck

Every number starts at zero. Machines are tied, so the first pull goes to one of them at random. If it pays anything above zero, that machine's number rises above all the others, which still read zero. The robot pulls it again. As long as that number stays above zero, no other machine gets a pull, so their numbers never get a chance to correct. The robot settles on the first machine whose number stays above zero, and it never learns what the others pay. In the first clip it settled on a machine that pays a little above zero, while another pays far more.

The fix is to keep trying machines that do not look best. In the second clip, one pull in ten goes to a random machine. Averaged over 200 runs, the greedy robot spent about a third of its last 200 pulls on the best machine, and the robot with random tries spent about three quarters. Three quarters and not all, because one pull in ten is random on purpose.

## What slot machines leave out

Slot machines have one situation. Pulling a machine never changes what you can do next. Real tasks have steps: a move changes where the robot is, and what it can do from there. So the slot machines show only two ideas, a number per action and a policy read from the table, plus the need for random tries. They do not show how to learn in a task with steps.

For that, the table gets a row for each situation $s$ and a column for each action $a$. The number $Q(s,a)$ is the return the robot expects if it takes action $a$ in situation $s$ and then acts well afterwards. The **return** is the reward collected from now on, with later rewards counted a little less. Q-learning, proposed by Watkins in 1989, updates it like this:

$$\begin{aligned}\text{target} &= r + \gamma \max_{a'} Q(s',a') \\ Q(s,a) &\leftarrow Q(s,a) + \alpha\,\bigl(\text{target} - Q(s,a)\bigr)\end{aligned}$$

In words: the robot takes $a$ in $s$, gets a reward $r$ and lands in a new situation $s'$. It looks at the row of $s'$ and finds the largest number there, its own best guess of what it can get from that situation. The target is the reward plus that guess, and the robot moves $Q(s,a)$ a little toward it. Here $\alpha$ (alpha) is the step size and $\gamma$ (gamma) is the discount, a number just below 1. A slot machine is the special case where no next row exists. The next article explains why a guess is a fair target and what it costs.

## What a finished table holds

Call the best possible numbers $Q^*$: for each situation and action, the return for taking that action and then acting optimally. The best number in a row is the value of that situation:

$$V^*(s) = \max_a Q^*(s,a)$$

In words: the value of a situation is the number of its best action. The best policy takes, in every situation, the action with the largest $Q^*$. Watkins and Dayan proved in 1992 that the table above converges to $Q^*$ with probability 1, under conditions that include these three: the table keeps one separate number per pair, every action is tried in every situation again and again, and the step sizes shrink in a particular way. In the limit, the greedy policy of the table is an optimal policy.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-table-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-table-202-desktop.mp4"></video><figcaption><b>A finished table on a cliff walk: the robot follows the largest number in each cell</b>Arrows show the move with the largest number in each cell. The robot walks them with no random moves, from the start at the bottom left to the flag. Simulation, one real recorded run.</figcaption></figure>
</div>

I checked this on the cliff walk. A separate script computed the exact optimal values for the grid. Along the best route, the recorded tables matched them. In a few cells off the route, the favorite move was still not the best one. So a table the robot has trained is close to $Q^*$ where it has practiced, and not everywhere. That difference matters in the next section.

## When the largest number lies: the mirage

Here is a world where the largest number misleads. There are two doors. The right door ends the episode with reward 0. The left door leads to ten slot machines, each paying on average $-0.1$ with noise, and then the episode ends. So the left door is a little worse than the right one. The robot uses the table above, with one random move in ten.

Each machine's number is a noisy average of a few payouts. By luck, some of the ten read high. The target for the left door uses the largest of the ten, and the largest of ten noisy numbers is the luckiest one. It sits above the true value of $-0.1$, so the left door looks good.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="mirage-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/mirage-202-desktop.mp4"></video><figcaption><b>The robot goes through the worse door most of the time at first, then drifts to the better one</b>One episode per door choice. The labels show each door's share of the episodes so far. Simulation, one real recorded run.</figcaption></figure>
</div>

Averaged over 300 runs, the robot took the left door in about 85% of episodes during the first tenth of each run. By the end it was about 11%, and random tries alone account for about 5%. Even then, the average estimate for the left door was still above the true $-0.1$. Sutton and Barto call this **maximization bias** and use this setup as their Example 6.7. Their fix, Double Q-learning, uses one table to choose the machine and another to rate it. I did not re-run that fix for this article.

## What this shows, and what it does not

The answer to the question is this. One table of numbers per action tells the robot how good each choice looks and, by taking the largest number, what to do. If the table is finished, the largest number in a row is also the value of that situation, and the greedy rule is the best policy. If the table is not finished, or its numbers are noisy, the largest number is only a guess, and it tends to be too high. The robot still needs random tries, so that no number is left uncorrected.

The slot machines show the table, the greedy rule and the need for tries. They do not show sequential learning. The cliff and the mirage carry that part. I did not test the mirage's cause beyond the book's explanation, and the clips are single recorded runs. The convergence result needs a table and tries that never stop. Practical methods work with limited data and often replace the table with a formula, and they lose that guarantee. Bootstrapping, the subject of the next article, does not remove the conditions: Q-learning still needs every action tried again and again, and suitable step sizes.

<details>
<summary>Source checks and what each claim depends on</summary>

All section and equation numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), which I checked in the published text. The 1992 paper is Watkins and Dayan, [*Q-learning*](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf), Machine Learning 8, pages 279 to 292. I read it as page images.

- **Action values and the policy.** Section 3.6 defines $q_*(s,a)$ as the expected return for taking action $a$ in state $s$ and thereafter following an optimal policy. Eq. 3.17 and Eq. 3.20 give $q_*(s,a)$ in terms of $v_*$ and in the Bellman optimality form with a max over the next action. The book says that with $q_*$ an agent can simply choose an action that maximizes $q_*(s,a)$, and that the action-value function caches the results of all one-step-ahead searches, so no model of the environment is needed to act.
- **The update.** Section 6.5, Eq. 6.8. The book says $Q$ directly approximates $q_*$ regardless of the policy followed, and that all that is needed for convergence is that all pairs continue to be updated.
- **The value and the best policy.** Watkins and Dayan, pages 280 and 281: $V^*(x) = \max_a Q^*(x,a)$, and if an action $a^*$ attains the maximum, the policy that takes $a^*$ in $x$ is optimal. The $Q^*$ values are unique.
- **Unfinished estimates.** Watkins and Dayan, page 281, say that in the early stages of learning the Q values may not accurately reflect the policy they implicitly define. Their update uses the best the agent thinks it can do from the next state.
- **The convergence theorem.** Watkins and Dayan, page 282. The conditions: rewards bounded, learning rates at least 0 and below 1, the sum of the learning rates for each pair infinite, and the sum of their squares finite. Then $Q_n(x,a) \to Q^*(x,a)$ with probability 1. The abstract adds that all actions must be repeatedly sampled in all states and that the action values are represented discretely. Page 281 notes, citing Watkins' 1989 thesis, that Q-learning may not converge correctly for other representations. I did not read the thesis itself.
- **Maximization bias.** Sections 6.7 and Example 6.7 of Sutton and Barto: a maximum over noisy estimates is biased upward, and Q-learning takes the left action far more often than it should early in learning. Double Q-learning is their fix. In the book the left action leads to many choices with mean $-0.1$. The game uses ten.
- **The two numbers I did not carry over.** My earlier notes held 33% and 78% for the slot machines, and 82% and 13% for the mirage. They came from logged results with other seed sets. I re-ran the level configurations instead. See the next drawer.

</details>

<details>
<summary>Exact numbers: slot machines, mirage and cliff table</summary>

All numbers come from the game's own `RLA.run` code at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73), with the level settings of the game. This is a re-run of settings the game already uses, not a new experiment.

**Slot machines.** Ten machines whose true averages are drawn from a standard normal distribution, payout noise with standard deviation 1, 1,000 pulls, a table of running averages (step size $1/n$), 200 runs. The share of the last 200 pulls spent on the best machine, averaged over runs:

| Rule | Share on the best machine | Runs with less than half of the last 200 pulls on the best machine |
| --- | --- | --- |
| Greedy | 35.5% | 64.5% |
| One random pull in ten | 77.5% | 15.0% |

Greedy has all numbers at zero at the start and breaks ties at random. With random tries, at most about 91% is possible, since one pull in ten is random and a random pull hits the best machine one time in ten. The clip pair uses one run where greedy never pulled the best machine in the last 200 pulls and the robot with random tries spent 92.5% of them there. I chose that run because it shows the gap clearly. It is an example, not a typical run. The two robots in the pair share one set of machines.

**Mirage.** State A has two doors. The right door ends the episode with reward 0. The left door gives reward 0 and leads to state B with ten machines, each paying on average $-0.1$ with standard deviation 1. Q-learning, a table, random moves with probability 0.1, step size 0.1, no discount, 600 steps per run, 300 runs. Episodes last 1 or 2 steps, so runs hold about 467 episodes on average. Share of episodes through the left door: 85.0% in the first tenth of each run's episodes, 11.3% in the last fifth. The estimate for the left door at the end, averaged over runs: $-0.036$, against a true value of $-0.1$. Random tries alone would send it left in about 5% of episodes (a random move picks the left door half the time, and one move in ten is random). I did not run a version without the max over machines, so the cause is the book's explanation and not something I separated here.

**Cliff table.** Twenty recorded runs of Q-learning with a table, random moves with probability 0.1, step size 0.5 and discount 0.99, 10,000 steps. The best route takes 13 steps and has a discounted value of $-12.2479$. I computed the exact optimal values for the grid by value iteration. In all 20 runs the largest number in the start cell was $-12.2479$, and the greedy walk reached the flag in 13 steps. Along the best route, 13 numbers per run, all 20 runs agreed with the exact values to better than $10^{-13}$. The table has 192 numbers per run. The 44 that stay at zero belong to the cliff cells and the flag, which a robot never stands on. In the cells a robot can stand on, the favorite move of the table matched an optimal move in 34.5 of 37 cells on average. I did not examine why the rest differ. The numbers for stepping off the route into the cliff were between $-112.13$ and $-110.2$; the exact value is $-112.13$.

</details>

<details>
<summary>How the clips were made</summary>

Each clip is a real recorded run drawn by a real browser with the game's own `web/scenes.js` at the same commit, unmodified, using the game's own sprites and fonts. I replaced only the clock, so that the scene runs at a fixed 30 frames per second, and I encoded the frames with ffmpeg (H.264). The slot machine and mirage clips come from re-running the level settings of the game, as above. The cliff clip is the finished table and the final test of the same recorded run that part 2 uses for its first clip, without the training walks. The run script and raw results are stored locally and are not published.

</details>

<script src="/assets/robotics/rl/rl-videos.js" defer></script>
