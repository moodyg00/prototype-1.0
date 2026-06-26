# Creating Agent Definitions

This guide helps you write effective `agent.md` files for agents that work within the `@prototype/agent` app.

## Agent File Structure

Each agent is defined in a file named `agent.md` placed in the relevant workspace, tool, or workflow directory. The file uses YAML frontmatter followed by markdown documentation.

### Template

```yaml
---
name: "Agent Name"
description: "One-line description of what this agent does"
context_depth: "quick|medium|thorough"  # How much context it needs to reason well
model: "grok"  # Default XAI model, overridden at runtime if needed
temperature: 0.5  # 0.0 for deterministic, 0.7-1.0 for creative
max_tokens: 4000
capabilities:
  - "tool1"
  - "tool2"
  - "skill3"
constraints:
  - "Security: Never return credentials or API keys"
  - "Scope: Only access files in /workspace/data"
  - "Rate: Max 10 requests per minute"
---

# Agent: [Agent Name]

## Purpose
[Clear statement of what this agent does and in what context it operates]

## Key Responsibilities
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

## Available Tools & Skills
[List the specific tools/skills this agent can use, with brief descriptions]

## Constraints & Boundaries
[Security, scope, and operational constraints]

## Decision-Making Approach
[How should the agent reason through problems? What's its priority order?]

## Example Usage
[1-2 concrete examples of how the agent would be invoked and what it produces]

## Related Agents
[List other agents that might collaborate or hand off work]
```

## Frontmatter Fields

### Required

- **name**: Agent identifier (used in code and logs)
- **description**: One-line summary
- **model**: Default XAI model (grok, grok-preview, grok-vision)
- **temperature**: Float 0.0-2.0 (see xaiapi.md for guidance)
- **max_tokens**: Integer for response length limit

### Optional

- **context_depth**: How much context the agent needs (defaults to "medium")
  - `quick`: Agent works with minimal context, good for simple tasks
  - `medium`: Agent needs project context, standards, and tool docs
  - `thorough`: Agent needs full codebase understanding, all related files
- **capabilities**: Array of tool/skill names the agent can invoke
- **constraints**: Array of operational boundaries

## Writing the Agent Description

### Be Specific
❌ Bad: "Code reviewer"  
✅ Good: "Reviews pull requests for TypeScript type safety and architectural consistency"

### State the Scope
❌ Bad: "Works with the database"  
✅ Good: "Executes read-only queries on the analytics PostgreSQL instance to generate dashboard datasets"

### Include the Context
❌ Bad: "Visual browser agent"  
✅ Good: "Directs the Playwright browser operator to navigate sites, extract data, and perform interactions based on screenshot-driven reasoning"

## Structuring the Reasoning Section

### Decision-Making Priorities
Agents should know their priority order:
```
## Decision-Making Approach
1. Validate all inputs match expected schema
2. Check if the task is within scope (see Constraints)
3. Decompose into sub-steps if multi-part
4. Use tools in order of confidence (most reliable first)
5. Return structured output with explicit reasoning for ambiguous cases
```

### Examples Should Show Edge Cases
```
## Example Usage

### Example 1: Happy Path
Input: [user request with valid data]
Reasoning: [how agent thinks about this]
Output: [structured result]

### Example 2: Edge Case
Input: [ambiguous or conflicting request]
Reasoning: [how agent handles ambiguity]
Output: [result or error explanation]
```

## Agent Parameter Overrides

The frontmatter provides defaults, but agents can be invoked at runtime with overrides:

```
# Calling an agent with custom parameters
agent.md (default: temperature: 0.5)
Runtime call: temperature: 1.0 (override for creative mode)
```

This allows:
- Using the same agent for both deterministic and exploratory tasks
- Scaling budget by adjusting max_tokens
- Using different models (grok vs grok-vision vs grok-preview)

## Capability Declaration

List exactly which skills the agent can use:
```
capabilities:
  - "browser-screenshot"      # External tool name
  - "analyze-page-elements"   # External tool name
  - "execute-browser-action"  # External tool name
```

If a capability is missing, the agent should not attempt to use it.

## Constraint Examples

### Security
```
constraints:
  - "Never print, log, or return API keys or credentials"
  - "All external API calls must use authenticated connections"
  - "Sanitize all user input before passing to shell commands"
```

### Scope
```
constraints:
  - "Read-only access to /data/analytics"
  - "Cannot invoke operators outside workspace:photography"
  - "Limited to public APIs (no internal service calls)"
```

### Rate & Resource
```
constraints:
  - "Max 5 browser screenshots per workflow run"
  - "Max 60 API requests per minute (enforced by client)"
  - "Response time target: < 30 seconds"
```

## Testing Agent Definitions

Before deploying, verify:
1. **Syntax**: agent.md parses correctly as YAML + markdown
2. **Completeness**: All required fields present
3. **Capability Match**: Every capability listed is actually available
4. **Constraint Clarity**: Each constraint is actionable (not vague)
5. **Runtime Behavior**: Test with sample inputs and verify reasoning

## Common Patterns

### Multi-Step Workflow Agent
Use when the agent coordinates multiple tools:
```yaml
context_depth: "medium"
temperature: 0.3  # Keep it deterministic for coordination
```

### Analysis/Reasoning Agent
Use when the agent needs to interpret ambiguous data:
```yaml
context_depth: "thorough"
temperature: 0.7  # Higher creativity for interpretation
```

### Creative/Generative Agent
Use for brainstorming or content generation:
```yaml
temperature: 1.0
max_tokens: 8000  # More room for creative output
```

## Related Files

- [.agents/xaiapi.md](.agents/xaiapi.md) — Model selection and parameter tuning
- [.agents/create_skills.md](.agents/create_skills.md) — Defining skills the agent uses
- [../AGENTS.md](../AGENTS.md) — Architecture and patterns
- [../README.md](../README.md) — Project overview
