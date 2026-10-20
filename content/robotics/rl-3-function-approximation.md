---
title: 'Function approximation: share a value, share an error'
description: 'A worked feature update explains generalization, aliasing, semi-gradients and moving targets.'
date: '2026-10-19'
draft: false
series: 'Reinforcement learning'
part: 3
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-3-function-approximation-whole.svg'
thumbnail_alt: 'Finer sensor bins create more unvisited table rows'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 954" data-whole="0 0 680 954" data-views='{"scale":[24,46,300,220],"linear":[364,46,300,250],"alias":[24,356,300,240],"semigradient":[364,356,300,250],"moving":[24,666,300,240],"network":[364,666,300,250]}' role="img" aria-label="Whole mechanism map: Function approximation: share a value, share an error"><g class="rc-panel" data-panel="scale"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. The table grows</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-3-0-f3-scale-title"><title id="canvas-3-0-f3-scale-title">Finer sensor bins create more unvisited table rows</title><defs><marker id="canvas-3-0-f3-scale-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">One sensor slice, two actions</text><g fill="#fff" stroke="#656b62"><path d="M20 48H110V136H20Z M65 48V136 M20 77H110 M20 106H110"/><path d="M190 48H280V136H190Z M235 48V136 M190 62H280 M190 77H280 M190 92H280 M190 106H280 M190 121H280"/></g><path d="M125 92H175" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-0-f3-scale-arr)"/><rect x="20" y="48" width="45" height="29" fill="#d7e5ee"/><rect x="190" y="48" width="45" height="14" fill="#d7e5ee"/><text x="16" y="168">Blue: one visited entry</text><text x="16" y="198">Four finer sensors → 16× rows</text></g></svg></g><g class="rc-panel" data-panel="linear"><rect x="352" y="12" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. One update shares learning</text><svg x="364" y="46" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-1-f3-linear-title"><title id="canvas-3-1-f3-linear-title">Training A changes predictions at A and unvisited B</title><defs><marker id="canvas-3-1-f3-linear-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Train A: features (1, 1), target 2</text><text x="16" y="58">Weights: (0, 0) → (0.2, 0.2)</text><path d="M150 75V98M150 98L65 128M150 98L238 128" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-1-f3-linear-arr)"/><circle cx="65" cy="153" r="30" fill="#d7e5ee" stroke="#242622"/><circle cx="238" cy="153" r="30" fill="#fff" stroke="#242622"/><text x="59" y="159">A</text><text x="232" y="159">B</text><text x="19" y="204">0 → 0.4</text><text x="195" y="204">0 → 0.6</text><text x="17" y="234">Visited</text><text x="177" y="234">Never visited</text></g></svg></g><g class="rc-panel" data-panel="alias"><rect x="12" y="322" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="346">3. Sharing can erase distinctions</text><svg x="24" y="356" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-3-2-f3-alias-title"><title id="canvas-3-2-f3-alias-title">Two true values collapse to one shared prediction</title><defs><marker id="canvas-3-2-f3-alias-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><circle cx="245" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><text x="48" y="52">C</text><text x="238" y="52">D</text><text x="16" y="95">True value 0</text><text x="180" y="95">True value 2</text><path d="M55 108L128 143M245 108L172 143" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-2-f3-alias-arr)"/><text x="65" y="169">Same features (1, 0)</text><path d="M150 178V199" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-2-f3-alias-arr)"/><text x="43" y="226">One prediction: best fit 1</text></g></svg></g><g class="rc-panel" data-panel="semigradient"><rect x="352" y="322" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="346">4. Hold the target still</text><svg x="364" y="356" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-3-f3-sg-title"><title id="canvas-3-3-f3-sg-title">Semi-gradient TD differentiates the prediction but holds its target constant</title><defs><marker id="canvas-3-3-f3-sg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Same weights, two predictions</text><path d="M150 41L66 73M150 41L237 73" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="16" y="101">Current value</text><text x="174" y="101">Next value</text><path d="M235 112V142H165" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="168" y="169" fill="#b44c2c">Target: hold</text><text x="168" y="192" fill="#b44c2c">constant</text><path d="M66 112V187H142" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="16" y="224">Differentiate current value only</text></g></svg></g><g class="rc-panel" data-panel="moving"><rect x="12" y="632" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="656">5. The target moves next time</text><svg x="24" y="666" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-3-4-f3-move-title"><title id="canvas-3-4-f3-move-title">A shared update raises both the current value and its next target</title><defs><marker id="canvas-3-4-f3-move-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Fit A once; shared weights rise</text><text x="16" y="64">A: 0.400 → 0.428</text><text x="16" y="100">B: 0.600 → 0.642</text><path d="M225 110V142H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-4-f3-move-arr)"/><text x="16" y="174">Next target for A = 0.9 × B</text><text x="16" y="210" fill="#b44c2c">0.5400 → 0.5778</text></g></svg></g><g class="rc-panel" data-panel="network"><rect x="352" y="632" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="656">6. Networks need steadier targets</text><svg x="364" y="666" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-5-f3-net-title"><title id="canvas-3-5-f3-net-title">Replay supplies transitions while a separate network supplies targets</title><defs><marker id="canvas-3-5-f3-net-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Saved transitions → sample batch</text><path d="M62 42V66M235 42V66" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="16" y="93">Live network</text><text x="168" y="93">Target copy</text><text x="16" y="123" fill="#b44c2c">Weights move</text><text x="168" y="123">Held still</text><path d="M235 134V162H150" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="114" y="188">Target</text><path d="M111 181H49V135" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><path d="M47 204H250" stroke="#656b62" stroke-dasharray="5 4" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="16" y="237">Periodic copy → refresh target</text></g></svg></g></svg></div></div>
<div class="rc-body">

