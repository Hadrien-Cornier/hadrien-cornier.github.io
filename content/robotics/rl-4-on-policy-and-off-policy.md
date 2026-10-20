---
title: 'On-policy and off-policy: whose future are we learning?'
description: 'One row, three targets: exploration costs, coverage and what importance weighting corrects.'
date: '2026-10-19'
draft: false
series: 'Reinforcement learning'
part: 4
layout: essay
tags: ['reinforcement-learning', 'machine-learning']
thumbnail: '/assets/robotics/rl/rl-4-on-policy-and-off-policy-whole.svg'
thumbnail_alt: 'rl-4-on-policy-and-off-policy'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">
<div class="rc rls-canvas" id="rc">
<div class="rc-stage"><div class="rc-bar"><button class="rc-reset" type="button">Whole canvas &#8689;</button><div class="rc-where" aria-live="polite"></div></div><div class="rc-view"><svg class="rc-svg" viewBox="0 0 680 864" data-whole="0 0 680 864" data-views='{"policies":[24,46,300,220],"targets":[364,46,300,220],"cliff":[24,326,300,220],"coverage":[364,326,300,220],"weighting":[24,606,300,220],"guarantees":[364,606,300,220]}' role="img" aria-label="Whole mechanism map: On-policy and off-policy: whose future are we learning?"><g class="rc-panel" data-panel="policies"><rect x="12" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="36">1. Two policies, one task</text><svg x="24" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Behavior produces a transition; target policy specifies the continuation used to value it"><defs><marker id="canvas-4-0-p4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="40" cy="65" r="23" fill="#d7e5ee" stroke="#242622"/><text x="40" y="71" text-anchor="middle">s</text><path d="M65 65H171" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-0-p4a)"/><text x="110" y="43" text-anchor="middle">b picks a</text><circle cx="200" cy="65" r="23" fill="#d7e5ee" stroke="#242622"/><text x="200" y="71" text-anchor="middle">s′</text><path d="M216 85Q256 115 265 148" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-4-0-p4a)"/><text x="158" y="119">π values</text><text x="158" y="140">the future</text><path d="M246 168H61Q40 168 40 94" fill="none" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-0-p4a)"/><text x="145" y="195" text-anchor="middle">credit returns to (s, a)</text></g></svg></g><g class="rc-panel" data-panel="targets"><rect x="352" y="12" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="36">2. One row, three targets</text><svg x="364" y="46" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="The same action row feeds a maximum, one sample, or a weighted average"><defs><marker id="canvas-4-1-p4b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><rect x="25" y="12" width="250" height="54" fill="#d7e5ee" stroke="#242622"/><path d="M150 12V66" stroke="#242622"/><text x="86" y="35" text-anchor="middle">right: 10</text><text x="213" y="35" text-anchor="middle">down: −10</text><text x="86" y="57" text-anchor="middle">b = 0.9</text><text x="213" y="57" text-anchor="middle">b = 0.1</text><path d="M80 69L44 112M150 69V112M220 69L255 112" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-1-p4b)"/><text x="45" y="140" text-anchor="middle">max</text><text x="150" y="140" text-anchor="middle">sample</text><text x="252" y="140" text-anchor="middle">average</text><text x="45" y="169" text-anchor="middle">10</text><text x="150" y="169" text-anchor="middle">−10*</text><text x="252" y="169" text-anchor="middle">8</text><text x="150" y="205" text-anchor="middle">*a sampled down action</text></g></svg></g><g class="rc-panel" data-panel="cliff"><rect x="12" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="316">3. Exploration has a cost</text><svg x="24" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="A short edge route exposes exploratory downward actions to a cliff; an upper detour leaves a recovery cell"><defs><marker id="canvas-4-2-p4c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><path d="M24 40H276V166H24Z M24 82H276 M24 124H276 M66 40V166 M108 40V166 M150 40V166 M192 40V166 M234 40V166" fill="none" stroke="#777"/><path d="M66 124H234V166H66Z" fill="#b44c2c" opacity=".25"/><text x="150" y="151" text-anchor="middle">cliff</text><text x="45" y="151" text-anchor="middle">S</text><text x="255" y="151" text-anchor="middle">G</text><path d="M45 130V103H255V127" fill="none" stroke="#b44c2c" stroke-width="3" marker-end="url(#canvas-4-2-p4c)"/><path d="M45 126V61H255V126" fill="none" stroke="#2b6a8e" stroke-width="3" marker-end="url(#canvas-4-2-p4c)"/><path d="M150 99V134" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-4-2-p4c)"/><path d="M109 58V93" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-2-p4c)"/><text x="150" y="25" text-anchor="middle">downward exploration</text><text x="150" y="201" text-anchor="middle">detour leaves recovery room</text></g></svg></g><g class="rc-panel" data-panel="coverage"><rect x="352" y="292" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="316">4. Data must cover the question</text><svg x="364" y="326" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Data cover one branch but omit a target-policy bridge and all states reached through it"><defs><marker id="canvas-4-3-p4d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="52" cy="108" r="24" fill="#d7e5ee" stroke="#242622"/><text x="52" y="115" text-anchor="middle">s</text><path d="M72 94L177 48" stroke="#2b6a8e" stroke-width="3" marker-end="url(#canvas-4-3-p4d)"/><path d="M73 123L177 172" stroke="#b44c2c" stroke-width="2" stroke-dasharray="6 5" marker-end="url(#canvas-4-3-p4d)"/><circle cx="212" cy="40" r="25" fill="#d7e5ee" stroke="#242622"/><circle cx="212" cy="180" r="25" fill="#fff" stroke="#b44c2c"/><text x="212" y="46" text-anchor="middle">seen</text><text x="212" y="186" text-anchor="middle">?</text><text x="128" y="25" text-anchor="middle">b takes this</text><text x="155" y="126" text-anchor="middle">π needs bridge</text><path d="M125 141L145 164M145 141L125 164" stroke="#b44c2c" stroke-width="3"/><text x="126" y="210" text-anchor="middle">zero data for this branch</text></g></svg></g><g class="rc-panel" data-panel="weighting"><rect x="12" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="24" y="596">5. Correcting action probabilities</text><svg x="24" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Equal behavior action probabilities become target weights point eight and point two after multiplying by ratios"><defs><marker id="canvas-4-4-p4e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="25" text-anchor="middle">b samples each action: 0.5</text><path d="M150 38L75 77M150 38L225 77" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-4-p4e)"/><text x="75" y="103" text-anchor="middle">right</text><text x="225" y="103" text-anchor="middle">down</text><path d="M75 112V152M225 112V152" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-4-p4e)"/><text x="75" y="141" text-anchor="middle">× 1.6</text><text x="225" y="141" text-anchor="middle">× 0.4</text><text x="75" y="179" text-anchor="middle">weight 0.8</text><text x="225" y="179" text-anchor="middle">weight 0.2</text><text x="150" y="209" text-anchor="middle">target action proportions</text></g></svg></g><g class="rc-panel" data-panel="guarantees"><rect x="352" y="572" width="324" height="266" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text class="rls-panel-title" x="364" y="596">6. Which guarantees survive?</text><svg x="364" y="606" height="220" xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="A shared parameter changes both the current prediction and the next-state prediction used as a target"><defs><marker id="canvas-4-5-p4f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="150" cy="42" r="27" fill="#d7e5ee" stroke="#242622"/><text x="150" y="48" text-anchor="middle">w</text><path d="M132 64L71 105M168 64L229 105" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#canvas-4-5-p4f)"/><text x="68" y="132" text-anchor="middle">value(s)</text><text x="232" y="132" text-anchor="middle">value(s′)</text><path d="M230 145Q150 204 75 148" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#canvas-4-5-p4f)"/><text x="150" y="187" text-anchor="middle">changes the target</text><path d="M43 113Q17 41 113 42" fill="none" stroke="#2b6a8e" stroke-width="2" marker-end="url(#canvas-4-5-p4f)"/><text x="150" y="216" text-anchor="middle">one update can move both</text></g></svg></g></svg></div></div>
<div class="rc-body">

