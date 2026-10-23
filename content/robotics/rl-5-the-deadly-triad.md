---
title: 'The deadly triad: how a guess can train itself upward'
description: 'Function approximation, bootstrapping and off-policy data each make RL practical. Off-policy value learners such as deep Q-networks (DQN) and soft actor-critic (SAC) use all three, even though together they can let a prediction feed its own target with nothing to pull it back down.'
date: '2026-10-19'
updated: '2026-10-22'
draft: false
series: 'Reinforcement learning'
part: 5
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-5-the-deadly-triad-whole.svg'
thumbnail_alt: 'Two blackboard panels: six methods checked against shared weights, bootstrapping and off-policy data, with only DQN and SAC using all three, and the feedback loop that the three can close'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 1144" data-whole="0 0 680 1144" data-views='{"methods":[24,46,300,220],"feedback":[364,46,300,220],"two-state":[24,326,300,220],"linear-pair":[364,326,300,220],"fixed-labels":[24,606,300,220],"tabular-pair":[364,606,300,220],"dqn":[24,886,300,220],"diagnostics":[364,886,300,220]}' role="img" aria-label="Whole mechanism map. 1: six methods against the three ingredients: all six use shared weights, DQN and SAC also bootstrap and learn off-policy, PPO bootstraps on a fresh batch that it reuses for only a few epochs, GRPO and REINFORCE score whole answers or episodes on fresh data, and RECAP reuses old data but trains its value on complete returns. 2: shared weights, bootstrapping and off-policy data close one loop: an update raises the next value, that value becomes the target, and the correcting update is never sampled. 3: replaying only s1 to s2 multiplies the weight by 1.08 per replay. 4 to 6: drop one ingredient and a stable result returns under its own assumptions: on-policy states keep two predictions 2 apart within 1.8, fixed labels make plain regression, and table entries do not share weights. 7: DQN slows the loop with replay and a frozen target. 8: an estimate crosses the largest possible return while rewards stay zero."><g class="rc-panel" data-panel="methods"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. Who keeps all three?</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Six methods against the three ingredients. All six use shared weights. DQN and SAC also bootstrap and learn off-policy, so they have all three. PPO bootstraps and trains on fresh data from its current policy, reused for a few epochs. GRPO and REINFORCE score whole answers or episodes on fresh data and learn no value from their own guesses. RECAP in pi*0.6 reuses old data but trains its value on complete returns.</title><g font-family="Arial,sans-serif" font-size="15" fill="#242622"><text x="116" y="11" text-anchor="middle" font-size="13" fill="#656b62">function approx.</text><text x="116" y="25" text-anchor="middle" font-size="13" fill="#656b62">shared weights</text><text x="186" y="25" text-anchor="middle" font-size="13" fill="#656b62">bootstrap</text><text x="259" y="25" text-anchor="middle" font-size="13" fill="#656b62">off-policy</text><path d="M4 31H296" stroke="#777" stroke-width="1.5"/><path d="M3 38Q150 35 297 38L297 83Q150 86 3 83Z" fill="none" class="s-yellow" stroke-width="2"/><text x="8" y="52" font-size="15">DQN</text><path d="M113 47L118 52L128 40" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M179 47L184 52L194 40" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M252 47L257 52L267 40" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="8" y="76" font-size="15">SAC</text><path d="M113 71L118 76L128 64" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M179 71L184 76L194 64" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M252 71L257 76L267 64" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="8" y="100" font-size="15">PPO</text><path d="M113 95L118 100L128 88" fill="none" stroke="#242622" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M179 95L184 100L194 88" fill="none" stroke="#242622" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="259" y="100" text-anchor="middle" font-size="13" fill="#656b62">fresh*</text><text x="8" y="124" font-size="15">GRPO</text><path d="M113 119L118 124L128 112" fill="none" stroke="#242622" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="186" y="124" text-anchor="middle" font-size="13" fill="#656b62">returns</text><text x="259" y="124" text-anchor="middle" font-size="13" fill="#656b62">fresh</text><text x="8" y="148" font-size="15">REINFORCE</text><path d="M113 143L118 148L128 136" fill="none" stroke="#242622" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="186" y="148" text-anchor="middle" font-size="13" fill="#656b62">returns</text><text x="259" y="148" text-anchor="middle" font-size="13" fill="#656b62">fresh</text><text x="8" y="172" font-size="14">RECAP (π*0.6)</text><path d="M113 167L118 172L128 160" fill="none" stroke="#242622" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="186" y="172" text-anchor="middle" font-size="13" fill="#656b62">returns</text><path d="M252 167L257 172L267 160" fill="none" stroke="#242622" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="150" y="198" text-anchor="middle" font-size="13" fill="#656b62">returns: no learned value trains on its own guess</text><text x="150" y="214" text-anchor="middle" font-size="13" fill="#656b62">fresh: current policy's data; *reused a few epochs</text></g></svg></g><g class="rc-panel" data-panel="feedback"><rect x="352" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. Three pressures, one loop</text><svg x="364" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>The loop, clockwise: a shared-weight update also raises the next state's value, bootstrapping makes that value the next target, and the higher target raises the update again. The correcting update at the next state is never sampled with off-policy data.</title><defs><marker id="canvas-5-0-p5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="22" text-anchor="middle">shared update</text><path d="M171 31Q264 49 258 93" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-0-p5a)"/><text x="292" y="40" text-anchor="end" font-size="13" fill="#656b62">shared</text><text x="292" y="55" text-anchor="end" font-size="13" fill="#656b62">weights</text><text x="241" y="117" text-anchor="middle">next value</text><text x="241" y="140" text-anchor="middle">rises</text><path d="M227 150Q168 188 101 160" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-0-p5a)"/><text x="164" y="202" text-anchor="middle" font-size="13" fill="#656b62">bootstrapping: it becomes the target</text><text x="66" y="139" text-anchor="middle">target</text><text x="66" y="162" text-anchor="middle">rises</text><path d="M43 115Q27 42 121 30" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-0-p5a)"/><text x="150" y="66" text-anchor="middle" font-size="13" fill="#2b6a8e">correction at s′</text><path d="M151 74V116" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4"/><path d="M139 84L163 106M163 84L139 106" stroke="#b44c2c" stroke-width="3"/><text x="150" y="134" text-anchor="middle" font-size="13" fill="#b44c2c">never sampled:</text><text x="150" y="149" text-anchor="middle" font-size="13" fill="#b44c2c">off-policy data</text></g></svg></g><g class="rc-panel" data-panel="two-state"><rect x="12" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="316">3. Two states, one weight</text><svg x="24" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Only the transition from value w to value two w is replayed; changing w raises both estimates</title><defs><marker id="canvas-5-1-p5b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="65" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="224" cy="65" r="32" fill="#d7e5ee" stroke="#242622"/><text x="55" y="59" text-anchor="middle">s₁</text><text x="55" y="81" text-anchor="middle">w</text><text x="224" y="59" text-anchor="middle">s₂</text><text x="224" y="81" text-anchor="middle">2w</text><path d="M89 65H188" stroke="#b44c2c" stroke-width="3" marker-end="url(#canvas-5-1-p5b)"/><text x="140" y="47" text-anchor="middle">R = 0</text><path d="M214 31C185 -1 284 -1 251 43" fill="none" stroke="#777" stroke-width="2" marker-end="url(#canvas-5-1-p5b)"/><path d="M160 71Q149 133 79 104" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-1-p5b)"/><text x="150" y="146" text-anchor="middle">replay s₁ → s₂ only</text><text x="150" y="175" text-anchor="middle" fill="#b44c2c">w × 1.08 per replay</text><text x="150" y="205" text-anchor="middle">no update starts at s₂</text></g></svg></g><g class="rc-panel" data-panel="linear-pair"><rect x="352" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="316">4. Drop off-policy data</text><svg x="364" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Sample the policy's own states: one projected Bellman step brings two predictions that are 2 apart to at most 1.8 apart when the discount is 0.9. Off-policy sampling breaks this guarantee.</title><defs><marker id="canvas-5-2-p5c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="20" text-anchor="middle" font-size="15" fill="#656b62">sample the policy's own states</text><text x="150" y="50" text-anchor="middle" font-size="15">two predictions, 2 apart</text><circle cx="40" cy="64" r="7" fill="#242622"/><circle cx="260" cy="64" r="7" fill="#242622"/><path d="M49 64H251" stroke="#777" stroke-width="2"/><path d="M44 74L99 126" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-2-p5c)"/><path d="M256 74L201 126" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-2-p5c)"/><text x="150" y="102" text-anchor="middle" font-size="15">one projected</text><text x="150" y="119" text-anchor="middle" font-size="15">Bellman step</text><circle cx="104" cy="137" r="7" fill="#242622"/><circle cx="196" cy="137" r="7" fill="#242622"/><path d="M113 137H187" stroke="#777" stroke-width="2"/><text x="150" y="166" text-anchor="middle" font-size="17">at most 1.8 apart</text><text x="150" y="184" text-anchor="middle" font-size="13" fill="#656b62">γ = 0.9 shrinks the gap</text><text x="150" y="210" text-anchor="middle" font-size="15" fill="#b44c2c">off-policy sampling breaks this</text></g></svg></g><g class="rc-panel" data-panel="fixed-labels"><rect x="12" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="596">5. Drop bootstrapping</text><svg x="24" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Predictions move toward labels held fixed as the weights change</title><defs><marker id="canvas-5-3-p5d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">fixed reward-only labels</text><path d="M32 48H267" stroke="#2b6a8e" stroke-width="2"/><circle cx="60" cy="48" r="6" fill="#2b6a8e"/><circle cx="150" cy="48" r="6" fill="#2b6a8e"/><circle cx="240" cy="48" r="6" fill="#2b6a8e"/><circle cx="60" cy="144" r="6" fill="#b44c2c"/><circle cx="150" cy="120" r="6" fill="#b44c2c"/><circle cx="240" cy="162" r="6" fill="#b44c2c"/><path d="M60 132V63" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-3-p5d)"/><path d="M150 108V63" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-3-p5d)"/><path d="M240 150V63" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-3-p5d)"/><text x="150" y="187" text-anchor="middle">predictions move toward y</text><text x="150" y="212" text-anchor="middle">changing w leaves y fixed</text></g></svg></g><g class="rc-panel" data-panel="tabular-pair"><rect x="352" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="596">6. Drop shared weights</text><svg x="364" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>One table cell takes a backup from the next-state row while all other cells stay fixed</title><defs><marker id="canvas-5-4-p5e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">independent table entries</text><rect x="73" y="42" width="192" height="111" fill="#fff" stroke="#242622"/><path d="M73 79H265M73 116H265M137 42V153M201 42V153" stroke="#777"/><rect x="137" y="79" width="64" height="37" fill="#d7e5ee"/><text x="40" y="104" text-anchor="middle">s</text><text x="40" y="140" text-anchor="middle">s′</text><text x="105" y="140" text-anchor="middle">2</text><text x="169" y="140" text-anchor="middle">5</text><text x="233" y="140" text-anchor="middle">1</text><path d="M169 149Q293 190 287 96Q285 61 203 87" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-4-p5e)"/><text x="150" y="188" text-anchor="middle">max supplies target</text><text x="150" y="213" text-anchor="middle">update one cell only</text></g></svg></g><g class="rc-panel" data-panel="dqn"><rect x="12" y="852" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="876">7. Slow the target feedback</text><svg x="24" y="886" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Replay sends a transition to online and frozen networks; only the online network updates until a periodic copy</title><defs><marker id="canvas-5-5-p5f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">sample a replay transition</text><path d="M125 35L65 70" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-5-p5f)"/><path d="M175 35L235 70" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-5-p5f)"/><rect x="12" y="79" width="116" height="51" fill="#d7e5ee" stroke="#242622"/><rect x="172" y="79" width="116" height="51" fill="#eee" stroke="#242622"/><text x="70" y="100" text-anchor="middle">online θ</text><text x="70" y="121" text-anchor="middle">prediction</text><text x="230" y="100" text-anchor="middle">frozen θ⁻</text><text x="230" y="121" text-anchor="middle">target y</text><path d="M171 145H92" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-5-p5f)"/><text x="157" y="171" text-anchor="middle">update θ only</text><path d="M65 180Q150 218 239 181" fill="none" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#canvas-5-5-p5f)"/><text x="150" y="215" text-anchor="middle">copy θ → θ⁻ periodically</text></g></svg></g><g class="rc-panel" data-panel="diagnostics"><rect x="352" y="852" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="876">8. Check estimates beside rewards</text><svg x="364" y="886" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>The estimate curve crosses a known possible-return bound while zero reward stays flat</title><defs><marker id="canvas-5-6-p5g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><path d="M36 175V24M36 175H284" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-6-p5g)"/><path d="M38 99H283" stroke="#777" stroke-width="2" stroke-dasharray="5 4"/><text x="156" y="88" text-anchor="middle">return bound</text><path d="M38 163C125 160 197 139 262 28" fill="none" stroke="#b44c2c" stroke-width="3"/><text x="165" y="42" text-anchor="middle">estimate ↑</text><path d="M38 172H277" stroke="#2b6a8e" stroke-width="3"/><text x="282" y="164" text-anchor="end" font-size="16" fill="#2b6a8e">reward stays zero</text><text x="160" y="203" text-anchor="middle">updates →</text><text x="19" y="120" transform="rotate(-90 19 120)" text-anchor="middle">value</text></g></svg></g></svg></div></div>
<div class="rc-body">

