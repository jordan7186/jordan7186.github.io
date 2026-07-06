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

<!-- Conference/Seminars Section -->
<h2 class="presentations-section-title">Conference/Seminars etc.</h2>

{% assign sorted_conference_seminars = site.data.presentations.conference_seminars | sort: "year" | reverse %}
{% assign current_year = nil %}

{% for item in sorted_conference_seminars %}
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

<!-- LGAI Presentations Section -->
<h2 class="presentations-section-title">Presentations @LGAI</h2>

{% assign sorted_lgai = site.data.presentations.lgai | sort: "year" | reverse %}
{% assign current_year = nil %}

{% for item in sorted_lgai %}
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

<!-- Yonsei Presentations Section -->
<h2 class="presentations-section-title">Presentations @Yonsei</h2>
<p class="presentations-section-description">{{ site.data.presentations.yonsei.description }}</p>

{% for item in site.data.presentations.yonsei.items %}
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
