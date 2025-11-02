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
