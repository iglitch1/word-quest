import { Router, Response } from 'express';
import { queryAll, queryOne } from '../database/db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/admin/usage - Game usage dashboard (admin only)
router.get('/usage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Only allow admin users (or the original "igal" account for now)
    const user = await queryOne<any>('SELECT username, role FROM users WHERE id = ?', [req.userId]);
    if (!user || (user.role !== 'admin' && user.username !== 'igal')) {
      res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }

    // All registered users (no passwords)
    const users = await queryAll<any>(
      `SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at ASC`
    );

    // Per-user stats
    const userStats = [];
    for (const u of users) {
      const progress = await queryOne<any>(
        'SELECT total_coins, total_stars, current_title, words_mastered FROM player_progress WHERE user_id = ?',
        [u.id]
      );

      const sessions = await queryAll<any>(
        `SELECT id, level_id, started_at, ended_at, status, score, accuracy, stars_earned
         FROM game_sessions WHERE user_id = ? ORDER BY started_at DESC`,
        [u.id]
      );

      const levelsCompleted = await queryOne<any>(
        'SELECT COUNT(*) as count FROM level_completion WHERE user_id = ?',
        [u.id]
      );

      userStats.push({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        role: u.role,
        registeredAt: u.created_at,
        progress: progress || { total_coins: 0, total_stars: 0, current_title: 'Word Apprentice', words_mastered: 0 },
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s: any) => s.status === 'completed').length,
        levelsCompleted: levelsCompleted?.count || 0,
        lastPlayed: sessions.length > 0 ? sessions[0].started_at : null,
        recentSessions: sessions.slice(0, 10).map((s: any) => ({
          id: s.id,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          status: s.status,
          score: s.score,
          accuracy: s.accuracy,
          starsEarned: s.stars_earned,
        })),
      });
    }

    // Overall summary
    const totalSessions = await queryOne<any>('SELECT COUNT(*) as count FROM game_sessions');
    const completedSessions = await queryOne<any>(
      "SELECT COUNT(*) as count FROM game_sessions WHERE status = 'completed'"
    );
    const activeSessions = await queryOne<any>(
      "SELECT COUNT(*) as count FROM game_sessions WHERE status = 'active'"
    );

    res.json({
      summary: {
        totalUsers: users.length,
        totalGameSessions: totalSessions?.count || 0,
        completedSessions: completedSessions?.count || 0,
        activeSessions: activeSessions?.count || 0,
      },
      users: userStats,
    });
  } catch (error) {
    console.error('Admin usage error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get usage data' });
  }
});

export default router;
