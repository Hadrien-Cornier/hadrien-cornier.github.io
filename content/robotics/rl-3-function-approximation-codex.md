---
title: 'Function approximation: share a value, share an error (Codex trial)'
description: 'A worked feature update explains generalization, aliasing, semi-gradients and moving targets.'
date: '2026-10-19'
draft: true
series: 'Reinforcement learning, Codex trial'
part: 3
layout: essay
thumbnail: '/assets/robotics/rl-codex/thumbnails/part3.png'
thumbnailAlt: 'Training A changes predictions at A and unvisited B'
---

<link rel="stylesheet" href="/assets/robotics/rl-codex/series.css">
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 954" data-whole="0 0 680 954" data-views='{"scale":[24,46,300,220],"linear":[364,46,300,250],"alias":[24,356,300,240],"semigradient":[364,356,300,250],"moving":[24,666,300,240],"network":[364,666,300,250]}' role="img" aria-label="Whole mechanism map: Function approximation: share a value, share an error"><g class="rc-panel" data-panel="scale"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. The table grows</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="canvas-3-0-f3-scale-title"><title id="canvas-3-0-f3-scale-title">Finer sensor bins create more unvisited table rows</title><defs><marker id="canvas-3-0-f3-scale-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">One sensor slice, two actions</text><g fill="#fff" stroke="#656b62"><path d="M20 48H110V136H20Z M65 48V136 M20 77H110 M20 106H110"/><path d="M190 48H280V136H190Z M235 48V136 M190 62H280 M190 77H280 M190 92H280 M190 106H280 M190 121H280"/></g><path d="M125 92H175" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-0-f3-scale-arr)"/><rect x="20" y="48" width="45" height="29" fill="#d7e5ee"/><rect x="190" y="48" width="45" height="14" fill="#d7e5ee"/><text x="16" y="168">Blue: one visited entry</text><text x="16" y="198">Four finer sensors → 16× rows</text></g></svg></g><g class="rc-panel" data-panel="linear"><rect x="352" y="12" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. One update shares learning</text><svg x="364" y="46" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-1-f3-linear-title"><title id="canvas-3-1-f3-linear-title">Training A changes predictions at A and unvisited B</title><defs><marker id="canvas-3-1-f3-linear-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Train A: features (1, 1), target 2</text><text x="16" y="58">Weights: (0, 0) → (0.2, 0.2)</text><path d="M150 75V98M150 98L65 128M150 98L238 128" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-1-f3-linear-arr)"/><circle cx="65" cy="153" r="30" fill="#d7e5ee" stroke="#242622"/><circle cx="238" cy="153" r="30" fill="#fff" stroke="#242622"/><text x="59" y="159">A</text><text x="232" y="159">B</text><text x="19" y="204">0 → 0.4</text><text x="195" y="204">0 → 0.6</text><text x="17" y="234">Visited</text><text x="177" y="234">Never visited</text></g></svg></g><g class="rc-panel" data-panel="alias"><rect x="12" y="322" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="346">3. Sharing can erase distinctions</text><svg x="24" y="356" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-3-2-f3-alias-title"><title id="canvas-3-2-f3-alias-title">Two true values collapse to one shared prediction</title><defs><marker id="canvas-3-2-f3-alias-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><circle cx="245" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><text x="48" y="52">C</text><text x="238" y="52">D</text><text x="16" y="95">True value 0</text><text x="180" y="95">True value 2</text><path d="M55 108L128 143M245 108L172 143" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-2-f3-alias-arr)"/><text x="65" y="169">Same features (1, 0)</text><path d="M150 178V199" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-2-f3-alias-arr)"/><text x="43" y="226">One prediction: best fit 1</text></g></svg></g><g class="rc-panel" data-panel="semigradient"><rect x="352" y="322" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="346">4. Hold the target still</text><svg x="364" y="356" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-3-f3-sg-title"><title id="canvas-3-3-f3-sg-title">Semi-gradient TD differentiates the prediction but holds its target constant</title><defs><marker id="canvas-3-3-f3-sg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Same weights, two predictions</text><path d="M150 41L66 73M150 41L237 73" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="16" y="101">Current value</text><text x="174" y="101">Next value</text><path d="M235 112V142H165" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="168" y="169" fill="#b44c2c">Target: hold</text><text x="168" y="192" fill="#b44c2c">constant</text><path d="M66 112V187H142" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-3-f3-sg-arr)"/><text x="16" y="224">Differentiate current value only</text></g></svg></g><g class="rc-panel" data-panel="moving"><rect x="12" y="632" width="324" height="286" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="656">5. The target moves next time</text><svg x="24" y="666" height="240" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="canvas-3-4-f3-move-title"><title id="canvas-3-4-f3-move-title">A shared update raises both the current value and its next target</title><defs><marker id="canvas-3-4-f3-move-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Fit A once; shared weights rise</text><text x="16" y="64">A: 0.400 → 0.428</text><text x="16" y="100">B: 0.600 → 0.642</text><path d="M225 110V142H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-4-f3-move-arr)"/><text x="16" y="174">Next target for A = 0.9 × B</text><text x="16" y="210" fill="#b44c2c">0.5400 → 0.5778</text></g></svg></g><g class="rc-panel" data-panel="network"><rect x="352" y="632" width="324" height="296" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="656">6. Networks need steadier targets</text><svg x="364" y="666" height="250" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="canvas-3-5-f3-net-title"><title id="canvas-3-5-f3-net-title">Replay supplies transitions while a separate network supplies targets</title><defs><marker id="canvas-3-5-f3-net-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Saved transitions → sample batch</text><path d="M62 42V66M235 42V66" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="16" y="93">Live network</text><text x="168" y="93">Target copy</text><text x="16" y="123" fill="#b44c2c">Weights move</text><text x="168" y="123">Held still</text><path d="M235 134V162H150" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="114" y="188">Target</text><path d="M111 181H49V135" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><path d="M47 204H250" stroke="#656b62" stroke-dasharray="5 4" stroke-width="2" marker-end="url(#canvas-3-5-f3-net-arr)"/><text x="16" y="237">Periodic copy → refresh target</text></g></svg></g></svg></div></div>
<div class="rc-body">

