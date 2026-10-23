---
title: 'Mode averaging: two good routes, one bad average'
description: 'Why copying demonstrations that go left and right around a box can send a robot into the box, and what flow policies and action chunks change.'
date: '2026-10-21'
updated: '2026-10-22'
draft: false
series: 'reinforcement-learning'
part: 8
layout: essay
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-8-mode-averaging-routes.svg'
thumbnail_alt: 'Two blackboard panels: two safe routes around a box whose point-by-point average goes through it, and a squared-error fit that picks the middle, 0, between demonstrations at −1 and +1'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 890" data-whole="0 0 840 890" data-views='{"routes": [18, 46, 384, 240], "mean": [438, 46, 384, 240], "chunks": [18, 341, 384, 240], "modes": [438, 341, 384, 240], "flow": [18, 636, 384, 240], "limits": [438, 636, 384, 240]}' role="img" aria-labelledby="ma8-title ma8-desc"><title id="ma8-title">Mode averaging: six blackboard panels</title><desc id="ma8-desc">Panel 1: seen from above, a left route and a right route around a box, both safe; their point-by-point average goes straight through the box. Panel 2: demonstrated offsets at minus 1 and plus 1; the squared-error answer is 0, inside the box band, and a single bell curve fitted to them peaks at 0 with 38 percent of samples in the box; an arrow points from the label squared-error fit to that answer. Panel 3: with one command and a new look each time, a small lean grows into one route; with a chunk of commands and no looking, the averaged chunk runs through the box. In the game's fork level with 10 commands per decision, a Gaussian copy reached the goal 33 percent of the time, a deterministic copy 67 percent and a flow copy 85 percent. Panel 4: four kinds of model that can hold two answers: a mixture, action tokens, a hidden style variable, and diffusion or flow. Panel 5: three noise starts follow a flow over integration time to plus 1 or minus 1; the robot moves only after integration ends. Panel 6: the learned flow splits the noise starts into a region for the left route, a region for the right route, and a route in 5 percent of the data may get only a sliver or nothing; noise near the divide between regions can land between the routes, and the game's flow copy with 10-command chunks still hit the obstacle 3.65 times per test; a flow copies routes without judging them, a chunk still runs without looking, and every chunk costs 10 network passes.</desc>
<defs><marker id="ma8-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-chalk" stroke-width="1.8"/></marker><marker id="ma8-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-red" stroke-width="1.8"/></marker></defs>
<g font-size="17">
<g class="rc-panel" data-panel="routes"><rect x="10" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="38">1. Two safe routes, one bad average</text>
<rect x="180" y="128" width="60" height="60" rx="4" class="c-dim" fill-opacity=".25" stroke="#656b62" stroke-width="2"/><text x="210" y="182" class="c-dim" text-anchor="middle" font-size="14">box</text>
<circle cx="66" cy="158" r="8" fill="none" class="s-chalk" stroke-width="2"/><text x="66" y="184" class="c-chalk" text-anchor="middle" font-size="14">start</text>
<circle cx="354" cy="158" r="9" fill="none" class="s-chalk" stroke-width="2"/><text x="354" y="184" class="c-chalk" text-anchor="middle" font-size="14">cup</text>
<path d="M66,158 C126,158 150,86 210,86 C270,86 294,158 354,158" fill="none" class="s-green" stroke-width="3"/>
<path d="M66,158 C126,158 150,230 210,230 C270,230 294,158 354,158" fill="none" class="s-green" stroke-width="3"/>
<path d="M74,158 L345,158" fill="none" class="s-red" stroke-width="3" stroke-dasharray="8 6"/>
<g class="c-green"><circle cx="105.6" cy="147.2" r="4.5"/><circle cx="170.4" cy="96.8" r="4.5"/><circle cx="210" cy="86" r="4.5"/><circle cx="249.6" cy="96.8" r="4.5"/><circle cx="314.4" cy="147.2" r="4.5"/></g>
<g class="c-green"><circle cx="105.6" cy="168.8" r="4.5"/><circle cx="170.4" cy="219.2" r="4.5"/><circle cx="210" cy="230" r="4.5"/><circle cx="249.6" cy="219.2" r="4.5"/><circle cx="314.4" cy="168.8" r="4.5"/></g>
<g class="c-red"><circle cx="105.6" cy="158" r="4.5"/><circle cx="170.4" cy="158" r="4.5"/><circle cx="210" cy="158" r="4.5"/><circle cx="249.6" cy="158" r="4.5"/><circle cx="314.4" cy="158" r="4.5"/></g>
<text x="210" y="74" class="c-green" text-anchor="middle" font-size="16">left route, safe</text><text x="210" y="254" class="c-green" text-anchor="middle" font-size="16">right route, safe</text>
<text x="30" y="280" class="c-red" font-size="16">average, point by point: through the box</text></g>
<g class="rc-panel" data-panel="mean"><rect x="430" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="38">2. Squared error picks the middle</text>
<rect x="580" y="84" width="100" height="136" class="c-red" fill-opacity=".14"/><text x="630" y="78" class="c-red" text-anchor="middle" font-size="15">box: |y| &lt; 0.5</text>
<rect x="522" y="110" width="16" height="110" class="c-green"/><rect x="722" y="110" width="16" height="110" class="c-green"/>
<text x="530" y="102" class="c-dim" text-anchor="middle" font-size="14">demos</text><text x="730" y="102" class="c-dim" text-anchor="middle" font-size="14">demos</text>
<path d="M450.0,196.3 L465.0,189.2 L480.0,181.0 L495.0,171.8 L510.0,161.6 L525.0,150.9 L540.0,140.0 L555.0,129.4 L570.0,119.8 L585.0,111.6 L600.0,105.3 L615.0,101.3 L630.0,100.0 L645.0,101.3 L660.0,105.3 L675.0,111.6 L690.0,119.8 L705.0,129.4 L720.0,140.0 L735.0,150.9 L750.0,161.6 L765.0,171.8 L780.0,181.0 L795.0,189.2 L810.0,196.3" fill="none" class="s-chalk" stroke-width="2"/>
<text x="752" y="128" class="c-chalk" font-size="14">bell curve</text><path d="M778,134 L786,180" class="s-dim" stroke-width="1.5"/>
<text x="630" y="150" class="c-red" text-anchor="middle" font-size="15">squared-error fit</text><path d="M630,158 L630,204" class="s-red" stroke-width="2" marker-end="url(#ma8-ar)"/><circle cx="630" cy="216" r="6" class="c-red"/>
<path d="M450,220 L812,220" class="s-dim" stroke-width="2"/>
<g class="c-chalk" text-anchor="middle" font-size="15"><text x="530" y="240">−1</text><text x="630" y="240">0</text><text x="730" y="240">+1</text></g>
<text x="630" y="258" class="c-dim" text-anchor="middle" font-size="14">offset y, in 10 cm units</text>
<text x="445" y="282" class="c-chalk" font-size="16">one bell curve: <tspan class="c-red">38%</tspan> of samples in the box</text></g>
<g class="rc-panel" data-panel="chunks"><rect x="10" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="333">3. Chunks remove the chance to correct</text>
<text x="30" y="368" class="c-chalk" font-size="15">one command, look again</text><text x="222" y="368" class="c-chalk" font-size="15">10 commands, no looking</text>
<path d="M210,350 L210,530" class="s-faint" stroke-width="1.5" stroke-dasharray="3 5"/>
<rect x="100" y="415" width="40" height="50" rx="3" class="c-dim" fill-opacity=".25" stroke="#656b62" stroke-width="2"/><rect x="292" y="415" width="40" height="50" rx="3" class="c-dim" fill-opacity=".25" stroke="#656b62" stroke-width="2"/>
<circle cx="40" cy="440" r="6" fill="none" class="s-chalk" stroke-width="2"/><circle cx="190" cy="440" r="7" fill="none" class="s-chalk" stroke-width="2"/>
<circle cx="232" cy="440" r="6" fill="none" class="s-chalk" stroke-width="2"/><circle cx="388" cy="440" r="7" fill="none" class="s-chalk" stroke-width="2"/>
<path d="M46,441 C72,443 92,474 120,480 C150,486 170,460 184,445" fill="none" class="s-green" stroke-width="2.5"/>
<g class="c-green"><circle cx="62" cy="443" r="3.5"/><circle cx="84" cy="458" r="3.5"/><circle cx="108" cy="476" r="3.5"/><circle cx="136" cy="481" r="3.5"/><circle cx="162" cy="470" r="3.5"/></g>
<path d="M238,440 L381,440" fill="none" class="s-red" stroke-width="2.5" stroke-dasharray="7 5"/>
<g class="c-red"><circle cx="258" cy="440" r="4"/><circle cx="282" cy="440" r="4"/><circle cx="306" cy="440" r="4"/><circle cx="330" cy="440" r="4"/><circle cx="354" cy="440" r="4"/></g>
<text x="30" y="520" class="c-dim" font-size="14">a small lean grows into one route</text><text x="222" y="520" class="c-red" font-size="14">the averaged chunk runs through</text>
<text x="30" y="550" class="c-dim" font-size="14">game fork level, 10 commands per decision, reached the goal:</text>
<g class="c-chalk" font-size="15"><text x="30" y="574">Gaussian 33%</text><text x="140" y="574">deterministic 67%</text><text x="290" y="574">flow 85%</text></g></g>
<g class="rc-panel" data-panel="modes"><rect x="430" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="333">4. Models that can hold two answers</text>
<g class="c-chalk" font-size="15"><text x="445" y="366">mixture of bell curves</text><text x="640" y="366">action tokens (bins)</text><text x="445" y="482">hidden style (CVAE)</text><text x="640" y="482">diffusion or flow</text></g>
<path d="M630,350 L630,575 M445,462 L820,462" class="s-faint" stroke-width="1.5" stroke-dasharray="3 5" fill="none"/>
<path d="M450,445 L620,445" class="s-dim" stroke-width="1.5"/>
<path d="M455,445 C472,445 482,392 495,392 C508,392 518,445 535,445" fill="none" class="s-green" stroke-width="2.5"/><path d="M535,445 C552,445 562,392 575,392 C588,392 598,445 615,445" fill="none" class="s-green" stroke-width="2.5"/>
<path d="M645,445 L815,445" class="s-dim" stroke-width="1.5"/>
<g class="c-green"><rect x="648" y="439" width="14" height="6"/><rect x="667" y="405" width="14" height="40"/><rect x="686" y="393" width="14" height="52"/><rect x="705" y="437" width="14" height="8"/></g><rect x="724" y="443" width="14" height="2" class="c-dim"/><g class="c-green"><rect x="743" y="437" width="14" height="8"/><rect x="762" y="393" width="14" height="52"/><rect x="781" y="405" width="14" height="40"/><rect x="800" y="439" width="14" height="6"/></g>
<ellipse cx="478" cy="535" rx="28" ry="16" fill="none" class="s-blue" stroke-width="2"/><text x="478" y="540" class="c-blue" text-anchor="middle" font-size="15">style</text>
<path d="M506,529 Q536,508 566,508" fill="none" class="s-green" stroke-width="2.2" marker-end="url(#ma8-a)"/><path d="M506,541 Q536,562 566,562" fill="none" class="s-green" stroke-width="2.2" marker-end="url(#ma8-a)"/>
<text x="574" y="513" class="c-green" font-size="15">right</text><text x="574" y="567" class="c-green" font-size="15">left</text>
<g class="c-blue"><circle cx="655" cy="512" r="3"/><circle cx="660" cy="526" r="3"/><circle cx="652" cy="538" r="3"/><circle cx="661" cy="550" r="3"/><circle cx="654" cy="563" r="3"/></g>
<g fill="none" stroke-width="2"><path d="M658,512 C710,512 740,506 805,503" class="s-green"/><path d="M663,526 C710,526 745,510 805,505" class="s-green"/><path d="M655,538 C705,538 750,560 805,565" class="s-green"/><path d="M664,550 C710,552 750,563 805,567" class="s-green"/><path d="M657,563 C705,564 750,566 805,569" class="s-green"/></g></g>
<g class="rc-panel" data-panel="flow"><rect x="10" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="628">5. A flow turns noise into one plan</text>
<text x="56" y="652" class="c-dim" font-size="14">integration time τ, inside the computer</text>
<path d="M40,658 L40,830 L345,830" fill="none" class="s-dim" stroke-width="2"/><path d="M40,740 L345,740" class="s-faint" stroke-width="1.5" stroke-dasharray="4 5"/>
<rect x="343" y="700" width="8" height="80" class="c-red" fill-opacity=".25" stroke="#b44c2c" stroke-width="1.5"/>
<path d="M40,716.0 L70,718.4 L100,720.5 L130,722.2 L160,723.2 L190,722.9 L220,719.9 L250,710.2 L280,693.6 L310,676.8 L340,660.0" fill="none" class="s-green" stroke-width="2.5"/>
<path d="M40,804.0 L70,797.6 L100,792.0 L130,787.5 L160,784.7 L190,784.6 L220,788.6 L250,796.0 L280,804.0 L310,812.0 L340,820.0" fill="none" class="s-green" stroke-width="2.5"/>
<path d="M40,736.0 L70,736.4 L100,736.8 L130,737.0 L160,737.2 L190,737.1 L220,736.6 L250,734.2 L280,722.6 L310,691.3 L340,660.0" fill="none" class="s-red" stroke-width="2.5" stroke-dasharray="6 4"/>
<g font-size="14"><text x="48" y="708" class="c-green">start 0.3</text><text x="48" y="756" class="c-red">start 0.05</text><text x="48" y="822" class="c-green">start −0.8</text></g>
<g font-size="14"><text x="354" y="666" class="c-green">right</text><text x="356" y="745" class="c-red">box</text><text x="354" y="826" class="c-green">left</text></g>
<g class="c-dim" text-anchor="middle" font-size="14"><text x="40" y="848">τ = 0</text><text x="190" y="848">0.5</text><text x="340" y="848">1</text></g>
<text x="30" y="872" class="c-chalk" font-size="15">The robot moves only after τ = 1.</text></g>
<g class="rc-panel" data-panel="limits"><rect x="430" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="444" y="628">6. What a flow still doesn't guarantee</text>
<text x="445" y="654" class="c-dim" font-size="14">noise starts, split by the learned flow</text>
<g class="c-green" text-anchor="middle" font-size="15"><text x="533" y="680">left route</text><text x="702" y="680">right route</text></g><text x="796" y="680" class="c-chalk" text-anchor="middle" font-size="14">rare</text>
<g class="c-green" fill-opacity=".8"><rect x="450" y="688" width="166" height="10"/><rect x="624" y="688" width="158" height="10"/></g><rect x="792" y="688" width="8" height="10" class="c-chalk"/>
<path d="M620,682 L620,706" class="s-red" stroke-width="2.5"/>
<text x="620" y="722" class="c-red" text-anchor="middle" font-size="14">near the divide: can land between</text>
<text x="810" y="744" class="c-chalk" text-anchor="end" font-size="14">a route in 5% of the data may get a sliver, or none</text>
<text x="445" y="768" class="c-dim" font-size="14">game, 10-command chunks: still 3.65 hits per test</text>
<g class="c-chalk" font-size="15"><text x="445" y="800">It copies routes, it doesn't judge them.</text><text x="445" y="826">A chunk still runs without looking.</text><text x="445" y="852">10 network passes for every chunk.</text></g></g>
</g></svg></div></div>
<div class="rc-body">

