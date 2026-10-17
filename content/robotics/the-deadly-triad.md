---
title: 'The deadly triad: why three useful ideas fail together'
description: 'Function approximation, bootstrapping and off-policy learning each solve a real problem. Together they can push a value estimate far outside the range of possible returns.'
date: '2026-10-17'
draft: true
layout: essay
---

In Baird's counterexample, every reward is zero, so every true value is zero. A linear estimate with eight weights can represent that exactly. Semi-gradient off-policy TD(0), a one-step bootstrapped update, still sends the weights to infinity, for any positive step size ([Sutton and Barto, section 11.2](http://incompleteideas.net/book/RLbook2020.pdf)).

Sutton and Barto name the cause the **deadly triad**: function approximation, bootstrapping, and off-policy training. Each one solves a problem you have. This article asks what each one buys you, why they fail together, and what that says about epsilon exploration and the number of real rewards in a target.

## What each element buys you

- **Function approximation** estimates all values with one shared formula, such as a linear function or a network. It buys values for states you never visited, with memory that does not grow with the state count. Giving it up means tables, which fail on large problems. The book says this element "most clearly cannot be given up".
- **Bootstrapping** builds the target from the next reward plus the current estimate of what follows. It buys learning before the episode ends, often faster. Giving it up means Monte Carlo methods, which wait for the end of the episode and often learn more slowly.
- **Off-policy training** learns about one policy from data another policy produced. It buys exploring while you learn about the greedy policy, reusing old data, and learning many predictions from one stream of experience. Giving it up is possible for control, since Sarsa works on-policy: off-policy learning is "an appealing convenience but not a necessity" there. For parallel prediction it is "essential".

