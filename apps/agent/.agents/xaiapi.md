# XAI API Skill: Maximizing Features & Quality

This skill guide helps agents use the XAI API effectively for optimal model performance and feature richness.

## Mandatory Rule: Consult XAI.md Before Every Build or Edit

**Before writing or modifying any function, tool, operator, or skill that touches the XAI API:**

1. **Read [../XAI.md](../XAI.md)** — Confirm the feature or approach you are implementing is compatible with the API. Never assume — verify.
2. **Check for violations** — Ensure your implementation does not exceed token limits, misuse endpoints, break rate limits, or contradict documented constraints.
3. **Look for a better implementation** — Scan the docs for native API features (function calling, streaming, vision, structured outputs, etc.) that could replace or improve your approach before writing custom logic.

This rule applies to every agent, developer, and automated process working on this codebase. No exceptions.

## Native XAI Features to Leverage

### Model Selection
- **Grok** (latest): Use for complex reasoning, multi-step tasks, and creative work
- **Grok Preview**: Use for early access to new capabilities (bleeding edge, may have edge cases)
- **Grok Vision**: Use when the task involves image understanding or multimodal input
- Reference: See [../XAI.md](../XAI.md) for complete model list and capabilities

### Parameters for Quality Control

#### Temperature
- **0.0**: Deterministic output, best for precise tasks (code generation, data extraction)
- **0.5-0.7**: Balanced for most general tasks
- **1.0+**: Creative and diverse outputs for brainstorming and ideation

#### Max Tokens
- Set based on expected response complexity
- Grok models support up to 128K tokens
- Consider cost and latency when setting limits
- For structured tools/skills, typically 2000-8000 tokens

#### Stop Sequences
- Use to terminate generation at natural boundaries (function ends, section breaks)
- Reduces waste and improves clarity for structured outputs

### Advanced Features

#### Function Calling (Tools)
- Define tool schemas in the system prompt or via the API's tools parameter
- XAI API supports structured tool definitions
- Return types should be JSON for agent chaining

#### Vision/Multimodal
- Include image URLs or base64-encoded images in messages
- Grok Vision model is optimized for this use case
- Useful for screenshot analysis in the visual browser operator

#### Streaming
- Use for long-running operations or real-time feedback
- Cost-effective for responses with variable length
- Combine with server-side filtering for UI updates

### System Prompt Patterns

#### Agent Role Definition
The `agent.md` file for each agent IS the system prompt. Do not write generic role statements inline — inject the agent's `agent.md` content as the `system` message in the API call. This is how the agent's purpose, capabilities, constraints, and decision-making approach are delivered to the model.

```json
{
  "model": "grok-...",
  "messages": [
    { "role": "system", "content": "<contents of agent.md>" },
    { "role": "user", "content": "<user request or task input>" }
  ]
}
```

All the context the agent needs — role, tools, constraints, examples — lives in the `agent.md` file. Keep it there, not scattered across ad-hoc prompts. See `.agents/create_agent.md` for how to write effective agent files.

#### Few-Shot Examples
Include 1-3 examples of desired behavior in the agent.md file itself:
- Input → Expected reasoning → Output format
- Helps the model align on tone, format, and decision logic

#### Constraint Enforcement
Constraints belong in the agent.md file under the Constraints section:
- Security boundaries (never return credentials, validate inputs)
- Scope limits (which files/APIs you can access)
- Output format (JSON schema, markdown structure, etc.)

## Best Practices for Agent Integration

1. **Keep prompts modular.** Use separate instruction files for different concerns (security, task logic, output format).
2. **Version your prompts.** When a prompt produces good results, keep it in source control alongside the agent.md file.
3. **Test edge cases.** Before deploying an agent, validate behavior on boundary inputs.
4. **Monitor costs.** XAI models are fast but add tokens when using vision, streaming, or multi-turn reasoning.
5. **Use tool calling for deterministic workflows.** Instead of asking the model to reason through API calls, define tools and let the model use them.

## Common Patterns

### Data Transformation
Use low temperature (0.0-0.2) with a strict output schema:
```
Input: [data]
Output format: [JSON schema or structured markdown]
```

### Creative/Strategic Tasks
Use higher temperature (0.8-1.0) with open-ended prompt:
```
Task: [problem statement]
Consider: [key factors to explore]
```

### Multi-Step Reasoning
Break into sub-tasks with clear handoff points:
```
Step 1: [first task with model]
Step 2: [process step 1 output]
Step 3: [final decision]
```

## Related Files

- [../XAI.md](../XAI.md) — Complete API documentation
- [.agents/create_agent.md](.agents/create_agent.md) — How to structure agent.md files
- [../AGENTS.md](../AGENTS.md) — High-level architecture
