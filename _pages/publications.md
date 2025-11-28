---
layout: page
permalink: /publications/
title: Publications
description: My research publications in reversed chronological order.
nav: false 
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications">

{% bibliography -f {{ site.scholar.bibliography }} --query @*[mine=true]* %}

</div>
