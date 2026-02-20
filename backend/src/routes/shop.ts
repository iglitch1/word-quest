import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { execute, queryOne, queryAll } from '../database/db';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { CharacterItem, PlayerInventory, PlayerProgress, ShopItemResponse } from '../types';

const router = Router();

// GET /api/shop/items
router.get('/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const items = await queryAll<CharacterItem>(
      'SELECT * FROM character_items ORDER BY type ASC, cost_coins ASC'
    );

    // Get user inventory
    const inventory = await queryAll<any>(
      'SELECT item_id, equipped FROM player_inventory WHERE user_id = ?',
      [req.userId]
    );

    const inventoryMap = new Map(inventory.map(inv => [inv.item_id, inv.equipped]));

    // Group items by type (use plural keys to match frontend ShopInventory)
    const itemsByType: Record<string, ShopItemResponse[]> = {
      bases: [],
      hats: [],
      outfits: [],
      pets: [],
      effects: [],
    };

    const typeToPlural: Record<string, string> = {
      base: 'bases',
      hat: 'hats',
      outfit: 'outfits',
      pet: 'pets',
      effect: 'effects',
    };

    items.forEach(item => {
      const key = typeToPlural[item.type] || item.type;
      if (!itemsByType[key]) {
        itemsByType[key] = [];
      }

      const itemResponse: ShopItemResponse = {
        ...item,
        owned: inventoryMap.has(item.id),
        equipped: inventoryMap.get(item.id) ? true : false,
      };

      itemsByType[key].push(itemResponse);
    });

    // Get player coins
    const progress = await queryOne<PlayerProgress>(
      'SELECT total_coins FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    res.json({ items: itemsByType, playerCoins: progress?.total_coins || 0 });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get shop items',
    });
  }
});

// POST /api/shop/purchase
router.post('/purchase', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'itemId is required',
      });
      return;
    }

    // Get item
    const item = await queryOne<CharacterItem>(
      'SELECT * FROM character_items WHERE id = ?',
      [itemId]
    );

    if (!item) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Item not found',
      });
      return;
    }

    // Check if already owned
    const existing = await queryOne<PlayerInventory>(
      'SELECT * FROM player_inventory WHERE user_id = ? AND item_id = ?',
      [req.userId, itemId]
    );

    if (existing) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Item already owned',
      });
      return;
    }

    // Get user progress
    const progress = await queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    if (!progress || progress.total_coins < item.cost_coins) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Insufficient coins',
      });
      return;
    }

    // Deduct coins
    await execute(
      'UPDATE player_progress SET total_coins = total_coins - ? WHERE user_id = ?',
      [item.cost_coins, req.userId]
    );

    // Add to inventory
    await execute(
      'INSERT INTO player_inventory (id, user_id, item_id, equipped) VALUES (?, ?, ?, ?)',
      [uuid(), req.userId, itemId, false]
    );

    // Get updated progress
    const updatedProgress = await queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    res.status(201).json({
      message: 'Item purchased successfully',
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        costCoins: item.cost_coins,
      },
      totalCoins: updatedProgress?.total_coins || 0,
    });
  } catch (error) {
    console.error('Purchase item error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to purchase item',
    });
  }
});

// POST /api/shop/equip
router.post('/equip', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'itemId is required',
      });
      return;
    }

    // Verify item is owned
    const inventory = await queryOne<PlayerInventory>(
      'SELECT * FROM player_inventory WHERE user_id = ? AND item_id = ?',
      [req.userId, itemId]
    );

    if (!inventory) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Item not owned',
      });
      return;
    }

    // Get item type
    const item = await queryOne<CharacterItem>(
      'SELECT * FROM character_items WHERE id = ?',
      [itemId]
    );

    if (!item) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Item not found',
      });
      return;
    }

    // Unequip other items of same type
    await execute(
      'UPDATE player_inventory SET equipped = FALSE WHERE user_id = ? AND item_id IN (SELECT id FROM character_items WHERE type = ?)',
      [req.userId, item.type]
    );

    // Equip this item
    await execute(
      'UPDATE player_inventory SET equipped = TRUE WHERE user_id = ? AND item_id = ?',
      [req.userId, itemId]
    );

    res.json({
      message: 'Item equipped successfully',
      itemId,
      itemName: item.name,
    });
  } catch (error) {
    console.error('Equip item error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to equip item',
    });
  }
});

// GET /api/shop/character
router.get('/character', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get equipped items
    const equippedItems = await queryAll<any>(
      `SELECT ci.id, ci.name, ci.type, ci.asset_key FROM character_items ci
       JOIN player_inventory pi ON ci.id = pi.item_id
       WHERE pi.user_id = ? AND pi.equipped = TRUE`,
      [req.userId]
    );

    // Build character with asset_key strings for display, plus names for labels
    const character: Record<string, string | null> = {
      base: null,
      hat: null,
      outfit: null,
      pet: null,
      effect: null,
    };
    const characterNames: Record<string, string | null> = {
      base: null,
      hat: null,
      outfit: null,
      pet: null,
      effect: null,
    };
    const characterIds: Record<string, string | null> = {
      base: null,
      hat: null,
      outfit: null,
      pet: null,
      effect: null,
    };

    equippedItems.forEach(item => {
      character[item.type] = item.asset_key;
      characterNames[item.type] = item.name;
      characterIds[item.type] = item.id;
    });

    res.json({ character, characterNames, characterIds });
  } catch (error) {
    console.error('Get character error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get character',
    });
  }
});

export default router;
