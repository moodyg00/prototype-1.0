/**
 * Path-scoped project file access for the public-dev IDE.
 *
 * The implementation now lives in the shared `@prototype/ide-tools` package so
 * the exact same path-scoping and filesystem layer is reused by the agent
 * workflow runtime in apps/agent. This module re-exports it unchanged.
 */
export {
  findRepoRoot,
  getPublicDevRoot,
  getSitesRoot,
  getDefaultLiveDocroot,
  isValidSlug,
  getProjectRoot,
  resolveInProject,
  toProjectRelative,
  updateProject,
  listProjects,
  projectExists,
  getProject,
  createProject,
  touchProject,
  listFiles,
  readFile,
  writeFile,
  deleteFile,
  isDescendantOrSelf,
  writeBinaryFile,
  uploadFiles,
  moveEntry,
  duplicateFile,
  createFile,
  listChatSessions,
  getChatSession,
  createChatSession,
  updateChatSession,
  deleteChatSession,
} from '@prototype/ide-tools';

export type { FileNode, ProjectMeta, ChatSession, ChatSessionMeta, ChatMessageRecord } from '@prototype/ide-tools';