Suppose a sensor reports a position you have never visited. A separate table row has learned nothing there, even if you have observed nearby states. Can one observation teach us about those states too? Function approximation lets states share a prediction rule. We will calculate one shared update, see a distinction the rule cannot represent, and then work through how an update can change the successor's prediction and move the training target. [Sutton and Barto, Chapter 9](http://incompleteideas.net/book/RLbook2020.pdf).

**Part 3.** [Previously: bootstrapping](/robotics/rl-2-bootstrapping/).

**Reading goal:** see how one example changes predictions at two states, calculate what the model cannot represent, and follow how fitting the current target changes the next one.

<nav class="rc-route" aria-label="Reading route"><a href="#sec-scale" data-go="sec-scale">The table grows</a><a href="#sec-linear" data-go="sec-linear">One update shares learning</a><a href="#sec-alias" data-go="sec-alias">Sharing can erase distinctions</a><a href="#sec-semigradient" data-go="sec-semigradient">Hold the target still</a><a href="#sec-moving" data-go="sec-moving">The target moves next time</a><a href="#sec-network" data-go="sec-network">Networks need steadier targets</a></nav>

<div class="rc-mark" id="sec-scale" data-panel="scale" data-view="scale" data-title="The table grows"></div>

## The table grows

A Q table stores one number for each state and action. That works for a small grid. With continuous sensor readings, we first have to decide which observations should share a row.

To count the entries, use $d$ for the number of sensor dimensions, $b$ for the number of bins per dimension, and $a$ for the number of available actions. The full Q table has $N$ entries, where $b^d$ counts all combinations of the $d$ binned sensor readings. Here $a$ counts actions; in the previous episode, it stood for a particular action:

$$N=a\,b^d.$$

Consider an illustrative cart-balancing task with four sensors: position, speed, pole angle and angular speed. Six bins per sensor give us 1,296 state rows. With two actions, that means 2,592 Q entries. Increasing to twelve bins per sensor gives us 20,736 rows and 41,472 entries.

Doubling the resolution in four dimensions gives us sixteen times as many rows. We need observations to train those rows too, because the table learns each one separately. So memory is only part of the problem. Coarser bins let states within a bin share a prediction, but predictions jump at bin boundaries.

