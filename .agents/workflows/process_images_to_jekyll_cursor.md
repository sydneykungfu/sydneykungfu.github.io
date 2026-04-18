---
description: Cursor workflow to turn attached images into bilingual Jekyll posts (Chinese + English) without modifying the original Antigravity workflow.
---

# Process Images to Jekyll (Cursor Workflow)

You are a Cursor workflow agent. When this workflow is triggered (typically after the user attaches one or more images that contain Chinese text and/or visual content), follow the steps below **in order** to create a pair of Jekyll blog posts (Chinese and English).

Always:
- **Preserve** the original Antigravity-style workflow file (`process_images_to_jekyll.md`) and do not edit or overwrite it.
- Be explicit about all file names, paths, and frontmatter fields you create.
- Ask the user **only if absolutely necessary** (e.g. missing required metadata); otherwise, make reasonable assumptions and proceed.

## 1. Inspect and catalog attached images

1. Detect all currently attached images for this conversation.
2. For each image:
   - Detect the region(s) that show **kung fu moves/techniques only** (stances, kicks, hand movements, step-by-step fighting sequences). Ignore decorative borders, large titles, logos, and unrelated background as much as possible.
   - Crop tightly around each kung fu move or short sequence so the technique is clearly visible, while keeping just enough surrounding context to understand the posture and direction.
   - Convert each cropped kung fu move region to `.png` format if needed.
   - Assign or infer a descriptive base filename (in English, kebab-case) for the **kung fu move** images if one is not already provided.
   - Save each cropped kung fu move image under `assets/images/blogs/` as `<base-filename>-move-1.png`, `<base-filename>-move-2.png`, etc.
   - Note any obvious grouping (e.g. multiple moves that belong to the same combination or sequence) so they can be referenced together in the blog post.

## 2. Extract Chinese text content

1. For each relevant image:
   - Read and transcribe **all Chinese text** as accurately as possible.
   - Preserve paragraph and line breaks where they are semantically meaningful.
   - If there is mixed-language text, keep the Chinese portions intact and minimally normalize punctuation.
2. Aggregate the transcriptions into a coherent Chinese article draft, ordered according to the logical reading order of the images.

## 3. Extract visual content (for alt text and context)

1. For each image:
   - Describe the main visual content (who/what/where, key actions, important objects).
   - Produce:
     - A concise alt text (1–2 short sentences).
     - Optional longer contextual description if it adds important meaning for readers or SEO.
2. You will reuse these descriptions:
   - As `<img>` `alt` attributes.
   - As supporting context in the blog content if appropriate.

## 4. Choose template and structure from reference post

1. Locate the reference file `2025-07-25-choy-lee-fut-sau-ceoi-pun-kiu.zh-hk.md`.
2. Use it as the **structural template** for both the Chinese and English posts:
   - YAML frontmatter keys and nesting (e.g. `layout`, `title`, `lang`, `alt` and children, `meta` and children, `blog` and children).
   - Overall section ordering and heading usage.
3. Use markdown `#` for the top-level heading(s) inside the body.
4. For images:
   - Use raw `<img>` tags (not markdown images).
   - Copy the relevant `class` attributes and other structural attributes from the reference post.

## 5. Create the Chinese Jekyll post

1. Decide:
   - A slug and filename for the Chinese post (e.g. `YYYY-MM-DD-descriptive-title.zh-hk.md`), following the project’s existing naming conventions.
   - The target directory (likely `_posts` or the existing Chinese posts directory; infer from the reference file path).
2. Construct YAML frontmatter:
   - `layout`, `lang`, categories/tags, and any project-specific fields, mirroring the reference post.
   - `title` in Chinese.
   - SEO fields: `description`, `keywords`, `excerpt` (Chinese).
   - Image metadata (`alt`, `meta`, etc.) populated with the extracted visual descriptions.
3. Write the Chinese body content:
   - Use the extracted Chinese text, structured into clear sections with headings.
   - Insert `<img>` tags at appropriate positions, referencing the files under `assets/images/blogs/`.
4. Ensure internal links, image paths, and dates are consistent and valid.

## 6. Create the English Jekyll post

1. Derive the English post’s filename and slug from the Chinese one:
   - Keep the same date and base slug where possible, but use `.en.md` or the project’s existing English naming convention.
   - Place it into the appropriate English posts directory, inferred from existing files.
2. Translate the Chinese article:
   - Translate all Chinese body content into natural, idiomatic English while preserving meaning and tone.
   - Adapt cultural references and idioms where needed; prefer clarity over literalness.
3. Construct English YAML frontmatter:
   - Mirror the structure used by the Chinese post and existing English posts.
   - `title`, `description`, `keywords`, and `excerpt` in English.
   - Reuse image paths and adjust alt/meta text to quality English descriptions.
4. Ensure cross-linking (if the site conventions use language-switch links between zh-HK and EN versions) and follow any patterns visible in existing bilingual posts.

## 7. Final checks and summary to the user

1. Validate:
   - Both markdown files are well-formed and contain valid YAML frontmatter.
   - All image paths under `assets/images/blogs/` are consistent and point to the correct filenames.
2. Present a concise summary to the user:
   - The paths and filenames of the new Chinese and English posts.
   - The image filenames you created/used.
   - Any assumptions made (e.g. directory choices, inferred titles) and potential follow-ups the user may want to adjust.

