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
categories:
- research
series: research-notebook
---

Today I continued studying analogy generation in language models, moving from observing internal trajectories toward actively changing internal states. My question was whether changing the computation could produce better analogies, rather than merely different internal representations.

This public entry retains qualitative research reflections only. Measurements, parameter settings, configurations, generated records, and full analyses remain in my private notes.

## Moving from observation to intervention

An association between internal states and outputs does not establish that the former causes the latter. I began intervening directly in the computation while distinguishing changes in internal representations, output distributions, and generated text.

These changes need separate judgments. A visible internal change does not imply more meaningful text, and greater uncertainty in the output does not imply a better analogy.

## The observation I want to remember

Exploratory interventions changed internal states and output behavior, without providing evidence of a consistent improvement in analogy quality. Some attempts instead produced repetition, lost coherence, or drifted away from the relationships the text was meant to express.

Sensitivity to perturbation is not a ready-made improvement method. Unsuccessful attempts also need to be retained in full, rather than selecting only examples that appear promising.

## Limits of the interpretation

I need to distinguish whether an implementation behaves as intended from whether a scientific hypothesis is supported. Implementation checks help identify errors, but cannot replace independent validation.

Interventions often change several factors together. The current observations do not isolate a particular cause or establish a conclusion about the model's overall mechanism.

## Making the next question clearer

Next, I want clearer controls that distinguish internal change from useful generation, tests of whether observations repeat under independent conditions, and quality evaluations that better reflect human judgment.

I remain interested in how internal trajectories, output distributions, and readable text connect. Until the evidence is stronger, I will treat that connection as an open question rather than an established mechanism.