Your favorite route runs beside a cliff, but one random move while exploring can still make you fall. Should the route's value include those random moves? Let's keep one next-state row fixed and calculate three answers. This distinction follows [Sutton and Barto, §§5.5 and 6.4–6.6](http://incompleteideas.net/book/RLbook2020.pdf).

**Part 4.** A value estimate gives credit to earlier actions for rewards that arrive later. But which later actions does it assume? That choice separates on-policy from off-policy learning. We can see the difference without changing the task, the rewards or the table.

**Reading goal:** keep the next-state row fixed and change only the policy assumed for the future. The resulting targets are 8, a sampled 8 or −10, and an average of 6.2.

<nav class="rc-route" aria-label="Reading route"><a href="#sec-two-policies" data-go="sec-two-policies">Two policies, one task</a><a href="#sec-three-targets" data-go="sec-three-targets">One row, three targets</a><a href="#sec-cliff-risk" data-go="sec-cliff-risk">Exploration has a cost</a><a href="#sec-coverage" data-go="sec-coverage">Data must cover the question</a><a href="#sec-action-correction" data-go="sec-action-correction">Correcting action probabilities</a><a href="#sec-guarantees" data-go="sec-guarantees">Which guarantees survive?</a></nav>

<div class="rc-mark" id="sec-two-policies" data-panel="policies" data-view="policies" data-title="Two policies, one task"></div>

## Two policies, one task

Suppose you want the shortest route to a goal, and you occasionally try a random move to discover better routes. The rule collecting those moves is the **behavior policy**, written $b$. The rule whose future you want to value is the **target policy**, written $\pi$. A vertical bar means “given this state.” Both give action probabilities in a state: $b(a\mid s)$ and $\pi(a\mid s)$, for action $a$ in state $s$.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Behavior produces a transition; target policy specifies the continuation used to value it"><defs><marker id="p4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="40" cy="65" r="23" fill="#d7e5ee" stroke="#242622"/><text x="40" y="71" text-anchor="middle">s</text><path d="M65 65H171" stroke="#2b6a8e" stroke-width="2" marker-end="url(#p4a)"/><text x="110" y="43" text-anchor="middle">b picks a</text><circle cx="200" cy="65" r="23" fill="#d7e5ee" stroke="#242622"/><text x="200" y="71" text-anchor="middle">s′</text><path d="M216 85Q256 115 265 148" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p4a)"/><text x="158" y="119">π values</text><text x="158" y="140">the future</text><path d="M246 168H61Q40 168 40 94" fill="none" stroke="#2b6a8e" stroke-width="2" marker-end="url(#p4a)"/><text x="145" y="195" text-anchor="middle">credit returns to (s, a)</text></g></svg><figcaption>Decision view. Fixed: task and transition. Change: the policy assumed after arrival. Follow data forward and credit backward.</figcaption></figure>

