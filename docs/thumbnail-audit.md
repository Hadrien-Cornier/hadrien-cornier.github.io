# Index thumbnail audit

Audited the actual homepage at main commit `335060f`, including its template mapping and rendered article HTML: **12 articles already had homepage previews; 3 did not** (ASPIRE, predictions about robotics, and SO-101 part 8). The original frontmatter-only audit incorrectly described 14 articles as missing thumbnails. Explicit frontmatter existed only for ASPIRE's Robotics-section card, but the homepage inferred most other images from rendered article content. Video posters are not that fallback's source.

All 12 existing homepage source figures are preserved exactly. The three previously absent homepage images use their own article figure/frame. All outputs are 720 × 424; photos crop, diagrams contain/pad. Every article has a distinct original source and visual; the SO-101 diagrams retain their variety. Article prose is unchanged.

| Article | Main homepage preview | Original source | Fit |
| --- | --- | --- | --- |
| breaking-bellman | Present: restore exact source | `/assets/robotics/breaking-bellman/casino.png` | contain/pad |
| can-you-zero-shot-robotics-with-a-coding-agent | Absent: add article figure/frame | `/assets/robotics/can-you-zero-shot-robotics-with-a-coding-agent/loop-thumb.svg` | contain/pad |
| from-joint-angles-to-a-moving-arm | Present: restore exact source | `/assets/robotics/arm-control/v3/franka_joint_names.png` | contain/pad |
| how-robot-control-is-changing | Present: restore exact source | `/assets/robotics/modern-control/moved-target-preview.svg` | contain/pad |
| robot-brains-robot-bodies | Absent: add article figure/frame | `/robotics/robot-brains-robot-bodies/#rf-arithmetic-title` | contain/pad |
| so101-1-target-and-goal | Present: restore exact source | `/assets/robotics/so101-series/spring-goal.png` | contain/pad |
| so101-2-finer-than-the-sensor | Present: restore exact source | `/assets/robotics/so101-series/tick-rounding.png` | contain/pad |
| so101-3-choosing-the-goal | Present: restore exact source | `/assets/robotics/so101-series/map-errors.png` | contain/pad |
| so101-4-learning-what-physics-misses | Present: restore exact source | `/assets/robotics/so101-series/hindsight-label.png` | contain/pad |
| so101-6-where-the-last-millimeter-goes | Present: restore exact source | `/assets/robotics/so101-controllers/arm-pan-lever.png` | contain/pad |
| so101-7-learning-between-and-during-strokes | Present: restore exact source | `/assets/robotics/so101-after-part6/timing-and-shape.png` | contain/pad |
| so101-8-measuring-the-tool-in-3d | Absent: add article figure/frame | `/assets/robotics/so101-series/arm-reach-overhead-poster.jpg` | crop |
| so101-pen-holder | Present: restore exact source | `/assets/robotics/so101-pen-holder/design5-on-arm.png` | contain/pad |
| what-information-can-a-reinforcement-learner-use | Present: restore exact source | `/assets/robotics/what-information-can-a-reinforcement-learner-use/sentence-words.png` | contain/pad |
| why-i-am-learning-robotics | Present: restore exact source | `/assets/robotics/why-robotics/openvla-architecture.png` | contain/pad |

`content/robotics/thumbnail-sources.json` records original sources for the generated outputs, including the article figure anchor for the browser-rendered reliability figure. The build rejects duplicate original sources even when generated filenames differ. Generated thumbnails in `/assets/robotics/thumbnails/` require provenance in that manifest; direct image thumbnails use their own file path as the original source. Drafts are excluded from duplicate checks because they are not indexed.

Published articles require `thumbnail` (an existing local file under `/assets/`) and nonempty `thumbnail_alt`; errors name the article. Drafts may omit thumbnails, but supplied ones must satisfy the same file/alt validation.
