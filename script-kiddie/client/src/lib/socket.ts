import { io, type Socket } from "socket.io-client";
import { api } from "./api";

let socket: Socket | null = null;
let refreshing = false;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io({
    path: "/socket.io",
    withCredentials: true,

    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 8000,

    randomizationFactor: 0.4,
    autoConnect: true,
  });

  socket.on("connect_error", async (error) => {
    if (error.message !== "unauthorized" || refreshing) return;
    refreshing = true;
    try {
      await api.post("/auth/refresh");
      socket?.connect();
    } catch {

      socket?.disconnect();
    } finally {
      refreshing = false;
    }
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
