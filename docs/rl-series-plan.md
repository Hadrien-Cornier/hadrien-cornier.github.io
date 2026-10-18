# Plan: "Reinforcement learning, one idea at a time"

Status: plan for review, 18 October 2026. Nothing is published. Part 2 is written (preview only). Parts 1, 3, 4 and 5 are not written.

## The idea of the series

Each article answers one question. Each article uses robots from Breaking Bellman, a small browser game, and ends with a failure that the next article explains. The order is: Q-learning, bootstrapping, function approximation, on-policy and off-policy learning, the deadly triad.

## The five articles

| # | Title | Single question | Game levels used | Needs from before | Counterexample chain |
| --- | --- | --- | --- | --- | --- |
| 1 | Q-learning: one table for the value and the policy | How can one table of numbers tell a robot both how good a situation is and what to do in it? | Ten slot machines, The cliff edge (final table only), The mirage | Nothing. Reward, state, action. | (a) A greedy robot that reads its table locks onto the first decent machine. About 33% of runs end on the best one in the game. Random tries raise this to 78%. (b) The table gives a policy: take the action with the largest number. (c) The largest number in a noisy row is biased upward (The mirage). So the largest number is not automatically the value of the policy. |
| 2 | Bootstrapping: learning from your own guess (written, v6) | Why does a learner use its own guess as a target, and what does that buy? | The cliff edge | Part 1: a value, and an update toward a target. | (a) A robot that waits for the end of each walk learns nothing in 10,000 steps. (b) The guess fixes this: credit moves back one step per walk, and n steps give a dial between the two. (c) Price: a guess built on a guess. Two states that share one weight grow without bound. |
| 3 | Function approximation: learning about situations you never saw | What does a robot gain, and what can it lose, when one formula replaces the table? | Too many cells (optional: Finer is slower) | Parts 1 and 2. | (a) A table with many cells learns slowly on CartPole (about 50 of 200). (b) A formula shares what it learns between nearby situations, so it learns about situations it never saw. (c) Sharing means one update moves other numbers, including the targets of the next update. |
| 4 | On-policy and off-policy: whose behavior does the target describe? | Should a learner's target describe the behavior that collects the data, or a better behavior? | Falling while learning | Parts 1 and 2. Part 3 for the last step. | (a) Q-learning assumes the best next action. With random moves it falls more while it learns (0.32 falls per walk against 0.06 for Sarsa, second half of training, 20 seeds). (b) Sarsa describes the behavior it follows, and so it learns a safer path. (c) Off-policy lets old data and replay help. (d) A network with the Sarsa target still blew up in my runs. Not explained yet. |
| 5 | The deadly triad: when three good ideas run away together | Why can bootstrapping, function approximation and off-policy learning make values run away together, when two of the three can often avoid it? | Values explode | Parts 2, 3 and 4. | (a) Table, or waiting, or on-policy: stable in the cases shown. (b) All three on CartPole: the largest estimate reaches millions, the score stays at 8 to 10 of 200. (c) Memory and a frozen copy (DQN) damp the loop. They do not remove an element. (d) Limit: Sutton and Barto say two of three can avoid instability. This is not a guarantee. Part 4's Sarsa network is a possible exception. |

## What a Q function gives, and what it does not

- Q(s, a) is the expected return for taking action a in situation s and acting well after that.
- The greedy policy takes the action with the largest Q(s, a) in each situation. So one table holds the policy.
- The value of a situation is max over a of Q(s, a) only when Q is the optimal Q. For noisy or unfinished estimates, this number is not the value of the current policy. Part 1 states this, and shows the bias in The mirage.

## Blog structure

| Item | Proposal |
| --- | --- |
| Section | The series sits in the Writing section, under Robotics. It is one series block on the home page and on `/robotics/`. |
| Hub page | `/robotics/reinforcement-learning/`. It lists the five parts with the question and the game levels of each. It exists only while at least one part is published. |
| Article URLs | `/robotics/rl-1-q-learning/`, `/robotics/rl-2-bootstrapping/`, `/robotics/rl-3-function-approximation/`, `/robotics/rl-4-on-policy-and-off-policy/`, `/robotics/rl-5-the-deadly-triad/`. This is the same flat pattern as the `so101-N` series. |
| Navigation in an article | A one-line strip under the title (series name, "Part N of 5"). After the article: the full list of parts, plus previous and next links. |
| Unwritten parts | They show as "Coming" with no link. Previous and next show as plain text with "(coming)". |
| Data | `content/robotics/series.json` holds the plan. The builder checks that each article sits at its planned slug and part number. |
| Redirects | None needed. The old URL `/robotics/the-deadly-triad/` was never published. Only the local previews use it. |

## Points to decide or watch

- Part 1 and part 2 both use the cliff. Part 1 shows only the finished table and the greedy walk. Part 2 shows the learning comparison.
- Part 2 still holds the w, 2w example, the CartPole failure clip and the Sarsa network note. They overlap with parts 4 and 5. I kept them because the content is approved. I propose to move the CartPole drawer to part 5 when part 5 is written.
- Parts 3 and 4 each have one main game level. Both may need one extra recorded clip from existing levels. No new game code is planned.
- Part 4 point (d) is open: I did not examine why the Sarsa network blows up. Part 4 must say so unless a test is approved.
