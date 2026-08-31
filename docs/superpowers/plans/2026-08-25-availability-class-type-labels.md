# Availability Class-Type Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Label each time-slot option in the enrollment wizard's "What days/times are you choose for training?" question with which class type it is (Adult Class vs Kid Class), on all three language pages.

**Architecture:** The wizard's Availability checkbox options currently show only venue/day/time (e.g. "Marsfield Park - Saturday 9:30-11:30AM"), with no indication of whether that slot is the Adult or Kid class — even though the site's schedule cards (`_includes/schedule-cards-en.html`) already distinguish them clearly ("Saturday · Adult & Youth" vs "Saturday · Kid & Youth"). This plan appends a `(Adult Class)` / `(Kid Class)` suffix to both the visible label and the submitted `value` of each of the 4 time-slot checkboxes, across all 3 wizard include files, using `_includes/schedule-cards-en.html` as the source of truth for which slot is which class type.

**Tech Stack:** Jekyll (Liquid includes), no build step for this change — plain HTML edits to existing `_includes/enroll-wizard*.html` files.

**Spec:** `docs/superpowers/specs/2026-08-21-trackable-enrollment-form-design.md` (original enrollment form spec). This specific follow-up (which options change, and how) was clarified directly with the site owner in conversation rather than in a written spec addendum — see Global Constraints below for the exact resolution.

## Global Constraints

- Only the 4 time-slot checkbox options change (Marsfield ×2, Outside PCYC Hornsby ×2). "Private Class" and "Other:" are unchanged — private classes aren't tied to a single class-type slot.
- Both the visible **label** and the submitted **`value`** get the suffix (not label-only) — the whole point is that the Sheet data itself should show which class type someone picked, not just the on-screen display.
- Class-type mapping (source of truth: `_includes/schedule-cards-en.html`, confirmed against its "Adult & Youth" / "Kid & Youth" card headers):
  - Marsfield Park - Saturday 9:30-11:30AM → **Adult Class**
  - Marsfield Park - Saturday 11:45-12:45PM → **Kid Class**
  - Outside PCYC Hornsby - Tuesday 6:00-7:00pm → **Kid Class**
  - Outside PCYC Hornsby - Tuesday 7:15-8:15pm → **Adult Class**
- English suffix text is `(Adult Class)` / `(Kid Class)` (with a leading space before the opening parenthesis, standard ASCII parentheses) on the English page. On the zh and zh-CN pages, the **value** stays in English exactly matching the English page's new value (Sheet data consistency across all 3 language pages — an existing, already-established convention in these files), while the **label** shows a Chinese suffix: `（成人班）` for Adult Class and `（兒童班）` (zh, Traditional) / `（儿童班）` (zh-CN, Simplified) for Kid Class, using full-width Chinese parentheses to match the surrounding CJK text (no leading space, following existing convention in these files where CJK punctuation abuts the preceding character).
- Location names (`Marsfield Park`, `Outside PCYC Hornsby`) and the site's other existing translation conventions (day-of-week translated, time kept in English digits) are unchanged — this plan only appends the new class-type suffix, it does not touch anything else on this line.
- No automated test suite exists in this repo (static Jekyll site). Verification is done via a live browser against the running Jekyll dev server, not unit tests.
- No changes needed to `assets/js/enroll-form.js` or the Apps Script backend — `availability` is collected and stored as a free-text/joined string already; no code depends on the exact old value strings.

---

### Task 1: Add class-type suffixes to all 3 wizard include files

**Files:**
- Modify: `_includes/enroll-wizard.html:82-85`
- Modify: `_includes/enroll-wizard-zh.html:82-85`
- Modify: `_includes/enroll-wizard-zh-CN.html:82-85`

**Interfaces:**
- Consumes: nothing new — these are leaf HTML edits inside an existing `data-type="checkbox-group"` wrapper that `assets/js/enroll-form.js` already validates and collects via `collectChecked('availability')` (unchanged, no JS work needed).
- Produces: nothing new consumed elsewhere — the `availability` field's submitted string just gets richer content.

- [ ] **Step 1: Update `_includes/enroll-wizard.html`**

Replace lines 82-85:

```html
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM"> Marsfield Park - Saturday 9:30-11:30AM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM"> Marsfield Park - Saturday 11:45-12:45PM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 6:00-7:00pm"> Outside PCYC Hornsby - Tuesday 6:00-7:00pm</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 7:15-8:15pm"> Outside PCYC Hornsby - Tuesday 7:15-8:15pm</label>
```

with:

```html
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM (Adult Class)"> Marsfield Park - Saturday 9:30-11:30AM (Adult Class)</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM (Kid Class)"> Marsfield Park - Saturday 11:45-12:45PM (Kid Class)</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 6:00-7:00pm (Kid Class)"> Outside PCYC Hornsby - Tuesday 6:00-7:00pm (Kid Class)</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 7:15-8:15pm (Adult Class)"> Outside PCYC Hornsby - Tuesday 7:15-8:15pm (Adult Class)</label>
```

