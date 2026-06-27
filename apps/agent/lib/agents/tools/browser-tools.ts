import { z } from 'zod';

import type { AgentTool } from './types';

function asTool<T extends AgentTool>(tool: T): AgentTool {
  return tool;
}

const urlSchema = z.object({ url: z.string().url() });
const clickSchema = z.object({ selector: z.string().min(1) });
const typeSchema = z.object({ selector: z.string().min(1), text: z.string() });
const extractSchema = z.object({
  selector: z.string().optional(),
  attribute: z.string().optional(),
});
const screenshotSchema = z.object({ fullPage: z.boolean().optional() });
const loginSchema = z.object({
  url: z.string().url(),
  usernameSelector: z.string().min(1),
  passwordSelector: z.string().min(1),
  submitSelector: z.string().optional(),
});

async function stubBrowserAction(name: string, input: unknown) {
  return {
    ok: true,
    tool: name,
    mode: 'stub',
    input,
    message: `${name} is registered; wire BrowserOperator at runtime for live execution.`,
  };
}

export const browserNavigateTool = asTool({
  name: 'browser_navigate',
  description: 'Navigate the browser to a URL.',
  inputSchema: urlSchema,
  execute: async (_ctx, input) => stubBrowserAction('browser_navigate', input),
});

export const browserClickTool = asTool({
  name: 'browser_click',
  description: 'Click an element matched by selector.',
  inputSchema: clickSchema,
  execute: async (_ctx, input) => stubBrowserAction('browser_click', input),
});

export const browserTypeTool = asTool({
  name: 'browser_type',
  description: 'Type text into an input matched by selector.',
  inputSchema: typeSchema,
  execute: async (_ctx, input) => stubBrowserAction('browser_type', input),
});

export const browserExtractTool = asTool({
  name: 'browser_extract',
  description: 'Extract text or attribute from the current page.',
  inputSchema: extractSchema,
  execute: async (_ctx, input) => stubBrowserAction('browser_extract', input),
});

export const browserScreenshotTool = asTool({
  name: 'browser_screenshot',
  description: 'Capture a screenshot of the current page.',
  inputSchema: screenshotSchema,
  execute: async (_ctx, input) => stubBrowserAction('browser_screenshot', input),
});

export const browserLoginTool = asTool({
  name: 'browser_login',
  description: 'Log in using LoginSpecialist hints and secure credential injection.',
  inputSchema: loginSchema,
  execute: async (_ctx, input) => stubBrowserAction('browser_login', input),
});

export const browserTools = [
  browserNavigateTool,
  browserClickTool,
  browserTypeTool,
  browserExtractTool,
  browserScreenshotTool,
  browserLoginTool,
];