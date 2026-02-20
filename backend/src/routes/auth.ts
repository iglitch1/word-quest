import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { execute, queryOne, queryAll } from '../database/db';
import { AuthRequest, authMiddleware, generateToken } from '../middleware/auth';
import { User, PlayerProgress } from '../types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, displayName, password, role = 'player' } = req.body;

    // Validation
    if (!username || !displayName || !password) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'username, displayName, and password are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    // Check if username exists
    const existing = await queryOne<User>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Username already exists',
      });
      return;
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user
    const userId = uuid();
    const now = Date.now();

    await execute(
      `INSERT INTO users (id, username, display_name, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, displayName, passwordHash, role, now]
    );

    // Create player progress
    await execute(
      `INSERT INTO player_progress (user_id, total_coins, total_stars, current_title, words_mastered)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 0, 0, 'Word Apprentice', 0]
    );

    // Get default base item
    const defaultBase = await queryOne<any>(
      'SELECT id FROM character_items WHERE type = ? AND is_default = TRUE',
      ['base']
    );

    if (defaultBase) {
      await execute(
        `INSERT INTO player_inventory (id, user_id, item_id, equipped)
         VALUES (?, ?, ?, ?)`,
        [uuid(), userId, defaultBase.id, true]
      );
    }

    // Generate token
    const token = generateToken(userId, role);

    // Get user info
    const user = await queryOne<User>(
      'SELECT id, username, display_name, role FROM users WHERE id = ?',
      [userId]
    );

    const progress = await queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [userId]
    );

    res.status(201).json({
      token,
      user: {
        id: user?.id,
        username: user?.username,
        displayName: user?.display_name,
        role: user?.role,
        progress,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'username and password are required',
      });
      return;
    }

    // Get user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
      return;
    }

    // Verify password
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Get progress
    const progress = await queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        progress,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login',
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await queryOne<any>(
      'SELECT id, username, display_name, role, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    const progress = await queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        progress,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user',
    });
  }
});

export default router;
