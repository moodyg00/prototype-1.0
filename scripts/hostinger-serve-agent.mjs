// TEMPORARY DIAGNOSTIC — plain HTTP server to verify Hostinger port binding
import { createServer } from 'node:http';
const port = +(process.env.PORT ?? '3000');
const server = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(`agent-infra-ok cwd=${process.cwd()} port=${port}`);
});
server.listen(port, '0.0.0.0', () => {
  console.error(`[agent-diag] listening port=${port} cwd=${process.cwd()}`);
});
