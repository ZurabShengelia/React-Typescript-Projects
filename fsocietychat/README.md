# Nocturne Chat App

Lightweight real-time chat application with a focus on a hacker-style UI theme. The
project uses a TypeScript Express backend with Socket.IO and a Vite + React + Tailwind
frontend. This README covers development setup, environment variables, and run/build
commands for GitHub readers.

Key features
- Real-time messaging (Socket.IO)
- Private (1:1) and group chats
- JWT authentication and protected REST endpoints
- Messages persisted to MongoDB
- Themed frontend (assets in `frontend/public/`) — presentation changes do not alter
  API routes or Socket.IO event names.

Repository structure
- `backend/` — Express + TypeScript API, Socket.IO server, Mongoose models
- `frontend/` — Vite + React + TypeScript SPA, Tailwind CSS and theme assets

Requirements
- Node.js (16+ recommended)
- npm or Yarn
- MongoDB (Atlas or local)

Quickstart (development)

1) Backend

```bash
cd backend
npm install
# copy or create .env based on .env.example
cp .env.example .env || true
# then edit backend/.env and set required variables
npm run dev
```

2) Frontend

```bash
cd frontend
npm install
cp .env.example .env || true
npm run dev
```

By default the frontend dev server runs at `http://localhost:5173` and the backend at
`http://localhost:4000` (both can be adjusted via environment variables described below).

Environment variables

Backend (`backend/.env`)
- `MONGO_URI` or `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWT tokens
- `PORT` — optional port (default 4000)
- `CLIENT_ORIGIN` — frontend origin for CORS (default `http://localhost:5173`)

Frontend (`frontend/.env`)
- `VITE_API_URL` — backend API base URL (default `http://localhost:4000`)

Build & production
- Backend: `cd backend && npm run build && npm start`
- Frontend: `cd frontend && npm run build` and serve the generated `dist/` with a static
  server or host on your platform of choice.

Notes for maintainers
- Presentation-only theme and asset changes are located in `frontend/src` and
  `frontend/public/`. Do not change socket event names, REST routes, or auth token
  handling unless you intend to modify the protocol for all clients.
- Helpful scripts exist in each package's `package.json`:
  - Backend: `dev`, `build`, `start`
  - Frontend: `dev`, `build`, `preview`

Contributing
- Open issues or PRs. For visual/theme-only PRs keep changes isolated to the frontend.

License
- MIT

