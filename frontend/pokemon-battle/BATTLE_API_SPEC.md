# 寶可夢對戰系統 - API 接口規範文檔

## 概述

本文檔描述了寶可夢對戰系統中傷害計算的 API 接口規範。前端會調用這些 API 來獲取戰鬥相關的計算結果，而不是在客戶端進行計算。

## 基礎資訊

- **Base URL**: `https://your-api-domain.com/api/v1`
- **Content-Type**: `application/json`
- **認證方式**: Bearer Token (如果需要)

---

## 1. 計算傷害

### 端點

```
POST /battle/calculate-damage
```

### 描述

計算一次攻擊造成的傷害值，包含屬性相剋、暴擊判定等邏輯。

### 請求參數

```typescript
interface DamageCalculationRequest {
  attackerId: string;           // 攻擊方寶可夢 ID
  defenderId: string;           // 防守方寶可夢 ID
  skillId: string;              // 使用的技能 ID
  attackerLevel: number;        // 攻擊方等級
  attackerAttack: number;       // 攻擊方攻擊力
  defenderDefense: number;      // 防守方防禦力
  skillPower: number;           // 技能威力
  skillType: string;            // 技能屬性 (fire/water/electric/normal)
  defenderType: string;         // 防守方屬性
}
```

### 請求範例

```json
{
  "attackerId": "charmander_001",
  "defenderId": "squirtle_002",
  "skillId": "ember",
  "attackerLevel": 5,
  "attackerAttack": 52,
  "defenderDefense": 65,
  "skillPower": 40,
  "skillType": "fire",
  "defenderType": "water"
}
```

### 響應格式

```typescript
interface DamageCalculationResponse {
  success: boolean;
  data: {
    damage: number;                // 造成的傷害值
    isCritical: boolean;          // 是否暴擊
    effectiveness: number;         // 屬性相剋倍率 (0.5/1/2)
    effectivenessText: string;    // 效果文字 ('super'/'normal'/'not-very')
    message: string;              // 戰鬥訊息
    calculationDetails?: {        // 可選：計算細節（調試用）
      baseDamage: number;
      typeModifier: number;
      criticalModifier: number;
      randomFactor: number;
    };
  };
}
```

### 響應範例（成功）

```json
{
  "success": true,
  "data": {
    "damage": 15,
    "isCritical": false,
    "effectiveness": 0.5,
    "effectivenessText": "not-very",
    "message": "效果不好..."
  }
}
```

### 響應範例（暴擊）

```json
{
  "success": true,
  "data": {
    "damage": 45,
    "isCritical": true,
    "effectiveness": 2,
    "effectivenessText": "super",
    "message": "會心一擊！效果絕佳！"
  }
}
```

### 錯誤響應

```json
{
  "success": false,
  "error": {
    "code": "INVALID_POKEMON",
    "message": "無效的寶可夢 ID"
  }
}
```

---

## 2. 獲取寶可夢資料

### 端點

```
GET /pokemon/:id
```

### 描述

獲取指定寶可夢的詳細資料。

### 請求參數

- **Path Parameter**: `id` - 寶可夢 ID

### 響應格式

```typescript
interface PokemonData {
  success: boolean;
  data: {
    id: string;
    name: string;
    type: string;
    level: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    skills: Skill[];
  };
}
```

### 響應範例

```json
{
  "success": true,
  "data": {
    "id": "charmander",
    "name": "小火龍",
    "type": "fire",
    "level": 5,
    "maxHp": 39,
    "attack": 52,
    "defense": 43,
    "speed": 65,
    "skills": [
      {
        "id": "ember",
        "name": "火花",
        "type": "fire",
        "power": 40,
        "accuracy": 100
      }
    ]
  }
}
```

---

## 3. 執行技能效果

### 端點

```
POST /battle/use-skill
```

### 描述

執行一個技能，返回完整的戰鬥結果（傷害、狀態變化等）。

### 請求參數

```typescript
interface UseSkillRequest {
  battleId: string;             // 戰鬥 ID
  attackerId: string;           // 攻擊方寶可夢 ID
  defenderId: string;           // 防守方寶可夢 ID
  skillId: string;              // 技能 ID
  attackerCurrentHp: number;    // 攻擊方當前 HP
  defenderCurrentHp: number;    // 防守方當前 HP
}
```

### 請求範例

```json
{
  "battleId": "battle_12345",
  "attackerId": "charmander_001",
  "defenderId": "squirtle_002",
  "skillId": "ember",
  "attackerCurrentHp": 39,
  "defenderCurrentHp": 44
}
```

### 響應格式

