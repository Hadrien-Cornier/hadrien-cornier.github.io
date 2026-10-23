---
title: 'Can you zero-shot robotics with a coding agent?'
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

<link rel="stylesheet" href="/assets/robotics/chalk/chalk.css">
<svg class="chalk-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="chalk-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.32 1.16" result="mask"/><feComposite in="drawn" in2="mask" operator="in" result="chalk"/><feFlood flood-color="#1d2824" result="board"/><feComposite in="chalk" in2="board" operator="over"/></filter></svg>

<figure class="article-figure">
<svg class="chalk chalk-filter" viewBox="0 0 480 436" role="img" aria-labelledby="fig-aspire-t fig-aspire-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-aspire-t">The ASPIRE loop: write, execute, trace, repair, verify, remember</title><desc id="fig-aspire-d">A task enters the actor, a coding agent that writes a robot program. The program goes to the execution engine, which records a trace of every perception, grasp and planning call. The trace returns to the actor, which diagnoses, repairs and re-runs. The actor turns a validated fix into a proposed skill. A fresh verifier agent must reproduce the fix from the proposal alone, and only then does the skill enter the skill library. The library feeds the actor on later tasks. Evolutionary search lets the actor try several programs per round, seeded by the best programs and their traces.</desc><defs><marker id="fig-aspire-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="c-chalk"/></marker><marker id="fig-aspire-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="c-red"/></marker></defs><rect x="6" y="44" width="140" height="80" fill="#f6e5e0" class="s-red" stroke-width="1.8"/><text x="76" y="69" font-size="17" class="c-chalk" text-anchor="middle">Skill library</text><text x="76" y="92" font-size="15" class="c-dim" text-anchor="middle">one text note</text><text x="76" y="112" font-size="15" class="c-dim" text-anchor="middle">per verified fix</text><rect x="170" y="44" width="140" height="80" class="c-board s-chalk" stroke-width="1.8"/><text x="240" y="69" font-size="17" class="c-chalk" text-anchor="middle">Actor</text><text x="240" y="92" font-size="15" class="c-dim" text-anchor="middle">coding agent writes</text><text x="240" y="112" font-size="15" class="c-dim" text-anchor="middle">a Python program</text><rect x="334" y="44" width="140" height="80" class="c-board s-chalk" stroke-width="1.8"/><text x="404" y="69" font-size="17" class="c-chalk" text-anchor="middle">Evolutionary search</text><text x="404" y="92" font-size="15" class="c-dim" text-anchor="middle">K programs a round,</text><text x="404" y="112" font-size="15" class="c-dim" text-anchor="middle">from top 3 + traces</text><rect x="6" y="166" width="140" height="80" class="c-board s-chalk" stroke-width="1.8"/><text x="76" y="191" font-size="17" class="c-chalk" text-anchor="middle">Verifier</text><text x="76" y="214" font-size="15" class="c-dim" text-anchor="middle">fresh agent, proposal</text><text x="76" y="234" font-size="15" class="c-dim" text-anchor="middle">only, 5 seeds</text><rect x="170" y="166" width="140" height="80" fill="#d7e5ee" class="s-blue" stroke-width="1.8"/><text x="240" y="191" font-size="17" class="c-chalk" text-anchor="middle">Execution engine</text><text x="240" y="214" font-size="15" class="c-dim" text-anchor="middle">runs perception, grasp</text><text x="240" y="234" font-size="15" class="c-dim" text-anchor="middle">and motion planning</text><rect x="6" y="288" width="140" height="80" fill="#f6e5e0" class="s-red" stroke-width="1.8"/><text x="76" y="313" font-size="17" class="c-chalk" text-anchor="middle">Proposed skill</text><text x="76" y="336" font-size="15" class="c-dim" text-anchor="middle">from a validated fix:</text><text x="76" y="356" font-size="15" class="c-dim" text-anchor="middle">signature, when, repair</text><rect x="170" y="288" width="140" height="80" fill="#d7e5ee" class="s-blue" stroke-width="1.8"/><text x="240" y="313" font-size="17" class="c-chalk" text-anchor="middle">Trace per call</text><text x="240" y="336" font-size="15" class="c-dim" text-anchor="middle">inputs, outputs, status,</text><text x="240" y="356" font-size="15" class="c-dim" text-anchor="middle">RGB before and after</text><path d="M240,8 V42" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-aspire-a)"/><path d="M148,84 H168" class="c-none s-red" stroke-width="1.8" marker-end="url(#fig-aspire-r)"/><path d="M312,84 H332" class="c-none s-chalk" stroke-width="1.8" marker-start="url(#fig-aspire-a)" marker-end="url(#fig-aspire-a)"/><path d="M206,126 V164" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-aspire-a)"/><path d="M240,248 V286" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-aspire-a)"/><path d="M312,328 H322 V140 H276 V126" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-aspire-a)"/><path d="M170,108 H158 V328 H148" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-aspire-a)"/><path d="M76,286 V248" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-aspire-a)"/><path d="M76,164 V126" class="c-none s-red" stroke-width="1.8" marker-end="url(#fig-aspire-r)"/><text x="250" y="27" font-size="15" class="c-dim">task + debug seeds</text><text x="214" y="156.5" font-size="15" class="c-dim">program</text><text x="248" y="272.5" font-size="15" class="c-dim">records</text><text x="330" y="192" font-size="15" class="c-dim">diagnose,</text><text x="330" y="212" font-size="15" class="c-dim">repair,</text><text x="330" y="232" font-size="15" class="c-dim">re-run</text><text x="85" y="272.5" font-size="15" class="c-red">verify</text><text x="85" y="150.5" font-size="15" class="c-red">promote</text><text x="240" y="400" font-size="15" class="c-dim" text-anchor="middle">Debug seeds drive the loop. Held-out seeds run once, at the end.</text><text x="240" y="421" font-size="15" class="c-dim" text-anchor="middle">Red: what persists between tasks. Blue: the environment.</text></svg>
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
<svg class="chalk chalk-filter" viewBox="0 0 480 508" role="img" aria-labelledby="fig-robosuite-t fig-robosuite-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-robosuite-t">Robosuite: ASPIRE and the CaP-Agent0 baseline, seven tasks</title><desc id="fig-robosuite-d">Paired horizontal bars of success on seven Robosuite tasks for the CaP-Agent0 baseline and for ASPIRE with Claude Opus 4.6. The largest gap is two_arm_handover, 20 percent against 92 percent. ASPIRE is lower on two_arm_lift, 74 against 71, and on spill_wipe, 100 against 99.</desc><text x="240" y="30" font-size="17.5" class="chalk-title" text-anchor="middle">Robosuite: ASPIRE and the CaP-Agent0 baseline, seven tasks</text><rect x="132" y="49" width="13" height="13" class="c-dim"/><text x="151" y="60" font-size="15" class="c-chalk">CaP-Agent0</text><rect x="233" y="49" width="13" height="13" class="c-red"/><text x="252" y="60" font-size="15" class="c-chalk">ASPIRE (Opus 4.6)</text><line x1="132" y1="76" x2="132" y2="426" class="s-faint" stroke-width="1"/><text x="132" y="445" font-size="15" class="c-dim" text-anchor="middle">0%</text><line x1="206" y1="76" x2="206" y2="426" class="s-faint" stroke-width="1"/><text x="206" y="445" font-size="15" class="c-dim" text-anchor="middle">25%</text><line x1="280" y1="76" x2="280" y2="426" class="s-faint" stroke-width="1"/><text x="280" y="445" font-size="15" class="c-dim" text-anchor="middle">50%</text><line x1="354" y1="76" x2="354" y2="426" class="s-faint" stroke-width="1"/><text x="354" y="445" font-size="15" class="c-dim" text-anchor="middle">75%</text><line x1="428" y1="76" x2="428" y2="426" class="s-faint" stroke-width="1"/><text x="428" y="445" font-size="15" class="c-dim" text-anchor="middle">100%</text><text x="124" y="106.5" font-size="15" class="c-chalk" text-anchor="end">cube_lift</text><rect x="132" y="84" width="287.1" height="15" class="c-dim"/><text x="425.1" y="96.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">97%</text><rect x="132" y="103" width="287.1" height="15" class="c-red"/><text x="425.1" y="115.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">97%</text><text x="124" y="156.5" font-size="15" class="c-chalk" text-anchor="end">cube_stack</text><rect x="132" y="134" width="290.1" height="15" class="c-dim"/><text x="428.1" y="146.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">98%</text><rect x="132" y="153" width="293" height="15" class="c-red"/><text x="431" y="165.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">99%</text><text x="124" y="206.5" font-size="15" class="c-chalk" text-anchor="end">cube_restack</text><rect x="132" y="184" width="263.4" height="15" class="c-dim"/><text x="401.4" y="196.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">89%</text><rect x="132" y="203" width="296" height="15" class="c-red"/><text x="434" y="215.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">100%</text><text x="124" y="256.5" font-size="15" class="c-chalk" text-anchor="end">spill_wipe</text><rect x="132" y="234" width="296" height="15" class="c-dim"/><text x="434" y="246.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">100%</text><rect x="132" y="253" width="293" height="15" class="c-red"/><text x="431" y="265.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">99%</text><text x="124" y="306.5" font-size="15" class="c-chalk" text-anchor="end">two_arm_handover</text><rect x="132" y="284" width="59.2" height="15" class="c-dim"/><text x="197.2" y="296.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">20%</text><rect x="132" y="303" width="272.3" height="15" class="c-red"/><text x="410.3" y="315.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">92%</text><text x="124" y="356.5" font-size="15" class="c-chalk" text-anchor="end">two_arm_lift</text><rect x="132" y="334" width="219" height="15" class="c-dim"/><text x="357" y="346.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">74%</text><rect x="132" y="353" width="210.2" height="15" class="c-red"/><text x="348.2" y="365.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">71%</text><text x="124" y="406.5" font-size="15" class="c-chalk" text-anchor="end">nut_assembly</text><rect x="132" y="384" width="1" height="15" class="c-dim"/><text x="139" y="396.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">0%</text><rect x="132" y="403" width="26.6" height="15" class="c-red"/><text x="164.6" y="415.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">9%</text><text x="240" y="472" font-size="15" class="c-dim" text-anchor="middle">Success over 100 held-out trials per task. Mean: 68% against 81%.</text><text x="240" y="493" font-size="15" class="c-dim" text-anchor="middle">P2 Table 6. CaP-Agent0 regenerates a program per seed, with retries.</text></svg>
<figcaption>Robosuite success over 100 held-out trials per task. ASPIRE is not ahead on every task: it is level or slightly behind on `two_arm_lift` and `spill_wipe`. Values from the paper's Table 6.</figcaption>
</figure>

<figure class="article-figure">
<svg class="chalk chalk-filter" viewBox="0 0 480 572" role="img" aria-labelledby="fig-libero-t fig-libero-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-libero-t">LIBERO-Pro: three methods, six conditions</title><desc id="fig-libero-d">Grouped horizontal bars of success on LIBERO-Pro Object, Goal and Spatial suites under position and task perturbations for pi0.5, CaP-Agent0 and ASPIRE with Claude Opus 4.6. ASPIRE leads in every condition. Its Goal task perturbation score of 45 percent is the lowest, and pi0.5 scores near zero under task perturbations.</desc><text x="240" y="30" font-size="17.5" class="chalk-title" text-anchor="middle">LIBERO-Pro: three methods, six conditions</text><rect x="124" y="49" width="13" height="13" style="fill:var(--bb-slate)"/><text x="143" y="60" font-size="15" class="c-chalk">pi0.5</text><rect x="191" y="49" width="13" height="13" class="c-dim"/><text x="210" y="60" font-size="15" class="c-chalk">CaP-Agent0</text><rect x="292" y="49" width="13" height="13" class="c-red"/><text x="311" y="60" font-size="15" class="c-chalk">ASPIRE (Opus 4.6)</text><line x1="124" y1="76" x2="124" y2="490" class="s-faint" stroke-width="1"/><text x="124" y="509" font-size="15" class="c-dim" text-anchor="middle">0%</text><line x1="200" y1="76" x2="200" y2="490" class="s-faint" stroke-width="1"/><text x="200" y="509" font-size="15" class="c-dim" text-anchor="middle">25%</text><line x1="276" y1="76" x2="276" y2="490" class="s-faint" stroke-width="1"/><text x="276" y="509" font-size="15" class="c-dim" text-anchor="middle">50%</text><line x1="352" y1="76" x2="352" y2="490" class="s-faint" stroke-width="1"/><text x="352" y="509" font-size="15" class="c-dim" text-anchor="middle">75%</text><line x1="428" y1="76" x2="428" y2="490" class="s-faint" stroke-width="1"/><text x="428" y="509" font-size="15" class="c-dim" text-anchor="middle">100%</text><text x="116" y="116" font-size="15" class="c-chalk" text-anchor="end">Object, position</text><rect x="124" y="84" width="51.7" height="15" style="fill:var(--bb-slate)"/><text x="181.7" y="96.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">17%</text><rect x="124" y="103" width="66.9" height="15" class="c-dim"/><text x="196.9" y="115.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">22%</text><rect x="124" y="122" width="297.9" height="15" class="c-red"/><text x="427.9" y="134.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">98%</text><text x="116" y="185" font-size="15" class="c-chalk" text-anchor="end">Object, task</text><rect x="124" y="153" width="3" height="15" style="fill:var(--bb-slate)"/><text x="133" y="165.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">1%</text><rect x="124" y="172" width="54.7" height="15" class="c-dim"/><text x="184.7" y="184.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">18%</text><rect x="124" y="191" width="288.8" height="15" class="c-red"/><text x="418.8" y="203.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">95%</text><text x="116" y="254" font-size="15" class="c-chalk" text-anchor="end">Goal, position</text><rect x="124" y="222" width="115.5" height="15" style="fill:var(--bb-slate)"/><text x="245.5" y="234.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">38%</text><rect x="124" y="241" width="79" height="15" class="c-dim"/><text x="209" y="253.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">26%</text><rect x="124" y="260" width="246.2" height="15" class="c-red"/><text x="376.2" y="272.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">81%</text><text x="116" y="323" font-size="15" class="c-chalk" text-anchor="end">Goal, task</text><rect x="124" y="291" width="1" height="15" style="fill:var(--bb-slate)"/><text x="131" y="303.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">0%</text><rect x="124" y="310" width="51.7" height="15" class="c-dim"/><text x="181.7" y="322.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">17%</text><rect x="124" y="329" width="136.8" height="15" class="c-red"/><text x="266.8" y="341.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">45%</text><text x="116" y="392" font-size="15" class="c-chalk" text-anchor="end">Spatial, position</text><rect x="124" y="360" width="60.8" height="15" style="fill:var(--bb-slate)"/><text x="190.8" y="372.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">20%</text><rect x="124" y="379" width="36.5" height="15" class="c-dim"/><text x="166.5" y="391.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">12%</text><rect x="124" y="398" width="155" height="15" class="c-red"/><text x="285" y="410.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">51%</text><text x="116" y="461" font-size="15" class="c-chalk" text-anchor="end">Spatial, task</text><rect x="124" y="429" width="3" height="15" style="fill:var(--bb-slate)"/><text x="133" y="441.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">1%</text><rect x="124" y="448" width="42.6" height="15" class="c-dim"/><text x="172.6" y="460.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">14%</text><rect x="124" y="467" width="182.4" height="15" class="c-red"/><text x="312.4" y="479.5" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">60%</text><text x="240" y="536" font-size="15" class="c-dim" text-anchor="middle">Macro-average over 10 tasks x 50 held-out seeds per condition.</text><text x="240" y="557" font-size="15" class="c-dim" text-anchor="middle">P2 Table 5. OpenVLA and pi0 scored 0% in all six conditions.</text></svg>
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
<svg class="chalk chalk-filter" viewBox="0 0 480 442" role="img" aria-labelledby="fig-models-t fig-models-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-models-t">Same robot loop, twelve models: held-out success and cost</title><desc id="fig-models-d">Horizontal bars of held-out success for twelve language models on the ten LIBERO-Pro Goal tasks under position perturbation, with the estimated total API cost for the ten tasks. Success runs from 14.8 percent for GPT-6 Luna to 99.2 percent for Claude Opus 5.5. Cost does not track success.</desc><text x="240" y="30" font-size="17.5" class="chalk-title" text-anchor="middle">Same robot loop, twelve models: held-out success and cost</text><line x1="136" y1="48" x2="136" y2="360" class="s-faint" stroke-width="1"/><text x="136" y="379" font-size="15" class="c-dim" text-anchor="middle">0%</text><line x1="200" y1="48" x2="200" y2="360" class="s-faint" stroke-width="1"/><text x="200" y="379" font-size="15" class="c-dim" text-anchor="middle">25%</text><line x1="264" y1="48" x2="264" y2="360" class="s-faint" stroke-width="1"/><text x="264" y="379" font-size="15" class="c-dim" text-anchor="middle">50%</text><line x1="328" y1="48" x2="328" y2="360" class="s-faint" stroke-width="1"/><text x="328" y="379" font-size="15" class="c-dim" text-anchor="middle">75%</text><line x1="392" y1="48" x2="392" y2="360" class="s-faint" stroke-width="1"/><text x="392" y="379" font-size="15" class="c-dim" text-anchor="middle">100%</text><text x="128" y="66.5" font-size="15" class="c-chalk" text-anchor="end">Claude Opus 5.5</text><rect x="136" y="52.5" width="254" height="17" class="c-red"/><text x="396" y="66" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">99.2%  ·  $183</text><text x="128" y="92.5" font-size="15" class="c-chalk" text-anchor="end">Claude Sonnet 5.5</text><rect x="136" y="78.5" width="252.9" height="17" class="c-red"/><text x="394.9" y="92" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">98.8%  ·  $121</text><text x="128" y="118.5" font-size="15" class="c-chalk" text-anchor="end">Claude Fable 5.1</text><rect x="136" y="104.5" width="247.3" height="17" class="c-red"/><text x="389.3" y="118" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">96.6%  ·  $422</text><text x="128" y="144.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6 Astra</text><rect x="136" y="130.5" width="241.7" height="17" class="c-blue"/><text x="383.7" y="144" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">94.4%  ·  $354</text><text x="128" y="170.5" font-size="15" class="c-chalk" text-anchor="end">Claude Opus 5</text><rect x="136" y="156.5" width="231.9" height="17" class="c-blue"/><text x="373.9" y="170" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">90.6%  ·  $597</text><text x="128" y="196.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6.1 Sol</text><rect x="136" y="182.5" width="225.3" height="17" class="c-blue"/><text x="367.3" y="196" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">88%  ·  $95</text><text x="128" y="222.5" font-size="15" class="c-chalk" text-anchor="end">Kimi K3 (open)</text><rect x="136" y="208.5" width="200.7" height="17" class="c-blue"/><text x="342.7" y="222" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">78.4%  ·  $582</text><text x="128" y="248.5" font-size="15" class="c-chalk" text-anchor="end">Claude Haiku 5.5</text><rect x="136" y="234.5" width="174.1" height="17" class="c-blue"/><text x="316.1" y="248" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">68%  ·  $40</text><text x="128" y="274.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6 Sol</text><rect x="136" y="260.5" width="151.6" height="17" class="c-dim"/><text x="293.6" y="274" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">59.2%  ·  $76</text><text x="128" y="300.5" font-size="15" class="c-chalk" text-anchor="end">Qwen 3.8 Max (open)</text><rect x="136" y="286.5" width="143.4" height="17" class="c-dim"/><text x="285.4" y="300" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">56%  ·  $398</text><text x="128" y="326.5" font-size="15" class="c-chalk" text-anchor="end">Claude Opus 4.6</text><rect x="136" y="312.5" width="142.3" height="17" class="c-dim"/><text x="284.3" y="326" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">55.6%  ·  $236</text><text x="128" y="352.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6 Luna</text><rect x="136" y="338.5" width="37.9" height="17" class="c-dim"/><text x="179.9" y="352" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">14.8%  ·  $8</text><text x="240" y="406" font-size="15" class="c-dim" text-anchor="middle">Bar: held-out success. Label: success and estimated cost of all 10 tasks.</text><text x="240" y="427" font-size="15" class="c-dim" text-anchor="middle">LIBERO-Pro Goal, 10 tasks x 50 seeds, empty library. P2 Table 18.</text></svg>
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
<svg class="chalk chalk-filter" viewBox="0 0 480 378" role="img" aria-labelledby="fig-rubik-t fig-rubik-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-rubik-t">Rubik's Cube: cost per completed turn falls over three episodes</title><desc id="fig-rubik-d">Two bar panels over three real-robot episodes. Time per completed face turn falls from 16.97 minutes to 7.80 minutes to 3.09 minutes. Tokens per completed turn fall from 11.27 million to 5.56 million to 2.01 million.</desc><text x="240" y="30" font-size="17.5" class="chalk-title" text-anchor="middle">Rubik's Cube: cost per completed turn falls over three episodes</text><text x="122" y="64" font-size="16" class="c-chalk" text-anchor="middle">Minutes per turn</text><line x1="12" y1="248" x2="232" y2="248" class="s-faint" stroke-width="1.5"/><rect x="18" y="106.6" width="56" height="141.4" class="c-red"/><text x="46" y="99.6" font-size="15" class="c-chalk" text-anchor="middle">16.97</text><text x="46" y="269" font-size="15" class="c-dim" text-anchor="middle">Ep 1</text><rect x="94" y="183" width="56" height="65" class="c-red"/><text x="122" y="176" font-size="15" class="c-chalk" text-anchor="middle">7.80</text><text x="122" y="269" font-size="15" class="c-dim" text-anchor="middle">Ep 2</text><rect x="170" y="222.3" width="56" height="25.8" class="c-red"/><text x="198" y="215.3" font-size="15" class="c-chalk" text-anchor="middle">3.09</text><text x="198" y="269" font-size="15" class="c-dim" text-anchor="middle">Ep 3</text><text x="358" y="64" font-size="16" class="c-chalk" text-anchor="middle">Tokens per turn (millions)</text><line x1="248" y1="248" x2="468" y2="248" class="s-faint" stroke-width="1.5"/><rect x="254" y="107.1" width="56" height="140.9" class="c-red"/><text x="282" y="100.1" font-size="15" class="c-chalk" text-anchor="middle">11.27</text><text x="282" y="269" font-size="15" class="c-dim" text-anchor="middle">Ep 1</text><rect x="330" y="178.5" width="56" height="69.5" class="c-red"/><text x="358" y="171.5" font-size="15" class="c-chalk" text-anchor="middle">5.56</text><text x="358" y="269" font-size="15" class="c-dim" text-anchor="middle">Ep 2</text><rect x="406" y="222.9" width="56" height="25.1" class="c-red"/><text x="434" y="215.9" font-size="15" class="c-chalk" text-anchor="middle">2.01</text><text x="434" y="269" font-size="15" class="c-dim" text-anchor="middle">Ep 3</text><text x="240" y="300" font-size="15" class="c-dim" text-anchor="middle">Full-episode amortized, including failed attempts,</text><text x="240" y="321" font-size="15" class="c-dim" text-anchor="middle">recovery and context compaction.</text><text x="240" y="342" font-size="15" class="c-dim" text-anchor="middle">Episodes completed 3, 5 and 25 face turns.</text><text x="240" y="363" font-size="15" class="c-dim" text-anchor="middle">P2 Sec 3.7 and Fig 6(b); one real session.</text></svg>
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
<svg class="chalk chalk-filter" viewBox="0 0 480 442" role="img" aria-labelledby="fig-time-t fig-time-d" style="display:block;width:100%;height:auto;max-width:600px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-time-t">Agent time to build and debug one task program</title><desc id="fig-time-d">Horizontal bars of mean agent time per task, in minutes, for twelve models in the ASPIRE debugging loop on LIBERO-Pro Goal, position perturbation. Times run from 31 minutes for GPT-6 Astra to 139 minutes for Kimi K3.</desc><text x="240" y="30" font-size="17.5" class="chalk-title" text-anchor="middle">Agent time to build and debug one task program</text><line x1="136" y1="48" x2="136" y2="360" class="s-faint" stroke-width="1"/><text x="136" y="379" font-size="15" class="c-dim" text-anchor="middle">0 min</text><line x1="236" y1="48" x2="236" y2="360" class="s-faint" stroke-width="1"/><text x="236" y="379" font-size="15" class="c-dim" text-anchor="middle">50 min</text><line x1="336" y1="48" x2="336" y2="360" class="s-faint" stroke-width="1"/><text x="336" y="379" font-size="15" class="c-dim" text-anchor="middle">100 min</text><line x1="436" y1="48" x2="436" y2="360" class="s-faint" stroke-width="1"/><text x="436" y="379" font-size="15" class="c-dim" text-anchor="middle">150 min</text><text x="128" y="66.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6 Astra</text><rect x="136" y="52.5" width="62" height="17" class="c-blue"/><text x="204" y="66" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">31 min</text><text x="128" y="92.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6 Sol</text><rect x="136" y="78.5" width="84" height="17" class="c-blue"/><text x="226" y="92" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">42 min</text><text x="128" y="118.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6 Luna</text><rect x="136" y="104.5" width="94" height="17" class="c-blue"/><text x="236" y="118" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">47 min</text><text x="128" y="144.5" font-size="15" class="c-chalk" text-anchor="end">GPT-6.1 Sol</text><rect x="136" y="130.5" width="98" height="17" class="c-blue"/><text x="240" y="144" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">49 min</text><text x="128" y="170.5" font-size="15" class="c-chalk" text-anchor="end">Claude Opus 5.5</text><rect x="136" y="156.5" width="102" height="17" class="c-blue"/><text x="244" y="170" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">51 min</text><text x="128" y="196.5" font-size="15" class="c-chalk" text-anchor="end">Claude Haiku 5.5</text><rect x="136" y="182.5" width="108" height="17" class="c-blue"/><text x="250" y="196" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">54 min</text><text x="128" y="222.5" font-size="15" class="c-chalk" text-anchor="end">Claude Sonnet 5.5</text><rect x="136" y="208.5" width="112" height="17" class="c-blue"/><text x="254" y="222" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">56 min</text><text x="128" y="248.5" font-size="15" class="c-chalk" text-anchor="end">Claude Opus 4.6</text><rect x="136" y="234.5" width="122" height="17" class="c-blue"/><text x="264" y="248" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">61 min</text><text x="128" y="274.5" font-size="15" class="c-chalk" text-anchor="end">Claude Fable 5.1</text><rect x="136" y="260.5" width="136" height="17" class="c-blue"/><text x="278" y="274" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">68 min</text><text x="128" y="300.5" font-size="15" class="c-chalk" text-anchor="end">Claude Opus 5</text><rect x="136" y="286.5" width="152" height="17" class="c-blue"/><text x="294" y="300" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">76 min</text><text x="128" y="326.5" font-size="15" class="c-chalk" text-anchor="end">Qwen 3.8 Max (open)</text><rect x="136" y="312.5" width="206" height="17" class="c-blue"/><text x="348" y="326" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">103 min</text><text x="128" y="352.5" font-size="15" class="c-chalk" text-anchor="end">Kimi K3 (open)</text><rect x="136" y="338.5" width="278" height="17" class="c-blue"/><text x="420" y="352" font-size="15" class="c-chalk s-board" stroke-width="5" paint-order="stroke">139 min</text><text x="240" y="406" font-size="15" class="c-dim" text-anchor="middle">Mean wall-clock agent time per task, before the program runs.</text><text x="240" y="427" font-size="15" class="c-dim" text-anchor="middle">Same runs as the model chart. P2 Table 18, column &quot;Agent time / task&quot;.</text></svg>
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
