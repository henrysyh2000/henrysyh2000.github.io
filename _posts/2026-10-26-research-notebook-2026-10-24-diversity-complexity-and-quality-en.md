---
title: 'Research Notebook 04: Separating Diversity, Complexity, and Creative Quality'
date: '2026-10-26'
slug: research-notebook-2026-10-24-diversity-complexity-and-quality
permalink: "/en/blog/research-notebook-2026-10-24-diversity-complexity-and-quality/"
translation_key: research-notebook-2026-10-24-diversity-complexity-and-quality
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
- evaluation
categories:
- research
series: research-notebook
---

Today I made the questions in my analogy-generation research more precise. Variation across outputs, complexity of expression, novelty of a connection, and analogy quality are not interchangeable judgments. The work completed during the day exposed tensions among them without establishing an overall advantage for hybrid generation.

This public entry records research questions, methodological outlines, qualitative observations, and reflections only. Measurements, scores, counts, parameter settings, configurations, original examples, and complete records remain in my private notes.

## A completed local comparison, without an established overall advantage

The day's completed comparison examined the greedy baseline and hybrid generation within the same model and the same existing outputs. Its scope is that local comparison, not a final ranking across all models or generation methods.

The baseline retained an advantage under the automated novelty and quality evaluations used that day. Revisions emphasizing unusual but meaningful interactions among elements, and a re-evaluation using reference examples I had written, did not establish an overall advantage for hybrid. The evaluation versions remain separate. Revising a rubric does not permit relabeling earlier results as results under the new standard, or combining versions into a common scale.

## Set diversity answers a different question

The set-level analysis found more pronounced lexical variation and slightly greater semantic distance among hybrid outputs. The clustering proxy changed little and was already close to its upper limit, leaving it with limited ability to distinguish the methods.

These measures describe how dispersed the outputs are relative to one another for the same input. They do not directly evaluate whether a source-to-target relationship holds. Nor do they directly establish more distinct concepts, greater creativity in an individual sentence, or better overall quality. Similar clustering results likewise do not establish equally rich conceptual content.

Truncated outputs were retained in this diversity analysis. Truncation, and reliance on lexical and embedding-based proxies, limit its interpretation. These are descriptive differences, not a claim of statistical significance or independent human confirmation.

## Complexity is not a substitute for creative quality

Hybrid was slightly higher in the completed evaluation of linguistic structure and information-organization complexity. This remains an exploratory, descriptive result. Greater structural complexity does not establish better expression, a more novel connection, or a more diverse output set. It also cannot establish how much the model actually thought.

Reviewing the evaluation rationales revealed problems worth retaining. Some rationales confused contrast with causation, and some judgments may have been influenced by accumulated description. These observations leave the meaning of the complexity result uncertain.

## An evaluation process cannot validate itself

Novelty rationales sometimes described a familiar identity reversal as novel, while assigned categories and explanations did not fully agree. I therefore need to examine judgments alongside their reasons, rather than treat an aggregate evaluation as a reliable answer by itself.

Changing the evaluator, rewriting instructions, and adding reference examples after examining the outputs are exploratory activities. Repeated calibration on the same development material does not become independent confirmation. Nor should an evaluation version be selected to produce a predetermined winner. Independent human validation remains incomplete. Reproducible records and a valid evaluation are still different requirements.

## What the interventions changed, and what they did not explain

The completed local mechanism ablation did not provide positive evidence for a concept-specific causal interpretation. Concept restoration did not show the predicted selective effect, and the transfer evidence was insufficient. These findings do not prove that internal representations contain no concept information.

A subsequent mechanism analysis remained at its validation gate because annotations and independent control validation were incomplete. Passing implementation or control checks cannot substitute for confirmation of the proposed mechanism.

Other same-prefix diagnostics and layerwise Logit Lens checks showed that intervention can change conditional token distributions and candidate ordering. This is descriptive evidence of a computational change. Divergence during free generation also includes the effects of changing prefixes. Changes in entropy or ranking alone therefore do not establish greater creativity, better quality, or a validated concept mechanism.

## The day's boundaries and reflection

At the close of the day's records, the local comparisons and diagnostics described here had been completed; the broader cross-model comparison had not been verified as complete. Execution status cannot serve as a scientific conclusion.

The day clarified the boundaries between the objects of study. Diversity, complexity, novelty, relational quality, and mechanism evidence each need their own account. A change observed along a particular dimension cannot answer for another. Retaining comparisons that failed to establish an advantage, negative findings, and unfinished validation is more useful than merging them into a premature claim of success.
