---
title: 'Faster-WAM in LeRobot: from 300 cache reads to 10'
description: "Faster-WAM cuts a world action model's action expert to one layer. I added it to LeRobot behind opt-in flags and timed it on an A100 with random weights."
date: '2026-10-21'
updated: '2026-10-22'
layout: essay
section: 'recent-papers'
tags: ['world-action-models', 'lerobot', 'kv-cache', 'flow-matching']
thumbnail: '/assets/robotics/faster-wam-in-lerobot/thumbnail.png'
thumbnail_alt: 'The race widget: Fast-WAM is at denoising step 5 of 10 with 131 of 300 cache reads, while Faster-WAM is done at 169.5 ms after 10 reads of one fused cache.'
---

A world action model, or WAM, is usually a robot policy built on a video model. [Fast-WAM](https://arxiv.org/abs/2603.16666) (March 2026) is fast compared to the WAMs that generate future frames before they act. It learns to predict video in training, but when the robot acts it runs the 30-layer Wan2.2 video model once on the current frame and caches every layer's keys and values. Then a 30-layer action expert denoises the next chunk of 32 actions in 10 steps, and at every step action layer $j$ reads only video layer $j$'s cache. [Faster-WAM](https://arxiv.org/abs/2608.02365v2) (August 2026) asks if that expert needs to be deep. Its answer is no: one action layer that reads a mix of all 30 caches stays competitive.

$$\begin{aligned}\text{Fast-WAM:}\quad & 30 \times 10 = 300 \text{ cache reads}\\ \text{Faster-WAM:}\quad & 1 \times 10 = 10 \text{ cache reads}\end{aligned}$$

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe src="/assets/robotics/faster-wam-in-lerobot/explainer.html" title="Animated race: one action chunk through Fast-WAM and Faster-WAM on one clock" loading="lazy" style="display:block;width:100%;height:1000px;border:0;"></iframe>
<figcaption>The race starts when you scroll to it, or when you press Play. <a href="/assets/robotics/faster-wam-in-lerobot/explainer.html">Open it on its own page.</a></figcaption>
</figure>

## Three changes

The paper's ablation (Figure 3) cuts Fast-WAM to one action layer that reads only the last video layer, then adds three changes one at a time. LIBERO is a simulated tabletop benchmark, and LIBERO-Plus perturbs the same scenes.

| | LIBERO | LIBERO-Plus |
| --- | ---: | ---: |
| Fast-WAM, 30 action layers | 97.6% | 51.5% |
| One action layer, last video layer only | 97.7% | 60.3% |
| + Lite KV-Fusion | 98.0% | 68.7% |
| + world-model-only conditioning | 97.8% | 77.6% |
| + retracted 1D RoPE, which is Faster-WAM | 98.3% | 78.3% |

The paper copies Fast-WAM's rates from earlier papers, and only the last row is a three-run mean. On RoboTwin 2.0 it reports 91.8% for Fast-WAM and 90.5% for Faster-WAM.

### Lite KV-Fusion

Faster-WAM mixes all 30 caches into one, once per chunk, with a learned weight per layer and head:

$$\beta_{h\ell}=\frac{e^{\alpha_{h\ell}}}{\sum_{\ell'=1}^{30} e^{\alpha_{h\ell'}}}$$

$$\widehat K_h=\sum_{\ell=1}^{30}\beta_{h\ell}\,K_{h\ell}, \qquad \widehat V_h=\sum_{\ell=1}^{30}\beta_{h\ell}\,V_{h\ell}$$

Here $\ell$ is the video layer, $h$ is one of 24 heads, the $\alpha_{h\ell}$ are 720 learned numbers, and $K_{h\ell}$ and $V_{h\ell}$ are the cached keys and values. The $\alpha$ start at zero, so every $\beta$ starts at $1/30$, and in the paper's Figure 4 (LIBERO) they stay within about 10% of it, read by eye. The authors still call the mix non-uniform, with different heads leaning on different depths.

### World-model-only conditioning

Text and robot state go into the video model only, whose layers already attend to them. The action layer drops its own cross-attention to them and gets them through the fused cache.

### Retracted 1D RoPE

Rotary position encoding (RoPE) tells attention where tokens are. Each head rotates 64 pairs of query and key numbers by angles that grow with position, and the score sees the angle difference. Video keys rotate by frame time, row and column (22, 21 and 21 pairs), while action queries rotate by action index, so in 42 pairs the score subtracts an action index from a row or a column, which has no geometric meaning. Faster-WAM undoes the video rotation on the fused keys, $\bar k(p)=R^{v}(p)^{\top}\,\widehat k(p)$, and the angle in pair $r$ goes from

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

You can start from a Fast-WAM checkpoint but have to fine-tune it, since the one-layer expert and the fusion weights train jointly with the video model. A maintainer asked for changes on October 22, I pushed changes the same day, and the PR is still open. AI agents generated the code, tests and draft text, independent agents reviewed it, and the PR says so. No code comes from the [authors' repository](https://github.com/TeamFasterwam/FasterWAM), whose original code is under a [noncommercial license](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE).

## Speed

| ms per chunk | Fast-WAM | Faster-WAM |
| --- | ---: | ---: |
| Paper, LIBERO setup, 24 GiB GPU | 196.0 | 52.0 |
| Mine, A100, float32 | 802.2 | 319.5 |
| Mine, A100, bfloat16 | 938.0 | 175.6 |

My runs use random video and action weights with the real image encoder (VAE) and text encoder, so they measure speed only: about 2.5x in float32 and 5.3x in bfloat16, end to end.

bfloat16 gains more for two measured reasons. The encoders and the video prefill, the one video pass that fills the cache, run about twice as fast as in float32, while Fast-WAM's eager denoiser gets slower, from 493 to 797 ms, with 29,020 GPU kernel launches per chunk against Faster-WAM's 770. So the 5.3x is mostly an eager-execution ratio on this host, not a ratio of arithmetic. My Fast-WAM loop is also about 5x slower than the paper's (797 against about 150 ms, both eager bfloat16), which is most of why my 5.3x is bigger than the paper's 3.8x.

My take: the action expert was the expensive part, and it doesn't need to be deep. In bfloat16 the denoising loop fell from 797.3 to 23.7 ms, so the text encoder (about 42 ms) and the video prefill (about 88 ms) now each take longer than the whole loop. The next speedup has to come from there, or from compiling the pipeline.

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
- I haven't timed both models compiled, or the PR's latest commit.
- I haven't tried a fixed $1/30$ average in place of the learned weights.
- [arXiv 2608.04404](https://arxiv.org/abs/2608.04404) is a different paper with the same Faster-WAM name. A separate post compares WAMs with vision-language-action models.
