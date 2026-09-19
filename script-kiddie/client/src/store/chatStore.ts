import { create } from "zustand";
import { toast } from "sonner";
import { api, getMappedErrorMessage } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { ChatMessage, Friend, FriendRequest, UserSearchResult } from "@/types";

type ConnectionState = "connecting" | "online" | "reconnecting" | "offline";

interface ChatState {
  connection: ConnectionState;
  bootstrapped: boolean;
  loadingFriends: boolean;
  friends: Friend[];
  requests: FriendRequest[];
  activeFriendId: string | null;
  messages: Record<string, ChatMessage[]>;
  loadingThread: boolean;
  hasMore: Record<string, boolean>;
  typingFrom: Record<string, number>;

  connect: (selfId: string) => void;
  disconnect: () => void;
  loadFriends: () => Promise<void>;
  loadRequests: () => Promise<void>;
  openConversation: (friendId: string) => Promise<void>;
  closeConversation: () => void;
  loadOlder: (friendId: string) => Promise<void>;
  sendMessage: (friendId: string, body: string) => Promise<void>;
  retryMessage: (friendId: string, clientId: string) => Promise<void>;
  searchUsers: (term: string) => Promise<UserSearchResult[]>;
  sendRequest: (userId: string) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  deleteConversation: (friendId: string) => Promise<void>;
  emitTyping: (friendId: string, typing: boolean) => void;
}

