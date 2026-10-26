---
title: 'Persona AI bets its humanoid on welding'
description: 'Persona AI is building a humanoid for skilled industrial work. Welding gives it a customer with a labor bottleneck and a way to collect expert demonstrations. Its first job separates it from Agility, 1X, Apptronik and Tesla.'
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
<noscript>
<style>
#rc { display: block; width: auto; left: auto; transform: none; }
#rc > .rc-stage { position: relative; top: auto; height: min(75vh, 900px); border: 1px solid var(--line); }
#rc .rc-bar { display: none; }
#rc .rc-view { overflow: auto; }
#rc .rc-stage svg.rc-svg { position: static; width: 840px; height: 1742px; max-width: none; }
</style>
<p>Scroll inside the blackboard to read all ten panels. The full article follows below.</p>
</noscript>

<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view" tabindex="0" role="region" aria-label="Humanoid company comparison blackboard"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 1742" data-whole="0 0 840 1742" data-views='{"map":[12,88,396,288],"labor":[432,88,396,288],"weld":[12,418,396,288],"july":[432,418,396,288],"legs":[12,748,396,288],"loop":[432,748,396,288],"lease":[12,1078,396,288],"queue":[432,1078,396,288],"score":[12,1408,396,288],"decide":[432,1408,396,288]}' role="img" aria-labelledby="rp-title rp-desc"><title id="rp-title">Where humanoids go first: ten blackboard panels</title><desc id="rp-desc">Ten blackboard panels on Persona AI's humanoid bet and how it differs from Agility, 1X, Apptronik, Tesla and Figure. 1, the first job each company picks: Persona welds seams in shipyards, Agility moves totes in warehouses, 1X does chores in homes, Apptronik takes dull, dirty, dangerous factory work, Tesla builds a Bots business on its current operations, Figure aims at homes and factories. 2, the gap in skilled trades: 82,500 US welding jobs to fill every year to 2029, five welders retiring for every two who arrive, 2.1 million US manufacturing jobs unfilled by 2030, about 40,000 skilled workers short in North American and Korean shipbuilding, average age 48.3 on the Ulsan production floor and 55 for a US welder. 3, what a weld asks of a robot: the melt rate caps the speed at centimeters per second, the motion is millimeter-scale repetition, one ship holds hundreds of kilometers of linear welds, done with the crew's own torch. 4, the July 2026 weld at ARC Specialties in Houston: a humanoid squats, strikes an arc, runs the weld, stands and walks away, teleoperated from VR and motion capture, no gantry and no tether, balancing itself. 5, why legs: shipyard work is on the ground, overhead and through portholes, a wheeled base is blocked at a spar and the site would have to change, legs take the route a welder takes. 6, teleoperation is the data path: the operator sends intent and judgment, the robot keeps balance, footing and vision, every session is expert demonstration data, and training adds one skill at a time. 7, the deal: Persona keeps the robot and leases the labor with AI platform updates, tooling modules and fleet training, paid for work the customer cannot staff, with funding chips of 10 million dollars pre-seed in February 2025, 42 million dollars by December 2025 per press, 65.4 million dollars sold of a 142 million dollar SEC offering in September 2026, and 2 million dollars from POSCO DX. 8, who is standing in line: HD Hyundai on shipyard welding, POSCO on steel-site logistics and an investor, SSE Steel Fabrication on fillet welding in Louisiana, ABS on class standards, Under Armour on robot workwear research. 9, the scoreboard: shown in public are a teleoperated weld in a live shop, deals with HD Hyundai, POSCO, SSE and ABS, Gen 3 units on the ground, and 65.4 million dollars sold toward a 142 million dollar offering; not shown yet are an autonomous weld, a robot working a whole shift, hundreds of units at one site, and a price or a profit. 10, what decides the bet: the paying first job needs labor nobody can hire, a tool in the hand, and a customer buying output rather than savings, and the fork is the robot welding alone, followed by a test of its economics, against a pilot forever, which is a demo with extra steps.</desc>
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
<text class="rls-panel-title" x="444" y="84">2. Skilled trades face a labor gap</text>
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
<text x="0" y="238" class="c-red" font-size="15">moving boxes: established automation.</text>
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
<text x="0" y="234" class="c-chalk" font-size="15">20th seam: an illustration of fatigue.</text>
<text x="0" y="254" class="c-yellow" font-size="15">start with common linear welds.</text>
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
<text class="rls-panel-title" x="24" y="1074">7. Selling skilled labor</text>
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
<text x="0" y="170" class="c-yellow" font-size="14">value: additional output and revenue.</text>
<text x="0" y="188" class="c-chalk" font-size="12.5">even above a person's wage, it could unlock</text>
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
<text x="331" y="114" class="c-green" font-size="11.5" text-anchor="middle">pilot this year</text>
<text x="0" y="158" class="c-chalk" font-size="15">ABS</text>
<text x="0" y="175" class="c-dim" font-size="12">class and safety standards</text>
<rect x="278" y="142" width="106" height="22" rx="11" fill="none" class="s-dim" stroke-width="1.5"/>
<text x="331" y="158" class="c-dim" font-size="11.5" text-anchor="middle">standards</text>
<text x="0" y="202" class="c-chalk" font-size="15">Under Armour</text>
<text x="0" y="219" class="c-dim" font-size="12">what robot workwear should be</text>
<rect x="278" y="186" width="106" height="22" rx="11" fill="none" class="s-dim" stroke-width="1.5"/>
<text x="331" y="202" class="c-dim" font-size="11.5" text-anchor="middle">R&amp;D only</text>
<text x="0" y="246" class="c-dim" font-size="12.5">founded June 2024 · Houston · Gen 3 units on the ground</text>
<text x="0" y="264" class="c-yellow" font-size="13">each partner adds a worksite requirement.</text>
<text x="0" y="280" class="c-dim" font-size="10.5">Persona AI; Korea Times (Yonhap); Biz New Orleans; Seoul Economic Daily.</text>
</g></g>
<g class="rc-panel" data-panel="score">
<rect x="10" y="1376" width="400" height="320" rx="6" fill="none" stroke="#b6baaf"/>
<text class="rls-panel-title" x="24" y="1404">9. The production milestones</text>
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
<text x="270" y="84" class="c-chalk" font-size="12.5">additional output</text>
<path d="M192 104 C192 132 116 128 92 146" fill="none" class="s-green" stroke-width="1.8" marker-end="url(#rp-a-green)"/>
<path d="M192 104 C192 132 268 128 292 146" fill="none" class="s-red" stroke-width="1.8" marker-end="url(#rp-a-red)"/>
<rect x="0" y="150" width="176" height="72" rx="6" fill="none" class="s-green" stroke-width="1.8"/>
<text x="10" y="180" class="c-green" font-size="14">the robot welds alone:</text>
<text x="10" y="202" class="c-chalk" font-size="12.5">then test the economics</text>
<rect x="208" y="150" width="176" height="72" rx="6" fill="none" class="s-red" stroke-width="1.8"/>
<text x="218" y="180" class="c-red" font-size="14">a pilot forever is</text>
<text x="218" y="202" class="c-chalk" font-size="12.5">a demo with extra steps</text>
<text x="0" y="252" class="c-yellow" font-size="15">my pick: the sharpest first job in humanoids.</text>
<text x="0" y="272" class="c-chalk" font-size="13">the public example is still one weld.</text>
</g></g>
<g class="rp-banner">
<text x="420" y="30" class="c-chalk" font-size="19" text-anchor="middle">Every humanoid company picks a first job.</text>
<text x="420" y="56" font-size="17" text-anchor="middle"><tspan class="c-yellow">Persona: the weld.</tspan><tspan class="c-green" dx="10">Agility: the tote.</tspan><tspan class="c-pink" dx="10">1X: the chore.</tspan><tspan class="c-blue" dx="10">Apptronik: the floor.</tspan><tspan class="c-dim" dx="10">Tesla: the product.</tspan></text>
</g>
</g></svg></div></div>
<div class="rc-body">

