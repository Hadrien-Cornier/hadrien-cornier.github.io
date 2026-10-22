---
title: 'The deadly triad: how a guess can train itself upward'
description: 'An exact two-state feedback loop, three scoped pair guarantees and DQN stabilizers.'
date: '2026-10-19'
draft: false
series: 'Reinforcement learning'
part: 5
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-5-the-deadly-triad-whole.svg'
thumbnail_alt: 'rl-5-the-deadly-triad'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 1144" data-whole="0 0 680 1144" data-views='{"feedback":[24,46,300,220],"two-state":[364,46,300,220],"linear-pair":[24,326,300,220],"fixed-labels":[364,326,300,220],"tabular-pair":[24,606,300,220],"dqn":[364,606,300,220],"diagnostics":[24,886,300,220]}' role="img" aria-label="Whole mechanism map: The deadly triad: how a guess can train itself upward"><g class="rc-panel" data-panel="feedback"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. Three pressures, one loop</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="A shared update raises a next-state value, bootstrapping raises the target, and mismatched sampling misses a corrective update"><defs><marker id="canvas-5-0-p5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="22" text-anchor="middle">shared update</text><path d="M171 31Q264 49 258 93" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-0-p5a)"/><text x="241" y="117" text-anchor="middle">next value</text><text x="241" y="140" text-anchor="middle">rises</text><path d="M227 150Q168 188 101 160" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-0-p5a)"/><text x="66" y="139" text-anchor="middle">target</text><text x="66" y="162" text-anchor="middle">rises</text><path d="M43 115Q27 42 121 30" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-0-p5a)"/><path d="M151 79V131" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4"/><path d="M139 97L163 119M163 97L139 119" stroke="#b44c2c" stroke-width="3"/><text x="150" y="200" text-anchor="middle">sampling misses correction</text></g></svg></g><g class="rc-panel" data-panel="two-state"><rect x="352" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. Two states, one weight</text><svg x="364" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Only the transition from value w to value two w is replayed; changing w raises both estimates"><defs><marker id="canvas-5-1-p5b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="65" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="224" cy="65" r="32" fill="#d7e5ee" stroke="#242622"/><text x="55" y="59" text-anchor="middle">s₁</text><text x="55" y="81" text-anchor="middle">w</text><text x="224" y="59" text-anchor="middle">s₂</text><text x="224" y="81" text-anchor="middle">2w</text><path d="M89 65H188" stroke="#b44c2c" stroke-width="3" marker-end="url(#canvas-5-1-p5b)"/><text x="140" y="47" text-anchor="middle">R = 0</text><path d="M214 31C185 -1 284 -1 251 43" fill="none" stroke="#777" stroke-width="2" marker-end="url(#canvas-5-1-p5b)"/><path d="M160 71Q149 133 79 104" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-1-p5b)"/><text x="150" y="146" text-anchor="middle">replay s₁ → s₂ only</text><text x="150" y="175" text-anchor="middle">w rises → 2w rises</text><text x="150" y="205" text-anchor="middle">no updates starting at s₂</text></g></svg></g><g class="rc-panel" data-panel="linear-pair"><rect x="12" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="316">3. Match the prediction distribution</text><svg x="24" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Bellman prediction followed by projection shrinks the distance between two value estimates in the matching stationary norm"><defs><marker id="canvas-5-2-p5c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="35" cy="45" r="7" fill="#2b6a8e"/><circle cx="265" cy="45" r="7" fill="#b44c2c"/><path d="M44 45H256" stroke="#777" stroke-width="2"/><text x="150" y="29" text-anchor="middle">two predictions: distance d</text><path d="M35 57L99 110M265 57L201 110" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-2-p5c)"/><text x="150" y="90" text-anchor="middle">Bellman + projection</text><circle cx="104" cy="125" r="7" fill="#2b6a8e"/><circle cx="196" cy="125" r="7" fill="#b44c2c"/><path d="M113 125H187" stroke="#777" stroke-width="2"/><text x="150" y="160" text-anchor="middle">distance ≤ γd</text><text x="150" y="187" text-anchor="middle">same stationary weighting</text><text x="150" y="211" text-anchor="middle">for transitions and fitting</text></g></svg></g><g class="rc-panel" data-panel="fixed-labels"><rect x="352" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="316">4. Keep the labels fixed</text><svg x="364" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Predictions move toward labels held fixed as the weights change"><defs><marker id="canvas-5-3-p5d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">fixed reward-only labels</text><path d="M32 48H267" stroke="#2b6a8e" stroke-width="2"/><circle cx="60" cy="48" r="6" fill="#2b6a8e"/><circle cx="150" cy="48" r="6" fill="#2b6a8e"/><circle cx="240" cy="48" r="6" fill="#2b6a8e"/><circle cx="60" cy="144" r="6" fill="#b44c2c"/><circle cx="150" cy="120" r="6" fill="#b44c2c"/><circle cx="240" cy="162" r="6" fill="#b44c2c"/><path d="M60 132V63M150 108V63M240 150V63" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-3-p5d)"/><text x="150" y="187" text-anchor="middle">predictions move toward y</text><text x="150" y="212" text-anchor="middle">changing w leaves y fixed</text></g></svg></g><g class="rc-panel" data-panel="tabular-pair"><rect x="12" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="596">5. Separate the table entries</text><svg x="24" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="One table cell takes a backup from the next-state row while all other cells stay fixed"><defs><marker id="canvas-5-4-p5e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">independent table entries</text><rect x="73" y="42" width="192" height="111" fill="#fff" stroke="#242622"/><path d="M73 79H265M73 116H265M137 42V153M201 42V153" stroke="#777"/><rect x="137" y="79" width="64" height="37" fill="#d7e5ee"/><text x="40" y="104" text-anchor="middle">s</text><text x="40" y="140" text-anchor="middle">s′</text><text x="105" y="140" text-anchor="middle">2</text><text x="169" y="140" text-anchor="middle">5</text><text x="233" y="140" text-anchor="middle">1</text><path d="M169 149Q293 190 287 96Q285 61 203 87" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-4-p5e)"/><text x="150" y="188" text-anchor="middle">max supplies target</text><text x="150" y="213" text-anchor="middle">update one cell only</text></g></svg></g><g class="rc-panel" data-panel="dqn"><rect x="352" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="596">6. Slow the target feedback</text><svg x="364" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Replay sends a transition to online and frozen networks; only the online network updates until a periodic copy"><defs><marker id="canvas-5-5-p5f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">sample a replay transition</text><path d="M125 35L65 70M175 35L235 70" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-5-p5f)"/><rect x="12" y="79" width="116" height="51" fill="#d7e5ee" stroke="#242622"/><rect x="172" y="79" width="116" height="51" fill="#eee" stroke="#242622"/><text x="70" y="100" text-anchor="middle">online θ</text><text x="70" y="121" text-anchor="middle">prediction</text><text x="230" y="100" text-anchor="middle">frozen θ⁻</text><text x="230" y="121" text-anchor="middle">target y</text><path d="M171 145H92" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-5-5-p5f)"/><text x="157" y="171" text-anchor="middle">update θ only</text><path d="M65 180Q150 218 239 181" fill="none" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#canvas-5-5-p5f)"/><text x="150" y="215" text-anchor="middle">copy θ → θ⁻ periodically</text></g></svg></g><g class="rc-panel" data-panel="diagnostics"><rect x="12" y="852" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="876">7. Check estimates beside rewards</text><svg x="24" y="886" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="The estimate curve crosses a known possible-return bound while zero reward stays flat"><defs><marker id="canvas-5-6-p5g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><path d="M36 175V24M36 175H284" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-5-6-p5g)"/><path d="M38 99H283" stroke="#777" stroke-width="2" stroke-dasharray="5 4"/><text x="156" y="88" text-anchor="middle">return bound</text><path d="M38 163C125 160 197 139 262 28" fill="none" stroke="#b44c2c" stroke-width="3"/><text x="165" y="42" text-anchor="middle">estimate ↑</text><path d="M38 172H277" stroke="#2b6a8e" stroke-width="3"/><text x="155" y="157" text-anchor="middle">reward stays zero</text><text x="160" y="203" text-anchor="middle">updates →</text><text x="19" y="120" transform="rotate(-90 19 120)" text-anchor="middle">value</text></g></svg></g></svg></div></div>
<div class="rc-body">

