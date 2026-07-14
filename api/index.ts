import app from '../src/app';
import { prisma } from '../src/config/database';
import { redis } from '../src/config/redis';
import { connectMongoDB } from '../src/config/mongodb';
import { env } from '../src/config/env';

// Initialize connections once (Vercel may reuse the function instance)
let initialized = false;

const init = async () => {
  if (initialized) return;
  await prisma.$connect();
  await redis.connect();
  if (env.MONGODB_URI) await connectMongoDB(env.MONGODB_URI);
  initialized = true;
};

init().catch(console.error);

export default app;
