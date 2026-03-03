# CLAUDE.md — vargocity-site

Personal website built with React + Vite + Tailwind CSS v4.

## Project layout

```
vargocity-site/        ← repo root (also git root)
  vargocity-site/      ← actual app (nested from Vite scaffold)
    src/
      App.jsx           ← router + layout shell
      pages/            ← one file per route (HomePage, AboutPage, …)
      components/       ← subdirs per section (home, about, research, making, adventures, writing, layout, shared)
      content/          ← markdown source files
        about.md
        blog/           ← blog posts (frontmatter + body)
        newsletter/     ← newsletter posts
        vreadings/      ← reading notes
      data/             ← static JSON (countries, furniture, peaks, publications, scholar, tools)
      lib/
        loadContent.js  ← loads + parses markdown at build time via import.meta.glob
      index.css
      main.jsx
    index.html
    vite.config.js
    package.json
```

## Routes

| Path | Page |
|------|------|
| `/` | HomePage |
| `/about` | AboutPage |
| `/research` | ResearchPage |
| `/making` | MakingPage |
| `/adventures` | AdventuresPage |
| `/writing/*` | WritingPage |

Unmatched paths redirect to `/`.

## Key tech

- **React 19** with React Router v7
- **Vite 7** — dev server and build tool
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **react-markdown** + **remark-gfm** for rendering markdown content
- **gray-matter** (available but markdown parsing is currently done manually in `loadContent.js`)
- **react-simple-maps** for map components

## Content authoring

Markdown files live in `src/content/`. Frontmatter fields:

```
---
title: "Post title"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
excerpt: "Short description"
source: ""        # for vreadings
book: ""          # for vreadings
book_author: ""   # for vreadings
---
```

Posts are loaded with `import.meta.glob` (build-time), sorted by date descending.

## Dev commands

```bash
cd vargocity-site   # enter the app directory
npm run dev         # start dev server
npm run build       # production build
npm run preview     # preview production build
npm run lint        # run ESLint
```

## Base URL

Configured via `VITE_BASE_URL` env var (defaults to `/`). Set this for subdirectory deployments.
