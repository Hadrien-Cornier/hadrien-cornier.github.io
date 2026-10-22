---
title: 'Bootstrapping: learn before the reward arrives'
description: 'How Monte Carlo, TD and n-step returns move credit backward, with a worked eight-state corridor.'
date: '2026-10-19'
draft: false
series: 'Reinforcement learning'
part: 2
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-2-bootstrapping-whole.svg'
thumbnail_alt: 'Zero rewards before the final reward'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 954" data-whole="0 0 680 954" data-views='{"late":[24,46,300,220],"mc":[364,46,300,220],"td":[24,356,300,240],"corridor":[364,356,300,250],"nstep":[24,666,300,230],"horizon":[364,666,300,230]}' role="img" aria-label="Whole mechanism map: Bootstrapping: learn before the reward arrives"><g class="rc-panel" data-panel="late"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. A late reward</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-2-0-b2-late-title"><title id="canvas-2-0-b2-late-title">Zero rewards before the final reward</title><defs><marker id="canvas-2-0-b2-late-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Eight states, one final reward</text><path d="M32 74H266" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-0-b2-late-arr)"/><g fill="#d7e5ee" stroke="#242622"><rect x="15" y="52" width="28" height="42"/><rect x="46" y="52" width="28" height="42"/><rect x="77" y="52" width="28" height="42"/><rect x="108" y="52" width="28" height="42"/><rect x="139" y="52" width="28" height="42"/><rect x="170" y="52" width="28" height="42"/><rect x="201" y="52" width="28" height="42"/><rect x="232" y="52" width="28" height="42"/></g><text x="23" y="79">1</text><text x="54" y="79">2</text><text x="85" y="79">3</text><text x="116" y="79">4</text><text x="147" y="79">5</text><text x="178" y="79">6</text><text x="209" y="79">7</text><text x="240" y="79">8</text><text x="16" y="126">First seven moves: reward 0</text><text x="16" y="154" fill="#b44c2c">Last move → end: reward 1</text><path d="M246 168H32" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-0-b2-late-arr)"/><text x="16" y="202">Credit must reach earlier states</text></g></svg></g><g class="rc-panel" data-panel="mc"><rect x="352" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. Wait for the return</text><svg x="364" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-2-1-b2-mc-title"><title id="canvas-2-1-b2-mc-title">Monte Carlo waits then updates earlier states</title><defs><marker id="canvas-2-1-b2-mc-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">During walk: estimates wait</text><path d="M32 65H265" stroke="#656b62" stroke-width="2"/><circle cx="40" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="135" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="260" cy="65" r="20" fill="#e7c5b8" stroke="#242622"/><text x="35" y="71">0</text><text x="130" y="71">0</text><text x="251" y="71">+1</text><text x="16" y="110">Episode ends: return is known</text><path d="M260 93V145H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-1-b2-mc-arr)"/><text x="16" y="179">All eight targets = 1</text><text x="16" y="205">All eight estimates: 0 → 1</text></g></svg></g><g class="rc-panel" data-panel="td"><rect x="12" y="322" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="346">3. Borrow the next estimate</text><svg x="24" y="356" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-2-2-b2-td-title"><title id="canvas-2-2-b2-td-title">A next-state estimate supplies the TD target</title><defs><marker id="canvas-2-2-b2-td-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="244" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><text x="39" y="67">0.2</text><text x="228" y="67">0.8</text><path d="M91 61H207" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-2-b2-td-arr)"/><text x="109" y="45">reward 0</text><path d="M244 98V125H55V153" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-2-b2-td-arr)"/><text x="83" y="117">discount × 0.9</text><text x="16" y="180">Target: 0 + 0.9 × 0.8 = 0.72</text><text x="16" y="215">Halfway update: 0.2 → 0.46</text></g></svg></g><g class="rc-panel" data-panel="corridor"><rect x="352" y="322" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="346">4. Credit travels backward</text><svg x="364" y="356" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-2-3-b2-cor-title"><title id="canvas-2-3-b2-cor-title">One-step credit moves one state per forward walk</title><defs><marker id="canvas-2-3-b2-cor-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">State</text><text y="27"><tspan x="100">1</tspan><tspan x="123">2</tspan><tspan x="146">3</tspan><tspan x="169">4</tspan><tspan x="192">5</tspan><tspan x="215">6</tspan><tspan x="238">7</tspan><tspan x="261">8</tspan></text><text x="16" y="66">Walk 1</text><text y="66"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238">0</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="105">Walk 2</text><text y="105"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="144">Walk 3</text><text y="144"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215" fill="#b44c2c">1</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><path d="M250 158L112 193" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-3-b2-cor-arr)"/><text x="16" y="224">Walk 8: all eight values are 1</text></g></svg></g><g class="rc-panel" data-panel="nstep"><rect x="12" y="632" width="324" height="276" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="656">5. Look several steps ahead</text><svg x="24" y="666" height="230" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="canvas-2-4-b2-n-title"><title id="canvas-2-4-b2-n-title">Three real rewards followed by one guessed tail</title><defs><marker id="canvas-2-4-b2-n-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">Three steps before the guess</text><path d="M28 70H270" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-4-b2-n-arr)"/><circle cx="28" cy="70" r="8" fill="#242622"/><circle cx="108" cy="70" r="8" fill="#242622"/><circle cx="188" cy="70" r="8" fill="#242622"/><circle cx="270" cy="70" r="8" fill="#b44c2c"/><text x="42" y="57">0</text><text x="122" y="57">0</text><text x="202" y="57">1</text><text x="16" y="113">Rewards: 0 + 0 + 1</text><text x="16" y="142">Then: discounted endpoint value</text><path d="M270 84V165H30" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-2-4-b2-n-arr)"/><text x="16" y="203">One target crosses three steps</text></g></svg></g><g class="rc-panel" data-panel="horizon"><rect x="352" y="632" width="324" height="276" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="656">6. Choose the horizon</text><svg x="364" y="666" height="230" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="canvas-2-5-b2-h-title"><title id="canvas-2-5-b2-h-title">Increasing the backup replaces guesses with observed rewards</title><defs><marker id="canvas-2-5-b2-h-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="25">Blue: observed · rust: guessed</text><rect x="20" y="48" width="35" height="25" fill="#d7e5ee"/><rect x="55" y="48" width="220" height="25" fill="#e7c5b8"/><text x="20" y="96">One step: short wait, long guess</text><rect x="20" y="117" width="180" height="25" fill="#d7e5ee"/><rect x="200" y="117" width="75" height="25" fill="#e7c5b8"/><text x="20" y="165">More steps: more observations</text><path d="M30 190H265" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-2-5-b2-h-arr)"/><text x="22" y="218">Longer horizon → longer wait</text></g></svg></g></svg></div></div>
<div class="rc-body">

