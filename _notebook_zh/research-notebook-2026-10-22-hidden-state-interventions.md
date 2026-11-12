---
title: 科研日记 02：句首距离
date: '2026-10-22'
slug: research-notebook-2026-10-22-hidden-state-interventions
permalink: "/blog/research-notebook-2026-10-22-hidden-state-interventions/"
translation_key: research-notebook-2026-10-22-hidden-state-interventions
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

这一篇验证白板上的第 2 条。

## 假设白板

1. ~~轨迹幅度：写类比的时候，隐藏状态的轨迹比直白复述的时候摆得更大。~~ 01 验证过：成立，但只是观察。
2. **句首距离：一句话开头的内部状态离前面几句越远，这一句的用词越新。**　← 今天验证
3. 神经元标注：先从人工标签池里挑，挑不出来再让模型自己提名，这两步能给大部分神经元贴上概念标签。
4. 推得越远越多样：把隐藏状态推得越远，输出越多样。（新）
5. 往哪儿推比推多远要紧：沿概念方向推，比沿同样大小的随机方向推，更能增加多样性。（新）

新加的两条是上一篇留下来的。幅度的差别是有了，但到底是走得远决定了多样性，还是往哪儿偏决定了多样性，光看图分不出来。我想用 steering 去干预，把这两样分开看，所以先把它们写上白板。

第 2 条是之前探索的时候就有的猜想。让模型围绕同一句话连着写好几个类比，如果某一句开头的内部状态离前面几句的开头越远，这一句的用词应该越新。

## 实验

在三个数据集、四种类比条件下循环生成。对每一句，算它的句首状态到此前各句句首状态的最小距离，再和这一句相对此前句子的词面新颖性求相关。相关多大才算数，是事先定好的。

## 结果

所有数据集和条件下，相关都过了事先定的线。

<div class="nb-chart" data-nb-chart="onset-correlation">交互图：句首距离与词面新颖性的相关（在网站上显示，可切换视图、悬停看数值）。</div>

## Insight

相关是有了，但我不敢说这一条就成立。

有个漏洞还没堵上。越往后写，前面能拿来比的句子越多，句首距离和词面新颖性有可能只是一起跟着轮次在变。

另外，这个指标是我看过早先的探索结果之后才选定的，这次用的又是同一批故事，算不上独立的确认。

所以白板上这一条我先划掉，旁边记一笔：只到相关。要堵那个漏洞，得把轮次和可比的句子数控制住再算一遍。

图里是真实数值。参数配置和原始样例留在私人笔记里。