How can value estimates grow forever when every reward is zero?

**Part 5.** Three useful ideas can form a feedback loop. A shared formula changes several predictions at once. Bootstrapping turns a prediction into a target. Sampling away from the target policy's state distribution can leave the inflated prediction without enough correction. The **deadly triad** names this risk, not an inevitable outcome.

Throughout, $S_t$ and $A_t$ are the state and action at step $t$, and $R_{t+1}$ is the reward after that action. The discount is $0\leq\gamma<1$, and $\alpha_t>0$ is a learning rate. A superscript $+$ marks an updated quantity. Here, $t$ is a step index, not an exponent. Let's calculate one loop that keeps growing, then compare three settings where learning is stable under specific assumptions. [Van Hasselt et al., §2](https://arxiv.org/abs/1812.02648).

**Reading goal:** work out why the weight grows by 8% per replay, then identify exactly which assumption each stable pair restores.

<nav class="rc-route" aria-label="Reading route"><a href="#sec-feedback" data-go="sec-feedback">Three pressures, one loop</a><a href="#sec-two-state" data-go="sec-two-state">Two states, one weight</a><a href="#sec-linear-pair" data-go="sec-linear-pair">Match the prediction distribution</a><a href="#sec-fixed-labels" data-go="sec-fixed-labels">Keep the labels fixed</a><a href="#sec-tabular-pair" data-go="sec-tabular-pair">Separate the table entries</a><a href="#sec-dqn" data-go="sec-dqn">Slow the target feedback</a><a href="#sec-diagnostics" data-go="sec-diagnostics">Check estimates beside rewards</a></nav>

