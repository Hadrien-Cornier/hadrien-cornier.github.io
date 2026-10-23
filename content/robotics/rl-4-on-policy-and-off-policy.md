---
title: 'On-policy and off-policy: whose future are we learning?'
description: 'A value target has to assume what you do next: on-policy learning assumes the moves you actually make, and off-policy learning assumes a different policy''s moves.'
date: '2026-10-19'
updated: '2026-10-22'
draft: false
series: 'reinforcement-learning'
part: 4
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-4-on-policy-and-off-policy-whole.svg'
thumbnail_alt: 'Two blackboard panels: the behavior policy picks the move and the target follows the target policy''s next move, and one row of next values gives three targets: Q-learning''s max gives 8 (off-policy), Sarsa''s sample gives 8 or -10, and Expected Sarsa''s average gives 6.2 (both on-policy)'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 1238" data-whole="0 0 680 1238" data-views='{"policies":[24,46,300,220],"targets":[364,46,300,220],"cliff":[24,326,300,220],"coverage":[364,326,300,220],"weighting":[24,606,300,220],"guarantees":[364,606,300,220],"scale":[182,880,316,338]}' role="img" aria-label="Seven blackboard panels. 1: the behavior policy b picks the move, and the target follows the target policy π; on-policy means π equals b. 2: one row of next values gives three targets: Q-learning 8 (off-policy), Sarsa 8 or −10 and Expected Sarsa 6.2 (both on-policy). 3: Sarsa learns the safer detour, where a slip lands safe, and Q-learning the cliff edge, where a slip falls in. 4: data that never takes a branch cannot answer for it. 5: ratios 0.8/0.5 = 1.6 and 0.2/0.5 = 0.4 turn equal samples into target weights 0.8 and 0.2. 6: linear TD converges with on-policy states and can diverge with off-policy states; a changing policy or a neural network has no general guarantee. 7: is off-policy a must at scale? Survey references in Tang et al. 2025, Table 5, by my count: locomotion 37 on-policy, 6 off-policy and 0 offline, manipulation 9, 24 and 6. The share of arXiv abstracts that name only off-policy algorithms, among 8 algorithms: 61% of 364 in 2022 and 35% of 960 in 2025, while off-policy mentions rose from 244 to 416. Answer: it depends on the domain."><g class="rc-panel" data-panel="policies"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. Two policies, one task</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>The behavior policy b picks the move from s to s′. From s′ there are two futures: b's next move and the target policy π's next move. The target follows π, and its value is credited back to (s, a). On-policy means π equals b; off-policy means they differ.</title><defs><marker id="canvas-4-0-p4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="34" cy="56" r="21" fill="#d7e5ee" stroke="#242622"/><text x="34" y="62" text-anchor="middle">s</text><path d="M57 56H104" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-0-p4a)"/><text x="80" y="38" text-anchor="middle" font-size="15" fill="#2b6a8e">b picks a</text><circle cx="130" cy="56" r="21" fill="#d7e5ee" stroke="#242622"/><text x="130" y="62" text-anchor="middle">s′</text><path d="M151 46Q184 26 220 24" fill="none" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#canvas-4-0-p4a)"/><text x="226" y="29" font-size="15" fill="#2b6a8e">b next</text><path d="M151 66Q184 88 216 90" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-0-p4a)"/><text x="226" y="95" font-size="15">π next</text><ellipse cx="249" cy="90" rx="31" ry="16" fill="none" class="s-yellow" stroke-width="2"/><text x="208" y="62" text-anchor="middle" font-size="14" class="c-yellow">target follows π</text><path d="M248 108Q150 196 40 80" fill="none" stroke="#242622" stroke-width="1.6" stroke-dasharray="4 4" marker-end="url(#canvas-4-0-p4a)"/><text x="150" y="172" text-anchor="middle" font-size="14" fill="#656b62">value credited to (s, a)</text><text x="148" y="194" text-anchor="end" font-size="16">on-policy:</text><text x="156" y="194" font-size="16">π = b</text><text x="148" y="213" text-anchor="end" font-size="16">off-policy:</text><text x="156" y="213" font-size="16">π ≠ b</text></g></svg></g><g class="rc-panel" data-panel="targets"><rect x="352" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. One row, three targets</text><svg x="364" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>The same action row feeds three targets. Q-learning takes the maximum, 10, for a target of 8 (off-policy). Sarsa takes one sampled next value, 10 or −10, for a target of 8 or −10 (on-policy). Expected Sarsa with π = b takes the average, 8, for a target of 6.2 (on-policy).</title><defs><marker id="canvas-4-1-p4b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><rect x="25" y="12" width="250" height="54" fill="#d7e5ee" stroke="#242622"/><path d="M150 12V66" stroke="#242622"/><text x="86" y="35" text-anchor="middle">right: 10</text><text x="213" y="35" text-anchor="middle">down: −10</text><text x="86" y="57" text-anchor="middle">b = 0.9</text><text x="213" y="57" text-anchor="middle">b = 0.1</text><path d="M80 69L49 99" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-1-p4b)"/><path d="M150 69V99" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-1-p4b)"/><path d="M220 69L249 99" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-1-p4b)"/><text x="45" y="121" text-anchor="middle">max</text><text x="150" y="121" text-anchor="middle">sample</text><text x="252" y="121" text-anchor="middle">average</text><text x="45" y="142" text-anchor="middle">10 → 8</text><text x="150" y="142" text-anchor="middle">10 → 8</text><text x="150" y="160" text-anchor="middle" font-size="15">or −10 → −10</text><text x="252" y="142" text-anchor="middle">8 → 6.2</text><text x="45" y="181" text-anchor="middle" font-size="15" fill="#2b6a8e">Q-learning</text><text x="150" y="181" text-anchor="middle" font-size="15" fill="#2b6a8e">Sarsa</text><text x="252" y="181" text-anchor="middle" font-size="15" fill="#2b6a8e">Expected Sarsa</text><text x="45" y="197" text-anchor="middle" font-size="13">off-policy</text><text x="150" y="197" text-anchor="middle" font-size="13">on-policy</text><text x="252" y="197" text-anchor="middle" font-size="13">on-policy, π = b</text><text x="150" y="215" text-anchor="middle" font-size="13" fill="#656b62">next value → target (r = −1, γ = 0.9)</text></g></svg></g><g class="rc-panel" data-panel="cliff"><rect x="12" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="316">3. Exploration has a cost</text><svg x="24" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Sarsa learns the blue detour along the top row, where a random downward slip lands on a safe cell; Q-learning learns the red route right along the cliff edge, where the same slip falls into the cliff</title><defs><marker id="canvas-4-2-p4c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><path d="M24 40H276V166H24Z M24 82H276 M24 124H276 M66 40V166 M108 40V166 M150 40V166 M192 40V166 M234 40V166" fill="none" stroke="#777"/><path d="M66 124H234V166H66Z" fill="#b44c2c" opacity=".25"/><text x="150" y="151" text-anchor="middle">cliff</text><text x="45" y="151" text-anchor="middle">S</text><text x="255" y="151" text-anchor="middle">G</text><path d="M45 130V103H255V127" fill="none" stroke="#b44c2c" stroke-width="3" marker-end="url(#canvas-4-2-p4c)"/><path d="M45 126V61H255V126" fill="none" stroke="#2b6a8e" stroke-width="3" marker-end="url(#canvas-4-2-p4c)"/><path d="M150 99V134" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-4-2-p4c)"/><path d="M109 58V93" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-2-p4c)"/><text x="146" y="78" text-anchor="end" font-size="13" fill="#2b6a8e">slip:</text><text x="154" y="78" font-size="13" fill="#2b6a8e">safe</text><text x="150" y="25" text-anchor="middle" font-size="16" fill="#2b6a8e">Sarsa: the safer detour</text><text x="150" y="190" text-anchor="middle" font-size="16" fill="#b44c2c">Q-learning: right along the edge</text><text x="150" y="211" text-anchor="middle" font-size="13" fill="#656b62">↓ a random slip: the edge route falls in</text></g></svg></g><g class="rc-panel" data-panel="coverage"><rect x="352" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="316">4. Data must cover the question</text><svg x="364" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Data cover one branch but omit a target-policy bridge and all states reached through it</title><defs><marker id="canvas-4-3-p4d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="52" cy="108" r="24" fill="#d7e5ee" stroke="#242622"/><text x="52" y="115" text-anchor="middle">s</text><path d="M72 94L177 48" stroke="#2b6a8e" stroke-width="3" marker-end="url(#canvas-4-3-p4d)"/><path d="M73 123L177 172" stroke="#b44c2c" stroke-width="2" stroke-dasharray="6 5" marker-end="url(#canvas-4-3-p4d)"/><circle cx="212" cy="40" r="25" fill="#d7e5ee" stroke="#242622"/><circle cx="212" cy="180" r="25" fill="#fff" stroke="#b44c2c"/><text x="212" y="46" text-anchor="middle">seen</text><text x="212" y="186" text-anchor="middle">?</text><text x="128" y="25" text-anchor="middle">b takes this</text><text x="155" y="126" text-anchor="middle">π needs bridge</text><path d="M125 141L145 164M145 141L125 164" stroke="#b44c2c" stroke-width="3"/><text x="16" y="192" font-size="15">zero data</text><text x="16" y="210" font-size="15">for this branch</text></g></svg></g><g class="rc-panel" data-panel="weighting"><rect x="12" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="596">5. Correcting action probabilities</text><svg x="24" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>The behavior samples right and down with probability 0.5 each. Multiplying by the ratios π/b, 0.8/0.5 = 1.6 and 0.2/0.5 = 0.4, gives the target weights 0.8 and 0.2.</title><defs><marker id="canvas-4-4-p4e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="25" text-anchor="middle">b samples each action: 0.5</text><path d="M150 38L75 77" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-4-p4e)"/><path d="M150 38L225 77" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-4-p4e)"/><text x="75" y="103" text-anchor="middle">right</text><text x="225" y="103" text-anchor="middle">down</text><path d="M75 110V126" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-4-p4e)"/><path d="M225 110V126" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-4-p4e)"/><text x="150" y="122" text-anchor="middle" font-size="13" fill="#656b62">ratio π / b</text><text x="75" y="148" text-anchor="middle">× 0.8/0.5 = 1.6</text><text x="225" y="148" text-anchor="middle">× 0.2/0.5 = 0.4</text><text x="75" y="179" text-anchor="middle">weight 0.8</text><text x="225" y="179" text-anchor="middle">weight 0.2</text><text x="150" y="209" text-anchor="middle">target action proportions</text></g></svg></g><g class="rc-panel" data-panel="guarantees"><rect x="352" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="596">6. Which guarantees survive?</text><svg x="364" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" aria-hidden="true"><title>Linear TD for one fixed policy with shrinking steps, where every value uses the same weights w: with on-policy states it converges; with off-policy states it can diverge, because w moves a value and its own target; a changing policy or a neural network has no general guarantee</title><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="20" text-anchor="middle" font-size="15" fill="#656b62">linear TD, one fixed policy</text><path d="M8 32H292" stroke="#b6baaf" stroke-width="1.5"/><text x="10" y="60" font-size="16">on-policy states</text><text x="292" y="60" text-anchor="end" font-size="17" fill="#5f7f4f">converges</text><text x="10" y="94" font-size="16">off-policy states</text><text x="292" y="94" text-anchor="end" font-size="17" fill="#b44c2c">can diverge</text><text x="292" y="112" text-anchor="end" font-size="13" fill="#656b62">part 5 shows how</text><path d="M8 124H292" stroke="#b6baaf" stroke-width="1.5"/><text x="10" y="150" font-size="16">changing policy</text><text x="10" y="170" font-size="16">or neural network</text><text x="292" y="160" text-anchor="end" font-size="17">no general guarantee</text><path d="M8 180H292" stroke="#b6baaf" stroke-width="1.5"/><text x="150" y="198" text-anchor="middle" font-size="14" fill="#656b62">linear TD: every value uses the same weights w</text><text x="150" y="214" text-anchor="middle" font-size="14" fill="#656b62">why: w moves a value and its own target</text></g></svg></g><g class="rc-panel" data-panel="scale"><rect x="178" y="852" width="324" height="372" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="190" y="876">7. Is off-policy a must at scale?</text><svg x="190" y="886" height="326" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 326" aria-hidden="true"><title>Is off-policy a must at scale? Measured evidence. Tang et al. 2025, Table 5, lists real-robot RL successes that the survey authors chose. By my count of its references, locomotion has 37 on-policy, 6 off-policy and 0 offline entries, and manipulation has 9, 24 and 6. Among arXiv abstracts in cs.LG, cs.AI, cs.RO or cs.CL that name any of PPO, TRPO, A2C, A3C, DQN, DDPG, TD3 or SAC, the share that names only off-policy methods (DQN, DDPG, TD3 or SAC) was 61% of 364 in 2022 and 35% of 960 in 2025, each bar drawn against a full 100% track, a count of mentions, not use. Abstracts that name an off-policy algorithm rose from 244 to 416, and abstracts that name an on-policy algorithm rose from 142 to 622. LLM RL trains PPO and GRPO on fresh or slightly stale samples with clipped ratios. Answer: it depends on the domain.</title><g font-family="Arial,sans-serif" font-size="15" fill="#242622"><text x="2" y="16">Real-robot RL successes, Tang et al. 2025</text><text x="298" y="16" text-anchor="end" font-size="13" fill="#656b62">my count</text><text x="2" y="33" font-size="13" fill="#656b62">unit: references in Table 5, chosen by the survey authors</text><text x="2" y="63" font-size="14">locomotion</text><text x="104" y="50" text-anchor="end" font-size="13" fill="#656b62">on</text><rect x="110" y="41" width="111" height="9" fill="#656b62"/><text x="227" y="50" font-size="14">37</text><text x="104" y="63" text-anchor="end" font-size="13" fill="#2b6a8e">off</text><rect x="110" y="54" width="18" height="9" fill="#2b6a8e"/><text x="134" y="63" font-size="14" fill="#2b6a8e">6</text><text x="104" y="76" text-anchor="end" font-size="13" fill="#2b6a8e">offline</text><text x="116" y="76" font-size="14" fill="#2b6a8e">0</text><text x="2" y="106" font-size="14">manipulation</text><text x="104" y="93" text-anchor="end" font-size="13" fill="#656b62">on</text><rect x="110" y="84" width="27" height="9" fill="#656b62"/><text x="143" y="93" font-size="14">9</text><text x="104" y="106" text-anchor="end" font-size="13" fill="#2b6a8e">off</text><rect x="110" y="97" width="72" height="9" fill="#2b6a8e"/><text x="188" y="106" font-size="14" fill="#2b6a8e">24</text><text x="104" y="119" text-anchor="end" font-size="13" fill="#2b6a8e">offline</text><rect x="110.75" y="110.75" width="16.5" height="7.5" fill="none" stroke="#2b6a8e" stroke-width="1.5"/><text x="134" y="119" font-size="14" fill="#2b6a8e">6</text><path d="M2 131H298" stroke="#b6baaf" stroke-width="1.5" stroke-dasharray="3 4"/><text x="2" y="150" font-size="14">arXiv abstracts that name any of 8 algorithms</text><text x="2" y="166" font-size="13" fill="#656b62">cs.LG, cs.AI, cs.RO or cs.CL · mentions, not use</text><text x="2" y="182" font-size="13">bar: share that names only off-policy methods</text><text x="2" y="197" font-size="13" fill="#656b62">off-policy here: DQN, DDPG, TD3 or SAC</text><rect x="44" y="204" width="220" height="11" fill="rgba(244,241,232,0.10)"/><rect x="44" y="222" width="220" height="11" fill="rgba(244,241,232,0.10)"/><path d="M264 201V237" stroke="#b6baaf" stroke-width="1.5" stroke-dasharray="3 3"/><text x="268" y="224" font-size="13" fill="#656b62">100%</text><text x="2" y="214" font-size="14">2022</text><rect x="44" y="204" width="134" height="11" fill="#2b6a8e"/><text x="184" y="214" font-size="14" fill="#2b6a8e">61%<tspan font-size="13" fill="#656b62"> of 364</tspan></text><text x="2" y="232" font-size="14">2025</text><rect x="44" y="222" width="77" height="11" fill="#2b6a8e"/><text x="127" y="232" font-size="14" fill="#2b6a8e">35%<tspan font-size="13" fill="#656b62"> of 960</tspan></text><text x="2" y="251" font-size="13">off-policy mentions rose 244 → 416, on-policy 142 → 622</text><path d="M2 261H298" stroke="#b6baaf" stroke-width="1.5" stroke-dasharray="3 4"/><text x="2" y="278" font-size="14">LLM RL: PPO and GRPO on fresh samples</text><text x="2" y="293" font-size="13" fill="#656b62">slightly stale batches, clipped ratios</text><path d="M2 302H298" stroke="#b6baaf" stroke-width="1.5" stroke-dasharray="3 4"/><text x="2" y="320" font-size="16" class="c-yellow">Answer: it depends on the domain</text></g></svg></g></svg></div></div>
<div class="rc-body">

