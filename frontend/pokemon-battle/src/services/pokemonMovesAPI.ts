import { Skill } from '../types';
import { API_BASE_URL, API_ENDPOINTS, TYPE_ZH_TO_EN, TYPE_EN_TO_ZH } from './apiConfig';
import type { SkillsResponse, SkillData } from '../types/api';

// Google Sheets API 回應的介面定義（作為 Fallback）
interface GoogleSheetsAPIMoveResponse {
  success: boolean;
  count: number;
  moves: GoogleSheetsAPIMove[];
}

interface GoogleSheetsAPIMove {
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

// Google Sheets API 端點（Fallback）
const GOOGLE_SHEETS_API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec';

/**
 * 從後端 API 抓取寶可夢招式
 * @param type 寶可夢屬性（中文），例如：'火'
 * @returns 12 個招式的陣列
 */
export const fetchPokemonMoves = async (type: string): Promise<Skill[]> => {
  try {
    console.log('[SkillsAPI] 開始獲取技能，屬性:', type);

    // 先嘗試使用後端 API
    try {
      const skills = await fetchFromBackendAPI(type);
      console.log('[SkillsAPI] 後端 API 成功，獲得', skills.length, '個技能');
      return skills;
    } catch (backendError) {
      console.warn('[SkillsAPI] 後端 API 失敗，嘗試 Fallback:', backendError);

      // 如果後端失敗，使用 Google Sheets API
      try {
        const skills = await fetchFromGoogleSheets(type);
        console.log('[SkillsAPI] Google Sheets Fallback 成功');
        return skills;
      } catch (googleError) {
        console.warn('[SkillsAPI] Google Sheets 失敗，使用預設技能:', googleError);

        // 最後的 Fallback：使用預設技能
        return getDefaultFireMoves();
      }
    }
  } catch (error) {
    console.error('[SkillsAPI] 所有方法失敗，使用預設技能:', error);
    return getDefaultFireMoves();
  }
};

/**
 * 從後端 API 獲取技能
 */
async function fetchFromBackendAPI(typeZh: string): Promise<Skill[]> {
  // 將中文屬性轉換為英文
  const typeEn = TYPE_ZH_TO_EN[typeZh];
  if (!typeEn) {
    throw new Error(`不支援的屬性: ${typeZh}`);
  }

  const url = `${API_BASE_URL}${API_ENDPOINTS.SKILLS}?type=${encodeURIComponent(typeZh)}&count=12`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`後端 API 請求失敗: ${response.status}`);
  }

  const data: SkillsResponse = await response.json();

  if (!data.success) {
    throw new Error('後端 API 回傳失敗狀態');
  }

  // 將後端格式轉換為遊戲的 Skill 格式
  const skills: Skill[] = data.data.map((skillData) => transformSkillData(skillData));

  return skills;
}

/**
 * 將後端技能資料轉換為遊戲格式
 */
function transformSkillData(skillData: SkillData): Skill {
  return {
    id: String(skillData.id),
    name: skillData.name,  // 已經是中文名
    type: skillData.type as any,  // 英文屬性
    power: skillData.power,
    accuracy: skillData.accuracy,
    description: skillData.description,  // 已經是中文描述
  };
}

/**
 * 從 Google Sheets API 獲取技能（Fallback）
 */
async function fetchFromGoogleSheets(type: string): Promise<Skill[]> {
  const response = await fetch(`${GOOGLE_SHEETS_API_ENDPOINT}?type1=${encodeURIComponent(type)}`);

  if (!response.ok) {
    throw new Error(`Google Sheets API 請求失敗: ${response.status}`);
  }

  const data: GoogleSheetsAPIMoveResponse = await response.json();

  if (!data.success) {
    throw new Error('Google Sheets API 回傳失敗狀態');
  }

  // 將 API 資料轉換為遊戲的 Skill 格式
  const skills: Skill[] = data.moves.map((move, index) => ({
    id: `gs_move_${index}_${Date.now()}`,
    name: move.中文名,
    type: (TYPE_ZH_TO_EN[move.屬性] || 'normal') as any,
    power: parsePower(move.威力),
    accuracy: move.命中,
    description: move.說明,
  }));

  return skills;
}

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
