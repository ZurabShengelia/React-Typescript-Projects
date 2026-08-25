import { io, Socket } from 'socket.io-client';
import {
  JoinRoomPayload,
  SendMessagePayload,
  ReceiveMessagePayload,
  UserStatusPayload,
  TypingPayload,
  DisplayTypingPayload,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ServerToClientEvents {
  receive_message: (payload: ReceiveMessagePayload) => void;
  user_status: (payload: UserStatusPayload) => void;
  display_typing: (payload: DisplayTypingPayload) => void;
  error_message: (payload: { error: string }) => void;
}

interface ClientToServerEvents {
  join_room: (payload: JoinRoomPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
  typing: (payload: TypingPayload) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

export function connectSocket(token: string): ChatSocket {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function joinRoomWhenConnected(room: string) {
  if (!socket) return;
  if (socket.connected) {
    socket.emit('join_room', { room });
    return;
  }
  const onConnect = () => {
    socket?.emit('join_room', { room });
    socket?.off('connect', onConnect);
  };
  socket.on('connect', onConnect);
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): ChatSocket | null {
  return socket;
}
