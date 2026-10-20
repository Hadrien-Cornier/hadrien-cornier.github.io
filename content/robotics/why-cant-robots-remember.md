---
title: "Why can't robots remember?"
description: 'Many robot policies decide from the last few frames. A snapshot of six ways to give them memory in October 2026, what each one stores, and what has been measured.'
date: '2026-10-19'
tags: ['robot-memory', 'long-horizon', 'navigation', 'vla']
section: 'recent-papers'
thumbnail: '/assets/robotics/why-cant-robots-remember/memer-object-search.png'
thumbnail_alt: 'Bar chart of MemER object search on a real robot: 32 of 60 objects retrieved with no history, 38 with 8 recent frames, 47 with 32 recent frames, and 59 with 8 key frames.'
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

<figure class="article-figure">
<svg viewBox="0 0 480 280" role="img" aria-labelledby="fig-day-t fig-day-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-day-t">What each worker knows at the start of each day</title><desc id="fig-day-d">Three rows, three days each. A coworker starts Monday with 2 pieces of knowledge, Tuesday with 3 and Wednesday with 5, because they keep what they learn. A coding agent starts every day with the same 4 notes it reads from a file and keeps nothing new. A robot policy starts every step with only its last 2 frames and has no notes file at all.</desc><rect x="0.75" y="0.75" width="478.5" height="278.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="221" y="26" font-size="12.5" font-weight="700" text-anchor="middle">Monday</text><text x="321" y="26" font-size="12.5" font-weight="700" text-anchor="middle">Tuesday</text><text x="421" y="26" font-size="12.5" font-weight="700" text-anchor="middle">Wednesday</text><text x="14" y="64" font-size="13.5" font-weight="700">Coworker</text><text x="14" y="82" font-size="11.5" fill="#656b62">keeps what they learn</text><rect x="176" y="40" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="185" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="200" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="276" y="40" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="285" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="300" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="315" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="376" y="40" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="385" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="400" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="415" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="430" y="50" width="11" height="11" fill="#2b6a8e"/><rect x="445" y="50" width="11" height="11" fill="#2b6a8e"/><text x="14" y="134" font-size="13.5" font-weight="700">Coding agent</text><text x="14" y="152" font-size="11.5" fill="#656b62">rereads the same notes</text><rect x="176" y="110" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="185" y="120" width="11" height="11" fill="#8a8f86"/><rect x="200" y="120" width="11" height="11" fill="#8a8f86"/><rect x="215" y="120" width="11" height="11" fill="#8a8f86"/><rect x="230" y="120" width="11" height="11" fill="#8a8f86"/><rect x="276" y="110" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="285" y="120" width="11" height="11" fill="#8a8f86"/><rect x="300" y="120" width="11" height="11" fill="#8a8f86"/><rect x="315" y="120" width="11" height="11" fill="#8a8f86"/><rect x="330" y="120" width="11" height="11" fill="#8a8f86"/><rect x="376" y="110" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="385" y="120" width="11" height="11" fill="#8a8f86"/><rect x="400" y="120" width="11" height="11" fill="#8a8f86"/><rect x="415" y="120" width="11" height="11" fill="#8a8f86"/><rect x="430" y="120" width="11" height="11" fill="#8a8f86"/><text x="14" y="204" font-size="13.5" font-weight="700">Robot policy</text><text x="14" y="222" font-size="11.5" fill="#656b62">sees its last frames</text><rect x="176" y="180" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="185" y="190" width="11" height="11" fill="#b44c2c"/><rect x="200" y="190" width="11" height="11" fill="#b44c2c"/><rect x="276" y="180" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="285" y="190" width="11" height="11" fill="#b44c2c"/><rect x="300" y="190" width="11" height="11" fill="#b44c2c"/><rect x="376" y="180" width="90" height="54" fill="#fff" stroke="#242622" stroke-width="1.5"/><rect x="385" y="190" width="11" height="11" fill="#b44c2c"/><rect x="400" y="190" width="11" height="11" fill="#b44c2c"/><text x="240" y="262" font-size="11.5" text-anchor="middle" fill="#656b62">Each square is one piece of knowledge in hand when the day starts.</text></g></svg>
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

