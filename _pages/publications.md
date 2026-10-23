---
permalink: /publications/
layout: archive
title: Publications
classes: publications-page
author_profile: false
---

<p class="page-intro">My work on large language models, interdisciplinary research, and reliable tool use.</p>

<div class="home-papers">
  {% for paper in site.data.publications %}
    {% include publication-row.html paper=paper heading='h2' %}
  {% endfor %}
</div>
