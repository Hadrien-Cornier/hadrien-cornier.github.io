# LIBERO worked-example data

Images and recorded actions/state are from the first Spatial episode of **LIBERO MuJoCo 3.3.2 for FastWAM**, released by Tianyuan Yuan and the FastWAM contributors, based on the LIBERO benchmark by Bo Liu, Yifeng Zhu, Chongkai Gao, Yihao Feng, Qiang Liu, Yuke Zhu and Peter Stone.

- Source: https://huggingface.co/datasets/yuanty/LIBERO-fastwam
- Pinned revision: `ee018b997c430bb12b5bf3c892d744798c5a2f91`
- Suite: `lerobot_v30/libero_spatial_no_noops_lerobot`, episode 0, frames 0 through 32
- License declared by this release: **Creative Commons Attribution 4.0 International**, https://creativecommons.org/licenses/by/4.0/legalcode
- Dataset card at revision: https://huggingface.co/datasets/yuanty/LIBERO-fastwam/blob/ee018b997c430bb12b5bf3c892d744798c5a2f91/README.md
- Original benchmark: https://libero-project.github.io/ and https://arxiv.org/abs/2306.03310

Changes: extracted camera frames from the released MP4 streams, resized each from 256×256 to 224×224, concatenated external/wrist views horizontally, and encoded JPEGs for the page. Original action/state values are preserved in `results.json`; separately normalized values and outputs from a random-weight model probe are labeled. The numeric record contains no trained policy predictions or real-arm results.
