/**
 * API 配置檔案
 * 定義後端 API 的基本配置和常數
 */

// API 基礎 URL
export const API_BASE_URL = 'https://genpoke-production.up.railway.app';

// API 端點
export const API_ENDPOINTS = {
  // Pokemon 相關
  POKEMON_UPLOAD: '/api/v1/pokemon/upload',
  POKEMON_PROCESS: '/api/v1/pokemon/process',

  // 技能相關
  SKILLS: '/api/v1/skills',
  SKILLS_TYPES: '/api/v1/skills/types',

  // 戰鬥相關
  BATTLE_DAMAGE: '/api/v1/battle/calculate-damage',
  BATTLE_TYPE_EFFECTIVENESS: '/api/v1/battle/type-effectiveness',
  BATTLE_TYPE_CHART: '/api/v1/battle/type-chart',
  BATTLE_TYPES: '/api/v1/battle/types',
} as const;

// 超時設定（毫秒）
export const API_TIMEOUTS = {
  UPLOAD: 30000,      // 圖片上傳 30 秒
  DEFAULT: 10000,     // 一般請求 10 秒
  POLLING: 2000,      // 輪詢間隔 2 秒
} as const;

// 圖片上傳設定
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_POLLING_ATTEMPTS: 30,          // 最多輪詢 30 次（60 秒）
} as const;

// 屬性中英文對照表
export const TYPE_MAP: Record<string, string> = {
  fire: '火',
  water: '水',
  grass: '草',
  electric: '電',
  normal: '一般',
  fighting: '格鬥',
  flying: '飛行',
  poison: '毒',
  ground: '地面',
  rock: '岩石',
  bug: '蟲',
  ghost: '幽靈',
  steel: '鋼',
  psychic: '超能力',
  ice: '冰',
  dragon: '龍',
  dark: '惡',
  fairy: '妖精',
};

// 英文轉中文
export const TYPE_EN_TO_ZH: Record<string, string> = TYPE_MAP;

// 中文轉英文
export const TYPE_ZH_TO_EN: Record<string, string> = Object.entries(TYPE_MAP).reduce(
  (acc, [en, zh]) => ({ ...acc, [zh]: en }),
  {}
);