Your favorite route runs beside a cliff, and while you're still exploring, one random move can make you fall. Should the route's value include those random moves? If it does, you're learning **on-policy**: the value describes the moves you actually make. If it doesn't, you're learning **off-policy**: the value describes a different policy, here a greedy one that never slips. You can see the difference by holding one next-state row fixed and calculating three targets ([Sutton and Barto, §§5.5 and 6.4–6.6](http://incompleteideas.net/book/RLbook2020.pdf)).

**Part 4.** A value estimate credits earlier actions with rewards that arrive later, so it has to assume which actions come next. The task, the rewards and the table stay the same.

<div class="rc-mark" id="sec-two-policies" data-panel="policies" data-view="policies" data-title="Two policies, one task"></div>

## Two policies, one task

The rule that collects your moves is the **behavior policy**, written $b$. The rule whose future you want to value is the **target policy**, written $\pi$. Both give the probability of action $a$ in state $s$: $b(a\mid s)$ and $\pi(a\mid s)$.

| At one illustrative state | Right | Down |
| --- | ---: | ---: |
| Behavior $b$: collects moves | 0.9 | 0.1 |
| Target $\pi$: greedy continuation | 1 | 0 |

So a down move can show up in the data even though you're valuing a future that always goes right. Learning is **on-policy** when the two rules match and **off-policy** when they differ. Q-learning is off-policy even when it learns from each move as it happens: the exploratory rule picks the move, but the target assumes greedy actions afterwards. Off-policy is about whose future the target describes, not about how old the data is.

