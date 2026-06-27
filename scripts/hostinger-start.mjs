import { startStandaloneServer } from './hostinger-serve-core.mjs';

const app = process.env.HOSTINGER_APP;
if (app !== 'admin' && app !== 'agent') {
  console.error('Set HOSTINGER_APP=admin or HOSTINGER_APP=agent');
  process.exit(1);
}

startStandaloneServer(app);