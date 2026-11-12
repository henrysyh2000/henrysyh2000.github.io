---
title: 'Research Notebook 02: Onset Distance'
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

This entry tests the second hypothesis on the whiteboard.

## Hypothesis whiteboard

1. ~~Trajectory amplitude: when the model writes an analogy, its hidden-state trajectory swings wider than when it writes a literal restatement.~~ Tested in 01: it holds, but only as an observation.
2. **Onset distance: the farther a sentence's opening internal state is from those of the earlier sentences, the newer its wording.** ← tested today
3. Neuron labelling: picking from a human label pool first, then letting the model propose its own labels for what is left, can give most neurons a concept label.
4. Farther means more diverse: the farther the hidden state is pushed, the more diverse the output. (new)
5. Where you push matters more than how far: pushing along a concept direction increases diversity more than pushing equally far in a random direction. (new)

The two new ones are left over from the last entry. The difference in amplitude is there, but whether diversity depends on how far the state travels or on where it drifts, a figure cannot tell. I want to intervene with steering and look at the two separately, so they go on the whiteboard first.

The second hypothesis is a guess I already had during earlier exploration. Ask the model for several analogies in a row on the same sentence. If the opening internal state of one sentence is farther from the openings of the earlier ones, its wording should be newer.

## Experiment

Looped generation on three datasets under four analogy conditions. For each sentence I take the minimum distance from its onset state to the onset states of all earlier sentences, then correlate that with the sentence's lexical novelty relative to the earlier sentences. How large a correlation counts was fixed in advance.

## Result

On every dataset and under every condition, the correlation clears the line that was fixed in advance.

<div class="nb-chart" data-nb-chart="onset-correlation">Interactive chart: correlation between onset distance and lexical novelty.</div>

## Insight

The correlation is there, but I would not say the hypothesis holds.

One gap is still open. The later a sentence comes, the more earlier sentences there are to compare against, so onset distance and lexical novelty may simply both be moving with the round.

Also, I chose this measure after looking at earlier exploratory results, and this run used the same stories, so it does not count as an independent confirmation.

So I cross this one out on the whiteboard for now, with a note next to it: correlation only. To close the gap I need to control for the round and the number of comparable sentences and compute it again.

The chart shows real values. Parameter settings and raw examples stay in my private notes.
