# 寶可夢對戰遊戲 - 美術素材清單

> 使用 PixelLab MCP 創作的完整美術素材需求清單

---

## 📐 統一規格

- **風格**: 像素藝術（Pixel Art）
- **調色板**: 16-32 色限制
- **背景**: 透明 PNG
- **命名規則**: 小寫英文 + 下劃線（例：`charmander_front.png`）

---

## 1. 角色素材

### 1.1 主角訓練家

**尺寸**: 32x32 像素

**簡化版：只需正反面**

- [ ] `player_front_1.png` - 主角正面站立（第1幀）
- [ ] `player_front_2.png` - 主角正面行走（第2幀）
- [ ] `player_front_3.png` - 主角正面行走（第3幀）

- [ ] `player_back_1.png` - 主角背面站立（第1幀）
- [ ] `player_back_2.png` - 主角背面行走（第2幀）
- [ ] `player_back_3.png` - 主角背面行走（第3幀）

**描述**:
- 穿著訓練家經典服裝（紅色帽子、藍色背心）
- 簡單的像素風格，清晰可辨
- 只需正面和背面，左右移動使用鏡像翻轉
- 行走動畫要流暢

---

## 2. 寶可夢素材

### 2.1 小火龍（Charmander）

**尺寸**: 64x64 像素

#### 正面視圖（對戰時敵方使用）
- [ ] `charmander_front_idle_1.png` - 正面待機（第1幀）
- [ ] `charmander_front_idle_2.png` - 正面待機（第2幀）
- [ ] `charmander_front_attack_1.png` - 正面攻擊（第1幀）
- [ ] `charmander_front_attack_2.png` - 正面攻擊（第2幀）
- [ ] `charmander_front_hit.png` - 正面受擊

#### 背面視圖（對戰時我方使用）
- [ ] `charmander_back_idle_1.png` - 背面待機（第1幀）
- [ ] `charmander_back_idle_2.png` - 背面待機（第2幀）
- [ ] `charmander_back_attack_1.png` - 背面攻擊（第1幀）
- [ ] `charmander_back_attack_2.png` - 背面攻擊（第2幀）
- [ ] `charmander_back_hit.png` - 背面受擊

**描述**:
- 橘紅色的小型蜥蜴寶可夢
- 尾巴末端有火焰
- 可愛的像素風格
- 表情生動

### 2.2 傑尼龜（Squirtle）

**尺寸**: 64x64 像素

#### 正面視圖（對戰時敵方使用）
- [ ] `squirtle_front_idle_1.png` - 正面待機（第1幀）
- [ ] `squirtle_front_idle_2.png` - 正面待機（第2幀）
- [ ] `squirtle_front_attack_1.png` - 正面攻擊（第1幀）
- [ ] `squirtle_front_attack_2.png` - 正面攻擊（第2幀）
- [ ] `squirtle_front_hit.png` - 正面受擊

#### 背面視圖（對戰時我方使用）
- [ ] `squirtle_back_idle_1.png` - 背面待機（第1幀）
- [ ] `squirtle_back_idle_2.png` - 背面待機（第2幀）
- [ ] `squirtle_back_attack_1.png` - 背面攻擊（第1幀）
- [ ] `squirtle_back_attack_2.png` - 背面攻擊（第2幀）
- [ ] `squirtle_back_hit.png` - 背面受擊

**描述**:
- 水藍色的小烏龜寶可夢
- 有棕色的龜殼
- 可愛的像素風格
- 表情友善

---

## 3. 地圖磚塊素材

### 3.1 地形磚塊（簡化版）

**尺寸**: 16x16 或 32x32 像素（每個磚塊）

**核心磚塊（必須）**
- [ ] `tile_grass.png` - 草地磚塊（綠色，有草的紋理，用於遇敵區域）
- [ ] `tile_path.png` - 道路磚塊（土黃色，安全區域）
- [ ] `tile_tree.png` - 樹木磚塊（深綠色，障礙物）

**可選磚塊**
- [ ] `tile_water.png` - 水域磚塊（藍色，有波紋，障礙物）
- [ ] `tile_building.png` - 建築物磚塊（簡單房屋）

**描述**:
- 簡化到最基本的 3-5 種磚塊
- 經典的 RPG 風格
- 色彩鮮明，容易區分
- 磚塊之間可無縫拼接
- 重點是可玩性，不是細節

