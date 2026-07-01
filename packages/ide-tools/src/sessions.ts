import fs from 'node:fs/promises';

import { resolveInProject } from './project-fs';
import { ensureAgentDirs, SESSIONS_DIR } from './checkpoints';
import type { ChatMessageRecord, ChatSession, ChatSessionMeta } from './types';

export type { ChatMessageRecord, ChatSession, ChatSessionMeta } from './types';

function newSessionId(): string {
  return globalThis.crypto.randomUUID();
}

function sessionsRoot(slug: string): string {
  return resolveInProject(slug, SESSIONS_DIR);
}

function sessionPath(slug: string, id: string): string {
  return resolveInProject(slug, `${SESSIONS_DIR}/${id}.json`);
}

function indexPath(slug: string): string {
  return resolveInProject(slug, `${SESSIONS_DIR}/index.json`);
}

async function readIndex(slug: string): Promise<ChatSessionMeta[]> {
  try {
    const raw = await fs.readFile(indexPath(slug), 'utf8');
    const parsed = JSON.parse(raw) as ChatSessionMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeIndex(slug: string, entries: ChatSessionMeta[]): Promise<void> {
  await fs.writeFile(indexPath(slug), JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

function titleFromMessages(messages: ChatMessageRecord[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first?.content.trim()) return 'New chat';
  const t = first.content.trim().replace(/\s+/g, ' ');
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}

export async function listChatSessions(slug: string): Promise<ChatSessionMeta[]> {
  await ensureAgentDirs(slug);
  const index = await readIndex(slug);
  return index.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getChatSession(slug: string, id: string): Promise<ChatSession | null> {
  await ensureAgentDirs(slug);
  try {
    const raw = await fs.readFile(sessionPath(slug, id), 'utf8');
    return JSON.parse(raw) as ChatSession;
  } catch {
    return null;
  }
}

export async function createChatSession(slug: string, title?: string): Promise<ChatSession> {
  await ensureAgentDirs(slug);
  const now = new Date().toISOString();
  const id = newSessionId();
  const session: ChatSession = {
    id,
    title: title?.trim() || 'New chat',
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    messages: [],
    threadId: newSessionId(),
  };
  await fs.writeFile(sessionPath(slug, id), JSON.stringify(session, null, 2) + '\n', 'utf8');
  const index = await readIndex(slug);
  index.unshift({
    id,
    title: session.title,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  });
  await writeIndex(slug, index);
  return session;
}

export async function updateChatSession(
  slug: string,
  id: string,
  patch: { messages?: ChatMessageRecord[]; title?: string; threadId?: string },
): Promise<ChatSession | null> {
  const current = await getChatSession(slug, id);
  if (!current) return null;
  const now = new Date().toISOString();
  const messages = patch.messages ?? current.messages;
  const next: ChatSession = {
    ...current,
    messages,
    title: patch.title?.trim() || (messages.length ? titleFromMessages(messages) : current.title),
    threadId: patch.threadId ?? current.threadId,
    updatedAt: now,
    messageCount: messages.length,
  };
  await fs.writeFile(sessionPath(slug, id), JSON.stringify(next, null, 2) + '\n', 'utf8');
  const index = await readIndex(slug);
  const idx = index.findIndex((e) => e.id === id);
  const meta: ChatSessionMeta = {
    id,
    title: next.title,
    createdAt: current.createdAt,
    updatedAt: now,
    messageCount: messages.length,
  };
  if (idx >= 0) index[idx] = meta;
  else index.unshift(meta);
  await writeIndex(slug, index);
  return next;
}

export async function deleteChatSession(slug: string, id: string): Promise<boolean> {
  await ensureAgentDirs(slug);
  try {
    await fs.unlink(sessionPath(slug, id));
  } catch {
    return false;
  }
  const index = await readIndex(slug);
  await writeIndex(
    slug,
    index.filter((e) => e.id !== id),
  );
  return true;
}
