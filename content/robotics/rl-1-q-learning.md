---
title: 'Q-learning: a table that tells you what to do'
description: 'How a table with one number per situation and move fills in on a cliff grid, how its largest numbers give both the value of a cell and the move to make, and where the method breaks.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, one idea at a time'
part: 1
layout: essay
---

Q-learning keeps one number for every situation and every move, and the move with the largest number in a situation is the one you make there.

Here's the situation. You're on a grid with 4 rows and 12 columns. You start in the bottom left cell, the flag is in the bottom right, and the cells between them along the bottom row are a cliff. Every step costs 1. Stepping into the cliff costs 100 and puts you back at the start. You can move up, right, down or left, and you want the cheapest trip to the flag.

The table has a row for each of the 48 cells and a column for each of the 4 moves, so 192 numbers, and every one starts at 0. The 44 numbers for the cliff and the flag never change, because you never stand on those cells, which leaves 37 cells you can stand on. Drag the slider to watch one recorded run fill the table, or step one update at a time.

<div class="qt-widget"></div>

## What the numbers mean

The number in row $s$ and column $a$ is $Q(s,a)$. It's the return you expect if you take move $a$ in cell $s$ and then keep playing well, where the return is the rewards from now on added up, with later ones counted a little less (part 0 has the definitions). Two readouts come straight off a row:

- **$V_Q(s) = \max_a Q(s,a)$.** The largest number in the row. It says how good the cell looks, and it's the number printed in each grid cell above.
- **$\pi_Q(s) = \arg\max_a Q(s,a)$.** The move that holds the largest number. It says what to do in the cell, and it's the arrow in each grid cell above.

So one table gives both the value of each cell and the policy. These are readouts of whatever table you hold at the moment. They equal the best possible values $v_*$ and the best policy only when the table has reached $q_*$, so early in a run they're a guess.

## How one number is updated

Every move changes one number. The robot takes move $a$ in cell $s$, gets a reward $r$ and lands in cell $s'$. Then:

1. Look at the row of $s'$ and take its largest number. That's your best guess of what is left to collect.
2. Add it to the reward you just got, with the guess counted a little less: $\text{target} = r + \gamma \max_{a'} Q(s',a')$.
3. Move $Q(s,a)$ a fraction $\alpha$ of the way toward the target.

$$Q(s,a) \leftarrow Q(s,a) + \alpha\,\bigl(\text{target} - Q(s,a)\bigr)$$

Here $r$ is $-1$ for a step and $-100$ for a fall, $\gamma = 0.99$ is the discount and $\alpha = 0.5$ is the step size. If the move ends the episode on the flag, there is no next row and the target is just $r$. This is the update of Watkins (1989), which Sutton and Barto give as Eq. 6.8. Two real updates from the run in the widget:

- **Update 5.** In the start cell the robot moves right, into the cliff. The reward is −100 and it lands back at the start. The largest number in the start row is 0, because the right move in that row has never been tried before. So the target is −100 + 0.99 × 0 = −100, and $Q$ moves from 0 to 0 + 0.5 × (−100 − 0) = −50.
- **Update 6.** In the start cell the robot moves left, into the edge of the grid, and stays put. The reward is −1. The largest number in the start row is now −0.5, because the −50 from update 5 is not the largest. So the target is −1 + 0.99 × (−0.5) = −1.495, and $Q$ moves from −0.5 to −0.5 + 0.5 × (−1.495 + 0.5) = −0.9975.

Both updates come from the recorded update log, and you can step to them in the widget. The −50 stays in the table, and the max ignores it while a better number sits in the same row.

## How credit travels backward

Nothing on this grid pays you for reaching the flag. Every step costs 1, and the last one costs 1 too. So how does the first move learn that going up and then right is a good idea? It learns it from the number next to it: each number is built from its neighbor's number, so what the table knows moves back one cell per update, starting at the flag.

<figure class="article-figure">
<svg viewBox="0 0 480 304" role="img" aria-labelledby="fig-route-t fig-route-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-route-t">The values along the best route, each built from the next</title><desc id="fig-route-d">Thirteen boxes in a row along the best route of the cliff grid. The largest number in each cell grows more negative toward the start: minus one at the last cell, minus 1.99 next to it, down to minus 12.25 at the start. Each equals minus one plus 0.99 times the next.</desc><defs><marker id="fig-route-ai" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#242622"/></marker><marker id="fig-route-ab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#2b6a8e"/></marker><marker id="fig-route-aa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#b44c2c"/></marker><marker id="fig-route-am" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#656b62"/></marker></defs><rect x="0.75" y="0.75" width="478.5" height="302.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><text x="240" y="28" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" fill="#242622" font-weight="700" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="240" dy="0">Each number is −1 plus 0.99 times the next one</tspan></text><rect x="14" y="70" width="31" height="42" fill="#d7e5ee" stroke="#242622" stroke-width="1.3"/><text x="29.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#d7e5ee" stroke-width="3.5" stroke-linejoin="round"><tspan x="29.5" dy="0">−12.2</tspan></text><text x="29.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#d7e5ee" stroke-width="3.5" stroke-linejoin="round"><tspan x="29.5" dy="0">S</tspan></text><rect x="46.5" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="62" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="62" dy="0">−11.4</tspan></text><text x="62" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="62" dy="0">1</tspan></text><rect x="79" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="94.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="94.5" dy="0">−10.5</tspan></text><text x="94.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="94.5" dy="0">2</tspan></text><rect x="111.5" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="127" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="127" dy="0">−9.6</tspan></text><text x="127" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="127" dy="0">3</tspan></text><rect x="144" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="159.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="159.5" dy="0">−8.6</tspan></text><text x="159.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="159.5" dy="0">4</tspan></text><rect x="176.5" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="192" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="192" dy="0">−7.7</tspan></text><text x="192" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="192" dy="0">5</tspan></text><rect x="209" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="224.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="224.5" dy="0">−6.8</tspan></text><text x="224.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="224.5" dy="0">6</tspan></text><rect x="241.5" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="257" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="257" dy="0">−5.9</tspan></text><text x="257" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="257" dy="0">7</tspan></text><rect x="274" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="289.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="289.5" dy="0">−4.9</tspan></text><text x="289.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="289.5" dy="0">8</tspan></text><rect x="306.5" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="322" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="322" dy="0">−3.9</tspan></text><text x="322" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="322" dy="0">9</tspan></text><rect x="339" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="354.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="354.5" dy="0">−3.0</tspan></text><text x="354.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="354.5" dy="0">10</tspan></text><rect x="371.5" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="387" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="387" dy="0">−2.0</tspan></text><text x="387" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="387" dy="0">11</tspan></text><rect x="404" y="70" width="31" height="42" fill="#fff" stroke="#242622" stroke-width="1.3"/><text x="419.5" y="100" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#2b6a8e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="419.5" dy="0">−1.0</tspan></text><text x="419.5" y="84" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><tspan x="419.5" dy="0">12</tspan></text><text x="434.5" y="95" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="700" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="434.5" dy="0">flag</tspan></text><text x="240" y="60" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="240" dy="0">Best route, start at left. Number: largest in the row.</tspan></text><text x="240" y="140" font-family="Arial, Helvetica, sans-serif" font-size="12.5" text-anchor="middle" fill="#242622" font-weight="400" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="240" dy="0">Last cell: −1.0, one step from the flag.</tspan><tspan x="240" dy="17.0">Next to last: −1 + 0.99 × (−1.0) = −1.99.</tspan></text><text x="240" y="186" font-family="Arial, Helvetica, sans-serif" font-size="12.5" text-anchor="middle" fill="#242622" font-weight="400" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="240" dy="0">Start: −1 + 0.99 × (−11.36) = −12.25. That is all 13 step</tspan><tspan x="240" dy="17.0">costs, with later ones counted a little less.</tspan></text><text x="240" y="232" font-family="Arial, Helvetica, sans-serif" font-size="12.5" text-anchor="middle" fill="#b44c2c" font-weight="700" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="240" dy="0">A fall sends you back to the start. Its exact value:</tspan><tspan x="240" dy="17.0">−100 + 0.99 × (−12.25) = −112.1.</tspan></text><text x="240" y="276" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="middle" fill="#656b62" font-weight="400" paint-order="stroke" stroke="#f1f2ed" stroke-width="3.5" stroke-linejoin="round"><tspan x="240" dy="0">Finished table of one recorded run (seed 202, 10,000 updates).</tspan><tspan x="240" dy="15.0">Fixed: grid and table. Moves: the cell. These are step costs.</tspan></text></svg>
<figcaption>The finished table of the recorded run (seed 202, 10,000 updates), along the 13 cells of the best route. Each number is −1 plus 0.99 times the number after it. These are step costs, so the numbers are negative and the start holds the cost of the whole trip.</figcaption>
</figure>

The route chart in the widget shows how those numbers fill in, and the recorded run gives these readings:

- **Update 185.** The robot reaches the flag for the first time, and the cell next to the flag gets its first non-zero number on the move that reached it, −0.5.
- **Too hopeful at first.** Every number starts at 0 and every real number is negative, so the table starts too optimistic and the numbers sink toward the exact values.
- **Exact from the flag backward.** At 1,000 updates no route number matches the exact value yet. At 2,000 only the number next to the flag does, and the start cell reads −9.7. At 3,000 the last 10 route numbers match and the start cell reads −12.25.
- **Update 10,000.** All 13 route numbers match the exact values, which I computed separately by value iteration.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-table-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-table-202-desktop.mp4"></video><figcaption><b>A finished table on a cliff walk: the robot follows the largest number in each cell</b>Arrows show the move with the largest number in each cell. The robot walks them with no random moves, from the start at the bottom left to the flag. Simulation, one real recorded run, the same run as the widget.</figcaption></figure>
</div>

## Where Q-learning works

- **Designed for.** Learning the value of the best way to act from experience alone, with no model of how the world responds (Watkins 1989; Sutton and Barto, Section 6.5).
- **Assumes a small table.** One number per situation and move. That fits 37 cells and doesn't fit a camera image.
- **Assumes every move keeps being tried.** In every situation, again and again. The step sizes also have to shrink in a particular way, with their sum infinite and the sum of their squares finite.
- **Assumes guessing from a guess is fair.** The target uses your own estimate of the next row. Part 2 explains why that works and what it costs.

Under these conditions, plus bounded rewards, Watkins and Dayan (1992) prove that the table converges to $q_*$ with probability 1. Then $V_Q$ equals $v_*$ and the greedy move is optimal in every cell.

## The mirage: the largest number lies

Let's build a world where the largest number misleads.

- **Two doors.** The right door ends the episode with reward 0.
- **A worse left door.** The left door leads to ten slot machines, each paying −0.1 on average with noise, and then the episode ends.
- **Noisy numbers.** Each machine's number is a noisy average of a few payouts, so by luck some of the ten read high. The target for the left door uses the largest, which is the luckiest one and sits above the true −0.1.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="mirage-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/mirage-202-desktop.mp4"></video><figcaption><b>The robot goes through the worse door most of the time at first, then drifts to the better one</b>One episode per door choice. The labels show each door's share of the episodes so far. Simulation, one real recorded run.</figcaption></figure>
</div>

Averaged over 300 runs, the robot took the left door in about 85% of episodes during the first tenth of each run. By the end that was down to about 11%, and random tries alone account for about 5%. The average estimate for the left door was still above the true −0.1 at the end. Sutton and Barto call this maximization bias and use this setup as their Example 6.7. Their fix, Double Q-learning, uses one table to choose the machine and another to rate it, and I didn't re-run that fix for this article.

## Where Q-learning breaks

- **A finished run isn't a finished table.** After 2,000 updates the arrows already trace the 13-step route, but the start cell reads −9.7 against the exact −12.2. After 10,000 updates all 13 route cells are exact, yet in 4 of the 37 cells the favorite move isn't an optimal one, and 13 cells have a largest number off by more than 0.01. All of them are in the top two rows, which the robot updated 35 to 127 times per cell against 507 or more for the route.
- **The step size isn't the theorem's.** This run keeps the step size fixed at 0.5, which the shrinking-step condition doesn't cover. The world has no randomness, and the route numbers settle anyway.
- **Exploring next to a cliff costs falls.** The run fell 171 times in 10,000 updates. The 150 falls after update 2,000 all came from random moves, and the table's own walk never falls. Part 4 asks what target fits this.
- **A table has one row per situation.** 37 cells give 148 numbers. Add a second robot or a speed to the situation and the rows multiply. Part 3 replaces the table with a formula.
- **The largest of noisy numbers runs high.** That's the mirage above.
- **A guess, a formula and old data together can blow up.** Part 5 shows that failure.

## Pros and cons

What Q-learning gives you:

- **No model needed.** It learns from the moves it makes and what comes back.
- **Learns after every step.** It doesn't wait for an episode to end.
- **Learns the best route while acting otherwise.** The run above learned the 13-step route while one move in ten was random.
- **Easy to read and check.** You can print the table, as above, and compare it with the exact values.
- **A guarantee for small tables.** Under the conditions above, it converges to $q_*$.

What it costs:

- **Rows grow with the situations.** A table doesn't scale to large worlds.
- **Every move has to be tried many times.** Near a cliff, that means falls while learning.
- **Slow to settle.** The arrows took about 2,000 updates here and the route numbers took up to 10,000. Cells off the route had not settled after 10,000.
- **The max is biased high** when the numbers are noisy.
- **The guarantee stops at tables.** A formula in place of the table loses it.

<details>
<summary>Source checks and what each claim depends on</summary>

All section and equation numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), which I checked in the published text. The 1992 paper is Watkins and Dayan, [*Q-learning*](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf), Machine Learning 8, pages 279 to 292. I read it as page images.