<div class="rc-mark" id="sec-three-targets" data-panel="targets" data-view="targets" data-title="One row, three targets"></div>

## One row, three targets

Hold the next-state row fixed: right is worth $10$, down is worth $-10$, the behavior picks them with probabilities $0.9$ and $0.1$, the reward is $-1$ and $\gamma=0.9$. Every method moves $Q(S_t,A_t)$ toward a target $Y_t$. They only differ in how the next action enters that target:

$$\begin{aligned}
Y_t^{\mathrm{Q}}&=R_{t+1}+\gamma\max_{a'}Q(S_{t+1},a'),\\
Y_t^{\mathrm{Sarsa}}&=R_{t+1}+\gamma Q(S_{t+1},A_{t+1}),\\
Y_t^{\mathrm{Expected}}&=R_{t+1}+\gamma\sum_{a'}\pi(a'\mid S_{t+1})Q(S_{t+1},a').
\end{aligned}$$

Q-learning takes the best next action: $-1+0.9(10)=8$. Sarsa uses the next action it actually sampled, so its target is $8$ after right or $-10$ after down. Expected Sarsa with $\pi=b$ averages over the next action: $-1+0.9[0.9(10)+0.1(-10)]=6.2$. That removes the noise from sampling the next action. With a greedy $\pi$, Expected Sarsa becomes Q-learning. [§§6.4–6.6](http://incompleteideas.net/book/RLbook2020.pdf).

<details><summary>Notation and the update rule</summary>

At step $t$ you take action $A_t$ in state $S_t$, receive reward $R_{t+1}$ and arrive at $S_{t+1}$. $Q(s,a)$ estimates the discounted return after action $a$ in state $s$, $\gamma$ is the discount, $\alpha$ a positive learning rate, and $a'$ a candidate next action. For Sarsa, $A_{t+1}$ is the action actually sampled from the same behavior. The superscripts Q, Sarsa and Expected name the method; they aren't powers. Every method uses the same update:

$$Q(S_t,A_t)\leftarrow Q(S_t,A_t)+\alpha\bigl[Y_t-Q(S_t,A_t)\bigr].$$

Expected Sarsa removes next-action sampling noise, but transition and reward randomness can remain. It is off-policy whenever its chosen $\pi$ differs from $b$.

</details>

<div class="rc-mark" id="sec-cliff-risk" data-panel="cliff" data-view="cliff" data-title="Exploration has a cost"></div>

## Exploration has a cost

Q-learning's target values a future without exploratory slips, so it learns the route right along the cliff edge. Sarsa includes the slips in the behavior it evaluates, so it can prefer a longer route that leaves room to recover. That's the book's cliff example, with exploration that never stops ([Example 6.6](http://incompleteideas.net/book/RLbook2020.pdf)). Neither target is a safety guarantee: Sarsa's value is an expected return for its own policy, and that policy can still choose dangerous actions.

<details><summary>What a single run depends on</summary>

A particular finite run also depends on initialization, visits and the learning rate. Changing the exploration rule changes the return Sarsa learns. Gradually removing exploration changes the comparison again: the book's asymptotic optimality discussion assumes the required exploration and learning-rate conditions.

</details>

<div class="rc-mark" id="sec-coverage" data-panel="coverage" data-view="coverage" data-title="Data must cover the question"></div>

## Data must cover the question

Suppose a stored dataset never takes a bridge that the target policy would use. Replaying the other transitions more often won't tell you where the bridge leads. For action correction, the **coverage** requirement is

$$\pi(a\mid s)>0\;\Longrightarrow\;b(a\mid s)>0:$$

every action the target might take must also be possible under the behavior. The states have to show up in the updates too, and a buffer can skip them or sample them very unevenly. That freedom to learn about another policy is what off-policy methods are for, and its price is that coverage becomes part of the learning problem ([§5.5](http://incompleteideas.net/book/RLbook2020.pdf)). [Part 7](/robotics/rl-7-learning-from-fixed-data/) takes this to a fixed robot log, where a missing action becomes a target nothing corrects.

<div class="rc-mark" id="sec-action-correction" data-panel="weighting" data-view="weighting" data-title="Correcting action probabilities"></div>

## Correcting action probabilities

Say the data choose right and down equally, but the target chooses right four times as often. A plain average then answers the wrong policy's question. The **importance ratio** $\rho(a\mid s)=\pi(a\mid s)/b(a\mid s)$ fixes each action's share, because behavior probability times the ratio leaves target probability. For any fixed quantity $f(s,a)$ attached to an action:

$$\mathbb E_{A\sim b}[\rho(A\mid s)f(s,A)]=\sum_a\pi(a\mid s)f(s,a).$$

With behavior $(0.5,0.5)$, target $(0.8,0.2)$ and quantities $(10,-10)$, the ratios are $1.6$ and $0.4$, and $0.5(1.6)(10)+0.5(0.4)(-10)=6$, the same as $0.8(10)+0.2(-10)$. That's a one-step identity. Correcting a whole return needs a product of ratios, and a rare behavior action can get a huge weight. [§5.5](http://incompleteideas.net/book/RLbook2020.pdf).

<details><summary>The weighted contributions, row by row</summary>

| Action | Behavior | Target | Ratio | Quantity | Weighted contribution |
| --- | ---: | ---: | ---: | ---: | ---: |
| Right | 0.5 | 0.8 | 1.6 | 10 | 8 |
| Down | 0.5 | 0.2 | 0.4 | −10 | −2 |

Add the last column to recover 6. Each contribution is behavior probability × ratio × quantity; it isn't a new transition or reward. The arithmetic doesn't repair an omitted state, and it doesn't establish convergence for a nonlinear bootstrapping learner. Here $\mathbb E$ is the expectation and $A\sim b$ means the action is sampled from the behavior at this fixed state; the denominator $b(a\mid s)$ must be positive for every target action.

</details>

<div class="rc-mark" id="sec-guarantees" data-panel="guarantees" data-view="guarantees" data-title="Which guarantees survive?"></div>

## Which guarantees survive?

On-policy sampling fixes one mismatch, not every problem. The familiar convergence result covers fixed-policy prediction with fixed linear features, enough visits and shrinking step sizes ([Tsitsiklis and Van Roy, 1997](https://web.mit.edu/~jnt/www/Papers/J063-97-bvr-td.pdf)). Sample the states off-policy and the same linear TD can diverge, because one shared weight vector $w$ moves a prediction and its own target together. [Part 5](/robotics/rl-5-the-deadly-triad/) shows how. For a changing control policy or a neural network there's no general guarantee, so each method needs its own analysis.

<details><summary>Three targets and an Expected Sarsa loop</summary>

| Method | Continuation in the target | Primary source |
| --- | --- | --- |
| Q-learning | Largest next-action estimate | [§6.5](http://incompleteideas.net/book/RLbook2020.pdf) |
| Sarsa | One action sampled from its policy | [§6.4](http://incompleteideas.net/book/RLbook2020.pdf) |
| Expected Sarsa | Average under the chosen target policy | [§6.6](http://incompleteideas.net/book/RLbook2020.pdf) |

A short Expected Sarsa loop makes the policy choice explicit. $b$ collects actions and $\pi$ weights their continuation; in the code, `gamma`, `alpha` and `pi` spell those symbols, and `terminal` means the episode ended, so there's no remaining value to bootstrap:

```text
choose A_t using behavior b at S_t
observe R_(t+1), S_(t+1), terminal
if terminal: Y_t = R_(t+1)
else: Y_t = R_(t+1) + gamma * sum_a pi(a|S_(t+1)) Q(S_(t+1),a)
move Q(S_t,A_t) a fraction alpha toward Y_t
```

- **On-policy benefit:** the target includes the behavior's exploratory costs.
- **Off-policy benefit:** collection and the policy being learned about can differ.
- **Coverage cost:** missing actions or states leave parts of the question unsupported.
- **Approximation limit:** shared predictions can feed changes back into their own targets.

</details>

<div class="rc-mark" id="sec-scale" data-panel="scale" data-view="scale" data-title="Is off-policy a must at scale?"></div>

## Is off-policy a must at scale?

A growing dataset fills up with old runs, other controllers and failed attempts, and using all of it means learning off-policy. Whether you need that depends on the domain.

**Robots.** Real robot time is expensive, so real-robot RL stores old attempts in a replay buffer or a dataset and trains on them again. [QT-Opt](https://arxiv.org/abs/1806.10293) pooled over 580,000 grasps from 7 robots (2018), and [RECAP](https://arxiv.org/abs/2511.14759) in π\*0.6 learns from good and bad runs together (2025), with a Monte Carlo value instead of Q-learning. In simulation, parallel environments make fresh data cheap, and Proximal Policy Optimization (PPO) is still the usual choice ([FastTD3](https://arxiv.org/abs/2505.22642)). In the table of real-world successes in a [2025 survey](https://arxiv.org/abs/2408.03539), locomotion has 37 on-policy, 6 off-policy and 0 offline entries, and manipulation has 9, 24 and 6 (my count).

**LLMs.** The main algorithms, PPO and Group Relative Policy Optimization (GRPO), learn from fresh samples of a recent version of the model. [InstructGPT](https://arxiv.org/abs/2203.02155) used PPO, and [DeepSeekMath](https://arxiv.org/abs/2402.03300), which introduced GRPO, took a single update on each fresh batch. Large systems drift a little from fresh data. [DeepSeek-R1](https://arxiv.org/abs/2501.12948v2) made one pass over each batch of 8,192 outputs in 16 minibatch steps, so its later steps used slightly older samples. Others reuse a batch for several updates or let rollouts lag a few steps, then correct with clipped or truncated probability ratios. In a controlled study, results generally got worse as the data grew more off-policy, while an asynchronous setup with a one-step lag matched the synchronous results and trained faster ([Noukhovitch et al.](https://arxiv.org/abs/2410.18252)).

There's no defensible count of the off-policy share of RL methods. A rough proxy points the other way: among arXiv abstracts that name PPO, TRPO, A2C or A3C versus DQN, DDPG, TD3 or SAC, the off-policy-only share fell from 61% in 2022 to 35% in 2025. Off-policy mentions still grew, from 244 to 416 abstracts, while on-policy mentions grew faster. The proxy counts mentions, not use, but its share shows no rise.

<details><summary>Source note: definitions, counts and dated examples</summary>

**Definition used.** On-policy methods "attempt to evaluate or improve the policy that is used to make decisions, whereas off-policy methods evaluate or improve a policy different from that used to generate the data" ([Sutton and Barto, 2020, §5.4, p. 100](http://incompleteideas.net/book/RLbook2020.pdf)). The same book warns that off-policy methods "are often of greater variance and are slower to converge" (§5.5, p. 103).

**Five ideas that get called off-policy.** They aren't the same thing, and only some of them need an off-policy learner.

| Idea | Needs an off-policy learner? |
| --- | --- |
| Off-policy RL (Q-learning, DQN, SAC) | Yes, by definition. |
| Offline RL on a fixed dataset | Yes, if the goal is to beat the policy that collected the data. With sparse rewards or noisy data, offline RL "can significantly outperform" behavior cloning ([Kumar et al., 2022](https://arxiv.org/abs/2204.05618)). |
| Learning from good and bad demonstrations | It needs off-policy improvement, but not an off-policy value learner. Filtering, weighting or conditioning on the data needs a quality score. RECAP scores the data with a Monte Carlo value of the policy that collected it, conditions the policy on an advantage label, and trains a policy that does better. Plain behavior cloning copies the bad demonstrations too. |
| Replay buffer | Reusing old transitions to improve the current policy needs an off-policy learner or a correction: "when learning by experience replay, it is necessary to learn off-policy (because our current parameters are different to those used to generate the sample)" ([DQN, 2015, Methods](https://storage.googleapis.com/deepmind-media/dqn/DQNNaturePaper.pdf)). |
| Rollout reuse in PPO and GRPO | Slightly. After the first gradient step the batch is a little stale, and the ratio $\pi_\theta/\pi_{\text{old}}$ with clipping or truncation corrects for it. |

**What a percentage would need.** A share of "off-policy methods" needs a population, a date range and a counting rule. The measure that would answer the question is the share of RL papers in each year that use each algorithm, from full-text reading of a random sample. No study of that kind turned up. Classification also moves any percentage: GRPO is nominally on-policy but runs slightly off-policy at scale, DPO is often trained offline on a fixed preference set but also runs in rounds (Llama 3) or online (Online DPO), and behavior cloning isn't RL at all.

**A mention proxy.** For each year, take the abstracts that name at least one on-policy algorithm (PPO, TRPO, A2C or A3C) or off-policy algorithm (DQN, DDPG, TD3 or SAC), and count the share that names only off-policy ones. GRPO is left out so that the LLM wave doesn't decide the answer. PPO stays in, so to check the LLM effect, the same count without abstracts about language models fell from 61.5% (2022) to 42.7% (2025). SAC counts only by its full name. From 2018 to 2022 the arXiv share sat between 58% and 68%, so any start year in that range shows a fall.

| Population | 2022 | 2025 |
| --- | ---: | ---: |
| arXiv cs.LG, cs.AI, cs.RO or cs.CL, by first submission date | 61.0% of 364 | 35.2% of 960 |
| arXiv cs.RO only | 62.6% of 91 | 37.4% of 203 |
| OpenAlex works in computer science or engineering, full algorithm names only | 76.0% of 2,809 | 63.7% of 9,211 |

The OpenAlex share sat between 76% and 78% from 2018 to 2022 before it fell. Off-policy mentions still grow in absolute numbers (arXiv: 244 abstracts in 2022, 416 in 2025); on-policy mentions grow faster (142 to 622). The proxy has hard limits: an abstract that names an algorithm isn't a paper that trains with it, the lists miss methods such as CQL, IQL and REINFORCE-style LLM methods, and with a few hundred arXiv abstracts a year, moves of a few points are noise. Counts come from the arXiv and OpenAlex APIs, queried on 22 October 2026.

**Two curated counts.** Each covers one period and the authors' own selection, so neither shows a trend.

- [Tang et al., 2025, Table 5](https://arxiv.org/abs/2408.03539) (real-world robot RL successes chosen by the authors): locomotion lists 37 on-policy, 6 off-policy and 0 offline entries; manipulation lists 9, 24 and 6. Two locomotion references appear in both the on-policy and off-policy columns. The survey gives lists of references, and I counted them. It links the lean in locomotion and navigation to dense, shaped rewards and easy simulation: "the predominant use of stable and robust model-free, on-policy algorithms in these domains."
- [Survey of RL for large reasoning models, v3, October 2025, Table 1](https://arxiv.org/abs/2509.08827) (33 "representative open-source models trained with RL", January to September 2025): GRPO alone 16, GSPO 2, PPO 1, CISPO 1, OPMD 1, MPO 1, MPO with GRPO 1, MPO with GSPO 1, not stated 9. None names a replay-buffer Q-learning method.

**Dated examples.** These are prominent systems, picked by hand, so they show what's done, not how often.

| System | Domain | How it uses data |
| --- | --- | --- |
| [DQN](https://storage.googleapis.com/deepmind-media/dqn/DQNNaturePaper.pdf), Feb 2015 | Atari | Replay forces off-policy learning, "which motivates the choice of Q-learning". |
| [PPO](https://arxiv.org/abs/1707.06347), Jul 2017 | General | "enables multiple epochs of minibatch updates" on each batch. |
| [QT-Opt](https://arxiv.org/abs/1806.10293), Jun 2018 | Real-robot grasping | "over 580k grasps over the course of several weeks across 7 robots"; "Collecting such data in a single on-policy training run would be impractical." |
| [InstructGPT](https://arxiv.org/abs/2203.02155), Mar 2022 | LLM | "we fine-tuned the SFT model on our environment using PPO" (§3.5). |
| [DeepSeekMath](https://arxiv.org/abs/2402.03300), Feb 2024 | LLM | Introduces GRPO; "The policy model only has a single update following each exploration stage." |
| [Tajwar et al.](https://arxiv.org/abs/2404.14367), Apr 2024 | LLM fine-tuning study | "approaches that use on-policy sampling or attempt to push down the likelihood on certain responses ... outperform offline and maximum likelihood objectives" (the paper puts offline DPO, which pushes down the likelihood of rejected responses, in the winning group). |
| [Llama 3](https://arxiv.org/abs/2407.21783), Jul 2024 | LLM | DPO in rounds, on preference data from recent models; "We also explored on-policy algorithms such as PPO ..., but found that DPO required less compute for large-scale models and performed better". |
| [SERL](https://arxiv.org/abs/2401.16013), [HIL-SERL](https://arxiv.org/abs/2410.21845), Jan and Oct 2024 | Real-robot manipulation | Off-policy RL based on RLPD, with demonstrations in the replay buffer. HIL-SERL "also incorporates human demonstrations and corrections". |
| [DeepSeek-R1](https://arxiv.org/abs/2501.12948v2), Jan 2025 (batch details from the <i>Nature</i> version, Sep 2025, and arXiv v2) | LLM | "we adopt Group Relative Policy Optimization (GRPO)"; "each rollout generates 8,192 outputs, which are randomly split into 16 minibatches and trained for only a single inner epoch". |
| [Asynchronous RLHF](https://arxiv.org/abs/2410.18252), ICLR 2025 | LLM | "RLHF performance generally degrades with more off-policyness"; the asynchronous setup trains faster, and Online DPO is "most robust to off-policy data". |
| [FastTD3](https://arxiv.org/abs/2505.22642v3), May 2025 (second quote from v2 and later) | Humanoid, sim to real | "practitioners have mostly used Proximal Policy Optimization (PPO ...) for training deployable policies in simulation"; calls its humanoid result, "to the best of our knowledge, the first documented instance of a successful deployment of an off-policy RL policy on a full-size humanoid robot in the real world". |
| [MiniMax-M1](https://arxiv.org/abs/2506.13585), Jun 2025 | LLM | "16 rounds of off-policy updates per generation batch"; its CISPO loss "clips the importance sampling weights". |
| [ScaleRL](https://arxiv.org/abs/2510.13786), Oct 2025 | LLM | "8 steps off-policyness" (a maximum lag) with a truncated importance-sampling loss. The abstract says the off-policy algorithm mainly changes compute efficiency; Appendix A.11 says it also shifts the asymptote, "one of the most consequential design decisions in RL post-training". |
| [RECAP in π\*0.6](https://arxiv.org/abs/2511.14759), Nov 2025 | Real-robot VLA | "an iterated offline RL framework"; it must "effectively utilize both good (near-optimal) and bad (suboptimal) data" and avoids "the need for on-policy PPO or REINFORCE". |

**Limits.** Hand-picked examples can't support a share or a trend, both surveys are curated, and the mention proxy measures attention, not use. Robot foundation models trained by imitation, such as [RT-1](https://arxiv.org/abs/2212.06817) ("it is an imitation learning method", 130k demonstrations), aren't counted here. All sources were accessed on 22 October 2026.

</details>

[Part 5: the deadly triad](/robotics/rl-5-the-deadly-triad/) follows the shared-weight feedback all the way to a growing number. Later, [Part 6](/robotics/rl-6-credit-and-careful-updates/#sec-ppo) turns action credit into the policy updates that PPO and GRPO make.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
