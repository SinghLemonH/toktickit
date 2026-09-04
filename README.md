# TokTickIT — IT Service Desk (Lab 1: Full-Stack Hello World + Lab 2: Requester Ticketing MVP)

CPE 334 — Sprint 1 & 2. A vertical slice proving React (Vite) → Express API → Prisma ORM →
PostgreSQL all work together, extended in Lab 2 with the Requester-facing ticketing experience.

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ running locally
- Git

## 1. Clone the repository
```bash
git clone https://github.com/<your-username>/toktickit.git
cd toktickit
```

## 2. Set up the database
Create a PostgreSQL user and database (adjust name/password if needed):
```sql
CREATE USER toktickit WITH PASSWORD 'toktickit';
CREATE DATABASE toktickit OWNER toktickit;
```

## 3. Set up the backend
```bash
cd server
npm install
copy .env.example .env    # on macOS/Linux: cp .env.example .env
```
Edit `.env` and confirm `DATABASE_URL` matches your PostgreSQL credentials.

Generate the Prisma client and sync the schema:
```bash
npx prisma generate
npx prisma db push
```

**Lab 2 addition** — Lab 2 introduced new tables (DevRequester, RelatedSystem, Ticket, Attachment,
TicketNumberCounter) plus an `isActive` column on `Category`, applied via a proper migration instead
of `db push`:
```bash
npx prisma migrate dev --name lab2_ticketing_models
```

Seed the database (Lab 1 categories + Lab 2 related systems and development requesters, all
idempotent — safe to re-run):
```bash
npm run seed
```

Run the backend:
```bash
npm run dev
```
The API runs at http://localhost:3000

Run backend tests:
```bash
npm test
```

## 4. Set up the frontend
In a new terminal:
```bash
cd client
npm install
npm run dev
```
The frontend runs at http://localhost:5173

Run frontend tests:
```bash
npm test
```

## 5. End-to-end tests (Lab 2)
Playwright is configured at the repo root. Once the app screens exist (Lab 2 Issues #14–#17), run:
```bash
npx playwright test
```
from the repository root, with both the backend and frontend dev servers running.

## Tech stack
React + TypeScript + Vite + Bootstrap 5 (Zen Green theme via `client/src/theme.css`) + React Router ·
Node.js + Express + TypeScript · PostgreSQL + Prisma · Multer (file uploads) · Vitest + Supertest ·
Playwright (E2E)

## Project conventions
See `AGENTS.md` (repo root) for git workflow, coding-agent boundaries, and full command reference.
See `docs/lab-02/specification.md` for the Lab 2 engineering contract (scope, business rules,
acceptance criteria).