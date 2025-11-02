# 🎮 寶可夢對戰原型

一個使用 React Native + Web 開發的寶可夢風格對戰遊戲原型。

## ✨ 功能特色

- 🎬 **開始遊戲畫面** - 帶有動畫效果的標題畫面
- 💬 **前情提要對話** - 打字機效果的劇情對話系統
- 🗺️ **地圖探索** - 使用鍵盤控制角色在地圖上移動
- ⚔️ **回合制對戰** - 完整的寶可夢對戰系統，包含動畫和特效

## 🎯 遊戲規格

- **寶可夢數量**: 2隻（小火龍、傑尼龜）
- **對戰系統**: 簡化回合制，每隻寶可夢4個技能
- **地圖**: 單一地圖場景
- **控制**: 鍵盤控制（WASD/方向鍵）

## 🛠️ 技術棧

- **框架**: React Native + Expo
- **Web 支持**: React Native Web
- **狀態管理**: React Context API + useReducer
- **動畫**: React Native Animated API
- **語言**: TypeScript
- **部署**: Web 平台（Vercel/Netlify）

## 📦 安裝與運行

### 前置需求

- Node.js >= 18.x
- npm >= 9.x

### 安裝依賴

```bash
npm install
```

### 運行開發環境

#### Web 版本（推薦）

```bash
npm run web
```

在瀏覽器中打開 http://localhost:8081

#### Android 版本

```bash
npm run android
```

#### iOS 版本（需要 macOS）

```bash
npm run ios
```

### 構建生產版本

#### Web 生產構建

```bash
npx expo export:web
```

構建完成後，靜態文件會生成在 `web-build` 目錄中。

## 📁 專案結構

```
pokemon-battle/
├── src/
│   ├── screens/          # 四個主要場景
│   │   ├── StartScreen.tsx
│   │   ├── DialogueScreen.tsx
│   │   ├── MapScreen.tsx
│   │   └── BattleScreen.tsx
│   ├── components/       # 可重用組件
│   │   ├── HPBar.tsx
│   │   └── PokemonSprite.tsx
│   ├── contexts/         # 全局狀態管理
│   │   └── GameContext.tsx
│   ├── hooks/            # 自定義 Hooks
│   │   └── useKeyboard.ts
│   ├── data/             # 遊戲數據
│   │   ├── pokemon.ts
│   │   ├── dialogues.ts
│   │   └── maps.ts
│   ├── types/            # TypeScript 類型定義
│   │   └── index.ts
│   └── assets/           # 美術素材（待添加）
├── App.tsx               # 應用入口
├── package.json
├── tsconfig.json
├── BATTLE_API_SPEC.md    # API 接口規範文檔
└── ART_ASSETS_CHECKLIST.md  # 美術素材清單
```

## 🎮 遊戲操作

### 開始畫面
- 點擊 "開始遊戲" 按鈕開始

### 對話系統
- 點擊螢幕或按任意鍵繼續對話

### 地圖探索
- **W / ↑** - 向上移動
- **S / ↓** - 向下移動
- **A / ←** - 向左移動
- **D / →** - 向右移動
- 在草地中行走有機會遇到野生寶可夢

### 對戰系統
- 點擊技能按鈕使用技能
- 擊敗對手獲得勝利
- HP 歸零則戰敗

## 🔌 API 接口

遊戲的傷害計算將由外部 Server 處理。詳細的 API 規範請參考：

📄 **[BATTLE_API_SPEC.md](./BATTLE_API_SPEC.md)**

主要端點：
- `POST /api/v1/battle/calculate-damage` - 計算傷害
- `GET /api/v1/pokemon/:id` - 獲取寶可夢數據
- `POST /api/v1/battle/use-skill` - 使用技能

## 🎨 美術素材

完整的美術素材需求清單請參考：

📄 **[ART_ASSETS_CHECKLIST.md](./ART_ASSETS_CHECKLIST.md)**

使用 PixelLab MCP 創作像素風格的美術素材。

素材統計：
- 角色素材：12 張
- 寶可夢素材：20 張
- 地圖磚塊：12 張
- UI 素材：15 張
- 特效素材：20 張
- 背景素材：2 張
- **總計：84 張**

## 🚀 部署到網路

### 使用 Vercel 部署

1. 安裝 Vercel CLI

```bash
npm install -g vercel
```

2. 構建 Web 版本

```bash
npx expo export:web
```

3. 部署

```bash
cd web-build
vercel
```

### 使用 Netlify 部署

1. 構建 Web 版本

```bash
npx expo export:web
```

2. 使用 Netlify CLI 或拖放 `web-build` 資料夾到 Netlify

```bash
npm install -g netlify-cli
cd web-build
netlify deploy --prod
```

### 使用 GitHub Pages 部署

1. 在 `package.json` 添加 homepage 欄位：

```json
{
  "homepage": "https://yourusername.github.io/pokemon-battle"
}
```

2. 構建並部署

```bash
npx expo export:web
# 將 web-build 目錄推送到 gh-pages 分支
```

## 🔧 開發建議

### 整合真實 API

1. 創建 `src/services/battleAPI.ts` 文件
2. 配置環境變數 `REACT_APP_API_BASE_URL`
3. 在 `BattleScreen.tsx` 中替換傷害計算邏輯

示例：

```typescript
import { battleAPI } from '../services/battleAPI';

const useSkill = async (skill: Skill) => {
  const result = await battleAPI.calculateDamage({
    attackerId: playerPokemon.id,
    defenderId: enemyPokemon.id,
    skillId: skill.id,
    // ...
  });

  const { damage } = result.data;
  // 處理傷害...
};
```

### 添加更多功能

- [ ] 更多寶可夢種類
- [ ] 道具系統
- [ ] 寶可夢進化
- [ ] 多個地圖場景
- [ ] 存檔功能
- [ ] 音效和背景音樂
- [ ] 觸控螢幕虛擬搖桿

## 🐛 已知問題

- 目前使用 emoji 作為臨時圖形，需要替換為真實的像素藝術素材
- 傷害計算是簡化版本，需要連接真實的 API
- 地圖目前只有一個場景

## 📝 更新日誌

### v1.0.0 (2025-01-31)

- ✅ 完成基礎專案架構
- ✅ 實現四個主要場景
- ✅ 完成對戰系統
- ✅ 添加動畫和特效
- ✅ 撰寫 API 文檔
- ✅ 完成美術素材清單

## 📄 授權

MIT License

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

## 📧 聯絡方式

如有任何問題，請開啟 Issue。

---

**開發狀態**: 🚧 原型開發完成，等待美術素材整合

**遊戲進度**: 核心玩法 ✅ | 美術素材 ⏳ | API 整合 ⏳
