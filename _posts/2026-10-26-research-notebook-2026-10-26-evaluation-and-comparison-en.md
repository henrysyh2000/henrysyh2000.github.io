---
title: 'Research Notebook 06: What Question Does a Score Answer?'
date: '2026-10-26'
slug: research-notebook-2026-10-26-evaluation-and-comparison
permalink: "/en/blog/research-notebook-2026-10-26-evaluation-and-comparison/"
translation_key: research-notebook-2026-10-26-evaluation-and-comparison
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
- generation
- evaluation
categories:
- research
series: research-notebook
---

Today I continued studying interventions within the inference process: can a model produce more exploratory expressions from the same input while its weights remain unchanged? As the comparison expanded, I became more concerned with what the evaluation rewards and whether different methods are answering the same question.

## From absolute scores to relative judgments

Today I used anonymous pairwise comparisons, asking an evaluator which expression's ideas and connections were more unconventional given a shared input. I also exchanged presentation positions to examine order effects. Comparisons followed a sparse, adaptive tournament schedule. Outputs did not face identical opponents, and the evaluation was not an exhaustive comparison of every pair.

Win rate therefore describes relative performance within the current participant pool and schedule. Changing the participating methods can change opponents, existing scores, and rankings. The decision criterion did not directly test analogy validity, content quality, or scientific contribution. Exchanging positions does not automatically remove evaluator bias either.

Tournament win rates also entered the project-adapted set utility, combined with differences between outputs to examine complementarity. They share the same preference proxy and cannot serve as independent corroborating evidence. The separately recorded lexical diversity describes variation in wording; it is not clustering, semantic diversity, or conceptual diversity.

## Favorable observations and their limits

What was completed today was a post hoc available-case summary. Some cases were excluded following execution failures. The retained source sets differed across base models, and the missingness mechanism has not been shown to be random. Within each base model, methods and metrics used the same retained source set. This still cannot be described as a complete evaluation of every model on every source. Unscored or unfinished parts remain gaps.

Across the included base models and available cases, hybrid showed a favorable direction relative to each model's own greedy baseline in unconventionality preference, project-adapted set utility, and lexical diversity. It did not outperform every component or comparator on every included base. These are conditional, directional observations, without a claim of universal superiority, statistical significance, or validation by human judgments.

The saved audits replaying raw decisions and recomputing derived quantities have passed. They support faithful calculation under the current protocol; they do not establish what the evaluation validly measures. Today's favorable direction also does not overturn earlier negative comparisons using different definitions of quality. Earlier evaluation versions still need separate interpretation.

## Human evaluation materials are prepared; conclusions remain unavailable

Materials for human judgments have been prepared, with method, base-model identity, and machine decisions hidden from annotators. They remain an unpublished draft. There are no human responses or human-machine agreement results to report yet.

The selected pairs are complete, readable outputs from existing direct tournament matches. Selection did not use machine winners or a desired method advantage. This subset is still limited by completeness screening and the availability of direct matches under the adaptive schedule. It cannot represent all original outputs.

## Extending tasks calls for corresponding evaluation criteria

The scientific-idea extension is still generating outputs; evaluation has not started. Existing progress records cannot replace an audit of individual outputs' validity, and they provide no conclusion about transfer effects or scientific-idea quality.

For problem solving with constrained resources, the criterion converged on physical feasibility, achieving the goal, and respecting constraints. The corresponding project-adapted set measure is called Feasibility Utility; its meaning changes with the task objective. Raw-output collection passed its preflight checks and was submitted, with the last verifiable state still waiting. Evaluation has not begun, and there are no method-effect results yet.

## The training comparison on a common base is unfinished

A supplementary comparison with diversity-oriented training has been prepared and its dependency workflow submitted. The last verified record still showed formal training as not started. There is no convergence or benchmark-comparison conclusion. The implementation is a budget-constrained adaptation, rather than a strict reproduction of the original method and settings. The data-overlap audit is also unfinished.

Distinguishing training from inference interventions requires a common base and consistent evaluation conditions. A comparison with newly participating methods cannot simply append scores from the old participant pool. Training and inference costs also need to inform the interpretation, but completing preparation does not establish a method advantage.

## Feasibility judgments and levels of evidence

Another question is taking shape: without explicit evaluation dimensions in the prompt, what information does a model rely on when judging whether a research plan is feasible? Being able to write a review does not establish that this information actually informs the judgment or that the model uses it while generating ideas. The question remains under discussion, without mechanistic evidence yet.

The literature review continued along the same boundary: what evidence is needed for program execution, candidate validation, an explanation of a computational mechanism, and a scientific contribution? Today's progress made me more willing to distinguish observations, interpretations, and judgments still to be tested. Calculations that faithfully follow a protocol are a starting point for a trustworthy record; the validity of the evaluation itself requires separate verification.
