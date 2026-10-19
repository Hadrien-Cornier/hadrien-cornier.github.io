---
title: 'Q-learning: fill the table, find the route (Codex trial)'
description: 'One recorded cliff-grid run: read the state-action table, replay its updates, and watch future costs reach earlier choices.'
date: '2026-10-18'
draft: true
series: 'Reinforcement learning, Codex trial'
part: 1
layout: essay
thumbnail: '/assets/robotics/rl-codex/thumbnails/part1.png'
thumbnail_alt: 'Expected Bellman maps shrink the worst table difference'
---

<div class="rc" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 2020 1130" data-whole="0 0 2020 1130" data-views='{"world":[40,86,620,464],"table":[700,86,620,464],"readouts":[1360,86,620,464],"update":[40,586,620,464],"credit":[700,586,620,464],"limits":[1372,620,300,250]}' role="img" aria-labelledby="rc1-t rc1-d" xmlns="http://www.w3.org/2000/svg"><title id="rc1-t">Q-learning on a cliff grid: the whole map</title><desc id="rc1-d">Six panels: the grid world, the Q table, the two readouts, one update, credit moving backward along the route, and the limits.</desc><rect class="rc-bg" x="0" y="0" width="2020" height="1130" fill="#fbfbf8"/><text x="40" y="62" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="40" text-anchor="start" fill="#242622" font-weight="700"><tspan x="40" dy="0">Q-learning on a cliff grid: the whole map</tspan></text><g class="rc-panel" id="panel-world" data-panel="world"><rect x="40" y="110" width="620" height="440" fill="#e4eef4"/><path d="M40.9,109.9 Q349.4,109.8 661,108.7 Q657.1,328.1 662.2,547.7 Q352,551.4 38.9,550.6 Q39.9,333.2 42.3,109.5 M37.7,108.8 Q348.4,111.3 658.5,111.6 Q660.6,328.5 658.2,548.6 Q352.1,549.5 38,549.7 Q39.9,331.8 38.2,112 " fill="none" stroke="#242622" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="58" y="93" width="190.5" height="34" fill="#fff"/><path d="M56.6,92.1 Q153.6,94.5 247.4,92.4 Q249.2,111.9 247.8,128.2 Q153.6,127.9 57.8,125.7 Q59.5,111.5 58.3,91.4 M59,93.1 Q151.1,91.4 248.7,92.2 Q249.5,108.2 248.6,127.9 Q154.5,128.5 59.4,128.1 Q56.8,108.6 57.5,92.6 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="72" y="116" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="19" text-anchor="start" fill="#242622" font-weight="700"><tspan x="72" dy="0">1 · The world</tspan></text><g transform="translate(40,110)"><rect x="30" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="75" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="120" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="165" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="210" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="255" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="300" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="345" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="390" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="435" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="480" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="525" y="66" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="30" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="75" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="120" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="165" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="210" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="255" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="300" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="345" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="390" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="435" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="480" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="525" y="111" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="30" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="75" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="120" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="165" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="210" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="255" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="300" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="345" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="390" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="435" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="480" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="525" y="156" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="30" y="201" width="45" height="45" fill="#fff" stroke="#8d9087" stroke-width="1.5"/><rect x="75" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="120" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="165" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="210" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="255" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="300" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="345" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="390" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="435" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="480" y="201" width="45" height="45" fill="#f6e5e0" stroke="#8d9087" stroke-width="1.5"/><rect x="525" y="201" width="45" height="45" fill="#f8f0cf" stroke="#8d9087" stroke-width="1.5"/><text x="52.5" y="230" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="22" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="52.5" dy="0">S</tspan></text><text x="547.5" y="231" font-family="Arial, Helvetica, sans-serif" font-size="24" text-anchor="middle" fill="#8f1d36" font-weight="400"><tspan x="547.5" dy="0">⚑</tspan></text><text x="97.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="97.5" dy="0">✕</tspan></text><text x="142.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="142.5" dy="0">✕</tspan></text><text x="187.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="187.5" dy="0">✕</tspan></text><text x="232.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="232.5" dy="0">✕</tspan></text><text x="277.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="277.5" dy="0">✕</tspan></text><text x="322.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="322.5" dy="0">✕</tspan></text><text x="367.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="367.5" dy="0">✕</tspan></text><text x="412.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="412.5" dy="0">✕</tspan></text><text x="457.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="457.5" dy="0">✕</tspan></text><text x="502.5" y="232" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="502.5" dy="0">✕</tspan></text><path d="M52.5,223.5 L52.5,178.5 L547.5,178.5 L547.5,223.5" fill="none" stroke="#2b6a8e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9"/><text x="310" y="56" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">4 rows × 12 columns = 48 cells</tspan></text><text x="310" y="292" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="310" dy="0">Blue dots: the best route, 13 steps</tspan></text><text x="310" y="326" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">Every step costs −1</tspan></text><text x="310" y="354" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="310" dy="0">Stepping on a ✕ costs −100 and puts you back at S</tspan></text><text x="310" y="394" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">4 moves: up, right, down, left</tspan></text><text x="310" y="424" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="310" dy="0">Rows are counted from the top: S is cell (3, 0).</tspan></text></g></g><g class="rc-panel" id="panel-table" data-panel="table"><rect x="700" y="110" width="620" height="440" fill="#e6f0e1"/><path d="M698.7,109.6 Q1007,108.8 1317.9,109.6 Q1317.6,327.9 1321.7,549.9 Q1012.5,547.3 701.1,551.2 Q697.3,329.9 698.6,110.1 M701.6,109.1 Q1010.4,109.3 1318.2,110.2 Q1321.2,332.8 1317.6,548.1 Q1008.5,549 700.5,550.1 Q697.3,328.9 699.2,111.8 " fill="none" stroke="#242622" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="718" y="93" width="190.5" height="34" fill="#fff"/><path d="M719.3,93.3 Q814.3,93.5 909.7,92.5 Q906.4,110.6 910.1,126.8 Q811.2,126.4 718.3,125.5 Q718.5,112.1 719.3,94.3 M718.6,93.8 Q813.9,94.1 910,93.2 Q908.9,108.9 908.8,127.6 Q814.1,127.9 716.9,126.4 Q718.7,109.7 717.5,91.8 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="732" y="116" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="19" text-anchor="start" fill="#242622" font-weight="700"><tspan x="732" dy="0">2 · The table</tspan></text><g transform="translate(700,110)"><text x="310" y="56" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">Q table: one row per cell, one column per move</tspan></text><rect x="20" y="76" width="140" height="36" fill="#fff"/><path d="M20.7,74.6 Q88.8,76.1 161.4,77.5 Q160.1,95.7 161.6,113.6 Q87.9,111.5 21.2,112.2 Q20.7,92 20.4,75.2 " fill="none" stroke="#242622" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="99" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="90" dy="0">cell s</tspan></text><rect x="160" y="76" width="108" height="36" fill="#fff"/><path d="M160.5,75 Q212.8,77.2 267.7,75.5 Q270.1,95.2 266.6,111.9 Q216.1,109.8 160.9,111.7 Q157.9,92.8 160.9,77.2 " fill="none" stroke="#242622" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="99" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="214" dy="0">up</tspan></text><rect x="268" y="76" width="108" height="36" fill="#fff"/><path d="M267.3,76.6 Q322.5,77.5 376.7,74.4 Q375.9,95.1 374.6,111 Q321.6,113 268.6,112.4 Q268.7,93.5 269.2,75.8 " fill="none" stroke="#242622" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="99" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="322" dy="0">right</tspan></text><rect x="376" y="76" width="108" height="36" fill="#fff"/><path d="M376,75.8 Q428.8,77.6 484.4,76.6 Q485.9,96.2 483.6,112.1 Q431.3,111.8 377.3,112.9 Q377.4,95.2 376.5,76 " fill="none" stroke="#242622" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="99" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="430" dy="0">down</tspan></text><rect x="484" y="76" width="108" height="36" fill="#fff"/><path d="M483.5,75.2 Q540.1,76.1 590.6,74.9 Q593.7,95.6 592.6,113.4 Q535.8,111.7 484.3,110.4 Q482.6,96.2 483.7,76 " fill="none" stroke="#242622" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="99" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="538" dy="0">left</tspan></text><rect x="20" y="115" width="140" height="36" fill="#efefe9"/><path d="M20,114.7 Q90.6,115.7 160.5,114.6 Q160.6,134 160.1,150.4 Q89.8,151.6 19.3,150.6 Q19.6,133.9 19.2,114.3 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="138" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="90" dy="0">(3,0) start</tspan></text><rect x="160" y="115" width="108" height="36" fill="#e6f0e1"/><path d="M160.4,114.3 Q215,115.8 267.7,115.1 Q268.2,132.2 268.5,150.6 Q213.9,150.8 159.3,150.6 Q159.9,133.6 159.3,115.1 " fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="138" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="214" dy="0">−12.25</tspan></text><rect x="268" y="115" width="108" height="36" fill="#fff"/><path d="M268.2,114.7 Q321,115.3 376.7,114.6 Q376.1,132.3 376.6,150.3 Q322.6,150.7 267.3,150.9 Q268.9,134.1 268.1,114.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="138" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="322" dy="0">−112</tspan></text><rect x="376" y="115" width="108" height="36" fill="#fff"/><path d="M375.8,114.8 Q430.2,115.5 483.8,115.7 Q484.7,133.3 483.8,151.4 Q431.1,150.6 375.8,151.3 Q376.3,132.3 376.5,114.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="138" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="430" dy="0">−13.13</tspan></text><rect x="484" y="115" width="108" height="36" fill="#fff"/><path d="M484.4,115.2 Q539.1,114.8 592.3,114.7 Q592.1,132.1 591.7,151.2 Q537.6,150.5 484.5,151.4 Q483,132 483.9,115.1 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="138" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="538" dy="0">−13.13</tspan></text><rect x="20" y="154" width="140" height="36" fill="#efefe9"/><path d="M20.2,154 Q89.8,153.1 159.8,154.6 Q160.2,170.9 159.5,189.3 Q90.4,190.2 20.1,189.6 Q20.5,173.1 19.3,154.3 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="177" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="90" dy="0">(2,0)</tspan></text><rect x="160" y="154" width="108" height="36" fill="#fff"/><path d="M160.1,154.7 Q213.4,154.7 268.6,153.6 Q268.4,172.6 268.4,189.9 Q214.3,190.7 160.8,189.6 Q159.5,172 160.6,154.4 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="177" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="214" dy="0">−12.68</tspan></text><rect x="268" y="154" width="108" height="36" fill="#e6f0e1"/><path d="M268.3,154.1 Q321.7,154.3 376.6,154.7 Q376.3,171.2 376.7,189.5 Q321.4,189.9 268,189.5 Q267.6,171.9 267.3,153.6 " fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="177" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="322" dy="0">−11.36</tspan></text><rect x="376" y="154" width="108" height="36" fill="#fff"/><path d="M376.1,154.4 Q430.5,154.3 484,154 Q484.1,172.1 483.9,190.4 Q430.3,189.4 376.1,189.4 Q376.3,172.9 376,154.4 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="177" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="430" dy="0">−13.11</tspan></text><rect x="484" y="154" width="108" height="36" fill="#fff"/><path d="M484.8,154.7 Q537.9,154.1 592.3,153.6 Q592.7,171.5 592,190.7 Q537.4,190.8 483.3,189.7 Q483.1,171.5 483.3,154 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="177" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="538" dy="0">−12.25</tspan></text><rect x="20" y="193" width="140" height="36" fill="#efefe9"/><path d="M20,192.8 Q90.1,193.5 159.5,192.6 Q159.6,209.9 159.6,228.4 Q89.6,228.3 20.3,229.2 Q20.5,210.1 19.6,192.9 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="216" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="90" dy="0">(2,1)</tspan></text><rect x="160" y="193" width="108" height="36" fill="#fff"/><path d="M160.8,193.1 Q213.6,192 268.4,193.7 Q267.3,211.2 268.4,228.3 Q213,229.7 159.5,228.6 Q161,210.9 160.1,193.1 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="216" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="214" dy="0">−12.11</tspan></text><rect x="268" y="193" width="108" height="36" fill="#e6f0e1"/><path d="M267.4,192.6 Q322,193.9 375.9,192.6 Q376.1,211.5 376.5,228.9 Q322,229.7 267.3,229 Q267,211.8 267.2,193.2 " fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="216" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="322" dy="0">−10.47</tspan></text><rect x="376" y="193" width="108" height="36" fill="#fff"/><path d="M375.7,193.8 Q430.4,193.4 484.2,193.4 Q484.7,210 484.4,228.8 Q429.7,228.3 376.2,229.5 Q375.6,210.8 376.4,193.7 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="216" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="430" dy="0">−112</tspan></text><rect x="484" y="193" width="108" height="36" fill="#fff"/><path d="M483.3,193.2 Q538.5,192.2 591.7,193.8 Q592.1,212 591.6,229.1 Q537.5,228.9 483.9,228.4 Q484.7,211.6 484.4,193.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="216" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="538" dy="0">−12.25</tspan></text><rect x="20" y="232" width="140" height="36" fill="#efefe9"/><path d="M20.4,232.4 Q90,232 159.4,232 Q159.3,249.2 159.3,268.8 Q89.6,268.6 19.3,267.3 Q20.6,250.5 19.2,231.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="255" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="90" dy="0">(2,5)</tspan></text><rect x="160" y="232" width="108" height="36" fill="#fff"/><path d="M160.1,232.6 Q213,232.3 268.8,231.5 Q267.8,249.8 268,268.6 Q213.3,268.9 160.7,268.1 Q160.7,249.9 159.5,231.8 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="255" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="214" dy="0">−8.65</tspan></text><rect x="268" y="232" width="108" height="36" fill="#e6f0e1"/><path d="M268.6,232.6 Q321,232.4 375.8,231.4 Q376.7,250.1 376.7,267.3 Q322.4,268.3 267.7,267.5 Q268.5,250 267.5,232 " fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="255" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="322" dy="0">−6.79</tspan></text><rect x="376" y="232" width="108" height="36" fill="#fff"/><path d="M376.3,231.6 Q429.5,231.8 483.8,232 Q485,250.9 484.1,267.2 Q429.7,268.1 376.3,268.4 Q375.6,251 376.1,231.9 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="255" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="430" dy="0">−112</tspan></text><rect x="484" y="232" width="108" height="36" fill="#fff"/><path d="M483.8,232.8 Q536.9,231.5 591.8,232.3 Q592.1,250.8 591.6,268.2 Q538.9,269.1 483.4,268 Q484.7,250 484.7,232.3 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="255" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="538" dy="0">−8.65</tspan></text><rect x="20" y="271" width="140" height="36" fill="#efefe9"/><path d="M20.2,271.8 Q91.1,270.3 159.8,270.3 Q160.1,289.7 160.4,306.7 Q90.7,307.5 20,307.5 Q20.8,289.9 19.7,271.4 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="294" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="90" dy="0">(2,10)</tspan></text><rect x="160" y="271" width="108" height="36" fill="#fff"/><path d="M160.4,270.9 Q214.5,271 267.2,270.8 Q268.7,288.5 268.5,306.3 Q214.7,307.3 160.2,306.5 Q159,288.8 160.3,270.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="294" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="214" dy="0">−3.94</tspan></text><rect x="268" y="271" width="108" height="36" fill="#e6f0e1"/><path d="M268.3,270.6 Q321.5,270.2 376.6,271.4 Q376.3,289 376.2,306.8 Q320.9,307.9 268.1,307.8 Q268.8,289.7 267.3,270.5 " fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="294" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="322" dy="0">−1.99</tspan></text><rect x="376" y="271" width="108" height="36" fill="#fff"/><path d="M376.3,271.4 Q429.4,270.1 483.9,271.7 Q483.8,289 484.6,307.1 Q430.9,306.5 376.7,307.1 Q375.9,289.4 375.4,271.1 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="294" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="430" dy="0">−112</tspan></text><rect x="484" y="271" width="108" height="36" fill="#fff"/><path d="M483.7,270.6 Q537,272 592.6,271.3 Q591.2,289.3 592.4,306.7 Q537.1,306.4 483.2,306.3 Q484.8,287.9 484.2,271.5 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="294" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="538" dy="0">−3.94</tspan></text><rect x="20" y="310" width="140" height="36" fill="#efefe9"/><path d="M20.5,309.6 Q89.3,310.8 159.8,310.7 Q160.4,327.4 160.7,346.6 Q89.4,345 19.7,345.7 Q19.6,329 19.6,309.5 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="90" y="333" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="90" dy="0">(2,11)</tspan></text><rect x="160" y="310" width="108" height="36" fill="#fff"/><path d="M159.6,309.7 Q214.6,309.7 267.9,309.8 Q267.2,328.9 268.3,346.3 Q215,346.6 159.7,346.2 Q161.1,328 160.7,310.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="214" y="333" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="214" dy="0">−2.97</tspan></text><rect x="268" y="310" width="108" height="36" fill="#fff"/><path d="M268.7,309.5 Q321.4,309.5 375.9,310.7 Q375,327.9 376.7,346.3 Q322.7,346.4 267.9,346.4 Q268.5,328.7 268.2,309.2 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="322" y="333" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="322" dy="0">−1.99</tspan></text><rect x="376" y="310" width="108" height="36" fill="#e6f0e1"/><path d="M375.6,310.7 Q429.4,308.9 484.3,309.6 Q483.1,328.2 484,346.2 Q430.7,346.5 376.1,346 Q376.4,328.9 376.4,310.2 " fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="333" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="430" dy="0">−1.00</tspan></text><rect x="484" y="310" width="108" height="36" fill="#fff"/><path d="M484.1,310.1 Q538.3,310.1 592.2,309.4 Q592.4,326.9 592.4,345.9 Q537.9,346.7 484.3,345.5 Q483.8,327.2 484.8,310.1 " fill="none" stroke="#242622" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="538" y="333" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="538" dy="0">−2.97</tspan></text><text x="310" y="372" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#3f7a45" font-weight="700"><tspan x="310" dy="0">Green: the largest number in the row</tspan></text><text x="310" y="400" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="310" dy="0">192 numbers in all. 44 belong to the cliff and the flag and stay 0.</tspan></text><text x="310" y="424" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="310" dy="0">Finished table, update 10,000. A move into the cliff holds about −112.</tspan></text></g></g><g class="rc-panel" id="panel-readouts" data-panel="readouts"><rect x="1360" y="110" width="620" height="440" fill="#f8f0cf"/><path d="M1358.2,112.2 Q1672.7,112 1978.9,111.9 Q1979.2,329.8 1979,548.8 Q1669.4,551.8 1362.2,548.9 Q1361.5,332.1 1361.1,110.6 M1360.6,111 Q1667.6,107 1981.5,110.7 Q1983.1,331.3 1979,549.3 Q1667.1,553.2 1362.2,551.2 Q1358.2,328.5 1360,109.3 " fill="none" stroke="#242622" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="1378" y="93" width="228" height="34" fill="#fff"/><path d="M1376.7,93 Q1494.1,94 1605.3,93.1 Q1604.4,111.4 1606,125.9 Q1490.8,125.7 1379.4,128.4 Q1376.3,110.1 1379.4,94.4 M1378.2,93 Q1492.2,93.3 1605.9,93.2 Q1607.5,111.1 1607.6,128.1 Q1490.8,125.8 1376.9,128 Q1377.3,111.5 1377,92.5 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="1392" y="116" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="19" text-anchor="start" fill="#242622" font-weight="700"><tspan x="1392" dy="0">3 · Two readouts</tspan></text><g transform="translate(1360,110)"><text x="310" y="58" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">Cell (2,1): one row gives two readouts</tspan></text><rect x="40" y="80" width="124" height="74" fill="#fff"/><path d="M40.7,81.6 Q103.4,81.7 164.7,80.8 Q165.9,117.9 163,153.4 Q103.2,156.2 38.5,154 Q39.4,115.4 40.8,81.4 " fill="none" stroke="#242622" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="102" y="104" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="102" dy="0">up</tspan></text><text x="102" y="136" font-family="Arial, Helvetica, sans-serif" font-size="20" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="102" dy="0">−12.11</tspan></text><rect x="174" y="80" width="124" height="74" fill="#e6f0e1"/><path d="M172.9,78.7 Q235.7,81.1 299.5,80.9 Q299.8,118.2 297.6,155.2 Q237.2,155.9 174.5,153 Q174.1,116.3 172.8,81.4 " fill="none" stroke="#242622" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><text x="236" y="104" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="236" dy="0">right</tspan></text><text x="236" y="136" font-family="Arial, Helvetica, sans-serif" font-size="20" text-anchor="middle" fill="#2b6a8e" font-weight="700"><tspan x="236" dy="0">−10.47</tspan></text><rect x="308" y="80" width="124" height="74" fill="#fff"/><path d="M307.6,81.4 Q371.3,81.9 433.5,78.5 Q433.5,116.5 430.6,155.1 Q368.2,152.2 307.7,152.9 Q306.8,118.5 307.1,81.5 " fill="none" stroke="#242622" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="370" y="104" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="370" dy="0">down</tspan></text><text x="370" y="136" font-family="Arial, Helvetica, sans-serif" font-size="20" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="370" dy="0">−112</tspan></text><rect x="442" y="80" width="124" height="74" fill="#fff"/><path d="M441.2,79.7 Q503,78.7 566.5,81.3 Q566.3,118.8 565.5,154.7 Q504,153.2 440.6,154 Q443.4,117.2 440.6,79.3 " fill="none" stroke="#242622" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="504" y="104" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="504" dy="0">left</tspan></text><text x="504" y="136" font-family="Arial, Helvetica, sans-serif" font-size="20" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="504" dy="0">−12.25</tspan></text><text x="310" y="180" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="310" dy="0">Q(s, ·) for s = (2,1), after 10,000 updates</tspan></text><path d="M170,190 Q170.3,217.9 170,246" fill="none" stroke="#2b6a8e" stroke-width="2.2" stroke-linecap="round"/><path d="M165.3,236 L170,246 L174.9,236.1" fill="none" stroke="#2b6a8e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M450,190 Q452.5,217.4 450,246" fill="none" stroke="#b44c2c" stroke-width="2.2" stroke-linecap="round"/><path d="M446.1,235.7 L450,246 L455.6,236.5" fill="none" stroke="#b44c2c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="30" y="248" width="280" height="70" fill="white"/><path d="M31.5,247.4 Q171.1,247.9 308.8,246.6 Q308.7,283.1 310.5,317.7 Q169.3,315.9 31.3,317.3 Q29.1,284.8 28.8,249.4 M28.4,249.5 Q172.1,249.4 311.5,249.3 Q308.4,282.7 310.4,316.4 Q167.9,317.4 29,317.2 Q30.1,281.6 28.9,248 " fill="none" stroke="#2b6a8e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="170" y="278.23999999999995" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="170" dy="0">V<tspan baseline-shift="sub" font-size="75%">Q</tspan>(s) = max<tspan baseline-shift="sub" font-size="75%">a</tspan> Q(s,a)</tspan><tspan x="170" dy="21.25">= −10.47</tspan></text><rect x="330" y="248" width="270" height="70" fill="white"/><path d="M330,247.6 Q463.7,248.5 601.1,248.8 Q600.5,281.1 600,318.8 Q464.1,318 329.8,317.5 Q328.6,283.6 329.3,249 M329.3,246.8 Q466.6,248.8 601.3,246.9 Q598.3,285.1 598.5,318 Q464.4,317.6 328.7,318.9 Q328.8,284.2 330.4,246.8 " fill="none" stroke="#b44c2c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="465" y="278.23999999999995" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="465" dy="0">π<tspan baseline-shift="sub" font-size="75%">Q</tspan>(s) = argmax<tspan baseline-shift="sub" font-size="75%">a</tspan> Q(s,a)</tspan><tspan x="465" dy="21.25">= right  →</tspan></text><text x="170" y="344" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="15" text-anchor="middle" fill="#2b6a8e" font-weight="400"><tspan x="170" dy="0">the number in the grid cell</tspan></text><text x="465" y="344" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="15" text-anchor="middle" fill="#b44c2c" font-weight="400"><tspan x="465" dy="0">the arrow in the grid cell</tspan></text><text x="310" y="384" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="310" dy="0">This cell agrees to two decimals: max Q ≈ max q* ≈ −10.47</tspan></text><text x="310" y="412" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="310" dy="0">Early tables are a guess: at update 2,000 the start cell read −9.73, optimum ≈ −12.25.</tspan></text></g></g><g class="rc-panel" id="panel-update" data-panel="update"><rect x="40" y="610" width="620" height="440" fill="#f6e5e0"/><path d="M41.1,609.9 Q351.6,612.9 658.7,610.2 Q659.1,830.1 660,1050.6 Q352.7,1051.8 39.6,1048.8 Q42.5,827.7 38.5,612.1 M40.4,608.8 Q347.8,608.2 660.9,611.5 Q661.7,829 659.5,1048.3 Q348.4,1047.3 39.2,1050.7 Q38.2,830.6 40.4,611.6 " fill="none" stroke="#242622" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="58" y="593" width="203" height="34" fill="#fff"/><path d="M57,593.4 Q158.9,592.2 259.6,594.5 Q259.3,610.6 262.1,628.1 Q158.5,628.3 58.8,626.3 Q59,611.3 58.1,592 M56.5,594.2 Q159.8,593.3 261.5,594.2 Q260.3,610.7 261.7,626 Q157.7,626.1 57.5,628.5 Q58.8,607.9 58.2,594 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="72" y="616" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="19" text-anchor="start" fill="#242622" font-weight="700"><tspan x="72" dy="0">4 · The update</tspan></text><g transform="translate(40,610)"><text x="310" y="54" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">One update (update 6 of the run)</tspan></text><rect x="24" y="74" width="270" height="74" fill="white"/><path d="M25,74.9 Q160.2,74.6 294.2,73.8 Q295.8,109.8 295.3,147.8 Q157.1,147.3 25.6,147.7 Q22,112.7 23.1,73.3 M23.2,73.2 Q158.7,75.4 294.7,73.6 Q293.8,111.3 292.5,146.8 Q156.9,149.1 25.2,148 Q22.7,110.6 24.6,73.7 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="159" y="106.24000000000001" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="159" dy="0">1. pick a in s</tspan><tspan x="159" dy="21.25">start cell, move left</tspan></text><rect x="326" y="74" width="270" height="74" fill="white"/><path d="M327,73 Q459,73.6 595.7,73.4 Q596.7,112.4 595.4,149 Q461.7,149.6 327.4,149.1 Q324.8,111.1 327.1,75.4 M325.2,75.5 Q461.6,73.2 597,72.8 Q597.1,111.3 596.1,148.2 Q461.2,148.5 325.1,149 Q323.8,110.5 325,75.4 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="461" y="106.24000000000001" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="461" dy="0">2. take a: r = −1</tspan><tspan x="461" dy="21.25">s′ = start (wall)</tspan></text><rect x="326" y="190" width="270" height="84" fill="#f6e5e0"/><path d="M326.3,191.6 Q461,189.9 596.1,191.5 Q596.2,232.3 595.8,272.7 Q463,271.8 324.9,275.4 Q323.9,233.7 326.9,191 M326.3,190.1 Q461.4,188.4 595.8,191.5 Q597,231 596.3,275.1 Q459,272.2 324.6,274.5 Q327.7,230.4 326.5,190.8 " fill="none" stroke="#b44c2c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="461" y="218.05" font-family="Arial, Helvetica, sans-serif" font-size="15.5" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="461" dy="0">3. target = r + γ max Q(s′,·)</tspan><tspan x="461" dy="19.375">−1 + 0.99 × (−0.5)</tspan><tspan x="461" dy="19.375">= −1.495</tspan></text><rect x="24" y="190" width="270" height="84" fill="#e4eef4"/><path d="M24.9,189.3 Q159.2,189.2 293.5,190.3 Q295.9,232.6 294.1,274.2 Q159.3,271.8 23.2,274.2 Q25.7,234 23.4,191.1 M24,189.6 Q159.1,188.3 292.8,191.3 Q295.6,231.3 294.3,272.5 Q157,275 24.6,275.4 Q25.8,232.3 22.9,190.1 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="159" y="218.05" font-family="Arial, Helvetica, sans-serif" font-size="15.5" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="159" dy="0">4. Q ← Q + α (target − Q)</tspan><tspan x="159" dy="19.375">−0.5 + 0.5 × (−1.495 − (−0.5))</tspan><tspan x="159" dy="19.375">= −0.9975</tspan></text><path d="M296,110 Q307.6,110.7 324,110" fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round"/><path d="M314.3,115.2 L324,110 L313.9,105.7" fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M461,150 Q461.5,170.4 461,188" fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round"/><path d="M456.5,178 L461,188 L466.1,178.2" fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M324,232 Q308.1,233 296,232" fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round"/><path d="M306.3,228 L296,232 L305.5,237.5" fill="none" stroke="#242622" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M159,188 Q159.9,171.8 159,152" fill="none" stroke="#656b62" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="6 6"/><path d="M164.2,161.7 L159,152 L154.7,162.1" fill="none" stroke="#656b62" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="310" y="316" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">Then s ← s′ and the loop repeats.</tspan></text><text x="310" y="350" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="700"><tspan x="310" dy="0">γ = 0.99, α = 0.5, ε = 0.1</tspan></text><text x="310" y="384" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400"><tspan x="310" dy="0">At the flag: target = r, nothing follows.</tspan></text><text x="310" y="422" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400"><tspan x="310" dy="0">The −50 in the row of s′ is ignored: a larger number sits beside it.</tspan></text></g></g><g class="rc-panel" id="panel-credit" data-panel="credit"><rect x="700" y="610" width="620" height="440" fill="#e4eef4"/><path d="M700.9,609.4 Q1007.7,607.1 1318.4,609.2 Q1322.5,831.5 1320.7,1050.4 Q1010.6,1052.9 701.2,1048.1 Q698.6,828.3 699.4,612.3 M699.1,608.1 Q1011.1,607.4 1317.6,610.1 Q1317.4,830.4 1320,1052.2 Q1012.7,1053.2 700.3,1049.8 Q701.3,827.4 698.5,609.6 " fill="none" stroke="#242622" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="718" y="593" width="340.5" height="34" fill="#fff"/><path d="M718.1,591.7 Q888.3,593.4 1059,594.5 Q1060.4,609.7 1058.2,628.4 Q890.1,626.5 717,626 Q718.3,609.8 718.6,594.4 M716.7,592.8 Q888.9,593.4 1058.6,591.5 Q1057.6,611.4 1059.4,628.1 Q887.1,624.9 717.4,626.9 Q719.5,610.3 718,593.6 " fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="732" y="616" font-family="'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive" font-size="19" text-anchor="start" fill="#242622" font-weight="700"><tspan x="732" dy="0">5 · Credit moves backward</tspan></text><g transform="translate(700,610)"><desc>Recorded update 19 changes the right entry in cell (2,0) from zero to minus 0.5, lowering its row maximum to minus 0.5. Update 24 in neighboring cell (2,1) reads that maximum for a move left, producing target minus 1.495 and new value minus 0.7475. The smaller strip compares the calculated values at the optimum.</desc><text x="310" y="48" font-family="Arial, Helvetica, sans-serif" font-size="20" text-anchor="middle" fill="#242622" font-weight="700">Recorded updates: 19 writes, 24 reads</text><rect x="25" y="72" width="250" height="110" rx="3" fill="#d7e5ee" stroke="#242622" stroke-width="1.8"/><text x="150.0" y="133.0" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="700"></text><rect x="345" y="72" width="250" height="110" rx="3" fill="#fff" stroke="#242622" stroke-width="1.8"/><text x="470.0" y="133.0" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="700"></text><text x="150" y="98" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="700">19 · cell (2,0)</text><text x="150" y="131" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#242622" font-weight="400">Q(right): 0 → −0.5</text><text x="150" y="162" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#2b6a8e" font-weight="700">row max: 0 → −0.5</text><text x="470" y="98" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="700">24 · cell (2,1)</text><text x="470" y="131" font-family="Arial, Helvetica, sans-serif" font-size="17" text-anchor="middle" fill="#242622" font-weight="400">move left into (2,0)</text><text x="470" y="162" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#b44c2c" font-weight="700">Q(left): 0 → −0.7475</text><path d="M278,151 L338,151 M329,145 L338,151 L329,157" fill="none" stroke="#2b6a8e" stroke-width="2.5"/><text x="310" y="135" font-family="Arial, Helvetica, sans-serif" font-size="13" text-anchor="middle" fill="#2b6a8e" font-weight="400">reads</text><text x="310" y="217" font-family="Arial, Helvetica, sans-serif" font-size="19" text-anchor="middle" fill="#242622" font-weight="400">target₂₄ = −1 + 0.99 × (−0.5) = −1.495</text><text x="310" y="248" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#242622" font-weight="400">new Q = 0 + 0.5 × (−1.495 − 0) = −0.7475</text><path d="M25,274 L595,274" stroke="#8d9087" stroke-width="1.3"/><text x="310" y="299" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle" fill="#656b62" font-weight="400">Calculated optimum, last three moves</text><text x="310" y="326" font-family="Arial, Helvetica, sans-serif" font-size="22" text-anchor="middle" fill="#2b6a8e" font-weight="700">−2.9701 ← −1.99 ← −1 ← flag</text><text x="310" y="351" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400">Each earlier value = −1 + 0.99 × next value</text><text x="310" y="391" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#242622" font-weight="400">Greedy walk: 1,998 → 13 steps; 1,999 → loop</text><text x="310" y="419" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#656b62" font-weight="400">A good route can appear before its values settle.</text></g></g><g class="rc-panel" id="panel-limits" data-panel="limits"><svg x="1372" y="620" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-q-contract-title"><title id="canvas-q-contract-title">Expected Bellman maps shrink the worst table difference</title><defs><marker id="canvas-q-contract-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="14" y="26">Worst difference between tables</text><path d="M18 47Q150 44 282 48L281 88Q152 91 17 88Z" fill="#d7e5ee" stroke="#242622"/><text x="29" y="73">Start: 2</text><path d="M150 94Q148 105 150 117" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-q-contract-arr)"/><text x="170" y="110">× 0.99</text><path d="M19 126Q152 124 280 127L279 166Q151 168 20 165Z" fill="#d7e5ee" stroke="#242622"/><text x="29" y="151">After one map: ≤ 1.98</text><path d="M150 172Q152 184 150 195" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-q-contract-arr)"/><text x="170" y="188">× 0.99</text><text x="23" y="225">After two maps: ≤ 1.9602</text></g></svg></g><path d="M670,330 Q685.5,329.6 698,330" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round"/><path d="M688,334.5 L698,330 L688.2,324.9" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1330,330 Q1341.9,332 1358,330" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round"/><path d="M1348.8,336 L1358,330 L1347.6,326.5" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1690,570 Q1688.5,587.3 1690,606" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round"/><path d="M1684.4,596.5 L1690,606 L1694,595.7" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1330,830 Q1346.2,827.5 1358,830" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round"/><path d="M1347.3,832.7 L1358,830 L1349.3,823.3" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M670,830 Q685.1,831.5 698,830" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round"/><path d="M688.7,835.9 L698,830 L687.6,826.4" fill="none" stroke="#8f1d36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>
<div class="rc-body">

