---
title: 'Reinforcement learning: the problems behind the methods'
description: 'From playing Breaking Bellman to the problems behind reinforcement learning: delayed credit, exploration, scale and learning from guesses.'
date: '2026-10-20'
draft: false
series: 'Reinforcement learning'
part: 0
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-0-overview-whole.svg'
thumbnail_alt: 'Six problems that shape reinforcement learning'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<div class="rc" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 870" data-whole="0 0 840 870" data-views='{"credit": [10, 10, 400, 270], "bandit": [430, 10, 400, 270], "horizons": [10, 300, 400, 270], "sharing": [430, 300, 400, 270], "behavior": [10, 590, 400, 270], "triad": [430, 590, 400, 270]}' role="img" aria-labelledby="problems-title problems-desc"><title id="problems-title">Six problems that shape reinforcement learning</title><desc id="problems-desc">Delayed credit, exploration, waiting for outcomes, sharing learning, reusing data and feedback between predictions and targets.</desc><g fill="#242622" font-family="Arial,sans-serif"><g class="rc-panel" data-panel="credit"><rect x="20" y="20" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="62" font-size="25" font-weight="700">1. Delayed reward</text><text x="40" y="108" font-size="20">Which move earned the reward?</text><text x="40" y="170" font-size="18">move → move → move → win</text><text x="40" y="208" font-size="18">Credit must reach earlier choices.</text></g><g class="rc-panel" data-panel="bandit"><rect x="440" y="20" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="62" font-size="25" font-weight="700">2. Exploration</text><text x="460" y="108" font-size="20">Which choice have we missed?</text><text x="460" y="170" font-size="18">lucky first result → repeat it</text><text x="460" y="208" font-size="18">Other choices remain unknown.</text></g><g class="rc-panel" data-panel="horizons"><rect x="20" y="310" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="352" font-size="25" font-weight="700">3. Waiting</text><text x="40" y="398" font-size="20">Can we learn before the end?</text><text x="40" y="460" font-size="18">reward now + a guess about later</text><text x="40" y="498" font-size="18">A guess can carry an error.</text></g><g class="rc-panel" data-panel="sharing"><rect x="440" y="310" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="352" font-size="25" font-weight="700">4. Scale</text><text x="460" y="398" font-size="20">Can one lesson help elsewhere?</text><text x="460" y="460" font-size="18">similar situations → shared learning</text><text x="460" y="498" font-size="18">Sharing can also spread a mistake.</text></g><g class="rc-panel" data-panel="behavior"><rect x="20" y="600" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="642" font-size="25" font-weight="700">5. Reusing data</text><text x="40" y="688" font-size="20">Whose choices does the data show?</text><text x="40" y="750" font-size="18">old behavior → a new policy</text><text x="40" y="788" font-size="18">Missing actions stay uncertain.</text></g><g class="rc-panel" data-panel="triad"><rect x="440" y="600" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="642" font-size="25" font-weight="700">6. Feedback</text><text x="460" y="688" font-size="20">What if a guess changes its target?</text><text x="460" y="750" font-size="18">prediction → target → prediction</text><text x="460" y="788" font-size="18">An error can feed itself.</text></g></g></svg></div></div>
<div class="rc-body">

I started exploring reinforcement learning because of the deadly triad. I learned about RL by playing [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), and I’m sharing what I learn in this series.

The triad combines three useful ideas. We can learn before we know the outcome, share what we learn across situations, and reuse data from another policy. But together, these ideas can create a feedback loop where an error feeds into the next prediction. To understand how that happens, we first need to look at the problems each idea solves.

**Part 0.** Next: [the method tree and a Q table](/robotics/rl-1-q-learning/).

In reinforcement learning, we have an **agent** that takes actions, observes what happens and receives rewards. Its **policy** is the rule it uses to choose actions. We want the agent to earn more reward over time, but it has to learn which choices will get it there.

<div class="rc-mark" id="sec-credit" data-panel="credit" data-view="credit" data-title="Delayed reward and credit"></div>

## The reward arrives late

Suppose you win a game after a hundred moves. You get a final reward, so you know the game went well. But which moves actually contributed to the win? Maybe the last move was obvious, while a choice much earlier made the winning route possible.

Connecting that outcome to the decisions that contributed to it is called **credit assignment**. The same problem comes up when a robot reaches for an object. Even if it only knows whether it succeeded at the end, it needs to learn about both the approach and the grasp.

