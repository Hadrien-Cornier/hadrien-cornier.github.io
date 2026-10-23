---
title: 'Learning from a fixed dataset: missing actions and bad demonstrations'
description: 'A fixed robot dataset can mislead a learner in two different ways: a hole, where it asks about actions nobody tried, and mistakes, where it copies bad demonstrations. Stay close to the data for the first, and weight actions by the reward for the second.'
date: '2026-10-21'
updated: '2026-10-22'
draft: false
series: 'Reinforcement learning'
part: 7
layout: essay
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-7-fixed-data-two-problems.svg'
thumbnail_alt: 'Two blackboard panels: a sweep that nobody tried has an unchecked estimate of 9 that the max picks, and a log of 70 good and 30 bad grasps that behavior cloning copies both'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 890" data-whole="0 0 840 890" data-views='{"hole": [18, 46, 384, 240], "stay": [438, 46, 384, 240], "mixed": [18, 341, 384, 240], "weight": [438, 341, 384, 240], "needs": [18, 636, 384, 240], "records": [438, 636, 384, 240]}' role="img" aria-labelledby="fd7-title fd7-desc"><title id="fd7-title">Learning from a fixed dataset: six blackboard panels</title><desc id="fd7-desc">Each row puts a problem next to its fix. Top row, a hole in the data. Panel 1: above the mug, lower slowly has estimate 4 from 60 logged attempts, lower fast 3 from 40, and sweep sideways has an unchecked estimate of 9 from 0 attempts while its true value is minus 5; the max picks the sweep, so the target is 8.1 instead of 3.6. Panel 2: BCQ and IQL only consider recorded actions, giving a next-state value of 4 and about 3.93, and CQL pushes the unrecorded estimate down. Middle row, mistakes in the data. Panel 3: 70 attempts rotate then grasp, 30 grasp straight in; behavior cloning copies both. Panel 4: advantage weights move the copy from 70 percent good to 81 percent with temperature 5 and 98 percent with temperature 1. Bottom row. Panel 5: the reward-aware fixes need rewards that tell good from bad, values right on the data, good actions where it matters and true records; on the game's mixed log of 50 good and 50 random episodes, final distance to the target is 0.22 m for IQL, 0.33 for CQL, 0.35 for copying the best episodes, 0.50 for TD3+BC, 0.51 for the one-bit advantage tag, 0.56 for a Gaussian copy of everything and 0.57 for AWR; IQL and AWR both weight by advantage but estimate it differently. Panel 6: a hole, bad behavior and false records need different fixes.</desc>
<defs><marker id="fd7-y" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-yellow" stroke-width="1.8"/></marker><marker id="fd7-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-red" stroke-width="1.8"/></marker></defs>
<g font-size="17">
<g class="rc-panel" data-panel="hole"><rect x="10" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="38">1. A hole: an action nobody tried</text>
<text x="30" y="66" class="c-dim" font-size="15">estimates with the gripper just above the mug</text>
<path d="M40,206 L390,206" class="s-dim" stroke-width="2"/>
<g class="c-blue" fill-opacity=".85"><rect x="60" y="158" width="60" height="48"/><rect x="160" y="170" width="60" height="36"/></g>
<rect x="260" y="98" width="60" height="108" fill="none" class="s-red" stroke-width="2.5" stroke-dasharray="6 4"/>
<g text-anchor="middle" font-size="18"><text x="90" y="150" class="c-chalk">4</text><text x="190" y="162" class="c-chalk">3</text><text x="290" y="90" class="c-red" font-size="20">9 ?</text></g>
<text x="290" y="190" class="c-red" text-anchor="middle" font-size="14">true −5</text>
<text x="350" y="146" class="c-yellow" font-size="16">max</text><path d="M362,128 Q356,108 330,102" fill="none" class="s-yellow" stroke-width="2" marker-end="url(#fd7-y)"/>
<g text-anchor="middle" font-size="15"><text x="90" y="226" class="c-chalk">lower slowly</text><text x="190" y="226" class="c-chalk">lower fast</text><text x="290" y="226" class="c-red">sweep sideways</text></g>
<g text-anchor="middle" font-size="14"><text x="90" y="244" class="c-dim">60 in log</text><text x="190" y="244" class="c-dim">40 in log</text><text x="290" y="244" class="c-red">0 in log</text></g>
<text x="30" y="276" class="c-chalk" font-size="16">target: 0.9 × 9 = <tspan class="c-red">8.1</tspan>, not 0.9 × 4 = <tspan class="c-blue">3.6</tspan></text></g>
<g class="rc-panel" data-panel="stay" transform="translate(420,-295)"><rect x="10" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="333">2. Fix the hole: stay with the data</text>
<text x="30" y="360" class="c-dim" font-size="15">only ask about what was recorded</text>
<path d="M60,414 L60,404 L220,404 L220,414" fill="none" class="s-yellow" stroke-width="2"/><text x="140" y="396" class="c-yellow" text-anchor="middle" font-size="15">BCQ, IQL look only here</text>
<path d="M40,500 L390,500" class="s-dim" stroke-width="2"/>
<g class="c-blue" fill-opacity=".85"><rect x="60" y="452" width="60" height="48"/><rect x="160" y="464" width="60" height="36"/></g>
<g text-anchor="middle" class="c-chalk" font-size="18"><text x="90" y="446">4</text><text x="190" y="458">3</text></g>
<rect x="260" y="392" width="60" height="108" fill="none" class="s-faint" stroke-width="2" stroke-dasharray="5 4"/><text x="290" y="386" class="c-dim" text-anchor="middle" font-size="14">was 9</text>
<path d="M290,404 L290,474" class="s-red" stroke-width="2.5" marker-end="url(#fd7-r)"/><text x="326" y="444" class="c-red" font-size="15">CQL: down</text>
<g text-anchor="middle" class="c-dim" font-size="14"><text x="90" y="520">slowly</text><text x="190" y="520">fast</text><text x="290" y="520">sweep</text></g>
<text x="30" y="548" class="c-chalk" font-size="15">next value: BCQ max = <tspan class="c-blue">4</tspan><tspan x="236">IQL: V ≈ </tspan><tspan class="c-blue">3.93</tspan></text>
<text x="30" y="572" class="c-dim" font-size="14">Behavior cloning copies actions and never asks Q at all.</text></g>
<g class="rc-panel" data-panel="mixed" transform="translate(-420,295)"><rect x="430" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="38">3. Mistakes: bad actions in the log</text>
<text x="445" y="66" class="c-dim" font-size="15">at the mug handle, 100 recorded attempts</text>
<g class="c-blue"><circle cx="455" cy="86" r="4.5"/><circle cx="470" cy="86" r="4.5"/><circle cx="485" cy="86" r="4.5"/><circle cx="500" cy="86" r="4.5"/><circle cx="515" cy="86" r="4.5"/><circle cx="530" cy="86" r="4.5"/><circle cx="545" cy="86" r="4.5"/><circle cx="560" cy="86" r="4.5"/><circle cx="575" cy="86" r="4.5"/><circle cx="590" cy="86" r="4.5"/><circle cx="455" cy="99" r="4.5"/><circle cx="470" cy="99" r="4.5"/><circle cx="485" cy="99" r="4.5"/><circle cx="500" cy="99" r="4.5"/><circle cx="515" cy="99" r="4.5"/><circle cx="530" cy="99" r="4.5"/><circle cx="545" cy="99" r="4.5"/><circle cx="560" cy="99" r="4.5"/><circle cx="575" cy="99" r="4.5"/><circle cx="590" cy="99" r="4.5"/><circle cx="455" cy="112" r="4.5"/><circle cx="470" cy="112" r="4.5"/><circle cx="485" cy="112" r="4.5"/><circle cx="500" cy="112" r="4.5"/><circle cx="515" cy="112" r="4.5"/><circle cx="530" cy="112" r="4.5"/><circle cx="545" cy="112" r="4.5"/><circle cx="560" cy="112" r="4.5"/><circle cx="575" cy="112" r="4.5"/><circle cx="590" cy="112" r="4.5"/><circle cx="455" cy="125" r="4.5"/><circle cx="470" cy="125" r="4.5"/><circle cx="485" cy="125" r="4.5"/><circle cx="500" cy="125" r="4.5"/><circle cx="515" cy="125" r="4.5"/><circle cx="530" cy="125" r="4.5"/><circle cx="545" cy="125" r="4.5"/><circle cx="560" cy="125" r="4.5"/><circle cx="575" cy="125" r="4.5"/><circle cx="590" cy="125" r="4.5"/><circle cx="455" cy="138" r="4.5"/><circle cx="470" cy="138" r="4.5"/><circle cx="485" cy="138" r="4.5"/><circle cx="500" cy="138" r="4.5"/><circle cx="515" cy="138" r="4.5"/><circle cx="530" cy="138" r="4.5"/><circle cx="545" cy="138" r="4.5"/><circle cx="560" cy="138" r="4.5"/><circle cx="575" cy="138" r="4.5"/><circle cx="590" cy="138" r="4.5"/><circle cx="455" cy="151" r="4.5"/><circle cx="470" cy="151" r="4.5"/><circle cx="485" cy="151" r="4.5"/><circle cx="500" cy="151" r="4.5"/><circle cx="515" cy="151" r="4.5"/><circle cx="530" cy="151" r="4.5"/><circle cx="545" cy="151" r="4.5"/><circle cx="560" cy="151" r="4.5"/><circle cx="575" cy="151" r="4.5"/><circle cx="590" cy="151" r="4.5"/><circle cx="455" cy="164" r="4.5"/><circle cx="470" cy="164" r="4.5"/><circle cx="485" cy="164" r="4.5"/><circle cx="500" cy="164" r="4.5"/><circle cx="515" cy="164" r="4.5"/><circle cx="530" cy="164" r="4.5"/><circle cx="545" cy="164" r="4.5"/><circle cx="560" cy="164" r="4.5"/><circle cx="575" cy="164" r="4.5"/><circle cx="590" cy="164" r="4.5"/></g>
<path class="s-red" stroke-width="2" fill="none" d="M451,173 l8,8 m0,-8 l-8,8 M466,173 l8,8 m0,-8 l-8,8 M481,173 l8,8 m0,-8 l-8,8 M496,173 l8,8 m0,-8 l-8,8 M511,173 l8,8 m0,-8 l-8,8 M526,173 l8,8 m0,-8 l-8,8 M541,173 l8,8 m0,-8 l-8,8 M556,173 l8,8 m0,-8 l-8,8 M571,173 l8,8 m0,-8 l-8,8 M586,173 l8,8 m0,-8 l-8,8 M451,186 l8,8 m0,-8 l-8,8 M466,186 l8,8 m0,-8 l-8,8 M481,186 l8,8 m0,-8 l-8,8 M496,186 l8,8 m0,-8 l-8,8 M511,186 l8,8 m0,-8 l-8,8 M526,186 l8,8 m0,-8 l-8,8 M541,186 l8,8 m0,-8 l-8,8 M556,186 l8,8 m0,-8 l-8,8 M571,186 l8,8 m0,-8 l-8,8 M586,186 l8,8 m0,-8 l-8,8 M451,199 l8,8 m0,-8 l-8,8 M466,199 l8,8 m0,-8 l-8,8 M481,199 l8,8 m0,-8 l-8,8 M496,199 l8,8 m0,-8 l-8,8 M511,199 l8,8 m0,-8 l-8,8 M526,199 l8,8 m0,-8 l-8,8 M541,199 l8,8 m0,-8 l-8,8 M556,199 l8,8 m0,-8 l-8,8 M571,199 l8,8 m0,-8 l-8,8 M586,199 l8,8 m0,-8 l-8,8"/>
<text x="615" y="112" class="c-blue">70 rotate, then grasp</text><text x="615" y="134" class="c-green" font-size="14">works</text>
<text x="615" y="182" class="c-red">30 straight grasp</text><text x="615" y="204" class="c-dim" font-size="14">often knocks the mug</text>
<text x="445" y="238" class="c-chalk" font-size="16">behavior cloning copies both:</text>
<text x="445" y="260" class="c-red" font-size="16">the straight grasp in about 30% of visits</text>
<text x="445" y="282" class="c-dim" font-size="14">robomimic nut task: 58.7% → 46.7% with worse operators added</text></g>
<g class="rc-panel" data-panel="weight"><rect x="430" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="333">4. Fix the mistakes: weight by advantage</text>
<text x="445" y="360" class="c-dim" font-size="15">advantage: rotate +1, straight −2</text>
<g class="c-chalk" font-size="16"><text x="445" y="404">plain copy</text><text x="445" y="454">AWR, β = 5</text><text x="445" y="504">AWR, β = 1</text></g>
<g class="c-blue"><rect x="560" y="384" width="175" height="28"/><rect x="560" y="434" width="202.5" height="28"/><rect x="560" y="484" width="245" height="28"/></g>
<g class="c-red"><rect x="735" y="384" width="75" height="28"/><rect x="762.5" y="434" width="47.5" height="28"/><rect x="805" y="484" width="5" height="28"/></g>
<g class="c-board" font-size="16"><text x="570" y="404">70%</text><text x="570" y="454">81%</text><text x="570" y="504">98%</text></g>
<text x="445" y="546" class="c-chalk">weight = exp(<tspan class="c-yellow">A</tspan> / β)</text>
<text x="445" y="572" class="c-dim" font-size="14">only as good as the advantage estimates</text></g>
<g class="rc-panel" data-panel="needs"><rect x="10" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="628">5. What the reward-aware fixes need</text>
<g class="c-chalk" font-size="14"><text x="30" y="655">• rewards that tell good from bad</text><text x="230" y="655">• values right on the data</text><text x="30" y="673">• good actions where it matters</text><text x="230" y="673">• true records</text></g>
<text x="30" y="697" class="c-dim" font-size="13">game, mixed log of 50 good and 50 random episodes:</text>
<text x="30" y="712" class="c-dim" font-size="13">final distance to the target in m, lower is better</text>
<g><rect x="150" y="721" width="83.6" height="13" class="c-blue"/><rect x="150" y="738" width="125.4" height="13" class="c-blue"/><rect x="150" y="755" width="133.0" height="13" class="c-blue"/><rect x="150" y="772" width="190.0" height="13" class="c-blue"/><rect x="150" y="789" width="193.8" height="13" class="c-blue"/><rect x="150" y="806" width="212.8" height="13" class="c-dim" fill-opacity=".55"/><rect x="150" y="823" width="216.6" height="13" class="c-blue"/></g>
<g class="c-chalk" font-size="14"><text x="30" y="732">IQL 0.22</text><text x="30" y="749">CQL 0.33</text><text x="30" y="766">best episodes 0.35</text><text x="30" y="783">TD3+BC 0.50</text><text x="30" y="800">one-bit tag 0.51</text><text x="30" y="817">Gaussian copy 0.56</text><text x="30" y="834">AWR 0.57</text></g>
<path d="M362.8,717 L362.8,838" class="s-yellow" stroke-width="2" stroke-dasharray="5 4"/><text x="362.8" y="712" class="c-yellow" text-anchor="middle" font-size="13">copy</text>
<text x="30" y="856" class="c-chalk" font-size="15">IQL and AWR both weight by advantage,</text>
<text x="30" y="874" class="c-chalk" font-size="15">but estimate it differently: 0.22 m vs 0.57 m.</text></g>
<g class="rc-panel" data-panel="records" transform="translate(420,0)"><rect x="10" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="628">6. Bad behavior or bad records?</text>
<text x="30" y="662" class="c-red">a hole in the data</text><text x="30" y="684" class="c-chalk" font-size="15">stay near the data: BCQ, CQL, IQL, TD3+BC</text>
<text x="30" y="726" class="c-red">bad actions, true labels</text><text x="30" y="748" class="c-chalk" font-size="15">weight by reward: AWR, IQL, filtering</text>
<text x="30" y="790" class="c-yellow">false records</text><text x="30" y="812" class="c-chalk" font-size="15">fix the pipeline: clocks, executed actions,</text><text x="30" y="832" class="c-chalk" font-size="15">audited success labels</text>
<circle cx="372" cy="668" r="13" fill="none" class="s-red" stroke-width="2" stroke-dasharray="4 3"/><text x="372" y="674" class="c-red" text-anchor="middle">?</text>
<path d="M364,728 L380,744 M380,728 L364,744" class="s-red" stroke-width="2.5" fill="none"/>
<text x="372" y="800" class="c-yellow" text-anchor="middle" font-size="24">≠</text>
<text x="30" y="866" class="c-dim" font-size="14">No learning method repairs a false label.</text></g>
</g></svg></div></div>
<div class="rc-body">

