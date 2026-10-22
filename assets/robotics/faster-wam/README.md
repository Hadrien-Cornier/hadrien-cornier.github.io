# Fast-WAM / Faster-WAM 3D schematic

Open `index.html` through a static HTTP server. All runtime assets are local, including Three.js **0.180.0** and its OrbitControls addon, licensed under MIT (`vendor/LICENSE`). The three vendored JavaScript files are unmodified distributions from `https://cdn.jsdelivr.net/npm/three@0.180.0/` (`build/three.module.js`, `build/three.core.js`, and `examples/jsm/controls/OrbitControls.js`).

`sequence.js` defines schematic progress, not measured time. `diagram.js` renders all 30 video layers, their 30 K/V cache pairs, 30 or one action layers, fusion paths, read pulses and ten denoising markers. The full 32-action chunk is abstracted as one action stream. Fusion particles show contributions, not measured learned coefficients. Original video caches remain visible after fusion.

Primary technical sources:

- https://arxiv.org/html/2608.02365v2#S2 (Equations 1–3, Sections 2.1–2.4)
- https://github.com/huggingface/lerobot/pull/5049 (`LiteKVFusion`, `prepare_action_kv_context`, `infer_action`)
- https://github.com/huggingface/lerobot/issues/5048 (timing scope and motivation)

Important distinctions are also available in the reader's schematic drawer: reads count whole action-layer attention calls, not GPU memory operations; geometry and time are illustrative; architecture transitions do not convert weights; text/state, RoPE and action self-attention are described but not drawn. The underlying attention combines action tokens and video context. The animation isolates only the video-context wiring.

The embed follows the parent page's theme using a same-origin observer. Standalone pages follow the stored or system theme. Animation starts paused; reduced-motion users can scrub and use chapter buttons. Rendering stops when the page or embed is not visible and redraws only when state or camera changes. WebGL failure leaves a text explanation and working sequence controls.

Verify counters with `node --test scripts/faster-wam.test.mjs`. Browser checks should cover 390 px and desktop, both themes, scrubbing, playback, chapter and mode buttons, dragging and zoom, keyboard controls, fallback and an iframe theme change. `thumbnail.png` is a browser capture of this diagram's Faster-WAM scene.
