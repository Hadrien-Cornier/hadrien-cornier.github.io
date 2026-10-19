---
title: 'Bootstrapping: learn before the reward arrives (Codex trial)'
description: 'How Monte Carlo, TD and n-step returns move credit backward, with a worked eight-state corridor.'
date: '2026-10-19'
draft: true
series: 'Reinforcement learning, Codex trial'
part: 2
layout: essay
---

<link rel="stylesheet" href="/assets/robotics/rl-codex/series.css">
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 954" data-whole="0 0 680 954" data-views='{"late":[24,46,300,220],"mc":[364,46,300,220],"td":[24,356,300,240],"corridor":[364,356,300,250],"nstep":[24,666,300,230],"horizon":[364,666,300,230]}' role="img" aria-label="Whole mechanism map: Bootstrapping: learn before the reward arrives"><g class="rc-panel" data-panel="late"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. A late reward</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-2-0-b2-late-title"><title id="canvas-2-0-b2-late-title">Zero rewards before the final reward</title><defs><marker id="canvas-2-0-b2-late-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Eight states, one final reward</text><path d="M32 74H266" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-0-b2-late-arr)"/><g fill="#d7e5ee" stroke="#242622"><rect x="15" y="52" width="28" height="42"/><rect x="46" y="52" width="28" height="42"/><rect x="77" y="52" width="28" height="42"/><rect x="108" y="52" width="28" height="42"/><rect x="139" y="52" width="28" height="42"/><rect x="170" y="52" width="28" height="42"/><rect x="201" y="52" width="28" height="42"/><rect x="232" y="52" width="28" height="42"/></g><text x="23" y="79">1</text><text x="54" y="79">2</text><text x="85" y="79">3</text><text x="116" y="79">4</text><text x="147" y="79">5</text><text x="178" y="79">6</text><text x="209" y="79">7</text><text x="240" y="79">8</text><text x="16" y="126">First seven moves: reward 0</text><text x="16" y="154" fill="#b44c2c">Last move → end: reward 1</text><path d="M246 168H32" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-0-b2-late-arr)"/><text x="16" y="202">Credit must reach earlier states</text></g></svg></g><g class="rc-panel" data-panel="mc"><rect x="352" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. Wait for the return</text><svg x="364" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-2-1-b2-mc-title"><title id="canvas-2-1-b2-mc-title">Monte Carlo waits then updates earlier states</title><defs><marker id="canvas-2-1-b2-mc-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">During walk: estimates wait</text><path d="M32 65H265" stroke="#656b62" stroke-width="2"/><circle cx="40" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="135" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="260" cy="65" r="20" fill="#e7c5b8" stroke="#242622"/><text x="35" y="71">0</text><text x="130" y="71">0</text><text x="251" y="71">+1</text><text x="16" y="110">Episode ends: return is known</text><path d="M260 93V145H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-1-b2-mc-arr)"/><text x="16" y="179">All eight targets = 1</text><text x="16" y="205">All eight estimates: 0 → 1</text></g></svg></g><g class="rc-panel" data-panel="td"><rect x="12" y="322" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="346">3. Borrow the next estimate</text><svg x="24" y="356" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-2-2-b2-td-title"><title id="canvas-2-2-b2-td-title">A next-state estimate supplies the TD target</title><defs><marker id="canvas-2-2-b2-td-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="244" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><text x="39" y="67">0.2</text><text x="228" y="67">0.8</text><path d="M91 61H207" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-2-b2-td-arr)"/><text x="109" y="45">reward 0</text><path d="M244 98V125H55V153" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-2-b2-td-arr)"/><text x="83" y="117">discount × 0.9</text><text x="16" y="180">Target: 0 + 0.9 × 0.8 = 0.72</text><text x="16" y="215">Halfway update: 0.2 → 0.46</text></g></svg></g><g class="rc-panel" data-panel="corridor"><rect x="352" y="322" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="346">4. Credit travels backward</text><svg x="364" y="356" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-2-3-b2-cor-title"><title id="canvas-2-3-b2-cor-title">One-step credit moves one state per forward walk</title><defs><marker id="canvas-2-3-b2-cor-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">State</text><text y="27"><tspan x="100">1</tspan><tspan x="123">2</tspan><tspan x="146">3</tspan><tspan x="169">4</tspan><tspan x="192">5</tspan><tspan x="215">6</tspan><tspan x="238">7</tspan><tspan x="261">8</tspan></text><text x="16" y="66">Walk 1</text><text y="66"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238">0</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="105">Walk 2</text><text y="105"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="144">Walk 3</text><text y="144"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215" fill="#b44c2c">1</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><path d="M250 158L112 193" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-3-b2-cor-arr)"/><text x="16" y="224">Walk 8: all eight values are 1</text></g></svg></g><g class="rc-panel" data-panel="nstep"><rect x="12" y="632" width="324" height="276" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="656">5. Look several steps ahead</text><svg x="24" y="666" height="230" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="canvas-2-4-b2-n-title"><title id="canvas-2-4-b2-n-title">Three real rewards followed by one guessed tail</title><defs><marker id="canvas-2-4-b2-n-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">Three steps before the guess</text><path d="M28 70H270" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-4-b2-n-arr)"/><circle cx="28" cy="70" r="8" fill="#242622"/><circle cx="108" cy="70" r="8" fill="#242622"/><circle cx="188" cy="70" r="8" fill="#242622"/><circle cx="270" cy="70" r="8" fill="#b44c2c"/><text x="42" y="57">0</text><text x="122" y="57">0</text><text x="202" y="57">1</text><text x="16" y="113">Rewards: 0 + 0 + 1</text><text x="16" y="142">Then: discounted endpoint value</text><path d="M270 84V165H30" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-4-b2-n-arr)"/><text x="16" y="203">One target crosses three steps</text></g></svg></g><g class="rc-panel" data-panel="horizon"><rect x="352" y="632" width="324" height="276" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="656">6. Choose the horizon</text><svg x="364" y="666" height="230" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="canvas-2-5-b2-h-title"><title id="canvas-2-5-b2-h-title">Increasing the backup replaces guesses with observed rewards</title><defs><marker id="canvas-2-5-b2-h-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="25">Blue: observed · rust: guessed</text><rect x="20" y="48" width="35" height="25" fill="#d7e5ee"/><rect x="55" y="48" width="220" height="25" fill="#e7c5b8"/><text x="20" y="96">One step: short wait, long guess</text><rect x="20" y="117" width="180" height="25" fill="#d7e5ee"/><rect x="200" y="117" width="75" height="25" fill="#e7c5b8"/><text x="20" y="165">More steps: more observations</text><path d="M30 190H265" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-5-b2-h-arr)"/><text x="22" y="218">Longer horizon → longer wait</text></g></svg></g></svg></div></div>
<div class="rc-body">

