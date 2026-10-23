---
title: 'Reinforcement learning: the problems behind the methods'
description: 'Why I am learning reinforcement learning, and the six problems that drive its algorithms: delayed reward, exploration, waiting, scale, reusing data and feedback.'
date: '2026-10-20'
draft: false
updated: '2026-10-22'
series: 'Reinforcement learning'
part: 0
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-0-overview-whole.svg'
thumbnail_alt: 'Six problems that shape reinforcement learning'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<style>
/* On a phone the whole canvas is too small to read, so the overview shows the six names and sketches only. */
@media (max-width: 640px) {
  #rc :is(.rc-stage, .rc-fig):not(.is-zoomed) .rc-panel text:not(.p0-name) { visibility: hidden; }
  #rc :is(.rc-stage, .rc-fig):not(.is-zoomed) .rc-panel text.p0-name { font-size: 40px; }
}
</style>
<div class="rc" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 870" data-whole="0 0 840 870" data-views='{"credit": [10, 10, 400, 270], "bandit": [430, 10, 400, 270], "horizons": [10, 300, 400, 270], "sharing": [430, 300, 400, 270], "behavior": [10, 590, 400, 270], "triad": [430, 590, 400, 270]}' role="img" aria-labelledby="problems-title problems-desc"><title id="problems-title">Six problems that shape reinforcement learning</title><desc id="problems-desc">Six cards, each with a name, a question and a sketch: 1. Delayed reward, which move earned the reward? 2. Exploration, which choice have we missed? 3. Waiting, can we learn before the end? 4. Scale, can one lesson help elsewhere? 5. Reusing data, whose choices does the data show? 6. Feedback, what if a guess changes its target?</desc><g fill="#242622" font-family="Arial,sans-serif"><g class="rc-panel" data-panel="credit"><rect x="20" y="20" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="62" font-size="25" font-weight="700" class="p0-name">1. Delayed reward</text><text x="40" y="108" font-size="20">Which move earned the reward?</text><circle cx="65" cy="170" r="11" fill="none" class="s-chalk" stroke-width="2"/><path d="M78 170L105 170" class="s-dim" stroke-width="2"/><path d="M100.0 174.2L107.0 170.0L100.0 165.8" fill="none" class="s-dim" stroke-width="2.2"/><circle cx="120" cy="170" r="11" fill="none" class="s-chalk" stroke-width="2"/><path d="M133 170L160 170" class="s-dim" stroke-width="2"/><path d="M155.0 174.2L162.0 170.0L155.0 165.8" fill="none" class="s-dim" stroke-width="2.2"/><circle cx="175" cy="170" r="11" fill="none" class="s-chalk" stroke-width="2"/><path d="M188 170L215 170" class="s-dim" stroke-width="2"/><path d="M210.0 174.2L217.0 170.0L210.0 165.8" fill="none" class="s-dim" stroke-width="2.2"/><circle cx="230" cy="170" r="11" fill="none" class="s-chalk" stroke-width="2"/><path d="M246 170L282 170" class="s-dim" stroke-width="2"/><path d="M277.0 174.2L284.0 170.0L277.0 165.8" fill="none" class="s-dim" stroke-width="2.2"/><path d="M310 154l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" class="s-green" fill="rgba(168,226,160,.25)" stroke-width="2"/><text x="350" y="176" font-size="17" class="c-green">win</text><path d="M312 152C270 126 110 126 68 155" fill="none" class="s-yellow" stroke-width="2.4" stroke-dasharray="4 6"/><path d="M69.1 144.6L68.0 155.0L77.7 151.0" fill="none" class="s-yellow" stroke-width="2.2"/><text x="190" y="130" text-anchor="middle" font-size="16" class="c-yellow">credit for which move?</text><text x="40" y="242" font-size="18">Credit must reach earlier choices.</text></g><g class="rc-panel" data-panel="bandit"><rect x="440" y="20" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="62" font-size="25" font-weight="700" class="p0-name">2. Exploration</text><text x="460" y="108" font-size="20">Which choice have we missed?</text><rect x="480" y="142" width="70" height="56" rx="6" fill="none" class="s-chalk" stroke-width="2"/><text x="515" y="166" text-anchor="middle" font-size="18" class="c-chalk">A</text><text x="515" y="189" text-anchor="middle" font-size="18" class="c-red">+4</text><rect x="640" y="142" width="70" height="56" rx="6" fill="none" class="s-dim" stroke-width="2" stroke-dasharray="5 5"/><text x="675" y="166" text-anchor="middle" font-size="18" class="c-dim">B</text><text x="675" y="189" text-anchor="middle" font-size="20" class="c-yellow">?</text><path d="M515 202C500 222 535 226 522 206" fill="none" class="s-red" stroke-width="2.2"/><text x="558" y="218" font-size="15" class="c-red">again, again</text><text x="725" y="176" font-size="15" class="c-dim">never tried</text><text x="460" y="242" font-size="18">Other choices remain unknown.</text></g><g class="rc-panel" data-panel="horizons"><rect x="20" y="310" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="352" font-size="25" font-weight="700" class="p0-name">3. Waiting</text><text x="40" y="398" font-size="20">Can we learn before the end?</text><circle cx="80" cy="462" r="13" fill="none" class="s-chalk" stroke-width="2"/><text x="80" y="467" text-anchor="middle" font-size="15" class="c-chalk">s</text><path d="M95 462Q150 444 202 462" fill="none" class="s-chalk" stroke-width="2"/><path d="M195.6 466.0L204.0 462.0L196.5 456.4" fill="none" class="s-chalk" stroke-width="2.2"/><text x="148" y="484" text-anchor="middle" font-size="15" class="c-chalk">r now</text><circle cx="220" cy="462" r="13" fill="none" class="s-chalk" stroke-width="2"/><text x="220" y="467" text-anchor="middle" font-size="15" class="c-chalk">s′</text><path d="M242 432c-6-16 12-24 22-14 6-12 28-8 28 6 14-2 18 16 6 22 4 14-16 18-24 10-10 10-30 4-28-8-12-2-12-16-4-16z" fill="none" class="s-blue" stroke-width="2"/><text x="272" y="448" text-anchor="middle" font-size="15" class="c-blue">guess</text><text x="236" y="490" font-size="15" class="c-dim">(no ending yet)</text><text x="40" y="532" font-size="18">A guess can carry an error.</text></g><g class="rc-panel" data-panel="sharing"><rect x="440" y="310" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="352" font-size="25" font-weight="700" class="p0-name">4. Scale</text><text x="460" y="398" font-size="20">Can one lesson help elsewhere?</text><rect x="480" y="460" width="40" height="34" rx="4" fill="rgba(147,212,255,.14)" class="s-chalk" stroke-width="2"/><path d="M490 484l8-14 8 9 6-5" fill="none" class="s-dim" stroke-width="1.6"/><path d="M500 458Q580.0 432 692 444" fill="none" class="s-blue" stroke-width="1.8"/><rect x="535" y="460" width="40" height="34" rx="4" fill="rgba(147,212,255,.14)" class="s-chalk" stroke-width="2"/><path d="M545 484l8-14 8 9 6-5" fill="none" class="s-dim" stroke-width="1.6"/><path d="M555 458Q613.0 432 692 444" fill="none" class="s-blue" stroke-width="1.8"/><rect x="590" y="460" width="40" height="34" rx="4" fill="rgba(147,212,255,.14)" class="s-chalk" stroke-width="2"/><path d="M600 484l8-14 8 9 6-5" fill="none" class="s-dim" stroke-width="1.6"/><path d="M610 458Q646.0 432 692 444" fill="none" class="s-blue" stroke-width="1.8"/><circle cx="712" cy="448" r="20" fill="none" class="s-blue" stroke-width="2.2"/><text x="712" y="454" text-anchor="middle" font-size="17" class="c-blue">V</text><text x="712" y="506" text-anchor="middle" font-size="15" class="c-dim">one shared value</text><text x="460" y="532" font-size="18">Sharing can also spread a mistake.</text></g><g class="rc-panel" data-panel="behavior"><rect x="20" y="600" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="40" y="642" font-size="25" font-weight="700" class="p0-name">5. Reusing data</text><text x="40" y="688" font-size="20">Whose choices does the data show?</text><path d="M60 750C120 744 170 764 230 766S320 758 360 770" fill="none" class="s-dim" stroke-width="2.2" stroke-dasharray="6 6"/><text x="270" y="792" font-size="15" class="c-dim">old behavior (data)</text><path d="M170 758C210 744 250 724 300 716" fill="none" class="s-blue" stroke-width="2.4"/><path d="M294.8 721.9L302.0 716.0L293.4 712.4" fill="none" class="s-blue" stroke-width="2.2"/><text x="220" y="716" font-size="15" class="c-blue">new policy</text><text x="320" y="722" font-size="20" class="c-yellow">?</text><text x="40" y="822" font-size="18">Missing actions stay uncertain.</text></g><g class="rc-panel" data-panel="triad"><rect x="440" y="600" width="380" height="250" rx="5" fill="#f5f4ed" stroke="#7f8f79" stroke-width="2"/><text x="460" y="642" font-size="25" font-weight="700" class="p0-name">6. Feedback</text><text x="460" y="688" font-size="20">What if a guess changes its target?</text><text x="510" y="752" text-anchor="middle" font-size="16" class="c-chalk">prediction</text><text x="750" y="752" text-anchor="middle" font-size="16" class="c-chalk">target</text><path d="M550 732C590 700 670 700 708 732" fill="none" class="s-red" stroke-width="2.4"/><path d="M699.8 731.5L710.0 734.0L707.5 723.8" fill="none" class="s-red" stroke-width="2.2"/><path d="M710 764C670 794 590 794 552 764" fill="none" class="s-red" stroke-width="2.4"/><path d="M560.2 764.5L550.0 762.0L552.5 772.2" fill="none" class="s-red" stroke-width="2.2"/><text x="630" y="734" text-anchor="middle" font-size="14" class="c-dim">builds</text><text x="630" y="774" text-anchor="middle" font-size="14" class="c-dim">trains</text><text x="460" y="822" font-size="18">An error can feed itself.</text></g></g></svg></div></div>
<div class="rc-body">