- **Action values and the policy.** Section 3.6 defines $q_*(s,a)$ as the expected return for taking action $a$ in state $s$ and thereafter following an optimal policy. Eq. 3.17 and Eq. 3.20 give $q_*(s,a)$ in terms of $v_*$ and in the Bellman optimality form with a max over the next action. The book says that with $q_*$ an agent can simply choose an action that maximizes $q_*(s,a)$, and that the action-value function caches the results of all one-step-ahead searches, so no model of the environment is needed to act.
- **The update.** Section 6.5, Eq. 6.8. The book says $Q$ directly approximates $q_*$ regardless of the policy followed, and that all that is needed for convergence is that all pairs continue to be updated.
- **The value and the best policy.** Watkins and Dayan, pages 280 and 281: $V^*(x) = \max_a Q^*(x,a)$, and if an action $a^*$ attains the maximum, the policy that takes $a^*$ in $x$ is optimal. The $Q^*$ values are unique.
- **Unfinished estimates.** Watkins and Dayan, page 281, say that in the early stages of learning the Q values may not accurately reflect the policy they implicitly define. Their update uses the best the agent thinks it can do from the next state.
- **The convergence theorem.** Watkins and Dayan, page 282. The conditions: rewards bounded, learning rates at least 0 and below 1, the sum of the learning rates for each pair infinite, and the sum of their squares finite. Then $Q_n(x,a) \to Q^*(x,a)$ with probability 1. The abstract adds that all actions must be repeatedly sampled in all states and that the action values are represented discretely. Page 281 notes, citing Watkins' 1989 thesis, that Q-learning may not converge correctly for other representations. I did not read the thesis itself.
- **Maximization bias.** Sections 6.7 and Example 6.7 of Sutton and Barto: a maximum over noisy estimates is biased upward, and Q-learning takes the left action far more often than it should early in learning. Double Q-learning is their fix. In the book the left action leads to many choices with mean $-0.1$. The game uses ten.
- **The mirage numbers I did not carry over.** My earlier notes held 82% and 13% for the mirage. They came from logged results with other seed sets. I re-ran the level configuration instead. See the exact numbers below.

