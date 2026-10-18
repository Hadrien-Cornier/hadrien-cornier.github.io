---
title: 'Function approximation: learning about situations you never saw'
description: 'Why a table learns only about the cells it visits, how a formula lets one visit teach a robot about situations it never saw, and what that sharing costs when one update moves many numbers at once.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, one idea at a time'
part: 3
layout: essay
---

A simulated robot balances a broom on a cart. Four continuous sensors, for the cart's position and speed and the broom's angle and turning speed, make a table row for every exact situation impossible. So the robot cuts each sensor's range into six slices and keeps one number per box: 1,296 boxes. The two robots below use the same target, the same data and the same training length. They differ in the store of numbers, a table or a small network, and each store keeps its default optimizer and step size. The clips only illustrate.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-table-404" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-table-404-desktop.mp4"></video><figcaption><b>A table of 1,296 boxes: the broom falls after 31 steps</b>This is the greedy test of one real recorded run after 20,000 training steps, with no random moves, at half speed. At real speed the fall takes 0.6 seconds. The run is the median-length test of five. Simulation.</figcaption></figure>
<figure class="tri-clip"><video class="tri-video" data-clip="cart-naive-101" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-naive-101-desktop.mp4"></video><figcaption><b>A network with the same learning rule: the broom falls after 9 steps</b>One real recorded run, at quarter speed. The target, the random moves and the training length match the table. Each store keeps the game's own optimizer and step size, and I did not tune either. The clip does not diagnose the fall. Simulation.</figcaption></figure>
</div>

The clips are recorded runs of [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/). Both robots fall. The clips do not diagnose why. The rest of the article explains two issues that can lie behind such failures: a table fills slowly, and a formula couples its updates.

## The question: what changes when a formula replaces the table

The question for this article is: what does a robot gain, and what can it lose, when one formula replaces the table? A formula lets one visit teach the robot about situations it never saw. The same fact has a price: one update now moves many numbers, including the numbers that the next target is built from.

## Why a table runs out of cells

A table learns only about the cells it visits. A visit to one cell says nothing about the box next to it. I counted this in the game's own level. In 20,000 training steps, the table robot ever stood in about 8% of its 1,296 boxes, and in five runs the count ran from 94 to 122 boxes. Six to eight boxes held half of all the visits.

Slicing finer makes the count worse. With 12 slices per sensor the table has 20,736 boxes, and the robot visited about 2.3% of them. Its score, out of 200, was 55, about the same as the 50 of the six-slice table. Slicing coarser helped. With 3 slices per sensor the table has 81 boxes and scored 92. All five of those runs scored higher than any run with 6 slices. Only the number of slices changed.

A coarse table is already a way to share. Every situation inside a box gets the same number, so a visit to one situation teaches the robot about all of them. It is the simplest formula: a number that stays flat inside a box. Sharing fills the table with data, and it blurs, because two different situations in one box look the same.

## A formula shares by design

A formula can share in a smoother way. The robot keeps a short list of **weights**, written $\mathbf{w}$, and a list of **features**, $\mathbf{x}(s)$, that describe a situation. The value estimate for a situation is a weighted sum:

$$\hat v(s) = \mathbf{w}^\top \mathbf{x}(s)$$

In words: describe the situation with a few numbers, multiply each by its weight and add up. A line is the simplest case. The features are 1 and the position along the row, and the two weights are the line's height and its slope. Learning now changes the weights, not one number per situation. The update is:

$$\mathbf{w} \leftarrow \mathbf{w} + \alpha\,\bigl(\text{target} - \hat v(s)\bigr)\,\mathbf{x}(s)$$

In words: measure how far the estimate at the visited situation is from the target, then move each weight toward closing that gap, in proportion to how much it counted there. A table is the special case where $\mathbf{x}(s)$ holds a 1 in the slot of $s$ and a 0 in every other slot. Then only one number moves. A neural network uses the same idea with many more weights.

The tool below shows the three ways to store a value. It is a mathematical illustration, not a game run. Sixteen situations stand in a row, and their true values rise along a curve. Three learners receive the same visits. Each visit hands the true value as the target, there is no noise, and every number starts at 0. Try visiting only situations 1 to 4, then look at the right end.

<div class="tri-sharing"><noscript>With JavaScript on, this tool shows three learners that receive the same visits. After visits at situations 3, 3, 8, 8, 13, 13, 13, 1, 16 and 6, the average error over all sixteen situations is 4.7 for the table, 2.7 for the table of groups and 0.67 for the line.</noscript></div>

One visit moves one number in the table, four in the table of groups and sixteen in the line. After ten visits at mixed situations, the average error is 4.7 for the table, 2.7 for the groups and 0.67 for the line. The line has learned about situations it never saw.

## What the sharing costs

**The formula is not exact.** The true values curve and the line is straight. After many visits to every situation, the table is right and the groups are off by 0.4 on average. The line is off by 0.64. A formula can only be as right as its shape allows.

