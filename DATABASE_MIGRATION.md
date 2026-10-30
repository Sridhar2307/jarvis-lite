# Database Migration Guide: SQLite to PostgreSQL

Jarvis Lite is built on **Prisma ORM**, which means migrating from zero-config local SQLite (`dev.db`) to enterprise **PostgreSQL** takes less than 2 minutes.

---

## Option A: One-Click Local PostgreSQL via Docker

Run the included [`docker-compose.yml`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/docker-compose.yml):

```powershell
docker compose up -d
```

Update your `.env`:
```env
DATABASE_URL="postgresql://jarvis_admin:jarvis_secure_password_2026!@localhost:5432/jarvis_lite?schema=public"
```

---

## Option B: Cloud PostgreSQL (Supabase / Neon / AWS RDS)

1. Create a free project on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy your connection string into `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
   ```

---

## Step 3: Switch Prisma Provider

Open [`prisma/schema.prisma`](file:///c:/Users/Sridhar's%20Nitro/Documents/jarvis%20lite/prisma/schema.prisma) and change line 2:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 4: Push Schema & Migrate Data

Run:
```powershell
# Take a snapshot of existing records
npx tsx scripts/migrate-to-postgres.ts

# Push models directly to the PostgreSQL database
npx prisma db push
```

All 17 models, indexes, cascading relations, and foreign keys will be created instantly in PostgreSQL!