We will estimate future reward and use those estimates to carry information back to earlier choices. In [Part 1](/robotics/rl-1-q-learning/#sec-table), we can see those estimates in a table.

<div class="rc-mark" id="sec-bandit" data-panel="bandit" data-view="bandit" data-title="Explore or repeat"></div>

## A good first result can hide a better choice

Imagine you have ten slot machines, and you don’t know their average payouts. You try one and get a good payout. Do you keep playing that machine, or spend some turns trying the others?

If you repeat the choice that looks best so far, that is **exploitation**. If you try a less familiar choice, that is **exploration**. The problem is that rewards can be noisy. A lucky first payout might keep you playing a mediocre machine. Exploring has a cost now, but what you learn can help you make better decisions later.

<figure class="rls-figure"><svg class="ft-failure" data-failure="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 210" role="img" aria-labelledby="ft-mini-title-1 ft-mini-desc-1"><title id="ft-mini-title-1">A lucky first result can trap a greedy choice</title><desc id="ft-mini-desc-1">First two pulls. Machine B has the higher true average, but A looks better so far.</desc><defs><marker id="mini-arrow-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#b44c2c" stroke-width="1.4"/></marker></defs><text x="140" y="22" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="700">Which machine looks best so far?</text><rect x="12" y="34" width="120" height="115" rx="3" fill="#fff" stroke="#656b62"/><text x="72" y="58" font-size="18" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="700">A</text><text x="72" y="84" font-size="16" text-anchor="middle" fill="#b44c2c" font-family="Arial,sans-serif" font-weight="400">first: +4</text><text x="72" y="108" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">true mean: 1</text><text x="72" y="132" font-size="13" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">picked again</text><rect x="148" y="34" width="120" height="115" rx="3" fill="#fff" stroke="#656b62"/><text x="208" y="58" font-size="18" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="700">B</text><text x="208" y="84" font-size="16" text-anchor="middle" fill="#b44c2c" font-family="Arial,sans-serif" font-weight="400">first: 0</text><text x="208" y="108" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">true mean: 3</text><text x="208" y="132" font-size="13" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">better, ignored</text><path d="M72,158 L72,179" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#mini-arrow-1)"/><text x="140" y="199" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">Greedy follows the lucky estimate.</text></svg><figcaption>First two pulls. Machine B has the higher true average, but A looks better so far.</figcaption></figure>

We compare these choices in [Part 1’s bandit example](/robotics/rl-1-q-learning/#sec-bandit), then add states and a longer future to consider.

<div class="rc-mark" id="sec-horizons" data-panel="horizons" data-view="horizons" data-title="Learn before the end"></div>

## Waiting for the outcome can be expensive

We could wait until each game ends before learning from it. With a long episode, though, we would be waiting a long time. And that one outcome can depend on many chance events.

With **bootstrapping**, we combine a reward we have observed with an estimate of what comes next, so we can learn before the final result arrives. Information can travel sooner, but an error in that estimate can also become part of what we learn from next. [Part 2](/robotics/rl-2-bootstrapping/) compares waiting, guessing and looking several steps ahead.

<div class="rc-mark" id="sec-sharing" data-panel="sharing" data-view="sharing" data-title="Share learning at scale"></div>

## There are too many situations to learn separately

In a small grid, we have a manageable number of cells. But with camera images or a robot’s joint positions, there are far more situations than we can visit one by one. If we had to learn a separate answer for each situation, almost everything would remain unknown.

With **function approximation**, we use a model, such as a neural network, to share learning across situations. Learning from one situation can improve a prediction somewhere else, but it can also change a prediction that was already good. In [Part 3](/robotics/rl-3-function-approximation/), we follow both effects through one shared weight.

<div class="rc-mark" id="sec-behavior" data-panel="behavior" data-view="behavior" data-title="Learn from another policy"></div>

## The data may come from different choices

A robot might have stored experience collected by an older controller. Or an agent might be taking random actions to explore, while trying to learn how a more decisive policy would behave.

So the policy collecting the data can be different from the policy we want to evaluate. When we use data from one policy to learn about another, that is **off-policy learning**. With **on-policy learning**, we evaluate the policy that produces the experience. Reusing data is useful, but we still need enough information about the choices we want to evaluate. If an action was never tried, it can remain unknown. [Part 4](/robotics/rl-4-on-policy-and-off-policy/) shows this difference at the edge of a cliff.

<div class="rc-mark" id="sec-triad" data-panel="triad" data-view="triad" data-title="Return to the deadly triad"></div>

## A prediction can feed its own error

Now consider what happens when we combine the three ideas. With bootstrapping, the target we learn toward contains a prediction. With function approximation, one update can change several predictions. Off-policy data can leave some of those predictions without enough correction. So an update can enlarge an error, and the next target can carry that error forward.

We call this combination the **deadly triad**. It can make learning unstable, although it does not cause every learner using these three ideas to fail. In [Part 5](/robotics/rl-5-the-deadly-triad/), we build the feedback loop using two states and one weight, then look at ways to interrupt it.

<h2 id="sec-failures">How learning goes wrong</h2>

Each of these ideas fixes one problem and opens the door to others. Here are the failures the series covers, grouped by what goes wrong, with the section that explains each one and the methods that address it.

**Too little signal.** The learner can't improve because nothing in its experience points to a better choice.

- A lucky first result keeps a greedy learner on a worse choice. Random exploration, optimistic starting values and upper confidence bounds: [Part 1's bandit](/robotics/rl-1-q-learning/#sec-bandit).
- A late reward takes many updates to reach early choices. Bootstrapping and multi-step returns: [Part 2](/robotics/rl-2-bootstrapping/).
- A group of attempts that all score the same gives every attempt zero credit. Filtering those groups, at the cost of extra attempts: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-groups).

**Credit in the wrong place.** The learner gets a signal, but it rewards or blames the wrong action.

- An action shares blame for rewards that came before it. Reward-to-go: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-past-credit).
- Every action in a decent attempt gets pushed up. A baseline, and advantages estimated with GAE: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-baseline) and [Part 2](/robotics/rl-2-bootstrapping/#sec-gae).

**Updates that overshoot.** One change goes further than the evidence supports.

- Reusing one batch for many steps moves the policy too far. PPO's clipped objective, which is not a hard limit: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-ppo).
- One update to shared weights changes predictions that were already right. [Part 3](/robotics/rl-3-function-approximation/).

**Value estimates that answer the wrong question.** The target looks reasonable but measures something other than what we want.

- A time limit is treated as the end of the task, or the learner can't see how much time is left. Time-aware inputs or partial-episode bootstrapping, depending on what the limit means: [Part 2](/robotics/rl-2-bootstrapping/#sec-time-limits).
- A target asks about actions the data never tried, so nothing corrects the answer. Staying close to the data with BCQ, TD3+BC, CQL or IQL: [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-extrapolation).
- A prediction feeds its own error through bootstrapping, shared weights and off-policy data. [Part 5](/robotics/rl-5-the-deadly-triad/).

**Copying the wrong thing.** A policy learned from demonstrations does something the demonstrations shouldn't have taught it.

- The log includes bad attempts, so copying it copies the mistakes. Reward-aware reuse with AWR, IQL, advantage conditioning or TD3+BC, when the rewards and values are good enough: [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-mixed).
- The log itself is wrong, with misaligned timestamps or false success labels. Fixing the data, not the learner: [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-corruption).
- Two good ways to do the task get averaged into one bad one. Policies that can represent both, such as flow policies: [Part 8](/robotics/rl-8-mode-averaging/).

## The route through the series

1. [The method tree and a Q table](/robotics/rl-1-q-learning/): connect methods to their problems, then watch one table learn.
2. [Bootstrapping](/robotics/rl-2-bootstrapping/): choose how much observed reward to use before a guess. This also leads to [Generalized Advantage Estimation (GAE)](/robotics/rl-2-bootstrapping/#sec-gae), which mixes return lengths to assign action credit.
3. [Function approximation](/robotics/rl-3-function-approximation/): see what changes when predictions share weights.
4. [On-policy and off-policy learning](/robotics/rl-4-on-policy-and-off-policy/): separate the policy collecting data from the one being evaluated.
5. [The deadly triad](/robotics/rl-5-the-deadly-triad/): bring the three mechanisms together and examine stability.
6. [Policy gradients](/robotics/rl-6-credit-and-careful-updates/): give each action fair credit and keep each update small.
7. [Learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/): actions the data never tried, and demonstrations that include mistakes.
8. [Mode averaging](/robotics/rl-8-mode-averaging/): two good answers, one bad average, and what flow policies change.

We start with these questions. Next, we will look at the tools people developed to answer them.

<details>
<summary>Sources</summary>

The progression draws on [Sutton and Barto, *Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf): exploration in Chapter 2, returns and policies in Chapter 3, temporal-difference learning in Chapter 6, approximation in Chapter 9 and the deadly triad in Section 11.3. [Van Hasselt and colleagues](https://arxiv.org/abs/1812.02648) examine the interaction between the triad’s ingredients. The small slot-machine drawing shows how two initial payouts can mislead a greedy choice; the measured comparisons and their settings are in Part 1.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
