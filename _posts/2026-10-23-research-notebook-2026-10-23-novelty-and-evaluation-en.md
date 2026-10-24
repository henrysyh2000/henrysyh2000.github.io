---
title: 'Research Notebook 03: From Output Differences to Conceptual Novelty'
date: '2026-10-23'
slug: research-notebook-2026-10-23-novelty-and-evaluation
permalink: "/en/blog/research-notebook-2026-10-23-novelty-and-evaluation/"
translation_key: research-notebook-2026-10-23-novelty-and-evaluation
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
- conceptual-novelty
categories:
- research
series: research-notebook
---

Today, my work on analogy generation moved from observing internal trajectories to comparing different generation methods. The preliminary comparisons revealed trade-offs among diversity, quality, and generation stability: more varied or surprising text did not necessarily form a more apt analogy. I do not yet have evidence that any method leads across all of these dimensions.

This public entry records research questions, qualitative observations, and reflections only. Measurements, parameter settings, configurations, and complete records remain in my private notes.

## What I was trying to understand

I gradually narrowed the question from how different the outputs are to what makes a connection novel and what makes it hold together. Lexical variation, semantic distance, and conceptual restructuring describe different things. A sentence can use different words or reach into a distant domain while still relying on an immediate surface association.

Rare vocabulary, elaborate prose, and difficulty of reading do not by themselves indicate conceptual depth. The depth expressed in an output also cannot establish how long the model actually thought. I want to evaluate the connection expressed in the text, rather than infer an invisible thinking process from its wording.

## Separating novelty from relational quality

Today, the evaluation targets converged on conceptual novelty and relational quality. Conceptual novelty asks whether an analogy goes beyond the first surface association, using relational abstraction or restructuring to make a less obvious connection. Relational quality asks whether the correspondence between source and target is coherent, apt, and supported.

Each output receives both judgments, with neither serving as an eligibility condition for the other. They are reported separately, without an additional Depth score or a combined overall score. This preserves tensions within an expression: a connection may be unexpected while lacking relational support, or a correspondence may be apt without being novel.

I also need to distinguish the quality and novelty of an individual sentence from diversity across a set of outputs. A collection of varied expressions does not establish that each sentence makes a meaningful new connection. A novel sentence likewise cannot substitute for evaluating the collection.

## Changing an evaluation does not improve a generator

The preliminary comparisons already completed remain associated with the historical evaluation used for them. Revising the rubric changes how results are examined and described; it does not establish an improvement in generation. Earlier results cannot simply be relabeled as results under the latest Novelty/Quality rubric.

The new short rubric has undergone an end-to-end connectivity check using real scoring. This establishes that the workflow can run, but does not yet validate the evaluation or demonstrate an advantage for a generation method. A working evaluation tool and evidence supporting a research conclusion are different achievements.

## What had been completed by the end of the day

Broader cross-model generation had started, and compatibility checks and early checks of complete outputs had passed. At the close of the day's records, however, the full generation, formal scoring, and cross-model summary were not all complete. There is therefore no final ranking here, and successful execution is not treated as confirmation of a hypothesis.

The day's progress was a clearer definition of the research object and the boundaries of evaluation. Retaining unsuccessful attempts and uncertainty helps keep producing differences distinct from producing meaningful, novel connections.
