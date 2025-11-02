# 多人 Boss 戰系統實作文檔 - Part 2

## Boss 戰畫面完整實作

### 檔案：`src/screens/BossBattleScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import PlayerCard from '../components/PlayerCard';
import BossCard from '../components/BossCard';
import SkillButtonWithCooldown from '../components/SkillButtonWithCooldown';
import DevPanel from '../components/DevPanel';
import { musicManager } from '../services/MusicManager';
import { useMultiCooldown } from '../hooks/useCooldown';

const { width, height } = Dimensions.get('window');

const BossBattleScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const bossBattle = state.bossBattleState;

  const [isBossTakingDamage, setIsBossTakingDamage] = useState(false);

  // 獲取當前玩家
  const currentPlayer = bossBattle?.players.find(
    (p) => p.id === state.playerId
  );

  // 管理所有技能的冷卻時間
  const {
    cooldowns,
    startCooldown,
    isReady,
    getRemaining,
  } = useMultiCooldown(
    currentPlayer?.pokemon.skills.map((s) => s.id) || [],
    5000
  );

  // 檢查 Boss 是否被擊敗
  useEffect(() => {
    if (bossBattle && bossBattle.boss.currentHp <= 0) {
      // 戰鬥勝利
      setTimeout(() => {
        dispatch({ type: 'END_BOSS_BATTLE', result: 'win' });
      }, 2000);
    }
  }, [bossBattle?.boss.currentHp]);

  // 處理玩家攻擊
  const handleAttack = async (skillId: string) => {
    if (!bossBattle || !currentPlayer) return;

    // 檢查冷卻
    if (!isReady(skillId)) {
      console.log('技能冷卻中');
      return;
    }

    // 開始冷卻
    startCooldown(skillId);

    // 觸發攻擊
    dispatch({
      type: 'ATTACK_BOSS',
      playerId: currentPlayer.id,
      skillId: skillId,
    });

    // 播放攻擊音效
    await musicManager.playHitSound();

    // 模擬傷害計算（實際會由 Server 計算）
    const skill = currentPlayer.pokemon.skills.find((s) => s.id === skillId);
    if (skill) {
      const damage = calculateDamage(currentPlayer.pokemon, bossBattle.boss, skill);

      // Boss 受擊動畫
      setIsBossTakingDamage(true);
      setTimeout(() => setIsBossTakingDamage(false), 300);

      // 更新 Boss HP（實際會由 WebSocket 同步）
      setTimeout(() => {
        const newHp = Math.max(0, bossBattle.boss.currentHp - damage);
        dispatch({ type: 'UPDATE_BOSS_HP', newHp });

        // 添加戰鬥日誌
        dispatch({
          type: 'ADD_BATTLE_LOG',
          entry: {
            id: `${Date.now()}`,
            timestamp: Date.now(),
            type: 'attack',
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            message: `${currentPlayer.name} 使用了 ${skill.name}，造成 ${damage} 點傷害！`,
            damage,
          },
        });
      }, 400);
    }
  };

  // 簡單的傷害計算（實際會由 Server 處理）
  const calculateDamage = (attacker: any, defender: any, skill: any) => {
    const baseDamage = Math.floor(
      ((2 * attacker.level / 5 + 2) * skill.power * attacker.attack) /
        (defender.defense * 50) +
        2
    );
    const randomFactor = 0.85 + Math.random() * 0.15;
    return Math.floor(baseDamage * randomFactor);
  };

  if (!bossBattle || !currentPlayer) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Boss 戰鬥資料載入中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 開發者面板（僅開發環境） */}
      {__DEV__ && <DevPanel />}

      {/* 主要戰鬥區域 */}
      <View style={styles.battleArea}>
        {/* Boss 區域（右側放大） */}
        <View style={styles.bossSection}>
          <BossCard
            boss={bossBattle.boss}
            isTakingDamage={isBossTakingDamage}
          />
        </View>

        {/* 玩家區域（左側並列） */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>冒險者們</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.playersContainer}
          >
            {bossBattle.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayer.id}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 技能選擇區域 */}
      <View style={styles.skillsSection}>
        <Text style={styles.sectionTitle}>你的技能</Text>
        <View style={styles.skillsGrid}>
          {currentPlayer.pokemon.skills.map((skill) => (
            <SkillButtonWithCooldown
              key={skill.id}
              skill={skill}
              cooldownRemaining={getRemaining(skill.id)}
              onPress={() => handleAttack(skill.id)}
              disabled={bossBattle.boss.currentHp <= 0}
            />
          ))}
        </View>
      </View>

      {/* 戰鬥日誌 */}
      <View style={styles.logSection}>
        <Text style={styles.sectionTitle}>戰鬥記錄</Text>
        <ScrollView style={styles.logScrollView}>
          {bossBattle.battleLog.slice(-5).reverse().map((entry) => (
            <View key={entry.id} style={styles.logEntry}>
              <Text style={styles.logText}>{entry.message}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* WebSocket 連線狀態 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {state.websocketConnected ? '🟢 已連線' : '🔴 離線模式'}
        </Text>
        <Text style={styles.statusText}>
          房間: {bossBattle.roomId}
        </Text>
        <Text style={styles.statusText}>
          玩家: {bossBattle.players.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0e17',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  battleArea: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  bossSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    color: '#4ecca3',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  playersContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  skillsSection: {
    backgroundColor: '#16213e',
    padding: 15,
    borderTopWidth: 2,
    borderTopColor: '#4a5a9e',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  logSection: {
    backgroundColor: '#1a1a2e',
    padding: 10,
    maxHeight: 120,
    borderTopWidth: 1,
    borderTopColor: '#2d3561',
  },
  logScrollView: {
    maxHeight: 80,
  },
  logEntry: {
    paddingVertical: 4,
  },
  logText: {
    color: '#ccc',
    fontSize: 12,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0a0a0f',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#2d3561',
  },
  statusText: {
    color: '#888',
    fontSize: 12,
  },
});

export default BossBattleScreen;
```

---

## WebSocket 整合

### 檔案：`src/services/websocketService.ts`

```typescript
/**
 * WebSocket 服務（待後端同事實作）
 * 此檔案提供 Client 端介面規格
 */

import { WSMessage, AttackRequest, PlayerInBattle, BossPokemon } from '../types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * 連接到 WebSocket 服務器
   * @param url WebSocket 服務器地址
   * @param roomId 房間 ID
   * @param playerId 玩家 ID
   */
  connect(url: string, roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.url = `${url}?roomId=${roomId}&playerId=${playerId}`;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket 連接成功');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ WebSocket 訊息解析失敗:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket 錯誤:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket 連接關閉');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 註冊訊息處理器
   */
  on(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 發送攻擊請求
   */
  sendAttack(request: AttackRequest) {
    this.send({
      type: 'attack',
      payload: request,
      timestamp: Date.now(),
    });
  }

  /**
   * 發送訊息
   */
  private send(message: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket 未連接，無法發送訊息');
    }
  }

  /**
   * 處理收到的訊息
   */
  private handleMessage(message: WSMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload);
    } else {
      console.warn('⚠️ 未處理的訊息類型:', message.type);
    }
  }

  /**
   * 嘗試重新連接
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 嘗試重新連接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect(this.url, '', '');
      }, 2000 * this.reconnectAttempts);
    } else {
      console.error('❌ 重新連接失敗，已達最大嘗試次數');
    }
  }

  /**
   * 斷開連接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 檢查連接狀態
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
```

### WebSocket 訊息格式規範

#### Client → Server

```typescript
// 加入房間
{
  type: 'join',
  payload: {
    playerId: string,
    playerName: string,
    pokemon: Pokemon,
  },
  timestamp: number
}

// 發起攻擊
{
  type: 'attack',
  payload: {
    playerId: string,
    skillId: string,
    targetId: string,  // Boss ID
    timestamp: number,
  },
  timestamp: number
}

// 離開房間
{
  type: 'leave',
  payload: {
    playerId: string,
  },
  timestamp: number
}
```

#### Server → Client

```typescript
// 新玩家加入
{
  type: 'join',
  payload: {
    player: PlayerInBattle,
  },
  timestamp: number
}

// 玩家離開
{
  type: 'leave',
  payload: {
    playerId: string,
  },
  timestamp: number
}

// 攻擊結果
{
  type: 'damage',
  payload: {
    attackerId: string,
    targetId: string,
    damage: number,
    newHp: number,
    isCritical: boolean,
  },
  timestamp: number
}

// 戰鬥勝利
{
  type: 'victory',
  payload: {
    survivors: string[],  // 存活玩家 ID
    rewards: any,
  },
  timestamp: number
}

// 戰鬥失敗
{
  type: 'defeat',
  payload: {
    reason: string,
  },
  timestamp: number
}

// 狀態同步
{
  type: 'sync',
  payload: {
    boss: BossPokemon,
    players: PlayerInBattle[],
  },
  timestamp: number
}
```

---

## 假資料生成器

### 檔案：`src/data/mockPlayers.ts`

```typescript
import { PlayerInBattle, Pokemon, PokemonType } from '../types';
import { createPokemon } from './pokemon';

const mockNames = [
  '小智', '小霞', '小剛', '阿渡', '希巴',
  '菊子', '科拿', '綠', '赤紅', '銀'
];

const pokemonNames = [
  'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee'
];

/**
 * 生成假玩家資料
 */
