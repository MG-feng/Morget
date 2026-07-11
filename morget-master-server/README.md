# Morget Master Server v1

A complete resource management platform with OAuth authentication, file storage, wiki system, and ticket support.

## Architecture

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS
- **Authentication**: Email + Google + GitHub + Discord OAuth
- **Storage**: Tigris/Backblaze B2/Filebase (S3-compatible)
- **Deployment**: Docker + Hugging Face Spaces

## 🚀 Quick Start

### Deploy to Hugging Face Spaces (Recommended)

We provide a complete deployment guide for Hugging Face Spaces with Aiven PostgreSQL:

📖 **See [DEPLOYMENT_HF.md](./DEPLOYMENT_HF.md) for detailed steps**

Quick overview:
1. Configure your Aiven PostgreSQL connection
2. Create a Docker Space on Hugging Face
3. Push code and configure secrets
4. Wait for automatic build and deployment

Your app will be available at: `https://YOUR_USERNAME-morget.hf.space`

### Local Development

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