I'm learning reinforcement learning because it seems key to understanding AI and robotics right now. It's part of how today's language models get better, and part of how robots learn from their own attempts.

I learn it in a few ways. I made a small game, [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), where you watch an RL algorithm fail, work out why, and fix it by changing one word of its update rule. I contribute to open-source robot learning libraries such as Hugging Face's LeRobot, and you can find that work on [my GitHub](https://github.com/Hadrien-Cornier). I also write blog articles like this series as I go.

This series maps out the key problems that drive the algorithms. Most methods in this series exist because an earlier one broke on something: a reward that arrives late, a lucky first result, too many situations to keep in a table. Follow those problems and you also get a genealogy of the algorithms: which one grew out of which, and why.

What I'm really after is taste. To me, RL is more of an art than a recipe: the methods are brittle, small choices decide whether training works at all, and yet the same tools are behind big gains in language models and in robotics. Taste is the judgment to look at a problem and know which tool fits it.

The six problems on the canvas come back throughout the series. Part 5 reaches the deadly triad, where three of the fixes (learning from guesses, sharing what you learn across situations, and reusing old data) combine into a loop where an error feeds the next prediction.

**Part 0.** Next: [a value-based family tree and a Q table](/robotics/rl-1-q-learning/).

In reinforcement learning, we have an **agent** that takes actions, observes what happens and receives rewards. Its **policy** is the rule it uses to choose actions. We want the agent to earn more reward over time, but it has to learn which choices will get it there.

