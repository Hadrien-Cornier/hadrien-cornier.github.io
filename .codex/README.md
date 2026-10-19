# RL article trial roles

These project-local roles describe the writer, four independent judges and reviser for the parts 0/1 experiment. They all select `gpt-6.1-sol`; writing uses high reasoning, judging uses medium.

The standalone TOML format follows the [official Codex custom agent schema](https://learn.chatgpt.com/docs/agent-configuration/subagents). Open Codex in this project to discover project-scoped agents. No global role or model configuration is required.

The experiment's active host exposed native `collaboration.spawn_agent` with explicit model, reasoning effort and empty-history options, but no custom agent selector or configuration reload. The experiment therefore passed model/effort explicitly and asked each native child to read its role file as task instructions. This is not evidence of automatic role loading. See the private task report for runtime verification and session IDs.

## Bounded protocol

1. Writer creates only `rl-0-overview-codex.md` and `rl-1-q-learning-codex.md`, preserving the source drafts.
2. Freeze the pair. All four judges review those same bytes without peer scores.
3. Each judge returns one integer score 1..10 and three prioritized fixes with evidence.
4. Stop when all four scores are at least 8, or after three scored rounds. Otherwise the reviser sees all four reviews and writes the next pair.
5. Cheap CLI performs builds, screenshots, counts, link checks and log extraction. Trial preview files are separate from production and v3 paths.

The trial articles stay `draft: true`. These roles do not authorize publication, a remote push, changes to parts 2..5 or changes to shared preview infrastructure. Scores indicate readiness for human review; they do not establish Hadrien's approval.
