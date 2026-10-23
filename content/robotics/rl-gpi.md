---
title: 'Generalized policy iteration: judge, improve, repeat'
description: 'The loop of evaluation and improvement inside most reinforcement learning methods, worked through on the cliff grid and traced from dynamic programming to AlphaGo Zero.'
date: '2026-10-23'
draft: false
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-gpi-loop.svg'
thumbnail_alt: 'Two blackboard panels: policy iteration on the cliff grid, whose start value climbs from −1072 to −12.25 in six rounds, and the loop between evaluation and improvement that ends at the optimal policy and value'
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
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><!-- gpi-canvas --><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 890" data-whole="0 0 840 890" data-views='{"walker": [16, 38, 388, 244], "greedy": [436, 38, 388, 244], "rounds": [16, 333, 388, 244], "loop": [436, 333, 388, 244], "lines": [16, 628, 388, 244], "family": [436, 628, 388, 244]}' role="img" aria-labelledby="gpi-title gpi-desc"><title id="gpi-title">Generalized policy iteration on a blackboard</title><desc id="gpi-desc">Six panels. 1: the Part 1 cliff grid under a random walker, with values from about −482 to −1072. 2: one greedy step: the right side heads for the goal, the left side bumps the top wall forever at −100, and no cell gets worse. 3: six rounds of evaluate and improve; the start value goes −1072, −100, −100, −100, −15.7, −15.7, −12.25 and the route shrinks from 17 to 13 steps along the cliff edge. 4: the book's loop diagram, evaluation from π to V and improvement from V to π, ending at π* and v*. 5: the book's two-lines diagram, a zigzag between v = vπ and π = greedy(v) that climbs to v*, π*. 6: seven methods and what plays evaluation and improvement in each.</desc>
<defs>
<marker id="gpi-a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8"/></marker>
<marker id="gpi-ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#ff9f88" class="s-red" stroke-width="1.8"/></marker>
<marker id="gpi-ab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="1.6"/></marker>
<marker id="gpi-ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="1.6"/></marker>
<marker id="gpi-ay" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#ffe17c" class="s-yellow" stroke-width="1.6"/></marker>
</defs>
<g font-size="15">
<g class="rc-panel" data-panel="walker"><rect x="10" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="38" fill="#ffe17c" font-size="16">1. How good is a random walker?</text>
<rect x="36" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.55" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.55" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.55" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.53" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.51" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.47" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.42" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.34" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.28" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.58" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.59" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.60" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.60" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.60" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.59" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.58" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.56" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.52" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.46" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.37" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.64" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.67" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.68" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.67" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.66" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.63" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.58" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.45" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.08" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="148" width="30" height="30" fill="#ff9f88" fill-opacity="0.70" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="148" width="30" height="30" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2"/>
<text x="381" y="169" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">G</text>
<rect x="66" y="148" width="300" height="30" fill="none" stroke="#c3c9bd" class="s-dim" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="216" y="168" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">cliff: −100, back to S</text>
<path d="M51 160L51 153" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<path d="M54 163L61 163" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<path d="M51 166L51 173" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<path d="M48 163L41 163" stroke="#f4f1e8" class="s-chalk" stroke-width="1.4" marker-end="url(#gpi-a)"/>
<text x="32" y="168" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">S</text>
<rect x="368" y="120" width="26" height="26" fill="none" stroke="#ffe17c" class="s-yellow" stroke-width="2"/>
<text x="216" y="52" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">every move with chance 1/4</text>
<text x="36" y="202" fill="#ff9f88" class="c-red" font-size="16">S: v = −1072</text>
<text x="396" y="202" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">above G: v = −482</text>
<text x="36" y="228" fill="#f4f1e8" class="c-chalk" font-size="15">v(s): the average discounted return from s</text>
<text x="36" y="250" fill="#c3c9bd" class="c-dim" font-size="14">redder = worse, from −482 to −1072</text>
</g>
<g class="rc-panel" data-panel="greedy"><rect x="430" y="10" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="38" fill="#ffe17c" font-size="16">2. Act greedily on those numbers</text>
<rect x="456" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="58" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="88" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="486" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="516" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="546" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="576" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="606" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="636" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="666" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="696" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="726" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="756" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="118" width="30" height="30" fill="#ff9f88" fill-opacity="0.06" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="456" y="148" width="30" height="30" fill="#ff9f88" fill-opacity="0.39" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="786" y="148" width="30" height="30" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2"/>
<text x="801" y="169" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">G</text>
<rect x="486" y="148" width="300" height="30" fill="none" stroke="#c3c9bd" class="s-dim" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="636" y="168" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">cliff: −100, back to S</text>
<path d="M471 80L471 66" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M508 73L494 73" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M538 73L524 73" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M554 73L568 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M584 73L598 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M614 73L628 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M644 73L658 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M674 73L688 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 73L718 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 73L748 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 73L778 73" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 66L801 80" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 110L471 96" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M501 110L501 96" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M531 110L531 96" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M561 110L561 96" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M591 110L591 96" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M621 110L621 96" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M651 110L651 96" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M681 110L681 96" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M704 103L718 103" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 103L748 103" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 103L778 103" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 96L801 110" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 140L471 126" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M501 140L501 126" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M531 140L531 126" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<path d="M561 140L561 126" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M591 140L591 126" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M621 140L621 126" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M651 140L651 126" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M681 140L681 126" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M711 140L711 126" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M734 133L748 133" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M764 133L778 133" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M801 126L801 140" stroke="#f4f1e8" class="s-chalk" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M471 170L471 156" stroke="#ff9f88" class="s-red" stroke-width="1.8" marker-end="url(#gpi-ar)"/>
<text x="452" y="168" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">S</text>
<path d="M460 55h22" stroke="#ff9f88" class="s-red" stroke-width="3"/>
<text x="552" y="52" fill="#ff9f88" class="c-red" font-size="14">← red cells end here, against the wall</text>
<text x="456" y="202" fill="#ffe17c" class="c-yellow" font-size="16">S: −1072 → −100</text>
<text x="816" y="202" fill="#a8e2a0" class="c-green" font-size="16" text-anchor="end">no cell got worse</text>
<text x="456" y="228" fill="#ff9f88" class="c-red" font-size="15">red: stuck, −1 each step forever = −100</text>
<text x="456" y="250" fill="#c3c9bd" class="c-dim" font-size="14">white: reaches G, some by the top row</text>
</g>
<g class="rc-panel" data-panel="rounds"><rect x="10" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="333" fill="#ffe17c" font-size="16">3. Repeat until nothing changes</text>
<rect x="36" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="357" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="387" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="66" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.23" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="96" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.22" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="126" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="156" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.21" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="186" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.20" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="216" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.19" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="246" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.17" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="276" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.16" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="306" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.14" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="336" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.11" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="417" width="30" height="30" fill="#ff9f88" fill-opacity="0.06" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="36" y="447" width="30" height="30" fill="#ff9f88" fill-opacity="0.24" stroke="#6f7d75" class="c-red s-faint" stroke-width="1"/>
<rect x="366" y="447" width="30" height="30" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2"/>
<text x="381" y="468" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">G</text>
<rect x="66" y="447" width="300" height="30" fill="none" stroke="#c3c9bd" class="s-dim" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="216" y="467" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">cliff: −100, back to S</text>
<path d="M44 372L58 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M74 372L88 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M104 372L118 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M134 372L148 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M164 372L178 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M194 372L208 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M224 372L238 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M254 372L268 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M284 372L298 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M314 372L328 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M344 372L358 372" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M381 365L381 379" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M44 402L58 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M74 402L88 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M104 402L118 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M134 402L148 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M164 402L178 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M194 402L208 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M224 402L238 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M254 402L268 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M284 402L298 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M314 402L328 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M344 402L358 402" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M381 395L381 409" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M44 432L58 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M74 432L88 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M104 432L118 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M134 432L148 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M164 432L178 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M194 432L208 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M224 432L238 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M254 432L268 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M284 432L298 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M314 432L328 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M344 432L358 432" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M381 425L381 439" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<path d="M51 469L51 455" stroke="#c3c9bd" class="s-dim" stroke-width="1.8" marker-end="url(#gpi-a)"/>
<text x="32" y="467" fill="#ffe17c" class="c-yellow" font-size="16" text-anchor="end">S</text>
<text x="216" y="351" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">arrows: the final policy, round 6</text>
<path d="M45 456 45 426 75 426 105 426 135 426 135 396 135 366 165 366 195 366 225 366 255 366 285 366 315 366 345 366 375 366 375 396 375 426 375 441" fill="none" stroke="#ffe17c" class="s-yellow" stroke-width="3" stroke-opacity=".9" stroke-dasharray="6 6"/>
<path d="M51 462 51 432 81 432 111 432 141 432 171 432 201 432 231 432 261 432 291 432 321 432 351 432 381 432 381 447" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="3" stroke-opacity=".9"/>
<text x="36" y="499" fill="#c3c9bd" class="c-dim" font-size="14">round</text>
<text x="36" y="521" fill="#c3c9bd" class="c-dim" font-size="14">v(S)</text>
<text x="90" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">0</text>
<text x="90" y="521" fill="#f4f1e8" class="c-chalk" font-size="15" text-anchor="middle">−1072</text>
<text x="134" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">1</text>
<text x="134" y="521" fill="#f4f1e8" class="c-chalk" font-size="15" text-anchor="middle">−100</text>
<text x="178" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">2</text>
<text x="178" y="521" fill="#f4f1e8" class="c-chalk" font-size="15" text-anchor="middle">−100</text>
<text x="222" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">3</text>
<text x="222" y="521" fill="#f4f1e8" class="c-chalk" font-size="15" text-anchor="middle">−100</text>
<text x="266" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">4</text>
<text x="266" y="521" fill="#ffe17c" class="c-yellow" font-size="15" text-anchor="middle">−15.7</text>
<text x="310" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">5</text>
<text x="310" y="521" fill="#f4f1e8" class="c-chalk" font-size="15" text-anchor="middle">−15.7</text>
<text x="354" y="499" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">6</text>
<text x="354" y="521" fill="#a8e2a0" class="c-green" font-size="15" text-anchor="middle">−12.25</text>
<text x="36" y="547" fill="#ffe17c" class="c-yellow" font-size="14">yellow, round 4: 17 steps</text>
<text x="396" y="547" fill="#a8e2a0" class="c-green" font-size="14" text-anchor="end">green, round 6: 13 steps</text>
</g>
<g class="rc-panel" data-panel="loop"><rect x="430" y="305" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="333" fill="#ffe17c" font-size="16">4. Two processes (book, p. 86)</text>
<text x="530" y="437" fill="#f4f1e8" class="c-chalk" font-size="34" text-anchor="middle">π</text>
<text x="730" y="437" fill="#f4f1e8" class="c-chalk" font-size="34" text-anchor="middle">V</text>
<path d="M554 411 Q630.0 357 706 411" fill="none" stroke="#93d4ff" class="s-blue" stroke-width="2.4" marker-end="url(#gpi-ab)"/>
<path d="M706 443 Q630.0 497 554 443" fill="none" stroke="#a8e2a0" class="s-green" stroke-width="2.4" marker-end="url(#gpi-ag)"/>
<text x="630" y="373" fill="#93d4ff" class="c-blue" font-size="17" text-anchor="middle">evaluation (panel 1): V → v<tspan baseline-shift="sub" font-size="75%">π</tspan></text>
<text x="630" y="495" fill="#a8e2a0" class="c-green" font-size="17" text-anchor="middle">improvement (panel 2): π → greedy(V)</text>
<circle cx="630.0" cy="511" r="1.8" fill="#c3c9bd" class="c-dim"/>
<circle cx="630.0" cy="520" r="1.8" fill="#c3c9bd" class="c-dim"/>
<circle cx="630.0" cy="529" r="1.8" fill="#c3c9bd" class="c-dim"/>
<text x="530" y="549" fill="#ffe17c" class="c-yellow" font-size="22" text-anchor="middle">π*</text>
<text x="730" y="549" fill="#ffe17c" class="c-yellow" font-size="22" text-anchor="middle">v*</text>
<path d="M554 542H706" stroke="#ffe17c" class="s-yellow" stroke-width="1.8" marker-end="url(#gpi-ay)" marker-start="url(#gpi-ay)"/>
<text x="630" y="571" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">until neither changes</text>
</g>
<g class="rc-panel" data-panel="lines"><rect x="10" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="628" fill="#ffe17c" font-size="16">5. Two goals pull apart (book, p. 87)</text>
<path d="M84 838L210 684" stroke="#93d4ff" class="s-blue" stroke-width="2.4"/>
<path d="M336 838L210 684" stroke="#a8e2a0" class="s-green" stroke-width="2.4"/>
<text x="28" y="864" fill="#93d4ff" class="c-blue" font-size="16">v = v<tspan baseline-shift="sub" font-size="75%">π</tspan></text>
<text x="396" y="864" fill="#a8e2a0" class="c-green" font-size="16" text-anchor="end">π = greedy(v)</text>
<text x="210" y="674" fill="#ffe17c" class="c-yellow" font-size="18" text-anchor="middle">v*, π*</text>
<text x="210" y="652" fill="#c3c9bd" class="c-dim" font-size="14" text-anchor="middle">each point: a value table v and a policy π</text>
<text x="210" y="854" fill="#f4f1e8" class="c-chalk" font-size="14" text-anchor="middle">start: v, π</text>
<path d="M210.0 832.0L101.6 816.4" stroke="#93d4ff" class="s-blue" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ab)"/>
<path d="M101.6 816.4L300.7 794.9" stroke="#a8e2a0" class="s-green" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ag)"/>
<path d="M300.7 794.9L140.7 768.7" stroke="#93d4ff" class="s-blue" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ab)"/>
<path d="M140.7 768.7L262.9 748.7" stroke="#a8e2a0" class="s-green" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ag)"/>
<path d="M262.9 748.7L174.7 727.1" stroke="#93d4ff" class="s-blue" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ab)"/>
<path d="M174.7 727.1L232.7 711.7" stroke="#a8e2a0" class="s-green" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ag)"/>
<path d="M232.7 711.7L197.4 699.4" stroke="#93d4ff" class="s-blue" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gpi-ab)"/>
<text x="26" y="706" fill="#93d4ff" class="c-blue" font-size="14">evaluate: jump</text>
<text x="26" y="724" fill="#93d4ff" class="c-blue" font-size="14">to the blue line</text>
<text x="394" y="706" fill="#a8e2a0" class="c-green" font-size="14" text-anchor="end">improve: jump</text>
<text x="394" y="724" fill="#a8e2a0" class="c-green" font-size="14" text-anchor="end">to the green line</text>
</g>
<g class="rc-panel" data-panel="family"><rect x="430" y="600" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="628" fill="#ffe17c" font-size="16">6. Same loop, different parts</text>
<text x="568" y="656" fill="#93d4ff" class="c-blue" font-size="16">evaluate</text>
<text x="700" y="656" fill="#a8e2a0" class="c-green" font-size="16">improve</text>
<path d="M442 664H818" stroke="#6f7d75" class="s-faint" stroke-width="1"/>
<text x="444" y="688" fill="#f4f1e8" class="c-chalk" font-size="15">policy iteration</text>
<text x="568" y="688" fill="#c3c9bd" class="c-dim" font-size="14">solve for v<tspan baseline-shift="sub" font-size="75%">π</tspan></text>
<text x="700" y="688" fill="#c3c9bd" class="c-dim" font-size="14">greedy, all cells</text>
<text x="444" y="715" fill="#f4f1e8" class="c-chalk" font-size="15">value iteration</text>
<text x="568" y="715" fill="#c3c9bd" class="c-dim" font-size="14">one sweep</text>
<text x="700" y="715" fill="#c3c9bd" class="c-dim" font-size="14">max in the sweep</text>
<text x="444" y="742" fill="#f4f1e8" class="c-chalk" font-size="15">Monte Carlo</text>
<text x="568" y="742" fill="#c3c9bd" class="c-dim" font-size="14">average returns</text>
<text x="700" y="742" fill="#c3c9bd" class="c-dim" font-size="14">greedy per episode</text>
<text x="444" y="769" fill="#f4f1e8" class="c-chalk" font-size="15">Sarsa</text>
<text x="568" y="769" fill="#c3c9bd" class="c-dim" font-size="14">one TD step on Q</text>
<text x="700" y="769" fill="#c3c9bd" class="c-dim" font-size="14">ε-greedy on Q</text>
<text x="444" y="796" fill="#f4f1e8" class="c-chalk" font-size="15">Q-learning</text>
<text x="568" y="796" fill="#c3c9bd" class="c-dim" font-size="14">one TD step on Q</text>
<text x="700" y="796" fill="#c3c9bd" class="c-dim" font-size="14">max in the target</text>
<text x="444" y="823" fill="#f4f1e8" class="c-chalk" font-size="15">actor-critic</text>
<text x="568" y="823" fill="#c3c9bd" class="c-dim" font-size="14">critic: TD error</text>
<text x="700" y="823" fill="#c3c9bd" class="c-dim" font-size="14">actor: gradient step</text>
<text x="444" y="850" fill="#ffe17c" class="c-yellow" font-size="15">AlphaGo Zero</text>
<text x="568" y="850" fill="#c3c9bd" class="c-dim" font-size="14">self-play winner z</text>
<text x="700" y="850" fill="#c3c9bd" class="c-dim" font-size="14">tree search (MCTS)</text>
</g>
</g>
</svg><!-- /gpi-canvas --></div></div>
<div class="rc-body">

