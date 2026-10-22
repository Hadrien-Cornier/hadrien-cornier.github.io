---
title: 'Faster-WAM in LeRobot: from 300 cache reads to 10'
description: "Faster-WAM cuts a world action model's action expert to one layer. I added it to LeRobot behind opt-in flags and timed it on an A100 with random weights."
date: '2026-10-21'
layout: essay
section: 'recent-papers'
tags: ['world-action-models', 'lerobot', 'kv-cache', 'flow-matching']
thumbnail: '/assets/robotics/faster-wam-in-lerobot/thumbnail.png'
thumbnail_alt: 'The race widget: Fast-WAM is at denoising step 5 of 10 with 131 of 300 cache reads, while Faster-WAM is done at 169.5 ms after 10 reads of one fused cache.'
---

A world action model is a video model with an action model attached. In [Fast-WAM](https://arxiv.org/abs/2603.16666), the 30-layer Wan2.2 video model runs once per action chunk and caches every layer's keys and values. Then a 30-layer action expert denoises a 32 x 7 action chunk over 10 steps, each layer reading its matching video layer's cache. That's 300 cache reads per chunk.

[Faster-WAM](https://arxiv.org/abs/2608.02365v2) keeps one action layer. Lite KV-Fusion learns, per attention head, a softmax-weighted mix of all 30 cached layers (720 weights), builds the fused cache once, and the single layer reads it at each step. So 300 reads become 10. The paper reports 98.3% on LIBERO against 97.6%, 90.5% on RoboTwin 2.0 against 91.8%, and 52 ms per chunk against 196 ms in its LIBERO setup on a 24 GiB GPU. Fast-WAM doesn't fit on that GPU as one pipeline, so the authors timed it part by part.

My take: the action expert was the expensive part, and Faster-WAM shows it can be one layer. The next speedup has to come from the encoders and the video prefill, because that's where the time goes now.

Watch out for [arXiv 2608.04404](https://arxiv.org/abs/2608.04404): a different method with the same name.

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe src="/assets/robotics/faster-wam-in-lerobot/explainer.html" title="Interactive explainer: from 300 cache reads to 10, Fast-WAM versus Faster-WAM" loading="lazy" style="display:block;width:100%;height:1400px;border:0;"></iframe>
<figcaption>Interactive explainer. Use the play and step buttons in each widget. <a href="/assets/robotics/faster-wam-in-lerobot/explainer.html">Open it on its own page.</a></figcaption>
</figure>

## How I added it to LeRobot

I opened [issue #5048](https://github.com/huggingface/lerobot/issues/5048) and [PR #5049](https://github.com/huggingface/lerobot/pull/5049), which is ready for review and not merged. It adds four opt-in flags to `FastWAMConfig`:

```python
action_expert_layers=1, lite_kv_fusion=True, retracted_1d_rope=True, world_model_only_conditioning=True
```

All default to off, so Fast-WAM's behavior and checkpoint layout don't change. The last two are side changes:

- **Retracted 1D RoPE** moves the position encoding of the fused keys onto the action queries' time axis.
- **World-model-only conditioning** sends text and robot state into the video model only, so the action expert drops its text cross-attention.

You can't flip these flags on a trained Fast-WAM checkpoint. The one-layer expert and the fusion weights have to be trained jointly.

It's written from the paper's equations and existing LeRobot code, with no code copied, translated or adapted from the authors' repository. AI agents generated the code, tests and draft text, and independent agents reviewed it and checked the results. The PR discloses this. 59 tests pass, 2 CUDA cases skip on CPU, and CI is green.

## Speed on an A100 with random weights

The video and action weights are random, so this measures speed only. The real pretrained VAE and text encoders still run on every chunk.

| Precision | Fast-WAM (ms/chunk) | Faster-WAM (ms/chunk) | Speedup (95% interval) |
| --- | ---: | ---: | --- |
| float32 | 802.2 | 319.5 | 2.51x (2.50 to 2.52) |
| bfloat16 | 938.0 | 175.6 | 5.34x (5.33 to 5.36) |

Setup: A100-SXM4-80GB on Hugging Face Jobs, PyTorch 2.11.0, CUDA 13.0, batch 1, image 224 x 448, text length 128, 10 denoising steps, eager mode with TF32 and compilation off. Each precision has 100 balanced, shuffled pairs, and the intervals come from 10,000 paired bootstrap resamples. The timer covers tokenization, encoders, transfers and returning the action to the CPU.

A separate 20-chunk bfloat16 run timed each phase. The action denoising loop went from 797.3 ms to 23.7 ms, about 34x. The VAE (12.9 to 12.6 ms), text encoder (43.0 to 41.9 ms) and video prefill (89.7 to 87.6 ms) stayed put. The text encoder and the video prefill now each take longer than the whole denoising loop.

Why does bfloat16 gain more? Kernel launches. In eager mode Fast-WAM's bf16 denoiser launches 29,020 GPU kernels per chunk, against 770 for Faster-WAM. In a separate session, replaying that same Fast-WAM denoiser through a CUDA graph, with bit-identical outputs, cut Fast-WAM from 868.2 to 283.5 ms. So the 5.34x is mostly a dispatch ratio. Matched compiled or CUDA-graph timings of both models weren't measured.

## Limits

- **Speed, not quality.** No trained Faster-WAM policy, no LIBERO evaluation, no robot run.
- **Ratios moved between sessions.** float32 went 2.66x to 2.51x, bfloat16 5.10x to 5.34x, and the default bf16 mean ranged from 802.2 to 938.0 ms across repeats. The intervals only cover one session.
- **Eager PyTorch on one host.** Compiled speedups are untested, and host speed affects eager timings.
- **Not comparable to the paper.** Its 52 ms uses a different GPU and excludes tokenization and transfers.
- **The explainer simplifies.** Attention numbers, action curves and cache tiles are illustrative. Layer, token and read counts and the noise schedule match the code.
- **An ablation I haven't run.** In the paper's Figure 4, all 720 fusion weights sit between 0.030 and 0.037 (read off the figure by eye), close to a uniform 1/30 = 0.033. A fixed plain average would be worth testing.

## License of the authors' code

The authors' repository, [TeamFasterwam/FasterWAM](https://github.com/TeamFasterwam/FasterWAM), licenses its original contributions under the [PolyForm Noncommercial License 1.0.0](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE), so you can't use that code in a product. Inherited Fast-WAM parts keep their original licenses. My implementation doesn't copy it, and if merged it goes under LeRobot's Apache 2.0 license.