The first seven moves give you no reward, and the eighth gives you one. How can the first move learn about that last reward before another walk begins? We can wait for the completed return or borrow an estimate of the next state's value. That borrowing is called bootstrapping. Let's compare these approaches in an eight-state corridor and follow how far each update carries credit. This makes the timing in [Sutton and Barto, Chapters 5–7](http://incompleteideas.net/book/RLbook2020.pdf) explicit.

**Part 2.** [Previously: the Q table](/robotics/rl-1-q-learning/).

**Reading goal:** compare one completed-return pass with eight forward TD walks and three walks of three-step TD in the same eight-state corridor. We'll keep the update order explicit throughout.

<nav class="rc-route" aria-label="Reading route"><a href="#sec-late" data-go="sec-late">A late reward</a><a href="#sec-mc" data-go="sec-mc">Wait for the return</a><a href="#sec-td" data-go="sec-td">Borrow the next estimate</a><a href="#sec-corridor" data-go="sec-corridor">Credit travels backward</a><a href="#sec-nstep" data-go="sec-nstep">Look several steps ahead</a><a href="#sec-horizon" data-go="sec-horizon">Choose the horizon</a></nav>

<div class="rc-mark" id="sec-late" data-panel="late" data-view="late" data-title="A late reward"></div>

## A late reward

Suppose you walk through eight states and receive 1 only when you leave the last one. Every earlier move earns zero, but each still leads toward that reward. We want the value of a state to account for the whole future after it, rather than just the next reward.

Let $t$ be the current step, $S_t$ its state, $A_t$ the action taken there, and $R_{t+1}$ the reward after that action. The episode ends at step $T$. The discount $\gamma$, between 0 and 1 inclusive, reduces the weight of delayed rewards, and $k$ counts steps ahead. The summation sign $\sum$ adds the terms indexed by $k$, while $\gamma^k$ discounts the reward at index $k$. Adding these discounted rewards gives us the **return** $G_t$:

$$G_t=\sum_{k=0}^{T-t-1}\gamma^k R_{t+k+1}.$$

A fixed policy $\pi$ chooses the actions. Its true value $v_\pi(s)$ at state $s$ is the expected return. Here $\mathbb E_\pi$ means averaging over futures that follow that policy, and the vertical bar means conditioning on the starting state:

$$v_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s].$$

