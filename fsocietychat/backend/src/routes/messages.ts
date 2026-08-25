import { Router, Response } from 'express';
import Message from '../models/Message';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import GroupChat from '../models/GroupChat';

const router = Router();
router.get('/:room', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { room } = req.params;

    if (room.startsWith('group:')) {
      const groupId = room.split(':')[1];
      const group = await GroupChat.findById(groupId).select('members');
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (!group.members.map(String).includes(req.user!.id)) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
    }

    const messages = await Message.find({ room })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    messages.reverse();

    return res.status(200).json({ messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    return res.status(500).json({ error: 'Internal server error fetching messages' });
  }
});

export default router;
