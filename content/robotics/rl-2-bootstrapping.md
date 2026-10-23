---
title: 'Bootstrapping: learn before the reward arrives'
description: 'Why waiting for the final reward is slow, and how borrowing the next state''s estimate lets you learn during the walk, with one worked update.'
date: '2026-10-19'
updated: '2026-10-22'
draft: false
series: 'Reinforcement learning'
part: 2
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-2-bootstrapping-whole.svg'
thumbnail_alt: 'One bootstrapped update: the next room estimate 0.8 moves this room from 0.2 to 0.46'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 920" data-whole="0 0 520 920" data-views='{"late": [10, 10, 500, 365], "update": [10, 385, 500, 365], "cost": [10, 590, 500, 320], "cost_p": [10, 385, 500, 525]}' role="img" aria-labelledby="b2-title b2-desc"><title id="b2-title">Bootstrapping on a blackboard: a late reward, one borrowed update and what borrowing costs</title><desc id="b2-desc">Panel 1: eight rooms in a row pay 0 per step and +1 on leaving room 8. Waiting for the end (Monte Carlo) credits every room with 1 after one walk. Borrowing the next estimate (TD) learns during the walk: after walk 1 only room 8 is 1, after walk 2 rooms 7 and 8, after walk 3 rooms 6 to 8, after walk 8 all rooms. Panel 2: this room has estimate 0.2, the next room 0.8, reward 0. Target = 0 + 0.9 times 0.8 = 0.72. New value = 0.2 + 0.5 times (0.72 minus 0.2) = 0.46. Below it, the cost: if the borrowed 0.8 is 0.2 too high, this room comes out 0.09 too high, and the room before it 0.04 too high when it borrows next, because each update passes back 0.5 times 0.9 = 0.45 of the error.</desc><defs><marker id="b2-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#242622" stroke-width="1.6"/></marker><marker id="b2-ah-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#656b62" stroke-width="1.6"/></marker><marker id="b2-ah-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#2b6a8e" stroke-width="1.6"/></marker><marker id="b2-ah-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="#b44c2c" stroke-width="1.6"/></marker></defs><g fill="#242622" font-family="Arial,sans-serif"><g class="rc-panel" data-panel="late"><rect x="10" y="10" width="500" height="365" rx="4" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="38">1. The reward comes at the end</text><text x="20" y="84" font-size="15" fill="#656b62">rooms</text><circle cx="104" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="104" y="84" font-size="17" text-anchor="middle">1</text><circle cx="154" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="154" y="84" font-size="17" text-anchor="middle">2</text><circle cx="204" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="204" y="84" font-size="17" text-anchor="middle">3</text><circle cx="254" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="254" y="84" font-size="17" text-anchor="middle">4</text><circle cx="304" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="304" y="84" font-size="17" text-anchor="middle">5</text><circle cx="354" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="354" y="84" font-size="17" text-anchor="middle">6</text><circle cx="404" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="404" y="84" font-size="17" text-anchor="middle">7</text><circle cx="454" cy="78" r="16" fill="none" stroke="#242622" stroke-width="2"/><text x="454" y="84" font-size="17" text-anchor="middle">8</text><path d="M123,78 L131,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="127" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M173,78 L181,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="177" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M223,78 L231,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="227" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M273,78 L281,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="277" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M323,78 L331,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="327" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M373,78 L381,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="377" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M423,78 L431,78" fill="none" stroke="#656b62" stroke-width="1.6" marker-end="url(#b2-ah-dim)"/><text x="427" y="62" font-size="14" text-anchor="middle" fill="#656b62">0</text><path d="M472,78 L496,78" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#b2-ah)"/><text x="487" y="60" font-size="20" text-anchor="middle" class="c-yellow">+1</text><text x="20" y="130" font-size="17">Wait for the end (Monte Carlo)</text><text x="20" y="161" font-size="14" fill="#656b62">walk 1</text><text x="104" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="154" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="204" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="254" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="304" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="354" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="404" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="454" y="161" font-size="19" text-anchor="middle" fill="#5f7f4f">1</text><text x="92" y="186" font-size="14" fill="#656b62">every room is credited, but only after the walk is over</text><text x="20" y="226" font-size="17">Borrow the next estimate (TD)</text><text x="20" y="254" font-size="14" fill="#656b62">walk 1</text><text x="104" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="154" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="204" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="254" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="304" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="354" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="404" y="254" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="454" y="254" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="20" y="280" font-size="14" fill="#656b62">walk 2</text><text x="104" y="280" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="154" y="280" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="204" y="280" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="254" y="280" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="304" y="280" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="354" y="280" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="404" y="280" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="454" y="280" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="20" y="306" font-size="14" fill="#656b62">walk 3</text><text x="104" y="306" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="154" y="306" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="204" y="306" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="254" y="306" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="304" y="306" font-size="19" text-anchor="middle" fill="#656b62">0</text><text x="354" y="306" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="404" y="306" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="454" y="306" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="20" y="352" font-size="14" fill="#656b62">walk 8</text><text x="104" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="154" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="204" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="254" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="304" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="354" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="404" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="454" y="352" font-size="19" text-anchor="middle" fill="#2b6a8e">1</text><text x="279" y="329" font-size="16" text-anchor="middle" fill="#656b62">&#8942;</text><path d="M463,252 C477,264 435,260 417,266" fill="none" stroke="#2b6a8e" stroke-width="1.6" marker-end="url(#b2-ah-blue)"/><path d="M413,278 C427,290 385,286 367,292" fill="none" stroke="#2b6a8e" stroke-width="1.6" marker-end="url(#b2-ah-blue)"/><text x="92" y="369" font-size="14" fill="#656b62">learns during each walk, but credit moves back one room per walk</text></g><g class="rc-panel" data-panel="update"><rect x="10" y="385" width="500" height="525" rx="4" fill="none" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="413">2. One borrowed update</text><circle cx="130" cy="505" r="42" fill="none" stroke="#242622" stroke-width="2.2"/><circle cx="380" cy="505" r="42" fill="none" stroke="#242622" stroke-width="2.2"/><text x="130" y="497" font-size="17" text-anchor="middle">V(s)</text><text x="130" y="525" font-size="24" text-anchor="middle" fill="#b44c2c">0.2</text><text x="380" y="497" font-size="17" text-anchor="middle">V(s&#8242;)</text><text x="380" y="525" font-size="24" text-anchor="middle" fill="#2b6a8e">0.8</text><path d="M176,517 L332,517" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#b2-ah)"/><text x="255" y="542" font-size="15" text-anchor="middle" fill="#656b62">move, reward r = 0</text><text x="130" y="569" font-size="15" text-anchor="middle" fill="#656b62">this room</text><text x="380" y="569" font-size="15" text-anchor="middle" fill="#656b62">next room</text><path d="M372,460 C340,413 170,413 140,459" fill="none" stroke="#2b6a8e" stroke-width="2.2" marker-end="url(#b2-ah-blue)"/><text x="255" y="419" font-size="16" text-anchor="middle" fill="#2b6a8e">borrow its estimate</text><text x="30" y="608" font-size="21">target = r + &#947; &#183; <tspan fill="#2b6a8e">V(s&#8242;)</tspan></text><text x="96" y="638" font-size="21">= 0 + 0.9 &#215; <tspan fill="#2b6a8e">0.8</tspan> =</text><text x="236" y="638" font-size="21" class="c-yellow">0.72</text><text x="30" y="682" font-size="21">new <tspan fill="#b44c2c">V(s)</tspan> = V(s) + &#945; &#183; (target &#8722; V(s))</text><text x="96" y="712" font-size="21">= <tspan fill="#b44c2c">0.2</tspan> + 0.5 &#215; (<tspan class="c-yellow">0.72</tspan> &#8722; <tspan fill="#b44c2c">0.2</tspan>) =</text><text x="333" y="712" font-size="23" fill="#b44c2c">0.46</text><path d="M321,703 C321,688 381,686 385,700 C389,716 327,722 319,708" fill="none" class="s-yellow" stroke-width="2"/><text x="30" y="740" font-size="14" fill="#656b62">&#947; = 0.9 is the discount, &#945; = 0.5 is the step size</text><path d="M30,754 L490,754" fill="none" stroke="#b6baaf" stroke-width="1.2" stroke-dasharray="4 6"/><text x="30" y="786" font-size="17">What it costs: say the borrowed 0.8 is 0.2 too high</text><circle cx="110" cy="830" r="28" fill="none" stroke="#242622" stroke-width="2"/><circle cx="250" cy="830" r="28" fill="none" stroke="#242622" stroke-width="2"/><circle cx="390" cy="830" r="28" fill="none" stroke="#242622" stroke-width="2"/><text x="110" y="836" font-size="16" text-anchor="middle" fill="#b44c2c">+0.04</text><text x="250" y="836" font-size="16" text-anchor="middle" fill="#b44c2c">+0.09</text><text x="390" y="836" font-size="16" text-anchor="middle" fill="#b44c2c">+0.2</text><path d="M360,830 L284,830" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-ah-red)"/><path d="M220,830 L144,830" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#b2-ah-red)"/><text x="320" y="816" font-size="14" text-anchor="middle" fill="#656b62">&#215; 0.45</text><text x="180" y="816" font-size="14" text-anchor="middle" fill="#656b62">&#215; 0.45</text><text x="110" y="873" font-size="14" text-anchor="middle" fill="#656b62">room before</text><text x="250" y="873" font-size="14" text-anchor="middle" fill="#656b62">this room</text><text x="390" y="873" font-size="14" text-anchor="middle" fill="#656b62">next room</text><text x="30" y="898" font-size="14" fill="#656b62">each update passes back &#945; &#183; &#947; = 0.5 &#215; 0.9 = 0.45 of the error</text></g></g></svg></div></div>
<div class="rc-body">