export const generateMockPlayers = (count: number): PlayerInBattle[] => {
  const players: PlayerInBattle[] = [];

  for (let i = 0; i < count; i++) {
    const pokemonName = pokemonNames[i % pokemonNames.length];
    const pokemon = createPokemon(pokemonName, 5 + i);

    players.push({
      id: `mock-player-${i + 1}`,
      name: mockNames[i % mockNames.length],
      pokemon: pokemon,
      isOnline: true,
      lastAttackTime: 0,
      cooldowns: {},
    });
  }

  return players;
};

/**
 * 更新假玩家的攻擊行為（模擬）
 */
export const simulateMockPlayerAttack = (
  player: PlayerInBattle,
  boss: any
): { damage: number; skillUsed: string } | null => {
  // 檢查冷卻時間
  const now = Date.now();
  if (now - player.lastAttackTime < 5000) {
    return null;  // 還在冷卻
  }

  // 隨機選擇技能
  const randomSkill = player.pokemon.skills[
    Math.floor(Math.random() * player.pokemon.skills.length)
  ];

  // 計算傷害
  const damage = Math.floor(
    Math.random() * 50 + randomSkill.power / 2
  );

  return {
    damage,
    skillUsed: randomSkill.name,
  };
};
```

### 檔案：`src/data/bossData.ts`

```typescript
import { BossPokemon, PokemonType } from '../types';

