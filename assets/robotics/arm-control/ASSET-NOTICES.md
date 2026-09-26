# Robot mesh sources and notices

The robot mesh portions of `results/seed7-dense/robot_geometry.json`, the embedded geometry in `figures-v2/workspace.html`, and the Franka renderings in `figures-v2` and `figures-lesson` come from the Panda visual assets distributed with **ManiSkill 3.0.1**. The robot is the Franka Panda. Credit belongs to the upstream Franka model authors and the ManiSkill contributors who distribute these assets.

## License notices

ManiSkill 3.0.1's installed package metadata and [tagged README](https://github.com/haosulab/ManiSkill/blob/v3.0.1/README.md#license) distinguish permissively licensed environment code from assets distributed under **Creative Commons Attribution-NonCommercial 4.0 International**. This distribution retains that asset notice. It does not present the exported robot meshes as assets cleared for unrestricted commercial use.

- [CC BY-NC 4.0 legal text](licenses/CC-BY-NC-4.0.txt), also available from [Creative Commons](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en).
- The upstream Franka model family uses Apache 2.0. Preserve the [Franka ROS notice from tag 0.7.0](licenses/FRANKA-ROS-0.7.0-NOTICE.txt), the [Franka Description notice](licenses/FRANKA-DESCRIPTION-NOTICE.txt), and the [Apache 2.0 license](licenses/Apache-2.0.txt).
- Upstream copyright notices identify **Copyright 2017 Franka Emika GmbH** and **Copyright 2023 Franka Robotics GmbH**, respectively.

The exact Franka revision used for ManiSkill's GLB conversion is not identified in the installed Panda folder. The original-model notices above do not establish that ManiSkill's distributed GLB assets have an alternative unrestricted license. The notices concern their respective upstream material; they do not relicense this repository's independent experiment code.

The assets are supplied without warranties, under the disclaimers in the linked license texts. This experiment is not endorsed by Franka, ManiSkill, or their contributors.

## Source and changes

Source assets are in [ManiSkill v3.0.1's Panda visual mesh directory](https://github.com/haosulab/ManiSkill/tree/v3.0.1/mani_skill/assets/robots/panda/franka_description/meshes/visual): `link0.glb` through `link7.glb`, `hand.glb`, and `finger.glb`.

The local export reads the loaded SAPIEN render meshes and their material colors. It merges duplicate vertices, rounds positions to 0.0000001 m, saves link-frame triangles as JSON, and places those triangles using sampled robot configurations. The HTML and PNG figures render this transformed geometry. These are modified representations of the upstream assets. Per-file SHA-256 hashes are stored in `robot_geometry.json` under `provenance.visual_asset_sha256`.

The original Franka source notices were obtained from:

- [franka_ros 0.7.0 NOTICE](https://github.com/frankarobotics/franka_ros/blob/0.7.0/NOTICE)
- [franka_description NOTICE](https://github.com/frankarobotics/franka_description/blob/main/NOTICE)
- [franka_description repository](https://github.com/frankarobotics/franka_description)

Source and notice check: 2026-09-26. Retain this notice with redistributed mesh exports and figures. Standalone HTML should also link to this notice and the asset license.
