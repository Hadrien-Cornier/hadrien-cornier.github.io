---
title: 'Recipes for choosing a learning target'
description: 'Rules of thumb for a reinforcement learning target: freeze, take a second estimate, or take the minimum — and why the combinations table is one reading, not a law.'
date: '2026-10-17'
draft: false
layout: essay
---

**Do I need an answer that changes less, or an answer that shares fewer of my errors?** That question decides what scores a learning target. The [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) combinations table measured the choices; here are the recipes I use, each with one number.

## Two dials

A **target** is the reference value an update moves toward. Its scorer sits on two dials: **how fast it changes**, and **how much it shares the selector's errors**. The game's four scorers take four positions:

| `scored by` | Changes | Shares the selector's errors |
|---|---|---|
| `The live estimate` | every update | all of them |
| `A frozen copy` | only at each refresh | often much — same learning history |
| `Scored by a second estimate` | when it learns | fewer — separate updates |
| `The smaller of live and second` | when either learns | fewer, and lowered by construction |

A frozen copy addresses change over time. A second estimate addresses shared errors. Neither guarantees accuracy.

## The recipes

### Freeze when the target changes too fast

A frozen copy changes only at refresh: one stored guess that rises from 10 to 14 still scores 10 until the next refresh.

### Take a second estimate when over-estimates win

If the learner repeatedly trusts actions because of over-estimates, a frozen copy preserves the error it froze; a second estimate can escape it. True values are 10 and 10.

| Estimate | Left | Right |
|---|---:|---:|
| `The live estimate` | 14 | 9 |
| `A frozen copy` | 13 | 8 |
| `Scored by a second estimate` | 9 | 11 |

Live selects Left by its error. Frozen scores that pick at 13 — the same error. Second scores it at 9.

### The minimum lowers the target

The smaller of live and second takes the lower number. It helps when over-estimates drive bad choices and hurts when estimates are already accurate. With live 14 and second 9, the target becomes 9.

### The table is one reading, not a law

The mechanism is general: a minimum lowers the target. The result is conditional: here the lower target gave the better policy, **159.1 ± 5.2** against **147.5 ± 22.0**. Three seeds do not establish a winner. One environment, one settings row, one seed set; elsewhere the best cell could be in the bottom row or the last column.

**A stable target can still be wrong; a less biased target can still produce unstable learning.** Each recipe chooses which error to accept.

<details>
<summary>Where the numbers come from</summary>

The Left and Right estimates are invented; the true values are 10 and 10. The second estimate also over-values Right, at 11, but that error never enters this target because the live selector did not pick Right. This is the [Double Q-learning](https://proceedings.neurips.cc/paper_files/paper/2010/file/091d584fced301b442654dd8c23b3fc9-Paper.pdf) split: selection and evaluation use different estimates, and their errors can remain correlated.

</details>

<details>
<summary>The published methods behind the recipes</summary>

A frozen scorer is the [DQN target network](https://deepmind-media.storage.googleapis.com/dqn/DQNNaturePaper.pdf). [Double DQN](https://arxiv.org/pdf/1509.06461) selects with the live network and evaluates with a frozen copy, so the two still share a learning history. The minimum is the clipped estimate of [TD3](https://proceedings.mlr.press/v80/fujimoto18a/fujimoto18a.pdf). In the combinations table, the ± is standard error across three CartPole seeds, not target movement.

</details>
