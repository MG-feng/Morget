# Morget Master Server v1

A complete resource management platform with OAuth authentication, file storage, wiki system, and ticket support.

## Architecture

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS
- **Authentication**: Email + Google + GitHub + Discord OAuth
- **Storage**: Tigris/Backblaze B2/Filebase (S3-compatible)
- **Deployment**: Docker + Hugging Face Spaces

## Project Structure

```
morget-master-server/
├── apps/
│   ├── api/          # Backend server
│   └── web/          # Frontend application
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   └── auth-utils/   # Shared authentication utilities
├── prisma/           # Database schema
└── docker/           # Docker configuration
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Redis >= 6 (optional for rate limiting)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Environment Variables

See `.env.example` for all required environment variables.

## Features

- ✅ User authentication (Email + OAuth)
- ✅ Role-based access control (RBAC)
- ✅ File upload/download with storage adapters
- ✅ Wiki system with Markdown support
- ✅ Ticket system for support
- ✅ Rate limiting and security middleware
- ✅ Admin dashboard
- ✅ Advertisement system
- ✅ Responsive UI with dark theme

## API Documentation

Once the server is running, visit `/api-docs` for Swagger documentation.

## Deployment

### Docker

```bash
docker-compose up -d
```

### Hugging Face Spaces

Follow the deployment guide in `docs/deployment.md`.

## License

MIT © Morget Team