Seven moves pay nothing; the eighth pays one. How can the first move learn about that last reward before another walk begins? We will compare waiting for the completed return with borrowing a next-state estimate, then trace how far each update carries credit. That borrowing is bootstrapping. The worked corridor makes the timing in [Sutton and Barto, Chapters 5–7](http://incompleteideas.net/book/RLbook2020.pdf) explicit.

**Codex trial · Part 2.** [Previously: the Q table](/robotics/rl-1-q-learning-codex/).

<nav class="rc-route" aria-label="Reading route"><a href="#sec-late" data-go="sec-late">A late reward</a><a href="#sec-mc" data-go="sec-mc">Wait for the return</a><a href="#sec-td" data-go="sec-td">Borrow the next estimate</a><a href="#sec-corridor" data-go="sec-corridor">Credit travels backward</a><a href="#sec-nstep" data-go="sec-nstep">Look several steps ahead</a><a href="#sec-horizon" data-go="sec-horizon">Choose the horizon</a></nav>

<div class="rc-mark" id="sec-late" data-panel="late" data-view="late" data-title="A late reward"></div>

## A late reward

Suppose you walk through eight states and receive 1 only when you leave the last one. Every earlier move earns zero, but each still leads toward that reward. We want a value for the whole future after a state, rather than just its next reward.

Let $t$ be the current step, $S_t$ its state, $A_t$ the action taken there, and $R_{t+1}$ the reward after that action. An episode ends at step $T$. The discount $\gamma$, between 0 and 1 inclusive, reduces delayed rewards; $k$ counts steps ahead. The summation sign $\sum$ adds the terms indexed by $k$; $\gamma^k$ discounts a reward $k$ steps away. The **return** $G_t$ is

$$G_t=\sum_{k=0}^{T-t-1}\gamma^k R_{t+k+1}.$$

A fixed policy $\pi$ chooses actions. Its true value $v_\pi(s)$ at state $s$ is the expected return; $\mathbb E_\pi$ means averaging over futures following that policy. The vertical bar means conditioning on the starting state:

$$v_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s].$$

