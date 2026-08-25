import { Router, Response } from 'express';
import mongoose from 'mongoose';
import GroupChat from '../models/GroupChat';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, members } = req.body as { name: string; members?: string[] };

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const memberIds = Array.isArray(members) ? members.filter(Boolean) : [];

    const withoutCreator = memberIds.map(String).filter((id) => id !== req.user!.id);
    if (withoutCreator.length === 0) {
      return res.status(400).json({ error: 'Group must have at least one member added' });
    }

    const unique = new Set(memberIds.map((m) => m.toString()));
    unique.add(req.user!.id);

    const membersObjectIds = Array.from(unique).map((id) => new mongoose.Types.ObjectId(id));

    const group = await GroupChat.create({
      name: name.trim(),
      admin: req.user!.id,
      members: membersObjectIds,
    });

    return res.status(201).json({ group });
  } catch (err) {
    console.error('Create group error:', err);
    return res.status(500).json({ error: 'Internal server error creating group' });
  }
});

router.post('/:id/members', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { members } = req.body as { members?: string[] };

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'members array is required' });
    }

    const group = await GroupChat.findById(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.admin.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Only the group admin can add members' });
    }

    const newIds = members.map((m) => m.toString()).filter((m) => !group.members.map(String).includes(m));
    const objectIds = newIds.map((s) => new mongoose.Types.ObjectId(s));

    group.members.push(...objectIds);
    await group.save();

    return res.status(200).json({ group });
  } catch (err) {
    console.error('Add members error:', err);
    return res.status(500).json({ error: 'Internal server error adding members' });
  }
});

router.put('/:id/members', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { members } = req.body as { members?: string[] };

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'members array is required' });
    }

    const group = await GroupChat.findById(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const requesterId = req.user!.id;
    const isAdmin = group.admin.toString() === requesterId;
    const isMember = group.members.map(String).includes(requesterId);
    if (!isAdmin && !isMember) {
      return res.status(403).json({ error: 'Only group members can add new members' });
    }

    const existing = new Set(group.members.map(String));
    const newIds = members.map(String).filter((m) => !existing.has(m));
    if (newIds.length === 0) {
      return res.status(200).json({ group, added: [] });
    }

    const objectIds = newIds.map((s) => new mongoose.Types.ObjectId(s));

    await GroupChat.updateOne({ _id: id }, { $addToSet: { members: { $each: objectIds } } });

    const updated = await GroupChat.findById(id).lean();

    const io = req.app.get('io');
    try {
      io.to(`group:${id}`).emit('group_members_added', { groupId: id, added: newIds });
      newIds.forEach((userId) => {
        io.to(`user:${userId}`).emit('added_to_group', { groupId: id, group: updated });
      });
    } catch (err) {
      console.error('Failed to emit group membership events:', err);
    }

    return res.status(200).json({ group: updated, added: newIds });
  } catch (err) {
    console.error('PUT add members error:', err);
    return res.status(500).json({ error: 'Internal server error adding members' });
  }
});

router.put('/:groupId/add-members', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body as { userIds?: string[] };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const requesterId = req.user!.id;
    const isAdmin = group.admin.toString() === requesterId;
    const isMember = group.members.map(String).includes(requesterId);
    if (!isAdmin && !isMember) {
      return res.status(403).json({ error: 'Only group members can add new members' });
    }

    const existing = new Set(group.members.map(String));
    const newIds = userIds.map(String).filter((id) => !existing.has(id));
    if (newIds.length === 0) {
      return res.status(200).json({ group, added: [] });
    }

    const objectIds = newIds.map((s) => new mongoose.Types.ObjectId(s));

    await GroupChat.updateOne({ _id: groupId }, { $addToSet: { members: { $each: objectIds } } });

    const updated = await GroupChat.findById(groupId).lean();

    const io = req.app.get('io');
    try {
      io.to(`group:${groupId}`).emit('group_members_added', { groupId, added: newIds });
      newIds.forEach((userId) => {
        io.to(`user:${userId}`).emit('added_to_group', { groupId, group: updated });
      });
    } catch (err) {
      console.error('Failed to emit group membership events:', err);
    }

    return res.status(200).json({ group: updated, added: newIds });
  } catch (err) {
    console.error('add-members error:', err);
    return res.status(500).json({ error: 'Internal server error adding members' });
  }
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const groups = await GroupChat.find({ members: req.user!.id }).lean();
    return res.status(200).json({ groups });
  } catch (err) {
    console.error('List groups error:', err);
    return res.status(500).json({ error: 'Internal server error listing groups' });
  }
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const group = await GroupChat.findById(id).lean();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!group.members.map(String).includes(req.user!.id)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    return res.status(200).json({ group });
  } catch (err) {
    console.error('Get group error:', err);
    return res.status(500).json({ error: 'Internal server error fetching group' });
  }
});

export default router;
