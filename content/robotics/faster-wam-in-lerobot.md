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

A world action model, or WAM, is usually a robot policy built on a video generation model. The more familiar vision-language-action model (VLA), like [π0](https://arxiv.org/abs/2410.24164), starts from a model trained on images and text and learns to map what it sees and the instruction to actions. A WAM starts from a video model instead, and in training it learns two things from each demonstration: what the camera will see next and what the robot did. The bet is that video pretraining teaches how scenes change ([Fast-WAM](https://arxiv.org/abs/2603.16666), Section 2; [Faster-WAM](https://arxiv.org/abs/2608.02365v2), Section 1). The label is catching on fast. arXiv papers using it went from 12 in the first quarter of 2026 to 214 in the third (a phrase count on October 22), and a [June survey](https://arxiv.org/abs/2606.20781) warns that it "has spread faster than the understanding behind it."

So what is Fast-WAM fast compared to? Most earlier WAMs imagine before they act. They generate future frames, alone or together with the actions, so every replan takes several passes through a big video network ([UniPi](https://arxiv.org/abs/2302.00111), [UWM](https://arxiv.org/abs/2504.02792), [LingBot-VA](https://arxiv.org/abs/2601.21998), [DreamZero](https://arxiv.org/abs/2602.15922)). [Fast-WAM](https://arxiv.org/abs/2603.16666) (March 2026) keeps the future-video loss in training but skips the imagining when the robot acts. In the Fast-WAM paper's real-world towel-folding test, that took 190 ms per action chunk, against 580 and 810 ms for two versions of itself that imagine and 180 ms for the VLA π0.5. On LIBERO, a simulated tabletop benchmark, skipping the imagining lost less than a point of success rate, while a version trained without the video loss fell from 97.6% to 93.5%. The authors read this as video prediction helping through training, not through frames drawn at test time. It isn't one straight line of papers, though. [VPP](https://arxiv.org/abs/2412.14803) and [UVA](https://arxiv.org/abs/2503.00200) already used video features without drawing frames, and [GE-Act](https://arxiv.org/abs/2508.05635) and an optimized DreamZero reported 200 and 150 ms per chunk on their own hardware.

[Faster-WAM](https://arxiv.org/abs/2608.02365v2) (August 2026) builds directly on Fast-WAM and asks the next question: does the action part need to be deep? In Fast-WAM, the 30-layer Wan2.2 video model runs once per action chunk, the robot's next 32 moves, and caches every layer's keys and values. Then a 30-layer action expert denoises the chunk, turning random numbers into actions over 10 steps, and at each step every action layer reads its matching video layer's cache. That's 300 cache reads per chunk, one per action-layer pass. Faster-WAM keeps one action layer, which reads a learned mix of all 30 caches, so 300 reads become 10. The paper reports 98.3% on LIBERO against 97.6%, 90.5% on RoboTwin 2.0 against 91.8%, 78.3% against 51.5% on the perturbed LIBERO-Plus, and 52 ms per chunk against 196 ms in its own LIBERO timing. A different paper, [arXiv 2608.04404](https://arxiv.org/abs/2608.04404), is also called Faster-WAM. It makes the opposite choice and keeps future representations at inference.

My take: the action expert was the expensive part, and Faster-WAM shows it can be one layer. The next speedup has to come from the encoders and the video prefill, the single pass of the video model that fills the cache, because that's where the time goes now. Compiling the whole pipeline is the other open lever, and I haven't timed that yet.

<figure class="wide-explainer" style="width:max(100%, min(1120px, 100vw - 48px)); margin:32px 0 36px calc((100% - max(100%, min(1120px, 100vw - 48px))) / 2);">
<iframe src="/assets/robotics/faster-wam-in-lerobot/explainer.html" title="Interactive explainer: from 300 cache reads to 10, Fast-WAM versus Faster-WAM" loading="lazy" style="display:block;width:100%;height:1400px;border:0;"></iframe>
<figcaption>Explainer. The race and the token picture start by themselves, the latency chart has source buttons, and the other figures are static. <a href="/assets/robotics/faster-wam-in-lerobot/explainer.html">Open it on its own page</a> for the quality table, sources and credits.</figcaption>
</figure>

## Training and inference on one example

“Pick up the black bowl between the plate and the ramekin and place it on the plate.” Start with that [LIBERO demonstration](https://huggingface.co/datasets/yuanty/LIBERO-fastwam/tree/ee018b997c430bb12b5bf3c892d744798c5a2f91). The input is two camera views, the instruction and the robot state. The label is 32 recorded actions, each with seven control values. The 30 video layers are successive transformations of image tokens, not 30 frames, and their depth comes from the pretrained Wan2.2 video model.

In training, the two parts learn together. The video model learns to denoise future video latents, the compressed frames its autoencoder makes, and the action expert learns to denoise the demonstrated actions. Both predict a velocity, the direction from noise to the clean target, and the action loss also trains the video model through attention. At inference, nothing in the future gets generated. The video model makes one pass over the current observation, the video prefill, to fill the cache, and the action expert refines a random chunk over 10 steps that read it. The example below follows those steps through an actual LeRobot run. ([Paper, training details](https://arxiv.org/html/2608.02365v2#A3))

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

| Per chunk | float32 | bfloat16 |
| --- | ---: | ---: |
| Fast-WAM (ms) | 802.2 | 938.0 |
| Faster-WAM (ms) | 319.5 | 175.6 |
| Speedup | 2.51x | 5.34x |

Setup: A100-SXM4-80GB on Hugging Face Jobs, PyTorch 2.11.0, CUDA 13.0, batch 1, image 224 x 448, text length 128, 10 denoising steps, eager mode with TF32 and compilation off. Each precision has 100 balanced, shuffled pairs. The 95% intervals on the speedup, from 10,000 paired bootstrap resamples, are 2.50 to 2.52x for float32 and 5.33 to 5.36x for bfloat16. The timer covers tokenization, encoders, transfers and returning the action to the CPU.

A separate 20-chunk bfloat16 run timed each phase. The action denoising loop went from 797.3 ms to 23.7 ms, about 34x. The VAE image encoder (12.9 to 12.6 ms), text encoder (43.0 to 41.9 ms) and video prefill (89.7 to 87.6 ms) stayed put. The text encoder and the video prefill now each take longer than the whole denoising loop.

Why does bfloat16 gain more? Kernel launches. In eager mode Fast-WAM's bf16 denoiser launches 29,020 GPU kernels per chunk, against 770 for Faster-WAM. In a separate session, replaying that same Fast-WAM denoiser through a CUDA graph, with bit-identical outputs, cut Fast-WAM from 868.2 to 283.5 ms. So the 5.34x is mostly a dispatch ratio. Matched compiled or CUDA-graph timings of both models weren't measured.

## Limits

- **Speed, not quality.** No trained Faster-WAM policy, no LIBERO evaluation, no robot run.
- **Ratios moved between sessions.** float32 went 2.66x to 2.51x and bfloat16 5.10x to 5.34x. Fast-WAM's bfloat16 mean ranged from 802.2 ms in a later repeat to 938.0 ms in the table above. The intervals only cover one session.
- **Eager PyTorch on one host.** Compiled speedups are untested, and host speed affects eager timings.
- **Not comparable to the paper.** Its 52 ms uses a different GPU and excludes tokenization and transfers.
- **The explainer simplifies.** The before/after figures are schematics, not learned weights. The race's action curves are illustrative, and its fusion lines are shaded by the paper's Figure 4 head average, read by eye. Layer, token and read counts and the noise schedule match the code.
- **An ablation I haven't run.** The learned fusion weights stay within about 10% of a uniform 1/30 (explainer section 03), so a fixed plain average would be worth testing.

## License of the authors' code

The authors' repository, [TeamFasterwam/FasterWAM](https://github.com/TeamFasterwam/FasterWAM), licenses its original contributions under the [PolyForm Noncommercial License 1.0.0](https://github.com/TeamFasterwam/FasterWAM/blob/main/LICENSE), so you can't use that code in a product. Inherited Fast-WAM parts keep their original licenses. My implementation doesn't copy it, and if merged it goes under LeRobot's Apache 2.0 license.
