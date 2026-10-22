---
title: 'Policy gradients: fair credit and careful steps'
description: 'Four ways a policy-gradient update can go wrong on a robot task: blaming actions for the past, rewarding every attempt, overshooting on reused data, and groups that teach nothing. Reward-to-go, baselines, PPO clipping and group advantages, with their limits.'
date: '2026-10-21'
updated: '2026-10-22'
draft: false
series: 'Reinforcement learning'
part: 6
layout: essay
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-6-clipped-objective.svg'
thumbnail_alt: 'The PPO clipped objective for a good action and a bad action, flat where clipping removes the incentive'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 890" data-whole="0 0 840 890" data-views='{"push": [18, 46, 384, 240], "credit": [438, 46, 384, 240], "baseline": [18, 341, 384, 240], "clip": [438, 341, 384, 240], "groups": [18, 636, 384, 240], "costs": [438, 636, 384, 240]}' role="img" aria-labelledby="pg6-title pg6-desc"><title id="pg6-title">Policy gradients: six blackboard panels</title><desc id="pg6-desc">Panel 1: one attempt with reach, carry and place; a good attempt makes every action more likely, a bad one less likely, by an amount set by a score. Panel 2: rewards minus 2, 0 and plus 10; the whole return gives every action 8, reward-to-go gives 8, 10 and 10. Panel 3: four returns 10, 10, 10 and 0 with a baseline of 7.5; scores become plus 2.5 three times and minus 7.5. Panel 4: the PPO clipped objective against the probability ratio for advantage plus 2 and minus 2, flat outside 0.8 to 1.2 only in the direction the advantage wants; green dots at ratio 1.3 and 0.7 sit on the flat part, red dots sit on the slope and are pushed back toward 1; policy drift measured as KL per update in the game's CartPole level was 1.5 without clipping and 0.008 with it. Panel 5: a group of rewards 1, 1, 1, 1 gives advantages 0, 0, 0, 0; a group of 1, 0, 0, 0 gives plus 1.73 and minus 0.58 three times. Panel 6: four problems, each with a small sketch from its panel, its fix and what the fix costs.</desc>
<defs><marker id="pg6-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-chalk" stroke-width="1.8"/></marker></defs>
<g font-size="17">
<g class="rc-panel" data-panel="push"><rect x="10" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="38">1. Push the policy</text>
<text x="30" y="68" class="c-dim" font-size="15">one attempt</text>
<g fill="none" class="s-chalk" stroke-width="2"><rect x="30" y="80" width="105" height="40" rx="5"/><rect x="152" y="80" width="105" height="40" rx="5"/><rect x="274" y="80" width="105" height="40" rx="5"/></g>
<g class="c-chalk" text-anchor="middle" font-size="18"><text x="82.5" y="106">reach</text><text x="204.5" y="106">carry</text><text x="326.5" y="106">place</text></g>
<path d="M137,100 L150,100" class="s-chalk" stroke-width="2" marker-end="url(#pg6-a)"/><path d="M259,100 L272,100" class="s-chalk" stroke-width="2" marker-end="url(#pg6-a)"/>
<text x="30" y="160" class="c-green" font-size="18">went well</text><text x="128" y="160" class="c-chalk">every action ↑ a bit more likely</text>
<text x="30" y="194" class="c-red" font-size="18">went badly</text><text x="128" y="194" class="c-chalk">every action ↓ a bit less likely</text>
<text x="30" y="240" class="c-chalk" font-size="20">Δθ ∝ Σ ∇log π(A | S) × <tspan class="c-yellow">score</tspan></text>
<path d="M232,250 Q262,258 294,249" fill="none" class="s-yellow" stroke-width="2"/>
<text x="30" y="276" class="c-dim" font-size="15">The score sets how hard each action is pushed.</text></g>
<g class="rc-panel" data-panel="credit"><rect x="430" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="38">2. Credit only for what follows</text>
<g fill="none" class="s-chalk" stroke-width="2"><rect x="445" y="56" width="110" height="38" rx="5"/><rect x="565" y="56" width="110" height="38" rx="5"/><rect x="685" y="56" width="110" height="38" rx="5"/></g>
<g class="c-chalk" text-anchor="middle" font-size="18"><text x="500" y="81">reach</text><text x="620" y="81">carry</text><text x="740" y="81">place</text></g>
<g text-anchor="middle" font-size="18"><text x="500" y="118" class="c-red">bump −2</text><text x="620" y="118" class="c-chalk">0</text><text x="740" y="118" class="c-green">+10</text></g>
<text x="445" y="148" class="c-dim" font-size="15">whole return: every action gets 8</text>
<g class="c-dim" fill-opacity=".3"><rect x="445" y="156" width="110" height="26" rx="3"/><rect x="565" y="156" width="110" height="26" rx="3"/><rect x="685" y="156" width="110" height="26" rx="3"/></g>
<g class="c-chalk" text-anchor="middle"><text x="500" y="175">8</text><text x="620" y="175">8</text><text x="740" y="175">8</text></g>
<text x="445" y="210" class="c-blue" font-size="15">reward-to-go: rewards from this action on</text>
<g class="c-blue" fill-opacity=".85"><rect x="445" y="218" width="110" height="26" rx="3"/><rect x="565" y="218" width="110" height="26" rx="3"/><rect x="685" y="218" width="110" height="26" rx="3"/></g>
<g class="c-board" text-anchor="middle" font-size="18"><text x="500" y="238">8</text><text x="620" y="238">10</text><text x="740" y="238">10</text></g>
<ellipse cx="680" cy="232" rx="126" ry="17" fill="none" class="s-yellow" stroke-width="2"/>
<text x="445" y="276" class="c-chalk" font-size="16">The bump came first. It can't be the carry's fault.</text></g>
<g class="rc-panel" data-panel="baseline"><rect x="10" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="333">3. Compare with the usual result</text>
<text x="30" y="360" class="c-chalk" font-size="16">return</text><text x="222" y="360" class="c-chalk" font-size="16">score = return − 7.5</text>
<path d="M30,465 L200,465" class="s-dim" stroke-width="2"/>
<g class="c-dim" fill-opacity=".45"><rect x="40" y="375" width="26" height="90"/><rect x="78" y="375" width="26" height="90"/><rect x="116" y="375" width="26" height="90"/></g>
<g class="c-chalk" text-anchor="middle" font-size="15"><text x="53" y="394">10</text><text x="91" y="394">10</text><text x="129" y="394">10</text><text x="167" y="458">0</text></g>
<g class="c-dim" text-anchor="middle" font-size="14"><text x="53" y="484">1</text><text x="91" y="484">2</text><text x="129" y="484">3</text></g><text x="167" y="484" class="c-red" text-anchor="middle" font-size="14">4 dropped</text>
<path d="M30,397.5 L200,397.5" class="s-yellow" stroke-width="2.5" stroke-dasharray="7 5"/>
<text x="30" y="508" class="c-yellow" font-size="14">dashed: the usual return, 7.5</text>
<path d="M222,445 L395,445" class="s-dim" stroke-width="2"/>
<g class="c-green"><rect x="232" y="422.5" width="26" height="22.5"/><rect x="270" y="422.5" width="26" height="22.5"/><rect x="308" y="422.5" width="26" height="22.5"/></g>
<g class="c-green" text-anchor="middle" font-size="15"><text x="245" y="416">+2.5</text><text x="283" y="416">+2.5</text><text x="321" y="416">+2.5</text></g>
<rect x="346" y="445" width="26" height="67.5" class="c-red"/><text x="359" y="532" class="c-red" text-anchor="middle" font-size="17">−7.5</text>
<text x="30" y="556" class="c-chalk" font-size="16">Now the drop is pushed down.</text>
<text x="30" y="578" class="c-dim" font-size="15">Same average update. The noise can drop a lot.</text></g>
<g class="rc-panel" data-panel="clip"><rect x="430" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="333">4. Reuse a batch, but clip</text>
<g class="c-chalk" text-anchor="middle" font-size="16"><text x="530" y="360">advantage +2</text><text x="725" y="360">advantage −2</text></g>
<g class="s-yellow" stroke-width="1.8" stroke-dasharray="5 5" fill="none"><path d="M496,370 L496,500"/><path d="M564,370 L564,500"/><path d="M691,370 L691,500"/><path d="M759,370 L759,500"/></g>
<g class="s-dim" stroke-width="2" fill="none"><path d="M445,370 L445,500 L615,500"/><path d="M640,370 L640,500 L810,500"/></g>
<g class="s-dim" stroke-width="1.6" stroke-dasharray="4 4" fill="none"><path d="M564,396 L598,370"/><path d="M640,370 L691,409"/></g>
<g class="s-blue" stroke-width="3" fill="none"><path d="M445,487 L564,396 L615,396"/><path d="M640,409 L691,409 L759,461 L810,500"/></g>
<circle cx="581" cy="396" r="6" class="c-green"/><circle cx="479" cy="461" r="6" class="c-red"/><circle cx="674" cy="409" r="6" class="c-green"/><circle cx="776" cy="474" r="6" class="c-red"/>
<g class="c-dim" text-anchor="middle" font-size="14"><text x="496" y="516">0.8</text><text x="564" y="516">1.2</text><text x="691" y="516">0.8</text><text x="759" y="516">1.2</text><text x="530" y="534">ratio r</text><text x="725" y="534">ratio r</text></g>
<text x="445" y="558" class="c-green" font-size="15">green: flat, no push</text><text x="640" y="558" class="c-red" font-size="15">red: pushed back toward 1</text>
<text x="445" y="580" class="c-dim" font-size="14">policy drift (KL) per update: 1.5 plain, 0.008 clipped</text></g>
<g class="rc-panel" data-panel="groups"><rect x="10" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="628">5. Same reward, no signal</text>
<text x="30" y="656" class="c-chalk" font-size="15">group A: all four placed</text><text x="220" y="656" class="c-chalk" font-size="15">group B: one placed</text>
<g fill="none" stroke-width="2"><circle cx="50" cy="684" r="15" class="s-green"/><circle cx="90" cy="684" r="15" class="s-green"/><circle cx="130" cy="684" r="15" class="s-green"/><circle cx="170" cy="684" r="15" class="s-green"/><circle cx="240" cy="684" r="15" class="s-green"/><circle cx="280" cy="684" r="15" class="s-red"/><circle cx="320" cy="684" r="15" class="s-red"/><circle cx="360" cy="684" r="15" class="s-red"/></g>
<g text-anchor="middle" font-size="17"><text x="50" y="690" class="c-green">1</text><text x="90" y="690" class="c-green">1</text><text x="130" y="690" class="c-green">1</text><text x="170" y="690" class="c-green">1</text><text x="240" y="690" class="c-green">1</text><text x="280" y="690" class="c-red">0</text><text x="320" y="690" class="c-red">0</text><text x="360" y="690" class="c-red">0</text></g>
<text x="30" y="724" class="c-dim" font-size="15">mean 1, std 0</text><text x="220" y="724" class="c-dim" font-size="15">mean 0.25, std 0.43</text>
<text x="30" y="764" class="c-dim" font-size="14">advantages</text>
<g class="s-dim" stroke-width="2"><path d="M30,800 L190,800"/><path d="M222,800 L392,800"/></g>
<g class="c-dim" text-anchor="middle" font-size="17"><text x="50" y="792">0</text><text x="90" y="792">0</text><text x="130" y="792">0</text><text x="170" y="792">0</text></g>
<rect x="229" y="748" width="22" height="52" class="c-green"/><text x="240" y="742" class="c-green" text-anchor="middle" font-size="15">+1.73</text>
<g class="c-red"><rect x="269" y="800" width="22" height="17"/><rect x="309" y="800" width="22" height="17"/><rect x="349" y="800" width="22" height="17"/></g>
<g class="c-red" text-anchor="middle" font-size="14"><text x="280" y="836">−0.58</text><text x="320" y="836">−0.58</text><text x="360" y="836">−0.58</text></g>
<text x="30" y="866" class="c-chalk" font-size="16">Group A says nothing about the task.</text></g>
<g class="rc-panel" data-panel="costs"><rect x="430" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="628">6. Four fixes, four costs</text>
<g class="c-dim" fill-opacity=".55"><rect x="448" y="660" width="14" height="20"/><rect x="467" y="655" width="14" height="25"/><rect x="486" y="655" width="14" height="25"/></g>
<g class="c-chalk" text-anchor="middle" font-size="12"><text x="455" y="692">8</text><text x="474" y="692">10</text><text x="493" y="692">10</text></g>
<path d="M446,723 L504,723" class="s-chalk" stroke-width="2" stroke-dasharray="5 4"/><g class="c-dim" fill-opacity=".55"><rect x="452" y="709" width="14" height="14"/><rect x="482" y="723" width="14" height="22"/></g>
<path d="M448,792 L466,792 L484,768 L504,768" fill="none" class="s-chalk" stroke-width="2.5"/><path d="M466,764 L466,796 M484,764 L484,796" class="s-dim" stroke-width="1.4" stroke-dasharray="3 3"/>
<g fill="none" class="s-dim" stroke-width="1.8"><circle cx="453" cy="828" r="6"/><circle cx="469" cy="828" r="6"/><circle cx="485" cy="828" r="6"/><circle cx="501" cy="828" r="6"/></g><text x="477" y="850" class="c-dim" text-anchor="middle" font-size="12">all 0</text>
<g font-size="16"><text x="518" y="668" class="c-chalk">past blame → <tspan class="c-blue">reward-to-go</tspan></text><text x="518" y="722" class="c-chalk">no comparison → <tspan class="c-blue">baseline</tspan></text><text x="518" y="776" class="c-chalk">reuse overshoots → <tspan class="c-blue">PPO clip</tspan></text><text x="518" y="830" class="c-chalk">identical group → <tspan class="c-blue">filter it</tspan></text></g>
<g class="c-dim" font-size="14"><text x="518" y="690">still one noisy sample per score</text><text x="518" y="744">needs a good V or several attempts</text><text x="518" y="798">not a hard bound: step size, passes, KL</text><text x="518" y="852">extra attempts, a varying number per batch</text></g></g>
</g></svg></div></div>
<div class="rc-body">

