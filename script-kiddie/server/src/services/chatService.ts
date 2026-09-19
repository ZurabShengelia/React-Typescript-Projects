import { Types } from "mongoose";
import { User } from "../models/User";
import { Friendship, buildPairKey } from "../models/Friendship";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { ApiError } from "../utils/ApiError";
import { avatarUrl } from "../utils/avatar";

export interface PublicUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface UserLike {
  _id: Types.ObjectId;
  name: string;
  avatarVersion?: number;
}

export function toPublicUser(user: UserLike): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    avatarUrl: avatarUrl(user._id.toString(), user.avatarVersion ?? 0),
  };
}

export async function listFriendIds(userId: string): Promise<string[]> {
  const rows = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  }).select("requester recipient");

  return rows.map((row) =>
    row.requester.toString() === userId ? row.recipient.toString() : row.requester.toString()
  );
}

export async function assertFriends(a: string, b: string): Promise<void> {
  const link = await Friendship.findOne({ pairKey: buildPairKey(a, b), status: "accepted" });
  if (!link) throw ApiError.forbidden("You can only message friends").withCode("NOT_FRIENDS");
}

export async function getOrCreateConversation(a: string, b: string) {
  const pairKey = buildPairKey(a, b);
  return Conversation.findOneAndUpdate(
    { pairKey },
    { $setOnInsert: { pairKey, participants: [a, b], unread: {} } },
    { new: true, upsert: true }
  );
}

export interface FriendEntry {
  user: PublicUser;
  conversationId: string | null;
  unread: number;
  lastMessage: { body: string; sentAt: string; fromSelf: boolean } | null;
}

export async function listFriends(userId: string): Promise<FriendEntry[]> {
  const friendIds = await listFriendIds(userId);
  if (friendIds.length === 0) return [];

  const [users, conversations] = await Promise.all([
    User.find({ _id: { $in: friendIds } }).select("name avatarVersion"),
    Conversation.find({ participants: userId }),
  ]);

  const byPair = new Map(conversations.map((c) => [c.pairKey, c]));

  const entries: FriendEntry[] = users.map((user) => {
    const friendId = user._id.toString();
    const conversation = byPair.get(buildPairKey(userId, friendId));
    const last = conversation?.lastMessage;

    return {
      user: toPublicUser(user),
      conversationId: conversation?._id.toString() ?? null,
      unread: conversation?.unread?.get(userId) ?? 0,
      lastMessage:
        last?.sentAt && last.body
          ? {
              body: last.body,
              sentAt: last.sentAt.toISOString(),
              fromSelf: last.sender?.toString() === userId,
            }
          : null,
    };
  });

  return entries.sort((a, b) => {
    const at = a.lastMessage?.sentAt;
    const bt = b.lastMessage?.sentAt;
    if (at && bt) return bt.localeCompare(at);
    if (at) return -1;
    if (bt) return 1;
    return a.user.name.localeCompare(b.user.name);
  });
}

export interface RequestEntry {
  id: string;
  user: PublicUser;
  direction: "incoming" | "outgoing";
  createdAt: string;
}

