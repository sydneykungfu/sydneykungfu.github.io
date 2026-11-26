# Home Page SBS Media Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a text-only "As featured on SBS Cantonese" strip to the testimonials section of the three home pages, right above the Join button.

**Architecture:** Static Jekyll site. Each home page gets the same small HTML block, hand-inserted with that page's language copy. No new include and no new CSS: the testimonials section already uses inline styles, so the strip does too. That means no Tailwind rebuild.

**Tech Stack:** Jekyll (Docker), plain HTML with inline styles.

**Spec:** `docs/superpowers/specs/2026-11-26-home-media-strip-design.md`

## Global Constraints

- Insert point on every page: inside `<section id="testimonials">`, after the closing `</div>` of the testimonial grid and before the `<!-- CTA -->` div.
- All links go to `/media-coverage.html` (absolute path, so it works from `/zh/` and `/zh-CN/`). No anchors, no external links, no `target="_blank"`.
- Text only: no SBS logo, no images, no iframes.
- Inline styles only. Do not add Tailwind classes that may be missing from `assets/css/tailwind.min.css`.
- Do not touch the existing "🎙️ Featured on Media" link in the English Sifu section.
- QA in Jekyll Docker (README "Start Jekyll site"): mobile first, then desktop.

## Review Focus

- Narrow phones (320–375px): the two episode lines must wrap cleanly with no sideways scroll. Check at 320px as well as 375px.
- Mixed Chinese/English titles (`Startup Eats Guide 創業搵食GUIDE`) must not overflow the 800px container. Allow normal wrapping and don't use `white-space: nowrap` on the titles.
- Links from `/zh/` and `/zh-CN/` must resolve to `/media-coverage.html`, not `/zh/media-coverage.html` (which doesn't exist). Check this in the built `_site`.
- Link colour must stay readable on the `#f9f9f9` background. Use the site's existing link blue (`#2563eb`, same as `text-blue-600`).
- The Join button must still sit directly below the strip, with no extra gap from stacked margins.

---

### Task 1: English strip on `index.html`

**Files:**
- Modify: `index.html` (inside `#testimonials`, between the testimonial grid's closing `</div>` and `<!-- CTA -->`, around line 325)

**Interfaces:**
- Produces: the block below. Tasks 2 and 3 copy its structure and styles exactly, changing only the text.

- [ ] **Step 1: Check the strip is not there yet**

Run: `grep -c "As featured on SBS Cantonese" index.html`
Expected: `0`

- [ ] **Step 2: Insert the block (copy is fixed by the spec)**

```html
      <!-- Media strip -->
      <div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.75rem;">As featured on SBS Cantonese</p>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1.5rem;">
          <a href="/media-coverage.html" style="color: #2563eb;">Now Showing 光影會客室 · Nov 2026</a>
          <a href="/media-coverage.html" style="color: #2563eb;">Startup Eats Guide 創業搵食GUIDE · Jun 2026</a>
        </div>
        <p style="margin-top: 0.75rem;"><a href="/media-coverage.html" style="color: #2563eb; font-weight: 600;">Watch the interviews →</a></p>
      </div>
```

- [ ] **Step 3: Verify the built page**

With the Jekyll container running, run: `grep -c "As featured on SBS Cantonese" _site/index.html`
Expected: `1`

- [ ] **Step 4: Browser QA**

Open `http://localhost:4000/` at 320px, then 375px, then 1280px. Expected: the strip shows between the quotes and the Join button, `document.documentElement.scrollWidth > innerWidth` is `false`, and all three links open `/media-coverage.html`.

- [ ] **Step 5: Commit**

```bash
git add index.html docs/superpowers/specs/2026-11-26-home-media-strip-design.md docs/superpowers/plans/2026-11-26-home-media-strip.md
git commit -m "feat: add SBS media strip to English home page"
```

### Task 2: Chinese strips on `zh/index.html` and `zh-CN/index.html`

**Files:**
- Modify: `zh/index.html` (inside `#testimonials`, before `<!-- CTA -->`, around line 192)
- Modify: `zh-CN/index.html` (same place, around line 192)

**Interfaces:**
- Consumes: the Task 1 block. Use the same markup and styles, with only the text replaced as follows.

| Text | `zh/index.html` | `zh-CN/index.html` |
|---|---|---|
| Label | SBS 廣東話節目專訪 | SBS 粤语节目专访 |
| Episode 1 | 光影會客室 · 2026年11月 | 光影会客室 · 2026年11月 |
| Episode 2 | 創業搵食GUIDE · 2026年6月 | 创业揾食GUIDE · 2026年6月 |
| Watch link | 觀看訪問 → | 观看访问 → |

- [ ] **Step 1: Check neither page has the strip yet**

Run: `grep -c "SBS 廣東話節目專訪" zh/index.html; grep -c "SBS 粤语节目专访" zh-CN/index.html`
Expected: `0` and `0`

- [ ] **Step 2: Insert the translated blocks**

- [ ] **Step 3: Verify built pages and link paths**

Run: `grep -c "SBS 廣東話節目專訪" _site/zh/index.html; grep -c "SBS 粤语节目专访" _site/zh-CN/index.html; grep -c 'href="media-coverage.html"' zh/index.html zh-CN/index.html`
Expected: `1`, `1`, then `0` for both files (only the absolute `/media-coverage.html` is used)

- [ ] **Step 4: Browser QA**

Open `http://localhost:4000/zh/` and `http://localhost:4000/zh-CN/` at 320px, then 375px, then 1280px. Expected: the same checks as Task 1, Step 4.

- [ ] **Step 5: Commit**

```bash
git add zh/index.html zh-CN/index.html
git commit -m "feat: add SBS media strip to Chinese home pages"
```