Suppose you run a shipyard and have more orders than your welders can finish. You can buy another machine, but someone still has to carry the torch to the seam and do the work. What would a humanoid have to do to let you build another ship?

Persona AI has built its strategy around that customer. The Houston company wants its robot to perform skilled industrial work with the tools people already use. Welding in shipyards and steel shops is the first job. Expert welders would operate the robots while Persona collects the demonstrations needed to automate their skills, and customers would lease the labor.

I would take this starting point over the other humanoid bets compared here. The job gives Persona a customer who can explain what the robot's work is worth. It also gives the learning team a specific skill to acquire. The hard part is turning that connection into a machine that can weld through a shift.

<div class="rc-mark" id="sec-map" data-num="1" data-panel="map" data-view="map" data-title="Where each company sends its humanoid first"></div>

## The first job shapes the company

Agility Robotics has chosen material handling. Its [October 26, 2026 update](https://agilityrobotics.com/content/agility-robotics-highlights-commercial-momentum-and-growing-enterprise-demand-for-digit-humanoid-robot) reports over 100,000 totes moved at GXO under an agreement that began in June 2024. Digit works in warehouses and factories, supported by fleet software. Agility also reports more than $300 million in committed multi-year orders for Digit 5, whose value depends on contractual milestones and product features and specifications. The operating record gives buyers a concrete unit to evaluate, a tote moved in their workflow.

[1X](https://www.1x.tech/about) wants NEO to live and learn alongside people in their homes. Its published timeline describes early-access homes in 2025 and 2026, and its [NEO page](https://www.1x.tech/neo) takes a $200 deposit. Everyday chores supply the work and the learning environment. The buyer is a household deciding how much help a robot brings to daily life.

Apptronik's Apollo targets [dull, dirty and dangerous work](https://apptronik.com/company/our-mission) in manufacturing and warehousing. Its [programs](https://apptronik.com/company/press-releases) include Mercedes-Benz and GXO pilots, manufacturing partners and a Google DeepMind partnership. Fleets of Apollo robots collect data at Robot Park. Apptronik is developing a platform for a broad industrial role; Persona has selected a particular industrial skill to sell first.

Tesla describes Optimus in its [FY2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm) as a general-purpose autonomous humanoid robot in development. The filing says, "we have yet to commercialize Bots", and explains that Tesla intends to leverage its current operations. The bet connects self-driving AI and car-scale manufacturing to a robot business. A first job remains unspecified in that filing.

These choices lead to different customers and different ways to measure progress. Persona wants to put a human tool in the robot's hand and charge for skilled work that its customer struggles to staff. [Figure](https://www.figure.ai) also appears on the board, with homes and factories as its destinations. Its body-and-learning argument belongs to [Three robot bets](/robotics/three-robot-philosophies/), alongside Generalist and Physical Intelligence. The comparison here follows the first job and the business it supports.

<div class="rc-mark" id="sec-labor" data-num="2" data-panel="labor" data-view="labor" data-title="Skilled trades face a labor gap"></div>

## Missing welders hold back revenue

A shipyard with a backlog can earn more by completing more work. If the bottleneck is welding labor, another capable welder can unlock that output. This is why Persona's choice interests me. A tote-moving robot enters a workflow already served by conveyors, arms and wheeled robots. A home robot has to earn a place in the household budget. Persona is looking for industrial buyers whose unfilled jobs constrain sales. Its skilled-trades account describes each unwelded seam as holding up a hull worth millions.

Radford describes that problem in his [IEEE Spectrum interview](https://spectrum.ieee.org/persona-ai-humanoid-robot-welding). The partners have significant backlogs and are labor-constrained, he says. The company wants to help their "top line, not necessarily their bottom line". His hypothetical allows the robot to cost more than a human because the additional work could unlock revenue. The price the customer can justify depends on the production that extra labor makes possible.

The estimates show why the customer would look for another source of labor. [Biz New Orleans](https://bizneworleans.com/a-groundbreaking-humanoid-robot-pilot-program-is-underway/) relays an American Welding Society projection of about 82,500 US welding positions to fill each year through 2029. It puts the average working welder at roughly 55 years old, with about two entrants for every five retirees. Its account of the Deloitte and Manufacturing Institute study projects up to 3.8 million new manufacturing workers needed by 2033, with about 1.9 million positions potentially unfilled.

Persona cites roughly 40,000 missing skilled workers in North American and Korean shipbuilding. Its [Korea account](https://persona.ai/news/korea-with-its-strong-manufacturing-base-is-the-benchmark-for-humanoid-commercialization/) puts the average age on the Ulsan production floor at 48.3 and cites 2.1 million US manufacturing jobs projected to be unfilled by 2030. The research behind this article reaches those labor estimates through company accounts and trade press; the underlying AWS and Deloitte reports remain unverified here.

Pratt connects this scarcity to product design. A robot that adds enough value gives Persona room to spend on quality and features. He expects a home robot to face much stronger competition and price pressure. That changes the engineering budget available for the first job. Persona can pursue the machine needed to complete valuable work for an industrial buyer.

<div class="rc-mark" id="sec-lease" data-num="7" data-panel="lease" data-view="lease" data-title="Selling skilled labor"></div>

## Persona keeps the robot and leases its work

The proposed transaction follows that logic. Radford told [InnovationMap in February 2025](https://houston.innovationmap.com/personal-ai-robot-funding-2671093712.html) that Persona would retain ownership of its robots and sell their labor. The current [lease program](https://info.persona.ai/lease-a-humanoid) bundles the machine with AI platform updates, custom tooling modules and fleet management training. Persona calls itself "the labor platform for skilled industrial work". Keeping the robot puts continuing responsibility for its usefulness inside the company.

This focus emerged after the founders considered warehousing, automotive and the home in 2024. Radford calls the skilled-trades and tool-use thesis "last-mover advantage", learning from the field before choosing an entry point. He had led NASA's Valkyrie program and founded Nauticus Robotics. CTO Jerry Pratt had led IHMC's DARPA Robotics Challenge team and spent a couple of years as CTO of Figure. The company has also hired a [manufacturing head](https://persona.ai/news/persona-ai-announces-brian-davis-as-head-of-global-manufacturing/) with Amazon Robotics and Dell experience and a [commercial strategy head](https://persona.ai/news/persona-ai-announces-michael-perry-as-head-of-commercial-strategy/) from Boston Dynamics and DJI.

The financing gives the two-year-old company room to pursue the plan. By February 2025, Radford reported more than $10 million in pre-seed funding from investors in the US, London and Singapore. Press reported $42 million around the December 2025 Gen 1 unveiling, and POSCO DX's $2 million investment that month was also reported in the press. Persona's September 2026 [Form D](https://www.sec.gov/Archives/edgar/data/2107493/000210749326000002/primary_doc.xml) records a $141,964,814 offering with $65,363,626 sold. The filing provides the exact amount sold in that offering; the earlier press figures describe the funding history.

Gen 1 was unveiled in December 2025 with a tendon-driven hand. A Persona humanoid welded in July 2026, and the company reports Gen 3 units on the ground with a presentation planned for this fall. The July unit is called Gen 1 in one company post and Gen 2 in another. Radford wants customers with capacity for hundreds of robots at a location, which sets the scale he is designing the business to serve.

<div class="rc-mark" id="sec-queue" data-num="8" data-panel="queue" data-view="queue" data-title="Who is already standing in line"></div>

## Industrial partners define the work

HD Hyundai gives the shipyard strategy a place to develop. A May 2025 memorandum of understanding led to a March 2026 agreement involving Persona, HD Korea Shipbuilding and Offshore Engineering, and HD Hyundai Robotics. The shipbuilder would contribute training data and the robotics affiliate would handle deployment. Persona's [Korea update](https://persona.ai/news/korea-with-its-strong-manufacturing-base-is-the-benchmark-for-humanoid-commercialization/) describes the joint development and confirms POSCO's investment. POSCO, one of the largest steel producers in the world, is also working with Persona on steel-site logistics. These are development relationships.

SSE Steel Fabrication provides a smaller shop in which to work through the problem. The Louisiana business does bespoke structural steel with about 75 people. Persona's [pilot summary](https://persona.ai/news/biz-new-orleans-persona-ai-humanoid-in-steel-facility/) anticipates a robot arriving this year for fillet welding on a live production floor. Cameras have been collecting shop-floor footage for months to build a digital twin before the machine attempts the job. A separate account expects gradual introduction and a working robot on the floor "within a couple of years". Those are the planned pilot arrival and the longer path to useful operation.

ABS is involved with class and safety standards. The [Under Armour collaboration](https://persona.ai/news/persona-ai-collaborates-with-under-armour-to-explore-performance-materials-for-humanoid-robotics/) researches performance materials and workwear for robots exposed to the punishment of industrial work. Each partner gives Persona a requirement to address, whether that concerns the weld or the protection around the machine.

Industrial buyers also need equipment they can support. In its [account of the July 2026 FCC mobile-robot restriction](https://persona.ai/news/ieee-spectrum-features-persona-ai-amid-fcc-mobile-robot-ruling/), Persona relays Radford's comments about auditability, quick support and resilient supply chains. The company describes a restriction on new foreign-built mobile robots; its regulatory details remain unverified here. For a Houston supplier working with Korean and American heavy industry, the ability to audit and service the system is part of the commercial proposition.

<div class="rc-mark" id="sec-weld" data-num="3" data-panel="weld" data-view="weld" data-title="What a weld asks of a robot"></div>

## Common linear welds give the robot a bounded task

The first skill is more constrained than the phrase "skilled labor" suggests. In the IEEE account, welding speed is limited by how fast the metal melts, roughly a centimeter per second for the task being discussed. The torch makes millimeter-scale motions along the path. Shipbuilding needs hundreds of kilometers of linear welds per ship, according to Radford.

That gives the robot a slow motion to repeat precisely over a long distance. People get tired and bored doing that work. The twentieth seam on the board illustrates this fatigue argument. Persona is starting with common, relatively uncomplicated welds, where reliable repetition would be valuable to the customer.

Using the crew's tools makes manipulation harder. Pratt says Persona deliberately wants to use the same tools people do. The ambition extends from the welding torch to grinders and plasma cutters. A machine that can hold those tools can enter a shop equipped for human workers. A special welding cell asks the shop to build around it, so tool use connects the learning problem directly to installation effort.

<div class="rc-mark" id="sec-legs" data-num="5" data-panel="legs" data-view="legs" data-title="Why legs in a shipyard"></div>

## Legs bring the tool to shipyard work

Before the robot can repeat the weld, it has to reach it. Radford describes open-air yards a couple hundred meters long, with horizontal and vertical spars interrupting the route. Work takes place on the ground, overhead and through portholes. A wheeled base needs a suitable path. Persona wants its robot to follow the welder over the obstacles and toward the next seam.

Adapting a yard around the machine can cost more than the machine itself. That makes legs commercially useful when they give the robot access to paid work in the existing site. The ladder or spar is part of the route to the job. In [Three robot bets](/robotics/three-robot-philosophies/), I argue against legs for a flat without stairs. The shipyard puts a different value on the same body shape.

Crews already work around cranes, arc light and falling steel. Their experience with industrial hazards helps explain the setting Persona chose. Introducing a biped adds integration and safety work, including the class and standards questions its partners are helping address.

<div class="rc-mark" id="sec-july" data-num="4" data-panel="july" data-view="july" data-title="The July weld: what the video shows"></div>

## The July demonstration combines movement and tool use

Persona's [First Spark](https://persona.ai/news/robot-welding-in-a-real-industrial-environment/) post, published July 8, 2026, shows a humanoid at ARC Specialties, a welding automation shop in Houston. The robot walks to the workstation, squats, strikes an arc, runs a weld, stands under its own power and walks away. It works free of a gantry, safety tether or fixture holding the torch. Persona describes the continuous wide shot as unmodified, saying "what you see is what happened".

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/lDNrnmCj2DM" title="First Spark: a Persona AI humanoid welds untethered" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>First Spark: the humanoid squats, welds and stands back up at ARC Specialties in Houston (Persona AI, July 2026). <a href="https://youtu.be/lDNrnmCj2DM">Watch on YouTube</a></figcaption>
</figure>

A person operates the weld through VR and motion capture. According to Persona's [teleoperation lead](https://persona.ai/teleoperation-preceeds-automony/), the operator supplies intent and judgment while the machine handles balance, footing, locomotion and machine-learning perception. The robot is coordinating its body well enough for a person to work through it in a live shop. That is the platform on which Persona intends to collect expert demonstrations.

<div class="rc-mark" id="sec-loop" data-num="6" data-panel="loop" data-view="loop" data-title="Teleoperation is the data path"></div>

## Expert demonstrations teach the skill Persona wants to sell

Teleoperation connects the current machine to the proposed autonomous worker. An expert performs the job through the robot, producing demonstrations on its actual hardware. The recordings contain the tool motions and the shop conditions that the learned skill will encounter, including arc light, smoke and uneven floors. Persona plans to advance autonomy one task at a time. The IEEE account anticipates tens of thousands of hours of expert demonstrations, alongside high-fidelity simulation and real-world testing.

I like how directly that data connects to the paid job. Figure pretrains on human video. Generalist records people using hand-held grippers. Physical Intelligence trains across robots and adds practice. Those learning paths are developed in [Three robot bets](/robotics/three-robot-philosophies/). Apptronik collects Apollo fleet data at Robot Park with Google DeepMind; Agility operates in live logistics, where totes moved provide a scoreboard; 1X wants NEO learning in homes. Persona wants expert welders teaching the machine at the worksite.

The conversion from expert driving to autonomous welding remains the technical risk. Persona says general humanoid autonomy is "further off than the headlines suggest". If each weld continues to require an expert driver, the business stays a teleoperation service. The learning system has to capture enough of the expert's skill for the robot to complete the work on its own.

<div class="rc-mark" id="sec-score" data-num="9" data-panel="score" data-view="score" data-title="The production milestones"></div>

## A production shift is the next useful standard

The public record described here reaches a teleoperated weld, industrial development agreements, reported Gen 3 hardware and $65.4 million sold toward an approximately $142 million offering. Autonomous welding, full-shift operation, hundreds of units at one site, pricing and margins remain unpublished in these sources.

Persona's teleoperation lead says the team optimizes for repeatability and usability, including the two-hundredth task of a shift. A customer needs the robot to return to the job and do it again as the day goes on. Industrial development becomes a business when that repeated work earns enough to support the machine and its service.

The wider market is still dominated by pilots. The reporting in the source notes attributes roughly 7,000 industrial and professional-service humanoids sold worldwide in 2025 to the International Federation of Robotics, mostly in pilots. That estimate remains second-hand here. The comparison below keeps the companies' deposits, orders, pilots and demonstrated work in their own terms.

| Company | First job | The bet | What is shown today |
| --- | --- | --- | --- |
| **Persona AI** | weld seams in shipyards and steel shops | skilled tool use in work nobody can staff, leased as labor, learned from expert teleoperation | one teleoperated weld in a live shop (July 2026); deals with HD Hyundai, POSCO, SSE and ABS |
| **Agility (Digit)** | move totes in warehouses and factories | measurable ROI in live material handling, deployed now and scaled by fleet software | over 100,000 totes moved at GXO since June 2024; over $300 million in committed multi-year orders for Digit 5 |
| **1X (NEO)** | chores in homes | learn by living with people; a consumer product | NEO in early-access customer homes; $200 deposit orders |
| **Apptronik (Apollo)** | dull, dirty, dangerous factory and warehouse tasks | general-purpose robot with brains from Google DeepMind and manufacturing partners | pilots with Mercedes-Benz and GXO; "Robot Park" data fleets |
| **Tesla (Optimus)** | none named; a Bots business "leveraging our current operations" | self-driving AI and car-scale manufacturing turned into a robot product | a robot "in development"; "we have yet to commercialize Bots" (FY2025 Form 10-K) |
| **Figure** | homes and factories | the body decides what a robot can learn | see [Three robot bets](/robotics/three-robot-philosophies/) |

<div class="rc-mark" id="sec-decide" data-num="10" data-panel="decide" data-view="decide" data-title="What decides this bet"></div>

## Welding gives Persona a customer and a learning target

Persona has chosen a skill whose scarcity holds back industrial output. The customer already knows what another welder would accomplish, and the robot would reach the work through a site built for people using the tools already there. The same job gives Persona expert demonstrations with which to train the machine. This is why I prefer its first job to the other starting points in this comparison.

Radford says the company has been told it should think bigger. Pratt points out that many technical problems are shared across houses and shipyards, and says, "Everybody's got a great team and smart people, and we're all knocking these problems out together." Persona has given those problems a specific customer. Its first job makes progress legible to that buyer.

Watch for a published autonomous weld with trial counts, then for a shift of repeated work. That is how to judge whether Persona is turning expert demonstrations into the additional welding capacity its customers need.

<details>
<summary>Source notes</summary>

**Persona AI, the company.** [Home](https://persona.ai/) (the "labor platform for skilled industrial work", industries, modular platform), [About](https://persona.ai/why-persona/) (Houston, founded 2024, the three co-founders), [First Spark](https://persona.ai/news/robot-welding-in-a-real-industrial-environment/) (July 8, 2026: the ARC Specialties weld; their claim that "what you see is what happened"), [teleoperation](https://persona.ai/teleoperation-preceeds-automony/) (August 6, 2026: the human and robot division of labor, repeatability over demos, "one real task at a time"), [skilled trades](https://persona.ai/news/why-skilled-industrial-labor-is-the-future-of-heavy-industrial-humanoids/) (their summary of the IEEE feature: HD Hyundai, ABS, POSCO, SSE, the 40,000 figure), [Korea](https://persona.ai/news/korea-with-its-strong-manufacturing-base-is-the-benchmark-for-humanoid-commercialization/) (the HD joint development agreement, POSCO invested, Gen 3 on the ground, Ulsan age), [Under Armour](https://persona.ai/news/persona-ai-collaborates-with-under-armour-to-explore-performance-materials-for-humanoid-robotics/) ("this is research, not a product"), [manufacturing hire](https://persona.ai/news/persona-ai-announces-brian-davis-as-head-of-global-manufacturing/) (Amazon Robotics and Dell), [commercial strategy hire](https://persona.ai/news/persona-ai-announces-michael-perry-as-head-of-commercial-strategy/) (Boston Dynamics and DJI), [FCC](https://persona.ai/news/ieee-spectrum-features-persona-ai-amid-fcc-mobile-robot-ruling/) (Radford on auditability and supply chains), [simulations](https://persona.ai/news/simulations-digital-twins-the-commercial-engine-for-physical-ai/) (digital twins of customer sites), [the lease program](https://info.persona.ai/lease-a-humanoid), and the company's [summary of the Biz New Orleans pilot](https://persona.ai/news/biz-new-orleans-persona-ai-humanoid-in-steel-facility/) (SSE: fillet welding, a 5 ft 8 in robot with two arms and two legs that walks stairs and uses the crew's tools, cameras feeding simulation).

**IEEE Spectrum.** Evan Ackerman, [Is Shipyard Welding the Right First Job for Humanoid Robots?](https://spectrum.ieee.org/persona-ai-humanoid-robot-welding) (August 17, 2026; the page title also reads "How Persona AI Makes Humanoids Pay Off In Welding"). This is the source for the founding story, "we were all over the place", "last-mover advantage", "tool use is pretty difficult", "hundreds of kilometers of linear welds per ship", the spars and portholes quote, "top line, not necessarily their bottom line", "even if our robot was more expensive than a human", "we're not thinking big enough", "a lot of the technical problems are the same", "tens of thousands of hours", and the two public partnerships. The same editor's [FCC piece](https://spectrum.ieee.org/fcc-covered-list-mobile-robots) covers the July 2026 ruling.

**Founders.** Radford (NASA Valkyrie program, founder of Nauticus Robotics) and Pratt (IHMC's DARPA Robotics Challenge team, "a couple of years as CTO of Figure") per the IEEE Spectrum feature; the third co-founder is the COO. InnovationMap confirms the roles and the Valkyrie and Nauticus history.

**Funding.** InnovationMap, [February 5, 2025](https://houston.innovationmap.com/personal-ai-robot-funding-2671093712.html) (a Radford interview: "more than $10 million" pre-seed, eight figures, robotics-as-a-service, founded June 2024, delivery in 18 to 24 months). [SEC Form D, Persona AI Inc.](https://www.sec.gov/Archives/edgar/data/2107493/000210749326000002/primary_doc.xml) filed September 14, 2026: offering of $141,964,814, sold $65,363,626, remaining $76,601,188, first sale August 28, 2026, incorporated in Delaware in 2024; based in Houston. RoboHorizon, [December 31, 2025](https://robohorizon.com/en-us/news/2025/12/persona-ai-unveils-humanoid-bot-with-42m-to-weld-in-shipyards) (Gen 1 unveiling, tendon-driven hand, "$42 million in pre-seed funding", office in Pensacola). Asia Business Daily, [December 23, 2025](https://www.asiae.co.kr/en/article/2025122316104579854) (POSCO DX invested $2 million).

**Korea.** Korea Times/Yonhap, [March 23, 2026](https://www.koreatimes.co.kr/amp/business/companies/20260323/hd-hyundai-affiliates-partner-to-develop-ai-powered-welding-robots-for-shipyards) (the agreement with HD KSOE and HD Hyundai Robotics, following a May 2025 MoU). Seoul Economic Daily, [September 22, 2026](https://en.sedaily.com/technology/2026/09/22/persona-ai-eyes-energy-construction-after-shipbuilding) (proofs of concept with HD Hyundai and POSCO DX, the $2 million investment, over 330,000 welders short by 2028, 2.1 million unfilled by 2030, Gen 3 this fall, "robots will be commercialized on manufacturing floors two years from now", about 7,000 industrial humanoids sold in 2025 per the IFR). Maekyung, [2026](https://www.mk.co.kr/news/it/12005205) (their summary: Ulsan average age 48.3, yards turning down orders).

**Comparison companies, their own words.** Agility Robotics, [commercial momentum, October 26, 2026](https://agilityrobotics.com/content/agility-robotics-highlights-commercial-momentum-and-growing-enterprise-demand-for-digit-humanoid-robot) (65,000 hours of operation, GXO and the 100,000 totes, the first formal commercial deployment of a humanoid in live operations in June 2024, over $300 million in committed multi-year orders for Digit 5, RoboFab in Salem, the Churchill Capital Corp XI combination). 1X, [About](https://www.1x.tech/about) ("1X bets on the home", NEO as a home robot that "lives and learns among us", early-access homes in 2025 and 2026) and [NEO](https://www.1x.tech/neo) ($200 deposit). Apptronik, [mission](https://apptronik.com/company/our-mission) ("dull, dirty and dangerous tasks" in warehousing and manufacturing) and [press releases](https://apptronik.com/company/press-releases) (Google DeepMind partnership December 2024, the $403 million Series A in March 2025, Jabil, Mercedes-Benz, GXO, and Robot Park in June 2026). Tesla, [FY2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm) (Optimus "a general purpose, autonomous humanoid robot in development", "we have yet to commercialize Bots", "we intend to leverage our current operations").

**The labor numbers.** 82,500 welding jobs a year through 2029 (American Welding Society), the average welder about 55, five retiring for every two arriving, and up to 3.8 million manufacturing jobs by 2033 with 1.9 million unfilled (Deloitte and the Manufacturing Institute) all come from [Biz New Orleans](https://bizneworleans.com/a-groundbreaking-humanoid-robot-pilot-program-is-underway/) on the SSE pilot. The 2.1 million by 2030 and the over 330,000 welders by 2028 come from Persona AI and its commercial strategy head to their post and to Seoul Economic Daily. The roughly 40,000 skilled workers short in North American and Korean shipbuilding is Persona AI's own figure in its summary of the IEEE feature.

**What isn't verified.** The $42 million figure is press-reported (RoboHorizon) and not in a filing, so treat the funding history as: eight-figure pre-seed confirmed by the CEO in February 2025, $65.4 million sold in the current SEC offering, $2 million from POSCO DX. The company calls the July welding unit "Gen 1" in the First Spark post and "Gen 2" in its summary of the IEEE feature, so I say "a Persona humanoid" and leave the generation open. The Fabricator article on SSE was not reachable from here; the shop-floor quotes and SSE numbers (about 75 people, about $30 million of revenue, 300 to 800 tons a month) come from Biz New Orleans and Persona AI's own summary. "Hundreds of robots per location" is Radford describing the customers he wants, not a signed volume. The claim that the weld video is one continuous unmodified take is the company's ("what you see is what happened"). Tesla's website was not reachable from my machine, so the Tesla row rests on the 10-K alone, which does not name a first job or a "factories first" sequence. The salary comparisons ("even if our robot was more expensive than a human") are hypotheticals from the interview, not prices; no price for any of these robots appears in these sources. The labor statistics are industry estimates relayed through interviews and trade press; I did not reach the underlying AWS or Deloitte reports.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
