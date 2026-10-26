---
title: 'Where humanoids go first: Persona AI bets on skilled trades'
description: 'Every humanoid company picks a first job, and the pick decides the business. Persona AI, run by a former Figure CTO, picked welding in shipyards and steel shops: skilled tool use, leased as labor, learned from expert teleoperation. How that bet differs from Agility, 1X, Apptronik and Tesla, with a pinned blackboard.'
date: '2026-10-26'
draft: false
layout: essay
tags: ['robotics', 'humanoids', 'industry', 'robot-learning']
thumbnail: '/assets/robotics/persona-ai-skilled-trades/thumbnail.svg'
thumbnail_alt: 'Blackboard drawing: five humanoid companies and the first job each one picked, from welding ship seams to moving totes, with the labels Persona, Agility, 1X, Apptronik and Tesla'
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
<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 1742" data-whole="0 0 840 1742" data-views='{"map":[12,88,396,288],"labor":[432,88,396,288],"weld":[12,418,396,288],"july":[432,418,396,288],"legs":[12,748,396,288],"loop":[432,748,396,288],"lease":[12,1078,396,288],"queue":[432,1078,396,288],"score":[12,1408,396,288],"decide":[432,1408,396,288]}' role="img" aria-labelledby="rp-title rp-desc"><title id="rp-title">Where humanoids go first: ten blackboard panels</title><desc id="rp-desc">Ten blackboard panels on Persona AI's humanoid bet and how it differs from Agility, 1X, Apptronik, Tesla and Figure. 1, the first job each company picks: Persona welds seams in shipyards, Agility moves totes in warehouses, 1X does chores in homes, Apptronik takes dull, dirty, dangerous factory work, Tesla builds a Bots business on its current operations, Figure aims at homes and factories. 2, the gap in skilled trades: 82,500 US welding jobs to fill every year to 2029, five welders retiring for every two who arrive, 2.1 million US manufacturing jobs unfilled by 2030, about 40,000 skilled workers short in North American and Korean shipbuilding, average age 48.3 on the Ulsan production floor and 55 for a US welder. 3, what a weld asks of a robot: the melt rate caps the speed at centimeters per second, the motion is millimeter-scale repetition, one ship holds hundreds of kilometers of linear welds, done with the crew's own torch. 4, the July 2026 weld at ARC Specialties in Houston: a humanoid squats, strikes an arc, runs the weld, stands and walks away, teleoperated from VR and motion capture, no gantry and no tether, balancing itself. 5, why legs: shipyard work is on the ground, overhead and through portholes, a wheeled base is blocked at a spar and the site would have to change, legs take the route a welder takes. 6, teleoperation is the data path: the operator sends intent and judgment, the robot keeps balance, footing and vision, every session is expert demonstration data, and training adds one skill at a time. 7, the deal: Persona keeps the robot and leases the labor with AI platform updates, tooling modules and fleet training, paid for work the customer cannot staff, with funding chips of 10 million dollars pre-seed in February 2025, 42 million dollars by December 2025 per press, 65.4 million dollars sold of a 142 million dollar SEC offering in September 2026, and 2 million dollars from POSCO DX. 8, who is standing in line: HD Hyundai on shipyard welding, POSCO on steel-site logistics and an investor, SSE Steel Fabrication on fillet welding in Louisiana, ABS on class standards, Under Armour on robot workwear research. 9, the scoreboard: shown in public are a teleoperated weld in a live shop, deals with HD Hyundai, POSCO, SSE and ABS, Gen 3 units on the ground, and 65.4 million dollars sold toward a 142 million dollar offering; not shown yet are an autonomous weld, a robot working a whole shift, hundreds of units at one site, and a price or a profit. 10, what decides the bet: the paying first job needs labor nobody can hire, a tool in the hand, and a customer buying output rather than savings, and the fork is the robot welding alone, which pays, against a pilot forever, which is a demo with extra steps.</desc>
<defs>
<marker id="rp-a-chalk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-chalk" stroke-width="1.8"/></marker>
<marker id="rp-a-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-dim" stroke-width="1.8"/></marker>
<marker id="rp-a-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-pink" stroke-width="1.8"/></marker>
<marker id="rp-a-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-blue" stroke-width="1.8"/></marker>
<marker id="rp-a-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-green" stroke-width="1.8"/></marker>
<marker id="rp-a-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-red" stroke-width="1.8"/></marker>
<marker id="rp-a-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" class="s-yellow" stroke-width="1.8"/></marker>
<g id="glyph-humanoid" fill="none" stroke-width="2">
<rect x="32.6" y="4" width="10.8" height="10.8" rx="3" stroke-width="2"/>
<path d="M35 9H41" stroke-width="1.6"/>
<path d="M38 14.8V17.7" stroke-width="2"/>
<rect x="29.4" y="17.7" width="17.3" height="24.5" rx="4" stroke-width="2"/>
<path d="M29.4 21.3 L25.8 32.1 L25 42.2" stroke-width="2"/>
<circle cx="25.8" cy="32.1" r="1.6" class="c-board" stroke-width="1.4"/>
<path d="M46.6 21.3 L50.2 32.1 L51 42.2" stroke-width="2"/>
<circle cx="50.2" cy="32.1" r="1.6" class="c-board" stroke-width="1.4"/>
<path d="M33.7 42.2 L32.2 59.1 L32.2 76 L37.3 76" stroke-width="2"/>
<circle cx="32.2" cy="59.1" r="1.6" class="c-board" stroke-width="1.4"/>
<path d="M42.3 42.2 L43.8 59.1 L43.8 76 L48.8 76" stroke-width="2"/>
<circle cx="43.8" cy="59.1" r="1.6" class="c-board" stroke-width="1.4"/>
</g>
<g id="glyph-person" fill="none" stroke-width="2">
<circle cx="12" cy="9" r="6" stroke-width="2"/>
<path d="M12 15V33" stroke-width="2"/>
<path d="M12 21 L3 28 M12 21 L21 28" stroke-width="2"/>
<path d="M12 33 L5 47 M12 33 L19 47" stroke-width="2"/>
<path d="M3 9 A10 10 0 0 1 21 9" stroke-width="1.6"/>
<rect x="0.6" y="8" width="4.4" height="7" rx="2" stroke-width="1.6"/>
</g>
<g id="glyph-wheeled" fill="none" stroke-width="2">
<rect x="2" y="0" width="42" height="22" rx="3" stroke-width="2"/>
<circle cx="13" cy="28" r="5.6" class="c-board" stroke-width="1.8"/>
<circle cx="33" cy="28" r="5.6" class="c-board" stroke-width="1.8"/>
</g>
</defs>
<g font-size="16">
<g class="rc-panel" data-panel="map">
<rect x="10" y="56" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="84">1. Where each company sends its humanoid first</text>
<g transform="translate(18 92)">
<text x="0" y="22" class="c-yellow" font-size="17">Persona</text>
<path d="M86 17H132" fill="none" class="s-yellow" stroke-width="1.6" marker-end="url(#rp-a-yellow)"/>
<g transform="translate(142 2)"><path d="M0 16 L40 16 L35 28 L5 28 Z" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M20 16V4" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M20 4 L30 8" fill="none" class="s-chalk" stroke-width="1.6"/></g>
<text x="196" y="18" class="c-chalk" font-size="14">weld seams in shipyards</text>
<text x="0" y="64" class="c-green" font-size="17">Agility</text>
<path d="M86 59H132" fill="none" class="s-green" stroke-width="1.6" marker-end="url(#rp-a-green)"/>
<g transform="translate(142 44)"><rect x="2" y="12" width="38" height="20" rx="2" fill="none" class="s-chalk" stroke-width="1.6"/><rect x="10" y="0" width="22" height="12" fill="none" class="s-chalk" stroke-width="1.6"/></g>
<text x="196" y="60" class="c-chalk" font-size="14">move totes in warehouses</text>
<text x="0" y="106" class="c-pink" font-size="17">1X</text>
<path d="M86 101H132" fill="none" class="s-pink" stroke-width="1.6" marker-end="url(#rp-a-pink)"/>
<g transform="translate(142 86)"><path d="M2 14 L21 1 L40 14" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M6 14V31H36V14" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M18 31V21H24V31" fill="none" class="s-chalk" stroke-width="1.6"/></g>
<text x="196" y="102" class="c-chalk" font-size="14">do chores in homes</text>
<text x="0" y="148" class="c-blue" font-size="17">Apptronik</text>
<path d="M86 143H132" fill="none" class="s-blue" stroke-width="1.6" marker-end="url(#rp-a-blue)"/>
<g transform="translate(142 128)"><rect x="2" y="12" width="40" height="19" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M2 12 L12 4 L12 12 L22 4 L22 12 L32 4 L32 12" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M38 4V12" fill="none" class="s-chalk" stroke-width="1.6"/></g>
<text x="196" y="144" class="c-chalk" font-size="14">factory floor work:</text>
<text x="196" y="160" class="c-dim" font-size="13">dull, dirty, dangerous</text>
<text x="0" y="190" class="c-dim" font-size="17">Tesla</text>
<path d="M86 185H132" fill="none" class="s-dim" stroke-width="1.6" marker-end="url(#rp-a-dim)"/>
<g transform="translate(142 170)"><rect x="2" y="12" width="40" height="19" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M2 12 L12 4 L12 12 L22 4 L22 12 L32 4 L32 12" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M38 4V12" fill="none" class="s-chalk" stroke-width="1.6"/></g>
<text x="196" y="186" class="c-chalk" font-size="14">a Bots business on</text>
<text x="196" y="202" class="c-dim" font-size="13">its current operations</text>
<text x="0" y="232" class="c-dim" font-size="17">Figure</text>
<path d="M86 227H132" fill="none" class="s-dim" stroke-width="1.6" marker-end="url(#rp-a-dim)"/>
<g transform="translate(142 212)"><path d="M2 14 L21 1 L40 14" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M6 14V31H36V14" fill="none" class="s-chalk" stroke-width="1.6"/><path d="M18 31V21H24V31" fill="none" class="s-chalk" stroke-width="1.6"/></g>
<text x="196" y="228" class="c-chalk" font-size="14">homes and factories</text>
<text x="196" y="244" class="c-dim" font-size="13">(see the Three robot bets)</text>
<path d="M0 258H384" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="276" class="c-dim" font-size="13">Each company's own published plan, October 2026.</text>
</g></g>
<g class="rc-panel" data-panel="labor">
<rect x="430" y="56" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="84">2. Why the trades: a gap, not a price</text>
<g transform="translate(438 92)">
<rect x="0" y="4" width="186" height="66" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="10" y="34" class="c-yellow" font-size="22">82,500</text>
<text x="10" y="50" class="c-chalk" font-size="11.5">welding jobs to fill every</text>
<text x="10" y="63" class="c-chalk" font-size="11.5">year in the US, to 2029</text>
<rect x="198" y="4" width="186" height="66" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="208" y="34" class="c-yellow" font-size="22">5 out : 2 in</text>
<text x="208" y="50" class="c-chalk" font-size="11.5">welders retiring for every</text>
<text x="208" y="63" class="c-chalk" font-size="11.5">two who arrive</text>
<rect x="0" y="78" width="186" height="66" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="10" y="108" class="c-yellow" font-size="22">2.1 million</text>
<text x="10" y="124" class="c-chalk" font-size="11.5">US manufacturing jobs</text>
<text x="10" y="137" class="c-chalk" font-size="11.5">unfilled by 2030</text>
<rect x="198" y="78" width="186" height="66" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="208" y="108" class="c-yellow" font-size="22">~40,000</text>
<text x="208" y="124" class="c-chalk" font-size="11.5">skilled workers short in</text>
<text x="208" y="137" class="c-chalk" font-size="11.5">NA + Korea shipbuilding</text>
<rect x="0" y="152" width="186" height="66" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="10" y="182" class="c-yellow" font-size="22">48.3</text>
<text x="10" y="198" class="c-chalk" font-size="11.5">average age on the Ulsan</text>
<text x="10" y="211" class="c-chalk" font-size="11.5">yard production floor</text>
<rect x="198" y="152" width="186" height="66" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="208" y="182" class="c-yellow" font-size="22">55</text>
<text x="208" y="198" class="c-chalk" font-size="11.5">average age of a</text>
<text x="208" y="211" class="c-chalk" font-size="11.5">US welder</text>
<text x="0" y="238" class="c-red" font-size="15">moving boxes: a solved problem.</text>
<text x="0" y="258" class="c-yellow" font-size="15">welding: nobody to hire, and the hull waits.</text>
<text x="0" y="278" class="c-dim" font-size="11.5">AWS and Deloitte/Manufacturing Institute via Biz New Orleans; Persona AI to Seoul Economic Daily.</text>
</g></g>
<g class="rc-panel" data-panel="weld">
<rect x="10" y="386" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="414">3. What a weld asks of a robot</text>
<g transform="translate(18 422)">
<rect x="0" y="4" width="122" height="62" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="10" y="32" class="c-yellow" font-size="19">cm/s</text>
<text x="10" y="48" class="c-chalk" font-size="11.5">the melt rate caps</text>
<text x="10" y="61" class="c-chalk" font-size="11.5">the travel speed</text>
<rect x="130" y="4" width="122" height="62" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="140" y="32" class="c-yellow" font-size="19">mm repeats</text>
<text x="140" y="48" class="c-chalk" font-size="11.5">the motion is</text>
<text x="140" y="61" class="c-chalk" font-size="11.5">millimeter scale</text>
<rect x="260" y="4" width="124" height="62" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="270" y="32" class="c-yellow" font-size="19">100s of km</text>
<text x="270" y="48" class="c-chalk" font-size="11.5">of linear welds</text>
<text x="270" y="61" class="c-chalk" font-size="11.5">in one ship</text>
<g transform="translate(14 86)"><path d="M0 0 L18 18" fill="none" class="s-chalk" stroke-width="3"/><path d="M18 18 L26 26" fill="none" class="s-chalk" stroke-width="2"/><path d="M26 26 L40 38 L30 44 Z" fill="none" class="s-yellow" stroke-width="1.8"/></g>
<text x="66" y="104" class="c-chalk" font-size="13">welding torch: the crew's own tool</text>
<rect x="20" y="136" width="354" height="22" fill="none" class="s-chalk" stroke-width="1.6"/>
<path d="M30 160 C50 154 70 166 90 160 S130 154 150 160 S190 166 210 160 S250 154 270 160 S310 166 330 160 S356 156 366 160" fill="none" class="s-yellow" stroke-width="3"/>
<path d="M40 128H352" fill="none" class="s-dim" stroke-width="1.5" marker-end="url(#rp-a-dim)"/>
<text x="120" y="122" class="c-dim" font-size="12.5">the torch travels centimeters per second</text>
<text x="30" y="182" class="c-yellow" font-size="12.5">the seam: long, straight, and everywhere</text>
<text x="0" y="214" class="c-chalk" font-size="15">slow, repeated, checkable: a robot-friendly job.</text>
<text x="0" y="234" class="c-chalk" font-size="15">people tire and drift at the twentieth seam.</text>
<text x="0" y="254" class="c-yellow" font-size="15">not the hardest weld. the most common one.</text>
<text x="0" y="276" class="c-dim" font-size="11.5">Radford and Pratt to IEEE Spectrum, August 2026.</text>
</g></g>
<g class="rc-panel" data-panel="july">
<rect x="430" y="386" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="414">4. The July weld: what the video shows</text>
<g transform="translate(438 422)">
<text x="0" y="26" class="c-chalk" font-size="15">squat</text>
<path d="M56 21H84" fill="none" class="s-dim" stroke-width="1.5" marker-end="url(#rp-a-dim)"/>
<text x="92" y="26" class="c-chalk" font-size="15">weld</text>
<path d="M148 21H176" fill="none" class="s-dim" stroke-width="1.5" marker-end="url(#rp-a-dim)"/>
<text x="184" y="26" class="c-chalk" font-size="15">stand, walk on</text>
<text x="0" y="66" class="c-chalk" font-size="13">the humanoid:</text>
<text x="0" y="82" class="c-dim" font-size="12">two arms, two legs,</text>
<text x="0" y="98" class="c-dim" font-size="12">hands that use the</text>
<text x="0" y="114" class="c-dim" font-size="12">crew's own tools</text>
<text x="0" y="144" class="c-yellow" font-size="13">teleoperated:</text>
<text x="0" y="160" class="c-dim" font-size="12">a person in VR and</text>
<text x="0" y="176" class="c-dim" font-size="12">motion capture</text>
<text x="0" y="206" class="c-chalk" font-size="13">no gantry, no tether:</text>
<text x="0" y="222" class="c-green" font-size="12">the robot balances and</text>
<text x="0" y="238" class="c-green" font-size="12">places its own feet</text>
<use href="#glyph-humanoid" class="s-yellow" transform="translate(206 40) scale(1.25)"/>
<path d="M270 92 L286 128" fill="none" class="s-yellow" stroke-width="2.2"/>
<path d="M286 128 L296 138 L288 142 Z" fill="none" class="s-yellow" stroke-width="1.8"/>
<path d="M196 146H368" fill="none" class="s-yellow" stroke-width="3"/>
<path d="M300 122 l2 7 l6 -5 M304 138 l6 4 M292 142 l-6 6 M308 128 l7 -2" fill="none" class="s-yellow" stroke-width="1.6"/>
<text x="312" y="122" class="c-yellow" font-size="12">the arc</text>
<text x="300" y="166" class="c-yellow" font-size="12">the seam</text>
<text x="188" y="188" class="c-yellow" font-size="14">July 2026, ARC Specialties, Houston:</text>
<text x="188" y="206" class="c-chalk" font-size="13">squat, weld, stand, walk away.</text>
<text x="188" y="224" class="c-dim" font-size="12">one weld, on camera, teleoperated.</text>
<text x="188" y="240" class="c-dim" font-size="12">they say so themselves.</text>
</g></g>
<g class="rc-panel" data-panel="legs">
<rect x="10" y="716" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="744">5. Why legs in a shipyard</text>
<g transform="translate(18 752)">
<text x="0" y="16" class="c-dim" font-size="13">shipyard work: on the ground, overhead, through portholes</text>
<rect x="60" y="192" width="240" height="12" fill="none" class="s-chalk" stroke-width="1.6"/>
<text x="214" y="222" class="c-chalk" font-size="12.5">the spar: step over it</text>
<path d="M356 56V250" fill="none" class="s-faint" stroke-width="1.5"/>
<circle cx="336" cy="120" r="18" fill="none" class="s-chalk" stroke-width="1.6"/>
<text x="288" y="98" class="c-dim" font-size="11.5">porthole: reach through</text>
<use href="#glyph-wheeled" class="s-red" transform="translate(14 210)"/>
<path d="M92 214 L112 234 M112 214 L92 234" fill="none" class="s-red" stroke-width="2.4"/>
<text x="0" y="66" class="c-red" font-size="13">wheeled base:</text>
<text x="0" y="84" class="c-chalk" font-size="12">blocked at the spar,</text>
<text x="0" y="100" class="c-chalk" font-size="12">and the site would</text>
<text x="0" y="116" class="c-chalk" font-size="12">have to change first</text>
<use href="#glyph-humanoid" class="s-green" transform="translate(156 116)"/>
<text x="244" y="66" class="c-green" font-size="13">legs:</text>
<text x="244" y="84" class="c-chalk" font-size="12">take the route</text>
<text x="244" y="100" class="c-chalk" font-size="12">a welder takes</text>
<text x="0" y="262" class="c-yellow" font-size="13.5">adapting a yard around a machine can cost</text>
<text x="0" y="280" class="c-yellow" font-size="13.5">more than the machine itself.</text>
</g></g>
<g class="rc-panel" data-panel="loop">
<rect x="430" y="716" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="744">6. Teleoperation is the data path</text>
<g transform="translate(438 752)">
<use href="#glyph-person" class="s-chalk" transform="translate(8 34) scale(1.3)"/>
<text x="0" y="126" class="c-chalk" font-size="13">the operator:</text>
<text x="0" y="142" class="c-dim" font-size="12">VR + motion capture</text>
<path d="M60 74 C104 74 116 66 156 66" fill="none" class="s-chalk" stroke-width="1.7" marker-end="url(#rp-a-chalk)"/>
<text x="72" y="54" class="c-dim" font-size="12">intent and judgment</text>
<use href="#glyph-humanoid" class="s-yellow" transform="translate(184 22) scale(0.95)"/>
<text x="156" y="112" class="c-dim" font-size="12">the robot keeps:</text>
<text x="156" y="128" class="c-chalk" font-size="12">balance, footing, vision</text>
<text x="156" y="144" class="c-green" font-size="12">its own learned stack</text>
<path d="M248 52 C288 50 296 46 326 46" fill="none" class="s-chalk" stroke-width="1.7" marker-end="url(#rp-a-chalk)"/>
<text x="242" y="34" class="c-dim" font-size="12">every session is data</text>
<g transform="translate(318 8)"><rect x="0" y="0" width="60" height="9" rx="2" fill="none" class="s-yellow" stroke-width="1.5"/><rect x="0" y="14" width="60" height="9" rx="2" fill="none" class="s-yellow" stroke-width="1.5"/><rect x="0" y="28" width="60" height="9" rx="2" fill="none" class="s-yellow" stroke-width="1.5"/><rect x="0" y="42" width="60" height="9" rx="2" fill="none" class="s-yellow" stroke-width="1.5"/></g>
<text x="286" y="102" class="c-chalk" font-size="12">expert demonstrations,</text>
<text x="316" y="118" class="c-dim" font-size="12">on the platform</text>
<path d="M322 126 C322 172 268 184 228 184 C188 184 158 176 158 156" fill="none" class="s-green" stroke-width="1.7" marker-end="url(#rp-a-green)"/>
<text x="150" y="202" class="c-green" font-size="13">train, task by task</text>
<rect x="10" y="212" width="240" height="34" rx="4" fill="none" class="s-yellow" stroke-width="1.6"/>
<text x="22" y="234" class="c-yellow" font-size="13.5">one skill at a time, then the next</text>
<text x="0" y="266" class="c-dim" font-size="11">for comparison: Figure: human video at scale. Generalist: hand-held grippers.</text>
<text x="0" y="280" class="c-dim" font-size="11">Apptronik: Robot Park fleets with DeepMind. Agility: live ops. 1X: life in homes.</text>
</g></g>
<g class="rc-panel" data-panel="lease">
<rect x="10" y="1046" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="1074">7. Lease the labor, not the robot</text>
<g transform="translate(18 1082)">
<rect x="0" y="26" width="150" height="118" rx="6" fill="none" class="s-yellow" stroke-width="1.8"/>
<text x="10" y="50" class="c-yellow" font-size="14">Persona AI keeps it</text>
<text x="10" y="74" class="c-chalk" font-size="12">the robot,</text>
<text x="10" y="92" class="c-chalk" font-size="12">AI platform updates,</text>
<text x="10" y="110" class="c-chalk" font-size="12">custom tooling,</text>
<text x="10" y="128" class="c-chalk" font-size="12">fleet training</text>
<path d="M156 68H222" fill="none" class="s-chalk" stroke-width="1.7" marker-end="url(#rp-a-chalk)"/>
<text x="140" y="58" class="c-chalk" font-size="12">leases the labor</text>
<path d="M222 112H156" fill="none" class="s-green" stroke-width="1.7" marker-end="url(#rp-a-green)"/>
<text x="146" y="134" class="c-green" font-size="12">paid for work they cannot staff</text>
<rect x="228" y="26" width="156" height="118" rx="6" fill="none" class="s-chalk" stroke-width="1.8"/>
<text x="238" y="50" class="c-chalk" font-size="14">the customer's site</text>
<text x="238" y="74" class="c-chalk" font-size="12">shipyard, steel shop,</text>
<text x="238" y="92" class="c-chalk" font-size="12">construction, energy</text>
<text x="238" y="110" class="c-chalk" font-size="12">welding, fabrication,</text>
<text x="238" y="128" class="c-chalk" font-size="12">inspection</text>
<text x="0" y="170" class="c-yellow" font-size="14">value: top line, not bottom line.</text>
<text x="0" y="188" class="c-chalk" font-size="12.5">even above a person's wage, it unlocks</text>
<text x="0" y="204" class="c-chalk" font-size="12.5">work the yard cannot otherwise staff.</text>
<rect x="0" y="216" width="92" height="54" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="10" y="242" class="c-yellow" font-size="16">$10M+</text>
<text x="10" y="258" class="c-dim" font-size="10.5">pre-seed, Feb 2025</text>
<rect x="98" y="216" width="92" height="54" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="108" y="242" class="c-yellow" font-size="16">$42M</text>
<text x="108" y="258" class="c-dim" font-size="10.5">by Dec 2025 (press)</text>
<rect x="196" y="216" width="92" height="54" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="206" y="242" class="c-yellow" font-size="16">$65.4M</text>
<text x="206" y="254" class="c-dim" font-size="10.5">sold of $142M</text>
<text x="206" y="266" class="c-dim" font-size="10.5">Form D, Sept 2026</text>
<rect x="294" y="216" width="90" height="54" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="304" y="242" class="c-yellow" font-size="16">$2M</text>
<text x="304" y="258" class="c-dim" font-size="10.5">POSCO DX, Dec 2025</text>
</g></g>
<g class="rc-panel" data-panel="queue">
<rect x="430" y="1046" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="1074">8. Who is already standing in line</text>
<g transform="translate(438 1082)">
<text x="0" y="26" class="c-chalk" font-size="15">HD Hyundai</text>
<text x="0" y="43" class="c-dim" font-size="12">shipyard welding: KSOE + HD Hyundai Robotics</text>
<rect x="278" y="10" width="106" height="22" rx="11" fill="none" class="s-yellow" stroke-width="1.5"/>
<text x="331" y="26" class="c-yellow" font-size="11.5" text-anchor="middle">PoC, 2026</text>
<text x="0" y="70" class="c-chalk" font-size="15">POSCO</text>
<text x="0" y="87" class="c-dim" font-size="12">steel-site logistics; also an investor</text>
<rect x="278" y="54" width="106" height="22" rx="11" fill="none" class="s-yellow" stroke-width="1.5"/>
<text x="331" y="70" class="c-yellow" font-size="11.5" text-anchor="middle">PoC + $2M</text>
<text x="0" y="114" class="c-chalk" font-size="15">SSE Steel Fabrication</text>
<text x="0" y="131" class="c-dim" font-size="12">fillet welding in a Louisiana shop</text>
<rect x="278" y="98" width="106" height="22" rx="11" fill="none" class="s-green" stroke-width="1.5"/>
<text x="331" y="114" class="c-green" font-size="11.5" text-anchor="middle">unit this year</text>
<text x="0" y="158" class="c-chalk" font-size="15">ABS</text>
<text x="0" y="175" class="c-dim" font-size="12">class and safety standards</text>
<rect x="278" y="142" width="106" height="22" rx="11" fill="none" class="s-dim" stroke-width="1.5"/>
<text x="331" y="158" class="c-dim" font-size="11.5" text-anchor="middle">standards</text>
<text x="0" y="202" class="c-chalk" font-size="15">Under Armour</text>
<text x="0" y="219" class="c-dim" font-size="12">what robot workwear should be</text>
<rect x="278" y="186" width="106" height="22" rx="11" fill="none" class="s-dim" stroke-width="1.5"/>
<text x="331" y="202" class="c-dim" font-size="11.5" text-anchor="middle">R&amp;D only</text>
<text x="0" y="246" class="c-dim" font-size="12.5">founded June 2024 · Houston · Gen 3 units on the ground</text>
<text x="0" y="264" class="c-yellow" font-size="13">every one of them is short of people.</text>
<text x="0" y="280" class="c-dim" font-size="10.5">Persona AI; Korea Times (Yonhap); Biz New Orleans; Seoul Economic Daily.</text>
</g></g>
<g class="rc-panel" data-panel="score">
<rect x="10" y="1376" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="1404">9. The scoreboard: shown and not shown</text>
<g transform="translate(18 1412)">
<text x="0" y="16" class="c-green" font-size="14">✓ shown in public</text>
<text x="200" y="16" class="c-red" font-size="14">✗ not shown yet</text>
<path d="M192 28V232" fill="none" class="s-faint" stroke-width="1" stroke-dasharray="2 5"/>
<text x="0" y="48" class="c-green" font-size="14">✓</text>
<text x="22" y="48" class="c-chalk" font-size="12.5">a teleoperated weld in</text>
<text x="22" y="64" class="c-chalk" font-size="12.5">a live shop (July 2026)</text>
<text x="0" y="92" class="c-green" font-size="14">✓</text>
<text x="22" y="92" class="c-chalk" font-size="12.5">deals: HD Hyundai,</text>
<text x="22" y="108" class="c-chalk" font-size="12.5">POSCO, SSE, ABS</text>
<text x="0" y="136" class="c-green" font-size="14">✓</text>
<text x="22" y="136" class="c-chalk" font-size="12.5">Gen 3 units exist and</text>
<text x="22" y="152" class="c-chalk" font-size="12.5">are "on the ground"</text>
<text x="0" y="180" class="c-green" font-size="14">✓</text>
<text x="22" y="180" class="c-chalk" font-size="12.5">$65.4M sold toward</text>
<text x="22" y="196" class="c-chalk" font-size="12.5">a $142M offering</text>
<text x="200" y="48" class="c-red" font-size="14">✗</text>
<text x="222" y="48" class="c-chalk" font-size="12.5">an autonomous weld:</text>
<text x="222" y="64" class="c-chalk" font-size="12.5">the robot alone</text>
<text x="200" y="92" class="c-red" font-size="14">✗</text>
<text x="222" y="92" class="c-chalk" font-size="12.5">a robot working</text>
<text x="222" y="108" class="c-chalk" font-size="12.5">a whole shift</text>
<text x="200" y="136" class="c-red" font-size="14">✗</text>
<text x="222" y="136" class="c-chalk" font-size="12.5">hundreds of units</text>
<text x="222" y="152" class="c-chalk" font-size="12.5">at one site</text>
<text x="200" y="180" class="c-red" font-size="14">✗</text>
<text x="222" y="180" class="c-chalk" font-size="12.5">a price, a margin,</text>
<text x="222" y="196" class="c-chalk" font-size="12.5">or a profit</text>
<text x="0" y="252" class="c-yellow" font-size="15">the scoreboard is one weld deep.</text>
<text x="0" y="278" class="c-dim" font-size="10.5">Company posts and filings; IEEE Spectrum; press interviews.</text>
</g></g>
<g class="rc-panel" data-panel="decide">
<rect x="430" y="1376" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="444" y="1404">10. What decides this bet</text>
<g transform="translate(438 1412)">
<text x="0" y="26" class="c-yellow" font-size="18">so which first job pays?</text>
<rect x="0" y="44" width="124" height="52" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="10" y="68" class="c-chalk" font-size="12.5">labor nobody</text>
<text x="10" y="84" class="c-chalk" font-size="12.5">can hire</text>
<rect x="130" y="44" width="124" height="52" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="140" y="68" class="c-chalk" font-size="12.5">a tool in</text>
<text x="140" y="84" class="c-chalk" font-size="12.5">the hand</text>
<rect x="260" y="44" width="124" height="52" rx="6" fill="none" class="s-dim" stroke-width="1.4"/>
<text x="270" y="68" class="c-chalk" font-size="12.5">a customer buying</text>
<text x="270" y="84" class="c-chalk" font-size="12.5">output, not savings</text>
<path d="M192 104 C192 132 116 128 92 146" fill="none" class="s-green" stroke-width="1.8" marker-end="url(#rp-a-green)"/>
<path d="M192 104 C192 132 268 128 292 146" fill="none" class="s-red" stroke-width="1.8" marker-end="url(#rp-a-red)"/>
<rect x="0" y="150" width="176" height="72" rx="6" fill="none" class="s-green" stroke-width="1.8"/>
<text x="10" y="180" class="c-green" font-size="14">the robot welds alone:</text>
<text x="10" y="202" class="c-chalk" font-size="12.5">then the bet pays</text>
<rect x="208" y="150" width="176" height="72" rx="6" fill="none" class="s-red" stroke-width="1.8"/>
<text x="218" y="180" class="c-red" font-size="14">a pilot forever is</text>
<text x="218" y="202" class="c-chalk" font-size="12.5">a demo with extra steps</text>
<text x="0" y="252" class="c-yellow" font-size="15">my pick: the sharpest first job in humanoids.</text>
<text x="0" y="272" class="c-chalk" font-size="13">the proof is still one weld deep.</text>
</g></g>
<g class="rp-banner">
<text x="420" y="30" class="c-chalk" font-size="19" text-anchor="middle">Every humanoid company picks a first job.</text>
<text x="420" y="56" font-size="17" text-anchor="middle"><tspan class="c-yellow">Persona: the weld.</tspan><tspan class="c-green" dx="10">Agility: the tote.</tspan><tspan class="c-pink" dx="10">1X: the chore.</tspan><tspan class="c-blue" dx="10">Apptronik: the floor.</tspan><tspan class="c-dim" dx="10">Tesla: the product.</tspan></text>
</g>
</g></svg></div></div>
<div class="rc-body">

