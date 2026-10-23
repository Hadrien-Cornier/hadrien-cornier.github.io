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

A world action model, or WAM, is a robot policy built on a video model. [Fast-WAM](https://arxiv.org/abs/2603.16666) (March 2026) is fast compared to the WAMs that generate future frames before they act. It learns to predict video in training, but when the robot acts it runs the 30-layer Wan2.2 video model once on the current frame and caches every layer's keys and values. Then a 30-layer action expert denoises the next 32 actions in 10 steps. [Faster-WAM](https://arxiv.org/abs/2608.02365v2) (August 2026) asks if that expert needs to be deep, and its answer is one layer. WAMs versus vision-language-action models (VLAs) gets its own post, and [arXiv 2608.04404](https://arxiv.org/abs/2608.04404) is a different paper with the same name.

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe src="/assets/robotics/faster-wam-in-lerobot/explainer.html" title="Animated race: one action chunk through Fast-WAM and Faster-WAM on one clock" loading="lazy" style="display:block;width:100%;height:1040px;border:0;"></iframe>
<figcaption>The race starts when you scroll to it. Each Fast-WAM action layer reads one video layer's cache, and Faster-WAM's single layer reads one fused cache. The clock is my LeRobot run on an A100 in bf16 with random weights. <a href="/assets/robotics/faster-wam-in-lerobot/explainer.html">Open the figure on its own page.</a></figcaption>
</figure>

## Where 300 and 10 come from

Every denoising step runs every action layer, and every action-layer pass reads one cache:

$$\begin{aligned}\text{Fast-WAM:}\quad & 30 \times 10 = 300 \text{ reads per chunk}\\ \text{Faster-WAM:}\quad & 1 \times 10 = 10 \text{ reads per chunk}\end{aligned}$$

The paper's ablation (Section 3.3.2) adds three changes, one at a time, to a one-layer expert that reads only the last video layer. LIBERO is a simulated tabletop benchmark, and LIBERO-Plus perturbs the same scenes.

| Step | LIBERO | LIBERO-Plus |
| --- | ---: | ---: |
| One action layer, last video layer only | 97.7% | 60.3% |
| + Lite KV-Fusion | 98.0% | 68.7% |
| + world-model-only conditioning | 97.8% | 77.6% |
| + retracted 1D RoPE, which is Faster-WAM | 98.3% | 78.3% |

### Lite KV-Fusion

Fast-WAM pairs action layer $j$ with video layer $j$. Faster-WAM mixes all 30 caches into one, once per chunk, with a learned weight per layer and head:

$$\beta_{h\ell}=\frac{e^{\alpha_{h\ell}}}{\sum_{\ell'=1}^{30} e^{\alpha_{h\ell'}}}$$

$$\widehat K_h=\sum_{\ell=1}^{30}\beta_{h\ell}\,K_{h\ell}, \qquad \widehat V_h=\sum_{\ell=1}^{30}\beta_{h\ell}\,V_{h\ell}$$

Here $\ell$ is the video layer, $h$ is one of 24 heads, the $\alpha_{h\ell}$ are 720 learned numbers, and $K_{h\ell}$ and $V_{h\ell}$ are the cached keys and values. The $\alpha$ start at zero, which is a plain average, and in the paper's Figure 4 every weight stays within about 10% of $1/30$ (read by eye).

### World-model-only conditioning

Text and robot state go into the video model only. The action layer drops its cross-attention to them and gets them through the fused cache instead.

### Retracted 1D RoPE

Attention knows where tokens are through rotary position encoding (RoPE). Each head splits queries and keys into 64 pairs, rotates each pair by an angle that grows with position, and the score sees the difference of the two angles. Video keys rotate by frame time, row and column (22, 21 and 21 pairs), but action queries rotate by the action's index in the chunk. So in 42 of the 64 pairs the score subtracts an action index from a row or a column, which means nothing. Faster-WAM undoes the video rotation on the fused keys:

$$\bar k(p)=R^{a}(0)\,R^{v}(p)^{\top}\,\widehat k(p)$$