const newClientId = () => `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const TYPING_TTL_MS = 3000;

let selfUserId: string | null = null;
let listenersBound = false;
let typingSweeper: ReturnType<typeof setInterval> | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  connection: "connecting",
  bootstrapped: false,
  loadingFriends: false,
  friends: [],
  requests: [],
  activeFriendId: null,
  messages: {},
  loadingThread: false,
  hasMore: {},
  typingFrom: {},

  connect: (userId) => {
    selfUserId = userId;
    const socket = getSocket();

    if (!listenersBound) {
      listenersBound = true;

      socket.on("connect", () => {
        set({ connection: "online" });

        void get().loadFriends();
        void get().loadRequests();
        const active = get().activeFriendId;
        if (active) void get().openConversation(active);
      });

      socket.io.on("reconnect_attempt", () => set({ connection: "reconnecting" }));
      socket.on("disconnect", () => set({ connection: "reconnecting" }));
      socket.io.on("error", () => set({ connection: "offline" }));

      socket.on("presence:snapshot", ({ online }: { online: string[] }) => {
        const live = new Set(online);
        set((state) => ({
          friends: state.friends.map((f) => ({ ...f, online: live.has(f.user.id) })),
        }));
      });

      socket.on("presence:update", ({ userId: id, online }: { userId: string; online: boolean }) => {
        set((state) => ({
          friends: state.friends.map((f) => (f.user.id === id ? { ...f, online } : f)),
        }));
      });

      socket.on("message:new", ({ message }: { message: ChatMessage }) => {
        const isActive = get().activeFriendId === message.senderId;
        set((state) => {
          const thread = state.messages[message.senderId] ?? [];
          return {
            messages: { ...state.messages, [message.senderId]: [...thread, message] },
            friends: state.friends.map((f) =>
              f.user.id === message.senderId
                ? {
                    ...f,
                    unread: isActive ? 0 : f.unread + 1,
                    lastMessage: { body: message.body, sentAt: message.createdAt, fromSelf: false },
                  }
                : f
            ),

            typingFrom: { ...state.typingFrom, [message.senderId]: 0 },
          };
        });
        if (isActive) void api.post(`/chat/messages/${message.senderId}/read`).catch(() => undefined);
      });

      socket.on("message:sent", ({ message, clientId: incomingClientId }: { message: ChatMessage; clientId?: string }) => {
        set((state) => {

          const clientId = message.clientId ?? incomingClientId;
          const thread = state.messages[message.recipientId] ?? [];

          if (clientId) {
            const optimisticIndex = thread.findIndex((m) => m.clientId === clientId);
            const serverIndex = thread.findIndex((m) => m.id === message.id);
            if (optimisticIndex !== -1) {
              let next = [...thread];
              next[optimisticIndex] = message;
              if (serverIndex !== -1 && serverIndex !== optimisticIndex) {
                next = next.filter((_, i) => i !== serverIndex);
              }
              return { messages: { ...state.messages, [message.recipientId]: next } };
            }

            if (thread.some((m) => m.id === message.id)) return state;
            return { messages: { ...state.messages, [message.recipientId]: [...thread, message] } };
          }

          if (thread.some((m) => m.id === message.id)) return state;
          return { messages: { ...state.messages, [message.recipientId]: [...thread, message] } };
        });
      });

      socket.on("typing:start", ({ userId: id }: { userId: string }) => {
        set((state) => ({ typingFrom: { ...state.typingFrom, [id]: Date.now() } }));
      });
      socket.on("typing:stop", ({ userId: id }: { userId: string }) => {
        set((state) => ({ typingFrom: { ...state.typingFrom, [id]: 0 } }));
      });

      socket.on("message:read", ({ userId: id }: { userId: string }) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [id]: (state.messages[id] ?? []).map((m) =>
              m.readAt ? m : { ...m, readAt: new Date().toISOString() }
            ),
          },
        }));
      });

      socket.on("friend:request", () => {
        void get().loadRequests();
        toast("New friend request");
      });
      socket.on("friend:added", () => {
        void get().loadFriends();
        void get().loadRequests();
      });
      socket.on("friend:request:closed", () => void get().loadRequests());
      socket.on("friend:removed", () => void get().loadFriends());

      typingSweeper = setInterval(() => {
        const { typingFrom } = get();
        const now = Date.now();
        const stale = Object.entries(typingFrom).filter(([, at]) => at && now - at > TYPING_TTL_MS);
        if (stale.length === 0) return;
        set((state) => {
          const next = { ...state.typingFrom };
          for (const [id] of stale) next[id] = 0;
          return { typingFrom: next };
        });
      }, 1000);
    }

    void get().loadFriends();
    void get().loadRequests();
  },

  disconnect: () => {
    disconnectSocket();
    listenersBound = false;
    selfUserId = null;
    if (typingSweeper) clearInterval(typingSweeper);
    typingSweeper = null;
    set({
      connection: "offline",
      bootstrapped: false,
      friends: [],
      requests: [],
      messages: {},
      activeFriendId: null,
      typingFrom: {},
    });
  },

  loadFriends: async () => {
    if (!get().bootstrapped) set({ loadingFriends: true });
    try {
      const res = await api.get("/chat/friends");
      set({ friends: res.data.data.friends, bootstrapped: true });
    } catch {

    } finally {
      set({ loadingFriends: false });
    }
  },

  loadRequests: async () => {
    try {
      const res = await api.get("/chat/requests");
      set({ requests: res.data.data.requests });
    } catch {

    }
  },

  openConversation: async (friendId) => {
    const alreadyLoaded = Boolean(get().messages[friendId]);
    set({ activeFriendId: friendId, loadingThread: !alreadyLoaded });
    try {
      const res = await api.get(`/chat/messages/${friendId}`);
      const { messages, hasMore } = res.data.data as { messages: ChatMessage[]; hasMore: boolean };
      set((state) => ({

        messages: {
          ...state.messages,
          [friendId]: [...messages, ...(state.messages[friendId] ?? []).filter((m) => m.pending)],
        },
        hasMore: { ...state.hasMore, [friendId]: hasMore },
        friends: state.friends.map((f) => (f.user.id === friendId ? { ...f, unread: 0 } : f)),
      }));
      await api.post(`/chat/messages/${friendId}/read`);
    } catch (error) {
      toast.error(getMappedErrorMessage(error, { NOT_FRIENDS: "You're no longer friends with this user." }));
    } finally {
      set({ loadingThread: false });
    }
  },

  closeConversation: () => set({ activeFriendId: null }),

  loadOlder: async (friendId) => {
    const thread = get().messages[friendId] ?? [];
    const oldest = thread.find((m) => !m.pending);
    if (!oldest) return;
    try {
      const res = await api.get(`/chat/messages/${friendId}`, { params: { before: oldest.createdAt } });
      const { messages, hasMore } = res.data.data as { messages: ChatMessage[]; hasMore: boolean };
      set((state) => ({
        messages: { ...state.messages, [friendId]: [...messages, ...(state.messages[friendId] ?? [])] },
        hasMore: { ...state.hasMore, [friendId]: hasMore },
      }));
    } catch {
      toast.error("Couldn't load older messages.");
    }
  },

  sendMessage: async (friendId, body) => {
    const trimmed = body.trim();
    if (!trimmed || !selfUserId) return;
    const clientId = newClientId();

    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      conversationId: "",
      senderId: selfUserId,
      recipientId: friendId,
      body: trimmed,
      createdAt: new Date().toISOString(),
      readAt: null,
      pending: "sending",
    };

    set((state) => ({
      messages: { ...state.messages, [friendId]: [...(state.messages[friendId] ?? []), optimistic] },
      friends: state.friends.map((f) =>
        f.user.id === friendId
          ? { ...f, lastMessage: { body: trimmed, sentAt: optimistic.createdAt, fromSelf: true } }
          : f
      ),
    }));

    try {
      const res = await api.post("/chat/messages", { to: friendId, body: trimmed, clientId });
      const saved = res.data.data.message as ChatMessage;
      set((state) => {
        const thread = state.messages[friendId] ?? [];
        const clientIndex = thread.findIndex((m) => m.clientId === clientId);
        const serverIndex = thread.findIndex((m) => m.id === saved.id);
        let next = [...thread];
        if (clientIndex !== -1) {

          next[clientIndex] = saved;

          if (serverIndex !== -1 && serverIndex !== clientIndex) {
            next = next.filter((_, i) => i !== serverIndex);
          }
        } else if (serverIndex !== -1) {

          next[serverIndex] = saved;
        } else {

          next = [...next, saved];
        }
        return { messages: { ...state.messages, [friendId]: next } };
      });
    } catch (error) {
      set((state) => ({
        messages: {
          ...state.messages,
          [friendId]: (state.messages[friendId] ?? []).map((m) =>
            m.clientId === clientId ? { ...m, pending: "failed" as const } : m
          ),
        },
      }));
      toast.error(
        getMappedErrorMessage(error, {
          NOT_FRIENDS: "You're no longer friends with this user.",
          RATE_LIMITED: "You're sending messages too quickly.",
        })
      );
    }
  },

  retryMessage: async (friendId, clientId) => {
    const failed = (get().messages[friendId] ?? []).find((m) => m.clientId === clientId);
    if (!failed) return;
    set((state) => ({
      messages: {
        ...state.messages,
        [friendId]: (state.messages[friendId] ?? []).filter((m) => m.clientId !== clientId),
      },
    }));
    await get().sendMessage(friendId, failed.body);
  },

  searchUsers: async (term) => {
    if (term.trim().length < 2) return [];
    const res = await api.get("/chat/users/search", { params: { q: term.trim() } });
    return res.data.data.results as UserSearchResult[];
  },

  sendRequest: async (userId) => {
    try {
      const res = await api.post("/chat/requests", { userId });
      if (res.data.data.status === "accepted") {
        toast.success("You're now friends");
        await get().loadFriends();
      } else {
        toast.success("Request sent");
      }
      await get().loadRequests();
    } catch (error) {
      toast.error(
        getMappedErrorMessage(error, {
          ALREADY_FRIENDS: "You're already friends.",
          REQUEST_PENDING: "You've already sent a request to this user.",
          USER_NOT_FOUND: "That account no longer exists.",
          SELF_REQUEST: "You can't add yourself.",
          RATE_LIMITED: "Too many friend requests. Try again later.",
        })
      );
      throw error;
    }
  },

  respondToRequest: async (requestId, accept) => {

    set((state) => ({ requests: state.requests.filter((r) => r.id !== requestId) }));
    try {
      await api.post(`/chat/requests/${requestId}/${accept ? "accept" : "reject"}`);
      if (accept) await get().loadFriends();
    } catch (error) {
      toast.error(getMappedErrorMessage(error, { REQUEST_NOT_FOUND: "That request is no longer available." }));
    } finally {
      await get().loadRequests();
    }
  },

  removeFriend: async (friendId) => {
    try {
      await api.delete(`/chat/friends/${friendId}`);
      set((state) => ({
        friends: state.friends.filter((f) => f.user.id !== friendId),
        activeFriendId: state.activeFriendId === friendId ? null : state.activeFriendId,
      }));
      toast.success("Friend removed");
    } catch (error) {
      toast.error(getMappedErrorMessage(error, { NOT_FRIENDS: "They're not in your friends list." }));
    }
  },

  deleteConversation: async (friendId) => {
    try {
      await api.delete(`/chat/conversations/${friendId}`);
      set((state) => ({
        messages: { ...state.messages, [friendId]: [] },
        friends: state.friends.map((f) =>
          f.user.id === friendId ? { ...f, lastMessage: null, unread: 0 } : f
        ),
        hasMore: { ...state.hasMore, [friendId]: false },
      }));
      toast.success("Conversation cleared");
    } catch (error) {
      toast.error(getMappedErrorMessage(error, { NOT_FOUND: "Conversation not found." }));
      throw error;
    }
  },

  emitTyping: (friendId, typing) => {
    getSocket().emit(typing ? "typing:start" : "typing:stop", { to: friendId });
  },
}));

export const selectTotalUnread = (state: ChatState) =>
  state.friends.reduce((sum, f) => sum + f.unread, 0);

export const selectIncomingRequests = (state: ChatState) =>
  state.requests.filter((r) => r.direction === "incoming").length;
