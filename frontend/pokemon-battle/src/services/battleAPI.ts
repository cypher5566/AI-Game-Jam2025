import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUTS } from './apiConfig';
import type {
  BattleDamageRequest,
  BattleDamageResponse,
  TypeEffectivenessResponse
} from '../types/api';

/**
 * 計算戰鬥傷害
 * 調用 Battle API 進行精確的傷害計算
 */
export async function calculateDamage(
  request: BattleDamageRequest
): Promise<BattleDamageResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BATTLE_DAMAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(API_TIMEOUTS.DEFAULT),
    });

    if (!response.ok) {
      throw new Error(`API 回應錯誤: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Battle API 傷害計算失敗:', error);
    // 回退到本地計算
    return calculateDamageFallback(request);
  }
}

/**
 * 查詢屬性相剋倍率
 */
export async function getTypeEffectiveness(
  attackType: string,
  defenseType: string
): Promise<TypeEffectivenessResponse> {
  try {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.BATTLE_TYPE_EFFECTIVENESS}`);
    url.searchParams.append('attack_type', attackType);
    url.searchParams.append('defense_type', defenseType);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(API_TIMEOUTS.DEFAULT),
    });

    if (!response.ok) {
      throw new Error(`API 回應錯誤: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('屬性相剋查詢失敗:', error);
    throw error;
  }
}

/**
 * 本地傷害計算（Fallback）
 * 當 API 失敗時使用
 */
function calculateDamageFallback(request: BattleDamageRequest): BattleDamageResponse {
  const {
    attacker_level,
    attacker_attack,
    defender_defense,
    skill_power,
    is_critical = false,
  } = request;

  // 簡化的寶可夢傷害公式
  const baseDamage =
    ((2 * attacker_level / 5 + 2) * skill_power * attacker_attack / defender_defense / 50) + 2;

  const criticalMultiplier = is_critical ? 1.5 : 1;
  const randomFactor = 0.85 + Math.random() * 0.15; // 0.85 ~ 1.0

  const finalDamage = Math.floor(baseDamage * criticalMultiplier * randomFactor);

  return {
    damage: Math.max(1, finalDamage),
    type_effectiveness: 1, // 本地計算不考慮屬性
    is_critical,
    message: is_critical ? '會心一擊！' : '造成傷害',
  };
}

/**
 * 批次計算多個攻擊的傷害
 * 用於優化網路請求
 */
export async function calculateBatchDamage(
  requests: BattleDamageRequest[]
): Promise<BattleDamageResponse[]> {
  // 目前 API 不支援批次，所以逐一調用
  return Promise.all(requests.map(req => calculateDamage(req)));
}
