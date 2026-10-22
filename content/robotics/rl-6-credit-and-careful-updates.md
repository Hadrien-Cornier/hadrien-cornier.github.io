---
title: 'Policy gradients: fair credit and careful steps'
description: 'Four ways a policy-gradient update can go wrong on a robot task: blaming actions for the past, rewarding every attempt, overshooting on reused data, and groups that teach nothing. Reward-to-go, baselines, PPO clipping and group advantages, with their limits.'
date: '2026-10-21'
draft: false
series: 'Reinforcement learning'
part: 6
layout: essay
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-6-clipped-objective.svg'
thumbnail_alt: 'The PPO clipped objective for a good action and a bad action, flat where clipping removes the incentive'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">

Suppose you're training a robot arm to place a block on a shelf. Instead of learning a value table and acting greedily, as in the earlier parts, you adjust the probabilities of its actions directly. Actions in attempts that went well become more likely, and actions in attempts that went badly become less likely. That's a **policy-gradient** method.

The idea is simple, and each part of it can go wrong. An action can get blamed for something that happened before it. Every action in a decent attempt can get pushed up, even the weak ones. A batch of expensive robot data can be reused until the policy has moved too far. And a group of attempts that all scored the same can produce no learning signal at all.

**Part 6.** [Previously: the deadly triad](/robotics/rl-5-the-deadly-triad/). In the [failure map](/robotics/rl-0-overview/#sec-failures), these belong to "too little signal", "credit in the wrong place" and "updates that overshoot".

**Reading goal:** compute the credit for three actions in one attempt, then four attempts with a baseline, then four clipped updates, then two groups of attempts.

<h2 id="sec-past-credit">Credit for what already happened</h2>

Let $\pi_\theta(a\mid s)$ be the policy's probability of action $a$ in state $s$, with adjustable weights $\theta$. The gradient $\nabla_\theta\log\pi_\theta(a\mid s)$ points in the direction of the weights that makes $a$ more likely in $s$. The simplest policy-gradient update, REINFORCE, collects an attempt, then pushes each action's probability up in proportion to a score. If the score is the whole attempt's return $G$, the update for one attempt with actions $A_0,\dots,A_{T-1}$ is

$$\Delta\theta\;\propto\;\sum_{t=0}^{T-1}\nabla_\theta\log\pi_\theta(A_t\mid S_t)\,G.$$

Take one attempt with three actions. The arm reaches toward the block and bumps the shelf on the way (reward −2), carries the block (reward 0), and places it (reward +10). The whole return is 8, so every action gets a score of 8, including the place action, which had nothing to do with the bump.

A better score for action $t$ is the **reward-to-go**: the rewards from that action onward, $G_t=\sum_{k\ge t}R_{k+1}$ (no discount here, to keep the numbers simple). This is the return REINFORCE uses in [Sutton and Barto, Section 13.3](http://incompleteideas.net/book/RLbook2020.pdf).

<div class="ct ct-words">

| Action | Reward after it | Whole-return score | Reward-to-go score |
| --- | ---: | ---: | ---: |
| Reach | −2 | 8 | −2 + 0 + 10 = **8** |
| Carry | 0 | 8 | 0 + 10 = **10** |
| Place | +10 | 8 | **10** |

</div>

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,440px)" viewBox="0 0 300 200" role="img" aria-labelledby="f6-rtg-title f6-rtg-desc"><title id="f6-rtg-title">Reward-to-go only counts rewards after each action</title><desc id="f6-rtg-desc">Three actions with rewards minus 2, 0 and plus 10. The whole return of 8 is given to every action. Reward-to-go gives 8, 10 and 10, so the bump only counts against the reach.</desc><g font-family="Arial,sans-serif" fill="#242622"><g font-size="12" text-anchor="middle"><rect x="20" y="20" width="76" height="34" rx="4" fill="#d7e5ee" stroke="#242622"/><text x="58" y="42">reach</text><rect x="112" y="20" width="76" height="34" rx="4" fill="#d7e5ee" stroke="#242622"/><text x="150" y="42">carry</text><rect x="204" y="20" width="76" height="34" rx="4" fill="#d7e5ee" stroke="#242622"/><text x="242" y="42">place</text><text x="58" y="74" fill="#b44c2c">bump −2</text><text x="150" y="74">0</text><text x="242" y="74" fill="#5f7f4f">+10</text></g><text x="20" y="104" font-size="11">whole return</text><g fill="#b6baaf"><rect x="20" y="110" width="76" height="16"/><rect x="112" y="110" width="76" height="16"/><rect x="204" y="110" width="76" height="16"/></g><g font-size="11" text-anchor="middle"><text x="58" y="122">8</text><text x="150" y="122">8</text><text x="242" y="122">8</text></g><text x="20" y="152" font-size="11">reward-to-go</text><g fill="#3d6f9e"><rect x="20" y="158" width="76" height="16"/><rect x="112" y="158" width="76" height="16"/><rect x="204" y="158" width="76" height="16"/></g><g font-size="11" text-anchor="middle" fill="#fff" font-weight="700"><text x="58" y="170">8</text><text x="150" y="170">10</text><text x="242" y="170">10</text></g><text x="150" y="194" font-size="10" text-anchor="middle">Only the reach is charged for the bump.</text></g></svg><figcaption>The bump happened before the carry and the place, so it can't be their fault. Reward-to-go leaves it out of their scores.</figcaption></figure>

Why is it fair to drop the past rewards? Because on average they contribute nothing. Given the history up to step $t$, the past rewards are fixed numbers, and the policy's gradient term averages to zero over its own actions:

$$\begin{aligned}
&\mathbb E_{a\sim\pi_\theta}\big[\nabla_\theta\log\pi_\theta(a\mid s)\big]\\
&\quad=\sum_a\pi_\theta(a\mid s)\frac{\nabla_\theta\pi_\theta(a\mid s)}{\pi_\theta(a\mid s)}\\
&\quad=\nabla_\theta\sum_a\pi_\theta(a\mid s)=\nabla_\theta 1=0.
\end{aligned}$$

So a fixed number times this term also averages to zero. In any single attempt, though, it isn't zero: it adds a random push that has nothing to do with the action. Leaving it out keeps the same average update with less noise. OpenAI's [Spinning Up](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html#don-t-let-the-past-distract-you) calls this "don't let the past distract you".

<h2 id="sec-baseline">Credit compared with the usual result</h2>

Reward-to-go fixes the timing, but every score here is still positive. Say the arm makes four attempts from the same starting position. Three place the block and score 10, and one drops it and scores 0. With raw returns as scores, the three good attempts are pushed up by 10 and the failed one by 0. Nothing is pushed down. The failure is only "less encouraged", and the difference between them has to come out of many noisy updates.

Subtract a **baseline** $b(s)$, a number that depends on the state but not on the action. A natural choice is the usual return from that state, here the average of the four attempts, $b=7.5$:

<div class="ct ct-words">

| Attempt | Return | Score without baseline | Score with $b=7.5$ |
| --- | ---: | ---: | ---: |
| 1 | 10 | 10 | +2.5 |
| 2 | 10 | 10 | +2.5 |
| 3 | 10 | 10 | +2.5 |
| 4, dropped | 0 | 0 | **−7.5** |

</div>

Now the drop is pushed down and the placements are pushed up. The baseline can't change the average update, for the same reason as before: $b(s)$ is fixed given the state, and the gradient term averages to zero. [Sutton and Barto, Section 13.4](http://incompleteideas.net/book/RLbook2020.pdf), put it this way: the baseline leaves the expected value of the update unchanged, but it can have a large effect on its variance. It doesn't promise lower variance, and a badly chosen baseline can add noise.

In practice the baseline is a learned state value $V(s)$, and the score is an estimate of the advantage, how much better the action did than usual. [Generalized Advantage Estimation in part 2](/robotics/rl-2-bootstrapping/#sec-gae) is the standard way to build that estimate one step at a time. It inherits the learned value's errors, including the time-limit problem in [part 2](/robotics/rl-2-bootstrapping/#sec-time-limits).

<h2 id="sec-ppo">Reusing a batch without overshooting</h2>

Robot attempts are slow, so we'd like to take several gradient steps on each batch instead of one. The trouble is that after the first step, the batch no longer comes from the current policy. The usual correction, as in [part 4's action probabilities](/robotics/rl-4-on-policy-and-off-policy/#sec-action-correction), weights each action by how much more or less likely the new policy makes it, the **probability ratio**

$$r(\theta)=\frac{\pi_\theta(a\mid s)}{\pi_{\theta_\text{old}}(a\mid s)},$$

and maximizes $r(\theta)\hat A$, where $\hat A$ is the advantage estimate from the batch. [Schulman et al. (2017)](https://arxiv.org/abs/1707.06347) note that taking several steps on this objective with the same data often leads to destructively large policy updates. Nothing in it says when to stop: if an action had a positive advantage, raising its probability always looks better.

**Proximal Policy Optimization (PPO)**, from the same paper, clips the ratio:

$$\begin{aligned}
L^{\text{CLIP}}=\min\!\Big(&r(\theta)\hat A,\\
&\operatorname{clip}\big(r(\theta),1-\epsilon,1+\epsilon\big)\hat A\Big).
\end{aligned}$$

With $\epsilon=0.2$, the clipped ratio stays between 0.8 and 1.2. The $\min$ takes whichever of the two terms is lower. Here are four cases after a few steps on one batch:

<div class="ct ct-words">

| Advantage | Ratio | Unclipped $r\hat A$ | Clipped | $L^{\text{CLIP}}$ | Gradient |
| ---: | ---: | ---: | ---: | ---: | --- |
| +2 | 1.3 | 2.6 | 2.4 | 2.4 | none: already raised enough |
| −2 | 0.7 | −1.4 | −1.6 | −1.6 | none: already lowered enough |
| −2 | 1.3 | −2.6 | −2.4 | −2.6 | pushes the ratio back down |
| +2 | 0.7 | 1.4 | 1.6 | 1.4 | pushes the ratio back up |

</div>

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,440px)" viewBox="0 0 320 230" role="img" aria-labelledby="f6-clip-title f6-clip-desc"><title id="f6-clip-title">The clipped objective is flat only in the helpful direction</title><desc id="f6-clip-desc">Two plots of the PPO objective against the probability ratio from 0.5 to 1.5. For advantage plus 2, the objective rises until ratio 1.2 and is flat after. For advantage minus 2, the objective is flat below ratio 0.8 and keeps falling above 1.2. Points mark the four table cases.</desc><g font-family="Arial,sans-serif" fill="#242622"><rect x="66" y="40" width="48" height="140" fill="#eceae2"/><rect x="206" y="40" width="48" height="140" fill="#eceae2"/><g stroke="#656b62"><line x1="30" y1="110" x2="150" y2="110"/><line x1="170" y1="110" x2="290" y2="110"/><line x1="30" y1="40" x2="30" y2="180"/><line x1="170" y1="40" x2="170" y2="180"/></g><text x="90" y="30" font-size="12" text-anchor="middle" font-weight="700">advantage +2</text><text x="230" y="30" font-size="12" text-anchor="middle" font-weight="700">advantage −2</text><path d="M114,62 L150,50" stroke="#656b62" stroke-width="1.5" stroke-dasharray="4 3" fill="none"/><path d="M30,90 L114,62 L150,62" stroke="#3d6f9e" stroke-width="2.5" fill="none"/><path d="M170,130 L206,142" stroke="#656b62" stroke-width="1.5" stroke-dasharray="4 3" fill="none"/><path d="M170,142 L206,142 L290,170" stroke="#3d6f9e" stroke-width="2.5" fill="none"/><circle cx="126" cy="62" r="4.5" fill="#5f7f4f"/><circle cx="54" cy="82" r="4.5" fill="#b44c2c"/><circle cx="194" cy="142" r="4.5" fill="#5f7f4f"/><circle cx="266" cy="162" r="4.5" fill="#b44c2c"/><g font-size="10" text-anchor="middle"><text x="66" y="194">0.8</text><text x="114" y="194">1.2</text><text x="206" y="194">0.8</text><text x="254" y="194">1.2</text><text x="90" y="208">ratio</text><text x="230" y="208">ratio</text></g><g font-size="10"><text x="120" y="78" fill="#5f7f4f">flat</text><text x="182" y="158" fill="#5f7f4f">flat</text><text x="236" y="178" fill="#b44c2c">still pulls</text></g><text x="160" y="226" font-size="10" text-anchor="middle">Green: flat. Red: gradient active. Dashed: unclipped.</text></g></svg><figcaption>Clipping removes the incentive to move further in the direction the advantage wants. In the other direction the objective keeps its full slope, so a bad move is still corrected.</figcaption></figure>

The paper's own description is that clipping removes the incentive for moving the ratio outside the interval, and it only ignores the change when that change would make the objective improve. That's different from a hard limit. Nothing stops the ratio from leaving the interval: other actions in the batch, shared weights and several passes over the data can all push it out. That's why PPO implementations also control the learning rate and the number of passes, and many stop a batch early when the measured KL divergence between the old and new policy grows too large, as [Spinning Up's PPO](https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/ppo/ppo.py) does with `target_kl`. The paper's entropy bonus is a separate term for exploration, not part of the clip.

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a CartPole level that shows the difference. With 10 passes over each batch at step size 0.03, the plain update moved the policy by a KL divergence of about 1.5 per update, and at the end of training the pole stayed up for 158 steps on average. With clipping at the same settings, the KL was 0.008 per update and the average was about 395 steps, out of a 500-step limit (simulation, 3 seeds). The step size matters as much as the clip here: at step size 0.001, the plain update with 10 passes also stayed at a KL of 0.008 and averaged about 379 steps.

<h2 id="sec-groups">Groups that teach nothing</h2>

A learned value $V(s)$ is a whole second network to train, and if it's wrong, every advantage is wrong. Another option is to measure "the usual result" directly. Put the robot in the same starting position, make several attempts, and compare each one with the rest of its group. **Group Relative Policy Optimization (GRPO)**, introduced in [DeepSeekMath (Shao et al., 2024)](https://arxiv.org/abs/2402.03300) for language models, does this with $G$ samples from the same starting point and rewards $r_1,\dots,r_G$:

$$\hat A_i=\frac{r_i-\operatorname{mean}(r_1,\dots,r_G)}{\operatorname{std}(r_1,\dots,r_G)}.$$

It keeps PPO's clipped objective and adds a separate penalty, $\beta$ times the KL divergence from a fixed reference policy. Here are two groups of four attempts, with reward 1 for a placed block and 0 for anything else, using the population standard deviation:

<div class="ct ct-words">

| Group | Mean | Std | Advantages |
| --- | ---: | ---: | --- |
| 1, 1, 1, 1 | 1 | 0 | 0, 0, 0, 0 |
| 1, 0, 0, 0 | 0.25 | 0.43 | +1.73, −0.58, −0.58, −0.58 |

</div>

When every attempt in a group gets the same reward, every advantage is zero, whether they all succeeded or all failed. Implementations add a small number to the standard deviation to avoid dividing by zero, and zero divided by anything is still zero. The group spent four attempts and taught the policy nothing about the task. It doesn't produce an empty update, though: with $\beta>0$ the KL penalty still pulls the policy toward the reference.

The two cases mean different things. A group of all successes on an easy start is mostly harmless: there's little left to learn there. A group of all failures on a hard start is the [exploration problem from part 1](/robotics/rl-1-q-learning/#sec-bandit) again: the policy needs at least one success to compare against, and without it there's no direction to move.

There are two published responses, and neither is free.

- **Filter the groups.** [DAPO (Yu et al., 2025)](https://arxiv.org/abs/2503.14476) over-samples and drops prompts where every sample is right or every sample is wrong, then keeps sampling until the batch is full of groups with a signal. The cost is the extra samples, and the number needed changes from batch to batch. For a language model those are extra generations. For a robot, each one would be a real attempt with a reset. DAPO measured language-model generations, so that robot cost is untested. DAPO also removes GRPO's KL penalty, so the pull toward the reference described above doesn't apply to it.
- **Remove the normalization biases.** [Dr. GRPO (Liu et al., 2025)](https://arxiv.org/abs/2503.20783) shows that dividing by the response length and by the group's standard deviation biases GRPO, and removes both. That fixes a different problem. An identical group still has every reward equal to its mean, so its advantages are still zero.

In the game's pass-or-fail goal grid, a group-mean baseline solved all of the tasks. By the end of training, 92.4% of the groups had identical rewards (3 seeds, simulation). Since every task was solved by then, those groups were most likely all successes. That's the easy-start case: once the task was learned, most groups had nothing left to say.

<div class="ct ct-words">

| Problem | What goes wrong | Fix | What it costs or leaves open | Source |
| --- | --- | --- | --- | --- |
| Credit for the past | Actions share blame for earlier rewards | Reward-to-go | Same average update, and each score is still one noisy sample | S&B §13.3 |
| No comparison | All actions in decent attempts go up | Baseline, advantage | Needs a good $V$ or several attempts | S&B §13.4, GAE |
| Overshooting on reused data | Ratio grows with every pass | PPO clip | Not a hard bound, so learning rate, passes and KL still matter | Schulman et al. 2017 |
| Identical groups | Every advantage is zero | DAPO filtering | Extra attempts, a different number each batch | Yu et al. 2025 |

</div>

Part 7 leaves the policy's own data behind and asks what can be learned from a fixed log of someone else's attempts. [Part 7: learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/).

<details>
<summary>Sources and what each one supports</summary>

- **REINFORCE and reward-to-go.** [Sutton and Barto, 2nd edition](http://incompleteideas.net/book/RLbook2020.pdf), Section 13.3: REINFORCE uses $G_t$, the return from time $t$. The zero-average argument for past rewards is the same identity as the baseline proof. [Spinning Up, "Don't let the past distract you"](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html#don-t-let-the-past-distract-you) gives it in full.
- **Baselines.** Sutton and Barto, Section 13.4, equations 13.10 and 13.11: any baseline that doesn't depend on the action leaves the expected update unchanged.
- **PPO.** [Schulman et al., 2017](https://arxiv.org/abs/1707.06347), Section 2.1 (several steps on the plain objective lead to destructively large updates), Section 3, equation 7 (clipped objective, $\epsilon=0.2$) and equation 9 (entropy bonus as a separate term).
- **KL early stopping.** [Spinning Up PPO implementation](https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/ppo/ppo.py), `target_kl`.
- **GRPO.** [Shao et al., 2024](https://arxiv.org/abs/2402.03300), Sections 4.1.1 and 4.1.2: group-normalized advantages and a KL penalty added to the loss.
- **DAPO.** [Yu et al., 2025](https://arxiv.org/abs/2503.14476), Section 2.3 (KL penalty removed) and Section 3.2 (dynamic sampling).
- **Dr. GRPO.** [Liu et al., 2025](https://arxiv.org/abs/2503.20783), Section 3.1: length and standard-deviation normalization biases.
- **Breaking Bellman.** CartPole reuse level and pass-or-fail goal grid from the game's [experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/681cae3820f05f8604d212c0ab048ebf0e017e73/EXPERIMENTS.md) at commit 681cae3. The CartPole numbers are the runs `st-plain-e10-lr03`, `st-clip-e10-lr03` and `st-plain-e10-lr001` in its `web/measured.js`: mean final evaluation return and mean KL per update over 3 seeds. Simulation, not a robot.
- **Block example.** The rewards −2, 0 and +10 and the four attempts are made up to show the arithmetic. The robot reset cost of DAPO filtering is an untested consequence, not a measured result.

</details>