**Far guesses can be wrong.** Visit only situations 1 to 4 many times. The line fits them, then guesses the value at situation 16 to be 2.2, against a true value of 9.5. Sharing helps only when the shape of the formula matches the shape of the world.

**Updates now couple.** In a table, a visit changes one number and nothing else. With weights, a visit changes the estimate at every situation that shares those weights. That can improve several situations at once, as the tool shows, and it can worsen others when they pull the weights in different directions. Sutton and Barto describe the trade-off for a formula with far fewer weights than situations: it is not possible to get every value exactly right, so the robot must decide which situations matter most. A table never had to.

**Targets move.** In part 2 the target was a reward plus the robot's own estimate of the next situation. In a table, an update leaves the other entries unchanged, so it changes its own target only when the next situation is the same entry. With a formula, an update can change the estimates at other entries too. The robot raises the estimate at situation $s$, the same weights raise the estimate at the next situation $s'$, and the next target is built from that estimate. The error can feed itself. The book names this issue. I did not test it alone.

## What the game measured

Two pairs of runs use the same learning rule, data and training length. They differ in the store of numbers, and each store keeps its default optimizer and step size. The score is the greedy robot's reward out of 200 in a test, averaged over runs.

| Learning rule | Table | Network |
| --- | --- | --- |
| One-step guesses (Q-learning) | 50.4 | 9.4 (largest estimate 2.1 million) |
| Waiting for the real return | 95.4 | 33.9 |

The network scored lower in both rows. Waiting uses no guessed target, so a moving target cannot be the only reason. Changing from a table to a network, each with its default optimizer and step size, lowered the score here. I did not isolate the cause, and I did not tune the step sizes, so the table shows these settings and not a law.

Part 2 showed a network that held the broom, with replay and a frozen copy of the network. It scored 143 with a largest estimate near 62.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-dqn-101" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-dqn-101-desktop.mp4"></video><figcaption><b>A network with replay and a frozen copy: the broom stays up for 118 steps</b>One real recorded run at real speed, the median-length test of five. The robot also differs from the table in the way it takes its data and in the copy it builds targets from, so this is not a fair comparison with the table. Simulation.</figcaption></figure>
</div>

I cannot credit that 143 to the formula alone. No table run has replay or a frozen copy. The same network with replay and no frozen copy scored 91, with a largest estimate of about 31,000. So those two fixes matter a great deal for a network. I did not run a table with them.

## What this shows, and what it does not

A formula lets a robot value situations it has never seen. A full table does not share between distinct unvisited rows, though a table of coarse boxes already does within each box. The coarse table showed the gain in the game: 81 boxes scored best. The costs are real. A formula blurs, it guesses badly when its shape is wrong, one update moves many numbers, and the target moves with the weights. In my runs the formula alone did not score higher than the table. The gain I can show is in the tool above and in the count of unvisited boxes. The tool is a toy with no noise and a straight line. The game numbers come from five runs and one world.

The next article asks which data the robot learns from, and why that decides whether the updates stay safe. For one fixed policy and a linear formula, the book shows that a bootstrapping method called semi-gradient TD converges. With other data, bootstrapping and a formula together may diverge.

<details>
<summary>Source checks and what each claim depends on</summary>

All section numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), which I checked in the published text.

- **Why a formula.** The introduction to Part II says that tables need time and data to fill, that in many tasks almost every state is new, so generalization is the key issue, and that function approximation is supervised learning applied to value estimates. It lists three new issues: nonstationarity, bootstrapping and delayed targets.
- **Coupling.** Section 9.1 says that in the tabular case the estimates are decoupled, since an update at one state affects no other, and that with genuine approximation an update at one state affects many others. The book adds, for the case of far more states than weights, that making one state's estimate more accurate invariably means making others' less accurate. The tool above has 16 situations and 2 weights, and four visits at situation 1 lowered the line's average error over all sixteen situations from 5.6 to 4.6, so the article states the trade-off as a possibility and not as a rule for every update. The book concludes that we must say which states we care most about, and it uses a state distribution $\mu(s)$ for that. The tool above does not weigh situations: it shows the average error over all sixteen with equal weight.
- **The update.** Section 9.3 gives the stochastic gradient step, Eq. 9.7. It says that state aggregation is a special case, where the gradient is 1 for the component of the state's group and 0 for the others. Section 9.4 gives the linear form $\hat v(s,\mathbf{w}) = \mathbf{w}^\top \mathbf{x}(s)$ and the update in Eq. 9.9 and 9.10. Exercise 9.1 says that the tabular case is a special case of the linear one.
- **Semi-gradient.** Section 9.3 says that bootstrapping targets depend on the weights, so these methods take into account the effect of changing the weights on the estimate, but ignore its effect on the target. The article uses the term only in the last paragraph.
- **The convergence statement.** Section 9.4: semi-gradient TD(0) with linear features, for a fixed policy and the on-policy distribution, converges. The book says elsewhere that for other distributions, bootstrapping with function approximation may diverge (Chapter 11). Parts 4 and 5 treat that. This article only names it.
- **The Q-learning target.** The target in the cost named "Targets move" is the same one-step target as in part 1, with a network in place of the table. The sentence that the error can feed itself is my reading of the book's list of issues, which I did not test alone. The mechanism is not verified.

