import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { emitToUser } from "../realtime/socket";
import { isOnline, filterOnline } from "../realtime/presence";
import {
  listFriends,
  listFriendIds,
  listRequests,
  searchUsers,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
  getHistory,
  createMessage,
  markConversationRead,
  deleteConversation,
  toPublicUser,
} from "../services/chatService";

export const getFriends = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const friends = await listFriends(userId);
  res.json({
    success: true,
    data: {
      friends: friends.map((entry) => ({ ...entry, online: isOnline(entry.user.id) })),
    },
  });
});

export const getRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const requests = await listRequests(req.auth!.userId);
  res.json({ success: true, data: { requests } });
});

export const getOnlineFriends = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ids = await listFriendIds(req.auth!.userId);
  res.json({ success: true, data: { online: filterOnline(ids) } });
});

export const getUserSearch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const term = String(req.query.q ?? "").trim();
  const results = await searchUsers(req.auth!.userId, term);
  res.json({ success: true, data: { results } });
});

export const postFriendRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const { userId: targetId } = req.body as { userId: string };

  const { friendship, autoAccepted } = await sendFriendRequest(userId, targetId);
  const me = await User.findById(userId).select("name avatarVersion");
  if (!me) throw ApiError.unauthorized();

  emitToUser(targetId, autoAccepted ? "friend:added" : "friend:request", {
    requestId: friendship._id.toString(),
    user: toPublicUser(me),
    online: isOnline(userId),
  });

  res.status(201).json({
    success: true,
    data: { status: autoAccepted ? "accepted" : "pending" },
  });
});

export const postRequestResponse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const accept = req.path.endsWith("/accept");

  const { accepted, otherUser } = await respondToRequest(userId, req.params.id, accept);
  const me = await User.findById(userId).select("name avatarVersion");
  if (!me) throw ApiError.unauthorized();

  const otherId = otherUser._id.toString();
  if (accepted) {
    emitToUser(otherId, "friend:added", { user: toPublicUser(me), online: true });
  } else {

    emitToUser(otherId, "friend:request:closed", { userId });
  }

  res.json({ success: true, data: { accepted } });
});

export const deleteFriend = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  await removeFriend(userId, req.params.id);
  emitToUser(req.params.id, "friend:removed", { userId });
  res.json({ success: true, data: { removed: true } });
});

export const getMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const page = await getHistory(userId, req.params.id, { before, limit });
  res.json({ success: true, data: page });
});

export const postMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const { to, body, clientId } = req.body as { to: string; body: string; clientId?: string };

  const message = await createMessage(userId, to, body);

  emitToUser(to, "message:new", { message });

  emitToUser(userId, "message:sent", { message, clientId });

  res.status(201).json({ success: true, data: { message, clientId: clientId ?? null } });
});

export const postMarkRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const conversationId = await markConversationRead(userId, req.params.id);
  emitToUser(req.params.id, "message:read", { userId, conversationId });
  res.json({ success: true, data: { conversationId } });
});

export const deleteConversationController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const friendId = req.params.id;
  const ok = await deleteConversation(userId, friendId);
  if (!ok) throw ApiError.notFound("Conversation not found");

  emitToUser(friendId, "conversation:deleted", { userId });
  res.json({ success: true, data: { deleted: true } });
});
