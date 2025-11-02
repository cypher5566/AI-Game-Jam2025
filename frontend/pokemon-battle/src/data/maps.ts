import { MapTile } from '../types';

// 地圖尺寸
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 15;
export const TILE_SIZE = 32;

// 磚塊類型定義
export const TILES: Record<string, MapTile> = {
  grass: {
    type: 'grass',
    walkable: true,
    encounterRate: 0.3, // 30% 遇敵機率（提高以便測試）
  },
  path: {
    type: 'path',
    walkable: true,
    encounterRate: 0,
  },
  water: {
    type: 'water',
    walkable: false,
  },
  tree: {
    type: 'tree',
    walkable: false,
  },
  building: {
    type: 'building',
    walkable: false,
  },
};

// 地圖佈局 (0=草地, 1=路徑, 2=水, 3=樹, 4=建築)
export const MAP_LAYOUT = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 2, 2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 2, 2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 2, 2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
];

// 獲取指定位置的磚塊類型
export const getTileAt = (x: number, y: number): MapTile | null => {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return null;
  }

  const tileIndex = MAP_LAYOUT[y][x];
  const tileKeys = ['grass', 'path', 'water', 'tree', 'building'];
  const tileKey = tileKeys[tileIndex];

  return TILES[tileKey] || null;
};

// 檢查位置是否可行走
export const isWalkable = (x: number, y: number): boolean => {
  const tile = getTileAt(x, y);
  return tile ? tile.walkable : false;
};

// 檢查是否觸發遇敵
export const checkEncounter = (x: number, y: number): boolean => {
  const tile = getTileAt(x, y);
  if (!tile || !tile.encounterRate) {
    return false;
  }

  return Math.random() < tile.encounterRate;
};

// 玩家初始位置（在路徑上）
export const PLAYER_START_POSITION = {
  x: 9,
  y: 6,
};
