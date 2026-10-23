---
title: "Technical Blog"
permalink: /en/blog/
layout: archive
author_profile: false
lang: en
locale: en
---

[All articles](/blog/) · [Henry’s Research Notebook](/en/blog/columns/research-notebook/)

Technical explorations, lessons from experiments, and reflections on research.

{% assign entries = site.posts | where_exp: 'item', 'item.hidden != true' %}
{% assign entries = entries | where_exp: 'item', 'item.lang == "en" or item.lang == nil' %}
{% for entry in entries %}
## [{{ entry.title }}]({{ entry.url | relative_url }})

{{ entry.date | date: "%Y-%m-%d" }}

{% endfor %}
