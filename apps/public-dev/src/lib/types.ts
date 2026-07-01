// Project model + path-scoped file types are shared with the agent runtime via
// the @prototype/ide-tools package. Re-exported here so existing imports from
// `@/src/lib/types` keep working.
export type { DeployOverrides, ProjectMeta, FileNode } from '@prototype/ide-tools/types';

export type DeployFileChange = {
  path: string;
  action: 'upload' | 'create-dir';
  size?: number;
};

export type DeployPlan = {
  target: string;
  remoteDocroot: string;
  host: string;
  files: DeployFileChange[];
  totalBytes: number;
  ignored: string[];
};

export type DeployResult = {
  uploaded: number;
  bytes: number;
  backupPath?: string;
  startedAt: string;
  finishedAt: string;
};
