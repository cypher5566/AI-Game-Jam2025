/**
 * API 回應類型定義
 * 定義所有後端 API 的請求和回應格式
 */

// ==================== Pokemon 上傳相關 ====================

/**
 * Pokemon 圖片上傳回應
 */
export interface PokemonUploadResponse {
  success: true;
  upload_id: string;
  message: string;
}

/**
 * Pokemon 處理狀態回應
 */
export interface PokemonProcessResponse {
  success: boolean;
  status: 'processing' | 'completed' | 'failed';
  data?: {
    front_image: string;   // Base64 圖片資料
    back_image: string;    // Base64 圖片資料
    type: string;          // AI 判定的屬性（英文）
    type_chinese: string;  // AI 判定的屬性（中文）
  };
  error?: string;
}

// ==================== 技能相關 ====================

/**
 * 技能資料（後端格式）
 */
export interface SkillData {
  id: number;
  name: string;              // 中文名
  name_en: string;           // 英文名
  type: string;              // 屬性（英文）
  power: number;             // 威力
  accuracy: number;          // 命中率
  pp: number;                // PP 值
  description: string;       // 描述（中文）
}

/**
 * 技能列表回應
 */
export interface SkillsResponse {
  success: boolean;
  data: SkillData[];
  count: number;
}

// ==================== 錯誤回應 ====================

/**
 * API 錯誤回應
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  detail?: string;
}

// ==================== 輔助類型 ====================

/**
 * API 回應包裝類型
 */
export type ApiResponse<T> = T | ApiErrorResponse;

/**
 * 上傳進度回調
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * 處理狀態回調
 */
export type ProcessStatusCallback = (status: 'processing' | 'completed' | 'failed') => void;

// ==================== Battle 戰鬥相關 ====================

/**
 * 戰鬥傷害計算請求
 */
export interface BattleDamageRequest {
  attacker_level: number;        // 攻擊方等級 (1-100)
  attacker_attack: number;       // 攻擊力值
  defender_defense: number;      // 防禦力值
  skill_power: number;           // 技能威力 (>= 0)
  skill_type: string;            // 技能屬性
  defender_type: string;         // 防禦方屬性
  is_critical?: boolean;         // 是否會心一擊（可選）
}

/**
 * 戰鬥傷害計算回應
 */
export interface BattleDamageResponse {
  damage: number;                // 計算出的傷害值
  type_effectiveness: number;    // 屬性相剋倍率
  is_critical: boolean;          // 是否會心一擊
  message: string;               // 效果訊息（如「效果絕佳！」）
}

/**
 * 屬性相剋查詢回應
 */
export interface TypeEffectivenessResponse {
  attack_type: string;           // 攻擊屬性
  defense_type: string;          // 防禦屬性
  effectiveness: number;         // 倍率值 (0, 0.25, 0.5, 1, 2, 4)
  message: string;               // 相剋說明
}
