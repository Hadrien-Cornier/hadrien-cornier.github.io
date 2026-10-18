---
title: 'On-policy or off-policy?'
description: 'What changes when a learning target describes the robot that is acting, not the best robot.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, one idea at a time'
part: 4
layout: essay
---

Two simulated robots walk along a cliff to a flag. Both keep the same table. One word of the update differs.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-q-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-q-202-desktop.mp4"></video><figcaption><b>Q-learning: it learns the edge path and still falls on the way</b>The first walk, a late walk, then the final test with no random moves. The arrows show the favorite move in each cell. In this late walk the robot falls once. Simulation, one real recorded run.</figcaption></figure>
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-sarsa-101" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-sarsa-101-desktop.mp4"></video><figcaption><b>Sarsa: it keeps away from the edge while it learns</b>The same three phases: a first walk, a late walk and the final test. Here the late walk has no fall, and the final test takes the top row. This is another run, from a different seed. The falls per walk over 20 runs are in the text. Simulation, one real recorded run.</figcaption></figure>
</div>

The clips are recorded runs of [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/). A step costs 1, a fall costs 100 and sends the robot back to the start, and each robot makes a random move one time in ten while it learns. The rest of the article explains the one word.

## The question: whose behavior does the target describe

The question for this article is: should a learner's target describe the behavior that collects the data, or a better behavior? Two terms make the question exact. A **policy** is a rule for acting. The **behavior policy** is the rule that picks the robot's actions, so it decides which data arrive. Here it is: take the action with the largest number, but one time in ten move at random. The **target policy** is the rule that the update's target describes. If both are the same rule, learning is **on-policy**. If they differ, it is **off-policy**.

## Two targets

Part 1 gave the Q-learning target. After it takes action $a$ in situation $s$, the robot lands in $s'$ and looks at the row of $s'$:

$$\text{target} = r + \gamma \max_{a'} Q(s',a')$$

In words: assume that from $s'$ the robot takes the action with the largest number. That describes a robot that never moves at random. The target policy is the greedy rule, and the behavior policy is the greedy rule with random moves. So Q-learning is off-policy.

Sarsa changes one word. It uses the action that the robot really takes next, random moves included:

$$\begin{aligned}\text{target} &= r + \gamma\, Q(s',a') \\ a' &= \text{the action taken next}\end{aligned}$$

In words: the guess describes the robot that is really acting. The target policy equals the behavior policy, so Sarsa is on-policy. The name comes from the sequence state, action, reward, state, action.

Off-policy does not mean replay or old data. Q-learning is off-policy even when it learns from each move right after the move. The data come from the current robot, and the target still describes a different rule. What matters is the gap between the rule that acts and the rule that the target describes.

## What the cliff shows

A fall sends the robot back to the start. The shortest route takes 13 steps and runs along the row next to the cliff. One random move there can push the robot over the edge.

I ran 20 robots of each kind for 10,000 steps, with the table and one random move in ten. In the second half of training, Q-learning fell 0.318 times per walk, and Sarsa fell 0.061 times per walk.

The tables show why. Look at the column in the middle of the grid. For Q-learning, the largest number in the cell next to the cliff is the best of the three rows: -6.8, against -8.2 in the top row. For Sarsa, the order flips: -14.0 next to the cliff and -11.9 in the top row. The Sarsa number counts the falls that random moves cause, so it ranks the edge below the top row.

The finished robots show the price. In the final test with no random moves, all 20 Q-learning robots walk the 13-step edge route. Of the 20 Sarsa robots, 12 reach the flag along the top row in 17 or 19 steps, and 8 do not reach the flag in 200 steps. I did not examine why. Averaged over the last quarter of the tests and over the runs, the score was -13 for Q-learning and -82 for Sarsa. Describing the acting robot bought fewer falls while learning. It cost a longer route, and a worse final test in these runs.

## The target follows the behavior

Now change only the behavior: remove the random moves. Sarsa then learns the 13-step edge route in all 20 runs and, in the second half of training, falls 0.000 times per walk. Its target describes a robot that no longer slips, so the edge is safe again. Q-learning ends on the same route, because its target never described the random moves.

Without random moves, the robots still try untested actions, because the table starts at zero and an untested action looks as good as any other. So this is not a robot that never explores.

The two words answer different questions. Sarsa answers: how good is this situation if I keep acting the way I act now? Its number changes when the behavior changes, even in the limit. Q-learning answers: how good is this situation if I act greedily from here on? Its target uses the current largest number in the next row, not a known best action. Under the book's conditions, including that every pair is tried often enough, the numbers it aims at are the optimal ones, whatever behavior collects the data. A finite table is not at that point yet. How close it gets, and where it is wrong, still depends on which data the behavior collected.

A third word sits between them. Expected Sarsa averages the next row by the probabilities of the behavior, instead of using one sampled action. In these runs it fell 0.038 times per walk, and all 20 robots reached the flag in 15 steps. In the book it is on-policy in the cliff results. If its target policy is the greedy rule, it is exactly Q-learning. So the target policy is a choice, not a switch.

## Which target to choose

The choice depends on which robot you care about. If random moves stay on, as for a real arm that must keep exploring and where every fall is a crash, a target that describes that robot measures the falls you will pay. If the robot will act greedily later, a target that describes the greedy rule finds the best route for it. The book notes that both methods would converge to the optimal policy if the random moves were gradually reduced. In my runs the random moves stayed at one in ten, and I did not test a reduction.

## What I could not explain

A target that matches the behavior does not make learning safe. I ran the Sarsa target with the neural network on the balance task of part 3, with one-step updates, no memory of old moves and no frozen copy. The score was 9.4 of 200. The largest estimate at the end was between 0.8 and 1.9 million in the five runs, and the discounted return can be at most 100 in this world, so any estimate far above 100 is wrong. The network with the Q-learning target ended at 9.4 and 2.1 million. So changing the target to describe the acting robot did not stop the blow-up in this network.

The book proves convergence for on-policy updates with a linear formula, under conditions. My network is not linear, and its behavior changes as its estimates change. I do not know which difference matters here, and I offer no cause. Part 5 puts bootstrapping, a formula and off-policy data together.

## What this shows, and what it does not

A target describes some policy. Q-learning describes the greedy rule, Sarsa describes the rule that acts, and the difference showed up as falls while learning, as the route each robot found, and as which cell looked best. Off-policy means that the target and the behavior differ. It does not mean replay or old data.

On the cliff, 20 runs per kind and one setting say this: the on-policy target fell less while learning, and in my runs it finished worse. The evidence is one world, one random-move rate and 20 tables. The network result is a limit: an on-policy target did not make this network stable, and I did not find out why.

<details>
<summary>Source checks and what each claim depends on</summary>

All section numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), which I checked in the published text.