A sensor reports a position you have never visited. A separate table row has learned nothing there. Can one observation teach nearby states too? Function approximation shares a prediction rule across states. We will calculate one shared update, expose a distinction it cannot represent, then show why a shared successor can move its own training target. [Sutton and Barto, Chapter 9](http://incompleteideas.net/book/RLbook2020.pdf).

**Codex trial · Part 3.** [Previously: bootstrapping](/robotics/rl-2-bootstrapping-codex/).

**Reading goal:** see one example change two states, calculate what the model cannot represent, then watch the next target move after fitting the current one.

<nav class="rc-route" aria-label="Reading route"><a href="#sec-scale" data-go="sec-scale">The table grows</a><a href="#sec-linear" data-go="sec-linear">One update shares learning</a><a href="#sec-alias" data-go="sec-alias">Sharing can erase distinctions</a><a href="#sec-semigradient" data-go="sec-semigradient">Hold the target still</a><a href="#sec-moving" data-go="sec-moving">The target moves next time</a><a href="#sec-network" data-go="sec-network">Networks need steadier targets</a></nav>

<div class="rc-mark" id="sec-scale" data-panel="scale" data-view="scale" data-title="The table grows"></div>

## The table grows

A Q table keeps one number for each state and action. This works on a small grid. For continuous sensor readings, even deciding which observations belong to one row becomes a design choice.

Let $d$ be the number of sensor dimensions, $b$ the number of bins per dimension, and $a$ the number of available actions. Let $N$ count entries in the resulting full Q table; the exponent $b^d$ counts combinations of $d$ binned sensor readings. Here $a$ is an action count, rather than the particular action symbol used in the previous episode:

$$N=a\,b^d.$$

For an illustrative cart-balancing task, four sensors report position, speed, pole angle and angular speed. Six bins per sensor make 1,296 state rows. With two actions, that means 2,592 Q entries. Twelve bins make 20,736 rows and 41,472 entries.

Memory is only part of the problem. A table learns each row separately, so observations must cover those rows. Doubling the resolution along four dimensions multiplies their count by sixteen. A coarse table shares within each bin, but its predictions jump at bin boundaries.

Why approximation helps: a compact rule can reuse one observation across several states rather than wait for each row to receive its own data. This is the generalization problem described in [Sutton and Barto, Part II and Section 9.1](http://incompleteideas.net/book/RLbook2020.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-labelledby="f3-scale-title"><title id="f3-scale-title">Finer sensor bins create more unvisited table rows</title><defs><marker id="f3-scale-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">One sensor slice, two actions</text><g fill="#fff" stroke="#656b62"><path d="M20 48H110V136H20Z M65 48V136 M20 77H110 M20 106H110"/><path d="M190 48H280V136H190Z M235 48V136 M190 62H280 M190 77H280 M190 92H280 M190 106H280 M190 121H280"/></g><path d="M125 92H175" stroke="#656b62" stroke-width="2" marker-end="url(#f3-scale-arr)"/><rect x="20" y="48" width="45" height="29" fill="#d7e5ee"/><rect x="190" y="48" width="45" height="14" fill="#d7e5ee"/><text x="16" y="168">Blue: one visited entry</text><text x="16" y="198">Four finer sensors → 16× rows</text></g></svg><figcaption>Table view. Fixed: two actions and one visit. Resolution increases to the right. Compare how much of the expanded table that visit teaches.</figcaption></figure>

<div class="rc-mark" id="sec-linear" data-panel="linear" data-view="linear" data-title="One update shares learning"></div>

## One update shares learning

A new table row starts empty even when a similar state was just trained. To reuse that example, make both predictions depend on the same adjustable numbers.

Instead of storing a value for every state, store a few **weights**. Let $s$ denote a state, $x(s)$ its fixed vector of numerical features, and $w$ the weight vector of the same length. The superscript $\top$ turns a column vector into a row; $w^\top x(s)$ multiplies corresponding coordinates and adds them. $\hat v(s,w)$ is the approximate state value, with the hat marking an estimate. An assignment arrow replaces the old weights:

$$\hat v(s,w)=w^\top x(s).$$

For two states named A and B, choose features $x(\mathrm A)=(1,1)^\top$ and $x(\mathrm B)=(1,2)^\top$. Start with $w=(0,0)^\top$. Both predictions are zero. Suppose the supplied training target $y$ at A is 2. Let $\alpha=0.1$ be the step size. The linear squared-error update is

$$w\leftarrow w+\alpha[y-\hat v(\mathrm A,w)]x(\mathrm A).$$

The error is 2, so both weights become 0.2. A's prediction becomes 0.4 and B's becomes 0.6, despite receiving no example from B. If B's target is 3, its prediction has moved closer too.

| After training only A once | A: features (1, 1) | B: features (1, 2) |
| --- | ---: | ---: |
| Before | 0 | 0 |
| After | 0.4 | 0.6 |
| Supplied comparison target | 2 | 3 |

Why it works: each weight affects every input using that feature. The update follows the direction that reduces A's squared error locally. Useful transfer to B depends on its features and target. [Sutton and Barto, Sections 9.3–9.4](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Describe the visited state with its feature vector.
Compute target minus prediction.
Add step size × error × features to the weights.
Recompute any state's value with the new weights.
```

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="f3-linear-title"><title id="f3-linear-title">Training A changes predictions at A and unvisited B</title><defs><marker id="f3-linear-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Train A: features (1, 1), target 2</text><text x="16" y="58">Weights: (0, 0) → (0.2, 0.2)</text><path d="M150 75V98M150 98L65 128M150 98L238 128" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-linear-arr)"/><circle cx="65" cy="153" r="30" fill="#d7e5ee" stroke="#242622"/><circle cx="238" cy="153" r="30" fill="#fff" stroke="#242622"/><text x="59" y="159">A</text><text x="232" y="159">B</text><text x="19" y="204">0 → 0.4</text><text x="195" y="204">0 → 0.6</text><text x="17" y="234">Visited</text><text x="177" y="234">Never visited</text></g></svg><figcaption>Parameter view. Fixed: features and supplied targets, A = 2 and B = 3. Weights change after A's example. Compare both predictions before and after that single update.</figcaption></figure>

<div class="rc-mark" id="sec-alias" data-panel="alias" data-view="alias" data-title="Sharing can erase distinctions"></div>

## Sharing can erase distinctions

What if two states need different predictions but receive identical features? More training cannot recover a distinction the representation removed.

Call those states C and D, labels rather than variables. The same $w$ and feature rule from the previous section are used for both. Suppose their true values are 0 and 2, but both feature vectors are $(1,0)^\top$. Let $c$ denote the first weight. Then every possible weight setting gives

$$\hat v(\mathrm C,w)=\hat v(\mathrm D,w)=c.$$

With equally frequent examples and squared error, the best shared prediction is their mean:

$$c=\frac{0+2}{2}=1.$$

Both states retain an error of 1. This is **aliasing**: different states look the same to the value function. Unequal sampling would pull the shared estimate toward the more frequent state's target. [Sutton and Barto, Sections 9.1–9.3](http://incompleteideas.net/book/RLbook2020.pdf).

A coarse sensor bin can produce this failure. Two pole positions may look similar while their angular speeds imply very different futures. A representation that keeps only the angle has discarded the distinction.

```text
Check whether conflicting examples have identical features.
If so, add the missing predictive information.
Refit using features that distinguish the two states.
```

The reason this repair helps is concrete: different feature vectors allow different predictions. More parameters alone help only if the inputs preserve the relevant information.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="f3-alias-title"><title id="f3-alias-title">Two true values collapse to one shared prediction</title><defs><marker id="f3-alias-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="55" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><circle cx="245" cy="46" r="27" fill="#d7e5ee" stroke="#242622"/><text x="48" y="52">C</text><text x="238" y="52">D</text><text x="16" y="95">True value 0</text><text x="180" y="95">True value 2</text><path d="M55 108L128 143M245 108L172 143" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-alias-arr)"/><text x="65" y="169">Same features (1, 0)</text><path d="M150 178V199" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-alias-arr)"/><text x="43" y="226">One prediction: best fit 1</text></g></svg><figcaption>Representation view. Fixed: true values 0 and 2, sampled equally. Both inputs collapse to the same features. Compare the two required answers with the single available prediction.</figcaption></figure>

<div class="rc-mark" id="sec-semigradient" data-panel="semigradient" data-view="semigradient" data-title="Hold the target still"></div>

## Hold the target still

Suppose the model predicts 0.4 here and 0.6 at the successor. With reward 0 and discount 0.9, the current target is 0.54. Fitting 0.4 toward 0.54 is straightforward; differentiating through the calculation that produced 0.54 is a different update. Semi-gradient TD holds that target number fixed for this derivative.

Let $t$ count transitions, $S_t$ be the current state and $R_{t+1}$ the reward after action $A_t$. Let $w_t$ be the current weights and $\gamma$ the discount, between 0 and 1. Define the one-step target $y_t$ using those weights, with terminal value zero:

$$y_t=R_{t+1}+\gamma\hat v(S_{t+1},w_t).$$

During this update, treat $y_t$ as a fixed number. Let $L_t(w)$ be the squared error against that number, and let $\nabla_w$ mean the vector of derivatives with respect to weights:

$$L_t(w)=\tfrac12[y_t-\hat v(S_t,w)]^2.$$

Let $w_{t+1}$ be the weights after this transition and keep $\alpha$ as the step size. Writing $\delta_t=y_t-\hat v(S_t,w_t)$ for the TD error, the update is

$$w_{t+1}=w_t+\alpha\delta_t\nabla_w\hat v(S_t,w_t).$$

For linear features the gradient is $x(S_t)$. This is **semi-gradient TD**: differentiate through the prediction being fitted, while ignoring the target's dependence on the weights. [Sutton and Barto, Sections 9.3–9.4](http://incompleteideas.net/book/RLbook2020.pdf).

```text
Compute the target with the current weights.
Detach that number from differentiation.
Differentiate the current state's prediction.
Update weights; recompute the next target next time.
```

Why this step is useful: it moves the current prediction toward its present target. That local fitting direction is distinct from minimizing a fixed loss across training, because later targets are recomputed.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="f3-sg-title"><title id="f3-sg-title">Semi-gradient TD differentiates the prediction but holds its target constant</title><defs><marker id="f3-sg-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Same weights, two predictions</text><path d="M150 41L66 73M150 41L237 73" stroke="#656b62" stroke-width="2" marker-end="url(#f3-sg-arr)"/><text x="16" y="101">Current value</text><text x="174" y="101">Next value</text><path d="M235 112V142H165" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#f3-sg-arr)"/><text x="168" y="169" fill="#b44c2c">Target: hold</text><text x="168" y="192" fill="#b44c2c">constant</text><path d="M66 112V187H142" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#f3-sg-arr)"/><text x="16" y="224">Differentiate current value only</text></g></svg><figcaption>Computation view. Fixed during differentiation: the calculated target. Weights change through the current prediction's derivative. Follow both branches to see which derivative is kept.</figcaption></figure>

<div class="rc-mark" id="sec-moving" data-panel="moving" data-view="moving" data-title="The target moves next time"></div>

## The target moves next time

Holding the target constant during differentiation does not freeze future targets. Shared weights change both sides of the next TD error.

Use A and B's earlier features, weights $(0.2,0.2)^\top$, and a transition from A to B. Set reward to zero, discount to 0.9 and step size to 0.1. Before updating, A's prediction is 0.4 and B's is 0.6. The target is 0.54, so the TD error is 0.14. Here $w_{t+1}$ is the updated weight vector; $y_{t+1}$ below means the target on the next replay of this same stored transition:

$$w_{t+1}=(0.2,0.2)^\top+0.1(0.14)(1,1)^\top
=(0.214,0.214)^\top.$$

Afterward, A predicts 0.428 and B predicts 0.642. If we train on that same transition again, the next target becomes

$$y_{t+1}=0+0.9(0.642)=0.5778.$$

| Same replayed A → B transition | Before | After one update |
| --- | ---: | ---: |
| Prediction at A | 0.4 | 0.428 |
| Prediction at B | 0.6 | 0.642 |
| Target from B | 0.54 | 0.5778 |

The target moved from 0.54 to 0.5778 because the update also raised B's value. In a table, updating A would leave B's separate entry unchanged.

```text
Fit the current target once.
Recompute the successor's prediction.
Compare the new target with the previous target.
```

This arithmetic shows coupling, rather than proving divergence. Linear TD prediction has convergence results for a fixed policy with on-policy sampling and appropriate technical conditions. Other sampling distributions can break that stability. [Sutton and Barto, Sections 9.4 and 11.2](http://incompleteideas.net/book/RLbook2020.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 240" role="img" aria-labelledby="f3-move-title"><title id="f3-move-title">A shared update raises both the current value and its next target</title><defs><marker id="f3-move-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b44c2c"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Fit A once; shared weights rise</text><text x="16" y="64">A: 0.400 → 0.428</text><text x="16" y="100">B: 0.600 → 0.642</text><path d="M225 110V142H42" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-move-arr)"/><text x="16" y="174">Next target for A = 0.9 × B</text><text x="16" y="210" fill="#b44c2c">0.5400 → 0.5778</text></g></svg><figcaption>Repeated-transition view. Fixed: A to B, reward 0 and discount 0.9. One weight update changes both predictions. Compare the target before and after recomputing B.</figcaption></figure>

<div class="rc-mark" id="sec-network" data-panel="network" data-view="network" data-title="Networks need steadier targets"></div>

## Networks need steadier targets

Hand-designed features limit what a linear predictor can express. A neural network learns intermediate features as well as output weights. It still shares parameters across inputs, so it inherits the same coupling problem.

For action values, let $Q_\theta(s,a)$ be the network's estimate after action $a$ in state $s$, with learned parameters $\theta$. Let $\bar\theta$ denote a separate target-network copy, held fixed between scheduled refreshes; $a'$ ranges over actions at the next state. The symbol $\max_{a'}$ takes the largest prediction over those candidate actions. $R_{t+1}$ and $S_{t+1}$ are the observed reward and successor. DQN builds target $z_t$ as

$$z_t=R_{t+1}+\gamma\max_{a'}Q_{\bar\theta}(S_{t+1},a').$$

At termination use only the reward. The max means the largest next-action estimate. The learned network fits that number while the target copy stays still.

```text
Save transitions in replay memory.
Sample a batch of saved transitions.
Build targets with the frozen copy; fit the live network.
Periodically copy the live parameters to the target copy.
```

Why these changes help: replay reuses observations and breaks up consecutive samples; the separate copy slows changes in the guessed tail. These are the mechanisms used by [Mnih et al., DQN, 2015](https://web.stanford.edu/class/psych209/Readings/MnihEtAlHassibis15NatureControlDeepRL.pdf).

**Sharing buys:**

- **Compact storage.** Parameters replace separate entries for every possible input.
- **Transfer.** One example can improve predictions at related states.
- **Flexible features.** Networks can learn useful representations from observations.

**Costs and conditions:**

- **Representation error.** Identical features force identical predictions.
- **Interference.** An update can worsen predictions elsewhere.
- **Stability.** Replay and target copies help training; they provide no general convergence guarantee for neural Q-learning.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 250" role="img" aria-labelledby="f3-net-title"><title id="f3-net-title">Replay supplies transitions while a separate network supplies targets</title><defs><marker id="f3-net-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#656b62"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="16" y="27">Saved transitions → sample batch</text><path d="M62 42V66M235 42V66" stroke="#656b62" stroke-width="2" marker-end="url(#f3-net-arr)"/><text x="16" y="93">Live network</text><text x="168" y="93">Target copy</text><text x="16" y="123" fill="#b44c2c">Weights move</text><text x="168" y="123">Held still</text><path d="M235 134V162H150" fill="none" stroke="#656b62" stroke-width="2" marker-end="url(#f3-net-arr)"/><text x="114" y="188">Target</text><path d="M111 181H49V135" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#f3-net-arr)"/><path d="M47 204H250" stroke="#656b62" stroke-dasharray="5 4" stroke-width="2" marker-end="url(#f3-net-arr)"/><text x="16" y="237">Periodic copy → refresh target</text></g></svg><figcaption>Training view. Fixed between refreshes: target-copy weights. The live network changes from replayed transitions. Compare the fitting arrow with the occasional copy arrow.</figcaption></figure>

Which policy produced those transitions, and which policy does their target evaluate? [Part 4: on-policy and off-policy learning](/robotics/rl-4-on-policy-and-off-policy-codex/) explains that distinction. [Part 5](/robotics/rl-5-the-deadly-triad-codex/) returns to the stability problem.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
