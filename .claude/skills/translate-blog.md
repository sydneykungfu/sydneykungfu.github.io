# translate-blog — Translate a blog post to another language

Use this skill to translate a blog post from Traditional Chinese (Hong Kong) to English or Simplified Chinese.

## How to invoke

`/translate-blog <source-file>`

Examples:
- `/translate-blog _posts/2025-01-01-my-post.zh-hk.md` — translate to English
- `/translate-blog _posts/2025-01-01-my-post.zh-hk.md to zh-CN` — translate to Simplified Chinese

If no target language is specified, default to English.

## Steps to follow

### 1. Read the source file

Read the source `.zh-hk.md` file in full.

### 2. Determine output filename

- English: replace `zh-hk.md` → `en.md`
- Simplified Chinese: replace `zh-hk.md` → `zh-CN.md`

### 3. Translate

Follow these rules strictly:

1. Translate from Traditional Chinese (Hong Kong) to the target language.
2. Keep the original content and structure — do not add, remove, or reorder sections.
3. Do not change the meaning.
4. **Kung Fu movements**: keep the original Traditional Chinese name and prepend the Cantonese (HK Jyutping) romanisation without tones. No English translation needed. Use the dictionary below — check it first before translating movement names.
5. **Form names**: same rule as movements — keep Traditional Chinese, prepend Jyutping without tones. No English translation needed.
6. **蔡李佛**: always written as `Choy Lee Fut 蔡李佛` — keep the Traditional Chinese characters after the romanised name every time it appears.
7. Follow the Jekyll markdown frontmatter format of the source file.
8. The English version is canonical: add `canonical: true` to the frontmatter of the `en.md` file. Remove or omit `canonical` from other language versions.

### 4. Write the output file

Write the translated content to the new filename determined in step 2.

## Movement & stance dictionary (Jyutping without tones)

Use these romanisations exactly — do not derive your own:

| Traditional Chinese | Jyutping |
|---|---|
| 穿手 | cyun sau |
| 擒拿 | kam naa |
| 擸手 | laap sau |
| 閘手 | jaap sau |
| 擔肘 | daam zau |
| 包肘 | baau zau |
| 扱肘 | haap zau |
| 拋肘 | paau zau |
| 頂肘 | ding zau |
| 掛搥 | gwaa ceoi |
| 捎搥 | saau ceoi |
| 插搥 | caap ceoi |
| 搶眼搥 | coeng ngaan ceoi |
| 陽插搥 | joeng caap ceoi |
| 陰插搥 | jam caap ceoi |
| 扭插搥 | nau caap ceoi |
| 拋搥 | paau ceoi |
| 扱搥 | haap ceoi |
| 標搥 | biu ceoi |
| 撞搥 | zong ceoi |
| 鞭搥 | bin ceoi |
| 盤橋 | pun kiu |
| 捆橋 | kwan kiu |
| 千字 | cin zi |
| 劈搥 | pik ceoi |
| 釘腳 | ding goek |
| 正撐腳 | zing caang goek |
| 側撐腳 | zak caang goek |
| 後撐腳 | hau caang goek |
| 披手 | pei sau |
| 拋掌 | paau zoeng |
| 撐掌 | caang zoeng |
| 蝶掌 | dip zoeng |
| 抱排掌 | bou paai zoeng |
| 撻掌 | taat zoeng |
| 虎爪 | fu zaau |
| 冚掌 | ham zoeng |
| 四平馬 | sei ping maa |
| 吊馬 | diu maa |
| 圈馬 | kyun maa |
| 拐馬 | gwaai maa |
| 偷馬 | tau maa |
| 跪馬 | gwai maa |
| 麒麟馬 | kei lin maa |
| 子午馬 | zi ng maa |

If a movement or stance appears in the source but is not in this dictionary, romanise it using standard Jyutping and flag it in your response so the user can verify.
