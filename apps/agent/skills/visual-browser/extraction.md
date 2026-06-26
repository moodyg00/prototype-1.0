# Data Extraction Skill

## When to Use
- Need to pull structured information from a page (listings, prices, links, forms).
- After arriving at a content-rich page like search results.

## Instructions
- Use cheap text-based observation first (get_text, links).
- When screenshot is available (on results pages or recovery), use the image to visually read actual listings, prices, photos, and condition.
- For lists: Extract title, price, link, location using the text obs + image if provided.
- Once you have the data from extract or the current obs/image, stop and output 'done' with a clear final_answer summarizing the relevant items that match the task (e.g. under $300).
- If results are paginated, use scroll or next page navigation.

## Output Guidance
The goal is a useful final_answer with the concrete data. Do not keep extracting once you can answer the user's request.