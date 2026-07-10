import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError, ErrorCodes } from '../middleware/errorHandler';

export interface StorageAdapter {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getUrl(key: string): string;
}

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = config.storageBucket;
    
    this.client = new S3Client({
      region: config.storageRegion,
      endpoint: config.storageEndpoint || undefined,
      credentials: {
        accessKeyId: config.storageAccessKey,
        secretAccessKey: config.storageSecretKey,
      },
      forcePathStyle: true, // Required for most S3-compatible providers
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.client.send(command);
      logger.info({ key, bucket: this.bucket }, 'File uploaded to storage');
      
      return this.getUrl(key);
    } catch (error: any) {
      logger.error({ error, key }, 'Failed to upload file');
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to upload file to storage');
    }
  }

  async download(key: string): Promise<NodeJS.ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'File not found');
      }

      return response.Body as NodeJS.ReadableStream;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        throw new AppError(ErrorCodes.NOT_FOUND, 'File not found in storage');
      }
      logger.error({ error, key }, 'Failed to download file');
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to download file');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      logger.info({ key }, 'File deleted from storage');
    } catch (error: any) {
      logger.error({ error, key }, 'Failed to delete file');
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to delete file');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.name === '404') {
        return false;
      }
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error: any) {
      logger.error({ error, key }, 'Failed to generate signed URL');
      throw new AppError(ErrorCodes.INTERNAL_ERROR, 'Failed to generate download URL');
    }
  }

  getUrl(key: string): string {
    if (config.storageEndpoint) {
      return `${config.storageEndpoint}/${this.bucket}/${key}`;
    }
    // For providers with virtual hosting
    return `https://${this.bucket}.s3.${config.storageRegion}.amazonaws.com/${key}`;
  }
}

// Factory function to create storage adapter
export function createStorageAdapter(): StorageAdapter {
  logger.info({ provider: config.storageProvider }, 'Initializing storage adapter');
  
  switch (config.storageProvider.toLowerCase()) {
    case 'tigris':
    case 'backblaze':
    case 'filebase':
    case 's3':
      return new S3StorageAdapter();
    default:
      logger.warn({ provider: config.storageProvider }, 'Unknown storage provider, using S3 adapter');
      return new S3StorageAdapter();
  }
}

export const storage = createStorageAdapter();
