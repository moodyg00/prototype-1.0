# Creating Tools & Skills for Agents

This guide helps you create effective tools, skills, and workflows that agents can use.

## Tool/Skill Definition

A tool or skill is a well-defined, reusable capability that an agent can invoke. Skills typically have:

### Core Components

1. **Purpose** — What problem does this skill solve?
2. **Inputs** — What data or parameters does the agent provide?
3. **Process** — How does the skill execute? (deterministic function, external API call, workflow)
4. **Output** — What does the agent receive back? (format, schema, possible errors)
5. **Constraints** — Rate limits, permission requirements, scope

### Example: Screenshot Analysis Tool

```
Purpose: Extract actionable UI elements from a browser screenshot
Inputs: 
  - image: base64-encoded PNG or JPEG
  - focus_area: optional bounding box for targeted analysis
Process: 
  1. Parse image (validate format, decode)
  2. Run Grok Vision on image with element detection prompt
  3. Extract interactive elements (buttons, inputs, links)
  4. Return structured list with coordinates
Output:
  {
    "elements": [
      { "type": "button", "text": "Submit", "coords": [100, 50], "id": "btn-submit" },
      ...
    ],
    "page_title": "...",
    "detected_form": boolean
  }
Constraints:
  - Image must be < 20MB
  - Returns up to 50 elements per call
  - Runs on authenticated API keys only
```

## Types of Skills

### Type 1: Deterministic Transformations
- Input → consistent output (no randomness)
- Examples: JSON parsing, data normalization, format conversion
- Best practice: Use temperature 0.0 if calling a model
- Error handling: Return validation errors, not exceptions

### Type 2: API Integrations
- Call external services and return results
- Examples: Browser control (Playwright), database queries, third-party APIs
- Best practice: Wrap API errors in a consistent error response
- Rate limiting: Return 429 status if limit exceeded

### Type 3: Reasoning/Analysis
- Require model judgment or pattern recognition
- Examples: Screenshot analysis, code review, strategy generation
- Best practice: Use appropriate temperature and few-shot examples
- Validation: Run on test cases before deployment

### Type 4: Workflows
- Chain multiple tools or steps together
- Examples: "Fill form, submit, wait for confirmation"
- Best practice: Make each step independently testable
- Fault tolerance: Define retry logic and fallback paths

## Writing Effective Skill Prompts

### Structure for Model-Based Skills

```
# Task
[Clear, concise statement of what the model should do]

# Input Format
[Specify the structure and constraints of input data]

# Output Format
[JSON schema or structured markdown template]

# Rules
- [Non-negotiable constraint 1]
- [Non-negotiable constraint 2]
- [Security boundary]

# Examples
[1-2 concrete examples showing desired behavior]
```

### Example: Form Field Detection Skill

```
# Task
Analyze a screenshot and identify all form fields (text inputs, selects, checkboxes, etc.)

# Input Format
{
  "image_base64": "...",
  "image_format": "png|jpeg"
}

# Output Format
{
  "fields": [
    { "id": "email", "type": "text", "label": "Email Address", "required": true },
    { "id": "country", "type": "select", "label": "Country", "options": [...] }
  ],
  "error": null
}

# Rules
- Return only interactive form elements
- Include visible labels if present
- Set required=true only if field has a required indicator
- Return error if image is not a web page

# Examples
[image of a login form] →
{
  "fields": [
    { "id": "email", "type": "text", "label": "Email", "required": true },
    { "id": "password", "type": "password", "label": "Password", "required": true },
    { "id": "remember", "type": "checkbox", "label": "Remember me", "required": false }
  ]
}
```

## Integration Patterns

### Skill Registration
Each skill should be:
1. Documented in its own file (e.g., `tools/screenshot-analysis.md`)
2. Registered in the agent.md file that uses it
3. Version-controlled alongside the agent definition

### Calling Skills from Agents
In the agent prompt, reference skills clearly:
```
Available tools:
1. browser-screenshot(url) → Image
2. analyze-elements(image) → ElementList
3. perform-action(element_id, action) → Result
```

### Error Handling
Skills should return structured errors:
```json
{
  "success": false,
  "error": "timeout",
  "message": "Screenshot took > 30s, operation aborted",
  "timestamp": "2026-06-08T14:22:00Z"
}
```

## Testing Skills

Before deploying a skill:
1. **Unit test**: Validate on sample inputs (both valid and edge cases)
2. **Integration test**: Test the skill in context with its agent
3. **Performance test**: Measure latency and resource use
4. **Error test**: Verify behavior on network failures, missing permissions, etc.

## Best Practices

- **Keep skills single-purpose.** A tool that does one thing well is more reusable.
- **Document assumptions.** If a skill assumes external services are running, state it upfront.
- **Version together.** Keep skill definition, prompt, and tests in the same commit.
- **Iterate based on failures.** When an agent struggles with a skill, refine the skill definition or add examples.

## Related Files

- [.agents/xaiapi.md](.agents/xaiapi.md) — XAI API features for skills
- [.agents/create_agent.md](.agents/create_agent.md) — Integrating skills into agents
- [../AGENTS.md](../AGENTS.md) — Architecture and composition patterns