How can value estimates grow forever when every reward is zero?

**Part 5.** Three ideas make RL practical on big problems. Function approximation, or shared weights, lets one set of weights cover states you've never seen, bootstrapping lets you learn from a guess before an episode ends, and off-policy learning lets you reuse old data. Every method on the first board uses the first idea, but only the deep Q-network (DQN) and soft actor-critic (SAC) use all three, and they stand for a family of off-policy value learners that includes TD3. Shared weights and bootstrapping let a prediction feed its own target, and off-policy data can remove the correction that would pull it back down. Sutton and Barto call the combination the **deadly triad**: it names a risk, not a rule that every combination diverges.

<div class="rc-mark" id="sec-methods" data-panel="methods" data-view="methods" data-title="Who keeps all three?"></div>

## Who keeps all three?

The board checks six methods against their papers. Only DQN and SAC have the whole triad: they replay old data with targets from their own networks, and both slow those targets down. PPO bootstraps on a fresh batch that it reuses for only a few epochs. GRPO and REINFORCE score whole answers or episodes on fresh data and never train a value on their own guesses. RECAP, in Physical Intelligence's π\*0.6, reuses old robot data, but it trains its value on complete returns. Its authors call that value less optimal than an off-policy Q-function, but "simple and highly reliable".

<details><summary>The six methods: what each paper does</summary>

