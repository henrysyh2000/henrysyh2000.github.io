---
title: "Henry’s Research Notebook"
permalink: /blog/columns/research-notebook/
layout: archive
author_profile: false
lang: en
locale: en
series: research-notebook
---

[All articles](/blog/) · [Henry’s Research Notebook](/en/blog/columns/research-notebook/)

Questions from research, observations from experiments, and ideas that become clearer along the way.

{% assign entries = site.posts | where_exp: 'item', 'item.hidden != true' %}
{% assign entries = entries | where_exp: 'item', 'item.lang == "en" or item.lang == nil' %}
{% assign entries = entries | where: 'series', 'research-notebook' %}
{% for entry in entries %}
## [{{ entry.title }}]({{ entry.url | relative_url }})

{{ entry.date | date: "%Y-%m-%d" }}

{% endfor %}