/**
 * Boss 資料定義
 */
export const BOSSES: { [key: string]: BossPokemon } = {
  mewtwo: {
    id: 'boss-mewtwo',
    name: '超夢',
    type: 'normal' as PokemonType,
    level: 70,
    bossLevel: 70,
    maxHp: 5000,
    currentHp: 5000,
    attack: 154,
    defense: 90,
    speed: 130,
    difficultyMultiplier: 3,
    skills: [
      {
        id: 'psychic',
        name: '精神強念',
        type: 'normal' as PokemonType,
        power: 90,
        accuracy: 100,
        description: '用強大的念力攻擊對手',
      },
      {
        id: 'shadow-ball',
        name: '暗影球',
        type: 'normal' as PokemonType,
        power: 80,
        accuracy: 100,
        description: '投擲一團黑影進行攻擊',
      },
      {
        id: 'aura-sphere',
        name: '波導彈',
        type: 'normal' as PokemonType,
        power: 80,
        accuracy: 100,
        description: '從體內產生出波導之力',
      },
    ],
    frontSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
    backSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/150.png',
    specialAbilities: ['壓迫感', '不眠'],
  },

  rayquaza: {
    id: 'boss-rayquaza',
    name: '烈空坐',
    type: 'normal' as PokemonType,
    level: 75,
    bossLevel: 75,
    maxHp: 6000,
    currentHp: 6000,
    attack: 150,
    defense: 90,
    speed: 95,
    difficultyMultiplier: 4,
    skills: [
      {
        id: 'dragon-pulse',
        name: '龍之波動',
        type: 'normal' as PokemonType,
        power: 85,
        accuracy: 100,
        description: '從大大的口中放出衝擊波',
      },
      {
        id: 'hyper-beam',
        name: '破壞光線',
        type: 'normal' as PokemonType,
        power: 150,
        accuracy: 90,
        description: '發射強烈的光線',
      },
    ],
    frontSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png',
    backSprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/384.png',
    specialAbilities: ['氣閘'],
  },
};

/**
 * 獲取隨機 Boss
 */
export const getRandomBoss = (): BossPokemon => {
  const bossKeys = Object.keys(BOSSES);
  const randomKey = bossKeys[Math.floor(Math.random() * bossKeys.length)];
  return { ...BOSSES[randomKey] };
};
```

---

## 開發測試工具

### 檔案：`src/components/DevPanel.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { generateMockPlayers } from '../data/mockPlayers';

const DevPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isVisible, setIsVisible] = useState(false);

  const addMockPlayer = () => {
    const newPlayers = generateMockPlayers(1);
    dispatch({ type: 'PLAYER_JOINED', player: newPlayers[0] });
  };

  const setPlayerCount = (count: number) => {
    // 重新生成指定數量的假玩家
    dispatch({ type: 'SET_MOCK_PLAYERS_COUNT', count });
  };

  const resetBattle = () => {
    dispatch({ type: 'END_BOSS_BATTLE', result: 'lose' });
  };

  return (
    <>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Text style={styles.toggleText}>🛠️</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.panel}>
            <Text style={styles.title}>開發者面板</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>玩家管理</Text>
              <TouchableOpacity style={styles.button} onPress={addMockPlayer}>
                <Text style={styles.buttonText}>➕ 新增假玩家</Text>
              </TouchableOpacity>

              <View style={styles.playerCountButtons}>
                {[1, 2, 3, 4, 5].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countButton,
                      state.mockPlayersCount === count && styles.countButtonActive,
                    ]}
                    onPress={() => setPlayerCount(count)}
                  >
                    <Text style={styles.countButtonText}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>戰鬥控制</Text>
              <TouchableOpacity style={styles.button} onPress={resetBattle}>
                <Text style={styles.buttonText}>🔄 重置戰鬥</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>狀態資訊</Text>
              <Text style={styles.info}>
                WebSocket: {state.websocketConnected ? '已連線' : '未連線'}
              </Text>
              <Text style={styles.info}>
                房間 ID: {state.roomId || '無'}
              </Text>
              <Text style={styles.info}>
                玩家數: {state.bossBattleState?.players.length || 0}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.closeButtonText}>關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 50,
    height: 50,
    backgroundColor: '#ffd700',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    backgroundColor: '#2d2d44',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  title: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4a5a9e',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerCountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  countButton: {
    backgroundColor: '#3d4663',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonActive: {
    backgroundColor: '#4ecca3',
  },
  countButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    color: '#ccc',
    fontSize: 12,
    marginVertical: 3,
  },
  closeButton: {
    backgroundColor: '#e94560',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DevPanel;
```

---

## 測試檢查清單

### 功能測試

- [ ] 畫面載入正確顯示
- [ ] Boss 在右側並放大 1.5-2 倍
- [ ] 所有玩家寶可夢並列顯示
- [ ] 當前玩家有邊框標示
- [ ] 技能冷卻倒數正確（5 秒）
- [ ] 冷卻中技能變灰
- [ ] 冷卻結束顯示 "Ready!"
- [ ] 攻擊觸發音效
- [ ] Boss HP 正確更新
- [ ] 戰鬥日誌正確記錄
- [ ] 勝利判定正確
- [ ] 離線玩家標示

### 整合測試

- [ ] 假玩家正確生成
- [ ] 可調整玩家數量（1-5 人）
- [ ] DevPanel 正常運作
- [ ] WebSocket 連接狀態顯示
- [ ] 音樂在戰鬥時播放
- [ ] 離開戰鬥返回地圖

### 性能測試

- [ ] 5 名玩家同時攻擊流暢度
- [ ] 冷卻計時準確性
- [ ] 戰鬥日誌不會過度增長
- [ ] 記憶體使用正常

---

## 部署檢查清單

### 前置條件

- [ ] 所有 TypeScript 類型正確
- [ ] 無 ESLint 錯誤
- [ ] 無 console.error 輸出

### 後端協作

- [ ] WebSocket 服務器地址確認
- [ ] API 端點確認
- [ ] 訊息格式雙方確認
- [ ] 測試環境可用

### 文檔完整性

- [ ] WebSocket 規格文檔完整
- [ ] API 規格文檔完整
- [ ] 程式碼註解完整
- [ ] README 更新

---

## 後續開發建議

1. **優先級 1：核心功能**
   - Boss 反擊機制
   - 屬性相剋計算
   - 經驗值和獎勵系統

2. **優先級 2：UI/UX**
   - 技能特效動畫
   - 勝利/失敗畫面優化
   - 更多 Boss 資料

3. **優先級 3：社交功能**
   - 房間列表
   - 邀請好友
   - 聊天系統

4. **優先級 4：進階功能**
   - 難度選擇
   - 排行榜
   - 成就系統

---

**文檔版本**: 1.0
**最後更新**: 2025-11-02
**負責人**: Frontend Team
**狀態**: 待實作