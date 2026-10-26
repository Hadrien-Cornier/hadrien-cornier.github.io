---
title: 'Faster-WAM in LeRobot: from 300 cache reads to 10'
description: "Faster-WAM cuts a world action model's action expert to one layer. I added it to LeRobot behind opt-in flags and timed it on an A100 with random weights."
date: '2026-10-21'
updated: '2026-10-23'
layout: essay
section: 'recent-papers'
tags: ['world-action-models', 'lerobot', 'kv-cache', 'flow-matching']
thumbnail: '/assets/robotics/faster-wam-in-lerobot/thumbnail.png'
thumbnail_alt: 'The race widget: Fast-WAM is at denoising step 5 of 10 with 131 of 300 cache reads, while Faster-WAM is done at 169.5 ms after 10 reads of one fused cache.'
---

A world action model, or WAM, is usually a robot policy built on a video model. Consider the work its action expert does. [Fast-WAM](https://arxiv.org/abs/2603.16666) (March 2026) is already fast compared to WAMs that generate future frames before acting. It learns video prediction in training, but on the robot it runs the 30-layer Wan2.2 video model just once on the current frame, caching the keys and values from every layer. A separate 30-layer action expert then denoises a chunk of 32 actions over 10 steps. At each step, action layer $j$ reads video layer $j$'s cache. Does that expert need all its layers? [Faster-WAM](https://arxiv.org/abs/2608.02365v2) (August 2026) finds that one action layer, reading a mix of all 30 caches, stays competitive.

$$\begin{aligned}\text{Fast-WAM:}\quad & 30 \times 10 = 300 \text{ cache reads}\\ \text{Faster-WAM:}\quad & 1 \times 10 = 10 \text{ cache reads}\end{aligned}$$

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe src="/assets/robotics/faster-wam-in-lerobot/explainer.html" title="Animated race: one action chunk through Fast-WAM and Faster-WAM on one clock" loading="lazy" style="display:block;width:100%;height:1000px;border:0;"></iframe>
<figcaption>The race starts when you scroll to it, or when you press Play. <a href="/assets/robotics/faster-wam-in-lerobot/explainer.html">Open it on its own page.</a></figcaption>
</figure>

## Three changes

To isolate the changes, the paper's ablation (Figure 3) first reduces Fast-WAM to one action layer reading only the last video layer. It then adds three changes, one at a time. LIBERO is a simulated tabletop benchmark; LIBERO-Plus perturbs those same scenes.

| | LIBERO | LIBERO-Plus |
| --- | ---: | ---: |
| Fast-WAM, 30 action layers | 97.6% | 51.5% |
| One action layer, last video layer only | 97.7% | 60.3% |
| + Lite KV-Fusion | 98.0% | 68.7% |
| + world-model-only conditioning | 97.8% | 77.6% |
| + retracted 1D RoPE, which is Faster-WAM | 98.3% | 78.3% |

The paper copies Fast-WAM's rates from earlier papers, and only the last row is a three-run mean. On RoboTwin 2.0 it reports 91.8% for Fast-WAM and 90.5% for Faster-WAM.

### Lite KV-Fusion

The first change is to combine the 30 caches. Once per chunk, Faster-WAM mixes them into one cache using a learned weight for each layer and head:

$$\beta_{h\ell}=\frac{e^{\alpha_{h\ell}}}{\sum_{\ell'=1}^{30} e^{\alpha_{h\ell'}}}$$

$$\widehat K_h=\sum_{\ell=1}^{30}\beta_{h\ell}\,K_{h\ell}, \qquad \widehat V_h=\sum_{\ell=1}^{30}\beta_{h\ell}\,V_{h\ell}$$

Here $\ell$ is the video layer, $h$ is one of 24 heads, the $\alpha_{h\ell}$ are 720 learned numbers, and $K_{h\ell}$ and $V_{h\ell}$ are the cached keys and values. The $\alpha$ start at zero, so every $\beta$ starts at $1/30$, and in the paper's Figure 4 (LIBERO) they stay within about 10% of it, read by eye. The authors still call the mix non-uniform, with different heads leaning on different depths.

That fused cache is ready before denoising starts. At each denoising step, the 32 action tokens, one for each action in the chunk, attend both to the cache and to each other. Each head uses one softmax:

$$O_h=\operatorname{softmax}\!\left(\frac{Q_h\,[\widehat K_h;\,K^{a}_h]^{\top}}{\sqrt{D}}\right)[\widehat V_h;\,V^{a}_h]$$

$Q_h$, $K^{a}_h$ and $V^{a}_h$ are the queries, keys and values the action layer computes from the 32 action tokens, $[\,\cdot\,;\cdot\,]$ stacks the video rows on top of the action rows, and $D=128$ is the size of one head. Since it's a single softmax, each action query splits its attention between the scene and the other actions. Only the action rows change from one step to the next, while $\widehat K_h$ and $\widehat V_h$ stay fixed for the whole chunk. Each time an action layer evaluates this, that's one of the cache reads counted at the top. Fast-WAM evaluates it in all 30 action layers at every step, with layer $j$ reading video layer $j$'s own $K_{hj}$ and $V_{hj}$ instead of the fused pair. The paper also puts a mask inside the softmax that hides future frames in training, but at inference the cache only holds the current frame, so there's nothing to hide.

### World-model-only conditioning

The video model already attends to text and robot state. Faster-WAM therefore sends both into that model only, removing the action layer's separate cross-attention to them. The action layer receives that information through the fused cache.

