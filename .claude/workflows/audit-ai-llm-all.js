export const meta = {
  name: 'audit-ai-llm-all',
  description: 'Audit all languages (EN, ZH, ZH-CN) for AI/LLM structured data gaps and apply JSON-LD fixes',
  whenToUse: 'Run after adding pages across multiple languages, or for a full site-wide structured data audit.',
  phases: [
    { title: 'All Languages', detail: 'Run EN, ZH, and ZH-CN audits in parallel' },
    { title: 'Combined Summary', detail: 'Merge results across all languages' },
  ],
}

phase('All Languages')
const BASE_WF = '/Users/angustse/Documents/Projects/sydneykungfu.github.io/.claude/workflows'
const [en, zh, zhCn] = await parallel([
  () => workflow({ scriptPath: `${BASE_WF}/audit-ai-llm-en.js` }),
  () => workflow({ scriptPath: `${BASE_WF}/audit-ai-llm-zh.js` }),
  () => workflow({ scriptPath: `${BASE_WF}/audit-ai-llm-zh-cn.js` }),
])

const allResults = [
  ...(en ? en.results : []),
  ...(zh ? zh.results : []),
  ...(zhCn ? zhCn.results : []),
].filter(Boolean)

const added = allResults.filter(r => r.action === 'added').length
const alreadyHad = allResults.filter(r => r.action === 'already_complete').length
const skipped = allResults.filter(r => r.action === 'skipped').length

log(`All languages complete — Total: ${allResults.length} pages | Added: ${added} | Already complete: ${alreadyHad} | Skipped: ${skipped}`)

phase('Combined Summary')
const summary = await agent(`
Summarize a full site-wide AI/LLM structured data audit across 3 languages.

EN results: ${JSON.stringify(en ? en.results : [], null, 2)}
ZH results: ${JSON.stringify(zh ? zh.results : [], null, 2)}
ZH-CN results: ${JSON.stringify(zhCn ? zhCn.results : [], null, 2)}

Write a concise markdown report:
## Overall Counts
- Total pages audited, added, already complete, skipped

## By Language
Short table per language (EN / ZH / ZH-CN): counts + any notable schema types added

## Gaps or Follow-ups
Anything missing across all languages worth flagging.

Keep it tight — one screen.
`, { label: 'combined-summary', phase: 'Combined Summary' })

log(summary)
return { en, zh, zhCn, summary }
