---
title: 'What information can a reinforcement learner use?'
description: 'A short model for the words in Breaking Bellman: data weight, real rewards, and the guess that follows.'
date: '2026-10-16'
draft: false
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: /assets/robotics/thumbnails/what-information-can-a-reinforcement-learner-use.jpg
thumbnail_alt: 'The Breaking Bellman sentence builder shows a fixed share, four real rewards, live action selection, a frozen scorer, and refresh every 250 updates.'
---

One high payout can increase the estimate for a door that loses money on average. How much can one payout change that estimate?

In [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), level 6, **The mirage**, Right gives zero. Left leads to machines with a fixed mean payout of −0.1. Random payouts and a mean that changes are different problems.

**A long history filters noise but responds slowly to change. More real rewards replace a guess with one sampled future. A frozen copy slows changes to the guess. `Scored by a second estimate` can avoid the high error that caused action selection.** Each setting exchanges one source of error for another.

A **target** is the reference value for an update. The estimate moves closer to it. The target can contain observed rewards plus a **guess** for the rewards that follow. The three settings control data weight, reward count, and the guess.

![The Breaking Bellman sentence builder shows a fixed share, four real rewards, live action selection, a frozen scorer, and refresh every 250 updates.](/assets/robotics/what-information-can-a-reinforcement-learner-use/sentence-words.png "An excerpt from the game's words, before a run. This configuration does not report performance.")

## The weight of new data

This **invented example** uses `all rewards to the end`. A full return sums observed rewards, with the discount applied. Left's target is its machine payout. The level's starting sentence instead maximizes noisy machine estimates. Full returns remove that maximum.

Left's estimate is −0.1 after 1,000 targets. The next target is +1. The table shows the effect of the two table-update rules.

| Game word | New estimate |
|---|---:|
| `to the average of its targets` | About −0.0989 |
| `a fixed share (α)`, with α = 0.1 | +0.01 |

The fixed share makes Left look better than Right's zero. It weights recent targets more. The sample average weights all processed targets equally.