Suppose you buy robots for a shipyard. The demos all look alike now: a humanoid walks, folds something, lifts a box. What you need is one seam welded before lunch, every shift, in a shop where the last three welders you hired did not stay. So the question is not which robot looks smartest on video. It is which company has picked a first job that pays.

Every humanoid company has picked one. Agility Robotics picked moving totes in warehouses. 1X picked chores in homes. Apptronik picked dull, dirty, dangerous work in factories. Tesla is building a general-purpose "Bot" on top of its car business and has not named a first job at all. Persona AI, a two-year-old company in Houston, picked welding in shipyards and steel shops.

Here is the difference in one paragraph. Most of the field aims at unskilled work: carry, sort, fetch, for wages the robot tries to undercut. Persona aims at skilled work nobody can staff, with a tool in the hand, at prices the robot does not have to win on. And it rents the work instead of selling the machine. So the bet has three unusual parts: the job (welding, using the same torch the crew uses), the money (paid out of the customer's top line, because the customer cannot fill its order book), and the learning (expert welders teleoperating the robot at real worksites, not internet video). Agility's robots have moved over 100,000 totes at GXO. 1X takes $200 deposits for a home robot. Apptronik's Apollo works factory and warehouse tasks with brains from Google DeepMind. Tesla's own annual report says it has "yet to commercialize" a Bot. Persona's humanoid has run one weld in a live welding shop, with a person driving it. I think Persona's bet is the sharpest of the five, and the video that proves it is also the honest part: today, the weld is a person wearing a robot.

<div class="rc-mark" id="sec-map" data-panel="map" data-view="map" data-title="Where each company sends its humanoid first"></div>

## Where the humanoids go first

This is not a survey of every humanoid company. The field is too big for that and most of it is repeating itself. I picked companies whose published bet is different in kind from Persona's, and left out the ones whose bet is a variant of these. One name is deliberately thin here: [Figure](https://www.figure.ai). Figure's bet is that the robot's body decides what it can learn, and that argument deserves its own treatment: [Three robot bets](/robotics/three-robot-philosophies/), which also covers Generalist and Physical Intelligence. This article asks a different question. Not "where does generalization come from", but "what is this robot for".

Persona's answer was not obvious at the start. Radford, who led NASA's Valkyrie program and founded Nauticus Robotics, told IEEE Spectrum that in 2024 "we were all over the place. Warehousing, automotive, we probably even mentioned the home." Those are the same first jobs everyone else picked. Then the company formed a different thesis, "around skilled trades and tool usage". Radford calls the position "last-mover advantage": "We've seen everything that everybody's doing, and we've decided that there's a different way."

The team is part of why I take this seriously. The CTO, Jerry Pratt, led IHMC's DARPA Robotics Challenge team and then spent a couple of years as CTO of Figure. If anyone in this industry knows what the general-purpose humanoid crowd is doing and why it is hard, it is the person who helped build one of those companies and then left to weld.

<div class="rc-mark" id="sec-labor" data-panel="labor" data-view="labor" data-title="Why the trades: a gap, not a price"></div>

## Why the trades

Start with the customer. Moving boxes is a solved problem with cheap solutions: arms, conveyors, wheeled robots. Welding is the opposite. The workers are scarce, the skill is real, and the shortage holds production back. As Persona puts it, a shipyard "cannot hire its way out of the problem, and every unwelded seam holds up a hull worth millions."

The numbers behind that are second-hand but consistent across the interviews and trade press. The American Welding Society expects about 82,500 welding positions to fill every year through 2029. The average working welder in the US is about 55, and for every five who retire roughly two arrive. Deloitte and the Manufacturing Institute put the manufacturing shortfall at up to 3.8 million workers by 2033. North American and Korean shipbuilding together are short something like 40,000 skilled workers, and the average age of a production worker at the Ulsan yards has reached 48.3.

Now the money, which is the part I find most convincing. Radford says their partnerships "are running at a significant backlog, and they're labor-constrained. So we want to help our customers' top line, not necessarily their bottom line." In plain terms: these buyers are not trying to make ships cheaper. They are trying to build more of them than their headcount allows. "Even if our robot was more expensive than a human, that would still be valuable to these companies, because it could unlock additional revenue."

That inverts the usual robot economics. The Roomba wins when the job is optional and the machine must be cheap. Here the job is a bottleneck, and the buyer pays for output. Price competition follows the strategy, and Pratt says so: "We're now in an industry where the value added by our robot can be high enough that we don't have to cut corners on quality and features in order to reduce the price. With a robot for the home, for example, there would be a lot of competition and a ton of price pressure." That is a real insight about where humanoids should start, and it works for any company that finds a labor-critical skilled task, not just for welders.

<div class="rc-mark" id="sec-weld" data-panel="weld" data-view="weld" data-title="What a weld asks of a robot"></div>

## What a weld asks for

The task is friendlier to a robot than it first looks. You can only weld as fast as metal melts, so the top speed is a manageable centimeter per second. A good weld is millimeter-scale repeated motion over a long path, which is exactly what machines are good at and what people get tired or bored doing. And shipbuilding needs enormous amounts of the simple version: "This is not the hardest style of weld," Radford says, "but in shipbuilding you need a lot of them, hundreds of kilometers of linear welds per ship."

The hard part is the tool. "Tool use is pretty difficult," Pratt says, "and we want to use the same tools that humans do, which makes it more difficult." That choice is deliberate. A robot that welds with the crew's torch, grinder and plasma cutter walks into a shop that already exists. A robot that needs its own special welding cell is a machine the shop has to build around.

<div class="rc-mark" id="sec-july" data-panel="july" data-view="july" data-title="The July weld: what the video shows"></div>

## The July weld

In July 2026, at ARC Specialties, a welding automation shop in Houston, a Persona humanoid walked up to a workstation, squatted, struck an arc, ran a weld, stood up under its own power and walked away. No gantry, no safety tether, no fixture holding the torch. The sequence is on camera and the shot is continuous.

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/lDNrnmCj2DM" title="First Spark: a Persona AI humanoid welds untethered" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>First Spark: the humanoid squats, welds and stands back up at ARC Specialties in Houston (Persona AI, July 2026). <a href="https://youtu.be/lDNrnmCj2DM">Watch on YouTube</a></figcaption>
</figure>

The weld was teleoperated, and Persona says that out loud, which I respect. A person in VR and motion capture supplied the intent and the judgment. What the robot did itself was everything else: balance, footing, locomotion, perception. Their teleoperation lead puts the division plainly: "the human supplied intent and judgment; the robot supplied the physical intelligence."

She also gives the standard that matters more than the video: "Succeeding once on camera says nothing about doing the job on the two-hundredth task of a shift. We optimize for the opposite: repeatability and usability." That is the right scoreboard, and right now Persona's honest number is one weld.

<div class="rc-mark" id="sec-legs" data-panel="legs" data-view="legs" data-title="Why legs in a shipyard"></div>

## Why legs

This is where the humanoid form earns its keep without hand-waving. Shipyards were built around people. "These open-air shipyards are a couple hundred meters long, with horizontal and vertical spars that you have to step over all the time," Radford says. "You've got to work on the ground, overhead, and through portholes." A wheeled base needs open floor and adapted routes. Legs take the route the welder takes, and Persona's argument is commercial, not aesthetic: adapting a yard around a machine is usually more expensive than the machine.

It is worth comparing with the home argument. Figure also wants legs because homes are built for people, and in [Three robot bets](/robotics/three-robot-philosophies/) I come down against legs for a flat with no stairs. The difference here is the customer. In a shipyard, the ladder and the spar are on the path to paid work, and the yard is not going to be redesigned for a robot. Same shape, different economics.

There is a second, quieter advantage. Shipyard crews already work around cranes, arc light and falling steel. A bipedal robot is not the strangest hazard on that floor.

<div class="rc-mark" id="sec-loop" data-panel="loop" data-view="loop" data-title="Teleoperation is the data path"></div>

## How it learns

Most humanoid companies treat a human in the loop as an embarrassment. Persona treats it as the data pipeline. Every hour an experienced welder drives the robot is expert demonstration data on the real platform, in the real shop, with arc light and smoke and uneven floors. "We are not betting on a grand general policy that wakes up one day and does everything," their teleoperation lead writes. "We advance autonomy one real task at a time, with teleoperation generating the on-platform data that earns each step."

This is a genuinely different data bet from the rest of the field. Figure pretrains on large amounts of human video before the robot touches a home (see [Three robot bets](/robotics/three-robot-philosophies/)). Generalist records people using hand-held grippers. Physical Intelligence trains on many robots and lets the model practice. Apptronik runs fleets of Apollo robots in its "Robot Park" to collect data with Google DeepMind. Agility learns from live logistics work, where the scoreboard is totes moved. 1X wants robots living in homes. Persona wants expert welders on the job, and by the company's own account it will need "tens of thousands of hours" of that before autonomy follows.

I like this pipeline because the data is exactly the skill being sold. Nothing in it is a proxy. The risk is just as clear: teleoperation data teaches the robot while a person is driving. Whether it becomes autonomy is a claim, not a result, and Persona is honest about the timeline. General humanoid autonomy, they write, "is further off than the headlines suggest".

<div class="rc-mark" id="sec-lease" data-panel="lease" data-view="lease" data-title="Lease the labor, not the robot"></div>

## The deal

Persona planned from the start to keep its robots and sell what they do. In February 2025, with "more than $10 million" in pre-seed funding, Radford described the model to InnovationMap: the company retains ownership of the robots and sells the labor they supply. The leasing page today sells the same bundle: the robot, AI platform updates, custom tooling modules and fleet management training. The pitch line is "the labor platform for skilled industrial work".

The money story is simple to date. The pre-seed was eight figures by February 2025, from investors in the US, London and Singapore. Press reported $42 million raised around the Gen 1 unveiling in December 2025, and POSCO's industrial technology arm put in $2 million that month. In September 2026 the company filed with the SEC: an offering of up to $141,964,814, with $65,363,626 sold as of the filing. That is a real war chest, and it matches the hiring: a head of global manufacturing from Amazon Robotics and Dell, and a commercial strategy head from Boston Dynamics and DJI.

The hardware moved fast for a two-year-old company. Gen 1, with a tendon-driven hand, was shown in December 2025. A unit welded at ARC Specialties in July 2026. Gen 3 is on the ground and due to be presented this fall. The pace is one of the more credible things about the company, and the CEO puts a number on the strategy: they want customers "who can support hundreds of robots per location".

<div class="rc-mark" id="sec-queue" data-panel="queue" data-view="queue" data-title="Who is already standing in line"></div>

## Who is standing in line

The customer list is the strongest signal that the bet is real, because every name on it has the same problem: more skilled work than people.

HD Hyundai is the anchor. A memorandum of understanding in May 2025 became a partnership agreement in March 2026 between Persona, HD Korea Shipbuilding and Offshore Engineering, and HD Hyundai Robotics: robot welding for shipyards, with the shipbuilder's data feeding the training and the robotics affiliate handling deployment. POSCO, one of the largest steel producers in the world, is working with Persona on steel-site logistics and is also an investor. In Louisiana, SSE Steel Fabrication, a shop of about 75 people doing bespoke structural steel, is taking a unit for fillet welding on a live production floor. Cameras have been running on that floor for months, feeding a digital twin of the shop before any robot attempts the work. ABS is in the loop on class and safety standards, and Under Armour is researching what robot workwear should even be, since a humanoid next to an arc takes the same punishment a welder does. "This is research, not a product," Persona says about that one, and I believe them.

Add one more angle that matters to industrial buyers: after the FCC restricted new foreign-built mobile robots in July 2026, Radford's point to IEEE Spectrum was that serious buyers were already asking to audit the technology, get support quickly, and avoid a fragile overseas supply chain. A Houston company selling into Korean and American heavy industry is well placed for that conversation.

<div class="rc-mark" id="sec-score" data-panel="score" data-view="score" data-title="The scoreboard: shown and not shown"></div>

## The scoreboard

Time for the unromantic part. What Persona has shown is a teleoperated weld in a real shop, partnership agreements with major industrial buyers, Gen 3 hardware, and $65.4 million sold toward a $142 million offering. What it has not shown is an autonomous weld, a robot working a full shift, hundreds of units at one site, a price, or a margin.

That gap is normal at this stage. What I like is that Persona's own framing measures the right thing: repeatability over a shift, not a demo reel. And the company is not overselling the market either. The International Federation of Robotics counted roughly 7,000 humanoids for industrial and professional service sold worldwide in 2025, mostly in pilots. Persona's own summary of the situation: "useful is not the same as ready", and at their first shop the expectation is a robot on the floor "within a couple of years", introduced gradually.

<div class="rc-mark" id="sec-decide" data-panel="decide" data-view="decide" data-title="What decides this bet"></div>

## What decides this bet

So what makes Persona's humanoid bet different? It is not the robot. Pratt is right that "a lot of the technical problems are the same no matter whether you're in a house or a shipyard." The difference is the job. Everyone else picked a job where the robot competes on cost with available labor, or no labor market exists at all yet. Persona picked a job where the labor does not exist, the tool is already in the room, and the customer buys output rather than savings.

Three conditions make that work, and a company hunting for its own version of this bet should check all three: a skill nobody can staff, a human tool the robot can hold, and a customer whose revenue is capped by headcount. Welding in shipyards and steel shops has all three. Chores in homes have none. Moving totes has the customer but not the scarcity. General-purpose factory work has the scarcity in places but keeps the tool generic.

The risk is exactly what the July video shows. Today the weld is a person wearing a robot. If teleoperation data turns into autonomous welding, this is the best-positioned company in humanoids: a real skill, real sites, real customers, and a lease model that scales with trust. If it does not, Persona is a very well-funded teleoperation service. That is the fork, and the honest way to watch it is simple: wait for the first published autonomous weld with trial counts, then wait for a shift.

I would take this bet over the alternatives. Radford says the industry told him "we're not thinking big enough", and Pratt answers the generalization worry better than any pitch deck: "Everybody's got a great team and smart people, and we're all knocking these problems out together." Being the last mover is not thinking small. It is choosing the first job where a robot is worth more than a person, and then doing what it takes to hold the torch.

Here is the comparison in one place.

| Company | First job | The bet | What is shown today |
| --- | --- | --- | --- |
| **Persona AI** | weld seams in shipyards and steel shops | skilled tool use in work nobody can staff, leased as labor, learned from expert teleoperation | one teleoperated weld in a live shop (July 2026); deals with HD Hyundai, POSCO, SSE and ABS |
| **Agility (Digit)** | move totes in warehouses and factories | measurable ROI in live material handling, deployed now and scaled by fleet software | over 100,000 totes moved at GXO since June 2024; over $300 million in committed multi-year orders for Digit 5 |
| **1X (NEO)** | chores in homes | learn by living with people; a consumer product | NEO in early-access customer homes; $200 deposit orders |
| **Apptronik (Apollo)** | dull, dirty, dangerous factory and warehouse tasks | general-purpose robot with brains from Google DeepMind and manufacturing partners | pilots with Mercedes-Benz and GXO; "Robot Park" data fleets |
| **Tesla (Optimus)** | none named; a Bots business "leveraging our current operations" | self-driving AI and car-scale manufacturing turned into a robot product | a robot "in development"; "we have yet to commercialize Bots" (FY2025 Form 10-K) |
| **Figure** | homes and factories | the body decides what a robot can learn | see [Three robot bets](/robotics/three-robot-philosophies/) |

<details>
<summary>Sources and what isn't verified</summary>

**Persona AI, the company.** [Home](https://persona.ai/) (the "labor platform for skilled industrial work", industries, modular platform), [About](https://persona.ai/why-persona/) (Houston, founded 2024, the three co-founders), [First Spark](https://persona.ai/news/robot-welding-in-a-real-industrial-environment/) (July 8, 2026: the ARC Specialties weld; their claim that "what you see is what happened"), [teleoperation](https://persona.ai/teleoperation-preceeds-automony/) (August 6, 2026: the human and robot division of labor, repeatability over demos, "one real task at a time"), [skilled trades](https://persona.ai/news/why-skilled-industrial-labor-is-the-future-of-heavy-industrial-humanoids/) (their summary of the IEEE feature: HD Hyundai, ABS, POSCO, SSE, the 40,000 figure), [Korea](https://persona.ai/news/korea-with-its-strong-manufacturing-base-is-the-benchmark-for-humanoid-commercialization/) (the HD joint development agreement, POSCO invested, Gen 3 on the ground, Ulsan age), [Under Armour](https://persona.ai/news/persona-ai-collaborates-with-under-armour-to-explore-performance-materials-for-humanoid-robotics/) ("this is research, not a product"), [manufacturing hire](https://persona.ai/news/persona-ai-announces-brian-davis-as-head-of-global-manufacturing/) (Amazon Robotics and Dell), [commercial strategy hire](https://persona.ai/news/persona-ai-announces-michael-perry-as-head-of-commercial-strategy/) (Boston Dynamics and DJI), [FCC](https://persona.ai/news/ieee-spectrum-features-persona-ai-amid-fcc-mobile-robot-ruling/) (Radford on auditability and supply chains), [simulations](https://persona.ai/news/simulations-digital-twins-the-commercial-engine-for-physical-ai/) (digital twins of customer sites), [the lease program](https://info.persona.ai/lease-a-humanoid), and the company's [summary of the Biz New Orleans pilot](https://persona.ai/news/biz-new-orleans-persona-ai-humanoid-in-steel-facility/) (SSE: fillet welding, a 5 ft 8 in robot with two arms and two legs that walks stairs and uses the crew's tools, cameras feeding simulation).

**IEEE Spectrum.** Evan Ackerman, [Is Shipyard Welding the Right First Job for Humanoid Robots?](https://spectrum.ieee.org/persona-ai-humanoid-robot-welding) (August 17, 2026; the page title also reads "How Persona AI Makes Humanoids Pay Off In Welding"). This is the source for the founding story, "we were all over the place", "last-mover advantage", "tool use is pretty difficult", "hundreds of kilometers of linear welds per ship", the spars and portholes quote, "top line, not necessarily their bottom line", "even if our robot was more expensive than a human", "we're not thinking big enough", "a lot of the technical problems are the same", "tens of thousands of hours", and the two public partnerships. The same editor's [FCC piece](https://spectrum.ieee.org/fcc-covered-list-mobile-robots) covers the July 2026 ruling.

**Founders.** Radford (NASA Valkyrie program, founder of Nauticus Robotics) and Pratt (IHMC's DARPA Robotics Challenge team, "a couple of years as CTO of Figure") per the IEEE Spectrum feature; the third co-founder is the COO. InnovationMap confirms the roles and the Valkyrie and Nauticus history.

**Funding.** InnovationMap, [February 5, 2025](https://houston.innovationmap.com/personal-ai-robot-funding-2671093712.html) (a Radford interview: "more than $10 million" pre-seed, eight figures, robotics-as-a-service, founded June 2024, delivery in 18 to 24 months). [SEC Form D, Persona AI Inc.](https://www.sec.gov/Archives/edgar/data/2107493/000210749326000002/primary_doc.xml) filed September 14, 2026: offering of $141,964,814, sold $65,363,626, remaining $76,601,188, first sale August 28, 2026, incorporated 2024 in Houston. RoboHorizon, [December 31, 2025](https://robohorizon.com/en-us/news/2025/12/persona-ai-unveils-humanoid-bot-with-42m-to-weld-in-shipyards) (Gen 1 unveiling, tendon-driven hand, "$42 million in pre-seed funding", office in Pensacola). Asia Business Daily, [December 23, 2025](https://www.asiae.co.kr/en/article/2025122316104579854) (POSCO DX invested $2 million).

**Korea.** Korea Times/Yonhap, [March 23, 2026](https://www.koreatimes.co.kr/amp/business/companies/20260323/hd-hyundai-affiliates-partner-to-develop-ai-powered-welding-robots-for-shipyards) (the agreement with HD KSOE and HD Hyundai Robotics, following a May 2025 MoU). Seoul Economic Daily, [September 22, 2026](https://en.sedaily.com/technology/2026/09/22/persona-ai-eyes-energy-construction-after-shipbuilding) (proofs of concept with HD Hyundai and POSCO DX, the $2 million investment, over 330,000 welders short by 2028, 2.1 million unfilled by 2030, Gen 3 this fall, "robots will be commercialized on manufacturing floors two years from now", about 7,000 industrial humanoids sold in 2025 per the IFR). Maekyung, [2026](https://www.mk.co.kr/news/it/12005205) (their summary: Ulsan average age 48.3, yards turning down orders).

**Comparison companies, their own words.** Agility Robotics, [commercial momentum, October 26, 2026](https://agilityrobotics.com/content/agility-robotics-highlights-commercial-momentum-and-growing-enterprise-demand-for-digit-humanoid-robot) (65,000 hours of operation, GXO and the 100,000 totes, the first formal commercial deployment of a humanoid in live operations in June 2024, over $300 million in committed multi-year orders for Digit 5, RoboFab in Salem, the Churchill Capital Corp XI combination). 1X, [About](https://www.1x.tech/about) ("1X bets on the home", NEO as a home robot that "lives and learns among us", early-access homes in 2025 and 2026) and [NEO](https://www.1x.tech/neo) ($200 deposit). Apptronik, [mission](https://apptronik.com/company/our-mission) ("dull, dirty and dangerous tasks" in warehousing and manufacturing) and [press releases](https://apptronik.com/company/press-releases) (Google DeepMind partnership December 2024, the $403 million Series A in March 2025, Jabil, Mercedes-Benz, GXO, and Robot Park in June 2026). Tesla, [FY2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm) (Optimus "a general purpose, autonomous humanoid robot in development", "we have yet to commercialize Bots", "we intend to leverage our current operations").

**The labor numbers.** 82,500 welding jobs a year through 2029 (American Welding Society), the average welder about 55, five retiring for every two arriving, and up to 3.8 million manufacturing jobs by 2033 with 1.9 million unfilled (Deloitte and the Manufacturing Institute) all come from [Biz New Orleans](https://bizneworleans.com/a-groundbreaking-humanoid-robot-pilot-program-is-underway/) on the SSE pilot. The 2.1 million by 2030 and the over 330,000 welders by 2028 come from Persona AI and its commercial strategy head to their post and to Seoul Economic Daily. The roughly 40,000 skilled workers short in North American and Korean shipbuilding is Persona AI's own figure in its summary of the IEEE feature.

**What isn't verified.** The $42 million figure is press-reported (RoboHorizon) and not in a filing, so treat the funding history as: eight-figure pre-seed confirmed by the CEO in February 2025, $65.4 million sold in the current SEC offering, $2 million from POSCO DX. The company calls the July welding unit "Gen 1" in the First Spark post and "Gen 2" in its summary of the IEEE feature, so I say "a Persona humanoid" and leave the generation open. The Fabricator article on SSE was not reachable from here; the shop-floor quotes and SSE numbers (about 75 people, about $30 million of revenue, 300 to 800 tons a month) come from Biz New Orleans and Persona AI's own summary. "Hundreds of robots per location" is Radford describing the customers he wants, not a signed volume. The claim that the weld video is one continuous unmodified take is the company's ("what you see is what happened"). Tesla's website was not reachable from my machine, so the Tesla row rests on the 10-K alone, which does not name a first job or a "factories first" sequence. The salary comparisons ("even if our robot was more expensive than a human") are hypotheticals from the interview, not prices; no price for any of these robots appears in these sources. The labor statistics are industry estimates relayed through interviews and trade press; I did not reach the underlying AWS or Deloitte reports.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
