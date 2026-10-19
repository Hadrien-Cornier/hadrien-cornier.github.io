---
title: 'A robot that keeps its fixes: how NVIDIA ASPIRE learns without training'
description: 'ASPIRE lets a coding agent debug robot programs from execution traces and save each verified fix as a text skill. What the loop does, and what the numbers cover.'
date: '2026-10-19'
tags: ['code-as-policy', 'agents', 'skill-learning', 'nvidia']
---

A simulated robot has to pick up a red radio. It finds the radio, 1.91 m away, and starts to drive over. Then `navigate_to_pose` returns `PLANNING_ERROR`. It does it again, and again.

The camera works and the grasp code works. The problem is the goal. Every spot the program picked lies within about 20 cm of the table edge, inside the planner's collision buffer, so the planner rejects all of them. The fix is small: approach the radio from other sides of it, and keep the first side that works. ([ASPIRE paper](https://research.nvidia.com/labs/gear/aspire/assets/Aspire.pdf), Fig. 2)

Normally that fix lives in one program for one task. The next task starts cold. NVIDIA's [ASPIRE](https://arxiv.org/abs/2607.00272) asks a different question: **what if the robot kept the fix, in a form the next task can read?**

## What ASPIRE is

ASPIRE moves learning out of the weights and into text. Four facts define it:

- **No policy network and no gradient descent.** A coding agent, Claude Code or Codex, writes Python against a fixed robot API for perception, grasping and motion planning.
- **"Training" is debugging.** The agent runs its program in simulation, reads what went wrong, and rewrites it.
- **The "trained model" is a folder of text notes.** Each note records one verified fix. Later tasks read the notes as in-context guidance.
- **The model stays frozen.** All the learning sits in the notes, the programs and the search around a language model.

