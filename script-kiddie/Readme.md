# Script Kiddie

A cybersecurity learning and assessment platform. Test your knowledge across
web security, cryptography, secure coding, networking, and Linux hardening
through timed multiple-choice tests and interactive terminal-based labs.

## Features

- 20+ assessment tests across categories like XSS, SQLi, JWT/session
  security, cryptography, secure coding, and network defense
- Interactive lab simulations with a sandboxed virtual terminal
- Real-time chat between users (Socket.IO)
- Email-verified registration, two-step password change, and two-step
  account deletion, all with confirmation codes sent via email
- Progress tracking and a personal dashboard

## Tech stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI
**Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.IO
**Auth:** JWT (access + refresh tokens) in httpOnly cookies
**Testing:** Jest + Supertest, MongoDB Memory Server

## Getting started (local development)

### Prerequisites

- Node.js 20+
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
- `MONGO_URI` — your local or Atlas connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate with `openssl rand -hex 64`
- `EMAIL_USER` / `EMAIL_APP_PASSWORD` — a Gmail address + [App Password](https://myaccount.google.com/apppasswords) (leave blank to log verification codes to the console instead of emailing them)

```bash
npm install
npm run seed   # populates tests/labs and a demo account
npm run dev
```

Demo login after seeding: `demo@scriptkiddie.dev` / `Demo1234!`

### 2. Frontend

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Running with Docker

```bash
cp .env.docker.example .env.docker   # fill in real secrets
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker exec server npm run seed:prod
```

Open `http://localhost`.

## Deploying to Render

This repo includes a `render.yaml` Blueprint that provisions two services:

- `script-kiddie-api` — the backend (Docker)
- `script-kiddie-client` — the frontend, served via nginx (Docker)

In the Render dashboard: **New > Blueprint**, point it at this repo. You'll
be prompted for `MONGO_URI`, `EMAIL_USER`, and `EMAIL_APP_PASSWORD` — JWT
secrets are generated automatically.

## Scripts

| Location | Command | Description |
|---|---|---|
| `server/` | `npm run dev` | Start the API with hot reload |
| `server/` | `npm run build` | Compile TypeScript to `dist/` |
| `server/` | `npm start` | Run the compiled build |
| `server/` | `npm run seed` | Seed tests, labs, and a demo account |
| `server/` | `npm test` | Run the test suite |
| `client/` | `npm run dev` | Start the Vite dev server |
| `client/` | `npm run build` | Production build |
| `client/` | `npm run lint` | Run ESLint |

## License

*(add your license here, e.g. MIT — or remove this section if you're keeping it private)*
