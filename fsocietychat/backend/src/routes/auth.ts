import { Router, Request, Response } from 'express';
import User from '../models/User';
import { signToken } from '../middleware/auth';
import { RegisterRequestBody, LoginRequestBody, AuthResponseBody } from '../types';

const router = Router();

router.post('/register', async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are all required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'A user with that email or username already exists' });
    }

    const user = await User.create({ username, email, password });

    const token = signToken({ id: user.id, username: user.username });

    const body: AuthResponseBody = {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };

    return res.status(201).json(body);
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

router.post('/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, username: user.username });

    const body: AuthResponseBody = {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };

    return res.status(200).json(body);
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

export default router;
