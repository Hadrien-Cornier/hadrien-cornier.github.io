---
title: 'Function approximation: share a value, share an error'
description: 'When states share a few weights, one update can teach states you never visited, and it can also blur two states together and move the target you''re chasing.'
date: '2026-10-19'
updated: '2026-10-22'
draft: false
series: 'Reinforcement learning'
part: 3
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-3-function-approximation-whole.svg'
thumbnail_alt: 'Finer sensor bins multiply table rows, and one update on A also moves the never visited B'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<svg class="bb-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="bb-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in"/></filter></svg>
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 954" data-whole="0 0 680 954" data-views='{"scale":[24,46,300,220],"linear":[364,46,300,250],"alias":[24,356,300,240],"semigradient":[364,356,300,250],"moving":[24,666,300,240],"network":[364,666,300,250]}' role="img" aria-labelledby="f3-title f3-desc"><title id="f3-title">Function approximation on a blackboard: share a value, share an error</title><desc id="f3-desc">Six panels. 1: doubling one sensor's bins doubles the rows, four finer sensors give 16 times the rows, and one visit fills one entry while every unvisited entry knows nothing. 2: training only A with features (1, 1) toward 2 moves the weights from (0, 0) to (0.2, 0.2), so A goes from 0 to 0.4 and the never visited B from 0 to 0.6. 3: C and D have true values 0 and 2 but the same features (1, 0), so the best single prediction is 1. 4: the target 0.9 times 0.6 = 0.54 is built from B's prediction and then held fixed, and the update pushes A's prediction, 0.4, toward it. 5: after fitting A once, A goes from 0.400 to 0.428, B from 0.600 to 0.642, and the next target for A, 0.9 times B, from 0.5400 to 0.5778. 6: a live network trains on batches from saved transitions while a target copy is held still and refreshed periodically.</desc><g class="rc-panel" data-panel="scale"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. The table grows</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-3-0-f3-scale-title"><title id="canvas-3-0-f3-scale-title">Finer sensor bins create more table rows, and every unvisited row knows nothing</title><defs><marker id="canvas-3-0-f3-scale-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">One sensor slice, two actions</text><rect x="20" y="46" width="45" height="34" fill="#d7e5ee"/><rect x="190" y="46" width="45" height="17" fill="#d7e5ee"/><g fill="none" stroke="#656b62"><path d="M20 46H110V148H20Z M65 46V148 M20 80H110 M20 114H110"/><path d="M190 46H280V148H190Z M235 46V148 M190 63H280 M190 80H280 M190 97H280 M190 114H280 M190 131H280"/></g><text x="87.5" y="68" font-size="15" text-anchor="middle" fill="#656b62">?</text><text x="42.5" y="102" font-size="15" text-anchor="middle" fill="#656b62">?</text><text x="87.5" y="102" font-size="15" text-anchor="middle" fill="#656b62">?</text><text x="42.5" y="136" font-size="15" text-anchor="middle" fill="#656b62">?</text><text x="87.5" y="136" font-size="15" text-anchor="middle" fill="#656b62">?</text><text x="257.5" y="59.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="212.5" y="76.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="257.5" y="76.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="212.5" y="93.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="257.5" y="93.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="212.5" y="110.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="257.5" y="110.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="212.5" y="127.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="257.5" y="127.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="212.5" y="144.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><text x="257.5" y="144.0" font-size="13" text-anchor="middle" fill="#656b62">?</text><path d="M125 97H175" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-0-f3-scale-arr)"/><text x="150" y="86" font-size="14" text-anchor="middle" fill="#656b62">2× bins</text><text x="16" y="178" font-size="17">Blue: visited. ?: knows nothing</text><text x="16" y="206" font-size="17">Four finer sensors → 16× rows</text></g></svg></g><g class="rc-panel" data-panel="linear"><rect x="352" y="12" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. One update shares learning</text><svg x="364" y="46" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-1-f3-linear-title"><title id="canvas-3-1-f3-linear-title">Training A changes predictions at A and unvisited B</title><defs><marker id="canvas-3-1-f3-linear-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Train A: features (1, 1), target 2</text><text x="16" y="58">Weights: (0, 0) → (0.2, 0.2)</text><path d="M150 75V98M150 98L65 128M150 98L238 128" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-1-f3-linear-arr)"/><circle cx="65" cy="153" r="30" fill="#d7e5ee" stroke="#242622"/><circle cx="238" cy="153" r="30" fill="#fff" stroke="#242622"/><text x="59" y="159">A</text><text x="232" y="159">B</text><text x="19" y="204">0 → 0.4</text><text x="195" y="204">0 → 0.6</text><text x="17" y="234">Visited</text><text x="177" y="234">Never visited</text></g></svg></g><g class="rc-panel" data-panel="alias"><rect x="12" y="322" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="346">3. Sharing can erase distinctions</text><svg x="24" y="356" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-3-2-f3-alias-title"><title id="canvas-3-2-f3-alias-title">Two true values collapse to one shared prediction</title><defs><marker id="canvas-3-2-f3-alias-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><circle cx="245" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><text x="48" y="52">C</text><text x="238" y="52">D</text><text x="16" y="95">True value 0</text><text x="180" y="95">True value 2</text><path d="M55 108L128 143M245 108L172 143" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-2-f3-alias-arr)"/><text x="65" y="169">Same features (1, 0)</text><path d="M150 178V199" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-2-f3-alias-arr)"/><text x="43" y="226">One prediction: best fit 1</text></g></svg></g><g class="rc-panel" data-panel="semigradient"><rect x="352" y="322" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="346">4. Hold the target still</text><svg x="364" y="356" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-3-f3-sg-title"><title id="canvas-3-3-f3-sg-title">Semi-gradient TD builds the target 0.54 from B, then holds it fixed while it pushes A toward it</title><defs><marker id="canvas-3-3-f3-sg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker><marker id="canvas-3-3-f3-sg-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="24" text-anchor="middle" font-size="17">Build the target, then freeze it</text><rect x="38" y="50" width="18" height="14" rx="2" fill="none" stroke="#242622" stroke-width="1.8"/><path d="M42 50V45a5 5 0 0 1 10 0V50" fill="none" stroke="#242622" stroke-width="1.8"/><text x="64" y="63" font-size="18">target = 0.9 × <tspan fill="#2b6a8e">0.6</tspan> = 0.54</text><path d="M28 80H272" stroke="#656b62" stroke-width="1.5" stroke-dasharray="5 5"/><path d="M70 130V88" stroke="#b44c2c" stroke-width="2.4" marker-end="url(#canvas-3-3-f3-sg-red)"/><text x="80" y="114" font-size="15" fill="#b44c2c">moves up</text><path d="M230 130V88" stroke="#656b62" stroke-width="1.8" stroke-dasharray="4 4" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="222" y="114" font-size="15" text-anchor="end" fill="#656b62">read once</text><circle cx="70" cy="160" r="28" fill="none" stroke="#242622" stroke-width="2"/><text x="70" y="156" text-anchor="middle">A</text><text x="70" y="178" text-anchor="middle" font-size="16" fill="#b44c2c">0.4</text><circle cx="230" cy="160" r="28" fill="none" stroke="#242622" stroke-width="2"/><text x="230" y="156" text-anchor="middle">B</text><text x="230" y="178" text-anchor="middle" font-size="16" fill="#2b6a8e">0.6</text><text x="16" y="216" font-size="16">The step pushes A toward 0.54</text><text x="16" y="240" font-size="16">as if 0.54 could not move.</text></g></svg></g><g class="rc-panel" data-panel="moving"><rect x="12" y="632" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="656">5. The target moves next time</text><svg x="24" y="666" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-3-4-f3-move-title"><title id="canvas-3-4-f3-move-title">A shared update raises both the current value and its next target</title><defs><marker id="canvas-3-4-f3-move-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><defs><marker id="canvas-3-4-f3-move-dim" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="22" text-anchor="middle" font-size="17">Fit A once: both values rise</text><circle cx="62" cy="70" r="28" fill="none" stroke="#242622" stroke-width="2"/><text x="62" y="77" text-anchor="middle" font-size="20">A</text><circle cx="238" cy="70" r="28" fill="none" stroke="#242622" stroke-width="2"/><text x="238" y="77" text-anchor="middle" font-size="20">B</text><path d="M94 70H202" fill="none" stroke="#656b62" stroke-width="1.8" marker-end="url(#canvas-3-4-f3-move-dim)"/><text x="150" y="62" text-anchor="middle" font-size="14" fill="#656b62">move, r = 0</text><text x="62" y="124" text-anchor="middle" font-size="16">0.400 → 0.428</text><text x="238" y="124" text-anchor="middle" font-size="16">0.600 → <tspan fill="#b44c2c">0.642</tspan></text><path d="M250 132C250 158 236 170 206 176" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-4-f3-move-arr)"/><text x="258" y="160" font-size="14" fill="#b44c2c">× 0.9</text><text x="16" y="192" font-size="17">next target for A</text><text x="16" y="222" font-size="18">0.5400 → <tspan fill="#b44c2c">0.5778</tspan></text></g></svg></g><g class="rc-panel" data-panel="network"><rect x="352" y="632" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="656">6. Networks need steadier targets</text><svg x="364" y="666" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-5-f3-net-title"><title id="canvas-3-5-f3-net-title">Replay supplies transitions while a separate network supplies targets</title><defs><marker id="canvas-3-5-f3-net-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Saved transitions → sample batch</text><path d="M62 42V66M235 42V66" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="16" y="93">Live network</text><text x="168" y="93">Target copy</text><text x="16" y="123" fill="#b44c2c">Weights move</text><text x="168" y="123">Held still</text><path d="M235 134V162H150" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="114" y="188">Target</text><path d="M111 181H49V135" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><path d="M47 204H250" stroke="#656b62" stroke-dasharray="5 4" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="16" y="237">Periodic copy → refresh target</text></g></svg></g></svg></div></div>
<div class="rc-body">

