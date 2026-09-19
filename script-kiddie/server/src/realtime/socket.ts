import type { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/tokens";
import { logger } from "../utils/logger";
import { addSocket, removeSocket, isOnline } from "./presence";
import { listFriendIds } from "../services/chatService";

export interface AuthedSocket extends Socket {
  userId?: string;
}

let io: IOServer | null = null;

export const room = (userId: string) => `user:${userId}`;

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(room(userId)).emit(event, payload);
}

export function getIO(): IOServer | null {
  return io;
}

function readCookie(header: string, name: string): string | undefined {
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    const value = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

function authenticate(socket: AuthedSocket, next: (err?: Error) => void) {
  try {
    const header = socket.handshake.headers.cookie;
    if (!header) return next(new Error("unauthorized"));
    const token = readCookie(header, "accessToken");
    if (!token) return next(new Error("unauthorized"));
    socket.userId = verifyAccessToken(token).sub;
    return next();
  } catch {
    return next(new Error("unauthorized"));
  }
}

export function initSocketServer(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: env.clientUrl, credentials: true },

    transports: ["websocket", "polling"],
    pingInterval: 20_000,
    pingTimeout: 20_000,
  });

  io.use(authenticate);

  io.on("connection", async (socket: AuthedSocket) => {
    const userId = socket.userId!;
    socket.join(room(userId));
    const cameOnline = addSocket(userId, socket.id);

    try {
      const friendIds = await listFriendIds(userId);
      socket.emit("presence:snapshot", { online: friendIds.filter(isOnline) });

      if (cameOnline) {
        for (const friendId of friendIds) {
          emitToUser(friendId, "presence:update", { userId, online: true });
        }
      }
    } catch (error) {
      logger.error("Failed to build presence snapshot", { error });
    }

    socket.on("typing:start", ({ to }: { to?: string }) => {
      if (typeof to === "string") emitToUser(to, "typing:start", { userId });
    });
    socket.on("typing:stop", ({ to }: { to?: string }) => {
      if (typeof to === "string") emitToUser(to, "typing:stop", { userId });
    });

    socket.on("disconnect", async () => {
      const { wentOffline } = removeSocket(socket.id);
      if (!wentOffline) return;
      try {
        const friendIds = await listFriendIds(userId);
        for (const friendId of friendIds) {
          emitToUser(friendId, "presence:update", { userId, online: false });
        }
      } catch (error) {
        logger.error("Failed to broadcast offline presence", { error });
      }
    });
  });

  logger.info("Socket.IO gateway ready on /socket.io");
  return io;
}