The book covers all three in [section 11.3](http://incompleteideas.net/book/RLbook2020.pdf). The trap is that each reason is real, so you reach for all three.

## Why the three fail together

The book's smallest example has two states. The first has estimated value $w$ and the second has $2w$, set by one parameter. The only transition goes from the first state to the second, with reward 0. The true values are zero.

<figure class="rf-figure" aria-labelledby="rf-loop-title">
  <p class="rf-kicker">Section 11.2 of Sutton and Barto, with γ = 0.99</p>
  <p class="rf-title" id="rf-loop-title">One repeated transition raises its own target</p>
  <ol class="rf-flow">
    <li><span class="rf-flow-name">1. Build the target</span><span class="rf-stage-work">Reward 0 plus 0.99 × 2<em>w</em>. The guess is made from <em>w</em>.</span></li>
    <li><span class="rf-flow-name">2. Compare</span><span class="rf-stage-work">The estimate is <em>w</em>. The target is 1.98<em>w</em>. The update raises <em>w</em>.</span></li>
    <li><span class="rf-flow-name">3. Repeat</span><span class="rf-stage-work">The new <em>w</em> raises the target again. The next error is larger.</span></li>
  </ol>
  <figcaption>Start at <em>w</em> = 10 with step size 0.1. After one update <em>w</em> is 10.98, after ten it is 25.5, and after one hundred it is about 115,000.</figcaption>
</figure>

Each element is part of the loop. Removing any one breaks it.

- **Without bootstrapping**, the target is the real return, 0. The estimate moves toward 0.
- **Without function approximation**, the second state has its own value. Raising the first state's value does not change the target.
- **Without off-policy training**, the system must also leave the $2w$ state, and that update reduces $w$ unless it leads to a state of even higher value. On-policy, "the promise of future reward must be kept". Off-policy, "a promise can be made and then, after taking an action that the target policy never would, forgotten and forgiven."

<details>
<summary>The update equation</summary>

The error on that transition is $\delta_t = (2\gamma - 1)\,w_t$. With importance ratio 1, the off-policy semi-gradient TD(0) update is

$$
w_{t+1} = w_t + \alpha\,\delta_t = \bigl(1 + \alpha(2\gamma - 1)\bigr)\,w_t.
$$

The factor is 1.098 at $\gamma = 0.99$ and $\alpha = 0.1$. It is above 1 whenever $\gamma > 0.5$, for every positive $\alpha$. A smaller step size changes the speed, not the outcome.

</details>

## What the theory covers

The book states: "If any two elements of the deadly triad are present, but not all three, then instability can be avoided." That sentence has a setting. [Tsitsiklis and Van Roy (1997)](https://www.mit.edu/~jnt/Papers/J063-97-bvr-td.pdf) prove that on-policy TD with a linear approximator converges. The same paper gives an example where TD diverges with a nonlinear approximator. So "any two are safe" does not carry over to neural networks.

In practice the triad acts as a matter of degree. [van Hasselt and colleagues (2018)](https://arxiv.org/abs/1812.02648) trained DQN variants on Atari over 336 settings, 3 replications each. They call an estimate **soft-diverged** when it leaves the range any policy can earn, here [−100, 100]. One-step Q-learning soft-diverged in 94% of runs, and 10-step returns lowered that to 21%.

## A run of the game

[Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) is my browser game for these failures. I ran its own learner code on CartPole, level **Values explode**, 20,000 training steps, 5 seeds (runs A in the [source note](#source-note)). Reward is +1 per step and γ = 0.99, so no discounted value exceeds 100. The score is the greedy policy's undiscounted reward, out of 200.

| Learner | Largest estimate (median) | Score |
|---|---:|---:|
| Network, 1-step, best-next-action target (all three elements) | 4.1 million | 9.4 ± 0.2 |
| Table of cells, same words (no network) | 32.5 | 50.4 ± 10.6 |
| Network, all real rewards (no bootstrapping, on-policy) | 25.8 | 33.9 ± 14.3 |
| Network, Sarsa target (on-policy) | 1.0 million | 9.4 ± 0.2 |
| Network, replay and frozen copy, DQN (all three elements) | 61.7 | 143.0 ± 33.7 |

**Confirmed:** with all three elements, the network's estimates reach millions and the policy scores 9.4. **Confirmed:** replay with a frozen copy keeps the estimates near 62. **Contradicted:** removing the off-policy target did not remove the blow-up for this network. That agrees with the nonlinear caveat above and says nothing about the linear case, because the game has no linear approximator. The table reports the largest value seen during training. The runs do not show whether values would grow without bound.

## Exploration is the usual source of the third element

Epsilon-greedy exploration takes a random action with probability ε. If you learn about the greedy policy while acting this way, you are off-policy. It costs most when actions cannot be undone. In [Cliff Walking, Example 6.6](http://incompleteideas.net/book/RLbook2020.pdf), Q-learning learns the optimal path but "occasionally" falls off the cliff "because of the ε-greedy action selection". [Moldovan and Abbeel (2012)](https://arxiv.org/abs/1205.4810) note that exploration methods with guarantees assume any state is reachable from any other, and that most physical systems do not satisfy this.

The game shows the cost on the cliff. Level **Falling while learning**, 10,000 steps, 20 seeds (runs B): Q-learning with ε = 0.1 fell 0.30 times per training episode in the second half of training, against 0.00 without ε. Sarsa fell 0.10 against 0.00. Both Q-learning variants ended at the optimal −13. The no-ε learner still explored, because untried actions start at 0 while tried ones look worse.

CartPole is mixed (runs A). With the table, ε raised the final score and narrowed the spread (50.4 ± 10.6 against 39.4 ± 24.9) but lowered the first-quarter score (27.9 against 38.0). With DQN, ε helped early (122.7 against 97.5) and hurt at the end (143.0 ± 33.7 against 166.5 ± 19.8).

**Reversibility as the reason is not tested.** The worlds differ in other ways: a CartPole fall ends the episode, while a cliff fall costs −100 and restarts. The failure where the cart chases the pole and runs off the rail does exist. In the final greedy episode, 4 of 5 DQN seeds ended at the rail with the pole inside its 12° limit. It happened equally with ε off (4 of 5), so these traces do not blame a missing ε. Whether ε teaches recovery is not tested.

## How many real rewards?

A target with $n$ real rewards, then a guess, sets how much an update bootstraps. $n = 1$ bootstraps the most, and all rewards to the end is Monte Carlo. The [previous article](/robotics/what-information-can-a-reinforcement-learner-use/) covers the exchange: more real rewards remove guess error but add sampled events, and one failure can lower the target of every earlier action in the window. On the cliff with 8 real rewards (seed 101, training steps 9 to 11), a plain step on a safe cell received a target of −100, because the eighth reward in its window was the fall. That is an illustration from the game's inspection tool, not a measurement.

Final greedy scores by $n$:

| Real rewards | Cliff, Q-learning table (runs B). Optimum −13 | CartPole, DQN learner (runs A). Maximum 200 |
|---|---:|---:|
| 1 | −13 ± 0 | 143.0 ± 33.7 |
| 2 | −21.9 ± 14.0 | 169.2 ± 31.8 |
| 4 | −87.7 ± 43.9 | 199.3 ± 1.4 |
| 8 | −131.9 ± 30.7 | 189.5 ± 15.2 |
| all | −200 ± 0 | 193.9 ± 8.3 |

**Contradicted:** the most real rewards is not best. The best $n$ is 1 on the cliff and 4 on CartPole, and with 5 seeds I cannot separate 4, 8 and all on CartPole. **Partly confirmed:** more real rewards help while the estimate is poor. In the first quarter of evaluations on CartPole, every $n$ above 1 scored 156 to 171 against 122.7. On the cliff, 2 and 4 beat 1 early (−134.2 and −148.9 against −207.8), 8 matched it (−207.6), and all rewards was far worse (−697.1).

The axis also touches the triad: in the Atari study, longer returns lowered soft divergence. My DQN runs had a median largest estimate between 62 and 141 at every $n$, so they do not test that finding.

## More real rewards early, fewer later?

Start with long returns while the guess is poor, then shorten them as it improves. **This is not tested.** Every game run uses one fixed $n$. The cliff pattern fits the idea, since 2 and 4 led early and 1 won at the end. CartPole shows no such crossover in 20,000 steps.

The closest published work I found is [Meta-Gradient Reinforcement Learning](https://proceedings.neurips.cc/paper_files/paper/2018/file/2715518c875999308842e3455eda2fe3-Paper.pdf) (Xu, van Hasselt and Silver, NeurIPS 2018). It treats the return as a function of meta-parameters and adapts them online, by differentiating performance on later experience through the update. It does not learn $n$. The paper writes the $n$-step return with only the discount γ as meta-parameter, and the λ-return with γ and λ. Its Atari experiments (IMPALA, 57 games) adapted single values of γ and λ. Adapting γ gave the larger gain over a hand-tuned baseline. The paper also cites a hand-made schedule over γ: start myopic and raise the discount once learning works. That is a different knob from the number of rewards.

<details id="source-note">
<summary>Source note: settings, seeds and limits for the game runs</summary>

All game numbers come from the game's own `RLA.run` code at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73), the path the page uses to train. I ran them on October 17, 2026. Arms in a world share seeds. The run script and raw per-seed results are stored locally and are not published.

**Runs A.** CartPole, levels **Too many cells** and **Values explode**. 20,000 training steps. Seeds 101, 202, 303, 404, 505. ε falls from 1.0 to 0.05 over 5,000 steps, except in "no ε" arms. The network has two hidden layers of 32 units and Adam at 0.001. DQN adds replay of 10,000 moves and a frozen copy refreshed every 250 updates.

**Runs B.** Cliff, a 4 by 12 grid, levels **Falling while learning** and **The cliff edge**. A fall costs −100 and returns to the start. 10,000 training steps. 20 seeds (101, 202, up to 2020). ε = 0.1 and table learning rate 0.5.

**Scores.** The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 evaluation episodes and the last quarter of evaluation points. "Early" is the first quarter. ± is the sample standard deviation across seeds. "Largest estimate" is the largest absolute value at any evaluation. With 5 and 20 seeds, none of this is a general guarantee.

**Not shown.** The runs measure no linear approximation, no recovery behavior and no schedule over $n$. The game's own page quotes three fall rates that differ from mine: 0.32, 0.06 and 0.04, against my 0.30, 0.10 and 0.00 for Q-learning, Sarsa and Expected Sarsa. I did not resolve that difference.

</details>

## What the game supports

| Claim | Status |
|---|---|
| All three elements together push estimates far outside the possible range | Confirmed (runs A) |
| Removing any one of the three is safe | Contradicted for the on-policy network (runs A). Not tested for linear approximation |
| Function approximation helps alone | Contradicted at this budget (runs A). With replay and a frozen copy the network scored 143.0, against 50.4 for the plain table |
| Bootstrapping helps alone | Confirmed on the cliff: −13 against −200 for all rewards (runs B). Not on CartPole: a table with all rewards scored 95.4 against 50.4 (runs A) |
| The off-policy target helps alone | Partly confirmed (runs B): −13 against −82.1 ± 47.3 for Sarsa, at a cost in falls |
| ε helps on CartPole | Mixed (runs A) |
| ε costs falls on the cliff | Confirmed (runs B) |
| Reversibility explains where ε helps | Not tested |
| Without ε the cart runs off the rail, and ε fixes it | Rail endings seen with and without ε (runs A). Recovery not tested |
| The most real rewards is best | Contradicted (runs A, B) |
| More real rewards help while estimates are poor | Partly confirmed (runs A, B) |
| More real rewards early and fewer later | Not tested |