A table learns every state on its own, so a state you've never visited knows nothing, even when you've seen its neighbors many times. Function approximation fixes that by letting states share a few adjustable numbers. Sharing is the whole idea, and it cuts both ways: one example can teach many states, and one update can also move values you didn't mean to touch, including the target you're chasing.

**Part 3.** Previously: [bootstrapping](/robotics/rl-2-bootstrapping/).

<div class="rc-mark" id="sec-scale" data-panel="scale" data-view="scale" data-title="The table grows"></div>

## The table grows

A Q table stores one number per state and action. With continuous sensors you first cut each reading into bins, so $d$ sensors with $b$ bins each and $a$ actions give $a\,b^d$ entries. Take an illustrative cart-balancing task with four sensors (position, speed, pole angle, angular speed). Six bins per sensor give 1,296 rows, or 2,592 entries with two actions. Twelve bins give 20,736 rows and 41,472 entries. Doubling the resolution multiplied the rows by sixteen, and every new row needs its own data, because the table learns each row separately.

<div class="rc-mark" id="sec-linear" data-panel="linear" data-view="linear" data-title="One update shares learning"></div>

## One update shares learning

So let's store a few **weights** instead and predict a state's value as $\hat v(s,w)=w^\top x(s)$, where $x(s)$ lists the state's features. State A has features (1, 1) and state B has (1, 2), and both weights start at 0. Now train only A, toward a target of 2 with a step size of 0.1:

$$w\leftarrow w+\alpha\,[\,y-\hat v(\mathrm A,w)\,]\,x(\mathrm A)$$

The error is 2, so both weights become 0.2. A now predicts 0.4, and B, which you never trained, predicts 0.6. B moved because it uses the same weights. If B's true value is 3, that's a step in the right direction, but whether sharing helps a state you didn't train always depends on its features and its target.

<div class="rc-mark" id="sec-alias" data-panel="alias" data-view="alias" data-title="Sharing can erase distinctions"></div>

## Sharing can erase distinctions

Sharing has a limit. Say states C and D have true values 0 and 2, but both have the same features (1, 0). Then every weight setting gives them the same prediction. If you see both equally often, the best shared prediction is their average, 1, which is off by 1 for each. That's **aliasing**, and more training can't fix it, because the difference isn't in the input. Coarse sensor bins can do this when two states share every bin but their angular speeds imply very different futures.

<div class="rc-mark" id="sec-semigradient" data-panel="semigradient" data-view="semigradient" data-title="Hold the target still"></div>

## Hold the target still

Now let the model build its own target, as bootstrapping does. A predicts 0.4, its successor B predicts 0.6, the reward is 0 and the discount is 0.9, so the target is $0 + 0.9 \times 0.6 = 0.54$. **Semi-gradient TD** treats 0.54 as a fixed number and nudges only A's prediction toward it. It ignores the fact that 0.54 came from the same weights it's about to change.

<div class="rc-mark" id="sec-moving" data-panel="moving" data-view="moving" data-title="The target moves next time"></div>

## The target moves next time

Holding the target still for one update doesn't keep it still afterward. The error is $0.54 - 0.4 = 0.14$, so each weight grows by $0.1 \times 0.14 = 0.014$, to 0.214. A now predicts 0.428, but B rose too, to 0.642. Replay the same transition and the target is $0.9 \times 0.642 = 0.5778$ instead of 0.54. With a table, updating A would have left B alone.

This coupling doesn't prove anything diverges. Linear TD with on-policy sampling has convergence results under technical conditions, and other sampling distributions can break that stability ([Sutton and Barto, Sections 9.4 and 11.2](http://incompleteideas.net/book/RLbook2020.pdf)).

<div class="rc-mark" id="sec-network" data-panel="network" data-view="network" data-title="Networks need steadier targets"></div>

## Networks need steadier targets