</details>

<details>
<summary>This run: data, settings and command</summary>

The table in the widget is one recorded run, re-run for this article so that its intermediate tables exist. The game's earlier saved runs hold only the final table.

- **Source.** The table and the clips come from [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), a small game I made. I used its own `RLA.run` code at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73), imported unchanged. I wrapped the learner in a separate script only to record its table and each update.
- **Settings.** World `cliff` (4 by 12, step cost 1, fall cost 100, no slip), Q-learning with a table, step size 0.5, discount 0.99, one random move in ten, 10,000 steps, seed 202. These are the game's `careful-q` settings.
- **Check.** The final table of the re-run equals the saved table of the recorded seed-202 run in all 192 entries. The clip above shows that same recorded run.
- **Recorded.** The full table after updates 0, 1, 5, 20, 100, 185, 300, 1,000, 1,670, 2,000, 3,000 and 10,000, and every update from 1 to 10,000 (cell, move, reward, next cell, new number). The widget replays updates 1 to 400 from that log and shows four later snapshots (1,000, 1,670, 2,000 and 10,000 updates).
- **Command.** `SEED=202 node pilot-v2/snapshots.js > pilot-v2/snapshots-seed202.json`, then `node pilot-v2/make-widget-data.js` writes the data file that the widget loads. The exact values come from value iteration over the same grid rules (5,000 sweeps, discount 0.99).
- **Greedy walk.** The "walk the arrows" line in the widget breaks ties by taking the first move in the order up, right, down, left, and uses no random numbers. The first update after which the walk reaches the flag is 1,670, in 17 steps. The first after which it takes the shortest route of 13 steps is 1,998.