---

## 4. UI 素材

### 4.1 開始畫面 UI

- [ ] `logo_pokemon.png` - 遊戲標題 Logo（512x128 像素）
  - 像素風格的 "POKEMON" 文字
  - 黃色主色調，帶有黑色描邊

- [ ] `button_start.png` - 開始按鈕（200x60 像素）
  - 紅色背景，白色文字
  - 圓角矩形

- [ ] `bg_start_screen.png` - 開始畫面背景（640x480 像素）
  - 寶可夢世界的景色
  - 藍天、草地、遠處的山

### 4.2 對話框 UI

- [ ] `dialogue_box.png` - 對話框背景（600x150 像素）
  - 白色半透明背景
  - 圓角邊框

- [ ] `dialogue_arrow.png` - 繼續指示箭頭（16x16 像素）
  - 向下的小箭頭
  - 用於指示玩家點擊繼續

- [ ] `avatar_professor.png` - 博士頭像（48x48 像素）
- [ ] `avatar_player.png` - 玩家頭像（48x48 像素）

### 4.3 對戰 UI

- [ ] `battle_hp_bar_bg.png` - HP 條背景（200x20 像素）
- [ ] `battle_hp_bar_fill_green.png` - HP 條填充（綠色）
- [ ] `battle_hp_bar_fill_yellow.png` - HP 條填充（黃色）
- [ ] `battle_hp_bar_fill_red.png` - HP 條填充（紅色）

- [ ] `battle_info_box.png` - 寶可夢資訊框（250x100 像素）
  - 半透明黑色背景
  - 顯示名稱、等級、HP

- [ ] `battle_skill_button.png` - 技能按鈕（150x60 像素）
  - 藍色背景
  - 圓角矩形

- [ ] `battle_menu_bg.png` - 技能選單背景（600x180 像素）
  - 深色半透明背景

---

## 5. 特效素材

### 5.1 攻擊特效

**尺寸**: 128x128 像素（每幀）

#### 火焰特效（Ember / Fire Blast）
- [ ] `vfx_fire_1.png` - 火焰特效第1幀
- [ ] `vfx_fire_2.png` - 火焰特效第2幀
- [ ] `vfx_fire_3.png` - 火焰特效第3幀
- [ ] `vfx_fire_4.png` - 火焰特效第4幀

**描述**: 橘紅色的火焰，從攻擊者飛向目標

#### 水流特效（Water Gun / Surf）
- [ ] `vfx_water_1.png` - 水流特效第1幀
- [ ] `vfx_water_2.png` - 水流特效第2幀
- [ ] `vfx_water_3.png` - 水流特效第3幀
- [ ] `vfx_water_4.png` - 水流特效第4幀

**描述**: 藍色的水流，帶有水滴效果

#### 電擊特效（Thunder Shock）
- [ ] `vfx_electric_1.png` - 電擊特效第1幀
- [ ] `vfx_electric_2.png` - 電擊特效第2幀
- [ ] `vfx_electric_3.png` - 電擊特效第3幀

**描述**: 黃色的閃電，鋸齒狀

#### 普通攻擊特效（Tackle / Scratch）
- [ ] `vfx_impact_1.png` - 衝擊特效第1幀
- [ ] `vfx_impact_2.png` - 衝擊特效第2幀
- [ ] `vfx_impact_3.png` - 衝擊特效第3幀

**描述**: 白色的衝擊波，圓形擴散

### 5.2 受擊特效

- [ ] `vfx_hit_1.png` - 受擊特效第1幀（32x32 像素）
- [ ] `vfx_hit_2.png` - 受擊特效第2幀
- [ ] `vfx_hit_3.png` - 受擊特效第3幀

**描述**: 白色閃光，表示受到傷害

### 5.3 場景特效

- [ ] `vfx_encounter_flash.png` - 遇敵閃光（640x480 像素）
  - 白色半透明，用於螺旋轉場

- [ ] `vfx_victory_sparkle_1.png` - 勝利閃光第1幀（64x64 像素）
- [ ] `vfx_victory_sparkle_2.png` - 勝利閃光第2幀
- [ ] `vfx_victory_sparkle_3.png` - 勝利閃光第3幀

**描述**: 金色星星閃爍效果

