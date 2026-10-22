---
title: 'Learning from a fixed dataset: missing actions and bad demonstrations'
description: 'Two ways a robot dataset can mislead a learner: questions about actions nobody tried, and demonstrations that include mistakes. What BCQ, CQL, IQL, AWR, TD3+BC and advantage conditioning need to help.'
date: '2026-10-21'
draft: false
series: 'Reinforcement learning'
part: 7
layout: essay
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-7-fixed-data-two-problems.svg'
thumbnail_alt: 'Two problems with a fixed dataset: an action the data never tried, and bad actions mixed in with good ones'
---

<link rel="stylesheet" href="/assets/robotics/rl/series.css">

Suppose you've recorded a few hundred teleoperated attempts at picking up a mug with a robot arm. Some operators were experienced, some were new. You can't collect more data right now, so everything has to come from this log. Can you learn a policy that does better than the people who made it?

Two different things can go wrong. A learner that tries to improve on the data asks about actions, and some of those actions never appear in the log, so its answers are guesses that nothing corrects. And a learner that copies the data copies everything in it, including the mistakes. The first is called **extrapolation error**. The second is the problem of **mixed-quality data**. They sit next to each other, but they're different problems with different fixes.

**Part 7.** [Previously: policy gradients](/robotics/rl-6-credit-and-careful-updates/). This part extends [data coverage in part 4](/robotics/rl-4-on-policy-and-off-policy/#sec-coverage) to a log you can't add to. In the [failure map](/robotics/rl-0-overview/#sec-failures), extrapolation error belongs to "value estimates that answer the wrong question", next to the deadly triad.

**Reading goal:** follow one inflated estimate through a target, see which methods stop it and what they give up, then see why copying a mixed log can be worse than copying its best half, and what reward-aware methods need in order to help.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,460px)" viewBox="0 0 320 210" role="img" aria-labelledby="f7-two-title f7-two-desc"><title id="f7-two-title">Two problems with a fixed dataset</title><desc id="f7-two-desc">Left: recorded actions cluster in one region, and the learner asks about an action in an empty region. Right: recorded actions include good ones and bad ones in the same region, and copying takes both.</desc><g font-family="Arial,sans-serif" fill="#242622"><rect x="8" y="8" width="148" height="170" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><rect x="164" y="8" width="148" height="170" rx="4" fill="#fbfbf8" stroke="#b6baaf"/><text x="82" y="28" font-size="12" text-anchor="middle" font-weight="700">Missing actions</text><text x="238" y="28" font-size="12" text-anchor="middle" font-weight="700">Bad actions present</text><g fill="#3d6f9e"><circle cx="36" cy="80" r="4"/><circle cx="48" cy="96" r="4"/><circle cx="40" cy="112" r="4"/><circle cx="58" cy="88" r="4"/><circle cx="54" cy="118" r="4"/><circle cx="64" cy="104" r="4"/></g><circle cx="122" cy="96" r="10" fill="none" stroke="#b44c2c" stroke-width="2" stroke-dasharray="4 3"/><text x="122" y="100" font-size="12" text-anchor="middle" fill="#b44c2c">?</text><text x="122" y="128" font-size="10" text-anchor="middle" fill="#b44c2c">never tried</text><text x="50" y="146" font-size="10" text-anchor="middle">recorded</text><text x="82" y="166" font-size="10" text-anchor="middle">Value guesses go uncorrected.</text><g fill="#3d6f9e"><circle cx="196" cy="80" r="4"/><circle cx="214" cy="100" r="4"/><circle cx="200" cy="116" r="4"/><circle cx="226" cy="86" r="4"/><circle cx="236" cy="112" r="4"/></g><g stroke="#b44c2c" stroke-width="2.2"><path d="M252,88 l8,8 m0,-8 l-8,8"/><path d="M262,108 l8,8 m0,-8 l-8,8"/><path d="M244,120 l8,8 m0,-8 l-8,8"/></g><text x="238" y="146" font-size="10" text-anchor="middle">good and bad, both recorded</text><text x="238" y="166" font-size="10" text-anchor="middle">Copying keeps the mistakes.</text><text x="160" y="200" font-size="11" text-anchor="middle">Blue: good recorded actions. Red: a question or a mistake.</text></g></svg><figcaption>One problem is a hole in the data, the other is unwanted content in it. A method that fixes one doesn't automatically fix the other.</figcaption></figure>

