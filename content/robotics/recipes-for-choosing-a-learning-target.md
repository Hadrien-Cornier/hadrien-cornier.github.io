---
title: 'Recipes for choosing a learning target'
description: 'Rules of thumb for a reinforcement learning target: freeze, take a second estimate, or take the minimum, and why the combinations table is one reading, not a law.'
date: '2026-10-17'
updated: '2026-10-20'
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/learning-target-recipes.svg'
thumbnail_alt: 'Four ways to score a target, the separate-update example, and the GAE return-length blend.'
draft: false
layout: essay
---

**Do I need an answer that changes less, or an answer that shares fewer of my errors?** The answer helps decide what scores a learning target. The [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) combinations table measured these choices. Here are the recipes I use, with a number to illustrate each one.

<figure class="article-figure target-recipes-drawing"><a class="figure-link" href="/assets/robotics/rl/learning-target-recipes.svg" aria-label="Open the full learning-target drawing"><img src="/assets/robotics/rl/learning-target-recipes.svg" width="1080" height="760" alt="Four target scorers, their scores for the same action, and a GAE credit calculation." style="display:block;width:100%;height:auto"></a><figcaption>A frozen copy slows change; a second estimate separates errors. GAE blends credit across return lengths.</figcaption></figure>

## Two dials

A **target** is the reference value an update moves toward. There are two dials for the estimate that scores it: **how fast it changes**, and **how much it shares the selector's errors**. Here is where the game's four scorers sit:

| `scored by` | Changes | Shares the selector's errors |
|---|---|---|
| `The live estimate` | every update | all of them |
| `A frozen copy` | only at each refresh | often much (same learning history) |
| `Scored by a second estimate` | when it learns | fewer (separate updates) |
| `The smaller of live and second` | when either learns | fewer, and lowered by construction |

A frozen copy addresses change over time, while a second estimate addresses shared errors. Neither guarantees accuracy.

## The recipes

### Freeze when the target changes too fast

A frozen copy changes only when it is refreshed. If the live guess rises from 10 to 14, the stored copy still scores 10 until the next refresh.

### Take a second estimate when over-estimates win

If the learner keeps trusting actions because of over-estimates, a frozen copy preserves the error it froze. A second estimate can escape that error. In this example, the true values are 10 and 10.

| Estimate | Left | Right |
|---|---:|---:|
| `The live estimate` | 14 | 9 |
| `A frozen copy` | 13 | 8 |
| `Scored by a second estimate` | 9 | 11 |

The live estimate selects Left because it over-estimates its value. The frozen copy still scores that choice too high, at 13, while the second estimate scores it at 9.

### The minimum lowers the target

Taking the smaller of live and second gives the lower number, so live 14 and second 9 produce a target of 9. This helps when over-estimates drive bad choices and hurts when estimates are already accurate.

### Blend the return lengths instead of picking one

These recipes choose who scores the target, but there is also a choice about how far its return looks. A one-step target uses the value estimate just after the move, while a full-return target waits for every reward in the episode. That is the tradeoff between short and long returns: a short return leans on a guess that can be biased, and a long return carries every reward and the noise with it.

**Generalized advantage estimation (GAE)** handles that choice by mixing the errors from many return lengths to estimate how much credit one action earned. Each error is `reward + gamma V(next) - V(now)`, the gap a reward opens in the value estimate. GAE adds them as `delta + gamma lambda delta_next + ...`, so each later error carries one more factor of `gamma lambda`. This estimates action credit. PPO's clip has a different job: it limits the incentive to change the policy, without imposing a hard step bound.

Suppose three moves pay 0, 0, 4, and the frozen values are 2, 2, 1, 0. The errors are 0, -1, 3, so at lambda 0.5 the first move earns 0 - 0.5 + 0.75 = 0.25. Lambda controls the decay: 0.95 does not mean 95 percent full return and 5 percent one step. At `lambda = 0`, this is the one-step estimate. At `lambda = 1`, it is the full return minus the starting value, provided the episode really ends.

### The table is one reading, not a law

Taking a minimum lowers the target. That mechanism is general, but the evidence here is thin. When scored by a frozen copy, the frozen chooser made **159.1 ± 5.2**, compared with **147.5 ± 22.0** for the live chooser. Three seeds do not establish a winner. These results cover one environment, one settings row, and one seed set. Elsewhere, the best cell could be in the bottom row or the last column.

**A stable target can still be wrong, and a less biased target can still produce unstable learning.** Each recipe chooses which error to accept.

<details>
<summary>GAE: the formula, the boundaries, and the source</summary>

GAE sums the one-step errors as a geometric series. With `delta_t = r_t + gamma V(s_{t+1}) - V(s_t)`, the credit for the action at step t is `A_t = delta_t + gamma lambda delta_{t+1} + (gamma lambda)^2 delta_{t+2} + ...`. Each later error fades by one more factor of `gamma lambda`. That is why lambda is a decay rate and not a share between two recipes. A weight of 0.95 does not mean 95 percent of the full return and 5 percent of the one-step estimate. It means the next error keeps 0.95 of the weight, the one after keeps 0.95 squared, and so on.

The two ends are exact. At `lambda = 0`, only `delta_t` is left, so GAE is the one-step estimate `r_t + gamma V(s_{t+1}) - V(s_t)`. At `lambda = 1`, the errors telescope to the discounted return minus the starting value `V(s_t)`, for an episode that reaches a real end. If the rollout is cut off before the end instead, the last value `V(s_H)` stays in as a bootstrap at the boundary, and the trace does not cross a reset.

GAE estimates how much better an action did than the state's baseline value. That is action credit. Proximal Policy Optimization (PPO) clip does a separate job. It limits the incentive to change the policy too far, and it is not a hard bound on the step. The two travel together because PPO uses GAE, but they answer different questions. The identity and the endpoints follow [Schulman et al., Section 3, equations 16 to 18](https://arxiv.org/html/1506.02438v6#S3).

</details>

<details>
<summary>Where the numbers come from</summary>

The Left and Right estimates are invented; the true values are 10 and 10. The second estimate also over-values Right, at 11, but that error never enters this target because the live selector did not pick Right. This is the [Double Q-learning](https://proceedings.neurips.cc/paper_files/paper/2010/file/091d584fced301b442654dd8c23b3fc9-Paper.pdf) split: selection and evaluation use different estimates, and their errors can remain correlated.

</details>

<details>
<summary>The published methods behind the recipes</summary>

A frozen scorer is the [DQN target network](https://deepmind-media.storage.googleapis.com/dqn/DQNNaturePaper.pdf). [Double DQN](https://arxiv.org/pdf/1509.06461) selects with the live network and evaluates with a frozen copy, so the two still share a learning history. The minimum is the clipped estimate of [TD3](https://proceedings.mlr.press/v80/fujimoto18a/fujimoto18a.pdf). In the combinations table, the ± is standard error across three CartPole seeds, not target movement.

</details>