### Retracted 1D RoPE

Rotary position encoding (RoPE) tells attention where tokens are. Each head rotates 64 pairs of query and key numbers by angles that grow with position, and the score sees the angle difference. Video keys rotate by frame time, row and column (22, 21 and 21 pairs), while action queries rotate by action index, so in 42 pairs the score subtracts an action index from a row or a column, which has no geometric meaning. Faster-WAM undoes the video rotation on the fused keys, $\bar k(p)=R^{v}(p)^{\top}\,\widehat k(p)$, and the attention above uses these keys, $\bar K_h$, in place of $\widehat K_h$. In pair $r$ the angle goes from

$$\theta_r^{\text{before}}=\omega_r\,p_{b(r)}-\nu_r\,i \qquad\text{to}\qquad \theta_r^{\text{after}}=-\nu_r\,i$$

Here $i$ is the action index, $p=(t,y,x)$ is the video token's frame time, row and column, $b(r)$ picks one of the three, and $\omega_r$ and $\nu_r=10000^{-2r/128}$ are the video and action rates. The frame sits at time 0. For action 5 and a patch in row 3, counting from 0, the first row pair ($r=22$, $\omega=1$, $\nu\approx0.042$) goes from $3-0.21=2.79$ to $-0.21$, now the same for every patch. One undo after the fusion is exact, because all 30 layers rotate a token by the same angle (the paper's Proposition 2.2).

## In LeRobot

I opened [issue #5048](https://github.com/huggingface/lerobot/issues/5048) and [PR #5049](https://github.com/huggingface/lerobot/pull/5049), which adds four flags to `FastWAMConfig`, all off by default:

```python
action_expert_layers=1
lite_kv_fusion=True
retracted_1d_rope=True
world_model_only_conditioning=True
```

You can start from a Fast-WAM checkpoint but have to fine-tune it, since the one-layer expert and the fusion weights train jointly with the video model. A maintainer asked for changes on October 22, I pushed them the same day, and the PR was merged on October 23. AI agents generated the code, tests and draft text, independent agents reviewed it, and the PR says so. No code comes from the [authors' repository](https://github.com/TeamFasterwam/FasterWAM), whose original code is under a [noncommercial license](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE).

## Speed

| ms per chunk | Fast-WAM | Faster-WAM |
| --- | ---: | ---: |
| Paper, LIBERO setup, 24 GiB GPU | 196.0 | 52.0 |
| Mine, A100, float32 | 802.2 | 319.5 |
| Mine, A100, bfloat16 | 938.0 | 175.6 |

These are speed measurements only. My runs use random video and action weights, alongside the real image encoder (VAE) and text encoder. End to end, the speedup is about 2.5x in float32 and 5.3x in bfloat16.

bfloat16 gains more for two measured reasons. The encoders and the video prefill, the one video pass that fills the cache, run about twice as fast as in float32, while Fast-WAM's eager denoiser gets slower, from 493 to 797 ms, with 29,020 GPU kernel launches per chunk against Faster-WAM's 770. So the 5.3x is mostly an eager-execution ratio on this host, not a ratio of arithmetic. My Fast-WAM loop is also about 5x slower than the paper's (797 against about 150 ms, both eager bfloat16), which is most of why my 5.3x is bigger than the paper's 3.8x.

My take is that the expensive action expert doesn't need its depth. In bfloat16, reducing the denoising loop from 797.3 to 23.7 ms moves the bottleneck: the text encoder (about 42 ms) and video prefill (about 88 ms) each now take longer than the entire loop. The next speedup has to come from those stages, or from compiling the pipeline.

<details>
<summary>How I timed it</summary>

- A100-SXM4-80GB on Hugging Face Jobs, one host with 12 vCPUs, PyTorch 2.11.0, CUDA 13.0, LeRobot commit `50dffcf`.
- Batch 1, image 224 x 448, 10 denoising steps, eager mode with TF32 and compilation off.
- 100 shuffled pairs per precision, timed from tokenization until the actions are back on the CPU. The 95% bootstrap intervals on the speedup are 2.50 to 2.52x and 5.33 to 5.36x.
- Sessions moved more than that. The speedups went from 2.66x to 2.51x in float32 and from 5.10x to 5.34x in bfloat16, and Fast-WAM's bfloat16 mean ranged from 802.2 to 938.0 ms. The table shows one session.
- The phase times and the race clock come from a separate 20-chunk run with CUDA events. The kernel counts come from a profiler run, which also counted 8,140 dtype conversions per chunk in Fast-WAM's bfloat16 denoiser, against 640 in float32. These records aren't public.
- Evidence for the eager-overhead reading: in another session, replaying Fast-WAM's unchanged bfloat16 denoiser through a CUDA graph, with bit-identical outputs, cut its whole chunk from 868.2 to 283.5 ms. The graph removes dispatch and temporary-allocation costs together.
- The paper's milliseconds aren't comparable to mine. It used a different GPU, added up Fast-WAM's parts timed separately, and left out tokenization and transfers.

</details>

## Limits

- Speed only. No trained Faster-WAM policy, no LIBERO run and no robot.
- I haven't timed both models compiled, or the merged code.
- I haven't tried a fixed $1/30$ average in place of the learned weights.
- [arXiv 2608.04404](https://arxiv.org/abs/2608.04404) is a different paper with the same Faster-WAM name. A separate post compares WAMs with vision-language-action models.
