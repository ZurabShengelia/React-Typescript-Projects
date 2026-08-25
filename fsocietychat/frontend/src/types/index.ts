export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponseBody {
  token: string;
  user: AuthUser;
}

export type ChatSection = 'global' | 'group' | 'private';

export interface JoinRoomPayload {
  room: string;
}

export interface SendMessagePayload {
  room: string;
  message: string;
}

export interface ReceiveMessagePayload {
  message: string;
  senderSocketId: string;
  senderUsername: string;
  room: string;
  timestamp: string;
}

export interface UserStatusPayload {
  message: string;
  room: string;
}

export interface TypingPayload {
  room: string;
}

export interface DisplayTypingPayload {
  socketId: string;
  username: string;
}

export type ChatLogEntry =
  | { kind: 'message'; data: ReceiveMessagePayload }
  | { kind: 'status'; data: UserStatusPayload; id: string };
