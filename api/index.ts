import app from '../src/app';
import { prisma } from '../src/config/database';
import { redis } from '../src/config/redis';

// Initialize connections once (Vercel may reuse the function instance)
let initialized = false;

const init = async () => {
  if (initialized) return;
  await prisma.$connect();
  await redis.connect();
  initialized = true;
};

init().catch(console.error);

export default app;
