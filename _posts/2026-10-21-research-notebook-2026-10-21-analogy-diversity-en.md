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

This entry reflects on an exploratory direction that has not yet produced a reliable way to improve analogy generation. I wanted to understand whether changes in a language model's internal states could help it produce more varied analogies while preserving relationships. This public version retains the questions, approach, and reflections; measurements, parameter settings, configurations, and full analyses remain in my private notes.

## What I was trying to understand

An analogy should offer a new perspective while preserving important relationships in the original sentence. Different words do not necessarily imply a different context, and a different context does not guarantee that the relationship survives. I wanted to understand whether internal-state changes could help explain these distinctions and provide a basis for later interventions.

## What this direction has not established

I observed associations worth investigating and explored connections between internal representations and concepts. These explorations did not establish a causal mechanism or a reliable method for improving analogy generation. For now, I treat this as an unsuccessful exploratory direction rather than an established mechanistic explanation.

Lexical variation, contextual variation, and relational preservation need separate judgments. Geometric differences cannot directly replace quality evaluation, and local observations do not explain how the complete mechanism works.

## Later reading: Turney's domain and function

I added this reading on October 23, 2026; it is separate from the experimental progress recorded on the original date. In [Domain and Function], Peter Turney distinguishes similarity in topic and context from similarity in roles and relational usage.

For `carpenter : wood :: mason : stone`, each artisan pairs with a material in its own context, while artisan and material are the corresponding roles across pairs. Domain helps assess contextual grouping; function helps assess role correspondence. They work together, without implying that greater distance between domains is always better. [The paper's discussion of pairings]

For my work, this suggests checking whether a relationship survives before asking how its context changes. It remains a way to organize the question, not evidence that language models contain independent representation subspaces for domain and function.

## What I take from it

I need to distinguish looking different from forming a valid analogy, and observation from causal explanation. An unsuccessful exploration can still clarify what evidence I need to test my intuitions next.
