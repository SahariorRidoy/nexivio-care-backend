import mongoose from 'mongoose';
import logger from '../utils/logger';

let isConnected = false;

export const connectMongoDB = async (uri: string): Promise<void> => {
  if (isConnected) return;
  await mongoose.connect(uri, { dbName: 'nexivio-care' });
  isConnected = true;
  logger.info('MongoDB connected');
};

export const disconnectMongoDB = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
};
