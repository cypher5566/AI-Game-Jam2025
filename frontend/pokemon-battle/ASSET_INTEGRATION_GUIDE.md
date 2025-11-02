# 🎨 美術素材整合指南

## 📋 使用 PixelLab MCP 生成素材

### Step 1: 準備 PixelLab MCP 提示詞

根據 `ART_ASSETS_CHECKLIST.md`，我們需要生成以下素材。使用下面的提示詞模板：

---

### 🎮 Phase 1: 核心素材（優先）

#### 1. 主角角色 - 正面行走動畫

**提示詞**:
```
Create a pixel art character sprite, 32x32 pixels,
Pokemon trainer style character wearing red cap and blue vest,
front view walking animation frame 1 (standing pose),
transparent background, 16-color palette,
cute and simple style
```

**生成後保存為**: `player_front_1.png`

**重複生成**（修改 frame 編號）:
- `player_front_2.png` - frame 2 (left foot forward)
- `player_front_3.png` - frame 3 (right foot forward)

---

#### 2. 主角角色 - 背面行走動畫

**提示詞**:
```
Create a pixel art character sprite, 32x32 pixels,
Pokemon trainer style character wearing red cap and blue vest,
back view walking animation frame 1 (standing pose),
transparent background, 16-color palette,
cute and simple style
```

**生成後保存為**: `player_back_1.png`

**重複生成**:
- `player_back_2.png` - frame 2
- `player_back_3.png` - frame 3

---

#### 3. 小火龍 - 正面

**提示詞**:
```
Create a pixel art Pokemon character, 64x64 pixels,
Charmander style - orange lizard with flame on tail,
front view idle pose, cute expression,
transparent background, vibrant colors,
Pokemon battle sprite style
```

**生成後保存為**: `charmander_front_idle.png`

**攻擊動畫提示詞**:
```
Create a pixel art Pokemon character, 64x64 pixels,
Charmander style - orange lizard with flame on tail,
front view attacking pose, flame breathing animation,
transparent background, vibrant colors,
Pokemon battle sprite style
```

**生成後保存為**: `charmander_front_attack.png`

---

#### 4. 小火龍 - 背面

**提示詞**:
```
Create a pixel art Pokemon character, 64x64 pixels,
Charmander style - orange lizard with flame on tail,
back view idle pose,
transparent background, vibrant colors,
Pokemon battle sprite style
```

**生成後保存為**: `charmander_back_idle.png`, `charmander_back_attack.png`

---

#### 5. 傑尼龜 - 正面和背面

**提示詞**:
```
Create a pixel art Pokemon character, 64x64 pixels,
Squirtle style - blue turtle with brown shell,
front view idle pose, cute expression,
transparent background, vibrant colors,
Pokemon battle sprite style
```

**生成後保存為**: `squirtle_front_idle.png`, `squirtle_front_attack.png`, `squirtle_back_idle.png`, `squirtle_back_attack.png`

---

#### 6. 地圖磚塊

**草地磚塊**:
```
Create a pixel art tile, 32x32 pixels,
grass terrain tile for top-down RPG map,
green grass with subtle texture,
seamless tileable, transparent background,
vibrant colors
```

**生成後保存為**: `tile_grass.png`

**道路磚塊**:
```
Create a pixel art tile, 32x32 pixels,
path/road terrain tile for top-down RPG map,
brown dirt path,
seamless tileable, transparent background
```

**生成後保存為**: `tile_path.png`

**樹木磚塊**:
```
Create a pixel art tile, 32x32 pixels,
tree obstacle tile for top-down RPG map,
dark green tree with trunk,
transparent background
```

**生成後保存為**: `tile_tree.png`

---

## 📁 素材目錄結構

生成素材後，按照以下結構放置：

