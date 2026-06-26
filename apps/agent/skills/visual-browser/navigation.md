# Browser Navigation Skill

## When to Use
- Task involves going to a specific site or search.
- Current page is a search engine or home page.

## Core Principle
The strength of this vision-enabled browser agent is doing what simple URL/query-string agents and text scrapers cannot: discovering and using the actual on-page GUI when URL tricks fail, when the site ignores or normalizes params, when results are JS-rendered, or when you need to visually inspect what is actually shown.

## Instructions
- Direct `goto` with well-formed URLs (including query params like &maxPrice=300) is a good first efficiency move when you know the pattern.
- **Immediately after the goto, verify with the current observation (text + any provided screenshot).** If the cheap obs does not clearly show the desired state (e.g. the results still show high prices, the filter UI does not indicate it is active, or the page content looks unfiltered), **do not repeat the same URL construction**.
- Instead, treat the page like a real user: locate the visible search/filter controls on the page (price range inputs, "max price", sort dropdown, "price low to high", advanced search links, etc.) and interact with them (click, fill, submit).
- Use the screenshot (when provided) to understand the layout and find the right elements when text alone is ambiguous.
- Only fall back to re-constructing a URL if on-page interaction is not possible.

## When URL params are insufficient
- On a results page that doesn't reflect the filter you wanted, look for and use the site's own filter UI.
- Example for Craigslist "washer dryer under 300": if the landed page shows mixed/high prices, find the price filter section, enter 300 in the max field, and apply — or sort by lowest price and read the visible items.
- This is the behavior that justifies using a real browser + vision model instead of just appending query params.

## After navigation
- Confirm the effect of your last action using the fresh observation.
- Prefer 'extract' or direct interaction over repeating a navigation that didn't produce the expected visible change.