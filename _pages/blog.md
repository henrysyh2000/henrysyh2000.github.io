---
title: "技术博客"
permalink: /blog/
layout: archive
author_profile: false
lang: zh-CN
locale: zh-CN
translations:
  zh-CN: /blog/
  en: /en/blog/
---

[中文](/blog/) · [English](/en/blog/)

[全部文章](/blog/) · [All articles](/en/blog/) · [亨利的科研日记本](/blog/columns/research-notebook/) · [Henry’s Research Notebook](/en/blog/columns/research-notebook/)

记录科研中的问题、实验中的发现，以及慢慢想清楚的事情。

{% assign entries = site.posts | where_exp: 'item', 'item.hidden != true' %}
{% assign entries = entries | where: 'lang', 'zh-CN' %}
{% for entry in entries %}
## [{{ entry.title }}]({{ entry.url | relative_url }})

{{ entry.date | date: "%Y-%m-%d" }}

{% endfor %}