```
pokemon-battle/src/assets/
├── characters/
│   └── player/
│       ├── front/
│       │   ├── idle_1.png
│       │   ├── walk_1.png
│       │   ├── walk_2.png
│       │   └── walk_3.png
│       └── back/
│           ├── idle_1.png
│           ├── walk_1.png
│           ├── walk_2.png
│           └── walk_3.png
├── pokemon/
│   ├── charmander/
│   │   ├── front/
│   │   │   ├── idle_1.png
│   │   │   └── attack_1.png
│   │   └── back/
│   │       ├── idle_1.png
│   │       └── attack_1.png
│   └── squirtle/
│       ├── front/
│       │   ├── idle_1.png
│       │   └── attack_1.png
│       └── back/
│           ├── idle_1.png
│           └── attack_1.png
├── maps/
│   └── tiles/
│       ├── grass.png
│       ├── path.png
│       └── tree.png
├── ui/
│   ├── logo.png
│   ├── dialogue_box.png
│   └── hp_bar_bg.png
├── vfx/
│   ├── fire/
│   │   ├── fire_1.png
│   │   ├── fire_2.png
│   │   └── fire_3.png
│   └── impact/
│       ├── impact_1.png
│       ├── impact_2.png
│       └── impact_3.png
└── backgrounds/
    ├── battle_grass.png
    └── start_screen.png
```

---

## 🔧 素材整合步驟

### Step 2: 創建目錄

```bash
cd pokemon-battle/src/assets

# 創建所有必要的目錄
mkdir -p characters/player/front
mkdir -p characters/player/back
mkdir -p pokemon/charmander/front
mkdir -p pokemon/charmander/back
mkdir -p pokemon/squirtle/front
mkdir -p pokemon/squirtle/back
mkdir -p maps/tiles
mkdir -p ui
mkdir -p vfx/fire
mkdir -p vfx/water
mkdir -p vfx/impact
mkdir -p backgrounds
```

### Step 3: 放置素材文件

1. 使用 PixelLab MCP 生成每個素材
2. 下載 PNG 文件
3. 重命名為指定的文件名
4. 放入對應的目錄

### Step 4: 驗證素材

檢查以下內容：
- [ ] 文件格式：PNG
- [ ] 背景：透明（RGBA）
- [ ] 尺寸正確（32x32 或 64x64）
- [ ] 文件命名符合規範
- [ ] 位置正確

---

## 🎯 快速開始（Phase 1 必須素材）

**最小可玩版本需要這些素材**：

1. ✅ 主角正面站立：`player_front_1.png` (32x32)
2. ✅ 主角背面站立：`player_back_1.png` (32x32)
3. ✅ 小火龍正面：`charmander_front_idle.png` (64x64)
4. ✅ 小火龍背面：`charmander_back_idle.png` (64x64)
5. ✅ 傑尼龜正面：`squirtle_front_idle.png` (64x64)
6. ✅ 傑尼龜背面：`squirtle_back_idle.png` (64x64)
7. ✅ 草地磚塊：`tile_grass.png` (32x32)
8. ✅ 道路磚塊：`tile_path.png` (32x32)
9. ✅ 樹木磚塊：`tile_tree.png` (32x32)

**這 9 張圖就能讓遊戲基本可玩！**

---

## 📝 使用 PixelLab MCP 的步驟

### 如果你有 PixelLab MCP 工具：

```bash
# 範例命令（根據實際 MCP 接口調整）
pixellab generate \
  --prompt "Create a pixel art character sprite, 32x32 pixels..." \
  --output "player_front_1.png"
```

### 如果沒有自動化工具：

1. 複製上面的提示詞
2. 貼到 PixelLab 網頁/應用中
3. 生成圖片
4. 下載並重命名
5. 放入對應目錄

---

## ⚡ 臨時佔位符方案

如果暫時沒有素材，可以使用彩色方塊作為佔位符：

我會幫你創建一個腳本來生成彩色佔位符，這樣遊戲就可以先運行起來！

---

## 🔄 更新遊戲代碼

素材準備好後，需要更新以下文件：
1. `src/components/PokemonSprite.tsx` - 使用真實圖片
2. `src/screens/MapScreen.tsx` - 使用地圖磚塊
3. `src/screens/StartScreen.tsx` - 使用 Logo 和背景

我會提供具體的代碼修改指南。

---

## 📞 需要幫助？

- 檢查 `ART_ASSETS_CHECKLIST.md` 獲取完整素材清單
- 參考提示詞範例生成自己的變體
- 確保所有素材尺寸和格式正確

**下一步**：開始使用 PixelLab MCP 生成第一張圖片！