The finished table, all 37 cells a robot can stand on, is below. Cells are (row, column) with the row counted from the top, and the last column holds the exact best value for comparison.

| Cell | Up | Right | Down | Left | Exact best |
| --- | ---: | ---: | ---: | ---: | ---: |
| (0, 0) | -11.69 | -11.58 | -11.64 | **-11.47** | -13.13 |
| (0, 1) | **-11.22** | -11.25 | -11.31 | -11.31 | -12.25 |
| (0, 2) | -10.97 | **-10.59** | -10.75 | -11.19 | -11.36 |
| (0, 3) | **-9.78** | -9.81 | -10.06 | -10.78 | -10.47 |
| (0, 4) | -9.33 | -9.06 | **-9.03** | -9.23 | -9.56 |
| (0, 5) | -8.46 | **-8.30** | -8.41 | -8.76 | -8.65 |
| (0, 6) | -7.90 | **-7.48** | -7.59 | -8.20 | -7.73 |
| (0, 7) | -6.66 | **-6.62** | -6.67 | -7.38 | -6.79 |
| (0, 8) | -6.25 | **-5.74** | -5.77 | -5.76 | -5.85 |
| (0, 9) | -4.87 | -4.84 | **-4.83** | -5.59 | -4.90 |
| (0, 10) | -3.93 | **-3.91** | -3.92 | -4.18 | -3.94 |
| (0, 11) | -3.45 | -3.57 | **-2.97** | -3.56 | -2.97 |
| (1, 0) | **-11.95** | -12.04 | -12.02 | -12.15 | -12.25 |
| (1, 1) | -11.62 | -11.32 | **-11.30** | -11.90 | -11.36 |
| (1, 2) | -10.73 | **-10.46** | -10.46 | -10.67 | -10.47 |
| (1, 3) | -10.26 | **-9.56** | -9.56 | -9.79 | -9.56 |
| (1, 4) | -9.20 | **-8.65** | -8.65 | -9.48 | -8.65 |
| (1, 5) | -8.59 | -7.73 | **-7.73** | -8.28 | -7.73 |
| (1, 6) | -8.10 | **-6.79** | -6.79 | -8.14 | -6.79 |
| (1, 7) | -6.91 | -5.85 | **-5.85** | -6.80 | -5.85 |
| (1, 8) | -5.57 | -4.90 | **-4.90** | -5.08 | -4.90 |
| (1, 9) | -5.07 | **-3.94** | -3.94 | -5.56 | -3.94 |
| (1, 10) | -3.70 | -2.97 | **-2.97** | -4.63 | -2.97 |
| (1, 11) | -2.08 | -2.48 | **-1.99** | -2.67 | -1.99 |
| (2, 0) | -12.68 | **-11.36** | -13.11 | -12.25 | -11.36 |
| (2, 1) | -12.11 | **-10.47** | -112.12 | -12.25 | -10.47 |
| (2, 2) | -11.35 | **-9.56** | -112.12 | -11.36 | -9.56 |
| (2, 3) | -10.45 | **-8.65** | -112.13 | -10.47 | -8.65 |
| (2, 4) | -9.56 | **-7.73** | -112.10 | -9.56 | -7.73 |
| (2, 5) | -8.65 | **-6.79** | -112.13 | -8.65 | -6.79 |
| (2, 6) | -7.72 | **-5.85** | -112.10 | -7.73 | -5.85 |
| (2, 7) | -6.79 | **-4.90** | -112.12 | -6.79 | -4.90 |
| (2, 8) | -5.85 | **-3.94** | -112.12 | -5.85 | -3.94 |
| (2, 9) | -4.90 | **-2.97** | -112.11 | -4.90 | -2.97 |
| (2, 10) | -3.94 | **-1.99** | -111.99 | -3.94 | -1.99 |
| (2, 11) | -2.97 | -1.99 | **-1.00** | -2.97 | -1.00 |
| (3, 0) | **-12.25** | -112.13 | -13.13 | -13.13 | -12.25 |

