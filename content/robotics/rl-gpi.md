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
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><!-- gpi-canvas --><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 890" data-whole="0 0 840 890" data-views='{"walker": [16, 38, 388, 244], "greedy": [436, 38, 388, 244], "rounds": [16, 333, 388, 244], "loop": [436, 333, 388, 244], "lines": [16, 628, 388, 244], "family": [436, 628, 388, 244]}' role="img" aria-labelledby="gpi-title gpi-desc"><title id="gpi-title">Generalized policy iteration on a blackboard</title><desc id="gpi-desc">Six panels. 1: a random walker's values on the Part 1 cliff grid, −482 to −1072. 2: one greedy step; no cell gets worse. 3: six rounds of policy iteration; the start value climbs from −1072 to −12.25. 4: the book's loop between evaluation and improvement, ending at π* and v*. 5: the book's two-lines diagram. 6: seven methods and what evaluates and improves in each.</desc>
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
<text x="28" y="858" fill="#93d4ff" class="c-blue" font-size="16">v = v<tspan baseline-shift="sub" font-size="75%">π</tspan></text>
<text x="396" y="858" fill="#a8e2a0" class="c-green" font-size="16" text-anchor="end">π = greedy(v)</text>
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

Take [Part 1's](/robotics/rl-1-q-learning/#sec-world) 4 by 12 cliff grid: start S bottom left, flag G bottom right, ten cliff cells between. Each move gives −1, the cliff gives −100 and sends you back to S, walls keep you in place, and the discount is $\gamma = 0.99$. If you know these rules, can you just work out the best way to move?

Trying all $4^{37} \approx 1.9 \times 10^{22}$ rules, one move in each of 37 cells, is hopeless. To improve a rule you must score it first, and each new rule needs a new score.

This side article to my [reinforcement learning series](/robotics/rl-0-overview/) follows Chapter 4 of [Sutton and Barto](http://incompleteideas.net/book/RLbook2020.pdf) (page numbers refer to its second edition).

<div class="rc-mark" id="sec-evaluate" data-panel="walker" data-view="walker" data-title="How good is a random walker?"></div>

## How good is the current rule?

Start with a random walker that picks each move with chance ¼. Such a rule is a **policy** $\pi$, with $\pi(a \mid s)$ the chance it picks move $a$ in cell $s$. The **value** $v_\pi(s)$ is the total discounted reward you collect on average from $s$ under $\pi$. Computing it is **policy evaluation** (§4.1, p. 74), and each value depends on the cells one move can reach (eq. 4.4, p. 74):

$$v_\pi(s) = \sum_a \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_\pi(s')\big]$$

The **model** $p(s', r \mid s, a)$ is the chance that move $a$ in $s$ lands in $s'$ with reward $r$. You know it, so that's 37 linear equations in 37 unknowns. You can solve them directly, or in **sweeps**: replace every value with the right-hand side, using the current guesses, and repeat until nothing moves. Panel 1 shows the solution: about −482 above the flag, −1072 at S.

<div class="rc-slot" data-for="sec-evaluate"></div>

<details>
<summary>Solving for the values</summary>

My script (linked under "Every round") solves the equations directly. Written out, a sweep is (eq. 4.5, p. 74):

$$\begin{aligned} v_{k+1}(s) &= \sum_a \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a) \\ &\qquad \big[r + \gamma\, v_k(s')\big] \end{aligned}$$

For $\gamma < 1$, repeated sweeps converge to $v_\pi$ in the limit, from any start with the flag at 0 (pp. 74-75).

</details>

<div class="rc-mark" id="sec-improve" data-panel="greedy" data-view="greedy" data-title="Act greedily on those numbers"></div>

## Act greedily on those numbers

The **action value** is what you get from making move $a$ once, then following $\pi$ (eq. 4.6, p. 78):

$$q_\pi(s, a) = \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_\pi(s')\big]$$

The **greedy** policy takes the best move in each cell (eq. 4.9, p. 79):

$$\pi'(s) = \arg\max_a q_\pi(s, a)$$

Here $\pi'(s)$ is a single move, and switching to it is **policy improvement**. One greedy step (panel 2) funnels the ten red cells of the left three columns into the top-left corner, which the walker rated above both its neighbors. There they bump the top wall forever: −1 per step, or $-1/(1-\gamma) = -100$ in total. S never reaches the flag now, yet its value went from −1072 to −100, and all 37 cells improved.

<div class="rc-slot" data-for="sec-improve"></div>

By the **policy improvement theorem** (eq. 4.7 and 4.8, p. 78), if taking the new move once and then following $\pi$ is never worse than following $\pi$ from the start,

$$q_\pi(s, \pi'(s)) \ge v_\pi(s) \quad \text{for every } s,$$

then $v_{\pi'}(s) \ge v_\pi(s)$ everywhere. So use the new move again at the next step, and the next. After $k$ steps, all that's left of the old policy is its value $k$ steps ahead, discounted by $\gamma^k$, which shrinks to zero. Greedy always meets the condition: $v_\pi(s) = \sum_a \pi(a \mid s)\, q_\pi(s, a)$ is an average of action values, and the max is at least the average.

<details>
<summary>The proof chain (p. 78)</summary>

Unroll the condition step by step:

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

Here $\mathbb{E}_{\pi'}$ averages over following $\pi'$, and each $\le$ uses the condition at the next cell. The theorem also covers stochastic policies like the random walker (p. 79).

</details>

<div class="rc-mark" id="sec-repeat" data-panel="rounds" data-view="rounds" data-title="Repeat until nothing changes"></div>

## Repeat until nothing changes

The values now belong to the old policy, so you evaluate again and improve again. That's **policy iteration** (§4.3, p. 80), with E a full evaluation and I a greedy improvement:

$$\begin{aligned} &\pi_0 \xrightarrow{\;E\;} v_{\pi_0} \xrightarrow{\;I\;} \pi_1 \xrightarrow{\;E\;} v_{\pi_1} \xrightarrow{\;I\;} \pi_2 \\ &\xrightarrow{\;E\;} \cdots \xrightarrow{\;I\;} \pi_* \xrightarrow{\;E\;} v_* \end{aligned}$$

It takes six rounds of one evaluation and one greedy step each (panel 3); panel 2 showed round 1. In rounds 2 to 4, the stuck red cells come free a column at a time. In round 4 S finds a 17-step route (−15.71), and in round 6 a 13-step route along the cliff edge (−12.25), the route and score Q-learning found in Part 1.

<div class="rc-slot" data-for="sec-repeat"></div>

After round 6 a greedy step changes nothing, so the loop stops. No change means every value already equals its best action value: $v_\pi(s) = \max_a q_\pi(s, a)$ in every cell. That's the **Bellman optimality equation** (eq. 4.1, p. 73), and in a finite problem its only solution is $v_*$, the best value any policy can reach. So the final policy is optimal (pp. 64 and 79). It must stop, too: no policy comes back, and there are finitely many.

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

Round 1 breaks ties in the order up, right, down, left; all 24 orders give the same numbers. [Code](https://github.com/Hadrien-Cornier/hadrien-cornier.github.io): `python3 scripts/rl_gpi_figures.py`.

</details>

<details>
<summary>Why it must stop</summary>

When two moves tie, the policy keeps its current move (the fix that Exercise 4.4 asks for, p. 82), so a round only switches to strictly better moves. Then some cell gets strictly better (p. 78), so no policy can come back. With finitely many **deterministic** policies, the ones that pick one move per cell, the loop must stop (p. 80).

Written out with the model, the stable values satisfy (eq. 4.1, p. 73)

$$v_{\pi'}(s) = \max_a \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_{\pi'}(s')\big]$$

</details>

<div class="rc-mark" id="sec-gpi" data-panel="loop" data-view="loop" data-title="GPI: the general loop"></div>

## Two processes, any amount of work

Policy iteration runs evaluation to the end before each greedy step. It doesn't have to. **Value iteration** stops evaluation after one sweep and does the greedy step inside it: a max over moves replaces the average over $\pi$'s moves (eq. 4.10, p. 83):

$$v_{k+1}(s) = \max_a \sum_{s', r} p(s', r \mid s, a)\,\big[r + \gamma\, v_k(s')\big]$$

On the cliff grid, from all zeros, it reaches $v_*$ exactly at sweep 14, though in general it only converges in the limit (p. 83).

The general idea is **generalized policy iteration** (GPI): "letting policy-evaluation and policy-improvement processes interact, independent of the granularity and other details of the two processes" (§4.6, p. 86). In panel 4, evaluation pulls V, the current value estimate, toward $v_\pi$, and improvement pulls $\pi$ toward greedy(V). If both stop changing, V is the policy's true value and the policy is greedy for it, the stop condition from above, so you're at an optimal $\pi_*$ and $v_*$ (p. 86). And "Almost all reinforcement learning methods are well described as GPI" (p. 86).

<div class="rc-slot" data-for="sec-gpi"></div>

<div class="rc-mark" id="sec-compete" data-panel="lines" data-view="lines" data-title="Two goals pull apart"></div>

## Two goals that pull apart

In panel 5, the book's sketch (p. 87), each point pairs a value table $v$ with a policy $\pi$. The blue line is $v = v_\pi$, where the values fit the policy, and the green line is $\pi = \text{greedy}(v)$. Each jump onto one line usually knocks you off the other: new values can favor new moves, and a new policy makes old values wrong. Yet the zigzag climbs to where they meet, because no greedy step lowers a value. The two processes "can be viewed as both competing and cooperating" (p. 86).

<div class="rc-mark" id="sec-family" data-panel="family" data-view="family" data-title="Same loop, different parts"></div>

## The same loop inside other methods

Without the model, most methods run both processes on experience (panel 6).

- **Monte Carlo control** (§5.2-5.3, pp. 96-99) evaluates by averaging what whole episodes earn. Without a model, $v$ can't pick a move (p. 96), so it learns action values $Q(s,a)$ and acts greedily on them after each episode. In the book's version, Monte Carlo ES, episodes start from a random cell and move, so every move gets tried (pp. 98-99).
- **Sarsa** (§6.4, p. 129) nudges $Q(s,a)$ toward one reward plus the next estimate, a temporal-difference (TD) update, and acts ε-greedy (mostly greedy, sometimes random). That's "the pattern of generalized policy iteration (GPI), only this time using TD methods for the evaluation or prediction part".
- **Q-learning** (§6.5, p. 131) puts the max inside its TD target, $R + \gamma \max_a Q(S', a)$, so improvement happens inside every evaluation update (Figure 8.6, p. 172).
- **Actor-critic** (§13.5, p. 331): the actor is a policy updated by gradient steps. The critic evaluates the actor's policy with TD and the actor improves it (p. 346), though the book never names this GPI outright (see Sources).
- **AlphaGo Zero**, the book says, "implemented a form of policy iteration (Section 4.3), interleaving policy evaluation with policy improvement" (§16.6.2, p. 447).

[Silver et al. (2017)](https://www.nature.com/articles/nature24270) agree. A network outputs move probabilities $p$ and a value $v$ (the paper's symbols). Monte Carlo tree search (MCTS) guided by it returns search probabilities $\pi$ that usually select much stronger moves than $p$: "MCTS may therefore be viewed as a powerful policy improvement operator". Self-play with search "may be viewed as a powerful policy evaluation operator". Training moves $v$ toward the game winner $z$ (evaluation) and $p$ toward $\pi$ (improvement), and the paper uses these operators "repeatedly in a policy iteration procedure".

<details>
<summary>AlphaGo Zero's loss</summary>

The network $f_\theta$ maps a board $s$ to $(p, v) = f_\theta(s)$. Training adjusts $\theta$ to minimize (eq. 1, p. 6)

$$l = (z - v)^2 - \pi^\top \log p + c\,\lVert\theta\rVert^2$$

- $(z - v)^2$ is evaluation: $v$ moves toward the winner $z$, $+1$ or $-1$ from the current player's side.
- $-\pi^\top \log p$ is improvement: $p$ moves toward the search probabilities $\pi$.
- $c\,\lVert\theta\rVert^2$ is weight regularization.

Trained from random play for about 3 days and 4.9 million self-play games, it beat AlphaGo Lee 100 games to 0 (Silver et al., pp. 6 and 8).

</details>

## What I take from it

Now, in any new method, I look for the two processes. What judges the policy? What turns that judgment into a better policy? And how far does each go before handing over? Most methods in the [series](/robotics/rl-0-overview/) differ in those three answers.

<details>
<summary>Sources</summary>

- Sutton and Barto, [*Reinforcement Learning: An Introduction*](http://incompleteideas.net/book/RLbook2020.pdf), 2nd ed., 2018. Q-learning's GPI label comes from Chapter 6 (pp. 119 and 138), not §6.5. No page says that actor-critic is a form of GPI: p. 138 calls it "a third way in which TD methods can be extended to control", but p. 460 lists them as separate ways to learn a policy.
- Silver et al., [Mastering the game of Go without human knowledge](https://www.nature.com/articles/nature24270), *Nature*, 2017. Pages refer to the [author version](https://discovery.ucl.ac.uk/id/eprint/10045895/1/agz_unformatted_nature.pdf), and the quotes are on p. 3.
- Haarnoja et al., [Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor](https://arxiv.org/abs/1801.01290), ICML 2018. More direct than the book: "Actor-critic algorithms are typically derived starting from policy iteration" (p. 2 of the arXiv version).

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
