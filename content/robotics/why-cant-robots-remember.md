---
title: "Why can't robots remember?"
description: 'Many robot policies decide from the last few frames. A snapshot of six ways to give them memory in October 2026, what each one stores, and what has been measured.'
date: '2026-10-19'
tags: ['robot-memory', 'long-horizon', 'navigation', 'vla']
section: 'recent-papers'
---

Say you ask a robot to walk down a hall, take the second door on the left, pick up the blue box and bring it back to where it started. It does the first part. Now it holds the box. The first door is far behind, the starting point is out of sight, and the camera shows a box and a wall.

Which way is home? Nothing in that frame says. The answer lives in something the robot saw a minute ago, so the real question is where a robot keeps it.

In October 2026 there is no agreed answer. People are trying frames, text notes, vectors, a few saved key frames, maps and libraries of code. The papers disagree on which one wins, and the biggest benchmark I found for this says the winner changes with the task. That is why I wanted to write down where things stand today.

## Four things people call memory

The word covers very different things, and mixing them causes most of the confusion:

- **Weights.** What pretraining baked in. A robot that knows what a mug is has a kind of memory, and it never changes during a task.
- **Recent history.** The last few frames, or a recurrent state. It lasts seconds.
- **Within-task memory.** Key frames, a map, a log of what happened so far. It lasts minutes and is thrown away when the task ends.
- **Across-task memory.** Skills and notes that survive the episode and help the next task. It lasts as long as someone keeps the file.

Most of this article is about the third kind, because that is where the hall example breaks. The fourth shows up at the end with ASPIRE.

## Many policies run on one to six frames

Short memory is still memory, and it works better than you might expect. This is how many frames some well-known policies read at each step:

