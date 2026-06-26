import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { assertWorkerReady, workerConfig } from './config';
import { jobHandlers } from './jobs/index';

function readBearerToken(request: IncomingMessage): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function isAuthorized(request: IncomingMessage): boolean {
  const secret = workerConfig.cronSecret;
  if (!secret) return false;
  const bearer = readBearerToken(request);
  if (bearer === secret) return true;
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  return url.searchParams.get('secret') === secret;
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  if (request.method === 'GET' && pathname === '/health') {
    sendJson(response, 200, { ok: true, service: 'worker' });
    return;
  }

  const jobMatch = pathname.match(/^\/jobs\/([a-z0-9-]+)$/);
  if (jobMatch && (request.method === 'GET' || request.method === 'POST')) {
    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: 'Unauthorized.' });
      return;
    }

    const jobName = jobMatch[1];
    const handler = jobHandlers[jobName];
    if (!handler) {
      sendJson(response, 404, { error: `Unknown job: ${jobName}` });
      return;
    }

    const result = await handler();
    sendJson(response, result.ok ? 200 : 500, result);
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
}

export function startWorkerServer(): void {
  assertWorkerReady();

  const server = createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Internal worker error.',
      });
    });
  });

  server.listen(workerConfig.port, () => {
    console.log(`[worker] listening on http://127.0.0.1:${workerConfig.port}`);
    console.log(`[worker] admin base: ${workerConfig.adminBaseUrl}`);
    console.log(`[worker] jobs: ${Object.keys(jobHandlers).join(', ')}`);
  });
}
