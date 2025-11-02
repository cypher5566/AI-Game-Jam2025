import { Skill } from '../types';

// API 回應的介面定義
interface APIMoveResponse {
  success: boolean;
  count: number;
  moves: APIMove[];
}

interface APIMove {
  編號: number;
  中文名: string;
  日文名: string;
  英文名: string;
  屬性: string;
  分類: string;
  威力: number | string;
  說明: string;
  命中: number;
  PP: number;
}

// API 端點
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec';

// 屬性對照表（中文 → 英文）
const TYPE_MAP: Record<string, string> = {
  '火': 'fire',
  '水': 'water',
  '草': 'grass',
  '電': 'electric',
  '一般': 'normal',
};

/**
 * 從 API 抓取寶可夢招式
 * @param type 寶可夢屬性（中文），例如：'火'
 * @returns 12 個招式的陣列
 */
export const fetchPokemonMoves = async (type: string): Promise<Skill[]> => {
  try {
    const response = await fetch(`${API_ENDPOINT}?type1=${encodeURIComponent(type)}`);

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const data: APIMoveResponse = await response.json();

    if (!data.success) {
      throw new Error('API 回傳失敗狀態');
    }

    // 將 API 資料轉換為遊戲的 Skill 格式
    const skills: Skill[] = data.moves.map((move, index) => ({
      id: `api_move_${index}_${Date.now()}`, // 產生唯一 ID
      name: move.中文名,
      type: TYPE_MAP[move.屬性] || 'normal', // 轉換屬性為英文
      power: parsePower(move.威力), // 處理威力（可能是數字或字串）
      accuracy: move.命中,
      description: move.說明,
    }));

    return skills;
  } catch (error) {
    console.error('抓取寶可夢招式時發生錯誤:', error);
    // 如果 API 失敗，回傳預設的火屬性招式
    return getDefaultFireMoves();
  }
};

/**
 * 解析威力值（處理可能是字串或數字的情況）
 */
const parsePower = (power: number | string): number => {
  if (typeof power === 'number') {
    return power;
  }

  // 如果是字串，嘗試轉換為數字
  const parsed = parseInt(String(power), 10);

  // 如果是 "—" 或無法轉換，回傳預設值 40
  return isNaN(parsed) ? 40 : parsed;
};

/**
 * 預設的火屬性招式（當 API 失敗時使用）
 */
const getDefaultFireMoves = (): Skill[] => {
  return [
    { id: 'ember', name: '火花', type: 'fire', power: 40, accuracy: 100, description: '發射小火焰攻擊對手' },
    { id: 'flame_wheel', name: '火焰輪', type: 'fire', power: 60, accuracy: 100, description: '讓火焰覆蓋全身撞向對手' },
    { id: 'flamethrower', name: '噴射火焰', type: 'fire', power: 90, accuracy: 100, description: '向對手噴射烈焰' },
    { id: 'fire_punch', name: '火焰拳', type: 'fire', power: 75, accuracy: 100, description: '用充滿火焰的拳頭攻擊' },
    { id: 'fire_blast', name: '大字爆炎', type: 'fire', power: 110, accuracy: 85, description: '用大字形狀的火焰燒盡對手' },
    { id: 'fire_fang', name: '火焰牙', type: 'fire', power: 65, accuracy: 95, description: '用帶火焰的牙齒咬住對手' },
    { id: 'inferno', name: '煉獄', type: 'fire', power: 100, accuracy: 50, description: '用猛烈的火焰包圍對手' },
    { id: 'heat_wave', name: '熱風', type: 'fire', power: 95, accuracy: 90, description: '將熾熱的氣息吹向對手' },
    { id: 'blaze_kick', name: '火焰踢', type: 'fire', power: 85, accuracy: 90, description: '用燃燒的腳踢向對手' },
    { id: 'flame_charge', name: '蓄能焰襲', type: 'fire', power: 50, accuracy: 100, description: '讓火焰覆蓋全身撞向對手' },
    { id: 'fire_spin', name: '火焰旋渦', type: 'fire', power: 35, accuracy: 85, description: '將對手困在旋渦狀的火焰中' },
    { id: 'incinerate', name: '燒盡', type: 'fire', power: 60, accuracy: 100, description: '用火焰燒盡對手持有的樹果' },
  ];
};
