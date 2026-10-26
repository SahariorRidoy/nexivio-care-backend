import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { prisma } from './config/database';
import { redis } from './config/redis';

const app = express();

// Allow uploaded assets to be embedded cross-origin (admin/frontend on other ports).
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR ?? 'uploads')));

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

const checkServices = async (): Promise<{ database: boolean; redis: boolean }> => {
  const database = await withTimeout(prisma.$queryRaw`SELECT 1`, 3000)
    .then(() => true)
    .catch(() => false);

  return { database, redis: redis.status === 'ready' };
};

app.get('/', async (_req, res) => {
  const services = await checkServices();

  res.status(services.database ? 200 : 503).json({
    name: 'Nexivio Care API',
    version: '1.0.0',
    status: services.database ? 'running' : 'degraded',
    services,
    docs: '/api/v1',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (_req, res) => {
  const services = await checkServices();

  res.status(services.database ? 200 : 503).json({
    status: services.database ? 'ok' : 'degraded',
    services,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);

app.use(errorMiddleware);

export default app;
