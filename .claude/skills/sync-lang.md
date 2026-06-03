# sync-lang — Sync a page across language versions

Use this skill when the user has made changes to one language version of a page and wants to apply equivalent changes to the other language versions.

## Site language structure

| Language | Directory | Schedule include |
|---|---|---|
| English | `/` (root) | `schedule-cards-en.html` |
| Traditional Chinese | `/zh/` | `schedule-cards-zh.html` |
| Simplified Chinese | `/zh-CN/` | `schedule-cards-zh-CN.html` |

## How to invoke

`/sync-lang <filename> [from <lang>]`

Examples:
- `/sync-lang enroll.html` — sync enroll.html from EN to zh and zh-CN
- `/sync-lang enroll.html from zh` — sync from zh to EN and zh-CN
- `/sync-lang index.html` — sync index.html across all languages

If no `from` is specified, default to English as the source.

## Steps to follow

### 1. Identify files

Resolve paths for all three language versions of the file:
- EN: `/<filename>`
- ZH: `/zh/<filename>`
- ZH-CN: `/zh-CN/<filename>`

Check which files exist with the Read tool.

### 2. Read the source file

Read the source (reference) language file in full.

### 3. Read each target file

Read both target language files in full.

### 4. Identify what changed

Compare source vs each target. Focus on:
- Structural changes (new sections, removed sections, reordered content)
- Content changes (updated prices, ages, dates, links, class names)
- Code changes (JS, CSS, HTML attributes)
- Things that are language-neutral (image paths, URLs, JS, CSS classes)

Do NOT change:
- Translated text that is already correctly localised
- Frontmatter (title, meta, permalink, keywords, description) — these are localised separately
- Schema.org `name` fields (question names should stay in their target language)

### 5. Apply changes to each target

For each target language file:
- Apply structural/code changes directly (same HTML/JS/CSS)
- Translate any new English text into the target language
- Preserve existing correct translations
- Fix any content facts that were wrong in the target (prices, ages, etc.) to match the source

### 6. Check related includes

If the change touches a schedule card include (`schedule-cards-en.html`), check whether the equivalent zh and zh-CN includes need the same change.

### 7. Rebuild Tailwind if new CSS classes were added

If new Tailwind classes appear in the changes, run:
```bash
npx tailwindcss-cli@latest build -i ./assets/css/input.css -o ./assets/css/tailwind.min.css --minify
```

### 8. Verify

Screenshot all three language versions:
```bash
npx playwright screenshot --browser chromium --viewport-size "390,844" "http://0.0.0.0:4000/<path>" /tmp/verify-en.png
npx playwright screenshot --browser chromium --viewport-size "390,844" "http://0.0.0.0:4000/zh/<path>" /tmp/verify-zh.png
npx playwright screenshot --browser chromium --viewport-size "390,844" "http://0.0.0.0:4000/zh-CN/<path>" /tmp/verify-zh-cn.png
```

Read and compare all three screenshots. Report any issues.

## Translation notes

- 试堂 (zh) / 试课 (zh-CN) = trial class — these differ intentionally by dialect
- 星期六/星期二 = Saturday/Tuesday
- 首堂/首课 = first class
- 报名/報名 = enroll
- Keep tone consistent with existing content in each file
- **Australian suburb names must never be translated or transliterated into Chinese.** Keep them in English exactly as written. This includes but is not limited to: Marsfield, Waitara, Wahroonga, Pymble, Hornsby, Macquarie Park, Ryde, Chatswood, and any other Sydney suburb or place name. NSW and postcode numbers also stay in English.
