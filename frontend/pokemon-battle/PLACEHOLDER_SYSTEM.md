# 🎨 佔位符系統說明

## 概述

為了讓遊戲立即可玩，我們實現了一個彩色佔位符系統。所有美術素材都使用彩色方塊和 emoji 圖標作為臨時替代，可以輕鬆替換為真實的像素藝術素材。

## 架構

### 核心組件

#### `PlaceholderAsset.tsx`
彩色佔位符組件，接受以下參數：
- `width`: 寬度（像素）
- `height`: 高度（像素）
- `color`: 背景顏色
- `label`: 可選的文字標籤（通常是 emoji）
- `style`: 額外的樣式

#### `placeholderConfig.ts`
集中管理所有佔位符的配置：
- 顏色定義
- 尺寸設定
- 標籤（emoji）
- 分類組織

## 當前使用情況

### ✅ 已整合佔位符的地方

1. **寶可夢精靈** (`PokemonSprite.tsx`)
   - 小火龍：橙色 🔥
   - 傑尼龜：藍色 💧
   - 64x64 像素

2. **玩家角色** (`MapScreen.tsx`)
   - 主角：紅色 👤
   - 32x32 像素

3. **地圖磚塊** (`MapScreen.tsx`)
   - 草地：綠色 (#7CB342)
   - 道路：棕色 (#D4A373)
   - 水域：藍色 (#42A5F5)
   - 樹木：深綠色 (#558B2F)
   - 建築：棕灰色 (#8D6E63)

## 如何替換為真實素材

### 方法 1: 使用 Image 組件（推薦）

當你有真實的 PNG/JPG 圖片時：

**步驟 1**: 將圖片放入對應目錄
```
src/assets/
├── pokemon/charmander/front/idle_1.png
├── characters/player/front/idle_1.png
└── maps/tiles/grass.png
```

**步驟 2**: 更新組件使用 Image 而非 PlaceholderAsset

**之前（佔位符）**:
```tsx
<PlaceholderAsset
  width={64}
  height={64}
  color="#FFA500"
  label="🔥"
/>
```

**之後（真實素材）**:
```tsx
<Image
  source={require('./assets/pokemon/charmander/front/idle_1.png')}
  style={{ width: 64, height: 64 }}
/>
```

### 方法 2: 更新 AssetManager

修改 `src/assets/AssetManager.ts` 以使用真實圖片：

**之前**:
```typescript
export const Assets = {
  pokemon: {
    charmander: {
      front: {
        idle: null, // 佔位符
      },
    },
  },
};
```

**之後**:
```typescript
export const Assets = {
  pokemon: {
    charmander: {
      front: {
        idle: require('./pokemon/charmander/front/idle_1.png'),
      },
    },
  },
};
```

然後在組件中使用：
```tsx
<Image source={Assets.pokemon.charmander.front.idle} style={...} />
```

## 佔位符配置參考

### 寶可夢
| 名稱 | 顏色 | 標籤 | 尺寸 |
|------|------|------|------|
| 小火龍 | #FFA500 | 🔥 | 64x64 |
| 傑尼龜 | #4A90E2 | 💧 | 64x64 |
| 妙蛙種子 | #7CB342 | 🌱 | 64x64 |

### 角色
| 視角 | 顏色 | 標籤 | 尺寸 |
|------|------|------|------|
| 正面 | #FF6B6B | 👤 | 32x32 |
| 背面 | #FF6B6B | 🔙 | 32x32 |

### 地圖磚塊
| 類型 | 顏色 | 尺寸 |
|------|------|------|
| 草地 | #7CB342 | 32x32 |
| 道路 | #D4A373 | 32x32 |
| 水域 | #42A5F5 | 32x32 |
| 樹木 | #558B2F | 32x32 |

## 測試佔位符系統

1. 啟動開發服務器：
```bash
cd pokemon-battle
npm run web
```

2. 訪問：http://localhost:8082

3. 你應該看到：
   - 彩色方塊代表寶可夢
   - 紅色方塊代表玩家
   - 彩色磚塊代表地圖

## 生成真實素材

參考以下文件獲取美術素材生成指南：

1. **`QUICK_START_ASSETS.md`** - 9 個核心素材的快速生成指南
2. **`ASSET_INTEGRATION_GUIDE.md`** - 完整素材整合教程
3. **`ART_ASSETS_CHECKLIST.md`** - 所有需要的素材清單

### 推薦工具

**AI 生成**：
- ChatGPT + DALL-E（使用 `QUICK_START_ASSETS.md` 中的提示詞）
- Midjourney
- Stable Diffusion

**手動創作**：
- Piskel (https://www.piskelapp.com/) - 免費線上工具
- Aseprite - 付費專業工具
- Pixel Art Maker (https://pixelartmaker.com/)

## 優勢

✅ **立即可玩** - 無需等待美術素材即可測試遊戲
✅ **統一管理** - 所有佔位符配置集中在一個文件
✅ **易於替換** - 準備好素材後可快速切換
✅ **視覺清晰** - 使用顏色和 emoji 區分不同類型
✅ **保持一致** - 尺寸和位置與最終素材一致

## 下一步

1. ✅ 佔位符系統已完成並整合
2. ⏳ 使用 AI 工具生成真實素材
3. ⏳ 替換佔位符為真實圖片
4. ⏳ 測試所有素材顯示正確
5. ⏳ 添加動畫幀和特效

---

**現在遊戲已經完全可玩了！** 🎮

訪問 http://localhost:8082 開始測試！
