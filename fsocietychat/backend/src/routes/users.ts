import { Router, Response } from 'express';
import User from '../models/User';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await User.find({}, '_id username').lean();
    return res.status(200).json({ users });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ error: 'Internal server error listing users' });
  }
});

router.get('/search', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = (req.query.username as string) || '';
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'username query is required' });
    }

    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
    const users = await User.find({ username: { $regex: regex } }, '_id username')
      .limit(20)
      .lean();

    return res.status(200).json({ users });
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({ error: 'Internal server error searching users' });
  }
});

export default router;
