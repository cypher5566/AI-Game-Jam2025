# 🚀 快速開始 - 美術素材生成

## 🎯 最簡單的方法

### 方法 1: 使用 ChatGPT + DALL-E（推薦）

如果你有 ChatGPT Plus 訂閱，這是最快的方式：

**步驟**:
1. 打開 ChatGPT
2. 使用以下提示詞（一次一個）:

```
Generate a 32x32 pixel art sprite of a Pokemon trainer character
wearing a red cap and blue vest, front view standing pose,
transparent background, simple cute style, 16-bit retro game style
```

3. 生成後，點擊圖片 → 下載
4. 重命名為 `player_front_1.png`
5. 放入 `src/assets/characters/player/front/`

**對於每個素材**，參考 `ASSET_INTEGRATION_GUIDE.md` 中的提示詞

---

### 方法 2: 使用線上像素藝術工具（免費）

推薦工具：
- **Piskel**: https://www.piskelapp.com/
- **Pixel Art Maker**: https://pixelartmaker.com/
- **Aseprite**（付費，功能強大）

**簡單創建步驟**:
1. 創建 32x32 或 64x64 畫布
2. 繪製簡單的角色/物件
3. 導出為 PNG（透明背景）
4. 放入對應目錄

---

### 方法 3: 使用簡單的佔位符（立即可玩）

我可以為你創建一個使用純色方塊的臨時版本，讓遊戲立即可以運行。

選項：
- A. **我現在就想測試遊戲** → 使用純色佔位符
- B. **我要生成真實美術** → 使用 AI 工具生成

---

## 📝 Phase 1 核心素材清單（9張必須）

### ✅ 最小可運行版本

| # | 文件名 | 尺寸 | 描述 | 狀態 |
|---|--------|------|------|------|
| 1 | `player_front_1.png` | 32x32 | 主角正面 | ⏳ |
| 2 | `player_back_1.png` | 32x32 | 主角背面 | ⏳ |
| 3 | `charmander_front_idle.png` | 64x64 | 小火龍正面 | ⏳ |
| 4 | `charmander_back_idle.png` | 64x64 | 小火龍背面 | ⏳ |
| 5 | `squirtle_front_idle.png` | 64x64 | 傑尼龜正面 | ⏳ |
| 6 | `squirtle_back_idle.png` | 64x64 | 傑尼龜背面 | ⏳ |
| 7 | `tile_grass.png` | 32x32 | 草地磚塊 | ⏳ |
| 8 | `tile_path.png` | 32x32 | 道路磚塊 | ⏳ |
| 9 | `tile_tree.png` | 32x32 | 樹木磚塊 | ⏳ |

**有這 9 張圖，遊戲就能完整運行！**

---

## 🎨 ChatGPT 提示詞快速複製

### 1. 主角正面
```
Create a 32x32 pixel art sprite: Pokemon trainer with red cap, blue vest,
front view, standing pose, transparent background, retro game style
```

### 2. 主角背面
```
Create a 32x32 pixel art sprite: Pokemon trainer with red cap, blue vest,
back view, standing pose, transparent background, retro game style
```

### 3. 小火龍正面
```
Create a 64x64 pixel art: Charmander-like orange lizard Pokemon with flame tail,
front view, idle pose, cute, transparent background, Game Boy style
```

### 4. 小火龍背面
```
Create a 64x64 pixel art: Charmander-like orange lizard Pokemon with flame tail,
back view, idle pose, cute, transparent background, Game Boy style
```

### 5. 傑尼龜正面
```
Create a 64x64 pixel art: Squirtle-like blue turtle Pokemon with brown shell,
front view, idle pose, cute, transparent background, Game Boy style
```

### 6. 傑尼龜背面
```
Create a 64x64 pixel art: Squirtle-like blue turtle Pokemon with brown shell,
back view, idle pose, cute, transparent background, Game Boy style
```

### 7. 草地磚塊
```
Create a 32x32 pixel art tile: grass terrain for top-down RPG,
green grass texture, seamless tileable, transparent background
```

### 8. 道路磚塊
```
Create a 32x32 pixel art tile: dirt path for top-down RPG,
brown dirt texture, seamless tileable, transparent background
```

### 9. 樹木磚塊
```
Create a 32x32 pixel art tile: tree obstacle for top-down RPG,
dark green tree with trunk, transparent background
```

---

## 💡 提示

### 如果 AI 生成的圖片尺寸不對：

使用線上調整工具：
- https://www.iloveimg.com/resize-image
- 選擇 "精確尺寸"
- 輸入 32x32 或 64x64
- 保持透明背景

### 如果沒有透明背景：

使用去背工具：
- https://www.remove.bg/
- 或使用圖像編輯器（GIMP, Photoshop）

---

## 🔄 完成素材後的下一步

1. 將所有 PNG 文件放入對應目錄
2. 運行集成腳本
3. 重新啟動遊戲
4. 查看真實的美術素材！

---

## ❓ 需要幫助？

**選擇一個選項告訴我**：

**A. 我想立即使用純色佔位符測試**
- 我會創建一個臨時版本，用簡單的彩色方塊代替圖片
- 遊戲可以立即運行

**B. 我會自己生成 AI 圖片**
- 使用上面的提示詞
- 生成後放入對應目錄
- 告訴我完成後我幫你集成

**C. 我需要更詳細的步驟指導**
- 我會提供一步一步的詳細教學

---

**你想要哪個方案？** 告訴我 A、B 或 C！
