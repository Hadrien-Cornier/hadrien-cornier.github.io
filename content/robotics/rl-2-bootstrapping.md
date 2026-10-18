---
title: 'Bootstrapping: learning from your own guess'
description: 'Why reinforcement learning learns from its own estimates, how that carries a reward from the end of a task back to the start, and what that guess costs.'
date: '2026-10-17'
draft: true
series: 'Reinforcement learning, one idea at a time'
part: 2
layout: essay
---

Imagine you are training a robot to fold a shirt, and all you get is one yes or no at the very end. Which of its two hundred movements deserves the credit? That is the credit assignment problem, and bootstrapping is one answer to it. Below, two robots on a cliff walk learn in different ways. One guesses the future as it goes, and the other waits for each walk to end.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-q-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-q-202-desktop.mp4"></video><figcaption><b>A robot that guesses the future: it learns the path along the cliff</b>The first walk (several falls), a late walk, then the final test with no random moves. The arrows show the robot's favorite move in each cell. Every step costs 1 and a fall costs 100. Simulation, real recorded run.</figcaption></figure>
<figure class="tri-clip"><video class="tri-video" data-clip="cliff-mc-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cliff-mc-202-desktop.mp4"></video><figcaption><b>A robot that waits for the end of each walk: after the same practice, it has not learned the path</b>The same world and the same number of steps. The first walk, a late walk, then the final test, sped up: the robot stays at the start and the walk ends at the step limit. Simulation, real recorded run.</figcaption></figure>
</div>

Both robots practiced for the same 10,000 steps. The clips are recorded runs of [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/), a small game I made. They show the two styles and don't explain why one did better.

## The problem: credit that arrives late

To judge any of those movements you need a **value** $V(s)$ for every situation $s$ the robot can be in:

$$V(s) = \mathbb{E}\bigl[\, r_t + \gamma\, r_{t+1} + \gamma^2\, r_{t+2} + \cdots \,\big|\, s_t = s \,\bigr]$$

In words, it's the reward you expect to collect from now on, with later rewards counted a little less. Here $r_t$ is the reward at step $t$, $\gamma$ (gamma) is a number just below 1 that does the discounting, and $\mathbb{E}$ means the average over everything that could happen. In the shirt task, all two hundred values have to come from the one yes or no at the end.

## First answer: wait for the end

The direct method is to wait. Finish the fold, then give every situation you visited the real **return**, the discounted sum of the rewards that followed it:

$$G_t = r_t + \gamma\, r_{t+1} + \cdots + \gamma^{T-t-1}\, r_{T-1}$$

Then move each estimate a small step toward its own return:

$$V(s_t) \leftarrow V(s_t) + \alpha\,\bigl(G_t - V(s_t)\bigr)$$

In words, you move your estimate a little toward what actually happened afterward. Here $T$ is the step where the fold ends and $\alpha$ (alpha) is the step size. This is called **Monte Carlo**, and since it never uses a guess, its target is the true return. It has two costs. You learn nothing until the end, so a task that never ends leaves you nothing to wait for. And one return is a noisy sample, which means luck at step 150 gets credited to step 3, and only an average over many folds washes it out.

## Second answer: use your own guess

Bootstrapping removes the wait. After a single step you know one real reward, $r_t$, and the situation you have reached, $s_{t+1}$, and you already have an estimate for that situation. So let's replace everything after that step with your current estimate:

$$V(s_t) \leftarrow V(s_t) + \alpha\,\bigl(\underbrace{r_t + \gamma\, V(s_{t+1})}_{\text{target}} - V(s_t)\bigr)$$

In words, the target is what you just earned plus your own current guess of everything that follows, so you can update after every step. It's a guess learned from a guess, a bit like lifting yourself by your own bootstraps. Q-learning, the subject of the previous article, makes exactly this move on action values, with a target that is the reward plus its own best guess for the next situation.

## The made-up reward

The gap inside that update is called the **TD error** (temporal difference error):

$$\delta_t = r_t + \gamma\, V(s_{t+1}) - V(s_t)$$

