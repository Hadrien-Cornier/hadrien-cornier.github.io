# Worked LIBERO example

`example.html` follows one actual demonstration alongside the architecture explainer. The pinned source and CC BY 4.0 credit are in `example/ATTRIBUTION.md`. The dataset release is the one used by FastWAM and referenced by Faster-WAM, rather than a different LIBERO conversion. The eight-dimensional state contains an end-effector pose and two gripper positions, not joint angles.

The stored numerical trace uses the **actual LeRobot component code**, random weights, and reduced widths throughout, including the VAE and text encoder. It is deliberately separate from the full-size random-video/action A100 benchmark, which uses pretrained encoders. The displayed losses/predictions establish mechanics only. No trained Faster-WAM checkpoint is demonstrated.

Probe settings: CPU float32, PyTorch 2.11.0, NumPy 2.5.4, Pillow 13.0.0, PyArrow 26.0.0, diffusers 0.37.0, transformers 4.57.1, einops 0.8.2, seed 1234, 2 CPU threads. LeRobot source is the unchanged timing bundle at `50dffcf10117874a08f729d259dc4958889563b9`; hashes of each imported Wan source file are in the numeric record. The production code's follow-up loader fixes do not change this inference arithmetic. The actual Google UMT5 tokenizer encodes the instruction; its transformer has random weights.

The probe retains 30 video layers, 1 action layer, 32 action tokens and 98 observed-frame video tokens. Video/action width is 12, 2 heads × 6 channels, FFN width 24. The text encoder is a one-layer UMT5 with width 24. The actual AutoencoderKLWan has reduced base width 4, 48 latent channels, spatial patch size 2 and 16× spatial / 4× temporal compression. All configs are in `example/results.json`. These are **not** the paper's model widths. Production video hidden width is 3072, action hidden width 1024, with 24 heads × 128 channels.

Reproduce with a LeRobot checkout containing the Faster-WAM implementation and an isolated Python environment with the versions above, plus `sentencepiece`, `safetensors`, `draccus`, and `huggingface_hub<1`. FFmpeg must be available. The script downloads the pinned parquet files and extracts only the first 33 frames from each MP4 using HTTP range requests. It does not train, run a robot, or download full-size model weights:

```sh
python scripts/faster-wam-example.py --lerobot-source /path/to/lerobot --data-dir /tmp/wam-example
```

It loads the real component modules directly without the complete policy registry, supplies an actual (random) Wan VAE and UMT5 model, calls LeRobot's `training_loss` and `infer_action`, and records the real intermediate tensors. No fake encoders are used. The 4×8 attention excerpt shows exact cells from the first four query rows of head 0 at the first inference step. The full 4×130 matrix includes the 98 video columns and 32 action self-attention columns; the excerpt is not renormalized. Its image overlay shows token index positions, not non-overlapping encoder receptive fields or trained saliency.

The production training equation uses independent shifted noise levels, scheduler weights, valid-element MSE, both lambda values equal to 1, and excludes the clean observed video frame. The inference trace contains initial noise plus ten real Euler updates from the LeRobot scheduler. Each displayed number is read from the saved record. The page follows article theme changes and posts its content height to the same-origin article to avoid nested scrolling.
