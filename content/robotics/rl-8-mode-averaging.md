---
title: 'Mode averaging: two good routes, one bad average'
description: 'Why copying demonstrations that go left and right around a box can send a robot into the box, and what flow policies and action chunks change.'
date: '2026-10-21'
draft: false
series: 'Reinforcement learning'
part: 8
layout: essay
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-8-mode-averaging-routes.svg'
thumbnail_alt: 'Left and right routes around a box, and their average going straight through it'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">

Suppose you teleoperate a robot arm to reach a cup that sits behind a box. Half the time you go around the left side, and half the time you go around the right. Both are good demonstrations. Now you train a policy to copy them. What does it do when it sees the box?

If the policy predicts one action and you train it to be as close as possible to every demonstration, the answer can be the average: straight through the box. This is **mode averaging**, and it's the last failure in this series. It doesn't come from a bad reward or a wrong value estimate. It comes from asking a single answer to stand in for two different good answers.

**Part 8.** [Previously: learning from a fixed dataset](/robotics/rl-7-learning-from-fixed-data/). The [failure map in part 0](/robotics/rl-0-overview/#sec-failures) puts this problem under "copying the wrong thing", next to copying bad demonstrations from part 7.

**Reading goal:** see why the average of two safe routes can be unsafe, why action chunks raise the stakes, and what a flow policy changes, including what it still doesn't guarantee.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,460px)" viewBox="0 0 300 250" role="img" aria-labelledby="m8-routes-title m8-routes-desc"><title id="m8-routes-title">Two safe routes and their unsafe average</title><desc id="m8-routes-desc">Seen from above, a gripper starts at the left and a cup sits at the right, behind a box. The left route curves above the box and the right route curves below it. Averaging the two routes point by point gives a straight line through the box.</desc><g font-family="Arial,sans-serif" fill="#242622"><rect x="125" y="85" width="50" height="50" rx="3" fill="#d9d6cc" stroke="#656b62" stroke-width="1.5"/><text x="150" y="130" font-size="11" text-anchor="middle">box</text><circle cx="30" cy="110" r="7" fill="#fff" stroke="#242622" stroke-width="1.5"/><text x="30" y="132" font-size="11" text-anchor="middle">start</text><circle cx="270" cy="110" r="8" fill="#fff" stroke="#242622" stroke-width="1.5"/><text x="270" y="132" font-size="11" text-anchor="middle">cup</text><path d="M30,110 C80,110 100,50 150,50 C200,50 220,110 270,110" fill="none" stroke="#3d6f9e" stroke-width="2.5"/><path d="M30,110 C80,110 100,170 150,170 C200,170 220,110 270,110" fill="none" stroke="#5f7f4f" stroke-width="2.5"/><path d="M30,110 L270,110" fill="none" stroke="#b44c2c" stroke-width="2.5" stroke-dasharray="7 5"/><g fill="#3d6f9e"><circle cx="63" cy="101" r="3.5"/><circle cx="117" cy="59" r="3.5"/><circle cx="150" cy="50" r="3.5"/><circle cx="183" cy="59" r="3.5"/><circle cx="237" cy="101" r="3.5"/></g><g fill="#5f7f4f"><circle cx="63" cy="119" r="3.5"/><circle cx="117" cy="161" r="3.5"/><circle cx="150" cy="170" r="3.5"/><circle cx="183" cy="161" r="3.5"/><circle cx="237" cy="119" r="3.5"/></g><g fill="#b44c2c"><circle cx="63" cy="110" r="3.5"/><circle cx="117" cy="110" r="3.5"/><circle cx="150" cy="110" r="3.5"/><circle cx="183" cy="110" r="3.5"/><circle cx="237" cy="110" r="3.5"/></g><text x="150" y="38" font-size="12" text-anchor="middle" fill="#3d6f9e" font-weight="700">left route (safe)</text><text x="150" y="190" font-size="12" text-anchor="middle" fill="#5f7f4f" font-weight="700">right route (safe)</text><line x1="20" y1="214" x2="44" y2="214" stroke="#b44c2c" stroke-width="2.5" stroke-dasharray="7 5"/><text x="50" y="218" font-size="12" fill="#b44c2c" font-weight="700">average of the two: through the box</text><text x="20" y="238" font-size="11">Dots: five waypoints of one action chunk.</text></g></svg><figcaption>Seen from above. Each route is a safe plan on its own. Averaging the waypoints of the left and right plans, point by point, gives a plan that goes through the box.</figcaption></figure>

## Two good answers in one situation

Let's make it small enough to calculate. Measure how far the gripper passes to the side of the box with one number $y$, in units of 10 cm. The left route passes at $y=-1$ and the right route at $y=+1$. The box covers $|y|<0.5$, so anything closer to the center than half a unit hits it.

A **mode** is a distinct cluster of good actions or plans for the same situation. Here there are two: everything near $-1$, and everything near $+1$. The demonstrations are split evenly between them, and both are safe.

Now train a policy $f(o)$ that outputs one number for the observation $o$, using squared error. Write $y_i$ for the demonstrated offset in demonstration $i$, and $N$ for the number of demonstrations seen in this situation. The fit chooses the output that minimizes

$$\frac{1}{N}\sum_{i=1}^{N}\big(f(o)-y_i\big)^2.$$

The minimizer of a squared error is the mean. With half the demonstrations at $-1$ and half at $+1$, that mean is $0$, which is the center of the box. More data doesn't help, because more data only makes the estimate of the mean more precise. The problem is that the mean is the wrong summary of these demonstrations.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,460px)" viewBox="0 0 300 210" role="img" aria-labelledby="m8-fit-title m8-fit-desc"><title id="m8-fit-title">Squared error and a single bell curve both center on the box</title><desc id="m8-fit-desc">Demonstrated offsets sit at minus one and plus one. The squared-error answer is zero, inside the box band. A bell curve fitted to the same data peaks at zero and puts about 38 percent of its samples inside the box band.</desc><g font-family="Arial,sans-serif" fill="#242622"><rect x="115" y="40" width="70" height="120" fill="#efd9cf"/><text x="150" y="34" font-size="11" text-anchor="middle" fill="#b44c2c">box: |y| &lt; 0.5</text><line x1="20" y1="160" x2="280" y2="160" stroke="#656b62"/><g font-size="11" text-anchor="middle"><text x="80" y="176">−1</text><text x="150" y="176">0</text><text x="220" y="176">+1</text></g><text x="150" y="196" font-size="11" text-anchor="middle">offset y (10 cm units)</text><rect x="74" y="70" width="12" height="90" fill="#3d6f9e"/><rect x="214" y="70" width="12" height="90" fill="#5f7f4f"/><text x="80" y="62" font-size="11" text-anchor="middle">demos</text><text x="220" y="62" font-size="11" text-anchor="middle">demos</text><path d="M19.8,147.9 L29.8,144.4 L39.8,140.3 L49.8,135.6 L59.9,130.3 L69.9,124.7 L79.9,118.8 L89.9,113.0 L99.9,107.4 L109.9,102.3 L120.0,98.0 L130.0,94.7 L140.0,92.7 L150.0,92.0 L160.0,92.7 L170.0,94.7 L180.0,98.0 L190.1,102.3 L200.1,107.4 L210.1,113.0 L220.1,118.8 L230.1,124.7 L240.1,130.3 L250.2,135.6 L260.2,140.3 L270.2,144.4 L280.2,147.9" fill="none" stroke="#242622" stroke-width="1.8"/><text x="150" y="84" font-size="10" text-anchor="middle">bell curve fit</text><text x="150" y="132" font-size="10" text-anchor="middle" fill="#b44c2c" font-weight="700">squared-error</text><text x="150" y="144" font-size="10" text-anchor="middle" fill="#b44c2c" font-weight="700">answer: 0</text><circle cx="150" cy="157" r="4.5" fill="#b44c2c"/></g></svg><figcaption>Half the demonstrations pass at −1 and half at +1. The squared-error answer is their mean, 0. A single bell curve fitted to the same data has mean 0 and standard deviation 1, so about 38% of its samples land inside the box band.</figcaption></figure>

What if the policy outputs a whole distribution instead of one number? A common choice is a single bell curve, a Gaussian with a learned mean and spread. Fit it to the same data by maximum likelihood, and you get mean $0$ and standard deviation $1$. So it still peaks at the box. If you sample from it once and commit, about 38% of samples fall inside $|y|<0.5$. A single bell curve has one peak, so it can't put its weight on $-1$ and $+1$ while leaving the middle empty.

These two numbers are a teaching calculation on idealized data. They don't say that every Gaussian or every single-action policy will hit the obstacle on a real robot. The next section shows why the outcome depends a lot on how often the robot gets to look again.

## Feedback can hide the problem, chunks expose it

Suppose the robot picks one small command, moves a little, looks again and picks the next command. If the first command leans slightly to the right, the next observation shows the gripper a bit to the right of center. That state looks more like the right-route demonstrations, so the next command leans further right. The exact middle is unstable, so a small lean grows and the robot commits to one side.

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a level with two ways around an obstacle, and it shows this effect. With one command per decision, the Gaussian copy, the single-action copy and a flow copy all reached the goal in every test (3 seeds, simulation). With 10 commands per decision played without looking, the Gaussian copy reached the goal 33% of the time with 15.0 obstacle hits per test, the single-action copy 67% with 13.7 hits, and the flow copy 85% with 3.65 hits. The game's log also notes that the gap depends on the training budget: with 10,000 updates the single-action copy reached 100%. The log also doesn't record where the chunked copies hit the obstacle, so these numbers don't show that the failures went through the middle. This is one toy's measurement, not a ranking of methods.

That second setting is an **action chunk**: the policy outputs several future commands at once, and the robot executes them before it asks again. Chunks are useful. They make motion smoother, they reduce how often a large model has to run, and [ACT (Zhao et al., 2023)](https://arxiv.org/abs/2304.13705) uses them to cut the number of decisions in a task. But within a chunk, the robot can't use feedback to break the tie.

Look back at the first figure. Each dot is one waypoint of a five-step chunk. Averaging the left chunk and the right chunk point by point gives five waypoints on the center line, and the straight segment between them crosses the box. The space of safe plans isn't convex: the midpoint of two safe plans doesn't have to be safe. The longer the chunk, the more of the robot's motion is decided by that midpoint before anyone looks again.

Chunks don't cause the problem by themselves. If the policy can sample a whole chunk from one mode, the chunk stays consistent: all five waypoints come from the left route, or all from the right. The trouble is a chunk produced by a model that can only express the average.

## Represent the two modes

What we need is a policy that, given the same observation, can output $-1$ on one call and $+1$ on another, and almost never $0$. People have built several kinds of models that can represent this:

- **A mixture** of several Gaussians, each one able to sit on a different mode.
- **Discrete action tokens**, which turn the action into a classification problem with one probability per bin.
- **A conditional variational autoencoder**, which ACT uses so that a hidden variable can select a style of demonstration.
- **Diffusion and flow models**, which start from random noise and transform it into an action.

[Diffusion Policy (Chi et al., 2023)](https://arxiv.org/abs/2303.04137) shows the effect in a pushing task where the end effector can go left or right around a T-shaped block. The authors report that their policy learns both modes and commits to one within each rollout. Two of their baselines lean toward one mode, and another fails to commit because consecutive actions aren't consistent.

The rest of this article follows the flow-model branch, because it's the one used by [π0 (Black et al., 2024)](https://arxiv.org/abs/2410.24164), a robot foundation model that outputs action chunks.

## How a flow policy draws one plan

A flow policy doesn't output an action directly. It outputs a direction to move in. Let $x$ be a candidate action chunk, $\tau$ a number from 0 to 1 that we'll call **integration time**, and $o$ the observation. A network $v_\theta$ with weights $\theta$ predicts a velocity, and the candidate follows it:

$$\frac{dx}{d\tau}=v_\theta(x,\tau,o).$$

Start with $x$ drawn from random noise at $\tau=0$. Follow the velocity until $\tau=1$. The end point is the action chunk the robot executes. π0 does this with ten steps of size $0.1$ using the simplest rule, forward Euler:

$$x \leftarrow x+0.1\,v_\theta(x,\tau,o),\qquad \tau\leftarrow\tau+0.1.$$

**Integration time is not robot time.** All ten of those steps happen inside the computer, before the robot moves at all. The intermediate values of $x$ are not positions the gripper visits. Robot time only starts once the final chunk comes out. In π0 a chunk holds 50 future actions. On its 50 Hz robots, the authors execute 25 of them, which is half a second, and then run the model again. That's 10 numerical steps to produce one chunk, and 25 physical commands executed from it.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,460px)" viewBox="0 0 320 250" role="img" aria-labelledby="m8-flow-title m8-flow-desc"><title id="m8-flow-title">Three noise starts follow the flow to the two routes</title><desc id="m8-flow-desc">Integration time runs from zero to one along the horizontal axis. A start at 0.3 ends at plus one, a start at minus 0.8 ends at minus one, and a start at 0.05 hesitates near zero and then ends at plus one. Below, a separate strip shows robot time: the robot executes the final chunk only after integration finishes.</desc><g font-family="Arial,sans-serif" fill="#242622"><line x1="40" y1="190" x2="40" y2="30" stroke="#656b62"/><line x1="40" y1="110" x2="285" y2="110" stroke="#b6baaf" stroke-dasharray="3 3"/><line x1="40" y1="190" x2="285" y2="190" stroke="#656b62"/><g font-size="10" text-anchor="end"><text x="35" y="47">+1</text><text x="35" y="114">0</text><text x="35" y="180">−1</text></g><rect x="284" y="76.7" width="8" height="66.6" fill="#efd9cf" stroke="#b44c2c"/><text x="296" y="114" font-size="9" fill="#b44c2c">box</text><text x="292" y="47" font-size="9" fill="#5f7f4f">right</text><text x="292" y="180" font-size="9" fill="#3d6f9e">left</text><path d="M40,90.0 L64,92.0 L88,93.7 L112,95.1 L136,96.0 L160,95.8 L184,93.2 L208,85.1 L232,71.3 L256,57.3 L280,43.3" fill="none" stroke="#5f7f4f" stroke-width="2"/><path d="M40,163.4 L64,158.0 L88,153.3 L112,149.6 L136,147.3 L160,147.2 L184,150.5 L208,156.7 L232,163.4 L256,170.0 L280,176.7" fill="none" stroke="#3d6f9e" stroke-width="2"/><path d="M40,106.7 L64,107.0 L88,107.3 L112,107.5 L136,107.7 L160,107.6 L184,107.1 L208,105.2 L232,95.5 L256,69.4 L280,43.3" fill="none" stroke="#b44c2c" stroke-width="2" stroke-dasharray="5 3"/><g font-size="10"><text x="44" y="84">start 0.3</text><text x="44" y="175">start −0.8</text><text x="44" y="122" fill="#b44c2c">start 0.05</text></g><g font-size="10" text-anchor="middle"><text x="40" y="203">τ = 0</text><text x="160" y="203">0.5</text><text x="280" y="203">1</text></g><text x="160" y="16" font-size="11" text-anchor="middle" font-weight="700">integration time τ: inside the computer</text><rect x="40" y="218" width="245" height="20" fill="#eeefe9" stroke="#b6baaf"/><text x="162" y="232" font-size="10" text-anchor="middle">robot time starts here: execute the chunk at τ = 1</text></g></svg><figcaption>Ten Euler steps of size 0.1 with the exact velocity for an even split between the left route (−1) and the right route (+1). Noise near zero hesitates, then commits. Only the end point at τ = 1 becomes a plan, and the robot moves after that.</figcaption></figure>

Where does the choice of mode come from? From the starting noise. Here is the calculation for our two-route example, with the same offsets as before ($-1$ for the left route, $+1$ for the right), starting noise drawn from a standard normal, and the exact velocity field that a perfect learner would end up with. The details are in the drawer below.

<div class="ct">

| Starting noise | After 5 steps | After 10 steps | Plan |
| ---: | ---: | ---: | --- |
| 0.3 | 0.21 | 1.00 | right route |
| −0.8 | −0.56 | −1.00 | left route |
| 0.05 | 0.04 | 1.00 | right route |
| 0 exactly | 0 | 0 | the average |

</div>

Different noise ends at different routes, and a small lean is enough to commit. The only start that ends at the average is exactly 0, which a continuous noise distribution draws with probability zero. That's the source of multimodality in a flow policy: the learned velocity field splits the noise space into regions, and each region flows to a different mode.

<details>
<summary>How the velocity is trained, and the exact field in the example</summary>

π0 trains the network with a flow matching loss. Take a demonstrated chunk $A$, draw noise $\epsilon$ from a standard normal and a time $\tau$ between 0 and 1, then blend them:

$$x_\tau=\tau A+(1-\tau)\epsilon.$$

The training target is the direction from the noise to the demonstration, $u=A-\epsilon$, and the loss is the squared distance between the network's velocity and that target:

$$L(\theta)=\mathbb E\big\|v_\theta(x_\tau,\tau,o)-(A-\epsilon)\big\|^2.$$

This is still a squared error, so it is still minimized by a mean. The difference is what gets averaged. The network learns the average direction at a given noisy point $x_\tau$, and at most noisy points the demonstrations that could have produced it mostly belong to one route. So the averaged direction points toward one mode, not toward the middle. [Lipman et al. (2022)](https://arxiv.org/abs/2210.02747) introduced flow matching as a general method; π0 sets this up in its Section IV, with a chunk of $H=50$ actions and 10 integration steps.

For the table, the data are $A=+1$ or $A=-1$ with equal probability and one-dimensional noise. Let $m(x,\tau)$ be the expected $A$ given $x_\tau=x$, computed from the two Gaussians centered at $\pm\tau$ with spread $1-\tau$. The exact field is

$$v(x,\tau)=\frac{m(x,\tau)-x}{1-\tau},$$

and the table applies the Euler rule above from $\tau=0$ to $\tau=1$. This is a calculation with a perfect field, not a trained network.

</details>

## What a flow policy doesn't guarantee

Being able to represent two modes is not the same as learning both of them.

- **Coverage is not guaranteed.** The training loss rewards matching the demonstrations on average. If one route appears in 5% of the data, the learned field may give it a tiny region of the noise, or none. Nothing in the method promises that every valid route gets its share.
- **The dividing line is where errors live.** With the exact field, only one point flows to the average. A learned field is approximate, and the noise near the boundary between regions is where it is most likely to end somewhere in between. In the game's fork level, the flow copy still hit the obstacle 3.65 times per test with 10-command chunks.
- **It copies, it doesn't judge.** A flow policy reproduces the routes in the data, including slow or risky ones. Choosing the better mode needs a reward or a value estimate. That's the subject of [the previous part on mixed-quality data](/robotics/rl-7-learning-from-fixed-data/#sec-mixed).
- **Chunks still run open loop.** Sampling one consistent chunk fixes averaging inside the chunk. It doesn't let the robot react to something that changes during those 25 commands. π0's authors tried temporal ensembling, which averages overlapping chunks, and report that it hurt performance, so they execute chunks without blending.
- **It costs computation.** Every chunk needs 10 network evaluations of the action part of the model instead of one.

So the failure and the remedy are different things. Mode averaging is what happens when a model that can only express one answer is trained on demonstrations with two. A flow policy is one way to express both answers: it chooses between them using random noise, and the training data decides how much of the noise goes to each.

<div class="ct">

| Policy output | Two even routes, sampled once and executed as a chunk | Needs |
| --- | --- | --- |
| One action, squared error | The mean: 0, inside the box | Nothing extra |
| One Gaussian | Peak at 0, 38% of samples in the box | A spread estimate |
| Mixture or tokens | Can put weight on both routes | Choosing the number of components or bins |
| Flow or diffusion | Each noise start flows to one route | Several integration steps per chunk |

</div>

The table uses the idealized two-route example from this article. Closed-loop feedback, the size of the network and the training budget can change the outcome on a real robot.

This is the last part of the series. To see where mode averaging sits among the other failures, go back to [the failure map in part 0](/robotics/rl-0-overview/#sec-failures).

<details>
<summary>Sources and what each one supports</summary>

- **Squared error and the mean.** A standard result: the constant that minimizes the average squared distance to a set of numbers is their mean. The Gaussian numbers come from fitting mean and variance to an even split at ±1 (mean 0, variance 1), and the 38% is the probability that a standard normal lies within ±0.5. Teaching calculation.
- **π0.** [Black et al., 2024](https://arxiv.org/abs/2410.24164), Section IV: action chunks of $H=50$, flow matching loss with $x_\tau=\tau A+(1-\tau)\epsilon$ and target $A-\epsilon$, forward Euler with 10 steps of 0.1, and the statement that flow matching gives the model "multimodal modeling capability". Appendix D: 50 Hz robots run inference every 0.5 seconds after 25 actions, chunks run open loop, and temporal ensembling hurt performance.
- **Diffusion Policy.** [Chi et al., 2023](https://arxiv.org/abs/2303.04137), Section 4.1 and Figure 3: the Push-T left or right example, with the authors' description of how their baselines behave.
- **ACT.** [Zhao et al., 2023](https://arxiv.org/abs/2304.13705): action chunking to shorten the effective horizon, and a conditional variational autoencoder because human demonstrators use different trajectories for the same task.
- **Flow matching.** [Lipman et al., 2022](https://arxiv.org/abs/2210.02747).
- **Breaking Bellman.** Fork level numbers from the game's [experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/681cae3820f05f8604d212c0ab048ebf0e017e73/EXPERIMENTS.md) and `web/measured.js` at commit 681cae3, batch 23, 3 seeds. The log records that earlier fork results (batches 8 to 18) were wrong: the demonstrator skimmed the obstacle and hit it in 6 of 50 episodes, so the copies failed from imprecision near the edge rather than from averaging. These numbers come from the corrected world. Simulation.

</details>
