---
title: 'ASPIRE: Can you zero-shot robotics with a coding agent?'
description: 'ASPIRE lets a coding agent debug robot programs from execution traces and save each verified fix as a text skill. What the loop does, and what the numbers cover.'
date: '2026-10-19'
tags: ['code-as-policy', 'agents', 'skill-learning', 'nvidia']
section: 'recent-papers'
thumbnail: /assets/robotics/thumbnails/can-you-zero-shot-robotics-with-a-coding-agent.jpg
thumbnail_alt: 'The ASPIRE loop: write a robot program, run it, inspect the trace, repair and verify it, and keep the skill.'
---

A simulated robot has to pick up a red radio. It finds the radio, 1.91 m away, and starts to drive over. Then `navigate_to_pose` returns `PLANNING_ERROR`. It does it again, and again.

The camera works and the grasp code works. The problem is the goal. Every spot the program picked lies within about 20 cm of the table edge, inside the planner's collision buffer, so the planner rejects all of them. The fix is small: approach the radio from other sides of it, and keep the first side that works. ([ASPIRE paper](https://research.nvidia.com/labs/gear/aspire/assets/Aspire.pdf), Fig. 2)

Normally that fix lives in one program for one task. The next task starts cold. NVIDIA's [ASPIRE](https://arxiv.org/abs/2607.00272) asks a different question: **what if the robot kept the fix, in a form the next task can read?**

<figure class="article-figure">
<video autoplay muted loop playsinline controls preload="metadata" aria-label="ASPIRE discovering skills across simulation and real-robot tasks.">
<source src="https://research.nvidia.com/labs/gear/aspire/assets/videos/skill_discovery.mp4" type="video/mp4">
<a href="https://research.nvidia.com/labs/gear/aspire/assets/videos/skill_discovery.mp4">Watch the video</a>
</video>
<figcaption>ASPIRE discovering skills across simulation and real-robot tasks. Video: NVIDIA GEAR and the ASPIRE authors, from the <a href="https://research.nvidia.com/labs/gear/aspire/">project page</a>. Embedded from NVIDIA's server, not copied.</figcaption>
</figure>

## Why this one matters

A coding agent can now program a robot to do new tasks, and it gets better each time a better model arrives.

Coding agents already changed how software gets written: the agent writes code, runs it, reads the failure and tries again. Other knowledge work followed, with agents zero-shotting problems that used to need a specialist. ASPIRE puts a robot at the end of that loop. It works on a long list of simulated tasks and on a few real ones.

