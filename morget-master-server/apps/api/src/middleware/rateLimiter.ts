import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { createErrorResponse, ErrorCodes } from '../types';
import { logger } from '../utils/logger';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes by default
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: createErrorResponse(ErrorCodes.RATE_LIMITED, 'Too many requests, please try again later'),
  keyGenerator: (req) => {
    return req.user?.id || req.ip || 'unknown';
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json(createErrorResponse(ErrorCodes.RATE_LIMITED, 'Too many requests'));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: createErrorResponse(ErrorCodes.RATE_LIMITED, 'Too many authentication attempts'),
  keyGenerator: (req) => req.ip || 'unknown',
  skipSuccessfulRequests: true,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: createErrorResponse(ErrorCodes.RATE_LIMITED, 'Upload limit exceeded'),
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: createErrorResponse(ErrorCodes.RATE_LIMITED, 'API rate limit exceeded'),
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
});