export async function listRequests(userId: string): Promise<RequestEntry[]> {
  const rows = await Friendship.find({
    status: "pending",
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .populate<{ requester: UserLike; recipient: UserLike }>("requester recipient", "name avatarVersion")
    .sort({ createdAt: -1 });

  return rows.map((row) => {
    const outgoing = row.requester._id.toString() === userId;
    return {
      id: row._id.toString(),
      user: toPublicUser(outgoing ? row.recipient : row.requester),
      direction: outgoing ? "outgoing" : "incoming",
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export type RelationshipState = "none" | "friends" | "request_sent" | "request_received" | "self";

export interface SearchResult extends PublicUser {
  relationship: RelationshipState;
}

export async function searchUsers(userId: string, term: string): Promise<SearchResult[]> {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: { $ne: userId },
    emailVerified: true,
    name: { $regex: `^${escaped}`, $options: "i" },
  })
    .select("name avatarVersion")
    .limit(10);

  if (users.length === 0) return [];

  const links = await Friendship.find({
    pairKey: { $in: users.map((u) => buildPairKey(userId, u._id.toString())) },
  });
  const byPair = new Map(links.map((l) => [l.pairKey, l]));

  return users.map((user) => {
    const link = byPair.get(buildPairKey(userId, user._id.toString()));
    let relationship: RelationshipState = "none";
    if (link) {
      if (link.status === "accepted") relationship = "friends";
      else relationship = link.requester.toString() === userId ? "request_sent" : "request_received";
    }
    return { ...toPublicUser(user), relationship };
  });
}

export async function sendFriendRequest(userId: string, targetId: string) {
  if (userId === targetId) {
    throw ApiError.badRequest("You can't add yourself").withCode("SELF_REQUEST");
  }

  const target = await User.findById(targetId).select("name avatarVersion emailVerified");
  if (!target || !target.emailVerified) throw ApiError.notFound("User not found").withCode("USER_NOT_FOUND");

  const pairKey = buildPairKey(userId, targetId);
  const existing = await Friendship.findOne({ pairKey });

  if (existing) {
    if (existing.status === "accepted") {
      throw ApiError.conflict("Already friends").withCode("ALREADY_FRIENDS");
    }

    if (existing.recipient.toString() === userId) {
      existing.status = "accepted";
      await existing.save();
      return { friendship: existing, target, autoAccepted: true };
    }
    throw ApiError.conflict("Request already sent").withCode("REQUEST_PENDING");
  }

  const friendship = await Friendship.create({
    requester: userId,
    recipient: targetId,
    status: "pending",
    pairKey,
  });
  return { friendship, target, autoAccepted: false };
}

export async function respondToRequest(userId: string, requestId: string, accept: boolean) {
  const request = await Friendship.findById(requestId).populate<{ requester: UserLike }>(
    "requester",
    "name avatarVersion"
  );
  if (!request || request.status !== "pending") {
    throw ApiError.notFound("Request not found").withCode("REQUEST_NOT_FOUND");
  }

  if (request.recipient.toString() !== userId) {
    throw ApiError.forbidden("Not your request to answer").withCode("NOT_RECIPIENT");
  }

  if (!accept) {
    await request.deleteOne();
    return { accepted: false, otherUser: request.requester };
  }

  request.status = "accepted";
  await request.save();
  return { accepted: true, otherUser: request.requester };
}

export async function removeFriend(userId: string, otherId: string) {
  const deleted = await Friendship.findOneAndDelete({
    pairKey: buildPairKey(userId, otherId),
    $or: [{ requester: userId }, { recipient: userId }],
  });
  if (!deleted) throw ApiError.notFound("Not in your friends list").withCode("NOT_FRIENDS");
  return deleted;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

function toMessageDto(message: {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  body: string;
  createdAt: Date;
  readAt?: Date;
}): MessageDto {
  return {
    id: message._id.toString(),
    conversationId: message.conversation.toString(),
    senderId: message.sender.toString(),
    recipientId: message.recipient.toString(),
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt ? message.readAt.toISOString() : null,
  };
}

export async function getHistory(
  userId: string,
  friendId: string,
  options: { before?: string; limit?: number } = {}
) {
  await assertFriends(userId, friendId);
  const conversation = await getOrCreateConversation(userId, friendId);
  const limit = Math.min(options.limit ?? 40, 100);

  const filter: Record<string, unknown> = { conversation: conversation._id };
  if (options.before) filter.createdAt = { $lt: new Date(options.before) };

  const rows = await Message.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = rows.length > limit;

  return {
    conversationId: conversation._id.toString(),
    hasMore,
    messages: rows.slice(0, limit).reverse().map(toMessageDto),
  };
}

export async function createMessage(senderId: string, recipientId: string, body: string) {
  await assertFriends(senderId, recipientId);
  const conversation = await getOrCreateConversation(senderId, recipientId);

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    recipient: recipientId,
    body,
  });

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessage: { body, sender: senderId, sentAt: message.createdAt } },
      $inc: { [`unread.${recipientId}`]: 1 },
    }
  );

  return toMessageDto(message);
}

export async function markConversationRead(userId: string, friendId: string) {
  const conversation = await getOrCreateConversation(userId, friendId);
  await Promise.all([
    Conversation.updateOne({ _id: conversation._id }, { $set: { [`unread.${userId}`]: 0 } }),
    Message.updateMany(
      { conversation: conversation._id, recipient: userId, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    ),
  ]);
  return conversation._id.toString();
}

export async function deleteConversation(userId: string, friendId: string) {
  const pairKey = buildPairKey(userId, friendId);
  const conversation = await Conversation.findOne({ pairKey });
  if (!conversation) return false;

  await Message.deleteMany({ conversation: conversation._id });
  conversation.lastMessage = undefined;
  conversation.unread = new Map();
  await conversation.save();
  return true;
}