| At one illustrative state | Right | Down |
| --- | ---: | ---: |
| Behavior $b$: collects moves | 0.9 | 0.1 |
| Target $\pi$: greedy continuation | 1 | 0 |

So a down move can appear in the data even though we're valuing a future that always chooses right. In the next section, we'll keep this row and work through the numbers.

Learning is **on-policy** when the target and behavior rules match, and **off-policy** when they differ. Q-learning can learn from each move as it happens and still be off-policy. The exploratory rule chooses the move, but the target assumes greedy actions from then on. The data don't have to be old.

Keeping the rules separate is useful when you explore to collect information but want to estimate values for a different behavior you plan to use later. For that to work, the data you collect must support the future you're asking about. [Sutton and Barto, §5.5](http://incompleteideas.net/book/RLbook2020.pdf).

<div class="rc-mark" id="sec-three-targets" data-panel="targets" data-view="targets" data-title="One row, three targets"></div>

## One row, three targets

Should the backup use the best next move, the move actually sampled, or an average over the policy? Let's keep the estimates fixed so we can isolate that choice.

At step $t$, you take action $A_t$ in state $S_t$, receive reward $R_{t+1}$ and arrive at $S_{t+1}$. Let $Q(s,a)$ estimate the discounted return after taking action $a$ in state $s$. We'll write the discount as $\gamma$, the positive learning rate as $\alpha$ and the target as $Y_t$. The arrow means we replace the value on the left:

$$Q(S_t,A_t)\leftarrow Q(S_t,A_t)+\alpha\bigl[Y_t-Q(S_t,A_t)\bigr].$$

Now hold the next-state row fixed. Two actions, right and down, have estimates $10$ and $-10$. The behavior chooses them with probabilities $0.9$ and $0.1$. Set $\gamma=0.9$ and the observed reward to $-1$. These are illustrative calculations.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="The same action row feeds a maximum, one sample, or a weighted average"><defs><marker id="p4b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><rect x="25" y="12" width="250" height="54" fill="#d7e5ee" stroke="#242622"/><path d="M150 12V66" stroke="#242622"/><text x="86" y="35" text-anchor="middle">right: 10</text><text x="213" y="35" text-anchor="middle">down: −10</text><text x="86" y="57" text-anchor="middle">b = 0.9</text><text x="213" y="57" text-anchor="middle">b = 0.1</text><path d="M80 69L44 112M150 69V112M220 69L255 112" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#p4b)"/><text x="45" y="140" text-anchor="middle">max</text><text x="150" y="140" text-anchor="middle">sample</text><text x="252" y="140" text-anchor="middle">average</text><text x="45" y="169" text-anchor="middle">10</text><text x="150" y="169" text-anchor="middle">−10*</text><text x="252" y="169" text-anchor="middle">8</text><text x="150" y="205" text-anchor="middle">*a sampled down action</text></g></svg><figcaption>Backup view. Fixed: row, reward and discount. Change: how the next action enters the target. Compare the three reductions of one row.</figcaption></figure>

Define $a'$ as a candidate next action. For Sarsa, $A_{t+1}$ is the action actually sampled from the same behavior used in its target. The superscripts Q, Sarsa and Expected name the method producing $Y_t$; they are labels, not powers. $\max$ takes the largest next-action estimate and $\sum$ adds the policy-weighted estimates. The three targets are:

$$\begin{aligned}
Y_t^{\mathrm{Q}}&=R_{t+1}+\gamma\max_{a'}Q(S_{t+1},a')=8,\\
Y_t^{\mathrm{Sarsa}}&=R_{t+1}+\gamma Q(S_{t+1},A_{t+1}),\\
Y_t^{\mathrm{Expected}}&=R_{t+1}+\gamma\sum_{a'}\pi(a'\mid S_{t+1})Q(S_{t+1},a').
\end{aligned}$$

Sarsa's target is $8$ after right or $-10$ after down. Expected Sarsa with $\pi=b$ uses $-1+0.9[0.9(10)+0.1(-10)]=6.2$. It removes next-action sampling noise by averaging that action exactly; transition and reward randomness can remain. Expected Sarsa is off-policy when its chosen $\pi$ differs from $b$. A greedy target makes it Q-learning. [§§6.4–6.6](http://incompleteideas.net/book/RLbook2020.pdf).

<div class="rc-mark" id="sec-cliff-risk" data-panel="cliff" data-view="cliff" data-title="Exploration has a cost"></div>

## Exploration has a cost

The shortest route can run beside a cliff. With perfectly greedy execution, staying on that route is fine. With continuing exploration, a random downward action can cause a fall, even after the preferred action is well learned.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="A short edge route exposes exploratory downward actions to a cliff; an upper detour leaves a recovery cell"><defs><marker id="p4c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><path d="M24 40H276V166H24Z M24 82H276 M24 124H276 M66 40V166 M108 40V166 M150 40V166 M192 40V166 M234 40V166" fill="none" stroke="#777"/><path d="M66 124H234V166H66Z" fill="#b44c2c" opacity=".25"/><text x="150" y="151" text-anchor="middle">cliff</text><text x="45" y="151" text-anchor="middle">S</text><text x="255" y="151" text-anchor="middle">G</text><path d="M45 130V103H255V127" fill="none" stroke="#b44c2c" stroke-width="3" marker-end="url(#p4c)"/><path d="M45 126V61H255V126" fill="none" stroke="#2b6a8e" stroke-width="3" marker-end="url(#p4c)"/><path d="M150 99V134" stroke="#b44c2c" stroke-width="2" marker-end="url(#p4c)"/><path d="M109 58V93" stroke="#2b6a8e" stroke-width="2" marker-end="url(#p4c)"/><text x="150" y="25" text-anchor="middle">downward exploration</text><text x="150" y="201" text-anchor="middle">detour leaves recovery room</text></g></svg><figcaption>Top view. Fixed: cliff and goal. Change: route and occasional downward move. Compare a fall beside the edge with recovery above it.</figcaption></figure>

Q-learning's greedy continuation target values a future without those exploratory deviations. On-policy Sarsa includes them in the behavior it evaluates. So it can prefer a longer route that leaves room to recover. The book's cliff example illustrates this mechanism with persistent exploration. A particular finite run also depends on initialization, visits and learning rate. [Example 6.6](http://incompleteideas.net/book/RLbook2020.pdf).

Neither target supplies a physical safety guarantee. Sarsa learns an expected return for its policy, which may still choose dangerous actions. Changing the exploration rule changes that return. Gradually removing exploration changes the comparison again: the book's asymptotic optimality discussion assumes the required exploration and learning-rate conditions.

<div class="rc-mark" id="sec-coverage" data-panel="coverage" data-view="coverage" data-title="Data must cover the question"></div>

## Data must cover the question

Suppose a stored dataset never takes a bridge that the target policy would use. Replaying the other transitions more often won't reveal where the bridge leads. For action correction, the **coverage** requirement is that a target action with positive probability also has positive behavior probability.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Data cover one branch but omit a target-policy bridge and all states reached through it"><defs><marker id="p4d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="52" cy="108" r="24" fill="#d7e5ee" stroke="#242622"/><text x="52" y="115" text-anchor="middle">s</text><path d="M72 94L177 48" stroke="#2b6a8e" stroke-width="3" marker-end="url(#p4d)"/><path d="M73 123L177 172" stroke="#b44c2c" stroke-width="2" stroke-dasharray="6 5" marker-end="url(#p4d)"/><circle cx="212" cy="40" r="25" fill="#d7e5ee" stroke="#242622"/><circle cx="212" cy="180" r="25" fill="#fff" stroke="#b44c2c"/><text x="212" y="46" text-anchor="middle">seen</text><text x="212" y="186" text-anchor="middle">?</text><text x="128" y="25" text-anchor="middle">b takes this</text><text x="155" y="126" text-anchor="middle">π needs bridge</text><path d="M125 141L145 164M145 141L125 164" stroke="#b44c2c" stroke-width="3"/><text x="126" y="210" text-anchor="middle">zero data for this branch</text></g></svg><figcaption>Transition view. Fixed: two possible branches. Change: which branch enters the data. The missing branch leaves its destination unsupported.</figcaption></figure>

For a visited state $s$ and candidate action $a$, that requirement is $\pi(a\mid s)>0\;\Longrightarrow\;b(a\mid s)>0$. The implication arrow means every action the target might take must be possible under behavior too. Action coverage at a visited state is only part of the problem. The relevant states must also appear in the updates. A buffer can omit them or sample them very unevenly. That distinction matters when a shared formula changes predictions outside the sampled states.

**Designed for:** off-policy methods let the policy being evaluated differ from the data collector, including a past policy or another controller. **Cost:** that freedom makes coverage and sampling distribution part of the learning problem. Age alone tells you neither whether data are off-policy nor whether they are useful. [§5.5](http://incompleteideas.net/book/RLbook2020.pdf).

<div class="rc-mark" id="sec-action-correction" data-panel="weighting" data-view="weighting" data-title="Correcting action probabilities"></div>

## Correcting action probabilities

Suppose the data choose right and down equally, but the target chooses right four times as often as down. An unweighted average answers the wrong policy question. Importance weights correct each action's contribution to the average.

At one fixed state $s$, let $A$ be an action sampled from $b$. Let $f(s,a)$ be any fixed quantity attached to action $a$, and let $\rho(a\mid s)=\pi(a\mid s)/b(a\mid s)$ be its **importance ratio**, where the denominator is positive for target actions. The symbols $\mathbb E$ and $\sum$ mean expectation and sum over actions; $A\sim b$ means sampling $A$ from behavior at this fixed state.

$$\mathbb E_{A\sim b}[\rho(A\mid s)f(s,A)]=\sum_a\pi(a\mid s)f(s,a).$$

The reason is cancellation: multiplying behavior probability by the ratio leaves target probability.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="Equal behavior action probabilities become target weights point eight and point two after multiplying by ratios"><defs><marker id="p4e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><text x="150" y="25" text-anchor="middle">b samples each action: 0.5</text><path d="M150 38L75 77M150 38L225 77" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#p4e)"/><text x="75" y="103" text-anchor="middle">right</text><text x="225" y="103" text-anchor="middle">down</text><path d="M75 112V152M225 112V152" stroke="#2b6a8e" stroke-width="2" marker-end="url(#p4e)"/><text x="75" y="141" text-anchor="middle">× 1.6</text><text x="225" y="141" text-anchor="middle">× 0.4</text><text x="75" y="179" text-anchor="middle">weight 0.8</text><text x="225" y="179" text-anchor="middle">weight 0.2</text><text x="150" y="209" text-anchor="middle">target action proportions</text></g></svg><figcaption>Probability view. Fixed: state and action quantities. Change: contribution of each sampled action. Compare equal sampling with unequal target weights.</figcaption></figure>

For an illustrative calculation, take behavior probabilities $(0.5,0.5)$, target probabilities $(0.8,0.2)$ and quantities $(10,-10)$. The ratios are $1.6$ and $0.4$. Then $0.5(1.6)(10)+0.5(0.4)(-10)=6$, matching $0.8(10)+0.2(-10)$.

| Action | Behavior | Target | Ratio | Quantity | Weighted contribution |
| --- | ---: | ---: | ---: | ---: | ---: |
| Right | 0.5 | 0.8 | 1.6 | 10 | 8 |
| Down | 0.5 | 0.2 | 0.4 | −10 | −2 |

Add the last column to recover 6. Each contribution is behavior probability × ratio × quantity; it is not a new transition or reward.

This is a conditional, one-step action identity. Correcting a whole multi-step return needs the appropriate sequence of ratios, coverage and variance control. Rare behavior actions can receive huge weights. The arithmetic doesn't repair an omitted state or establish convergence for a nonlinear bootstrap learner. [§5.5](http://incompleteideas.net/book/RLbook2020.pdf).

<div class="rc-mark" id="sec-guarantees" data-panel="guarantees" data-view="guarantees" data-title="Which guarantees survive?"></div>

## Which guarantees survive?

In the drawing, $w$ is a vector of shared model weights. On-policy sampling fixes one distribution mismatch. The familiar convergence result is more specific: fixed-policy prediction with fixed linear features, suitable visits and diminishing learning rates. A changing control policy and a nonlinear network need their own analysis. [Tsitsiklis and Van Roy, 1997](https://web.mit.edu/~jnt/www/Papers/J063-97-bvr-td.pdf).

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" width="300" viewBox="0 0 300 220" role="img" aria-label="A shared parameter changes both the current prediction and the next-state prediction used as a target"><defs><marker id="p4f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="2"/></marker></defs><g font-family="Arial,sans-serif" font-size="18" fill="#242622"><circle cx="150" cy="42" r="27" fill="#d7e5ee" stroke="#242622"/><text x="150" y="48" text-anchor="middle">w</text><path d="M132 64L71 105M168 64L229 105" fill="none" stroke="#242622" stroke-width="2" marker-end="url(#p4f)"/><text x="68" y="132" text-anchor="middle">value(s)</text><text x="232" y="132" text-anchor="middle">value(s′)</text><path d="M230 145Q150 204 75 148" fill="none" stroke="#b44c2c" stroke-width="2" marker-end="url(#p4f)"/><text x="150" y="187" text-anchor="middle">changes the target</text><path d="M43 113Q17 41 113 42" fill="none" stroke="#2b6a8e" stroke-width="2" marker-end="url(#p4f)"/><text x="150" y="216" text-anchor="middle">one update can move both</text></g></svg><figcaption>Parameter view. Fixed: two inputs. Change: shared weights and both predictions. Follow the target feedback that matching action policies alone leaves in place.</figcaption></figure>

| Method | Continuation in the target | Primary source |
| --- | --- | --- |
| Q-learning | Largest next-action estimate | [§6.5](http://incompleteideas.net/book/RLbook2020.pdf) |
| Sarsa | One action sampled from its policy | [§6.4](http://incompleteideas.net/book/RLbook2020.pdf) |
| Expected Sarsa | Average under the chosen target policy | [§6.6](http://incompleteideas.net/book/RLbook2020.pdf) |

A short Expected Sarsa loop makes the policy choice explicit. As above, $S_t,A_t,R_{t+1}$ are the current state, sampled action and following reward; $Y_t$ is the target, $\alpha$ the update fraction, $b$ collects actions and $\pi$ weights their continuation. In the code, `gamma`, `alpha` and `pi` spell those same symbols:

```text
choose A_t using behavior b at S_t
observe R_(t+1), S_(t+1), terminal
if terminal: Y_t = R_(t+1)
else: Y_t = R_(t+1) + gamma * sum_a pi(a|S_(t+1)) Q(S_(t+1),a)
move Q(S_t,A_t) a fraction alpha toward Y_t
```

Here `terminal` means the episode ended, so there is no remaining value to bootstrap.

- **On-policy benefit:** the target includes the behavior's exploratory costs.
- **Off-policy benefit:** collection and the policy being learned about can differ.
- **Coverage cost:** missing actions or states leave parts of the question unsupported.
- **Approximation limit:** shared predictions can feed changes back into their own targets.

### From action credit to a policy update

How do we turn those values into a better action rule? [Generalized Advantage Estimation (GAE)](/robotics/rl-2-bootstrapping/#sec-gae) estimates whether an action did better or worse than the policy's state-value baseline, using a mixture of return lengths. **Proximal Policy Optimization (PPO)** can use that credit to train the policy. Its clipped objective limits the incentive to change an action's probability too far relative to the policy that collected the rollout. Clipping does not impose a hard bound on the policy step. GAE supplies action credit; PPO clipping shapes the update incentive. [Spinning Up's PPO explanation](https://spinningup.openai.com/en/latest/algorithms/ppo.html).

[Part 5: the deadly triad](/robotics/rl-5-the-deadly-triad/) follows that feedback all the way to a growing number.

</div>
</div>
<script src="/assets/robotics/rl/canvas.js" defer></script>