Suppose you teleoperate a robot arm to reach a cup that sits behind a box. Half the time you go around the left side and half the time around the right, and both are good demonstrations. Train a policy that predicts one action to be as close as possible to every demonstration, and it can learn the average, straight through the box. This is **mode averaging**, and it doesn't come from a bad reward or a wrong value estimate. It comes from asking one answer to stand in for two different good answers.

**Part 8.** [Previously: learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/). The [failure map in part 0](/robotics/rl-0-overview/#sec-failures) puts this problem under "copying the wrong thing", next to copying bad demonstrations from part 7.

<div class="rc-mark" id="sec-routes" data-panel="routes" data-view="routes" data-title="Two safe routes, one bad average"></div>

## Two safe routes, one bad average

Seen from above, each route is a safe plan on its own. Each dot is one waypoint of a five-step plan. Average the left plan and the right plan point by point and you get five waypoints on the center line, and the straight segment between them crosses the box. The space of safe plans isn't convex, so the midpoint of two safe plans doesn't have to be safe.

A **mode** is a distinct cluster of good actions or plans for the same situation. Here there are two, the left route and the right route, and the demonstrations are split evenly between them.

<div class="rc-mark" id="sec-mean" data-panel="mean" data-view="mean" data-title="Squared error picks the middle"></div>

## Squared error picks the middle

Let's make it small enough to calculate. Measure how far the gripper passes to the side of the box with one number $y$, in units of 10 cm. The left route passes at $y=-1$ and the right route at $y=+1$. The box covers $|y|<0.5$, so anything closer to the center than half a unit hits it.

Now train a policy $f(o)$ that outputs one number for the observation $o$, using squared error over the $N$ demonstrated offsets $y_i$. The fit chooses the output that minimizes

$$\frac{1}{N}\sum_{i=1}^{N}\big(f(o)-y_i\big)^2.$$

The minimizer of a squared error is the mean, and with half the demonstrations at $-1$ and half at $+1$, that mean is $0$, the center of the box. More data only makes the estimate of the mean more precise, and the mean is the wrong summary of these demonstrations.

A single bell curve doesn't fix it either. Fit a Gaussian with a learned mean and spread to the same data by maximum likelihood, and you get mean $0$ and standard deviation $1$. It still peaks at the box, and if you sample from it once and commit, about 38% of samples fall inside $|y|<0.5$. A single bell curve has one peak, so it can't put its weight on $-1$ and $+1$ while leaving the middle empty.

These are teaching numbers on idealized data. They don't say that every policy of this kind hits the obstacle on a real robot, and the next section shows why the outcome depends a lot on how often the robot gets to look again.

<div class="rc-mark" id="sec-chunks" data-panel="chunks" data-view="chunks" data-title="Chunks remove the chance to correct"></div>

## Chunks remove the chance to correct

Suppose the robot picks one small command, moves a little, looks again and picks the next command. If the first command leans slightly to the right, the next observation shows the gripper a bit to the right of center. That state looks more like the right-route demonstrations, so the next command leans further right. The exact middle is unstable, so a small lean grows and the robot commits to one side.

Now let the policy output several future commands at once and execute them before it asks again. That's an **action chunk**. Chunks are useful: they make motion smoother, they reduce how often a large model has to run, and [ACT (Zhao et al., 2023)](https://arxiv.org/abs/2304.13705) uses them to cut the number of decisions in a task. But within a chunk, the robot can't use feedback to break the tie, and the longer the chunk, the more of the motion is decided by that midpoint before anyone looks again.

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a level with two ways around an obstacle. It trains three copies of the same demonstrations: a Gaussian copy, a **deterministic copy** that outputs one action trained with squared error, and a flow copy. With one command per decision, all three reached the goal in every test. With 10 commands per decision played without looking, they reached it 33%, 67% and 85% of the time. That's one toy, not a ranking of methods.

<details>
<summary>What the game measured, and what it doesn't show</summary>

Fork level, 3 seeds, simulation. With one command per decision, all three copies reached the goal in every test. With 10 commands per decision played without looking, the Gaussian copy reached the goal 33% of the time with 15.0 obstacle hits per test, the deterministic copy 67% with 13.7 hits, and the flow copy 85% with 3.65 hits. The flow's 85% uses the level's own settings (step size 0.003, batches of 128). With the game's default settings (step size 0.001, batches of 64), the flow copy reached 63%, and the log doesn't give the other two copies at those settings.

The game's log notes that the gap depends on the training budget, since with 10,000 updates the deterministic copy reached 100%. It also doesn't record where the chunked copies hit the obstacle, so these numbers don't show that the failures went through the middle.

</details>

Chunks don't cause the problem by themselves. If the policy can sample a whole chunk from one mode, all five waypoints come from the left route or all from the right. The trouble is a chunk produced by a model that can only express the average.

<div class="rc-mark" id="sec-modes" data-panel="modes" data-view="modes" data-title="Models that can hold two answers"></div>

## Models that can hold two answers

What we need is a policy that, given the same observation, can output $-1$ on one call and $+1$ on another, and almost never $0$. Several kinds of models can represent this:

- **A mixture** of several Gaussians, each one able to sit on a different mode.
- **Discrete action tokens**, which turn the action into a classification problem with one probability per bin.
- **A conditional variational autoencoder**, which ACT uses so that a hidden variable can select a style of demonstration.
- **Diffusion and flow models**, which start from random noise and transform it into an action.

[Diffusion Policy (Chi et al., 2023)](https://arxiv.org/abs/2303.04137) shows the effect in a pushing task where the end effector can go left or right around a T-shaped block. The authors report that their policy learns both modes and commits to one within each rollout, while two of their baselines lean toward one mode and another fails to commit. The rest of this article follows the flow-model branch, because it's the one used by [π0 (Black et al., 2024)](https://arxiv.org/abs/2410.24164), a robot foundation model that outputs action chunks.

<div class="rc-mark" id="sec-flow" data-panel="flow" data-view="flow" data-title="A flow turns noise into one plan"></div>

## A flow turns noise into one plan

A flow policy doesn't output an action directly. It outputs a direction to move in. Let $x$ be a candidate action chunk, $\tau$ a number from 0 to 1 that we'll call **integration time**, and $o$ the observation. A network $v_\theta$ with weights $\theta$ predicts a velocity, and the candidate follows it:

$$\frac{dx}{d\tau}=v_\theta(x,\tau,o).$$

Start with $x$ drawn from random noise at $\tau=0$ and follow the velocity until $\tau=1$, which π0 does in ten small steps. The end point is the action chunk the robot executes.

**Integration time is not robot time.** All ten of those steps happen inside the computer, before the robot moves at all, and the intermediate values of $x$ are not positions the gripper visits. In π0 a chunk holds 50 future actions. On its 50 Hz robots, the authors execute 25 of them, half a second, and then run the model again.

Where does the choice of mode come from? From the starting noise. In the drawing, with the exact velocity field a perfect learner would end up with for our even two-route split, a start at 0.3 ends on the right route, a start at −0.8 on the left route, and a start at 0.05 hesitates near the middle and then commits to the right. Only a start almost exactly at 0 ends at the average. So the velocity field splits the noise into regions, and each region flows to a different mode.

<details>
<summary>The trajectories in the drawing, step by step</summary>

In the exact, continuous flow, the only start that ends at the average is exactly 0, which a continuous noise distribution draws with probability zero. Ten coarse steps leave a thin band: in this example, a start closer to 0 than about 0.00012 still finishes inside the box, which a standard normal draws about once in 10,000 tries.

Each of π0's ten steps uses the simplest rule, forward Euler: $x \leftarrow x+0.1\,v_\theta(x,\tau,o)$ and $\tau\leftarrow\tau+0.1$. The table uses starting noise drawn from a standard normal, the exact velocity field for an even split between $-1$ and $+1$, and ten Euler steps of size 0.1:

<div class="ct ct-words">

| Starting noise | After 5 steps | After 10 steps | Plan |
| ---: | ---: | ---: | --- |
| 0.3 | 0.21 | 1.00 | right route |
| −0.8 | −0.56 | −1.00 | left route |
| 0.05 | 0.04 | 1.00 | right route |
| 0 exactly | 0 | 0 | the average |

</div>

</details>

<details>
<summary>How the velocity is trained, and the exact field in the example</summary>

π0 trains the network with a flow matching loss. Take a demonstrated chunk $A$, draw noise $\epsilon$ from a standard normal and a time $\tau$ between 0 and 1, then blend them:

$$x_\tau=\tau A+(1-\tau)\epsilon.$$

The training target is the direction from the noise to the demonstration, $u=A-\epsilon$, and the loss is the squared distance between the network's velocity and that target:

$$L(\theta)=\mathbb E\big\|v_\theta(x_\tau,\tau,o)-(A-\epsilon)\big\|^2.$$

This is still a squared error, so it is still minimized by a mean. The difference is what gets averaged. The network learns the average direction at a given noisy point $x_\tau$, and at most noisy points the demonstrations that could have produced it mostly belong to one route. So the averaged direction points toward one mode, not toward the middle. [Lipman et al. (2022)](https://arxiv.org/abs/2210.02747) introduced flow matching as a general method. π0 sets it up in its Section IV, with a chunk of $H=50$ actions and 10 integration steps. The current arXiv version (v4) prints the target as $A-\epsilon$, as here. Versions 1 to 3 printed $\epsilon-A$, which has the opposite sign from both the blend above and the forward Euler step, so check the version if you compare against the paper.

For the table, the data are $A=+1$ or $A=-1$ with equal probability and one-dimensional noise. Let $m(x,\tau)$ be the expected $A$ given $x_\tau=x$, computed from the two Gaussians centered at $\pm\tau$ with spread $1-\tau$. The exact field is

$$v(x,\tau)=\frac{m(x,\tau)-x}{1-\tau},$$

and the table applies the Euler rule above from $\tau=0$ to $\tau=1$. This is a calculation with a perfect field, not a trained network. The thin band comes from the same calculation: with these ten steps, a start of 0.0001 ends at about 0.42, while with 20 steps even a start of 0.000001 ends at a route.

</details>

<div class="rc-mark" id="sec-flow-limits" data-panel="limits" data-view="limits" data-title="What a flow still doesn't guarantee"></div>

## What a flow still doesn't guarantee

Being able to represent two modes is not the same as learning both of them.

- **Coverage is not guaranteed.** If one route appears in 5% of the data, the learned field may give it a tiny region of the noise, or none.
- **The dividing line is where errors live.** A learned field is approximate, and noise near the boundary between regions is the most likely to end in between. In the game's fork level, the flow copy still hit the obstacle 3.65 times per test with 10-command chunks.
- **It copies, it doesn't judge.** A flow policy reproduces the routes in the data, including slow or risky ones. Choosing the better mode needs a reward or a value estimate, the subject of [the previous part on mixed-quality data](/robotics/rl-7-learning-from-fixed-data/#sec-mixed).
- **Chunks still run open loop.** One consistent chunk fixes averaging inside the chunk, but the robot can't react to something that changes during those 25 commands. π0's authors report that temporal ensembling, which averages overlapping chunks, hurt performance, so they execute chunks without blending.
- **It costs computation.** Every chunk needs 10 network evaluations of the action part of the model instead of one.

So the failure and the remedy are different things. Mode averaging is what happens when a model that can only express one answer is trained on demonstrations with two. A flow policy is one way to express both answers: it chooses between them using random noise, and the training data decides how much of the noise goes to each.

<details>
<summary>Policy outputs compared on the two-route example</summary>

<div class="ct ct-words">

| Policy output | Two even routes, sampled once and executed as a chunk | Needs |
| --- | --- | --- |
| One action, squared error | The mean: 0, inside the box | Nothing extra |
| One Gaussian | Peak at 0, 38% of samples in the box | A spread estimate |
| Mixture or tokens | Can put weight on both routes | Choosing the number of components or bins |
| Flow or diffusion | Each noise start flows to one route | Several integration steps per chunk |

</div>

The table uses the idealized two-route example from this article. Closed-loop feedback, the size of the network and the training budget can change the outcome on a real robot.

</details>

This is the last part of the series. To see where mode averaging sits among the other failures, go back to [the failure map in part 0](/robotics/rl-0-overview/#sec-failures).

<details>
<summary>Sources and what each one supports</summary>

- **Squared error and the mean.** A standard result: the constant that minimizes the average squared distance to a set of numbers is their mean. The Gaussian numbers come from fitting mean and variance to an even split at ±1 (mean 0, variance 1), and the 38% is the probability that a standard normal lies within ±0.5. Teaching calculation.
- **π0.** [Black et al., 2024](https://arxiv.org/abs/2410.24164), Section IV of arXiv v4 (8 January 2026): action chunks of $H=50$, flow matching loss with $x_\tau=\tau A+(1-\tau)\epsilon$ and target $A-\epsilon$ (v1 to v3 print $\epsilon-A$), forward Euler with 10 steps of 0.1, and the statement that flow matching gives the model "multimodal modeling capability". Appendix D: 50 Hz robots run inference every 0.5 seconds after 25 actions, chunks run open loop, and temporal ensembling hurt performance.
- **Diffusion Policy.** [Chi et al., 2023](https://arxiv.org/abs/2303.04137), Section 4.1 and Figure 3: the Push-T left or right example, with the authors' description of how their baselines behave.
- **ACT.** [Zhao et al., 2023](https://arxiv.org/abs/2304.13705): action chunking to shorten the effective horizon, and a conditional variational autoencoder because human demonstrators use different trajectories for the same task.
- **Flow matching.** [Lipman et al., 2022](https://arxiv.org/abs/2210.02747).
- **Breaking Bellman.** Fork level numbers from the game's [experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/681cae3820f05f8604d212c0ab048ebf0e017e73/EXPERIMENTS.md) and `web/measured.js` at commit 681cae3, batch 23, 3 seeds (runs `tw-gauss-c10`, `tw-det-c10`, `tw-flow-c10` and their one-command versions). The log records that earlier fork results (batches 8 to 18) were wrong: the demonstrator skimmed the obstacle and hit it in 6 of 50 episodes, so the copies failed from imprecision near the edge rather than from averaging. These numbers come from the corrected world. Simulation.
- **Flow trajectories.** The starts 0.3, −0.8 and 0.05, the 0.00012 band and the once-in-10,000 rate are recomputed with the exact field above (ten Euler steps; the band edge is about 0.000123, and a standard normal falls within it with probability about 0.0001).

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
