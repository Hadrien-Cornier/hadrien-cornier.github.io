---
title: "Why can't robots remember?"
description: 'Many robot policies decide from the last few frames. A snapshot of six ways to give them memory in October 2026, what each one stores, and what has been measured.'
date: '2026-10-19'
tags: ['robot-memory', 'long-horizon', 'navigation', 'vla']
thumbnail: '/assets/robotics/why-cant-robots-remember/memer-object-search.png'
thumbnail_alt: 'Bar chart of MemER object search on a real robot: 32 of 60 objects retrieved with no history, 38 with 8 recent frames, 47 with 32 recent frames, 59 with 8 key frames, and 58 when a human gives the subtasks.'
---

The classic robot policy is Leonard from *Memento*.

Leonard can't form new memories. Everything he knows about the last hour sits in Polaroids, notes and tattoos, and he reads them to find out what he is doing. A policy that decides from its last frame or two is in a similar spot, and many of the systems below live this way.

His workarounds look a lot like what robots try. A Polaroid with a caption is a text note. A photo he keeps because it matters is a key frame. The film also shows the catch: a note can be wrong or out of date. In a robot that is a stale entry.

<figure class="video-embed">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/Wyc9TpJxf4A" title="Memento, official restoration trailer" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<figcaption>Memento (Christopher Nolan, 2000), official restoration trailer from Umbrella Entertainment. <a href="https://www.youtube.com/watch?v=Wyc9TpJxf4A">Watch on YouTube</a></figcaption>
</figure>

## Coding agents have no memory either

Coding agents have the same gap. They don't learn on the job. Each session starts from the model's weights plus whatever notes and files you put in front of it. It is like a coworker who gets handed a huge textbook before every shift and remembers nothing outside of it.

<link rel="stylesheet" href="/assets/robotics/chalk/chalk.css">
<svg class="chalk-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="chalk-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.32 1.16" result="mask"/><feComposite in="SourceGraphic" in2="mask" operator="in" result="chalk"/><feFlood flood-color="#1d2824" result="board"/><feComposite in="chalk" in2="board" operator="over"/></filter></svg>

<figure class="article-figure">
<svg class="chalk chalk-filter" viewBox="0 0 480 314" role="img" aria-labelledby="fig-day-t fig-day-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-day-t">What each worker knows at the start of each day</title><desc id="fig-day-d">Three rows, three days each. A coworker starts Monday with 2 pieces of knowledge, Tuesday with 3 and Wednesday with 5, because they keep what they learn. A coding agent starts every day with the same 4 notes it reads from a file and keeps nothing new. A robot policy starts every step with only its last 2 frames and has no notes file at all.</desc><text x="194" y="30" font-size="16" class="c-chalk" text-anchor="middle">Monday</text><text x="304" y="30" font-size="16" class="c-chalk" text-anchor="middle">Tuesday</text><text x="414" y="30" font-size="16" class="c-chalk" text-anchor="middle">Wednesday</text><text x="14" y="68" font-size="17" class="c-chalk">Coworker</text><text x="14" y="88" font-size="16" class="c-dim">keeps what</text><text x="14" y="106" font-size="16" class="c-dim">they learn</text><rect x="142" y="44" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="152" y="54" width="14" height="14" class="c-blue"/><rect x="170" y="54" width="14" height="14" class="c-blue"/><rect x="252" y="44" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="262" y="54" width="14" height="14" class="c-blue"/><rect x="280" y="54" width="14" height="14" class="c-blue"/><rect x="298" y="54" width="14" height="14" class="c-blue"/><rect x="362" y="44" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="372" y="54" width="14" height="14" class="c-blue"/><rect x="390" y="54" width="14" height="14" class="c-blue"/><rect x="408" y="54" width="14" height="14" class="c-blue"/><rect x="426" y="54" width="14" height="14" class="c-blue"/><rect x="444" y="54" width="14" height="14" class="c-blue"/><text x="14" y="148" font-size="17" class="c-chalk">Coding agent</text><text x="14" y="168" font-size="16" class="c-dim">rereads the</text><text x="14" y="186" font-size="16" class="c-dim">same notes</text><rect x="142" y="124" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="152" y="134" width="14" height="14" class="c-dim"/><rect x="170" y="134" width="14" height="14" class="c-dim"/><rect x="188" y="134" width="14" height="14" class="c-dim"/><rect x="206" y="134" width="14" height="14" class="c-dim"/><rect x="252" y="124" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="262" y="134" width="14" height="14" class="c-dim"/><rect x="280" y="134" width="14" height="14" class="c-dim"/><rect x="298" y="134" width="14" height="14" class="c-dim"/><rect x="316" y="134" width="14" height="14" class="c-dim"/><rect x="362" y="124" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="372" y="134" width="14" height="14" class="c-dim"/><rect x="390" y="134" width="14" height="14" class="c-dim"/><rect x="408" y="134" width="14" height="14" class="c-dim"/><rect x="426" y="134" width="14" height="14" class="c-dim"/><text x="14" y="228" font-size="17" class="c-chalk">Robot policy</text><text x="14" y="248" font-size="16" class="c-dim">sees its</text><text x="14" y="266" font-size="16" class="c-dim">last frames</text><rect x="142" y="204" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="152" y="214" width="14" height="14" class="c-red"/><rect x="170" y="214" width="14" height="14" class="c-red"/><rect x="252" y="204" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="262" y="214" width="14" height="14" class="c-red"/><rect x="280" y="214" width="14" height="14" class="c-red"/><rect x="362" y="204" width="104" height="66" class="c-none s-chalk" stroke-width="1.6"/><rect x="372" y="214" width="14" height="14" class="c-red"/><rect x="390" y="214" width="14" height="14" class="c-red"/><text x="240" y="300" font-size="16" class="c-dim" text-anchor="middle">Each square is one piece of knowledge in hand when the day starts.</text></svg>
<figcaption>What each worker knows when the day starts. The coworker adds to what they know every day. The coding agent starts from the same notes every day. The robot policy has no notes, only the last frames.</figcaption>
</figure>

I don't think that is where agents end up. A coworker who learns your codebase, your customers and your habits gets better every week. Maybe the end state is a model fine-tuned on the company.

