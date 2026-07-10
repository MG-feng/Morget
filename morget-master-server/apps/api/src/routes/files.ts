import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { storage } from '../storage';
import { prisma } from '../services/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { AppError, ErrorCodes } from '../middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024, // Convert to bytes
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'application/json',
      'video/mp4',
      'audio/mpeg',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(ErrorCodes.INVALID_FILE_TYPE, `File type ${file.mimetype} not allowed`));
    }
  },
});

// Upload file
router.post(
  '/upload',
  authenticate,
  uploadRateLimiter,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'No file provided');
      }

      if (!req.user) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'User not found');
      }

      // Check storage quota
      const newSize = user.storageUsed + BigInt(req.file.size);
      if (newSize > user.storageQuota) {
        throw new AppError(
          ErrorCodes.STORAGE_QUOTA_EXCEEDED,
          `Storage quota exceeded. Used: ${Number(user.storageUsed) / 1024 / 1024}MB, Limit: ${Number(user.storageQuota) / 1024 / 1024}MB`
        );
      }

      // Generate unique filename
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const storageKey = `files/${req.user.id}/${filename}`;

      // Upload to storage
      const url = await storage.upload(storageKey, req.file.buffer, req.file.mimetype);

      // Create file record
      const file = await prisma.file.create({
        data: {
          userId: req.user.id,
          filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: BigInt(req.file.size),
          storageKey,
          storageProvider: config.storageProvider,
        },
      });

      // Update user storage used
      await prisma.user.update({
        where: { id: req.user.id },
        data: { storageUsed: newSize },
      });

      logger.info({ fileId: file.id, userId: req.user.id, filename }, 'File uploaded successfully');

      res.json(createSuccessResponse({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: Number(file.size),
        url,
        createdAt: file.createdAt,
      }, 'File uploaded successfully'));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error }, 'File upload error');
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to upload file');
    }
  }
);

// Get user files
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const files = await prisma.file.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(createSuccessResponse(files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      downloads: file.downloads,
      isPublic: file.isPublic,
      createdAt: file.createdAt,
    }))));
  } catch (error) {
    logger.error({ error }, 'Get files error');
    throw error;
  }
});

// Download file
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'File not found');
    }

    // Check permission (owner or public)
    if (file.userId !== req.user.id && !file.isPublic) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied');
    }

    // Generate signed URL
    const downloadUrl = await storage.getSignedUrl(file.storageKey);

    // Increment download count
    await prisma.file.update({
      where: { id: file.id },
      data: { downloads: file.downloads + 1 },
    });

    logger.info({ fileId: file.id, userId: req.user.id }, 'File downloaded');

    res.json(createSuccessResponse({
      downloadUrl,
      filename: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
    }));
  } catch (error) {
    logger.error({ error }, 'Download file error');
    throw error;
  }
});

// Delete file
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'File not found');
    }

    // Check ownership
    if (file.userId !== req.user.id) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot delete file you do not own');
    }

    // Delete from storage
    await storage.delete(file.storageKey);

    // Delete from database
    await prisma.file.delete({
      where: { id: file.id },
    });

    // Update user storage used
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { storageUsed: user.storageUsed - file.size },
      });
    }

    logger.info({ fileId: file.id, userId: req.user.id }, 'File deleted successfully');

    res.json(createSuccessResponse(null, 'File deleted successfully'));
  } catch (error) {
    logger.error({ error }, 'Delete file error');
    throw error;
  }
});

// Get storage info
router.get('/storage/info', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        storageUsed: true,
        storageQuota: true,
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found');
    }

    res.json(createSuccessResponse({
      used: Number(user.storageUsed),
      usedFormatted: `${(Number(user.storageUsed) / 1024 / 1024).toFixed(2)} MB`,
      quota: Number(user.storageQuota),
      quotaFormatted: `${(Number(user.storageQuota) / 1024 / 1024).toFixed(2)} MB`,
      percentage: ((Number(user.storageUsed) / Number(user.storageQuota)) * 100).toFixed(2),
      remaining: Number(user.storageQuota) - Number(user.storageUsed),
      remainingFormatted: `${((Number(user.storageQuota) - Number(user.storageUsed)) / 1024 / 1024).toFixed(2)} MB`,
    }));
  } catch (error) {
    logger.error({ error }, 'Get storage info error');
    throw error;
  }
});

export default router;