A move costs one point, a fall costs a hundred, and the goal lies beyond a cliff. How do earlier choices learn about those later costs? Q-learning stores an estimated discounted return for each cell and move, then updates it from a transition. We will read the table, work one update and check what a successful route still leaves wrong. [Sutton and Barto, §6.5](http://incompleteideas.net/book/RLbook2020.pdf).

<link rel="stylesheet" href="/assets/robotics/rl-codex/series.css">

**Codex trial · Part 1.** [Part 0: why these methods exist](/robotics/rl-0-overview-codex/). The pinned drawing follows the explanation; the replay shows one recorded run.

**Reading goal:** read one table row, calculate the update from −0.5 to −0.9975, then distinguish a good route from a converged table.

<nav class="rc-route" aria-label="Reading route"><b>Route</b> <a href="#sec-world" data-go="sec-world">World</a><span>&rarr;</span><a href="#sec-table" data-go="sec-table">Table</a><span>&rarr;</span><a href="#sec-readouts" data-go="sec-readouts">Readouts</a><span>&rarr;</span><a href="#sec-update" data-go="sec-update">Update</a><span>&rarr;</span><a href="#sec-credit" data-go="sec-credit">Credit</a><span>&rarr;</span><a href="#sec-limits" data-go="sec-limits">Limits</a></nav>

<div class="rc-mark" id="sec-world" data-panel="world" data-view="world" data-title="The world"></div>

## The world

We need a precise task before a table entry can mean anything. This recorded game uses a grid of 4 rows and 12 columns. The symbol $r$ below means the immediate reward. The start is bottom left, the flag is bottom right, and the cells between them are a cliff.

<div class="ct">

| Item | Value |
| --- | --- |
| Cells | 48: 37 nonterminal decision states, 10 cliff cells, 1 terminal flag |
| Moves | up, right, down, left |
| Reward $r$ | −1 per step, −100 for a cliff step (back to the start) |
| Table | 48 × 4 = 192 numbers, all 0 at the start |

</div>

<div class="rc-mark" id="sec-table" data-panel="table" data-view="table" data-title="The table"></div>

## The table

Each row is a **state** $s$; each column is an **action** $a$. Let $Q(s,a)$ be the estimated discounted return after that move. Here are the 13 cells on the finished route, from one recorded run. The data and settings drawer below identifies its source and recording checks. Bold marks the largest $Q(s,a)$ in each row.

<div class="ct">

| Cell (row, column) | Up | Right | Down | Left |
| --- | ---: | ---: | ---: | ---: |
| Start (3, 0) | **−12.25** | −112.13 | −13.13 | −13.13 |
| (2, 0) | −12.68 | **−11.36** | −13.11 | −12.25 |
| (2, 1) | −12.11 | **−10.47** | −112.12 | −12.25 |
| (2, 2) | −11.35 | **−9.56** | −112.12 | −11.36 |
| (2, 3) | −10.45 | **−8.65** | −112.13 | −10.47 |
| (2, 4) | −9.56 | **−7.73** | −112.10 | −9.56 |
| (2, 5) | −8.65 | **−6.79** | −112.13 | −8.65 |
| (2, 6) | −7.72 | **−5.85** | −112.10 | −7.73 |
| (2, 7) | −6.79 | **−4.90** | −112.12 | −6.79 |
| (2, 8) | −5.85 | **−3.94** | −112.12 | −5.85 |
| (2, 9) | −4.90 | **−2.97** | −112.11 | −4.90 |
| (2, 10) | −3.94 | **−1.99** | −111.99 | −3.94 |
| (2, 11) | −2.97 | −1.99 | **−1.00** | −2.97 |

</div>

Coordinates count from the top left. Read downward to follow the route: up, eleven rights, then down to the flag. Less negative is better. Values are rounded to two decimals.

Drag the replay slider to watch the same table change, or step one update at a time.

<div class="qt-widget"></div>

<div class="rc-mark" id="sec-readouts" data-panel="readouts" data-view="readouts" data-title="Two readouts"></div>

## Two readouts of one table

The robot needs both a prediction and a choice. At the start, the table says up is worth −12.25 and right is worth −112.13. Its value readout is −12.25; its action readout is up.

Read $Q(s,a)$ as the learned score for action $a$ in state $s$. The readout $V_Q(s)$ keeps the largest score; the policy $\pi_Q(s)$ keeps its action. The operator $\max$ returns a number, while $\arg\max$ returns an action, with a fixed rule for ties. A star marks the optimal quantities: $q_*$ is the optimal action value, $v_*$ the optimal state value and $\pi_*$ an optimal action choice. A subscript $Q$ means a readout of the current learned table; it need not be optimal.

$$\begin{aligned} V_Q(s) &= \max_a Q(s,a) \\ \pi_Q(s) &= \arg\max_a Q(s,a) \end{aligned}$$

<div class="ct">

| Readout | Learned table | At the optimum |
| --- | --- | --- |
| Action values | $Q(s,a)$: score for move $a$ | $q_*(s,a)$ |
| Cell value | $V_Q(s)$: largest score | $v_*(s)$ |
| Policy | $\pi_Q(s)$: its move | $\pi_*(s)$ |

</div>

With $Q=q_*$, these readouts are optimal. A good route can appear before all values settle.

<div class="rc-mark" id="sec-update" data-panel="update" data-view="update" data-title="The update"></div>

## The update

One observed move cannot reveal its entire future. The Bellman equation splits that future into one reward and the next state's value. First, the notation: a vertical bar in an expectation means conditioning on the observed state and action, and $\leftarrow$ means replacing the old entry. $\varepsilon=0.1$ is the probability of a uniformly random exploratory move.

<div class="ct">

| Symbol | Meaning |
| --- | --- |
| $s$, $a$ | Current cell and move; random variables $S_t$, $A_t$ at time $t$ |
| $r$, $s'$ | The reward and the next cell ($R_{t+1}$, $S_{t+1}$) |
| $a'$ | Any move in the next cell |
| $\gamma = 0.99$ | Discount: later rewards count a little less |
| $\alpha = 0.5$ | Step size: how far $Q$ moves toward the target |
| $\mathbb{E}$ | Average over what the world does. This grid has no randomness, so it is the one outcome. |
| Flag reached | Nothing follows: target = $r$ |

</div>


<div class="eq-label">Bellman optimality equation <span>Sutton and Barto, Eq. 3.20</span></div>

$$\begin{aligned} q_*(s,a) = \mathbb{E}\Big[\,&R_{t+1} + \gamma \max_{a'} q_*(S_{t+1}, a') \\ &\Big|\; S_t = s,\ A_t = a\Big] \end{aligned}$$

<div class="eq-label">Q-learning update <span>Watkins 1989; Sutton and Barto, Eq. 6.8</span></div>

$$\begin{aligned} Q(s,a) \leftarrow Q(s,a) + \alpha\,\Big[\,&\underbrace{r + \gamma \max_{a'} Q(s',a')}_{\text{target}} \\ &- Q(s,a)\Big] \end{aligned}$$

The target replaces the Bellman equation's average with one observed transition and its future value with current $Q$. Learning from that estimate is **bootstrapping**.

On panel 4, update 6 hits the wall: target $-1+0.99(-0.5)=-1.495$. Step size 0.5 moves the old −0.5 halfway there, to −0.9975.

<div class="algo">
<div class="algo-title">Q-learning, as in the recorded run (ε = 0.1, α = 0.5, γ = 0.99)</div>
<ol>
<li>Set Q(s, a) = 0 for every cell s and move a. Set s = start cell.</li>
<li>Repeat for 10,000 updates:</li>
<li class="i1">With probability ε pick a random move a. Otherwise pick a = argmax Q(s, ·), the first on a tie.</li>
<li class="i1">Take a. Observe r and s′. A fall gives r = −100 and s′ = start.</li>
<li class="i1">If s′ is the flag: target = r. Otherwise: target = r + γ · max Q(s′, ·).</li>
<li class="i1">Q(s, a) ← Q(s, a) + α · (target − Q(s, a))</li>
<li class="i1">Set s = s′. After the flag, or after 200 steps, restart at the start cell.</li>
</ol>
</div>

<details>
<summary>Two real updates, 5 and 6</summary>

Does a fall and a wall collision teach the same thing? Read both columns with the same rule: reward plus discounted next-row maximum, then move the old entry halfway toward that target. Here $r$ is reward, $s'$ the next cell and $Q$ the updated action value. These columns come from the seed-202 update log described in the data drawer.

<div class="ct">

| | Update 5 | Update 6 |
| --- | --- | --- |
| Move | start, right (cliff) | start, left (wall) |
| $r$ | −100 | −1 |
| Largest in row of $s'$ | 0 | −0.5 |
| Target | −100 | −1.495 |
| $Q$, old → new | 0 → −50 | −0.5 → −0.9975 |

</div>

Update 6 is drawn on panel 4 of the canvas.

</details>

<div class="rc-mark" id="sec-credit" data-panel="credit" data-view="credit" data-title="Credit moves backward"></div>

## Credit travels backward

How does a cost at one cell reach a choice made before arrival? At update 19, cell (2,0)'s last zero entry falls, making its row maximum −0.5. At update 24, the left move from (2,1) reads that changed maximum. Let $\text{target}_{24}$ denote this update's target; a cell pair in $Q$ is a row-column coordinate followed by its action. These numbers come from the recorded update log:

$$\begin{aligned}
\text{target}_{24} &= -1 + 0.99(-0.5) = -1.495 \\
Q((2,1),\text{left}) &\leftarrow 0 + 0.5(-1.495 - 0) = -0.7475
\end{aligned}$$

The target now includes a cost after arrival in (2,0). Repeated backups carry later costs into earlier choices.

<details>
<summary>Compare with the settled route</summary>

This check asks what repeated backups would produce after values settle. Every move costs −1, including entry to the flag. Hold the discount at 0.99 and start from terminal value zero, then work backward:

| Move | Calculated target |
| --- | --- |
| (2,11), down to flag | $-1$ |
| (2,10), right | $-1 + 0.99(-1) = -1.99$ |
| (2,9), right | $-1 + 0.99(-1.99) = -2.9701$ |

These are calculated optimal values, rather than recorded learning updates. The smaller strip on panel 5 shows this recurrence. A cliff move inherits the restart cost: $-100 + 0.99(-12.2479) \approx -112.13$.

</details>

Training explores on one move in ten. A **greedy walk** freezes the current table and follows its favorite moves, with no exploration. Those two walks can disagree:

<div class="ct">

| After update | Route cells with error $<10^{-6}$ (of 13) | $V_Q$(start) | Greedy walk $\pi_Q$ |
| --- | ---: | ---: | --- |
| 185 | 0 | −2.45 | No flag; exploratory training first reaches it here. |
| 1,000 | 0 | −5.36 | No flag |
| 1,670 | 0 | −8.42 | Flag in 17 steps (first time) |
| 1,998 | 1 | −9.73 | Flag in 13 steps (first time) |
| 1,999 | 1 | −9.73 | Loops (2,0) ↔ (1,0): Q(2,0,right) fell below Q(2,0,up) |
| 2,000 | 1 | −9.73 | Loops (2,0) ↔ (1,0) |
| 3,000 | 10 | −12.25 | Flag in 13 steps |
| 10,000 | 13 | −12.25 | Flag in 13 steps |

</div>

The count compares learned row maxima with value iteration: absolute error $<10^{-6}$. Its start reference is −12.2479 (rounded). At 10,000 updates, 33 of 37 decision states favor an optimal move; 13 cell values remain off by more than 0.01.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-table-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-table-202-desktop.mp4"></video><figcaption><b>The finished table, walked with no random moves</b>Arrows: the largest number in each cell. Same recorded run as the widget.</figcaption></figure>
</div>

<div class="rc-mark" id="sec-limits" data-panel="limits" data-view="limits" data-title="Limits"></div>

## When it converges

A route can work while other entries remain wrong. The guarantee concerns the entire table after indefinitely many updates. It needs three things: a fixed finite task, continued visits to every pair, and a step size that shrinks without stopping learning.

Let $n$ count all updates, $Q_n$ be the current table and $q_*$ the optimal table. For each state-action pair, $k$ counts its own updates and $\alpha_k$ its step sizes. The first sum below requires unlimited total adjustment; the second limits accumulated squared step size. For example, $\alpha_k=1/(k+1)$ satisfies both. The arrow $\to$ means convergence:

$$\begin{aligned} &\sum_k \alpha_k = \infty, \quad \sum_k \alpha_k^2 < \infty \\ &\Longrightarrow\; Q_n(s,a) \to q_*(s,a) \ \text{with probability 1} \end{aligned}$$

Why is the expected target stable? Let $T_*$ map a whole candidate table to its expected Bellman target. For two candidate tables $q,u$, let $e$ be their largest absolute entrywise difference. Taking a maximum and averaging cannot increase that difference; discounting bounds the new one by $\gamma e$. The drawing applies that bound twice with $\gamma=0.99$.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="q-contract-title"><title id="q-contract-title">Expected Bellman maps shrink the worst table difference</title><defs><marker id="q-contract-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="14" y="26">Worst difference between tables</text><path d="M18 47Q150 44 282 48L281 88Q152 91 17 88Z" fill="#d7e5ee" stroke="#242622"/><text x="29" y="73">Start: 2</text><path d="M150 94Q148 105 150 117" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#q-contract-arr)"/><text x="170" y="110">× 0.99</text><path d="M19 126Q152 124 280 127L279 166Q151 168 20 165Z" fill="#d7e5ee" stroke="#242622"/><text x="29" y="151">After one map: ≤ 1.98</text><path d="M150 172Q152 184 150 195" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#q-contract-arr)"/><text x="170" y="188">× 0.99</text><text x="23" y="225">After two maps: ≤ 1.9602</text></g></svg><figcaption>Expected-map view. Fixed: task and discount. Change: two entire candidate tables. Each arrow contracts their worst difference. The arrows show contraction bounds for the expected maps.</figcaption></figure>

This guarantee assumes:

- **Finite, stationary task.** Finitely many states and actions; fixed Markov reward and transition laws.
- **Bounded rewards.** Finite reward magnitudes and discount $0 \le \gamma < 1$.
- **Repeated updates.** Every nonterminal pair is sampled infinitely often, with step sizes in $[0,1)$ satisfying both sums.

[Watkins and Dayan (1992)](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf), pages 280 to 282, prove this discounted case. The recorded run uses fixed $\alpha=0.5$, outside the guarantee.

## Pros and cons

What should we change when this learner disappoints? A small table makes individual predictions inspectable, but three separate problems remain: exploration can cost rewards, the table can outgrow available experience, and noisy maxima can overvalue a choice. The links below lead to a method addressing each mechanism; the run counts refer to the data drawer, not a general performance ranking.

**Pros**

- **No model.** Learn from moves and results.
- **Immediate updates.** Learn every step, while behavior can include exploration.
- **Readable estimates.** Print the table and inspect what each choice expects.

**Cons and next methods**

- **Exploration costs.** 171 falls in 10,000 updates; 150 came after update 2,000, all on nonfavorite moves. [On-policy targets](/robotics/rl-4-on-policy-and-off-policy-codex/) address this.
- **Table growth.** 37 decision states require 148 action values. [Function approximation](/robotics/rl-3-function-approximation-codex/) shares estimates across situations.
- **Noisy maxima.** Lucky estimates favor worse choices. Double Q separates picking from scoring, costing a second table. Open “Noisy maxima” below.
- **Approximation stability.** Bootstrapping with function approximation and off-policy data can diverge: [the deadly triad in part 5](/robotics/rl-5-the-deadly-triad-codex/).

<details id="mirage-note">
<summary>Noisy maxima: the mirage mechanism and recorded results</summary>

You first choose between two doors. Right ends the episode with reward 0. Left pays 0 now, then offers a choice among ten noisy machines; each pays −0.1 on average and ends the episode. So right is better.

Q-learning backs up the largest machine estimate into the left-door value. One lucky machine estimate can make that door look profitable, even though every machine's true mean is negative.

<div class="ct">

| Illustrative machine row | Current estimates |
| --- | --- |
| Machines 1 to 5 | −0.4, −0.2, **+0.6**, −0.1, +0.2 |
| Machines 6 to 10 | −0.3, +0.1, −0.2, 0, −0.1 |

</div>

These estimates are made up to expose the mechanism. With no discount ($\gamma=1$), the left-door target is $0 + 1(0.6)=0.6$, against right's terminal target of 0. From $Q(\text{left})=0$, step size 0.1 moves the estimate to +0.06.

<div class="algo">
<div class="algo-title">Door targets, for this illustrative machine row</div>
<ol>
<li>Left: target = 0 + max Q(machine state, ·) = 0.6.</li>
<li>Right: target = 0, because the episode ends.</li>
</ol>
</div>

Averaging many noisy maxima tends to run high. Let $i$ index machines and $X_i$ be machine $i$'s noisy estimate. $\mathbb E$ averages over that estimation noise, $\max_i$ takes the largest machine estimate and $\ge$ means at least. Then the inequality says that averaging the biggest estimate gives at least the biggest average estimate:

$$\mathbb{E}\big[\max_i X_i\big] \;\ge\; \max_i \mathbb{E}[X_i]$$

For unbiased machine estimates, the right side is −0.1; selecting their maximum can raise the left side. This is maximization bias (Sutton and Barto, Example 6.7).

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="mirage-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/mirage-202-desktop.mp4"></video><figcaption><b>The worse door wins at first, then loses</b>Labels: each door's share of episodes so far. One recorded run.</figcaption></figure>
</div>

<div class="ct">

| Averaged over 300 runs | Left door |
| --- | ---: |
| Share of episodes, first tenth | 85.0% |
| Share of episodes, last fifth | 11.3% |
| Share from random moves alone | about 5% |
| Estimate at the end (true value −0.1) | −0.036 |

</div>

The late left share remains above the random-choice baseline, so the worse door is chosen more often than exploration alone requires. Its final estimate also remains too high. The source drawer gives the settings and the limit on attributing the measured effect.

</details>

Continue with [part 2, bootstrapping](/robotics/rl-2-bootstrapping-codex/), which isolates how quickly a late reward reaches earlier choices. Or return to [the method map](/robotics/rl-0-overview-codex/) to choose another question.

<details>
<summary>Source checks</summary>

This note checks the theory used in the explanation; the next drawer identifies the recorded measurements. Here $t$ indexes time, $R_{t+1}$ is its next reward and a star marks an optimal value. The source's $x$ and $a$ mean state and action. Equation and section numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf). Watkins and Dayan is [*Q-learning*](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf), Machine Learning 8, pages 279 to 292, which I read as page images.

- **Notation.** The book writes the reward after step $t$ as $R_{t+1}$. The update is Eq. 6.8, and $q_*$ is defined in Section 3.6 with Eq. 3.17 and Eq. 3.20.
- **Greedy readouts.** Watkins and Dayan, pages 280 to 281: $V^*(x) = \max_a Q^*(x,a)$, and the policy that takes a maximizing action is optimal. Page 281 says early Q values may not reflect the policy they define.
- **Convergence.** Pages 280 to 282 set up a finite Markov task with fixed transition and reward laws, discount below 1, table representation, bounded rewards, repeated sampling and the per-pair step-size conditions. Section 4 treats the undiscounted absorbing extension separately. I did not read the 1989 thesis.
- **Maximization bias.** Sections 6.7 and Example 6.7. In the book the left action leads to many choices with mean −0.1. The game uses ten.

</details>

<details>
<summary>The recorded run: data, settings, command</summary>

The visible route and checkpoints describe one finite run. They establish what this seed did, rather than a general success rate. The widget shows that run, re-run so that its intermediate tables exist. The game's saved runs hold only the final table.

- **Source.** [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), a small game I made, at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73). I imported its `RLA.run` unchanged and wrapped the learner in a separate script only to record each update.
- **Settings.** World `cliff` (4 by 12, step cost 1, fall cost 100, no slip), table, step size 0.5, discount 0.99, one random move in ten, 10,000 steps, seed 202. These are the game's `careful-q` settings. The learner acts, takes the step, then updates, as in the algorithm above.
- **Check.** The final table equals the saved table of the recorded seed-202 run in all 192 entries.
- **Propagation example.** Updates 19 and 24 above are read from the existing replay data in `qtable-data.js`, with the intervening entries replayed from zero. No new experiment was run.
- **Recorded.** Full tables after updates 0, 1, 5, 20, 100, 185, 300, 1,000, 1,670, 2,000, 3,000 and 10,000, and every update from 1 to 10,000. The widget replays updates 1 to 400 and shows four later snapshots.
- **Command.** `SEED=202 node pilot-v2/snapshots.js > pilot-v2/snapshots-seed202.json`, then `node pilot-v2/make-widget-data.js`. Every number in the checkpoint table comes from replaying the full update log (`pilot-v3/verify_numbers.js`). Reference values come from value iteration (5,000 sweeps, discount 0.99). Route-cell counts compare row maxima with absolute error < 1e-6, using the full-precision log and reference, rather than the rounded widget asset.
- **Greedy walk.** It breaks ties in the order up, right, down, left, uses no random numbers, and stops after 40 steps. At 185 updates it never reaches the flag.
- **Falls.** Replaying the log shows 4 falls were the table's own favorite move, all early. The other 167 were other moves, including all 150 after update 2,000 (`pilot-v3/check_falls.js`).

The finished table, all 37 nonterminal decision states, is below. Cells are (row, column), rows counted from the top. The last column is the value-iteration reference, rounded to two decimals.

| Cell | Up | Right | Down | Left | Optimal reference |
| --- | ---: | ---: | ---: | ---: | ---: |
| (0, 0) | -11.69 | -11.58 | -11.64 | **-11.47** | -13.13 |
| (0, 1) | **-11.22** | -11.25 | -11.31 | -11.31 | -12.25 |
| (0, 2) | -10.97 | **-10.59** | -10.75 | -11.19 | -11.36 |
| (0, 3) | **-9.78** | -9.81 | -10.06 | -10.78 | -10.47 |
| (0, 4) | -9.33 | -9.06 | **-9.03** | -9.23 | -9.56 |
| (0, 5) | -8.46 | **-8.30** | -8.41 | -8.76 | -8.65 |
| (0, 6) | -7.90 | **-7.48** | -7.59 | -8.20 | -7.73 |
| (0, 7) | -6.66 | **-6.62** | -6.67 | -7.38 | -6.79 |
| (0, 8) | -6.25 | **-5.74** | -5.77 | -5.76 | -5.85 |
| (0, 9) | -4.87 | -4.84 | **-4.83** | -5.59 | -4.90 |
| (0, 10) | -3.93 | **-3.91** | -3.92 | -4.18 | -3.94 |
| (0, 11) | -3.45 | -3.57 | **-2.97** | -3.56 | -2.97 |
| (1, 0) | **-11.95** | -12.04 | -12.02 | -12.15 | -12.25 |
| (1, 1) | -11.62 | -11.32 | **-11.30** | -11.90 | -11.36 |
| (1, 2) | -10.73 | **-10.46** | -10.46 | -10.67 | -10.47 |
| (1, 3) | -10.26 | **-9.56** | -9.56 | -9.79 | -9.56 |
| (1, 4) | -9.20 | **-8.65** | -8.65 | -9.48 | -8.65 |
| (1, 5) | -8.59 | -7.73 | **-7.73** | -8.28 | -7.73 |
| (1, 6) | -8.10 | **-6.79** | -6.79 | -8.14 | -6.79 |
| (1, 7) | -6.91 | -5.85 | **-5.85** | -6.80 | -5.85 |
| (1, 8) | -5.57 | -4.90 | **-4.90** | -5.08 | -4.90 |
| (1, 9) | -5.07 | **-3.94** | -3.94 | -5.56 | -3.94 |
| (1, 10) | -3.70 | -2.97 | **-2.97** | -4.63 | -2.97 |
| (1, 11) | -2.08 | -2.48 | **-1.99** | -2.67 | -1.99 |
| (2, 0) | -12.68 | **-11.36** | -13.11 | -12.25 | -11.36 |
| (2, 1) | -12.11 | **-10.47** | -112.12 | -12.25 | -10.47 |
| (2, 2) | -11.35 | **-9.56** | -112.12 | -11.36 | -9.56 |
| (2, 3) | -10.45 | **-8.65** | -112.13 | -10.47 | -8.65 |
| (2, 4) | -9.56 | **-7.73** | -112.10 | -9.56 | -7.73 |
| (2, 5) | -8.65 | **-6.79** | -112.13 | -8.65 | -6.79 |
| (2, 6) | -7.72 | **-5.85** | -112.10 | -7.73 | -5.85 |
| (2, 7) | -6.79 | **-4.90** | -112.12 | -6.79 | -4.90 |
| (2, 8) | -5.85 | **-3.94** | -112.12 | -5.85 | -3.94 |
| (2, 9) | -4.90 | **-2.97** | -112.11 | -4.90 | -2.97 |
| (2, 10) | -3.94 | **-1.99** | -111.99 | -3.94 | -1.99 |
| (2, 11) | -2.97 | -1.99 | **-1.00** | -2.97 | -1.00 |
| (3, 0) | **-12.25** | -112.13 | -13.13 | -13.13 | -12.25 |

</details>

<details>
<summary>Exact numbers: mirage and cliff table</summary>

Read these as finite-run measurements, separately from the theoretical examples. Powers such as $10^{-13}$ denote comparison tolerances, not confidence intervals. These are re-runs of settings the game already uses, with its own `RLA.run` at commit 681cae3.

- **Mirage.** Right door reward 0. Left door reward 0, then ten machines with mean −0.1 and standard deviation 1. Table, random moves 0.1, step size 0.1, no discount, 600 steps per run, 300 runs (about 467 episodes each). Left share 85.0% in the first tenth, 11.3% in the last fifth, estimate −0.036 at the end. Random moves alone give about 5%. I did not run a version without the max, so the cause is the book's explanation.
- **Cliff table, twenty runs.** Table, random moves 0.1, step size 0.5, discount 0.99, 10,000 steps. In all 20 runs the start cell held −12.2479 and the greedy walk took 13 steps. The 13 route numbers agreed with value iteration to better than $10^{-13}$. In the 37 decision states, the favorite move matched an optimal move in 34.5 cells on average. I did not examine why the rest differ. The number for a step off the route into the cliff was between −112.13 and −110.2, against an exact −112.13.
- **Seed 202.** 33 of 37 decision states have an optimal favorite move. The four that do not are (0,0), (0,1), (0,3) and (1,0). The largest gap to the exact value over 148 numbers is 2.68. The start cell was updated 767 times, row 2 cells 507 to 739 times, rows 0 and 1 cells 35 to 127 times.

</details>

<details>
<summary>How the clips were made</summary>

The clips illustrate particular runs; their appearance supplies no additional statistical evidence. The data drawers above state what was measured and how the example was selected. Each clip is a real recorded run drawn by a real browser with the game's own `web/scenes.js` at the same commit, unmodified. I replaced only the clock (30 frames per second) and encoded with ffmpeg (H.264). The run script and raw results are stored locally and are not published.

</details>

</div>
</div>

<script src="/assets/robotics/rl/qtable-data.js" defer></script>
<script src="/assets/robotics/rl/qtable.js" defer></script>
<script src="/assets/robotics/rl/rl-videos.js" defer></script>
<script src="/assets/robotics/rl/canvas.js" defer></script>