A neural network learns its own features, but it still shares parameters across inputs, so it has the same coupling. DQN ([Mnih et al., 2015](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf)) adds two fixes. Replay memory reuses saved transitions and breaks up runs of consecutive, similar samples. A target network, a frozen copy refreshed only now and then, builds the targets so they don't shift after every update. Both help in practice, but neither gives a general convergence guarantee for neural Q-learning.

Which policy produced those transitions, and which policy does their target evaluate? [Part 4: on-policy and off-policy learning](/robotics/rl-4-on-policy-and-off-policy/) explains the distinction, and [Part 5](/robotics/rl-5-the-deadly-triad/) comes back to stability.

<details>
<summary>The exact updates, notation and sources</summary>

**Table size.** With $d$ sensor dimensions, $b$ bins per dimension and $a$ actions, the Q table has $N=a\,b^d$ entries, because $b^d$ counts all combinations of binned readings. With function approximation, one observation can update predictions across several states without waiting for each to get its own data: the generalization problem of [Sutton and Barto, Part II and Section 9.1](http://incompleteideas.net/book/RLbook2020.pdf).

**Linear prediction.** $x(s)$ is a fixed vector of numerical features and $w$ a weight vector of the same length. $w^\top x(s)$ multiplies matching coordinates and adds them, and the hat in $\hat v(s,w)$ marks an estimate. Given a target $y$ at state $s$, the squared-error update is $w\leftarrow w+\alpha[y-\hat v(s,w)]x(s)$. It moves in a direction that locally reduces that state's squared error, and every state that uses the same features moves with it ([Sections 9.3 and 9.4](http://incompleteideas.net/book/RLbook2020.pdf)).

**Aliasing.** If C and D share features $(1,0)$, then $\hat v(\mathrm C,w)=\hat v(\mathrm D,w)=c$ for the first weight $c$. Sampling both equally and fitting squared error gives $c=(0+2)/2=1$. If one state were sampled more often, the shared estimate would move toward its value ([Sections 9.1 to 9.3](http://incompleteideas.net/book/RLbook2020.pdf)). Giving the states different features allows different predictions, and adding parameters helps only if the inputs still carry the relevant information.

**Semi-gradient TD.** $t$ counts transitions, $S_t$ is the current state, $R_{t+1}$ the reward after the action and $w_t$ the current weights. The one-step target, with terminal value zero, is held fixed while differentiating:

$$\begin{aligned}
y_t&=R_{t+1}+\gamma\hat v(S_{t+1},w_t),\qquad L_t(w)=\tfrac12[y_t-\hat v(S_t,w)]^2,\\
w_{t+1}&=w_t+\alpha\,\delta_t\,\nabla_w\hat v(S_t,w_t),\qquad \delta_t=y_t-\hat v(S_t,w_t).
\end{aligned}$$

With linear features the gradient is $x(S_t)$. Differentiating through the target as well would give a different update. Because later targets are recomputed with the new weights, this is not the same as minimizing one fixed loss throughout training ([Sections 9.3 and 9.4](http://incompleteideas.net/book/RLbook2020.pdf)).

**DQN target.** $Q_\theta(s,a)$ is the network's estimate for action $a$ in state $s$, and $\bar\theta$ are the target-network parameters, held fixed between scheduled refreshes:

$$z_t=R_{t+1}+\gamma\max_{a'}Q_{\bar\theta}(S_{t+1},a').$$

When the transition terminates, the target is just the reward. The live network fits $z_t$ on batches sampled from replay memory, and its parameters are copied to the target network periodically ([Mnih et al., 2015](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf)).

</details>

<details>
<summary>The worked numbers in tables, and what sharing buys and costs</summary>

Training only A once, with $w=(0,0)$, target 2 and step size 0.1:

| After training only A once | A: features (1, 1) | B: features (1, 2) |
| --- | ---: | ---: |
| Before | 0 | 0 |
| After | 0.4 | 0.6 |
| Supplied comparison target | 2 | 3 |

Then one semi-gradient update on the transition A to B, with weights $(0.2,0.2)$, reward 0, discount 0.9 and step size 0.1: $w=(0.2,0.2)+0.1(0.14)(1,1)=(0.214,0.214)$.

| Same replayed A → B transition | Before | After one update |
| --- | ---: | ---: |
| Prediction at A | 0.4 | 0.428 |
| Prediction at B | 0.6 | 0.642 |
| Target from B | 0.54 | 0.5778 |

**Sharing buys:** compact storage, because parameters replace an entry for every input; transfer, because one example can improve related states; and, with networks, features learned from observations.

**Sharing costs:** representation error, because identical features force identical predictions; interference, because an update can worsen predictions elsewhere; and stability, because replay and target copies help but give no general convergence guarantee for neural Q-learning.

</details>

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
