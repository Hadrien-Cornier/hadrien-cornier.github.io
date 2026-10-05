# Clip credits

The three clips are original renders by Hadrien Cornier. The SO-101 arm model is the MuJoCo description from TheRobotStudio SO-ARM100 repository (Apache-2.0). The motions are scripted with MuJoCo inverse kinematics and rendered with the Genesis simulator (kinematic replay, no physics step). They illustrate the ideas in the article; they do not show a trained policy.

Code: `robot-self-calibration`, branch `blog-control-scenes` (`studies/blog-control/plan.py`, `src/robot_calibration/blog_scenes.py`, `studies/blog-control/compose.py`). Render jobs: `blog-control-scenes-20261005-01` to `-03` on Hugging Face Jobs (T4).
