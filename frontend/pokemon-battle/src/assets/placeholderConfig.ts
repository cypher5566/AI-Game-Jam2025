/**
 * 佔位符素材配置
 * 這個文件定義了所有遊戲素材的佔位符顏色和標籤
 * 當準備好真實素材時，可以輕鬆替換為實際圖片
 */

export interface PlaceholderConfig {
  color: string;
  label?: string;
  size: number;
}

/**
 * 角色素材佔位符
 */
export const CharacterPlaceholders = {
  player: {
    front: { color: '#FF6B6B', label: '👤', size: 32 },
    back: { color: '#FF6B6B', label: '🔙', size: 32 },
    left: { color: '#FF6B6B', label: '◀️', size: 32 },
    right: { color: '#FF6B6B', label: '▶️', size: 32 },
  },
};

/**
 * 寶可夢素材佔位符
 */
export const PokemonPlaceholders = {
  charmander: {
    front: { color: '#FFA500', label: '🔥', size: 64 },
    back: { color: '#FFA500', label: '🔥', size: 64 },
  },
  squirtle: {
    front: { color: '#4A90E2', label: '💧', size: 64 },
    back: { color: '#4A90E2', label: '💧', size: 64 },
  },
  bulbasaur: {
    front: { color: '#7CB342', label: '🌱', size: 64 },
    back: { color: '#7CB342', label: '🌱', size: 64 },
  },
};

/**
 * 地圖磚塊佔位符
 */
export const TilePlaceholders = {
  grass: { color: '#7CB342', label: '', size: 32 },
  path: { color: '#D4A373', label: '', size: 32 },
  water: { color: '#42A5F5', label: '', size: 32 },
  tree: { color: '#558B2F', label: '🌲', size: 32 },
  building: { color: '#8D6E63', label: '🏠', size: 32 },
};

/**
 * UI 元素佔位符
 */
export const UIPlaceholders = {
  logo: { color: '#FFDE00', label: 'POKE', size: 128 },
  dialogueBox: { color: '#FFFFFF', label: '', size: 64 },
  hpBarBg: { color: '#333333', label: '', size: 32 },
  hpBarFill: { color: '#4CAF50', label: '', size: 32 },
  skillButton: { color: '#E94560', label: '', size: 48 },
};

/**
 * 特效佔位符
 */
export const VFXPlaceholders = {
  fire: {
    frame1: { color: '#FF4500', label: '🔥', size: 32 },
    frame2: { color: '#FF6347', label: '🔥', size: 32 },
    frame3: { color: '#FFA500', label: '🔥', size: 32 },
  },
  water: {
    frame1: { color: '#1E90FF', label: '💧', size: 32 },
    frame2: { color: '#4169E1', label: '💧', size: 32 },
    frame3: { color: '#0000CD', label: '💧', size: 32 },
  },
  impact: {
    frame1: { color: '#FFD700', label: '💥', size: 32 },
    frame2: { color: '#FFA500', label: '💥', size: 32 },
    frame3: { color: '#FF8C00', label: '💥', size: 32 },
  },
};

/**
 * 獲取佔位符配置的輔助函數
 */
export const getPlaceholder = (
  category: 'character' | 'pokemon' | 'tile' | 'ui' | 'vfx',
  key: string,
  variant?: string
): PlaceholderConfig => {
  switch (category) {
    case 'character':
      return (CharacterPlaceholders.player as any)[variant || 'front'];
    case 'pokemon':
      return (PokemonPlaceholders as any)[key]?.[variant || 'front'] || PokemonPlaceholders.charmander.front;
    case 'tile':
      return (TilePlaceholders as any)[key] || TilePlaceholders.grass;
    case 'ui':
      return (UIPlaceholders as any)[key] || { color: '#CCCCCC', label: '', size: 32 };
    case 'vfx':
      return (VFXPlaceholders as any)[key]?.[variant || 'frame1'] || VFXPlaceholders.impact.frame1;
    default:
      return { color: '#CCCCCC', label: '?', size: 32 };
  }
};

export default {
  CharacterPlaceholders,
  PokemonPlaceholders,
  TilePlaceholders,
  UIPlaceholders,
  VFXPlaceholders,
  getPlaceholder,
};
