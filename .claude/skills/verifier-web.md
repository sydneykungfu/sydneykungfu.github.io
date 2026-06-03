# Web UI Verifier — Sydney Kung Fu Site

Use this skill to visually verify any page on the local Jekyll dev server.
It captures desktop and mobile screenshots, reads them, and reports findings.

## How to invoke

`/verifier-web <path-or-url>`

Examples:
- `/verifier-web /enroll.html`
- `/verifier-web http://0.0.0.0:4000/enroll.html`
- `/verifier-web /index.html "check the hero section and CTA button"`

If no URL is provided, screenshot the homepage.

## Steps to follow

### 1. Resolve the URL

If the arg starts with `http`, use it as-is.
Otherwise prepend `http://0.0.0.0:4000` (e.g. `/enroll.html` → `http://0.0.0.0:4000/enroll.html`).

### 2. Check the server

```bash
curl -s -o /dev/null -w "%{http_code}" <url>
```

If not 200, tell the user the server is not running and suggest:
```bash
bundle exec jekyll serve --host 0.0.0.0
```
Then stop — do not proceed without a live server.

### 3. Ensure Playwright is ready

```bash
npx playwright --version 2>/dev/null || echo "missing"
```

If missing, run `npm install -g playwright` and `npx playwright install chromium`.
If already installed, check browsers:
```bash
npx playwright install chromium 2>&1 | grep -i "already installed\|downloaded" || true
```

### 4. Capture screenshots

Use unique filenames based on the page path to avoid collisions.

```bash
# Desktop (1280×900)
npx playwright screenshot --browser chromium --viewport-size "1280,900" \
  "<url>" /tmp/verify-desktop.png

# Mobile — iPhone 14 Pro size (390×844)
npx playwright screenshot --browser chromium --viewport-size "390,844" \
  "<url>" /tmp/verify-mobile.png
```

### 5. Read both screenshots

Use the Read tool on `/tmp/verify-desktop.png` and `/tmp/verify-mobile.png` in parallel.

### 6. Report

Follow the standard verify report format:

```
## Verification: <page> — <what was checked>

**Verdict:** PASS | FAIL | BLOCKED

**Claim:** <what the change is supposed to do>

**Method:** Playwright screenshots at 1280×900 (desktop) and 390×844 (mobile)

### Steps
1. ✅/❌/⚠️ Desktop — <what you observed>
2. ✅/❌/⚠️ Mobile — <what you observed>
3. 🔍 <any probe — adjacent things checked>

### Findings
- ⚠️ <anything worth flagging>
- 🔍 <probes that passed>
```

## Viewports reference

| Name    | Size      | Use case                  |
|---------|-----------|---------------------------|
| Desktop | 1280×900  | Standard laptop            |
| Mobile  | 390×844   | iPhone 14 Pro              |
| Tablet  | 768×1024  | iPad (add if needed)       |

To add a tablet screenshot, run a third `npx playwright screenshot` call with `--viewport-size "768,1024"`.

## Notes

- Screenshots go to `/tmp/` — they are not committed.
- The Jekyll server must already be running. This skill does not start it.
- If the page has dynamic content (e.g. maps, iframes), allow 2–3 seconds: add `--timeout 5000` to the playwright command.
- For pages with scroll-dependent content, use a full-page screenshot: add `--full-page` flag.
