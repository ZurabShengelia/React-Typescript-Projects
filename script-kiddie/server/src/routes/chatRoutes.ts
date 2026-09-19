import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { chatMessageLimiter, friendRequestLimiter } from "../middlewares/rateLimiters";
import {
  searchUsersSchema,
  friendRequestSchema,
  friendIdParamSchema,
  sendMessageSchema,
  messageHistorySchema,
} from "../validators/chatValidators";
import {
  getFriends,
  getRequests,
  getOnlineFriends,
  getUserSearch,
  postFriendRequest,
  postRequestResponse,
  deleteFriend,
  getMessages,
  postMessage,
  postMarkRead,
  deleteConversationController,
} from "../controllers/chatController";

const router = Router();

router.use(requireAuth);

router.get("/friends", getFriends);
router.get("/friends/online", getOnlineFriends);
router.get("/requests", getRequests);
router.get("/users/search", validate(searchUsersSchema), getUserSearch);

router.post("/requests", friendRequestLimiter, validate(friendRequestSchema), postFriendRequest);
router.post("/requests/:id/accept", validate(friendIdParamSchema), postRequestResponse);
router.post("/requests/:id/reject", validate(friendIdParamSchema), postRequestResponse);
router.delete("/friends/:id", validate(friendIdParamSchema), deleteFriend);

router.get("/messages/:id", validate(messageHistorySchema), getMessages);
router.post("/messages", chatMessageLimiter, validate(sendMessageSchema), postMessage);
router.delete("/conversations/:id", validate(friendIdParamSchema), deleteConversationController);
router.post("/messages/:id/read", validate(friendIdParamSchema), postMarkRead);

export default router;
