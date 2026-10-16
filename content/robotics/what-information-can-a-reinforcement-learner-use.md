---
title: 'What information can a reinforcement learner use?'
description: 'Breaking Bellman shows the costs of using observations, a continuation estimate, or a second estimate.'
date: '2026-10-16'
draft: true
layout: essay
---

One high payout can increase the estimate for a door that loses money on average. How much can one payout change that estimate?

In [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), the right door gives zero reward. The left door leads to machines with a mean payout of −0.1. The payouts change from one attempt to the next. The best update rule depends on what can change.

You can change the game's words. But **which information can the learner use, and at what cost?** Three selections control this: the weight of new data, the number of observations, and the source of the continuation estimate.

## The weight of new data

This **example uses invented numbers** and full episode returns. The left estimate is −0.1 after 1,000 targets. The next target is +1.

| Update rule | New estimate |
|---|---:|
| Average all 1,001 targets | About −0.0989 |
| Move 10% of the distance to the new target | +0.01 |

The fixed step makes Left look better than zero again. It gives more weight to recent targets. The sample average gives the same weight to each processed target.

For independent targets from one fixed distribution, the sample average converges to the mean. This statement assumes finite variance. With a fixed positive step, noise continues to move the estimate.

If the mean changes to +0.5, the selection changes. The full-history average contains much data from before the change. A fixed step can follow the change more quickly. The selection is between noise reduction and a quick response to change. See [Sutton and Barto, sections 2.4–2.5](https://www.andrew.cmu.edu/course/10-703/textbook/BartoSutton.pdf).

**A fixed answer favors more averaging. An answer that changes favors more weight on recent data.** Learning targets can change with the policy and its estimates, even in a fixed world.

Replay adds a limit. It mixes and reuses stored experience. Random selection mixes moves from different times, which decreases temporal correlation between updates. It does not collect new data. In this game, the averaging counter includes replay updates. Processing one high payout 100 times does not make it 100 independent observations.

<details>
<summary>Examine the update and the game result</summary>

The two table updates use

$$
Q_{\mathrm{new}}=Q_{\mathrm{old}}+\alpha(y-Q_{\mathrm{old}}).
$$

Here, $y$ is the target. The sample average uses $\alpha=1/N$ on update $N$. The fixed step above uses $\alpha=0.1$. The step size and the number of rewards in a target are different parameters.

The example does not identify the cause of a measured door-choice percentage. The October 16 mirage investigation found a different cause for a failed run: replay waited for 500 stored moves. Learning started after the goal's measurement window. With four rewards in a world of at most two steps, there was also no continuation estimate to maximize. Changing its picker or scorer could not correct that problem.

At the game's time limit, full-return mode uses the finite observed return. It does not include an estimate for rewards after the limit.

These results refer to game source revision [78a3b45](https://github.com/Hadrien-Cornier/breaking-bellman/tree/78a3b45bd81572dabc7da54658e5c7ebc10d4135). The page feedback can change.

</details>

## The number of observed rewards

An update can use one observed reward, then an estimate for the remaining rewards. Four-step learning uses four discounted rewards before that estimate. Eight-step learning uses four more. A full return uses all rewards to the end of the episode and no continuation estimate.

More observations decrease dependence on an estimate that can be incorrect. They also include more of one sampled future.

This **CartPole sequence is invented**. A good first push occurs before a random bad push at step six. An eight-step target includes that subsequent mistake. A four-step target uses its continuation estimate before the mistake. An accurate estimate can decrease variation between targets. An incorrect estimate can hide a problem.

**An estimate can be incorrect. A sampled future can be unusual.** More observed steps do not automatically give a better estimate of expected return. The learner must also wait for more observations before the update. In replay, longer sequences include more actions from past behavior. [Sutton and Barto, chapters 5–7](https://www.andrew.cmu.edu/course/10-703/textbook/BartoSutton.pdf) give the definitions for this range from full returns to bootstrapping.

The game's default CartPole gives +1 each step, including the failure step. Variation comes from survival and the states reached, even without reward noise. A fall removes future rewards. Thus, random exploration has a cost. Short episodes and frequent survival rewards let this learner use full returns. This does not make full returns the best selection for all tasks.

## Two different problems in the estimate

When a target includes an estimate, two different problems can occur.

<figure class="rf-figure" aria-labelledby="trust-checks-title">
  <p class="rf-title" id="trust-checks-title">Two problems in the continuation estimate</p>
  <div class="rf-arithmetic">
    <div class="rf-card">
      <strong class="rf-stage-name">Does the target change too quickly?</strong>
      <span class="rf-stage-work">A frozen copy keeps its values until refresh. The values can be incorrect.</span>
    </div>
    <div class="rf-card rf-card-reliability">
      <strong class="rf-stage-name">Does scoring use the error that caused selection?</strong>
      <span class="rf-stage-work">A second estimate can decrease that shared error. Its values can change.</span>
    </div>
  </div>
  <figcaption>Target stability and selection bias are different problems. One learner can use the two responses.</figcaption>
</figure>

For the first problem, this **invented example** uses one stored transition. Its continuation estimate changes from 10 to 14 during training. A frozen copy keeps the previous value until refresh. This gives learning a more stable target. This is why [DQN](https://deepmind-media.storage.googleapis.com/dqn/DQNNaturePaper.pdf) uses a target network.

There is a condition: a frozen scorer alone does not keep the full target fixed. A live picker can select different actions with different frozen scores.

If the target uses the best next action, the two frozen components can keep it fixed. With frozen selection and scoring, each trained estimate has a constant target for this transition between refreshes.

For the second problem, these **estimates are invented**. The two actions have true value 10.

| Estimate | Left | Right |
|---|---:|---:|
| Live | 14 | 9 |
| Frozen | 13 | 8 |
| Second | 9 | 11 |

Live selects Left because of its positive error. Frozen scores Left at 13 and keeps much of that error. Second scores Left at 9. This target does not use its high estimate for Right.

Different estimates can perform selection and evaluation. Then the error that causes selection does not have to set the score. This is the idea behind [Double Q-learning](https://proceedings.neurips.cc/paper_files/paper/2010/file/091d584fced301b442654dd8c23b3fc9-Paper.pdf). The second estimate can be incorrect. Its errors can be correlated with those of the first estimate.

In this game, the twins have symmetric roles. The name "second" does not identify a more accurate estimate.

**A stable estimate can be too high. An estimate that changes can be correct.** [The smaller of two scores](https://proceedings.mlr.press/v80/fujimoto18a/fujimoto18a.pdf) can decrease overestimation, but can also give values that are too low.

<details>
<summary>The score table and its limits</summary>

In the game's comparison table, the row selects a next action in the learning target. The column gives its score. These selections do not directly select the physical action. The learner acts from its live estimate, or the average of its twins.

The displayed uncertainty is standard error across seeds. It does not measure target movement during training. A three-seed score table cannot show which method is best for all tasks. It also cannot identify the cause of a score difference.

The two checks can also share one component. [Double DQN](https://arxiv.org/pdf/1509.06461) selects with the live network and evaluates with a frozen copy. Its scorer stays fixed between refreshes, and its picker uses a different estimate.

</details>

## A test of adaptive return length

My **hypothesis, not checked in an experiment**, is to start with eight observed rewards, then use four, then one. Initial estimates can be incorrect. Longer returns use less of those estimates. Subsequently, better estimates could replace sampled futures that change greatly between attempts. But initial exploration can also cause large changes between long returns. Training time alone can be an incorrect selection criterion.

<details>
<summary>Connect this hypothesis to adaptive returns</summary>

[Meta-Gradient Reinforcement Learning](https://proceedings.neurips.cc/paper_files/paper/2018/file/2715518c875999308842e3455eda2fe3-Paper.pdf) uses subsequent experience to calculate the effect of a learning update. It uses a fixed evaluation objective. It differentiates through that update to adjust return parameters. Gamma controls discount; lambda mixes shorter and longer returns. The method does not directly select an integer step count or prescribe eight, then four, then one.

</details>

A useful next test compares that schedule with fixed one-, four-, and eight-step returns. The test must specify the switch times first. Each method must have the same interaction budget and seeds. Measurements must include return and variation across runs.

A first controlled comparison can change one selection at a time. Learning must start before the measurement window.
