import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import User from '../models/User';
import GroupChat from '../models/GroupChat';
import { socketAuthMiddleware } from '../middleware/auth';
import {
  JoinRoomPayload,
  SendMessagePayload,
  ReceiveMessagePayload,
  UserStatusPayload,
  TypingPayload,
  DisplayTypingPayload,
} from '../types';

export function getPrivateRoomName(userA: string, userB: string): string {
  const [first, second] = [userA, userB].sort();
  return `private:${first}:${second}`;
}

function otherParticipant(room: string, senderUsername: string): string | null {
  if (!room.startsWith('private:')) return null;
  const [, a, b] = room.split(':');
  return a === senderUsername ? b : a;
}

export function initSocket(io: Server): void {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    const username = socket.data.username as string;

    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }

    let currentRoom: string | null = null;

    socket.on('join_room', async ({ room }: JoinRoomPayload) => {
      if (room.startsWith('group:')) {
        const groupId = room.split(':')[1];
        try {
          const group = await GroupChat.findById(groupId).select('members');
          if (!group) {
            socket.emit('error_message', { error: 'Group not found' });
            return;
          }

          const isMember = group.members.map(String).includes(socket.data.userId);
          if (!isMember) {
            socket.emit('error_message', { error: 'Not a member of this group' });
            return;
          }
        } catch (err) {
          console.error('Group membership check failed:', err);
          socket.emit('error_message', { error: 'Failed to verify group membership' });
          return;
        }
      }

      if (currentRoom) {
        socket.leave(currentRoom);
        const leftStatus: UserStatusPayload = {
          message: `${username} left the chat`,
          room: currentRoom,
        };
        socket.to(currentRoom).emit('user_status', leftStatus);
      }

      socket.join(room);
      currentRoom = room;

      const joinedStatus: UserStatusPayload = {
        message: `${username} joined the chat`,
        room,
      };
      socket.to(room).emit('user_status', joinedStatus);
    });

    socket.on('send_message', async ({ room, message }: SendMessagePayload) => {
      if (!room || !message || !message.trim()) {
        return;
      }

      try {
        let recipientId: string | null = null;
        const otherUsername = otherParticipant(room, username);
        if (otherUsername) {
          const recipientUser = await User.findOne({ username: otherUsername }).select('_id');
          recipientId = recipientUser?.id ?? null;
        }

        const saved = await Message.create({
          sender: socket.data.userId,
          senderUsername: username,
          room,
          recipient: recipientId,
          text: message.trim(),
        });

        const payload: ReceiveMessagePayload = {
          message: saved.text,
          senderSocketId: socket.id,
          senderUsername: username,
          room,
          timestamp: saved.timestamp.toISOString(),
        };

        io.to(room).emit('receive_message', payload);
      } catch (err) {
        console.error('Failed to save/broadcast message:', err);
        socket.emit('error_message', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ room }: TypingPayload) => {
      const payload: DisplayTypingPayload = { socketId: socket.id, username };
      socket.to(room).emit('display_typing', payload);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (${username})`);

      if (currentRoom) {
        const leftStatus: UserStatusPayload = {
          message: `${username} left the chat`,
          room: currentRoom,
        };
        socket.to(currentRoom).emit('user_status', leftStatus);
      }
    });
  });
}