<div class="rc-mark" id="sec-feedback" data-panel="feedback" data-view="feedback" data-title="Three pressures, one loop"></div>

## Three pressures, one loop

If you wait for an episode to end, you delay learning. If you keep a table for every observation, you run out of memory. And if you require data from exactly the policy you're evaluating, you limit what you can reuse. Bootstrapping, function approximation and off-policy learning address those three problems.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="A shared update raises a next-state value, bootstrapping raises the target, and mismatched sampling misses a corrective update"><defs><marker id="p5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="22" text-anchor="middle">shared update</text><path d="M171 31Q264 49 258 93" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5a)"/><text x="241" y="117" text-anchor="middle">next value</text><text x="241" y="140" text-anchor="middle">rises</text><path d="M227 150Q168 188 101 160" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5a)"/><text x="66" y="139" text-anchor="middle">target</text><text x="66" y="162" text-anchor="middle">rises</text><path d="M43 115Q27 42 121 30" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5a)"/><path d="M151 79V131" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4"/><path d="M139 97L163 119M163 97L139 119" stroke="#b44c2c" stroke-width="3"/><text x="150" y="200" text-anchor="middle">sampling misses correction</text></g></svg><figcaption>Feedback view. Fixed: rewards. Change: coupled predictions and their targets. Follow the rising loop and the missing corrective update.</figcaption></figure>

Read the loop clockwise: raising one prediction also raises the successor prediction that shares its weights. That successor supplies the next target, so the sampled updates raise the original prediction again. With too little corrective sampling, this loop can keep growing. We'll calculate the multiplier in the next section. The missing correction is what matters here. Raising a successor is harmless if later data correct it, but if replay never trains there, the inflated target can stay in place. [Van Hasselt et al., §2](https://arxiv.org/abs/1812.02648).

Each of the three pairs below is stable in a specific setting with its own assumptions. That doesn't give us a universal rule that any pair is safe or that every triple diverges.

<div class="rc-mark" id="sec-two-state" data-panel="two-state" data-view="two-state" data-title="Two states, one weight"></div>

