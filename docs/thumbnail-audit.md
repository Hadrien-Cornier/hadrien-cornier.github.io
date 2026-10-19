# Index thumbnail audit

All 15 published articles audited. Initially 14 lacked explicit thumbnail metadata; ASPIRE already had it. The homepage previously inferred some images from article content, leaving articles containing only videos or HTML figures without a preview. All now use 720 × 424 outputs from their own figures or video poster frames. No article prose changed.

| Article | Initial thumbnail | Source | Fit |
| --- | --- | --- | --- |
| breaking-bellman | missing | `assets/robotics/breaking-bellman/casino.png` | contain/pad |
| can-you-zero-shot-robotics-with-a-coding-agent | present | `assets/robotics/can-you-zero-shot-robotics-with-a-coding-agent/loop-thumb.svg` | contain/pad |
| from-joint-angles-to-a-moving-arm | missing | `assets/robotics/arm-control/v3/franka_joint_names.png` | contain/pad |
| how-robot-control-is-changing | missing | `assets/robotics/modern-control/v4/observe-again.png` | contain/pad |
| robot-brains-robot-bodies | missing | `article .rf-figure (browser capture, caption excluded)` | contain/pad |
| so101-1-target-and-goal | missing | `assets/robotics/so101-series/cat-direct.png` | contain/pad |
| so101-2-finer-than-the-sensor | missing | `assets/robotics/so101-series/arm-drawing-overhead-poster.jpg` | crop |
| so101-3-choosing-the-goal | missing | `assets/robotics/so101-series/arm-drawing-overhead-poster.jpg` | crop |
| so101-4-learning-what-physics-misses | missing | `assets/robotics/so101-series/arm-drawing-overhead-poster.jpg` | crop |
| so101-6-where-the-last-millimeter-goes | missing | `assets/robotics/so101-controllers/kitty-overhead-v6c-poster.jpg` | crop |
| so101-7-learning-between-and-during-strokes | missing | `assets/robotics/so101-series/arm-drawing-overhead-poster.jpg` | crop |
| so101-8-measuring-the-tool-in-3d | missing | `assets/robotics/so101-series/arm-reach-overhead-poster.jpg` | crop |
| so101-pen-holder | missing | `assets/robotics/so101-series/arm-drawing-overhead-poster.jpg` | crop |
| what-information-can-a-reinforcement-learner-use | missing | `assets/robotics/what-information-can-a-reinforcement-learner-use/sentence-words.png` | contain/pad |
| why-i-am-learning-robotics | missing | `assets/robotics/why-robotics/openvla-architecture.png` | contain/pad |

Published articles require `thumbnail` (existing local file under `/assets/`) and nonempty `thumbnail_alt`; the build names the article when either is missing. Drafts may omit thumbnails, but supplied ones must satisfy the same file/alt validation.
