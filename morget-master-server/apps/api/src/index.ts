import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './services/database';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(config.cookieSecret));

// Passport
app.use(passport.initialize());

// Rate limiting
app.use(globalRateLimiter);

// API Routes
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Morget API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiDocs: '/api-docs',
      auth: '/auth',
      files: '/files',
    },
  });
});

// Swagger documentation
const swaggerPath = path.join(__dirname, '../swagger/swagger.json');
if (fs.existsSync(swaggerPath)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  // Basic swagger doc if file doesn't exist
  const swaggerDoc = {
    openapi: '3.0.0',
    info: {
      title: 'Morget API',
      version: '1.0.0',
      description: 'Morget Master Server API Documentation',
    },
    servers: [
      {
        url: config.apiUrl,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
    paths: {},
  };
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize default roles if they don't exist
    await initializeRoles();

    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, `Morget API server running`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API Docs: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

async function initializeRoles() {
  const defaultRoles = [
    { name: 'admin', displayName: '管理员', description: 'Full system access', priority: 100 },
    { name: 'creator', displayName: '创作者', description: 'Can create and manage resources', priority: 50 },
    { name: 'user', displayName: '普通用户', description: 'Basic user access', priority: 10 },
  ];

  for (const roleData of defaultRoles) {
    const existing = await prisma.role.findUnique({ where: { name: roleData.name } });
    if (!existing) {
      await prisma.role.create({ data: roleData });
      logger.info({ role: roleData.name }, 'Created default role');
    }
  }

  // Create default permissions
  const defaultPermissions = [
    { name: 'files.upload', resource: 'files', action: 'create', description: 'Upload files' },
    { name: 'files.download', resource: 'files', action: 'read', description: 'Download files' },
    { name: 'files.delete', resource: 'files', action: 'delete', description: 'Delete own files' },
    { name: 'wiki.read', resource: 'wiki', action: 'read', description: 'Read wiki pages' },
    { name: 'wiki.edit', resource: 'wiki', action: 'update', description: 'Edit wiki pages' },
    { name: 'wiki.create', resource: 'wiki', action: 'create', description: 'Create wiki pages' },
    { name: 'tickets.create', resource: 'tickets', action: 'create', description: 'Create support tickets' },
    { name: 'tickets.view', resource: 'tickets', action: 'read', description: 'View tickets' },
    { name: 'admin.access', resource: 'admin', action: 'read', description: 'Access admin panel' },
  ];

  for (const permData of defaultPermissions) {
    const existing = await prisma.permission.findUnique({ where: { name: permData.name } });
    if (!existing) {
      await prisma.permission.create({ data: permData });
      logger.info({ permission: permData.name }, 'Created default permission');
    }
  }

  // Assign permissions to roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const creatorRole = await prisma.role.findUnique({ where: { name: 'creator' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });

  if (adminRole) {
    const allPermissions = await prisma.permission.findMany();
    await prisma.role.update({
      where: { id: adminRole.id },
      data: { permissions: { connect: allPermissions.map(p => ({ id: p.id })) } },
    });
    logger.info('Assigned all permissions to admin role');
  }

  if (creatorRole) {
    const creatorPermissions = await prisma.permission.findMany({
      where: { resource: { in: ['files', 'wiki', 'tickets'] } },
    });
    await prisma.role.update({
      where: { id: creatorRole.id },
      data: { permissions: { connect: creatorPermissions.map(p => ({ id: p.id })) } },
    });
    logger.info('Assigned creator permissions');
  }

  if (userRole) {
    const userPermissions = await prisma.permission.findMany({
      where: { name: { in: ['files.upload', 'files.download', 'wiki.read', 'tickets.create', 'tickets.view'] } },
    });
    await prisma.role.update({
      where: { id: userRole.id },
      data: { permissions: { connect: userPermissions.map(p => ({ id: p.id })) } },
    });
    logger.info('Assigned user permissions');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
