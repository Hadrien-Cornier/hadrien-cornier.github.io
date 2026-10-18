# Plan: "Reinforcement learning, one idea at a time"

Status: plan for review, 18 October 2026. Nothing is published. Parts 1 to 4 are written (preview only). Part 5 is not written.

## The idea of the series

Each article answers one question. Each article uses robots from Breaking Bellman, a small browser game, and ends with a failure that the next article explains. The order is: Q-learning, bootstrapping, function approximation, on-policy and off-policy learning, the deadly triad.

## The five articles

| # | Title | Single question | Game levels used | Needs from before | Counterexample chain |
| --- | --- | --- | --- | --- | --- |
| 1 | Q-learning: one table for the value and the policy | How can one table of numbers tell a robot both how good a situation is and what to do in it? | Ten slot machines, The cliff edge (final table only), The mirage | Nothing. Reward, state, action. | (a) A greedy robot that reads its table locks onto the first decent machine. Re-run with the game's level settings (200 runs): the greedy robot spends 35.5% of its last 200 pulls on the best machine, and random tries raise this to 77.5%. The earlier 33% and 78% came from logs with other seeds and are not used. (b) The table gives a policy: take the action with the largest number. (c) The largest number in a noisy row is biased upward (The mirage). So the largest number is not automatically the value of the policy. |
| 2 | Bootstrapping: learning from your own guess (written, v6) | Why does a learner use its own guess as a target, and what does that buy? | The cliff edge | Part 1: a value, and an update toward a target. | (a) A learner that waits until a walk ends can update only after termination. (b) A guess lets it update before termination. The corridor shows reward information moving back one step per walk for one-step updates, three steps for three-step updates, and all at once for waiting. (c) The two cliff clips are an illustration. In the recorded runs the guessing robot found the path and the waiting robot did not. I did not find the cause of that gap. (d) Price: a guess built on a guess. Two states that share one weight grow without bound. |
| 3 | Function approximation: sharing what you learn | What does a robot gain, and what can it lose, when one formula replaces the table? | Too many cells (optional: Finer is slower) | Parts 1 and 2. | (a) A table with many cells visits few of them: 6 bins per sensor give 1,296 cells, and the robot stood in about 8% in 20,000 steps (score about 50 of 200). A coarse table of boxes already shares within each box: 3 bins scored 92. (b) A formula shares what it learns between nearby situations, so it learns about situations it never saw (a labeled math illustration, not a game run). (c) Sharing means one update moves other numbers, including the estimates that the next target uses; it can help several situations and worsen others. Measured: a network with the same target, data and budget but its default optimizer and step size scored lower than the table (9.4 vs 50.4 one-step, 33.9 vs 95.4 waiting). The DQN score of 143 mixes the formula with replay and a frozen copy, so it is not credited to approximation alone. |
| 4 | On-policy or off-policy? | Should a learner's target describe the behavior that collects the data, or a better behavior? | Falling while learning | Parts 1 and 2. Part 3 for the last step. | (a) Q-learning's target describes the greedy rule while the robot makes random moves (off-policy). Over 20 runs it fell 0.318 times per walk in the second half of training, against 0.061 for Sarsa and 0.038 for Expected Sarsa. (b) Sarsa's target describes the acting robot (on-policy). Its tables rank the cell next to the cliff below the top row (-14.0 against -11.9; Q-learning -6.8 against -8.2). Price: in the final no-random-move test 12 of 20 Sarsa runs reach the flag on the top route (17 or 19 steps) and 8 do not reach it in 200 steps (not examined); score -82 against -13. (c) With no random moves, Sarsa learns the 13-step edge route in 20 of 20 runs: the on-policy answer follows the behavior. Expected Sarsa sits between (15 steps, 20 of 20). (d) Off-policy is not replay or old data: Q-learning on the latest move is already off-policy. (e) Limit: a network with the Sarsa target still blew up (9.4 of 200, largest estimate 0.8 to 1.9 million at the end). Not explained. |
| 5 | The deadly triad: when three good ideas run away together | Why can bootstrapping, function approximation and off-policy learning make values run away together, when two of the three can often avoid it? | Values explode | Parts 2, 3 and 4. | (a) Table, or waiting, or on-policy: stable in the cases shown. (b) All three on CartPole: the largest estimate reaches millions, the score stays at 8 to 10 of 200. (c) Memory and a frozen copy (DQN) damp the loop. They do not remove an element. (d) Limit: Sutton and Barto say two of three can avoid instability. This is not a guarantee. Part 4's Sarsa network is a possible exception. |

## What a Q function gives, and what it does not

- Q(s, a) is the expected return for taking action a in situation s and then following a policy. Q-learning estimates Q-star, the optimal action values: the return for taking action a and then acting optimally.
- The greedy policy takes the action with the largest Q(s, a) in each situation. So one table holds the policy.
- The optimal value of a situation is the maximum over a of Q-star(s, a). A learned table only estimates Q-star, and it is the optimal Q only at convergence. For noisy or unfinished estimates, this number is not the value of the current policy. Part 1 states this, and shows the bias in The mirage.

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