<div class="rc-mark" id="sec-credit" data-panel="credit" data-view="credit" data-title="Delayed reward"></div>

## Delayed reward: which move earned it?

Suppose you win a game after a hundred moves. You get a final reward, so you know the game went well. But which moves actually contributed to the win? Maybe the last move was obvious, while a choice much earlier made the winning route possible.

Connecting that outcome to the decisions that contributed to it is called **credit assignment**. The same problem comes up when a robot reaches for an object. Even if it only knows whether it succeeded at the end, it needs to learn about both the approach and the grasp.

We will estimate future reward and use those estimates to carry information back to earlier choices. In [Part 1](/robotics/rl-1-q-learning/#sec-table), we can see those estimates in a table.

<div class="rc-mark" id="sec-bandit" data-panel="bandit" data-view="bandit" data-title="Exploration"></div>

## Exploration: which choice have we missed?

Imagine you have ten slot machines, and you don’t know their average payouts. You try one and get a good payout. Do you keep playing that machine, or spend some turns trying the others?

If you repeat the choice that looks best so far, that is **exploitation**. If you try a less familiar choice, that is **exploration**. The problem is that rewards can be noisy. A lucky first payout might keep you playing a mediocre machine. Exploring has a cost now, but what you learn can help you make better decisions later.

We compare these choices in [Part 1’s bandit example](/robotics/rl-1-q-learning/#sec-bandit), then add states and a longer future to consider.

<div class="rc-mark" id="sec-horizons" data-panel="horizons" data-view="horizons" data-title="Waiting"></div>

## Waiting: can we learn before the end?

We could wait until each game ends before learning from it. With a long episode, though, we would be waiting a long time. And that one outcome can depend on many chance events.

With **bootstrapping**, we combine a reward we have observed with an estimate of what comes next, so we can learn before the final result arrives. Information can travel sooner, but an error in that estimate can also become part of what we learn from next. [Part 2](/robotics/rl-2-bootstrapping/) compares waiting, guessing and looking several steps ahead.

<div class="rc-mark" id="sec-sharing" data-panel="sharing" data-view="sharing" data-title="Scale"></div>

## Scale: can one lesson help elsewhere?

In a small grid, we have a manageable number of cells. But with camera images or a robot’s joint positions, there are far more situations than we can visit one by one. If we had to learn a separate answer for each situation, almost everything would remain unknown.

With **function approximation**, we use a model, such as a neural network, to share learning across situations. Learning from one situation can improve a prediction somewhere else, but it can also change a prediction that was already good. In [Part 3](/robotics/rl-3-function-approximation/), we follow both effects through one shared weight.

<div class="rc-mark" id="sec-behavior" data-panel="behavior" data-view="behavior" data-title="Reusing data"></div>

## Reusing data: whose choices does the data show?

A robot might have stored experience collected by an older controller. Or an agent might be taking random actions to explore, while trying to learn how a more decisive policy would behave.

So the policy collecting the data can be different from the policy we want to evaluate. When we use data from one policy to learn about another, that is **off-policy learning**. With **on-policy learning**, we evaluate the policy that produces the experience. Reusing data is useful, but we still need enough information about the choices we want to evaluate. If an action was never tried, it can remain unknown. [Part 4](/robotics/rl-4-on-policy-and-off-policy/) shows this difference at the edge of a cliff.

<div class="rc-mark" id="sec-triad" data-panel="triad" data-view="triad" data-title="Feedback"></div>

## Feedback: what if a guess changes its target?

Now consider what happens when we combine the three ideas. With bootstrapping, the target we learn toward contains a prediction. With function approximation, one update can change several predictions. Off-policy data can leave some of those predictions without enough correction. So an update can enlarge an error, and the next target can carry that error forward.

We call this combination the **deadly triad**. It can make learning unstable, although it does not cause every learner using these three ideas to fail. In [Part 5](/robotics/rl-5-the-deadly-triad/), we build the feedback loop using two states and one weight, then look at ways to interrupt it.

<h2 id="sec-failures">How learning goes wrong</h2>

Each of these ideas fixes one problem and opens the door to others. Think of the six problems as causes. What you actually see when training goes wrong is a symptom, like a learner that never finds the better slot machine, or a policy that copies a bad demonstration. The failures in this series come down to five symptoms, and the list below sorts them, with the problems behind each one and the part that explains it.

<details id="sec-failures-detail">
<summary>Five symptoms: each failure, the problems behind it, the part that explains it and the methods that address it</summary>

**Too little signal.** The learner can't improve because nothing in its experience points to a better choice. *Behind it: exploration, delayed reward and waiting.*

- A lucky first result keeps a greedy learner on a worse choice. Random exploration: [Part 1's bandit](/robotics/rl-1-q-learning/#sec-bandit). Optimistic starting values and upper confidence bounds: [Part 1, "Two other ways to explore"](/robotics/rl-1-q-learning/#sec-explore-more).
- A late reward takes many updates to reach early choices. Multi-step returns, which trade error from the estimate for noise from later outcomes: [Part 1's corridor](/robotics/rl-1-q-learning/#sec-backup-rounds) and [Part 2](/robotics/rl-2-bootstrapping/#sec-nstep).
- A group of attempts that all score the same gives every attempt zero credit. Filtering those groups, at the cost of extra attempts: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-groups).

**Credit in the wrong place.** The learner gets a signal, but it rewards or blames the wrong action. *Behind it: delayed reward.*

- An action shares blame for rewards that came before it. Reward-to-go: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-past-credit).
- Every action in a decent attempt gets pushed up. A baseline, and advantages estimated with GAE: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-baseline) and [Part 2](/robotics/rl-2-bootstrapping/#sec-gae).

**Updates that overshoot.** One change goes further than the evidence supports. *Behind it: scale and reusing data.*

- Reusing one batch for many steps moves the policy too far. PPO's clipped objective, which is not a hard limit: [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-ppo).
- One update to shared weights changes predictions that were already right. [Part 3](/robotics/rl-3-function-approximation/).

**Value estimates that answer the wrong question.** The target looks reasonable but measures something other than what we want. *Behind it: waiting, reusing data and feedback.*

- A time limit is treated as the end of the task, or the learner can't see how much time is left. Time-aware inputs or partial-episode bootstrapping, depending on what the limit means: [Part 2](/robotics/rl-2-bootstrapping/#sec-time-limits).
- A target asks about actions the data never tried, so nothing corrects the answer. Staying close to the data with BCQ, TD3+BC, CQL or IQL: [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-extrapolation).
- A prediction feeds its own error through bootstrapping, shared weights and off-policy data. [Part 5](/robotics/rl-5-the-deadly-triad/).

**Copying the wrong thing.** A policy learned from demonstrations does something the demonstrations shouldn't have taught it. *Behind it: reusing data, here a log of demonstrations.*

- The log includes bad attempts, so copying it copies the mistakes. Reward-aware reuse with AWR, IQL, advantage conditioning or TD3+BC, when the rewards and values are good enough: [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-mixed).
- The log itself is wrong, with misaligned timestamps or false success labels. Fixing the data, not the learner: [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-corruption).
- Two good ways to do the task get averaged into one bad one. Policies that can represent both, such as flow policies: [Part 8](/robotics/rl-8-mode-averaging/). Representing both routes still doesn't guarantee that a sample is safe or that every route is covered: [Part 8's limits](/robotics/rl-8-mode-averaging/#sec-flow-limits).

</details>

## The route through the series

1. [A value-based family tree and a Q table](/robotics/rl-1-q-learning/): connect one branch of methods to their problems, then watch one table learn.
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

The progression draws on [Sutton and Barto, *Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf): exploration in Chapter 2, returns and policies in Chapter 3, temporal-difference learning in Chapter 6, approximation in Chapter 9 and the deadly triad in Section 11.3. [Van Hasselt and colleagues](https://arxiv.org/abs/1812.02648) examine the interaction between the triad’s ingredients. The measured slot-machine comparisons and their settings are in Part 1.

</details>

</div>
</div>
<script>
/* Links to the failure map land on its heading; open the list of symptoms under it. */
(function () {
  function openFailures() { if (location.hash === '#sec-failures' || location.hash === '#sec-failures-detail') { var d = document.getElementById('sec-failures-detail'); if (d) d.open = true; } }
  openFailures(); window.addEventListener('hashchange', openFailures);
})();
</script>
<script src="/assets/robotics/rl/canvas.js" defer></script>
