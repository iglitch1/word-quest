import { Router, Response } from 'express';
import { queryOne, queryAll } from '../database/db';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { PlayerProgress, WordMastery } from '../types';

const router = Router();

// GET /api/stats/overview
router.get('/overview', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    // Get player progress
    const progress = queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    // Count levels completed
    const levelsData = queryOne<any>(
      'SELECT COUNT(*) as completed, (SELECT COUNT(*) FROM levels) as total FROM level_completion WHERE user_id = ?',
      [req.userId]
    );

    // Get word mastery
    const wordsMastered = queryAll<WordMastery>(
      'SELECT * FROM word_mastery WHERE user_id = ? AND mastery_level = ?',
      [req.userId, 'mastered']
    );

    const wordsLearning = queryAll<WordMastery>(
      'SELECT DISTINCT word_id FROM word_mastery WHERE user_id = ? AND mastery_level IN (?, ?)',
      [req.userId, 'learning', 'proficient']
    );

    res.json({
      overview: {
        totalCoins: progress?.total_coins || 0,
        totalStars: progress?.total_stars || 0,
        currentTitle: progress?.current_title || 'Word Apprentice',
        wordsMastered: wordsMastered.length,
        wordsLearned: wordsLearning.length,
        levelsCompleted: levelsData?.completed || 0,
        totalLevels: levelsData?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get stats overview',
    });
  }
});

// GET /api/stats/mastery
router.get('/mastery', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    // Get all mastery data grouped by category
    const masteryData = queryAll<any>(
      `SELECT v.id, v.word, v.category, v.definition, wm.times_correct, wm.times_attempted, wm.mastery_level
       FROM word_mastery wm
       JOIN vocabulary v ON wm.word_id = v.id
       WHERE wm.user_id = ?
       ORDER BY v.category ASC, wm.mastery_level DESC`,
      [req.userId]
    );

    // Group by category
    const byCategory: Record<string, any[]> = {};

    masteryData.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }

      byCategory[item.category].push({
        wordId: item.id,
        word: item.word,
        definition: item.definition,
        timesCorrect: item.times_correct,
        timesAttempted: item.times_attempted,
        masteryLevel: item.mastery_level,
        accuracy: item.times_attempted > 0 ? (item.times_correct / item.times_attempted * 100).toFixed(0) + '%' : '0%',
      });
    });

    // Calculate category stats
    const categoryStats: Record<string, any> = {};
    Object.keys(byCategory).forEach(category => {
      const words = byCategory[category];
      const mastered = words.filter(w => w.masteryLevel === 'mastered').length;
      const proficient = words.filter(w => w.masteryLevel === 'proficient').length;
      const learning = words.filter(w => w.masteryLevel === 'learning').length;

      categoryStats[category] = {
        total: words.length,
        mastered,
        proficient,
        learning,
        new: words.length - mastered - proficient - learning,
        words,
      };
    });

    res.json({ mastery: categoryStats });
  } catch (error) {
    console.error('Get mastery error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get mastery data',
    });
  }
});

export default router;