$$\theta_r^{\text{before}}=\omega_r\,p_{b(r)}-\nu_r\,i \qquad \theta_r^{\text{after}}=\nu_r\,(0-i)$$

$R^{v}(p)^{\top}$ undoes the video rotation of the token at $p=(t,y,x)$, and $R^{a}(0)$, the action rotation at the frame's time 0, does nothing. $\theta_r$ is the angle that pair $r$ sees for action $i$, $b(r)$ picks $t$, $y$ or $x$, and $\omega_r$ and $\nu_r$ are the video and action rates. Take action 5 and the patch at row 3, column 4. In the first row pair $\omega=1$ and $\nu\approx0.042$, so the angle is $3-0.21=2.79$ before and $-0.21$ after, which is now the same for every patch. Fusing first and undoing second is exact, because all 30 layers rotate a token by the same angle (the paper's Proposition 2.2), so you undo once instead of 30 times.

## In LeRobot

I opened [issue #5048](https://github.com/huggingface/lerobot/issues/5048) and [PR #5049](https://github.com/huggingface/lerobot/pull/5049), which is ready for review and not merged. It adds four flags to `FastWAMConfig`, all off by default:

```python
action_expert_layers=1, lite_kv_fusion=True, retracted_1d_rope=True, world_model_only_conditioning=True
```

They don't convert a trained Fast-WAM checkpoint, because the one-layer expert and the fusion weights train jointly with the video model. AI agents generated the code, tests and draft text, independent agents reviewed it, and the PR says so. 59 tests pass, 2 CUDA cases skip on CPU, and CI is green. No code comes from the [authors' repository](https://github.com/TeamFasterwam/FasterWAM), which is under a [noncommercial license](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE).

## Speed and quality

| | Fast-WAM | Faster-WAM | Source |
| --- | ---: | ---: | --- |
| LIBERO success | 97.6% | 98.3% | Paper |
| RoboTwin 2.0 success | 91.8% | 90.5% | Paper |
| LIBERO-Plus success | 51.5% | 78.3% | Paper |
| ms per chunk | 196.0 | 52.0 | Paper, 24 GiB GPU |
| ms per chunk, float32 | 802.2 | 319.5 | Mine, A100 |
| ms per chunk, bfloat16 | 938.0 | 175.6 | Mine, A100 |

Faster-WAM's rates are means of three runs, and the paper takes Fast-WAM's LIBERO-Plus rate from two other papers. My runs use random video and action weights with the real VAE and text encoders, so they measure speed only. Setup: A100-SXM4-80GB, PyTorch 2.11.0, CUDA 13.0, batch 1, 10 steps, eager mode, 100 shuffled pairs per precision, timed from tokenization until the actions are back on the CPU. That's 2.51x in float32 and 5.34x in bfloat16, with 95% bootstrap intervals of 2.50 to 2.52x and 5.33 to 5.36x.

bfloat16 gains more because of kernel launches. In eager mode Fast-WAM's denoiser launches 29,020 GPU kernels per chunk against 770, and in a separate session a CUDA graph alone cut Fast-WAM from 868.2 to 283.5 ms. I haven't timed both models compiled.

My take: the action expert was the expensive part, and it can be one layer. In a bfloat16 run that timed each phase, the denoising loop fell from 797.3 to 23.7 ms, and now the text encoder (about 42 ms) and the video prefill (about 88 ms) each take longer than the whole loop. So the next speedup has to come from there, or from compiling the pipeline.

## Limits

- Speed only. No trained Faster-WAM policy, no LIBERO run and no robot.
- The ratios moved between sessions, float32 from 2.66x to 2.51x and bfloat16 from 5.10x to 5.34x, and the intervals cover one session.
- The paper's milliseconds and mine aren't comparable. The paper used a different GPU, added up Fast-WAM's parts timed separately, and left out tokenization and transfers.
- The race's action curves are illustrative, and its fusion shading is read by eye from the paper's Figure 4. The counts, noise schedule and clock come from the code and the measured run.
- I haven't tried a fixed $1/30$ average in place of the learned weights.
