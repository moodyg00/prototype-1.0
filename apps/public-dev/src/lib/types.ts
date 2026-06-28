/**
 * Optional per-project deploy overrides. Anything left blank falls back to the
 * target's environment config (DEPLOY_<TARGET>_*). Secrets (passphrase) are
 * intentionally NOT storable per project — keep those in env only.
 */
export type DeployOverrides = {
  host?: string;
  port?: number;
  user?: string;
  sshKeyPath?: string;
  docroot?: string;
};

export type ProjectMeta = {
  slug: string;
  name: string;
  description?: string;
  target: string;
  deploy?: DeployOverrides;
  createdAt: string;
  updatedAt: string;
};

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
};

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
