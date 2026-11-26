# Home page "As featured on SBS" strip — design

Date: 2026-11-26 · Size: small change

## Why

Sifu Angus has two SBS Cantonese interviews (光影會客室, Nov 2026; 創業搵食GUIDE, Jun 2026).
The goal is to **build trust before a visitor books a trial**. Today only the English home page
mentions media, through a small grey link in the Sifu section. The Chinese home pages have no media link.

## Goals / non-goals

- Goal: a visible "As featured on SBS Cantonese" mention right where visitors decide to book.
- Goal: the same strip on all three home pages (`index.html`, `zh/index.html`, `zh-CN/index.html`).
- Non-goal: embedding video on the home pages (too heavy on mobile and pushes booking down).
- Non-goal: a Chinese media page. The Chinese home pages link to the English `/media-coverage.html` for now.
- Anti-goal: anything that makes the home page slower or pushes the Join button further down
  than a few lines.

## Approaches considered

1. **Testimonials strip** (picked): text-only block inside the testimonials section, between the student
   quotes and the Join button. No page weight, and it sits right at the point of booking.
2. Thumbnail cards in the Sifu section: more eye-catching, but it adds two images and sits away from the booking button.
3. Embedded YouTube section: most convincing if played, but heaviest on mobile and adds a second video
   after the Instagram demo.

## Design

In each home page's `#testimonials` section, insert this block after the testimonial grid and before
the `<!-- CTA -->` div:

```
── As featured on SBS Cantonese ──          (small, uppercase, grey label)
Now Showing 光影會客室 · Nov 2026            (link → /media-coverage.html)
Startup Eats Guide 創業搵食GUIDE · Jun 2026  (link → /media-coverage.html)
Watch the interviews →                      (link → /media-coverage.html)
```

- Styling: match the section's existing inline-style approach (the testimonials section uses inline
  styles, not Tailwind classes), so no Tailwind rebuild is needed. The two episode lines stack on mobile
  and may sit side by side on desktop.
- Chinese copy:
  - zh (Traditional): label 「SBS 廣東話節目專訪」, link 「觀看訪問 →」, titles 光影會客室 / 創業搵食GUIDE, dates 2026年11月 / 2026年6月.
  - zh-CN (Simplified): label 「SBS 粤语节目专访」, link 「观看访问 →」, titles 光影会客室 / 创业揾食GUIDE, dates 2026年11月 / 2026年6月.
- Links stay on site (to the media page), not straight out to SBS/YouTube, so visitors remain one
  click from booking.

## Calls I made (check these)

- The existing small "🎙️ Featured on Media" link in the English Sifu section stays as it is.
- No SBS logo: text only, to avoid using SBS's brand mark without permission.
- Every link points to `/media-coverage.html` (no anchors to individual cards).

## QA

Jekyll in Docker. Check mobile first, then desktop, on all three home pages. Check that nothing scrolls sideways and
that the Join button still sits directly under the strip.