Suppose you've recorded a few hundred teleoperated attempts at picking up a mug with a robot arm. Some operators were experienced and some were new, and you can't collect more data right now. Two different things can go wrong when you learn from that log. A learner that tries to improve on it asks about actions nobody tried, which is called **extrapolation error**, and a learner that copies it copies the mistakes too, the problem of **mixed-quality data**. They sit next to each other, but they are different problems with different fixes.

**Part 7.** [Previously: policy gradients](/robotics/rl-6-credit-and-careful-updates/). This part extends [data coverage in part 4](/robotics/rl-4-on-policy-and-off-policy/#sec-coverage) to a log you can't add to. In the [failure map](/robotics/rl-0-overview/#sec-failures), extrapolation error belongs to "value estimates that answer the wrong question", next to the deadly triad.

<div class="rc-mark" id="sec-extrapolation" data-panel="hole" data-view="hole" data-title="A hole: an action nobody tried"></div>

## A hole: an action nobody tried

Take one moment in the log: the gripper is just above the mug. Operators either lowered it slowly (60 times) or fast (40 times). Nobody swept the gripper sideways, because that knocks the mug over. Train a Q-function on this log, the same kind of action-value estimate as in [part 1](/robotics/rl-1-q-learning/), and real outcomes keep correcting its estimates for the two recorded actions. The sweep's estimate is whatever the network happens to produce there, say 9, while its true value is −5.

Q-learning's target for the move that brought the gripper above the mug takes the largest next-action estimate. With reward 0 for that move and discount $\gamma=0.9$, that's $0.9\times9=8.1$, against $0.9\times4=3.6$ if you only count recorded actions. The earlier state now inherits a value that came from an action nobody took, and the policy that reads it chooses the sweep. A robot that could act would try the sweep, see the mug fall and correct the estimate. With a fixed log nothing ever corrects it, and the next target built from the inflated value carries the error further back. It's the same feedback as in [the deadly triad](/robotics/rl-5-the-deadly-triad/), with the missing correction coming from a dataset that can't grow.

[Fujimoto, Meger and Precup (2019)](https://arxiv.org/abs/1812.02900) named this extrapolation error: an error introduced by the mismatch between the dataset and the states and actions the learned policy would visit. It isn't limited to actions with zero examples, since an action with two noisy examples can also get an estimate the data barely constrains. So every method that learns from a fixed log has to say what it does about actions the data doesn't support.

<details>
<summary>The numbers in the drawing</summary>

<div class="ct ct-words">

| Action above the mug | Times in the log | Estimate $\hat Q$ | True value |
| --- | ---: | ---: | ---: |
| Lower slowly | 60 | 4 | 4 |
| Lower fast | 40 | 3 | 3 |
| Sweep sideways | 0 | **9** | −5 |

</div>

$$\begin{aligned}
\text{max over all actions:}&\quad 0+0.9\times 9=8.1,\\
\text{max over recorded actions:}&\quad 0+0.9\times 4=3.6.
\end{aligned}$$

These estimates are made up to show the mechanism.

</details>

<div class="rc-mark" id="sec-offline-methods" data-panel="stay" data-view="stay" data-title="Fix the hole: stay with the data"></div>

## Fix the hole: stay with the data

The fixes share one idea: limit how far the learner can move from what the data supports. **Behavior cloning (BC)** copies the recorded actions and never asks a Q-function anything, so it has no extrapolation error, but it can't improve on the data either. It can still drift into states the log never covered, which is a different problem. **Batch-Constrained Q-learning (BCQ)**, from the 2019 paper above, only considers actions that a learned model finds likely, so the max above the mug runs over the two recorded actions and the target is 3.6 instead of 8.1. **Implicit Q-Learning (IQL)** ([Kostrikov, Nair and Levine, 2021](https://arxiv.org/abs/2110.06169)) never evaluates an unrecorded action at all, so its next-state value comes out about 3.93 here, and never 9. **Conservative Q-Learning (CQL)** ([Kumar et al., 2020](https://arxiv.org/abs/2006.04779)) pushes the sweep's estimate down until it stops attracting the policy. **TD3+BC** ([Fujimoto and Gu, 2021](https://arxiv.org/abs/2106.06860)) adds a term that pulls the policy back toward the recorded action.

Each one gives something up. BCQ and IQL can only find the best of what was recorded. CQL's pessimism can also hold back good actions with few examples. And TD3+BC's pull toward the data is a pull toward whatever was recorded in that state.

<details>
<summary>How each method sets its limit, and the game's version with good data</summary>

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a level that shows both sides with good data. A simulated arm learns to reach a target from 100 episodes of a controller that ends 0.01 m from the target. DDPG, an actor-critic method that climbs its own critic, ended 0.84 m away. A deterministic copy of the same 100 episodes ended 0.065 m away (a Gaussian copy 0.11 m), IQL 0.12 m, TD3+BC 0.20 m and CQL 0.24 m (3 seeds, simulation). When the log is already good, a reward-aware method has little left to add, and it can cost some precision.

**BCQ** learns a model of which actions appear in each state. When it builds a target, it only considers actions that model finds likely, plus a small learned adjustment. The cost is that improvement is limited to actions near the data, and the result depends on how well the action model fits.

**TD3+BC.** In state $s$ with recorded action $a$, the policy $\pi$ maximizes

$$\begin{aligned}
&\lambda\,Q(s,\pi(s))-\big(\pi(s)-a\big)^2,\\
&\lambda=\frac{\alpha}{\frac1N\sum_i|Q(s_i,a_i)|}.
\end{aligned}$$

The first term pulls the action toward higher estimates. The second pulls it back toward the recorded action. Dividing by the average size of $Q$ over the $N$ recorded pairs keeps the balance independent of the reward scale, and the authors use $\alpha=2.5$. If a critic error is large enough, the first term can still win.

**CQL** adds a term that pushes estimates down on actions the policy would choose and up on actions in the data. The authors show this makes the learned value a lower bound on the policy's true value. A weight controls how strongly unrecorded actions are pushed down, and too much of it also holds back good actions with few examples.

**IQL** fits $V(s)$ to an upper **expectile** of the recorded actions' estimates instead of taking a max. An expectile is a weighted average that counts values above it more heavily, controlled by $\tau$ between 0 and 1. With $\tau=0.5$ you get the ordinary mean, and as $\tau$ approaches 1 it approaches the largest recorded value. Above the mug, with 60% of the log at 4 and 40% at 3:

<div class="ct ct-words">

| $\tau$ | $V$ above the mug | Reading |
| ---: | ---: | --- |
| 0.5 | 3.6 | Average of what operators did |
| 0.9 | about 3.93 | Close to the best recorded action |
| any | never 9 | The sweep is not in the data |

</div>

The Q-function then learns from $r+\gamma V(s')$, so the target never touches the sweep. IQL keeps the value of the transition separate from the action choice, which also stops one lucky transition from looking like a great action. To turn these values into a policy, it uses advantage weighting, the main tool for the second problem below.

</details>

<div class="rc-mark" id="sec-mixed" data-panel="mixed" data-view="mixed" data-title="Mistakes: bad actions in the log"></div>

## Mistakes: bad actions in the log

Now change the log. Say 70 attempts came from experienced operators and 30 from a new operator. At the moment the gripper reaches the mug handle, the experienced operators rotate the wrist first and then grasp, while the new operator grasps straight in, which often knocks the mug. Both actions are in the data, and both are labeled correctly: the log shows exactly what happened.

Behavior cloning makes every recorded action likely, so an expressive policy reproduces the straight grasp in about 30% of visits to that state. A policy that outputs one action can end up between the two, which is [mode averaging](/robotics/rl-8-mode-averaging/) again. This has nothing to do with extrapolation error. There's no unrecorded action and no inflated estimate, just content you didn't want in the data. And a method built for the first problem can make this one worse, because BCQ and TD3+BC deliberately keep the policy close to the recorded actions, mistakes included.

There's real evidence that this matters with human teleoperation. In [robomimic (Mandlekar et al., 2021)](https://arxiv.org/abs/2108.03298), plain behavior cloning on a task where the robot puts a square nut on a rod reached 58.7% success with the better operators' 100 demonstrations, and 46.7% once the worse operators' 100 were added (3 seeds).

<details>
<summary>More of the robomimic result</summary>

A recurrent copier, BC-RNN, went the other way on the same mixture, from 66.0% to 73.3%, and the batch RL methods they tried, BCQ and CQL, did worse than plain behavior cloning on these mixed human datasets. The paper doesn't isolate why BC-RNN gained, so it doesn't show that a better copier always absorbs bad demonstrations.

Operators were grouped by skill, and each group recorded 100 demonstrations. On a task where the robot moves a can into a target bin, the same change took plain behavior cloning from 83.3% to 76.0%, and BC-RNN from 99.3% to 100.0%. BC-RNN sees a history of observations instead of only the current one. The authors sum it up as most algorithms declining when the worse demonstrations were added, while BC-RNN improved. The rewards were binary task completion. These are their results, the best success rate during training averaged over 3 seeds, in their 2021 setup.

</details>

<div class="rc-mark" id="sec-reward-aware" data-panel="weight" data-view="weight" data-title="Fix the mistakes: weight by advantage"></div>

## Fix the mistakes: weight by advantage

[Off-policy learning](/robotics/rl-4-on-policy-and-off-policy/) is what lets you learn from data someone else collected, but permission to reuse data doesn't say which of the recorded actions were good. The usual measure is the [advantage](/robotics/rl-2-bootstrapping/#sec-gae), $A(s,a)=Q(s,a)-V(s)$: how much better an action did than what usually happens from that state. Say the rotate-then-grasp action has advantage +1 and the straight grasp −2.

**Advantage-Weighted Regression (AWR)** ([Peng et al., 2019](https://arxiv.org/abs/1910.00177)) still fits the recorded actions, but it multiplies each one's importance by $\exp(A/\beta)$, where $\beta>0$ is a temperature. With $\beta=1$, the good grasp's total weight is its 70% share times $e^{1}$, about 1.90, and the bad one's is $0.3\,e^{-2}\approx0.04$, so about 98% of the copy goes to the good grasp. With $\beta=5$ it's 81%, and a large $\beta$ flattens the weights back toward plain copying. IQL extracts its policy the same way, with advantages from its in-sample critic.

You can also give the policy the advantage as an extra input and ask for a high one at test time. [Reward-Conditioned Policies (Kumar, Peng and Levine, 2019)](https://arxiv.org/abs/1912.13465) introduced an advantage-conditioned variant, and [π\*0.6 (Physical Intelligence, 2025)](https://arxiv.org/abs/2511.14759) applies it to a robot foundation model with one bit: is this action's advantage above a threshold?

<details>
<summary>AWR, advantage tags and TD3+BC in detail</summary>

The advantage-conditioned variant rests on the idea that a mediocre action is a perfect example of mediocre behavior, so nothing has to be thrown away. π\*0.6 sets its threshold so that about 30% of the demonstration data counts as positive.

AWR's objective, over the recorded state and action pairs:

$$\max_\pi\;\sum_{(s,a)\in\text{log}}\log\pi(a\mid s)\,\exp\!\big(A(s,a)/\beta\big).$$

<div class="ct ct-words">

| Training | Share of the copy going to the good grasp |
| --- | ---: |
| Plain behavior cloning | 70% |
| AWR, $\beta=5$ | 81% |
| AWR, $\beta=1$ | 98% |

</div>

The authors clip very large weights because they can make training unstable. IQL writes the factor as $\exp(\beta(Q-V))$, so its $\beta$ is an inverse temperature.

π\*0.6 marks human corrections as positive, which, in their words, is reasonable if experts always provide good corrective actions. Later in the same paper they qualify that assumption: even expert operators can't guarantee a consistent quality of interventions, so the corrections mainly fix large mistakes.

TD3+BC's $Q$ term also uses the reward, by tilting the copy toward actions with higher estimates. Its squared-distance term still pulls toward every recorded action in that state.

</details>

<div class="rc-mark" id="sec-needs" data-panel="needs" data-view="needs" data-title="What the reward-aware fixes need"></div>

## What the reward-aware fixes need

All of them work by trusting a number attached to each recorded action. So they need rewards that separate good from bad, value estimates that are right on the data, good actions in the states that matter, and true records. With a binary success reward, for example, a hesitant attempt that still succeeds scores the same as a clean one unless a discount or a cost per step tells them apart. And weighting only chooses among recorded actions, so if every recorded attempt fumbles one particular step, no weighting produces a clean version of it.

None of this is guaranteed by a method's name. In the game's version of the problem, the log mixes 50 episodes of a good controller with 50 episodes of random commands. IQL ended 0.22 m from the target, and AWR ended at 0.57 m, no better than a Gaussian copy of everything at 0.56 m (3 seeds, simulation). Both weight actions by an advantage, so in this toy how the advantage was estimated mattered more than the idea of weighting.

<details>
<summary>What each method uses, and where it helps</summary>

On the game's mixed log, the other methods ended at 0.33 m (CQL), 0.35 m (copying only the best episodes), 0.50 m (TD3+BC) and 0.51 m (the one-bit advantage tag), after 8,000 training steps. The length of an episode alone doesn't separate a hesitant success from a clean one: with no discount, both returns are 1.

<div class="ct ct-words">

| Method | Uses | Helps when | Limits |
| --- | --- | --- | --- |
| Behavior cloning | Actions only | The log is uniformly good | Copies mistakes and can't beat the data |
| Copy the best episodes | Episode returns | Good and bad episodes are easy to rank | Throws data away, and ranks whole episodes, not steps |
| AWR | Advantage from fitted returns | Advantages are accurate | Temperature to tune, and noisy returns give noisy weights |
| IQL | In-sample Q and expectile V | Good actions are recorded somewhere | Best of the data at most, with $\tau$ and $\beta$ to tune |
| Advantage conditioning | Advantage as an input | Many data sources of different quality | Depends on the advantage estimate and threshold |
| TD3+BC | Q gradient plus copy term | Data near good actions, modest critic error | Copy term pulls toward recorded mistakes too |

</div>

</details>

<div class="rc-mark" id="sec-corruption" data-panel="records" data-view="records" data-title="Bad behavior or bad records?"></div>

## Bad behavior or bad records?

Everything above assumed the log tells the truth. The new operator's straight grasp really happened, in the recorded state, with the recorded result. That's **poor behavior**, bad actions with correct labels, and reward-aware reuse can handle it under the conditions above.

**Corrupted data** is different, because the record itself is false. On a robot that can look like camera frames and arm commands logged with a clock offset, a command the arm couldn't follow stored as if it had happened, or a failed grasp marked as a success. A reward-aware method takes every record at face value, so a false success gets a large weight from AWR and a positive tag from advantage conditioning. Off-policy learning can't repair it either, since it can reuse a transition from another policy only if that transition is real. These fixes belong to the data pipeline: synchronize the clocks, record the executed action next to the command, audit success labels, and drop episodes that fail consistency checks.

<details>
<summary>The three problems side by side</summary>

<div class="ct ct-words">

| | Extrapolation error | Poor behavior | Corrupted records |
| --- | --- | --- | --- |
| What's wrong | A question the data can't answer | Bad actions, true labels | False states, actions or rewards |
| Example above the mug | Sweep never recorded, estimate 9 | Straight grasp recorded, often fails | Failed grasp labeled success |
| What helps | BCQ, CQL, IQL, TD3+BC, BC | AWR, IQL, advantage conditioning, filtering | Fixing the data pipeline |
| What doesn't | Replaying the log more often | Copying everything | Any method that trusts the labels |

</div>

</details>

The next part looks at a problem that remains even when every demonstration is good and correctly recorded: two good ways to do the same thing. [Part 8: mode averaging](/robotics/rl-8-mode-averaging/).

<details>
<summary>Sources and what each one supports</summary>

- **Extrapolation error and BCQ.** [Fujimoto, Meger and Precup, 2019](https://arxiv.org/abs/1812.02900), Section 3 (definition and causes: absent data, model bias, training mismatch) and Section 4 (batch-constrained action selection).
- **TD3+BC.** [Fujimoto and Gu, 2021](https://arxiv.org/abs/2106.06860), Section 5, equations 3 to 5, with $\alpha=2.5$ and state normalization.
- **CQL.** [Kumar, Zhou, Tucker and Levine, 2020](https://arxiv.org/abs/2006.04779), abstract and Section 3: a conservative Q-function whose expected value lower-bounds the policy's value.
- **IQL.** [Kostrikov, Nair and Levine, 2021](https://arxiv.org/abs/2110.06169), Section 4: expectile loss, $V$ fitted over dataset actions (equation 5), $Q$ fitted to $r+\gamma V(s')$ (equation 6), advantage-weighted extraction (equation 7). The 3.93 is a calculation for the two-value example: the 0.9 expectile $m$ solves $0.9\cdot0.6(4-m)=0.1\cdot0.4(m-3)$.
- **AWR.** [Peng, Kumar, Zhang and Levine, 2019](https://arxiv.org/abs/1910.00177): weights $\exp(A/\beta)$, clipped at a maximum, usable with fully off-policy data. The 70%, 81% and 98% are calculations for the illustrative advantages.
- **Advantage conditioning.** [Kumar, Peng and Levine, 2019](https://arxiv.org/abs/1912.13465), Section 4 (advantage-conditioned variant). [π\*0.6, Physical Intelligence, 2025](https://arxiv.org/abs/2511.14759), Section IV equation 3, Section V on the limits of human corrections, and the appendix on thresholds (about 30% positive in pre-training, about 40% of rollouts in fine-tuning).
- **robomimic.** [Mandlekar et al., 2021](https://arxiv.org/abs/2108.03298), Section 2 (operator proficiency, missed grasps) and Section 4.2, Table 2 (success rates over 3 seeds, with 100 demonstrations in the Better and Worse subsets and 200 in the mixtures; BC and BC-RNN columns, and the authors' statement that most algorithms decline while BC-RNN improves). Task descriptions from Section 3.1. Binary task-completion rewards, Appendix C. Author-reported, in their 2021 setup and hyperparameters.
- **Breaking Bellman.** Offline reach levels from the game's [experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/681cae3820f05f8604d212c0ab048ebf0e017e73/EXPERIMENTS.md) and `web/measured.js` at commit 681cae3. Expert data: 100 controller episodes. Mixed data: 50 controller and 50 random-command episodes. 3 seeds, and distances are final tip distances. Simulation of a two-link arm, not a real robot.
- **Mug example.** The estimates 4, 3 and 9, the 70/30 split and the advantages +1 and −2 are made up to show the mechanisms.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
