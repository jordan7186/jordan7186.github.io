# Website Writing Guide

This guide documents how to add content to the website, including blog posts, publications, presentations, and news items.

---

## Table of Contents

1. [Blog Posts](#blog-posts)
2. [Publications](#publications)
3. [Presentations](#presentations)
4. [News Items](#news-items)
5. [File Locations](#file-locations)

---

## Blog Posts

Blog posts are stored in `_posts/` and use the naming convention:

```
YYYY-MM-DD-Title_with_underscores.md
```

### Front Matter Template

```yaml
---
layout: post
title: Your Post Title
description: A brief description shown in the blog list and as subtitle
date: YYYY-MM-DD
featured: true  # Optional: highlights the post
giscus_comments: true  # Enable comments

# Optional fields
tldr: A one-sentence summary shown at the top of the post
abstract: A longer abstract/summary (alternative to tldr)
author: Your Name  # If different from site author

# Optional: Series (for multi-part posts)
series: series-id  # Must match an id in _data/series.yml
series_part: 1     # Which part of the series this is

# Optional: Table of Contents
toc:
  sidebar: left  # or 'right'

# Optional: References (rendered at bottom)
references:
  - authors: "Author Name et al."
    title: "Paper Title"
    venue: "Conference/Journal"
    year: 2024
    url: "https://..."
---
```

### Writing Content

- Use standard Markdown syntax
- Math equations: Use `$...$` for inline, `$$...$$` for display
- Images: Place in `assets/img/` and reference with `![alt text](/assets/img/filename.png)`
- Code blocks: Use triple backticks with language identifier

### Wide Content (Code, Figures, Tables)

Code blocks, figures, and tables automatically expand to 1200px width for better readability, while regular text stays at 800px.

---

## Blog Series

Group related posts into a series for better navigation and discoverability.

### Creating a Series

1. Add a series definition to `_data/series.yml`:

```yaml
- id: my-series-id
  title: "My Series Title"
  description: "A brief description of what this series covers"
  posts:
    - slug: "2024-01-01-first-post"
      part: 1
      title: "Part 1: Introduction"
    - slug: "2024-01-15-second-post"
      part: 2
      title: "Part 2: Deep Dive"
```

2. Add series metadata to each post's front matter:

```yaml
---
layout: post
title: "Part 1: Introduction"
series: my-series-id
series_part: 1
---
```

### What Happens

- **Blog Index**: Series appear as cards at the top of the blog page (on page 1)
- **In Posts**: A navigation box shows at the top with prev/next links to other parts
- **Discovery**: Readers can easily find and navigate through related content

### Current Series

| Series ID | Title | Posts |
|-----------|-------|-------|
| `graph-spectral` | Graph Signal Processing | Cora Spectral → ChebConv |
| `gnn-fundamentals` | GNN Fundamentals | SSL Methods → Efficiency |

---

## Advanced Blog Features

The blog supports several advanced features for research-level writing. See the [showcase post](/blog/2024/advanced-features-showcase/) for live examples.

### Numbered Figures

Wrap figures in the `figure-numbered` class for automatic numbering:

```html
{% raw %}<figure class="figure-numbered">
{% include figure.html path="/assets/img/your-image.jpg" class="img-fluid rounded z-depth-1" %}
<figcaption>Your caption text here.</figcaption>
</figure>{% endraw %}
```

Or for more complex layouts:

```html
{% raw %}<figure class="figure-numbered">
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="/assets/img/your-image.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<figcaption>Your caption text here.</figcaption>
</figure>{% endraw %}
```

Figures are numbered automatically (Figure 1, Figure 2, etc.) within each post. Note: Use `<figcaption>` instead of `<div class="caption">` for proper numbering.

### Sidenotes and Footnotes

**Sidenotes** appear in the right margin on wide screens (inline on mobile):

```html
Main text<span class="sidenote">This note appears in the margin.</span> continues here.
```

**Footnotes** use standard Markdown syntax and appear at the bottom of the page:

```markdown
Main text with a footnote[^1] continues here.

[^1]: This is the footnote content that appears at the bottom.
```

### Equation Numbering

Use LaTeX environments for numbered equations:

```latex
$$
\begin{equation}
E = mc^2
\label{eq:einstein}
\end{equation}
$$

Reference with: Equation \eqref{eq:einstein}
```

For multiple aligned equations:

```latex
$$
\begin{align}
a &= b + c \label{eq:first}\\
d &= e + f \label{eq:second}
\end{align}
$$
```

### Code Blocks

Use standard Markdown fenced code blocks with language identifiers:

````markdown
```python
def hello():
    print("Hello, world!")
```
````

Supported languages include `python`, `julia`, `javascript`, `bash`, and many more.

### Citation Hover Previews

Add inline citations with hover previews:

```html
<span class="citation" data-preview="Author et al. (2024). Paper Title. Conference.">[Author et al., 2024]</span>
```

### Section Numbering (Optional)

For long technical posts, add the `numbered-sections` class to enable automatic section numbering in your custom CSS or page-specific styles.

---

## Publications

Publications are managed in `_bibliography/papers.bib` using BibTeX format.

### Adding a New Publication

Add a new entry to `_bibliography/papers.bib`:

```bibtex
@inproceedings{AuthorYYYYKeyword,
    author = {First Author and Second Author and Third Author},
    title = {Your Paper Title},
    booktitle = {Conference Name},
    year = {2025},
    month = {Feb.},
    
    % Required for display
    abbr = {CONF},           % Short venue abbreviation (shown as badge)
    mine = {true},           % REQUIRED: Only entries with mine=true appear
    
    % Optional but recommended
    selected = {true},       % Show in "Selected Publications" on homepage
    html = {https://...},    % Link to paper page
    pdf = {filename.pdf},    % PDF in assets/pdf/
    
    % Other optional fields
    abstract = {Your abstract text},
    address = {City, Country},
    code = {https://github.com/...},
    poster = {poster.pdf},
    slides = {slides.pdf},
    blog = {/blog/YYYY/post-name/},
}
```

### Entry Types

- `@inproceedings` - Conference papers
- `@article` - Journal papers
- `@misc` - Preprints, arXiv

### Key Fields

| Field | Description |
|-------|-------------|
| `mine = {true}` | **Required** to appear on Publications page |
| `selected = {true}` | Appears in "Selected Publications" on homepage |
| `abbr` | Venue badge (e.g., AAAI, ICML, PAMI) |
| `pdf` | Filename in `assets/pdf/` |
| `html` | External link (arXiv, publisher) |

### Venue Colors

Custom venue colors can be defined in `_data/venues.yml`:

```yaml
AAAI:
  color: "#1E88E5"
  url: "https://aaai.org"
```

---

## Presentations

Presentations are managed in `_data/presentations.yml`.

### Structure

The file has three sections:

1. **seminar_series** - Featured seminar series (shown at top)
2. **external** - External presentations (conferences, invited talks)
3. **internal** - Internal presentations (lab meetings, reading groups)

### Adding an External Presentation

```yaml
external:
  - title: "Your Presentation Title"
    event: "Conference/Event Name"
    year: 2025
    description: >
      A description of the presentation. You can use HTML like 
      <a href="https://arxiv.org/...">arxiv link</a> here.
    materials:
      - type: slides
        title: "Presentation Slides"
        url: "/assets/pdf/your_slides.pdf"
      - type: poster
        title: "Conference Poster"
        url: "/assets/pdf/your_poster.pdf"
      - type: video
        title: "Recording"
        url: "https://youtube.com/..."
      - type: blog
        title: "Blog Post"
        url: "/blog/YYYY/post-name/"
```

### Adding an Internal Presentation

```yaml
internal:
  items:
    - title: "Topic Name"
      description: >
        Description of the presentation and context.
      materials:
        - type: slides
          title: "Slide Title"
          url: "/assets/pdf/filename.pdf"
```

### Material Types

- `slides` - Presentation slides (PDF)
- `poster` - Conference poster (PDF)
- `video` - Video recording (external link)
- `blog` - Accompanying blog post (internal link)

---

## News Items

News items are stored in `_news/` as individual Markdown files.

### Creating a News Item

Create a file `_news/announcement_N.md`:

```markdown
---
layout: post
date: YYYY-MM-DD
inline: true
related_posts: false
---

Your news content here. You can use **Markdown** and include 
[links](https://example.com).
```

### Options

- `inline: true` - Content appears directly in news list
- `inline: false` - Shows as a link to a separate page (add `title:` field)

### Example (Inline)

```markdown
---
layout: post
date: 2025-02-01
inline: true
related_posts: false
---

Paper accepted at **AAAI 2025**! 🎉
```

### Example (Separate Page)

```markdown
---
layout: post
title: "AAAI 2025 Paper Accepted"
date: 2025-02-01
inline: false
related_posts: false
---

Full content of the news item...
```

---

## File Locations

| Content Type | Location |
|-------------|----------|
| Blog posts | `_posts/YYYY-MM-DD-title.md` |
| Publications | `_bibliography/papers.bib` |
| Presentations | `_data/presentations.yml` |
| News items | `_news/announcement_N.md` |
| PDF files | `assets/pdf/` |
| Images | `assets/img/` |
| Profile image | `assets/img/profile.jpg` |

---

## Building & Testing

To test locally:

```bash
bundle exec jekyll serve
```

Then open `http://localhost:4000` in your browser.

---

## Quick Reference

### Blog Post Checklist

- [ ] File named `YYYY-MM-DD-title.md` in `_posts/`
- [ ] Front matter includes `layout: post`, `title`, `description`, `date`
- [ ] Images placed in `assets/img/`
- [ ] PDFs placed in `assets/pdf/`

### Publication Checklist

- [ ] Added to `_bibliography/papers.bib`
- [ ] Includes `mine = {true}` (required to display)
- [ ] Includes `abbr` for venue badge
- [ ] PDF uploaded to `assets/pdf/` if available
- [ ] Set `selected = {true}` if should appear on homepage

### Presentation Checklist

- [ ] Added to appropriate section in `_data/presentations.yml`
- [ ] Includes `title`, `event`, `year`
- [ ] Materials uploaded to `assets/pdf/`
- [ ] Material URLs start with `/assets/pdf/` for local files

### News Checklist

- [ ] File created in `_news/`
- [ ] Includes `date` in front matter
- [ ] Set `inline: true` for short announcements