| Policy | Authors, year | Frames per step | Source |
| --- | --- | ---: | --- |
| [RT-1](https://arxiv.org/abs/2212.06817) | Brohan et al., 2022 | 6 | Section 5.1 |
| [Octo](https://arxiv.org/abs/2405.12213) | Octo Model Team, 2024 | 2 | Section III-D |
| [Diffusion Policy](https://arxiv.org/abs/2303.04137) | Chi et al., 2023 | 2 for most tasks | Appendix A.4 |
| [ACT](https://arxiv.org/abs/2304.13705) | Zhao et al., 2023 | 1 | Section IV-C |
| [π0](https://arxiv.org/abs/2410.24164) | Black et al., 2024 | 1 | Section IV |
| [OpenVLA](https://arxiv.org/abs/2406.09246) | Kim et al., 2024 | 1, listed as a limitation | Section 6 |

History helps where it is used well. RT-1 loses accuracy when its six-frame history is removed: 97 to 82 percent on seen tasks and 76 to 62 percent on unseen ones (its Table 13, real robot). Each frame costs RT-1 only 8 tokens, thanks to a compression layer, so six frames stay cheap.

The five-minute hall is another matter. The [RoboPapers](https://robopapers.substack.com/p/ep54-memer-scaling-up-memory-for) episode on MemER puts it bluntly: most robot policies today largely lack memory and decide from what they can see right now. That is the hosts' summary, and it fits the table above.

## When one frame is not enough

Each of these compares the same system with and without memory, in the paper's own setup.

- **[SAM2Act](https://arxiv.org/abs/2501.18564)** (Fang et al., 2025), version 4, three memory tasks in simulation: 55.0 percent without its memory bank and 94.3 percent with it. The earlier version printed 53.7 and 91.3 before the authors fixed one task, so the version matters.
- **[RoboMME](https://arxiv.org/abs/2603.04639)** (Dai et al., 2026), 16 tasks in simulation: a plain [π0.5](https://arxiv.org/abs/2504.16054) (Physical Intelligence, 2025) policy averages 17.93 percent. The best design the authors tried averages 44.51. Humans score 90.5.
- **[MemER](https://arxiv.org/abs/2510.20328)** (Sridhar et al., 2025), real robot, searching for 3 objects over 20 trials per task. The chart shows how many objects it found out of 60.

<figure class="article-figure">
<svg viewBox="0 0 480 236" role="img" aria-labelledby="fig-memer-t fig-memer-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-memer-t">MemER object search: objects retrieved out of 60</title><desc id="fig-memer-d">Horizontal bars. No history: 32. Eight recent frames: 38. Thirty-two recent frames: 47. MemER with up to eight stored keyframes: 59. A human giving the subtasks: 58.</desc><rect x="0.75" y="0.75" width="478.5" height="234.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="16" y="26" font-size="13" font-weight="700">Object Search, real robot: objects retrieved (of 60)</text><g font-size="12.5"><text x="16" y="62">No history</text><text x="16" y="94">8 recent frames</text><text x="16" y="126">32 recent frames</text><text x="16" y="158">MemER (8 key frames)</text><text x="16" y="190">Human gives subtasks</text></g><g><rect x="160" y="48" width="144" height="20" fill="#656b62"/><rect x="160" y="80" width="171" height="20" fill="#656b62"/><rect x="160" y="112" width="211.5" height="20" fill="#656b62"/><rect x="160" y="144" width="265.5" height="20" fill="#b44c2c"/><rect x="160" y="176" width="261" height="20" fill="#cfd1c8"/></g><g font-size="12.5" font-weight="700"><text x="310" y="63">32</text><text x="337" y="95">38</text><text x="377.5" y="127">47</text><text x="431.5" y="159" font-size="12.5">59</text><text x="427" y="191">58</text></g><text x="16" y="222" font-size="11" fill="#656b62">Source: MemER paper, Table 1. 20 trials per task. Human row: upper bound.</text></g></svg>
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

| Frames | Latency | Memory |
| ---: | ---: | ---: |
| 1 | 80.5 ms | 289 MB |
| 4 | 108.5 ms | 1,051 MB |
| 8 | 193.0 ms | 2,023 MB |

Navigation models face the same bill, so they spend tokens unevenly. [NavFoM](https://arxiv.org/abs/2509.12129) (Zhang et al., 2025) gives the newest frame 64 tokens and each older frame 4, under a fixed budget. When the budget runs out it drops the oldest frames.

Training costs too. Mistral's [Robostral Navigate](https://arxiv.org/abs/2607.20785) (Bounhar et al., 2026) trains on whole episodes packed into a single sequence with a special attention mask. The paper reports 22 times fewer training tokens, turning months into days.

### Copycat behavior

The second problem has a name. Imagine an expert whose joint command is 0.10, 0.12, 0.14, 0.16, and so on. A policy that sees two frames can work out the last command, and copying it is wrong by only 0.02 each step. The training loss looks great. Then the cup moves, and the policy keeps copying.

[Wen and colleagues](https://arxiv.org/abs/2010.14876) (2020) measured this on six simulated control tasks: the cloned policy's actions were easier to predict from its own past actions than the expert's were, in all six. [De Haan and colleagues](https://arxiv.org/abs/1905.11979) (2019) showed that handing a cloned policy its previous action can lower its validation error and its reward at the same time (Pong, Hopper and others). [Chuang and colleagues](https://arxiv.org/abs/2207.09705) (2022) trace the same effect to how information flows through the network, and propose an architecture that avoids it by design.

Nobody should read this as "history always hurts". The same Wen paper finds two frames beat one in five of six partially observed tasks. The picture is mixed:

| System | What happened with more history | Source |
| --- | --- | --- |
| Diffusion policy, 16 steps, no fix | Square 0.79 → 0.17, Tool-Hang 0.51 → 0.00 | [Torne et al., 2025](https://arxiv.org/abs/2505.09561), Table 3 |
| Same paper, regression policy | No drop. Here the policy under-uses its past, the opposite of copycat | Torne et al., 2025, Fig. 2 |
| π0 and [GR00T N1.5](https://arxiv.org/abs/2503.14734) (VLM start) | About flat from 1 to 8 frames | [ContextVLA](https://arxiv.org/abs/2510.04246) (Jang et al., 2025), Fig. 2 (read from a chart) |
| GR00T N1.5, naive multi-frame | [LIBERO](https://arxiv.org/abs/2306.03310) 95.6 → 86.8 | [HAMLET](https://arxiv.org/abs/2510.00695) (Koo et al., 2025), Table 2 |

So the cause depends on the model. The authors of ContextVLA read their result as the pretrained VLM start doing the work, but that is their interpretation of an ablation, not a separate test. A 2026 audit by [Liao and Cao](https://arxiv.org/abs/2607.03372) looked inside three frozen VLAs. Past-frame content stays decodable, but information unique to the history is nearly absent, and the models use history mainly when the current frame is heavily degraded.

## Six ways to remember, and what each one stores

<div class="table-scroll">

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

## Drawing the problem

Take the hall again. The policy reads a short window directly. Everything older has to go through one of the routes below, and each route fails in its own way.

<figure class="article-figure">
<svg viewBox="0 0 480 530" role="img" aria-labelledby="fig-mem-t fig-mem-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-mem-t">Where the past goes when the policy only reads a short window</title><desc id="fig-mem-d">A strip of four frames from oldest to newest: start, past door 1, past door 2, blue box now. The two oldest frames sit outside the policy's window, so the policy cannot read where the robot started. The two newest frames go straight to the policy. A write line carries what happened into six memory routes: keep more frames, write a text note, compress to vectors, keep key frames, draw a map, and keep skills after the episode. A read line carries what each route kept back to the policy, which then chooses the next action.</desc><defs><marker id="fig-mem-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#242622"/></marker><marker id="fig-mem-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" fill="#2b6a8e"/></marker></defs><rect x="0.75" y="0.75" width="478.5" height="528.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="12" y="15" font-size="12.5" fill="#b44c2c" font-weight="700">outside the window</text><text x="246" y="15" font-size="12.5" fill="#2b6a8e" font-weight="700">what a short-window policy reads</text><rect x="8" y="20" width="224" height="50" fill="none" stroke="#b44c2c" stroke-width="1.5" stroke-dasharray="5 4"/><rect x="236" y="20" width="224" height="50" fill="none" stroke="#2b6a8e" stroke-width="2"/><g stroke="#242622" stroke-width="1.5" fill="#fff"><rect x="16" y="28" width="96" height="34"/><rect x="124" y="28" width="96" height="34"/><rect x="244" y="28" width="96" height="34"/><rect x="352" y="28" width="96" height="34"/></g><g font-size="12.5" text-anchor="middle"><text x="64" y="49">start</text><text x="172" y="49">past door 1</text><text x="292" y="49">past door 2</text><text x="400" y="49">blue box (now)</text></g><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><path d="M460,45 H472 V466 H364" stroke="#2b6a8e" marker-end="url(#fig-mem-b)"/><path d="M24,76 H448 M24,76 V114" stroke="#242622"/></g><text x="32" y="89" font-size="12" fill="#656b62">write: what happened</text><g stroke-width="1.5"><rect x="60" y="98" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="150" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="202" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="254" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="306" width="340" height="44" fill="#fff" stroke="#242622"/><rect x="60" y="358" width="340" height="44" fill="#f6e4dc" stroke="#b44c2c"/></g><g fill="none" stroke="#242622" stroke-width="1.5" stroke-linecap="round"><path d="M24,120 H58" marker-end="url(#fig-mem-a)"/><path d="M24,172 H58" marker-end="url(#fig-mem-a)"/><path d="M24,224 H58" marker-end="url(#fig-mem-a)"/><path d="M24,276 H58" marker-end="url(#fig-mem-a)"/><path d="M24,328 H58" marker-end="url(#fig-mem-a)"/><path d="M24,380 H58" marker-end="url(#fig-mem-a)"/><path d="M24,114 V380"/><path d="M400,120 H440 M400,172 H440 M400,224 H440 M400,276 H440 M400,328 H440 M400,380 H440"/><path d="M440,120 V486 H364" marker-end="url(#fig-mem-a)"/></g><g font-size="13" font-weight="700"><text x="70" y="116">Keep more frames</text><text x="70" y="168">Write a text note</text><text x="70" y="220">Compress to vectors</text><text x="70" y="272">Keep key frames</text><text x="70" y="324">Draw a map</text><text x="70" y="376">Keep skills after the episode</text></g><g font-size="12.5" fill="#242622"><text x="70" y="133">RT-1, Robostral Navigate. Weak: cost, copycat</text><text x="70" y="185">RoboMME symbolic, MemER. Weak: drops detail</text><text x="70" y="237">MemoryVLA. Weak: unreadable, hard to train</text><text x="70" y="289">MemER, SAM2Act+. Weak: choosing the frames</text><text x="70" y="341">ViNT, VLMaps. Weak: drift, static scene</text><text x="70" y="393">ASPIRE. Weak: stale or redundant notes</text></g><text x="446" y="112" font-size="12" fill="#656b62" text-anchor="end">read</text><rect x="120" y="440" width="244" height="60" fill="#fff" stroke="#242622" stroke-width="2"/><g text-anchor="middle"><text x="242" y="466" font-size="14" font-weight="700">Policy: next action</text><text x="242" y="486" font-size="12">turn left, or head home?</text></g><text x="240" y="520" font-size="11" text-anchor="middle" fill="#656b62">Red: kept after the episode ends. Blue arrow: the direct window.</text></g></svg>
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
<svg viewBox="0 0 480 330" role="img" aria-labelledby="fig-mme-t fig-mme-d" style="display:block;width:100%;height:auto;max-width:560px;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><title id="fig-mme-t">RoboMME: text memory against visual-token memory on five tasks</title><desc id="fig-mme-d">Success rates in percent. BinFill: text 77.56, visual tokens 39.56. PickXTimes: text 95.33, visual tokens 87.33. SwingXTimes: text 5.11, visual tokens 92.00. StopCube: text 0.44, visual tokens 42.00. PatternLock: text 12.67, visual tokens 53.56.</desc><rect x="0.75" y="0.75" width="478.5" height="328.5" fill="#f1f2ed" stroke="#cfd1c8" stroke-width="1.5"/><g font-family="Arial, Helvetica, sans-serif" fill="#242622"><text x="16" y="24" font-size="13" font-weight="700">RoboMME success rate by task (%)</text><rect x="16" y="34" width="12" height="12" fill="#2b6a8e"/><text x="34" y="44" font-size="11.5">Text subgoals (SimpleSG + Qwen)</text><rect x="240" y="34" width="12" height="12" fill="#b44c2c"/><text x="258" y="44" font-size="11.5">Visual tokens (FrameSamp + Modul)</text><g font-size="12.5" font-weight="700"><text x="16" y="84">BinFill</text><text x="16" y="140">PickXTimes</text><text x="16" y="196">SwingXTimes</text><text x="16" y="252">StopCube</text><text x="16" y="308">PatternLock</text></g><g fill="#2b6a8e"><rect x="108" y="64" width="224.9" height="16"/><rect x="108" y="120" width="276.5" height="16"/><rect x="108" y="176" width="14.8" height="16"/><rect x="108" y="232" width="1.3" height="16"/><rect x="108" y="288" width="36.7" height="16"/></g><g fill="#b44c2c"><rect x="108" y="82" width="114.7" height="16"/><rect x="108" y="138" width="253.3" height="16"/><rect x="108" y="194" width="266.8" height="16"/><rect x="108" y="250" width="121.8" height="16"/><rect x="108" y="306" width="155.3" height="16"/></g><g font-size="11.5" font-weight="700"><text x="338" y="76">77.56</text><text x="228" y="94">39.56</text><text x="390" y="132">95.33</text><text x="367" y="150">87.33</text><text x="128" y="188">5.11</text><text x="380" y="206">92.00</text><text x="115" y="244">0.44</text><text x="236" y="262">42.00</text><text x="150" y="300">12.67</text><text x="269" y="318">53.56</text></g></g></svg>
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

<div class="table-scroll">

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

All entries link to the paper. Authors and years come from the arXiv record (one entry from Crossref). The first table lists the 32 works named in the article. The second lists the other 138 papers from the sweep, grouped by the sweep's own label.

<div class="table-scroll">

| Named in the article | Paper | Authors | Year | Link |
| --- | --- | --- | ---: | --- |
| RT-1 | RT-1: Robotics Transformer for Real-World Control at Scale | Anthony Brohan et al. | 2022 | [arXiv 2212.06817](https://arxiv.org/abs/2212.06817) |
| Octo | Octo: An Open-Source Generalist Robot Policy | Octo Model Team | 2024 | [arXiv 2405.12213](https://arxiv.org/abs/2405.12213) |
| Diffusion Policy | Diffusion Policy: Visuomotor Policy Learning via Action Diffusion | Cheng Chi et al. | 2023 | [arXiv 2303.04137](https://arxiv.org/abs/2303.04137) |
| ACT | Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware | Tony Z. Zhao et al. | 2023 | [arXiv 2304.13705](https://arxiv.org/abs/2304.13705) |
| π0 | π0: A Vision-Language-Action Flow Model for General Robot Control | Kevin Black et al. | 2024 | [arXiv 2410.24164](https://arxiv.org/abs/2410.24164) |
| π0.5 | π0.5: a Vision-Language-Action Model with Open-World Generalization | Physical Intelligence | 2025 | [arXiv 2504.16054](https://arxiv.org/abs/2504.16054) |
| OpenVLA | OpenVLA: An Open-Source Vision-Language-Action Model | Moo Jin Kim et al. | 2024 | [arXiv 2406.09246](https://arxiv.org/abs/2406.09246) |
| GR00T N1 (the article uses N1.5) | GR00T N1: An Open Foundation Model for Generalist Humanoid Robots | NVIDIA (Bjorck et al.) | 2025 | [arXiv 2503.14734](https://arxiv.org/abs/2503.14734) |
| CogACT | CogACT: A Foundational Vision-Language-Action Model for Synergizing Cognition and Action in Robotic Manipulation | Qixiu Li et al. | 2024 | [arXiv 2411.19650](https://arxiv.org/abs/2411.19650) |
| SAM2Act | SAM2Act: Integrating Visual Foundation Model with A Memory Architecture for Robotic Manipulation | Haoquan Fang et al. | 2025 | [arXiv 2501.18564](https://arxiv.org/abs/2501.18564) |
| RoboMME | RoboMME: Benchmarking and Understanding Memory for Robotic Generalist Policies | Yinpei Dai et al. | 2026 | [arXiv 2603.04639](https://arxiv.org/abs/2603.04639) |
| MemER | MemER: Scaling Up Memory for Robot Control via Experience Retrieval | Ajay Sridhar et al. | 2025 | [arXiv 2510.20328](https://arxiv.org/abs/2510.20328) |
| MemoryVLA | MemoryVLA: Perceptual-Cognitive Memory in Vision-Language-Action Models for Robotic Manipulation | Hao Shi et al. | 2025 | [arXiv 2508.19236](https://arxiv.org/abs/2508.19236) |
| CronusVLA | CronusVLA: Towards Efficient and Robust Manipulation via Multi-Frame Vision-Language-Action Modeling | Hao Li et al. | 2025 | [arXiv 2506.19816](https://arxiv.org/abs/2506.19816) |
| HAMLET | HAMLET: Switch your Vision-Language-Action Model into a History-Aware Policy | Myungkyu Koo et al. | 2025 | [arXiv 2510.00695](https://arxiv.org/abs/2510.00695) |
| ContextVLA | ContextVLA: Vision-Language-Action Model with Amortized Multi-Frame Context | Huiwon Jang et al. | 2025 | [arXiv 2510.04246](https://arxiv.org/abs/2510.04246) |
| NavFoM | Embodied Navigation Foundation Model | Jiazhao Zhang et al. | 2025 | [arXiv 2509.12129](https://arxiv.org/abs/2509.12129) |
| Robostral Navigate | Robostral Navigate | Abdelaziz Bounhar et al. | 2026 | [arXiv 2607.20785](https://arxiv.org/abs/2607.20785) |
| ViNT | ViNT: A Foundation Model for Visual Navigation | Dhruv Shah et al. | 2023 | [arXiv 2306.14846](https://arxiv.org/abs/2306.14846) |
| NoMaD | NoMaD: Goal Masked Diffusion Policies for Navigation and Exploration | Ajay Sridhar et al. | 2023 | [arXiv 2310.07896](https://arxiv.org/abs/2310.07896) |
| VLMaps | Visual Language Maps for Robot Navigation | Chenguang Huang et al. | 2022 | [arXiv 2210.05714](https://arxiv.org/abs/2210.05714) |
| ASPIRE | ASPIRE: Agentic /Skills Discovery for Robotics | Runyu Lu et al. | 2026 | [arXiv 2607.00272](https://arxiv.org/abs/2607.00272) |
| SOLE-R1 | SOLE-R1: Video-Language Reasoning as the Sole Reward for On-Robot Reinforcement Learning | Philip Schroeder et al. | 2026 | [arXiv 2603.28730](https://arxiv.org/abs/2603.28730) |
| Wen et al. (copycat) | Fighting Copycat Agents in Behavioral Cloning from Observation Histories | Chuan Wen et al. | 2020 | [arXiv 2010.14876](https://arxiv.org/abs/2010.14876) |
| de Haan et al. (causal confusion) | Causal Confusion in Imitation Learning | Pim de Haan et al. | 2019 | [arXiv 1905.11979](https://arxiv.org/abs/1905.11979) |
| Torne et al. (past-token prediction) | Learning Long-Context Diffusion Policies via Past-Token Prediction | Marcel Torne et al. | 2025 | [arXiv 2505.09561](https://arxiv.org/abs/2505.09561) |
| LIBERO | LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning | Bo Liu et al. | 2023 | [arXiv 2306.03310](https://arxiv.org/abs/2306.03310) |
| LIBERO-PRO | LIBERO-PRO: Towards Robust and Fair Evaluation of Vision-Language-Action Models Beyond Memorization | Xueyang Zhou et al. | 2025 | [arXiv 2510.03827](https://arxiv.org/abs/2510.03827) |
| SimplerEnv | Evaluating Real-World Robot Manipulation Policies in Simulation | Xuanlin Li et al. | 2024 | [arXiv 2405.05941](https://arxiv.org/abs/2405.05941) |
| RoboCasa | RoboCasa: Large-Scale Simulation of Everyday Tasks for Generalist Robots | Soroush Nasiriany et al. | 2024 | [arXiv 2406.02523](https://arxiv.org/abs/2406.02523) |
| R2R-CE | Beyond the Nav-Graph: Vision-and-Language Navigation in Continuous Environments | Jacob Krantz et al. | 2020 | [arXiv 2004.02857](https://arxiv.org/abs/2004.02857) |
| RxR-CE | Room-Across-Room: Multilingual Vision-and-Language Navigation with Dense Spatiotemporal Grounding | Alexander Ku et al. | 2020 | [arXiv 2010.07954](https://arxiv.org/abs/2010.07954) |

</div>

<div class="table-scroll">

**Analysis of history and memory use** (3)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | Beyond Success Rate: Interventional Evaluation of Memory in Vision-Language-Action Systems | Keyuan Luo et al. | [arXiv 2610.23372](https://arxiv.org/abs/2610.23372) |
| 2026 | Memory That Changes Action Is Not Memory That Guides It: Counterfactual Auditing of History-Conditioned Robot Policies | Jiajie Zhang et al. | [arXiv 2609.27247](https://arxiv.org/abs/2609.27247) |
| 2026 | Present but Not Remembered: Auditing How Frozen VLAs Encode, Deploy, and Steer Visual History | Chih-Ting Liao and Xin Cao | [arXiv 2607.03372](https://arxiv.org/abs/2607.03372) |

**Benchmarks** (23)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | Benchmarking and Enhancing Skill-Level Memory for Partially Observable Robotic Manipulation | Yansong Shi et al. | [arXiv 2609.38886](https://arxiv.org/abs/2609.38886) |
| 2026 | Beyond the Current Observation: Evaluating Multimodal Large Language Models in Controllable Non-Markov Games | Shengyuan Ding et al. | [arXiv 2606.19338](https://arxiv.org/abs/2606.19338) |
| 2026 | Can a Frontier VLM Serve as a Robot Policy for Memory-Dependent Manipulation? | Jack B. Jedlicki et al. | [arXiv 2610.17350](https://arxiv.org/abs/2610.17350) |
| 2026 | Compiling and Benchmarking Task-State Horizons for Embodied Agents | Meiqi Wang and Shichao Li | [arXiv 2608.08036](https://arxiv.org/abs/2608.08036) |
| 2026 | EMBER-Bench: Benchmarking Cross-Event Causal Memory in Long-Horizon Embodied Tasks | Aoyang Cai et al. | [arXiv 2610.05013](https://arxiv.org/abs/2610.05013) |
| 2026 | EmbodiedMemory-Bench: Benchmarking Embodied Memory for Long-Horizon Embodied Tasks | Lizhou Liang et al. | [arXiv 2609.28236](https://arxiv.org/abs/2609.28236) |
| 2026 | Explore with Long-term Memory: A Benchmark and Multimodal LLM-based Reinforcement Learning Framework for Embodied Exploration | Sen Wang et al. | [arXiv 2601.10744](https://arxiv.org/abs/2601.10744) |
| 2026 | Grounded in Time: A Multi-Source Dataset and Benchmark for Temporal Grounding in Robotic Manipulation | Yi Wang et al. | [arXiv 2610.04255](https://arxiv.org/abs/2610.04255) |
| 2026 | LongBench: Evaluating Robotic Manipulation Policies on Real-World Long-Horizon Tasks | Xueyao Chen et al. | [arXiv 2604.16788](https://arxiv.org/abs/2604.16788) |
| 2026 | MEMOBench: A Process Level Memory Benchmark for Robotic Manipulation | Haiyang Sun et al. | [arXiv 2609.07047](https://arxiv.org/abs/2609.07047) |
| 2026 | MIKASA-Robo-VLA: Benchmarking Memory in VLA Models for Long-Horizon Manipulation | Egor Cherepanov et al. | [arXiv 2610.00604](https://arxiv.org/abs/2610.00604) |
| 2026 | MemTransfer: Benchmarking Memory Beyond Matched Experience in Embodied Decision-Making | Haiming Tang et al. | [arXiv 2609.32313](https://arxiv.org/abs/2609.32313) |
| 2026 | Memory Retention Is Not Enough to Master Memory Tasks in Reinforcement Learning | Oleg Shchendrigin et al. | [arXiv 2601.15086](https://arxiv.org/abs/2601.15086) |
| 2026 | RMBench: Memory-Dependent Robotic Manipulation Benchmark with Insights into Policy Design | Tianxing Chen et al. | [arXiv 2603.01229](https://arxiv.org/abs/2603.01229) |
| 2026 | RoboMME-Interference: Benchmarking Robot Memory Under Interference | Soumil Rathi | [arXiv 2606.22338](https://arxiv.org/abs/2606.22338) |
| 2026 | RoboMemArena: A Comprehensive and Challenging Robotic Memory Benchmark | Huashuo Lei et al. | [arXiv 2605.10921](https://arxiv.org/abs/2605.10921) |
| 2026 | What Should Embodied Agents Remember? Benchmarking and Evaluating Memory Modality for Embodied Agents | Junxiang Wang et al. | [arXiv 2610.12561](https://arxiv.org/abs/2610.12561) |
| 2026 | WorldLines: Benchmarking and Modeling Long-Horizon Stateful Embodied Agents | Yehang Zhang et al. | [arXiv 2606.18847](https://arxiv.org/abs/2606.18847) |
| 2025 | Benchmarking Partial Observability in Reinforcement Learning with a Suite of Memory-Improvable Domains | Ruo Yu Tao et al. | [arXiv 2508.00046](https://arxiv.org/abs/2508.00046) |
| 2025 | FindingDory: A Benchmark to Evaluate Memory in Embodied Agents | Karmesh Yadav et al. | [arXiv 2506.15635](https://arxiv.org/abs/2506.15635) |
| 2025 | Memory, Benchmark & Robots: A Benchmark for Solving Complex Tasks with Reinforcement Learning | Egor Cherepanov et al. | [arXiv 2502.10550](https://arxiv.org/abs/2502.10550) |
| 2025 | RoboCerebra: A Large-scale Benchmark for Long-horizon Robotic Manipulation Evaluation | Songhao Han et al. | [arXiv 2506.06677](https://arxiv.org/abs/2506.06677) |
| 2024 | GOAT-Bench: A Benchmark for Multi-Modal Lifelong Navigation | Mukul Khanna et al. | [arXiv 2404.06609](https://arxiv.org/abs/2404.06609) |

**Key frames and retrieval** (11)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | BPP: Long-Context Robot Imitation Learning by Focusing on Key History Frames | Max Sobol Mark et al. | [arXiv 2602.15010](https://arxiv.org/abs/2602.15010) |
| 2026 | Divide-and-Remember: Recursive Action-Relevant Memory for Long-Horizon VLA Policies | Xuehui Yu et al. | [arXiv 2610.00982](https://arxiv.org/abs/2610.00982) |
| 2026 | EventVLA: Event-Driven Visual Evidence Memory for Long-Horizon Vision-Language-Action Policies | Ganlin Yang et al. | [arXiv 2606.20092](https://arxiv.org/abs/2606.20092) |
| 2026 | KEMO: Event-Driven Keyframe Memory for Long-Horizon Robot Manipulation with VLA Policies | Yihan Zeng et al. | [arXiv 2606.23589](https://arxiv.org/abs/2606.23589) |
| 2026 | Memory Retrieval in Visuomotor Policies for Long-Horizon Robot Control | Rutav Shah et al. | [arXiv 2606.25136](https://arxiv.org/abs/2606.25136) |
| 2026 | Non-Markovian Long-Horizon Robot Manipulation via Keyframe Chaining | Yipeng Chen et al. | [arXiv 2603.01465](https://arxiv.org/abs/2603.01465) |
| 2024 | RAG-Modulo: Solving Sequential Tasks using Experience, Critics, and Language Models | Abhinav Jain et al. | [arXiv 2409.12294](https://arxiv.org/abs/2409.12294) |
| 2024 | RAP: Retrieval-Augmented Planning with Contextual Memory for Multimodal LLM Agents | Tomoyuki Kagaya et al. | [arXiv 2402.03610](https://arxiv.org/abs/2402.03610) |
| 2024 | ReMEmbR: Building and Reasoning Over Long-Horizon Spatio-Temporal Memory for Robot Navigation | Abrar Anwar et al. | [arXiv 2409.13682](https://arxiv.org/abs/2409.13682) |
| 2023 | JARVIS-1: Open-World Multi-task Agents with Memory-Augmented Multimodal Language Models | Zihao Wang et al. | [arXiv 2311.05997](https://arxiv.org/abs/2311.05997) |
| 2017 | Neural Episodic Control | Alexander Pritzel et al. | [arXiv 1703.01988](https://arxiv.org/abs/1703.01988) |

**Latent and vector memory** (10)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | Chameleon: Control-Indexed Prospective Memory for Visuomotor Manipulation | Xinying Guo et al. | [arXiv 2603.24576](https://arxiv.org/abs/2603.24576) |
| 2026 | Dual Latent Memory in Vision-Language-Action Models for Robotic Manipulation | Hongyu Qu et al. | [arXiv 2607.07608](https://arxiv.org/abs/2607.07608) |
| 2026 | ECHO: Continuous Hierarchical Memory for Vision-Language-Action Models | Yanbin Hu et al. | [arXiv 2605.10993](https://arxiv.org/abs/2605.10993) |
| 2026 | LTM: Latent Transition Based In-Context Memory for Vision-Language-Action Models | Qixin Sun et al. | [arXiv 2610.21362](https://arxiv.org/abs/2610.21362) |
| 2026 | Mem4Act: Learning Effective Latent Memory for Long-Horizon Robotic Manipulation | Yun Zhang et al. | [arXiv 2610.22323](https://arxiv.org/abs/2610.22323) |
| 2026 | Memory Without Curation: Learning Multi-Stream Latent Memory for Robot Policies | Yilin Wu et al. | [arXiv 2610.14406](https://arxiv.org/abs/2610.14406) |
| 2026 | MemoryVLA++: Temporal Modeling via Memory and Imagination in Vision-Language-Action Models | Hao Shi et al. | [arXiv 2606.09827](https://arxiv.org/abs/2606.09827) |
| 2026 | Scaling Short-Term Memory of Visuomotor Policies for Long-Horizon Tasks | Rutav Shah et al. | [arXiv 2606.16178](https://arxiv.org/abs/2606.16178) |
| 2026 | StateMem: Single-State Residual Memory with Adaptive Inference for Vision-Language-Action Policies | Wenzhuo Li et al. | [arXiv 2609.22684](https://arxiv.org/abs/2609.22684) |
| 2026 | VPWEM: Non-Markovian Visuomotor Policy with Working and Episodic Memory | Yuheng Lei et al. | [arXiv 2603.04910](https://arxiv.org/abs/2603.04910) |

**Longer frame context** (8)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | HIRE: History-Conditioned Interaction Reasoning and High-Rate Execution for Visually Aliased Precision Manipulation | Rongji Li et al. | [arXiv 2609.30828](https://arxiv.org/abs/2609.30828) |
| 2026 | SimpleMemVLA: A Simple but Effective Native-Video Memory for Vision-Language-Action Models | Cheng Yin et al. | [arXiv 2609.05533](https://arxiv.org/abs/2609.05533) |
| 2026 | TemporalFlow-VLA: Learning Physically Grounded Execution History for Long-Horizon Robot Manipulation | Jiarui Yang et al. | [arXiv 2608.26821](https://arxiv.org/abs/2608.26821) |
| 2026 | Training and Evaluating Diffusion Policies with Long Context Lengths | Abhinav Agarwal et al. | [arXiv 2606.16447](https://arxiv.org/abs/2606.16447) |
| 2025 | StreamVLN: Streaming Vision-and-Language Navigation via SlowFast Context Modeling | Meng Wei et al. | [arXiv 2507.05240](https://arxiv.org/abs/2507.05240) |
| 2025 | VLN-R1: Vision-Language Navigation via Reinforcement Fine-Tuning | Zhangyang Qi et al. | [arXiv 2506.17221](https://arxiv.org/abs/2506.17221) |
| 2022 | Resolving Copycat Problems in Visual Imitation Learning via Residual Action Prediction | Chia-Chi Chuang et al. | [arXiv 2207.09705](https://arxiv.org/abs/2207.09705) |
| 2021 | History Aware Multimodal Transformer for Vision-and-Language Navigation | Shizhe Chen et al. | [arXiv 2110.13309](https://arxiv.org/abs/2110.13309) |

**Maps and scene memory** (28)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | AtlasVLA: Persistent World-Ego State Modeling for Vision-Language-Action Models | Guiyu Zhao et al. | [arXiv 2608.06729](https://arxiv.org/abs/2608.06729) |
| 2026 | GaussMemory: Task-Driven 3D Gaussian Scene Memory for Long-Horizon Robotic Manipulation | Zhiqiang Hu et al. | [arXiv 2608.14986](https://arxiv.org/abs/2608.14986) |
| 2026 | OCC4M: Object-Centric 4D Memory for Spatiotemporal Reasoning in Long-Horizon Manipulation | Jack B. Jedlicki et al. | [arXiv 2609.28798](https://arxiv.org/abs/2609.28798) |
| 2026 | Personalizing Embodied Multimodal Large Language Model Agents over Long-term User Interactions | Jeongeun Lee et al. | [arXiv 2605.26256](https://arxiv.org/abs/2605.26256) |
| 2026 | SERF: Spatiotemporal Environment and Robot Feature Map for Long-Horizon Mobile Manipulation | Sunghwan Kim et al. | [arXiv 2606.12956](https://arxiv.org/abs/2606.12956) |
| 2026 | Safe Task Planning with Long-Term Graph Memory for Embodied Agents | Siyuan Li et al. | [arXiv 2609.08444](https://arxiv.org/abs/2609.08444) |
| 2026 | Spatial Memory for Out-of-Vision Manipulation in Vision-Language-Action | Pengteng Li et al. | [arXiv 2605.22283](https://arxiv.org/abs/2605.22283) |
| 2026 | Where Memory Belongs: Ledger, an Object Ledger for Memory-Augmented VLAs | Tanguy Dieudonné et al. | [arXiv 2609.34554](https://arxiv.org/abs/2609.34554) |
| 2025 | CityNavAgent: Aerial Vision-and-Language Navigation with Hierarchical Semantic Planning and Global Memory | Weichen Zhang et al. | [arXiv 2505.05622](https://arxiv.org/abs/2505.05622) |
| 2025 | DyNaVLM: Zero-Shot Vision-Language Navigation System with Dynamic Viewpoints and Self-Refining Graph Memory | Zihe Ji et al. | [arXiv 2506.15096](https://arxiv.org/abs/2506.15096) |
| 2025 | EchoVLA: Robotic Vision-Language-Action Model with Synergistic Declarative Memory for Mobile Manipulation | Min Lin et al. | [arXiv 2511.18112](https://arxiv.org/abs/2511.18112) |
| 2025 | L3M+P: Lifelong Planning with Large Language Models | Krish Agarwal et al. | [arXiv 2508.01917](https://arxiv.org/abs/2508.01917) |
| 2025 | MapNav: A Novel Memory Representation via Annotated Semantic Maps for Vision-and-Language Navigation | Lingfeng Zhang et al. | [arXiv 2502.13451](https://arxiv.org/abs/2502.13451) |
| 2025 | MossVLN: Memory-Observation Synergistic System for Continuous Vision-Language Navigation | Ting Yu et al. | [DOI 10.1109/TMM.2025.3586105](https://doi.org/10.1109/TMM.2025.3586105) |
| 2024 | 3D-Mem: 3D Scene Memory for Embodied Exploration and Reasoning | Yuncong Yang et al. | [arXiv 2411.17735](https://arxiv.org/abs/2411.17735) |
| 2024 | Hierarchical Open-Vocabulary 3D Scene Graphs for Language-Grounded Robot Navigation | Abdelrhman Werby et al. | [arXiv 2403.17846](https://arxiv.org/abs/2403.17846) |
| 2024 | KARMA: Augmenting Embodied AI Agents with Long-and-short Term Memory Systems | Zixuan Wang et al. | [arXiv 2409.14908](https://arxiv.org/abs/2409.14908) |
| 2024 | MC-GPT: Empowering Vision-and-Language Navigation with Memory Map and Reasoning Chains | Zhaohuan Zhan et al. | [arXiv 2405.10620](https://arxiv.org/abs/2405.10620) |
| 2024 | MapGPT: Map-Guided Prompting with Adaptive Path Planning for Vision-and-Language Navigation | Jiaqi Chen et al. | [arXiv 2401.07314](https://arxiv.org/abs/2401.07314) |
| 2023 | ConceptGraphs: Open-Vocabulary 3D Scene Graphs for Perception and Planning | Qiao Gu et al. | [arXiv 2309.16650](https://arxiv.org/abs/2309.16650) |
| 2023 | GOAT: GO to Any Thing | Matthew Chang et al. | [arXiv 2311.06430](https://arxiv.org/abs/2311.06430) |
| 2023 | GridMM: Grid Memory Map for Vision-and-Language Navigation | Zihan Wang et al. | [arXiv 2307.12907](https://arxiv.org/abs/2307.12907) |
| 2022 | BEVBert: Multimodal Map Pre-training for Language-guided Navigation | Dong An et al. | [arXiv 2212.04385](https://arxiv.org/abs/2212.04385) |
| 2022 | CLIP-Fields: Weakly Supervised Semantic Fields for Robotic Memory | Nur Muhammad Mahi Shafiullah et al. | [arXiv 2210.05663](https://arxiv.org/abs/2210.05663) |
| 2020 | Neural Topological SLAM for Visual Navigation | Devendra Singh Chaplot et al. | [arXiv 2005.12256](https://arxiv.org/abs/2005.12256) |
| 2020 | Occupancy Anticipation for Efficient Exploration and Navigation | Santhosh K. Ramakrishnan et al. | [arXiv 2008.09285](https://arxiv.org/abs/2008.09285) |
| 2019 | Scene Memory Transformer for Embodied Agents in Long-Horizon Tasks | Kuan Fang et al. | [arXiv 1903.03878](https://arxiv.org/abs/1903.03878) |
| 2017 | Neural SLAM: Learning to Explore with External Memory | Jingwei Zhang et al. | [arXiv 1706.09520](https://arxiv.org/abs/1706.09520) |

**Other designs** (15)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | 2AM: Grounding Agent-Side Memory as Guidance for Steerable Action Models in Long-Horizon Manipulation | Yutong Hu et al. | [arXiv 2609.11308](https://arxiv.org/abs/2609.11308) |
| 2026 | BEACON: Belief-Enabled Adaptive CONtrol for Imitation Learning under Uncertainty | Moonyoung Lee et al. | [arXiv 2609.22730](https://arxiv.org/abs/2609.22730) |
| 2026 | HIMM: Human-Inspired Long-Term Memory Modeling for Embodied Exploration and Question Answering | Ji Li et al. | [arXiv 2602.15513](https://arxiv.org/abs/2602.15513) |
| 2026 | MemoAct: Atkinson-Shiffrin-Inspired Hierarchical Memory-Augmented Policy for Robotic Manipulation | Liufan Tan et al. | [arXiv 2603.18494](https://arxiv.org/abs/2603.18494) |
| 2026 | MotionVLA: Injecting Geometric Motion into Vision-Language-Action Model | Shanglin Yuan et al. | [arXiv 2606.08288](https://arxiv.org/abs/2606.08288) |
| 2026 | Multimodal Filesystem Memory For Long-Horizon Embodied Agents | Chloe Su et al. | [arXiv 2610.22686](https://arxiv.org/abs/2610.22686) |
| 2026 | Physical Time as a Missing Dimension of Robot Policy Memory Dynamics | Yushen Liang et al. | [arXiv 2610.20524](https://arxiv.org/abs/2610.20524) |
| 2026 | Simple Agentic Memory for Generalist Robot Policies | Yuyou Zhang et al. | [arXiv 2609.36595](https://arxiv.org/abs/2609.36595) |
| 2026 | Trace-Focused Diffusion Policy for Multi-Modal Action Disambiguation in Long-Horizon Robotic Manipulation | Yuxuan Hu et al. | [arXiv 2602.07388](https://arxiv.org/abs/2602.07388) |
| 2026 | Worth Remembering: Surprise-Gated Robot Episodic Memory | Nicolas Gorlo et al. | [arXiv 2606.03787](https://arxiv.org/abs/2606.03787) |
| 2025 | Ella: Embodied Social Agents with Lifelong Memory | Hongxin Zhang et al. | [arXiv 2506.24019](https://arxiv.org/abs/2506.24019) |
| 2025 | History-Aware Visuomotor Policy Learning via Point Tracking | Jingjing Chen et al. | [arXiv 2509.17141](https://arxiv.org/abs/2509.17141) |
| 2025 | JanusVLN: Decoupling Semantics and Spatiality with Dual Implicit Memory for Vision-Language Navigation | Shuang Zeng et al. | [arXiv 2509.22548](https://arxiv.org/abs/2509.22548) |
| 2025 | Meta-Memory: Retrieving and Integrating Semantic-Spatial Memories for Robot Spatial Reasoning | Yufan Mao et al. | [arXiv 2509.20754](https://arxiv.org/abs/2509.20754) |
| 2024 | Embodied VideoAgent: Persistent Memory from Egocentric Videos and Embodied Sensors Enables Dynamic Scene Understanding | Yue Fan et al. | [arXiv 2501.00358](https://arxiv.org/abs/2501.00358) |

**Recurrent and state-space memory** (13)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | AURA: Action-Gated Memory for Robot Policies at Constant VRAM | Josef Chen | [arXiv 2606.02775](https://arxiv.org/abs/2606.02775) |
| 2026 | Chronos: A Physics-Informed Full-History Framework for Non-Markovian Long-Horizon Manipulation | Yulin Zhou et al. | [arXiv 2606.30318](https://arxiv.org/abs/2606.30318) |
| 2026 | DRAM: Delta-rule Recurrent Associative Memory for Robot Manipulation Policies | Xinyu Zhao et al. | [arXiv 2609.32453](https://arxiv.org/abs/2609.32453) |
| 2026 | DSSP: Diffusion State Space Policy with Full-History Encoding | Zhiyuan Guan et al. | [arXiv 2605.14598](https://arxiv.org/abs/2605.14598) |
| 2026 | MemBodied: Recurrent Associative Memory for Vision-Language-Action Models | Tej Deep Pala et al. | [arXiv 2609.28256](https://arxiv.org/abs/2609.28256) |
| 2026 | Minimal Recurrent Behavioral Memory for Imitation under Partial Observability | Xianyao Li et al. | [arXiv 2609.25757](https://arxiv.org/abs/2609.25757) |
| 2026 | ReCAT: Remember, Count, and Time: Structured Recurrent Memory for Robot Manipulation | Pankhuri Vanjani et al. | [arXiv 2609.35200](https://arxiv.org/abs/2609.35200) |
| 2026 | ReMem-VLA: Empowering Vision-Language-Action Model with Memory via Dual-Level Recurrent Queries | Hang Li et al. | [arXiv 2603.12942](https://arxiv.org/abs/2603.12942) |
| 2026 | Recursive Belief Vision Language Action Models | Vaidehi Bagaria et al. | [arXiv 2602.20659](https://arxiv.org/abs/2602.20659) |
| 2026 | SmoLSTM: A Compact Vision-Language-Action Model with Recurrent Memory that Persists | Jan-Gerrit Habekost et al. | [arXiv 2609.22854](https://arxiv.org/abs/2609.22854) |
| 2026 | μVLA: On Recurrent Memory for Partially Observable Manipulation in VLA Models | Egor Cherepanov et al. | [arXiv 2606.12497](https://arxiv.org/abs/2606.12497) |
| 2025 | MTIL: Encoding Full History with Mamba for Temporal Imitation Learning | Yulin Zhou et al. | [arXiv 2505.12410](https://arxiv.org/abs/2505.12410) |
| 2019 | Learning Belief Representations for Imitation Learning in POMDPs | Tanmay Gangwani et al. | [arXiv 1906.09510](https://arxiv.org/abs/1906.09510) |

**Skills and code** (10)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | Explore, Execute, Evolve: A Skill Acquisition and Reuse Loop for Embodied Agents | Sicheng Xie et al. | [arXiv 2609.37810](https://arxiv.org/abs/2609.37810) |
| 2026 | From Local Corrections to Generalized Skills: Improving Neuro-Symbolic Policies with MEMO | Benjamin A. Christie et al. | [arXiv 2603.04560](https://arxiv.org/abs/2603.04560) |
| 2026 | SEAR: Self-Evolving Agentic Robotics | Xinyi Wang et al. | [arXiv 2610.18792](https://arxiv.org/abs/2610.18792) |
| 2026 | SkillComposer: Learning Reusable Skills for Natural-Language Robot Programming | John Woods and Hasti Seifi | [arXiv 2608.14944](https://arxiv.org/abs/2608.14944) |
| 2026 | Skills in Weights, Memory in Code: Hybrid Learning for Memory-Dependent Robot Manipulation | Yunhao Zhao et al. | [arXiv 2608.09410](https://arxiv.org/abs/2608.09410) |
| 2026 | Teach and Grow: An Agent-Centered Architecture for General Robot Learning | Chang Nie et al. | [arXiv 2608.17209](https://arxiv.org/abs/2608.17209) |
| 2026 | Video2Skill: From Streaming Experience to Reusable Embodied Skills | Jianshu Zhang et al. | [arXiv 2609.36691](https://arxiv.org/abs/2609.36691) |
| 2025 | Robotic Ultra-Long-Horizon Manipulation Skills via Human-guided Lifelong Code Generation | Yuan Meng et al. | [arXiv 2509.18597](https://arxiv.org/abs/2509.18597) |
| 2024 | Lifelong Robot Library Learning: Bootstrapping Composable and Generalizable Skills for Embodied Control with Language Models | Georgios Tziafas and Hamidreza Kasaei | [arXiv 2406.18746](https://arxiv.org/abs/2406.18746) |
| 2023 | Voyager: An Open-Ended Embodied Agent with Large Language Models | Guanzhi Wang et al. | [arXiv 2305.16291](https://arxiv.org/abs/2305.16291) |

**Surveys** (1)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | From Sliding Windows to Self-evolving Lifelong Memory: A Dual-perspective Survey of Memory Paradigms for Long-Horizon Robotics VLA Models | Yong Wang et al. | [arXiv 2610.23319](https://arxiv.org/abs/2610.23319) |

**Text and language memory** (16)

| Year | Paper | Authors | Link |
| ---: | --- | --- | --- |
| 2026 | Don't Drop the BATON: Long-Horizon Robot Manipulation via Agentic Subtask Exploration and Transition-aware Memory | Bingxin Xu et al. | [arXiv 2608.16889](https://arxiv.org/abs/2608.16889) |
| 2026 | Evolvable Embodied Agent for Robotic Manipulation via Long Short-Term Reflection and Optimization | Jianzong Wang et al. | [arXiv 2604.13533](https://arxiv.org/abs/2604.13533) |
| 2026 | Explicit Language Memory for Long-Horizon Planning in Vision-Language-Action Models | Houze Xu et al. | [arXiv 2608.04765](https://arxiv.org/abs/2608.04765) |
| 2026 | HAM-VLN: Harnessing Hierarchical Agentic Memory for Zero-Shot Vision-and-Language Navigation | An Liu et al. | [arXiv 2607.29600](https://arxiv.org/abs/2607.29600) |
| 2026 | MEM: Multi-Scale Embodied Memory for Vision Language Action Models | Marcel Torne et al. | [arXiv 2603.03596](https://arxiv.org/abs/2603.03596) |
| 2026 | Notes-to-Self: Scratchpad Augmented VLAs for Memory Dependent Manipulation Tasks | Sanjay Haresh et al. | [arXiv 2602.21013](https://arxiv.org/abs/2602.21013) |
| 2026 | REMM: Revisable Embodied Memory for Manipulation | Revanth Krishna Senthilkumaran et al. | [arXiv 2610.12710](https://arxiv.org/abs/2610.12710) |
| 2026 | Robo-Cortex: A Self-Evolving Embodied Agent via Dual-Grain Cognitive Memory and Autonomous Knowledge Induction | Nga Teng Chan et al. | [arXiv 2605.18729](https://arxiv.org/abs/2605.18729) |
| 2025 | FCRF: Flexible Constructivism Reflection for Long-Horizon Robotic Task Planning with Large Language Models | Yufan Song et al. | [arXiv 2507.14975](https://arxiv.org/abs/2507.14975) |
| 2025 | LLM-Empowered Embodied Agent for Memory-Augmented Task Planning in Household Robotics | Marc Glocker et al. | [arXiv 2504.21716](https://arxiv.org/abs/2504.21716) |
| 2025 | MAP-VLA: Memory-Augmented Prompting for Vision-Language-Action Model in Robotic Manipulation | Runhao Li et al. | [arXiv 2511.09516](https://arxiv.org/abs/2511.09516) |
| 2025 | SE-VLN: A Self-Evolving Vision-Language Navigation Framework Based on Multimodal Large Language Models | Xiangyu Dong et al. | [arXiv 2507.13152](https://arxiv.org/abs/2507.13152) |
| 2023 | Open-Ended Instructable Embodied Agents with Memory-Augmented Large Language Models | Gabriel Sarch et al. | [arXiv 2310.15127](https://arxiv.org/abs/2310.15127) |
| 2023 | REFLECT: Summarizing Robot Experiences for Failure Explanation and Correction | Zeyi Liu et al. | [arXiv 2306.15724](https://arxiv.org/abs/2306.15724) |
| 2023 | TidyBot: Personalized Robot Assistance with Large Language Models | Jimmy Wu et al. | [arXiv 2305.05658](https://arxiv.org/abs/2305.05658) |
| 2022 | Inner Monologue: Embodied Reasoning through Planning with Language Models | Wenlong Huang et al. | [arXiv 2207.05608](https://arxiv.org/abs/2207.05608) |


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