- **Behavior and target policy.** Section 5.5: the policy being learned about is the target policy, the policy that generates behavior is the behavior policy, and learning from data off the target policy is off-policy learning. On-policy methods are the special case where the two are the same. The book also says that off-policy data can come from a non-learning controller or a human expert. This is why the article does not tie the term to replay.
- **Sarsa.** Section 6.4 gives the update with the action taken next. It converges with probability 1 to an optimal policy under the usual step-size conditions, if every state-action pair is visited infinitely often and the policy converges in the limit to the greedy policy. My runs keep the random moves at one in ten, so that condition is not met and they illustrate the book's on-policy compromise, not its convergence result.
- **Q-learning and the cliff.** Section 6.5 and Example 6.6: Q-learning learns the values of the optimal policy, and its online performance is worse than that of Sarsa, which learns the longer but safer path through the upper part of the grid. If the random-move rate were gradually reduced, both would asymptotically converge to the optimal policy. Exercise 6.12 asks whether Q-learning is Sarsa when action selection is greedy. I did not use it.
- **Expected Sarsa.** Section 6.6: it uses the expected value over next actions under the policy. In the cliff results it was used on-policy. If the target policy is greedy while the behavior is exploratory, it is exactly Q-learning.
- **Function approximation.** Section 9.4: for on-policy training with a linear formula, semi-gradient TD(0) converges to the TD fixed point. The text near Eq. 9.14 says one-step semi-gradient action-value methods such as semi-gradient Sarsa(0) converge to an analogous fixed point and bound, with technical conditions that it omits. I did not read the proofs. The statement that the game's network differs (nonlinear, with a changing policy) is a description of the game, not a diagnosis.
- **The deadly triad.** Section 11.3 names it. The article only points to it.
- **My reading, not the book's.** The sentence that the Sarsa number ranks the edge lower because it counts the falls from random moves is the book's explanation applied to my tables. I checked the order of the numbers, not the mechanism alone.

</details>

<details>
<summary>Exact numbers: falls, routes, cell values and the network arm</summary>

All numbers come from the saved results of the game's own `RLA.run` code at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73) with the settings of the level "Falling while learning". I recomputed each from the raw records. This is not a new experiment.

**Setup.** A cliff grid of 4 rows and 12 columns, a step costs 1, a fall costs 100 and sends the robot to the start, a walk ends at 200 steps. A table, step size 0.5, discount 0.99, random moves with probability 0.1 (the "no random moves" arms set it off), 10,000 steps, 20 seeds (101 to 2020 in steps of 101). The cliff cells are the bottom row from column 2 to column 11, and the best route has a discounted value of -12.2479.

**Falls while learning.** Falls per walk over the walks that ended in the second half of the 10,000 steps, pooled over the 20 runs:

| Learner | Falls per walk (pooled) | Mean of the 20 per-run values | Walks counted |
| --- | --- | --- | --- |
| Q-learning | 0.318 | 0.319 | 5,904 |
| Sarsa | 0.061 | 0.067 | 4,029 |
| Expected Sarsa | 0.038 | 0.038 | 5,801 |
| Q-learning, no random moves | 0.000 | 0.000 | 7,691 |
| Sarsa, no random moves | 0.000 | 0.000 | 7,695 |

The game's own summary field gives 0.30, 0.10 and 0.00 for the first three rows. It uses the last half of the walks by count and not the second half of the steps, and I did not trace the rest of the difference. Part 2 uses the pooled values above.

**Score and routes.** The score is the mean of the last quarter of the test points of each run (10 of 40), then the mean and sample standard deviation over the 20 runs. The route is the final greedy test of each run.

| Learner | Score | Final tests that reach the flag | Route length and row |
| --- | --- | --- | --- |
| Q-learning | -13.0 ± 0.0 | 20 of 20 | 13 steps, row next to the cliff |
| Sarsa | -82.1 ± 47.3 | 12 of 20 | 17 steps (11 runs) or 19 steps (1 run), top row |
| Expected Sarsa | -15.0 ± 0.0 | 20 of 20 | 15 steps, second row |
| Q-learning, no random moves | -13.0 ± 0.0 | 20 of 20 | 13 steps, row next to the cliff |
| Sarsa, no random moves | -13.0 ± 0.0 | 20 of 20 | 13 steps, row next to the cliff |

The 8 Sarsa runs that did not reach the flag took no fall in the test. Their final positions and the number of distinct cells visited differ from run to run (from 1 to 14 cells). I did not examine why.

**Largest number in a cell, mean over the 20 finished tables** (min to max across runs in brackets). Column 6 counts from 1, so the middle of the grid. Discounted values.

| Cell | Q-learning | Sarsa | Expected Sarsa | Sarsa, no random moves |
| --- | --- | --- | --- | --- |
| Start | -12.25 (all runs) | -19.88 (-25.17 to -17.18) | -16.06 | -12.25 |
| Row next to the cliff | -6.79 (all runs) | -14.02 (-25.14 to -8.98) | -9.86 | -6.79 |
| Second row | -7.73 | -13.34 (-21.51 to -10.09) | -8.86 | -7.26 |
| Top row | -8.17 | -11.92 (-22.08 to -9.19) | -9.25 | -7.42 |

The Sarsa numbers vary a lot between runs. The order edge below top row holds on the mean, and I did not count in how many runs it holds.

**The network arm.** One-step updates on a live network, no memory and no frozen copy, 20,000 steps, 5 seeds (101 to 505). The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of test points. The largest estimate is at the last test point.

| Arm | Target | Score | Largest estimate at the end (per run) |
| --- | --- | --- | --- |
| `explode-naive-net` | max (Q-learning) | 9.4 ± 0.2 | 2.1 million (median), 2.08 to 2.42 million |
| `net-sarsa` | action taken next (Sarsa) | 9.4 ± 0.2 | 0.92 million (median), 0.80 to 1.90 million |
| `net-sarsa-replay` | action taken next, with replay | 70.0 ± 30.5 | 263 (median), 67 to 1,780 |

The two arms without replay used the same data mode (latest move), the same random-move schedule (1.0 down to 0.05 over 5,000 steps) and the same budget. Their different target rules make different policies, so the runs gathered different trajectories. The third arm uses stored moves whose next actions came from older behavior, so the Sarsa target there no longer describes the current robot. I did not test whether that explains its result. The discounted return in this world is bounded above by 100 (reward 1 per step at discount 0.99, the sum of 0.99 to the power k over all steps). It is an upper bound for the discounted return, not a value that a capped episode attains. Part 2 reports a largest estimate near 2 million for the Sarsa network, which is the highest of the five runs at the end. The median is lower.

**Limits.** The cliff arms use 20 seeds and one setting. I did not tune the step size (0.5) or test any other random-move rate or a shrinking one.

</details>

<details>
<summary>How the clips were made</summary>

Each clip is a real recorded run drawn by a real browser with the game's own `web/scenes.js` at the same commit, unmodified, using the game's own sprites and fonts. I replaced only the clock, so that the scene runs at a fixed 30 frames per second, and I encoded the frames with ffmpeg (H.264). The Q-learning clip is the one from part 2: seed 202, the first walk, the last recorded training walk (one fall) and the final test. The Sarsa clip is the same layout for seed 101: the first walk (9 falls), the last recorded training walk (no fall) and the final test (17 steps). The seeds differ. In seed 101 Sarsa takes the top route, as 12 of the 20 runs do. The falls per walk in the text come from all 20 runs, not from the clips. The run script and raw results are stored locally and are not published.

</details>

<script src="/assets/robotics/rl/rl-videos.js" defer></script>
