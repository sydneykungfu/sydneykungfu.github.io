export const meta = {
  name: 'audit-ai-llm-en',
  description: 'Audit English pages (root) for AI/LLM structured data gaps and apply JSON-LD fixes',
  whenToUse: 'Run after adding new English pages, or use audit-ai-llm-all to audit all languages at once.',
  phases: [
    { title: 'Discover', detail: 'Find all auditable HTML pages in the repo' },
    { title: 'Audit & Fix', detail: 'Read each page, identify JSON-LD gaps, apply improvements' },
    { title: 'Summary', detail: 'Synthesize findings into a report' },
  ],
}

const BASE = '/Users/angustse/Documents/Projects/sydneykungfu.github.io'

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Relative path from repo root, e.g. index.html or kungfu-classes-adults-sydney.html' },
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

// Phase 1: Discover pages dynamically
phase('Discover')
const discovery = await agent(`
Run this shell command to find all HTML pages in the site repo:

  find ${BASE} -name "*.html" ! -path "*/_site/*" ! -path "*/_layouts/*" ! -path "*/_includes/*" ! -path "*/includes/*"

Then return a filtered list of pages that are worth auditing for AI/LLM structured data.

EXCLUDE these low-value pages (no structured data needed):
- 404.html
- privacy-policy.html
- waiver.html
- links.html
- online-private-class-booking-done.html
- blog/index.html
- Any file under zh/ or zh-CN/ subdirectories (localized — handle separately)

For each remaining page, infer an appropriate schema hint based on its filename:
- Files named about-grandmaster-* → Person schema for that Grand Master
- about-sifu-*.html → Person schema for instructor
- *-classes-*.html or *-kung-fu-*.html → Course schema
- *-history.html or about-choi-*.html → Article schema
- demo-*.html → HowTo or Article schema
- *-movements.html → Article schema (reference)
- enroll.html → FAQPage schema
- online-private-class.html → Service schema
- index.html → WebSite schema
- kids-school-holiday-*.html → Course or Event schema
- class-content.html → Course or Article schema

Return the file paths as relative paths from the repo root (e.g. "index.html", "kungfu-classes-adults-sydney.html").
`, {
  label: 'discover-pages',
  phase: 'Discover',
  schema: DISCOVERY_SCHEMA
})

const pages = discovery.pages
log(`Discovered ${pages.length} pages to audit`)

// Phase 2: Audit & fix each page in parallel
phase('Audit & Fix')
const results = await parallel(pages.map(p => () =>
  agent(`
You are auditing and fixing AI/LLM structured data for a Kung Fu school website (Tse Kung Fu Academy, Sydney, Australia).

FILE TO AUDIT: ${BASE}/${p.file}
SCHEMA HINT: ${p.hint}
PRODUCTION URL BASE: https://sydneykungfu.au

Steps:
1. Read the file at the path above using the Read tool
2. Check if it already has a page-specific <script type="application/ld+json"> block in the file itself (the site layout at _layouts/default.html ALREADY injects a global LocalBusiness schema — do NOT count that, and do NOT add another LocalBusiness)
3. Decide: does this page need a page-specific schema block?
4. If YES:
   - Generate accurate JSON-LD using real content from the file (names, descriptions, prices, dates — no placeholder text)
   - Append the complete <script type="application/ld+json">...</script> block at the very END of the file using the Edit tool
5. If the page already has appropriate page-specific JSON-LD, return action: "already_complete"
6. If the page is genuinely low-value for structured data, return action: "skipped"

Schema guidelines per page type:
- Person pages (grandmasters, sifu): @type Person — include name, description, jobTitle, worksFor pointing to the academy
- Course pages (class pages): @type Course — include name, description, provider, hasCourseInstance with schedule, offers with price in AUD
- Article pages (history, style info): @type Article — include headline, description, author (Sifu Angus Tse), about
- HowTo pages: @type HowTo — include name, description, step array if the page has steps
- Service pages: @type Service — include name, description, provider, areaServed
- WebSite (homepage): @type WebSite — include name, url, potentialAction SearchAction

The JSON-LD must use real data extracted from the page — no placeholder text.
Return structured output about what you found and did.
  `, {
    label: p.file.replace('.html', ''),
    phase: 'Audit & Fix',
    schema: RESULT_SCHEMA
  })
))

const filtered = results.filter(Boolean)
const added = filtered.filter(r => r.action === 'added')
const alreadyHad = filtered.filter(r => r.action === 'already_complete')
const skipped = filtered.filter(r => r.action === 'skipped')

log(`Added: ${added.length} | Already complete: ${alreadyHad.length} | Skipped: ${skipped.length}`)

// Phase 3: Summarise
phase('Summary')
const summary = await agent(`
Summarize this AI/LLM structured data audit for a Kung Fu school website.

Results JSON:
${JSON.stringify(filtered, null, 2)}

Write a concise markdown report with:
## Results
- Counts: added / already had / skipped
- Table listing each page, its action, and schema type added or present

## Notable observations
Any patterns or remaining gaps worth highlighting.

Keep it tight — one screen.
`, { label: 'summary', phase: 'Summary' })

log(summary)
return { results: filtered, summary }