OpenAI is moving the other way on its self-serve fine-tuning platform. Its [deprecations page](https://developers.openai.com/api/docs/deprecations) says that since 7 May 2026 organizations that never fine-tuned a model can't start there. From 6 January 2027, active customers can't create new jobs on it. A model that is already tuned keeps serving until its base model is retired.

The page gives no reason. My guess is batching. A provider can serve requests from every customer on one shared model at once, which is far more efficient than hosting a separate model for each company.

## Robots have it worse

Most robots don't even have a memory file. A robot is controlled by a policy, a network that turns the current camera frames and an instruction into the next action. Many standard policies use only the current frame or a short fixed history, with no persistent episode memory. There is no textbook to reread.

Some systems do better. [RT-1](https://arxiv.org/abs/2212.06817) (Brohan et al., 2022) reads six frames. [ViNT](https://arxiv.org/abs/2306.14846) (Shah et al., 2023) and [NoMaD](https://arxiv.org/abs/2310.07896) (Sridhar et al., 2023) build a graph of places they have seen. [MemER](https://arxiv.org/abs/2510.20328) (Sridhar et al., 2025) and the systems in [RoboMME](https://arxiv.org/abs/2603.04639) (Dai et al., 2026) keep key frames or text notes. They are the exceptions, and the rest of this article looks at what they store and what it costs.

## The hall problem

Say you ask a robot to walk down a hall, take the second door on the left, pick up the blue box and bring it back to where it started. It does the first part. Now it holds the box. The first door is far behind, the starting point is out of sight, and the camera shows a box and a wall.

Which way is home? Nothing in that frame says. The answer lives in something the robot saw a minute ago, so the real question is where a robot keeps it.

In October 2026 there is no agreed answer. People are trying frames, text notes, vectors, a few saved key frames, maps and libraries of code. The papers disagree on which one wins, and the biggest benchmark I found for this says the winner changes with the task. That is why I wanted to write down where things stand today.

## Four things people call memory

The word covers very different things, and mixing them causes most of the confusion:

- **Weights.** What pretraining baked in. A robot that knows what a mug is has a kind of memory, and it never changes during a task.
- **Recent history.** The last few frames, or a recurrent state. It lasts seconds.
- **Within-task memory.** Key frames, a map, a log of what happened so far. It lasts minutes and is thrown away when the task ends.
- **Across-task memory.** Skills and notes that survive the episode and help the next task. It lasts as long as someone keeps the file.

Most of this article is about the third kind, because that is where the hall example breaks. The fourth shows up at the end with [ASPIRE](https://arxiv.org/abs/2607.00272) (Lu et al., 2026).

## Many policies run on one to six frames

Short memory is still memory, and it works better than you might expect. This is how many frames some well-known policies read at each step:

<div class="essay-table policy">

| Policy | Authors, year | Frames per step | Source |
| --- | --- | ---: | --- |
| [RT-1](https://arxiv.org/abs/2212.06817) | Brohan et al., 2022 | 6 | Section 5.1 |
| [Octo](https://arxiv.org/abs/2405.12213) | Octo Model Team, 2024 | 2 | Section III-D |
| [Diffusion Policy](https://arxiv.org/abs/2303.04137) | Chi et al., 2023 | 2 for most tasks | Appendix A.4 |
| [ACT](https://arxiv.org/abs/2304.13705) | Zhao et al., 2023 | 1 | Section IV-C |
| [π0](https://arxiv.org/abs/2410.24164) | Black et al., 2024 | 1 | Section IV |
| [OpenVLA](https://arxiv.org/abs/2406.09246) | Kim et al., 2024 | 1, listed as a limitation | Section 6 |

</div>

History helps where it is used well. RT-1 loses accuracy when its six-frame history is removed: 97 to 82 percent on seen tasks and 76 to 62 percent on unseen ones (its Table 13, real robot). Each frame costs RT-1 only 8 tokens, thanks to a compression layer, so six frames stay cheap.

The five-minute hall is another matter. The [RoboPapers](https://robopapers.substack.com/p/ep54-memer-scaling-up-memory-for) episode on MemER puts it bluntly: most robot policies today largely lack memory and decide from what they can see right now. That is the hosts' summary, and it fits the table above.

## When one frame is not enough

Each of these compares the same system with and without memory, in the paper's own setup.

- **[SAM2Act](https://arxiv.org/abs/2501.18564)** (Fang et al., 2025), version 4, three memory tasks in simulation: 55.0 percent without its memory bank and 94.3 percent with it. The earlier version printed 53.7 and 91.3 before the authors fixed one task, so the version matters.
- **[RoboMME](https://arxiv.org/abs/2603.04639)** (Dai et al., 2026), 16 tasks in simulation: a plain [π0.5](https://arxiv.org/abs/2504.16054) (Physical Intelligence, 2025) policy averages 17.93 percent. The best design the authors tried averages 44.51. Humans score 90.5.
- **[MemER](https://arxiv.org/abs/2510.20328)** (Sridhar et al., 2025), real robot, searching for 3 objects over 20 trials per task. The chart shows how many objects it found out of 60.

<figure class="article-figure">
<svg class="chalk chalk-filter" viewBox="0 0 480 274" role="img" aria-labelledby="fig-memer-t fig-memer-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-memer-t">MemER object search: objects retrieved out of 60</title><desc id="fig-memer-d">Horizontal bars. No history: 32. Eight recent frames: 38. Thirty-two recent frames: 47. MemER with up to eight stored keyframes: 59. A human giving the subtasks: 58.</desc><text x="16" y="32" font-size="18" class="chalk-title">Object Search, real robot: objects retrieved (of 60)</text><text x="16" y="71.4" font-size="16" class="c-chalk">No history</text><rect x="164" y="54" width="147.2" height="24" class="c-dim"/><text x="319.2" y="71.4" font-size="16" class="c-chalk">32</text><text x="16" y="109.4" font-size="16" class="c-chalk">8 recent frames</text><rect x="164" y="92" width="174.8" height="24" class="c-dim"/><text x="346.8" y="109.4" font-size="16" class="c-chalk">38</text><text x="16" y="147.4" font-size="16" class="c-chalk">32 recent frames</text><rect x="164" y="130" width="216.2" height="24" class="c-dim"/><text x="388.2" y="147.4" font-size="16" class="c-chalk">47</text><text x="16" y="185.4" font-size="16" class="c-chalk">MemER (8 key frames)</text><rect x="164" y="168" width="271.4" height="24" class="c-red"/><text x="443.4" y="185.4" font-size="16" class="c-chalk">59</text><text x="16" y="223.4" font-size="16" class="c-chalk">Human gives subtasks</text><rect x="164" y="206" width="266.8" height="24" class="c-faint"/><text x="438.8" y="223.4" font-size="16" class="c-chalk">58</text><text x="16" y="260" font-size="16" class="c-dim">Source: MemER paper, Table 1. 20 trials per task. Human row: upper bound.</text></svg>
<figcaption>MemER's Object Search result. All methods share the same low-level policy (π0.5). The memory-free policy finds about half the objects. Adding 32 recent frames helps, but costs about a second per decision, and 8 chosen key frames do better.</figcaption>
</figure>

## Why not just add more frames?

Two separate reasons keep coming up, and they are different problems.

### Cost

Every frame becomes tokens, and the model attends over all of them. A good approximation from the appendix of [CronusVLA](https://arxiv.org/abs/2506.19816) (Li et al., 2025):

$$
N = (M + 1)\,P + I
$$

Here $M$ is the number of past frames, $P$ is the tokens per frame and $I$ is the instruction length. Attention cost grows roughly with $N^2$. The [HAMLET](https://arxiv.org/abs/2510.00695) paper (Koo et al., 2025) measured it for a robot policy ([GR00T N1.5](https://arxiv.org/abs/2503.14734) on [RoboCasa](https://arxiv.org/abs/2406.02523), one A100):

<div class="essay-table latency">

| Frames | Latency | Memory |
| ---: | ---: | ---: |
| 1 | 80.5 ms | 289 MB |
| 4 | 108.5 ms | 1,051 MB |
| 8 | 193.0 ms | 2,023 MB |

</div>

Navigation models face the same bill, so they spend tokens unevenly. [NavFoM](https://arxiv.org/abs/2509.12129) (Zhang et al., 2025) gives the newest frame 64 tokens and each older frame 4, under a fixed budget. When the budget runs out it drops the oldest frames.

Training costs too. Mistral's [Robostral Navigate](https://arxiv.org/abs/2607.20785) (Bounhar et al., 2026) trains on whole episodes packed into a single sequence with a special attention mask. The paper reports 22 times fewer training tokens, turning months into days.

### Copycat behavior

The second problem has a name. Imagine an expert whose joint command is 0.10, 0.12, 0.14, 0.16, and so on. A policy that sees two frames can work out the last command, and copying it is wrong by only 0.02 each step. The training loss looks great. Then the cup moves, and the policy keeps copying.

[Wen and colleagues](https://arxiv.org/abs/2010.14876) (2020) measured this on six simulated control tasks: the cloned policy's actions were easier to predict from its own past actions than the expert's were, in all six. [De Haan and colleagues](https://arxiv.org/abs/1905.11979) (2019) showed that handing a cloned policy its previous action can lower its validation error and its reward at the same time (Pong, Hopper and others). [Chuang and colleagues](https://arxiv.org/abs/2207.09705) (2022) trace the same effect to how information flows through the network, and propose an architecture that avoids it by design.

Nobody should read this as "history always hurts". The same Wen paper finds two frames beat one in five of six partially observed tasks. The picture is mixed:

<div class="essay-table history">

| System | What happened with more history | Source |
| --- | --- | --- |
| Diffusion policy, 16 steps, no fix | Square 0.79 → 0.17, Tool-Hang 0.51 → 0.00 | [Torne et al., 2025](https://arxiv.org/abs/2505.09561), Table 3 |
| Same paper, regression policy | No drop. Here the policy under-uses its past, the opposite of copycat | Torne et al., 2025, Fig. 2 |
| π0 and [GR00T N1.5](https://arxiv.org/abs/2503.14734) (VLM start) | About flat from 1 to 8 frames | [ContextVLA](https://arxiv.org/abs/2510.04246) (Jang et al., 2025), Fig. 2 (read from a chart) |
| GR00T N1.5, naive multi-frame | [LIBERO](https://arxiv.org/abs/2306.03310) 95.6 → 86.8 | [HAMLET](https://arxiv.org/abs/2510.00695) (Koo et al., 2025), Table 2 |

</div>

So the cause depends on the model. The authors of ContextVLA read their result as the pretrained VLM start doing the work, but that is their interpretation of an ablation, not a separate test. A 2026 audit by [Liao and Cao](https://arxiv.org/abs/2607.03372) looked inside three frozen VLAs. Past-frame content stays decodable, but information unique to the history is nearly absent, and the models use history mainly when the current frame is heavily degraded.

## Six ways to remember, and what each one stores

<div class="essay-table ways">

| Approach | What it stores | Measured so far | Where it hurts |
| --- | --- | --- | --- |
| **More frames**: RT-1, NavFoM, Robostral Navigate (cited above) | Raw frames, or compressed tokens | RT-1: 97 → 82% on seen tasks without its history. HAMLET: 193 ms for 8 frames against 80.5 ms for 1 | Cost grows with every frame. Copycat on some models |
| **Text notes**: RoboMME symbolic models, MemER's subtasks (cited above) | A sentence per event or subgoal | RoboMME BinFill: 77.56 for text against 39.56 for visual tokens. SwingXTimes: 5.11 against 92.00 | A sentence drops the details a task needs. Adding text to MemER's key frames gave no gain |
| **Latent vectors**: [MemoryVLA](https://arxiv.org/abs/2508.19236) (Shi et al., 2025) | 16 entries of 256 visual tokens plus 1 meaning token each | [SimplerEnv](https://arxiv.org/abs/2405.05941)-Bridge 71.9% against 57.3% for [CogACT](https://arxiv.org/abs/2411.19650)-Large. Real temporal tasks 83 against 57 | Unreadable. RoboMME's recurrent variants stayed near no-memory (18 to 22%), which the authors blame on training |
| **Key frames**: MemER, [SAM2Act](https://arxiv.org/abs/2501.18564)+ | Up to 8 chosen frames, or 8 to 10 heatmap embeddings | Chart above. SAM2Act: 55.0 → 94.3 | Someone has to pick the frames. MemER only adds, never deletes |
| **Maps and graphs**: [ViNT](https://arxiv.org/abs/2306.14846), [NoMaD](https://arxiv.org/abs/2310.07896), [VLMaps](https://arxiv.org/abs/2210.05714) (Huang et al., 2022) | A graph of images, or one language-image vector per map cell | These systems navigate long routes with a graph the papers call episodic memory | Drift and noise. VLMaps does not handle moving objects |
| **Skills in code**: [ASPIRE](https://arxiv.org/abs/2607.00272) (Lu et al., 2026) | Text skills saved after a verified fix | [LIBERO-Pro](https://arxiv.org/abs/2510.03827) Long, zero-shot: 4.7% with an empty library, 30.5% with 90 tasks of skills | Entries go stale. A skill is verified on its source task only |

</div>

Each row comes from a different paper, with its own benchmark, robot, trial count and baselines. RoboMME's numbers for MemER, SAM2Act+ and MemoryVLA are the RoboMME authors' own re-implementations.

For one latent-vector design up close, see my [Imprint explainer](/papers/imprint/) (Wu et al., 2026). Instead of picking what to keep, it compresses video, actions and joint states into 256 memory tokens trained to rebuild the past, and it takes π0.5 from 25.4 to 72.8 percent success on RMBench's nine memory tasks.

## Drawing the problem

Take the hall again. The policy reads a short window directly. Everything older has to go through one of the routes below, and each route fails in its own way.

<figure class="article-figure">
<svg class="chalk chalk-filter" viewBox="0 0 480 632" role="img" aria-labelledby="fig-mem-t fig-mem-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-mem-t">Where the past goes when the policy only reads a short window</title><desc id="fig-mem-d">A strip of four frames from oldest to newest: start, past door 1, past door 2, blue box now. The two oldest frames sit outside the policy's window, so the policy cannot read where the robot started. The two newest frames go straight to the policy. A write line carries what happened into six memory routes: keep more frames, write a text note, compress to vectors, keep key frames, draw a map, and keep skills after the episode. A read line carries what each route kept back to the policy, which then chooses the next action.</desc><defs><marker id="fig-mem-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="c-chalk"/></marker><marker id="fig-mem-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="c-blue"/></marker></defs><text x="12" y="20" font-size="16" class="c-red">outside the window</text><text x="244" y="20" font-size="16" class="c-blue">what a short-window policy reads</text><rect x="8" y="28" width="224" height="62" class="c-none s-red" stroke-width="1.6" stroke-dasharray="6 5"/><rect x="236" y="28" width="224" height="62" class="c-none s-blue" stroke-width="2"/><rect x="16" y="36" width="96" height="46" class="c-none s-chalk" stroke-width="1.6"/><text x="64" y="64.4" font-size="16" class="c-chalk" text-anchor="middle">start</text><rect x="124" y="36" width="96" height="46" class="c-none s-chalk" stroke-width="1.6"/><text x="172" y="64.4" font-size="16" class="c-chalk" text-anchor="middle">past door 1</text><rect x="244" y="36" width="96" height="46" class="c-none s-chalk" stroke-width="1.6"/><text x="292" y="64.4" font-size="16" class="c-chalk" text-anchor="middle">past door 2</text><rect x="352" y="36" width="96" height="46" class="c-none s-chalk" stroke-width="1.6"/><text x="400" y="64.4" font-size="16" class="c-chalk" text-anchor="middle">blue box (now)</text><path d="M460,59 H472 V546 H366" class="c-none s-blue" stroke-width="1.8" marker-end="url(#fig-mem-b)"/><path d="M24,98 H448 M24,98 V465" class="c-none s-chalk" stroke-width="1.8"/><text x="32" y="116" font-size="16" class="c-dim">write: what happened</text><path d="M24,155 H58" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><path d="M24,217 H58" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><path d="M24,279 H58" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><path d="M24,341 H58" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><path d="M24,403 H58" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><path d="M24,465 H58" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><path d="M400,155 H440 M400,217 H440 M400,279 H440 M400,341 H440 M400,403 H440 M400,465 H440" class="c-none s-chalk" stroke-width="1.8"/><path d="M440,155 V572 H366" class="c-none s-chalk" stroke-width="1.8" marker-end="url(#fig-mem-a)"/><text x="446" y="122" font-size="16" class="c-dim" text-anchor="end">read</text><rect x="60" y="128" width="340" height="54" class="c-none s-chalk" stroke-width="1.6"/><text x="70" y="150" font-size="17" class="c-chalk">Keep more frames</text><text x="70" y="171" font-size="16" class="c-dim">RT-1, Robostral Navigate. Weak: cost, copycat</text><rect x="60" y="190" width="340" height="54" class="c-none s-chalk" stroke-width="1.6"/><text x="70" y="212" font-size="17" class="c-chalk">Write a text note</text><text x="70" y="233" font-size="16" class="c-dim">RoboMME symbolic, MemER. Weak: drops detail</text><rect x="60" y="252" width="340" height="54" class="c-none s-chalk" stroke-width="1.6"/><text x="70" y="274" font-size="17" class="c-chalk">Compress to vectors</text><text x="70" y="295" font-size="16" class="c-dim">MemoryVLA. Weak: unreadable, hard to train</text><rect x="60" y="314" width="340" height="54" class="c-none s-chalk" stroke-width="1.6"/><text x="70" y="336" font-size="17" class="c-chalk">Keep key frames</text><text x="70" y="357" font-size="16" class="c-dim">MemER, SAM2Act+. Weak: choosing the frames</text><rect x="60" y="376" width="340" height="54" class="c-none s-chalk" stroke-width="1.6"/><text x="70" y="398" font-size="17" class="c-chalk">Draw a map</text><text x="70" y="419" font-size="16" class="c-dim">ViNT, VLMaps. Weak: drift, static scene</text><rect x="60" y="438" width="340" height="54" class="s-red" fill="#f6e5e0" stroke-width="1.6"/><text x="70" y="460" font-size="17" class="c-chalk">Keep skills after the episode</text><text x="70" y="481" font-size="16" class="c-dim">ASPIRE. Weak: stale or redundant notes</text><rect x="120" y="522" width="244" height="68" class="c-none s-chalk" stroke-width="2"/><text x="242" y="550" font-size="17" class="c-chalk" text-anchor="middle">Policy: next action</text><text x="242" y="574" font-size="16" class="c-dim" text-anchor="middle">turn left, or head home?</text><text x="240" y="618" font-size="16" class="c-dim" text-anchor="middle">Red: kept after the episode ends. Blue arrow: the direct window.</text></svg>
<figcaption>Where the past goes. The two oldest frames never reach a short-window policy. Each route chooses what to write and what to hand back, and each has a typical failure, taken from the papers in the table above.</figcaption>
</figure>

## The two models I started from

I first wrote "Robostroll" for a navigation model I remembered as seeing only a few frames. The model is Mistral's [Robostral Navigate](https://arxiv.org/abs/2607.20785) (Bounhar et al., 2026).

Its paper says the model reads "a history of monocular RGB frames". It never says how long that history is. My memory of "a few frames" is not backed by the paper, and the training recipe suggests long histories are the point: each step is trained to see all the frames before it. On [R2R-CE](https://arxiv.org/abs/2004.02857) (unseen validation, a single RGB camera, no depth) the paper reports 77.4 percent success. Mistral's launch post reports 76.6 percent on the same split, probably from an earlier checkpoint. That is my inference.

The other one is [SOLE-R1](https://arxiv.org/abs/2603.28730) (Schroeder et al., 2026), and the memory question is sharper there. It is not a policy but a reward model that watches video and scores progress toward a goal. It reads the goal, the first frame, a window of the latest frames and its own previous progress number. In the [RoboPapers interview](https://robopapers.substack.com/p/ep111-sole-r1-video-language-reasoning), first author Philip Schroeder says it reads the first, previous and current time steps from two cameras, so six frames, and that the reasoning text from one step is forgotten at the next. He suggests compressed text could serve as memory. That is an idea from the interview, not a result in the paper.

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
<figcaption>MemER's own visualization of keyframe nomination during an object search. Video from the <a href="https://jen-pan.github.io/memer/">MemER project page</a>. Video credit: the MemER authors.</figcaption>
</figure>

## Which design wins depends on the task

RoboMME is the closest thing to a common test. It has 16 tasks in four groups (counting, permanence, reference and imitation) and 14 memory variants on one π0.5 backbone. The authors report that no single memory design wins everywhere. The chart compares two of their designs on five tasks: text subgoals from a helper model against sampled visual tokens used as a modulator.

<figure class="article-figure">
<svg class="chalk chalk-filter" viewBox="0 0 480 415" role="img" aria-labelledby="fig-mme-t fig-mme-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-mme-t">RoboMME: text memory against visual-token memory on five tasks</title><desc id="fig-mme-d">Success rates in percent. BinFill: text 77.56, visual tokens 39.56. PickXTimes: text 95.33, visual tokens 87.33. SwingXTimes: text 5.11, visual tokens 92.00. StopCube: text 0.44, visual tokens 42.00. PatternLock: text 12.67, visual tokens 53.56.</desc><text x="16" y="32" font-size="18" class="chalk-title">RoboMME success rate by task (%)</text><rect x="16" y="48" width="14" height="14" class="c-blue"/><text x="38" y="60.4" font-size="16" class="c-chalk">Text subgoals (SimpleSG + Qwen)</text><rect x="16" y="72" width="14" height="14" class="c-red"/><text x="38" y="84.4" font-size="16" class="c-chalk">Visual tokens (FrameSamp + Modul)</text><text x="16" y="128.9" font-size="16" class="c-chalk">BinFill</text><rect x="108" y="104" width="255.9" height="18" class="c-blue"/><text x="370.9" y="118.4" font-size="16" class="c-chalk">77.56</text><rect x="108" y="125" width="130.5" height="18" class="c-red"/><text x="245.5" y="139.4" font-size="16" class="c-chalk">39.56</text><text x="16" y="192.9" font-size="16" class="c-chalk">PickXTimes</text><rect x="108" y="168" width="314.6" height="18" class="c-blue"/><text x="429.6" y="182.4" font-size="16" class="c-chalk">95.33</text><rect x="108" y="189" width="288.2" height="18" class="c-red"/><text x="403.2" y="203.4" font-size="16" class="c-chalk">87.33</text><text x="16" y="256.9" font-size="16" class="c-chalk">SwingXTimes</text><rect x="108" y="232" width="16.9" height="18" class="c-blue"/><text x="131.9" y="246.4" font-size="16" class="c-chalk">5.11</text><rect x="108" y="253" width="303.6" height="18" class="c-red"/><text x="418.6" y="267.4" font-size="16" class="c-chalk">92.00</text><text x="16" y="320.9" font-size="16" class="c-chalk">StopCube</text><rect x="108" y="296" width="1.5" height="18" class="c-blue"/><text x="116.5" y="310.4" font-size="16" class="c-chalk">0.44</text><rect x="108" y="317" width="138.6" height="18" class="c-red"/><text x="253.6" y="331.4" font-size="16" class="c-chalk">42.00</text><text x="16" y="384.9" font-size="16" class="c-chalk">PatternLock</text><rect x="108" y="360" width="41.8" height="18" class="c-blue"/><text x="156.8" y="374.4" font-size="16" class="c-chalk">12.67</text><rect x="108" y="381" width="176.7" height="18" class="c-red"/><text x="291.7" y="395.4" font-size="16" class="c-chalk">53.56</text></svg>
<figcaption>RoboMME, Table 3 (v3), simulation, 50 episodes per task, results averaged over the last 3 checkpoints and 3 seeds. Text wins simple counting. Visual tokens win tasks about motion and timing. Both designs use the same 512-token memory budget.</figcaption>
</figure>

Reading it: a text note like "two cubes in" is enough to count cubes, and useless for how many times a cube has swung left and right. Counting the swings needs the motion itself. The authors also report 25 of 40 real-robot trials for the visual design and 19 of 40 for the text design on four tasks, against 4 of 40 for no memory, from [their Table 4](https://arxiv.org/abs/2603.04639). The tasks are just 4, with 10 trials each.

<figure class="article-figure">
<video muted loop playsinline controls preload="metadata" aria-label="RoboMME task example: BinFill. Put two green cubes into the bin and press the button to stop.">
<source src="https://robomme.github.io/video/BinFill.mp4" type="video/mp4">
</video>
<figcaption>RoboMME task example: BinFill. The instruction: put two green cubes into the bin and press the button to stop. Video from the <a href="https://robomme.github.io/">RoboMME project page</a>. Video credit: the RoboMME authors. Code and data are Apache 2.0 and the paper is CC BY 4.0.</figcaption>
</figure>

<figure class="article-figure">
<video muted loop playsinline controls preload="metadata" aria-label="RoboMME task example: SwingXTimes. Move a red cube to the right target, then the left, three times.">
<source src="https://robomme.github.io/video/SwingXtimes.mp4" type="video/mp4">
</video>
<figcaption>RoboMME task example: SwingXTimes. The instruction: pick up the red cube, move it to the right-side target and then the left-side target, three times, then put it down and press the button. This is the task where text memory scored 5.11 and visual tokens 92.00.</figcaption>
</figure>

## The library that remembers across tasks

[ASPIRE](/robotics/can-you-zero-shot-robotics-with-a-coding-agent/) ([paper](https://arxiv.org/abs/2607.00272), Lu et al., 2026) is a different kind of memory. There is no learned policy. A coding agent writes Python for each task, and each verified fix is saved as a text skill: a failure signature, a trigger and a repair. A later task reads the matching notes.

That is across-task, procedural memory. It remembers how to recover from a planner error near a table edge. It does not remember where the box is in this room. The paper does not describe a map or an episodic store for the robot at run time, and whether the generated programs keep state between steps is not stated. Its authors list stale and redundant entries as open problems.

## More work worth knowing

A literature sweep of 148 robot-memory papers (titles, authors and years checked against arXiv and Crossref) shows how fast this field moves: 88 of them were posted in 2026. These 22 matter most for the argument above. Each description in the last column comes from the paper's own abstract.

<div class="essay-table more">

| Kind | Paper | Authors, year | What it does or finds |
| --- | --- | --- | --- |
| Copycat and unused history | [Resolving Copycat Problems in Visual Imitation Learning via Residual Action Prediction](https://arxiv.org/abs/2207.09705) | Chuang et al., 2022 | Explains the copycat problem from how information flows through the network, and proposes an architecture that avoids it by design. Tested in CARLA and MuJoCo. |
|  | [Present but Not Remembered: Auditing How Frozen VLAs Encode, Deploy, and Steer Visual History](https://arxiv.org/abs/2607.03372) | Liao and Cao, 2026 | In three frozen VLAs, past-frame content can be decoded from the network, but information unique to the history is nearly absent. The models use history only when the current frame is heavily degraded. |
|  | [Memory That Changes Action Is Not Memory That Guides It: Counterfactual Auditing of History-Conditioned Robot Policies](https://arxiv.org/abs/2609.27247) | Zhang et al., 2026 | A counterfactual audit of a policy with memory. Every audited Put Back pair changes the action, but only 20 of 64 pairs are fully reliable. On a dual-arm robot, 5 of 9 completed Put Back tries reach the wrong target. |
|  | [Beyond Success Rate: Interventional Evaluation of Memory in Vision-Language-Action Systems](https://arxiv.org/abs/2610.23372) | Luo et al., 2026 | Asks whether memory plays a causal role, with interventions at the retrieval interface. On its ChainBench, the full memory setup raises task success from 39.1% to 74.3%. |
| More frames, kept or picked | [Training and Evaluating Diffusion Policies with Long Context Lengths](https://arxiv.org/abs/2606.16447) | Agarwal et al., 2026 | Tests context length for Diffusion Policy. Naive scaling is less brittle than earlier papers suggest, with the right conditioning method and backbone. |
|  | [BPP: Long-Context Robot Imitation Learning by Focusing on Key History Frames](https://arxiv.org/abs/2602.15010) | Mark et al., 2026 | Conditions on a few key frames found by a vision-language model. Reports 70% higher success than the best comparison on four real-world tasks. |
|  | [Memory Retrieval in Visuomotor Policies for Long-Horizon Robot Control](https://arxiv.org/abs/2606.25136) | Shah et al., 2026 | HALO: attention-based memory retrieval, with vision-language model priors distilled in to suppress spurious correlations. |
|  | [KEMO: Event-Driven Keyframe Memory for Long-Horizon Robot Manipulation with VLA Policies](https://arxiv.org/abs/2606.23589) | Zeng et al., 2026 | KEMO: keeps key frames at detected state changes, using robot kinematics and visual filtering, and feeds them to a VLA as memory tokens. |
|  | [StreamVLN: Streaming Vision-and-Language Navigation via SlowFast Context Modeling](https://arxiv.org/abs/2507.05240) | Wei et al., 2025 | Navigation. A sliding window of recent turns plus a compressed memory of older visual states, so cost stays bounded. |
| Text and typed state | [MEM: Multi-Scale Embodied Memory for Vision Language Action Models](https://arxiv.org/abs/2603.03596) | Torne et al., 2026 | Video for the short term and text for the long term. Runs tasks of up to fifteen minutes, like cleaning a kitchen. |
|  | [Notes-to-Self: Scratchpad Augmented VLAs for Memory Dependent Manipulation Tasks](https://arxiv.org/abs/2602.21013) | Haresh et al., 2026 | A VLA with a language scratchpad that holds object positions and progress through the plan. |
|  | [Simple Agentic Memory for Generalist Robot Policies](https://arxiv.org/abs/2609.36595) | Zhang et al., 2026 | A training-free layer for frozen policies that keeps compact typed state: relations, references, progress and routes. Reports 67.17% on RoboMME against 44.51% for the strongest non-oracle baseline. |
| Vectors and recurrence | [MemoryVLA++: Temporal Modeling via Memory and Imagination in Vision-Language-Action Models](https://arxiv.org/abs/2606.09827) | Shi et al., 2026 | Extends MemoryVLA with a world model that imagines future states, guided by the memory bank. |
|  | [μVLA: On Recurrent Memory for Partially Observable Manipulation in VLA Models](https://arxiv.org/abs/2606.12497) | Cherepanov et al., 2026 | Isolates recurrence in a pretrained VLA: learnable memory tokens carried across steps. On MIKASA-Robo, success on five training tasks rises from 0.42 to 0.84. |
| Maps and retrieval | [Scene Memory Transformer for Embodied Agents in Long-Horizon Tasks](https://arxiv.org/abs/1903.03878) | Fang et al., 2019 | An early memory-based policy. Each observation goes into a memory that attention reads. Beats reactive and memory-based policies on visual navigation. |
|  | [ReMEmbR: Building and Reasoning Over Long-Horizon Spatio-Temporal Memory for Robot Navigation](https://arxiv.org/abs/2409.13682) | Anwar et al., 2024 | Builds a memory from time, place and images, then queries it with a language model. Answers questions over long navigation histories at low latency. |
|  | [3D-Mem: 3D Scene Memory for Embodied Exploration and Reasoning](https://arxiv.org/abs/2411.17735) | Yang et al., 2024 | A scene memory of multi-view images (Memory Snapshots) plus Frontier Snapshots of unexplored areas, for exploration and reasoning. |
| Skills in code | [Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291) | Wang et al., 2023 | An ever-growing library of executable code skills, in Minecraft, queried to solve new tasks. |
|  | [Skills in Weights, Memory in Code: Hybrid Learning for Memory-Dependent Robot Manipulation](https://arxiv.org/abs/2608.09410) | Zhao et al., 2026 | HyMeS: a coding agent writes executable memory-management heuristics from rollout feedback and uses them to steer a VLA. |
| Benchmarks and surveys | [RMBench: Memory-Dependent Robotic Manipulation Benchmark with Insights into Policy Design](https://arxiv.org/abs/2603.01229) | Chen et al., 2026 | RMBench: 9 memory-dependent manipulation tasks in simulation, plus Mem-0, a modular policy for ablations. |
|  | [MIKASA-Robo-VLA: Benchmarking Memory in VLA Models for Long-Horizon Manipulation](https://arxiv.org/abs/2610.00604) | Cherepanov et al., 2026 | 90 language-conditioned tasks. For 28 of 70 tasks with a measured gap, the gap exceeds the 16-frame window of the widest fixed-context VLA the authors survey. |
|  | [From Sliding Windows to Self-evolving Lifelong Memory: A Dual-perspective Survey of Memory Paradigms for Long-Horizon Robotics VLA Models](https://arxiv.org/abs/2610.23319) | Wang et al., 2026 | A survey of VLA memory by scope and persistence: five paradigms and one emerging frontier. |

</div>

Two of them change the picture above:

- **The RoboMME top score moved.** [SimpleARM](https://arxiv.org/abs/2609.36595) (Yuyou Zhang and colleagues, 2026) reports 67.17 percent mean success on the 16 RoboMME tasks. The strongest non-oracle baseline in its comparison scores 44.51.
- **Having memory is not the same as using it.** Three 2026 audits ask whether history changes what a policy does. Liao and Cao found little history-unique information inside three frozen VLAs. Jiajie Zhang and colleagues found actions that change with the past but do not reliably pick the behavior the past calls for. Luo and colleagues found, in cross-episode tests, that swapping key facts in a learned memory bank had no clear extra effect over fact-preserving replacements.

## Where it stands

In the RoboMME paper no memory design wins every task, and the best average is 44.51 percent against 90.5 for humans. A later training-free layer, SimpleARM, reports 67.17 percent on the same 16 tasks. That is a large jump and still well below the human score.

ASPIRE's skill library is one answer. To me it feels very clunky and not the most elegant solution. A text note is easy to read and fix, and it is also the kind of memory that goes stale.

What I would watch next: benchmarks that test several memory types on one robot, like RoboMME does in simulation, and navigation models that say plainly how long their history is.

<details>
<summary>Every paper named in this article, and the full verified list</summary>

All entries link to the paper. Authors and years come from the arXiv record (one entry from Crossref). The first group lists the 32 works named in the article. The rest are the other 138 papers from the sweep, grouped by the sweep's own label.

<div class="paper-catalog">
<p class="paper-group">Named in the article</p>
<ul>
<li id="paper-2212.06817"><a href="https://arxiv.org/abs/2212.06817">RT-1: Robotics Transformer for Real-World Control at Scale</a> <span class="paper-meta">RT-1 · Anthony Brohan et al. · 2022</span></li>
<li id="paper-2405.12213"><a href="https://arxiv.org/abs/2405.12213">Octo: An Open-Source Generalist Robot Policy</a> <span class="paper-meta">Octo · Octo Model Team · 2024</span></li>
<li id="paper-2303.04137"><a href="https://arxiv.org/abs/2303.04137">Diffusion Policy: Visuomotor Policy Learning via Action Diffusion</a> <span class="paper-meta">Diffusion Policy · Cheng Chi et al. · 2023</span></li>
<li id="paper-2304.13705"><a href="https://arxiv.org/abs/2304.13705">Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware</a> <span class="paper-meta">ACT · Tony Z. Zhao et al. · 2023</span></li>
<li id="paper-2410.24164"><a href="https://arxiv.org/abs/2410.24164">π0: A Vision-Language-Action Flow Model for General Robot Control</a> <span class="paper-meta">π0 · Kevin Black et al. · 2024</span></li>
<li id="paper-2504.16054"><a href="https://arxiv.org/abs/2504.16054">π0.5: a Vision-Language-Action Model with Open-World Generalization</a> <span class="paper-meta">π0.5 · Physical Intelligence · 2025</span></li>
<li id="paper-2406.09246"><a href="https://arxiv.org/abs/2406.09246">OpenVLA: An Open-Source Vision-Language-Action Model</a> <span class="paper-meta">OpenVLA · Moo Jin Kim et al. · 2024</span></li>
<li id="paper-2503.14734"><a href="https://arxiv.org/abs/2503.14734">GR00T N1: An Open Foundation Model for Generalist Humanoid Robots</a> <span class="paper-meta">GR00T N1 (the article uses N1.5) · NVIDIA (Bjorck et al.) · 2025</span></li>
<li id="paper-2411.19650"><a href="https://arxiv.org/abs/2411.19650">CogACT: A Foundational Vision-Language-Action Model for Synergizing Cognition and Action in Robotic Manipulation</a> <span class="paper-meta">CogACT · Qixiu Li et al. · 2024</span></li>
<li id="paper-2501.18564"><a href="https://arxiv.org/abs/2501.18564">SAM2Act: Integrating Visual Foundation Model with A Memory Architecture for Robotic Manipulation</a> <span class="paper-meta">SAM2Act · Haoquan Fang et al. · 2025</span></li>
<li id="paper-2603.04639"><a href="https://arxiv.org/abs/2603.04639">RoboMME: Benchmarking and Understanding Memory for Robotic Generalist Policies</a> <span class="paper-meta">RoboMME · Yinpei Dai et al. · 2026</span></li>
<li id="paper-2510.20328"><a href="https://arxiv.org/abs/2510.20328">MemER: Scaling Up Memory for Robot Control via Experience Retrieval</a> <span class="paper-meta">MemER · Ajay Sridhar et al. · 2025</span></li>
<li id="paper-2508.19236"><a href="https://arxiv.org/abs/2508.19236">MemoryVLA: Perceptual-Cognitive Memory in Vision-Language-Action Models for Robotic Manipulation</a> <span class="paper-meta">MemoryVLA · Hao Shi et al. · 2025</span></li>
<li id="paper-2506.19816"><a href="https://arxiv.org/abs/2506.19816">CronusVLA: Towards Efficient and Robust Manipulation via Multi-Frame Vision-Language-Action Modeling</a> <span class="paper-meta">CronusVLA · Hao Li et al. · 2025</span></li>
<li id="paper-2510.00695"><a href="https://arxiv.org/abs/2510.00695">HAMLET: Switch your Vision-Language-Action Model into a History-Aware Policy</a> <span class="paper-meta">HAMLET · Myungkyu Koo et al. · 2025</span></li>
<li id="paper-2510.04246"><a href="https://arxiv.org/abs/2510.04246">ContextVLA: Vision-Language-Action Model with Amortized Multi-Frame Context</a> <span class="paper-meta">ContextVLA · Huiwon Jang et al. · 2025</span></li>
<li id="paper-2509.12129"><a href="https://arxiv.org/abs/2509.12129">Embodied Navigation Foundation Model</a> <span class="paper-meta">NavFoM · Jiazhao Zhang et al. · 2025</span></li>
<li id="paper-2607.20785"><a href="https://arxiv.org/abs/2607.20785">Robostral Navigate</a> <span class="paper-meta">Robostral Navigate · Abdelaziz Bounhar et al. · 2026</span></li>
<li id="paper-2306.14846"><a href="https://arxiv.org/abs/2306.14846">ViNT: A Foundation Model for Visual Navigation</a> <span class="paper-meta">ViNT · Dhruv Shah et al. · 2023</span></li>
<li id="paper-2310.07896"><a href="https://arxiv.org/abs/2310.07896">NoMaD: Goal Masked Diffusion Policies for Navigation and Exploration</a> <span class="paper-meta">NoMaD · Ajay Sridhar et al. · 2023</span></li>
<li id="paper-2210.05714"><a href="https://arxiv.org/abs/2210.05714">Visual Language Maps for Robot Navigation</a> <span class="paper-meta">VLMaps · Chenguang Huang et al. · 2022</span></li>
<li id="paper-2607.00272"><a href="https://arxiv.org/abs/2607.00272">ASPIRE: Agentic /Skills Discovery for Robotics</a> <span class="paper-meta">ASPIRE · Runyu Lu et al. · 2026</span></li>
<li id="paper-2603.28730"><a href="https://arxiv.org/abs/2603.28730">SOLE-R1: Video-Language Reasoning as the Sole Reward for On-Robot Reinforcement Learning</a> <span class="paper-meta">SOLE-R1 · Philip Schroeder et al. · 2026</span></li>
<li id="paper-2010.14876"><a href="https://arxiv.org/abs/2010.14876">Fighting Copycat Agents in Behavioral Cloning from Observation Histories</a> <span class="paper-meta">Wen et al. (copycat) · Chuan Wen et al. · 2020</span></li>
<li id="paper-1905.11979"><a href="https://arxiv.org/abs/1905.11979">Causal Confusion in Imitation Learning</a> <span class="paper-meta">de Haan et al. (causal confusion) · Pim de Haan et al. · 2019</span></li>
<li id="paper-2505.09561"><a href="https://arxiv.org/abs/2505.09561">Learning Long-Context Diffusion Policies via Past-Token Prediction</a> <span class="paper-meta">Torne et al. (past-token prediction) · Marcel Torne et al. · 2025</span></li>
<li id="paper-2306.03310"><a href="https://arxiv.org/abs/2306.03310">LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning</a> <span class="paper-meta">LIBERO · Bo Liu et al. · 2023</span></li>
<li id="paper-2510.03827"><a href="https://arxiv.org/abs/2510.03827">LIBERO-PRO: Towards Robust and Fair Evaluation of Vision-Language-Action Models Beyond Memorization</a> <span class="paper-meta">LIBERO-PRO · Xueyang Zhou et al. · 2025</span></li>
<li id="paper-2405.05941"><a href="https://arxiv.org/abs/2405.05941">Evaluating Real-World Robot Manipulation Policies in Simulation</a> <span class="paper-meta">SimplerEnv · Xuanlin Li et al. · 2024</span></li>
<li id="paper-2406.02523"><a href="https://arxiv.org/abs/2406.02523">RoboCasa: Large-Scale Simulation of Everyday Tasks for Generalist Robots</a> <span class="paper-meta">RoboCasa · Soroush Nasiriany et al. · 2024</span></li>
<li id="paper-2004.02857"><a href="https://arxiv.org/abs/2004.02857">Beyond the Nav-Graph: Vision-and-Language Navigation in Continuous Environments</a> <span class="paper-meta">R2R-CE · Jacob Krantz et al. · 2020</span></li>
<li id="paper-2010.07954"><a href="https://arxiv.org/abs/2010.07954">Room-Across-Room: Multilingual Vision-and-Language Navigation with Dense Spatiotemporal Grounding</a> <span class="paper-meta">RxR-CE · Alexander Ku et al. · 2020</span></li>
</ul>
<p class="paper-group">Analysis of history and memory use (3)</p>
<ul>
<li id="paper-2610.23372"><a href="https://arxiv.org/abs/2610.23372">Beyond Success Rate: Interventional Evaluation of Memory in Vision-Language-Action Systems</a> <span class="paper-meta">Keyuan Luo et al. · 2026</span></li>
<li id="paper-2609.27247"><a href="https://arxiv.org/abs/2609.27247">Memory That Changes Action Is Not Memory That Guides It: Counterfactual Auditing of History-Conditioned Robot Policies</a> <span class="paper-meta">Jiajie Zhang et al. · 2026</span></li>
<li id="paper-2607.03372"><a href="https://arxiv.org/abs/2607.03372">Present but Not Remembered: Auditing How Frozen VLAs Encode, Deploy, and Steer Visual History</a> <span class="paper-meta">Chih-Ting Liao and Xin Cao · 2026</span></li>
</ul>
<p class="paper-group">Benchmarks (23)</p>
<ul>
<li id="paper-2609.38886"><a href="https://arxiv.org/abs/2609.38886">Benchmarking and Enhancing Skill-Level Memory for Partially Observable Robotic Manipulation</a> <span class="paper-meta">Yansong Shi et al. · 2026</span></li>
<li id="paper-2606.19338"><a href="https://arxiv.org/abs/2606.19338">Beyond the Current Observation: Evaluating Multimodal Large Language Models in Controllable Non-Markov Games</a> <span class="paper-meta">Shengyuan Ding et al. · 2026</span></li>
<li id="paper-2610.17350"><a href="https://arxiv.org/abs/2610.17350">Can a Frontier VLM Serve as a Robot Policy for Memory-Dependent Manipulation?</a> <span class="paper-meta">Jack B. Jedlicki et al. · 2026</span></li>
<li id="paper-2608.08036"><a href="https://arxiv.org/abs/2608.08036">Compiling and Benchmarking Task-State Horizons for Embodied Agents</a> <span class="paper-meta">Meiqi Wang and Shichao Li · 2026</span></li>
<li id="paper-2610.05013"><a href="https://arxiv.org/abs/2610.05013">EMBER-Bench: Benchmarking Cross-Event Causal Memory in Long-Horizon Embodied Tasks</a> <span class="paper-meta">Aoyang Cai et al. · 2026</span></li>
<li id="paper-2609.28236"><a href="https://arxiv.org/abs/2609.28236">EmbodiedMemory-Bench: Benchmarking Embodied Memory for Long-Horizon Embodied Tasks</a> <span class="paper-meta">Lizhou Liang et al. · 2026</span></li>
<li id="paper-2601.10744"><a href="https://arxiv.org/abs/2601.10744">Explore with Long-term Memory: A Benchmark and Multimodal LLM-based Reinforcement Learning Framework for Embodied Exploration</a> <span class="paper-meta">Sen Wang et al. · 2026</span></li>
<li id="paper-2610.04255"><a href="https://arxiv.org/abs/2610.04255">Grounded in Time: A Multi-Source Dataset and Benchmark for Temporal Grounding in Robotic Manipulation</a> <span class="paper-meta">Yi Wang et al. · 2026</span></li>
<li id="paper-2604.16788"><a href="https://arxiv.org/abs/2604.16788">LongBench: Evaluating Robotic Manipulation Policies on Real-World Long-Horizon Tasks</a> <span class="paper-meta">Xueyao Chen et al. · 2026</span></li>
<li id="paper-2609.07047"><a href="https://arxiv.org/abs/2609.07047">MEMOBench: A Process Level Memory Benchmark for Robotic Manipulation</a> <span class="paper-meta">Haiyang Sun et al. · 2026</span></li>
<li id="paper-2610.00604"><a href="https://arxiv.org/abs/2610.00604">MIKASA-Robo-VLA: Benchmarking Memory in VLA Models for Long-Horizon Manipulation</a> <span class="paper-meta">Egor Cherepanov et al. · 2026</span></li>
<li id="paper-2609.32313"><a href="https://arxiv.org/abs/2609.32313">MemTransfer: Benchmarking Memory Beyond Matched Experience in Embodied Decision-Making</a> <span class="paper-meta">Haiming Tang et al. · 2026</span></li>
<li id="paper-2601.15086"><a href="https://arxiv.org/abs/2601.15086">Memory Retention Is Not Enough to Master Memory Tasks in Reinforcement Learning</a> <span class="paper-meta">Oleg Shchendrigin et al. · 2026</span></li>
<li id="paper-2603.01229"><a href="https://arxiv.org/abs/2603.01229">RMBench: Memory-Dependent Robotic Manipulation Benchmark with Insights into Policy Design</a> <span class="paper-meta">Tianxing Chen et al. · 2026</span></li>
<li id="paper-2606.22338"><a href="https://arxiv.org/abs/2606.22338">RoboMME-Interference: Benchmarking Robot Memory Under Interference</a> <span class="paper-meta">Soumil Rathi · 2026</span></li>
<li id="paper-2605.10921"><a href="https://arxiv.org/abs/2605.10921">RoboMemArena: A Comprehensive and Challenging Robotic Memory Benchmark</a> <span class="paper-meta">Huashuo Lei et al. · 2026</span></li>
<li id="paper-2610.12561"><a href="https://arxiv.org/abs/2610.12561">What Should Embodied Agents Remember? Benchmarking and Evaluating Memory Modality for Embodied Agents</a> <span class="paper-meta">Junxiang Wang et al. · 2026</span></li>
<li id="paper-2606.18847"><a href="https://arxiv.org/abs/2606.18847">WorldLines: Benchmarking and Modeling Long-Horizon Stateful Embodied Agents</a> <span class="paper-meta">Yehang Zhang et al. · 2026</span></li>
<li id="paper-2508.00046"><a href="https://arxiv.org/abs/2508.00046">Benchmarking Partial Observability in Reinforcement Learning with a Suite of Memory-Improvable Domains</a> <span class="paper-meta">Ruo Yu Tao et al. · 2025</span></li>
<li id="paper-2506.15635"><a href="https://arxiv.org/abs/2506.15635">FindingDory: A Benchmark to Evaluate Memory in Embodied Agents</a> <span class="paper-meta">Karmesh Yadav et al. · 2025</span></li>
<li id="paper-2502.10550"><a href="https://arxiv.org/abs/2502.10550">Memory, Benchmark &amp; Robots: A Benchmark for Solving Complex Tasks with Reinforcement Learning</a> <span class="paper-meta">Egor Cherepanov et al. · 2025</span></li>
<li id="paper-2506.06677"><a href="https://arxiv.org/abs/2506.06677">RoboCerebra: A Large-scale Benchmark for Long-horizon Robotic Manipulation Evaluation</a> <span class="paper-meta">Songhao Han et al. · 2025</span></li>
<li id="paper-2404.06609"><a href="https://arxiv.org/abs/2404.06609">GOAT-Bench: A Benchmark for Multi-Modal Lifelong Navigation</a> <span class="paper-meta">Mukul Khanna et al. · 2024</span></li>
</ul>
<p class="paper-group">Key frames and retrieval (11)</p>
<ul>
<li id="paper-2602.15010"><a href="https://arxiv.org/abs/2602.15010">BPP: Long-Context Robot Imitation Learning by Focusing on Key History Frames</a> <span class="paper-meta">Max Sobol Mark et al. · 2026</span></li>
<li id="paper-2610.00982"><a href="https://arxiv.org/abs/2610.00982">Divide-and-Remember: Recursive Action-Relevant Memory for Long-Horizon VLA Policies</a> <span class="paper-meta">Xuehui Yu et al. · 2026</span></li>
<li id="paper-2606.20092"><a href="https://arxiv.org/abs/2606.20092">EventVLA: Event-Driven Visual Evidence Memory for Long-Horizon Vision-Language-Action Policies</a> <span class="paper-meta">Ganlin Yang et al. · 2026</span></li>
<li id="paper-2606.23589"><a href="https://arxiv.org/abs/2606.23589">KEMO: Event-Driven Keyframe Memory for Long-Horizon Robot Manipulation with VLA Policies</a> <span class="paper-meta">Yihan Zeng et al. · 2026</span></li>
<li id="paper-2606.25136"><a href="https://arxiv.org/abs/2606.25136">Memory Retrieval in Visuomotor Policies for Long-Horizon Robot Control</a> <span class="paper-meta">Rutav Shah et al. · 2026</span></li>
<li id="paper-2603.01465"><a href="https://arxiv.org/abs/2603.01465">Non-Markovian Long-Horizon Robot Manipulation via Keyframe Chaining</a> <span class="paper-meta">Yipeng Chen et al. · 2026</span></li>
<li id="paper-2409.12294"><a href="https://arxiv.org/abs/2409.12294">RAG-Modulo: Solving Sequential Tasks using Experience, Critics, and Language Models</a> <span class="paper-meta">Abhinav Jain et al. · 2024</span></li>
<li id="paper-2402.03610"><a href="https://arxiv.org/abs/2402.03610">RAP: Retrieval-Augmented Planning with Contextual Memory for Multimodal LLM Agents</a> <span class="paper-meta">Tomoyuki Kagaya et al. · 2024</span></li>
<li id="paper-2409.13682"><a href="https://arxiv.org/abs/2409.13682">ReMEmbR: Building and Reasoning Over Long-Horizon Spatio-Temporal Memory for Robot Navigation</a> <span class="paper-meta">Abrar Anwar et al. · 2024</span></li>
<li id="paper-2311.05997"><a href="https://arxiv.org/abs/2311.05997">JARVIS-1: Open-World Multi-task Agents with Memory-Augmented Multimodal Language Models</a> <span class="paper-meta">Zihao Wang et al. · 2023</span></li>
<li id="paper-1703.01988"><a href="https://arxiv.org/abs/1703.01988">Neural Episodic Control</a> <span class="paper-meta">Alexander Pritzel et al. · 2017</span></li>
</ul>
<p class="paper-group">Latent and vector memory (10)</p>
<ul>
<li id="paper-2603.24576"><a href="https://arxiv.org/abs/2603.24576">Chameleon: Control-Indexed Prospective Memory for Visuomotor Manipulation</a> <span class="paper-meta">Xinying Guo et al. · 2026</span></li>
<li id="paper-2607.07608"><a href="https://arxiv.org/abs/2607.07608">Dual Latent Memory in Vision-Language-Action Models for Robotic Manipulation</a> <span class="paper-meta">Hongyu Qu et al. · 2026</span></li>
<li id="paper-2605.10993"><a href="https://arxiv.org/abs/2605.10993">ECHO: Continuous Hierarchical Memory for Vision-Language-Action Models</a> <span class="paper-meta">Yanbin Hu et al. · 2026</span></li>
<li id="paper-2610.21362"><a href="https://arxiv.org/abs/2610.21362">LTM: Latent Transition Based In-Context Memory for Vision-Language-Action Models</a> <span class="paper-meta">Qixin Sun et al. · 2026</span></li>
<li id="paper-2610.22323"><a href="https://arxiv.org/abs/2610.22323">Mem4Act: Learning Effective Latent Memory for Long-Horizon Robotic Manipulation</a> <span class="paper-meta">Yun Zhang et al. · 2026</span></li>
<li id="paper-2610.14406"><a href="https://arxiv.org/abs/2610.14406">Memory Without Curation: Learning Multi-Stream Latent Memory for Robot Policies</a> <span class="paper-meta">Yilin Wu et al. · 2026</span></li>
<li id="paper-2606.09827"><a href="https://arxiv.org/abs/2606.09827">MemoryVLA++: Temporal Modeling via Memory and Imagination in Vision-Language-Action Models</a> <span class="paper-meta">Hao Shi et al. · 2026</span></li>
<li id="paper-2606.16178"><a href="https://arxiv.org/abs/2606.16178">Scaling Short-Term Memory of Visuomotor Policies for Long-Horizon Tasks</a> <span class="paper-meta">Rutav Shah et al. · 2026</span></li>
<li id="paper-2609.22684"><a href="https://arxiv.org/abs/2609.22684">StateMem: Single-State Residual Memory with Adaptive Inference for Vision-Language-Action Policies</a> <span class="paper-meta">Wenzhuo Li et al. · 2026</span></li>
<li id="paper-2603.04910"><a href="https://arxiv.org/abs/2603.04910">VPWEM: Non-Markovian Visuomotor Policy with Working and Episodic Memory</a> <span class="paper-meta">Yuheng Lei et al. · 2026</span></li>
</ul>
<p class="paper-group">Longer frame context (8)</p>
<ul>
<li id="paper-2609.30828"><a href="https://arxiv.org/abs/2609.30828">HIRE: History-Conditioned Interaction Reasoning and High-Rate Execution for Visually Aliased Precision Manipulation</a> <span class="paper-meta">Rongji Li et al. · 2026</span></li>
<li id="paper-2609.05533"><a href="https://arxiv.org/abs/2609.05533">SimpleMemVLA: A Simple but Effective Native-Video Memory for Vision-Language-Action Models</a> <span class="paper-meta">Cheng Yin et al. · 2026</span></li>
<li id="paper-2608.26821"><a href="https://arxiv.org/abs/2608.26821">TemporalFlow-VLA: Learning Physically Grounded Execution History for Long-Horizon Robot Manipulation</a> <span class="paper-meta">Jiarui Yang et al. · 2026</span></li>
<li id="paper-2606.16447"><a href="https://arxiv.org/abs/2606.16447">Training and Evaluating Diffusion Policies with Long Context Lengths</a> <span class="paper-meta">Abhinav Agarwal et al. · 2026</span></li>
<li id="paper-2507.05240"><a href="https://arxiv.org/abs/2507.05240">StreamVLN: Streaming Vision-and-Language Navigation via SlowFast Context Modeling</a> <span class="paper-meta">Meng Wei et al. · 2025</span></li>
<li id="paper-2506.17221"><a href="https://arxiv.org/abs/2506.17221">VLN-R1: Vision-Language Navigation via Reinforcement Fine-Tuning</a> <span class="paper-meta">Zhangyang Qi et al. · 2025</span></li>
<li id="paper-2207.09705"><a href="https://arxiv.org/abs/2207.09705">Resolving Copycat Problems in Visual Imitation Learning via Residual Action Prediction</a> <span class="paper-meta">Chia-Chi Chuang et al. · 2022</span></li>
<li id="paper-2110.13309"><a href="https://arxiv.org/abs/2110.13309">History Aware Multimodal Transformer for Vision-and-Language Navigation</a> <span class="paper-meta">Shizhe Chen et al. · 2021</span></li>
</ul>
<p class="paper-group">Maps and scene memory (28)</p>
<ul>
<li id="paper-2608.06729"><a href="https://arxiv.org/abs/2608.06729">AtlasVLA: Persistent World-Ego State Modeling for Vision-Language-Action Models</a> <span class="paper-meta">Guiyu Zhao et al. · 2026</span></li>
<li id="paper-2608.14986"><a href="https://arxiv.org/abs/2608.14986">GaussMemory: Task-Driven 3D Gaussian Scene Memory for Long-Horizon Robotic Manipulation</a> <span class="paper-meta">Zhiqiang Hu et al. · 2026</span></li>
<li id="paper-2609.28798"><a href="https://arxiv.org/abs/2609.28798">OCC4M: Object-Centric 4D Memory for Spatiotemporal Reasoning in Long-Horizon Manipulation</a> <span class="paper-meta">Jack B. Jedlicki et al. · 2026</span></li>
<li id="paper-2605.26256"><a href="https://arxiv.org/abs/2605.26256">Personalizing Embodied Multimodal Large Language Model Agents over Long-term User Interactions</a> <span class="paper-meta">Jeongeun Lee et al. · 2026</span></li>
<li id="paper-2606.12956"><a href="https://arxiv.org/abs/2606.12956">SERF: Spatiotemporal Environment and Robot Feature Map for Long-Horizon Mobile Manipulation</a> <span class="paper-meta">Sunghwan Kim et al. · 2026</span></li>
<li id="paper-2609.08444"><a href="https://arxiv.org/abs/2609.08444">Safe Task Planning with Long-Term Graph Memory for Embodied Agents</a> <span class="paper-meta">Siyuan Li et al. · 2026</span></li>
<li id="paper-2605.22283"><a href="https://arxiv.org/abs/2605.22283">Spatial Memory for Out-of-Vision Manipulation in Vision-Language-Action</a> <span class="paper-meta">Pengteng Li et al. · 2026</span></li>
<li id="paper-2609.34554"><a href="https://arxiv.org/abs/2609.34554">Where Memory Belongs: Ledger, an Object Ledger for Memory-Augmented VLAs</a> <span class="paper-meta">Tanguy Dieudonné et al. · 2026</span></li>
<li id="paper-2505.05622"><a href="https://arxiv.org/abs/2505.05622">CityNavAgent: Aerial Vision-and-Language Navigation with Hierarchical Semantic Planning and Global Memory</a> <span class="paper-meta">Weichen Zhang et al. · 2025</span></li>
<li id="paper-2506.15096"><a href="https://arxiv.org/abs/2506.15096">DyNaVLM: Zero-Shot Vision-Language Navigation System with Dynamic Viewpoints and Self-Refining Graph Memory</a> <span class="paper-meta">Zihe Ji et al. · 2025</span></li>
<li id="paper-2511.18112"><a href="https://arxiv.org/abs/2511.18112">EchoVLA: Robotic Vision-Language-Action Model with Synergistic Declarative Memory for Mobile Manipulation</a> <span class="paper-meta">Min Lin et al. · 2025</span></li>
<li id="paper-2508.01917"><a href="https://arxiv.org/abs/2508.01917">L3M+P: Lifelong Planning with Large Language Models</a> <span class="paper-meta">Krish Agarwal et al. · 2025</span></li>
<li id="paper-2502.13451"><a href="https://arxiv.org/abs/2502.13451">MapNav: A Novel Memory Representation via Annotated Semantic Maps for Vision-and-Language Navigation</a> <span class="paper-meta">Lingfeng Zhang et al. · 2025</span></li>
<li id="paper-TMM.2025.3586105"><a href="https://doi.org/10.1109/TMM.2025.3586105">MossVLN: Memory-Observation Synergistic System for Continuous Vision-Language Navigation</a> <span class="paper-meta">Ting Yu et al. · 2025</span></li>
<li id="paper-2411.17735"><a href="https://arxiv.org/abs/2411.17735">3D-Mem: 3D Scene Memory for Embodied Exploration and Reasoning</a> <span class="paper-meta">Yuncong Yang et al. · 2024</span></li>
<li id="paper-2403.17846"><a href="https://arxiv.org/abs/2403.17846">Hierarchical Open-Vocabulary 3D Scene Graphs for Language-Grounded Robot Navigation</a> <span class="paper-meta">Abdelrhman Werby et al. · 2024</span></li>
<li id="paper-2409.14908"><a href="https://arxiv.org/abs/2409.14908">KARMA: Augmenting Embodied AI Agents with Long-and-short Term Memory Systems</a> <span class="paper-meta">Zixuan Wang et al. · 2024</span></li>
<li id="paper-2405.10620"><a href="https://arxiv.org/abs/2405.10620">MC-GPT: Empowering Vision-and-Language Navigation with Memory Map and Reasoning Chains</a> <span class="paper-meta">Zhaohuan Zhan et al. · 2024</span></li>
<li id="paper-2401.07314"><a href="https://arxiv.org/abs/2401.07314">MapGPT: Map-Guided Prompting with Adaptive Path Planning for Vision-and-Language Navigation</a> <span class="paper-meta">Jiaqi Chen et al. · 2024</span></li>
<li id="paper-2309.16650"><a href="https://arxiv.org/abs/2309.16650">ConceptGraphs: Open-Vocabulary 3D Scene Graphs for Perception and Planning</a> <span class="paper-meta">Qiao Gu et al. · 2023</span></li>
<li id="paper-2311.06430"><a href="https://arxiv.org/abs/2311.06430">GOAT: GO to Any Thing</a> <span class="paper-meta">Matthew Chang et al. · 2023</span></li>
<li id="paper-2307.12907"><a href="https://arxiv.org/abs/2307.12907">GridMM: Grid Memory Map for Vision-and-Language Navigation</a> <span class="paper-meta">Zihan Wang et al. · 2023</span></li>
<li id="paper-2212.04385"><a href="https://arxiv.org/abs/2212.04385">BEVBert: Multimodal Map Pre-training for Language-guided Navigation</a> <span class="paper-meta">Dong An et al. · 2022</span></li>
<li id="paper-2210.05663"><a href="https://arxiv.org/abs/2210.05663">CLIP-Fields: Weakly Supervised Semantic Fields for Robotic Memory</a> <span class="paper-meta">Nur Muhammad Mahi Shafiullah et al. · 2022</span></li>
<li id="paper-2005.12256"><a href="https://arxiv.org/abs/2005.12256">Neural Topological SLAM for Visual Navigation</a> <span class="paper-meta">Devendra Singh Chaplot et al. · 2020</span></li>
<li id="paper-2008.09285"><a href="https://arxiv.org/abs/2008.09285">Occupancy Anticipation for Efficient Exploration and Navigation</a> <span class="paper-meta">Santhosh K. Ramakrishnan et al. · 2020</span></li>
<li id="paper-1903.03878"><a href="https://arxiv.org/abs/1903.03878">Scene Memory Transformer for Embodied Agents in Long-Horizon Tasks</a> <span class="paper-meta">Kuan Fang et al. · 2019</span></li>
<li id="paper-1706.09520"><a href="https://arxiv.org/abs/1706.09520">Neural SLAM: Learning to Explore with External Memory</a> <span class="paper-meta">Jingwei Zhang et al. · 2017</span></li>
</ul>
<p class="paper-group">Other designs (15)</p>
<ul>
<li id="paper-2609.11308"><a href="https://arxiv.org/abs/2609.11308">2AM: Grounding Agent-Side Memory as Guidance for Steerable Action Models in Long-Horizon Manipulation</a> <span class="paper-meta">Yutong Hu et al. · 2026</span></li>
<li id="paper-2609.22730"><a href="https://arxiv.org/abs/2609.22730">BEACON: Belief-Enabled Adaptive CONtrol for Imitation Learning under Uncertainty</a> <span class="paper-meta">Moonyoung Lee et al. · 2026</span></li>
<li id="paper-2602.15513"><a href="https://arxiv.org/abs/2602.15513">HIMM: Human-Inspired Long-Term Memory Modeling for Embodied Exploration and Question Answering</a> <span class="paper-meta">Ji Li et al. · 2026</span></li>
<li id="paper-2603.18494"><a href="https://arxiv.org/abs/2603.18494">MemoAct: Atkinson-Shiffrin-Inspired Hierarchical Memory-Augmented Policy for Robotic Manipulation</a> <span class="paper-meta">Liufan Tan et al. · 2026</span></li>
<li id="paper-2606.08288"><a href="https://arxiv.org/abs/2606.08288">MotionVLA: Injecting Geometric Motion into Vision-Language-Action Model</a> <span class="paper-meta">Shanglin Yuan et al. · 2026</span></li>
<li id="paper-2610.22686"><a href="https://arxiv.org/abs/2610.22686">Multimodal Filesystem Memory For Long-Horizon Embodied Agents</a> <span class="paper-meta">Chloe Su et al. · 2026</span></li>
<li id="paper-2610.20524"><a href="https://arxiv.org/abs/2610.20524">Physical Time as a Missing Dimension of Robot Policy Memory Dynamics</a> <span class="paper-meta">Yushen Liang et al. · 2026</span></li>
<li id="paper-2609.36595"><a href="https://arxiv.org/abs/2609.36595">Simple Agentic Memory for Generalist Robot Policies</a> <span class="paper-meta">Yuyou Zhang et al. · 2026</span></li>
<li id="paper-2602.07388"><a href="https://arxiv.org/abs/2602.07388">Trace-Focused Diffusion Policy for Multi-Modal Action Disambiguation in Long-Horizon Robotic Manipulation</a> <span class="paper-meta">Yuxuan Hu et al. · 2026</span></li>
<li id="paper-2606.03787"><a href="https://arxiv.org/abs/2606.03787">Worth Remembering: Surprise-Gated Robot Episodic Memory</a> <span class="paper-meta">Nicolas Gorlo et al. · 2026</span></li>
<li id="paper-2506.24019"><a href="https://arxiv.org/abs/2506.24019">Ella: Embodied Social Agents with Lifelong Memory</a> <span class="paper-meta">Hongxin Zhang et al. · 2025</span></li>
<li id="paper-2509.17141"><a href="https://arxiv.org/abs/2509.17141">History-Aware Visuomotor Policy Learning via Point Tracking</a> <span class="paper-meta">Jingjing Chen et al. · 2025</span></li>
<li id="paper-2509.22548"><a href="https://arxiv.org/abs/2509.22548">JanusVLN: Decoupling Semantics and Spatiality with Dual Implicit Memory for Vision-Language Navigation</a> <span class="paper-meta">Shuang Zeng et al. · 2025</span></li>
<li id="paper-2509.20754"><a href="https://arxiv.org/abs/2509.20754">Meta-Memory: Retrieving and Integrating Semantic-Spatial Memories for Robot Spatial Reasoning</a> <span class="paper-meta">Yufan Mao et al. · 2025</span></li>
<li id="paper-2501.00358"><a href="https://arxiv.org/abs/2501.00358">Embodied VideoAgent: Persistent Memory from Egocentric Videos and Embodied Sensors Enables Dynamic Scene Understanding</a> <span class="paper-meta">Yue Fan et al. · 2024</span></li>
</ul>
<p class="paper-group">Recurrent and state-space memory (13)</p>
<ul>
<li id="paper-2606.02775"><a href="https://arxiv.org/abs/2606.02775">AURA: Action-Gated Memory for Robot Policies at Constant VRAM</a> <span class="paper-meta">Josef Chen · 2026</span></li>
<li id="paper-2606.30318"><a href="https://arxiv.org/abs/2606.30318">Chronos: A Physics-Informed Full-History Framework for Non-Markovian Long-Horizon Manipulation</a> <span class="paper-meta">Yulin Zhou et al. · 2026</span></li>
<li id="paper-2609.32453"><a href="https://arxiv.org/abs/2609.32453">DRAM: Delta-rule Recurrent Associative Memory for Robot Manipulation Policies</a> <span class="paper-meta">Xinyu Zhao et al. · 2026</span></li>
<li id="paper-2605.14598"><a href="https://arxiv.org/abs/2605.14598">DSSP: Diffusion State Space Policy with Full-History Encoding</a> <span class="paper-meta">Zhiyuan Guan et al. · 2026</span></li>
<li id="paper-2609.28256"><a href="https://arxiv.org/abs/2609.28256">MemBodied: Recurrent Associative Memory for Vision-Language-Action Models</a> <span class="paper-meta">Tej Deep Pala et al. · 2026</span></li>
<li id="paper-2609.25757"><a href="https://arxiv.org/abs/2609.25757">Minimal Recurrent Behavioral Memory for Imitation under Partial Observability</a> <span class="paper-meta">Xianyao Li et al. · 2026</span></li>
<li id="paper-2609.35200"><a href="https://arxiv.org/abs/2609.35200">ReCAT: Remember, Count, and Time: Structured Recurrent Memory for Robot Manipulation</a> <span class="paper-meta">Pankhuri Vanjani et al. · 2026</span></li>
<li id="paper-2603.12942"><a href="https://arxiv.org/abs/2603.12942">ReMem-VLA: Empowering Vision-Language-Action Model with Memory via Dual-Level Recurrent Queries</a> <span class="paper-meta">Hang Li et al. · 2026</span></li>
<li id="paper-2602.20659"><a href="https://arxiv.org/abs/2602.20659">Recursive Belief Vision Language Action Models</a> <span class="paper-meta">Vaidehi Bagaria et al. · 2026</span></li>
<li id="paper-2609.22854"><a href="https://arxiv.org/abs/2609.22854">SmoLSTM: A Compact Vision-Language-Action Model with Recurrent Memory that Persists</a> <span class="paper-meta">Jan-Gerrit Habekost et al. · 2026</span></li>
<li id="paper-2606.12497"><a href="https://arxiv.org/abs/2606.12497">μVLA: On Recurrent Memory for Partially Observable Manipulation in VLA Models</a> <span class="paper-meta">Egor Cherepanov et al. · 2026</span></li>
<li id="paper-2505.12410"><a href="https://arxiv.org/abs/2505.12410">MTIL: Encoding Full History with Mamba for Temporal Imitation Learning</a> <span class="paper-meta">Yulin Zhou et al. · 2025</span></li>
<li id="paper-1906.09510"><a href="https://arxiv.org/abs/1906.09510">Learning Belief Representations for Imitation Learning in POMDPs</a> <span class="paper-meta">Tanmay Gangwani et al. · 2019</span></li>
</ul>
<p class="paper-group">Skills and code (10)</p>
<ul>
<li id="paper-2609.37810"><a href="https://arxiv.org/abs/2609.37810">Explore, Execute, Evolve: A Skill Acquisition and Reuse Loop for Embodied Agents</a> <span class="paper-meta">Sicheng Xie et al. · 2026</span></li>
<li id="paper-2603.04560"><a href="https://arxiv.org/abs/2603.04560">From Local Corrections to Generalized Skills: Improving Neuro-Symbolic Policies with MEMO</a> <span class="paper-meta">Benjamin A. Christie et al. · 2026</span></li>
<li id="paper-2610.18792"><a href="https://arxiv.org/abs/2610.18792">SEAR: Self-Evolving Agentic Robotics</a> <span class="paper-meta">Xinyi Wang et al. · 2026</span></li>
<li id="paper-2608.14944"><a href="https://arxiv.org/abs/2608.14944">SkillComposer: Learning Reusable Skills for Natural-Language Robot Programming</a> <span class="paper-meta">John Woods and Hasti Seifi · 2026</span></li>
<li id="paper-2608.09410"><a href="https://arxiv.org/abs/2608.09410">Skills in Weights, Memory in Code: Hybrid Learning for Memory-Dependent Robot Manipulation</a> <span class="paper-meta">Yunhao Zhao et al. · 2026</span></li>
<li id="paper-2608.17209"><a href="https://arxiv.org/abs/2608.17209">Teach and Grow: An Agent-Centered Architecture for General Robot Learning</a> <span class="paper-meta">Chang Nie et al. · 2026</span></li>
<li id="paper-2609.36691"><a href="https://arxiv.org/abs/2609.36691">Video2Skill: From Streaming Experience to Reusable Embodied Skills</a> <span class="paper-meta">Jianshu Zhang et al. · 2026</span></li>
<li id="paper-2509.18597"><a href="https://arxiv.org/abs/2509.18597">Robotic Ultra-Long-Horizon Manipulation Skills via Human-guided Lifelong Code Generation</a> <span class="paper-meta">Yuan Meng et al. · 2025</span></li>
<li id="paper-2406.18746"><a href="https://arxiv.org/abs/2406.18746">Lifelong Robot Library Learning: Bootstrapping Composable and Generalizable Skills for Embodied Control with Language Models</a> <span class="paper-meta">Georgios Tziafas and Hamidreza Kasaei · 2024</span></li>
<li id="paper-2305.16291"><a href="https://arxiv.org/abs/2305.16291">Voyager: An Open-Ended Embodied Agent with Large Language Models</a> <span class="paper-meta">Guanzhi Wang et al. · 2023</span></li>
</ul>
<p class="paper-group">Surveys (1)</p>
<ul>
<li id="paper-2610.23319"><a href="https://arxiv.org/abs/2610.23319">From Sliding Windows to Self-evolving Lifelong Memory: A Dual-perspective Survey of Memory Paradigms for Long-Horizon Robotics VLA Models</a> <span class="paper-meta">Yong Wang et al. · 2026</span></li>
</ul>
<p class="paper-group">Text and language memory (16)</p>
<ul>
<li id="paper-2608.16889"><a href="https://arxiv.org/abs/2608.16889">Don't Drop the BATON: Long-Horizon Robot Manipulation via Agentic Subtask Exploration and Transition-aware Memory</a> <span class="paper-meta">Bingxin Xu et al. · 2026</span></li>
<li id="paper-2604.13533"><a href="https://arxiv.org/abs/2604.13533">Evolvable Embodied Agent for Robotic Manipulation via Long Short-Term Reflection and Optimization</a> <span class="paper-meta">Jianzong Wang et al. · 2026</span></li>
<li id="paper-2608.04765"><a href="https://arxiv.org/abs/2608.04765">Explicit Language Memory for Long-Horizon Planning in Vision-Language-Action Models</a> <span class="paper-meta">Houze Xu et al. · 2026</span></li>
<li id="paper-2607.29600"><a href="https://arxiv.org/abs/2607.29600">HAM-VLN: Harnessing Hierarchical Agentic Memory for Zero-Shot Vision-and-Language Navigation</a> <span class="paper-meta">An Liu et al. · 2026</span></li>
<li id="paper-2603.03596"><a href="https://arxiv.org/abs/2603.03596">MEM: Multi-Scale Embodied Memory for Vision Language Action Models</a> <span class="paper-meta">Marcel Torne et al. · 2026</span></li>
<li id="paper-2602.21013"><a href="https://arxiv.org/abs/2602.21013">Notes-to-Self: Scratchpad Augmented VLAs for Memory Dependent Manipulation Tasks</a> <span class="paper-meta">Sanjay Haresh et al. · 2026</span></li>
<li id="paper-2610.12710"><a href="https://arxiv.org/abs/2610.12710">REMM: Revisable Embodied Memory for Manipulation</a> <span class="paper-meta">Revanth Krishna Senthilkumaran et al. · 2026</span></li>
<li id="paper-2605.18729"><a href="https://arxiv.org/abs/2605.18729">Robo-Cortex: A Self-Evolving Embodied Agent via Dual-Grain Cognitive Memory and Autonomous Knowledge Induction</a> <span class="paper-meta">Nga Teng Chan et al. · 2026</span></li>
<li id="paper-2507.14975"><a href="https://arxiv.org/abs/2507.14975">FCRF: Flexible Constructivism Reflection for Long-Horizon Robotic Task Planning with Large Language Models</a> <span class="paper-meta">Yufan Song et al. · 2025</span></li>
<li id="paper-2504.21716"><a href="https://arxiv.org/abs/2504.21716">LLM-Empowered Embodied Agent for Memory-Augmented Task Planning in Household Robotics</a> <span class="paper-meta">Marc Glocker et al. · 2025</span></li>
<li id="paper-2511.09516"><a href="https://arxiv.org/abs/2511.09516">MAP-VLA: Memory-Augmented Prompting for Vision-Language-Action Model in Robotic Manipulation</a> <span class="paper-meta">Runhao Li et al. · 2025</span></li>
<li id="paper-2507.13152"><a href="https://arxiv.org/abs/2507.13152">SE-VLN: A Self-Evolving Vision-Language Navigation Framework Based on Multimodal Large Language Models</a> <span class="paper-meta">Xiangyu Dong et al. · 2025</span></li>
<li id="paper-2310.15127"><a href="https://arxiv.org/abs/2310.15127">Open-Ended Instructable Embodied Agents with Memory-Augmented Large Language Models</a> <span class="paper-meta">Gabriel Sarch et al. · 2023</span></li>
<li id="paper-2306.15724"><a href="https://arxiv.org/abs/2306.15724">REFLECT: Summarizing Robot Experiences for Failure Explanation and Correction</a> <span class="paper-meta">Zeyi Liu et al. · 2023</span></li>
<li id="paper-2305.05658"><a href="https://arxiv.org/abs/2305.05658">TidyBot: Personalized Robot Assistance with Large Language Models</a> <span class="paper-meta">Jimmy Wu et al. · 2023</span></li>
<li id="paper-2207.05608"><a href="https://arxiv.org/abs/2207.05608">Inner Monologue: Embodied Reasoning through Planning with Language Models</a> <span class="paper-meta">Wenlong Huang et al. · 2022</span></li>
</ul>
</div>

</details>

<details>
<summary>Versions, dates and numbers I used</summary>

- Checked 19 October 2026 against the arXiv versions named in the text. SAM2Act v4 (v1 printed different numbers), RoboMME v3, MemER v1, MemoryVLA v2, Robostral Navigate v3.
- Robostral Navigate: paper 77.4 percent on R2R-CE unseen validation, launch post 76.6 percent. RxR-CE ([Ku et al., 2020](https://arxiv.org/abs/2010.07954), English, unseen) 75.1 percent.
- The HAMLET table comes from its Table 4. ContextVLA's one-to-eight-frame comparison is read from a bar chart, so treat the values as approximate.
- RoboMME's row for MemER, SAM2Act+ and MemoryVLA reports the RoboMME authors' own re-implementations.
- Videos are linked from each project page and credited to its authors.
- Literature list checked 20 October 2026: titles, first authors and years of 147 arXiv entries against the arXiv API, and one DOI against Crossref. Descriptions in the "More work worth knowing" table are read from each paper's abstract.

</details>
