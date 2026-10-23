---
title: 'Research Notebook 02: From Observing Trajectories to Intervening on Hidden
  States'
date: '2026-10-22'
slug: research-notebook-2026-10-22-hidden-state-interventions
permalink: "/en/blog/research-notebook-2026-10-22-hidden-state-interventions/"
translation_key: research-notebook-2026-10-22-hidden-state-interventions
lang: en
locale: en
toc_label: On this page
layout: single
author_profile: false
read_time: true
toc: true
render_with_liquid: false
obsidian_publisher: obsidian-publisher-v1
tags:
- research-notebook
- analogy-generation
- hidden-states
- stochastic-interventions
categories:
- research
series: research-notebook
---

Today I continued studying analogy generation in large language models. I began modifying hidden states directly during computation, observing internal trajectories, next-token distributions, and the analogies ultimately generated. The main model was LLaMA 3.1-8B-Instruct. Most mechanism probes used the first AnaloBench example; full-generation experiments extended to the first ten.

Column: [Henry’s Research Notebook](https://henrysyh2000.github.io/en/blog/columns/research-notebook/)

The clearest result was that internal trajectories and vocabulary distributions were easy to change, while analogy quality did not improve along with them. On the first ten examples, every intervention strategy under both noise–λ combinations had a lower mean overall score than pure greedy decoding. After adding sustained layerwise jumps later in the day, all 30 outputs from the three intervention strategies reached the 100-token limit, with severe repetition or meaningless fragments.

This entry covers **October 22, 2026, as a local calendar day in Toronto**, corresponding to October 22 at 04:00 through October 23 at 04:00 UTC. Single-step probes, full generation, and scoring are interpreted separately.

## Hypotheses explored today

I grouped today's exploratory work into seven questions. Some share examples and controls, so the number of rows is not the number of independent pieces of evidence.

| Question | Experiment performed | Current assessment |
| --- | --- | --- |
| Is output diversity determined only by movement magnitude? | Matched immediate displacement and residual norm while comparing natural, concept, and random directions | Local sensitivity to direction, without isolating an independent conceptual effect |
| Does increasing movement magnitude consistently increase diversity? | Two doses, 0.8 and 1.2 times the original step | No support for a uniform monotonic relationship |
| Do direction and magnitude interact? | Two doses × three direction types, intervening at blocks 16 and 24 | The concept-minus-random lexical-diversity contrast changes sign; this needs replication |
| Does stable top-1 imply that later layers no longer matter? | Layerwise readouts and removal of later-layer updates after stability | The final distribution changed at all seven diagnostic positions; top-1 remained unchanged |
| Do noise timing and explicit pullback change the outcome? | Forward, Inverse, and Hybrid schedules with a λ grid | Trajectories and distributions change, but no quality advantage has been shown |
| Does selecting the highest-entropy internal candidate at low confidence improve analogies? | Autoregressive stepwise generation compared with greedy decoding | Neither parameter combination improved the mean overall score on the first ten examples; candidate selection still needs a separate ablation |
| Can changing the starting point or repeatedly injecting perturbations improve generation? | One-off jumps, fixed-radius starting points, and constant or decaying layerwise jumps | Single-step distributions respond; sustained jumps substantially degrade full generation; decaying jumps have no sentence-quality result yet |

These checks have not established a general mechanism confirmed across stories, random seeds, and human evaluation. The seventh row also combines different protocols, which cannot be reduced to one claim that “jumps work” or “jumps do not work.”

## What trajectories and confidence actually mean

I replayed a historical complete sentence without intervention, processing each prefix across **26 tokens × 32 layers**. The main confidence measure here was the probability assigned to the **actual token** at that position by `softmax(final logits, T=1)`. It was not accuracy. The historical run did not save logits, so this replay cannot be described as recovering the historical floating-point results.

In the later autoregressive framework, confidence instead meant the maximum softmax probability over the full vocabulary from a natural forward pass on the **actual current prefix**, also at T=1. It determined whether an intervention was triggered at that generation step. This is a different readout from actual-token probability above.

The trajectory plots use PCA for low-dimensional display; projected distances are not distances in the original space. In the later protocols, zero-based L0 denotes the output of the first Transformer block, not the embedding.

## Magnitude and direction: what the single-story pilot showed

The early pilot included 800 sustained-loop outputs, 155 descriptive baseline outputs, and 800 raw controlled continuations. All 20 full-generation sham comparisons were identical, and 10,881 edited states passed geometric checks. These checks support that the implementation followed its protocol; they do not replace hypothesis testing.

The controlled continuations had overlapping seeds: the 50 nominal outputs per arm and layer contained only **14 unique random draws**. Duplicates were checked and removed; the results below were recalculated with K=14.

| Block, one-based | Dose | Concept-direction DBLEU | Random-direction DBLEU | Concept minus random |
| --- | --- | ---: | ---: | ---: |
| 16 | 0.8 | 0.3989 | 0.4168 | −0.0179 |
| 16 | 1.2 | 0.5404 | 0.4416 | +0.0988 |
| 24 | 0.8 | 0.3851 | 0.4072 | −0.0221 |
| 24 | 1.2 | 0.4585 | 0.4323 | +0.0262 |

DBLEU is `1 − Self-BLEU`; higher values indicate greater lexical difference within a set of texts. The baseline was 0.3907. This does not measure semantic-domain diversity, and this batch has not yet been scored for quality or semantic diversity. The quality experiment on the first ten examples below used a different batch of outputs.

The geometric controls matched immediate displacement radius and residual norm. They did not match the entire subsequent path length or guarantee equal injection-vector norms or rotation angles. The “concept directions” came from domain-prompt contrasts, not official ICA components. What I retain at this stage is the local effect of these specific directional operations.

The later-layer diagnostic also offered a caution: none of the seven inspected positions reproduced “stability within the first half of the layers.” Removing later updates after stability left top-1 unchanged but changed the final distribution in every case. An unchanged candidate ranking does not establish that later layers have no effect, let alone quantify knowledge utilization.

## Noise schedules: a more uniform distribution does not imply a better analogy

An early five-trajectory, first-token experiment with approximately 1% noise retained an interlayer stability gate; top-1 remained unchanged on all five trajectories. The experiment was then expanded to ten trajectories and the gate removed. An early ungated version excluded the final layer, whereas the later three-strategy version intervened at L1–L31, including the final layer and skipping L0. Their intervention ranges differ, so noise percentages alone do not make them directly comparable.

Forward allocates more noise where the baseline changes more; Inverse allocates more where it is relatively stable. Hybrid mixes the two schedules using continuous cosine weights. λ controls an additional correction pulling toward the baseline. Setting λ=0 disables only this artificial correction; it does not imply that the model has no endogenous recovery effect. The early **interlayer stability gate** must also be distinguished from the later **per-token low-confidence trigger**.

With noise fixed at 60% and λ at 0.6, the means over ten first-token trajectories per strategy were:

| Strategy | Conditional Top-10 entropy H10, bits | Total probability mass in the Top 10 |
| --- | ---: | ---: |
| Unperturbed baseline | 1.6937 | 97.283% |
| Forward | 1.9110 | 72.400% |
| Inverse | 3.0059 | 15.198% |
| Hybrid | 2.3717 | 50.768% |

H10 first renormalizes each trajectory's Top-10 probabilities within those ten entries, then computes entropy. Its upper bound is `log₂(10) ≈ 3.3219 bits`. Inverse has a more uniform Top 10, but those tokens cover only about 15.2% of total probability on average. H10 is not full-vocabulary entropy and does not measure semantic diversity or analogy quality.

Today's implementation borrows the “natural update plus random increment” form of Euler–Maruyama, but remains a layerwise residual intervention. No true continuous-time SDE solution has been established. Deviation from the baseline cannot be called numerical integration error.

## Full generation: weaker parameters reduced degradation but did not beat greedy

At each generation step, the framework first computes natural confidence on the actual current prefix. Below the threshold, it runs **K=10 internal candidates**, chooses the trajectory with the highest H10, then greedily emits one token from that trajectory. Otherwise, it uses natural greedy decoding. The next step recomputes the current full prefix. It neither reuses the complete prefix of a historical greedy generation nor carries perturbed KV states from the preceding step.

These ten candidates belong to one internal step. They are not ten complete outputs or a ten-sentence loop-diversity set for each story.

I first compared confidence thresholds of 80%, 60%, and 40% on one story, generating at most 100 new tokens and stopping early at EOS. Several conditions produced incoherent fragments. This experiment did not provide enough evidence to choose the best threshold. Prefixes diverge across thresholds, and trigger counts cannot simply be interpreted as local causal effects.

I then fixed the confidence threshold at 40% and extended the experiment to the first ten stories, with one complete rollout per story and strategy. Each cell below is the mean GPT-4o mini overall score over ten outputs, on a 1–5 scale:

| Strategy | noise=60%, λ=0.6 | noise=40%, λ=0.4 |
| --- | ---: | ---: |
| Greedy | 3.960 | 3.960 |
| Forward | 3.790 | 3.840 |
| Inverse | 1.020 | 3.625 |
| Hybrid | 2.355 | 3.865 |

The weaker combination reduced degradation for Inverse and Hybrid, but every intervention strategy still scored below greedy on mean overall quality. Noise and λ changed together, so their effects cannot be attributed independently. Under the first combination, 3/10 Inverse and 3/10 Hybrid outputs reached the 100-token limit; both were 0/10 under the weaker combination. Greedy and Forward were 0/10 under both combinations.

Both combinations used the same v2 rubric: originality 40%, insightfulness 20%, relational mapping 25%, comprehensibility 10%, and format compliance 5%. The creativity subscore renormalizes only the first two components. The v2 rubric was revised after inspecting v1 and is exploratory; a score difference between v1 and v2 does not represent improved generation.

Each output received only one model judgment. Greedy records could be reused when both the text and scoring conditions were exactly identical. Human alignment, cross-seed replication, and confidence intervals remain incomplete. In particular, Hybrid's 3.865 being close to 3.960 does not establish equivalence, and small differences should not be treated as stable rankings.

## From starting-point jumps to repeated layerwise injection

### Changing the starting point once

Before entering L1, I added a single Gaussian offset at the final prompt position. All subsequent layers ran naturally, with layerwise noise=0 and λ=0. Ten Gaussian vectors were paired across three magnitudes:

| Gaussian strength α | Mean actual relative starting-point distance | Mean final full-vocabulary JSD, nats | Top-1 changes |
| --- | ---: | ---: | ---: |
| 10% | 9.997% | 0.000128132 | 0/10 |
| 30% | 29.987% | 0.000337554 | 0/10 |
| 50% | 49.980% | 0.000316575 | 0/10 |

α is the per-coordinate noise standard deviation relative to the baseline hidden-state RMS, not variance; it does not enforce a fixed radius. All 30 trajectories retained `The` as top-1. The full distribution changed, but JSD did not increase monotonically with strength. This is insufficient to establish an attractor or conclude that starting-point interventions are generally ineffective.

Next, I placed starting points at fixed relative distances of 0%, 20%, 40%, 60%, and 80%. Each nonzero radius had only one independently sampled direction, followed by ten subsequent noise branches. Radius and direction changed together. Those ten branches are not ten independent starting points, so this design cannot isolate the radius effect.

### Sustained layerwise jumps failed in full generation

The first-token grid with repeated injection at every layer substantially changed the final distribution. Its cumulative injection budget was also larger. This does not establish higher knowledge utilization or prove that attention washes out a one-off starting-point perturbation.

I then used it in full generation: **layerwise jump=20%, noise=20%, λ=0, confidence threshold=30%, K=10 with maximum-H10 selection**. Outputs were still limited to 100 new tokens, and jump and noise were triggered only at low-confidence steps.

| Strategy | Overall score / 5 | Creativity subscore / 5 | Reached the 100-token limit |
| --- | ---: | ---: | ---: |
| Greedy | 3.960 | 3.900 | 0/10 |
| Forward | 1.000 | 1.000 | 10/10 |
| Inverse | 1.000 | 1.000 | 10/10 |
| Hybrid | 1.000 | 1.000 | 10/10 |

**All 30 intervention outputs reached the limit**, with severe repetition or meaningless text. I retained every original output, without repairs, regeneration, or selecting better examples. Once confidence becomes high, the framework returns to natural greedy decoding by design. A low trigger count does not guarantee that the prefix already generated is good.

This is a negative result on the first ten stories, with one rollout per strategy. Jump, noise, λ, and the threshold all changed relative to the earlier experiments, so the failure cannot be attributed solely to jump or to the 30% threshold. It does show that this complete configuration did not turn internal perturbations into useful gains in analogy generation.

## At the end of the day: cosine-decaying jumps still only reach the first token

The final completed experiment of the day set the direct injection ratio to:

`r_l = 0.1 × (1 + cos(πl / 31))`, for `l = 0,…,31`.

This gives 20% at L0, approximately 9.49% at L16, and 0% at L31. The controls were no jump and a constant 20% jump, combined with noise=20%/40%/60%, λ=0–1.2, three schedules, and ten branches per condition. This run finished at 23:48 Toronto time. It examined only the first next token of the same story, without autoregressive feedback, confidence triggering, candidate selection, or a quality judge.

It completed 3,511 forward passes, including 3,510 branches. All 16 runtime checks passed, and states and logits for 1,560 previous conditions were reproduced exactly. These results confirm consistency between the implementation and its specified controls; they do not establish a quality hypothesis.

What decreases is the **relative ratio of direct injection at each layer**, not necessarily the absolute injected norm or total trajectory deviation. The final layer still retains the original noise and pullback terms when its jump is zero, and earlier perturbations do not disappear. Constant and decaying schedules have different cumulative budgets, so this comparison cannot yet isolate injection timing. There is currently no sentence-level quality-gain conclusion for this configuration.

## Limitations and next steps

The main missing evidence is a set of controls separating “the distribution changed” from “the analogy improved.” I will first compare random candidate selection with maximum-H10 selection, then K=1 with K=10 while controlling compute budget. Otherwise, a more elaborate selection procedure may simply be spending more computation.

Starting-point experiments need multiple radii along the same direction and more independent directional replicates. Timing experiments need control of the cumulative injection budget. I will then expand stories and seeds to test whether the current local observations replicate.

Scoring also needs human alignment. Blind-evaluation materials have been prepared from historical outputs for single-sentence quality and ten-sentence set diversity, but human ratings are still pending. These materials do not include today's new steering outputs. To address the paper's diversity question through full generation, I also need to restore ten-sentence loops and semantic-domain metrics. A single-sentence creativity score cannot substitute for set diversity.

Today produced no new conclusion about neuron-annotation coverage across the whole model. The connection between internal trajectories, probability distributions, and readable output still needs direct testing.

## Evidence scope and checks

This entry draws on the day's experimental protocols, audit reports, original generations, scoring records, and verifiable state and logit records, retaining anomalous outputs and negative results. The historical sentence replay has no historical-logit comparison, as noted separately. Protocol checks, numerical regressions, and displayed-readout checks establish implementation and presentation consistency. Scientific interpretation remains limited by sample size, random replication, scoring methodology, and confounded parameters. Display-only changes were not counted as new model experiments.
