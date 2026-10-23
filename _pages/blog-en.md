---
title: "Technical Blog"
permalink: /en/blog/
layout: archive
author_profile: false
lang: en
locale: en
translations:
  zh-CN: /blog/
  en: /en/blog/
---

[中文](/blog/) · [English](/en/blog/)

[全部文章](/blog/) · [All articles](/en/blog/) · [亨利的科研日记本](/blog/columns/research-notebook/) · [Henry’s Research Notebook](/en/blog/columns/research-notebook/)

Questions from research, observations from experiments, and ideas that become clearer along the way.

{% assign entries = site.posts | where_exp: 'item', 'item.hidden != true' %}
{% assign entries = entries | where_exp: "item", "item.lang == 'en' or item.lang == nil" %}
{% for entry in entries %}
## [{{ entry.title }}]({{ entry.url | relative_url }})

{{ entry.date | date: "%Y-%m-%d" }}

{% endfor %}
