# Cisco Order Tracking

React app with **MongoDB** storage, **login-only** auth (no sign-up), and deployment on **Vercel**.

## Features

| Role | Permissions |
|------|-------------|
| **Guest** | View orders, search, export JSON |
| **Signed in** | Add, update, delete (single + bulk), import JSON |

Users are created via the **seed script** only — the app has no registration flow.

## Stack

- **Frontend:** React (Vite) in `client/`
- **API:** Vercel serverless functions in `api/`
- **Database:** MongoDB Atlas
- **Auth:** Email/password + JWT (7-day token)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster
- [Vercel](https://vercel.com/) account (for deploy)

## Local setup

### 1. Install dependencies

```bash
npm install
npm install --prefix client
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB` | Database name (default: `cisco_orders`) |
| `JWT_SECRET` | Long random string (`openssl rand -base64 32`) |
| `SEED_ADMIN_EMAIL` | First admin email |
| `SEED_ADMIN_PASSWORD` | First admin password |

### 3. Seed admin users

```bash
npm run seed
```

Creates/updates users in MongoDB. Re-run after changing passwords in `.env`.

Multiple users via JSON:

```env
SEED_USERS=[{"email":"admin@co.com","password":"secret1","name":"Admin"},{"email":"ops@co.com","password":"secret2","name":"Ops"}]
```

### 4. Run locally

Terminal 1 — API (port 3000, loads `.env` automatically):

```bash
npm run dev:api
```

You should see `API server http://localhost:3000` and `MONGODB_URI: set`, `JWT_SECRET: set`.

Terminal 2 — React (port 5173, proxies `/api` to port 3000):

```bash
npm run dev:client
```

Or both in one command:

```bash
npm run dev
```

Open http://localhost:5173 and sign in with your seeded credentials.

### Login returns 500?

1. **API must be running** — only `npm run dev:client` is not enough; start `npm run dev:api` (or `npm run dev`).
2. **Seed users first** — `npm run seed` (uses the same `.env` as the API).
3. **Check `.env`** at the project root has `MONGODB_URI`, `JWT_SECRET`, and seed credentials.
4. Use the same email/password as `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (wrong password returns **401**, not 500).

Optional: `npm run dev:api:vercel` if you use Vercel CLI (requires `vercel login`).

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "React app with MongoDB auth"
git push
```

### 2. Import project in Vercel

1. [vercel.com/new](https://vercel.com/new) → Import your repository.
2. Framework preset: **Other** (or Vite — `vercel.json` already sets build commands).
3. Add **Environment Variables** (Production + Preview):

   - `MONGODB_URI`
   - `MONGODB_DB` (optional)
   - `JWT_SECRET`

4. Deploy.

### 3. Seed production database

From your machine with production `MONGODB_URI` in `.env`:

```bash
npm run seed
```

Use strong passwords for production users.

### 4. Custom domain (optional)

Vercel project → **Settings → Domains**.

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/orders` | No | List all orders |
| POST | `/api/orders` | Yes | Create order |
| PUT | `/api/orders` | Yes | Replace all orders (import) |
| PUT | `/api/orders/:orderNo` | Yes | Update order |
| DELETE | `/api/orders/:orderNo` | Yes | Delete order |

## Project structure

```
├── api/                 # Vercel serverless API
├── client/              # React (Vite) frontend
├── lib/                 # Shared DB & auth helpers
├── scripts/seed.js      # Seed MongoDB users
├── vercel.json          # Vercel build & SPA routing
└── .env.example
```

## Notes

- **Order ID** = **Order No** (unique).
- Invalid login returns a generic error (no account enumeration).
- Passwords are hashed with bcrypt (12 rounds) in the database.
- For GitHub Pages hosting, use the previous Firebase version; this stack requires Vercel (or similar) for the API.
