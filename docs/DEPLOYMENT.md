# JARVIS LITE + NEXORA PRODUCTION DEPLOYMENT GUIDE

## 1. Environment Preparation

### Recommended Production Stack
- **OS**: Ubuntu 22.04 LTS or Windows Server 2022
- **Node.js**: 20 LTS
- **Python**: 3.11 - 3.14
- **Database**: PostgreSQL 16 (Managed AWS RDS, Google Cloud SQL, or Supabase)
- **Reverse Proxy**: Nginx or Cloudflare with SSL and WebSocket/SSE support

---

## 2. Environment Variables (.env)

```env
# Database
DATABASE_URL="postgresql://jarvis_user:secure_password@postgres-host:5432/jarvis_lite?schema=public"

# Central Auth Secret (Minimum 32 random characters)
AUTH_SECRET="your-ultra-secure-random-32-character-secret-key-2026"

# AI Integrations
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY=""

# Base URL
JARVIS_BASE_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## 3. Production Build & Deployment

```bash
# 1. Install dependencies
npm ci

# 2. Push database schema & generate Prisma Client
npx prisma db push
npx prisma generate

# 3. Build Next.js application
npm run build

# 4. Start production server (PM2 or Docker)
npm run start
```

---

## 4. Reverse Proxy (Nginx) Configuration for SSE & WebSockets

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Disable buffering for SSE stream
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```
