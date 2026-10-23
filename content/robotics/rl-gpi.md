---
title: 'Generalized policy iteration: judge, improve, repeat'
description: 'The loop of evaluation and improvement inside most reinforcement learning methods, worked through on the cliff grid and traced from dynamic programming to AlphaGo Zero.'
date: '2026-10-23'
draft: false
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-gpi-loop.svg'
thumbnail_alt: 'Two blackboard panels: policy iteration on the cliff grid, whose start value climbs from −1072 to −12.25 in six rounds, and a spiral between evaluation and improvement that closes in on the optimal policy and value'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<style>
/* Keep each number in the round table on one line; the table box scrolls when it must. */
.article-body .gpi-rounds td:not(:last-child) { white-space: nowrap; }
.article-body .gpi-rounds :is(th, td) { overflow-wrap: normal; word-break: normal; hyphens: none; }
/* On a phone, shrink display math a little so the main equations fit the column. */
@media (max-width: 520px) { .article-body .katex-display > .katex { font-size: .9em; } }
</style>
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><!-- gpi-canvas --><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 1775" data-whole="0 0 840 1775" data-views='{"walker": [16, 46, 388, 368], "greedy": [436, 46, 388, 368], "never-worse": [16, 471, 388, 438], "rounds": [436, 471, 388, 438], "sweeps": [16, 966, 388, 378], "gpi": [436, 966, 388, 378], "family": [226, 1401, 388, 358]}' role="img" aria-labelledby="gpi-title gpi-desc"><title id="gpi-title">Generalized policy iteration on a blackboard</title><desc id="gpi-desc">Seven panels on the Part 1 cliff grid. 1: a random walker's values, −1072 at the start, and the Bellman expectation equation. 2: the greedy policy and one greedy step; no cell gets worse. 3: at the start the best move, −1002, beats the average, −1072. 4: six rounds of policy iteration, −1072 to −12.25. 5: value iteration, 14 sweeps. 6: a spiral between the policy and the value function that closes in on the optimum. 7: what evaluates and what improves in seven methods.</desc>
<defs>
<marker id="gpi-a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8"/></marker>
<marker id="gpi-ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#ff9f88" class="s-red" stroke-width="1.8"/></marker>
<marker id="gpi-ab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="1.6"/></marker>
<marker id="gpi-ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="1.6"/></marker>
<marker id="gpi-ay" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#ffe17c" class="s-yellow" stroke-width="1.6"/></marker>
</defs>
<g font-size="15">
<g class="rc-panel" data-panel="walker"><rect x="10" y="10" width="400" height="410" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="38" fill="#ffe17c" font-size="16">1. How good is a random walker?</text>
<text x="80" y="70" fill="#f4f1e8" class="c-chalk" font-size="19"><tspan fill="#a8e2a0" class="c-green">π(a | s)</tspan><tspan fill="#f4f1e8" class="c-chalk"> = 1/4 for each move a</tspan></text>
<path d="M106.03 76L106.03 83" stroke="#a8e2a0" class="s-green" stroke-width="1" stroke-opacity=".75"/>
<text x="106.03" y="95" fill="#a8e2a0" class="c-green" font-size="12" text-anchor="middle">policy: chance of move a in cell s</text>
<rect x="36" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.55" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.55" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.55" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.53" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.51" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.47" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.42" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.34" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="110" width="30" height="30" fill="#ff9f88" fill-opacity="0.28" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.58" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.59" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.60" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.60" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.60" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.59" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.58" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.52" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.46" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.37" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="140" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.64" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.67" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.67" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.66" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.63" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.58" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.45" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="170" width="30" height="30" fill="#ff9f88" fill-opacity="0.08" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="200" width="30" height="30" fill="#ff9f88" fill-opacity="0.70" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="200" width="30" height="30" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2"/>
<text x="381" y="221" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">G</text>
<rect x="66" y="200" width="300" height="30" fill="none" stroke="#c3c9bd" class="s-dim" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="216" y="220" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">cliff: −100, back to S</text>
<path d="M51 212L51 205" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<path d="M54 215L61 215" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<path d="M51 218L51 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<path d="M48 215L41 215" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<text x="32" y="220" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">S</text>
<rect x="368" y="172" width="26" height="26" fill="none" stroke="#ffe17c" class="s-yellow" stroke-width="2"/>
<text x="36" y="254" fill="#ff9f88" class="c-red" font-size="17">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(S) = −1072</text>
<text x="396" y="254" fill="#ffe17c" class="c-yellow" font-size="17" text-anchor="end">above G: −482</text>
<text x="210" y="274" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle">redder = worse</text>
<text x="38" y="324" fill="#f4f1e8" class="c-chalk" font-size="19"><tspan fill="#93d4ff" class="c-blue">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s)</tspan><tspan fill="#f4f1e8" class="c-chalk"> = </tspan><tspan fill="#f4f1e8" class="c-chalk">Σ</tspan><tspan fill="#a8e2a0" class="c-green"> π(a | s)</tspan><tspan fill="#f4f1e8" class="c-chalk"> Σ</tspan><tspan fill="#f4f1e8" class="c-chalk"> p(s′, r | s, a)</tspan><tspan fill="#f4f1e8" class="c-chalk"> [ r + γ </tspan><tspan fill="#93d4ff" class="c-blue">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s′)</tspan><tspan fill="#f4f1e8" class="c-chalk"> ]</tspan></text>
<text x="98.42" y="339" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">a</text>
<text x="171.38" y="339" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">s′, r</text>
<path d="M56.24 330L56.24 341" stroke="#93d4ff" class="s-blue" stroke-width="1" stroke-opacity=".75"/>
<text x="38.24" y="353" fill="#93d4ff" class="c-blue" font-size="12">value function</text>
<path d="M226.1 330L226.1 341" stroke="#c3c9bd" class="s-dim" stroke-width="1" stroke-opacity=".75"/>
<text x="226.1" y="353" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">model: where a lands</text>
<path d="M348.27 330L348.27 341" stroke="#93d4ff" class="s-blue" stroke-width="1" stroke-opacity=".75"/>
<text x="366.27" y="353" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="end">next cell's value</text>
<text x="130" y="378" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle">r: reward</text>
<text x="280" y="378" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle">γ = 0.99: discount</text>
<text x="210" y="406" fill="#ffe17c" class="c-yellow" font-size="15" text-anchor="middle">one equation per cell: 37 equations, 37 unknowns</text>
</g>
<g class="rc-panel" data-panel="greedy"><rect x="430" y="10" width="400" height="410" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="38" fill="#ffe17c" font-size="16">2. Act greedily on those numbers</text>
<text x="486" y="76" fill="#f4f1e8" class="c-chalk" font-size="19"><tspan fill="#93d4ff" class="c-blue">q<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s, a)</tspan><tspan fill="#f4f1e8" class="c-chalk"> = </tspan><tspan fill="#f4f1e8" class="c-chalk">Σ</tspan><tspan fill="#f4f1e8" class="c-chalk"> p(s′, r | s, a) [ r + γ </tspan><tspan fill="#93d4ff" class="c-blue">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s′)</tspan><tspan fill="#f4f1e8" class="c-chalk"> ]</tspan></text>
<text x="563.9" y="91" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">s′, r</text>
<path d="M512.98 82L512.98 93" stroke="#93d4ff" class="s-blue" stroke-width="1" stroke-opacity=".75"/>
<text x="512.98" y="105" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">action value</text>
<text x="668.4" y="105" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">move a once, then follow π</text>
<text x="540" y="148" fill="#f4f1e8" class="c-chalk" font-size="20"><tspan fill="#a8e2a0" class="c-green">π′(s)</tspan><tspan fill="#f4f1e8" class="c-chalk"> = </tspan><tspan fill="#f4f1e8" class="c-chalk">argmax</tspan><tspan fill="#f4f1e8" class="c-chalk"> </tspan><tspan fill="#93d4ff" class="c-blue">q<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s, a)</tspan></text>
<text x="627.2" y="163" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">a</text>
<path d="M560.2 154L560.2 165" stroke="#a8e2a0" class="s-green" stroke-width="1" stroke-opacity=".75"/>
<text x="560.2" y="177" fill="#a8e2a0" class="c-green" font-size="12" text-anchor="middle">new policy</text>
<text x="691" y="177" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">the best move in each cell</text>
<rect x="456" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="210" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="240" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="270" width="30" height="30" fill="#ff9f88" fill-opacity="0.06" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="300" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="300" width="30" height="30" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2"/>
<text x="801" y="321" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">G</text>
<rect x="486" y="300" width="300" height="30" fill="none" stroke="#c3c9bd" class="s-dim" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="636" y="320" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">cliff: −100, back to S</text>
<path d="M471 232L471 218" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M508 225L494 225" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M538 225L524 225" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M554 225L568 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M584 225L598 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M614 225L628 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M644 225L658 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M674 225L688 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 225L718 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 225L748 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 225L778 225" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 218L801 232" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 262L471 248" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M501 262L501 248" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M531 262L531 248" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M561 262L561 248" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M591 262L591 248" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M621 262L621 248" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M651 262L651 248" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M681 262L681 248" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 255L718 255" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 255L748 255" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 255L778 255" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 248L801 262" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 292L471 278" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M501 292L501 278" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M531 292L531 278" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M561 292L561 278" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M591 292L591 278" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M621 292L621 278" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M651 292L651 278" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M681 292L681 278" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M711 292L711 278" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 285L748 285" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 285L778 285" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 278L801 292" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 322L471 308" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<text x="452" y="320" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">S</text>
<path d="M460 207h22" stroke="#ff9f88" class="s-red" stroke-width="3"/>
<text x="552" y="204" fill="#ff9f88" class="c-red" font-size="13">← the red arrows end here, at the wall</text>
<text x="456" y="354" fill="#ffe17c" class="c-yellow" font-size="17">S: −1072 → −100</text>
<text x="816" y="354" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="end">no cell got worse</text>
<text x="456" y="378" fill="#ff9f88" class="c-red" font-size="14">red: −1 a step forever = −1/(1 − γ) = −100</text>
</g>
<g class="rc-panel" data-panel="never-worse"><rect x="10" y="435" width="400" height="480" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="463" fill="#ffe17c" font-size="16">3. Why greedy never hurts</text>
<text x="210" y="493" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">at S, the four moves under the random walker: q<tspan baseline-shift="-20%" font-size="72%">π</tspan>(S, a)</text>
<path d="M36 575L384 575" stroke="#f4f1e8" class="s-chalk" stroke-width="1.6"/>
<path d="M53.4 571L53.4 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M96.9 571L96.9 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M140.4 571L140.4 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M183.9 571L183.9 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M227.4 571L227.4 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M270.9 571L270.9 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M314.4 571L314.4 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<path d="M357.9 571L357.9 579" stroke="#6f7d75" class="s-faint" stroke-width="1.2"/>
<circle cx="76.9" cy="575" r="5" fill="#ff9f88" class="c-red"/>
<text x="76.8662" y="561" fill="#ff9f88" class="c-red" font-size="15" text-anchor="middle">−1162</text>
<text x="76.8662" y="541" fill="#ff9f88" class="c-red" font-size="14" text-anchor="middle">→ cliff</text>
<circle cx="249.1" cy="575" r="5" fill="#c3c9bd" class="c-dim"/>
<text x="249.126" y="561" fill="#c3c9bd" class="c-dim" font-size="15" text-anchor="middle">−1063</text>
<text x="249.126" y="541" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">↓ ← walls</text>
<circle cx="353.7" cy="575" r="5" fill="#a8e2a0" class="c-green"/>
<text x="353.719" y="561" fill="#a8e2a0" class="c-green" font-size="15" text-anchor="middle">−1002</text>
<text x="353.719" y="541" fill="#a8e2a0" class="c-green" font-size="14" text-anchor="middle">↑ up</text>
<circle cx="353.7" cy="575" r="11" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="1.8"/>
<text x="353.719" y="607" fill="#a8e2a0" class="c-green" font-size="15" text-anchor="middle">max</text>
<path d="M232.209 565L232.209 605" stroke="#93d4ff" class="s-blue" stroke-width="2.2"/>
<text x="232.209" y="623" fill="#93d4ff" class="c-blue" font-size="15" text-anchor="middle">average = v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(S) = −1072</text>
<text x="210" y="655" fill="#ffe17c" class="c-yellow" font-size="19" text-anchor="middle">max ≥ average</text>
<text x="138" y="701" fill="#f4f1e8" class="c-chalk" font-size="20"><tspan fill="#93d4ff" class="c-blue">q<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s, </tspan><tspan fill="#a8e2a0" class="c-green">π′(s)</tspan><tspan fill="#93d4ff" class="c-blue">) ≥ v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s)</tspan></text>
<text x="210" y="722" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">one greedy move, then π: never worse</text>
<text x="126" y="749" fill="#ffe17c" class="c-yellow" font-size="20" text-anchor="middle">⇓</text>
<text x="142" y="748" fill="#ffe17c" class="c-yellow" font-size="14">policy improvement theorem</text>
<text x="210" y="781" fill="#93d4ff" class="c-blue" font-size="20" text-anchor="middle">v<tspan baseline-shift="-20%" font-size="72%">π′</tspan>(s) ≥ v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s)</text>
<text x="210" y="802" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">greedy moves every time: never worse</text>
<text x="24" y="841" fill="#c3c9bd" class="c-dim" font-size="15">at S:</text>
<text x="120" y="841" fill="#f4f1e8" class="c-chalk" font-size="18" text-anchor="middle">−1072</text>
<text x="120" y="862" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(S)</text>
<text x="240" y="841" fill="#f4f1e8" class="c-chalk" font-size="18" text-anchor="middle">−1002</text>
<text x="240" y="862" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">q<tspan baseline-shift="-20%" font-size="72%">π</tspan>(S, up)</text>
<text x="350" y="841" fill="#f4f1e8" class="c-chalk" font-size="18" text-anchor="middle">−100</text>
<text x="350" y="862" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">v<tspan baseline-shift="-20%" font-size="72%">π′</tspan>(S)</text>
<text x="180" y="841" fill="#ffe17c" class="c-yellow" font-size="18" text-anchor="middle">≤</text>
<text x="300" y="841" fill="#ffe17c" class="c-yellow" font-size="18" text-anchor="middle">≤</text>
</g>
<g class="rc-panel" data-panel="rounds"><rect x="430" y="435" width="400" height="480" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="463" fill="#ffe17c" font-size="16">4. Repeat until nothing changes</text>
<text x="460" y="499" fill="#a8e2a0" class="c-green" font-size="20" text-anchor="middle">π<tspan baseline-shift="-20%" font-size="72%">0</tspan></text>
<path d="M476 493H500" stroke="#93d4ff" class="s-blue" stroke-width="1.6" marker-end="url(#gpi-ab)"/>
<text x="488" y="485" fill="#93d4ff" class="c-blue" font-size="13" text-anchor="middle">E</text>
<text x="516" y="499" fill="#93d4ff" class="c-blue" font-size="20" text-anchor="middle">v<tspan baseline-shift="-20%" font-size="72%">π</tspan><tspan baseline-shift="-20%" font-size="72%">0</tspan></text>
<path d="M532 493H556" stroke="#a8e2a0" class="s-green" stroke-width="1.6" marker-end="url(#gpi-ag)"/>
<text x="544" y="485" fill="#a8e2a0" class="c-green" font-size="13" text-anchor="middle">I</text>
<text x="572" y="499" fill="#a8e2a0" class="c-green" font-size="20" text-anchor="middle">π<tspan baseline-shift="-20%" font-size="72%">1</tspan></text>
<path d="M588 493H612" stroke="#93d4ff" class="s-blue" stroke-width="1.6" marker-end="url(#gpi-ab)"/>
<text x="600" y="485" fill="#93d4ff" class="c-blue" font-size="13" text-anchor="middle">E</text>
<text x="628" y="499" fill="#93d4ff" class="c-blue" font-size="20" text-anchor="middle">v<tspan baseline-shift="-20%" font-size="72%">π</tspan><tspan baseline-shift="-20%" font-size="72%">1</tspan></text>
<path d="M644 493H668" stroke="#a8e2a0" class="s-green" stroke-width="1.6" marker-end="url(#gpi-ag)"/>
<text x="656" y="485" fill="#a8e2a0" class="c-green" font-size="13" text-anchor="middle">I</text>
<text x="684" y="499" fill="#c3c9bd" class="c-dim" font-size="20" text-anchor="middle">⋯</text>
<path d="M700 493H724" stroke="#a8e2a0" class="s-green" stroke-width="1.6" marker-end="url(#gpi-ag)"/>
<text x="712" y="485" fill="#a8e2a0" class="c-green" font-size="13" text-anchor="middle">I</text>
<text x="740" y="499" fill="#a8e2a0" class="c-green" font-size="20" text-anchor="middle">π*</text>
<path d="M756 493H780" stroke="#93d4ff" class="s-blue" stroke-width="1.6" marker-end="url(#gpi-ab)"/>
<text x="768" y="485" fill="#93d4ff" class="c-blue" font-size="13" text-anchor="middle">E</text>
<text x="796" y="499" fill="#93d4ff" class="c-blue" font-size="20" text-anchor="middle">v*</text>
<text x="550" y="525" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle"><tspan fill="#93d4ff" class="c-blue">E</tspan>: evaluate (panel 1)</text>
<text x="720" y="525" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle"><tspan fill="#a8e2a0" class="c-green">I</tspan>: improve (panel 2)</text>
<rect x="456" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="547" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="577" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="607" width="30" height="30" fill="#ff9f88" fill-opacity="0.06" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="637" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="637" width="30" height="30" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2"/>
<text x="801" y="658" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">G</text>
<rect x="486" y="637" width="300" height="30" fill="none" stroke="#c3c9bd" class="s-dim" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="636" y="657" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">cliff: −100, back to S</text>
<path d="M464 562L478 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M494 562L508 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M524 562L538 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M554 562L568 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M584 562L598 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M614 562L628 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M644 562L658 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M674 562L688 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 562L718 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 562L748 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 562L778 562" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 555L801 569" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M464 592L478 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M494 592L508 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M524 592L538 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M554 592L568 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M584 592L598 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M614 592L628 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M644 592L658 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M674 592L688 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 592L718 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 592L748 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 592L778 592" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 585L801 599" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M464 622L478 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M494 622L508 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M524 622L538 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M554 622L568 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M584 622L598 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M614 622L628 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M644 622L658 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M674 622L688 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 622L718 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 622L748 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 622L778 622" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 615L801 629" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 659L471 645" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<text x="452" y="657" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">S</text>
<path d="M465 646 465 616 495 616 525 616 555 616 555 586 555 556 585 556 615 556 645 556 675 556 705 556 735 556 765 556 795 556 795 586 795 616 795 631" fill="none" stroke="#ffe17c" class="s-yellow" stroke-width="3" stroke-opacity=".9" stroke-dasharray="6 6"/>
<path d="M471 652 471 622 501 622 531 622 561 622 591 622 621 622 651 622 681 622 711 622 741 622 771 622 801 622 801 637" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="3" stroke-opacity=".9"/>
<text x="456" y="689" fill="#ffe17c" class="c-yellow" font-size="14">round 4: 17 steps</text>
<text x="816" y="689" fill="#a8e2a0" class="c-green" font-size="14" text-anchor="end">round 6: 13 steps</text>
<text x="444" y="715" fill="#93d4ff" class="c-blue" font-size="15">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(S)</text>
<text x="494" y="731" fill="#6f7d75" class="c-faint" font-size="11" text-anchor="end">−10</text>
<path d="M500 727L800 727" stroke="#6f7d75" class="s-faint" stroke-width="0.8" stroke-dasharray="2 4"/>
<text x="494" y="760" fill="#6f7d75" class="c-faint" font-size="11" text-anchor="end">−100</text>
<path d="M500 756L800 756" stroke="#6f7d75" class="s-faint" stroke-width="0.8" stroke-dasharray="2 4"/>
<text x="494" y="789" fill="#6f7d75" class="c-faint" font-size="11" text-anchor="end">−1000</text>
<path d="M500 785L800 785" stroke="#6f7d75" class="s-faint" stroke-width="0.8" stroke-dasharray="2 4"/>
<path d="M516 785.9H562V756.0H608V756.0H654V756.0H700V732.7H746V732.7H792V729.6" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="2"/>
<circle cx="516" cy="785.9" r="3.5" fill="#93d4ff" class="c-blue"/>
<text x="516" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">0</text>
<text x="526" y="776.878" fill="#93d4ff" class="c-blue" font-size="13">−1072</text>
<circle cx="562" cy="756.0" r="3.5" fill="#93d4ff" class="c-blue"/>
<text x="562" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">1</text>
<text x="570" y="747" fill="#93d4ff" class="c-blue" font-size="13">−100</text>
<circle cx="608" cy="756.0" r="3.5" fill="#93d4ff" class="c-blue"/>
<text x="608" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">2</text>
<circle cx="654" cy="756.0" r="3.5" fill="#93d4ff" class="c-blue"/>
<text x="654" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">3</text>
<circle cx="700" cy="732.7" r="3.5" fill="#93d4ff" class="c-blue"/>
<text x="700" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">4</text>
<text x="700" y="723.686" fill="#93d4ff" class="c-blue" font-size="13" text-anchor="middle">−15.7</text>
<circle cx="746" cy="732.7" r="3.5" fill="#93d4ff" class="c-blue"/>
<text x="746" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">5</text>
<circle cx="792" cy="729.6" r="3.5" fill="#a8e2a0" class="c-green"/>
<text x="792" y="809" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">6</text>
<text x="792" y="720.554" fill="#a8e2a0" class="c-green" font-size="13" text-anchor="middle">−12.25</text>
<text x="444" y="809" fill="#c3c9bd" class="c-dim" font-size="12">round</text>
<text x="630" y="835" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle">a greedy step changes nothing, so in every cell</text>
<text x="554" y="865" fill="#f4f1e8" class="c-chalk" font-size="20"><tspan fill="#93d4ff" class="c-blue">v<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s)</tspan><tspan fill="#f4f1e8" class="c-chalk"> = </tspan><tspan fill="#a8e2a0" class="c-green">max</tspan><tspan fill="#f4f1e8" class="c-chalk"> </tspan><tspan fill="#93d4ff" class="c-blue">q<tspan baseline-shift="-20%" font-size="72%">π</tspan>(s, a)</tspan></text>
<text x="627" y="880" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">a</text>
<text x="630" y="899" fill="#ffe17c" class="c-yellow" font-size="14" text-anchor="middle">Bellman optimality: only v* solves it, so π = π*</text>
</g>
<g class="rc-panel" data-panel="sweeps"><rect x="10" y="930" width="400" height="420" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="958" fill="#ffe17c" font-size="16">5. Evaluation can stop early</text>
<text x="332" y="988" fill="#93d4ff" class="c-blue" font-size="14" text-anchor="end">evaluate</text>
<text x="396" y="988" fill="#a8e2a0" class="c-green" font-size="14" text-anchor="end">improve</text>
<text x="24" y="990" fill="#f4f1e8" class="c-chalk" font-size="16">policy iteration</text>
<path d="M26 1012L88 1012" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M91 1003L91 1021" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M97 1012L159 1012" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M162 1003L162 1021" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M168 1012L230 1012" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M233 1003L233 1021" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M239 1012L301 1012" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M304 1003L304 1021" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<text x="316" y="1017" fill="#c3c9bd" class="c-dim" font-size="16">⋯</text>
<text x="24" y="1040" fill="#c3c9bd" class="c-dim" font-size="13">evaluate to the end, then improve: 6 rounds</text>
<text x="24" y="1064" fill="#f4f1e8" class="c-chalk" font-size="16">value iteration</text>
<path d="M26 1086L37 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M40 1077L40 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M46 1086L57 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M60 1077L60 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M66 1086L77 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M80 1077L80 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M86 1086L97 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M100 1077L100 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M106 1086L117 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M120 1077L120 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M126 1086L137 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M140 1077L140 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M146 1086L157 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M160 1077L160 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M166 1086L177 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M180 1077L180 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M186 1086L197 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M200 1077L200 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M206 1086L217 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M220 1077L220 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M226 1086L237 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M240 1077L240 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M246 1086L257 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M260 1077L260 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M266 1086L277 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M280 1077L280 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M286 1086L297 1086" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M300 1077L300 1095" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<text x="24" y="1114" fill="#c3c9bd" class="c-dim" font-size="13">one sweep, then improve: 14 sweeps on the cliff grid</text>
<text x="24" y="1138" fill="#f4f1e8" class="c-chalk" font-size="16">anything between</text>
<path d="M26 1160L60 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M63 1151L63 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M69 1160L75 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M78 1151L78 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M84 1160L136 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M139 1151L139 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M145 1160L163 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M166 1151L166 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M172 1160L175 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M178 1151L178 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M184 1160L210 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M213 1151L213 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M219 1160L230 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M233 1151L233 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M239 1160L279 1160" stroke="#93d4ff" class="s-blue" stroke-width="7" stroke-linecap="butt"/>
<path d="M282 1151L282 1169" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<text x="24" y="1188" fill="#c3c9bd" class="c-dim" font-size="13">a few sweeps, one cell, one sample ...</text>
<text x="62" y="1230" fill="#f4f1e8" class="c-chalk" font-size="18"><tspan fill="#93d4ff" class="c-blue">v<tspan baseline-shift="-20%" font-size="72%">k+1</tspan>(s)</tspan><tspan fill="#f4f1e8" class="c-chalk"> = </tspan><tspan fill="#a8e2a0" class="c-green">max</tspan><tspan fill="#f4f1e8" class="c-chalk"> Σ</tspan><tspan fill="#f4f1e8" class="c-chalk"> p(s′, r | s, a) [ r + γ </tspan><tspan fill="#93d4ff" class="c-blue">v<tspan baseline-shift="-20%" font-size="72%">k</tspan>(s′)</tspan><tspan fill="#f4f1e8" class="c-chalk"> ]</tspan></text>
<text x="137.24" y="1245" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">a</text>
<text x="161" y="1245" fill="#c3c9bd" class="c-dim" font-size="11" text-anchor="middle">s′, r</text>
<path d="M137.24 1250L137.24 1255" stroke="#a8e2a0" class="s-green" stroke-width="1" stroke-opacity=".75"/>
<text x="137.24" y="1267" fill="#a8e2a0" class="c-green" font-size="12" text-anchor="middle">improve: best move</text>
<path d="M256.22 1236L256.22 1255" stroke="#93d4ff" class="s-blue" stroke-width="1" stroke-opacity=".75"/>
<text x="256.22" y="1267" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">evaluate: one sweep</text>
<text x="210" y="1294" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle">the max replaces the average over π(a | s) in panel 1</text>
<text x="210" y="1322" fill="#ffe17c" class="c-yellow" font-size="15" text-anchor="middle">from v = 0, exact v* after 14 sweeps</text>
</g>
<g class="rc-panel" data-panel="gpi"><rect x="430" y="930" width="400" height="420" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="958" fill="#ffe17c" font-size="16">6. GPI: two processes, one loop</text>
<path d="M480.0 1080A131.0 81.2 0 0 1 742.0 1080" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="2.60" marker-end="url(#gpi-ab)"/>
<path d="M742.0 1080A97.0 60.1 0 0 1 548.0 1080" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.40" marker-end="url(#gpi-ag)"/>
<path d="M548.0 1080A71.0 44.0 0 0 1 690.0 1080" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="2.20" marker-end="url(#gpi-ab)"/>
<path d="M690.0 1080A51.0 31.6 0 0 1 588.0 1080" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.00" marker-end="url(#gpi-ag)"/>
<path d="M588.0 1080A21.0 13.0 0 0 1 630.0 1080" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="1.80" marker-end="url(#gpi-ab)"/>
<text x="458" y="1088" fill="#a8e2a0" class="c-green" font-size="28" text-anchor="middle">π</text>
<text x="458" y="1106" fill="#a8e2a0" class="c-green" font-size="12" text-anchor="middle">policy</text>
<text x="790" y="1088" fill="#93d4ff" class="c-blue" font-size="28" text-anchor="middle">v</text>
<text x="822" y="1106" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="end">value function</text>
<text x="611" y="986.78" fill="#93d4ff" class="c-blue" font-size="17" text-anchor="middle">evaluate:  v → v<tspan baseline-shift="-20%" font-size="72%">π</tspan></text>
<text x="645" y="1166.14" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">improve:  π → greedy(v)</text>
<circle cx="630" cy="1080" r="4.5" fill="#ffe17c" class="c-yellow"/>
<text x="630" y="1102" fill="#ffe17c" class="c-yellow" font-size="17" text-anchor="middle">π*, v*</text>
<text x="626" y="1202" fill="#93d4ff" class="c-blue" font-size="17" text-anchor="middle">v = v<tspan baseline-shift="-20%" font-size="72%">π</tspan></text>
<text x="626" y="1223" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">values fit π</text>
<text x="752" y="1202" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">π = greedy(v)</text>
<text x="752" y="1223" fill="#a8e2a0" class="c-green" font-size="12" text-anchor="middle">π acts best on v</text>
<path d="M442 1232L818 1232" stroke="#6f7d75" class="s-faint" stroke-width="1"/>
<text x="444" y="1258" fill="#f4f1e8" class="c-chalk" font-size="15">after evaluate</text>
<path d="M618 1250l6 7l11 -14" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M746 1245l12 12M758 1245l-12 12" fill="none" stroke="#ff9f88" class="s-red" stroke-width="2.6"/>
<text x="444" y="1286" fill="#f4f1e8" class="c-chalk" font-size="15">after improve</text>
<path d="M620 1273l12 12M632 1273l-12 12" fill="none" stroke="#ff9f88" class="s-red" stroke-width="2.6"/>
<path d="M744 1278l6 7l11 -14" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<text x="444" y="1314" fill="#ffe17c" class="c-yellow" font-size="15">at π*, v*</text>
<path d="M618 1306l6 7l11 -14" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<path d="M744 1306l6 7l11 -14" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.6"/>
<text x="630" y="1338" fill="#c3c9bd" class="c-dim" font-size="13" text-anchor="middle">each step breaks the other's condition, until the optimum</text>
</g>
<g class="rc-panel" data-panel="family"><rect x="220" y="1365" width="400" height="400" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="234" y="1393" fill="#ffe17c" font-size="16">7. Same loop, different parts</text>
<text x="356" y="1423" fill="#93d4ff" class="c-blue" font-size="16">evaluate</text>
<text x="488" y="1423" fill="#a8e2a0" class="c-green" font-size="16">improve</text>
<path d="M232 1431L608 1431" stroke="#6f7d75" class="s-faint" stroke-width="1"/>
<text x="234" y="1455" fill="#f4f1e8" class="c-chalk" font-size="15">policy iteration</text>
<text x="356" y="1455" fill="#c3c9bd" class="c-dim" font-size="14">solve for v<tspan baseline-shift="-20%" font-size="72%">π</tspan></text>
<text x="488" y="1455" fill="#c3c9bd" class="c-dim" font-size="14">greedy, all cells</text>
<text x="234" y="1482" fill="#f4f1e8" class="c-chalk" font-size="15">value iteration</text>
<text x="356" y="1482" fill="#c3c9bd" class="c-dim" font-size="14">one sweep</text>
<text x="488" y="1482" fill="#c3c9bd" class="c-dim" font-size="14">max in the sweep</text>
<text x="234" y="1509" fill="#f4f1e8" class="c-chalk" font-size="15">Monte Carlo</text>
<text x="356" y="1509" fill="#c3c9bd" class="c-dim" font-size="14">average returns</text>
<text x="488" y="1509" fill="#c3c9bd" class="c-dim" font-size="14">greedy per episode</text>
<text x="234" y="1536" fill="#f4f1e8" class="c-chalk" font-size="15">Sarsa</text>
<text x="356" y="1536" fill="#c3c9bd" class="c-dim" font-size="14">one TD step on Q</text>
<text x="488" y="1536" fill="#c3c9bd" class="c-dim" font-size="14">ε-greedy on Q</text>
<text x="234" y="1563" fill="#f4f1e8" class="c-chalk" font-size="15">Q-learning</text>
<text x="356" y="1563" fill="#c3c9bd" class="c-dim" font-size="14">one TD step on Q</text>
<text x="488" y="1563" fill="#c3c9bd" class="c-dim" font-size="14">max in the target</text>
<text x="234" y="1590" fill="#f4f1e8" class="c-chalk" font-size="15">actor-critic</text>
<text x="356" y="1590" fill="#c3c9bd" class="c-dim" font-size="14">critic: TD error</text>
<text x="488" y="1590" fill="#c3c9bd" class="c-dim" font-size="14">actor: gradient step</text>
<text x="234" y="1617" fill="#ffe17c" class="c-yellow" font-size="15">AlphaGo Zero</text>
<text x="356" y="1617" fill="#c3c9bd" class="c-dim" font-size="14">self-play winner z</text>
<text x="488" y="1617" fill="#c3c9bd" class="c-dim" font-size="14">tree search (MCTS)</text>
<text x="234" y="1643" fill="#ffe17c" class="c-yellow" font-size="15">AlphaGo Zero's training loss</text>
<text x="306" y="1683" fill="#f4f1e8" class="c-chalk" font-size="20"><tspan fill="#f4f1e8" class="c-chalk">l = </tspan><tspan fill="#93d4ff" class="c-blue">(z − v)<tspan baseline-shift="38%" font-size="72%">2</tspan></tspan><tspan fill="#f4f1e8" class="c-chalk"> − </tspan><tspan fill="#a8e2a0" class="c-green">π<tspan baseline-shift="38%" font-size="72%">T</tspan> log p</tspan><tspan fill="#c3c9bd" class="c-dim"> + c‖θ‖<tspan baseline-shift="38%" font-size="72%">2</tspan></tspan></text>
<path d="M359.2 1689L359.2 1696" stroke="#93d4ff" class="s-blue" stroke-width="1" stroke-opacity=".75"/>
<text x="359.2" y="1708" fill="#93d4ff" class="c-blue" font-size="12" text-anchor="middle">evaluate: v → winner z</text>
<path d="M436.8 1689L436.8 1714" stroke="#a8e2a0" class="s-green" stroke-width="1" stroke-opacity=".75"/>
<text x="436.8" y="1726" fill="#a8e2a0" class="c-green" font-size="12" text-anchor="middle">improve: p → search π</text>
<path d="M506 1689L506 1696" stroke="#c3c9bd" class="s-dim" stroke-width="1" stroke-opacity=".75"/>
<text x="506" y="1708" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">regularizer</text>
<text x="420" y="1753" fill="#c3c9bd" class="c-dim" font-size="12" text-anchor="middle">p, v: the network's move probabilities and value</text>
</g>
</g>
</svg><!-- /gpi-canvas --></div></div>
<div class="rc-body">

Take [Part 1's](/robotics/rl-1-q-learning/#sec-world) 4 by 12 cliff grid. Every move gives −1, and a step into the cliff gives −100 and sends you back to the start S. This time you know all the rules before you move. So can you just work out the best way to the flag G?

Trying all $4^{37} \approx 1.9 \times 10^{22}$ rules, one move in each of the 37 cells, is hopeless. You'd rather take one rule and improve it, and for that you have to score it first. This side article to my [reinforcement learning series](/robotics/rl-0-overview/) follows Chapter 4 of Sutton and Barto, cited at the end.

<div class="rc-mark" id="sec-evaluate" data-panel="walker" data-view="walker" data-title="How good is a random walker?"></div>

## How good is a random walker?

Start with a walker that picks moves at random. A rule like that is a **policy** $\pi$, and a cell's **value** is the discounted reward you collect from there on average. Scoring a policy is called **policy evaluation**, and since you know the rules, it comes down to a linear system.

<div class="rc-slot" data-for="sec-evaluate"></div>

<details>
<summary>Solving for the values</summary>

My script (linked under "Every round") solves the 37 equations directly. You can also sweep: start from any guess with the flag at 0, plug the current guesses into the right-hand side, and repeat.

$$\begin{aligned} v_{k+1}(s) &= \sum_a \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a) \\ &\qquad \big[r + \gamma\, v_k(s')\big] \end{aligned}$$

For $\gamma < 1$ this converges to $v_\pi$ in the limit.

</details>

<div class="rc-mark" id="sec-improve" data-panel="greedy" data-view="greedy" data-title="Act greedily on those numbers"></div>

## Act greedily on those numbers

What you'd expect from making a move once, then walking randomly again, is its **action value**. Pick the best move in every cell and you get the **greedy** policy $\pi'$, and switching to it is **policy improvement**.

<div class="rc-slot" data-for="sec-improve"></div>

The result looks silly. The walker rated the top-left corner a little above its neighbors, so ten cells now march into that corner and bump the top wall forever. Still, every cell's value beats the walker's.

<div class="rc-mark" id="sec-theorem" data-panel="never-worse" data-view="never-worse" data-title="Why greedy never hurts"></div>

## Why greedy never hurts

Was that luck? No, and you can see why from S alone.

<div class="rc-slot" data-for="sec-theorem"></div>

The step from the first inequality to the second is the **policy improvement theorem**, and it takes one more idea: use the greedy move again at the next cell, and the next. After $k$ steps, all that's left of the old policy is its value $k$ steps ahead, times $\gamma^k$, which shrinks to zero.

<details>
<summary>The proof chain</summary>

Unroll $q_\pi(s, \pi'(s)) \ge v_\pi(s)$ one step at a time:

$$\begin{aligned}
v_\pi(s) &\le q_\pi(s, \pi'(s)) \\
&= \mathbb{E}\big[R_{t+1} + \gamma v_\pi(S_{t+1}) \mid S_t = s, A_t = \pi'(s)\big] \\
&= \mathbb{E}_{\pi'}\big[R_{t+1} + \gamma v_\pi(S_{t+1}) \mid S_t = s\big] \\
&\le \mathbb{E}_{\pi'}\big[R_{t+1} + \gamma q_\pi(S_{t+1}, \pi'(S_{t+1})) \mid S_t = s\big] \\
&= \mathbb{E}_{\pi'}\big[R_{t+1} + \gamma R_{t+2} + \gamma^2 v_\pi(S_{t+2}) \mid S_t = s\big] \\
&\le \mathbb{E}_{\pi'}\big[R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \gamma^3 v_\pi(S_{t+3}) \mid S_t = s\big] \\
&\;\;\vdots \\
&\le \mathbb{E}_{\pi'}\big[R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \gamma^3 R_{t+4} + \cdots \mid S_t = s\big] \\
&= v_{\pi'}(s)
\end{aligned}$$

Here $\mathbb{E}_{\pi'}$ averages over following $\pi'$, and each $\le$ uses that inequality at the next cell.

</details>

<div class="rc-mark" id="sec-repeat" data-panel="rounds" data-view="rounds" data-title="Repeat until nothing changes"></div>

## Repeat until nothing changes

Score the new policy, improve it again, and keep going. That's **policy iteration**, and here it takes six rounds. In round 6, S finds the 13-step route along the cliff edge, the same one Q-learning found in Part 1.

<div class="rc-slot" data-for="sec-repeat"></div>

Out of $1.9 \times 10^{22}$ policies, it scored six, plus the walker. It also has to stop. With the tie rule in the drawer, every round makes some cell strictly better, so no policy comes back.

<details>
<summary>Every round</summary>

<div class="ct gpi-rounds">

| Round | v(S) | Moves changed | Cells improved |
| --- | --- | --- | --- |
| 0 (random) | −1072.24 | | |
| 1 | −100.00 | all 37 | 37 |
| 2 | −100.00 | 6 | 6 |
| 3 | −100.00 | 5 | 5 |
| 4 | −15.71 | 5 | 6 |
| 5 | −15.71 | 2 | 2 |
| 6 | −12.25 | 2 | 9 |

</div>

Round 1 breaks ties in the order up, right, down, left, and all 24 orders give the same numbers. After that, when two moves tie, the policy keeps its current move (the fix the book's Exercise 4.4 asks for). [Code](https://github.com/Hadrien-Cornier/hadrien-cornier.github.io): `python3 scripts/rl_gpi_figures.py`.

</details>

<div class="rc-mark" id="sec-value-iteration" data-panel="sweeps" data-view="sweeps" data-title="Evaluation can stop early"></div>

## Evaluation can stop early

Policy iteration solves for the values exactly before every greedy step. **Value iteration** stops evaluating after one **sweep**, a single update of every cell from its neighbors' current values, and takes the greedy max inside it.

<div class="rc-slot" data-for="sec-value-iteration"></div>

In general it reaches the optimal values $v_*$ only in the limit. The book says that evaluation "can be truncated in several ways without losing the convergence guarantees of policy iteration".

<div class="rc-mark" id="sec-gpi" data-panel="gpi" data-view="gpi" data-title="GPI: two processes, one loop"></div>

## Two processes, one loop

So you can split the work between evaluation and improvement in many ways. The book calls any such mix **generalized policy iteration** (GPI): "letting policy-evaluation and policy-improvement processes interact, independent of the granularity and other details of the two processes".

<div class="rc-slot" data-for="sec-gpi"></div>

The two processes "can be viewed as both competing and cooperating". Once evaluation scored round 1's policy, for example, that policy was no longer greedy in 6 cells. Then comes the big claim: "Almost all reinforcement learning methods are well described as GPI".

<div class="rc-mark" id="sec-family" data-panel="family" data-view="family" data-title="Same loop, different parts"></div>

## The same loop inside other methods

Without a model, methods estimate values from experience instead. Monte Carlo averages the returns of whole episodes, and temporal-difference (TD) methods move an estimate toward one reward plus the next estimate.

<div class="rc-slot" data-for="sec-family"></div>

In AlphaGo Zero, Monte Carlo tree search (MCTS) usually picks much stronger moves than the network's raw move probabilities would, so [the paper](https://www.nature.com/articles/nature24270) calls it "a powerful policy improvement operator" and uses search and self-play "repeatedly in a policy iteration procedure". The book agrees that AlphaGo Zero "implemented a form of policy iteration". It never calls actor-critic GPI outright, though (notes under Sources).

## What I take from it

In any new method, I now look for the two processes: what judges the policy, what improves it, and how much each does before it hands over. Most methods in the [series](/robotics/rl-0-overview/) differ in those three answers.

## Sources

- Richard S. Sutton and Andrew G. Barto, [*Reinforcement Learning: An Introduction*](http://incompleteideas.net/book/RLbook2020.pdf), 2nd edition, MIT Press, 2018. Chapters used: 4 (policy evaluation, policy improvement, policy iteration, value iteration and GPI, with the GPI loop in panel 6 drawn after the book's GPI diagrams), 3 (the Bellman optimality equation), 5 (Monte Carlo control), 6 (Sarsa and Q-learning), 8 (the Q-learning update), 13 and 14 (actor-critic), 16 (AlphaGo Zero) and 17 (GPI beside actor-critic).
- David Silver et al., [Mastering the game of Go without human knowledge](https://www.nature.com/articles/nature24270), *Nature*, 2017 ([author version](https://discovery.ucl.ac.uk/id/eprint/10045895/1/agz_unformatted_nature.pdf)).
- Tuomas Haarnoja et al., [Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor](https://arxiv.org/abs/1801.01290), ICML 2018.

<details>
<summary>Notes on the sources</summary>

- The book gives Q-learning its GPI label in the introduction and summary of Chapter 6, not in the Q-learning section.
- The book never calls actor-critic a form of GPI. The Chapter 6 summary calls it "a third way in which TD methods can be extended to control", and Chapter 17 lists GPI and actor-critic as separate ways to learn a policy. Haarnoja et al. are more direct: "Actor-critic algorithms are typically derived starting from policy iteration".

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
