# TokTickIT: IT Service Desk

CPE 334 Software Engineering project. TokTickIT is a full-stack IT support ticketing system built across Labs 1 to 4 with React, Express, Prisma, and PostgreSQL.

## Sprint Scope

- **Lab 1**: Health checks and category management.
- **Lab 2**: Ticket creation, requester ticket lists, attachments, and the Zen Green theme.
- **Lab 3**: Cookie-based authentication, role-based access control, staff ticket operations, administrator user management, public comments, and internal notes.
- **Lab 4**: Actions Taken, ticket workflow and resolution gates, role-based dashboards, responsive navigation, and final regression coverage.

Sprint 4 is integrated into `lab4-staging`. The final release pull request from `lab4-staging` to `main` is tracked separately from feature work.

## Requirements

- Node.js 18 or newer and npm
- PostgreSQL 14 or newer
- Git

## Local Setup

Clone the repository and install dependencies for the root Playwright runner, server, and client:

```bash
git clone https://github.com/SinghLemonH/toktickit.git
cd toktickit
npm install
npm --prefix server install
npm --prefix client install
```

Create the database and local server configuration:

```sql
CREATE USER toktickit WITH PASSWORD 'toktickit';
CREATE DATABASE toktickit OWNER toktickit;
```

Copy `server/.env.example` to `server/.env` and update `DATABASE_URL` if your PostgreSQL credentials differ. In PowerShell, use `Copy-Item server/.env.example server/.env`.

Generate the Prisma client, apply committed migrations, and seed development data:

```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run seed
```

The server listens on `http://localhost:3000`. Start it from `server/` with `npm run dev`. Start the frontend in another terminal from `client/` with `npm run dev`; Vite listens on `http://localhost:5173`.

## Verification

Run backend and frontend test suites from the repository root:

```bash
npm test
```

Run Playwright end-to-end tests from the repository root:

```bash
npm run test:e2e
```

Playwright starts the configured server and client development processes when they are not already running. Run production builds with `npm --prefix server run build` and `npm --prefix client run build`.

## Engineering Contracts and Evidence

- [Lab 2 specification](docs/lab-02/specification.md) and [Lab 2 test plan](docs/lab-02/tests.md)
- [Lab 3 specification](docs/lab-03/specification.md) and [Lab 3 test plan](docs/lab-03/tests.md)
- [Lab 4 specification](docs/lab-04/specification.md)
- [Lab 4 API specification](docs/lab-04/api-spec.md)
- [Lab 4 UI specification and screenshot evidence matrix](docs/lab-04/ui-spec.md)
- [Lab 4 test plan and traceability matrix](docs/lab-04/tests.md)
- [Lab 4 peer review log](docs/lab-04/reviewer.md)
- Lab 4 screenshots: `artifacts/lab-04/screenshots/`

See [AGENTS.md](AGENTS.md) for branch conventions, sprint status, security boundaries, and the complete engineering contract.

## Technology

React, TypeScript, Vite, Bootstrap 5, Zen Green CSS, React Router, Node.js, Express, Prisma, PostgreSQL, cookie-based sessions, Vitest, React Testing Library, Supertest, and Playwright.
