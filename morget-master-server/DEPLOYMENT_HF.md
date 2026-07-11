# Morget on Hugging Face Spaces - 部署指南

## 前提条件

1. **Aiven PostgreSQL 数据库** (已创建)
   - 主机：`moonlightgames-morget.a.aivencloud.com`
   - 端口：`27233`
   - 数据库：`defaultdb`
   - 用户：`avnadmin`
   - SSL 模式：`require`

2. **Hugging Face 账号**

---

## 第一步：准备环境变量

根据你的 Aiven 数据库信息，创建 `.env` 文件：

```bash
cd /workspace/morget-master-server
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```env
# Database (使用你的 Aiven PostgreSQL)
DATABASE_URL="postgresql://avnadmin:YOUR_PASSWORD@moonlightgames-morget.a.aivencloud.com:27233/defaultdb?sslmode=require"

# Server
NODE_ENV="production"
PORT=3001
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# JWT (生成随机密钥)
JWT_SECRET="替换为随机生成的 32 位以上密钥"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# OAuth (可选，先留空)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL=""

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITHUB_CALLBACK_URL=""

DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_CALLBACK_URL=""

# Email (可选)
RESEND_API_KEY=""
EMAIL_FROM="noreply@morget.com"

# Storage (可选，先不使用)
STORAGE_PROVIDER="tigris"
STORAGE_ENDPOINT=""
STORAGE_REGION="auto"
STORAGE_BUCKET="morget-files"
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# File Limits
MAX_FILE_SIZE_MB=32
DEFAULT_STORAGE_QUOTA_MB=500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cloudflare Turnstile (可选)
TURNSTILE_SECRET_KEY=""
TURNSTILE_SITE_KEY=""

# Security
CORS_ORIGINS="*"
COOKIE_SECRET="替换为随机生成的 32 位以上密钥"
```

### 生成随机密钥

```bash
# 生成 JWT_SECRET
openssl rand -base64 32

# 生成 COOKIE_SECRET
openssl rand -base64 32
```

---

## 第二步：初始化数据库

在本地或任何可以连接 Aiven 数据库的环境中运行：

```bash
cd /workspace/morget-master-server

# 安装依赖
pnpm install

# 生成 Prisma 客户端
pnpm --filter @morget/database prisma generate

# 执行数据库迁移
DATABASE_URL="postgresql://avnadmin:YOUR_PASSWORD@moonlightgames-morget.a.aivencloud.com:27233/defaultdb?sslmode=require" \
pnpm --filter @morget/database prisma migrate deploy

# (可选) 创建初始管理员账号
DATABASE_URL="postgresql://avnadmin:YOUR_PASSWORD@moonlightgames-morget.a.aivencloud.com:27233/defaultdb?sslmode=require" \
pnpm --filter @morget/database prisma db seed
```

---

## 第三步：在 Hugging Face 创建 Space

1. 访问 https://huggingface.co/spaces
2. 点击 **"Create new Space"**
3. 填写信息：
   - **Space name**: `morget` (或其他你喜欢的名字)
   - **License**: MIT
   - **Space SDK**: 选择 **Docker**
   - **Visibility**: Public 或 Private
4. 点击 **"Create Space"**

---

## 第四步：推送代码到 Hugging Face

### 方法 A：使用 Git 推送（推荐）

```bash
# 进入项目目录
cd /workspace/morget-master-server

# 添加 Hugging Face 远程仓库
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/morget

# 如果使用 HTTPS 认证，建议配置 Git 凭证缓存
git config --global credential.helper store

