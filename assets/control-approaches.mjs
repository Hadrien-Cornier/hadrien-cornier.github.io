/** Source-grounded labels for the five teaching sketches. These are not model outputs. */
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

export const APPROACHES = freeze([
  {
    id: 'scripted',
    label: 'Fixed script',
    family: 'Hand-written replay baseline',
    structure: 'Saved route → tracking controller → movement',
    summary: 'Saved waypoints send the arm to a taught pickup position and then to the tray.',
    expectation: 'The same route runs every time, even when the scene changes.',
    limitation: 'A moved cube leaves an empty grasp. A new obstacle can cause a collision.',
    paper: null,
    actionHead: 'Saved waypoints, supplied by the author.',
    training: 'No learned model. The pickup position and route are supplied.',
    extraSources: [],
  },
  {
    id: 'chunks',
    label: 'Action transformer',
    family: 'ACT-style imitation policy',
    structure: 'Images + joint readings → transformer → action sequence',
    summary: 'ACT learns from demonstrations. A transformer turns images and joint readings into a short sequence of joint targets.',
    expectation: 'New observations update the sequence. ACT blends overlapping predictions for smoother motion.',
    limitation: 'Poor visual cues can mislead it. Already sent commands take time to change. Pauses depend on execution timing.',
    paper: {
      title: 'Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware',
      shortTitle: 'ACT (2023)',
      url: 'https://arxiv.org/abs/2304.13705',
    },
    actionHead: 'A transformer decoder predicts multiple future joint targets.',
    training: 'Task demonstrations. A conditional variational autoencoder learns their variation.',
    extraSources: [
      { title: 'ACT: architecture, temporal ensembling, and reported limitations', url: 'https://arxiv.org/html/2304.13705v1' },
    ],
  },
  {
    id: 'diffusion',
    label: 'Diffusion Policy',
    family: 'Task-trained action diffusion',
    structure: 'Scene observation + noise → repeated denoising → action sequence',
    summary: 'Given the scene, it turns a noisy action sequence into a plan through repeated denoising. It learns from task demonstrations.',
    expectation: 'Watch the ghost plan settle before the robot follows it.',
    limitation: 'Denoising takes time. Moving targets can outrun new plans. Unfamiliar scenes can confuse its visual encoder.',
    paper: {
      title: 'Diffusion Policy: Visuomotor Policy Learning via Action Diffusion',
      shortTitle: 'Diffusion Policy (2023)',
      url: 'https://www.roboticsproceedings.org/rss19/p026.pdf',
    },
    actionHead: 'Denoising diffusion generates an action sequence.',
    training: 'Task demonstrations provide observations and target action sequences.',
    extraSources: [
      { title: 'Official Diffusion Policy project and demonstrations', url: 'https://diffusion-policy.cs.columbia.edu/' },
      { title: 'Diffusion Policy: data coverage and inference latency limits', url: 'https://www.roboticsproceedings.org/rss19/p026.pdf#page=11' },
    ],
  },
  {
    id: 'generalist',
    label: 'Generalist VLA',
    family: 'π₀-style pretrained policy',
    structure: 'Images + instruction + robot state → vision-language model → action expert',
    summary: 'π₀ combines a pretrained model for images and language with an action expert. Flow matching turns noise into actions, using a different training rule from diffusion.',
    expectation: 'The instruction chooses a task. Broad robot training helps reuse skills.',
    limitation: 'A wrong visual interpretation can select the wrong object. Difficult tasks still need practice and refinement.',
    paper: {
      title: 'π₀: A Vision-Language-Action Flow Model for General Robot Control',
      shortTitle: 'π₀ (2024)',
      url: 'https://arxiv.org/abs/2410.24164',
    },
    actionHead: 'A flow-matching action expert learns a vector field that transforms noise into continuous actions.',
    training: 'Vision-language pretraining, broad robot-task training, then task-specific refinement where needed.',
    extraSources: [
      { title: 'π₀: architecture and limitations', url: 'https://arxiv.org/html/2410.24164v1#S7' },
      { title: 'Official π₀ paper', url: 'https://www.pi.website/download/pi0.pdf' },
    ],
  },
  {
    id: 'world',
    label: 'World model + planner',
    family: 'V-JEPA 2-AC-style latent prediction',
    structure: 'Images → learned scene features → predicted outcomes → planner → action',
    summary: 'A video encoder learns scene features. A predictor forecasts them for possible moves. A planner chooses actions that approach an image goal.',
    expectation: 'Compare predicted outcomes, move one step, then observe and plan again.',
    limitation: 'Wrong camera coordinates or inaccurate predictions can make a failing plan look good. Toy frames stand in for learned features.',
    paper: {
      title: 'V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning',
      shortTitle: 'V-JEPA 2 (2025)',
      url: 'https://arxiv.org/abs/2506.09985',
    },
    actionHead: 'A planner searches candidate actions using the learned predictor.',
    training: 'Video pretraining followed by action-conditioned training on robot trajectories.',
    extraSources: [
      { title: 'V-JEPA 2-AC: camera placement, long-horizon planning, and image-goal limits', url: 'https://arxiv.org/html/2506.09985v1#S4.SS3' },
    ],
  },
]);

const sourceRTC = freeze({
  title: 'Real-Time Execution of Action Chunking Flow Policies',
  url: 'https://arxiv.org/abs/2506.07339',
});

export const SCHEDULING = freeze({
  default: 'synchronous',
  summary: 'Execution timing decides when a new action batch is computed and sent to the robot.',
  appliesTo: ['chunks', 'diffusion', 'generalist'],
  options: [
    {
      id: 'synchronous',
      label: 'Synchronous',
      summary: 'Execute a batch, then wait while the next batch is computed.',
      expectation: 'Compute delay creates a pause between batches. New observations affect the next batch.',
    },
    {
      id: 'realtime',
      label: 'Real-time chunking',
      summary: 'Compute the next batch while the robot moves. Keep commands that must execute during the delay, then revise later commands.',
      expectation: 'The committed segment keeps moving while the future plan changes. A new observation still takes time to affect movement.',
    },
  ],
  limitation: 'The RTC paper applies its algorithm to diffusion and flow policies. The action-transformer sketch borrows its timing idea using a simple queue.',
  sourceRTC,
  paper: sourceRTC,
});

export const TEACHING_NOTE = 'All demonstrations use simple toy rules. Architecture, action generation, training breadth, and execution timing are separate choices that can be combined.';
