---
description: Process attached images to create bilingual Jekyll posts
---

# Process Images to Jekyll Workflow

This workflow is intended to be triggered when you manually attach images containing text and/or visuals to the chat. Follow these steps to process the images and generate the appropriate Jekyll blog posts:

1. **Extract Chinese Content**  
   Read and extract the Chinese text content present in the attached images.

2. **Extract Image Content**  
   Analyze the image contes. Extract visual descriptions or key content depicted in the images, to be used as alt text or image context. Images saved in `assets/images/blogs/` in png format.

3. **Create a Jekyll `.md` Page (Chinese)**  
   Create a new Jekyll markdown (`.md`) post file (typically in `_posts` or your designated Chinese posts directory). Include the extracted Chinese text and image content. Ensure the images are properly linked.

4. **Generate SEO Meta**  
   Generate appropriate SEO metadata (e.g., title, description, keywords, excerpt) for the Chinese page and insert it into the file's YAML frontmatter.

5. **Template reference**
   follow 2025-07-25-choy-lee-fut-sau-ceoi-pun-kiu.zh-hk.md to structure the md heading, such as layout, title, lang, alt and children, meta and children, blog and children. Use markdown `#` for heading. Use `<img>` for images and copy the class

6. **Create an English Version**  
   Translate the extracted Chinese content into English based on translation best practices and context. Create a corresponding English Jekyll markdown (`.md`) post file.

7. **Generate SEO Meta for English Page**  
   Generate the appropriate English SEO metadata (e.g., title, description, keywords) and insert it into the English page's YAML frontmatter.