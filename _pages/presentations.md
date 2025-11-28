---
layout: page
permalink: /presentations/
title: Presentations
description: Selected presentation slides from seminars, workshops, and conferences.
nav: true
nav_order: 3
---

<div class="presentations">

<!-- Featured: Seminar Series -->
{% assign series = site.data.presentations.seminar_series %}
<h2 class="presentations-section-title">Featured: Seminar Series</h2>

<div class="presentation-item featured-presentation">
  <div class="presentation-header">
    <span class="presentation-title">{{ series.title }}</span>
    <span class="presentation-event">{{ series.event }} · {{ series.year }}</span>
  </div>
  
  {% if series.description %}
  <p class="presentation-description">{{ series.description }}</p>
  {% endif %}
  
  <div class="presentation-materials">
    {% for material in series.materials %}
      <a href="{{ material.url | relative_url }}" class="material-link material-{{ material.type }}" target="_blank">
        {% if material.type == 'slides' %}
          <i class="fa-solid fa-file-powerpoint"></i>
        {% elsif material.type == 'poster' %}
          <i class="fa-solid fa-image"></i>
        {% elsif material.type == 'video' %}
          <i class="fa-solid fa-video"></i>
        {% endif %}
        {{ material.title }}
      </a>
    {% endfor %}
  </div>
</div>

<!-- External Presentations Section -->
<h2 class="presentations-section-title">External Presentations</h2>

{% assign sorted_external = site.data.presentations.external | sort: "year" | reverse %}
{% assign current_year = nil %}

{% for item in sorted_external %}
  {% if item.year != current_year %}
    {% assign current_year = item.year %}
    <h3 class="presentations-year">{{ current_year }}</h3>
  {% endif %}
  
  <div class="presentation-item">
    <div class="presentation-header">
      <span class="presentation-title">{{ item.title }}</span>
      <span class="presentation-event">{{ item.event }}</span>
    </div>
    
    {% if item.description %}
    <p class="presentation-description">{{ item.description }}</p>
    {% endif %}
    
    <div class="presentation-materials">
      {% for material in item.materials %}
        <a href="{{ material.url | relative_url }}" class="material-link material-{{ material.type }}" {% if material.type == 'blog' %}{% else %}target="_blank"{% endif %}>
          {% if material.type == 'slides' %}
            <i class="fa-solid fa-file-powerpoint"></i>
          {% elsif material.type == 'poster' %}
            <i class="fa-solid fa-image"></i>
          {% elsif material.type == 'blog' %}
            <i class="fa-solid fa-blog"></i>
          {% elsif material.type == 'video' %}
            <i class="fa-solid fa-video"></i>
          {% endif %}
          {{ material.title }}
        </a>
      {% endfor %}
    </div>
  </div>
{% endfor %}

<!-- Internal Presentations Section -->
<h2 class="presentations-section-title">Internal Presentations</h2>
<p class="presentations-section-description">{{ site.data.presentations.internal.description }}</p>

{% for item in site.data.presentations.internal.items %}
  <div class="presentation-item">
    <div class="presentation-header">
      <span class="presentation-title">{{ item.title }}</span>
    </div>
    
    {% if item.description %}
    <p class="presentation-description">{{ item.description }}</p>
    {% endif %}
    
    <div class="presentation-materials">
      {% for material in item.materials %}
        <a href="{{ material.url | relative_url }}" class="material-link material-{{ material.type }}" target="_blank">
          {% if material.type == 'slides' %}
            <i class="fa-solid fa-file-powerpoint"></i>
          {% elsif material.type == 'poster' %}
            <i class="fa-solid fa-image"></i>
          {% elsif material.type == 'blog' %}
            <i class="fa-solid fa-blog"></i>
          {% elsif material.type == 'video' %}
            <i class="fa-solid fa-video"></i>
          {% endif %}
          {{ material.title }}
        </a>
      {% endfor %}
    </div>
  </div>
{% endfor %}

</div>