In words, it's the real reward plus how much better the next situation looks than the current one, and you can read it as a reward the robot makes up for itself on every step. On a step with zero real reward, $\delta_t$ is positive when the discounted estimate of the next situation is higher than the estimate of the current one. Once the estimates carry some knowledge of the reward at the end, that single reward can show up as a signal on earlier movements, though on the first walk, with every estimate at zero, only the last step has one. And if the estimates didn't change during a walk, the real return minus the current estimate would equal the sum of the made-up rewards along the rest of the walk: $G_t - V(s_t) = \sum_k \gamma^{k-t}\,\delta_k$.

The made-up reward isn't the task's reward. It's built from the current estimate, so it changes whenever the estimate does. It resembles reward shaping, where Ng, Harada and Russell (1999) showed that adding $\gamma\Phi(s') - \Phi(s)$ to the reward, for a fixed $\Phi$, leaves the best behavior unchanged. The TD error has this form when $\Phi = V$, but $V$ moves during learning, so the guarantee doesn't carry over.

## How the credit trickles back

Picture eight situations in a row, with reward 1 on the last move and nothing else. Press the button to send the robot down the row again, and a red cell means the learner knows a reward is coming from there.

<div class="tri-corridor"><noscript>Without scripts: after walk 1, waiting credits all 8 states, three-step credits the last 3, one-step credits the last 1. After walk 3, three-step has all 8. One-step needs 8 walks.</noscript></div>

Waiting credits every situation after the first walk. The learner that uses one guess credits only the last situation, because that's the only place a real reward exists. On the next walk the second to last can borrow the guess of the last, and so on, so the reward trickles back one link per walk. The made-up reward $\delta$ in the row under the first learner marks the front, since it's positive where the next walk will teach something new.

Between the two sits a dial where you use $n$ real rewards and then a guess:

$$G_{t:t+n} = r_t + \gamma\, r_{t+1} + \cdots + \gamma^{n-1}\, r_{t+n-1} + \gamma^{n}\, V(s_{t+n})$$

In words, you add the next $n$ real rewards and then the discounted guess for the situation $n$ steps ahead. With $n = 1$ this is the guess above, and with $n$ as long as the walk it's waiting. The middle row uses $n = 3$ and finishes in 3 walks instead of 8, and eligibility traces blend all these $n$ together.

The corridor doesn't show the guess winning. With no randomness and a step size of 1 it's the best case for waiting, and the trickle's speed also depends on update order, since a learner that updates backward after each walk, or uses traces, carries credit further in one pass. The guess wasn't invented to win this race.

## What the guess buys

**It lets learners share what they know.** Sutton and Barto give a small example with eight recorded walks through two situations, A and B. One walk goes from A to B and ends with no reward at all, and seven walks start at B, six ending with reward 1 and one ending with 0. So the value of B is clearly 3/4, and the question is what A is worth. If the learner reuses this data until its estimates settle, waiting says 0, because the one walk through A returned 0. Guessing says A leads to B and B is worth 3/4, so A is worth 3/4, which means the guess shares what was learned about B with every situation that leads to B. If the world is Markov (the next situation depends only on the current one), the shared answer is the better one. That holds for repeated reuse of the data, and a single online pass wouldn't give these numbers. Which method learns faster has no general proof, though in practice the guess has usually won on noisy tasks.

**It learns while the task runs.** The robot doesn't need the walk to end, so it can learn in a task with very long walks or one that never ends, and its target holds one random reward instead of two hundred. Sutton and Barto call the one-step target often superior in variance, though it introduces bias because the guess can be wrong.

## A reward on every step does not remove the problem

Bootstrapping doesn't exist because rewards are rare. Suppose a reward arrives on every step. It still speaks only about the step you just took, while the value is about everything that step leads to, so a step that costs 1 can lead along a safe path or toward a cliff five steps later. The estimate of the future supplies that delayed consequence whether rewards are rare or frequent. The cliff clips are pictures and not proof, and I didn't test why the waiting robot failed there.

## The price: a guess built on a guess