```typescript
interface UseSkillResponse {
  success: boolean;
  data: {
    damage: number;
    defenderNewHp: number;
    isCritical: boolean;
    effectiveness: number;
    message: string;
    statusEffects?: string[];    // 狀態異常（麻痺、中毒等）
    battleEnded: boolean;        // 戰鬥是否結束
    winner?: string;             // 勝利者 ID（如果戰鬥結束）
  };
}
```

### 響應範例

```json
{
  "success": true,
  "data": {
    "damage": 20,
    "defenderNewHp": 24,
    "isCritical": false,
    "effectiveness": 1,
    "message": "小火龍使用了火花！",
    "statusEffects": [],
    "battleEnded": false
  }
}
```

---

## 4. 獲取屬性相剋表

### 端點

```
GET /battle/type-effectiveness
```

### 描述

獲取屬性相剋倍率表。

### 響應格式

```typescript
interface TypeEffectivenessResponse {
  success: boolean;
  data: {
    [attackType: string]: {
      [defenseType: string]: number;
    };
  };
}
```

### 響應範例

```json
{
  "success": true,
  "data": {
    "fire": {
      "fire": 0.5,
      "water": 0.5,
      "electric": 1,
      "normal": 1
    },
    "water": {
      "fire": 2,
      "water": 0.5,
      "electric": 0.5,
      "normal": 1
    }
  }
}
```

---

## 錯誤代碼

| 錯誤代碼 | HTTP 狀態碼 | 描述 |
|---------|------------|------|
| `INVALID_POKEMON` | 400 | 無效的寶可夢 ID |
| `INVALID_SKILL` | 400 | 無效的技能 ID |
| `INVALID_BATTLE` | 400 | 無效的戰鬥 ID |
| `BATTLE_ENDED` | 400 | 戰鬥已結束 |
| `NOT_YOUR_TURN` | 400 | 不是你的回合 |
| `UNAUTHORIZED` | 401 | 未授權 |
| `SERVER_ERROR` | 500 | 伺服器錯誤 |

---

## 實現建議

### 前端整合範例

```typescript
// src/services/battleAPI.ts
import { DamageCalculationRequest, DamageCalculationResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

export const battleAPI = {
  // 計算傷害
  async calculateDamage(request: DamageCalculationRequest): Promise<DamageCalculationResponse> {
    const response = await fetch(`${API_BASE_URL}/battle/calculate-damage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // 獲取寶可夢資料
  async getPokemon(id: string) {
    const response = await fetch(`${API_BASE_URL}/pokemon/${id}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  // 使用技能
  async useSkill(request: UseSkillRequest) {
    const response = await fetch(`${API_BASE_URL}/battle/use-skill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};
```

### 使用範例

```typescript
// 在 BattleScreen 中使用
import { battleAPI } from '../services/battleAPI';

const useSkill = async (skill: Skill) => {
  try {
    const result = await battleAPI.calculateDamage({
      attackerId: playerPokemon.id,
      defenderId: enemyPokemon.id,
      skillId: skill.id,
      attackerLevel: playerPokemon.level,
      attackerAttack: playerPokemon.attack,
      defenderDefense: enemyPokemon.defense,
      skillPower: skill.power,
      skillType: skill.type,
      defenderType: enemyPokemon.type,
    });

    // 處理結果
    const { damage, isCritical, message } = result.data;
    // 更新 UI...
  } catch (error) {
    console.error('Battle API Error:', error);
  }
};
```

---

## 測試環境

### Mock Server

在開發期間，可以使用 Mock Server 來模擬 API 響應：

```typescript
// src/services/mockBattleAPI.ts
export const mockBattleAPI = {
  async calculateDamage(request: DamageCalculationRequest) {
    // 簡化的傷害計算
    const baseDamage = request.skillPower * (request.attackerAttack / request.defenderDefense) * 0.5;
    const damage = Math.floor(baseDamage);

    return {
      success: true,
      data: {
        damage,
        isCritical: Math.random() < 0.1,
        effectiveness: 1,
        effectivenessText: 'normal',
        message: '攻擊命中！',
      },
    };
  },
};
```

---

## 安全性考慮

1. **輸入驗證**: 所有輸入參數都應該在後端進行驗證
2. **請求限制**: 實施 Rate Limiting 防止濫用
3. **認證**: 對需要認證的端點使用 JWT 或類似機制
4. **數據完整性**: 驗證戰鬥狀態的完整性，防止作弊

---

## 版本歷史

- **v1.0.0** (2025-01-31): 初始版本，包含基礎傷害計算 API

---

## 聯絡方式

如有任何問題或建議，請聯繫開發團隊。
