---
title: 'Faster-WAM: pull the action loop apart'
description: 'An interactive 3D view of the connections Faster-WAM removes, the caches it fuses, and my LeRobot implementation. With random-weight A100 timings and their limits.'
date: '2026-10-21'
layout: essay
tags: ['world-action-models', 'inference', 'lerobot']
section: 'recent-papers'
thumbnail: /assets/robotics/faster-wam/thumbnail.png
thumbnail_alt: '3D schematic of 30 video layers and their key/value caches feeding a single Faster-WAM action layer through Lite KV-Fusion.'
---

A robot has a camera image, an instruction and its joint state. Before it moves, its policy has to turn those into a chunk of actions. How much of that work needs to happen again at every denoising step?

Denoising starts with a noisy action chunk and refines it over several steps. In LeRobot's default Fast-WAM, the video model runs once. But each of the 30 action layers reads its matching video-layer cache at each of 10 steps. That's **300 cache reads per action chunk**. Faster-WAM learns a weighted mix of all 30 caches once, then one action layer reads that mix at each step. **Ten reads.**

I implemented this variant in LeRobot. The useful part to see is the wiring: which connections disappear, and how the remaining layer still gets information from the whole video stack.

<figure style="margin:28px 0">
<iframe src="/assets/robotics/faster-wam/" title="Interactive 3D: Fast-WAM connections removed and fused into Faster-WAM" style="display:block;width:100%;height:980px;border:1px solid var(--line);border-radius:10px" loading="lazy"></iframe>
<figcaption>Press Play to follow the change. Drag to rotate; use the slider or chapter buttons to inspect it. <a href="/assets/robotics/faster-wam/" target="_blank" rel="noopener">Open the diagram full screen ↗</a>. Schematic: a read counts one layer attending to cached video tokens, not a memory transaction. Animation speed does not represent latency.</figcaption>
</figure>

## What gets smaller

A world action model builds on a video model's representations to predict robot actions. Here, each video layer leaves behind keys and values, the numerical information that attention reads. Fast-WAM already reuses these caches instead of generating future video at inference. Faster-WAM makes the repeated action computation much smaller.

The [Faster-WAM paper](https://arxiv.org/html/2608.02365v2#S2) calls its bridge **Lite KV-Fusion**. Each attention head learns softmax weights over video layers. The same weights mix keys and values. The single action layer can therefore read information from every video layer, without a deep stack of its own.

This is more than deleting layers. In my [LeRobot change](https://github.com/huggingface/lerobot/pull/5049), the full variant also aligns the fused video keys with the action queries using retracted 1D rotary position encoding. Text and joint state condition the video backbone; the action expert receives them through the mixed cache. The [issue](https://github.com/huggingface/lerobot/issues/5048) gives the motivation and benchmark setup.

<details>
<summary>The opt-in configuration</summary>

```python
FastWAMConfig(
    action_expert_layers=1,
    lite_kv_fusion=True,
    retracted_1d_rope=True,
    world_model_only_conditioning=True,
)
```

The default behavior stays unchanged. The video backbone, fusion and smaller action expert train jointly. Turning on these flags does not convert an existing trained checkpoint.

</details>

## Measured speed, with random weights

These are **dry-run GPU timings**, not robot results. Video and action weights are random; the pretrained VAE and text encoders run afresh for every chunk. Both variants use eager execution on the same NVIDIA A100-SXM4-80GB.

| Scope | Precision | Fast-WAM, ms/chunk | Faster-WAM, ms/chunk | Speedup (95% interval) |
| --- | --- | ---: | ---: | --- |
| Full policy | float32 | 802.2 | 319.5 | 2.510× (2.503 to 2.520×) |
| Full policy | bfloat16 | 938.0 | 175.6 | 5.342× (5.326 to 5.358×) |
| Denoising only, separate diagnostic | bfloat16 | 797.3 | 23.7 | Not estimated |

The denoising loop is where the time falls. The image encoder, text encoder and video prefill still have to run.

<details>
<summary>Timing scope and settings</summary>

HF Jobs `a100-large`; PyTorch 2.11.0, CUDA 13.0; batch 1, image 224 × 448, action chunk 32 × 7, text length 128, state size 8, seed 1234, 10 denoising steps, 5 warmups. TF32 and compilation disabled. Host: 12 vCPUs, 8 OpenMP threads; CPU model unrecorded.

Per precision: 100 balanced, shuffled pairs and 10,000 paired bootstrap resamples. The CUDA-synchronized host timer includes tokenization, encoders, transfers and CPU action return. Processor pipelines, loading and robot execution are outside timing.

Denoiser times come from a separate 20-chunk phase diagnostic. CUDA events can include host gaps. Do not add these times to the primary full-policy measurements. Details are recorded in the [LeRobot contribution](https://github.com/huggingface/lerobot/pull/5049).

</details>

## Limits

- I haven't tested trained-policy quality, LIBERO evaluation or robot success. These timings establish speed for this setup.
- Default bfloat16 is slower than float32 here. Conversion and kernel-launch overhead are consistent with the traces. In a separate same-math diagnostic, CUDA-graph replay cut default bfloat16 from 868.2 to 283.5 ms. A matched graph comparison remains untested, so **5.342× is an eager-execution result**.
- Across repeat sessions, default bfloat16 ranged from 802.2 to 938.0 ms. The intervals cover within-session sampling, not host drift.
- The authors' [code](https://github.com/TeamFasterwam/FasterWAM) licenses its original contributions under [PolyForm Noncommercial 1.0.0](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE). My implementation follows the paper equations and existing LeRobot code; the authors' code was not copied, translated or adapted.
