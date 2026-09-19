
const socketsByUser = new Map<string, Set<string>>();
const userBySocket = new Map<string, string>();

export function addSocket(userId: string, socketId: string): boolean {
  userBySocket.set(socketId, userId);
  const existing = socketsByUser.get(userId);
  if (existing) {
    existing.add(socketId);
    return false;
  }
  socketsByUser.set(userId, new Set([socketId]));
  return true;
}

export function removeSocket(socketId: string): { userId?: string; wentOffline: boolean } {
  const userId = userBySocket.get(socketId);
  if (!userId) return { wentOffline: false };
  userBySocket.delete(socketId);

  const sockets = socketsByUser.get(userId);
  if (!sockets) return { userId, wentOffline: false };

  sockets.delete(socketId);
  if (sockets.size === 0) {
    socketsByUser.delete(userId);
    return { userId, wentOffline: true };
  }
  return { userId, wentOffline: false };
}

export function isOnline(userId: string): boolean {
  return socketsByUser.has(userId);
}

export function filterOnline(userIds: string[]): string[] {
  return userIds.filter((id) => socketsByUser.has(id));
}
