import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../services/database';
import { AppError, ErrorCodes } from '../middleware/errorHandler';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    roles: string[];
    permissions: string[];
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from cookie or header
    let token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'No authentication token provided', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    if (decoded.type !== 'access') {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 'Invalid token type', 401);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not found', 401);
    }

    // Check if banned
    if (user.isBanned) {
      throw new AppError(
        ErrorCodes.ACCOUNT_BANNED,
        `Account banned: ${user.banReason || 'No reason provided'}`,
        403
      );
    }

    // Extract roles and permissions
    const roles = user.roles.map(ur => ur.role.displayName);
    const permissions = user.roles.flatMap(ur => ur.role.permissions.map(p => p.name));

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(ErrorCodes.INVALID_TOKEN, 'Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(ErrorCodes.TOKEN_EXPIRED, 'Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401));
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new AppError(ErrorCodes.PERMISSION_DENIED, `Permission ${permission} required`, 403));
    }

    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401));
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return next(new AppError(ErrorCodes.FORBIDDEN, `One of roles [${roles.join(', ')}] required`, 403));
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authenticate(req, res, () => next());
  } catch {
    // Ignore errors, user is optional
    next();
  }
};