<h2 id="sec-extrapolation">A question the data can't answer</h2>

Take one moment in the log: the gripper is just above the mug. In the recorded attempts, operators did one of two things there. They lowered the gripper slowly, or they lowered it fast. Nobody ever swept the gripper sideways, because that knocks the mug over.

Now train a Q-function on this log, the same kind of action-value estimate as in [part 1](/robotics/rl-1-q-learning/). It learns from the recorded transitions, so its estimates for the two recorded actions get corrected by real outcomes. The sideways sweep never appears, so its estimate is whatever the network happens to produce there. Here are illustrative numbers:

<div class="ct ct-words">

| Action above the mug | Times in the log | Estimate $\hat Q$ | True value |
| --- | ---: | ---: | ---: |
| Lower slowly | 60 | 4 | 4 |
| Lower fast | 40 | 3 | 3 |
| Sweep sideways | 0 | **9** | −5 |

</div>

Q-learning's target for the move that brought the gripper above the mug takes the largest next-action estimate. With reward 0 for that move and discount $\gamma=0.9$:

$$\begin{aligned}
\text{max over all actions:}&\quad 0+0.9\times 9=8.1,\\
\text{max over recorded actions:}&\quad 0+0.9\times 4=3.6.
\end{aligned}$$

The earlier state now inherits a value that came from an action nobody took. The policy that reads this table chooses the sweep. If the robot could act, it would try the sweep, see the mug fall and correct the estimate. With a fixed log, nothing ever corrects it, and the next target built from the inflated value carries the error further back. This is the same feedback as in [the deadly triad](/robotics/rl-5-the-deadly-triad/), with the missing correction coming from a dataset that can't grow.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,440px)" viewBox="0 0 300 220" role="img" aria-labelledby="f7-q-title f7-q-desc"><title id="f7-q-title">The largest estimate belongs to an action nobody tried</title><desc id="f7-q-desc">Bars for three actions. Lower slowly has estimate 4, lower fast 3, both from data. Sweep sideways has a dashed bar of 9 with no data and a true value of minus 5. The max picks the dashed bar.</desc><g font-family="Arial,sans-serif" fill="#242622"><line x1="30" y1="170" x2="285" y2="170" stroke="#656b62"/><rect x="50" y="122" width="50" height="48" fill="#3d6f9e"/><rect x="125" y="134" width="50" height="36" fill="#3d6f9e"/><rect x="200" y="62" width="50" height="108" fill="none" stroke="#b44c2c" stroke-width="2" stroke-dasharray="5 3"/><g font-size="12" text-anchor="middle"><text x="75" y="116">4</text><text x="150" y="128">3</text><text x="225" y="56" fill="#b44c2c" font-weight="700">9 ?</text></g><g font-size="10" text-anchor="middle"><text x="75" y="186">lower slowly</text><text x="75" y="199">60 in log</text><text x="150" y="186">lower fast</text><text x="150" y="199">40 in log</text><text x="225" y="186">sweep sideways</text><text x="225" y="199" fill="#b44c2c">0 in log</text></g><text x="225" y="160" font-size="10" text-anchor="middle" fill="#b44c2c">true: −5</text><path d="M262,40 L238,58" stroke="#b44c2c" stroke-width="1.5"/><text x="262" y="34" font-size="11" text-anchor="middle" fill="#b44c2c">max</text><text x="150" y="216" font-size="10" text-anchor="middle">Estimates above the mug, illustrative numbers.</text></g></svg><figcaption>The two recorded actions have estimates that real outcomes keep correcting. The unrecorded action's estimate is never checked, and a max can pick it.</figcaption></figure>