Bootstrapping means updating a guess from another guess. Imagine you walk down a corridor of eight rooms. Every step pays 0, and only leaving the last room pays 1. So how does the first room learn that it's on a good path, when the only reward shows up seven steps later?

**Part 2.** Previously: [the Q table](/robotics/rl-1-q-learning/).

<div class="rc-mark" id="sec-late" data-panel="late" data-view="late" data-title="The reward comes at the end"></div>

## The reward comes at the end

The simplest answer is to wait. You finish the walk, add up the rewards that came after each room, and move each room's estimate toward that total. That's Monte Carlo prediction. With no discount, every room's total is 1, so with a step size of 1 a single walk sets all eight rooms to 1 (the top row of the drawing).

The catch is the waiting. If an episode lasts a million steps, nothing gets updated for a million steps, and a task that never ends never hands you a total at all. Some policies never finish at all, as in the windy gridworld of [Sutton and Barto, Example 6.5](http://incompleteideas.net/book/RLbook2020.pdf).

So let's learn during the walk instead. When you leave a room you don't know the final total yet, but you do have a current estimate for the next room. Take the reward you just got, add that estimate, and use the sum as your target. That borrowing is bootstrapping, and its one-step version is called TD(0), for temporal difference.

<h3 id="sec-corridor">Credit moves back one room per walk</h3>

In the corridor, start every estimate at 0 and update each room right after you leave it, walking forward, with step size and discount both 1. On walk 1 only room 8 sees the reward. On walk 2, room 7 reads the now-correct value of room 8, and so on, so room 1 has to wait for walk 8 (the lower rows). Every update happens immediately, but credit still travels slowly. That slowness comes from the forward order, and replaying the walk backward would carry the reward across in one pass.

<div class="rc-mark" id="sec-update" data-panel="update" data-view="update" data-title="One borrowed update"></div>

## One borrowed update

Here's one update with real numbers. You're in a room whose estimate is 0.2. You move on, the reward is 0, and the next room's estimate is 0.8. With a discount of 0.9, the target is $0 + 0.9 \times 0.8 = 0.72$. With a step size of 0.5 you move halfway from 0.2 toward 0.72, which gives 0.46.

$$V(s) \leftarrow V(s) + \alpha\,\big[\,r + \gamma V(s') - V(s)\,\big]$$

The reward was zero. All of the new information came from the next room's estimate.

<div class="rc-mark" id="sec-cost" data-panel="update" data-view="cost" data-title="What borrowing costs"></div>

## What borrowing costs

Borrowing is only as good as the estimate you borrow. Say the next room's 0.8 is really 0.2 too high. Then this room comes out 0.09 too high after its update, and the room before it picks up about 0.04 the next time it borrows. The error travels back along the same path as the credit. You stop waiting, and in exchange you trust a guess.

There's a middle ground. An **n-step** target adds up n real rewards and only then borrows an estimate. In the same corridor, a three-step target credits all eight rooms in three walks instead of eight, and once n reaches the end of the episode it's just the Monte Carlo total again. Longer targets lean more on real rewards, which can be noisy, and less on the guess, which can be wrong.

When many states share one set of estimates, a wrong borrowed value can spread even further. [Part 3: function approximation](/robotics/rl-3-function-approximation/) picks up there.

<details>
<summary>The exact targets, their conditions and sources</summary>

Let $t$ be the current step, $S_t$ its state and $R_{t+1}$ the reward after the action taken there. The episode ends at step $T$, $\gamma$ is the discount between 0 and 1, and $k$ counts steps ahead. The **return** adds the discounted rewards, and a fixed policy's value is the expected return ([Sutton and Barto, Chapter 3](http://incompleteideas.net/book/RLbook2020.pdf)):

$$G_t=\sum_{k=0}^{T-t-1}\gamma^k R_{t+k+1},\qquad v_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s].$$

With no discount, every nonterminal room in the deterministic corridor is worth 1.

**Monte Carlo.** Move each visited state toward its completed return, with step size $0<\alpha\le1$. With a fixed policy, finite-variance returns, enough visits and suitably shrinking step sizes, the estimate settles toward the expected return ([Section 5.1](http://incompleteideas.net/book/RLbook2020.pdf)).

$$V(S_t)\leftarrow V(S_t)+\alpha[G_t-V(S_t)]$$

**TD(0).** Split the return as $G_t=R_{t+1}+\gamma G_{t+1}$ and replace $G_{t+1}$ by the current estimate of the next state. The terminal state's value is 0. For a finite discounted task, or an episodic task with bounded expected episode length, suitable on-policy visits and step sizes give convergence in the tabular case ([Sections 6.1 and 6.2](http://incompleteideas.net/book/RLbook2020.pdf)).

$$\begin{aligned}
Y_t&=R_{t+1}+\gamma V(S_{t+1}),\\
V(S_t)&\leftarrow V(S_t)+\alpha\,[Y_t-V(S_t)].
\end{aligned}$$

<span id="sec-nstep" style="scroll-margin-top:var(--rc-top)"></span>**n-step TD.** Let $h=\min(n,T-t)$ be the number of real rewards available before the episode ends. The target uses those rewards and borrows only at the endpoint, unless the endpoint is terminal ([Section 7.1](http://incompleteideas.net/book/RLbook2020.pdf)):

$$Y_t^{(n)}=\sum_{k=0}^{h-1}\gamma^kR_{t+k+1}+\begin{cases}\gamma^hV(S_{t+h}),&t+h<T,\\0,&t+h=T.\end{cases}$$

**Corridor counts.** Zero initial values, $\alpha=\gamma=1$, online updates in forward order. Monte Carlo credits all eight rooms after walk 1. Forward TD(0) credits the last $m$ rooms after walk $m$, so room 1 needs 8 walks. Three-step TD with the usual delayed updates and a terminal flush credits rooms 6 to 8 on walk 1, rooms 3 to 5 on walk 2 and rooms 1 and 2 on walk 3. These counts come from the update order and settings. They don't rank the methods in general, and backward replay would credit the whole corridor in one pass.

<span id="sec-horizon" style="scroll-margin-top:var(--rc-top)"></span>**Choosing the horizon.** Let $\varepsilon(s)=V(s)-v_\pi(s)$ be the estimation error. Before termination, the borrowed tail adds $\gamma^n\varepsilon(S_{t+n})$ to the target's error. The discount shrinks a given endpoint error as $n$ grows, but the endpoint itself changes with $n$, so this doesn't guarantee that bias or variance always rises or falls with the horizon. Noisy rewards, correlated transitions and the accuracy of different endpoint estimates all matter ([Chapters 6 and 7](http://incompleteideas.net/book/RLbook2020.pdf)).

| Method | Target | Fails when | Source |
| --- | --- | --- | --- |
| Monte Carlo | Full return | Episodes are long or never end | [Ch. 5](http://incompleteideas.net/book/RLbook2020.pdf) |
| TD(0) | One reward + estimate | Credit moves slowly; the estimate is wrong | [Ch. 6](http://incompleteideas.net/book/RLbook2020.pdf) |
| n-step TD | n rewards + estimate | Targets wait longer or get noisier | [Ch. 7](http://incompleteideas.net/book/RLbook2020.pdf) |

</details>

<details id="sec-gae" style="scroll-margin-top:var(--rc-top)">
<summary>Give actions credit: Generalized Advantage Estimation (GAE)</summary>

So far we estimated values under a fixed policy. To improve the policy, a good outcome alone doesn't tell you whether an action helped, because the starting state may already have been promising. The **advantage** compares an action's expected return with the policy's usual return from that state:

$$A_\pi(s,a)=Q_\pi(s,a)-V_\pi(s).$$

Here $Q_\pi$ means taking $a$ first and then following $\pi$, and $V_\pi$ also averages over the first action. **Generalized Advantage Estimation (GAE)** estimates this credit from experience and an approximate state value $V$. Collect a rollout with a fixed policy, keep the data and $V$ fixed, and take one segment ending at $S_H$, with $\ell$ counting steps ahead:

$$\begin{aligned}
\delta_t&=R_{t+1}+\gamma V(S_{t+1})-V(S_t),\\
\hat A_t&=\sum_{\ell=0}^{H-t-1}(\gamma\lambda)^\ell\delta_{t+\ell}.
\end{aligned}$$

The parameter $\lambda$, between 0 and 1, sets how much later errors count. Adding the TD errors of one return length makes the intermediate values cancel, leaving that return minus the starting value, and GAE is a geometrically weighted mix of those return lengths ([Schulman et al., Section 3, equations 14 to 16](https://arxiv.org/html/1506.02438v6#S3)). It brings the same horizon tradeoff to action credit, and changing $\lambda$ doesn't guarantee a particular change in variance.

A small example: three transitions ending at a terminal state, $\gamma=1$, rewards $(0,0,4)$ and frozen values $(V(S_0),V(S_1),V(S_2),V(S_3))=(2,2,1,0)$. The errors are $(0,-1,3)$. With $\lambda=0.5$, the credit for $A_0$ is

| TD error | Weight | Credit |
| --- | ---: | ---: |
| $\delta_0=0$ | 1 | 0 |
| $\delta_1=-1$ | 0.5 | −0.5 |
| $\delta_2=3$ | 0.25 | 0.75 |
| **Total** | | **0.25** |

At $\lambda=0$ only $\delta_0$ remains, so the credit is 0. At $\lambda=1$ the sum is $4-2=2$, the completed return minus the starting value. A value like $\lambda=0.95$ is a decay factor, not a 95% and 5% mixture.

The same sum has a backward recurrence, $\hat A_H=0$ and $\hat A_t=\delta_t+\gamma\lambda\hat A_{t+1}$. To apply it to a batch, split at every episode reset and use the last actual observation as $S_H$. Set $V(S_H)=0$ only at a true terminal state. A time limit that cuts an ongoing task, or a rollout cutoff, keeps its bootstrap value, and the trace still stops at the boundary, as in [Spinning Up's `finish_path`](https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/ppo/ppo.py).

```text
# One segment, with frozen values and no episode reset inside it.
endpoint = 0 if true_terminal else V(last_actual_observation)
v[H] = endpoint
advantage[H] = 0
for t = H-1 down to 0:
    delta = R_(t+1) + gamma * v[t+1] - v[t]
    advantage[t] = delta + gamma * lambda * advantage[t+1]
```

</details>

<details id="sec-time-limits" style="scroll-margin-top:var(--rc-top)">
<summary>When the clock ends the episode</summary>

That rule assumes you know whether an ending is real. Training runs usually stop every episode after a fixed number of steps, and that cutoff can mean two different things. [Pardo et al. (2018)](https://arxiv.org/abs/1712.00378) separate them.

**The time limit is part of the task.** Say the robot really has 14 moves to reach a goal. Then a state's value depends on how many moves are left, and if the state doesn't include the remaining time, two different situations look identical and the learner averages targets that disagree. Their fix is to put the remaining time in the input. In their Last Moment example, the agent can stay for reward 0 or jump into a trap that pays +1 once and then −1 on every step until the end. The best plan is to stay and jump on the very last step. An agent that can't see the clock can't tell when the last step is, and the paper notes that even Monte Carlo methods, which don't bootstrap, can't learn the right plan without the time input.

**The time limit is only for training.** If the task would really go on, the cutoff isn't an end. Treating it as terminal teaches the learner that states near the cutoff have less future ahead, so their values come out wrong even though nothing about them changed. Their fix is **partial-episode bootstrapping**: at the cutoff, use $R+\gamma V(S')$ instead of $R$.

<div class="ct ct-words">

| How the limit is meant | Value depends on | Target at the limit | Fix from Pardo et al. |
| --- | --- | --- | --- |
| Part of the task | State and time left | Real end: last reward only | Add the remaining time to the input |
| Only for training | State only | Not an end: bootstrap from $V(S')$ | Partial-episode bootstrapping |

</div>

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a pass-or-fail goal grid where this seems to happen: 14 moves, reward 1 at the goal and 0 otherwise, no discount. PPO with a learned value and GAE solved 13.3% of the tasks, and its value estimate at the start was about 1.44, above the largest possible return of 1. Scoring actions with real completed returns instead solved 95%, and with no baseline at all, 100% (3 seeds, simulation). The game's own reading is that the value bootstraps through the time limit and can't see the clock. Those are two different problems. The start value above 1 fits bootstrapping past a real ending, since no return in this task can exceed 1. Failing on the timed task also fits a missing clock, as in the Last Moment example, but the log has no run with the remaining time in the input, so that part is unconfirmed.

</details>

</div>
</div>
<script>
/* Open a closed drawer when a link targets it or something inside it. */
(function () {
  function openTarget() {
    var id = decodeURIComponent(location.hash.slice(1)), t = id && document.getElementById(id);
    if (!t) return;
    var wasClosed = false;
    for (var d = t.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) { if (!d.open) wasClosed = true; d.open = true; }
    if (wasClosed) requestAnimationFrame(function () { t.scrollIntoView({ block: 'start' }); });
  }
  openTarget(); window.addEventListener('hashchange', openTarget);
})();
</script>
<script src="/assets/robotics/rl/canvas.js" defer></script>
