import { coreTools, toolRegistry } from './tools';

let bootstrapped = false;

export function bootstrapAgents(): void {
  if (bootstrapped) return;
  toolRegistry.registerMany(coreTools);
  bootstrapped = true;
}

export function isAgentsBootstrapped(): boolean {
  return bootstrapped;
}