## Two states, one weight

Suppose we have states $s_1,s_2$ and a target policy $\pi$ with one available action. It moves from $s_1$ to $s_2$, then loops at $s_2$. Every reward is zero, so both true values are zero. The subscripts 1 and 2 label states. We use a scalar weight $w$ and scalar feature $\phi(s)$ to produce estimates $v_w(s_1)=w$ and $v_w(s_2)=2w$, from fixed features $\phi(s_1)=1$ and $\phi(s_2)=2$.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Only the transition from value w to value two w is replayed; changing w raises both estimates"><defs><marker id="p5b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="65" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="224" cy="65" r="32" fill="#d7e5ee" stroke="#242622"/><text x="55" y="59" text-anchor="middle">s₁</text><text x="55" y="81" text-anchor="middle">w</text><text x="224" y="59" text-anchor="middle">s₂</text><text x="224" y="81" text-anchor="middle">2w</text><path d="M89 65H188" stroke="#b44c2c" stroke-width="3" marker-end="url(#p5b)"/><text x="140" y="47" text-anchor="middle">R = 0</text><path d="M214 31C185 -1 284 -1 251 43" fill="none" stroke="#777" stroke-width="2" marker-end="url(#p5b)"/><path d="M160 71Q149 133 79 104" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5b)"/><text x="150" y="146" text-anchor="middle">replay s₁ → s₂ only</text><text x="150" y="175" text-anchor="middle">w rises → 2w rises</text><text x="150" y="205" text-anchor="middle">no updates starting at s₂</text></g></svg><figcaption>State view. Fixed: zero rewards and one action. Change: shared weight during replay. Only the red transition trains the model.</figcaption></figure>

Now suppose we replay only $s_1\to s_2$, forever. Let $\delta$ be its temporal-difference error and $\alpha$ a constant learning rate. The semi-gradient update treats the target as fixed while differentiating the current prediction:

$$\begin{aligned}
\delta&=0+\gamma(2w)-w=(2\gamma-1)w,\\
w^+&=w+\alpha\delta\phi(s_1)=[1+\alpha(2\gamma-1)]w.
\end{aligned}$$

Let $n$ count replay updates, $w_n$ be the resulting weight and $w_0$ its initial value. With $\gamma=0.9$, $\alpha=0.1$, and $w_0=1$, we get $w_n=1.08^n$. This is an exact calculation. Because the multiplier exceeds one, positive estimates keep growing even though every reward is zero.

| Replay update $n$ | Weight $w_n$ | Estimate at $s_1$ | Estimate at $s_2$ |
| --- | ---: | ---: | ---: |
| 0 | 1 | 1 | 2 |
| 1 | 1.08 | 1.08 | 2.16 |
| 2 | 1.1664 | 1.1664 | 2.3328 |

Every true value is still zero. The growth comes from multiplying by 1.08 repeatedly, rather than from any observed reward.

Here the mismatch is **state sampling**, not action choice. Target-policy trajectories eventually stay at $s_2$, but replay never starts there. This construction violates state coverage, so it isn't a counterexample to the pair guarantees below. [Two-state construction](https://arxiv.org/abs/1812.02648).

<div class="rc-mark" id="sec-linear-pair" data-panel="linear-pair" data-view="linear-pair" data-title="Match the prediction distribution"></div>

## Match the prediction distribution

The replay example left out the state that needed correction. What happens if we sample from the fixed policy's own trajectories while keeping approximation and bootstrapping? This changes the weighting used in the stability argument. For feature vector $\phi(s)$ and weight vector $w$, define $v_w(s)=\phi(s)^\top w$, where $\top$ means transpose. Let $\delta_t$ be the TD error, $w^+$ the updated weights and $\alpha_t$ the current step size. $S_{t+1}$ is the observed successor:

$$\begin{aligned}
\delta_t&=R_{t+1}+\gamma v_w(S_{t+1})-v_w(S_t),\\
w^+&=w+\alpha_t\delta_t\phi(S_t).
\end{aligned}$$

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Bellman prediction followed by projection shrinks the distance between two value estimates in the matching stationary norm"><defs><marker id="p5c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="35" cy="45" r="7" fill="#2b6a8e"/><circle cx="265" cy="45" r="7" fill="#b44c2c"/><path d="M44 45H256" stroke="#777" stroke-width="2"/><text x="150" y="29" text-anchor="middle">two predictions: distance d</text><path d="M35 57L99 110M265 57L201 110" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#p5c)"/><text x="150" y="90" text-anchor="middle">Bellman + projection</text><circle cx="104" cy="125" r="7" fill="#2b6a8e"/><circle cx="196" cy="125" r="7" fill="#b44c2c"/><path d="M113 125H187" stroke="#777" stroke-width="2"/><text x="150" y="160" text-anchor="middle">distance ≤ γd</text><text x="150" y="187" text-anchor="middle">same stationary weighting</text><text x="150" y="211" text-anchor="middle">for transitions and fitting</text></g></svg><figcaption>Value-space view. Fixed: policy, features and stationary weighting. Change: candidate predictions. Compare their distance before and after the map.</figcaption></figure>

For any value vector $v$, let $T^\pi v$ be the expected one-step reward plus discounted next value under $\pi$. Let $D$ have stationary state probabilities $d(s)$ on its diagonal, with weighted norm for a value vector $x$ defined by $\|x\|_D^2=\sum_s d(s)x(s)^2$. Let $\Pi_D$ be orthogonal projection onto the feature space in this norm. The squared norm above defines the distance after taking its square root. For candidate value vectors $v,u$, the composition $\Pi_DT^\pi$ first forms the Bellman target and then projects it:

$$\|\Pi_DT^\pi v-\Pi_DT^\pi u\|_D\leq\gamma\|v-u\|_D.$$

**Numerical reading:** with $\gamma=0.9$, two candidate predictions at distance 2 in this norm are at most 1.8 apart after the projected map. We measure the distance with the same stationary probabilities before and after. If we change those probabilities, this particular comparison no longer holds.