---

## 6. 背景素材

### 6.1 對戰背景

- [ ] `bg_battle_grass.png` - 草地對戰背景（640x480 像素）
  - 下半部：綠色草地
  - 上半部：藍天白雲
  - 簡單的像素風格

### 6.2 場景背景

- [ ] `bg_lab.png` - 研究所背景（640x480 像素）
  - 室內場景
  - 有桌子、書架等元素

---

## 7. 其他素材

### 7.1 圖標

- [ ] `icon_pokeball.png` - 精靈球圖標（32x32 像素）
  - 上半紅色，下半白色
  - 中間有黑色按鈕

- [ ] `icon_potion.png` - 藥水圖標（32x32 像素）
- [ ] `icon_level_up.png` - 升級圖標（32x32 像素）

---

## 📊 素材統計（簡化版）

| 類別 | 數量 | 狀態 |
|------|------|------|
| 角色素材 | 6 張（簡化） | ⏳ 待製作 |
| 寶可夢素材 | 20 張 | ⏳ 待製作 |
| 地圖磚塊 | 3-5 張（簡化） | ⏳ 待製作 |
| UI 素材 | 15 張 | ⏳ 待製作 |
| 特效素材 | 20 張 | ⏳ 待製作 |
| 背景素材 | 2 張 | ⏳ 待製作 |
| 圖標 | 3 張 | ⏳ 待製作 |
| **總計** | **~70 張** | - |

**簡化說明**:
- 主角角色：從 12 張減少到 6 張（只保留正反面，左右使用鏡像）
- 地圖磚塊：從 12 張減少到 3-5 張（只保留核心磚塊）
- 總素材數：從 84 張減少到約 70 張

---

## 🎨 製作優先級（簡化版）

### Phase 1 - 核心遊戲 (必須)
1. 主角行走動畫（6張：正反面各3幀）✅ 簡化
2. 2隻寶可夢基本圖（10張：各5張待機+攻擊）
3. 基礎地圖磚塊（3張：草地、路徑、樹木）✅ 簡化
4. 基本 UI（5張：對話框、HP條、技能按鈕）

### Phase 2 - 增強體驗 (重要)
1. 攻擊特效（16張：4種屬性 × 4幀）
2. 受擊特效（3張）
3. 完整 UI（剩餘10張）
4. 對戰背景（1張）

### Phase 3 - 潤色 (可選)
1. 剩餘寶可夢動畫
2. 完整地圖磚塊
3. 場景特效
4. 圖標

---

## 📝 使用 PixelLab MCP 的提示詞範例

### 主角角色
```
Create a pixel art character sprite, 32x32 pixels,
RPG trainer style, wearing red cap and blue vest,
front view walking animation frame 1,
transparent background, 16-color palette
```

### 小火龍
```
Create a pixel art Pokemon character, 64x64 pixels,
Charmander style - orange lizard with flame tail,
front view idle pose, cute expression,
transparent background, vibrant colors
```

### 火焰特效
```
Create a pixel art fire effect, 128x128 pixels,
orange and red flames, attack animation frame 1,
transparent background, glowing effect
```

---

## 💾 文件組織結構

素材完成後，請按照以下結構組織：

```
pokemon-battle/src/assets/
├── characters/
│   ├── player/
│   │   ├── down/
│   │   ├── up/
│   │   ├── left/
│   │   └── right/
│   └── ...
├── pokemon/
│   ├── charmander/
│   │   ├── front/
│   │   └── back/
│   └── squirtle/
│       ├── front/
│       └── back/
├── maps/
│   ├── tiles/
│   └── decorations/
├── ui/
│   ├── buttons/
│   ├── boxes/
│   └── icons/
├── vfx/
│   ├── fire/
│   ├── water/
│   ├── electric/
│   └── impact/
└── backgrounds/
    ├── battle/
    └── scenes/
```

---

## ✅ 驗收標準

每個素材需要滿足：
- [ ] 尺寸正確
- [ ] 格式為 PNG，背景透明（除了背景圖）
- [ ] 像素清晰，沒有模糊
- [ ] 顏色鮮明，符合像素藝術風格
- [ ] 動畫幀之間流暢過渡
- [ ] 文件命名符合規範

---

**最後更新**: 2025-01-31
**文檔版本**: v1.0
