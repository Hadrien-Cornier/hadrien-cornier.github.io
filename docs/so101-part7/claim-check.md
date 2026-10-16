# SO-101 part 7 claim check

Checked before drafting the post, 15 Oct 2026 (CDT). Cutoff: the 15 Oct handoffs. No new arm run, fit, simulation or deck render.

The post uses RMS distances, squared-error shares and joint-angle errors. They are different quantities. Only Measured comparisons of controllers on the real arm rank controllers. Offline analysis of real logs remains Offline.

## Precision claims used

Source paths below are relative to `robot-self-calibration` unless prefixed with `bcw-ops` or `blog`. Git pins refer to that repository. Board and archive files were read from `~/bcw-ops`; they were not edited.

| Claim in the post or figures | Label | Source and scope |
|---|---|---|
| Part 6 frozen correction: 1.057 mm | Measured | `blog`, parent `06a0c7c`, `content/robotics/so101-6-where-the-last-millimeter-goes.md`, key-number table. Historical mean across the four controller-selection drawings; not a new result or a bound. |
| Pairwise repeat RMS 0.95 mm, 96 pairs | Offline | `a55cb4f2`, `studies/workshop-1010/twin-accurate/LOG.md`, E1; `README.md`, Ceiling. Same motion and arguments within each pair; head-off cohorts. |
| Per-run spread about 0.67 mm | Offline, inferred | Same E1: 0.95 / sqrt(2). Requires independent repeat deviations with comparable variance. It is a deterministic-prediction noise estimate, not measured target accuracy or a universal control limit. |
| Per-run spread 0.72 mm, mean of 50 s40 repeats | Offline | Same pin, twin `README.md`, Repeat-mean check, and `LOG.md`, E7. Separate cohort; do not treat 0.67 to 0.72 as a confidence interval. |
| 0.69 mm repeat deviation, 40 passes | Offline | `eb62c4e2055c83f34c4de762b82ca0ce29d6aa6f`, `studies/workshop-1010/atlas/run-noise/README.md`, Answer/Definitions/Totals; `results/totals.json` gives 0.689848534 mm. Old nib, s40, head-off phys, P16, one pose, 11 to 12 Oct. |
| Encoders explain about 70% of repeat variance; about 30% unexplained | Offline | Same run-noise README: leave-one-run-out joint fit R2 0.69 to 0.73; frequency-weighted seen share about 70%. Applies to deviation from the repeat mean, not all target error in all regimes. Figure rounds to 70/30. |
| At 100 ms, history predicts 27% of repeat variance; 0.71 to 0.61 mm | Offline | Same README, What a feedback or a feature can reach. 0.709 mm stroke-only deviation rounded to 0.71; residual 0.61. Predictive upper bound, excludes loop interactions; not an arm improvement. |
| Figure: prediction at 50/100/150/200 ms explains 48/27/11/5% | Offline | Same README, encoder-history column of the delay table. These are predictive fits, not closed-loop gains. |
| Pan tracking 1.68 mrad at 12% duty limit, 13 Oct | Measured | `bcw-ops/archive/direct-drive/direct-drive-handoff-mbp.md`, rev 2; `so101-research-record` `6989c65`, `deck/README.md`, Known issues. Corrected reference at encoder reading time. Underlying study: `d1a7482a`, `studies/so101-direct-drive-01/`; pre-result-17 aim-time scores are biased. |
| Pan tracking 3.91 mrad at 20% steady duty limit, 13 Oct | Measured | Same direct-drive handoff, Facts to keep, DD-5c. More steady duty produced a limit cycle in that test. Not a nib score. |
| Later pan tracking 3.08 then 10.40 mrad at 12%, 14 Oct | Measured | Same handoff, DD-9a, repeated in `bcw-ops/board/direct-drive.md`. Friction changed. Not a matched comparison against 13 Oct. |
| Frozen MLP gains 0.230 and 0.201 mm against v6c | Measured | `bcw-ops/decisions.md`, row 27 (12 Oct). Relative nib gains on controller-selection drawings. Post rounds to 0.23 and 0.20; no new absolute score inferred. |
| N64 model: 64 practice motions, 102 training passes | Measured evaluation; training configuration | `bcw-ops/archive/neural/row45e-n64-results-20261015.md`, Pins. Code `d2bf1b9fcd683362c49c6e758a252fc1d24921f2`; retained in handoff of `14515ba2`. Frozen old-corpus head, not online practice. |
| N64 native signed-lag RMS: baseline 1.537, head 1.641 mm | Measured | Same N64 report. Baseline = (1.481082 + 1.593553)/2 = 1.5373175; head 1.641165. Equal-figure means over kitten, star, spiral, square. Native raw tablet times against original XY; signed lag fitted, no rigid spatial fit. |
| N64 fixed-time RMS: baseline 2.238, head 1.643 mm | Measured | Same N64 report. Baseline = (2.160272 + 2.314955)/2 = 2.2376135; head 1.642870. Original plan, no lag fit, fresh active tablet samples at the fixed grid. Different metric from native signed-lag RMS. |
| Twin play-fit share 49.6% on 72 original-cohort passes; -5.6% on 28 held-date passes | Simulation compared with Offline arm logs | `a55cb4f2`, twin `LOG.md`, E47 all versions on the date set and E48 test. Same c2 + E41 row-13 play version. Original cohort was held out for the initial fit, then reused for development: not a sealed test. Date cohort is 13 Oct; the nib/setup/controller mix differs. Negative means worse than predicting zero arm error under the defined score. |
| Twin RMS mismatch 1.304 and 1.248 mm in those cohorts | Simulation compared with Offline arm logs | Same E48 and E47 tables, same c2 + play version. Post rounds to 1.30 and 1.25. Shows why the share also depends on the size of arm error in its denominator. |

The “1 mm” line is a project target, not a result category. Dates, part numbers, model IDs and cohort counts identify context; labels above apply to their associated results. No Dry run score is presented as evidence of precision.

## Rejected or qualified claims

- “Controls to 1 mm”: rejected as a general claim. Part 6 has a particular Measured selection-set score; repeat spread is another quantity. No bound over poses, payloads or days is established.
- Deck best-pan score 2.14 mrad: rejected. The deck README says this uses aim time. Use the corrected 1.68 mrad reading-time score.
- “Encoders miss two thirds”: rejected. For the studied run-to-run cohort, about 70% of variance is explained by encoder signals. Do not generalize that share to total target error.
- Deck flat long-run online curve: `deck/render/deck_head.py`, final `s_drift`, marks its curve “Illustration, not data.” The post makes no measured asymptote claim.
- Deck repeat figure: the NPZ manifest contains mixed register settings and run names. It is not used as a same-controller repeat cohort in the new post.
- No direct-drive tablet win: handoff rev 2 says DD-12 has not completed a drawing comparison. A partial/stopped run is not a scored win.
- No completed matched-count online curve: `bcw-ops/archive/neural/neural-handoff-mbp.md` says accepted online practice is zero and N128 is incomplete. N64 is a frozen evaluation, not an online-learning result.
- No claim that IMUs arrived or worked: order is recorded in decisions row 31; the hardware handoff has no bench-test result. A calibration station is an idea.
- Twin E51 calibration used reserved Test/validation drawings according to the current twin-board audit. Do not cite it as a valid calibration improvement. The post uses the earlier fixed-model comparison only.

## Figures

`assets/robotics/so101-after-part6/figure-data.json` freezes only the summary values above. `scripts/so101_part7_figures.py` makes small static PNGs without fitting or simulating. The diagrams identify labels and cohorts. They do not combine milliradians with millimeters or turn variance shares into additive RMS distances.
