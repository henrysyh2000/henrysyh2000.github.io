---
title: 科研日记 01：类比的多样性从哪里来
date: '2026-10-21'
slug: research-notebook-2026-10-21-analogy-diversity
permalink: "/blog/research-notebook-2026-10-21-analogy-diversity/"
translation_key: research-notebook-2026-10-21-analogy-diversity
lang: zh-CN
locale: zh-CN
toc_label: 本页目录
layout: single
classes:
- blog-reading
- blog-with-toc
author_profile: false
read_time: false
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

先说说为什么想研究类比的多样性。最开始是和导师的讨论。他说，做类比是人类认知核心的一部分，给我推荐了一本书，Hofstadter 和 Sander 的 *Surfaces and Essences: Analogy as the Fuel and Fire of Thinking*。他还提到了 Peter Turney 的 [Domain and Function](https://arxiv.org/abs/1309.4035)。

Turney 把两种“接近”分开。主题和语境上的接近叫 domain，角色和关系上的接近叫 function。拿 `carpenter : wood :: mason : stone` 来说，木匠和木材、石匠和石材各自在自己的语境里配成一对，看的是 domain；木匠对石匠、木材对石材，对上的是角色，看的是 function。

导师的设想是，我们要研究的核心问题就在这里：模型做类比的时候，是怎么确定 domain 和 function 的。这也是我们一直在探索的问题。顺着这个思路，我们去瞅了瞅机械可解释性这边的技术。从最开始的 sparse autoencoder，到现在各种各样的 lens，甚至让模型自己解释自己的 self-explanation。最后这个问题 boils down 到一点：我还是想看它的内部轨迹。

具体的任务是：给模型一句话，让它换个情境，说一句结构相似的。模型的毛病是总在那几个领域里打转。硬逼它多样，原句的关系又容易丢。我想知道多样性在模型内部是从哪里来的。

## 假设白板

1. **轨迹幅度：写类比的时候，隐藏状态的轨迹比直白复述的时候摆得更大。**　← 今天验证
2. 句首距离：一句话开头的内部状态离前面几句越远，这一句的用词越新。
3. 神经元标注：先从人工标签池里挑，挑不出来再让模型自己提名，这两步能给大部分神经元贴上概念标签。

第 1 条是从一张图来的。拿一个模型、一条故事，把它生成每个 token 时各层的隐藏状态连成一条轨迹，投到二维平面上。写类比的时候，轨迹摆动的幅度比直白复述的时候大。今晚我一直对着这张图在想。但它只是一条故事，得先确认这不是碰巧。

另外两条是之前就在做的，先写上白板，后面一条一条来。

## 实验材料

pilot 实验主要用两个模型：LLaMA 3.1 8B Instruct 和 Gemma 2 9B Instruct。故事来自三个类比数据集。这一节只在第一篇写，后面不重复了。

## 实验

在 LLaMA 上取 40 条故事。每条故事有一句类比和一句直白复述，把两条轨迹的平均步长配成一对来比。只是观察，没有动模型。

## 结果

40 条故事里有 39 条是类比的步长更大，平均高出约 9%。那张图上看到的不是碰巧。

<div class="nb-chart" data-nb-chart="step-amplitude">交互图：类比首句与直白复述的轨迹步长（在网站上显示，可切换视图、悬停看数值）。</div>

## Insight

这只说明两种生成在模型内部长得不一样。我卡住的地方是：这个幅度会不会同时影响输出的质量和多样性？图上看到的东西，要怎么和模型的输出建立因果关系？步长本身不是质量分，也不是多样性分。

再往下想，起作用的也不一定是幅度，也可能是轨迹偏到了别的概念上。到底是走得远决定了多样性，还是往哪儿偏决定了多样性，光靠看图分不出来，得直接去动隐藏状态。这两条我下一篇写上白板。

图里是真实数值。参数配置和原始样例留在私人笔记里。

btw 今天在放的是 Men at Work 的 Down Under
