# Testing HypeForge locally (detailed, beginner-friendly)

## What does “infra” mean?

**Infra** is short for **infrastructure** — the programs and services your app depends on to run, *besides* your own code.

| Piece | Plain English | Why this project needs it |
|--------|----------------|---------------------------|
| **PostgreSQL** | A database program that stores users, campaigns, tips, etc. | Data survives after you stop the app. |
| **Redis** | A fast in-memory store used here as a **job queue** (BullMQ). | After Stripe says “paid,” work runs in the background. |
| **Clerk** | A hosted sign-in service (hosted on the internet). | So you don’t build passwords yourself; the API trusts Clerk’s tokens. |
| **Stripe** | Payment processor (test mode = fake money). | Checkout page and webhooks. |

Your **code** (Next.js + NestJS) runs on your PC. **Infra** usually means: get Postgres + Redis running (often via **Docker**), and create accounts for Clerk + Stripe so you can paste keys into a `.env` file.

---

## What you are trying to prove when you “test”

One full path:

1. You open the website and sign in.  
2. You send a **test tip** (fake card).  
3. Stripe tells **your API** (webhook) that payment succeeded.  
4. The API updates the database and the **progress bar / feed** updates (and may update in another tab via Socket.IO).

If step 3 fails, the tip never “counts” — that’s why **Stripe CLI** forwarding webhooks to `localhost` matters for local testing.

---

## Prerequisites (install once)

### 1) Node.js (JavaScript runtime)

- Download **LTS** from [https://nodejs.org](https://nodejs.org) and install.  
- Open **PowerShell** and check:

```powershell
node -v
npm -v
```

You should see version numbers (e.g. `v20.x`).

### 2) Git (you already use GitHub)

If `git` works in PowerShell, you’re fine.

### 3) Docker Desktop (recommended for Postgres + Redis)

- Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).  
- After install, open Docker Desktop and wait until it says it’s running.  
- This lets you run **PostgreSQL** and **Redis** with one command instead of installing them manually.

**If you cannot use Docker:** you’d install Postgres and Redis separately and set `DATABASE_URL` / `REDIS_URL` to match — that’s more advanced; Docker is the path this repo assumes.

### 4) Accounts (free tiers)