# 推送到 Hugging Face
git push hf main
```

首次推送时会要求输入 Hugging Face 的用户名和密码（或 Access Token）。

### 方法 B：在 Hugging Face 界面上传

1. 在你的 Space 页面，点击 **"Files"** 标签
2. 点击 **"Add file"** → **"Upload files"**
3. 上传所有项目文件
4. 点击 **"Commit changes to main"**

---

## 第五步：配置 Hugging Face Secrets

在 Hugging Face Space 页面：

1. 点击右上角的 **"Settings"** 标签
2. 向下滚动到 **"Variables and secrets"** 部分
3. 点击 **"New secret"**
4. 添加以下环境变量（不要添加 DATABASE_URL，直接写在代码里或使用 Variable）：

| Name | Value |
|------|-------|
| `JWT_SECRET` | 你的 JWT 密钥 |
| `COOKIE_SECRET` | 你的 Cookie 密钥 |
| `GOOGLE_CLIENT_ID` | (可选) Google OAuth ID |
| `GOOGLE_CLIENT_SECRET` | (可选) Google OAuth 密钥 |
| `GITHUB_CLIENT_ID` | (可选) GitHub OAuth ID |
| `GITHUB_CLIENT_SECRET` | (可选) GitHub OAuth 密钥 |
| `DISCORD_CLIENT_ID` | (可选) Discord OAuth ID |
| `DISCORD_CLIENT_SECRET` | (可选) Discord OAuth 密钥 |
| `RESEND_API_KEY` | (可选) Resend API 密钥 |
| `STORAGE_ACCESS_KEY` | (可选) 存储密钥 |
| `STORAGE_SECRET_KEY` | (可选) 存储密钥 |
| `TURNSTILE_SECRET_KEY` | (可选) Turnstile 密钥 |

**重要：** `DATABASE_URL` 包含密码，建议使用 **Variable** 而不是 Secret，或者在推送前修改代码使用环境变量。

---

## 第六步：修改 Dockerfile

Hugging Face 会自动检测并使用根目录的 `Dockerfile`。

将我们创建的 `Dockerfile.hf` 重命名为 `Dockerfile`：

```bash
mv Dockerfile.hf Dockerfile
```

然后提交更改：

```bash
git add Dockerfile
git commit -m "Add Hugging Face Dockerfile"
git push hf main
```

---

## 第七步：等待构建和部署

1. 返回 Hugging Face Space 页面
2. 点击 **"Logs"** 标签查看构建进度
3. 构建过程大约需要 5-10 分钟
4. 构建完成后，Space 会自动启动

---

## 第八步：验证部署

1. 在 Space 页面点击 **"Open this Space"**
2. 访问前端：`https://YOUR_USERNAME-morget.hf.space/`
3. 访问 API：`https://YOUR_USERNAME-morget.hf.space/api/health`

如果看到 `OK` 响应，说明部署成功！

---

## 常见问题排查

### 1. 构建失败

查看 Logs 标签，常见错误：
- **依赖安装失败**：检查 `package.json` 是否正确
- **Prisma 生成失败**：确保 `schema.prisma` 语法正确
- **内存不足**：Hugging Face 免费层有内存限制，考虑升级

### 2. 数据库连接失败

- 检查 Aiven 数据库是否允许公网访问（IP allowlist）
- 确认 `DATABASE_URL` 格式正确
- 确保 SSL 模式设置为 `require`
- 在 Aiven 控制台下载 CA 证书并在连接字符串中使用

### 3. CORS 错误

确保 `.env` 中 `CORS_ORIGINS` 设置为 `*` 或你的域名。

### 4. 前端无法访问 API

检查 nginx 配置是否正确代理 `/api` 请求到后端。

---

## 后续优化

### 1. 使用 Hugging Face Variables

在 Space Settings 中配置 Variables 而不是硬编码在代码中：
- `DATABASE_URL`
- `NODE_ENV`
- `PORT`

### 2. 启用 OAuth 登录

1. 在 Google/GitHub/Discord 开发者控制台创建应用
2. 设置回调 URL 为你的 Space 地址
3. 在 Hugging Face Secrets 中添加凭据

### 3. 配置自定义域名

在 Space Settings 中配置自定义域名以获得更好的品牌展示。

### 4. 监控和日志

- 使用 Hugging Face Logs 标签监控运行状态
- 集成 Sentry 进行错误追踪
- 使用 Aiven 的监控功能查看数据库性能

---

## 安全注意事项

1. **不要在 Git 仓库中提交 `.env` 文件**
2. **定期轮换密钥**（JWT_SECRET, COOKIE_SECRET 等）
3. **启用 OAuth 时限制回调 URL**
4. **在 Aiven 中限制 IP 白名单**（如果可能）
5. **定期备份数据库**

---

## 资源链接

- [Hugging Face Spaces 文档](https://huggingface.co/docs/hub/spaces-sdks-docker)
- [Aiven PostgreSQL 文档](https://docs.aiven.io/docs/products/postgresql)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [Morget GitHub 仓库](https://github.com/YOUR_USERNAME/morget-master-server)

---

**祝你部署顺利！** 🚀

如有问题，请查看 Hugging Face Logs 或 Aiven 控制台获取详细错误信息。
