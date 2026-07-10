import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createErrorResponse, ErrorCodes } from '../types';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    err,
    path: req.path,
    method: req.method,
    ip: req.ip,
  }, 'Request error');

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(createErrorResponse(err.code, err.message, err.details));
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Database error'));
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(createErrorResponse(ErrorCodes.INVALID_INPUT, 'Invalid JSON'));
  }

  // Default error
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json(
    createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      isProduction ? 'Internal server error' : err.message
    )
  );
};

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `Route ${req.method} ${req.path} not found`)
  );
};