Let's go back to the cliff grid from [Part 1 of my RL series](/robotics/rl-1-q-learning/#sec-world): 4 rows by 12 columns, a start S at the bottom left, a flag G at the bottom right and ten cliff cells between them. Every move gives a reward of −1, a step into the cliff gives −100 and sends you back to S, a move into the outer wall leaves you where you are, and later costs count a little less, with a discount of γ = 0.99. In Part 1, Q-learning found the best route by trial and error. This time, suppose you know the rules of the grid exactly. You know where every move leads and what it costs. Can you just work out the best way to move?

You could try every rule. A rule here picks one move in each of the 37 cells where you have to choose (the flag ends the episode), so there are $4^{37} \approx 1.9 \times 10^{22}$ of them. That's far too many. What you want instead is a way to take one rule and make it better. But to know whether a change helps, you need to know what the current rule earns from each cell, and that depends on every move the rule makes after that cell. So the two questions, "how good is this rule?" and "what's a better rule?", chase each other: you can't improve a rule without judging it, and every improvement changes what you have to judge.

The answer is to alternate between them. The idea is simple, and once you see it, you'll find it inside almost every reinforcement learning method, all the way up to AlphaGo Zero.

This is a side article to my [reinforcement learning series](/robotics/rl-0-overview/). It follows Chapter 4 of [Sutton and Barto's book](http://incompleteideas.net/book/RLbook2020.pdf), and every book page number below refers to its second edition.

<div class="rc-mark" id="sec-evaluate" data-panel="walker" data-view="walker" data-title="How good is a random walker?"></div>

## How good is the current rule?

Let's start with the worst reasonable rule: a random walker that picks each of the four moves with chance ¼. A rule for choosing moves is called a **policy**, written $\pi$, and $\pi(a \mid s)$ is the chance it picks move $a$ in cell $s$.

The **return** $G_t$ is what you collect from step $t$ on, with each later reward discounted once more: $G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots$. The **value** of a cell under a policy, $v_\pi(s)$, is the return you get on average when you start in $s$ and follow $\pi$. Computing $v_\pi$ for a given policy is called **policy evaluation**, or the prediction problem (§4.1, p. 74).

The value of a cell depends on the values of the cells you can reach in one move. The book writes this as the Bellman equation for $v_\pi$ (eq. 4.4, p. 74):

$$v_\pi(s) = \sum_a \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_\pi(s')\big]$$

Here $p(s', r \mid s, a)$ is the chance that move $a$ in cell $s$ lands in cell $s'$ with reward $r$. That's the model of the grid, and here you know it. In words: average over the moves the policy picks and over where each one lands, then add the reward to the discounted value of the next cell. On this grid every move has a single outcome, so the inner sum has just one term. There's one equation per cell, so for this grid you get 37 linear equations with 37 unknowns.

The first panel shows the answer. The random walker's values run from about −482, in the cell above the flag, down to −1072 at S: one move in four from S steps straight into the cliff, and the walker takes a long time to stumble onto the flag.

<details>
<summary>Two ways to solve for the values</summary>

You can solve the 37 equations directly, which is what the script for this article does. Or you can sweep through the cells and replace each value with the right-hand side, using the current guesses for the next cells (eq. 4.5, p. 74):

$$\begin{aligned} v_{k+1}(s) &= \sum_a \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a) \\ &\qquad \big[r + \gamma\, v_k(s')\big] \end{aligned}$$

With $\gamma < 1$, these sweeps converge to $v_\pi$ in the limit, from any starting guess that gives the flag a value of 0 (pp. 74-75). That second form matters later, because you can stop the sweeps early.

</details>

<div class="rc-mark" id="sec-improve" data-panel="greedy" data-view="greedy" data-title="Act greedily on those numbers"></div>

## Act greedily on those numbers

Now let's use the values to pick better moves. For each move $a$ in cell $s$, ask what you'd get if you made that move once and then went back to following $\pi$. That's the **action value** (eq. 4.6, p. 78):

$$q_\pi(s, a) = \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_\pi(s')\big]$$

Then, in every cell, pick the move with the highest action value. This is the **greedy** policy (eq. 4.9, p. 79):

$$\pi'(s) = \arg\max_a q_\pi(s, a)$$

Here $\pi'(s)$ is a single move, not a probability. Changing the policy this way is called **policy improvement**. Panel 2 shows what one greedy step does to the random walker. On the right side of the grid, the white arrows all reach the flag, some by way of the top row. On the left side, every cell near the cliff looks so bad that the greedy move is to go up and away from it. The ten red cells in the left three columns all get funnelled into the top-left corner. That corner has the walker's best value on that side, −929, so its greedy move is to stay put by bumping into the top wall, forever. That costs −1 per step, which adds up to $-1/(1-\gamma) = -100$.

So the new policy is silly: it never reaches the flag from S. And yet no cell got worse. S went from −1072 to −100, and every one of the 37 cells improved.

That's not luck. The **policy improvement theorem** (eq. 4.7 and 4.8, p. 78) says that if, in every cell, making the new policy's move once and then following the old policy is at least as good as following the old policy all the way,

$$q_\pi(s, \pi'(s)) \ge v_\pi(s) \quad \text{for every } s,$$

then the new policy is at least as good everywhere: $v_{\pi'}(s) \ge v_\pi(s)$ for every $s$. Why does that hold? If switching to $\pi'$ for one move doesn't hurt, you can make the same switch at the next cell, and the one after that. Each switch can only add value, and switching at every step is just following $\pi'$. After $k$ switches, all that's left of the old policy is $\gamma^k v_\pi(S_{t+k})$, which shrinks to zero.

The greedy policy always meets that condition. The old policy's value is the average of its action values, $v_\pi(s) = \sum_a \pi(a \mid s)\, q_\pi(s, a)$, and the best action value is at least that average.

<details>
<summary>The full proof chain (p. 78)</summary>

Start from the condition and unroll it one step at a time:

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

$\mathbb{E}_{\pi'}$ means the average over what happens when you follow $\pi'$. Each $\le$ uses the condition at the next cell. The random walker is a stochastic policy, and the theorem covers that case too (p. 79).

</details>

<div class="rc-mark" id="sec-repeat" data-panel="rounds" data-view="rounds" data-title="Repeat until nothing changes"></div>

## Repeat until nothing changes

The values you hold still belong to the old policy, so they're wrong for the new one. Evaluate again, then improve again. That alternation is **policy iteration** (§4.3, p. 80):

$$\begin{aligned} &\pi_0 \xrightarrow{\;E\;} v_{\pi_0} \xrightarrow{\;I\;} \pi_1 \xrightarrow{\;E\;} v_{\pi_1} \xrightarrow{\;I\;} \pi_2 \\ &\xrightarrow{\;E\;} \cdots \xrightarrow{\;I\;} \pi_* \xrightarrow{\;E\;} v_* \end{aligned}$$

Here E is a full evaluation and I is a greedy improvement. On the cliff grid it takes six rounds, shown in panel 3. Rounds 2 and 3 free the stuck cells a column at a time, since a stuck cell only switches once a neighbor has a better value to offer, but S stays at −100. In round 4, S finally finds a 17-step route: three cells along the cliff edge, then up to the top row and along it (yellow, −15.71). In round 6 the route drops down to the cliff edge: up once, right eleven times, down onto the flag, 13 steps (green, −12.25). That's the route Q-learning found in Part 1, and −12.25 is the same score its table gave "up" from S.

After round 6, one more greedy step changes nothing, so the loop stops. That's also why the final policy is optimal. If no single move beats the policy's own move in any cell, even when you judge the moves by the policy's own values, then those values satisfy the Bellman optimality equation, and only the optimal values $v_*$ do (pp. 64 and 79). The loop also has to stop. With the tie rule in the drawer below, a round only changes a move when the new move is strictly better, so at least one cell gets strictly better (p. 78) and no policy can come back. And there are only finitely many **deterministic** policies, the ones that pick a single move in each cell (p. 80).

In practice it stops much faster than the count of policies suggests: 6 rounds here, out of $1.9 \times 10^{22}$ possible policies.

<details>
<summary>Every round on the grid</summary>

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

No cell's value ever goes down from one round to the next. When two moves tie, the policy keeps its current move, so the loop can't flip between equally good moves forever (p. 80; Exercise 4.4, p. 82). The first greedy step from the random walker breaks ties in the order up, right, down, left. Every other order gives the same values and the same counts. Evaluation solves the linear equations exactly. To reproduce the numbers and the drawing, run `python3 scripts/rl_gpi_figures.py` in [the site's repository](https://github.com/Hadrien-Cornier/hadrien-cornier.github.io).

</details>

<details>
<summary>Why a stable policy is optimal</summary>

If the greedy step changes nothing, then $\pi'$ is as good as $\pi$, so $v_{\pi'} = v_\pi$, and the greedy step gives, for every cell,

$$v_{\pi'}(s) = \max_a \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_{\pi'}(s')\big]$$

That's the Bellman optimality equation (eq. 4.1, p. 73). For a finite problem like this one, its only solution is $v_*$, the best value any policy can reach (p. 64), so $v_{\pi'} = v_*$ and $\pi'$ is optimal (p. 79).

</details>

<div class="rc-mark" id="sec-gpi" data-panel="loop" data-view="loop" data-title="Two processes, any amount of work"></div>

## Two processes, any amount of work

Policy iteration finishes each process before starting the other: evaluate all the way, then improve every cell. But you don't have to. **Value iteration** stops evaluation after a single **sweep**, one update of every cell from the current guesses of its neighbors, and takes the max right inside it (eq. 4.10, p. 83):

$$v_{k+1}(s) = \max_a \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_k(s')\big]$$

On the cliff grid, starting from all zeros, value iteration reaches the exact optimal values at sweep 14, and sweep 15 changes nothing. Asynchronous methods go even finer: they can update one cell at a time, in any order, and with $\gamma < 1$ they still converge as long as every cell keeps getting updated (§4.5, p. 85).

Sutton and Barto call the general idea **generalized policy iteration**, or GPI: "letting policy-evaluation and policy-improvement processes interact, independent of the granularity and other details of the two processes" (§4.6, p. 86). Panel 4 redraws their diagram. Evaluation pulls V, the current value estimate, toward $v_\pi$, the true values of the current policy. Improvement pulls the policy toward greedy(V). With full evaluation and fully greedy improvement, the loop can only settle at an optimal policy $\pi_*$ and the optimal value $v_*$, because that's the only place where both processes stop changing anything (p. 86).

And here's the claim that makes it worth learning: "Almost all reinforcement learning methods are well described as GPI" (p. 86).

<div class="rc-mark" id="sec-compete" data-panel="lines" data-view="lines" data-title="Two goals pull apart"></div>

## Two goals that pull apart

The book's second diagram (p. 87) draws the two goals as two lines. Think of each point as a pair: a value table $v$ and a policy $\pi$. On the blue line, the values are right for the policy: $v = v_\pi$. On the green line, the policy is greedy for the values: $\pi = \text{greedy}(v)$. Each step of policy iteration jumps all the way onto one line, and that jump usually knocks you off the other: new values can make a different move look best, and a new policy makes the old values wrong. Still, the zigzag climbs to the point where the lines meet.

The authors say the two processes "can be viewed as both competing and cooperating" (p. 86). You can see both on the cliff grid. Round 1's greedy step made the random walker's values wrong: the top-left corner was worth −929 to the walker and −100 to the new policy. Then evaluation fixed the values, and the policy was no longer greedy for them in 6 cells. Each step undoes the other's work. Even so, S's value never drops, and the loop ends at the optimum.

The book adds that the real geometry is "much more complicated" than two lines (p. 87). So the drawing helps you think about the loop, but it isn't a map of all possible value tables and policies.

<div class="rc-mark" id="sec-family" data-panel="family" data-view="family" data-title="Same loop, different parts"></div>

## The same loop inside other methods

When you know the rules of the world, both processes can use them. But most RL methods don't know the rules, so they replace each process with something they can do from experience. Panel 6 lists what plays each role.

- **Monte Carlo control** (§5.2-5.3, pp. 96-99) evaluates by averaging the returns of whole episodes. Without a model, the values of cells alone can't tell you which move is best, because turning $v$ into $q$ needs $p$ (p. 96), so it learns action values $Q(s,a)$ and, after each episode, acts greedily on them in the cells it visited. That only works if every move keeps getting tried, so the book's version, Monte Carlo ES, starts each episode from a random cell and move (pp. 98-99).
- **Sarsa** (§6.4, p. 129) follows "the pattern of generalized policy iteration (GPI), only this time using TD methods for the evaluation or prediction part". Each step nudges $Q(s,a)$ toward one reward plus the next estimate, a temporal-difference (TD) update, and the policy is ε-greedy on $Q$, so improvement happens at every step.
- **Q-learning** (§6.5, p. 131) puts the max inside its update target, $R + \gamma \max_a Q(S', a)$, so improvement happens inside every evaluation update. The book's chart of one-step updates (Figure 8.6, p. 172) pairs it with value iteration on action values, using one sampled next cell instead of an average over all of them. Section 6.5 doesn't mention GPI itself; the book covers it with a chapter-wide claim that DP, TD and Monte Carlo methods "all use some variation of generalized policy iteration (GPI)" (p. 119).
- **Actor-critic** methods (§13.5, p. 331) split the two roles into two parts. The critic learns state values with TD errors, and the actor is the policy, nudged by a gradient step toward what the critic favors. The book says the critic "uses a TD method to evaluate the actor's policy", with its estimates "allowing the actor to improve its policy" (p. 346). But it never calls actor-critic GPI, and on p. 460 it even lists the two as separate ways to learn a policy. The SAC paper is more direct: "Actor-critic algorithms are typically derived starting from policy iteration" ([Haarnoja et al., 2018](https://arxiv.org/abs/1801.01290), p. 2).
- **AlphaGo Zero**: in their case study, Sutton and Barto write that "AlphaGo Zero implemented a form of policy iteration (Section 4.3), interleaving policy evaluation with policy improvement" (§16.6.2, p. 447).

The AlphaGo Zero paper ([Silver et al., 2017](https://www.nature.com/articles/nature24270)) says the same. A neural network outputs move probabilities $p$ and a value $v$ for a board. A tree search (Monte Carlo tree search, MCTS) guided by that network returns search probabilities $\pi$ that "usually select much stronger moves than the raw move probabilities p of the neural network $f_\theta(s)$; MCTS may therefore be viewed as a powerful policy improvement operator". Self-play with search, "using the game winner z as a sample of the value", "may be viewed as a powerful policy evaluation operator". Then the network is trained toward both, its value $v$ toward the winner $z$ (evaluation) and its move probabilities $p$ toward $\pi$ (improvement), and "these new parameters are used in the next iteration of self-play to make the search even stronger". The paper itself calls this "a policy iteration procedure".

<details>
<summary>AlphaGo Zero's loss, term by term</summary>

The network $f_\theta$ maps a board $s$ to $(p, v) = f_\theta(s)$. Training minimizes (Silver et al., eq. 1)

$$l = (z - v)^2 - \pi^\top \log p + c\,\lVert\theta\rVert^2$$

- $(z - v)^2$ is evaluation: the value output moves toward $z$, the winner of the self-play game: $+1$ or $-1$ from the current player's side.
- $-\pi^\top \log p$ is improvement: the move probabilities move toward the search probabilities $\pi$, where $\pi_a \propto N(s,a)^{1/\tau}$ and $N(s,a)$ counts how often the search visited move $a$.
- $c\,\lVert\theta\rVert^2$ is weight regularization.

Training started from random play and ran for about 3 days and 4.9 million self-play games, with 1,600 search simulations per move. The result beat AlphaGo Lee 100 games to 0 (Silver et al., pp. 6 and 8 of the author version).

</details>

## What I take from it

Now, when I read about a new RL method, I look for the two processes. What judges the current policy? What turns that judgment into a better policy? And how far does each one go before handing over to the other: a full solve, a single sweep, one TD step, one gradient step, or a whole tree search? Most of the differences between methods in the [series](/robotics/rl-0-overview/) are answers to those three questions.

<details>
<summary>Sources and what each one supports</summary>

- Sutton, R. S. and Barto, A. G., [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), 2018. Policy evaluation, eq. 4.4 and 4.5 (§4.1, p. 74). The action value, eq. 4.6, the policy improvement theorem, eq. 4.7 and 4.8, and its proof (§4.2, p. 78). The greedy policy, eq. 4.9, and stochastic policies (p. 79). Policy iteration and its finite convergence (§4.3, p. 80). Value iteration, eq. 4.10 (§4.4, p. 83). Asynchronous DP (§4.5, p. 85). GPI and its two diagrams (§4.6, pp. 86-87). Uniqueness of $v_*$ (p. 64). Exercise 4.4 on ties (p. 82). Monte Carlo control and Monte Carlo ES (§5.2-5.3, pp. 96-99). GPI in TD control (p. 119). Sarsa (§6.4, p. 129). Q-learning (§6.5, p. 131). The chart of one-step updates, Figure 8.6 (p. 172). Actor-critic (§13.5, p. 331), the critic as evaluation and the actor as improvement (§14.2.1, p. 346), and GPI and actor-critic as two routes (p. 460). AlphaGo Zero as policy iteration (§16.6.2, p. 447).
- Silver, D. et al., [Mastering the game of Go without human knowledge](https://www.nature.com/articles/nature24270), *Nature* 550, 354-359, 2017. The quotes come from the [author version](https://discovery.ucl.ac.uk/id/eprint/10045895/1/agz_unformatted_nature.pdf): MCTS as policy improvement and self-play as policy evaluation (p. 3), the search probabilities (p. 5), the loss, eq. 1 (p. 6), the training numbers (pp. 6 and 8), and the whole method as "an approximate policy iteration scheme" (p. 19).
- Haarnoja, T. et al., [Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor](https://arxiv.org/abs/1801.01290), ICML 2018. Actor-critic methods as derived from policy iteration (p. 2 of the arXiv version).
- The cliff grid and its rules come from [Part 1 of the series](/robotics/rl-1-q-learning/#sec-world). The policy iteration numbers come from `scripts/rl_gpi_figures.py`.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
