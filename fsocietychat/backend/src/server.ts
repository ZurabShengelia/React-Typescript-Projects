import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import groupRoutes from './routes/groups';
import userRoutes from './routes/users';
import { initSocket } from './socket/index';

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = (process.env.MONGO_URI || process.env.MONGODB_URI) as string | undefined;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not set. Add it to your .env file (see .env.example).');
}

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

initSocket(io);

async function start(): Promise<void> {
  try {
    await connectDB(MONGO_URI);

    httpServer.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