- [ ] **Step 2: Update `_includes/enroll-wizard-zh.html`**

Replace lines 82-85:

```html
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM"> Marsfield Park - 星期六 9:30-11:30AM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM"> Marsfield Park - 星期六 11:45-12:45PM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 6:00-7:00pm"> Outside PCYC Hornsby - 星期二 6:00-7:00pm</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 7:15-8:15pm"> Outside PCYC Hornsby - 星期二 7:15-8:15pm</label>
```

with:

```html
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM (Adult Class)"> Marsfield Park - 星期六 9:30-11:30AM（成人班）</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM (Kid Class)"> Marsfield Park - 星期六 11:45-12:45PM（兒童班）</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 6:00-7:00pm (Kid Class)"> Outside PCYC Hornsby - 星期二 6:00-7:00pm（兒童班）</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 7:15-8:15pm (Adult Class)"> Outside PCYC Hornsby - 星期二 7:15-8:15pm（成人班）</label>
```

- [ ] **Step 3: Update `_includes/enroll-wizard-zh-CN.html`**

Replace lines 82-85:

```html
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM"> Marsfield Park - 星期六 9:30-11:30AM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM"> Marsfield Park - 星期六 11:45-12:45PM</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 6:00-7:00pm"> Outside PCYC Hornsby - 星期二 6:00-7:00pm</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 7:15-8:15pm"> Outside PCYC Hornsby - 星期二 7:15-8:15pm</label>
```

with:

```html
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 9:30-11:30AM (Adult Class)"> Marsfield Park - 星期六 9:30-11:30AM（成人班）</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Marsfield Park - Saturday 11:45-12:45PM (Kid Class)"> Marsfield Park - 星期六 11:45-12:45PM（儿童班）</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 6:00-7:00pm (Kid Class)"> Outside PCYC Hornsby - 星期二 6:00-7:00pm（儿童班）</label>
      <label class="flex items-center gap-2 mb-1"><input type="checkbox" name="availability" value="Outside PCYC Hornsby - Tuesday 7:15-8:15pm (Adult Class)"> Outside PCYC Hornsby - 星期二 7:15-8:15pm（成人班）</label>
```

- [ ] **Step 4: Verify attribute parity across all 3 files**

Run:

```bash
for f in _includes/enroll-wizard.html _includes/enroll-wizard-zh.html _includes/enroll-wizard-zh-CN.html; do
  grep -oE '(name|value|id|data-step|data-action|data-type)="[^"]*"' "$f" | sort > "/tmp/$(basename "$f").attrs"
done
diff /tmp/enroll-wizard.html.attrs /tmp/enroll-wizard-zh.html.attrs && echo "zh: IDENTICAL attrs"
diff /tmp/enroll-wizard.html.attrs /tmp/enroll-wizard-zh-CN.html.attrs && echo "zh-CN: IDENTICAL attrs"
```

Expected: both `diff` commands produce no output, and both "IDENTICAL attrs" lines print — confirming the new `value` strings match exactly across all three files (the English page's new values, verbatim, must appear as the `value` attribute on the zh and zh-CN pages too — only the visible label text differs).

- [ ] **Step 5: Verify rendering and a real submission on all 3 pages**

A Jekyll dev server should already be running (check `docker ps --filter name=jekyll-verify`; if not running, start it with `docker run --rm -d -p 4000:4000 -v "$(pwd)":/srv/jekyll --name jekyll-verify my-jekyll-site sh -c "bundle exec jekyll serve --host 0.0.0.0 --port 4000"`). Using the Claude Browser tools:

1. Load `http://localhost:4000/enroll.html`, navigate to the Availability step (Basic Info → any age range → Training Goals → Availability), and confirm all 4 checkboxes show the `(Adult Class)` / `(Kid Class)` suffix matching the mapping in Global Constraints, and that `document.querySelector('input[name="availability"]').value` for each one includes the new suffix text.
2. Repeat the same rendering check on `http://localhost:4000/zh/enroll.html` (confirm `（成人班）`/`（兒童班）` Traditional Chinese suffixes render) and `http://localhost:4000/zh-CN/enroll.html` (confirm `（成人班）`/`（儿童班）` Simplified Chinese suffixes render).
3. On `http://localhost:4000/enroll.html`, drive one real end-to-end submission selecting the new "Outside PCYC Hornsby - Tuesday 7:15-8:15pm (Adult Class)" checkbox specifically (the newest, least-tested option), through to the real Apps Script endpoint, and confirm the response is `{"success":true}` and the browser redirects to `/thank-you.html` — this confirms the changed value string doesn't break submission or validation.

Expected: all label/value checks pass, and the real submission succeeds and redirects.

- [ ] **Step 6: Commit**

```bash
git add _includes/enroll-wizard.html _includes/enroll-wizard-zh.html _includes/enroll-wizard-zh-CN.html
git commit -m "feat: label enrollment availability options with Adult/Kid class type"
```