- **Clerk:** [https://dashboard.clerk.com](https://dashboard.clerk.com) — create an application (e.g. “HypeForge dev”).  
- **Stripe:** [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register) — use **Test mode** (toggle in the dashboard).

---

## Step A — Start the database and Redis (Docker)

1. Open **PowerShell**.  
2. Go to your project folder (adjust the path if yours differs):

```powershell
cd "c:\Users\varma\Downloads\VENKAT\Code\TwitchProj"
```

3. Start containers:

```powershell
docker compose up -d
```

4. Check they’re running (optional):

```powershell
docker compose ps
```

You should see **postgres** and **redis** running.

**What this does:** maps Postgres to host port **5433** (container still uses 5432 inside) and Redis to **6379**, matching `.env.example`. Port **5433** avoids clashes with another PostgreSQL on Windows that often uses **5432**.

---

## Step B — Create your `.env` file

1. In the project **root** (same folder as `package.json`), copy the example file:

```powershell
copy .env.example .env
```

2. Open `.env` in a text editor (VS Code, Notepad, etc.).

3. Fill these in:

### Clerk keys

1. In [Clerk Dashboard](https://dashboard.clerk.com) → your app → **API Keys**.  
2. **Publishable key** → paste into `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_...`).  
3. **Secret key** → paste into `CLERK_SECRET_KEY` (starts with `sk_test_...`).

**Important:** The **secret** must never be committed to Git (`.gitignore` already ignores `.env`).

### Stripe keys

1. In [Stripe Dashboard](https://dashboard.stripe.com) ensure **Test mode** is ON.  
2. **Developers → API keys**.  
3. **Secret key** → `STRIPE_SECRET_KEY` (starts with `sk_test_...`).

### Leave webhook secret empty for now

`STRIPE_WEBHOOK_SECRET` — you will paste this **after** you run Stripe CLI in Step E.

### Defaults you can keep (local dev)

```env
DATABASE_URL=postgresql://hypeforge:hypeforge@127.0.0.1:5433/hypeforge?sslmode=disable
REDIS_URL=redis://127.0.0.1:6379
PORT=3001
WEB_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_DEFAULT_CREATOR_ID=seed_creator_avalive
```

Save the file.

---

## Step C — Install dependencies

In the project root:

```powershell
npm install
```

---

## Step D — Create tables and demo data (Prisma)

**Important:** Keep your `.env` file in the **project root** (same folder as `package.json`), not only inside `apps/api`. The root scripts load that file for Prisma.

Still in the project root, with `docker compose up -d` already running.

### Recommended on Windows (avoids `P1000` / host port quirks)

Prisma talks to Postgres **inside the Docker network** (`postgres:5432`), not through `127.0.0.1:5433`. That matches how `npm run db:docker-check` proves the password works and avoids Docker Desktop issues with host → container TCP auth.

```powershell
npm run db:migrate:docker
npm run db:seed:docker
npm run db:generate
```

The first run may build a small image (`hypeforge-db-tools:local`). `db:generate` refreshes the Prisma client on your machine for the API and web workspaces.

### Alternative (macOS / Linux, or when host DB access works)

```powershell
npm run db:migrate
```

If it asks for a migration name, you can type `init` or press Enter depending on the prompt.

Then seed demo creator/campaign:

```powershell
npm run db:seed
```

If you see `Environment variable not found: DATABASE_URL`, check that:

1. `.env` exists next to the root `package.json`, and  
2. It contains a line like `DATABASE_URL=postgresql://hypeforge:hypeforge@127.0.0.1:5433/hypeforge?sslmode=disable`, and  
3. Docker Postgres is running (`docker compose up -d`).

You should see something like `Seed OK` with `creatorId` / `campaignId`.

**Clerk and Stripe keys are not involved in this step** — migrate/seed only need Postgres reachable (via Docker commands above or `DATABASE_URL` for host Prisma).

---

## Step E — Stripe webhook forwarding (local)

Your API webhook URL is only on your computer (`localhost`). Stripe’s servers cannot reach it unless you **tunnel** or **forward** events.

**Install Stripe CLI**

- Instructions: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)  
- On Windows, you can use **Scoop** or download the `.msi` from Stripe’s releases — follow Stripe’s official install steps for Windows.

**Run the listener** (keep this window open):

```powershell
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

The CLI prints a line like:

`Ready! Your webhook signing secret is whsec_......`

1. Copy that **`whsec_...`** value.  
2. Paste it into `.env` as `STRIPE_WEBHOOK_SECRET=whsec_...`  
3. **Restart** the API later (or restart `npm run dev` so Nest loads the new env).

---

## Step F — Run the app

Open a **new** PowerShell window (keep Stripe CLI running in the other one).

```powershell
cd "c:\Users\varma\Downloads\VENKAT\Code\TwitchProj"
npm run dev
```

Wait until you see both the **web** and **api** dev servers running (no big red errors).

- Website: [http://localhost:3000](http://localhost:3000)  
- API health (optional): [http://localhost:3001/api/users/health](http://localhost:3001/api/users/health) — should show `{"ok":true}`

---

## Step G — Click through the test (browser)

1. Open: [http://localhost:3000/creators/seed_creator_avalive](http://localhost:3000/creators/seed_creator_avalive)  
2. **Sign in** when Clerk asks (create a test user if needed).  
3. Click **Tip** / checkout — you should go to **Stripe Checkout** (test mode).  
4. Use Stripe’s test card:

   - Card: `4242 4242 4242 4242`  
   - Expiry: any future date (e.g. `12 / 34`)  
   - CVC: any 3 digits  
   - ZIP: any 5 digits  

5. Complete payment. You should land on the **success** page, then go **back to creator**.  
6. Check: campaign **total** / **feed** / **leaderboard** updated.  
7. Optional: open the same creator URL in **two tabs** — after a tip, updates may appear in both (Socket.IO).

**In the Stripe CLI window** you should see events like `checkout.session.completed` forwarded to your API.

---

## Error `P1000` / “Authentication failed” for user `hypeforge`

Postgres is **running** on `localhost:5432`, but the **username/password** in `DATABASE_URL` do not match that server.

### Common causes on Windows

1. **Docker Postgres was created earlier with a different password**  
   The first time Postgres starts, it writes data to a Docker **volume**. If you changed `docker-compose.yml` later, the old password can still be in that volume.

   **Fix (dev only — deletes local DB data):** from the project root:

   ```powershell
   docker compose down
   docker compose down -v
   docker compose up -d
   ```

   Wait ~10 seconds, then confirm `DATABASE_URL` uses port **5433** (see `.env.example`).

   Run `npm run db:migrate` and `npm run db:seed` again.

2. **Something other than Docker is using port 5432**  
   If you installed **PostgreSQL for Windows** separately, it may be listening on `5432` with users like `postgres`, not `hypeforge`.

   **Check:** PowerShell:

   ```powershell
   docker compose ps
   ```

   If `postgres` is not “Up”, or you’re unsure what’s on 5432, either:

   - Stop the Windows Postgres service temporarily, **or**
   - Change our project to use another port. In `docker-compose.yml`, under `postgres` → `ports`, use:

     ```yaml
     - "5433:5432"
     ```

     Then set:

     ```env
     DATABASE_URL=postgresql://hypeforge:hypeforge@localhost:5433/hypeforge
     ```

     Run `docker compose up -d` again and retry migrate/seed.

3. **Typo in `.env`**  
   User, password, database name, and port must match `docker-compose.yml` (user `hypeforge`, password `hypeforge`, db `hypeforge`).

### Docker looks healthy but Prisma still says `P1000` (very common on Windows)

**This repo maps Postgres to host port `5433`** (see `docker-compose.yml`) so Prisma talks to **Docker only**, not another PostgreSQL often bound to **`5432`** on Windows.

If `npm run db:docker-check` works but **host** `npm run db:migrate` still fails with `P1000`, use **`npm run db:migrate:docker`** and **`npm run db:seed:docker`** instead (see Step D). Those commands run Prisma in a Linux container on the **same Docker network** as Postgres, so they do not rely on `127.0.0.1:5433` from Windows.

If `npm run db:docker-check` works but Prisma still fails, your `.env` was probably still using port **5432** — use **`127.0.0.1:5433`** as in `.env.example`, then run `docker compose up -d` after pulling the latest `docker-compose.yml`.

Older explanation (still true on some machines): your Docker UI can look **correct** while connections to **`127.0.0.1:5432`** hit a **different** Postgres (e.g. one installed on Windows). That server rejects user `hypeforge`.

**A) Prove the container accepts `hypeforge`**

From the project root (where `docker-compose.yml` is):

```powershell
npm run db:docker-check
```

You should see a row with `ok = 1`. If that works, the **password inside Docker** is fine.

**B) Point Prisma at the Docker port explicitly + disable SSL for local**

In your **root** `.env`, set `DATABASE_URL` to this **exact** line (copy/paste):

```env
DATABASE_URL=postgresql://hypeforge:hypeforge@127.0.0.1:5433/hypeforge?sslmode=disable
```

- `127.0.0.1` avoids some `localhost` / IPv6 quirks on Windows.  
- `sslmode=disable` avoids SSL handshake issues with local Docker Postgres.

Save the file, then run again:

```powershell
npm run db:migrate
npm run db:seed
```

**C) If it still fails — check who owns port 5433**

```powershell
Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue | Select-Object OwningProcess, LocalAddress
Get-Process -Id (Get-NetTCPConnection -LocalPort 5433).OwningProcess -ErrorAction SilentlyContinue
```

Docker should be listening on **5433** after `docker compose up -d`. If another app uses 5433, pick a different host port in `docker-compose.yml` (e.g. `5434:5432`) and match it in `DATABASE_URL`.

---

## If something breaks (quick checks)

| Symptom | What to check |
|--------|----------------|
| `docker compose` fails | Docker Desktop is running; try again after it fully starts. |
| `db:migrate` fails | Try **`npm run db:migrate:docker`** (Windows). Ensure `DATABASE_URL` uses port **5433** for the **API** when running `npm run dev`. |
| `P1000` auth failed | See section **Error P1000** above; prefer **`db:migrate:docker`** / **`db:seed:docker`** on Windows. |
| Website loads but API errors | `.env` in **project root**; `NEXT_PUBLIC_API_URL` points to `http://localhost:3001/api`. |
| Checkout works but bar doesn’t move | `stripe listen` still running? `STRIPE_WEBHOOK_SECRET` set and **dev server restarted**? Redis up? |
| `401` on tip | You must be **signed in** with Clerk on the site. |
| Redis connection errors | `docker compose up -d`; `REDIS_URL` correct. |

---

## What “good enough for portfolio” means

You don’t need perfection — you need **one screen recording or notes** showing: sign in → tip → webhook in CLI → UI updates. That matches the story on your resume.

---

## Next steps after it works once

- Push changes to GitHub (`git add`, `git commit`, `git push`).  
- Later: deploy web (e.g. Vercel) and API (e.g. Railway) and register a **public** Stripe webhook URL — different from local `stripe listen`.
