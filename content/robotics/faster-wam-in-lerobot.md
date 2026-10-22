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

A world action model, or WAM, is a robot policy built on a video generation model. The more familiar kind, the vision-language-action model (VLA) like [π0](https://arxiv.org/abs/2410.24164), starts from a model trained on images and text and learns to map what it sees and the instruction to actions. A WAM starts from a video model instead, and it learns two things from each demonstration: what the camera will see next and what the robot did. The bet is that video pretraining teaches how scenes change, which image-text pretraining doesn't. ([Fast-WAM](https://arxiv.org/abs/2603.16666), Section 2; [Faster-WAM](https://arxiv.org/abs/2608.02365v2), Section 1)

The label is new and it's spreading fast. arXiv papers with "world action model" in the title or abstract went from 12 in the first quarter of 2026 to 81 in the second and 214 in the third. That's a phrase count from the arXiv API on October 22, so it misses papers that use other words and catches a few driving papers. A [June survey](https://arxiv.org/abs/2606.20781) puts it plainly: "This label has spread faster than the understanding behind it."

So what is Fast-WAM fast compared to? Most earlier WAMs imagine before they act. They generate the next video frames and then pick actions that fit ([UniPi](https://arxiv.org/abs/2302.00111), [LingBot-VA](https://arxiv.org/abs/2601.21998)), or they denoise frames and actions together ([UWM](https://arxiv.org/abs/2504.02792), [Motus](https://arxiv.org/abs/2512.13030), and [DreamZero](https://arxiv.org/abs/2602.15922), the paper Fast-WAM takes the name WAM from). That means many passes through a big video network every time the robot replans, and Faster-WAM's authors timed LingBot-VA at about 4.8 seconds per action chunk on LIBERO. [Fast-WAM](https://arxiv.org/abs/2603.16666) (March 2026) keeps the future-video loss in training but skips the imagining when the robot acts. It encodes only the current camera frame and goes straight to actions, like a VLA. Against two versions of itself that do imagine, on the same Wan2.2 backbone and GPU, it takes 190 ms per chunk against 580 and 810 ms. It loses a little for that, 97.6% on LIBERO against 98.5% and 98.0%, while dropping the video loss from training costs far more (93.5%). The authors read this as video prediction helping by shaping what the model learns, not by drawing frames at test time.

It isn't one straight lineage, though. Some earlier WAMs were already quick ([Genie Envisioner](https://arxiv.org/abs/2508.05635)'s GE-Act reports 200 ms per chunk), and another branch used a video model's features without generating frames at all ([VPP](https://arxiv.org/abs/2412.14803), [UVA](https://arxiv.org/abs/2503.00200)). Fast-WAM also isn't fast next to a VLA. On Faster-WAM's 24 GiB test GPU, with each model on its own software stack, π0.5 takes 68 ms per LIBERO chunk and Fast-WAM takes 196 ms. What's clear is that Fast-WAM is the direct base of Faster-WAM.

[Faster-WAM](https://arxiv.org/abs/2608.02365v2) (August 2026) starts there and asks the next question: does the action part need to be deep? In Fast-WAM, the 30-layer Wan2.2 video model runs once per action chunk and caches every layer's keys and values. Then a 30-layer action expert denoises a 32 x 7 action chunk over 10 steps, each layer reading its matching video layer's cache. That's 300 cache reads per chunk. Faster-WAM keeps one action layer. Lite KV-Fusion learns, per attention head, a softmax-weighted mix of all 30 cached layers (720 weights), builds the fused cache once, and the single layer reads it at each step. So 300 reads become 10. The paper reports 98.3% on LIBERO against 97.6%, 90.5% on RoboTwin 2.0 against 91.8%, and 52 ms per chunk against 196 ms in its LIBERO setup, which also puts it under π0.5's 68 ms there. Fast-WAM doesn't fit on that GPU as one pipeline, so the authors timed it part by part.

My take: the action expert was the expensive part, and Faster-WAM shows it can be one layer. The next speedup has to come from the encoders and the video prefill, because that's where the time goes now.

Watch out for [arXiv 2608.04404](https://arxiv.org/abs/2608.04404), a different paper that's also called Faster-WAM. It keeps future conditioning at inference, which is the opposite choice from the one here.

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe src="/assets/robotics/faster-wam-in-lerobot/explainer.html" title="Interactive explainer: from 300 cache reads to 10, Fast-WAM versus Faster-WAM" loading="lazy" style="display:block;width:100%;height:1400px;border:0;"></iframe>
<figcaption>Explainer. The race and the token picture play by themselves, and every other figure is static. <a href="/assets/robotics/faster-wam-in-lerobot/explainer.html">Open it on its own page.</a></figcaption>
</figure>

## Follow one observation

“Pick up the black bowl between the plate and the ramekin and place it on the plate.” Start with that [LIBERO demonstration](https://huggingface.co/datasets/yuanty/LIBERO-fastwam/tree/ee018b997c430bb12b5bf3c892d744798c5a2f91). The input is two camera views, the instruction and the robot state. The label is 32 recorded actions, each with seven control values. The 30 video layers are successive transformations of image tokens, not 30 frames; their depth comes from the pretrained Wan backbone.

The two experts have different jobs. The video model starts from video pretraining; the action expert maps its features to robot controls. During joint training it learns to denoise future video latents, while the action expert learns to denoise demonstrated actions. Both use a velocity-prediction loss, and action loss also trains the video backbone through attention. At inference, only the observed-frame cache is needed. The example below follows those connections through an actual LeRobot run. ([Paper, training details](https://arxiv.org/html/2608.02365v2#A3))

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe id="wam-worked-example" src="/assets/robotics/faster-wam-in-lerobot/example.html" title="Worked LIBERO example: input, layers, cached attention, training loss and inference" loading="lazy" style="display:block;width:100%;height:1200px;border:1px solid var(--line);border-radius:12px;"></iframe>
<figcaption>Images and labels: LIBERO simulation data, CC BY 4.0. Attention, losses and inference: a dry run with random weights and reduced widths, including both encoders. These outputs explain the mechanics; they don't demonstrate a trained policy. This is separate from the A100 timing setup below. <a href="/assets/robotics/faster-wam-in-lerobot/example.html">Open the example on its own page.</a></figcaption>
</figure>

<script>
(() => {
  const frame = document.getElementById('wam-worked-example');
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.kind !== 'wam-embed-height') return;
    const height = Number(event.data.height);
    if (Number.isFinite(height) && height > 200 && height < 4000) frame.style.height = `${Math.ceil(height) + 4}px`;
  });
})();
</script>

## How I added it to LeRobot

I opened [issue #5048](https://github.com/huggingface/lerobot/issues/5048) and [PR #5049](https://github.com/huggingface/lerobot/pull/5049), which is ready for review and not merged. It adds four opt-in flags to `FastWAMConfig`:

```python
action_expert_layers=1, lite_kv_fusion=True, retracted_1d_rope=True, world_model_only_conditioning=True
```

All default to off, so Fast-WAM's behavior and checkpoint layout don't change. The last two are side changes:

- **Retracted 1D RoPE** removes the video model's position rotation from the fused keys, so action queries and video keys compare positions on one time axis. Section 04 of the explainer shows why that matters.
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
- **The explainer simplifies.** The action curves are illustrative, and the before/after figures are schematics, not learned weights. Layer, token and read counts and the noise schedule match the code.
- **An ablation I haven't run.** In the paper's Figure 4, all 720 fusion weights sit between 0.030 and 0.037 (read off the figure by eye), close to a uniform 1/30 = 0.033. A fixed plain average would be worth testing.

## License of the authors' code

The authors' repository, [TeamFasterwam/FasterWAM](https://github.com/TeamFasterwam/FasterWAM), licenses its original contributions under the [PolyForm Noncommercial License 1.0.0](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE), so you can't use that code in a product. Inherited Fast-WAM parts keep their original licenses. My implementation doesn't copy it, and if merged it goes under LeRobot's Apache 2.0 license.
