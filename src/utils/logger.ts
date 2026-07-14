import winston from 'winston';

const { combine, timestamp, errors, colorize, simple, json } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'warn',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    isDev ? combine(colorize(), simple()) : json()
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
