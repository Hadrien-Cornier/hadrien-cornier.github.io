---
title: 'Reinforcement learning: the problems behind the methods (Codex trial)'
description: 'From playing Breaking Bellman to the problems behind reinforcement learning: delayed credit, exploration, scale and learning from guesses.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, Codex trial'
part: 0
layout: essay
thumbnail: '/assets/robotics/rl-codex/thumbnails/part0.png'
thumbnail_alt: 'A lucky first result can trap a greedy choice'
---

<link rel="stylesheet" href="/assets/robotics/rl-codex/series.css">
<div class="rc" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 870" data-whole="0 0 840 870" data-views='{"credit": [10, 10, 400, 270], "bandit": [430, 10, 400, 270], "horizons": [10, 300, 400, 270], "sharing": [430, 300, 400, 270], "behavior": [10, 590, 400, 270], "triad": [430, 590, 400, 270]}' role="img" aria-labelledby="problems-title problems-desc"><title id="problems-title">Six problems that shape reinforcement learning</title><desc id="problems-desc">Delayed credit, exploration, waiting for outcomes, sharing learning, reusing data and feedback between predictions and targets.</desc><g fill="#242622" font-family="Arial,sans-serif"><g class="rc-panel" data-panel="credit"><rect x="20" y="20" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="62" font-size="25" font-weight="700">1. Delayed reward</text><text x="40" y="108" font-size="20">Which move earned the reward?</text><text x="40" y="170" font-size="18">move → move → move → win</text><text x="40" y="208" font-size="18">Credit must reach earlier choices.</text></g><g class="rc-panel" data-panel="bandit"><rect x="440" y="20" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="62" font-size="25" font-weight="700">2. Exploration</text><text x="460" y="108" font-size="20">Which choice have we missed?</text><text x="460" y="170" font-size="18">lucky first result → repeat it</text><text x="460" y="208" font-size="18">Other choices remain unknown.</text></g><g class="rc-panel" data-panel="horizons"><rect x="20" y="310" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="352" font-size="25" font-weight="700">3. Waiting</text><text x="40" y="398" font-size="20">Can we learn before the end?</text><text x="40" y="460" font-size="18">reward now + a guess about later</text><text x="40" y="498" font-size="18">A guess can carry an error.</text></g><g class="rc-panel" data-panel="sharing"><rect x="440" y="310" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="352" font-size="25" font-weight="700">4. Scale</text><text x="460" y="398" font-size="20">Can one lesson help elsewhere?</text><text x="460" y="460" font-size="18">similar situations → shared learning</text><text x="460" y="498" font-size="18">Sharing can also spread a mistake.</text></g><g class="rc-panel" data-panel="behavior"><rect x="20" y="600" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="642" font-size="25" font-weight="700">5. Reusing data</text><text x="40" y="688" font-size="20">Whose choices does the data show?</text><text x="40" y="750" font-size="18">old behavior → a new policy</text><text x="40" y="788" font-size="18">Missing actions stay uncertain.</text></g><g class="rc-panel" data-panel="triad"><rect x="440" y="600" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="642" font-size="25" font-weight="700">6. Feedback</text><text x="460" y="688" font-size="20">What if a guess changes its target?</text><text x="460" y="750" font-size="18">prediction → target → prediction</text><text x="460" y="788" font-size="18">An error can feed itself.</text></g></g></svg></div></div>
<div class="rc-body">

The deadly triad is what got me exploring reinforcement learning. Playing [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) taught me about RL, and this series is where I’m sharing what I learn.

The triad brings together three useful ideas: learn before the outcome is known, share learning across situations, and reuse data collected by another policy. Together, they can create a feedback loop in which an error feeds the next prediction. To understand why, we first need the problems those ideas solve.

**Codex trial · Part 0.** Next: [the method tree and a Q table](/robotics/rl-1-q-learning-codex/).

In reinforcement learning, an **agent** takes actions, observes what happens and receives rewards. A **policy** is its rule for choosing actions. The aim is to earn more reward over time. The hard part is learning which choices will do that.

<div class="rc-mark" id="sec-credit" data-panel="credit" data-view="credit" data-title="Delayed reward and credit"></div>

## The reward arrives late

You win a game after a hundred moves. The final reward says the game went well, but which moves made it happen? The last move might have been obvious; an earlier choice may have opened the winning route.

This is **credit assignment**: connecting an outcome to the decisions that contributed to it. A robot reaching an object faces the same problem. It needs to learn about the approach and the grasp, even if success is only clear at the end.

