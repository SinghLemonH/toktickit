# TokTickIT IT Service Desk (Lab 1: Full-Stack Hello World)

CPE 334 — Individual Sprint 1. A vertical slice proving React (Vite) → Express API → Prisma ORM → PostgreSQL all work together.

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

## Tech stack
React + TypeScript + Vite + Bootstrap · Node.js + Express + TypeScript · PostgreSQL + Prisma · Vitest + Supertest
