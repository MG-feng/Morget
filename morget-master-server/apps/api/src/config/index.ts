import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // OAuth - Google
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',

  // OAuth - GitHub
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback',

  // OAuth - Discord
  discordClientId: process.env.DISCORD_CLIENT_ID || '',
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  discordCallbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/auth/discord/callback',

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@morget.com',

  // Storage
  storageProvider: process.env.STORAGE_PROVIDER || 'tigris',
  storageEndpoint: process.env.STORAGE_ENDPOINT || '',
  storageRegion: process.env.STORAGE_REGION || 'auto',
  storageBucket: process.env.STORAGE_BUCKET || 'morget-files',
  storageAccessKey: process.env.STORAGE_ACCESS_KEY || '',
  storageSecretKey: process.env.STORAGE_SECRET_KEY || '',

  // File Limits
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '32', 10),
  defaultStorageQuotaMb: parseInt(process.env.DEFAULT_STORAGE_QUOTA_MB || '500', 10),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Cloudflare Turnstile
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',

  // Security
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  cookieSecret: process.env.COOKIE_SECRET || 'fallback-cookie-secret',
};

export type Config = typeof config;