For independent targets from a fixed distribution, the sample average converges to the mean. A fixed positive share remains sensitive to payout noise. If the mean changes to +0.5, that sensitivity helps the estimate follow the change. The full-history average responds more slowly. [Sutton and Barto, section 2.5](https://www.andrew.cmu.edu/course/10-703/textbook/BartoSutton.pdf) give these update rules.

When the mirage sentence uses a guess, Left's target changes with the machine estimates. The payout means can stay fixed throughout.

The game's `random old moves from memory` is replay. It reuses stored experience. The sample-average counter includes replay updates. One payout used 100 times is not 100 independent observations.

<details>
<summary>The update equation and sampling assumptions</summary>

The two table rules use

$$
Q_{\mathrm{new}}=Q_{\mathrm{old}}+\alpha(y-Q_{\mathrm{old}}).
$$

Here, $y$ is the target. The sample average uses $\alpha=1/N$ on update $N$ of that state-action entry. The fixed share above uses $\alpha=0.1$.

Independent targets from a fixed distribution with finite variance are sufficient for this sample-mean argument. Replay updates are not independent environment observations.

</details>

## The number of real rewards

With `4 real rewards, then a guess`, four observed rewards replace part of the guess. Eight rewards replace more. More observations use less of a guess, but include more sampled events and postpone the update.

The CartPole levels, **Too many cells** and **Values explode**, use +1 per step by default. The failure step also gives +1. The discount, 0.99, gives less weight to rewards that follow.

Here is an **invented sequence**, for the update of the first push. A random bad push at step six causes a fall at step seven. The eight-step target uses the seven observed rewards and equals about **6.8**. The four-step target, with a guess of 50 after step four, equals about **52.0**.

The short target replaces this sampled fall with a guess. A guess of 50 can miss a real fall risk. This example does not identify which target is closer to expected return.

At the default 200-step limit, a full return requires at most 200 observed steps. Failed attempts can end sooner and give smaller returns. Resets permit more attempts, but a fall removes future rewards. Exploration has a cost.

<details>
<summary>The numbers and the action rule inside a long target</summary>

The eight-step target ends at the fall: $\sum_{k=0}^{6}0.99^k\approx6.7935$. The four-step target is $\sum_{k=0}^{3}0.99^k+0.99^4\times50\approx51.9702$.

The action rule is its policy. Long targets include more actions from the policy that collected them. Exploration and replay data from previous policies can change what they estimate. The game does not correct those segments to represent a different policy. See [Sutton and Barto, chapter 7](https://www.andrew.cmu.edu/course/10-703/textbook/BartoSutton.pdf).

With `all rewards to the end`, this game uses the finite observed return even at a time limit. It adds no guess for rewards after the limit.

</details>

## The source of the guess

The game separates `chosen by` from `scored by`. The first selects the next action inside the target. The second supplies its estimated value. `The live estimate` is the estimate that the update trains.

Two different problems can occur here: rapid target changes and selection bias.

For rapid changes, this **invented example** uses one stored transition. Its guess changes from 10 to 14. `A frozen copy` keeps 10 until refresh, which gives the learner a more stable target. This is why [DQN](https://deepmind-media.storage.googleapis.com/dqn/DQNNaturePaper.pdf) uses a target network.

A frozen scorer alone does not keep the full target fixed. A live selector can change the action. For the best-next-action target, frozen selection and evaluation keep each stored transition's target fixed between refreshes. This applies to each trained estimate.

For selection bias, the table gives **invented estimates**. The two actions have true value 10.

| Estimate | Left | Right |
|---|---:|---:|
| Live | 14 | 9 |
| Frozen | 13 | 8 |
| Second | 9 | 11 |

Live selects Left because of its positive error. Frozen scores Left at 13 and keeps much of that error. Second scores Left at 9. Second also overvalues Right, at 11. That error does not enter this target because Live did not select Right.

This is the idea behind [Double Q-learning](https://proceedings.neurips.cc/paper_files/paper/2010/file/091d584fced301b442654dd8c23b3fc9-Paper.pdf). Different estimates perform selection and evaluation. Their errors can remain correlated, so the second scorer is not a guarantee of accuracy.

**A frozen copy slows target movement. A different scorer can decrease selection bias. A stable estimate can still be too high.** The `Try every combination` table helps compare these settings, with the limits below.

<details>
<summary>The comparison table and the second estimate</summary>

With only `chosen by` and `scored by` selected, rows select the target's action and columns score it. Physical actions use the live estimate or the average of two separately trained estimates, called twins.

The game calls the second twin independent. Each update trains one, but the twins use the same experience stream and have symmetric roles. "Second" does not identify greater accuracy.

For CartPole, uncertainty is standard error across seeds, not target movement. Three seeds cannot establish a general ranking or explain a score difference.

The column `the smaller of live and second` uses a [minimum](https://proceedings.mlr.press/v80/fujimoto18a/fujimoto18a.pdf). This can decrease overestimation but can also give values that are too low.

[Double DQN](https://arxiv.org/pdf/1509.06461) selects with the live network and evaluates with a frozen copy. That copy shares the live network's history, so their errors can remain correlated.

</details>

## The costs behind the words

The same model gives four checks before the next run.

| Game setting | Benefit | Cost |
|---|---|---|
| Average targets / fixed share | Filter noise / follow change | Slow response / persistent noise |
| More real rewards | Use less of a guess | More sampled events and delay |
| Frozen copy and refresh | Slow target movement | Past estimates; errors can remain |
| Different `chosen by` and `scored by` estimates | Decrease selection bias | Estimates can share errors |

<details>
<summary>A measured mirage failure had a different cause</summary>

**Measured in the game**, October 16: a sentence used four rewards, optimistic starts, no random exploration, and replay with 1,000 moves. Across 300 seeds and 600 steps, its worst-point left-door rate was 56.8%. A change of only `learn from` to `the move just made` gave 3.3%.

The trace showed no updates before 500 stored moves, after the early episodes used by the test. Replay's start delay explains this failure. Four rewards covered the entire two-step episode. No guess remained, so the next-action, `chosen by`, and `scored by` words had no effect.

These existing measurements and the screenshot use revision [78a3b45](https://github.com/Hadrien-Cornier/breaking-bellman/tree/78a3b45bd81572dabc7da54658e5c7ebc10d4135). Page feedback can change. The article ran no new experiment.

</details>

## An open question

My **untested hypothesis** is to use eight rewards first, then four, then one. If estimates improve, they could replace more variable sampled futures. But initial exploration also makes long returns variable. Time alone does not identify the best return length.

<details>
<summary>An adaptive method uses feedback about the update</summary>

[Meta-Gradient Reinforcement Learning](https://proceedings.neurips.cc/paper_files/paper/2018/file/2715518c875999308842e3455eda2fe3-Paper.pdf) measures an update on subsequent experience under a fixed objective. It differentiates through that update to adjust return parameters. Gamma controls discount. Lambda mixes return lengths. It does not directly select an integer step count or prescribe a decreasing schedule.

</details>

A useful test compares this schedule with fixed one-, four-, and eight-step returns, with the same interaction budgets and seeds. Switch times must be fixed before the test. Measurements must include mean return and variation across seeds. Does a better guess help the schedule, or does exploration make its long initial returns worse?
