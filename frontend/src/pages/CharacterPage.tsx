import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { CharacterEquipment, ShopItem, ShopInventory } from '../types';
import { BottomNav } from '../components/BottomNav';
import { getEmojiForItem } from '../utils/emojiMap';

type SlotType = 'base' | 'hat' | 'outfit' | 'pet' | 'effect';

const EFFECT_ANIMATIONS: Record<string, string> = {
  effect_sparkles: 'animate-pulse',
  effect_fire_trail: 'animate-bounce',
  effect_rainbow_glow: 'animate-spin-slow',
  effect_snowflakes: 'animate-float',
};

export const CharacterPage: React.FC = () => {
  const { get, post } = useApi();
  const [equipment, setEquipment] = useState<CharacterEquipment | null>(null);
  const [equipmentNames, setEquipmentNames] = useState<CharacterEquipment>({
    base: null, hat: null, outfit: null, pet: null, effect: null,
  });
  const [inventory, setInventory] = useState<ShopInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotType | null>(null);
  const [availableItems, setAvailableItems] = useState<ShopItem[]>([]);
  const [justEquipped, setJustEquipped] = useState(false);

  const loadData = async () => {
    try {
      const [charData, shopData] = await Promise.all([
        get('/api/shop/character'),
        get('/api/shop/items'),
      ]);
      setEquipment(charData.character);
      setEquipmentNames(charData.characterNames || {
        base: null, hat: null, outfit: null, pet: null, effect: null,
      });
      setInventory(shopData.items);
    } catch (error) {
      console.error('Failed to load character data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSlot = (slot: SlotType) => {
    if (!inventory) return;

    const itemsBySlot: Record<SlotType, ShopItem[]> = {
      base: inventory.bases.filter((i) => i.owned),
      hat: inventory.hats.filter((i) => i.owned),
      outfit: inventory.outfits.filter((i) => i.owned),
      pet: inventory.pets.filter((i) => i.owned),
      effect: inventory.effects.filter((i) => i.owned),
    };

    setSelectedSlot(slot);
    setAvailableItems(itemsBySlot[slot]);
  };

  const handleEquip = async (item: ShopItem) => {
    try {
      await post('/api/shop/equip', { itemId: item.id });
      await loadData();
      setSelectedSlot(null);
      setJustEquipped(true);
      setTimeout(() => setJustEquipped(false), 1000);
    } catch (error) {
      console.error('Failed to equip item:', error);
    }
  };

  const handleUnequip = async (slot: SlotType) => {
    // For non-base slots, we can "unequip" by just closing
    // Base must always have something equipped
    if (slot === 'base') return;
    // TODO: Add unequip API if needed
    setSelectedSlot(null);
  };

  if (isLoading || !equipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center">
        <div className="text-center">
          <img src="/alice.png" alt="Alice" className="w-24 h-auto mx-auto mb-4 animate-bounce" />
          <div className="text-white text-xl font-bold">Getting ready...</div>
        </div>
      </div>
    );
  }

  const effectKey = equipment.effect;
  const effectAnim = effectKey ? (EFFECT_ANIMATIONS[effectKey] || 'animate-pulse') : '';

  const slots: { id: SlotType; label: string; emptyIcon: string; color: string }[] = [
    { id: 'hat', label: 'Hat', emptyIcon: '🎩', color: 'from-amber-400 to-yellow-400' },
    { id: 'base', label: 'Hero', emptyIcon: '🦸', color: 'from-blue-400 to-indigo-400' },
    { id: 'outfit', label: 'Outfit', emptyIcon: '👗', color: 'from-pink-400 to-rose-400' },
    { id: 'pet', label: 'Pet', emptyIcon: '🐾', color: 'from-green-400 to-emerald-400' },
    { id: 'effect', label: 'Magic', emptyIcon: '🪄', color: 'from-purple-400 to-violet-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 pb-28 safe-area-bottom">
      {/* Header */}
      <div className="text-center pt-6 pb-2 px-4">
        <h1 className="text-2xl font-black text-white drop-shadow-lg">Maya's Character</h1>
      </div>

      {/* Character Stage */}
      <div className="px-4 mb-4">
        <div className={`bg-white/15 backdrop-blur-sm rounded-3xl p-6 relative overflow-hidden ${justEquipped ? 'animate-pulse' : ''}`}>
          {/* Background decorations */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 text-9xl pointer-events-none">
            🏰
          </div>

          {/* Character composition */}
          <div className="relative mx-auto w-48 h-56">
            {/* Effect layer (behind) */}
            {equipment.effect && (
              <div className={`absolute inset-0 flex items-center justify-center ${effectAnim}`}>
                <span className="text-8xl opacity-30">{getEmojiForItem(equipment.effect)}</span>
              </div>
            )}

            {/* Hat (top) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
              <span className="text-5xl drop-shadow-lg">
                {equipment.hat ? getEmojiForItem(equipment.hat) : ''}
              </span>
            </div>

            {/* Base character (center) */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center">
              <span className="text-8xl drop-shadow-xl">
                {getEmojiForItem(equipment.base)}
              </span>
            </div>

            {/* Outfit label (below character) */}
            {equipmentNames.outfit && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-pink-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {getEmojiForItem(equipment.outfit)} {equipmentNames.outfit}
                </span>
              </div>
            )}

            {/* Pet (right side) */}
            {equipment.pet && (
              <div className="absolute right-0 top-20">
                <span className="text-5xl drop-shadow-lg" style={{ animation: 'bunnyHop 0.7s ease-in-out infinite' }}>
                  {getEmojiForItem(equipment.pet)}
                </span>
              </div>
            )}
          </div>

          {/* Character name */}
          <div className="text-center mt-2">
            <p className="text-white font-black text-lg drop-shadow">
              {equipmentNames.base || 'Explorer'} Maya
            </p>
            {equipment.effect && (
              <p className="text-white/70 text-xs font-bold mt-1">
                {getEmojiForItem(equipment.effect)} {equipmentNames.effect} active
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="px-4">
        <h2 className="text-white font-black text-lg mb-3 drop-shadow">Equipment</h2>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {slots.map((slot) => {
            const equippedKey = equipment[slot.id];
            const equippedName = equipmentNames[slot.id];
            const hasItem = !!equippedKey;

            return (
              <button
                key={slot.id}
                onClick={() => handleSelectSlot(slot.id)}
                className={`rounded-2xl p-2 transition-all active:scale-90 flex flex-col items-center gap-1 ${
                  hasItem
                    ? `bg-gradient-to-b ${slot.color} shadow-lg`
                    : 'bg-white/20 border-2 border-dashed border-white/40'
                }`}
              >
                <span className="text-3xl">
                  {hasItem ? getEmojiForItem(equippedKey) : slot.emptyIcon}
                </span>
                <span className={`text-xs font-bold ${hasItem ? 'text-white' : 'text-white/60'}`}>
                  {slot.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed slot list */}
        <div className="space-y-2">
          {slots.map((slot) => {
            const equippedKey = equipment[slot.id];
            const equippedName = equipmentNames[slot.id];

            return (
              <button
                key={slot.id}
                onClick={() => handleSelectSlot(slot.id)}
                className="w-full bg-white/90 backdrop-blur rounded-2xl p-3 shadow transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${slot.color}`}>
                    <span className="text-2xl">
                      {equippedKey ? getEmojiForItem(equippedKey) : slot.emptyIcon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{slot.label}</p>
                    <p className="text-xs text-gray-500">
                      {equippedName || 'None — tap to equip'}
                    </p>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot Selection Modal */}
      {selectedSlot && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl shadow-2xl p-6 max-h-[70vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">
                Choose {slots.find((s) => s.id === selectedSlot)?.label}
              </h2>
              <button
                onClick={() => setSelectedSlot(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold"
              >
                ✕
              </button>
            </div>

            {availableItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🛍️</div>
                <p className="text-gray-500 font-bold">No items yet!</p>
                <p className="text-gray-400 text-sm mt-1">Visit the Magic Shop to buy some</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableItems.map((item) => {
                  const isEquipped = equipment[selectedSlot] === item.asset_key;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleEquip(item)}
                      className={`w-full p-4 rounded-2xl transition-all active:scale-[0.97] flex items-center gap-4 ${
                        isEquipped
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-4xl">{getEmojiForItem(item.asset_key)}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold">{item.name}</p>
                        {isEquipped && (
                          <p className="text-sm opacity-80">Currently wearing</p>
                        )}
                      </div>
                      {isEquipped && <span className="text-2xl">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
