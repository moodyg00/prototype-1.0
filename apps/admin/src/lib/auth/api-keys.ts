import { randomBytes } from 'node:crypto';

/** Generate a unique server-to-server API key for automation/agent users. */
export function generateUserApiKey(): string {
  return `usr_${randomBytes(32).toString('base64url')}`;
}