</details>

<details>
<summary>Exact numbers: mirage and cliff table</summary>

All numbers come from the game's own `RLA.run` code at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73), with the level settings of the game. This is a re-run of settings the game already uses, not a new experiment.

**Mirage.** State A has two doors. The right door ends the episode with reward 0. The left door gives reward 0 and leads to state B with ten machines, each paying on average $-0.1$ with standard deviation 1. Q-learning, a table, random moves with probability 0.1, step size 0.1, no discount, 600 steps per run, 300 runs. Episodes last 1 or 2 steps, so runs hold about 467 episodes on average. Share of episodes through the left door: 85.0% in the first tenth of each run's episodes, 11.3% in the last fifth. The estimate for the left door at the end, averaged over runs: $-0.036$, against a true value of $-0.1$. Random tries alone would send it left in about 5% of episodes (a random move picks the left door half the time, and one move in ten is random). I did not run a version without the max over machines, so the cause is the book's explanation and not something I separated here.

**Cliff table, twenty runs.** Twenty recorded runs of Q-learning with a table, random moves with probability 0.1, step size 0.5 and discount 0.99, 10,000 steps. The best route takes 13 steps and has a discounted value of $-12.2479$. I computed the exact optimal values for the grid by value iteration. In all 20 runs the largest number in the start cell was $-12.2479$, and the greedy walk reached the flag in 13 steps. Along the best route, 13 numbers per run, all 20 runs agreed with the exact values to better than $10^{-13}$. The table has 192 numbers per run. The 44 that stay at zero belong to the cliff cells and the flag, which a robot never stands on. In the cells a robot can stand on, the favorite move of the table matched an optimal move in 34.5 of 37 cells on average. I did not examine why the rest differ. The numbers for stepping off the route into the cliff were between $-112.13$ and $-110.2$; the exact value is $-112.13$.

**Seed 202 against the exact values.** In the run shown in the widget, 33 of the 37 cells have an optimal favorite move, the four others are cells (0,0), (0,1), (0,3) and (1,0), and the largest difference between any of its 148 numbers and the exact one is 2.68. In that run the start cell was updated 767 times, the cells of row 2 between 507 and 739 times, and the cells of rows 0 and 1 between 35 and 127 times. The run fell 171 times in 10,000 updates, 21 of them in the first 2,000.

</details>

<details>
<summary>How the clips were made</summary>

Each clip is a real recorded run drawn by a real browser with the game's own `web/scenes.js` at the same commit, unmodified, using the game's own sprites and fonts. I replaced only the clock, so that the scene runs at a fixed 30 frames per second, and I encoded the frames with ffmpeg (H.264). The mirage clip comes from re-running the level settings of the game, as above. The cliff clip is the finished table and the final test of the same recorded run that part 2 uses for its first clip, without the training walks. The run script and raw results are stored locally and are not published.

</details>

<script src="/assets/robotics/rl/qtable-data.js" defer></script>
<script src="/assets/robotics/rl/qtable.js" defer></script>
<script src="/assets/robotics/rl/rl-videos.js" defer></script>