The target uses the robot's own number. In a table, where each situation has a separate entry, a wrong number gets pulled toward reality because the guesses end at real rewards. But now let one set of weights produce the numbers for all situations, as a neural network does (**function approximation**), and let the target assume a different behavior from the one that collects the data (**off-policy learning**, where Q-learning assumes the best next action while the robot also makes random moves). The next two articles take these two apart, and the last one puts them together with bootstrapping as the **deadly triad**, where a wrong guess can feed itself.

The smallest case comes from Sutton and Barto. Two situations share one weight $w$, so the first has estimated value $w$ and the second has $2w$. The only move goes from the first to the second, with reward 0, which makes the true value of both 0. The target for the first is $\gamma \cdot 2w$, and the update is:

$$w \leftarrow w + \alpha\,(2\gamma w - w) = \bigl(1 + \alpha(2\gamma - 1)\bigr)\,w$$

In words, every update multiplies $w$ by a number above 1, so the estimate of something worth nothing grows without end. With $\gamma = 0.99$ and $\alpha = 0.1$ the factor is 1.098, and starting at 10 the estimate is about 25 after 10 updates and over 100,000 after 100.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-naive-101" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-naive-101-desktop.mp4"></video><figcaption><b>The price: the broom falls almost at once</b>A simulated robot balances a broom on a cart. Its network learned from one-step guesses (Q-learning), updating from each move as it happened, with random moves. There was no memory of old moves and no frozen copy. The real fall takes less than a fifth of a second, so the clip plays at quarter speed. Recorded game simulation.</figcaption></figure>
</div>

The clip is a recorded game simulation of that loop and not a physical robot. Its estimates grew into the millions in a world where the true value can't pass 100, and the broom fell. In the game, replaying old moves in random order and taking the target from a frozen copy of the network prevented this.

## What this shows, and what it does not

The guess let one robot learn a path that a waiting robot didn't find, and it let a network push its estimates beyond any possible reward, but none of that shows that guessing is faster in general, how often the blow-up happens in real systems, or why the waiting robot failed.

<details>
<summary>Source checks and what each claim depends on</summary>