| Policy | Frames per step | Source |
| --- | ---: | --- |
| [RT-1](https://arxiv.org/abs/2212.06817) | 6 | Section 5.1 |
| [Octo](https://arxiv.org/abs/2405.12213) | 2 | Section III-D |
| [Diffusion Policy](https://arxiv.org/abs/2303.04137) | 2 for most tasks | Appendix A.4 |
| [ACT](https://arxiv.org/abs/2304.13705) | 1 | Section IV-C |
| [π0](https://arxiv.org/abs/2410.24164) | 1 | Section IV |
| [OpenVLA](https://arxiv.org/abs/2406.09246) | 1, listed as a limitation | Section 6 |

History helps where it is used well. RT-1 loses accuracy when its six-frame history is removed: 97 to 82 percent on seen tasks and 76 to 62 percent on unseen ones (its Table 13, real robot). Each frame costs RT-1 only 8 tokens, thanks to a compression layer, so six frames stay cheap.

The five-minute hall is another matter. The [RoboPapers](https://robopapers.substack.com/p/ep54-memer-scaling-up-memory-for) episode on MemER puts it bluntly: most robot policies today largely lack memory and decide from what they can see right now. That is the hosts' summary, and it fits the table above.

## When one frame is not enough

Each of these compares the same system with and without memory, in the paper's own setup.

- **[SAM2Act](https://arxiv.org/abs/2501.18564)** (version 4), three memory tasks in simulation: 55.0 percent without its memory bank and 94.3 percent with it. The earlier version printed 53.7 and 91.3 before the authors fixed one task, so the version matters.
- **[RoboMME](https://arxiv.org/abs/2603.04639)**, 16 tasks in simulation: a plain π0.5 policy averages 17.93 percent. The best design the authors tried averages 44.51. Humans score 90.5.
- **[MemER](https://arxiv.org/abs/2510.20328)**, real robot, searching for 3 objects over 20 trials per task. The chart shows how many objects it found out of 60.

<figure class="article-figure">
<svg viewBox="0 0 480 236" role="img" aria-labelledby="fig-memer-t fig-memer-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-memer-t">MemER object search: objects retrieved out of 60</title><desc id="fig-memer-d">Horizontal bars. No history: 32. Eight recent frames: 38. Thirty-two recent frames: 47. MemER with up to eight stored keyframes: 59. A human giving the subtasks: 58.</desc><rect x="0.75" y="0.75" width="478.5" height="234.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="16" y="26" font-size="13" font-weight="700">Object Search, real robot: objects retrieved (of 60)</text><g font-size="12.5"><text x="16" y="62">No history</text><text x="16" y="94">8 recent frames</text><text x="16" y="126">32 recent frames</text><text x="16" y="158">MemER (8 key frames)</text><text x="16" y="190">Human gives subtasks</text></g><g><rect x="160" y="48" width="144" height="20" fill="#656b62"/><rect x="160" y="80" width="171" height="20" fill="#656b62"/><rect x="160" y="112" width="211.5" height="20" fill="#656b62"/><rect x="160" y="144" width="265.5" height="20" fill="#b44c2c"/><rect x="160" y="176" width="261" height="20" fill="#cfd1c8"/></g><g font-size="12.5" font-weight="700"><text x="310" y="63">32</text><text x="337" y="95">38</text><text x="377.5" y="127">47</text><text x="431.5" y="159" font-size="12.5">59</text><text x="427" y="191">58</text></g><text x="16" y="222" font-size="11" fill="#656b62">Source: MemER paper, Table 1. 20 trials per task. Human row: upper bound.</text></g></svg>
<figcaption>MemER's Object Search result. All methods share the same low-level policy (π0.5). The memory-free policy finds about half the objects. Adding 32 recent frames helps, but costs about a second per decision, and 8 chosen key frames do better.</figcaption>
</figure>

## Why not just add more frames?

Two separate reasons keep coming up, and they are different problems.

### Cost

Every frame becomes tokens, and the model attends over all of them. A good approximation from the [CronusVLA](https://arxiv.org/abs/2506.19816) appendix:

$$
N = (M + 1)\,P + I
$$

Here $M$ is the number of past frames, $P$ is the tokens per frame and $I$ is the instruction length. Attention cost grows roughly with $N^2$. The [HAMLET](https://arxiv.org/abs/2510.00695) paper measured it for a robot policy (GR00T N1.5 on RoboCasa, one A100):

| Frames | Latency | Memory |
| ---: | ---: | ---: |
| 1 | 80.5 ms | 289 MB |
| 4 | 108.5 ms | 1,051 MB |
| 8 | 193.0 ms | 2,023 MB |

Navigation models face the same bill, so they spend tokens unevenly. [NavFoM](https://arxiv.org/abs/2509.12129) gives the newest frame 64 tokens and each older frame 4, under a fixed budget. When the budget runs out it drops the oldest frames.

Training costs too. Mistral's [Robostral Navigate](https://arxiv.org/abs/2607.20785) trains on whole episodes packed into a single sequence with a special attention mask. The paper reports 22 times fewer training tokens, turning months into days.

### Copycat behavior

The second problem has a name. Imagine an expert whose joint command is 0.10, 0.12, 0.14, 0.16, and so on (an invented example). A policy that sees two frames can work out the last command, and copying it is wrong by only 0.02 each step. The training loss looks great. Then the cup moves, and the policy keeps copying.

[Wen and colleagues](https://arxiv.org/abs/2010.14876) measured this on six simulated control tasks: the cloned policy's actions were easier to predict from its own past actions than the expert's were, in all six. [De Haan and colleagues](https://arxiv.org/abs/1905.11979) showed that handing a cloned policy its previous action can lower its validation error and its reward at the same time (Pong, Hopper and others).

Nobody should read this as "history always hurts". The same Wen paper finds two frames beat one in five of six partially observed tasks. The picture is mixed:

| System | What happened with more history | Source |
| --- | --- | --- |
| Diffusion policy, 16 steps, no fix | Square 0.79 → 0.17, Tool-Hang 0.51 → 0.00 | [Torne et al.](https://arxiv.org/abs/2505.09561), Table 3 |
| Same paper, regression policy | No drop. Here the policy under-uses its past, the opposite of copycat | Torne et al., Fig. 2 |
| π0 and GR00T N1.5 (VLM start) | About flat from 1 to 8 frames | [ContextVLA](https://arxiv.org/abs/2510.04246), Fig. 2 (read from a chart) |
| GR00T N1.5, naive multi-frame | LIBERO 95.6 → 86.8 | HAMLET, Table 2 |

So the cause depends on the model. The authors of ContextVLA read their result as the pretrained VLM start doing the work, but that is their interpretation of an ablation, not a separate test.

## Six ways to remember, and what each one stores

<div class="table-scroll">

| Approach | What it stores | Measured so far | Where it hurts |
| --- | --- | --- | --- |
| **More frames**: RT-1, NavFoM, Robostral Navigate | Raw frames, or compressed tokens | RT-1: 97 → 82% on seen tasks without its history. HAMLET: 193 ms for 8 frames against 80.5 ms for 1 | Cost grows with every frame. Copycat on some models |
| **Text notes**: RoboMME symbolic models, MemER's subtasks | A sentence per event or subgoal | RoboMME BinFill: 77.56 for text against 39.56 for visual tokens. SwingXTimes: 5.11 against 92.00 | A sentence drops the details a task needs. Adding text to MemER's key frames gave no gain |
| **Latent vectors**: [MemoryVLA](https://arxiv.org/abs/2508.19236) | 16 entries of 256 visual tokens plus 1 meaning token each | SimplerEnv-Bridge 71.9% against 57.3% for CogACT-Large. Real temporal tasks 83 against 57 | Unreadable. RoboMME's recurrent variants stayed near no-memory (18 to 22%), which the authors blame on training |
| **Key frames**: MemER, SAM2Act+ | Up to 8 chosen frames, or 8 to 10 heatmap embeddings | Chart above. SAM2Act: 55.0 → 94.3 | Someone has to pick the frames. MemER only adds, never deletes |
| **Maps and graphs**: [ViNT](https://arxiv.org/abs/2306.14846), [NoMaD](https://arxiv.org/abs/2310.07896), [VLMaps](https://arxiv.org/abs/2210.05714) | A graph of images, or one language-image vector per map cell | These systems navigate long routes with a graph the papers call episodic memory | Drift and noise. VLMaps does not handle moving objects |
| **Skills in code**: [ASPIRE](https://arxiv.org/abs/2607.00272) | Text skills saved after a verified fix | LIBERO-Pro Long, zero-shot: 4.7% with an empty library, 30.5% with 90 tasks of skills | Entries go stale. A skill is verified on its source task only |

</div>

None of these numbers can be compared across rows. Each paper uses its own benchmark, robot, trial count and baselines, and RoboMME's numbers for MemER, SAM2Act+ and MemoryVLA are the RoboMME authors' own re-implementations.

## Drawing the problem

Take the hall again. The policy reads a short window directly. Everything older has to go through one of the routes below, and each route fails in its own way.

<figure class="article-figure">
<svg viewBox="0 0 480 530" role="img" aria-labelledby="fig-mem-t fig-mem-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-mem-t">Where the past goes when the policy only reads a short window</title><desc id="fig-mem-d">A strip of four frames from oldest to newest: start, past door 1, past door 2, blue box now. The two oldest frames sit outside the policy's window, so the policy cannot read where the robot started. The two newest frames go straight to the policy. A write line carries what happened into six memory routes: keep more frames, write a text note, compress to vectors, keep key frames, draw a map, and keep skills after the episode. A read line carries what each route kept back to the policy, which then chooses the next action.</desc><defs><marker id="fig-mem-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#242622"/></marker><marker id="fig-mem-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#2b6a8e"/></marker></defs><rect x="0.75" y="0.75" width="478.5" height="528.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="12" y="15" font-size="12.5" fill="#b44c2c" font-weight="700">outside the window</text><text x="246" y="15" font-size="12.5" fill="#2b6a8e" font-weight="700">what a short-window policy reads</text><rect x="8" y="20" width="224" height="50" fill="none" stroke="#b44c2c" stroke-width="1.5" stroke-dasharray="5 4"/><rect x="236" y="20" width="224" height="50" fill="none" stroke="#2b6a8e" stroke-width="2"/><g stroke="#242622" stroke-width="1.5" fill="#fff"><rect x="16" y="28" width="96" height="34"/><rect x="124" y="28" width="96" height="34"/><rect x="244" y="28" width="96" height="34"/><rect x="352" y="28" width="96" height="34"/></g><g font-size="12.5" text-anchor="middle"><text x="64" y="49">start</text><text x="172" y="49">past door 1</text><text x="292" y="49">past door 2</text><text x="400" y="49">blue box (now)</text></g><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M460,45 H472 V466 H364" stroke="#2b6a8e" marker-end="url(#fig-mem-b)"/><path d="M24,76 H448 M24,76 V114" stroke="#242622"/></g><text x="32" y="89" font-size="12" fill="#656b62">write: what happened</text><g stroke-width="1.5"><rect x="60" y="98" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="150" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="202" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="254" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="306" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="358" width="340" height="44" fill="#f6e4dc" stroke="#b44c2c"/></g><g fill="none" stroke="#242622" stroke-width="1.5" stroke-linecap="round"><path d="M24,120 H58" marker-end="url(#fig-mem-a)"/><path d="M24,172 H58" marker-end="url(#fig-mem-a)"/><path d="M24,224 H58" marker-end="url(#fig-mem-a)"/><path d="M24,276 H58" marker-end="url(#fig-mem-a)"/><path d="M24,328 H58" marker-end="url(#fig-mem-a)"/><path d="M24,380 H58" marker-end="url(#fig-mem-a)"/><path d="M24,114 V380"/><path d="M400,120 H440 M400,172 H440 M400,224 H440 M400,276 H440 M400,328 H440 M400,380 H440"/><path d="M440,120 V486 H364" marker-end="url(#fig-mem-a)"/></g><g font-size="13" font-weight="700"><text x="70" y="116">Keep more frames</text><text x="70" y="168">Write a text note</text><text x="70" y="220">Compress to vectors</text><text x="70" y="272">Keep key frames</text><text x="70" y="324">Draw a map</text><text x="70" y="376">Keep skills after the episode</text></g><g font-size="12.5" fill="#242622"><text x="70" y="133">RT-1, Robostral Navigate. Weak: cost, copycat</text><text x="70" y="185">RoboMME symbolic, MemER. Weak: drops detail</text><text x="70" y="237">MemoryVLA. Weak: unreadable, hard to train</text><text x="70" y="289">MemER, SAM2Act+. Weak: choosing the frames</text><text x="70" y="341">ViNT, VLMaps. Weak: drift, static scene</text><text x="70" y="393">ASPIRE. Weak: stale or redundant notes</text></g><text x="446" y="112" font-size="12" fill="#656b62" text-anchor="end">read</text><rect x="120" y="440" width="244" height="60" fill="#fff" stroke="#242622" stroke-width="2"/><g text-anchor="middle"><text x="242" y="466" font-size="14" font-weight="700">Policy: next action</text><text x="242" y="486" font-size="12">turn left, or head home?</text></g><text x="240" y="520" font-size="11" text-anchor="middle" fill="#656b62">Red: kept after the episode ends. Blue arrow: the direct window.</text></g></svg>
<figcaption>Where the past goes. The two oldest frames never reach a short-window policy. Each route chooses what to write and what to hand back, and each has a typical failure, taken from the papers in the table above.</figcaption>
</figure>

## The two models I started from

I first wrote "Robostroll" for a navigation model I remembered as seeing only a few frames. The model I mean is Mistral's [Robostral Navigate](https://arxiv.org/abs/2607.20785). The match comes from the name and the single-camera navigation topic.

Its paper says the model reads "a history of monocular RGB frames". It never says how long that history is. My memory of "a few frames" is not backed by the paper, and the training recipe suggests long histories are the point: each step is trained to see all the frames before it. On R2R-CE (unseen validation, a single RGB camera, no depth) the paper reports 77.4 percent success. Mistral's launch post reports 76.6 percent on the same split, probably from an earlier checkpoint. That is my inference.

The other one is [SOLE-R1](https://arxiv.org/abs/2603.28730), and the memory question is sharper there. It is not a policy but a reward model that watches video and scores progress toward a goal. It reads the goal, the first frame, a window of the latest frames and its own previous progress number. In the [RoboPapers interview](https://robopapers.substack.com/p/ep111-sole-r1-video-language-reasoning), first author Philip Schroeder says it reads the first, previous and current time steps from two cameras, so six frames, and that the reasoning text from one step is forgotten at the next. He suggests compressed text could serve as memory. That is an idea from the interview, not a result in the paper.

Here is the first-frame trick in pseudocode, my paraphrase of the paper's input definition:

```text
at each step t:
  input = [goal, first_frame, last K frames, progress_at(t-1)]
  reasoning, progress_at(t) = model(input)
  keep only progress_at(t)    # the reasoning text is dropped
```

## A key frame memory in eight lines

MemER shows how small a working memory can be. This is my paraphrase of its method:

```text
memory = []                          # at most 8 key frames
every step:
  look = last N frames + memory
  subtask, nominated = high_level_vlm(look)   # text for the low-level policy
  group nominated frames: gaps of 5 frames or less form one cluster
  for each cluster:
    add its median frame to memory
  low_level_policy(subtask) -> actions
```

The high-level model runs at about 1 Hz and writes a text subtask. A separate low-level π0.5 policy turns it into motion. Memory only grows. Tasks that need hours of memory could overflow it, and the authors say so.

<figure class="article-figure">
<video muted loop playsinline controls preload="metadata" aria-label="MemER's visualization of how the high-level model nominates key frames during an object search.">
<source src="https://jen-pan.github.io/memer/static/videos/search_viz_compress.mp4" type="video/mp4">
</video>
<figcaption>MemER's own visualization of keyframe nomination during an object search. Video from the <a href="https://jen-pan.github.io/memer/">MemER project page</a>. The page states no license for its media, so I link it from there and do not copy it.</figcaption>
</figure>

## Which design wins depends on the task

RoboMME is the closest thing to a common test. It has 16 tasks in four groups (counting, permanence, reference and imitation) and 14 memory variants on one π0.5 backbone. The authors report that no single memory design wins everywhere. The chart compares two of their designs on five tasks: text subgoals from a helper model against sampled visual tokens used as a modulator.

<figure class="article-figure">
<svg viewBox="0 0 480 330" role="img" aria-labelledby="fig-mme-t fig-mme-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-mme-t">RoboMME: text memory against visual-token memory on five tasks</title><desc id="fig-mme-d">Success rates in percent. BinFill: text 77.56, visual tokens 39.56. PickXTimes: text 95.33, visual tokens 87.33. SwingXTimes: text 5.11, visual tokens 92.00. StopCube: text 0.44, visual tokens 42.00. PatternLock: text 12.67, visual tokens 53.56.</desc><rect x="0.75" y="0.75" width="478.5" height="328.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="16" y="24" font-size="13" font-weight="700">RoboMME success rate by task (%)</text><rect x="16" y="34" width="12" height="12" fill="#2b6a8e"/><text x="34" y="44" font-size="11.5">Text subgoals (SimpleSG + Qwen)</text><rect x="240" y="34" width="12" height="12" fill="#b44c2c"/><text x="258" y="44" font-size="11.5">Visual tokens (FrameSamp + Modul)</text><g font-size="12.5" font-weight="700"><text x="16" y="84">BinFill</text><text x="16" y="140">PickXTimes</text><text x="16" y="196">SwingXTimes</text><text x="16" y="252">StopCube</text><text x="16" y="308">PatternLock</text></g><g fill="#2b6a8e"><rect x="108" y="64" width="224.9" height="16"/><rect x="108" y="120" width="276.5" height="16"/><rect x="108" y="176" width="14.8" height="16"/><rect x="108" y="232" width="1.3" height="16"/><rect x="108" y="288" width="36.7" height="16"/></g><g fill="#b44c2c"><rect x="108" y="82" width="114.7" height="16"/><rect x="108" y="138" width="253.3" height="16"/><rect x="108" y="194" width="266.8" height="16"/><rect x="108" y="250" width="121.8" height="16"/><rect x="108" y="306" width="155.3" height="16"/></g><g font-size="11.5" font-weight="700"><text x="338" y="76">77.56</text><text x="228" y="94">39.56</text><text x="390" y="132">95.33</text><text x="367" y="150">87.33</text><text x="128" y="188">5.11</text><text x="380" y="206">92.00</text><text x="115" y="244">0.44</text><text x="236" y="262">42.00</text><text x="150" y="300">12.67</text><text x="269" y="318">53.56</text></g></g></svg>
<figcaption>RoboMME, Table 3 (v3), simulation, 50 episodes per task, results averaged over the last 3 checkpoints and 3 seeds. Text wins simple counting. Visual tokens win tasks about motion and timing. Both designs use the same 512-token memory budget.</figcaption>
</figure>

Reading it: a text note like "two cubes in" is enough to count cubes, and useless for how many times a cube has swung left and right. Counting the swings needs the motion itself. The authors also report 25 of 40 real-robot trials for the visual design and 19 of 40 for the text design on four tasks, against 4 of 40 for no memory, from [their Table 4](https://arxiv.org/abs/2603.04639). The tasks are just 4, with 10 trials each.

<figure class="article-figure">
<video muted loop playsinline controls preload="metadata" aria-label="RoboMME task example: BinFill. Put two green cubes into the bin and press the button to stop.">
<source src="https://robomme.github.io/video/BinFill.mp4" type="video/mp4">
</video>
<figcaption>RoboMME task example: BinFill. The instruction: put two green cubes into the bin and press the button to stop. Video from the <a href="https://robomme.github.io/">RoboMME project page</a>, which states no license for its videos. Code and data are Apache 2.0 and the paper is CC BY 4.0.</figcaption>
</figure>

<figure class="article-figure">
<video muted loop playsinline controls preload="metadata" aria-label="RoboMME task example: SwingXTimes. Move a red cube to the right target, then the left, three times.">
<source src="https://robomme.github.io/video/SwingXtimes.mp4" type="video/mp4">
</video>
<figcaption>RoboMME task example: SwingXTimes. The instruction: pick up the red cube, move it to the right-side target and then the left-side target, three times, then put it down and press the button. This is the task where text memory scored 5.11 and visual tokens 92.00.</figcaption>
</figure>

## The library that remembers across tasks

[ASPIRE](/robotics/aspire-robots-that-keep-their-fixes/) is a different kind of memory. There is no learned policy. A coding agent writes Python for each task, and each verified fix is saved as a text skill: a failure signature, a trigger and a repair. A later task reads the matching notes.

That is across-task, procedural memory. It remembers how to recover from a planner error near a table edge. It does not remember where the box is in this room. The paper does not describe a map or an episodic store for the robot at run time, and whether the generated programs keep state between steps is not stated. Its authors list stale and redundant entries as open problems.

## What humans do

A person walking that hall does not replay the last six seconds. We also don't write ourselves a note for every door. We seem to keep a few facts, like "second door" and "box" and "home is behind me", and we get them back when needed. This is an analogy, not neuroscience, and I don't claim anyone has shown a robot should copy it.

## My read

This part is my opinion, and the writer's inference, so edit it freely.

- **There is no accepted answer yet.** In what I read, no system keeps one shape of memory and wins across tasks. RoboMME's best average is 44.51 against 90.5 for humans.
- **Robots are not empty-headed.** Maps in ViNT and NoMaD, recurrence, key frames and skill libraries all count as memory. "Robots can't remember" is wrong. "Robots have no shared way to remember" is closer.
- **The unit of memory is the open question.** A frame, a sentence, a vector, a map cell and a skill each keep something the others lose.
- **ASPIRE's way is clunky but readable.** A text note is easy to inspect and to fix. It is also exactly the kind of memory that goes stale.

What I would watch next: benchmarks that test several memory types on one robot, like RoboMME does in simulation, and navigation models that say plainly how long their history is.

<details>
<summary>Versions, dates and numbers I used</summary>

- Checked 19 October 2026 against the arXiv versions named in the text. SAM2Act v4 (v1 printed different numbers), RoboMME v3, MemER v1, MemoryVLA v2, Robostral Navigate v3.
- Robostral Navigate: paper 77.4 percent on R2R-CE unseen validation, launch post 76.6 percent. RxR-CE (English, unseen) 75.1 percent.
- The HAMLET table comes from its Table 4. ContextVLA's one-to-eight-frame comparison is read from a bar chart, so treat the values as approximate.
- RoboMME's row for MemER, SAM2Act+ and MemoryVLA reports the RoboMME authors' own re-implementations.
- Videos are linked from each project page. None of the four project pages states a license for its videos.

</details>
