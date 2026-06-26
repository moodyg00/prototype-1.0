import { startHostingerApp } from './hostinger-serve-lib.mjs';

const app = process.env.HOSTINGER_APP;
if (app !== 'admin' && app !== 'agent') {
  console.error('Set HOSTINGER_APP=admin or HOSTINGER_APP=agent in Hostinger env vars.');
  process.exit(1);
}

startHostingerApp(app);
