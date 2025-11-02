/**
 * Pokemon API 服務
 * 處理圖片上傳和處理狀態查詢
 */

import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUTS, UPLOAD_CONFIG } from './apiConfig';
import type {
  PokemonUploadResponse,
  PokemonProcessResponse,
  ApiErrorResponse,
} from '../types/api';

/**
 * 上傳 Pokemon 圖片
 * @param imageUri 圖片 URI（本地檔案路徑或 Blob URL）
 * @returns upload_id 或錯誤
 */
export async function uploadPokemonImage(imageUri: string): Promise<string> {
  try {
    console.log('[PokemonAPI] 開始上傳圖片:', imageUri);

    // 創建 FormData
    const formData = new FormData();

    // 判斷是否為 web 環境的 blob URL
    if (imageUri.startsWith('blob:')) {
      console.log('[PokemonAPI] 檢測到 Blob URL，轉換為 File 物件');

      // 從 blob URL 獲取實際的 blob 資料
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // 創建 File 物件
      const file = new File([blob], 'pokemon.png', { type: blob.type });
      console.log('[PokemonAPI] File 物件已創建:', file.name, file.type, file.size, 'bytes');

      formData.append('file', file);
    } else {
      // React Native 環境，使用原本的方式
      const filename = imageUri.split('/').pop() || 'pokemon.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

    console.log('[PokemonAPI] 發送上傳請求到:', `${API_BASE_URL}${API_ENDPOINTS.POKEMON_UPLOAD}`);

    // 發送請求
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POKEMON_UPLOAD}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[PokemonAPI] 回應狀態:', response.status, response.statusText);

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error || `上傳失敗: ${response.status}`);
    }

    const data: PokemonUploadResponse = await response.json();
    console.log('[PokemonAPI] 上傳成功:', data.upload_id);

    return data.upload_id;
  } catch (error) {
    console.error('[PokemonAPI] 上傳失敗:', error);
    throw error;
  }
}

/**
 * 查詢處理狀態
 * @param uploadId 上傳 ID
 * @returns 處理狀態和結果
 */
export async function checkProcessStatus(uploadId: string): Promise<PokemonProcessResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.POKEMON_PROCESS}/${uploadId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error || `查詢失敗: ${response.status}`);
    }

    const data: PokemonProcessResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[PokemonAPI] 查詢處理狀態失敗:', error);
    throw error;
  }
}

/**
 * 輪詢處理狀態直到完成
 * @param uploadId 上傳 ID
 * @param onProgress 進度回調（可選）
 * @returns 最終處理結果
 */
export async function pollProcessStatus(
  uploadId: string,
  onProgress?: (status: string, attempt: number) => void
): Promise<PokemonProcessResponse> {
  let attempts = 0;
  const maxAttempts = UPLOAD_CONFIG.MAX_POLLING_ATTEMPTS;
  const interval = API_TIMEOUTS.POLLING;

  console.log(`[PokemonAPI] 開始輪詢處理狀態 (最多 ${maxAttempts} 次)`);

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const result = await checkProcessStatus(uploadId);

      // 回調進度
      if (onProgress) {
        onProgress(result.status, attempts);
      }

      // 處理完成
      if (result.status === 'completed') {
        console.log('[PokemonAPI] 處理完成!');
        return result;
      }

      // 處理失敗
      if (result.status === 'failed') {
        throw new Error(result.error || '圖片處理失敗');
      }

      // 仍在處理中，等待後繼續
      console.log(`[PokemonAPI] 處理中... (${attempts}/${maxAttempts})`);
      await delay(interval);

    } catch (error) {
      console.error(`[PokemonAPI] 第 ${attempts} 次查詢失敗:`, error);

      // 如果還有重試機會，繼續；否則拋出錯誤
      if (attempts >= maxAttempts) {
        throw error;
      }

      await delay(interval);
    }
  }

  // 超時
  throw new Error(`處理超時（已等待 ${maxAttempts * interval / 1000} 秒）`);
}

/**
 * 延遲函數
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 驗證圖片檔案
 * @param uri 圖片 URI
 * @param size 檔案大小（bytes）
 * @param mimeType MIME 類型（web 環境使用）
 * @returns 是否有效
 */
export function validateImageFile(
  uri: string,
  size?: number,
  mimeType?: string
): { valid: boolean; error?: string } {
  // 檢查檔案大小
  if (size && size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `檔案過大（最大 ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB）`,
    };
  }

  // 優先使用 mimeType 驗證（web 環境）
  if (mimeType) {
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `不支援的檔案格式（僅支援 JPEG, PNG, WebP）`,
      };
    }
    return { valid: true };
  }

  // 否則從副檔名判斷（原生環境）
  const extension = uri.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `不支援的檔案格式（僅支援 jpg, jpeg, png, webp）`,
    };
  }

  return { valid: true };
}