With function approximation, a compact rule can use one observation to update predictions across several states, without waiting for each state to receive its own data. This is the generalization problem described in [Sutton and Barto, Part II and Section 9.1](http://incompleteideas.net/book/RLbook2020.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="f3-scale-title"><title id="f3-scale-title">Finer sensor bins create more unvisited table rows</title><defs><marker id="f3-scale-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">One sensor slice, two actions</text><g fill="#fff" stroke="#656b62"><path d="M20 48H110V136H20Z M65 48V136 M20 77H110 M20 106H110"/><path d="M190 48H280V136H190Z M235 48V136 M190 62H280 M190 77H280 M190 92H280 M190 106H280 M190 121H280"/></g><path d="M125 92H175" stroke="#656b62" stroke-width="2" marker-end="url(#f3-scale-arr)"/><rect x="20" y="48" width="45" height="29" fill="#d7e5ee"/><rect x="190" y="48" width="45" height="14" fill="#d7e5ee"/><text x="16" y="168">Blue: one visited entry</text><text x="16" y="198">Four finer sensors → 16× rows</text></g></svg><figcaption>Table view. Fixed: two actions and one visit. Resolution increases to the right. Compare how much of the expanded table that visit teaches.</figcaption></figure>

<div class="rc-mark" id="sec-linear" data-panel="linear" data-view="linear" data-title="One update shares learning"></div>

## One update shares learning

How can one example change predictions at several states? In a table, a new row starts empty even if we just trained on a similar state. We can reuse that example by making both states' predictions depend on the same adjustable numbers.

For a state-value example, we can store a few **weights** instead of a separate value for every state. Here $s$ is a state, $x(s)$ is its fixed vector of numerical features, and $w$ is a weight vector with the same length. The superscript $\top$ turns a column vector into a row, so $w^\top x(s)$ multiplies the corresponding coordinates and adds the results. We write the approximate state value as $\hat v(s,w)$; the hat marks an estimate. An assignment arrow in an update replaces the old weights. Our prediction rule is

$$\hat v(s,w)=w^\top x(s).$$

Take two states, A and B, with features $x(\mathrm A)=(1,1)^\top$ and $x(\mathrm B)=(1,2)^\top$. With initial weights $w=(0,0)^\top$, both predictions are zero. Suppose we are given a training target $y$ of 2 at A and use $\alpha=0.1$ as the step size. The linear squared-error update is

$$w\leftarrow w+\alpha[y-\hat v(\mathrm A,w)]x(\mathrm A).$$

The error is 2, so both weights become 0.2. A now predicts 0.4 and B predicts 0.6, even though we have given the model no example from B. If B's target is 3, its prediction has moved closer too.

| After training only A once | A: features (1, 1) | B: features (1, 2) |
| --- | ---: | ---: |
| Before | 0 | 0 |
| After | 0.4 | 0.6 |
| Supplied comparison target | 2 | 3 |

Both predictions change because each weight affects every input that uses its feature. The update moves in a direction that locally reduces A's squared error. Whether it also helps B depends on B's features and target. [Sutton and Barto, Sections 9.3–9.4](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Describe the visited state with its feature vector.
Compute target minus prediction.
Add step size × error × features to the weights.
Recompute any state's value with the new weights.
```

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="f3-linear-title"><title id="f3-linear-title">Training A changes predictions at A and unvisited B</title><defs><marker id="f3-linear-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Train A: features (1, 1), target 2</text><text x="16" y="58">Weights: (0, 0) → (0.2, 0.2)</text><path d="M150 75V98M150 98L65 128M150 98L238 128" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-linear-arr)"/><circle cx="65" cy="153" r="30" fill="#d7e5ee" stroke="#242622"/><circle cx="238" cy="153" r="30" fill="#fff" stroke="#242622"/><text x="59" y="159">A</text><text x="232" y="159">B</text><text x="19" y="204">0 → 0.4</text><text x="195" y="204">0 → 0.6</text><text x="17" y="234">Visited</text><text x="177" y="234">Never visited</text></g></svg><figcaption>Parameter view. Fixed: features and supplied targets, A = 2 and B = 3. Weights change after A's example. Compare both predictions before and after that single update.</figcaption></figure>

<div class="rc-mark" id="sec-alias" data-panel="alias" data-view="alias" data-title="Sharing can erase distinctions"></div>

## Sharing can erase distinctions

But what if two states need different predictions and we give them identical features? More training cannot recover a distinction we removed from the representation.

Call these states C and D. The names are labels, rather than variables. We use the same $w$ and feature rule as before. Suppose their true values are 0 and 2, but both have the feature vector $(1,0)^\top$. If $c$ is the first weight, every possible setting of the weights gives

$$\hat v(\mathrm C,w)=\hat v(\mathrm D,w)=c.$$

If we see examples from both states equally often and fit with squared error, the best shared prediction is the mean of their values:

$$c=\frac{0+2}{2}=1.$$

That leaves both states with an error of 1. We call this **aliasing**: the states differ, but the value function sees them as the same. If we sampled one state more often, the shared estimate would move toward that state's target. [Sutton and Barto, Sections 9.1–9.3](http://incompleteideas.net/book/RLbook2020.pdf).

A coarse sensor bin can cause this problem. In the cart-balancing example, two pole positions may look similar while their angular speeds imply very different futures. If the representation records only the angle, it loses that distinction.

```text
Check whether conflicting examples have identical features.
If so, add the missing predictive information.
Refit using features that distinguish the two states.
```

Giving the states different feature vectors allows different predictions. Adding parameters can help only if the inputs still contain the relevant information.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="f3-alias-title"><title id="f3-alias-title">Two true values collapse to one shared prediction</title><defs><marker id="f3-alias-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><circle cx="245" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><text x="48" y="52">C</text><text x="238" y="52">D</text><text x="16" y="95">True value 0</text><text x="180" y="95">True value 2</text><path d="M55 108L128 143M245 108L172 143" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-alias-arr)"/><text x="65" y="169">Same features (1, 0)</text><path d="M150 178V199" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-alias-arr)"/><text x="43" y="226">One prediction: best fit 1</text></g></svg><figcaption>Representation view. Fixed: true values 0 and 2, sampled equally. Both inputs collapse to the same features. Compare the two required answers with the single available prediction.</figcaption></figure>

<div class="rc-mark" id="sec-semigradient" data-panel="semigradient" data-view="semigradient" data-title="Hold the target still"></div>

## Hold the target still

So far, we have supplied the training target. Now suppose we use the model's prediction at a successor to build it. The model predicts 0.4 at the current state and 0.6 at its successor. With a reward of 0 and a discount of 0.9, the target is 0.54. We can fit 0.4 toward that number, but differentiating through the calculation that produced 0.54 gives a different update. Semi-gradient TD holds 0.54 fixed while taking this derivative.

Here $t$ counts transitions, $S_t$ is the current state, and $R_{t+1}$ is the reward received after action $A_t$. We use $w_t$ for the current weights and $\gamma$ for the discount, between 0 and 1. We calculate the one-step target $y_t$ with those weights, taking the terminal value to be zero:

$$y_t=R_{t+1}+\gamma\hat v(S_{t+1},w_t).$$

For this update, we treat $y_t$ as a fixed number. We write the squared error against it as $L_t(w)$. The symbol $\nabla_w$ means the vector of derivatives with respect to the weights:

$$L_t(w)=\tfrac12[y_t-\hat v(S_t,w)]^2.$$

The weights after this transition are $w_{t+1}$, and $\alpha$ is still the step size. Writing $\delta_t=y_t-\hat v(S_t,w_t)$ for the TD error, the update is

$$w_{t+1}=w_t+\alpha\delta_t\nabla_w\hat v(S_t,w_t).$$

With linear features, the gradient is $x(S_t)$. This is **semi-gradient TD**: we differentiate through the prediction we are fitting while ignoring how the target depends on the weights. [Sutton and Barto, Sections 9.3–9.4](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Compute the target with the current weights.
Detach that number from differentiation.
Differentiate the current state's prediction.
Update weights; recompute the next target next time.
```

This step moves the current prediction toward the target we just calculated. Later targets are recomputed, so this local fitting direction is different from minimizing one fixed loss throughout training.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="f3-sg-title"><title id="f3-sg-title">Semi-gradient TD differentiates the prediction but holds its target constant</title><defs><marker id="f3-sg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Same weights, two predictions</text><path d="M150 41L66 73M150 41L237 73" stroke="#656b62" stroke-width="2" marker-end="url(#f3-sg-arr)"/><text x="16" y="101">Current value</text><text x="174" y="101">Next value</text><path d="M235 112V142H165" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#f3-sg-arr)"/><text x="168" y="169" fill="#b44c2c">Target: hold</text><text x="168" y="192" fill="#b44c2c">constant</text><path d="M66 112V187H142" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#f3-sg-arr)"/><text x="16" y="224">Differentiate current value only</text></g></svg><figcaption>Computation view. Fixed during differentiation: the calculated target. Weights change through the current prediction's derivative. Follow both branches to see which derivative is kept.</figcaption></figure>

<div class="rc-mark" id="sec-moving" data-panel="moving" data-view="moving" data-title="The target moves next time"></div>

## The target moves next time

Holding the target constant during differentiation does not keep future targets fixed. With shared weights, an update changes both sides of the next TD error.

Let's return to A and B with their earlier features and weights $(0.2,0.2)^\top$, and take a transition from A to B. Use a reward of zero, a discount of 0.9 and a step size of 0.1. A predicts 0.4 and B predicts 0.6, so the target is 0.54 and the TD error is 0.14. Here $w_{t+1}$ is the updated weight vector, and $y_{t+1}$ below means the target on the next replay of this same stored transition:

$$w_{t+1}=(0.2,0.2)^\top+0.1(0.14)(1,1)^\top
=(0.214,0.214)^\top.$$

With the new weights, A predicts 0.428 and B predicts 0.642. If we train on the same transition again, the target becomes

$$y_{t+1}=0+0.9(0.642)=0.5778.$$

| Same replayed A → B transition | Before | After one update |
| --- | ---: | ---: |
| Prediction at A | 0.4 | 0.428 |
| Prediction at B | 0.6 | 0.642 |
| Target from B | 0.54 | 0.5778 |

The target has increased from 0.54 to 0.5778 because the update also raised B's value. With a table, updating A would have left B's separate entry unchanged.

```text
Fit the current target once.
Recompute the successor's prediction.
Compare the new target with the previous target.
```

This calculation shows how the predictions are coupled; it does not prove divergence. Linear TD prediction has convergence results for a fixed policy with on-policy sampling and appropriate technical conditions. Other sampling distributions can break that stability. [Sutton and Barto, Sections 9.4 and 11.2](http://incompleteideas.net/book/RLbook2020.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="f3-move-title"><title id="f3-move-title">A shared update raises both the current value and its next target</title><defs><marker id="f3-move-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Fit A once; shared weights rise</text><text x="16" y="64">A: 0.400 → 0.428</text><text x="16" y="100">B: 0.600 → 0.642</text><path d="M225 110V142H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-move-arr)"/><text x="16" y="174">Next target for A = 0.9 × B</text><text x="16" y="210" fill="#b44c2c">0.5400 → 0.5778</text></g></svg><figcaption>Repeated-transition view. Fixed: A to B, reward 0 and discount 0.9. One weight update changes both predictions. Compare the target before and after recomputing B.</figcaption></figure>

<div class="rc-mark" id="sec-network" data-panel="network" data-view="network" data-title="Networks need steadier targets"></div>

## Networks need steadier targets

A neural network can learn intermediate features along with its output weights, where a linear predictor is limited by the features we design for it. But the network still shares parameters across inputs, so it has the same coupling problem.

For action values, we write $Q_\theta(s,a)$ for the network's estimate for taking action $a$ in state $s$, using learned parameters $\theta$. To build targets, we keep a separate target-network copy with parameters $\bar\theta$, held fixed between scheduled refreshes. Here $a'$ ranges over actions available at the next state, and $\max_{a'}$ selects the largest prediction among them. The observed reward is $R_{t+1}$ and the successor is $S_{t+1}$. DQN calculates the target $z_t$ as

$$z_t=R_{t+1}+\gamma\max_{a'}Q_{\bar\theta}(S_{t+1},a').$$

When the transition terminates, the target is just the reward. Otherwise, it includes the largest next-action estimate selected by the max. The learned network fits the resulting number while the target copy remains fixed.

```text
Save transitions in replay memory.
Sample a batch of saved transitions.
Build targets with the frozen copy; fit the live network.
Periodically copy the live parameters to the target copy.
```

Replay lets us reuse observations and break up consecutive samples. The separate network copy slows changes in the estimated tail of the return. These are the mechanisms used by [Mnih et al., DQN, 2015](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf).

**Sharing buys:**

- **Compact storage.** Parameters replace separate entries for every possible input.
- **Transfer.** One example can improve predictions at related states.
- **Flexible features.** Networks can learn useful representations from observations.

**Costs and conditions:**

- **Representation error.** Identical features force identical predictions.
- **Interference.** An update can worsen predictions elsewhere.
- **Stability.** Replay and target copies help training; they provide no general convergence guarantee for neural Q-learning.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="f3-net-title"><title id="f3-net-title">Replay supplies transitions while a separate network supplies targets</title><defs><marker id="f3-net-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Saved transitions → sample batch</text><path d="M62 42V66M235 42V66" stroke="#656b62" stroke-width="2" marker-end="url(#f3-net-arr)"/><text x="16" y="93">Live network</text><text x="168" y="93">Target copy</text><text x="16" y="123" fill="#b44c2c">Weights move</text><text x="168" y="123">Held still</text><path d="M235 134V162H150" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#f3-net-arr)"/><text x="114" y="188">Target</text><path d="M111 181H49V135" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-net-arr)"/><path d="M47 204H250" stroke="#656b62" stroke-dasharray="5 4" stroke-width="2" marker-end="url(#f3-net-arr)"/><text x="16" y="237">Periodic copy → refresh target</text></g></svg><figcaption>Training view. Fixed between refreshes: target-copy weights. The live network changes from replayed transitions. Compare the fitting arrow with the occasional copy arrow.</figcaption></figure>

Which policy produced those transitions, and which policy does their target evaluate? [Part 4: on-policy and off-policy learning](/robotics/rl-4-on-policy-and-off-policy/) explains the distinction. We return to the stability problem in [Part 5](/robotics/rl-5-the-deadly-triad/).

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
