import { Router, Response } from 'express';
import { queryAll, queryOne } from '../database/db';
import { AuthRequest, authMiddleware, optionalAuth } from '../middleware/auth';
import { World, Level, WorldStats } from '../types';

const router = Router();

// GET /api/worlds
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const worlds = await queryAll<World>(
      'SELECT * FROM worlds ORDER BY display_order ASC'
    );

    if (!req.userId) {
      // Return worlds without user-specific data
      res.json({
        worlds: worlds.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          theme: w.theme,
          displayOrder: w.display_order,
          iconEmoji: w.icon_emoji,
          colorPrimary: w.color_primary,
          colorSecondary: w.color_secondary,
          unlockStarsRequired: w.unlock_stars_required,
          starsEarned: 0,
          levelsCompleted: 0,
          totalLevels: 0,
          unlockedAt: 0,
        })),
      });
      return;
    }

    // Get user's progress
    const worldStats: WorldStats[] = [];
    for (const world of worlds) {
      // Get levels in world
      const levels = await queryAll<Level>(
        'SELECT id FROM levels WHERE world_id = ?',
        [world.id]
      );

      // Get completed levels
      const completedLevels = await queryAll<any>(
        'SELECT COALESCE(SUM(best_stars), 0) as total_stars, COUNT(*) as count FROM level_completion WHERE user_id = ? AND level_id IN (SELECT id FROM levels WHERE world_id = ?)',
        [req.userId, world.id]
      );

      const totalStars = completedLevels[0]?.total_stars || 0;
      const completed = completedLevels[0]?.count || 0;

      worldStats.push({
        worldId: world.id,
        name: world.name,
        iconEmoji: world.icon_emoji,
        starsEarned: totalStars,
        levelsCompleted: completed,
        totalLevels: levels.length,
        unlockedAt: world.unlock_stars_required === 0 ? Date.now() : undefined,
      });
    }

    // Check which worlds are unlocked
    const userProgress = await queryOne<any>(
      'SELECT total_stars FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    // Find world data to get star requirements
    const worldMap = new Map(worlds.map(w => [w.id, w]));

    const unlockableWorlds = worldStats.map(stat => {
      const worldData = worldMap.get(stat.worldId);
      const unlocked = worldData
        ? (userProgress?.total_stars || 0) >= worldData.unlock_stars_required
        : true;
      return {
        id: stat.worldId,
        ...stat,
        description: worldData?.description || '',
        theme: worldData?.theme || '',
        colorPrimary: worldData?.color_primary || '#8b5cf6',
        colorSecondary: worldData?.color_secondary || '#ddd6fe',
        unlockStarsRequired: worldData?.unlock_stars_required || 0,
        unlocked,
      };
    });

    res.json({ worlds: unlockableWorlds });
  } catch (error) {
    console.error('Get worlds error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get worlds',
    });
  }
});

// GET /api/worlds/:worldId/levels
router.get('/:worldId/levels', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { worldId } = req.params;

    // Verify world exists
    const world = await queryOne<World>(
      'SELECT * FROM worlds WHERE id = ?',
      [worldId]
    );

    if (!world) {
      res.status(404).json({
        error: 'Not Found',
        message: 'World not found',
      });
      return;
    }

    // Get levels
    const levels = await queryAll<Level>(
      'SELECT * FROM levels WHERE world_id = ? ORDER BY level_number ASC',
      [worldId]
    );

    const worldData = {
      id: world.id,
      name: world.name,
      description: world.description,
      theme: world.theme,
      iconEmoji: world.icon_emoji,
      colorPrimary: world.color_primary,
      colorSecondary: world.color_secondary,
      unlockStarsRequired: world.unlock_stars_required,
      totalLevels: levels.length,
    };

    if (!req.userId) {
      res.json({
        world: worldData,
        levels: levels.map(level => ({
          id: level.id,
          levelNumber: level.level_number,
          name: level.name,
          difficultyTier: level.difficulty_tier,
          targetWordCount: level.target_word_count,
          timeLimitSeconds: level.time_limit_seconds,
          baseCoins: level.base_coins,
          completed: false,
          bestStars: 0,
          bestScore: 0,
          timesPlayed: 0,
        })),
      });
      return;
    }

    // Get user's completion data
    const levelStats = [];
    for (const level of levels) {
      const completion = await queryOne<any>(
        'SELECT best_stars, best_score, times_played FROM level_completion WHERE user_id = ? AND level_id = ?',
        [req.userId, level.id]
      );

      levelStats.push({
        id: level.id,
        levelNumber: level.level_number,
        name: level.name,
        difficultyTier: level.difficulty_tier,
        targetWordCount: level.target_word_count,
        timeLimitSeconds: level.time_limit_seconds,
        baseCoins: level.base_coins,
        completed: !!completion,
        bestStars: completion?.best_stars || 0,
        bestScore: completion?.best_score || 0,
        timesPlayed: completion?.times_played || 0,
      });
    }

    res.json({ world: worldData, levels: levelStats });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get levels',
    });
  }
});

export default router;