The table follows the variant in each primary paper. All six share weights: a Q-network in DQN, neural networks in SAC and PPO, a language model in GRPO and RLOO, and a vision-language-action model (VLA) with a separate value network in RECAP. Off-policy here has the meaning from [Sutton and Barto, §11.3](http://incompleteideas.net/book/RLbook2020.pdf): training on transitions from a different distribution than the one the target policy produces. Bootstrap here means that a learned value trains toward its own estimates.

<div class="ct ct-words">

| Method | Bootstrap | Off-policy |
| --- | --- | --- |
| [DQN](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf), 2015 | yes, from a frozen copy | yes, replay |
| [SAC](https://arxiv.org/abs/1801.01290), 2018 | yes, from a slow copy | yes, replay |
| [PPO](https://arxiv.org/abs/1707.06347), 2017 | yes, the critic fits λ-returns ($\lambda=0.95$) | almost no: a fresh batch, reused for a few epochs |
| [GRPO](https://arxiv.org/abs/2402.03300), 2024 | no value model | no, fresh samples |
| [REINFORCE](http://incompleteideas.net/book/RLbook2020.pdf), 1992, and RLOO, 2019 ([for language models](https://arxiv.org/abs/2402.14740), 2024) | no, complete returns | no, fresh episodes |
| [RECAP in π\*0.6](https://arxiv.org/abs/2511.14759), 2025 | no for the value, which fits complete returns; the policy's advantage adds that value 50 steps ahead | yes, for the policy |

</div>

- **DQN.** Its paper describes the same loop as the next panel: an update that raises $Q(s_t,a_t)$ often raises the next state's values too, and so the target, "possibly leading to oscillations or divergence of the policy". The frozen copy is its fix, and replay is why it must learn off-policy (Methods).
- **SAC.** Its introduction names the risk: "the combination of off-policy learning and high-dimensional, nonlinear function approximation with neural networks presents a major challenge for stability and convergence". It uses a slowly moving target network and the smaller of two Q-functions (Section 4.2).
- **PPO.** The advantage bootstraps: $\delta_t=r_t+\gamma V(s_{t+1})-V(s_t)$ in the paper's Eq. 12. The paper doesn't say which target the critic fits; the [OpenAI baselines code](https://github.com/openai/baselines/blob/ea25b9e8b234e6ee1bca43083f8f3cf974143998/baselines/ppo2/runner.py) fits it to λ-returns, which contain the critic's own estimates. Each batch gets 10, 15 or 3 epochs in the paper's MuJoCo, Roboschool and Atari settings, and the clipped ratio removes the gain from moving far from the policy that collected it. The critic learns the value of that collecting policy.
- **GRPO.** Algorithm 1 allows several updates on one batch, and then the later updates use slightly stale data. The DeepSeekMath run made "a single update following each exploration stage" (Section 4.2), and a learned reward model scored each answer (Algorithm 1). The paper drops the value model to save memory, and because a per-token value is hard to train when usually only the last token gets a reward. It doesn't mention the triad.
- **REINFORCE and RLOO.** Williams (1992) introduced REINFORCE. It waits for the complete return, so Sutton and Barto call it "a Monte Carlo algorithm" (§13.3). RLOO, a REINFORCE variant from Kool et al. (2019) that Ahmadian et al. (2024) apply to language models, keeps that and compares several samples for the same prompt.
- **RECAP.** Its value predicts the return of the policies behind the data (Section IV-A, Eq. 1), so the value learner itself is on-policy for that data mix. The policy then improves on the same old data by conditioning on the advantage, which adds the learned value 50 steps ahead (Appendix F). That is the step [Part 7](/robotics/rl-7-learning-from-fixed-data/#sec-reward-aware) covers.

</details>

<div class="rc-mark" id="sec-feedback" data-panel="feedback" data-view="feedback" data-title="Three pressures, one loop"></div>

## Three pressures, one loop

Read the loop on the board clockwise. Raising one prediction also raises a successor prediction that shares its weights. That successor supplies the next target, so the next update raises the first prediction again. If no update ever trains the successor, nothing pulls it back down. [Van Hasselt et al., §2](https://arxiv.org/abs/1812.02648).

<div class="rc-mark" id="sec-two-state" data-panel="two-state" data-view="two-state" data-title="Two states, one weight"></div>

## Two states, one weight

Take two states where every reward is zero, so both true values are zero. One weight $w$ and fixed features $\phi(s_1)=1$ and $\phi(s_2)=2$ give the estimates $v_w(s_1)=w$ and $v_w(s_2)=2w$. The policy moves from $s_1$ to $s_2$ and then stays at $s_2$.

Now replay only the transition $s_1\to s_2$, forever. The semi-gradient TD update treats the target as fixed and only moves the current prediction. With temporal-difference error $\delta$ and step size $\alpha$:

$$\begin{aligned}
\delta&=0+\gamma(2w)-w=(2\gamma-1)w,\\
w^+&=w+\alpha\delta\phi(s_1)=[1+\alpha(2\gamma-1)]w.
\end{aligned}$$

With $\gamma=0.9$ and $\alpha=0.1$, the multiplier is $1.08$. Starting from $w_0=1$, the weight after $n$ replays is exactly $w_n=1.08^n$:

| Replay update $n$ | Weight $w_n$ | Estimate at $s_1$ | Estimate at $s_2$ |
| --- | ---: | ---: | ---: |
| 0 | 1 | 1 | 2 |
| 1 | 1.08 | 1.08 | 2.16 |
| 2 | 1.1664 | 1.1664 | 2.3328 |

No reward ever arrives. The growth comes only from the shared weight feeding its own target. The mismatch is in which states get updated: the policy ends up at $s_2$, but replay never starts there. So this example breaks state coverage, and it isn't a counterexample to the stable pairs below. The example goes back to Tsitsiklis and Van Roy (1996, 1997), as presented in [van Hasselt et al., §2](https://arxiv.org/abs/1812.02648).

<details><summary>Notation used in this article</summary>

$S_t$ and $A_t$ are the state and action at step $t$, and $R_{t+1}$ is the reward after that action. The discount is $0\leq\gamma<1$, and $\alpha_t>0$ is a learning rate. A superscript $+$ marks an updated quantity. Here $t$ is a step index, not an exponent.

</details>

Remove any one ingredient and there is a setting where learning is stable. Each of the next three panels keeps two ingredients and shows what it restores. Each result needs its own assumptions; none of them says a pair is always safe.

<div class="rc-mark" id="sec-linear-pair" data-panel="linear-pair" data-view="linear-pair" data-title="Drop off-policy data"></div>

## Drop off-policy data

Keep the shared weights and bootstrapping, but sample states from the policy's own trajectories. Linear TD then settles on one projected solution. The projected Bellman step can't increase the distance between two candidate predictions when both are measured with the same stationary state weighting: with $\gamma=0.9$, two predictions 2 apart end up at most 1.8 apart. Off-policy sampling changes that weighting, and the argument no longer holds. [Tsitsiklis and Van Roy](https://web.mit.edu/~jnt/www/Papers/J063-97-bvr-td.pdf). PPO's critic is close to this case, since it fits fresh data from the policy that collected it, but a neural network gets no guarantee from this linear result.

<div class="rc-mark" id="sec-fixed-labels" data-panel="fixed-labels" data-view="fixed-labels" data-title="Drop bootstrapping"></div>

## Drop bootstrapping

Keep the shared weights and off-policy data, but wait for complete returns, correct them with importance weights and freeze them as labels. The labels no longer depend on the predictions, so fitting them is ordinary regression. With one feature equal to 1, a label of 2 and a step size of 0.5, the weight goes $0\to1\to1.5\to1.75$ and approaches 2. Bootstrapping would let the label move with the weight. [Sutton and Barto, §§5.5, 9.2](http://incompleteideas.net/book/RLbook2020.pdf). RECAP's value learner also fits complete returns as fixed labels. It needs no importance weights, because it learns the value of the policies that collected the data.

<div class="rc-mark" id="sec-tabular-pair" data-panel="tabular-pair" data-view="tabular-pair" data-title="Drop shared weights"></div>

## Drop shared weights

Keep bootstrapping and off-policy data, but give every state-action pair its own table entry. With reward 0, a next-row maximum of 5 and $\gamma=0.9$, the target is 4.5, and a step size of 0.5 moves an old entry of 2 to 3.25. The successor's 5 doesn't move during that update, so the target can't chase the prediction. Tabular Q-learning converges under the conditions of [Watkins and Dayan (1992)](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf). The derivations and conditions for all three pairs are in the drawer at the end.

<div class="rc-mark" id="sec-dqn" data-panel="dqn" data-view="dqn" data-title="Slow the target feedback"></div>

## Slow the target feedback

DQN keeps all three ingredients, so it slows the loop instead of removing it. It trains on transitions sampled from a replay buffer, which breaks up runs of nearly identical states, and it computes targets with a frozen copy of the network that it refreshes every $C$ updates. Replay doesn't make the data on-policy, and a frozen target delays the feedback without guaranteeing convergence. SAC also slows its targets, with a moving average of the weights. [Mnih et al., Methods](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf); [van Hasselt et al.](https://arxiv.org/abs/1812.02648).

<details><summary>The DQN target and training loop</summary>

Let $Q_\theta$ be the online action-value network with weights $\theta$, and $Q_{\theta^-}$ its frozen copy. Let $d$ be one for a terminal transition and zero otherwise, $y$ the target, and $\nabla_\theta$ the gradient with respect to the online weights. Here $s,a,r,s'$ are the current state, action, observed reward and successor, $a'$ ranges over next actions, and $\theta^+$ is the updated online network. The superscript minus labels the frozen copy, not subtraction.

$$\begin{aligned}
y&=r+\gamma(1-d)\max_{a'}Q_{\theta^-}(s',a'),\\
\theta^+&=\theta+\alpha_t[y-Q_\theta(s,a)]\nabla_\theta Q_\theta(s,a).
\end{aligned}$$

The terminal mask removes the nonexistent future after an episode ends. This is a **semi-gradient** update: gradients flow through the current prediction while $y$ stays fixed. With $C$ the number of updates between target copies:

```text
store each observed transition in replay
sample a transition (s, a, r, s′, d)
compute y using frozen weights theta_minus
update online weights theta toward y
if C updates have passed: theta_minus = theta
```

The published DQN samples minibatches of 32, uses RMSProp and clips the error to [−1, 1]; this loop keeps only the target logic. Freezing delays the target feedback. It doesn't prove convergence, even for the two-state example above.

</details>

<div class="rc-mark" id="sec-diagnostics" data-panel="diagnostics" data-view="diagnostics" data-title="Check estimates beside rewards"></div>

## Check estimates beside rewards

A good task score tells you how the policy acts, not whether its values are right, so check the values against what is possible. If every reward has magnitude at most $R_{\max}$, the discounted return $G_t$ can't be larger than a geometric sum:

$$|G_t|\leq\frac{R_{\max}}{1-\gamma}.$$

With rewards bounded by 1 and $\gamma=0.9$, the bound is 10, so a prediction of 100 is wrong for that task. Check the reward scale and terminal handling first, then sampling and target feedback. A finite spike proves an error; divergence to infinity is a stronger claim.

- **Coverage:** which states and actions do the updates skip?
- **Coupling:** which other predictions move after one update?
- **Targets:** when do labels change, and where do gradients stop?

<details>
<summary>The three pairs: detailed stability arguments and conditions</summary>

Each pair below has a particular stable construction under stated assumptions. They explain why removing one source of feedback can help. The deadly triad names a risk when all three ingredients are present; it is not a rule that every pair is safe or every triple diverges.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 680" style="width:min(100%,560px)" role="img" aria-labelledby="dt-title dt-desc"> <title id="dt-title">The deadly triad: three useful ingredients, one dangerous feedback loop</title> <desc id="dt-desc">Function approximation shares predictions. Bootstrapping learns before an episode ends. Off-policy learning reuses behavior data for a target policy. Green numbered edges refer to three stable pair examples with assumptions in the article. Red arrows combine all three: shared estimates can feed their own targets and grow without bound. The rising curve shows estimates increasing while true value stays finite.</desc> <defs><marker id="dt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="none" stroke="#b44c2c" stroke-width="1.5"/></marker></defs> <rect width="620" height="680" fill="#f5f4ed"/> <g fill="none" stroke="#49724e" stroke-width="2.4" stroke-linecap="round"><path d="M210 96 Q151 112 142 180 M410 96 Q468 113 478 180 M142 284 Q308 355 478 284"/></g> <g fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#dt-arrow)"><path d="M310 104 Q308 234 310 375"/><path d="M154 284 Q160 342 205 375"/><path d="M466 284 Q460 343 415 375"/></g> <path d="M166 15 Q310.0 12 455 15 L454 104 Q310.0 106 165 103 Z" fill="#e4eef4" stroke="#242622" stroke-width="2" stroke-linejoin="round"/> <text x="310" y="44" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700"> <tspan x="310" dy="0">Function approximation</tspan> </text> <text x="310" y="72" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="17"> <tspan x="310" dy="0">Share / generalize</tspan> <tspan x="310" dy="22.1">across related states</tspan> </text> <path d="M15 183 Q153.0 180 292 183 L291 284 Q153.0 286 14 283 Z" fill="#e4eef4" stroke="#242622" stroke-width="2" stroke-linejoin="round"/> <text x="153" y="212" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700"> <tspan x="153" dy="0">Bootstrapping</tspan> </text> <text x="153" y="240" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="17"> <tspan x="153" dy="0">Learn before complete returns</tspan> <tspan x="153" dy="22.1">Use a guess in the target</tspan> </text> <path d="M329 183 Q467.0 180 606 183 L605 284 Q467.0 286 328 283 Z" fill="#e4eef4" stroke="#242622" stroke-width="2" stroke-linejoin="round"/> <text x="467" y="212" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700"> <tspan x="467" dy="0">Off-policy learning</tspan> </text> <text x="467" y="240" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="17"> <tspan x="467" dy="0">Reuse behavior data</tspan> <tspan x="467" dy="22.1">for a different target policy</tspan> </text> <rect x="60" y="118" width="166" height="46" rx="5" fill="#f5f4ed"/> <text x="143" y="135" text-anchor="middle" fill="#49724e" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700"> <tspan x="143" dy="0">1 · Linear TD</tspan> </text> <rect x="394" y="118" width="166" height="46" rx="5" fill="#f5f4ed"/> <text x="477" y="135" text-anchor="middle" fill="#49724e" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700"> <tspan x="477" dy="0">2 · Monte Carlo</tspan> </text> <rect x="227" y="315" width="166" height="46" rx="5" fill="#f5f4ed"/> <text x="310" y="332" text-anchor="middle" fill="#49724e" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700"> <tspan x="310" dy="0">3 · Table Q-learning</tspan> </text> <rect x="128" y="351" width="364" height="20" fill="#f5f4ed"/><text x="310" y="365" text-anchor="middle" fill="#49724e" font-family="Arial,Helvetica,sans-serif" font-size="15"> <tspan x="310" dy="0">Pairs: stable examples under assumptions below</tspan> </text> <path d="M151 381 Q310 376 469 381 L468 443 Q310 446 150 442 Z" fill="#f6e5e0" stroke="#b44c2c" stroke-width="2"/> <text x="310" y="406" text-anchor="middle" fill="#b44c2c" font-family="Arial,Helvetica,sans-serif" font-size="21" font-weight="700"> <tspan x="310" dy="0">ALL THREE: can diverge</tspan> </text> <text x="310" y="431" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="17"> <tspan x="310" dy="0">Shared guesses feed their own targets</tspan> </text> <path d="M310 445 L310 468" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#dt-arrow)"/> <path d="M96 491 L96 618 L535 618" fill="none" stroke="#656b62" stroke-width="1.8"/><path d="M105 609 Q175 607 225 595 T325 556 Q380 519 418 487" fill="none" stroke="#b44c2c" stroke-width="3" marker-end="url(#dt-arrow)"/><path d="M98 601 L531 601" fill="none" stroke="#656b62" stroke-width="1.4" stroke-dasharray="4 5"/> <text x="310" y="488" text-anchor="middle" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700"> <tspan x="310" dy="0">A possible failure: values grow without bound</tspan> </text> <text x="105" y="530" text-anchor="start" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="15"> <tspan x="105" dy="0">estimated</tspan> <tspan x="105" dy="19.5">value</tspan> </text> <text x="530" y="641" text-anchor="end" fill="#242622" font-family="Arial,Helvetica,sans-serif" font-size="16"> <tspan x="530" dy="0">learning updates →</tspan> </text> <text x="443" y="589" text-anchor="middle" fill="#656b62" font-family="Arial,Helvetica,sans-serif" font-size="15"> <tspan x="443" dy="0">true value stays finite</tspan> </text> <text x="310" y="666" text-anchor="middle" fill="#656b62" font-family="Arial,Helvetica,sans-serif" font-size="16"> <tspan x="310" dy="0">Estimates rise while true value stays finite</tspan> </text> </svg><figcaption>Shared predictions, guessed targets and off-policy data can reinforce an error. Each pair has a different stability argument.</figcaption></figure>

In the equations below, $t$ is the time step; $S_t$ and $A_t$ are the state and action; $R_{t+1}$ is the next reward. The target policy $\pi(a\mid s)$ gives the probability of action $a$ in state $s$; $b(a\mid s)$ is the policy that collected the data. The discount is $0\leq\gamma<1$ and $\alpha_t>0$ is a learning step size. A superscript $+$ means the next parameter or table value.

<div class="dt-pairs">
<section class="dt-worked" id="dt-pair-1">

### 1 · Approximation + bootstrapping

**Learn a fixed policy's values with on-policy linear TD.** A fixed feature vector $\phi(s)$ describes state $s$; the weights $w$ produce $v_w(s)=\phi(s)^\top w$. The superscript $\top$ means transpose. Let $\delta_t$ be the TD error, and let $w^+$ denote the updated weights. One observed transition gives this update:

$$
\begin{aligned}
\delta_t &= R_{t+1}+\gamma v_w(S_{t+1})-v_w(S_t),\\
w^+ &= w+\alpha_t\delta_t\phi(S_t).
\end{aligned}
$$

Why can this settle down? For a candidate value vector $v$, let $T^\pi$ be the Bellman prediction operator:

$$
(T^\pi v)(s)=\mathbb E_\pi[
R_{t+1}+\gamma v(S_{t+1})\mid S_t=s].
$$

The expectation uses the fixed target policy and the environment's transition probabilities. Let $D$ put its stationary state probabilities $d(s)$ on the diagonal; $\|x\|_D^2=\sum_s d(s)x(s)^2$ weights a value vector $x$ by those probabilities. Let $\Pi$ be least-squares projection onto the space spanned by the fixed features, using those same weights. For value vectors $v$ and $u$:

$$
\|\Pi T^\pi v-\Pi T^\pi u\|_D
\leq\gamma\|v-u\|_D.
$$

On-policy averaging cannot enlarge this norm; neither can the orthogonal projection. Multiplying by $\gamma<1$ makes the combined map a contraction, with one projected fixed point $v=\Pi T^\pi v$. **TD's sampled weight update is not literally repeated projection.** Under the conditions below, it converges to that same projected solution. [Tsitsiklis and Van Roy, Sections IV and VII](https://web.mit.edu/~jnt/www/Papers/J063-97-bvr-td.pdf).

**Add off-policy sampling:** projection may now weight states by the behavior distribution, while the Bellman target follows $\pi$. The matched-norm argument can fail. The two-state example earlier in this article shows the resulting feedback.

**Read the bound:** if two candidate value vectors are distance 2 apart and $\gamma=0.9$, one projected Bellman map leaves them at most 1.8 apart. It compares two whole predictions under the same policy and state weighting. It does not say every noisy TD sample improves its estimate.

<details class="dt-conditions">
<summary>Conditions behind this prediction result</summary>
<p>This is a fixed-policy prediction result. A finite irreducible, aperiodic chain supplies a stationary distribution and repeated on-policy visits. Rewards are bounded, the discount is below 1, and the fixed feature columns are linearly independent.</p>
<p>Positive diminishing learning rates have infinite sum and finite squared sum: they retain enough total adjustment while suppressing persistent sampling noise. These assumptions support the linear result cited above; they do not cover arbitrary neural networks or a changing control policy.</p>
</details>
</section>
<section class="dt-worked" id="dt-pair-2">

### 2 · Approximation + off-policy

**Wait for the complete return, then fit fixed targets.** Let $H$ be the terminal time, $k$ index future steps, $G_t$ be the full discounted return and $\rho_t$ be the trajectory weight correcting behavior $b$ to target policy $\pi$. The product $\prod$ multiplies the action-probability ratios along that recorded future. Its return and importance weight are

$$
\begin{aligned}
G_t &= \sum_{k=0}^{H-t-1}\gamma^k R_{t+k+1},\\
\rho_t &= \prod_{k=t}^{H-1}
\frac{\pi(A_k\mid S_k)}{b(A_k\mid S_k)}.
\end{aligned}
$$

Crucially, $G_t$ contains **rewards, not a guessed future value**. Freeze the recorded data. For example $i$, use its corrected return $y_i=\rho_i G_i$ as the label; here $G_i$ and $\rho_i$ mean the return and weight for that recorded starting point. Let $y$ stack these labels, and let row $i$ of the feature matrix $X$ be $\phi(s_i)^\top$, with $s_i$ the example's starting state. Let $\eta>0$ be the batch step size; $X^\top$ is the transposed feature matrix. Batch gradient descent is

$$
w^+=w-\eta X^\top(Xw-y).
$$

The Euclidean norm $\|\cdot\|_2$ measures vector length. The fixed squared-error loss is $L(w)=\tfrac12\|Xw-y\|_2^2$. Let $w_*$ be its empirical minimizer, $\succ0$ mean positive definite, and $^{-1}$ mean matrix inverse. If $X$ has full column rank,

$$
X^\top X\succ0
\quad\Longrightarrow\quad
w_*=(X^\top X)^{-1}X^\top y.
$$

Full rank gives one empirical least-squares minimizer. Choose $\eta$ below 2 divided by the largest eigenvalue of $X^\top X$: then the error in each curvature direction shrinks. The labels stay fixed while the weights move. Rank-deficient data need not have a unique fit. This is a well-posed regression argument, not a blanket convergence claim for off-policy Monte Carlo. [Sutton and Barto, published second edition, §§5.5 and 9.2](http://incompleteideas.net/book/RLbook2020.pdf).

**Add bootstrapping:** replace the complete return with a target containing $v_w$ at a future state. Now the labels move with $w$. Treating them as constants during each update no longer gives gradient descent on the fixed regression above.

**One fixed label:** take one feature equal to 1 and a corrected return label of 2. The loss is $(w-2)^2/2$. With batch step size $\eta=0.5$, weights $0,1,1.5,1.75$ approach 2 because the label stays 2. Bootstrapping would let that destination move with the predictions.

<details class="dt-conditions">
<summary>Conditions behind this regression example</summary>
<p>Freeze the target and behavior policies, linear features and recorded data. Use independent finite-horizon episodes with bounded rewards and features. Behavior must cover the target actions and the starting states whose values are being fitted; corrected labels need finite variance for statistical claims.</p>
<p>Full column rank gives a unique empirical fit. The batch step-size bound stated above makes optimization approach it. Finite data need not recover the true target-policy value; large importance weights can make that statistical estimate poor.</p>
</details>
</section>
<section class="dt-worked" id="dt-pair-3">

### 3 · Bootstrapping + off-policy

**Keep a separate table entry for every state-action pair.** Let $Q$ be the action-value table. In a transition $(s,a,r,s')$, $s$ and $a$ are the state and action, $r$ the reward and $s'$ the next state; $a'$ ranges over next actions. Tabular Q-learning updates just one entry:

$$
\begin{aligned}
Q^+(s,a)=Q(s,a)+\alpha_t\big[&r+\gamma\max_{a'}Q(s',a')\\
&-Q(s,a)\big].
\end{aligned}
$$

All other entries stay unchanged. For any candidate table $q$, its expected target is the Bellman optimality operator $T_*$:

$$
(T_*q)(s,a)=\mathbb E\!\left[
 r+\gamma\max_{a'}q(s',a')\mid s,a\right].
$$

The expectation averages the environment's rewards and transitions. The max norm $\|x\|_\infty=\max_{s,a}|x(s,a)|$ is the largest absolute entry of a table $x$. For two candidate tables $q$ and $u$,

$$
\|T_*q-T_*u\|_\infty
\leq\gamma\|q-u\|_\infty.
$$

Taking a maximum and averaging cannot amplify the largest entrywise difference; discounting shrinks it. Thus $T_*$ has one fixed point, the optimal table. With enough visits and suitable step sizes, sampled Q-learning reaches it. [Watkins and Dayan's convergence theorem](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf).

**Add function approximation:** a weight update can also change other states' values, including a value in the bootstrap target. The tabular Bellman operator still contracts, but that alone does not control the added shared fitting step. Its guarantee does not transfer to an arbitrary approximator.

**Two separate entries:** if the successor maximum is 5, the reward is 0 and $\gamma=0.9$, the target is 4.5. Moving a predecessor from 2 toward 4.5 leaves the successor at 5 during that update. A shared weight can move both; a table entry cannot.

<details class="dt-conditions">
<summary>Conditions behind tabular convergence</summary>
<p>The task is a finite Markov decision process with fixed transition and reward laws, bounded rewards and discount below 1. Every nonterminal state-action pair must receive infinitely many updates.</p>
<p>Each pair's learning rates are in [0, 1), have infinite sum and finite squared sum. A replay buffer omitting a pair fails the visit assumption; a constant noisy step size fails the shrinking-step assumption. The theorem cited above concerns the resulting infinite update sequence, not a finite successful route.</p>
</details>
</section>

</div>

</details>

Across the series, we've used values to connect late rewards to earlier choices. The triad matters because sharing that credit can also share an error, which then becomes the next target. [Return to the method tree](/robotics/rl-1-q-learning/#sec-tree), or [the opening problems](/robotics/rl-0-overview/).

The next three parts look at failures outside the triad: [policy-gradient credit and update size](/robotics/rl-6-credit-and-careful-updates/), [learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/), and [mode averaging](/robotics/rl-8-mode-averaging/). The [failure map](/robotics/rl-0-overview/#sec-failures) groups them all.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
