---
permalink: /publications/
layout: archive
title: Publications
---

<div class="publication-list">
  {% for paper in site.data.publications %}
  <article class="publication">
    <a class="publication__link" href="{{ paper.arxiv }}" target="_blank" rel="noopener noreferrer" aria-label="{{ paper.title | escape }} — view on arXiv (opens in a new tab)">
      <div class="publication__thumbnail">
        <img src="{{ paper.image | relative_url }}" alt="{{ paper.image_alt | escape }}" width="600" height="400" loading="lazy" decoding="async">
      </div>
      <div class="publication__body">
        <h2 class="publication__title">{{ paper.title | escape }}</h2>
        <p class="publication__venue">({{ paper.venue | escape }})</p>
        <span class="publication__arxiv">arXiv <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  </article>
  {% endfor %}
</div>