</details>

<details>
<summary>Exact numbers: the score pairs, the slices and the unvisited boxes</summary>

All numbers come from the game's own `RLA.run` code at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73) with the settings of the level "Too many cells". I re-ran the slice counts with 3 and 12 slices. This is a re-run of a setting that the game already holds as a knob, not a new experiment.

**Setup.** Runs use 20,000 steps and seeds 101, 202, 303, 404 and 505. Random moves fall from 1.0 to 0.05 over the first 5,000 steps. The table uses one-step Q-learning with step size 0.1. The network has two hidden layers of 32 units, Adam, and step size 0.001. The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of test points. It is not the reward of the single final test.

**Score pairs.** Inside each pair the learning rule, data and training length match, and each store keeps its default optimizer and step size, so the pair is not a test of the store alone. Mean over five seeds, with the standard deviation across seeds:

| Rule | Table | Network |
| --- | --- | --- |
| One-step guesses | 50.4 ± 10.6 | 9.4 ± 0.2 (median of the largest estimate: 2.1 million) |
| Waiting (n-step of 0) | 95.4 ± 19.6 | 33.9 ± 14.3 |

**Other network arms.** Network with replay and a frozen copy: 143.0 ± 33.7, median of the largest estimate 61.7. Network with replay and no frozen copy: 90.6 ± 40.3, median of the largest estimate 31,040.6. No table arm has replay or a frozen copy, so none of these numbers is a measure of the formula alone.

**Slices of the table.** Re-run with only the slice count changed. A visit counts each observation that the robot receives in training, including the first one of every episode. The training world only counts, not the test.

| Slices per sensor | Boxes | Score | Boxes ever visited | Share visited | Boxes holding half of all visits |
| --- | --- | --- | --- | --- | --- |
| 3 | 81 | 92.5 ± 14.9 | 32 to 41 | 45% | 2 |
| 6 | 1,296 | 50.4 ± 10.6 | 94 to 122 | 8.3% | 6 to 8 |
| 12 | 20,736 | 55.1 ± 27.9 | 382 to 605 | 2.3% | 9 to 26 |

The 6-slice re-run matched the saved arm exactly. The game's lesson text for the level "Finer is slower" reports 12 slices at 46, 6 at 51 and 3 at 97, from 3 seeds and the final test score. My re-run uses the score defined above and 5 seeds: 12 slices scored 55, about the same as 6, with a spread of 28 across seeds. I read that as equal and not worse. Five seeds cannot separate them, and the two score definitions differ. The 3-slice result agrees with the game's text. A table with 3 slices scored best in this level, and every one of its five runs (77.5 to 114.8) scored above every run with 6 slices (40.7 to 67.9). The idea that the average box holds about 15 visits is misleading: the visits pile into a few boxes.

**The test clips.** The first clip is the recorded greedy test of the 6-slice run with seed 404. The five test lengths were 26, 89, 122, 31 and 19 steps, so 31 is the median. The third clip is the test of the network with replay and a frozen copy, seed 101: lengths 118, 600, 99, 104 and 272 steps, median 118.

</details>

<details>
<summary>How the clips and the tool were made</summary>

Each clip is a real recorded run drawn by a real browser with the game's own `web/scenes.js` at the same commit, unmodified. I replaced only the clock, so that the scene runs at a fixed 30 frames per second, and I encoded the frames with ffmpeg (H.264). The table clip plays at half speed, the second clip at quarter speed, and the third at real speed. The run script and raw results are stored locally and are not published.

The tool is a short script, `sharing.js`, and holds no game code. It has three learners and the update from the article. I ran its pure core in Node on a fixed list of visits and re-computed the same list in an independent Python program. The two agreed to 4e-16. The true value of situation $i$ is $5 + 3x + 1.5x^2$ with $x = (i - 7.5)/7.5$, so the values run from 3.5 to 9.5. The step size is 0.3. The line uses the features $1$ and $(i - 7.5)/4.6$. The groups hold four neighbors each. The fixed list of ten visits has the situations 3, 3, 8, 8, 13, 13, 13, 1, 16 and 6, counted from 1. The "visit only 1 to 4" figures come from 30 sweeps over situations 1 to 4.

</details>

<script src="/assets/robotics/rl/rl-videos.js" defer></script>
<script src="/assets/robotics/rl/sharing.js" defer></script>
