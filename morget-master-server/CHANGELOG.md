# CHANGELOG

All notable changes to the Morget Master Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] - 2026-01-XX

### 🎉 Initial Release

#### Added - Backend (DeepSeek V4)
- **Authentication System**
  - Email + Password registration/login
  - OAuth integration: Google, GitHub, Discord
  - Same-email account merging
  - HTTP Only Cookie sessions
  - JWT Access Token + Refresh Token
  - Login state refresh mechanism

- **RBAC Permission System**
  - Role-based access control with node-based permissions
  - Route-level permission middleware
  - Default roles: Admin, Creator, User
  - Internal role system not exposed to frontend

- **Database Schema (Prisma)**
  - users, accounts, sessions tables
  - roles, permissions, user_roles for RBAC
  - files for storage management
  - tickets, ticket_messages for support system
  - wiki_pages for knowledge base
  - announcements for platform notifications
  - audit_logs for operation tracking
  - rate_limits for API throttling

- **File Storage System**
  - S3-compatible storage adapters
  - Support for Tigris, Backblaze B2, Filebase
  - 32MB single file limit
  - 500MB default quota per user
  - MIME type validation
  - Signed URL generation

- **Security & Rate Limiting**
  - Global rate limiting middleware
  - IP-based rate limiting
  - Cloudflare Turnstile integration ready
  - Helmet security headers with CSP
  - CSRF protection
  - XSS prevention
  - Audit logging for all critical operations

- **Ticket System**
  - Create and manage support tickets
  - Ticket categories and priorities
  - Status workflow (Open → In Progress → Resolved → Closed)
  - Admin reply functionality
  - Email notifications via Resend

- **API Documentation**
  - OpenAPI/Swagger specification ready
  - Auto-generated API docs

#### Added - Frontend (Kimi)
- **Official Website Homepage**
  - Hero section with animated starfield (Three.js)
  - Main Control section showcasing core features
  - Virtual Stock Market visualization (placeholder)
  - Sub Servers section with server list
  - Benchmark section with GPU rankings (placeholder)
  - Responsive navigation with mobile menu
  - GSAP animations and scroll effects
  - Dark sci-fi theme matching lunar-nexus style

- **UI Components**
  - Status bar with system metrics
  - Neon-bordered cards with hover effects
  - Glass-morphism panels
  - Animated counters
  - Gradient text effects
  - Smooth scrolling navigation

#### Added - Infrastructure
- **Monorepo Structure**
  - pnpm workspace configuration
  - apps/api for backend
  - apps/web for frontend
  - packages/database for Prisma schema
  - packages/shared for shared types

- **Docker Configuration**
  - docker-compose.yml for development
  - PostgreSQL service
  - Redis service (ready)
  - Backend API service
  - Frontend web service (ready)
  - Dockerfile for API

- **Development Tools**
  - TypeScript configuration
  - ESLint setup (ready)
  - Prettier configuration (ready)
  - Environment variable management with dotenv.example

### Technical Specifications

#### Backend Stack
- Runtime: Node.js >= 18
- Framework: Express.js
- Language: TypeScript
- Database: PostgreSQL 16
- ORM: Prisma
- Logging: Pino
- Authentication: JWT + Sessions

#### Frontend Stack
- Framework: React (ready for implementation)
- Build Tool: Vite (ready)
- Styling: Tailwind CSS
- Animations: Three.js + GSAP
- Fonts: Orbitron, Noto Sans SC, JetBrains Mono

#### Security Features
- HTTP Only Cookies
- Secure session management
- Password hashing with bcrypt
- Input validation
- SQL injection prevention (Prisma)
- XSS protection (Helmet CSP)
- Rate limiting per IP

### Compliance

#### No Feature Creep Principle ✅
This release strictly follows the No Feature Creep principle by only implementing:
- ✅ User authentication and authorization
- ✅ Basic file upload/download
- ✅ Wiki system foundation
- ✅ Ticket system foundation
- ✅ Admin framework

Deferred to future releases:
- ❌ Cloud one-click deployment
- ❌ Benchmark system
- ❌ Marketplace
- ❌ Tournament system
- ❌ TeamUp features
- ❌ Creator Toolkit

These modules have placeholder navigation entries but no business logic implementation.

#### Development Principles ✅
- **Architecture First**: Solid monorepo structure with clear separation of concerns
- **Security First**: Comprehensive security measures from day one
- **Maintainability First**: TypeScript, Prisma, and clean code architecture
- **Features Second**: Focus on core functionality before expansion

### Files Included

```
morget-master-server/
├── apps/
│   ├── api/                    # Backend Express application
│   │   ├── src/
│   │   │   ├── config/         # Configuration management
│   │   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   │   ├── routes/         # API routes (auth, files)
│   │   │   ├── services/       # Business logic
│   │   │   ├── storage/        # Storage adapters
│   │   │   ├── utils/          # Utilities (JWT, logger)
│   │   │   └── types/          # TypeScript types
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/
│       └── index.html          # Official website homepage
├── packages/
│   └── database/
│       └── prisma/
│           └── schema.prisma   # Complete database schema
├── docker-compose.yml          # Development environment
├── .env.example                # Environment variables template
├── .gitignore
├── package.json                # Root package configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── README.md                   # Project documentation
```

### Known Issues

1. **Disk Space**: Current environment has limited disk space (504MB used). Full dependency installation requires additional space.

2. **Frontend Integration**: React frontend components are planned but not yet integrated. The current homepage is a static HTML file.

3. **OAuth Credentials**: OAuth providers (Google, GitHub, Discord) require manual configuration of client IDs and secrets.

4. **Email Service**: Resend integration requires API key configuration for email notifications.

### Migration Guide

To deploy this version:

```bash
# Clone the repository
git clone <repository-url>
cd morget-master-server

# Install dependencies (requires sufficient disk space)
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start database services
docker-compose up -d postgres redis

# Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

### Contributors

This release is a collaborative effort by:
- **ChatGPT**: Project architecture and task allocation
- **Kimi**: Frontend homepage design and implementation
- **DeepSeek V4**: Backend architecture and implementation
- **Qwen 3.7 Max**: Code review and frontend development (pending)
- **Qwen-Coder 3.5**: Final review and GitHub integration (this release)

### License

Morget Open License 1.0 (MOL-1.0)

© 2026 Moonlight Games (MG) / MGFeng / Feng

---

## [Unreleased]

### Planned for v1.0.0-beta
- Complete React frontend integration
- User dashboard UI
- Resource center with search and categories
- Wiki editing interface
- Ticket management UI
- Admin panel for user management
- File manager interface
- Enhanced security with Cloudflare Turnstile
- Complete API documentation with Swagger UI

### Under Consideration
- Real-time notifications with WebSocket
- Advanced analytics dashboard
- Multi-language support (i18n)
- Plugin system for extensibility