- **No robot policy gets trained.** The behavior is a Python program that a coding agent wrote and debugged. The language model is pretrained and ASPIRE leaves it frozen, so "no RL" means no policy trained for these tasks, not no learning anywhere.
- **The trained baselines trail it.** In the paper's LIBERO-Pro runs, π0.5, a trained vision-language-action policy, scores 0% to 38% across six conditions. ASPIRE with Claude Opus 4.6 scores 45% to 98% (Table 5).
- **It is open.** At launch Jim Fan wrote, "We'll open-source the full stack so your own robot library starts compounding from ours!" ([post](https://x.com/DrJimFan/status/2072004190856212902), 30 June 2026). The [repo](https://github.com/NVlabs/ASPIRE) is Apache 2.0, and v1.0 shipped on 15 October.

### The Bitter Lesson and the tension

Rich Sutton's [Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html) (2019) says "general methods that leverage computation are ultimately the most effective, and by a large margin." He adds that "building in how we think we think does not work in the long run."

Jim Fan's [v1.0 post](https://x.com/DrJimFan/status/2111128797181567466) (16 October 2026) applies that to robots: "On the day Astra arrived, our lab switched the backend model and saturated all the benchmarks to ~99% over night." He closes with "Now you can also feel the Physical Bitter Lesson at home like we did on that fateful day ;)". His framing is that the language model, trained on data and compute, is the general method. ASPIRE is the thin layer that lets a better model drive a robot.

That framing meets a real tension. ASPIRE is full of human-built structure: a fixed API of perception, planning and control primitives, hand-written prompts for the actor, verifier and coordinator, and hand-set admission rules. The paper's own numbers lean toward Sutton, and this part is my inference:

- Swapping the model moved LIBERO-Pro Goal success from 15% to 99%. The engine and search together moved Opus 4.6 from 14% to 72%.
- With strong models, search changes success by at most 2% on Object, Goal and Spatial.
- The post's "~99%" fits Opus 5.5. For GPT-6 Astra the paper reports 98% on Object, Goal and Spatial, and 87.9% on Long (Tables 3, 4, 17 and Sec. 3.8).

The structure still sets a ceiling: the API bounds what a program can express.

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

<figure class="article-figure">
<video muted loop playsinline controls preload="none" poster="https://research.nvidia.com/labs/gear/aspire/assets/videos/posters/method/how_aspire_works.jpg" aria-label="The authors' animation of how ASPIRE works.">
<source src="https://research.nvidia.com/labs/gear/aspire/assets/videos/method/how_aspire_works.mp4" type="video/mp4">
<a href="https://research.nvidia.com/labs/gear/aspire/assets/videos/method/how_aspire_works.mp4">Watch the video</a>
</video>
<figcaption>The authors' own animation of the loop. Video: NVIDIA GEAR and the ASPIRE authors, from the <a href="https://research.nvidia.com/labs/gear/aspire/">project page</a>. Embedded from NVIDIA's server, not copied.</figcaption>
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

### Against the baselines

<figure class="article-figure">
<svg viewBox="0 0 480 370" role="img" aria-labelledby="fig-robosuite-t fig-robosuite-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-robosuite-t">Robosuite: ASPIRE and the CaP-Agent0 baseline, seven tasks</title><desc id="fig-robosuite-d">Paired horizontal bars of success on seven Robosuite tasks for the CaP-Agent0 baseline and for ASPIRE with Claude Opus 4.6. The largest gap is two_arm_handover, 20 percent against 92 percent. ASPIRE is lower on two_arm_lift, 74 against 71, and on spill_wipe, 100 against 99.</desc><rect x="0.75" y="0.75" width="478.5" height="368.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><text x="240.0" y="22" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" fill="#242622" font-weight="700" >Robosuite: ASPIRE and the CaP-Agent0 baseline, seven tasks</text><rect x="128" y="34" width="11" height="11" fill="#a9ada3"/><text x="144" y="44" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >CaP-Agent0</text><rect x="238.0" y="34" width="11" height="11" fill="#b44c2c"/><text x="254.0" y="44" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >ASPIRE (Opus 4.6)</text><line x1="128.0" y1="56" x2="128.0" y2="300" stroke="#cfd1c8"/><text x="128.0" y="314" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >0%</text><line x1="201.0" y1="56" x2="201.0" y2="300" stroke="#cfd1c8"/><text x="201.0" y="314" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >25%</text><line x1="274.0" y1="56" x2="274.0" y2="300" stroke="#cfd1c8"/><text x="274.0" y="314" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >50%</text><line x1="347.0" y1="56" x2="347.0" y2="300" stroke="#cfd1c8"/><text x="347.0" y="314" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >75%</text><line x1="420.0" y1="56" x2="420.0" y2="300" stroke="#cfd1c8"/><text x="420.0" y="314" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >100%</text><text x="120" y="83.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >cube_lift</text><rect x="128" y="66.0" width="283.2" height="12.0" fill="#a9ada3"/><text x="416.24" y="76.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >97%</text><rect x="128" y="79.0" width="283.2" height="12.0" fill="#b44c2c"/><text x="416.24" y="89.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >97%</text><text x="120" y="117.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >cube_stack</text><rect x="128" y="100.0" width="286.2" height="12.0" fill="#a9ada3"/><text x="419.16" y="110.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >98%</text><rect x="128" y="113.0" width="289.1" height="12.0" fill="#b44c2c"/><text x="422.08" y="123.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >99%</text><text x="120" y="151.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >cube_restack</text><rect x="128" y="134.0" width="259.9" height="12.0" fill="#a9ada3"/><text x="392.88" y="144.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >89%</text><rect x="128" y="147.0" width="292.0" height="12.0" fill="#b44c2c"/><text x="425.0" y="157.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >100%</text><text x="120" y="185.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >spill_wipe</text><rect x="128" y="168.0" width="292.0" height="12.0" fill="#a9ada3"/><text x="425.0" y="178.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >100%</text><rect x="128" y="181.0" width="289.1" height="12.0" fill="#b44c2c"/><text x="422.08" y="191.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >99%</text><text x="120" y="219.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >two_arm_handover</text><rect x="128" y="202.0" width="58.4" height="12.0" fill="#a9ada3"/><text x="191.4" y="212.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >20%</text><rect x="128" y="215.0" width="268.6" height="12.0" fill="#b44c2c"/><text x="401.64" y="225.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >92%</text><text x="120" y="253.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >two_arm_lift</text><rect x="128" y="236.0" width="216.1" height="12.0" fill="#a9ada3"/><text x="349.08000000000004" y="246.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >74%</text><rect x="128" y="249.0" width="207.3" height="12.0" fill="#b44c2c"/><text x="340.32" y="259.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >71%</text><text x="120" y="287.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >nut_assembly</text><rect x="128" y="270.0" width="1.0" height="12.0" fill="#a9ada3"/><text x="133.0" y="280.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >0%</text><rect x="128" y="283.0" width="26.3" height="12.0" fill="#b44c2c"/><text x="159.28" y="293.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >9%</text><text x="240.0" y="334" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Success over 100 held-out trials per task. Mean: 68% against 81%.</text><text x="240.0" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >P2 Table 6. CaP-Agent0 regenerates a program per seed, with retries.</text></svg>
<figcaption>Robosuite success over 100 held-out trials per task. ASPIRE is not ahead on every task: it is level or slightly behind on `two_arm_lift` and `spill_wipe`. Values from the paper's Table 6.</figcaption>
</figure>

<figure class="article-figure">
<svg viewBox="0 0 480 396" role="img" aria-labelledby="fig-libero-t fig-libero-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-libero-t">LIBERO-Pro: three methods, six conditions</title><desc id="fig-libero-d">Grouped horizontal bars of success on LIBERO-Pro Object, Goal and Spatial suites under position and task perturbations for pi0.5, CaP-Agent0 and ASPIRE with Claude Opus 4.6. ASPIRE leads in every condition. Its Goal task perturbation score of 45 percent is the lowest, and pi0.5 scores near zero under task perturbations.</desc><rect x="0.75" y="0.75" width="478.5" height="394.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><text x="240.0" y="22" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" fill="#242622" font-weight="700" >LIBERO-Pro: three methods, six conditions</text><rect x="132" y="34" width="11" height="11" fill="#7a8f9c"/><text x="148" y="44" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >pi0.5</text><rect x="209.0" y="34" width="11" height="11" fill="#a9ada3"/><text x="225.0" y="44" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >CaP-Agent0</text><rect x="319.0" y="34" width="11" height="11" fill="#b44c2c"/><text x="335.0" y="44" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >ASPIRE (Opus 4.6)</text><line x1="132.0" y1="56" x2="132.0" y2="326" stroke="#cfd1c8"/><text x="132.0" y="340" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >0%</text><line x1="204.0" y1="56" x2="204.0" y2="326" stroke="#cfd1c8"/><text x="204.0" y="340" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >25%</text><line x1="276.0" y1="56" x2="276.0" y2="326" stroke="#cfd1c8"/><text x="276.0" y="340" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >50%</text><line x1="348.0" y1="56" x2="348.0" y2="326" stroke="#cfd1c8"/><text x="348.0" y="340" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >75%</text><line x1="420.0" y1="56" x2="420.0" y2="326" stroke="#cfd1c8"/><text x="420.0" y="340" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >100%</text><text x="124" y="88.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Object, position</text><rect x="132" y="66.0" width="49.0" height="11.0" fill="#7a8f9c"/><text x="185.96" y="75.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >17%</text><rect x="132" y="78.0" width="63.4" height="11.0" fill="#a9ada3"/><text x="200.36" y="87.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >22%</text><rect x="132" y="90.0" width="282.2" height="11.0" fill="#b44c2c"/><text x="419.24" y="99.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >98%</text><text x="124" y="132.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Object, task</text><rect x="132" y="110.0" width="2.9" height="11.0" fill="#7a8f9c"/><text x="139.88" y="119.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >1%</text><rect x="132" y="122.0" width="51.8" height="11.0" fill="#a9ada3"/><text x="188.84" y="131.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >18%</text><rect x="132" y="134.0" width="273.6" height="11.0" fill="#b44c2c"/><text x="410.6" y="143.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >95%</text><text x="124" y="176.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Goal, position</text><rect x="132" y="154.0" width="109.4" height="11.0" fill="#7a8f9c"/><text x="246.44" y="163.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >38%</text><rect x="132" y="166.0" width="74.9" height="11.0" fill="#a9ada3"/><text x="211.88" y="175.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >26%</text><rect x="132" y="178.0" width="233.3" height="11.0" fill="#b44c2c"/><text x="370.28" y="187.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >81%</text><text x="124" y="220.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Goal, task</text><rect x="132" y="198.0" width="1.0" height="11.0" fill="#7a8f9c"/><text x="137.0" y="207.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >0%</text><rect x="132" y="210.0" width="49.0" height="11.0" fill="#a9ada3"/><text x="185.96" y="219.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >17%</text><rect x="132" y="222.0" width="129.6" height="11.0" fill="#b44c2c"/><text x="266.6" y="231.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >45%</text><text x="124" y="264.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Spatial, position</text><rect x="132" y="242.0" width="57.6" height="11.0" fill="#7a8f9c"/><text x="194.6" y="251.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >20%</text><rect x="132" y="254.0" width="34.6" height="11.0" fill="#a9ada3"/><text x="171.56" y="263.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >12%</text><rect x="132" y="266.0" width="146.9" height="11.0" fill="#b44c2c"/><text x="283.88" y="275.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >51%</text><text x="124" y="308.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Spatial, task</text><rect x="132" y="286.0" width="2.9" height="11.0" fill="#7a8f9c"/><text x="139.88" y="295.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >1%</text><rect x="132" y="298.0" width="40.3" height="11.0" fill="#a9ada3"/><text x="177.32" y="307.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >14%</text><rect x="132" y="310.0" width="172.8" height="11.0" fill="#b44c2c"/><text x="309.8" y="319.0" font-family="Arial, Helvetica, sans-serif" font-size="10.5" text-anchor="start" fill="#242622" font-weight="400" >60%</text><text x="240.0" y="360" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Macro-average over 10 tasks x 50 held-out seeds per condition.</text><text x="240.0" y="376" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >P2 Table 5. OpenVLA and pi0 scored 0% in all six conditions.</text></svg>
<figcaption>LIBERO-Pro success, macro-averaged over 10 tasks and 50 held-out seeds per condition. ASPIRE leads in all six, and its weakest condition is Goal with a changed instruction, at 45%. Values from the paper's Table 5.</figcaption>
</figure>

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

<figure class="article-figure">
<svg viewBox="0 0 480 398" role="img" aria-labelledby="fig-models-t fig-models-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-models-t">Same robot loop, twelve models: held-out success and cost</title><desc id="fig-models-d">Horizontal bars of held-out success for twelve language models on the ten LIBERO-Pro Goal tasks under position perturbation, with the estimated total API cost for the ten tasks. Success runs from 14.8 percent for GPT-6 Luna to 99.2 percent for Claude Opus 5.5. Cost does not track success.</desc><rect x="0.75" y="0.75" width="478.5" height="396.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><text x="240.0" y="22" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" fill="#242622" font-weight="700" >Same robot loop, twelve models: held-out success and cost</text><line x1="142.0" y1="40" x2="142.0" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="142.0" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >0%</text><line x1="202.5" y1="40" x2="202.5" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="202.5" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >25%</text><line x1="263.0" y1="40" x2="263.0" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="263.0" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >50%</text><line x1="323.5" y1="40" x2="323.5" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="323.5" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >75%</text><line x1="384.0" y1="40" x2="384.0" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="384.0" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >100%</text><text x="134" y="64.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Opus 5.5</text><rect x="142" y="52" width="240.1" height="15" fill="#b44c2c"/><text x="388.064" y="64.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >99.2%  ·  $183</text><text x="134" y="88.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Sonnet 5.5</text><rect x="142" y="76" width="239.1" height="15" fill="#b44c2c"/><text x="387.096" y="88.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >98.8%  ·  $121</text><text x="134" y="112.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Fable 5.1</text><rect x="142" y="100" width="233.8" height="15" fill="#b44c2c"/><text x="381.77199999999993" y="112.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >96.6%  ·  $422</text><text x="134" y="136.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6 Astra</text><rect x="142" y="124" width="228.4" height="15" fill="#2b6a8e"/><text x="376.44800000000004" y="136.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >94.4%  ·  $354</text><text x="134" y="160.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Opus 5</text><rect x="142" y="148" width="219.3" height="15" fill="#2b6a8e"/><text x="367.25199999999995" y="160.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >90.6%  ·  $597</text><text x="134" y="184.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6.1 Sol</text><rect x="142" y="172" width="213.0" height="15" fill="#2b6a8e"/><text x="360.96000000000004" y="184.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >88%  ·  $95</text><text x="134" y="208.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Kimi K3 (open)</text><rect x="142" y="196" width="189.7" height="15" fill="#2b6a8e"/><text x="337.72800000000007" y="208.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >78.4%  ·  $582</text><text x="134" y="232.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Haiku 5.5</text><rect x="142" y="220" width="164.6" height="15" fill="#2b6a8e"/><text x="312.56" y="232.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >68%  ·  $40</text><text x="134" y="256.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6 Sol</text><rect x="142" y="244" width="143.3" height="15" fill="#a9ada3"/><text x="291.264" y="256.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >59.2%  ·  $76</text><text x="134" y="280.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Qwen 3.8 Max (open)</text><rect x="142" y="268" width="135.5" height="15" fill="#a9ada3"/><text x="283.52" y="280.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >56%  ·  $398</text><text x="134" y="304.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Opus 4.6</text><rect x="142" y="292" width="134.6" height="15" fill="#a9ada3"/><text x="282.552" y="304.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >55.6%  ·  $236</text><text x="134" y="328.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6 Luna</text><rect x="142" y="316" width="35.8" height="15" fill="#a9ada3"/><text x="183.816" y="328.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >14.8%  ·  $8</text><text x="240.0" y="370" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Bar: held-out success. Label: success and estimated cost of all 10 tasks.</text><text x="240.0" y="386" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >LIBERO-Pro Goal, 10 tasks x 50 seeds, empty library. P2 Table 18.</text></svg>
<figcaption>Held-out success for twelve models on the same loop. Red bars are 95% or higher. The two open-weight models are Kimi K3 and Qwen 3.8 Max. Values from the paper's Table 18.</figcaption>
</figure>

<details>
<summary>Exact values</summary>

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

</details>

Success goes from 15% to 99% across models, and price does not track it. Opus 5 costs $597 for 90.6%. Sonnet 5.5 costs $121 for 98.8%. Search matters less as models improve. On Object, Goal and Spatial it changes success by at most 2% for Opus 5, GPT-6 Astra and Opus 5.5, against up to 34% for Opus 4.6.

Stronger models also change strategy. On "put the book under the low shelf", Opus 5.5 knocks the book flat without grasping it and pushes it under (68% success). Opus 4.6 carries it above the cabinet and stalls (0%). No model finds the human's move of tilting the book by its top edge. (Sec. 3.9, Fig. 10: one episode per row, so it shows strategies, not matched trials.)

<figure class="article-figure">
<video muted loop playsinline controls preload="none" poster="https://research.nvidia.com/labs/gear/aspire/assets/videos/posters/five_way/book.jpg" aria-label="Book under the shelf: the human demonstration and four models.">
<source src="https://research.nvidia.com/labs/gear/aspire/assets/videos/five_way/book.mp4" type="video/mp4">
<a href="https://research.nvidia.com/labs/gear/aspire/assets/videos/five_way/book.mp4">Watch the video</a>
</video>
<figcaption>Book under the low shelf: the human demonstration next to one held-out episode per model. Video: NVIDIA GEAR and the ASPIRE authors, from the <a href="https://research.nvidia.com/labs/gear/aspire/">project page</a>. Embedded from NVIDIA's server, not copied.</figcaption>
</figure>

<figure class="article-figure">
<video muted loop playsinline controls preload="none" poster="https://research.nvidia.com/labs/gear/aspire/assets/videos/posters/five_way/push.jpg" aria-label="Push the plate: the human demonstration and four models.">
<source src="https://research.nvidia.com/labs/gear/aspire/assets/videos/five_way/push.mp4" type="video/mp4">
<a href="https://research.nvidia.com/labs/gear/aspire/assets/videos/five_way/push.mp4">Watch the video</a>
</video>
<figcaption>Push the plate to the front of the stove, with a bowl and a box in the way. Video: NVIDIA GEAR and the ASPIRE authors, from the <a href="https://research.nvidia.com/labs/gear/aspire/">project page</a>. Embedded from NVIDIA's server, not copied.</figcaption>
</figure>

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

<figure class="article-figure">
<svg viewBox="0 0 480 236" role="img" aria-labelledby="fig-rubik-t fig-rubik-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-rubik-t">Rubik&#x27;s Cube: cost per completed turn falls over three episodes</title><desc id="fig-rubik-d">Two bar panels over three real-robot episodes. Time per completed face turn falls from 16.97 minutes to 7.80 minutes to 3.09 minutes. Tokens per completed turn fall from 11.27 million to 5.56 million to 2.01 million.</desc><rect x="0.75" y="0.75" width="478.5" height="234.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><text x="240.0" y="22" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" fill="#242622" font-weight="700" >Rubik&#x27;s Cube: cost per completed turn falls over three episodes</text><text x="125.0" y="50" font-family="Arial, Helvetica, sans-serif" font-size="12.5" text-anchor="middle" fill="#242622" font-weight="700" >Minutes per turn</text><line x1="20.0" y1="170" x2="230.0" y2="170" stroke="#cfd1c8" stroke-width="1.5"/><rect x="30.0" y="75.7" width="56.0" height="94.3" fill="#b44c2c"/><text x="58.0" y="70.72222222222223" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#242622" font-weight="700" >16.97</text><text x="58.0" y="186" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Ep 1</text><rect x="100.0" y="126.7" width="56.0" height="43.3" fill="#b44c2c"/><text x="128.0" y="121.66666666666666" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#242622" font-weight="700" >7.80</text><text x="128.0" y="186" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Ep 2</text><rect x="170.0" y="152.8" width="56.0" height="17.2" fill="#b44c2c"/><text x="198.0" y="147.83333333333334" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#242622" font-weight="700" >3.09</text><text x="198.0" y="186" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Ep 3</text><text x="355.0" y="50" font-family="Arial, Helvetica, sans-serif" font-size="12.5" text-anchor="middle" fill="#242622" font-weight="700" >Tokens per turn (millions)</text><line x1="250.0" y1="170" x2="460.0" y2="170" stroke="#cfd1c8" stroke-width="1.5"/><rect x="260.0" y="76.1" width="56.0" height="93.9" fill="#b44c2c"/><text x="288.0" y="71.08333333333333" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#242622" font-weight="700" >11.27</text><text x="288.0" y="186" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Ep 1</text><rect x="330.0" y="123.7" width="56.0" height="46.3" fill="#b44c2c"/><text x="358.0" y="118.66666666666666" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#242622" font-weight="700" >5.56</text><text x="358.0" y="186" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Ep 2</text><rect x="400.0" y="153.2" width="56.0" height="16.7" fill="#b44c2c"/><text x="428.0" y="148.25" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#242622" font-weight="700" >2.01</text><text x="428.0" y="186" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Ep 3</text><text x="240.0" y="208" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Full-episode amortized, including failed attempts, recovery and context compaction.</text><text x="240.0" y="224" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Episodes completed 3, 5 and 25 face turns. P2 Sec 3.7 and Fig 6(b); one real session.</text></svg>
<figcaption>Cost per completed face turn over the three Rubik's Cube episodes. The middle token value (5.56M) is read from the paper's Fig. 6(b); the other four values are in the text of Sec. 3.7.</figcaption>
</figure>

<figure class="article-figure">
<video muted loop playsinline controls preload="none" poster="https://research.nvidia.com/labs/gear/aspire/assets/videos/posters/rubiks_turns.jpg" aria-label="The real robot turning a Rubik's Cube face.">
<source src="https://research.nvidia.com/labs/gear/aspire/assets/videos/real/rubiks_turns.mp4" type="video/mp4">
<a href="https://research.nvidia.com/labs/gear/aspire/assets/videos/real/rubiks_turns.mp4">Watch the video</a>
</video>
<figcaption>Example Rubik's Cube turns on the real bimanual robot. Video: NVIDIA GEAR and the ASPIRE authors, from the <a href="https://research.nvidia.com/labs/gear/aspire/">project page</a>. Embedded from NVIDIA's server, not copied.</figcaption>
</figure>

<figure class="article-figure">
<video muted loop playsinline controls preload="none" poster="https://research.nvidia.com/labs/gear/aspire/assets/videos/posters/table_bussing.jpg" aria-label="Long-horizon table bussing on the real robot.">
<source src="https://research.nvidia.com/labs/gear/aspire/assets/videos/real/table_bussing.mp4" type="video/mp4">
<a href="https://research.nvidia.com/labs/gear/aspire/assets/videos/real/table_bussing.mp4">Watch the video</a>
</video>
<figcaption>A long-horizon table-bussing demo: Claude Opus 4.6 in simulation, GPT-5.5 on the real robot. It is a project-page demo, not one of the three measured tasks above. Video: NVIDIA GEAR and the ASPIRE authors, from the <a href="https://research.nvidia.com/labs/gear/aspire/">project page</a>. Embedded from NVIDIA's server, not copied.</figcaption>
</figure>

## Drawbacks

ASPIRE is slow, and it has not been shown on tasks that need fast reflexes. It works when the model is strong and the API covers the task.

- **Building a program is slow.** The agent spends 31 to 139 minutes per task on the debugging loop, depending on the model (chart below). The paper also lists the search as compute-intensive, with many LLM calls and rollouts per task.
- **Real-robot sessions are slow too.** The Rubik's Cube episodes took 50 min 54 s unsolved, then 39 min and 77 min 10 s.
- **Deliberation is slow and the program is fast, up to a point.** In the simulated LIBERO-Pro and Robosuite runs, the finished program runs without a language model. In BEHAVIOR-1K the agent writes each next code block from the current trace, and in the Rubik's Cube setup the agent issues each action. There the language model sits in the loop and every step waits on it.
- **Fast dynamic tasks are untested, so this is my inference.** My bet is that juggling still needs a learned low-level policy. The paper tests nothing like it. Programs call primitives such as `move_to_pose`, which plan a trajectory and wait for a result, and the arm tracks position targets streamed to its motor drivers (Appendix D). A reflex that corrects within a fraction of a second has to live below that layer. A learned low-level policy is one way to get it, and I know of no result that lets ASPIRE do without one.

<figure class="article-figure">
<svg viewBox="0 0 480 398" role="img" aria-labelledby="fig-time-t fig-time-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-time-t">Agent time to build and debug one task program</title><desc id="fig-time-d">Horizontal bars of mean agent time per task, in minutes, for twelve models in the ASPIRE debugging loop on LIBERO-Pro Goal, position perturbation. Times run from 31 minutes for GPT-6 Astra to 139 minutes for Kimi K3.</desc><rect x="0.75" y="0.75" width="478.5" height="396.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><text x="240.0" y="22" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" fill="#242622" font-weight="700" >Agent time to build and debug one task program</text><line x1="142.0" y1="40" x2="142.0" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="142.0" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >0 min</text><line x1="231.3" y1="40" x2="231.3" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="231.33333333333331" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >50 min</text><line x1="320.7" y1="40" x2="320.7" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="320.66666666666663" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >100 min</text><line x1="410.0" y1="40" x2="410.0" y2="336" stroke="#cfd1c8" stroke-width="1"/><text x="410.0" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle" fill="#656b62" font-weight="400" >150 min</text><text x="134" y="64.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6 Astra</text><rect x="142" y="52" width="55.4" height="15" fill="#2b6a8e"/><text x="203.38666666666666" y="64.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >31 min</text><text x="134" y="88.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6 Sol</text><rect x="142" y="76" width="75.0" height="15" fill="#2b6a8e"/><text x="223.04000000000002" y="88.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >42 min</text><text x="134" y="112.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6 Luna</text><rect x="142" y="100" width="84.0" height="15" fill="#2b6a8e"/><text x="231.97333333333333" y="112.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >47 min</text><text x="134" y="136.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >GPT-6.1 Sol</text><rect x="142" y="124" width="87.5" height="15" fill="#2b6a8e"/><text x="235.54666666666668" y="136.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >49 min</text><text x="134" y="160.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Opus 5.5</text><rect x="142" y="148" width="91.1" height="15" fill="#2b6a8e"/><text x="239.12" y="160.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >51 min</text><text x="134" y="184.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Haiku 5.5</text><rect x="142" y="172" width="96.5" height="15" fill="#2b6a8e"/><text x="244.48000000000002" y="184.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >54 min</text><text x="134" y="208.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Sonnet 5.5</text><rect x="142" y="196" width="100.1" height="15" fill="#2b6a8e"/><text x="248.05333333333334" y="208.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >56 min</text><text x="134" y="232.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Opus 4.6</text><rect x="142" y="220" width="109.0" height="15" fill="#2b6a8e"/><text x="256.9866666666667" y="232.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >61 min</text><text x="134" y="256.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Fable 5.1</text><rect x="142" y="244" width="121.5" height="15" fill="#2b6a8e"/><text x="269.49333333333334" y="256.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >68 min</text><text x="134" y="280.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Claude Opus 5</text><rect x="142" y="268" width="135.8" height="15" fill="#2b6a8e"/><text x="283.78666666666663" y="280.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >76 min</text><text x="134" y="304.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Qwen 3.8 Max (open)</text><rect x="142" y="292" width="184.0" height="15" fill="#2b6a8e"/><text x="332.02666666666664" y="304.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >103 min</text><text x="134" y="328.0" font-family="Arial, Helvetica, sans-serif" font-size="12" text-anchor="end" fill="#242622" font-weight="400" >Kimi K3 (open)</text><rect x="142" y="316" width="248.3" height="15" fill="#2b6a8e"/><text x="396.3466666666667" y="328.0" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="start" fill="#242622" font-weight="400" >139 min</text><text x="240.0" y="370" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Mean wall-clock agent time per task, before the program runs.</text><text x="240.0" y="386" font-family="Arial, Helvetica, sans-serif" font-size="11.5" text-anchor="middle" fill="#656b62" font-weight="400" >Same runs as the model chart. P2 Table 18, column &quot;Agent time / task&quot;.</text></svg>
<figcaption>Mean wall-clock agent time per task for each model, before the program runs. Same runs as the model chart. Values from the paper's Table 18.</figcaption>
</figure>

The other limits are about the model, the API and verification:

- **It depends on the model.** The authors write that ASPIRE "relies on a frozen LLM" and that their best results use proprietary frontier models. The best open-weight model in the study reaches 78%.
- **Weak models are noisy.** Three independent Opus 4.6 runs from an empty library score 59.2%, 67.4% and 62.8% on the same suite. On "open middle drawer" the same setup gave 0%, 100% and 0% (Table 25).
- **A skill is verified on its source task.** The repo says it directly: passing "shows the text transmits, not that it transfers". Transfer shows up only later, as other tasks grade the skill useful.
- **The API bounds the robot.** Programs use a predefined set of perception, planning and control primitives. A behavior outside that set needs a human to extend the API.
- **Libraries go stale.** Old entries can turn overly specific or misleading, and the authors say retrieval and pruning are not solved.
- **The real world is not a loop yet.** The paper says ASPIRE is "not yet a fully autonomous real-world lifelong learner". Real runs still need success detection, safe resets and calibration.
- **It runs generated code.** The repo warns that ASPIRE executes model-written Python with full import access. Run it on an isolated host.

## Side note: people don't run fixed programs

This section is my inference, not a paper result. My view: the missing piece is a fast loop, and nothing in ASPIRE rules out the agent writing one.

- **People run fast feedback loops.** We don't execute a fixed program. We correct as we move, and slower thinking above that picks what to do.
- **A program can hold its own loop.** Code that an LLM writes can read a sensor, correct and repeat. ASPIRE's stored skills already do a little of this: grasp, lift, then re-localize the object to check it moved with the gripper.
- **Those loops run at the program's pace.** They tick in seconds. Underneath, the planner, the inverse kinematics and the streaming of position targets to the motors were written by people.
- **Open question.** Can the agent write the fast loop too, or does that layer stay a person's job or a learned policy's? This paper does not answer it. I would run that test first.

## My read

- **The unit of memory is right.** Programs rarely repeat across tasks. Failures do: planner errors near furniture, bottles that tip, ambiguous "front bowl" language. A conditional note with a signature and a trigger matches how these failures recur.
- **Admission is the weak spot.** A verifier that reproduces a fix on its own source task checks that the note is readable. The zero-shot table shows that transfer is lumpy. The paper does not report an ablation of this verifier.
- **The Bitter Lesson applies, with a floor.** The model swap moves the numbers more than the harness, which is Sutton's pattern. The fixed API and the verifier are the human-built parts that remain.
- **The model is the lever.** With everything else fixed, success goes from 15% to 99% by swapping the language model. The paper's library-size curve uses Opus 4.6. I did not find the same curve for the newer models, so I can't say how much the library adds when the model is already strong.

What I like most is the format. A fix you can read, diff and revert is easier to trust than a change buried in weights. It is also exactly why the model and the API are the ceiling.

<details>
<summary>Sources and versions</summary>

- Paper: Lu, Wu, Kou et al., [ASPIRE: Agentic /Skills Discovery for Robotics](https://arxiv.org/abs/2607.00272), arXiv 2607.00272, v1 submitted 30 June 2026. It is the only arXiv version as of 19 October 2026. Its numbers use Claude Opus 4.6.
- Project PDF: the [later version](https://research.nvidia.com/labs/gear/aspire/assets/Aspire.pdf) adds Claude Opus 5.5, the twelve-model comparison, the Rubik's Cube and Jan Kautz as an author. Model ablations, Table 1, Table 18 and the 99% claim come from it.
- Code: [NVlabs/ASPIRE](https://github.com/NVlabs/ASPIRE), v1.0 release commit `fa00f0e`, 15 October 2026.
- Jim Fan's posts: [launch, 30 June 2026](https://x.com/DrJimFan/status/2072004190856212902) and [v1.0, 16 October 2026](https://x.com/DrJimFan/status/2111128797181567466). Quotes are exact, read through the fxtwitter API.
- Sutton: [The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html), 13 March 2019. Quotes are exact.
- Videos: embedded from the ASPIRE [project page](https://research.nvidia.com/labs/gear/aspire/), credit NVIDIA GEAR and the ASPIRE authors. The page states no license for them, so I link to NVIDIA's server instead of copying the files. The code is Apache 2.0.
- Charts: drawn by me from the paper's tables. Each caption names the table.
- Every number above comes from the paper or the repo. I did not rerun any experiment.
- All success rates are simulated unless the section says real robot.

</details>
