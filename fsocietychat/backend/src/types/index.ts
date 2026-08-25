export interface JwtPayload {
  id: string;
  username: string;
}

export interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface AuthResponseBody {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

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

export interface AuthenticatedSocketData {
  userId: string;
  username: string;
}