The authors are from NVIDIA, UMich, UIUC, UC Berkeley and CMU. Yuke Zhu, Linxi "Jim" Fan and Guanzhi Wang are the project leads. The [code](https://github.com/NVlabs/ASPIRE) is Apache 2.0.

## The loop

<figure class="article-figure">
<svg viewBox="0 0 460 372" role="img" aria-labelledby="fig-aspire-t fig-aspire-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-aspire-t">The ASPIRE loop: write, execute, trace, repair, verify, remember</title><desc id="fig-aspire-d">A task enters the actor, a coding agent that writes a robot program. The program goes to the execution engine, which records a trace of every perception, grasp and planning call. The trace returns to the actor, which diagnoses, repairs and re-runs. The actor turns a validated fix into a proposed skill. A fresh verifier agent must reproduce the fix from the proposal alone, and only then does the skill enter the skill library. The library feeds the actor on later tasks. Evolutionary search lets the actor try several programs per round, seeded by the best programs and their traces.</desc><defs><marker id="fig-aspire-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#242622"/></marker><marker id="fig-aspire-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#b44c2c"/></marker></defs><rect x="0.75" y="0.75" width="458.5" height="370.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><g stroke-width="1.5"><rect x="8" y="40" width="130" height="64" fill="#f6e4dc" stroke="#b44c2c"/><rect x="165" y="40" width="130" height="64" fill="#fff" stroke="#242622"/><rect x="322" y="40" width="130" height="64" fill="#fff" stroke="#242622"/><rect x="8" y="140" width="130" height="64" fill="#fff" stroke="#242622"/><rect x="165" y="140" width="130" height="64" fill="#d7e5ee" stroke="#2b6a8e"/><rect x="8" y="240" width="130" height="64" fill="#f6e4dc" stroke="#b44c2c"/><rect x="165" y="240" width="130" height="64" fill="#d7e5ee" stroke="#2b6a8e"/></g><g fill="none" stroke="#242622" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M230,10 V38" marker-end="url(#fig-aspire-a)"/><path d="M140,72 H163" stroke="#b44c2c" marker-end="url(#fig-aspire-r)"/><path d="M297,72 H320" marker-start="url(#fig-aspire-a)" marker-end="url(#fig-aspire-a)"/><path d="M200,104 V138" marker-end="url(#fig-aspire-a)"/><path d="M230,204 V238" marker-end="url(#fig-aspire-a)"/><path d="M297,272 H310 V122 H270 V106" marker-end="url(#fig-aspire-a)"/><path d="M165,96 H150 V272 H140" marker-end="url(#fig-aspire-a)"/><path d="M73,238 V206" marker-end="url(#fig-aspire-a)"/><path d="M73,138 V106" stroke="#b44c2c" marker-end="url(#fig-aspire-r)"/></g><g text-anchor="middle" font-size="13" font-weight="700"><text x="73" y="60">Skill library</text><text x="230" y="60">Actor</text><text x="387" y="60" font-size="12.5">Evolutionary search</text><text x="73" y="160">Verifier</text><text x="230" y="160">Execution engine</text><text x="73" y="260">Proposed skill</text><text x="230" y="260">Trace per call</text></g><g text-anchor="middle" font-size="11.5" fill="#4a4d47"><text x="73" y="77">one text note</text><text x="73" y="92">per verified fix</text><text x="230" y="77">coding agent writes</text><text x="230" y="92">a Python program</text><text x="387" y="77">K programs a round,</text><text x="387" y="92">from top 3 + traces</text><text x="73" y="177">fresh agent, proposal</text><text x="73" y="192">only, 5 seeds</text><text x="230" y="177">runs perception, grasp</text><text x="230" y="192">and motion planning</text><text x="73" y="277">from a validated fix:</text><text x="73" y="292">signature, when, repair</text><text x="230" y="277">inputs, outputs, status,</text><text x="230" y="292">RGB before and after</text></g><g font-size="11.5" fill="#656b62"><text x="240" y="24">task + debug seeds</text><text x="208" y="126">program</text><text x="238" y="225">records</text><text x="318" y="180">diagnose,</text><text x="318" y="195">repair,</text><text x="318" y="210">re-run</text><text x="82" y="226" fill="#b44c2c">verify</text><text x="82" y="126" fill="#b44c2c">promote</text></g><g text-anchor="middle" font-size="12" fill="#656b62"><text x="230" y="336">Debug seeds drive the loop. Held-out seeds run once, at the end.</text><text x="230" y="354">Red: what persists between tasks. Blue: the environment.</text></g></g></svg>
<figcaption>The ASPIRE loop, redrawn from the paper's Fig. 1 and Sections 2.1 to 2.3. Red boxes persist across tasks. The actor never sees full video: the engine keeps the frames just before and after each primitive call.</figcaption>
</figure>

Terms in the drawing:

- **Debug seeds** are the simulated scenes the loop learns on. A seed fixes object poses, distractors and the starting state.
- **Held-out seeds** are fresh scenes. The final program runs on them once, and that run gives the reported score.
- **K** is the number of candidate programs per search round.

Each of the four parts fixes one gap in earlier robot coding agents:

1. **Execution engine** replaces "it failed" with "this call failed". It records every perception, planning and grasp call: the API, inputs, outputs, return status, and RGB frames before and after.
2. **Skill library** replaces discarded fixes with kept ones. Skills are induced from validated repairs, and the authors did not fix the taxonomy in advance. The paper lists localization tricks, prompts, grasp rules, navigation recovery, motion primitives and debugging workflows.
3. **Evolutionary search** replaces patching one bad strategy with trying several. It samples K programs per round and conditions the next round on the best ones and their remaining failures.
4. **Coordinator** replaces an arbitrary task order with a curriculum. At the end it reruns low-scoring tasks once with the final library, so early tasks benefit from later skills.

## What a skill looks like

The radio fix becomes a note with a failure signature, a trigger and a repair. This is the "Multi-Angle Approach" entry from the paper's Appendix A, shortened:

```text
skill:  multi-angle approach (navigation)
signature:
  navigate_to_pose returns PLANNING_ERROR,
  or "succeeds" but ends > 1 m from the target
apply when:
  the object is near walls, furniture or a boundary
repair:
  for angle in [0, +90, -90, +45, -45] degrees:
    goal = object - dist * rotate(unit, angle)
    if navigate_to_pose(goal): break
```

The note is not a radio-pickup program. It is a recovery pattern that a bottle or a soda can can reuse.

In the released repo the library is plain markdown in [`.claude/skills/iterative-debugging/skills/`](https://github.com/NVlabs/ASPIRE/tree/fa00f0ef2bc1d91d594b9aa502c22133c9f538f7/.claude/skills/iterative-debugging/skills): `grasp.md`, `localize.md`, `transport.md`, `manipulation.md`. This entry comes from [`grasp.md`](https://github.com/NVlabs/ASPIRE/blob/fa00f0ef2bc1d91d594b9aa502c22133c9f538f7/.claude/skills/iterative-debugging/skills/grasp.md), with the markdown removed and the lines rewrapped:

```text
Grasp with close_gripper(), never set_gripper(0.0): they are
not equivalent. close_gripper() accepts a contact stall as
success: the jaw stops on the object, the call returns
ok=True, and the harness records the commanded gripper as closed.

close_gripper()                  # correct: contact stall counts as closed
# set_gripper(0.0)               # WRONG when grasping: times out,
                                 # leaves stale open command
```

The file mixes a starting code template with entries added during runs. I can't tell from the file which lines a person wrote and which an agent did.

An entry arrives by one route:

- A task agent proposes the skill and reports the failure mode, the validated fix and the success rate on debug seeds.
- A fresh verifier agent gets the library and the proposal, but not the proposer's code. It must reach the fix on 5 seeds within 2 attempts.
- The coordinator promotes the entry only if the verifier reproduced it. Otherwise it is refuted and stays out.

## Search, in pseudocode

This is a simplified version of the paper's Algorithm 1.

```text
history = [(p0, score0, trace0)]   # debug seeds
for round in 1..R:                 # R = budget
    candidates = propose(agent, task,
                         top3(history), library)  # K programs
    for p in candidates:
        score, trace = execute(p, debug_seeds)
        history.add(p, score, trace)
    if best_score(history) >= tau:  # tau = threshold
        break
skills = extract_validated_patterns(history)
final  = execute(best_program(history),
                 heldout_seeds)     # run once
```

Symbols in the pseudocode:

- $p_0$ is the first program, with `score0` and `trace0` from its run on the debug seeds.
- `R` is the number of search rounds, and `tau` is the success score at which the search stops.
- `top3(history)` returns the three best programs so far with their traces. `library` is the set of skill notes.
- `K` is the number of programs the agent proposes per round.

The held-out seeds appear in the last line only. That is how the paper keeps the reported success rate honest. Every LIBERO-Pro number below is a macro-average:

$$\bar{s} = \frac{1}{T}\sum_{t=1}^{T}\frac{1}{S}\sum_{s=1}^{S}\mathbf{1}\big[\text{task } t \text{ succeeds on held-out seed } s\big]$$

Here $T = 10$ tasks per suite and perturbation, and $S = 50$ held-out seeds. A seed fixes object poses, distractors and the initial state.

## What the numbers say

The model sets the ceiling, and the loop and the library lift a weaker model toward it. Four benchmarks and one baseline appear below:

- **LIBERO-Pro**: tabletop manipulation in simulation with four suites: Object, Goal, Spatial and Long. A *position* perturbation changes where objects sit, for example a bowl in front of the plate. A *task* perturbation changes the instruction wording.
- **Robosuite**: contact-rich one-arm and two-arm tasks such as stacking, nut assembly and a two-arm handover.
- **BEHAVIOR-1K**: long household tasks for a mobile robot, such as navigating to a radio and picking it up.
- **CaP-Agent0**: the baseline coding agent from the same lab. It uses visual differencing, a predefined skill library and retries on each episode.

<div class="table-scroll">
<table>
<thead><tr><th>Result</th><th>Setup</th><th>Compared with</th></tr></thead>
<tbody>
<tr><td>Bimanual handover <strong>20% to 92%</strong></td><td>Robosuite <code>two_arm_handover</code>, 100 held-out trials, Claude Opus 4.6. One program per task.</td><td>CaP-Agent0 at 20%. It regenerates a program for every seed, with test-time retries. (Table 6)</td></tr>
<tr><td>LIBERO-Pro Long, zero-shot <strong>30.5%</strong></td><td>Skills from all 90 LIBERO-90 tasks, no debugging at test time, Opus 4.6. 23% position, 38% task perturbation.</td><td>CaP-Agent0 3.8%, π0.5 5.0%. The empty library scores 4.7%. (Table 8)</td></tr>
<tr><td>All 80 LIBERO-Pro tasks <strong>99%</strong></td><td>Claude Opus 5.5, iterative debugging. Object, Goal and Spatial 98.9%, Long 97.9%.</td><td>Opus 4.6 averages 62% on Object, Goal and Spatial without search, 72% with it. (Sec. 3.8)</td></tr>
<tr><td>Component ablation <strong>14% to 62% to 72%</strong></td><td>LIBERO-Pro macro-average, Opus 4.6. Base system, then the engine, then search.</td><td>The engine gives the largest gain. (Fig. 7)</td></tr>
</tbody>
</table>
</div>

Two notes on the headline numbers:

- The abstract's "72%" on handover is the **gain** in points, from 20% to 92%. It isn't a success rate.
- The 99% comes from the newer project PDF and the v1.0 repo release. The arXiv page still shows only v1, which has the Opus 4.6 numbers. The paper's own wording is "99% average success across all 80 LIBERO-Pro tasks". The repo news line adds "selected Robosuite, BEHAVIOR-1K tasks" to the same sentence, but the paper reports those separately, at 100% on its representative tasks.

### The skill library is what moves zero-shot

The same Opus 4.6 agent solves LIBERO-Pro Long at 4.7% with an empty library. Seeding the library from more LIBERO-90 tasks lifts it (paper Table 8):

<div class="table-scroll">
<table>
<thead><tr><th>Library built from</th><th>Zero-shot success</th><th></th></tr></thead>
<tbody>
<tr><td>0 tasks</td><td>4.7%</td><td><span class="aspire-bar" style="width:15.5%"></span></td></tr>
<tr><td>25 tasks</td><td>13.7%</td><td><span class="aspire-bar" style="width:44.9%"></span></td></tr>
<tr><td>50 tasks</td><td>21.5%</td><td><span class="aspire-bar" style="width:70.5%"></span></td></tr>
<tr><td>90 tasks</td><td>30.5%</td><td><span class="aspire-bar" style="width:100%"></span></td></tr>
<tr><td>CaP-Agent0 (baseline)</td><td>3.8%</td><td><span class="aspire-bar aspire-bar-base" style="width:12.5%"></span></td></tr>
</tbody>
</table>
</div>

The average rises smoothly. Single tasks don't. In the paper's per-task table (Table 9), "Cream cheese + butter" under position perturbation goes 0%, 0%, 6%, 94% as the library grows. "Soup + tomato sauce" under the same perturbation goes 0%, 14%, 20%, 0%. A bigger library helped one task a lot and removed the gain on another.

### The model decides most of it

The paper holds the environment, API, seeds and protocol fixed and swaps only the language model. The setup is 10 LIBERO-Pro Goal tasks, position perturbation, 50 held-out seeds each, an empty library and no search (Table 18):

| Model | Held-out success | Estimated cost, 10 tasks |
|---|---|---|
| Claude Opus 5.5 | 99.2% | $183 |
| Claude Sonnet 5.5 | 98.8% | $121 |
| Claude Fable 5.1 | 96.6% | $422 |
| GPT-6 Astra | 94.4% | $354 |
| Claude Opus 5 | 90.6% | $597 |
| GPT-6.1 Sol | 88.0% | $95 |
| Kimi K3 (open weights) | 78.4% | $582 |
| Claude Haiku 5.5 | 68.0% | $40 |
| GPT-6 Sol | 59.2% | $76 |
| Qwen 3.8 Max (open weights) | 56.0% | $398 |
| Claude Opus 4.6 | 55.6% | $236 |
| GPT-6 Luna | 14.8% | $8 |

Success goes from 15% to 99% across models, and price does not track it. Opus 5 costs $597 for 90.6%. Sonnet 5.5 costs $121 for 98.8%. Search matters less as models improve. On Object, Goal and Spatial it changes success by at most 2% for Opus 5, GPT-6 Astra and Opus 5.5, against up to 34% for Opus 4.6.

Stronger models also change strategy. On "put the book under the low shelf", Opus 5.5 knocks the book flat without grasping it and pushes it under (68% success). Opus 4.6 carries it above the cabinet and stalls (0%). No model finds the human's move of tilting the book by its top edge. (Sec. 3.9, Fig. 10: one episode per row, so it shows strategies, not matched trials.)

## On a real robot

Skills cut debugging cost on all three real tasks and raised success on two. The tests use a bimanual YAM station, a different embodiment and API from the Franka simulation. The agent is Codex with GPT-5.5. Skills found in simulation are given as in-context guidance. The agent still debugs through real execution (paper Table 1, 20 evaluation trials):

| Task | Success without skills | Success with skills | Total tokens without, with |
|---|---|---|---|
| Put bowl on plate | 20/20 | 20/20 | 8.65M, 5.11M |
| Lift soda can | 13/20 | 19/20 | 61.94M, 6.58M |
| Open and push drawer | 0/20 | 11/20 | 334.92M, 81.67M |

For the drawer, the no-skill run used up its token budget without producing a successful evaluation program.

The Rubik's Cube result is a different test. It is online learning on one real session of three episodes with GPT-6 Astra. Here is how it ran:

- **What it was given.** A human wrote text guidance first, and a symbolic solver (Kociemba) supplied the move sequence. The agent had to turn those moves into physical turns.
- **What it learned.** It wrote text skills for things like two-layer support, face-axis alignment and slip recovery. The paper says this is "context refinement rather than model-weight updates".
- **Outcome.** Episode 1 stayed unsolved after 50 min 54 s. Episodes 2 and 3 solved the cube, in 39 min and 77 min 10 s.
- **Efficiency.** The episodes completed 3, 5 and 25 face turns. Time per turn fell from 16 min 58 s to 7 min 48 s to 3 min 5 s. Tokens per turn fell from 11.27M to 2.01M, and estimated cost from $16.85 to $2.89.

Each episode had a different number of turns, so the per-turn drop is a trend within one session.

## Where it breaks

The loop works when the model is strong and the API covers the task. Every limit below comes from one of those two conditions or from verification.

- **It depends on the model.** The authors write that ASPIRE "relies on a frozen LLM" and that their best results use proprietary frontier models. The best open-weight model in the study reaches 78%.
- **Weak models are noisy.** Three independent Opus 4.6 runs from an empty library score 59.2%, 67.4% and 62.8% on the same suite. On "open middle drawer" the same setup gave 0%, 100% and 0% (Table 25).
- **A skill is verified on its source task.** The repo says it directly: passing "shows the text transmits, not that it transfers". Transfer shows up only later, as other tasks grade the skill useful.
- **The API bounds the robot.** Programs use a predefined set of perception, planning and control primitives. A behavior outside that set needs a human to extend the API.
- **Libraries go stale.** Old entries can turn overly specific or misleading, and the authors say retrieval and pruning are not solved.
- **The real world is not a loop yet.** The paper says ASPIRE is "not yet a fully autonomous real-world lifelong learner". Real runs still need success detection, safe resets and calibration.
- **It runs generated code.** The repo warns that ASPIRE executes model-written Python with full import access. Run it on an isolated host.

## My read

- **The unit of memory is right.** Programs rarely repeat across tasks. Failures do: planner errors near furniture, bottles that tip, ambiguous "front bowl" language. A conditional note with a signature and a trigger matches how these failures recur.
- **Admission is the weak spot.** A verifier that reproduces a fix on its own source task checks that the note is readable. The zero-shot table shows that transfer is lumpy. The paper does not report an ablation of this verifier.
- **The model is the lever.** With everything else fixed, success goes from 15% to 99% by swapping the language model. The paper's library-size curve uses Opus 4.6. I did not find the same curve for the newer models, so I can't say how much the library adds when the model is already strong.

What I like most is the format. A fix you can read, diff and revert is easier to trust than a change buried in weights. It is also exactly why the model and the API are the ceiling.

<details>
<summary>Sources and versions</summary>

- Paper: Lu, Wu, Kou et al., [ASPIRE: Agentic /Skills Discovery for Robotics](https://arxiv.org/abs/2607.00272), arXiv 2607.00272, v1 submitted 30 June 2026. It is the only arXiv version as of 19 October 2026. Its numbers use Claude Opus 4.6.
- Project PDF: the [later version](https://research.nvidia.com/labs/gear/aspire/assets/Aspire.pdf) adds Claude Opus 5.5, the twelve-model comparison, the Rubik's Cube and Jan Kautz as an author. Model ablations, Table 1, Table 18 and the 99% claim come from it.
- Code: [NVlabs/ASPIRE](https://github.com/NVlabs/ASPIRE), v1.0 release commit `fa00f0e`, 15 October 2026.
- Every number above comes from the paper or the repo. I did not rerun any experiment.
- All success rates are simulated unless the section says real robot.

</details>