All equation numbers are from Sutton and Barto, [*Reinforcement Learning: An Introduction*, second edition](http://incompleteideas.net/book/RLbook2020.pdf), which I checked in the published text.

- **Update and TD error.** The one-step update is Eq. 6.2 and the TD error is Eq. 6.5. Eq. 6.6 states $G_t - V(S_t) = \sum_{k=t}^{T-1}\gamma^{k-t}\delta_k$. It is exact only if $V$ does not change during the walk. For TD(0) with a small step size it holds approximately.
- **n-step return.** Eq. 7.1 is the formula in the text. Eq. 7.2 is the matching update. Sutton and Barto note that no change is made during the first $n-1$ steps of a walk, and that the missing updates are made at the end. The corridor follows their pseudocode.
- **Waiting versus guessing on the same data.** The example is Example 6.4. The eight recorded walks are: A, reward 0, B, reward 0, end (once); B, reward 1, end (six times); B, reward 0, end (once). Batch updating means the data are presented again and again until the estimates settle. Batch Monte Carlo gives A the value 0, which is the best fit to the data seen. Batch TD(0) gives 3/4, the answer for the maximum-likelihood Markov model of the data. The book says TD's answer is expected to be better if the process is Markov. One online pass over these walks gives neither number.
- **Speed.** Section 6.2 says it is an open question which method converges faster and that no proof exists. Example 6.2 (a random walk) shows TD ahead of constant-step Monte Carlo. The book says nothing more definite can be said about this.
- **Variance and bias.** The sentence that the one-step return is often superior in variance and computational convenience, even though it introduces bias, is from the actor-critic section. The same section notes that the extent of the bias can be modulated with n-step returns and traces.
- **Shaping.** Ng, Harada and Russell, [*Policy invariance under reward transformations: Theory and application to reward shaping*](https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf) (ICML 1999). The PDF has bitmap glyphs and no text layer, so I rendered pages 3 and 4 as images and read them. The shaped task is $M' = (S,A,T,\gamma,R+F)$. Theorem 1: $F$ is potential-based if some real-valued $\Phi : S \to \mathbb{R}$ gives $F(s,a,s') = \gamma\Phi(s') - \Phi(s)$ for all $s \in S-\{s_0\}$, all $a$ and all $s'$ (with $S-\{s_0\}=S$ if $\gamma<1$). That form is necessary and sufficient to guarantee consistency with the optimal policy. Sufficiency: every optimal policy in $M'$ is optimal in $M$ and the reverse. Necessity: for any other $F$, some transition function and some reward function exist for which no optimal policy of $M'$ is optimal in $M$. So necessity holds without further knowledge of the task, not in every task. The theorem treats $\Phi$ as a fixed function of the situation. For infinite state spaces the paper asks for a bounded $\Phi$. The paper does not cover a $\Phi$ that changes during learning, which is why the article does not claim the TD error is covered.
- **Two situations and one weight.** Sutton and Barto, Section 11.2. The multiplication factor and the numbers (25 and 114,877) are my own arithmetic from the update rule.
- **The triad.** Sutton and Barto state that if any two of the three elements are present but not all three, instability can be avoided, and that the danger comes from all three together. My game runs showed a possible exception: a network with the Sarsa target (the action actually taken next, not the best next action), also without memory or a frozen copy, blew up too. Whether that contradicts the book depends on details I did not examine.
- **Atari.** Across 336 settings, one-step Q-learning showed soft divergence in 94% of runs against 21% for ten-step returns ([van Hasselt and colleagues, 2018](https://arxiv.org/abs/1812.02648)).

</details>

<details>
<summary>Exact numbers for the cliff clips and the dial between waiting and guessing</summary>

Both clips use a 4 by 12 grid, a table, random moves with probability 0.1, and 10,000 training steps. Falls cost 100 and return the robot to the start. The guessing clip is Q-learning, seed 202. The waiting clip is the waiting learner, seed 202. I chose the first and the last of the ten training walks that the game stores for each run. Each clip is one run, so it is an example and not an average. The waiting clip's final test is sped up.

In the final test the guessing learner reaches the flag in 13 steps with no fall. In the 20 seeds, the guessing learner reached the flag in a test every time, and the waiting learner never did: its final score was −200 in every run, which is the step limit. A table that guessed scored −13 after 10,000 steps, the best possible. I did not examine why the waiting learner stays at the start. These numbers compare performance after a fixed budget. They say nothing about when updates can start.

**Timing.** One seed, the first 400 steps. The learner with one real reward and a guess used 177 training rows before its first walk ended, at step 178. The learner that waited used none, then used 200 at once when its first walk ended at step 200.

**The dial.** The median number of environment steps that each setting needed to first pass a score threshold. The game makes one update per step.

| Real rewards | Cliff, table, threshold −20 (20 seeds) | CartPole, network with replay and a frozen copy, threshold 150 (5 seeds) |
| --- | --- | --- |
| 1 | 2,750 | 2,500 |
| 2 | 1,750 | 1,500 |
| 4 | 1,750 | 1,500 |
| 8 | 3,625 | 1,500 |
| all | never in 10,000 | 1,500 |

The best number of real rewards depends on the world. In CartPole after 20,000 steps, a table that waited scored 95.4 of 200 against 50.4 for a table that guessed, so guessing was not always better.

**Falls on the cliff.** The falls in the guessing clip come from random moves, not from numbers going wrong. Over 20 seeds, in the second half of training, Q-learning with random moves fell 0.318 times per walk, Q-learning without them 0.000 times, and Sarsa with them 0.061 times. Table values stayed between −153 and 0.

</details>

<details>
<summary>Exact numbers for the CartPole failure, and a fix that held</summary>

Runs use 20,000 steps and seeds 101 to 505. Random moves fall from 1.0 to 0.05 over the first 5,000 steps. The network has two hidden layers of 32 units and uses Adam at 0.001. The memory fix adds a memory of 10,000 moves and a frozen copy refreshed every 250 updates. The score is the greedy policy's undiscounted reward over its first 200 counted steps, averaged over 3 test episodes and the last quarter of the test points.

The naive network is one-step Q-learning on a live network. It updates from the latest move, makes random moves, and has no memory and no frozen copy. It scored about 9 of 200. In all 5 seeds the broom fell after 8 to 10 steps. The median over seeds of the largest estimate was 4.1 million. With replay and a frozen copy the score was 143 and the median of the largest estimate was 61.7. The five tests lasted 118, 600, 99, 104 and 272 steps. Four ended at the end of the rail, and only one held the broom for all 600 steps. That is the clip below.

<div class="tri-clips">
<figure class="tri-clip"><video class="tri-video" data-clip="cart-dqn-202" controls muted loop playsinline preload="none" src="/assets/robotics/rl/clips/cart-dqn-202-desktop.mp4"></video><figcaption><b>The same robot with a fix: the broom stays up</b>Old moves are replayed in random order, and the target comes from a frozen copy of the network. This run is the only one of five that held the broom for the full 12 seconds.</figcaption></figure>
</div>

The game page shows 5 million and 65.4, which are maxima over seeds and test points. A network with the Sarsa target scored 9 to 11 of 200, with a largest estimate near 2 million. Sarsa uses the action that the random-move behavior actually took next, where Q-learning uses the best next action. It also had no memory and no frozen copy. So changing that one choice did not prevent the blow-up in this network. Memory and the frozen copy are separate changes, and I did not test each alone beyond the arms listed in the source note.

![Three charts from Breaking Bellman. Score per test episode stays near 10 of 200. The predicted value rises to the 10,000 chart ceiling while the value earned stays near 0. The largest absolute Q value rises past one million on a log scale.](/assets/robotics/rl/naive-charts.png "Level Values explode, naive network, 5 seeds, 20,000 steps. The score stays near 9 of 200 and the predicted value rises to the chart ceiling. Simulation.")

![Three charts from Breaking Bellman comparing two runs. The dashed run is the naive network. The solid run, with replay and a frozen copy, keeps the largest Q near 65 and reaches a score of about 150.](/assets/robotics/rl/naive-vs-dqn-charts.png "Dashed: the naive network. Solid: replay and a frozen copy. The largest estimate stays near 65 and the score ends at 143 of 200. Simulation.")

</details>

<details id="source-note">
<summary>How the clips, the corridor and the numbers were made</summary>

The screenshots are real captures of the game page, built at commit [681cae3](https://github.com/Hadrien-Cornier/breaking-bellman/tree/681cae3820f05f8604d212c0ab048ebf0e017e73) and run in a browser on October 17, 2026. Other numbers come from the game's own `RLA.run` code at the same commit. Arms in a world share seeds. The run script and raw results are stored locally and are not published.

**Robot clips.** Each clip is a real recorded episode from those runs. A real browser draws it with the game's own `web/scenes.js` at the same commit, unmodified, using the game's own sprites and fonts. I replaced only the clock, so that the scene runs at a fixed 30 frames per second, and I encoded the frames with ffmpeg (H.264). The naive CartPole clip plays at quarter speed, because the real episode lasts 0.18 s. The waiting clip's final test is sped up by a factor of 6, because the robot stays at the start. All other clips play in real time.

**Corridor.** The corridor is not a recorded run. It is a small program that follows the n-step TD pseudocode of Sutton and Barto, Section 7.1: eight situations, reward 1 on the last move, discount 1, step size 1, all values 0 at the start, no randomness. I checked its output against a separate script. The three rows differ only in $n$, which is 1, 3, and long enough to reach the end of the walk.

**Steps to the threshold.** The first test point with a mean score at or above the threshold (−20 on the cliff, 150 on CartPole), per seed. The table shows the median over the seeds that reached it.

**Not tested.** Variance of targets, updates on a fixed set of data, a linear approximation, recovery after falls, and a schedule over the number of real rewards.

</details>

<script src="/assets/robotics/rl/rl-videos.js" defer></script>
<script src="/assets/robotics/rl/corridor.js" defer></script>