In this deterministic corridor, with no discounting, every nonterminal state is worth 1. Those eight values connect the last reward to earlier choices. [Sutton and Barto, Chapter 3](http://incompleteideas.net/book/RLbook2020.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="b2-late-title"><title id="b2-late-title">Zero rewards before the final reward</title><defs><marker id="b2-late-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Eight states, one final reward</text><path d="M32 74H266" stroke="#656b62" stroke-width="2" marker-end="url(#b2-late-arr)"/><g fill="#d7e5ee" stroke="#242622"><rect x="15" y="52" width="28" height="42"/><rect x="46" y="52" width="28" height="42"/><rect x="77" y="52" width="28" height="42"/><rect x="108" y="52" width="28" height="42"/><rect x="139" y="52" width="28" height="42"/><rect x="170" y="52" width="28" height="42"/><rect x="201" y="52" width="28" height="42"/><rect x="232" y="52" width="28" height="42"/></g><text x="23" y="79">1</text><text x="54" y="79">2</text><text x="85" y="79">3</text><text x="116" y="79">4</text><text x="147" y="79">5</text><text x="178" y="79">6</text><text x="209" y="79">7</text><text x="240" y="79">8</text><text x="16" y="126">First seven moves: reward 0</text><text x="16" y="154" fill="#b44c2c">Last move → end: reward 1</text><path d="M246 168H32" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-late-arr)"/><text x="16" y="202">Credit must reach earlier states</text></g></svg><figcaption>Path view. Fixed: eight forward transitions and their rewards. Learning changes the values. Read the credit arrow backward from the final reward.</figcaption></figure>

<div class="rc-mark" id="sec-mc" data-panel="mc" data-view="mc" data-title="Wait for the return"></div>

## Wait for the return

You can finish the walk and use what actually happened. This is episodic **Monte Carlo prediction**. Let $V(s)$ be the current estimate of $v_\pi(s)$ and $\alpha$ a step size greater than zero and at most 1. The arrow $\leftarrow$ replaces an estimate; brackets group the target-minus-estimate error. For each visited state, move its estimate toward its completed return:

$$V(S_t)\leftarrow V(S_t)+\alpha[G_t-V(S_t)].$$

Why it works: averaging sampled returns estimates the expected return. With a fixed policy, finite-variance returns, sufficient visits and suitable shrinking step sizes, the estimate settles toward that expectation. The target contains observed rewards throughout. [Sutton and Barto, Section 5.1](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Follow the fixed policy until the episode ends.
Walk backward through the saved transitions.
Accumulate the discounted return.
Move each visited state's estimate toward its return.
```

For our corridor, set every estimate to zero and the step size and discount to 1. After one completed walk, every state's target is 1, so every estimate becomes 1. Waiting works particularly well here: each return is exact because nothing is random.

The timing is the cost. A million-step episode delays the first completed-return update until its end. A continuing task has no terminal event to supply this particular target.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="b2-mc-title"><title id="b2-mc-title">Monte Carlo waits then updates earlier states</title><defs><marker id="b2-mc-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">During walk: estimates wait</text><path d="M32 65H265" stroke="#656b62" stroke-width="2"/><circle cx="40" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="135" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="260" cy="65" r="20" fill="#e7c5b8" stroke="#242622"/><text x="35" y="71">0</text><text x="130" y="71">0</text><text x="251" y="71">+1</text><text x="16" y="110">Episode ends: return is known</text><path d="M260 93V145H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-mc-arr)"/><text x="16" y="179">All eight targets = 1</text><text x="16" y="205">All eight estimates: 0 → 1</text></g></svg><figcaption>Timeline view. Fixed: the completed path. Values change after the end. Compare the waiting estimates above with the backward return calculation below.</figcaption></figure>

<div class="rc-mark" id="sec-td" data-panel="td" data-view="td" data-title="Borrow the next estimate"></div>

## Borrow the next estimate

What if the walk is still running? The return splits into the next reward and the return after it:

$$G_t=R_{t+1}+\gamma G_{t+1}.$$

**TD(0)**, one-step temporal-difference prediction, replaces that remaining return with the current next-state estimate. Here $G_{t+1}$ is the return from the next state. Define $Y_t$ as this target and $\delta_t$ as its difference from the current estimate; TD(0) means this one-step backup:

$$\begin{aligned}
Y_t&=R_{t+1}+\gamma V(S_{t+1}),\\
\delta_t&=Y_t-V(S_t),\\
V(S_t)&\leftarrow V(S_t)+\alpha\delta_t.
\end{aligned}$$

Set the terminal state's value to zero. Why it works: the Bellman equation links a state's expected return to its successor's expected return. TD learns that relationship from sampled transitions. For a finite discounted continuing task, or a proper episodic task with bounded expected episode lengths, suitable on-policy visits and step sizes give tabular convergence. [Sutton and Barto, Sections 6.1–6.2](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Take one action from the fixed policy.
Observe its reward and next state.
Target = reward + discounted next-state estimate.
Move the current estimate toward that target.
```

For an illustrative update, take reward 0, discount 0.9, next estimate 0.8, current estimate 0.2 and step size 0.5. The target is 0.72; the error is 0.52; the new estimate is 0.46. The reward stayed zero. The new information came from the successor's value.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="b2-td-title"><title id="b2-td-title">A next-state estimate supplies the TD target</title><defs><marker id="b2-td-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="244" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><text x="39" y="67">0.2</text><text x="228" y="67">0.8</text><path d="M91 61H207" stroke="#656b62" stroke-width="2" marker-end="url(#b2-td-arr)"/><text x="109" y="45">reward 0</text><path d="M244 98V125H55V153" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-td-arr)"/><text x="83" y="117">discount × 0.9</text><text x="16" y="180">Target: 0 + 0.9 × 0.8 = 0.72</text><text x="16" y="215">Halfway update: 0.2 → 0.46</text></g></svg><figcaption>Transition view. Fixed: reward 0 and the successor estimate for this update. The current value changes. Follow the lower arrow to see where its target comes from.</figcaption></figure>

<div class="rc-mark" id="sec-corridor" data-panel="corridor" data-view="corridor" data-title="Credit travels backward"></div>

## Credit travels backward

An update can start immediately and still carry new credit slowly. Return to the eight-state corridor, with zero initial estimates and $\alpha=\gamma=1$. Update online in forward order, immediately after each transition, once per visit.

On the first walk, the first seven targets are zero. Only the last state sees reward 1. On the second walk, state 7 reads the now-correct value at state 8. State 6 already updated before that happened, so it waits another walk.

Let $m$ count completed walks and $i$, from 1 to 8, identify a corridor state. Write $V_m(i)$ for its estimate after walk $m$, including $m=0$ before learning. The cases below assign 1 to the last $m$ states and 0 to the others:

$$V_m(i)=\begin{cases}1,&i>8-m,\\0,&i\leq8-m,\end{cases}\qquad 0\leq m\leq8.$$

Why this pattern holds: each forward pass reads the next state's value before that successor receives its own update. Credit advances one state backward per walk. Monte Carlo credits all eight after walk 1; TD(0) needs eight walks to credit the first state.

These counts describe the specified update order. Replaying transitions backward would propagate the reward across the whole chain in one pass. The mechanism is about how information moves, rather than a general speed ranking.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="b2-cor-title"><title id="b2-cor-title">One-step credit moves one state per forward walk</title><defs><marker id="b2-cor-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">State</text><text y="27"><tspan x="100">1</tspan><tspan x="123">2</tspan><tspan x="146">3</tspan><tspan x="169">4</tspan><tspan x="192">5</tspan><tspan x="215">6</tspan><tspan x="238">7</tspan><tspan x="261">8</tspan></text><text x="16" y="66">Walk 1</text><text y="66"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238">0</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="105">Walk 2</text><text y="105"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="144">Walk 3</text><text y="144"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215" fill="#b44c2c">1</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><path d="M250 158L112 193" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-cor-arr)"/><text x="16" y="224">Walk 8: all eight values are 1</text></g></svg><figcaption>Value-table view. Fixed: zero initialization, forward online updates and unit step size and discount. Red values spread backward. Compare rows after complete walks.</figcaption></figure>

<div class="rc-mark" id="sec-nstep" data-panel="nstep" data-view="nstep" data-title="Look several steps ahead"></div>

## Look several steps ahead

One guessed step can leave credit far behind its source. An **n-step return** bridges several transitions before borrowing an estimate. Let $n$ be the desired number of real rewards and $h=\min(n,T-t)$ the number available before the episode ends; $\min$ chooses the smaller count. Define $Y_t^{(n)}$ as the resulting target, with the superscript naming the backup length, and $S_{t+h}$ as its endpoint state:

$$\begin{aligned}
Y_t^{(n)}&=\sum_{k=0}^{h-1}\gamma^kR_{t+k+1}\\
&\quad+\begin{cases}
\gamma^hV(S_{t+h}),&t+h<T,\\
0,&t+h=T.
\end{cases}
\end{aligned}$$

Why it works: repeatedly expanding the return recursion exposes more observed rewards before the remaining guess. At the terminal state there is no future left to guess. [Sutton and Barto, Section 7.1](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Save transitions until n rewards are available.
Sum those rewards with their discounts.
Add the endpoint estimate if the episode continues.
Update the starting state; flush short returns at the end.
```

With three-step updates in the same corridor, the last three states receive credit on walk 1. The next three receive it on walk 2, and the first two on walk 3. This uses the usual delayed online n-step updates, followed by the terminal flush.

You wait longer for each target, but it can carry a newly observed outcome across more states. When the target reaches the end, it becomes the completed Monte Carlo return.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="b2-n-title"><title id="b2-n-title">Three real rewards followed by one guessed tail</title><defs><marker id="b2-n-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">Three steps before the guess</text><path d="M28 70H270" stroke="#656b62" stroke-width="2" marker-end="url(#b2-n-arr)"/><circle cx="28" cy="70" r="8" fill="#242622"/><circle cx="108" cy="70" r="8" fill="#242622"/><circle cx="188" cy="70" r="8" fill="#242622"/><circle cx="270" cy="70" r="8" fill="#b44c2c"/><text x="42" y="57">0</text><text x="122" y="57">0</text><text x="202" y="57">1</text><text x="16" y="113">Rewards: 0 + 0 + 1</text><text x="16" y="142">Then: discounted endpoint value</text><path d="M270 84V165H30" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-n-arr)"/><text x="16" y="203">One target crosses three steps</text></g></svg><figcaption>Backup view. Fixed: three observed rewards. The endpoint estimate supplies the remaining tail; the starting value changes. At an episode ending, omit that tail.</figcaption></figure>

<div class="rc-mark" id="sec-horizon" data-panel="horizon" data-view="horizon" data-title="Choose the horizon"></div>

## Choose the horizon

A longer target uses more actual experience and less of the current guess. It also includes more random rewards and transitions. For any state $s$, let $\varepsilon(s)=V(s)-v_\pi(s)$ be the estimation error: approximate value minus true policy value. $S_{t+n}$ is the endpoint after $n$ real transitions. Before termination, the guessed tail's contribution to target error is

$$\gamma^n\varepsilon(S_{t+n}).$$

The discount shrinks a given endpoint error as the horizon grows. The endpoint itself changes with $n$, so this expression gives no universal monotonic ranking of target bias or variance. Noisy rewards, correlated transitions and the accuracy of different endpoint estimates all matter. [Sutton and Barto, Chapters 6–7](http://incompleteideas.net/book/RLbook2020.pdf).

| Method | Learns | Target | Fails when | Adjustment | Source |
| --- | --- | --- | --- | --- | --- |
| Monte Carlo | Policy value | Full return | Episodes are too long | Bootstrap sooner | [Ch. 5](http://incompleteideas.net/book/RLbook2020.pdf) |
| TD(0) | Policy value | One reward + guess | Credit moves slowly | Extend backup | [Ch. 6](http://incompleteideas.net/book/RLbook2020.pdf) |
| n-step TD | Policy value | Several rewards + guess | Targets wait or fluctuate | Tune horizon | [Ch. 7](http://incompleteideas.net/book/RLbook2020.pdf) |

**Bootstrapping buys:**

- **Early updates.** Learn before an episode finishes.
- **Continuing prediction.** Use discounted targets without waiting for an ending.
- **Shared successors.** Reuse what other visits taught the next state's estimate.

**Costs and assumptions:**

- **Wrong targets.** An inaccurate successor can mislead its predecessors.
- **State quality.** Tabular prediction assumes states contain the information needed to predict transitions.
- **Coupled values.** Shared parameters can move the target during learning; off-policy data adds another stability concern.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="b2-h-title"><title id="b2-h-title">Increasing the backup replaces guesses with observed rewards</title><defs><marker id="b2-h-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="25">Blue: observed · rust: guessed</text><rect x="20" y="48" width="35" height="25" fill="#d7e5ee"/><rect x="55" y="48" width="220" height="25" fill="#e7c5b8"/><text x="20" y="96">One step: short wait, long guess</text><rect x="20" y="117" width="180" height="25" fill="#d7e5ee"/><rect x="200" y="117" width="75" height="25" fill="#e7c5b8"/><text x="20" y="165">More steps: more observations</text><path d="M30 190H265" stroke="#656b62" stroke-width="2" marker-end="url(#b2-h-arr)"/><text x="22" y="218">Longer horizon → longer wait</text></g></svg><figcaption>Target-composition view. Fixed: one future episode. The backup endpoint moves later. Compare observed and guessed portions; bar lengths carry no measured variance claim.</figcaption></figure>

The next question is how to store values when almost every state is new. [Part 3: function approximation](/robotics/rl-3-function-approximation-codex/) replaces separate table entries with shared weights.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
