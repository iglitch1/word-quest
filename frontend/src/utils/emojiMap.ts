// Shared emoji map for character items
// asset_keys in the database are prefixed: base_explorer, hat_crown, pet_owl, etc.
const EMOJI_MAP: Record<string, string> = {
  // Bases
  base_explorer: '🧭',
  base_wizard: '🧙',
  base_knight: '🛡️',
  base_pirate: '🏴‍☠️',
  base_fairy: '🧚',
  base_dragon_rider: '🐲',
  // Hats
  hat_crown: '👑',
  hat_wizard_hat: '🎩',
  hat_flower_crown: '💐',
  hat_pirate_hat: '🏴‍☠️',
  hat_space_helmet: '🚀',
  // Outfits
  outfit_royal_cape: '👘',
  outfit_star_cloak: '🌟',
  outfit_forest_tunic: '🌿',
  outfit_ocean_dress: '🌊',
  // Pets
  pet_owl: '🦉',
  pet_cat: '🐱',
  pet_dragon: '🐉',
  pet_unicorn: '🦄',
  pet_fox: '🦊',
  // Effects
  effect_sparkles: '✨',
  effect_fire_trail: '🔥',
  effect_rainbow_glow: '🌈',
  effect_snowflakes: '❄️',
};

export const getEmojiForItem = (assetKey: string | null): string => {
  if (!assetKey) return '❓';
  return EMOJI_MAP[assetKey] || '💎';
};

// Get a background color class for item type
export const getItemBgColor = (type: string): string => {
  switch (type) {
    case 'base': return 'from-blue-100 to-indigo-100';
    case 'hat': return 'from-yellow-100 to-amber-100';
    case 'outfit': return 'from-pink-100 to-rose-100';
    case 'pet': return 'from-green-100 to-emerald-100';
    case 'effect': return 'from-purple-100 to-violet-100';
    default: return 'from-gray-100 to-gray-200';
  }
};