Stationary averaging and orthogonal projection don't enlarge the distance, and discounting shrinks it. There is one projected fixed point. Under its conditions, sampled linear TD reaches that solution, though its update isn't literally repeated projection. Off-policy state weighting can break the argument because the norms no longer match. [Tsitsiklis and Van Roy](https://web.mit.edu/~jnt/www/Papers/J063-97-bvr-td.pdf).

<details><summary>Conditions for this linear prediction result</summary>
<p>This is a fixed-policy prediction result. A finite irreducible, aperiodic chain supplies a stationary distribution and repeated on-policy visits. Rewards are bounded, the discount is below 1, and the fixed feature columns are linearly independent.</p>
<p>Positive diminishing learning rates have infinite sum and finite squared sum: they retain enough total adjustment while suppressing persistent sampling noise. These assumptions support the linear result cited above; they do not cover arbitrary neural networks or a changing control policy.</p>
</details>

<div class="rc-mark" id="sec-fixed-labels" data-panel="fixed-labels" data-view="fixed-labels" data-title="Keep the labels fixed"></div>

## Keep the labels fixed

A moving target prevents us from fitting an ordinary fixed objective. So let's keep approximation and off-policy data, but wait for reward-only returns. With suitable coverage, importance correction can give us target-policy labels without using a guessed future value. We freeze those labels before fitting.

Let $X$ be the fixed feature matrix, $y$ the vector of corrected labels, and $w$ the linear weights. The Euclidean norm $\|\cdot\|_2$ measures vector length. Let $L$ be squared-error loss and $\eta$ the batch learning rate. $X^\top$ transposes $X$, and $w^+$ is the updated vector:

$$\begin{aligned}
L(w)&=\tfrac12\|Xw-y\|_2^2,\\
w^+&=w-\eta X^\top(Xw-y).
\end{aligned}$$

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Predictions move toward labels held fixed as the weights change"><defs><marker id="p5d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">fixed reward-only labels</text><path d="M32 48H267" stroke="#2b6a8e" stroke-width="2"/><circle cx="60" cy="48" r="6" fill="#2b6a8e"/><circle cx="150" cy="48" r="6" fill="#2b6a8e"/><circle cx="240" cy="48" r="6" fill="#2b6a8e"/><circle cx="60" cy="144" r="6" fill="#b44c2c"/><circle cx="150" cy="120" r="6" fill="#b44c2c"/><circle cx="240" cy="162" r="6" fill="#b44c2c"/><path d="M60 132V63M150 108V63M240 150V63" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5d)"/><text x="150" y="187" text-anchor="middle">predictions move toward y</text><text x="150" y="212" text-anchor="middle">changing w leaves y fixed</text></g></svg><figcaption>Regression view. Fixed: observations and corrected labels. Change: predictions. Compare vertical errors as weights move toward a fixed objective.</figcaption></figure>

If $X$ has full column rank, its curvature matrix $X^\top X$ is positive definite. Let $\lambda_{\max}$ be that matrix's largest eigenvalue and $w_*$ the unique empirical minimizer. The notation $^{-1}$ means inverse:

$$0<\eta<\frac{2}{\lambda_{\max}}\quad\Longrightarrow\quad w\to w_*=(X^\top X)^{-1}X^\top y.$$

**One-dimensional check:** with $X=[1]$ and $y=[2]$, the largest eigenvalue is 1. Let's choose $\eta=0.5$, which is within the bound. The update becomes $w^+=w-0.5(w-2)$, taking $0\to1\to1.5\to1.75$. It approaches the fixed label of 2.

With that step size, every curvature direction contracts. If we add bootstrapping, the labels depend on the current predictions, so this fixed-objective argument no longer applies. [Sutton and Barto, §§5.5, 9.2](http://incompleteideas.net/book/RLbook2020.pdf).

<details><summary>Conditions for this regression example</summary>
<p>Freeze the target and behavior policies, linear features and recorded data. Use independent finite-horizon episodes with bounded rewards and features. Behavior must cover the target actions and the starting states whose values are being fitted; corrected labels need finite variance for statistical claims.</p>
<p>Full column rank gives a unique empirical fit. The batch step-size bound stated above makes optimization approach it. Finite data need not recover the true target-policy value; large importance weights can make that statistical estimate poor.</p>
</details>

<div class="rc-mark" id="sec-tabular-pair" data-panel="tabular-pair" data-view="tabular-pair" data-title="Separate the table entries"></div>

## Separate the table entries

When we fit the current state, a shared weight can also change the successor prediction. Let's keep bootstrapping and off-policy learning, but remove that coupling by giving every state-action pair its own table entry. Let $Q$ be that table. The symbols $s,a,r,s'$ denote the observed $S_t,A_t,R_{t+1},S_{t+1}$, and $a'$ ranges over next actions. Q-learning changes only:

$$Q^+(s,a)=Q(s,a)+\alpha_t\bigl[r+\gamma\max_{a'}Q(s',a')-Q(s,a)\bigr].$$

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="One table cell takes a backup from the next-state row while all other cells stay fixed"><defs><marker id="p5e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">independent table entries</text><rect x="73" y="42" width="192" height="111" fill="#fff" stroke="#242622"/><path d="M73 79H265M73 116H265M137 42V153M201 42V153" stroke="#777"/><rect x="137" y="79" width="64" height="37" fill="#d7e5ee"/><text x="40" y="104" text-anchor="middle">s</text><text x="40" y="140" text-anchor="middle">s′</text><text x="105" y="140" text-anchor="middle">2</text><text x="169" y="140" text-anchor="middle">5</text><text x="233" y="140" text-anchor="middle">1</text><path d="M169 149Q293 190 287 96Q285 61 203 87" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5e)"/><text x="150" y="188" text-anchor="middle">max supplies target</text><text x="150" y="213" text-anchor="middle">update one cell only</text></g></svg><figcaption>Table view. Fixed: every other entry during this update. Change: the blue cell. Follow the maximum in the next row back to its predecessor.</figcaption></figure>

**One entry at a time:** with reward 0, next-row maximum 5 and $\gamma=0.9$, the target is 4.5. A step size of 0.5 takes an old entry of 2 to 3.25. Every other table entry, including the successor maximum, stays unchanged during this update.

Let $T_*$ map a candidate table to its expected Q-learning target. For candidate tables $q,u$, define $\|q-u\|_\infty$ as their largest absolute entrywise difference. The composition $T_*q$ applies that expected-target map to $q$; $\leq$ means at most. Then:

$$\|T_*q-T_*u\|_\infty\leq\gamma\|q-u\|_\infty.$$

A maximum and an expectation cannot enlarge the largest difference, and discounting shrinks it. With enough sampling, Q-learning converges to the optimal table. Shared approximation adds a fitting step that can also change the next-state values. Once that happens, the tabular argument alone no longer controls learning. [Watkins and Dayan, 1992](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf).

<details><summary>Conditions for tabular Q-learning</summary>
<p>The task is a finite Markov decision process with fixed transition and reward laws, bounded rewards and discount below 1. Every nonterminal state-action pair must receive infinitely many updates.</p>
<p>Each pair's positive learning rates are at most 1, have infinite sum and finite squared sum. A replay buffer omitting a pair fails the visit assumption; a constant noisy step size fails the shrinking-step assumption. The theorem cited above concerns the resulting infinite update sequence, not a finite successful route.</p>
</details>

<div class="rc-mark" id="sec-dqn" data-panel="dqn" data-view="dqn" data-title="Slow the target feedback"></div>

## Slow the target feedback

The guessed tail can change after every shared-weight update. DQN keeps all three ingredients, so it needs ways to slow that feedback. It uses two devices to help manage it. Replay samples stored transitions, reducing temporal correlation and changing the update distribution. A frozen target network holds the guessed labels still for a bounded period. Replay doesn't make the data on-policy.

Let $Q_\theta$ be the online action-value network with weights $\theta$, and $Q_{\theta^-}$ its frozen copy. Let $d$ be one for a terminal transition and zero otherwise, $y$ the target, and $\nabla_\theta$ the gradient with respect to online weights. Here $s,a,r,s'$ are the current state, action, observed reward and successor. The symbol $a'$ ranges over next actions, and $\theta^+$ is the updated online network. The superscript minus labels the frozen copy, not subtraction. Using these transition symbols:

$$\begin{aligned}
y&=r+\gamma(1-d)\max_{a'}Q_{\theta^-}(s',a'),\\
\theta^+&=\theta+\alpha_t[y-Q_\theta(s,a)]\nabla_\theta Q_\theta(s,a).
\end{aligned}$$

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Replay sends a transition to online and frozen networks; only the online network updates until a periodic copy"><defs><marker id="p5f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle">sample a replay transition</text><path d="M125 35L65 70M175 35L235 70" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#p5f)"/><rect x="12" y="79" width="116" height="51" fill="#d7e5ee" stroke="#242622"/><rect x="172" y="79" width="116" height="51" fill="#eee" stroke="#242622"/><text x="70" y="100" text-anchor="middle">online θ</text><text x="70" y="121" text-anchor="middle">prediction</text><text x="230" y="100" text-anchor="middle">frozen θ⁻</text><text x="230" y="121" text-anchor="middle">target y</text><path d="M171 145H92" stroke="#b44c2c" stroke-width="2" marker-end="url(#p5f)"/><text x="157" y="171" text-anchor="middle">update θ only</text><path d="M65 180Q150 218 239 181" fill="none" stroke="#2b6a8e" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#p5f)"/><text x="150" y="215" text-anchor="middle">copy θ → θ⁻ periodically</text></g></svg><figcaption>Training view. Fixed between copies: target weights. Change: online predictions. Compare the frequent learning arrow with the periodic copy.</figcaption></figure>

The terminal mask removes the nonexistent future after an episode ends. This is a **semi-gradient** update: gradients flow through the current prediction while $y$ stays fixed. Let $C$ be the positive number of updates between target copies:

```text
store each observed transition in replay
sample a transition (s, a, r, s′, d)
compute y using frozen weights theta_minus
update online weights theta toward y
if C updates have passed: theta_minus = theta
```

Freezing delays the target feedback, but it doesn't prove global convergence, even in the two-state family of examples. [Mnih et al., Methods, primary PDF](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf); [van Hasselt et al.](https://arxiv.org/abs/1812.02648).

<div class="rc-mark" id="sec-diagnostics" data-panel="diagnostics" data-view="diagnostics" data-title="Check estimates beside rewards"></div>

## Check estimates beside rewards

A task score tells you how the policy acts. Value estimates also need checking. If each reward has absolute magnitude at most $R_{\max}$, let $G_t$ be the discounted return from step $t$. The bars $|\cdot|$ mean absolute magnitude. The return adds future rewards with a factor $\gamma$ per step; the geometric sum gives:

$$|G_t|\leq\frac{R_{\max}}{1-\gamma}.$$

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="The estimate curve crosses a known possible-return bound while zero reward stays flat"><defs><marker id="p5g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><path d="M36 175V24M36 175H284" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#p5g)"/><path d="M38 99H283" stroke="#777" stroke-width="2" stroke-dasharray="5 4"/><text x="156" y="88" text-anchor="middle">return bound</text><path d="M38 163C125 160 197 139 262 28" fill="none" stroke="#b44c2c" stroke-width="3"/><text x="165" y="42" text-anchor="middle">estimate ↑</text><path d="M38 172H277" stroke="#2b6a8e" stroke-width="3"/><text x="155" y="157" text-anchor="middle">reward stays zero</text><text x="160" y="203" text-anchor="middle">updates →</text><text x="19" y="120" transform="rotate(-90 19 120)" text-anchor="middle">value</text></g></svg><figcaption>Diagnostic view. The red estimates cross the permitted return range while the reward stays zero.</figcaption></figure>

For example, if rewards are bounded in magnitude by 1 and $\gamma=0.9$, the bound is 10. A prediction of 100 cannot be the correct discounted return. Start by checking the reward scale and terminal handling, then inspect sampling and target feedback.

An estimate outside this range is wrong for the specified discounted task. A finite spike establishes an error, but claiming divergence to infinity is a stronger mathematical statement.

- **Coverage:** identify which states and actions the updates omit.
- **Coupling:** check which other predictions move after one update.
- **Targets:** identify when labels change and where gradients stop.
- **Scope:** linear prediction and tabular convergence results require their stated conditions.


<details>
<summary>The three pairs: detailed stability arguments and conditions</summary>

Each pair below has a particular stable construction under stated assumptions. They explain why removing one source of feedback can help. The deadly triad names a risk when all three ingredients are present; it is not a rule that every pair is safe or every triple diverges.

<figure><img src="/assets/robotics/rl/deadly-triad.svg" alt="Three ingredients around a feedback loop, with a stable construction for each pair" loading="lazy"><figcaption>Shared predictions, guessed targets and off-policy data can reinforce an error. Each pair has a different stability argument.</figcaption></figure>

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
<p>Each pair's positive learning rates are at most 1, have infinite sum and finite squared sum. A replay buffer omitting a pair fails the visit assumption; a constant noisy step size fails the shrinking-step assumption. The theorem cited above concerns the resulting infinite update sequence, not a finite successful route.</p>
</details>
</section>

</div>

</details>

Across the series, we've used values to connect late rewards to earlier choices. The triad matters because sharing that credit can also share an error, which then becomes the next target. [Return to the method tree](/robotics/rl-1-q-learning/#sec-tree), or [the opening problems](/robotics/rl-0-overview/).

The next three parts look at failures outside the triad: [policy-gradient credit and update size](/robotics/rl-6-credit-and-careful-updates/), [learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/), and [mode averaging](/robotics/rl-8-mode-averaging/). The [failure map](/robotics/rl-0-overview/#sec-failures) groups them all.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
