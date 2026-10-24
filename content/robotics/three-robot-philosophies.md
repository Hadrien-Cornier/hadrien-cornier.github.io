---
title: 'Three robot bets: where does the generalization ceiling come from?'
description: 'Figure, Generalist and Physical Intelligence each bet on a different source of robot generalization: the body, the data or the mix. A long read with a pinned blackboard.'
date: '2026-10-23'
draft: false
layout: essay
tags: ['robotics', 'robot-learning', 'foundation-models', 'humanoids']
thumbnail: '/assets/robotics/three-robot-philosophies/thumbnail.svg'
thumbnail_alt: 'Blackboard drawing: three bets on where robot generalization comes from: the body, the data and the mix'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<style>
/* This page reuses the RL series board. The one-line summary above the panels belongs to the whole-board view only. */
#rc.is-zoomed .rp-banner { visibility: hidden; }
#rc .rc-body table { font-size: 15px; }
@media (max-width: 600px) { #rc .rc-body table { font-size: 14px; } }
</style>
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 1742" data-whole="0 0 840 1742" data-views='{"nines":[12,88,396,288],"bets":[432,88,396,288],"stack":[12,418,396,288],"fork":[432,418,396,288],"homes":[12,748,396,288],"device":[432,748,396,288],"pi":[12,1078,396,288],"transfer":[432,1078,396,288],"wheels":[12,1408,396,288],"ceilings":[432,1408,396,288]}' role="img" aria-labelledby="rp-title rp-desc"><title id="rp-title">Three robot bets: ten blackboard panels</title><desc id="rp-desc">Ten blackboard panels on where each company thinks the generalization ceiling comes from: Figure says the body, Generalist the data, Physical Intelligence (Pi) the mix. 1, count your nines: a fast early ramp that plateaus under 99% (weak sensing, vanilla imitation) against a slower curve that climbs past the 99.99% target; each next nine takes about 10x more effort (Dolgov, Waymo). 2, three bets: Figure shapes the robot like humans; Generalist collects huge amounts of hand-held gripper data for a big model; Pi trains one model across many robots and homes, then practice. 3, Figure's four chapters: robot hardware and the AI recipe (money can't buy), scaling intelligence and scaling robots (money can buy), all made in house. 4, the fork: design data collection for the robot (Generalist, "the lowest ceiling" per Adcock) or design the robot for human data (Figure, "maybe even unbounded ceiling"). 5, Figure's 30-home test, successes out of 140 without and with human-video pretraining: towels 12 to 87, toys 7 to 56, bed 16 to 94; 8% to 56% overall; no non-humanoid tested. 6, Generalist: the same two-finger gripper in a human hand and on a robot arm; over 500,000 hours of hand-held data; with about 1 hour of robot data per task, 19% from scratch, 64% for GEN-0, 99% for GEN-1. 7, Pi: four data sources feed one model with a practice loop; 2.4% of pi0.5 examples come from its own robots on home tasks; unseen objects 94% with all data, 31% without static arms in homes, 49% without other lab robots, 74% without web data. 8, gains from human data, in points, by body: humanoid: plus 25 (HAT), plus 51 (EgoHumanoid); hand on an arm: plus 25 (ImMimic, hands); two-finger gripper arm: plus 30 (What Matters), plus 26 (ImMimic, grippers), minus 10 (EgoWAM: grasp the gripper can’t copy); wheeled robot: plus 30 (EMMA), plus 39 (Pi), plus 25 (Pi), plus 33 (ego-nav), plus 24 (LeLaN); scenes, objects, task order, routes and hand paths carry over, grasp style, finger contact and whole-body motion do not. 9, a humanoid climbs stairs where a wheeled robot stops; in a flat with no stairs both reach the counter and the ceiling moves to the hand. 10, four ceilings, from the top: body (wheels: stairs): what it can reach, attacked by Figure; data: what it covers and what it contains, attacked by Figure and Generalist and Pi; demonstrator: copying caps near the teacher, attacked by Pi and Generalist; evaluation: you cannot climb nines you cannot measure, nobody publishes enough trials.</desc>
<defs>
<marker id="rp-a-chalk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-chalk" stroke-width="1.8"/></marker>
<marker id="rp-a-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-dim" stroke-width="1.8"/></marker>
<marker id="rp-a-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-pink" stroke-width="1.8"/></marker>
<marker id="rp-a-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-blue" stroke-width="1.8"/></marker>
<marker id="rp-a-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-green" stroke-width="1.8"/></marker>
<marker id="rp-a-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-red" stroke-width="1.8"/></marker>
<marker id="rp-a-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-yellow" stroke-width="1.8"/></marker>
<marker id="rp-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1,1 L9,5 L1,9" fill="none" class="s-chalk" stroke-width="2"/></marker>
</defs>
<g font-size="16">
<g class="rc-panel" data-panel="nines">
<rect x="10" y="56" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="84">1. Count your nines first</text>
<g transform="translate(18 92)">
<text x="0" y="12" class="c-dim" font-size="13">success, in nines</text>
<path d="M52 208H270" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="46" y="213" class="c-chalk" font-size="14" text-anchor="end">90%</text>
<path d="M52 152H270" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="46" y="157" class="c-chalk" font-size="14" text-anchor="end">99%</text>
<path d="M52 96H270" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="46" y="101" class="c-chalk" font-size="14" text-anchor="end">99.9%</text>
<path d="M52 40H270" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="46" y="45" class="c-chalk" font-size="14" text-anchor="end">99.99%</text>
<path d="M52 20V232H274" fill="none" class="s-dim" stroke-width="1.6"/>
<path d="M224 246H270" fill="none" class="s-dim" stroke-width="1.4" marker-end="url(#rp-a-dim)"/>
<text x="218" y="251" class="c-dim" font-size="14" text-anchor="end">effort</text>
<path d="M52 40H276" fill="none" class="s-yellow" stroke-width="2.4" stroke-dasharray="8 5"/>
<text x="58" y="31" class="c-yellow" font-size="15">what the product needs</text>
<path d="M54 230C150 228 188 214 206 168S238 62 266 24" fill="none" class="s-chalk" stroke-width="2.6"/>
<text x="228" y="84" class="c-chalk" font-size="14" text-anchor="end">keeps climbing</text>
<path d="M54 230C64 184 78 165 110 160S220 157 268 156" fill="none" class="s-red" stroke-width="2.6"/>
<text x="66" y="116" class="c-red" font-size="15">fast early ramp,</text>
<text x="66" y="134" class="c-red" font-size="15">then a plateau</text>
<text x="84" y="182" class="c-red" font-size="13">weak sensing,</text>
<text x="84" y="197" class="c-red" font-size="13">vanilla imitation</text>
<text x="284" y="36" class="c-chalk" font-size="14">fully</text>
<text x="284" y="52" class="c-chalk" font-size="14">autonomous:</text>
<text x="284" y="68" class="c-dim" font-size="13">a whole stack</text>
<path d="M276 96Q281 96 281 101V119Q281 124 286 124Q281 124 281 129V147Q281 152 276 152" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="288" y="122" class="c-chalk" font-size="14">assist product:</text>
<text x="288" y="138" class="c-dim" font-size="13">a few</text>
<text x="284" y="204" class="c-chalk" font-size="14">demo:</text>
<text x="284" y="220" class="c-dim" font-size="13">one nine</text>
<text x="0" y="272" class="c-dim" font-size="14">Dolgov (Waymo): each next nine takes about 10x more effort</text>
</g></g>
<g class="rc-panel" data-panel="bets">
<rect x="430" y="56" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="84">2. Three bets on the ceiling</text>
<g transform="translate(438 92)">
<rect x="32.6" y="4" width="10.8" height="10.8" rx="3" fill="none" class="s-blue" stroke-width="2"/>
<path d="M35 9H41" fill="none" class="s-blue" stroke-width="1.6"/>
<path d="M38 14.8V17.7" fill="none" class="s-blue" stroke-width="2"/>
<rect x="29.4" y="17.7" width="17.3" height="24.5" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<path d="M29.4 21.3 L25.8 32.1 L25 42.2" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="25.8" cy="32.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M46.6 21.3 L50.2 32.1 L51 42.2" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="50.2" cy="32.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M33.7 42.2 L32.2 59.1 L32.2 76 L37.3 76" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="32.2" cy="59.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M42.3 42.2 L43.8 59.1 L43.8 76 L48.8 76" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="43.8" cy="59.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<text x="92" y="24" font-size="21"><tspan class="c-blue">Figure</tspan><tspan class="c-chalk" font-size="19" dx="10">the body</tspan></text>
<text x="92" y="48" class="c-chalk" font-size="16">shape the robot like the data</text>
<text x="92" y="67" class="c-chalk" font-size="16">(humans)</text>
<path d="M0 80H384" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<path d="M40.5 96.6 L40.5 111.4" fill="none" class="s-green" stroke-width="1.9"/>
<path d="M40.5 97.6 L50.1 97.6 L51.7 100.8" fill="none" class="s-green" stroke-width="1.9"/>
<path d="M40.5 110.4 L50.1 110.4 L51.7 107.2" fill="none" class="s-green" stroke-width="1.9"/>
<path d="M31.5 96.6 L39.2 96.6 L39.2 90.6 L31.5 90.6Z" fill="none" class="s-green" stroke-width="1.71"/>
<circle cx="39.2" cy="93.6" r="1.4" class="c-board s-green" stroke-width="1.3299999999999998"/>
<rect x="26.4" y="96.6" width="14.1" height="14.7" rx="3" fill="none" class="s-green" stroke-width="1.9"/>
<path d="M28.3 111.4 L33.4 111.4 L31.5 129 L26.4 129Z" fill="none" class="s-green" stroke-width="1.9"/>
<path d="M34.1 113.6Q37.3 116.2 33.1 118.7" fill="none" class="s-green" stroke-width="1.52"/>
<rect x="23.2" y="113.6" width="11.2" height="11.2" rx="4" class="s-chalk c-board" stroke-width="1.9"/>
<path d="M29.9 116.5H34.1" fill="none" class="s-chalk" stroke-width="1.3299999999999998"/>
<path d="M29.9 119.4H34.1" fill="none" class="s-chalk" stroke-width="1.3299999999999998"/>
<path d="M29.9 122.2H34.1" fill="none" class="s-chalk" stroke-width="1.3299999999999998"/>
<path d="M23.8 123.8L16.8 137.3M32.2 124.8L25.1 139.8" fill="none" class="s-chalk" stroke-width="1.9"/>
<ellipse cx="24.8" cy="129.9" rx="6.1" ry="2" transform="rotate(-28 24.8 129.9)" fill="none" class="s-green" stroke-width="1.9"/>
<text x="92" y="110" font-size="21"><tspan class="c-green">Generalist</tspan><tspan class="c-chalk" font-size="19" dx="10">the data</tspan></text>
<text x="92" y="134" class="c-chalk" font-size="16">huge amounts of hand-held gripper</text>
<text x="92" y="153" class="c-chalk" font-size="16">data, and a big model</text>
<path d="M0 166H384" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<path d="M6.6 196L7.8 194H12.2L13.4 196Z" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M10 194 L10 190 L6 181.6 L16 179.2" fill="none" class="s-pink" stroke-width="1.6"/>
<circle cx="10" cy="190" r="2" class="c-board s-pink" stroke-width="1.2800000000000002"/>
<circle cx="6" cy="181.6" r="2" class="c-board s-pink" stroke-width="1.2800000000000002"/>
<path d="M16 179.2 L17 179.6" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M17.7 178.1 L16.2 181.2" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M17.6 178.3 L19.6 179.2 L19.6 180.1" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M16.3 181 L18.4 182 L19 181.4" fill="none" class="s-pink" stroke-width="1.6"/>
<rect x="5.4" y="217.2" width="13.2" height="2.6" rx="3" fill="none" class="s-pink" stroke-width="1.6"/>
<circle cx="8" cy="220.7" r="1.3" class="c-board s-pink" stroke-width="1.6"/>
<circle cx="16" cy="220.7" r="1.3" class="c-board s-pink" stroke-width="1.6"/>
<path d="M12 217.2V203.1" fill="none" class="s-pink" stroke-width="1.6"/>
<rect x="10.2" y="200" width="3.5" height="2.6" rx="2" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M8.9 206.2H15.1" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M8.9 206.2 L5.4 208.4 L4.5 212.1" fill="none" class="s-pink" stroke-width="1.6"/>
<circle cx="5.4" cy="208.4" r="1.8" class="c-board s-pink" stroke-width="1.2800000000000002"/>
<path d="M4.5 212.1 L4.3 213.1" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M5.8 213.5 L2.7 212.6" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M5.6 213.4 L5.1 215.5 L4.3 215.7" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M2.9 212.7 L2.3 214.8 L2.9 215.3" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M15.1 206.2 L18.6 208.4 L19.5 212.1" fill="none" class="s-pink" stroke-width="1.6"/>
<circle cx="18.6" cy="208.4" r="1.8" class="c-board s-pink" stroke-width="1.2800000000000002"/>
<path d="M19.5 212.1 L19.7 213.1" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M21.3 212.6 L18.2 213.5" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M21.1 212.7 L21.7 214.8 L21.1 215.3" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M18.4 213.4 L18.9 215.5 L19.7 215.7" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M-0.4 248H8.4M4 248V231H12.4V233.6" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M14.4 234.8 L10.4 234.8" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M14.1 234.8 L14.1 237.3 L13.2 237.8" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M10.7 234.8 L10.7 237.3 L11.6 237.8" fill="none" class="s-pink" stroke-width="1.6"/>
<path d="M28 188L44 205.0" fill="none" class="s-pink" stroke-width="1.4" marker-end="url(#rp-a-pink)"/>
<path d="M28 212L44 211.0" fill="none" class="s-pink" stroke-width="1.4" marker-end="url(#rp-a-pink)"/>
<path d="M28 236L44 217.0" fill="none" class="s-pink" stroke-width="1.4" marker-end="url(#rp-a-pink)"/>
<rect x="48" y="199" width="26" height="24" rx="4" fill="none" class="s-pink" stroke-width="2"/>
<text x="92" y="196" font-size="21"><tspan class="c-pink">Pi</tspan><tspan class="c-chalk" font-size="19" dx="10">the mix</tspan></text>
<text x="92" y="220" class="c-chalk" font-size="16">one model across many robots and</text>
<text x="92" y="239" class="c-chalk" font-size="16">homes, then practice</text>
<text x="0" y="274" class="c-dim" font-size="15">Each bet moves the ceiling to a different place.</text>
</g></g>
<g class="rc-panel" data-panel="stack">
<rect x="10" y="386" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="414">3. Figure builds every layer</text>
<g transform="translate(18 422)">
<text x="0" y="13" class="c-dim" font-size="13">Figure’s four chapters</text>
<rect x="0" y="22" width="162" height="34" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<text x="10" y="45" class="c-blue" font-size="18">4</text>
<text x="28" y="45" class="c-chalk" font-size="15">scaling robots</text>
<rect x="0" y="62" width="162" height="34" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<text x="10" y="85" class="c-blue" font-size="18">3</text>
<text x="28" y="85" class="c-chalk" font-size="15">scaling intelligence</text>
<rect x="0" y="102" width="162" height="34" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<text x="10" y="125" class="c-blue" font-size="18">2</text>
<text x="28" y="125" class="c-chalk" font-size="15">AI recipe</text>
<rect x="0" y="142" width="162" height="34" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<text x="10" y="165" class="c-blue" font-size="18">1</text>
<text x="28" y="165" class="c-chalk" font-size="15">robot hardware</text>
<path d="M168 22Q174 22 174 28V53Q174 59 180 59Q174 59 174 65V90Q174 96 168 96" fill="none" class="s-dim" stroke-width="1.6"/>
<text x="186" y="55" class="c-chalk" font-size="15">money</text>
<text x="186" y="72" class="c-chalk" font-size="15">can buy</text>
<path d="M168 102Q174 102 174 108V133Q174 139 180 139Q174 139 174 145V170Q174 176 168 176" fill="none" class="s-yellow" stroke-width="1.8"/>
<text x="186" y="135" class="c-yellow" font-size="15">money</text>
<text x="186" y="152" class="c-yellow" font-size="15">can’t buy</text>
<text x="264" y="13" class="c-dim" font-size="13">made in house</text>
<rect x="262" y="22" width="122" height="22" rx="11" fill="none" class="s-blue" stroke-width="1.6"/>
<text x="323" y="38" class="c-blue" font-size="14" text-anchor="middle">hands</text>
<rect x="262" y="48.8" width="122" height="22" rx="11" fill="none" class="s-blue" stroke-width="1.6"/>
<text x="323" y="64.8" class="c-blue" font-size="14" text-anchor="middle">actuators</text>
<rect x="262" y="75.6" width="122" height="22" rx="11" fill="none" class="s-blue" stroke-width="1.6"/>
<text x="323" y="91.6" class="c-blue" font-size="14" text-anchor="middle">batteries</text>
<rect x="262" y="102.4" width="122" height="22" rx="11" fill="none" class="s-blue" stroke-width="1.6"/>
<text x="323" y="118.4" class="c-blue" font-size="14" text-anchor="middle">Helix model</text>
<rect x="262" y="129.2" width="122" height="22" rx="11" fill="none" class="s-blue" stroke-width="1.6"/>
<text x="323" y="145.2" class="c-blue" font-size="14" text-anchor="middle">BotQ factory</text>
<rect x="262" y="156" width="122" height="22" rx="11" fill="none" class="s-blue" stroke-width="1.6"/>
<text x="323" y="172" class="c-blue" font-size="14" text-anchor="middle">Index human video</text>
<text x="0" y="214" class="c-chalk" font-size="16">“You’ve got to complete all four chapters.</text>
<text x="0" y="236" class="c-chalk" font-size="16">And you can’t skip chapters.”</text>
<text x="0" y="262" class="c-dim" font-size="14">Adcock, All Hands 2026</text>
</g></g>
<g class="rc-panel" data-panel="fork">
<rect x="430" y="386" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="414">4. Two ways to meet the data</text>
<g transform="translate(438 422)">
<text x="192" y="16" class="c-chalk" font-size="17" text-anchor="middle">scaling robot data</text>
<path d="M192 22V30" fill="none" class="s-chalk" stroke-width="2"/>
<path d="M192 30C192 44 96 36 96 52" fill="none" class="s-green" stroke-width="2" marker-end="url(#rp-a-green)"/>
<path d="M192 30C192 44 288 36 288 52" fill="none" class="s-blue" stroke-width="2" marker-end="url(#rp-a-blue)"/>
<path d="M192 62V266" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<path d="M53.2 73.5 L53.2 90.5" fill="none" class="s-green" stroke-width="2"/>
<path d="M53.2 74.6 L64.3 74.6 L66.1 78.3" fill="none" class="s-green" stroke-width="2"/>
<path d="M53.2 89.4 L64.3 89.4 L66.1 85.7" fill="none" class="s-green" stroke-width="2"/>
<path d="M42.8 73.5 L51.7 73.5 L51.7 66.5 L42.8 66.5Z" fill="none" class="s-green" stroke-width="1.8"/>
<circle cx="51.7" cy="70" r="1.6" class="c-board s-green" stroke-width="1.4"/>
<rect x="36.9" y="73.5" width="16.3" height="17" rx="3" fill="none" class="s-green" stroke-width="2"/>
<path d="M39.1 90.5 L45 90.5 L42.8 110.9 L36.9 110.9Z" fill="none" class="s-green" stroke-width="2"/>
<path d="M45.8 93.1Q49.5 96.1 44.7 99" fill="none" class="s-green" stroke-width="1.6"/>
<rect x="33.2" y="93.1" width="13" height="13" rx="4" class="s-chalk c-board" stroke-width="2"/>
<path d="M41 96.4H45.8" fill="none" class="s-chalk" stroke-width="1.4"/>
<path d="M41 99.8H45.8" fill="none" class="s-chalk" stroke-width="1.4"/>
<path d="M41 103.1H45.8" fill="none" class="s-chalk" stroke-width="1.4"/>
<path d="M33.9 104.9L25.8 120.5M43.6 106L35.4 123.4" fill="none" class="s-chalk" stroke-width="2"/>
<ellipse cx="35" cy="112" rx="7" ry="2.4" transform="rotate(-28 35 112)" fill="none" class="s-green" stroke-width="2"/>
<path d="M83 102H97M83 110H97" fill="none" class="s-chalk" stroke-width="2.4"/>
<path d="M116.1 150L121 141.8H139L143.9 150Z" fill="none" class="s-chalk" stroke-width="2"/>
<path d="M130 142 L130 126 L114 100 L128 82" fill="none" class="s-chalk" stroke-width="2"/>
<circle cx="130" cy="126" r="2.9" class="c-board s-chalk" stroke-width="1.6"/>
<circle cx="114" cy="100" r="2.9" class="c-board s-chalk" stroke-width="1.6"/>
<path d="M128 82 L133.2 82" fill="none" class="s-green" stroke-width="2"/>
<path d="M133.2 73.5 L133.2 90.5" fill="none" class="s-green" stroke-width="2"/>
<path d="M133.2 74.6 L144.3 74.6 L146.1 78.3" fill="none" class="s-green" stroke-width="2"/>
<path d="M133.2 89.4 L144.3 89.4 L146.1 85.7" fill="none" class="s-green" stroke-width="2"/>
<path d="M122.8 73.5 L131.7 73.5 L131.7 66.5 L122.8 66.5Z" fill="none" class="s-green" stroke-width="1.8"/>
<circle cx="131.7" cy="70" r="1.6" class="c-board s-green" stroke-width="1.4"/>
<text x="96" y="172" class="c-green" font-size="15" text-anchor="middle">design the data collection</text>
<text x="96" y="190" class="c-green" font-size="15" text-anchor="middle">for the robot</text>
<text x="96" y="218" class="c-red" font-size="15" text-anchor="middle">Adcock: “the lowest ceiling”</text>
<text x="96" y="258" class="c-dim" font-size="14" text-anchor="middle">Generalist works here</text>
<circle cx="246" cy="71.3" r="7.3" fill="none" class="s-blue" stroke-width="2"/>
<path d="M246 78.6V111.3" fill="none" class="s-blue" stroke-width="2"/>
<path d="M228.8 108.7L246 85.5L263.2 108.7" fill="none" class="s-blue" stroke-width="2"/>
<path d="M234 150L246 111.3L258 150" fill="none" class="s-blue" stroke-width="2"/>
<path d="M281 104H295M281 112H295" fill="none" class="s-chalk" stroke-width="2.4"/>
<rect x="325.6" y="64" width="12.9" height="12.9" rx="3" fill="none" class="s-blue" stroke-width="2"/>
<path d="M328.5 70H335.5" fill="none" class="s-blue" stroke-width="1.6"/>
<path d="M332 76.9V80.3" fill="none" class="s-blue" stroke-width="2"/>
<rect x="321.7" y="80.3" width="20.6" height="29.2" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<path d="M321.7 84.6 L317.4 97.5 L316.5 109.6" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="317.4" cy="97.5" r="1.9" class="c-board s-blue" stroke-width="1.4"/>
<path d="M342.3 84.6 L346.6 97.5 L347.5 109.6" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="346.6" cy="97.5" r="1.9" class="c-board s-blue" stroke-width="1.4"/>
<path d="M326.8 109.6 L325.1 129.8 L325.1 150 L331.1 150" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="325.1" cy="129.8" r="1.9" class="c-board s-blue" stroke-width="1.4"/>
<path d="M337.2 109.6 L338.9 129.8 L338.9 150 L344.9 150" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="338.9" cy="129.8" r="1.9" class="c-board s-blue" stroke-width="1.4"/>
<text x="288" y="172" class="c-blue" font-size="15" text-anchor="middle">design the robot</text>
<text x="288" y="190" class="c-blue" font-size="15" text-anchor="middle">for human data</text>
<text x="288" y="218" class="c-yellow" font-size="15" text-anchor="middle">Adcock: “maybe even</text>
<text x="288" y="236" class="c-yellow" font-size="15" text-anchor="middle">unbounded ceiling”</text>
<text x="288" y="258" class="c-dim" font-size="14" text-anchor="middle">Figure works here</text>
</g></g>
<g class="rc-panel" data-panel="homes">
<rect x="10" y="716" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="744">5. Figure’s test: 30 homes it never saw</text>
<g transform="translate(18 752)">
<rect x="0" y="2" width="16" height="14" rx="2" class="c-dim" fill-opacity=".5"/>
<text x="22" y="14" class="c-chalk" font-size="14">without Index pretraining</text>
<rect x="0" y="22" width="16" height="14" rx="2" class="c-blue"/>
<text x="22" y="34" class="c-chalk" font-size="14">with Index pretraining</text>
<text x="0" y="58" class="c-dim" font-size="13">successes out of 140 trials per task</text>
<path d="M30 214H236" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="25" y="219" class="c-dim" font-size="13" text-anchor="end">0</text>
<path d="M30 142H236" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="25" y="147" class="c-dim" font-size="13" text-anchor="end">70</text>
<path d="M30 70H236" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="3 5"/>
<text x="25" y="75" class="c-dim" font-size="13" text-anchor="end">140</text>
<rect x="42" y="201.7" width="26" height="12.3" class="c-dim" fill-opacity=".5"/>
<rect x="72" y="124.5" width="26" height="89.5" class="c-blue"/>
<text x="55" y="196.7" class="c-dim" font-size="14" text-anchor="middle">12</text>
<text x="85" y="119.5" class="c-blue" font-size="15" text-anchor="middle">87</text>
<text x="70" y="233" class="c-chalk" font-size="15" text-anchor="middle">towels</text>
<rect x="108" y="206.8" width="26" height="7.2" class="c-dim" fill-opacity=".5"/>
<rect x="138" y="156.4" width="26" height="57.6" class="c-blue"/>
<text x="121" y="201.8" class="c-dim" font-size="14" text-anchor="middle">7</text>
<text x="151" y="151.4" class="c-blue" font-size="15" text-anchor="middle">56</text>
<text x="136" y="233" class="c-chalk" font-size="15" text-anchor="middle">toys</text>
<rect x="174" y="197.5" width="26" height="16.5" class="c-dim" fill-opacity=".5"/>
<rect x="204" y="117.3" width="26" height="96.7" class="c-blue"/>
<text x="187" y="192.5" class="c-dim" font-size="14" text-anchor="middle">16</text>
<text x="217" y="112.3" class="c-blue" font-size="15" text-anchor="middle">94</text>
<text x="202" y="233" class="c-chalk" font-size="15" text-anchor="middle">bed</text>
<path d="M30 214H236" fill="none" class="s-dim" stroke-width="1.6"/>
<text x="314" y="86" class="c-dim" font-size="14" text-anchor="middle">all three tasks</text>
<text x="314" y="122" text-anchor="middle" font-size="18"><tspan class="c-dim" font-size="26">8%</tspan><tspan class="c-chalk" dx="4">to</tspan><tspan class="c-blue" font-size="32" dx="4">56%</tspan></text>
<text x="314" y="148" class="c-dim" font-size="14" text-anchor="middle">35/420 to 237/420</text>
<text x="314" y="186" class="c-red" font-size="15" text-anchor="middle">no non-humanoid</text>
<text x="314" y="204" class="c-red" font-size="15" text-anchor="middle">robot was tested</text>
<text x="0" y="266" class="c-dim" font-size="13">same task data, model and test; human video only changed</text>
</g></g>
<g class="rc-panel" data-panel="device">
<rect x="430" y="716" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="744">6. Generalist: robot-shaped data from human hands</text>
<g transform="translate(438 752)">
<path d="M59.6 40.8 L59.6 59.2" fill="none" class="s-green" stroke-width="2"/>
<path d="M59.6 42 L71.6 42 L73.6 46" fill="none" class="s-green" stroke-width="2"/>
<path d="M59.6 58 L71.6 58 L73.6 54" fill="none" class="s-green" stroke-width="2"/>
<path d="M48.4 40.8 L58 40.8 L58 33.2 L48.4 33.2Z" fill="none" class="s-green" stroke-width="1.8"/>
<circle cx="58" cy="37" r="1.8" class="c-board s-green" stroke-width="1.4"/>
<rect x="42" y="40.8" width="17.6" height="18.4" rx="3" fill="none" class="s-green" stroke-width="2"/>
<path d="M44.4 59.2 L50.8 59.2 L48.4 81.2 L42 81.2Z" fill="none" class="s-green" stroke-width="2"/>
<path d="M51.6 62Q55.6 65.2 50.4 68.4" fill="none" class="s-green" stroke-width="1.6"/>
<rect x="38" y="62" width="14" height="14" rx="5" class="s-chalk c-board" stroke-width="2"/>
<path d="M46.4 65.6H51.6" fill="none" class="s-chalk" stroke-width="1.4"/>
<path d="M46.4 69.2H51.6" fill="none" class="s-chalk" stroke-width="1.4"/>
<path d="M46.4 72.8H51.6" fill="none" class="s-chalk" stroke-width="1.4"/>
<path d="M38.8 74.8L30 91.6M49.2 76L40.4 94.8" fill="none" class="s-chalk" stroke-width="2"/>
<ellipse cx="40" cy="82.4" rx="7.6" ry="2.6" transform="rotate(-28 40 82.4)" fill="none" class="s-green" stroke-width="2"/>
<path d="M84 50H100" fill="none" class="s-green" stroke-width="2" marker-end="url(#rp-a-green)"/>
<path d="M108.7 166L114.1 157H133.9L139.3 166Z" fill="none" class="s-chalk" stroke-width="2"/>
<path d="M124 157 L124 138 L104 102 L116 50" fill="none" class="s-chalk" stroke-width="2"/>
<circle cx="124" cy="138" r="3.2" class="c-board s-chalk" stroke-width="1.6"/>
<circle cx="104" cy="102" r="3.2" class="c-board s-chalk" stroke-width="1.6"/>
<path d="M116 50 L121.6 50" fill="none" class="s-green" stroke-width="2"/>
<path d="M121.6 40.8 L121.6 59.2" fill="none" class="s-green" stroke-width="2"/>
<path d="M121.6 42 L133.6 42 L135.6 46" fill="none" class="s-green" stroke-width="2"/>
<path d="M121.6 58 L133.6 58 L135.6 54" fill="none" class="s-green" stroke-width="2"/>
<path d="M110.4 40.8 L120 40.8 L120 33.2 L110.4 33.2Z" fill="none" class="s-green" stroke-width="1.8"/>
<circle cx="120" cy="37" r="1.8" class="c-board s-green" stroke-width="1.4"/>
<text x="44" y="122" class="c-dim" font-size="13" text-anchor="middle">in a hand</text>
<text x="124" y="184" class="c-dim" font-size="13" text-anchor="middle">on a robot</text>
<text x="178" y="12" class="c-dim" font-size="13">hand-held gripper data</text>
<text x="178" y="32" class="c-chalk" font-size="15">270,000 h (Nov 2025)</text>
<text x="178" y="53" class="c-green" font-size="17">over 500,000 h (Apr 2026)</text>
<text x="178" y="86" class="c-chalk" font-size="15">no robot data in</text>
<text x="178" y="104" class="c-chalk" font-size="15">pretraining (GEN-0, 1)</text>
<text x="178" y="138" class="c-red" font-size="15">1B model stops learning</text>
<text x="178" y="158" class="c-green" font-size="15">7B+ keeps learning</text>
<text x="0" y="204" class="c-dim" font-size="13">about 1 h of robot data per task, 3 tasks</text>
<text x="94" y="227" class="c-chalk" font-size="15" text-anchor="end">from scratch</text>
<rect x="100" y="213" width="43.7" height="17" rx="2" class="c-dim" fill-opacity=".5"/>
<text x="149.7" y="227" class="c-chalk" font-size="15">19%</text>
<text x="94" y="250" class="c-chalk" font-size="15" text-anchor="end">GEN-0</text>
<rect x="100" y="236" width="147.2" height="17" rx="2" fill="none" class="s-green" stroke-width="2"/>
<text x="253.2" y="250" class="c-chalk" font-size="15">64%</text>
<text x="94" y="273" class="c-green" font-size="15" text-anchor="end">GEN-1</text>
<rect x="100" y="259" width="227.7" height="17" rx="2" class="c-green"/>
<text x="333.7" y="273" class="c-green" font-size="15">99%</text>
</g></g>
<g class="rc-panel" data-panel="pi">
<rect x="10" y="1046" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="1074">7. Physical Intelligence: one model, many bodies</text>
<g transform="translate(18 1082)">
<rect x="8.2" y="20.3" width="15.6" height="3.1" rx="3" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="11.3" cy="24.4" r="1.6" class="c-board s-chalk" stroke-width="1.6"/>
<circle cx="20.7" cy="24.4" r="1.6" class="c-board s-chalk" stroke-width="1.6"/>
<path d="M16 20.3V3.6" fill="none" class="s-chalk" stroke-width="1.6"/>
<rect x="13.9" y="0" width="4.2" height="3.1" rx="2" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M12.4 7.3H19.6" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M12.4 7.3 L8.2 9.9 L7.2 14.3" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="8.2" cy="9.9" r="1.8" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<path d="M7.2 14.3 L6.9 15.4" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M8.7 15.9 L5 14.9" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M8.5 15.9 L7.8 18.3 L6.9 18.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M5.2 15 L4.6 17.5 L5.3 18.1" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M19.6 7.3 L23.8 9.9 L24.8 14.3" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="23.8" cy="9.9" r="1.8" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<path d="M24.8 14.3 L25.1 15.4" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M27 14.9 L23.3 15.9" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M26.8 15 L27.4 17.5 L26.7 18.1" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M23.5 15.9 L24.2 18.3 L25.1 18.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M0 52H38" fill="none" class="s-dim" stroke-width="1.4"/>
<path d="M5.3 52L6.6 49.8H11.4L12.7 52Z" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M9 49.8 L9 45.4 L4.6 36.2 L15.6 33.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="9" cy="45.4" r="2" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<circle cx="4.6" cy="36.2" r="2" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<path d="M15.6 33.5 L16.6 34" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M17.4 32.3 L15.8 35.7" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M17.3 32.5 L19.6 33.6 L19.6 34.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M15.9 35.5 L18.2 36.5 L18.9 36" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M25.3 52L26.6 49.8H31.4L32.7 52Z" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M29 49.8 L29 45.4 L33.4 36.2 L22.4 33.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="29" cy="45.4" r="2" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<circle cx="33.4" cy="36.2" r="2" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<path d="M22.4 33.5 L21.4 34" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M22.2 35.7 L20.6 32.3" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M22.1 35.5 L19.8 36.5 L19.1 36" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M20.7 32.5 L18.4 33.6 L18.4 34.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M10.3 78L11.6 75.8H16.4L17.7 78Z" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M14 75.8 L14 71.4 L9.6 62.2 L20.6 59.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="14" cy="71.4" r="2" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<circle cx="9.6" cy="62.2" r="2" class="c-board s-chalk" stroke-width="1.2800000000000002"/>
<path d="M20.6 59.5 L21.6 60" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M22.4 58.3 L20.8 61.7" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M22.3 58.5 L24.6 59.6 L24.6 60.5" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M20.9 61.5 L23.2 62.5 L23.9 62" fill="none" class="s-chalk" stroke-width="1.6"/>
<circle cx="18" cy="92" r="10" fill="none" class="s-chalk" stroke-width="1.6"/>
<ellipse cx="18" cy="92" rx="4.5" ry="10" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M8 92H28M9.5 87H26.5M9.5 97H26.5" fill="none" class="s-chalk" stroke-width="1.2800000000000002"/>
<text x="42" y="19" class="c-dim" font-size="13">two-arm robot on wheels (the target)</text>
<path d="M230 15C238 15 238 36 246 36" fill="none" class="s-chalk" stroke-width="1.5" marker-end="url(#rp-a-chalk)"/>
<text x="42" y="45" class="c-dim" font-size="13">static two-arm robots in homes</text>
<path d="M202 41C224 41 224 43 246 43" fill="none" class="s-chalk" stroke-width="1.5" marker-end="url(#rp-a-chalk)"/>
<text x="42" y="71" class="c-dim" font-size="13">other robots in the lab</text>
<path d="M158 67C202 67 202 50 246 50" fill="none" class="s-chalk" stroke-width="1.5" marker-end="url(#rp-a-chalk)"/>
<text x="42" y="97" class="c-dim" font-size="13">web data</text>
<path d="M90 93C168 93 168 57 246 57" fill="none" class="s-chalk" stroke-width="1.5" marker-end="url(#rp-a-chalk)"/>
<rect x="250" y="26" width="74" height="42" rx="8" fill="none" class="s-pink" stroke-width="2.4"/>
<text x="287" y="52" class="c-pink" font-size="17" text-anchor="middle">one model</text>
<path d="M324 38C354 28 380 52 364 70C352 84 320 86 308 72" fill="none" class="s-pink" stroke-width="2" marker-end="url(#rp-a-pink)"/>
<text x="384" y="100" class="c-pink" font-size="14" text-anchor="end">practice + corrections (RL)</text>
<text x="384" y="117" class="c-chalk" font-size="13" text-anchor="end">some of the hardest tasks: throughput over 2x, failures halved</text>
<text x="0" y="140" class="c-dim" font-size="13">π0.5 training examples</text>
<rect x="0" y="146" width="9.2" height="14" class="c-pink"/>
<rect x="9.2" y="146" width="374.8" height="14" class="c-dim" fill-opacity=".5"/>
<text x="0" y="177" class="c-pink" font-size="14">2.4% its robots, home tasks</text>
<text x="384" y="177" class="c-dim" font-size="14" text-anchor="end">97.6% other sources</text>
<text x="0" y="198" class="c-dim" font-size="13">π0.5, unseen objects (Pi blog chart)</text>
<text x="150" y="217" class="c-chalk" font-size="14" text-anchor="end">all data</text>
<rect x="156" y="205" width="178.6" height="14" rx="2" class="c-pink"/>
<text x="340.6" y="217" class="c-pink" font-size="14">94%</text>
<text x="150" y="236" class="c-chalk" font-size="14" text-anchor="end">no static arms in homes</text>
<rect x="156" y="224" width="58.9" height="14" rx="2" class="c-red"/>
<text x="220.9" y="236" class="c-red" font-size="14">31%</text>
<text x="150" y="255" class="c-chalk" font-size="14" text-anchor="end">no other lab robots</text>
<rect x="156" y="243" width="93.1" height="14" rx="2" class="c-red"/>
<text x="255.1" y="255" class="c-red" font-size="14">49%</text>
<text x="150" y="274" class="c-chalk" font-size="14" text-anchor="end">no web data</text>
<rect x="156" y="262" width="140.6" height="14" rx="2" class="c-dim" fill-opacity=".5"/>
<text x="302.6" y="274" class="c-chalk" font-size="14">74%</text>
</g></g>
<g class="rc-panel" data-panel="transfer">
<rect x="430" y="1046" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="1074">8. Human data on robots that aren’t human-shaped</text>
<g transform="translate(438 1082)">
<text x="0" y="14" class="c-green" font-size="14">carries over: scene, objects, task order, route, hand path</text>
<text x="0" y="33" class="c-red" font-size="14">not to a wheeled gripper: grasp style, finger contact, whole body</text>
<path d="M195.5 48V214" fill="none" class="s-dim" stroke-width="1.6"/>
<path d="M134 214H380" fill="none" class="s-dim" stroke-width="1.6"/>
<path d="M134 214V219" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="134" y="233" class="c-dim" font-size="13" text-anchor="middle">−20</text>
<path d="M195.5 214V219" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="195.5" y="233" class="c-dim" font-size="13" text-anchor="middle">0</text>
<path d="M257 214V219" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="257" y="233" class="c-dim" font-size="13" text-anchor="middle">+20</text>
<path d="M318.5 214V219" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="318.5" y="233" class="c-dim" font-size="13" text-anchor="middle">+40</text>
<path d="M380 214V219" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="380" y="233" class="c-dim" font-size="13" text-anchor="middle">+60</text>
<text x="257" y="250" class="c-dim" font-size="13" text-anchor="middle">gain in success from adding human data, points</text>
<path d="M134 62H380" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="67" class="c-chalk" font-size="14">humanoid</text>
<circle cx="272.4" cy="62" r="5.5" class="c-chalk"/>
<text x="272.4" y="52" class="c-dim" font-size="13" text-anchor="middle">HAT</text>
<circle cx="352.3" cy="62" r="5.5" class="c-chalk"/>
<text x="352.3" y="52" class="c-dim" font-size="13" text-anchor="middle">EgoHumanoid</text>
<path d="M134 97H380" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="102" class="c-chalk" font-size="14">hand on an arm</text>
<circle cx="272.4" cy="97" r="5.5" class="c-chalk"/>
<text x="281.4" y="101.5" class="c-dim" font-size="13">ImMimic, hands</text>
<path d="M134 138H380" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="143" class="c-chalk" font-size="14">two-finger gripper arm</text>
<circle cx="287.8" cy="131" r="5.5" class="c-chalk"/>
<text x="287.8" y="121" class="c-dim" font-size="13" text-anchor="middle">What Matters</text>
<circle cx="275.4" cy="146" r="5.5" class="c-chalk"/>
<text x="284.4" y="150.5" class="c-dim" font-size="13">ImMimic, grippers</text>
<circle cx="164.8" cy="138" r="5.5" class="c-red"/>
<text x="164.8" y="128" class="c-red" font-size="13" text-anchor="middle">EgoWAM</text>
<path d="M134 191H380" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="196" class="c-chalk" font-size="14">wheeled robot</text>
<circle cx="287.8" cy="184" r="5.5" class="c-chalk"/>
<text x="287.8" y="174" class="c-dim" font-size="13" text-anchor="middle">EMMA</text>
<circle cx="315.4" cy="184" r="5.5" class="c-pink"/>
<text x="324.4" y="188.5" class="c-pink" font-size="13">Pi</text>
<circle cx="272.4" cy="199" r="5.5" class="c-pink"/>
<circle cx="297" cy="199" r="5.5" class="c-chalk"/>
<text x="306" y="203.5" class="c-dim" font-size="13">ego-nav</text>
<circle cx="269.3" cy="184" r="5.5" class="c-chalk"/>
<text x="260.3" y="188.5" class="c-dim" font-size="13" text-anchor="end">LeLaN</text>
<text x="191.5" y="162" class="c-red" font-size="14" text-anchor="end">grasp the gripper can’t copy</text>
<text x="0" y="274" class="c-dim" font-size="13">each dot: one comparison, human data vs that paper's robot baseline</text>
</g></g>
<g class="rc-panel" data-panel="wheels">
<rect x="10" y="1376" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="1404">9. Legs, wheels and the flat with no stairs</text>
<g transform="translate(18 1412)">
<text x="0" y="15" class="c-red" font-size="16">a hard ceiling: physics</text>
<path d="M0 124H384" fill="none" class="s-dim" stroke-width="1.6"/>
<path d="M4 124V28H380V124M230 62H380" fill="none" class="s-chalk" stroke-width="1.8"/>
<path d="M146 124V108.5H167V93H188V77.5H209V62H230" fill="none" class="s-chalk" stroke-width="2"/>
<rect x="153.7" y="50.5" width="8.7" height="8.7" rx="3" fill="none" class="s-blue" stroke-width="2"/>
<path d="M155.6 54.6H160.4" fill="none" class="s-blue" stroke-width="1.6"/>
<path d="M158 59.2V61.5" fill="none" class="s-blue" stroke-width="2"/>
<rect x="151" y="61.5" width="13.9" height="19.7" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<path d="M151 64.4 L148.1 73.1 L147.6 81.2" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="148.1" cy="73.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M165 64.4 L167.9 73.1 L168.4 81.2" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="167.9" cy="73.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M154.5 81.2 L153.4 94.9 L153.4 108.5 L157.4 108.5" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="153.4" cy="94.9" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M161.5 81.2 L171 87.1 L174.6 93 L178.7 93" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="171" cy="87.1" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<rect x="67.2" y="109.6" width="33.6" height="7.2" rx="3" fill="none" class="s-green" stroke-width="2"/>
<circle cx="73.8" cy="119.8" r="4.2" class="c-board s-green" stroke-width="2"/>
<circle cx="94.2" cy="119.8" r="4.2" class="c-board s-green" stroke-width="2"/>
<path d="M78 109.6V71.2" fill="none" class="s-green" stroke-width="2"/>
<rect x="73.2" y="64" width="9.6" height="6.6" rx="2" fill="none" class="s-green" stroke-width="2"/>
<circle cx="80.4" cy="67.3" r="1.4" class="c-green"/>
<path d="M78 84.4 L90 79.6 L99.6 90.4" fill="none" class="s-green" stroke-width="2"/>
<circle cx="90" cy="79.6" r="1.8" class="c-board s-green" stroke-width="1.6"/>
<path d="M99.6 90.4 L102 92.4" fill="none" class="s-green" stroke-width="2"/>
<path d="M105.3 88.5 L98.7 96.4" fill="none" class="s-green" stroke-width="2"/>
<path d="M104.9 89 L110.1 93.3 L109.5 95.8" fill="none" class="s-green" stroke-width="2"/>
<path d="M99.1 95.9 L104.3 100.2 L106.6 99.2" fill="none" class="s-green" stroke-width="2"/>
<path d="M119 96L135 112M135 96L119 112" fill="none" class="s-red" stroke-width="3"/>
<text x="305" y="50" class="c-dim" font-size="13" text-anchor="middle">upstairs</text>
<path d="M0 140H384" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="163" class="c-yellow" font-size="16">no stairs: the ceiling moves to the hand</text>
<path d="M0 242H384" fill="none" class="s-dim" stroke-width="1.6"/>
<rect x="166" y="208" width="66" height="34" rx="2" fill="none" class="s-chalk" stroke-width="2"/>
<path d="M162 208H236" fill="none" class="s-chalk" stroke-width="3"/>
<path d="M192 208V198H204V208" fill="none" class="s-chalk" stroke-width="1.8"/>
<rect x="92.6" y="227.1" width="34.7" height="7.4" rx="3" fill="none" class="s-green" stroke-width="2"/>
<circle cx="99.5" cy="237.7" r="4.3" class="c-board s-green" stroke-width="2"/>
<circle cx="120.5" cy="237.7" r="4.3" class="c-board s-green" stroke-width="2"/>
<path d="M103.8 227.1V187.4" fill="none" class="s-green" stroke-width="2"/>
<rect x="98.8" y="180" width="9.9" height="6.8" rx="2" fill="none" class="s-green" stroke-width="2"/>
<circle cx="106.3" cy="183.4" r="1.4" class="c-green"/>
<path d="M103.8 201.1 L131.2 193.2 L158.6 200.2" fill="none" class="s-green" stroke-width="2"/>
<circle cx="131.2" cy="193.2" r="1.9" class="c-board s-green" stroke-width="1.6"/>
<path d="M158.6 200.2 L161.8 201" fill="none" class="s-green" stroke-width="2"/>
<path d="M163.1 195.8 L160.4 206.2" fill="none" class="s-green" stroke-width="2"/>
<path d="M162.9 196.5 L169.7 198.2 L170.2 200.7" fill="none" class="s-green" stroke-width="2"/>
<path d="M160.6 205.5 L167.4 207.2 L169.1 205.3" fill="none" class="s-green" stroke-width="2"/>
<rect x="259.1" y="176" width="9.9" height="9.9" rx="3" fill="none" class="s-blue" stroke-width="2"/>
<path d="M261.3 180.6H266.7" fill="none" class="s-blue" stroke-width="1.6"/>
<path d="M264 185.9V188.5" fill="none" class="s-blue" stroke-width="2"/>
<rect x="256.1" y="188.5" width="15.8" height="22.4" rx="4" fill="none" class="s-blue" stroke-width="2"/>
<path d="M256.1 191.8 L241 201.4 L226 203" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="241" cy="201.4" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M271.9 191.8 L275.2 201.7 L275.9 211" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="275.2" cy="201.7" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M260 211 L258.7 226.5 L258.7 242 L263.3 242" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="258.7" cy="226.5" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<path d="M268 211 L269.3 226.5 L269.3 242 L273.9 242" fill="none" class="s-blue" stroke-width="2"/>
<circle cx="269.3" cy="226.5" r="1.6" class="c-board s-blue" stroke-width="1.4"/>
<text x="0" y="262" class="c-dim" font-size="14">Like a camera in the dark, a wheel at a stair</text>
<text x="0" y="278" class="c-dim" font-size="14">is a limit no data removes.</text>
</g></g>
<g class="rc-panel" data-panel="ceilings">
<rect x="430" y="1376" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="1404">10. Four ceilings, and who attacks which</text>
<g transform="translate(438 1412)">
<text x="0" y="12" class="c-dim" font-size="13">success</text>
<path d="M20 18V240H382" fill="none" class="s-dim" stroke-width="1.6"/>
<text x="382" y="257" class="c-dim" font-size="13" text-anchor="end">effort</text>
<path d="M24 62H382" fill="none" class="s-red" stroke-width="2.2" stroke-dasharray="8 5"/>
<text x="28" y="37" class="c-red" font-size="17">evaluation</text>
<text x="28" y="54" class="c-chalk" font-size="14">you cannot climb nines you cannot measure</text>
<text x="382" y="37" class="c-dim" font-size="13" text-anchor="end">nobody publishes enough trials</text>
<path d="M24 118H382" fill="none" class="s-red" stroke-width="2.2" stroke-dasharray="8 5"/>
<text x="28" y="93" class="c-red" font-size="17">demonstrator</text>
<text x="28" y="110" class="c-chalk" font-size="14">copying caps near the teacher</text>
<circle cx="375" cy="88" r="7" class="c-green"/>
<circle cx="355" cy="88" r="7" class="c-pink"/>
<path d="M24 174H382" fill="none" class="s-red" stroke-width="2.2" stroke-dasharray="8 5"/>
<text x="28" y="149" class="c-red" font-size="17">data</text>
<text x="28" y="166" class="c-chalk" font-size="14">what it covers and what it contains</text>
<circle cx="375" cy="144" r="7" class="c-pink"/>
<circle cx="355" cy="144" r="7" class="c-green"/>
<circle cx="335" cy="144" r="7" class="c-blue"/>
<path d="M24 230H382" fill="none" class="s-red" stroke-width="2.2" stroke-dasharray="8 5"/>
<text x="28" y="205" class="c-red" font-size="17">body (wheels: stairs)</text>
<text x="28" y="222" class="c-chalk" font-size="14">what it can reach</text>
<circle cx="375" cy="200" r="7" class="c-blue"/>
<text x="0" y="274" class="c-dim" font-size="13">who attacks it:</text>
<circle cx="102" cy="269" r="6" class="c-blue"/>
<text x="112" y="274" class="c-blue" font-size="15">Figure</text>
<circle cx="178" cy="269" r="6" class="c-green"/>
<text x="188" y="274" class="c-green" font-size="15">Generalist</text>
<circle cx="282" cy="269" r="6" class="c-pink"/>
<text x="292" y="274" class="c-pink" font-size="15">Pi</text>
</g></g>
<g class="rp-banner">
<text x="420" y="30" class="c-chalk" font-size="19" text-anchor="middle">Where does each company think the generalization ceiling comes from?</text>
<text x="420" y="56" class="c-chalk" font-size="18" text-anchor="middle"><tspan class="c-blue">Figure</tspan>: the body.<tspan class="c-green" dx="22">Generalist</tspan>: the data.<tspan class="c-pink" dx="22">Pi</tspan>: the mix.</text>
</g>
</g></svg></div></div>
<div class="rc-body">

Suppose you want a robot that can tidy a stranger's kitchen, one it has never seen. Robot people call that **generalization**, and three of the best-funded robot companies, [Figure](https://www.figure.ai), [Generalist](https://generalistai.com) and [Physical Intelligence](https://www.pi.website) (Pi), all say it's the whole game. They disagree about where it comes from.

Figure builds a humanoid and pays people to film themselves doing chores. Generalist hands people a cheap two-finger gripper and records them using it. Pi trains one model on many different robots, then lets it practice on the job. Each is a bet on where the **generalization ceiling** is: the point where more data and money stop making the robot better in places it hasn't seen. Underneath sits one question: do you need a human-shaped robot to learn from human data? Figure says yes. If the answer is no, a simpler robot on wheels might be enough for a lot of homes.

<div class="rc-mark" id="sec-nines" data-panel="nines" data-view="nines" data-title="Count your nines first"></div>

## Count your nines first

The idea of a ceiling comes from a talk by Dmitri Dolgov, Waymo's co-CEO, at Y Combinator's Startup School in July 2026: [The Demo Is Only 1% Of The Work](https://www.youtube.com/watch?v=Gp4zrV3-6N8). Reliability comes in nines, 90%, 99%, 99.9%, and each one costs far more than the last:

> "getting to that first 90% or 99%, that's the easy part. But then every next nine that you want to add, that takes about 10 times more effort. So you need to know up front exactly how many nines your product actually needs."

Every technology has a curve that starts steep and then flattens, and the classic mistake is "picking the tech that gives you the fastest early ramp". Cameras alone are "a very reasonable way to go" for a car that only has to drive like a person, but for superhuman driving "weak sensing just leads to a safety curve that flattens out way too early." In a dust storm his camera sees very little and the lidar shows a pedestrian by the road. More camera data can't fix that, because the pedestrian isn't in the pixels. His second example is learning: plain end-to-end imitation "will give you very rapid progress", but for a superhuman product "just doing kind of that basic vanilla end-to-end is not enough." I'll call that the imitation plateau.

So how many nines does a home robot need? Let's do a back-of-the-napkin calculation. Say it does 50 small tasks a day. At 99% per task it gets something wrong every two days. To fail less than once a month it needs about 99.93%. That's three nines at least, in homes nobody tested in.

<div class="rc-mark" id="sec-bets" data-panel="bets" data-view="bets" data-title="Three bets on the ceiling"></div>

## Three bets on the ceiling

Figure thinks the ceiling is the body: people are the biggest source of physical know-how, and a robot gets the most from their data if it's shaped like them. Generalist thinks it's the data: one kind of data, real interaction with the action recorded in it, at enormous volume and fed to a big model. Pi thinks it's the mix: robot data from many robots, homes and tasks, with the robot's own practice on top. Figure reshapes the robot to fit people, Generalist reshapes people's tools to fit the robot, and Pi asks one model to absorb the difference.

All three are private companies.

| | Figure | Generalist | Pi |
| --- | --- | --- | --- |
| Started | master plan May 2022, incorporated 2023 (Delaware) | incorporated 2024 (Delaware) | announced as "a new company" in March 2024 |
| Based in | San Jose | San Francisco | San Francisco, factory in Fremont |
| People | Brett Adcock, founder and CEO | Pete Florence, Andrew Barry, Andy Zeng | Karol Hausman, Sergey Levine, Chelsea Finn and others |
| Money | Series C of over $1 billion at a $39 billion valuation (2025) | over $500 million by June 2026, about $198 million more in August | $600 million Series B (2025), per CapitalG, which led it |

<div class="rc-mark" id="sec-stack" data-panel="stack" data-view="stack" data-title="Figure builds every layer"></div>

## Figure builds every layer

In Figure's [All Hands 2026](https://www.youtube.com/watch?v=AoFwpf43wK0), posted on October 22, Adcock split the job into four chapters: robot hardware and the AI recipe, which he says "money can't buy", then scaling intelligence and scaling robots, which money can, and "you can't skip chapters." So Figure designs almost the whole robot itself, "including the actuators, motors, sensors, battery pack, and electronics" ([Figure](https://www.figure.ai/news/botq)), and builds it in its own factory, which reached one Figure 03 per hour in April 2026 ([Figure](https://www.figure.ai/news/ramping-figure-03-production)). It all serves the plan to learn from people. Adcock says they spent "an enormous amount of time" getting the robot's fingertips to track a person's "at millimeter level precision". You can only shape a hand around human data if you build the hand yourself.

<div class="rc-mark" id="sec-fork" data-panel="fork" data-view="fork" data-title="Two ways to meet the data"></div>

## Two ways to meet the data

Then Adcock gets to what he calls "the largest debate in robotics the next few years". His slide shows a fork. On the left, "design human collect for our robot": build specialized hardware for people to collect data with, then design the robot around it. He says "there are groups out there doing it now", that the road is fun and fast, "and it will have the lowest ceiling." On the right, "design our robot for human collect": record raw human behavior and build a body that can use it, "which means the body and the hands and the way the robot moves the world over time needs to match human movements." That road, he says, "has a much higher ceiling, maybe even unbounded ceiling."

He names no one, but the left road matches what Generalist does. Then he turns to robots that work at a table, again without names:

> "And let me be clear, if you collect millions of hours on a table, you will generalize to a table and you'll pick up balls and do other stuff. [...] You have to generalize to that over there on the right. And then when you start generalizing to that, you're going to have to re-architect everything here on the left. I've been there. We've been on a table before, and we hit a wall."

He doesn't say table data is useless once the robot walks. He says leaving the table means rebuilding everything, and for Figure that meant a year of re-architecting Helix, its robot model, to send commands "to every joint". So the wall was partly in Figure's own model.

Is the humanoid the only way to win, then? Adcock says yes. Two claims are folded into that. One is that raw human data has a higher ceiling than data from robot-shaped tools. The other is that only a human-shaped robot can use human data, and that's the one that makes the humanoid necessary. So what has Figure tested?

<div class="rc-mark" id="sec-homes" data-panel="homes" data-view="homes" data-title="Figure's test: 30 homes it never saw"></div>

## Figure's test: 30 homes it never saw

A month before the all-hands, for [Helix 2.5](https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization), Figure sent robots into 30 Bay Area homes "with zero data collected in any of them." The tasks were still taught with robot data from elsewhere, so "zero-shot" here means new homes and new objects. The model was "pretrained from random initialization entirely on Index", Figure's dataset of human video.

Then Figure ran a controlled comparison: the same task data, model and test, with and without Index pretraining, on three household tasks with 140 trials each. Folding towels went from 12 to 87 successes, picking up toys from 7 to 56, and making a bed from 16 to 94. Pooled, 8% became 56%.

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/lJpM_2a1zrE" title="Helix 2.5 30-Home Generalization" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>Figure's Helix 2.5 robots at work in rented homes they had never seen (Figure, September 2026). <a href="https://www.youtube.com/watch?v=lJpM_2a1zrE">Watch on YouTube</a></figcaption>
</figure>

That's the strongest public result from any of the three that human video makes a robot better in new places. But no robot without a human shape was in the comparison. It shows that human video helps Figure's humanoid, not that another body couldn't get the same lift.

<div class="rc-mark" id="sec-device" data-panel="device" data-view="device" data-title="Generalist: robot-shaped data from human hands"></div>

## Generalist: robot-shaped data from human hands

My prior on Generalist was that its edge is better pretraining from collecting much more data. That's partly right, but the data is a different kind than I assumed.

The volume is real: by April 2026 Generalist had "over half a million hours" ([GEN-1](https://generalistai.com/blog/gen-1)). That isn't robot data, though. People hold "low-cost wearable devices", hand-held grippers with a camera, built to match the robot's own gripper. CTO Andrew Barry says it's "all about making sure the data set and the inference time matches" ([podcast](https://www.youtube.com/watch?v=-TTAOxVN2eo)). The base models of GEN-0 and GEN-1 are "trained without any robot data", and the robot shows up only after pretraining, with about an hour of robot data per task.

The founders don't describe the edge as hours either. Pete Florence calls data "table stakes" and says "an hour of data is not a fungible unit" ([podcast](https://www.youtube.com/watch?v=5Gy4GbCCSwI)). Their pitch is a person's natural, fast motion, which a robot driven by remote control loses ([Generalist](https://generalistai.com/blog/physical-commonsense)), plus a model big enough to absorb it and tests of which data mixtures help most. So my corrected prior is one well-chosen kind of data at large volume, a model big enough to use it, and a fast way to learn which data matters.

Their results are about how little robot data a new task needs. With about an hour of robot data per task, GEN-1 reached 99% average success on three trained tasks, against 64% for GEN-0 and 19% for a model trained from scratch. An academic study with the same kind of device reached 85% to 92.5% on four tasks in eight unseen places with unseen objects, with no robot data at all ([Lin et al.](https://arxiv.org/abs/2410.18647)).

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/1cllCVK-9lo" title="Introducing GEN-1.5, a one-shot learner" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>Generalist introducing GEN-1.5, which picks up simple, short tasks from one demonstration or a few minutes of data (Generalist, August 2026). <a href="https://www.youtube.com/watch?v=1cllCVK-9lo">Watch on YouTube</a></figcaption>
</figure>

On the hand, Generalist disagrees with Figure: "Hands can change, physics does not" ([Generalist](https://generalistai.com/blog/towards-machines-with-a-thousand-hands)). Florence still calls generalizing to new hands "not quite solved" ([interview](https://www.youtube.com/watch?v=LpHxwtKRPdQ)).

<div class="rc-mark" id="sec-pi" data-panel="pi" data-view="pi" data-title="Physical Intelligence: one model, many bodies"></div>

## Physical Intelligence: one model, many bodies

Pi's bet is the least about one body. "The only answer to generalization that we know in machine learning is through diversity of data," co-founder Karol Hausman said in a [Sequoia interview](https://www.youtube.com/watch?v=OJCT-HGxPjk). In Pi's published models, most of that variety comes from robots.

The clearest case is [π0.5](https://arxiv.org/abs/2504.16054), the 2025 model that cleaned homes it had never seen. About 400 hours came from its own two-armed robots on wheels in about 100 homes, and 97.6% of the first-phase training examples came from elsewhere: other robots, static arms in homes and the web. On Pi's [chart](https://www.pi.website/blog/pi05), success with unseen objects was 94% with everything, 31% without the static arms in homes and 49% without the other lab robots.

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/Zn8yMaepzVk" title="π0.5: a VLA with Open-World Generalization" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>π0.5 cleaning kitchens and bedrooms it never saw in training (Physical Intelligence, April 2025). <a href="https://www.youtube.com/watch?v=Zn8yMaepzVk">Watch on YouTube</a></figcaption>
</figure>

Pi builds its own simple robots at a factory in Fremont ([Pi](https://jobs.ashbyhq.com/physicalintelligence/b8bc4a93-08c7-46ca-98b0-020a8ebb9594)): mostly two-armed, all with parallel-jaw grippers, on wheels or fixed in place. Sergey Levine says they avoid humanoids for data collection because "humanoids are expensive, complicated, and teleoperating humanoids is harder" ([interview](https://www.youtube.com/watch?v=6ZlF6QWFPmw)). Partners already run Pi's models on their own humanoids through its [API](https://www.pi.website/blog/api-beta). For Pi, the body is a variable.

The third part is practice. Pi's models are VLAs, vision-language-action models: robot policies built on a model of images and text. Pi puts Dolgov's imitation plateau in those terms: "it's relatively easy to get VLAs to succeed at a task some of the time, it's quite hard to make them succeed reliably" ([Pi](https://www.pi.website/blog/pistar06)). Its method, Recap, trains on the robot's own attempts and on people's corrections, and "On some of the hardest tasks, RECAP more than doubles task throughput and roughly halves the task failure rate" ([paper](https://arxiv.org/abs/2511.14759)). In April, [π0.7](https://www.pi.website/blog/pi07) folded that practice into one general model that matched the RL-trained specialists.


<div class="rc-mark" id="sec-transfer" data-panel="transfer" data-view="transfer" data-title="Human data on robots that aren't human-shaped"></div>

## Human data on robots that aren't human-shaped

So do you need a human body to use human data? For the amounts tested so far, no. Human data gives measured gains on robots that look nothing like people. In Pi's human-to-robot paper, three hours of tracked human demonstrations raised a two-armed gripper robot on wheels from 32% to 71% on a spice-rack task, in a kitchen it had seen only in the human data.

Humanoids gain too: [HAT](https://arxiv.org/abs/2503.13441) +25 points, [EgoHumanoid](https://arxiv.org/abs/2602.10106) +51. The question is whether they gain more than other bodies, and the papers that compare bodies don't show it. [ImMimic](https://arxiv.org/abs/2509.10952) gave one arm four different hands and the same human videos. With the authors' method the grippers gained 26 points and the dexterous hands 25, and with plain co-training the hands gained more, 16 against 6. The authors find the gain tracks how close the human actions are to the robot's, "regardless of its mechanical structure". In [EgoVerse](https://arxiv.org/abs/2604.07607), a Unitree G1 humanoid with hands gained in the same range as two gripper arms, on a shared 8-hour human dataset plus 2 hours recorded in each lab.

What hurts is misalignment. In the [What Matters](https://arxiv.org/abs/2606.06627) study, human video doubled success on one task, 26.2% to 51.2%, once the human camera's image scale matched the robot's, and added nothing with a badly mismatched camera. Scenes, objects, task order, routes and rough hand paths carry over to a gripper on wheels. Grasp style, finger contact and whole-body motion carry over poorly, and fine precision suffers because hand tracking is off by 1 to 2 cm ([EgoZero](https://arxiv.org/abs/2505.20290)). Whole-body motion is the one part only a humanoid can use.

One question stays open. These papers mix a few hours of human data into robot training, and Pi found that this helps only on top of varied robot pretraining. Figure pretrains on human video alone, at a far larger scale, and nobody has run that recipe on a robot without a human shape. Generalist comes closest: it pretrains a gripper robot with no robot data, but on hand-held grippers, not bare hands. Most of these tests also run 10 to 50 trials per condition, which can miss a 30-point gap between two bodies. The paper-by-paper evidence is in a companion article: [Do you need a human body to use human data?](/robotics/do-you-need-a-human-body-for-human-data/)

<div class="rc-mark" id="sec-wheels" data-panel="wheels" data-view="wheels" data-title="Legs, wheels and the flat with no stairs"></div>

## Legs, wheels and the flat with no stairs

Even if a robot on wheels can learn from human video, a humanoid can climb stairs and a wheeled robot can't. Isn't that the end of it?

Dolgov's frame gives both sides a point. A wheel at a stair is a ceiling of his kind, a physical limit that no data removes, and Figure says so: "wheeled robots need enough open floor for their base to fit and turn. Homes offer no such accommodation" ([Helix 2.5](https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization)). But counting nines starts from the product, the same way cameras alone are fine for a car that only has to drive like a person. For flats, warehouses and offices with elevators, the stair ceiling sits above the target, and what's left is cost and the hand.

That's the Roomba argument, and I think it holds. A Roomba doesn't climb stairs either, and it sold because it was cheap and good enough on one floor. On cost, Levine says each arm on Pi's robots costs about $3,000 ([interview](https://www.youtube.com/watch?v=48pxVdmkMIE)). Figure publishes no price, and Adcock describes Figure's next hand as having "more actuators than an entire robot".

So Figure's two claims get different answers. The body sets a hard ceiling on what a robot can reach, and legs raise it. That the body also limits how much a robot learns from human data is the claim nobody has shown.

<div class="rc-mark" id="sec-ceilings" data-panel="ceilings" data-view="ceilings" data-title="Four ceilings, and who attacks which"></div>

## Four ceilings, and who attacks which

I count four ceilings, and the three bets push on different ones.

- The **body ceiling** is what the robot can physically reach. It's the only hard physical limit, and only Figure attacks it.
- The **data ceiling** is what the data covers and what it contains. Human video covers the most and contains the least, with no actions and no forces. Generalist's grippers record the action, at the price of a robot with a pincer. Pi's robot data contains exact actions and covers less, so Pi mixes many sources.
- The **demonstrator ceiling** is Dolgov's imitation plateau: copying gets a robot close to the people it copies, and reliability takes more. Pi has the clearest answer, practice with corrections. Figure bets on large-scale pre-training over training task by task: "post-training is not going to win this game. It's pre-training that will win."
- The **evaluation ceiling**: you can't climb nines you can't measure. Showing a failure rate under 0.1% takes about 3,000 clean trials. The best published numbers sit at one nine or below in new places: Figure's 56% in new homes, π0.5's 94% with unseen objects, π0.7's 60% to 80% on unseen tasks ([paper](https://arxiv.org/abs/2604.15483)). Generalist's 99% is two nines, on trained tasks. Nobody has published a test big enough to show three.

Figure's question is the right one, and its answer goes further than its evidence. It has the best public evidence that human video helps a robot in new homes, and the body does cap what a robot can reach. But the claim that you need a humanoid to learn from human data is the part it hasn't tested. Video doesn't need the exact body. It needs a hand and a camera that line up with it. I also don't buy "the lowest ceiling" for Generalist's road: the hand-held results are among the best numbers here.

If I had to pick the highest ceiling, I'd pick whoever turns a robot's own experience into training data fastest, on a body chosen for the product. That's closest to Pi's bet. It's a bet, and the evidence is still thin: Recap's halved failure rate, π0.7 matching RL-trained specialists, and Dolgov on cars, "the actual experience of having your agent in the real world is invaluable and it's irreplaceable." In a house with stairs, the right body is probably a humanoid. In a flat, I think a simpler robot on wheels with a good hand wins, the way the Roomba did.

Here's the comparison in one place.

| | Figure | Generalist | Pi |
| --- | --- | --- | --- |
| The ceiling is in | the body | the data | the mix |
| Robot | humanoid with human-like hands | off-the-shelf arms with its own grippers | its own simple robots, mostly two-armed, on wheels or fixed |
| Main data | human video (Index) | hand-held grippers, over 500,000 hours | many robots, homes and tasks, then practice |
| Headline result | new homes: 8% to 56% with human video pretraining | trained tasks, about 1 hour of robot data each: 99% | unseen objects: 94%, and 31% without the static arms in homes |
| Not shown yet | that the human body is needed | trial counts, outside tests | an exact data size after π0 |

<details>
<summary>Sources and what isn't verified</summary>

**Talks.** Dolgov, [The Demo Is Only 1% Of The Work](https://www.youtube.com/watch?v=Gp4zrV3-6N8) (Startup School, July 2026), checked against two Whisper transcripts, YouTube's captions and [YC's transcript](https://www.ycrootaccess.com/p/dmitri-dolgov-seven-lessons-from); title from his [Waymo bio](https://waymo.com/company/dmitri-dolgov/). Adcock, [Figure All Hands 2026](https://www.youtube.com/watch?v=AoFwpf43wK0) (posted 22 October 2026). That video has no captions, so its quotes come from two Whisper transcripts checked against each other. "[...]" marks a cut. The interview quotes (Barry, Florence, Hausman, Levine) are Whisper transcripts checked against YouTube captions or official transcripts.

**Company basics.** Figure: [SEC Form D](https://www.sec.gov/Archives/edgar/data/2014185/000149315224009735/primary_doc.xml) (Delaware, 2023), [master plan](https://www.figure.ai/master-plan) (May 2022), [careers](https://www.figure.ai/careers) (San Jose), [Series C](https://www.figure.ai/news/series-c). Generalist: [Form D](https://www.sec.gov/Archives/edgar/data/2137708/000213770826000003/primary_doc.xml) (Delaware, 2024, San Francisco, officers), [August 2026 Form D](https://www.sec.gov/Archives/edgar/data/2137708/000213770826000004/primary_doc.xml), [funding post](https://generalistai.com/blog/accelerating-the-next-phase-of-physical-ai). Pi: [March 2024 homepage](https://web.archive.org/web/20240312205420/https://physicalintelligence.company/), [careers](https://www.pi.website/join-us) (San Francisco), [Fremont job post](https://jobs.ashbyhq.com/physicalintelligence/b8bc4a93-08c7-46ca-98b0-020a8ebb9594), and [CapitalG](https://capitalg.com/insights/physical-intelligence-bringing-general-purpose-ai-into-the-physical-world/), which led the Series B and lists it at $600 million on its [insights page](https://capitalg.com/insights/).

**Figure.** [BotQ](https://www.figure.ai/news/botq), [production ramp](https://www.figure.ai/news/ramping-figure-03-production), [Helix 2.5](https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization). The trial counts are from the post's Figure 1. Its text says 9%, and its counts give 35/420, which is 8%.

**Generalist.** [GEN-0](https://generalistai.com/blog/gen-0), [GEN-1](https://generalistai.com/blog/gen-1), [GEN-1.5](https://generalistai.com/blog/gen-1.5), [physical commonsense](https://generalistai.com/blog/physical-commonsense), [a thousand hands](https://generalistai.com/blog/towards-machines-with-a-thousand-hands). Results are Generalist's own, without trial counts for the averages.

**Pi.** [π0.5 paper](https://arxiv.org/abs/2504.16054) and [chart](https://www.pi.website/blog/pi05), [Recap paper](https://arxiv.org/abs/2511.14759), [π0.7 paper](https://arxiv.org/abs/2604.15483), [human-to-robot paper](https://arxiv.org/abs/2512.22414) (spice runs on its wheeled robots), [API post](https://www.pi.website/blog/api-beta). After π0, Pi gives only a rough data size, "tens of thousands of hours" (π*0.6). The $3,000 arm is Levine on the [Dwarkesh podcast](https://www.youtube.com/watch?v=48pxVdmkMIE) (2025).

**Transfer papers.** [ImMimic](https://arxiv.org/abs/2509.10952): my averages of Table 1 over four tasks, 10 rollouts per cell. [EgoVerse](https://arxiv.org/abs/2604.07607): read from Figure 9; three robots in three labs. [What Matters](https://arxiv.org/abs/2606.06627): Table 5; its canvas dot is the low-data result, 12.0% to 41.7%. [EgoZero](https://arxiv.org/abs/2505.20290): the 1 to 2 cm error. Other canvas dots: [EMMA](https://arxiv.org/abs/2509.04443) (82% against 52% for an hour of remote-controlled driving), [EgoWAM](https://arxiv.org/abs/2607.08436) (25% to 15% when the human grasp doesn't fit the gripper, 20 trials, within noise), HAT (59/170 to 101/170), EgoHumanoid (31% to 82%), [LeLaN](https://arxiv.org/abs/2410.03603) and [ego-video navigation co-training](https://arxiv.org/abs/2606.01951). Tasks, labs and metrics differ.

**Not verified.** A Figure 03 price, Pi's founding date, and the valuations of Generalist and Pi.

**Numbers.** One failure a month at 50 tasks a day is 1 in 1,500, so 99.93%. With zero failures in $n$ trials, the 95% upper bound on the failure rate is about $3/n$. Detecting a gap between two bodies from a 50% baseline (5% test, 80% power) takes about 40 trials each for 30 points.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