[Fujimoto, Meger and Precup (2019)](https://arxiv.org/abs/1812.02900) named this extrapolation error: an error introduced by the mismatch between the dataset and the states and actions the learned policy would visit. The problem isn't limited to actions with zero examples. An action with two noisy examples, or a region the network interpolates poorly, can also produce estimates that the data barely constrains. And it doesn't mean every offline method fails. It means a method has to say what it does about actions the data doesn't support.

My game [Breaking Bellman](https://hadrien-cornier.github.io/breaking-bellman/) has a level that shows this with good data. A simulated arm learns to reach a target from 100 episodes of a controller that ends 0.01 m from the target. An actor-critic method that climbs its own critic, DDPG, ended 0.84 m away. Copying the same 100 episodes ended 0.065 m away (3 seeds, simulation).

<h2 id="sec-offline-methods">Stay close to what the data supports</h2>

The fixes share one idea: limit how far the learner can move from what the data supports. They differ in where they put the limit.

**Behavior cloning (BC)** fits a policy to the recorded actions and never asks a Q-function anything, so it has no extrapolation error. It also can't improve on the data, and it copies whatever is in it. That second point is the subject of the next section.

**Batch-Constrained Q-learning (BCQ)**, from the 2019 paper above, learns a model of which actions appear in each state. When it builds a target, it only considers actions that model finds likely, plus a small learned adjustment. Above the mug, the max runs over lowering slowly and lowering fast, so the target is 3.6 instead of 8.1. The cost is that improvement is limited to actions near the data, and the result depends on how well the action model fits.

**TD3+BC** ([Fujimoto and Gu, 2021](https://arxiv.org/abs/2106.06860)) keeps an ordinary actor-critic and adds one term to the policy objective. In state $s$ with recorded action $a$, the policy $\pi$ maximizes

$$\begin{aligned}
&\lambda\,Q(s,\pi(s))-\big(\pi(s)-a\big)^2,\\
&\lambda=\frac{\alpha}{\frac1N\sum_i|Q(s_i,a_i)|}.
\end{aligned}$$

The first term pulls the action toward higher estimates. The second pulls it back toward the recorded action. Dividing by the average size of $Q$ over the $N$ recorded pairs keeps the balance independent of the reward scale, and the authors use $\alpha=2.5$. It's simple, a few lines added to an existing method. Its limit is the trade-off itself: if a critic error is large enough, the first term can still win, and the second term pulls toward whatever was recorded in that state.

**Conservative Q-Learning (CQL)** ([Kumar et al., 2020](https://arxiv.org/abs/2006.04779)) changes the critic instead of the policy. It adds a term that pushes estimates down on actions the policy would choose and up on actions in the data. The authors show this makes the learned value a lower bound on the policy's true value. The sweep's 9 gets pushed down until it stops attracting the policy. The cost is pessimism: a weight controls how strongly unrecorded actions are pushed down, and too much of it also holds back good actions with few examples.

**Implicit Q-Learning (IQL)** ([Kostrikov, Nair and Levine, 2021](https://arxiv.org/abs/2110.06169)) never evaluates an unrecorded action. Instead of a max, it fits a state value $V(s)$ to an upper **expectile** of the recorded actions' estimates. An expectile is a weighted average that counts values above it more heavily, controlled by $\tau$ between 0 and 1. With $\tau=0.5$ you get the ordinary mean. As $\tau$ approaches 1, it approaches the largest recorded value. Above the mug, with 60% of the log at 4 and 40% at 3:

<div class="ct ct-words">

| $\tau$ | $V$ above the mug | Reading |
| ---: | ---: | --- |
| 0.5 | 3.6 | Average of what operators did |
| 0.9 | about 3.93 | Close to the best recorded action |
| any | never 9 | The sweep is not in the data |

</div>

The Q-function then learns from $r+\gamma V(s')$, so the target never touches the sweep. IQL keeps the value of the transition separate from the action choice, which also stops one lucky transition from looking like a great action. Its limit is the same as every in-sample method: it can only find the best of what was recorded. To turn these values into a policy, it uses advantage weighting, which is the main tool of the next section.

Which one to pick depends on the data. In the same game level with good data, copying ended closest to the target at 0.065 m, IQL at 0.12 m, TD3+BC at 0.20 m and CQL at 0.24 m (3 seeds, simulation). When the log is already good, a reward-aware method has little left to add, and it can cost some precision.

<h2 id="sec-mixed">Copying a mixed log copies the mistakes</h2>

Now change the log. Say 70 attempts came from experienced operators and 30 from a new operator. At the moment the gripper reaches the mug handle, the experienced operators rotate the wrist first and then grasp. The new operator grasps straight in, which often knocks the mug. Both actions are in the data, and both are labeled correctly: the log shows exactly what happened.

Behavior cloning fits every recorded action, because its objective is to make each recorded action likely. An expressive policy reproduces the straight grasp in about 30% of visits to that state. A policy that outputs one action can end up between the two, which is [mode averaging](/robotics/rl-8-mode-averaging/) again. In both cases the new operator's habit becomes part of the robot.

This has nothing to do with extrapolation error. There's no unrecorded action and no inflated estimate. It's the opposite situation: the problem isn't a hole in the data, it's content you didn't want in it. And a method built for the first problem can make the second one worse. BCQ and TD3+BC deliberately keep the policy close to the recorded actions, and here the recorded actions include the mistakes.

There's real evidence that this matters with human teleoperation. In [robomimic (Mandlekar et al., 2021)](https://arxiv.org/abs/2108.03298), operators were grouped by skill, and each group recorded 100 demonstrations. On a task where the robot picks up a square nut and places it on a rod, plain behavior cloning reached 58.7% success when trained on the better operators' 100 demonstrations. Adding the worse operators' 100, for 200 in total, lowered it to 46.7%. On a task where the robot moves a can into a target bin, the same change went from 83.3% to 76.0%. A recurrent copier, BC-RNN, which sees a history of observations instead of only the current one, went the other way on the same two mixtures: 66.0% to 73.3% on the nut and 99.3% to 100.0% on the can. The authors sum it up as most algorithms declining when the worse demonstrations were added, while BC-RNN improved. These are their results, averaged over 3 seeds. The batch RL methods BCQ and CQL did worse than plain behavior cloning on these mixed human datasets, with a binary task-completion reward. So the worse operators' data hurt the simplest copier but not the recurrent one, and the reward-aware methods they tried didn't recover the difference. The paper doesn't isolate why BC-RNN gained, so it doesn't show that a better copier always absorbs bad demonstrations.

<h2 id="sec-reward-aware">Use the reward to tell good actions from bad ones</h2>

[Off-policy learning](/robotics/rl-4-on-policy-and-off-policy/) is what lets us learn from data that someone else collected. But permission to reuse data doesn't say which of the recorded actions were good. Something has to measure that, and the usual measure is the [advantage](/robotics/rl-2-bootstrapping/#sec-gae): how much better an action did than what usually happens from that state.

$$A(s,a)=Q(s,a)-V(s).$$

Say the rotate-then-grasp action has advantage $+1$ and the straight grasp has $-2$. Here are three ways to use those numbers.

**Weight the copy.** **Advantage-Weighted Regression (AWR)** ([Peng et al., 2019](https://arxiv.org/abs/1910.00177)) still fits the recorded actions, but it multiplies each one's importance by $\exp(A/\beta)$, where $\beta>0$ is a temperature:

$$\max_\pi\;\sum_{(s,a)\in\text{log}}\log\pi(a\mid s)\,\exp\!\big(A(s,a)/\beta\big).$$

<div class="ct ct-words">

| Training | Share of the copy going to the good grasp |
| --- | ---: |
| Plain behavior cloning | 70% |
| AWR, $\beta=5$ | 81% |
| AWR, $\beta=1$ | 98% |

</div>

With $\beta=1$, the good grasp's total weight is its 70% share times $e^{1}$, about $1.90$, and the bad one's is $0.3\,e^{-2}\approx0.04$, so about 98% of the copy goes to the good grasp. A large $\beta$ flattens the weights back toward plain copying. The authors clip very large weights because they can make training unstable. IQL extracts its policy the same way, with advantages from its in-sample critic. It writes the factor as $\exp(\beta(Q-V))$, so its $\beta$ is an inverse temperature.

**Tag the copy.** Instead of weighting, give the policy the advantage as an extra input and ask for a high one at test time. [Reward-Conditioned Policies (Kumar, Peng and Levine, 2019)](https://arxiv.org/abs/1912.13465) introduced an advantage-conditioned variant. The idea is that a mediocre action is a perfect example of mediocre behavior, so nothing has to be thrown away. [π\*0.6 (Physical Intelligence, 2025)](https://arxiv.org/abs/2511.14759) applies this to a robot foundation model with one bit: is this action's advantage above a threshold? They set the threshold so that about 30% of the demonstration data counts as positive, and they mark human corrections as positive, which, in their words, is reasonable if experts always provide good corrective actions. Later in the same paper they qualify that assumption: even expert operators can't guarantee a consistent quality of interventions, so the corrections mainly fix large mistakes.

**Pull toward better actions.** TD3+BC's $Q$ term also uses the reward, by tilting the copy toward actions with higher estimates. The squared-distance term still pulls toward every recorded action in that state.

<figure class="rls-figure"><svg xmlns="http://www.w3.org/2000/svg" style="width:min(100%,440px)" viewBox="0 0 300 200" role="img" aria-labelledby="f7-awr-title f7-awr-desc"><title id="f7-awr-title">Advantage weights shift the copy toward the good grasp</title><desc id="f7-awr-desc">Three stacked bars. Plain copying: 70 percent good, 30 percent bad. AWR with temperature 5: 81 percent good. AWR with temperature 1: 98 percent good.</desc><g font-family="Arial,sans-serif" fill="#242622"><g font-size="11"><text x="10" y="54">plain copy</text><text x="10" y="104">AWR, β = 5</text><text x="10" y="154">AWR, β = 1</text></g><rect x="90" y="38" width="140" height="24" fill="#3d6f9e"/><rect x="230" y="38" width="60" height="24" fill="#b44c2c"/><rect x="90" y="88" width="162" height="24" fill="#3d6f9e"/><rect x="252" y="88" width="38" height="24" fill="#b44c2c"/><rect x="90" y="138" width="196" height="24" fill="#3d6f9e"/><rect x="286" y="138" width="4" height="24" fill="#b44c2c"/><g font-size="11" fill="#fff" font-weight="700"><text x="98" y="55">70%</text><text x="98" y="105">81%</text><text x="98" y="155">98%</text></g><text x="10" y="22" font-size="11">Blue: good grasp. Red: straight grasp.</text><text x="150" y="190" font-size="10" text-anchor="middle">Advantages +1 and −2, 70/30 split, illustrative.</text></g></svg><figcaption>The same 100 attempts, weighted three ways. A lower temperature puts almost all of the copy on the good grasp, if the advantages are right.</figcaption></figure>

### What these methods need

All of them work by trusting a number attached to each recorded action. So they need:

- **Rewards that separate good from bad.** With a binary success reward, a hesitant attempt that still succeeds gets the same final reward as a clean one. A discount or a cost per step tells them apart. The length of the episode alone doesn't: with no discount, both returns are 1. That may be part of why reward-aware methods struggled on robomimic's mixed human data, though the paper doesn't isolate the cause.
- **Value estimates that are right on the data.** An advantage is a difference between two learned estimates. If $V$ is wrong, the weights reward the wrong actions.
- **Good actions in the states that matter.** Weighting chooses among recorded actions. If every recorded attempt fumbles one particular step, no weighting produces a clean version of that step.
- **True records.** A false label gets the same trust as a true one.

None of this is guaranteed by a method's name. In the game's version of this problem, the log mixes 50 episodes of a good controller with 50 episodes of random commands. Copying everything ended 0.56 m from the target. IQL ended at 0.22 m, copying only the best episodes at 0.35 m, CQL at 0.33 m, TD3+BC at 0.50 m, the one-bit advantage tag at 0.51 m, and AWR at 0.57 m, no better than copying (3 seeds, 8,000 training steps, simulation). In this toy, how the advantage was estimated mattered more than the idea of weighting.

<div class="ct ct-words">

| Method | Uses | Helps when | Limits |
| --- | --- | --- | --- |
| Behavior cloning | Actions only | The log is uniformly good | Copies mistakes and can't beat the data |
| Copy the best episodes | Episode returns | Good and bad episodes are easy to rank | Throws data away, and ranks whole episodes, not steps |
| AWR | Advantage from fitted returns | Advantages are accurate | Temperature to tune, and noisy returns give noisy weights |
| IQL | In-sample Q and expectile V | Good actions are recorded somewhere | Best of the data at most, with $\tau$ and $\beta$ to tune |
| Advantage conditioning | Advantage as an input | Many data sources of different quality | Depends on the advantage estimate and threshold |
| TD3+BC | Q gradient plus copy term | Data near good actions, modest critic error | Copy term pulls toward recorded mistakes too |

</div>

<h2 id="sec-corruption">Bad behavior or bad records?</h2>

Everything above assumed the log tells the truth. The new operator's straight grasp really happened, in the recorded state, with the recorded result. That's **poor behavior**: bad actions with correct labels. Reward-aware reuse can handle it, under the conditions in the list.

**Corrupted data** is different: the record itself is false. A few ways that happens on a robot:

- The camera frames and the arm commands are logged with a clock offset, so each action is paired with an image from a different moment.
- The log stores the command sent to the arm, but the arm couldn't follow it, so the recorded action isn't what the arm did.
- A failed grasp is marked as a success, so its reward is wrong.

A reward-aware method takes every record at face value. A false success has a high advantage, so AWR gives it a large weight and the advantage tag marks it as good. Off-policy learning can't repair this either: it can reuse a transition from another policy, but only if that transition is real. These fixes belong to the data pipeline: synchronize the clocks, record the executed action next to the command, audit success labels, and drop episodes that fail consistency checks.

<div class="ct ct-words">

| | Extrapolation error | Poor behavior | Corrupted records |
| --- | --- | --- | --- |
| What's wrong | A question the data can't answer | Bad actions, true labels | False states, actions or rewards |
| Example above the mug | Sweep never recorded, estimate 9 | Straight grasp recorded, often fails | Failed grasp labeled success |
| What helps | BCQ, CQL, IQL, TD3+BC, BC | AWR, IQL, advantage conditioning, filtering | Fixing the data pipeline |
| What doesn't | Replaying the log more often | Copying everything | Any method that trusts the labels |

</div>

The next part looks at a problem that remains even when every demonstration is good and correctly recorded: two good ways to do the same thing. [Part 8: mode averaging](/robotics/rl-8-mode-averaging/).

<details>
<summary>Sources and what each one supports</summary>

- **Extrapolation error and BCQ.** [Fujimoto, Meger and Precup, 2019](https://arxiv.org/abs/1812.02900), Section 3 (definition and causes: absent data, model bias, training mismatch) and Section 4 (batch-constrained action selection).
- **TD3+BC.** [Fujimoto and Gu, 2021](https://arxiv.org/abs/2106.06860), Section 5, equations 3 to 5, with $\alpha=2.5$ and state normalization.
- **CQL.** [Kumar, Zhou, Tucker and Levine, 2020](https://arxiv.org/abs/2006.04779), abstract and Section 3: a conservative Q-function whose expected value lower-bounds the policy's value.
- **IQL.** [Kostrikov, Nair and Levine, 2021](https://arxiv.org/abs/2110.06169), Section 4: expectile loss, $V$ fitted over dataset actions (equation 5), $Q$ fitted to $r+\gamma V(s')$ (equation 6), advantage-weighted extraction (equation 7). The 3.93 is a calculation for the two-value example: the 0.9 expectile $m$ solves $0.9\cdot0.6(4-m)=0.1\cdot0.4(m-3)$.
- **AWR.** [Peng, Kumar, Zhang and Levine, 2019](https://arxiv.org/abs/1910.00177): weights $\exp(A/\beta)$, clipped at a maximum, usable with fully off-policy data. The 70%, 81% and 98% are calculations for the illustrative advantages.
- **Advantage conditioning.** [Kumar, Peng and Levine, 2019](https://arxiv.org/abs/1912.13465), Section 4 (advantage-conditioned variant). [π\*0.6, Physical Intelligence, 2025](https://arxiv.org/abs/2511.14759), Section IV equation 3, Section V on the limits of human corrections, and the appendix on thresholds (about 30% positive in pre-training, about 40% of rollouts in fine-tuning).
- **robomimic.** [Mandlekar et al., 2021](https://arxiv.org/abs/2108.03298), Section 2 (operator proficiency, missed grasps) and Section 4.2, Table 2 (success rates over 3 seeds, with 100 demonstrations in the Better and Worse subsets and 200 in the mixtures; BC and BC-RNN columns, and the authors' statement that most algorithms decline while BC-RNN improves). Task descriptions from Section 3.1. Binary task-completion rewards, Appendix C. Author-reported, in their 2021 setup and hyperparameters.
- **Breaking Bellman.** Offline reach levels from the game's [experiment log](https://github.com/Hadrien-Cornier/breaking-bellman/blob/681cae3820f05f8604d212c0ab048ebf0e017e73/EXPERIMENTS.md) and `web/measured.js` at commit 681cae3. Expert data: 100 controller episodes. Mixed data: 50 controller and 50 random-command episodes. 3 seeds, and distances are final tip distances. Simulation of a two-link arm, not a real robot.
- **Mug example.** The estimates 4, 3 and 9, the 70/30 split and the advantages +1 and −2 are made up to show the mechanisms.

</details>
