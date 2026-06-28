export const meta = {
  name: 'audit-ai-llm-zh',
  description: 'Audit Traditional Chinese (zh/) pages for AI/LLM structured data gaps and apply JSON-LD fixes',
  whenToUse: 'Run after adding new Traditional Chinese pages, or use audit-ai-llm-all to audit all languages at once.',
  phases: [
    { title: 'Discover', detail: 'Find all auditable HTML pages under zh/' },
    { title: 'Audit & Fix', detail: 'Read each page, identify JSON-LD gaps, apply improvements' },
    { title: 'Summary', detail: 'Synthesize findings into a report' },
  ],
}

const BASE = '/Users/angustse/Documents/Projects/sydneykungfu.github.io'
const LANG_DIR = 'zh'
const LANG_LABEL = 'Traditional Chinese (zh/)'

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Relative path from repo root, e.g. zh/about-sifu-angus.html' },
          hint: { type: 'string', description: 'Recommended schema type and reason' }
        },
        required: ['file', 'hint']
      }
    }
  },
  required: ['pages']
}

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    hadExistingPageSchema: { type: 'boolean' },
    existingSchemaTypes: { type: 'array', items: { type: 'string' } },
    action: { type: 'string', enum: ['added', 'skipped', 'already_complete'] },
    schemaTypeAdded: { type: 'string' },
    reason: { type: 'string' }
  },
  required: ['file', 'hadExistingPageSchema', 'existingSchemaTypes', 'action', 'reason']
}

phase('Discover')
const discovery = await agent(`
Run this shell command to find all HTML pages under the ${LANG_DIR}/ directory:

  find ${BASE}/${LANG_DIR} -name "*.html" ! -path "*/_site/*"

Then return a filtered list of pages worth auditing for AI/LLM structured data.

EXCLUDE these low-value pages:
- privacy-policy.html
- waiver.html
- links.html
- Any booking confirmation pages

For each remaining page, infer a schema hint from its filename:
- Files named about-grandmaster-* → Person schema for that Grand Master
- about-sifu-*.html → Person schema for instructor
- *-classes-*.html or *-kung-fu-*.html → Course schema
- *-history.html or about-choi-*.html → Article schema
- enroll.html → FAQPage schema
- online-private-class.html → Service schema
- index.html → WebSite schema
- class-content.html → Course or Article schema

Return file paths as relative paths from the repo root (e.g. "${LANG_DIR}/index.html", "${LANG_DIR}/about-sifu-angus.html").
`, {
  label: 'discover-pages',
  phase: 'Discover',
  schema: DISCOVERY_SCHEMA
})

const pages = discovery.pages
log(`Discovered ${pages.length} ${LANG_LABEL} pages to audit`)

phase('Audit & Fix')
const results = await parallel(pages.map(p => () =>
  agent(`
You are auditing and fixing AI/LLM structured data for a Kung Fu school website (Tse Kung Fu Academy, Sydney, Australia).
This page is in Traditional Chinese (繁體中文).

FILE TO AUDIT: ${BASE}/${p.file}
SCHEMA HINT: ${p.hint}
PRODUCTION URL BASE: https://sydneykungfu.au

Steps:
1. Read the file using the Read tool
2. Check if it already has a page-specific <script type="application/ld+json"> block in the file itself (the site layout already injects a global LocalBusiness schema — do NOT count that, and do NOT add another LocalBusiness)
3. Decide: does this page need a page-specific schema block?
4. If YES:
   - Generate accurate JSON-LD using real content from the file
   - Use Chinese text for name/description fields where the page content is in Chinese — this is correct and expected for localized pages
   - The @id and url fields should still use the production URL (https://sydneykungfu.au/${p.file.replace('.html', '')})
   - Append the complete <script type="application/ld+json">...</script> block at the very END of the file using the Edit tool
5. If the page already has appropriate page-specific JSON-LD, return action: "already_complete"
6. If genuinely low-value, return action: "skipped"

Schema guidelines per page type:
- Person pages (grandmasters, sifu): @type Person — name, description, jobTitle, worksFor
- Course pages: @type Course — name, description, provider, offers with price in AUD
- Article pages: @type Article — headline, description, author, about
- Service pages: @type Service — name, description, provider, areaServed
- WebSite (index): @type WebSite — name, url, inLanguage "zh-TW", potentialAction SearchAction

Use real content from the page — no placeholder text.
  `, {
    label: p.file.replace(`${LANG_DIR}/`, '').replace('.html', ''),
    phase: 'Audit & Fix',
    schema: RESULT_SCHEMA
  })
))

const filtered = results.filter(Boolean)
const added = filtered.filter(r => r.action === 'added')
const alreadyHad = filtered.filter(r => r.action === 'already_complete')
const skipped = filtered.filter(r => r.action === 'skipped')

log(`${LANG_LABEL} — Added: ${added.length} | Already complete: ${alreadyHad.length} | Skipped: ${skipped.length}`)

phase('Summary')
const summary = await agent(`
Summarize this AI/LLM structured data audit for Traditional Chinese (zh/) pages of a Kung Fu school website.

Results JSON:
${JSON.stringify(filtered, null, 2)}

Write a concise markdown report with:
## Results (Traditional Chinese / zh/)
- Counts: added / already had / skipped
- Table: page | action | schema type

## Notable observations
Any patterns or gaps worth highlighting.

Keep it tight — one screen.
`, { label: 'summary', phase: 'Summary' })

log(summary)
return { results: filtered, summary }