With no discounting, every nonterminal state in this deterministic corridor is worth 1. Those eight values connect the last reward to the earlier choices. [Sutton and Barto, Chapter 3](http://incompleteideas.net/book/RLbook2020.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="b2-late-title"><title id="b2-late-title">Zero rewards before the final reward</title><defs><marker id="b2-late-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Eight states, one final reward</text><path d="M32 74H266" stroke="#656b62" stroke-width="2" marker-end="url(#b2-late-arr)"/><g fill="#d7e5ee" stroke="#242622"><rect x="15" y="52" width="28" height="42"/><rect x="46" y="52" width="28" height="42"/><rect x="77" y="52" width="28" height="42"/><rect x="108" y="52" width="28" height="42"/><rect x="139" y="52" width="28" height="42"/><rect x="170" y="52" width="28" height="42"/><rect x="201" y="52" width="28" height="42"/><rect x="232" y="52" width="28" height="42"/></g><text x="23" y="79">1</text><text x="54" y="79">2</text><text x="85" y="79">3</text><text x="116" y="79">4</text><text x="147" y="79">5</text><text x="178" y="79">6</text><text x="209" y="79">7</text><text x="240" y="79">8</text><text x="16" y="126">First seven moves: reward 0</text><text x="16" y="154" fill="#b44c2c">Last move → end: reward 1</text><path d="M246 168H32" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-late-arr)"/><text x="16" y="202">Credit must reach earlier states</text></g></svg><figcaption>Path view. Fixed: eight forward transitions and their rewards. Learning changes the values. Read the credit arrow backward from the final reward.</figcaption></figure>

<div class="rc-mark" id="sec-mc" data-panel="mc" data-view="mc" data-title="Wait for the return"></div>

## Wait for the return

The first seven rewards are zero, so none on its own explains why the first state is valuable. We can finish the walk and add up the rewards that followed each state. This is episodic **Monte Carlo prediction**. Let $V(s)$ be our current estimate of $v_\pi(s)$, and let $\alpha$ be a step size greater than zero and at most 1. The arrow $\leftarrow$ means we replace the estimate, and the brackets contain the error: the target minus the current estimate. For each state we visited, we move its estimate toward its completed return:

$$V(S_t)\leftarrow V(S_t)+\alpha[G_t-V(S_t)].$$

Averaging sampled returns estimates the expected return. With a fixed policy, finite-variance returns, sufficient visits and suitable shrinking step sizes, the estimate settles toward that expectation. The target uses observed rewards throughout. [Sutton and Barto, Section 5.1](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Follow the fixed policy until the episode ends.
Walk backward through the saved transitions.
Accumulate the discounted return.
Move each visited state's estimate toward its return.
```

In our corridor, let's start every estimate at zero and set both the step size and the discount to 1. After one completed walk, every state's target is 1, so every estimate becomes 1. Waiting works particularly well here because nothing is random: each return is exact.

The cost is having to wait. If an episode lasts a million steps, we can't make the first completed-return update until it ends. In a continuing task, there's no terminal event to give us this particular target.

The same problem shows up when a policy might never finish. In the windy gridworld of [Sutton and Barto, Example 6.5](http://incompleteideas.net/book/RLbook2020.pdf), some policies never reach the goal, so Monte Carlo methods can't easily be used, while Sarsa learns during the episode that those policies are poor. Stopping the walk at a time limit does give us a number, but it's a truncated return: it leaves out whatever would have come next. [Time limits](#sec-time-limits) below look at what that does to the targets.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="b2-mc-title"><title id="b2-mc-title">Monte Carlo waits then updates earlier states</title><defs><marker id="b2-mc-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="28">During walk: estimates wait</text><path d="M32 65H265" stroke="#656b62" stroke-width="2"/><circle cx="40" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="135" cy="65" r="20" fill="#fff" stroke="#242622"/><circle cx="260" cy="65" r="20" fill="#e7c5b8" stroke="#242622"/><text x="35" y="71">0</text><text x="130" y="71">0</text><text x="251" y="71">+1</text><text x="16" y="110">Episode ends: return is known</text><path d="M260 93V145H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-mc-arr)"/><text x="16" y="179">All eight targets = 1</text><text x="16" y="205">All eight estimates: 0 → 1</text></g></svg><figcaption>Timeline view. Fixed: the completed path. Values change after the end. Compare the waiting estimates above with the backward return calculation below.</figcaption></figure>

<div class="rc-mark" id="sec-td" data-panel="td" data-view="td" data-title="Borrow the next estimate"></div>

## Borrow the next estimate

What if the walk is still running? The return splits into the next reward and the return after it:

$$G_t=R_{t+1}+\gamma G_{t+1}.$$

**TD(0)**, one-step temporal-difference prediction, replaces the remaining return with our current estimate of the next state's value. In the equation above, $G_{t+1}$ is the return from that next state. We'll call the resulting target $Y_t$ and its difference from the current estimate $\delta_t$. This gives us the one-step backup used by TD(0):

$$\begin{aligned}
Y_t&=R_{t+1}+\gamma V(S_{t+1}),\\
\delta_t&=Y_t-V(S_t),\\
V(S_t)&\leftarrow V(S_t)+\alpha\delta_t.
\end{aligned}$$

Set the terminal state's value to zero. The Bellman equation connects a state's expected return to its successor's expected return, and TD learns that relationship from sampled transitions. For a finite discounted continuing task, or a proper episodic task with bounded expected episode lengths, suitable on-policy visits and step sizes give convergence in the tabular case. [Sutton and Barto, Sections 6.1–6.2](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Take one action from the fixed policy.
Observe its reward and next state.
Target = reward + discounted next-state estimate.
Move the current estimate toward that target.
```

Suppose the reward is 0, the discount is 0.9, and the next state's estimate is 0.8. With a current estimate of 0.2 and a step size of 0.5, the target is 0.72 and the error is 0.52, so the new estimate is 0.46. The reward stayed zero. The new information came from the successor's value.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="b2-td-title"><title id="b2-td-title">A next-state estimate supplies the TD target</title><defs><marker id="b2-td-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><circle cx="244" cy="61" r="32" fill="#d7e5ee" stroke="#242622"/><text x="39" y="67">0.2</text><text x="228" y="67">0.8</text><path d="M91 61H207" stroke="#656b62" stroke-width="2" marker-end="url(#b2-td-arr)"/><text x="109" y="45">reward 0</text><path d="M244 98V125H55V153" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-td-arr)"/><text x="83" y="117">discount × 0.9</text><text x="16" y="180">Target: 0 + 0.9 × 0.8 = 0.72</text><text x="16" y="215">Halfway update: 0.2 → 0.46</text></g></svg><figcaption>Transition view. Fixed: reward 0 and the successor estimate for this update. The current value changes. Follow the lower arrow to see where its target comes from.</figcaption></figure>

<div class="rc-mark" id="sec-corridor" data-panel="corridor" data-view="corridor" data-title="Credit travels backward"></div>

## Credit travels backward

Starting updates immediately doesn't mean new credit moves quickly. Let's return to the eight-state corridor, with zero initial estimates and $\alpha=\gamma=1$. We update online in forward order, once per visit, immediately after each transition.

On the first walk, the first seven targets are zero. Only the last state sees reward 1. On the second walk, state 7 reads the now-correct value at state 8. State 6 already updated before that happened, so it waits another walk.

| After a complete walk | States with value 1 under forward TD(0) |
| --- | --- |
| 1 | 8 |
| 2 | 7, 8 |
| 3 | 6, 7, 8 |
| 8 | 1 through 8 |

We can write the same pattern as a formula without introducing another learning rule.

Let $m$ count completed walks and $i$ identify a corridor state, from 1 to 8. Then $V_m(i)$ is that state's estimate after walk $m$, with $m=0$ meaning before learning begins. The cases below give the last $m$ states a value of 1 and all the others a value of 0:

$$V_m(i)=\begin{cases}1,&i>8-m,\\0,&i\leq8-m,\end{cases}\qquad 0\leq m\leq8.$$

On each forward pass, we read the next state's value before updating that next state. So credit moves backward by one state per walk. Monte Carlo credits all eight states after walk 1, while TD(0) needs eight walks to credit the first state.

These counts depend on the update order we chose. If we replayed the transitions backward, the reward would propagate across the whole chain in one pass. The corridor shows how information moves through these updates, but it doesn't tell us which method is faster in general.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="b2-cor-title"><title id="b2-cor-title">One-step credit moves one state per forward walk</title><defs><marker id="b2-cor-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">State</text><text y="27"><tspan x="100">1</tspan><tspan x="123">2</tspan><tspan x="146">3</tspan><tspan x="169">4</tspan><tspan x="192">5</tspan><tspan x="215">6</tspan><tspan x="238">7</tspan><tspan x="261">8</tspan></text><text x="16" y="66">Walk 1</text><text y="66"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238">0</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="105">Walk 2</text><text y="105"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215">0</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><text x="16" y="144">Walk 3</text><text y="144"><tspan x="100">0</tspan><tspan x="123">0</tspan><tspan x="146">0</tspan><tspan x="169">0</tspan><tspan x="192">0</tspan><tspan x="215" fill="#b44c2c">1</tspan><tspan x="238" fill="#b44c2c">1</tspan><tspan x="261" fill="#b44c2c">1</tspan></text><path d="M250 158L112 193" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-cor-arr)"/><text x="16" y="224">Walk 8: all eight values are 1</text></g></svg><figcaption>Value-table view. Fixed: zero initialization, forward online updates and unit step size and discount. Red values spread backward. Compare rows after complete walks.</figcaption></figure>

<div class="rc-mark" id="sec-nstep" data-panel="nstep" data-view="nstep" data-title="Look several steps ahead"></div>

## Look several steps ahead

With forward one-step updates, credit moves back just one state per walk in our corridor. An **n-step return** follows several transitions before borrowing an estimate. Let $n$ be the number of real rewards we want to use and $h=\min(n,T-t)$ the number available before the episode ends, where $\min$ picks the smaller count. Call the resulting target $Y_t^{(n)}$, with the superscript indicating the backup length, and its endpoint state $S_{t+h}$:

$$\begin{aligned}
Y_t^{(n)}&=\sum_{k=0}^{h-1}\gamma^kR_{t+k+1}\\
&\quad+\begin{cases}
\gamma^hV(S_{t+h}),&t+h<T,\\
0,&t+h=T.
\end{cases}
\end{aligned}$$

Each time we expand the return recursion, we get more observed rewards before the part we still have to guess. If we reach the terminal state, there's no future left to guess. [Sutton and Barto, Section 7.1](http://incompleteideas.net/book/RLbook2020.pdf).

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

A longer target uses more actual experience and less of the current guess. In a task with randomness, it also includes more random rewards and transitions. For any state $s$, let $\varepsilon(s)=V(s)-v_\pi(s)$ be the estimation error: approximate value minus true policy value. $S_{t+n}$ is the endpoint after $n$ real transitions. Before termination, the guessed tail's contribution to target error is

$$\gamma^n\varepsilon(S_{t+n}).$$

The discount shrinks a given endpoint error as the horizon grows. But the endpoint itself changes with $n$, so this expression doesn't tell us that target bias or variance will always rise or fall with the horizon. Noisy rewards, correlated transitions and the accuracy of different endpoint estimates all matter. [Sutton and Barto, Chapters 6–7](http://incompleteideas.net/book/RLbook2020.pdf).

| Method | Learns | Target | Fails when | Adjustment | Source |
| --- | --- | --- | --- | --- | --- |
| Monte Carlo | Policy value | Full return | Episodes are too long | Bootstrap sooner | [Ch. 5](http://incompleteideas.net/book/RLbook2020.pdf) |
| TD(0) | Policy value | One reward + guess | Credit moves slowly | Extend backup | [Ch. 6](http://incompleteideas.net/book/RLbook2020.pdf) |
| n-step TD | Policy value | Several rewards + guess | Targets wait or fluctuate | Tune horizon | [Ch. 7](http://incompleteideas.net/book/RLbook2020.pdf) |

**In this corridor:** Monte Carlo waits for 8 rewards and credits all states after walk 1. TD(0) starts after 1 reward but needs 8 forward walks to credit state 1. Three-step TD waits for up to 3 rewards and needs 3 walks. These counts hold for zero initialization and unit discount and step size. They don't establish a performance ranking in stochastic tasks.

**Bootstrapping buys:**

- **Early updates.** Learn before an episode finishes.
- **Continuing prediction.** Use discounted targets without waiting for an ending.
- **Shared successors.** Reuse what other visits taught the next state's estimate.

**Costs and assumptions:**

- **Wrong targets.** An inaccurate successor can mislead its predecessors.
- **State quality.** Tabular prediction assumes states contain the information needed to predict transitions.
- **Coupled values.** Shared parameters can move the target during learning; off-policy data adds another stability concern.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 230" role="img" aria-labelledby="b2-h-title"><title id="b2-h-title">Increasing the backup replaces guesses with observed rewards</title><defs><marker id="b2-h-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="25">Blue: observed · rust: guessed</text><rect x="20" y="48" width="35" height="25" fill="#d7e5ee"/><rect x="55" y="48" width="220" height="25" fill="#e7c5b8"/><text x="20" y="96">One step: short wait, long guess</text><rect x="20" y="117" width="180" height="25" fill="#d7e5ee"/><rect x="200" y="117" width="75" height="25" fill="#e7c5b8"/><text x="20" y="165">More steps: more observations</text><path d="M30 190H265" stroke="#656b62" stroke-width="2" marker-end="url(#b2-h-arr)"/><text x="22" y="218">Longer horizon → longer wait</text></g></svg><figcaption>Target-composition view. For one future episode, a later backup endpoint replaces more of the guessed tail with observed rewards.</figcaption></figure>

<h3 id="sec-gae">Give actions credit</h3>

So far, we've estimated values under a fixed policy. Suppose we now want to improve that policy. A good outcome alone doesn't tell us whether an action helped: perhaps the starting state was already promising. The **advantage** compares an action's expected return with the policy's usual return from that state:

$$A_\pi(s,a)=Q_\pi(s,a)-V_\pi(s).$$

Here $Q_\pi$ means taking $a$ first and then following $\pi$. For $V_\pi$, we also average over the first action chosen by the policy. Both are true policy values. **Generalized Advantage Estimation (GAE)** uses experience and an approximate state value $V$ to estimate this action credit.

Collect a rollout with a fixed policy, then keep both the data and $V$ fixed while calculating advantages. Take one segment ending at $S_H$, with $H$ transitions, and let $\ell$ count steps ahead. Using the same reward convention as before, the one-step TD error and finite GAE estimate are

$$\begin{aligned}
\delta_t&=R_{t+1}+\gamma V(S_{t+1})-V(S_t),\\
\hat A_t&=\sum_{\ell=0}^{H-t-1}(\gamma\lambda)^\ell\delta_{t+\ell}.
\end{aligned}$$

The parameter $\lambda$, between 0 and 1, controls how much later errors contribute. To connect this sum to the returns we've already used, take one return length and add its TD errors with powers of $\gamma$. The intermediate value estimates cancel, leaving a return estimate minus the starting value. GAE can also be written as a geometrically weighted mixture of these estimates across different return lengths, with the remaining weight on the longest available return. [Schulman et al., Section 3, equations 14–16](https://arxiv.org/html/1506.02438v6#S3).

This brings the same horizon tradeoff to action credit. Shorter returns depend more on a guessed tail that may be biased, while longer returns include more observed rewards and transitions that can add noise. GAE mixes return lengths rather than picking just one. Its bias and variance still depend on how accurate the values are and on the task, so changing $\lambda$ doesn't guarantee a particular change in variance.

Let's take a small example with three transitions ending at a terminal state. Set $\gamma=1$, with rewards $(R_1,R_2,R_3)=(0,0,4)$ and frozen values $(V(S_0),V(S_1),V(S_2),V(S_3))=(2,2,1,0)$. This gives errors of $(0,-1,3)$. With $\lambda=0.5$, each later error gets half the weight of the previous one when we calculate credit for action $A_0$:

| TD error | Weight | Credit |
| --- | ---: | ---: |
| $\delta_0=0$ | 1 | 0 |
| $\delta_1=-1$ | 0.5 | −0.5 |
| $\delta_2=3$ | 0.25 | 0.75 |
| **Total** | | **0.25** |

At $\lambda=0$, only $\delta_0$ remains, so we get 0. At $\lambda=1$, the sum is $4-2=2$, the completed return minus the starting value. A value of $\lambda=0.95$ works the same way: it's a decay factor, not a 95% full-return / 5% one-step mixture. Each successive TD error gets another factor of $\gamma\lambda$.

The same sum has a short backward recurrence:

$$\hat A_H=0,\qquad \hat A_t=\delta_t+\gamma\lambda\hat A_{t+1}.$$

To apply this recurrence to a batch, split it at every episode reset. For each segment, use the last actual observation as $S_H$. Set $V(S_H)=0$ only at a true terminal state. A time limit that truncates an ongoing task, or a rollout cutoff, keeps its bootstrap value; the trace still stops at the boundary. This matches the boundary handling in [Spinning Up's `finish_path`](https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/ppo/ppo.py).

```text
# One segment, with frozen values and no episode reset inside it.
endpoint = 0 if true_terminal else V(last_actual_observation)
v[H] = endpoint
advantage[H] = 0
for t = H-1 down to 0:
    delta = R_(t+1) + gamma * v[t+1] - v[t]
    advantage[t] = delta + gamma * lambda * advantage[t+1]
```

Here `v[t]` stores the frozen $V(S_t)$. At $\lambda=1$, cancellation gives

$$\hat A_t=\sum_{\ell=0}^{H-t-1}\gamma^\ell R_{t+\ell+1}+\gamma^{H-t}V(S_H)-V(S_t).$$

Only a true terminal endpoint removes that tail. A truncated return still includes it.

<h3 id="sec-time-limits">When the clock ends the episode</h3>

That rule assumes we know whether an ending is real. Training runs usually stop every episode after a fixed number of steps, and that cutoff can mean two different things. [Pardo et al. (2018)](https://arxiv.org/abs/1712.00378) separate them.

**The time limit is part of the task.** Say the robot really has 14 moves to reach a goal. Then the value of a state depends on how many moves are left: the same square is worth a lot with 10 moves left and nothing with 1 move left if the goal is 3 moves away. If the state doesn't include the remaining time, those two situations look identical, and the learner averages targets that disagree. Their fix is to put the remaining time in the input.

Their Last Moment example shows how much this matters. At each step the agent can stay, for reward 0, or jump into a trap that gives +1 once and then −1 on every step until the episode ends. The best plan is to stay and jump on the very last step, collecting +1 with no penalty. An agent that can't see the clock can't tell when the last step is. With more than two steps in the episode, its best fixed choice is to never jump, and the paper notes that even Monte Carlo methods, which don't bootstrap, can't learn the right plan without the time input.

**The time limit is only for training.** If the task would really go on, the cutoff isn't an end. Treating it as terminal teaches the learner that a state near the cutoff is worth less, even though nothing about that state changed. Their fix is **partial-episode bootstrapping**: at the cutoff, use $R+\gamma V(S')$ instead of $R$, which is the truncation rule from the GAE section.

<div class="ct">

| How the limit is meant | Value depends on | Target at the limit | Fix from Pardo et al. |
| --- | --- | --- | --- |
| Part of the task | State and time left | Real end: last reward only | Add the remaining time to the input |
| Only for training | State only | Not an end: bootstrap from $V(S')$ | Partial-episode bootstrapping |

</div>

So the right handling depends on the objective. Bootstrapping through a limit that's really part of the task is also a mistake: it assumes a future that the task doesn't have.

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a pass-or-fail goal grid where this seems to happen: 14 moves, reward 1 at the goal and 0 otherwise, no discount. PPO with a learned value and GAE solved 13.3% of the tasks, and its value estimate at the start was about 1.44, above the largest possible return of 1. Scoring actions with real completed returns instead solved 95%, and with no baseline at all, 100% (3 seeds, simulation). The game's own reading is that the value bootstraps through the time limit and can't see the clock. That fits the first case, but the log has no run with the remaining time in the input that would confirm it.

The next question is how to store values when almost every state is new. [Part 3: function approximation](/robotics/rl-3-function-approximation/) replaces separate table entries with shared weights.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
