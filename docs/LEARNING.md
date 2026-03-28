# HypeForge — what each technology does (quick reference)

Short explanations you can revisit while building. Read this alongside the code.

## Monorepo (npm workspaces + Turborepo)

**What:** One repository with multiple packages (`apps/web`, `apps/api`, `packages/shared`).  
**Why:** Share types and scripts; run `turbo dev` to start front and back together.  
**Point:** Same as a small company codebase: one git repo, coordinated releases.

## Next.js

**What:** React framework with routing, layouts, and optional server rendering.  
**Why:** Standard for product UIs; App Router gives file-based routes like `creators/[id]/page.tsx`.  
**Point:** Employers expect React + Next experience for web roles.

## NestJS

**What:** Node.js framework with modules, dependency injection, and decorators (like Angular for APIs).  
**Why:** Organizes HTTP, webhooks, WebSockets, and background jobs in one structured server.  
**Point:** Shows you can build maintainable backends, not only scripts.

## PostgreSQL + Prisma

**What:** Postgres is a relational database. Prisma is an ORM: TypeScript types and migrations from a schema.  
**Why:** Transactions for money/totals; Prisma catches mistakes at compile time.  
**Point:** Production apps store durable state in SQL; migrations document schema history.

## Redis + BullMQ

**What:** Redis is an in-memory data store. BullMQ is a job queue on top of Redis.  
**Why:** Webhooks should return fast; heavy work (totals, leaderboard, broadcast) runs in a worker with retries.  
**Point:** Same pattern as SQS workers—good interview story.

## Stripe

**What:** Payments API. Checkout Session hosts the payment page; webhooks notify your server when money actually settles.  
**Why:** Never trust the browser “success” page alone—webhooks are the source of truth.  
**Point:** Demonstrates real payment integration and idempotency.

## Clerk

**What:** Hosted auth (sign-in UI + user directory). Your API verifies JWTs with Clerk’s secret.  
**Why:** Less auth code than rolling your own; still shows integration across Next + API.  
**Point:** “Integrated third-party auth securely” is a resume line.

## Socket.IO

**What:** WebSocket abstraction with rooms and fallbacks.  
**Why:** Push campaign updates to every open tab without polling.  
**Point:** Real-time systems are core to Twitch-style products.

## TanStack Query

**What:** Client-side cache and refetch for API data.  
**Why:** Cleaner loading/error states; can invalidate after mutations.  
**Point:** Standard React data-fetching pattern.

---

When you change env vars, restart dev servers. Stripe webhooks need the Stripe CLI or a public URL in production.