Suppose you're training a robot arm to place a block on a shelf. Instead of learning a value table and acting greedily, as in the earlier parts, you adjust the probabilities of its actions directly, so actions from attempts that went well become more likely and actions from attempts that went badly become less likely. That's a **policy-gradient** method. The idea is simple, but the score that decides how hard to push each action can go wrong in four ways, and each fix has a cost.

**Part 6.** [Previously: the deadly triad](/robotics/rl-5-the-deadly-triad/). In the [failure map](/robotics/rl-0-overview/#sec-failures), these belong to "too little signal", "credit in the wrong place" and "updates that overshoot".

<div class="rc-mark" id="sec-push" data-panel="push" data-view="push" data-title="Push the policy"></div>

## Push the policy

Let $\pi_\theta(a\mid s)$ be the policy's probability of action $a$ in state $s$, with adjustable weights $\theta$. The gradient $\nabla_\theta\log\pi_\theta(a\mid s)$ points in the direction that makes $a$ more likely in $s$. The simplest policy-gradient update, REINFORCE, collects one attempt and pushes each action's probability up in proportion to a score. If the score is the whole attempt's return $G$, the update for an attempt with actions $A_0,\dots,A_{T-1}$ is

$$\Delta\theta\;\propto\;\sum_{t=0}^{T-1}\nabla_\theta\log\pi_\theta(A_t\mid S_t)\,G.$$

So everything depends on that score: which rewards it counts, what it's compared with, and how far one batch of attempts is allowed to push.

<div class="rc-mark" id="sec-past-credit" data-panel="credit" data-view="credit" data-title="Credit only for what follows"></div>

## Credit only for what follows

Take one attempt with three actions. The arm reaches toward the block and bumps the shelf on the way (reward −2), carries the block (reward 0), and places it (reward +10). The whole return is 8, so every action gets a score of 8, including the place action, which had nothing to do with the bump.

A fairer score for action $t$ is the **reward-to-go**, the rewards from that action onward: $G_t=\sum_{k\ge t}R_{k+1}$, with no discount to keep the numbers simple. The reach still gets 8, the carry and the place get 10 each, and only the reach is charged for the bump. This is the return REINFORCE uses in [Sutton and Barto, Section 13.3](http://incompleteideas.net/book/RLbook2020.pdf).

Dropping the past rewards doesn't change the average update. Given what already happened, those rewards are fixed numbers, and the gradient term averages to zero over the policy's own actions, so in a single attempt they only add a random push. OpenAI's [Spinning Up](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html#don-t-let-the-past-distract-you) calls this "don't let the past distract you".

<details>
<summary>Why the past rewards average to zero</summary>

The policy's gradient term has zero mean over its own actions:

$$\begin{aligned}
&\mathbb E_{a\sim\pi_\theta}\big[\nabla_\theta\log\pi_\theta(a\mid s)\big]\\
&\quad=\sum_a\pi_\theta(a\mid s)\frac{\nabla_\theta\pi_\theta(a\mid s)}{\pi_\theta(a\mid s)}\\
&\quad=\nabla_\theta\sum_a\pi_\theta(a\mid s)=\nabla_\theta 1=0.
\end{aligned}$$

So a fixed number times this term also averages to zero. In any single attempt, though, it isn't zero: it adds a push that has nothing to do with the action. Leaving it out keeps the same average update with less noise.

<div class="ct ct-words">

| Action | Reward after it | Whole-return score | Reward-to-go score |
| --- | ---: | ---: | ---: |
| Reach | −2 | 8 | −2 + 0 + 10 = **8** |
| Carry | 0 | 8 | 0 + 10 = **10** |
| Place | +10 | 8 | **10** |

</div>

</details>

<div class="rc-mark" id="sec-baseline" data-panel="baseline" data-view="baseline" data-title="Compare with the usual result"></div>

## Compare with the usual result

Reward-to-go fixes the timing, but here every score is still positive. Say the arm makes four attempts from the same starting position. Three place the block and score 10, and one drops it and scores 0. With raw returns, the three good attempts are pushed up by 10 and the failed one by 0. Nothing gets pushed down, so the failure is only less encouraged, and the difference has to come out of many noisy updates.

Subtract a **baseline** $b(s)$, a number that depends on the state but not on the action. A natural choice is the usual return from that state, here the average of the four attempts, $b=7.5$. Now the placements score +2.5 and the drop scores −7.5, so the drop is pushed down and the placements up.

The baseline can't change the average update, for the same reason as before, but it can have a large effect on the noise. That isn't a promise of less noise, since a badly chosen baseline can add some. In practice the baseline is a learned state value $V(s)$, and the score becomes an estimate of the **advantage**, how much better the action did than usual.

<details>
<summary>What a baseline does and doesn't promise</summary>

Strictly, with $N$ attempts, a baseline that includes the attempt itself scales the expected update by $(N-1)/N$, here 3/4. The mean of the other attempts avoids this, and the direction is the same either way. [Sutton and Barto, Section 13.4](http://incompleteideas.net/book/RLbook2020.pdf), put it this way: the baseline leaves the expected value of the update unchanged, but it can have a large effect on its variance.

[Generalized Advantage Estimation in part 2](/robotics/rl-2-bootstrapping/#sec-gae) is the standard way to build the advantage estimate one step at a time, and it inherits the learned value's errors, including the time-limit problem in [part 2](/robotics/rl-2-bootstrapping/#sec-time-limits).

</details>

<div class="rc-mark" id="sec-ppo" data-panel="clip" data-view="clip" data-title="Reuse a batch, but clip"></div>

## Reuse a batch, but clip

Robot attempts are slow, so you'd like to take several gradient steps on each batch instead of one. After the first step, though, the batch no longer comes from the current policy. The usual correction, as in [part 4's action probabilities](/robotics/rl-4-on-policy-and-off-policy/#sec-action-correction), weights each action by the **probability ratio** $r$, the new policy's probability for that action divided by the old one's, and maximizes $r$ times the advantage. [Schulman et al. (2017)](https://arxiv.org/abs/1707.06347) note that without a constraint, maximizing this objective "would lead to an excessively large policy update". If an action had a positive advantage, raising its probability always looks better.

**Proximal Policy Optimization (PPO)**, from the same paper, clips the ratio, with the paper's setting to the interval from 0.8 to 1.2. In the left plot of the drawing, an action with advantage +2 whose ratio already reached 1.3 sits on the flat part, so nothing pushes it up any further. In the right plot, an action with advantage −2 whose ratio drifted up to 1.3 is still on the slope, so it gets pulled back down. At ratio 0.7 the two cases swap. Clipping removes the incentive to keep moving in the direction the advantage wants, and it keeps the full correction in the other direction.

That isn't a hard limit, though. Several passes over the data and shared weights can still push the ratio out of the interval, so PPO implementations also control the step size and the number of passes. Many also stop a batch early when the **KL divergence**, a measure of how far the new policy has drifted from the old one, grows too large.

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a CartPole level that shows the difference. With 10 passes over each batch at step size 0.03, the plain update moved the policy by a KL divergence of about 1.5 per update, and at the end of training the pole stayed up for 158 steps on average. With clipping at the same settings, the KL was 0.008 per update and the average was about 395 steps, out of a 500-step limit (simulation, 3 seeds). The step size matters as much as the clip here: at step size 0.001, the plain update with 10 passes also stayed at a KL of 0.008 and averaged about 379 steps.

<details>
<summary>The clipped objective and the four cases in the drawing</summary>

With $r(\theta)=\pi_\theta(a\mid s)/\pi_{\theta_\text{old}}(a\mid s)$ and $\hat A$ the advantage estimate from the batch, PPO maximizes

$$\begin{aligned}
L^{\text{CLIP}}=\min\!\Big(&r(\theta)\hat A,\\
&\operatorname{clip}\big(r(\theta),1-\epsilon,1+\epsilon\big)\hat A\Big).
\end{aligned}$$

With $\epsilon=0.2$ the clipped ratio stays between 0.8 and 1.2, and the $\min$ keeps whichever term is lower. After a few steps on one batch:

<div class="ct ct-words">

| $\hat A$ | Ratio $r$ | $r\hat A$ | Clipped | $L^{\text{CLIP}}$ | Gradient |
| ---: | ---: | ---: | ---: | ---: | --- |
| +2 | 1.3 | 2.6 | 2.4 | 2.4 | none: already raised enough |
| −2 | 0.7 | −1.4 | −1.6 | −1.6 | none: already lowered enough |
| −2 | 1.3 | −2.6 | −2.4 | −2.6 | pushes the ratio back down |
| +2 | 0.7 | 1.4 | 1.6 | 1.4 | pushes the ratio back up |

</div>

The paper describes clipping as removing the incentive for moving the ratio outside the interval, and it only ignores the change when that change would make the objective improve. The paper's entropy bonus is a separate term for exploration, not part of the clip. For early stopping on the KL, [Spinning Up's PPO](https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/ppo/ppo.py) uses `target_kl`.

</details>

<div class="rc-mark" id="sec-groups" data-panel="groups" data-view="groups" data-title="Same reward, no signal"></div>

## Same reward, no signal

A learned value $V(s)$ is a second network to train, and if it's wrong, every advantage is wrong. Another option is to measure the usual result directly: put the robot in the same starting position, make several attempts, and compare each one with its group. **Group Relative Policy Optimization (GRPO)**, introduced in [DeepSeekMath (Shao et al., 2024)](https://arxiv.org/abs/2402.03300) for language models, scores each attempt by how far its reward sits above or below its group's mean, measured in the group's standard deviations.

With reward 1 for a placed block and 0 for anything else, a group of 1, 0, 0, 0 gives the one success +1.73 and each failure −0.58. A group of 1, 1, 1, 1 gives every attempt an advantage of 0, and so does a group of four failures. That's four attempts and nothing learned about the task.

<details>
<summary>The GRPO advantage, and why an identical group stays empty</summary>

With $G$ samples from the same starting point and rewards $r_1,\dots,r_G$:

$$\hat A_i=\frac{r_i-\operatorname{mean}(r_1,\dots,r_G)}{\operatorname{std}(r_1,\dots,r_G)}.$$

The numbers above use the population standard deviation. Implementations add a small number to the standard deviation to avoid dividing by zero, and zero divided by anything is still zero. GRPO keeps PPO's clipped objective and adds a separate penalty, $\beta$ times the KL divergence from a fixed reference policy, so with $\beta>0$ the update isn't empty, it just doesn't say anything about the task.

</details>

The two cases mean different things. All successes on an easy start is mostly harmless, since there's little left to learn there. All failures on a hard start is the [exploration problem from part 1](/robotics/rl-1-q-learning/#sec-bandit) again: without at least one success to compare against, there's no direction to move. In the game's pass-or-fail goal grid, a group-mean baseline solved all of the tasks, and by the end of training 92.4% of the groups had identical rewards (3 seeds, simulation). Since every task was solved by then, those groups were most likely all successes.

<details>
<summary>Two published responses, and what each one costs</summary>

- **Filter the groups.** [DAPO (Yu et al., 2025)](https://arxiv.org/abs/2503.14476) over-samples and drops prompts where every sample is right or every sample is wrong, then keeps sampling until the batch is full of groups with a signal. The cost is the extra samples, and the number needed changes from batch to batch. For a language model those are extra generations. For a robot, each one would be a real attempt with a reset. DAPO measured language-model generations, so that robot cost is untested. DAPO also removes GRPO's KL penalty, so the pull toward the reference doesn't apply to it.
- **Remove the normalization biases.** [Dr. GRPO (Liu et al., 2025)](https://arxiv.org/abs/2503.20783) shows that dividing by the response length and by the group's standard deviation biases GRPO, and removes both. That fixes a different problem. An identical group still has every reward equal to its mean, so its advantages are still zero.

<div class="ct ct-words">

| Group | Mean | Std | Advantages |
| --- | ---: | ---: | --- |
| 1, 1, 1, 1 | 1 | 0 | 0, 0, 0, 0 |
| 1, 0, 0, 0 | 0.25 | 0.43 | +1.73, −0.58, −0.58, −0.58 |

</div>

</details>

<div class="rc-mark" id="sec-costs" data-panel="costs" data-view="costs" data-title="Four fixes, four costs"></div>

## Four fixes, four costs

Each fix repairs one part of the score, and none of them is free. Reward-to-go gets the timing right, but each score is still one noisy sample. A baseline adds the comparison, as long as you have a good value estimate or several attempts from the same start. The PPO clip makes batch reuse safer, but it's not a hard bound, so the step size, the number of passes and the KL still matter. Filtering identical groups brings the signal back at the price of extra attempts, a different number each batch.

<details>
<summary>The same summary as a table</summary>

<div class="ct ct-words">

| Problem | What goes wrong | Fix | What it costs or leaves open |
| --- | --- | --- | --- |
| Credit for the past | Actions share blame for earlier rewards | Reward-to-go | Same average update, and each score is still one noisy sample |
| No comparison | All actions in decent attempts go up | Baseline, advantage | Needs a good $V$ or several attempts |
| Overshooting on reused data | Ratio grows with every pass | PPO clip | Not a hard bound, so learning rate, passes and KL still matter |
| Identical groups | Every advantage is zero | DAPO filtering | Extra attempts, a different number each batch |

</div>

</details>

Part 7 leaves the policy's own data behind and asks what can be learned from a fixed log of someone else's attempts. [Part 7: learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/).

<details>
<summary>Sources and what each one supports</summary>

- **REINFORCE and reward-to-go.** [Sutton and Barto, 2nd edition](http://incompleteideas.net/book/RLbook2020.pdf), Section 13.3: REINFORCE uses $G_t$, the return from time $t$. The zero-average argument for past rewards is the same identity as the baseline proof. [Spinning Up, "Don't let the past distract you"](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html#don-t-let-the-past-distract-you) gives it in full.
- **Baselines.** Sutton and Barto, Section 13.4, equations 13.10 and 13.11: any baseline that doesn't depend on the action leaves the expected update unchanged.
- **PPO.** [Schulman et al., 2017](https://arxiv.org/abs/1707.06347), Section 3 (without a constraint, maximizing the ratio objective leads to an excessively large update) and equation 7 (clipped objective, $\epsilon=0.2$); Section 5, equation 9 (entropy bonus as a separate term).
- **KL early stopping.** [Spinning Up PPO implementation](https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/ppo/ppo.py), `target_kl`.
- **GRPO.** [Shao et al., 2024](https://arxiv.org/abs/2402.03300), Sections 4.1.1 and 4.1.2: group-normalized advantages and a KL penalty added to the loss.
- **DAPO.** [Yu et al., 2025](https://arxiv.org/abs/2503.14476), Section 2.3 (KL penalty removed) and Section 3.2 (dynamic sampling).
- **Dr. GRPO.** [Liu et al., 2025](https://arxiv.org/abs/2503.20783), Section 3.1: length and standard-deviation normalization biases.
- **Breaking Bellman.** CartPole reuse level and pass-or-fail goal grid from the game's [experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/681cae3820f05f8604d212c0ab048ebf0e017e73/EXPERIMENTS.md) at commit 681cae3. The CartPole numbers are the runs `st-plain-e10-lr03`, `st-clip-e10-lr03` and `st-plain-e10-lr001` in its `web/measured.js`: mean final evaluation return and mean KL per update over 3 seeds. The 92.4% is the share of groups with identical rewards in the run `gg-ppo-grpo`. Simulation, not a robot.
- **Block example.** The rewards −2, 0 and +10 and the four attempts are made up to show the arithmetic. The robot reset cost of DAPO filtering is an untested consequence, not a measured result.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
