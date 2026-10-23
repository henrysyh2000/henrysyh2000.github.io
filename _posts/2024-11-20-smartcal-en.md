---
title: '2024-11-20 · SMARTCAL: Choosing Tools and Calibrating Confidence'
date: '2024-11-20'
slug: smartcal
permalink: "/en/blog/smartcal/"
translation_key: smartcal
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
- tool-use
- confidence-calibration
- SMARTCAL
categories:
- research
---

SMARTCAL was my first paper, written with Xiaodan Zhu and Lei Chen and published in the EMNLP 2024 Industry Track. We studied whether a language model can assess the usefulness of a tool call and how much confidence to place in it. [Paper and authors](https://aclanthology.org/2024.emnlp-industry.59/)

## Why examine confidence in tool use?

Connecting search or code execution leaves room for mistakes in tool selection. A model may choose an irrelevant operation and still report high confidence. SMARTCAL examines this combination of misuse and overconfidence. [Research motivation](https://aclanthology.org/2024.emnlp-industry.59/)

For an illustrative example, suppose a question only requires calculating the days between two supplied dates. Searching for a person with the same name could introduce irrelevant information. When reviewing that step, I would ask what information is missing and whether the operation can supply it. This is an explanatory example, not an experimental case from the paper.

## How SMARTCAL works

![The paper's comparison of ART, ART with verbalized confidence, and SMARTCAL's three-stage pipeline](/assets/posts/smartcal/a0ea4ab1fe02bbad-smartcal-method.png)

Figure 1 from Shen, Zhu and Chen (2024). ART and its confidence-reporting variant appear on the left; SMARTCAL appears on the right. [Figure and method](https://arxiv.org/html/2412.12151v1#S2)

**Self-Evaluation (SE).** A teacher model uses task familiarity and example similarity to prepare tool-use instructions: whether internal knowledge is sufficient and which tools from demonstrations fit the question.

**Confidence Prior Collection (CPC).** The tool-use model runs on held-out development data and reports confidence at each step. Scores are averaged per question, then binned against answer accuracy to form a confidence–accuracy lookup table.

**Augmented Reasoning (AR).** The tool-use model follows the instructions. A calibration model consults the lookup table and reasoning context, edits confidence assessments and produces the final answer. Here, self-awareness refers to these evaluation procedures; it does not establish human-like consciousness. [Method, Section 2](https://arxiv.org/html/2412.12151v1#S2)

The lookup table is an empirical reference from development data. My interpretation is that changing tasks or tools calls for checking whether that reference still applies.

## What the paper found

Experiments covered ART and DSP on Mintaka, PopQA and Entity Questions. The table selects GPT-4 results to show how changes vary by dataset. These are the paper's reported results, not new runs.

| Dataset | QA: ART | QA: ART + SMARTCAL | ECE: ART (V) | ECE: ART + SMARTCAL |
| --- | ---: | ---: | ---: | ---: |
| Mintaka | 47.0% | 59.6% | 0.263 | 0.169 |
| PopQA | 55.3% | 55.7% | 0.261 | 0.201 |
| Entity Questions | 44.8% | 63.5% | 0.236 | 0.096 |

Values come from Tables 2 and 3, with QA fractions converted to percentages. **QA is compared with ART; ECE is compared with ART (V)**, which elicits verbalized confidence. The two metrics therefore use different reference baselines. [Original results](https://aclanthology.org/2024.emnlp-industry.59.pdf#page=5)

QA follows the paper's relaxed EM rule, allowing containment matches between answers and labels. ECE measures the gap between binned confidence and empirical accuracy; lower is better, but it does not guarantee that an individual answer is correct. Improvements also vary by configuration: GPT-3.5-turbo's PopQA ECE rose from 0.010 to 0.087. The appendix discusses how refusals, failed confidence extraction and default zero scores affect this metric. [Metrics and anomalous cases](https://arxiv.org/html/2412.12151v1#A2.SS2)

## Boundaries to retain

The experiments used particular dataset subsets, model versions and prompts. More complex tasks with multiple reasoning paths remain to be tested. Extra model roles also add calls; I would not interpret accuracy gains as proof of optimal cost or transfer them directly to today's models. [Limitations, Section 7](https://aclanthology.org/2024.emnlp-industry.59.pdf#page=7)

For the implementation, start with `ART_SM_CAL` in the official repository. Its README lists OpenAI, Microsoft Bing and SerpApi credentials among the requirements. This overview describes the design and reported results; it does not claim a fresh reproduction of the complete experiments. [Official code](https://github.com/Henrysyh2000/SMARTCAL)
