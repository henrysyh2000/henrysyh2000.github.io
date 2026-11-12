---
title: 'Research Notebook 01: Where Does Diversity in Analogy Generation Come From?'
date: '2026-10-21'
slug: research-notebook-2026-10-21-analogy-diversity
permalink: "/en/blog/research-notebook-2026-10-21-analogy-diversity/"
translation_key: research-notebook-2026-10-21-analogy-diversity
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

First, why I want to study diversity in analogy. It started with conversations with my advisor, who said that making analogies is a core part of human cognition and recommended a book, *Surfaces and Essences: Analogy as the Fuel and Fire of Thinking* by Hofstadter and Sander. My advisor also pointed me to Peter Turney's [Domain and Function](https://arxiv.org/abs/1309.4035).

Turney separates two kinds of similarity. Similarity of topic and context is domain; similarity of role and relation is function. Take `carpenter : wood :: mason : stone`. Carpenter and wood, mason and stone: each pair belongs together in its own context, and that is domain. Carpenter matches mason and wood matches stone by the role they play, and that is function.

My advisor's idea was that our core question sits right here: when a model makes an analogy, how does it settle on domain and function? We have been exploring that question ever since. Following that thread, we took a look at techniques from mechanistic interpretability, from sparse autoencoders at the start to the many kinds of lenses now, and even self-explanation, where the model explains itself. In the end the question boils down to one thing: I still want to look at the model's internal trajectory.

The concrete task: give the model a sentence and ask for another sentence with a similar structure in a different setting. The model's habit is to keep circling the same few domains. Push it to be diverse and the relation in the original sentence tends to get lost. I want to know where diversity comes from inside the model.

## Hypothesis whiteboard

1. **Trajectory amplitude: when the model writes an analogy, its hidden-state trajectory swings wider than when it writes a literal restatement.** ← tested today
2. Onset distance: the farther a sentence's opening internal state is from those of the earlier sentences, the newer its wording.
3. Neuron labelling: picking from a human label pool first, then letting the model propose its own labels for what is left, can give most neurons a concept label.

The first one came from a figure. Take one model and one story, link the hidden states of every layer into a trajectory as each token is generated, and project it onto a plane. When the model writes an analogy, the trajectory swings wider than when it writes a literal restatement. I spent this evening looking at that figure. But it is one story, so the first thing is to check that it is not a coincidence.

The other two were already under way. They go on the whiteboard now, and I will take them one at a time.

## Materials

The pilot experiments mainly use two models: LLaMA 3.1 8B Instruct and Gemma 2 9B Instruct. The stories come from three analogy datasets. This section appears only in this first entry.

## Experiment

Forty stories on LLaMA. Each story has one analogy sentence and one literal restatement, and I compare the mean step size of the two trajectories as a pair. This is observation only; the model is not touched.

## Result

In 39 of the 40 stories the analogy has the larger step, about 9% larger on average. What the figure showed was not a coincidence.

<div class="nb-chart" data-nb-chart="step-amplitude">Interactive chart: trajectory step size for the first analogy sentence and the literal restatement.</div>

## Insight

This only shows that the two kinds of generation look different inside the model. Where I am stuck: does the amplitude also affect the quality and the diversity of the output? How do I connect what I see in the figure to the output causally? Step size is not a quality score, and it is not a diversity score.

Thinking further, amplitude may not be what matters. The trajectory may simply have drifted toward other concepts. Whether diversity depends on how far the state travels or on where it drifts, the figure cannot tell. I have to intervene on the hidden states directly. Those two go on the whiteboard in the next entry.

The chart shows real values. Parameter settings and raw examples stay in my private notes.

btw, today's song is "Down Under" by Men at Work
