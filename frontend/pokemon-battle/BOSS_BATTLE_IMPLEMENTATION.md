# 多人 Boss 戰系統完整實作文檔

## 📋 目錄

1. [需求概述](#需求概述)
2. [系統架構](#系統架構)
3. [類型定義](#類型定義)
4. [狀態管理](#狀態管理)
5. [UI 組件開發](#UI-組件開發)
6. [戰鬥邏輯](#戰鬥邏輯)
7. [冷卻系統](#冷卻系統)
8. [WebSocket 整合](#WebSocket-整合)
9. [測試與除錯](#測試與除錯)
10. [部署檢查清單](#部署檢查清單)

---

## 需求概述

### 核心功能

1. **多人協作**：2-5 名玩家同時圍攻一隻神獸
2. **自由攻擊**：取消回合制，每個寶可夢有獨立的 5 秒冷卻時間
3. **視覺呈現**：
   - Boss 在右側，放大 1.5-2 倍
   - 所有玩家寶可夢並列站立（左側/下方）
   - 冷卻中技能變灰
   - 冷卻結束顯示 "Ready!" 提示

### 技術要求

- **前端**：React Native + TypeScript
- **狀態管理**：Context API + useReducer
- **即時通訊**：WebSocket (由後端同事實作)
- **測試模式**：支援可調整玩家數量的假資料

---

## 系統架構

### 整體流程圖

```
遊戲開始
    ↓
對話流程（含圖片上傳）
    ↓
技能預加載
    ↓
地圖探索
    ↓
[觸發 Boss 戰]
    ↓
┌─────────────────────────────────────┐
│   多人 Boss 戰畫面                    │
│                                     │
│   [WebSocket 連接]                   │
│       ↓                             │
│   接收房間玩家資料                    │
│       ↓                             │
│   顯示所有玩家寶可夢 + Boss             │
│       ↓                             │
│   自由攻擊循環                        │
│   - 5秒冷卻計時                      │
│   - 可用時發起攻擊                    │
│   - Boss 反擊（選項）                 │
│       ↓                             │
│   勝負判定                           │
│       ↓                             │
│   戰鬥結束                           │
└─────────────────────────────────────┘
    ↓
返回地圖
```

### 資料夾結構

```
src/
├── types/
│   └── index.ts                    # 新增多人戰鬥類型
├── contexts/
│   └── GameContext.tsx             # 新增 Boss 戰狀態
├── screens/
│   ├── BossBattleScreen.tsx        # 🆕 多人 Boss 戰畫面
│   └── ...
├── components/
│   ├── PlayerCard.tsx              # 🆕 玩家寶可夢卡片
│   ├── BossCard.tsx                # 🆕 Boss 卡片
│   ├── SkillButtonWithCooldown.tsx # 🆕 含冷卻的技能按鈕
│   └── DevPanel.tsx                # 🆕 開發測試面板
├── hooks/
│   └── useCooldown.ts              # 🆕 冷卻時間管理
├── data/
│   ├── bossData.ts                 # 🆕 神獸資料
│   └── mockPlayers.ts              # 🆕 假玩家資料
└── services/
    ├── websocketService.ts         # 🆕 WebSocket 服務（預留）
    └── apiService.ts               # 🆕 API 服務（預留）
```

---

## 類型定義

### 檔案：`src/types/index.ts`

```typescript
// ========== 多人戰鬥相關類型 ==========

/**
 * 戰鬥中的玩家資料
 */
export interface PlayerInBattle {
  id: string;                    // 玩家 ID
  name: string;                  // 玩家名稱
  pokemon: Pokemon;              // 玩家的寶可夢
  isOnline: boolean;             // 是否在線
  lastAttackTime: number;        // 上次攻擊時間戳
  cooldowns: {                   // 每個技能的冷卻狀態
    [skillId: string]: number;   // 剩餘冷卻時間（毫秒）
  };
}

/**
 * Boss 資料
 */
export interface BossPokemon extends Pokemon {
  bossLevel: number;             // Boss 等級
  difficultyMultiplier: number;  // 難度倍率（HP, 攻擊力）
  specialAbilities?: string[];   // 特殊能力
}

/**
 * Boss 戰鬥狀態
 */
export interface BossBattleState {
  roomId: string;                        // 房間 ID
  players: PlayerInBattle[];             // 所有玩家
  boss: BossPokemon;                     // Boss
  battleLog: BattleLogEntry[];           // 戰鬥日誌
  battleResult?: 'win' | 'lose' | null;  // 戰鬥結果
  startTime: number;                     // 戰鬥開始時間
  isActive: boolean;                     // 戰鬥是否進行中
}

/**
 * 戰鬥日誌條目
 */
export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: 'attack' | 'damage' | 'heal' | 'status' | 'system';
  playerId?: string;
  playerName?: string;
  message: string;
  damage?: number;
}

/**
 * WebSocket 訊息類型
 */
export interface WSMessage {
  type: 'join' | 'leave' | 'attack' | 'damage' | 'heal' | 'victory' | 'defeat' | 'sync';
  payload: any;
  timestamp: number;
}

/**
 * 攻擊請求
 */
export interface AttackRequest {
  playerId: string;
  skillId: string;
  targetId: string;  // Boss ID
  timestamp: number;
}

/**
 * 攻擊結果
 */
export interface AttackResult {
  attackerId: string;
  targetId: string;
  skillId: string;
  damage: number;
  isCritical: boolean;
  newHp: number;
  timestamp: number;
}
```

### 更新 GameState

```typescript
export interface GameState {
  // ... 現有屬性

  // Boss 戰相關
  bossBattleState?: BossBattleState;    // Boss 戰鬥狀態
  websocketConnected: boolean;          // WebSocket 連接狀態
  roomId?: string;                      // 當前房間 ID
  playerId?: string;                    // 玩家 ID

  // 測試用
  mockPlayersCount: number;             // 模擬玩家數量（開發用）
}
```

---

## 狀態管理

### 檔案：`src/contexts/GameContext.tsx`

#### 新增 Actions

```typescript
type GameAction =
  // ... 現有 actions

  // Boss 戰相關
  | { type: 'START_BOSS_BATTLE'; boss: BossPokemon; roomId: string }
  | { type: 'JOIN_ROOM'; playerId: string; roomId: string }
  | { type: 'PLAYER_JOINED'; player: PlayerInBattle }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'ATTACK_BOSS'; playerId: string; skillId: string }
  | { type: 'UPDATE_BOSS_HP'; newHp: number }
  | { type: 'UPDATE_PLAYER_HP'; playerId: string; newHp: number }
  | { type: 'ADD_BATTLE_LOG'; entry: BattleLogEntry }
  | { type: 'END_BOSS_BATTLE'; result: 'win' | 'lose' }
  | { type: 'UPDATE_COOLDOWN'; playerId: string; skillId: string; remaining: number }
  | { type: 'SET_MOCK_PLAYERS_COUNT'; count: number }
  | { type: 'WS_CONNECTED' }
  | { type: 'WS_DISCONNECTED' };
```

#### Reducer 實作

```typescript
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    // ... 現有 cases

    case 'START_BOSS_BATTLE':
      return {
        ...state,
        currentScreen: 'bossBattle',
        bossBattleState: {
          roomId: action.roomId,
          players: [
            {
              id: state.playerId || 'player-1',
              name: state.pokemonNickname || '玩家',
              pokemon: state.playerPokemon[0],
              isOnline: true,
              lastAttackTime: 0,
              cooldowns: {},
            },
          ],
          boss: action.boss,
          battleLog: [],
          battleResult: null,
          startTime: Date.now(),
          isActive: true,
        },
      };

    case 'PLAYER_JOINED':
      if (!state.bossBattleState) return state;
      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          players: [...state.bossBattleState.players, action.player],
        },
      };

    case 'PLAYER_LEFT':
      if (!state.bossBattleState) return state;
      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          players: state.bossBattleState.players.filter(
            (p) => p.id !== action.playerId
          ),
        },
      };

    case 'ATTACK_BOSS':
      // 攻擊邏輯會透過 WebSocket 同步
      // Client 端只記錄攻擊時間和觸發冷卻
      if (!state.bossBattleState) return state;

      const updatedPlayers = state.bossBattleState.players.map((player) => {
        if (player.id === action.playerId) {
          return {
            ...player,
            lastAttackTime: Date.now(),
            cooldowns: {
              ...player.cooldowns,
              [action.skillId]: 5000, // 5 秒冷卻
            },
          };
        }
        return player;
      });

      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          players: updatedPlayers,
        },
      };

    case 'UPDATE_BOSS_HP':
      if (!state.bossBattleState) return state;
      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          boss: {
            ...state.bossBattleState.boss,
            currentHp: Math.max(0, action.newHp),
          },
        },
      };

    case 'UPDATE_PLAYER_HP':
      if (!state.bossBattleState) return state;
      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          players: state.bossBattleState.players.map((player) => {
            if (player.id === action.playerId) {
              return {
                ...player,
                pokemon: {
                  ...player.pokemon,
                  currentHp: Math.max(0, action.newHp),
                },
              };
            }
            return player;
          }),
        },
      };

    case 'ADD_BATTLE_LOG':
      if (!state.bossBattleState) return state;
      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          battleLog: [
            ...state.bossBattleState.battleLog.slice(-20), // 保留最後 20 條
            action.entry,
          ],
        },
      };

    case 'END_BOSS_BATTLE':
      return {
        ...state,
        currentScreen: 'map',
        bossBattleState: undefined,
      };

    case 'UPDATE_COOLDOWN':
      if (!state.bossBattleState) return state;
      return {
        ...state,
        bossBattleState: {
          ...state.bossBattleState,
          players: state.bossBattleState.players.map((player) => {
            if (player.id === action.playerId) {
              return {
                ...player,
                cooldowns: {
                  ...player.cooldowns,
                  [action.skillId]: action.remaining,
                },
              };
            }
            return player;
          }),
        },
      };

    case 'SET_MOCK_PLAYERS_COUNT':
      return {
        ...state,
        mockPlayersCount: action.count,
      };

    case 'WS_CONNECTED':
      return {
        ...state,
        websocketConnected: true,
      };

    case 'WS_DISCONNECTED':
      return {
        ...state,
        websocketConnected: false,
      };

    default:
      return state;
  }
};
```

---

## UI 組件開發

### 1. 玩家寶可夢卡片

**檔案：`src/components/PlayerCard.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerInBattle } from '../types';
import HPBar from './HPBar';
import PokemonSprite from './PokemonSprite';

interface PlayerCardProps {
  player: PlayerInBattle;
  isCurrentPlayer?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentPlayer }) => {
  const hpPercentage = (player.pokemon.currentHp / player.pokemon.maxHp) * 100;

  return (
    <View style={[
      styles.container,
      isCurrentPlayer && styles.currentPlayerContainer,
    ]}>
      {/* 玩家名稱 */}
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>
          {player.name}
          {isCurrentPlayer && ' (你)'}
        </Text>
        {!player.isOnline && (
          <Text style={styles.offlineText}>(離線)</Text>
        )}
      </View>

      {/* 寶可夢精靈圖 */}
      <View style={styles.spriteContainer}>
        <PokemonSprite
          sprite={player.pokemon.backSprite}
          size={80}
          animated={isCurrentPlayer}
        />
      </View>

      {/* HP 條 */}
      <View style={styles.hpContainer}>
        <HPBar
          currentHp={player.pokemon.currentHp}
          maxHp={player.pokemon.maxHp}
          width={120}
        />
        <Text style={styles.hpText}>
          {player.pokemon.currentHp} / {player.pokemon.maxHp}
        </Text>
      </View>

      {/* 寶可夢名稱和等級 */}
      <Text style={styles.pokemonName}>
        {player.pokemon.name} Lv.{player.pokemon.level}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 10,
    margin: 5,
    backgroundColor: '#2d3561',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a5a9e',
    minWidth: 140,
  },
  currentPlayerContainer: {
    borderColor: '#4ecca3',
    borderWidth: 3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 5,
  },
  spriteContainer: {
    marginBottom: 8,
  },
  hpContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  hpText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  pokemonName: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default PlayerCard;
```

### 2. Boss 卡片

**檔案：`src/components/BossCard.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BossPokemon } from '../types';
import HPBar from './HPBar';
import PokemonSprite from './PokemonSprite';

interface BossCardProps {
  boss: BossPokemon;
  isTakingDamage?: boolean;
}

const BossCard: React.FC<BossCardProps> = ({ boss, isTakingDamage }) => {
  const hpPercentage = (boss.currentHp / boss.maxHp) * 100;

  return (
    <View style={styles.container}>
      {/* Boss 標籤 */}
      <View style={styles.bossLabel}>
        <Text style={styles.bossLabelText}>⚔️ BOSS ⚔️</Text>
      </View>

      {/* Boss 名稱和等級 */}
      <Text style={styles.bossName}>{boss.name}</Text>
      <Text style={styles.bossLevel}>Lv.{boss.bossLevel}</Text>

      {/* Boss 精靈圖 (放大 1.8 倍) */}
      <View style={[
        styles.spriteContainer,
        isTakingDamage && styles.takingDamage,
      ]}>
        <PokemonSprite
          sprite={boss.frontSprite}
          size={200}  // 放大尺寸
          animated={true}
        />
      </View>

      {/* HP 條 (較大) */}
      <View style={styles.hpContainer}>
        <HPBar
          currentHp={boss.currentHp}
          maxHp={boss.maxHp}
          width={280}
          height={24}
        />
        <Text style={styles.hpText}>
          {boss.currentHp} / {boss.maxHp}
        </Text>
        <Text style={styles.hpPercentage}>{hpPercentage.toFixed(1)}%</Text>
      </View>

      {/* 難度指示器 */}
      <View style={styles.difficultyContainer}>
        {Array.from({ length: boss.difficultyMultiplier }).map((_, i) => (
          <Text key={i} style={styles.difficultyIcon}>⭐</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#e94560',
    margin: 10,
  },
  bossLabel: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  bossLabelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bossName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bossLevel: {
    color: '#4ecca3',
    fontSize: 18,
    marginBottom: 15,
  },
  spriteContainer: {
    marginBottom: 20,
  },
  takingDamage: {
    transform: [{ scale: 1.1 }],
  },
  hpContainer: {
    alignItems: 'center',
    width: '100%',
  },
  hpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  hpPercentage: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  difficultyIcon: {
    fontSize: 20,
    marginHorizontal: 2,
  },
});

export default BossCard;
```

### 3. 含冷卻的技能按鈕

**檔案：`src/components/SkillButtonWithCooldown.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Skill } from '../types';

interface SkillButtonWithCooldownProps {
  skill: Skill;
  cooldownRemaining: number;  // 剩餘冷卻時間（毫秒）
  onPress: () => void;
  disabled?: boolean;
}

const SkillButtonWithCooldown: React.FC<SkillButtonWithCooldownProps> = ({
  skill,
  cooldownRemaining,
  onPress,
  disabled,
}) => {
  const [displayTime, setDisplayTime] = useState(0);
  const isReady = cooldownRemaining <= 0;
  const isDisabled = disabled || !isReady;

  useEffect(() => {
    if (cooldownRemaining > 0) {
      // 顯示剩餘秒數（向上取整）
      setDisplayTime(Math.ceil(cooldownRemaining / 1000));
    }
  }, [cooldownRemaining]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        isReady && !disabled && styles.buttonReady,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        <Text style={[styles.skillName, isDisabled && styles.textDisabled]}>
          {skill.name}
        </Text>
        <Text style={[styles.skillInfo, isDisabled && styles.textDisabled]}>
          威力: {skill.power}
        </Text>

        {/* 冷卻時間顯示 */}
        {!isReady && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>{displayTime}s</Text>
          </View>
        )}

        {/* Ready 提示 */}
        {isReady && !disabled && (
          <View style={styles.readyIndicator}>
            <Text style={styles.readyText}>Ready!</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4a5a9e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    margin: 5,
    minWidth: 140,
    position: 'relative',
  },
  buttonDisabled: {
    backgroundColor: '#2d3142',
    opacity: 0.6,
  },
  buttonReady: {
    backgroundColor: '#4ecca3',
    borderWidth: 2,
    borderColor: '#45b393',
  },
  content: {
    alignItems: 'center',
  },
  skillName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  skillInfo: {
    color: '#ccc',
    fontSize: 12,
  },
  textDisabled: {
    color: '#666',
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  readyIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4ecca3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#45b393',
  },
  readyText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SkillButtonWithCooldown;
```

---

## 冷卻系統

### 檔案：`src/hooks/useCooldown.ts`

```typescript
import { useState, useEffect, useRef } from 'react';

/**
 * 冷卻時間管理 Hook
 * @param cooldownDuration 冷卻時長（毫秒）
 * @param autoStart 是否自動開始
 */
export const useCooldown = (
  cooldownDuration: number = 5000,
  autoStart: boolean = false
) => {
  const [remaining, setRemaining] = useState(autoStart ? cooldownDuration : 0);
  const [isReady, setIsReady] = useState(!autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 開始冷卻
  const start = () => {
    setRemaining(cooldownDuration);
    setIsReady(false);
  };

  // 重置
  const reset = () => {
    setRemaining(0);
    setIsReady(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 倒數計時
  useEffect(() => {
    if (remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 100;  // 每 100ms 更新一次
          if (next <= 0) {
            setIsReady(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return next;
        });
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [remaining]);

  return {
    remaining,       // 剩餘時間（毫秒）
    isReady,         // 是否準備好
    start,           // 開始冷卻
    reset,           // 重置
  };
};

/**
 * 多技能冷卻管理 Hook
 */
export const useMultiCooldown = (
  skillIds: string[],
  cooldownDuration: number = 5000
) => {
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});

  // 開始某個技能的冷卻
  const startCooldown = (skillId: string) => {
    setCooldowns((prev) => ({
      ...prev,
      [skillId]: cooldownDuration,
    }));
  };

  // 更新冷卻時間
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((skillId) => {
          if (updated[skillId] > 0) {
            updated[skillId] = Math.max(0, updated[skillId] - 100);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 檢查某個技能是否準備好
  const isReady = (skillId: string) => {
    return !cooldowns[skillId] || cooldowns[skillId] <= 0;
  };

  // 獲取剩餘時間
  const getRemaining = (skillId: string) => {
    return cooldowns[skillId] || 0;
  };

  return {
    cooldowns,
    startCooldown,
    isReady,
    getRemaining,
  };
};
```

---

*由於文檔過長，我會將其分成多個部分繼續...*

請確認這個方向是否正確？我可以繼續完成：
- Boss 戰畫面完整實作
- WebSocket 整合規格
- 假資料生成器
- 測試工具
- 部署檢查清單

或者你希望我調整某些部分？