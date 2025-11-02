# 前端 API 整合指南

**GenPoke 圖片上傳與 AI 生成功能**

---

## 📋 目錄
- [快速開始](#快速開始)
- [API 端點](#api-端點)
- [前端範例代碼](#前端範例代碼)
- [錯誤處理](#錯誤處理)
- [最佳實踐](#最佳實踐)

---

## 🚀 快速開始

### API Base URL
```
開發環境: http://localhost:8000
生產環境: https://your-backend-url.com
```

### 完整流程

```
1. 用戶選擇/拍攝圖片
   ↓
2. 上傳圖片 (POST /api/v1/pokemon/upload)
   ↓
3. 獲得 upload_id
   ↓
4. 輪詢處理狀態 (GET /api/v1/pokemon/process/{upload_id})
   ↓
5. 獲得生成的寶可夢（正面/背面/屬性）
```

---

## 📡 API 端點

### 1. 上傳圖片

**端點**: `POST /api/v1/pokemon/upload`
**Content-Type**: `multipart/form-data`

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| file | File | ✅ | 圖片檔案 (jpg/png/webp, max 10MB) |

**成功響應** (200):
```json
{
  "success": true,
  "upload_id": "5856a812-fcab-433c-8f1c-67b2a060daa5",
  "message": "圖片上傳成功，正在處理..."
}
```

**錯誤響應** (400):
```json
{
  "detail": "不支援的檔案格式。允許的格式: .jpg, .jpeg, .png, .webp"
}
```

**錯誤響應** (400):
```json
{
  "detail": "檔案過大。最大允許 10.0MB"
}
```

---

### 2. 查詢處理狀態

**端點**: `GET /api/v1/pokemon/process/{upload_id}`

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| upload_id | string | ✅ | 上傳時返回的 ID |

**響應 - 處理中** (200):
```json
{
  "success": true,
  "status": "processing",
  "message": "正在處理中，請稍候..."
}
```

**響應 - 處理完成** (200):
```json
{
  "success": true,
  "status": "completed",
  "data": {
    "front_image": "data:image/png;base64,iVBORw0KGgo...",
    "back_image": "data:image/png;base64,iVBORw0KGgo...",
    "type": "fire",
    "type_chinese": "火"
  }
}
```

**響應 - 處理失敗** (200):
```json
{
  "success": false,
  "status": "failed",
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "處理失敗原因"
  }
}
```

**錯誤響應** (404):
```json
{
  "detail": "找不到此上傳記錄"
}
```

---

### 3. 18 種寶可夢屬性

| 英文 | 中文 | 顏色提示 |
|------|------|----------|
| normal | 一般 | 灰色 |
| fire | 火 | 紅色/橙色 |
| water | 水 | 藍色 |
| electric | 電 | 黃色 |
| grass | 草 | 綠色 |
| ice | 冰 | 淺藍色 |
| fighting | 格鬥 | 棕色 |
| poison | 毒 | 紫色 |
| ground | 地面 | 土黃色 |
| flying | 飛行 | 天藍色 |
| psychic | 超能力 | 粉色 |
| bug | 蟲 | 綠黃色 |
| rock | 岩石 | 灰褐色 |
| ghost | 幽靈 | 深紫色 |
| dragon | 龍 | 深藍紫 |
| dark | 惡 | 黑色 |
| steel | 鋼 | 銀灰色 |
| fairy | 妖精 | 粉紅色 |

---

## 💻 前端範例代碼

### React Native / Expo 範例

```typescript
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

const BASE_URL = 'http://localhost:8000/api/v1';

interface PokemonData {
  front_image: string;  // base64 data URI
  back_image: string;   // base64 data URI
  type: string;         // 英文屬性
  type_chinese: string; // 中文屬性
}

interface UploadResult {
  data?: PokemonData;
  error?: string;
}

export function usePokemonUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const uploadAndGenerate = async (imageUri: string): Promise<UploadResult> => {
    setUploading(true);
    setProgress('上傳圖片中...');

    try {
      // 步驟 1: 上傳圖片
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'pokemon.jpg',
      } as any);

      const uploadResponse = await fetch(`${BASE_URL}/pokemon/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('上傳失敗');
      }

      const { upload_id } = await uploadResponse.json();
      setProgress('AI 處理中...');

      // 步驟 2: 輪詢處理狀態
      const result = await pollProcessingStatus(upload_id);
      setUploading(false);
      return { data: result };

    } catch (error) {
      setUploading(false);
      return { error: error.message };
    }
  };

  const pollProcessingStatus = async (
    uploadId: string,
    maxAttempts: number = 30
  ): Promise<PokemonData> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;
        setProgress(`處理中... (${attempts}/${maxAttempts})`);

        try {
          const response = await fetch(
            `${BASE_URL}/pokemon/process/${uploadId}`
          );
          const data = await response.json();

          if (data.status === 'completed') {
            clearInterval(interval);
            setProgress('完成！');
            resolve(data.data);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            reject(new Error(data.error?.message || '處理失敗'));
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('處理超時，請重試'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000); // 每 2 秒輪詢一次
    });
  };

  return { uploadAndGenerate, uploading, progress };
}
```

---

### 使用範例

```typescript
import { Image, Button, View, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePokemonUpload } from './usePokemonUpload';

