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

## MongoDB not accessible from Vercel?

Vercel runs your API on **changing IP addresses**. MongoDB Atlas blocks unknown IPs by default. Fix these in order:

### 1. Atlas Network Access (most common fix)

1. [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Network Access**
2. **Add IP Address** → **Allow Access from Anywhere**
3. This adds `0.0.0.0/0` (required for Vercel serverless)
4. Wait **1–2 minutes** for the rule to apply

Your laptop IP alone is **not enough** for production on Vercel.

### 2. Environment variables on Vercel

Vercel does **not** use your local `.env` file. Add variables in the dashboard:

1. Vercel project → **Settings** → **Environment Variables**
2. Add for **Production** and **Preview**:

   | Name | Example |
   |------|---------|
   | `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority` |
   | `JWT_SECRET` | (from `openssl rand -base64 32`) |
   | `MONGODB_DB` | `cisco_orders` |

3. **Deployments** → latest deployment → **⋯** → **Redeploy** (required after adding env vars)

Copy `MONGODB_URI` from Atlas → **Connect** → **Drivers** — same string as local `.env`.

**Password tip:** If the password has `@`, `#`, `%`, etc., [URL-encode](https://www.urlencoder.org/) it in the connection string.

### 3. Test the deployment

Open in a browser (replace with your Vercel URL):

```text
https://YOUR-APP.vercel.app/api/health
```

- **OK:** `{"ok":true,"mongodb":"connected",...}` — MongoDB works from Vercel
- **Error:** JSON includes a hint (e.g. Network Access, missing `MONGODB_URI`)

### 4. Seed users on production DB

`npm run seed` uses your **local** `.env`. For production, either:

- Put the **production** `MONGODB_URI` in `.env` temporarily and run `npm run seed`, or
- Run seed once from your machine with prod URI in `.env`

Then sign in on the live site with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | MongoDB connection check |
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
