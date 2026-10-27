---
title: "Learning from a frozen robot log: three ways it breaks"
description: 'A fixed robot dataset can mislead a learner in two different ways: a hole, where it asks about actions nobody tried, and mistakes, where it copies bad demonstrations. Stay close to the data for the first, and weight actions by the reward for the second.'
date: '2026-10-21'
updated: '2026-10-27'
draft: false
series: 'reinforcement-learning'
part: 7
layout: short
tags: ['reinforcement-learning', 'machine-learning', 'robotics']
thumbnail: '/assets/robotics/rl/rl-7-fixed-data-two-problems.svg'
thumbnail_alt: 'Two blackboard panels: a sweep that nobody tried has an unchecked estimate of 9 that the max picks, and a log of 70 good and 30 bad grasps that behavior cloning copies both'
---