We will use estimates of future reward to carry that information back to earlier choices. [Part 1](/robotics/rl-1-q-learning-codex/#sec-table) makes those estimates visible in a table.

<div class="rc-mark" id="sec-bandit" data-panel="bandit" data-view="bandit" data-title="Explore or repeat"></div>

## A good first result can hide a better choice

Imagine ten slot machines with unknown average payouts. One pays well on your first try. Should you keep pulling it, or spend some turns finding out about the others?

Repeating the best-looking choice is **exploitation**. Trying a less familiar one is **exploration**. Rewards can be noisy, so a lucky first result can keep you repeating a mediocre choice. Exploring costs something now, but it can improve later decisions.

<figure class="rls-figure"><svg class="ft-failure" data-failure="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 210" role="img" aria-labelledby="ft-mini-title-1 ft-mini-desc-1"><title id="ft-mini-title-1">A lucky first result can trap a greedy choice</title><desc id="ft-mini-desc-1">First two pulls. Machine B has the higher true average, but A looks better so far.</desc><defs><marker id="mini-arrow-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#b44c2c" stroke-width="1.4"/></marker></defs><text x="140" y="22" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="700">Which machine looks best so far?</text><rect x="12" y="34" width="120" height="115" rx="3" fill="#fff" stroke="#656b62"/><text x="72" y="58" font-size="18" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="700">A</text><text x="72" y="84" font-size="16" text-anchor="middle" fill="#b44c2c" font-family="Arial,sans-serif" font-weight="400">first: +4</text><text x="72" y="108" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">true mean: 1</text><text x="72" y="132" font-size="13" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">picked again</text><rect x="148" y="34" width="120" height="115" rx="3" fill="#fff" stroke="#656b62"/><text x="208" y="58" font-size="18" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="700">B</text><text x="208" y="84" font-size="16" text-anchor="middle" fill="#b44c2c" font-family="Arial,sans-serif" font-weight="400">first: 0</text><text x="208" y="108" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">true mean: 3</text><text x="208" y="132" font-size="13" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">better, ignored</text><path d="M72,158 L72,179" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#mini-arrow-1)"/><text x="140" y="199" font-size="14" text-anchor="middle" fill="#242622" font-family="Arial,sans-serif" font-weight="400">Greedy follows the lucky estimate.</text></svg><figcaption>First two pulls. Machine B has the higher true average, but A looks better so far.</figcaption></figure>

[Part 1’s bandit example](/robotics/rl-1-q-learning-codex/#sec-bandit) compares those choices, then adds states and a longer future.

<div class="rc-mark" id="sec-horizons" data-panel="horizons" data-view="horizons" data-title="Learn before the end"></div>

## Waiting for the outcome can be expensive

We could finish each game before learning from it. But a long episode means a long wait, and one outcome can reflect many chance events.

**Bootstrapping** learns sooner by combining a reward we observed with an estimate of what comes next. That lets information travel before the final result arrives. It also means an inaccurate estimate can become part of the next lesson. [Part 2](/robotics/rl-2-bootstrapping-codex/) compares waiting, guessing and looking several steps ahead.

<div class="rc-mark" id="sec-sharing" data-panel="sharing" data-view="sharing" data-title="Share learning at scale"></div>

## There are too many situations to learn separately

A small grid has a manageable number of cells. A camera image or a robot’s joint positions can describe far more situations than we can visit one by one. Learning a separate answer for each would leave almost everything unknown.

**Function approximation** shares learning through a model, such as a neural network. A lesson from one situation can improve a prediction elsewhere. It can also change a prediction that was already good. [Part 3](/robotics/rl-3-function-approximation-codex/) follows both effects through one shared weight.

<div class="rc-mark" id="sec-behavior" data-panel="behavior" data-view="behavior" data-title="Learn from another policy"></div>

## The data may come from different choices

A robot’s stored experience might come from an older controller. A learning agent might take random exploratory actions while trying to work out how a more decisive policy would behave.

The policy that supplies the data and the policy we want to evaluate can differ. Learning about the latter from the former is **off-policy learning**; **on-policy learning** evaluates the policy producing the experience. Reusing data is valuable, but the data must tell us enough about the choices we want to judge. An action never tried can remain unknown. [Part 4](/robotics/rl-4-on-policy-and-off-policy-codex/) makes that difference concrete at the edge of a cliff.

<div class="rc-mark" id="sec-triad" data-panel="triad" data-view="triad" data-title="Return to the deadly triad"></div>

## A prediction can feed its own error

Now put those three ideas together. Bootstrapping uses a prediction in the target we learn toward. Function approximation lets one update change several predictions. Off-policy data can leave some of those predictions poorly corrected. The next target can then inherit an error that the previous update enlarged.

This combination is the **deadly triad**. It can make learning unstable; it does not make every such learner fail. [Part 5](/robotics/rl-5-the-deadly-triad-codex/) builds the feedback loop with two states and one weight, then examines ways to interrupt it.

## The route through the series

1. [The method tree and a Q table](/robotics/rl-1-q-learning-codex/): connect methods to their problems, then watch one table learn.
2. [Bootstrapping](/robotics/rl-2-bootstrapping-codex/): choose how much observed reward to use before a guess. This also leads to [Generalized Advantage Estimation (GAE)](/robotics/rl-2-bootstrapping-codex/#sec-gae), which mixes return lengths to assign action credit.
3. [Function approximation](/robotics/rl-3-function-approximation-codex/): see what changes when predictions share weights.
4. [On-policy and off-policy learning](/robotics/rl-4-on-policy-and-off-policy-codex/): separate the policy collecting data from the one being evaluated.
5. [The deadly triad](/robotics/rl-5-the-deadly-triad-codex/): bring the three mechanisms together and examine stability.

The questions come first. Next, we will look at the tools people built to answer them.

<details>
<summary>Sources</summary>

The progression draws on [Sutton and Barto, *Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf): exploration in Chapter 2, returns and policies in Chapter 3, temporal-difference learning in Chapter 6, approximation in Chapter 9 and the deadly triad in Section 11.3. [Van Hasselt and colleagues](https://arxiv.org/abs/1812.02648) examine the interaction between the triad’s ingredients. The small slot-machine drawing shows how two initial payouts can mislead a greedy choice; the measured comparisons and their settings are in Part 1.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