export function PokemonCreationScreen() {
  const { uploadAndGenerate, uploading, progress } = usePokemonUpload();
  const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);

  const handlePickImage = async () => {
    // 選擇圖片
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // 上傳並生成
      const uploadResult = await uploadAndGenerate(result.assets[0].uri);

      if (uploadResult.data) {
        setPokemonData(uploadResult.data);
      } else {
        alert(`錯誤: ${uploadResult.error}`);
      }
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="選擇圖片" onPress={handlePickImage} disabled={uploading} />

      {uploading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" />
          <Text>{progress}</Text>
        </View>
      )}

      {pokemonData && (
        <View style={{ marginTop: 20 }}>
          <Text>屬性: {pokemonData.type_chinese}</Text>

          {/* 正面圖 */}
          <Image
            source={{ uri: pokemonData.front_image }}
            style={{ width: 128, height: 128 }}
          />

          {/* 背面圖 */}
          <Image
            source={{ uri: pokemonData.back_image }}
            style={{ width: 128, height: 128 }}
          />
        </View>
      )}
    </View>
  );
}
```

---

## ⚠️ 錯誤處理

### 常見錯誤代碼

| HTTP 狀態碼 | 原因 | 解決方案 |
|-------------|------|----------|
| 400 | 檔案格式不支援 | 只允許 jpg, png, webp |
| 400 | 檔案過大 | 限制 10MB 以內 |
| 404 | upload_id 不存在 | 檢查 ID 是否正確 |
| 500 | 服務器錯誤 | 稍後重試或聯繫管理員 |

### 處理超時

```typescript
const pollWithTimeout = async (uploadId: string) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('處理超時')), 60000) // 60 秒
  );

  const poll = pollProcessingStatus(uploadId);

  return Promise.race([poll, timeout]);
};
```

---

## 🎯 最佳實踐

### 1. 圖片優化

```typescript
// 壓縮圖片（使用 expo-image-manipulator）
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }], // 調整大小
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipResult.uri;
};
```

### 2. 進度提示

```typescript
const progressMessages = [
  '上傳圖片中...',
  '像素化處理...',
  'AI 分析屬性...',
  'AI 生成背面圖...',
  '即將完成...',
];

// 在輪詢時顯示不同階段的訊息
```

### 3. 快取機制

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const cachePokemon = async (uploadId: string, data: PokemonData) => {
  await AsyncStorage.setItem(`pokemon_${uploadId}`, JSON.stringify(data));
};

const getCachedPokemon = async (uploadId: string) => {
  const cached = await AsyncStorage.getItem(`pokemon_${uploadId}`);
  return cached ? JSON.parse(cached) : null;
};
```

### 4. 用戶體驗優化

- ✅ 顯示進度條
- ✅ 允許取消上傳
- ✅ 提供重試機制
- ✅ 顯示預覽圖
- ✅ 說明處理時間（約 3-5 秒）

---

## 📊 性能指標

| 操作 | 平均時間 | 備註 |
|------|---------|------|
| 圖片上傳 | < 1 秒 | 取決於網路速度 |
| AI 處理 | 2-4 秒 | 包含屬性判斷與圖片生成 |
| 總計 | **3-5 秒** | 完整流程 |

**建議**:
- 輪詢間隔: 2 秒
- 超時時間: 60 秒
- 最大重試次數: 3 次

---

## 🔒 安全建議

1. **檔案驗證**
   - 前端驗證檔案大小（< 10MB）
   - 檢查檔案類型（image/jpeg, image/png）

2. **錯誤訊息**
   - 不要顯示技術錯誤細節給用戶
   - 提供友善的錯誤訊息

3. **Rate Limiting**
   - 限制用戶上傳頻率（建議: 每分鐘最多 5 次）

---

## 🧪 測試

### 測試用例

```typescript
describe('Pokemon Upload', () => {
  it('should upload and generate pokemon', async () => {
    const result = await uploadAndGenerate(mockImageUri);
    expect(result.data).toBeDefined();
    expect(result.data.type).toBeOneOf(POKEMON_TYPES);
  });

  it('should handle upload failure', async () => {
    const result = await uploadAndGenerate(invalidUri);
    expect(result.error).toBeDefined();
  });

  it('should timeout after 60s', async () => {
    // Mock slow response
    await expect(pollWithTimeout(uploadId)).rejects.toThrow('處理超時');
  });
});
```

---

## 📞 需要幫助？

- **後端文檔**: 查看 `ARCHITECTURE.md`
- **測試報告**: 查看 `GEMINI_TEST_REPORT.md`
- **API 文檔**: http://localhost:8000/docs (Swagger UI)

---

**最後更新**: 2025-11-02
**版本**: 1.0.0
