# 前端整合指南 - WebSocket 戰鬥系統

> 適用於 React Native + Expo 前端
>
> 後端 API: http://localhost:8000 (本地) / https://genpoke-production.up.railway.app (生產)

---

## 📋 目錄

1. [快速開始](#快速開始)
2. [WebSocket 連線](#websocket-連線)
3. [完整戰鬥流程](#完整戰鬥流程)
4. [訊息協議](#訊息協議)
5. [React Native 範例](#react-native-範例)
6. [常見問題](#常見問題)

---

## 🚀 快速開始

### 步驟 1: 創建房間 (REST API)

```javascript
const createRoom = async () => {
  const response = await fetch('http://localhost:8000/api/v1/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_players: 2,
      boss_base_hp: 500
    })
  });

  const data = await response.json();
  console.log('房間代碼:', data.room_code); // 例如: "ICUS7450"
  return data.room_code;
};
```

### 步驟 2: 連接 WebSocket

```javascript
const roomCode = "ICUS7450";
const pokemonId = "your-pokemon-uuid";
const playerName = "Trainer123";

const ws = new WebSocket(
  `ws://localhost:8000/api/v1/rooms/ws/${roomCode}?pokemon_id=${pokemonId}&player_name=${playerName}`
);

ws.onopen = () => {
  console.log('✅ 已連接到房間');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到訊息:', message);

  // 處理不同類型的訊息
  switch(message.type) {
    case 'welcome':
      console.log('歡迎訊息:', message.message);
      break;
    case 'room_update':
      console.log('房間狀態更新:', message.data);
      break;
    // ... 其他訊息類型
  }
};
```

---

## 🔌 WebSocket 連線

### 連線 URL 格式

```
ws://{HOST}/api/v1/rooms/ws/{room_code}?pokemon_id={id}&player_name={name}
```

**參數說明**:
- `{HOST}`:
  - 本地: `localhost:8000`
  - 生產: `genpoke-production.up.railway.app`
- `{room_code}`: 8 位房間代碼（例如: ICUS7450）
- `{pokemon_id}`: 你的 Pokemon ID（UUID）
- `{player_name}`: 玩家暱稱（預設: "Trainer"）

### React Native WebSocket 範例

```javascript
import { useEffect, useState, useRef } from 'react';

const useBattleRoom = (roomCode, pokemonId, playerName) => {
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:8000/api/v1/rooms/ws/${roomCode}?pokemon_id=${pokemonId}&player_name=${playerName}`
    );

    ws.onopen = () => {
      console.log('✅ WebSocket 已連接');
      setConnected(true);

      // 開始心跳
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30000); // 每 30 秒一次

      wsRef.current = { ws, heartbeat };
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket 錯誤:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket 已斷線');
      setConnected(false);
      if (wsRef.current?.heartbeat) {
        clearInterval(wsRef.current.heartbeat);
      }
    };

    return () => {
      if (wsRef.current?.heartbeat) {
        clearInterval(wsRef.current.heartbeat);
      }
      ws.close();
    };
  }, [roomCode, pokemonId, playerName]);

  const handleMessage = (message) => {
    switch (message.type) {
      case 'welcome':
        console.log('歡迎:', message.message);
        break;

      case 'room_update':
        setRoomState(message.data);
        break;

      case 'battle_action':
        setBattleLog(prev => [...prev, message.data]);
        break;

      // ... 其他訊息處理
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current?.ws?.readyState === WebSocket.OPEN) {
      wsRef.current.ws.send(JSON.stringify(message));
    }
  };

  return { connected, roomState, battleLog, sendMessage };
};
```

---

## 🎮 完整戰鬥流程

### 流程圖

```
1. 創建/加入房間
   ↓
2. 連接 WebSocket
   ↓
3. 等待其他玩家 (waiting 狀態)
   ↓
4. 玩家點擊「準備」
   ↓
5. 所有人準備 → 戰鬥開始 (battle 狀態)
   ↓
6. 開始第一回合 (30 秒計時器啟動)
   ↓
7. 玩家選擇技能 + 輸入 Prompt
   ↓
8. 提交行動
   ↓
9. 等待其他玩家提交 或 時間到
   ↓
10. 結算階段
    - 評分所有 Prompt (AI)
    - 計算所有傷害
    - 廣播攻擊結果
    - Boss 反擊
   ↓
11. 檢查勝負
    - Boss HP = 0 → 勝利 🎉
    - 全員 HP = 0 → 失敗 💀
    - 否則 → 回到步驟 6 (新回合)
```

### 代碼範例

```javascript
const BattleScreen = ({ roomCode, pokemonId, playerName }) => {
  const { connected, roomState, battleLog, sendMessage } = useBattleRoom(
    roomCode,
    pokemonId,
    playerName
  );

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [prompt, setPrompt] = useState('');

  // 1. 玩家準備
  const handleReady = () => {
    sendMessage({
      type: 'ready',
      is_ready: true
    });
  };

  // 2. 提交技能 + Prompt
  const handleSubmitAction = () => {
    if (!selectedSkill) {
      alert('請選擇技能！');
      return;
    }

    sendMessage({
      type: 'use_skill',
      skill_id: selectedSkill.id,
      prompt: prompt || '' // Prompt 可以為空（但會沒獎勵）
    });

    // 清空輸入
    setPrompt('');
    alert('行動已提交！');
  };

  return (
    <View>
      {/* 房間狀態 */}
      <Text>狀態: {roomState?.status}</Text>
      <Text>回合: {roomState?.current_turn}</Text>

      {/* 計時器 */}
      {roomState?.turn_timer?.is_active && (
        <Text>剩餘時間: {Math.floor(roomState.turn_timer.remaining_time)}s</Text>
      )}

      {/* Boss 狀態 */}
      <Text>Boss HP: {roomState?.boss?.hp} / {roomState?.boss?.max_hp}</Text>

      {/* 玩家列表 */}
      {roomState?.members?.map(member => (
        <View key={member.connection_id}>
          <Text>{member.player_name}</Text>
          <Text>HP: {member.current_hp} / {member.max_hp}</Text>
          <Text>{member.is_ready ? '✅ 準備' : '⏳ 等待中'}</Text>
        </View>
      ))}

      {/* 準備按鈕 (waiting 階段) */}
      {roomState?.status === 'waiting' && (
        <Button title="準備" onPress={handleReady} />
      )}

      {/* 戰鬥界面 (battle 階段) */}
      {roomState?.status === 'battle' && (
        <>
          {/* 技能選擇 */}
          <Text>選擇技能:</Text>
          {/* 這裡顯示技能列表，從 Pokemon 資料獲取 */}

          {/* Prompt 輸入 */}
          <TextInput
            placeholder="描述你的戰術... (可選，但能增加傷害！)"
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          {/* 提交按鈕 */}
          <Button
            title="提交行動"
            onPress={handleSubmitAction}
            disabled={!selectedSkill}
          />

          {/* 行動狀態 */}
          <Text>
            已提交: {roomState.pending_actions_count} / {roomState.current_players}
          </Text>
        </>
      )}

      {/* 戰鬥日誌 */}
      <ScrollView>
        {battleLog.map((log, index) => (
          <Text key={index}>
            {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};
```

---

## 📡 訊息協議

### 客戶端 → 伺服器

#### 1. 心跳
```json
{
  "type": "heartbeat"
}
```

#### 2. 準備
```json
{
  "type": "ready",
  "is_ready": true
}
```

#### 3. 使用技能
```json
{
  "type": "use_skill",
  "skill_id": 52,
  "prompt": "利用火焰的高溫特性，集中攻擊超夢的防禦弱點！"
}
```

**重要**:
- `skill_id`: 技能 ID (整數)
- `prompt`: 戰術描述 (字串)
  - 可以為空字串 `""`
  - 但會沒有 Prompt 獎勵 (0%)
  - 推薦至少 10-20 字的描述

#### 4. 聊天
```json
{
  "type": "chat",
  "message": "大家加油！"
}
```

---

### 伺服器 → 客戶端

#### 1. 歡迎訊息
```json
{
  "type": "welcome",
  "message": "歡迎加入房間 ICUS7450！",
  "room": { /* 房間完整資料 */ }
}
```

#### 2. 房間更新
```json
{
  "type": "room_update",
  "data": {
    "room_code": "ICUS7450",
    "status": "battle",
    "current_turn": 1,
    "members": [
      {
        "player_name": "Trainer123",
        "current_hp": 100,
        "max_hp": 100,
        "is_ready": true
      }
    ],
    "boss": {
      "hp": 450,
      "max_hp": 500
    },
    "turn_timer": {
      "remaining_time": 23.5,
      "duration": 30,
      "is_active": true
    },
    "pending_actions_count": 1,
    "all_actions_submitted": false
  }
}
```

#### 3. 行動已提交
```json
{
  "type": "action_submitted",
  "message": "行動已提交！"
}
```

#### 4. 回合計時器 (每秒)
```json
{
  "type": "turn_timer",
  "data": {
    "remaining_time": 23.5,
    "current_turn": 1,
    "pending_count": 2
  }
}
```

#### 5. 新回合開始
```json
{
  "type": "new_turn",
  "data": {
    "turn": 2,
    "boss_hp": 450,
    "boss_max_hp": 500
  }
}
```

#### 6. 戰鬥開始
```json
{
  "type": "battle_start",
  "message": "戰鬥開始！",
  "boss": {
    "name": "超夢",
    "type": "psychic",
    "hp": 500,
    "max_hp": 500
  },
  "room": { /* 房間資料 */ }
}
```

#### 7. 戰鬥動作
```json
{
  "type": "battle_action",
  "data": {
    "actor": "Trainer123",
    "action": "attack",
    "skill": "火焰放射",
    "prompt": "利用火焰的高溫...",
    "prompt_score": 30,
    "damage": 139,
    "boss_hp": 361,
    "boss_max_hp": 500,
    "effectiveness": 0.25,
    "message": "Trainer123 使用了火焰放射！效果絕佳！(Prompt獎勵: 30%)"
  }
}
```

**重要欄位**:
- `prompt_score`: Prompt 得分 (0-50)
- `damage`: 實際造成的傷害
- `boss_hp`: Boss 剩餘 HP
- `effectiveness`: 屬性相剋倍率

#### 8. 戰鬥結束
```json
// 勝利
{
  "type": "battle_end",
  "result": "win",
  "message": "🎉 恭喜！Boss 被擊敗了！"
}

// 失敗
{
  "type": "battle_end",
  "result": "lose",
  "message": "💀 全軍覆沒！挑戰失敗..."
}
```

#### 9. 錯誤訊息
```json
{
  "type": "error",
  "message": "戰鬥尚未開始"
}
```

---

## 🎯 React Native 完整範例

### 使用 Context 管理 WebSocket

```javascript
// BattleContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const BattleContext = createContext();

export const BattleProvider = ({ children, roomCode, pokemonId, playerName }) => {
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:8000/api/v1/rooms/ws/${roomCode}?pokemon_id=${pokemonId}&player_name=${playerName}`
    );

    ws.onopen = () => {
      console.log('✅ WebSocket 已連接');
      setConnected(true);
      setError(null);

      // 心跳
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'welcome':
          console.log('歡迎:', message.message);
          break;

        case 'room_update':
          setRoomState(message.data);
          break;

        case 'battle_start':
          console.log('戰鬥開始！');
          setRoomState(message.room);
          break;

        case 'turn_timer':
          // 更新計時器
          setRoomState(prev => ({
            ...prev,
            turn_timer: {
              ...prev.turn_timer,
              remaining_time: message.data.remaining_time
            }
          }));
          break;

        case 'new_turn':
          console.log('新回合:', message.data.turn);
          setBattleLog(prev => [
            ...prev,
            { type: 'system', text: `--- 回合 ${message.data.turn} ---` }
          ]);
          break;

        case 'battle_action':
          setBattleLog(prev => [...prev, {
            type: 'action',
            ...message.data
          }]);
          break;

        case 'battle_end':
          console.log('戰鬥結束:', message.result);
          setBattleLog(prev => [
            ...prev,
            { type: 'result', result: message.result, text: message.message }
          ]);
          break;

        case 'action_submitted':
          console.log('行動已提交');
          break;

        case 'error':
          setError(message.message);
          break;

        case 'heartbeat_ack':
          // 心跳回應
          break;

        default:
          console.log('未知訊息類型:', message.type);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket 錯誤:', error);
      setError('連線錯誤');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket 已斷線');
      setConnected(false);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };

    wsRef.current = ws;

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      ws.close();
    };
  }, [roomCode, pokemonId, playerName]);

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket 未連接');
    }
  };

  const setReady = () => {
    sendMessage({ type: 'ready', is_ready: true });
  };

  const useSkill = (skillId, prompt = '') => {
    sendMessage({
      type: 'use_skill',
      skill_id: skillId,
      prompt: prompt
    });
  };

  const sendChat = (text) => {
    sendMessage({ type: 'chat', message: text });
  };

  return (
    <BattleContext.Provider
      value={{
        connected,
        roomState,
        battleLog,
        error,
        setReady,
        useSkill,
        sendChat
      }}
    >
      {children}
    </BattleContext.Provider>
  );
};

export const useBattle = () => useContext(BattleContext);
```

### 使用範例

```javascript
// BattleScreen.js
import { useBattle } from './BattleContext';

const BattleScreen = () => {
  const { connected, roomState, battleLog, setReady, useSkill } = useBattle();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [prompt, setPrompt] = useState('');

  if (!connected) {
    return <Text>正在連接...</Text>;
  }

  const handleSubmit = () => {
    if (selectedSkill) {
      useSkill(selectedSkill.id, prompt);
      setPrompt('');
    }
  };

  return (
    <View>
      <Text>狀態: {roomState?.status}</Text>

      {roomState?.status === 'waiting' && (
        <Button title="準備" onPress={setReady} />
      )}

      {roomState?.status === 'battle' && (
        <>
          <Text>回合 {roomState.current_turn}</Text>
          <Text>剩餘時間: {Math.floor(roomState.turn_timer?.remaining_time || 0)}s</Text>

          {/* 技能選擇 */}
          <SkillSelector onSelect={setSelectedSkill} />

          {/* Prompt 輸入 */}
          <TextInput
            placeholder="描述戰術策略..."
            value={prompt}
            onChangeText={setPrompt}
          />

          <Button title="提交" onPress={handleSubmit} />
        </>
      )}

      {/* 戰鬥日誌 */}
      <ScrollView>
        {battleLog.map((log, i) => (
          <Text key={i}>{log.message || log.text}</Text>
        ))}
      </ScrollView>
    </View>
  );
};
```

---

## ❓ 常見問題

### Q1: Prompt 一定要寫嗎？
**A**: 不一定，但強烈建議寫！
- 不寫 → 0% 獎勵
- 隨便寫幾個字 → 10% 獎勵
- 認真寫戰術 → 20-50% 獎勵

**公式**: `傷害 = 威力 × (1 + 屬性倍率 + Prompt倍率)`

例如：
- 90 威力，火剋草 (+25%)，無 Prompt (0%)
  - `90 × (1 + 0.25 + 0) = 112.5`
- 90 威力，火剋草 (+25%)，好 Prompt (30%)
  - `90 × (1 + 0.25 + 0.3) = 139.5`

差距: **27 點傷害**！

### Q2: 超時會怎樣？
**A**: 自動使用該屬性的第一個技能，Prompt 獎勵 0%

### Q3: 計時器什麼時候開始？
**A**: 戰鬥開始 (`battle_start`) 後立即開始第一回合的 30 秒倒數

### Q4: 可以改變已提交的行動嗎？
**A**: 不行，提交後無法修改。請確認後再提交！

### Q5: 如何知道其他玩家是否已提交？
**A**: 查看 `room_update` 的 `pending_actions_count` 和 `all_actions_submitted`

### Q6: Boss 是什麼屬性？
**A**: 從 `battle_start` 訊息中的 `boss.type` 可以得知

### Q7: 如何測試 WebSocket？
**A**: 可以使用以下工具：
- **Postman** (支援 WebSocket)
- **wscat** (命令列工具)
```bash
npm install -g wscat
wscat -c "ws://localhost:8000/api/v1/rooms/ws/ICUS7450?pokemon_id=test&player_name=TestPlayer"
```

### Q8: 生產環境 URL？
**A**:
- REST API: `https://genpoke-production.up.railway.app`
- WebSocket: `wss://genpoke-production.up.railway.app` (注意是 **wss** 不是 ws)

---

## 🎮 Prompt 寫作建議

### 好的 Prompt 範例 (30-50% 獎勵)

**火系技能**:
> "利用火焰的高溫特性，集中攻擊超夢的防禦弱點，同時隊友從側翼牽制！"

**水系技能**:
> "召喚強力水流沖擊，利用環境中的水池增幅威力，瞄準超夢的能量核心！"

**電系技能**:
> "釋放高壓電流麻痺超夢的行動，配合雷暴天氣加成，趁機造成最大傷害！"

### 普通 Prompt (10-20% 獎勵)

> "使用火焰放射攻擊"
> "打他！"
> "火焰很強"

### 差勁 Prompt (0% 獎勵)

> "" (空白)
> "a"
> "攻擊"

---

## 📚 相關文件

- 完整實作文檔: `BATTLE_SYSTEM_IMPLEMENTATION.md`
- Swagger API 文檔: http://localhost:8000/docs
- ReDoc API 文檔: http://localhost:8000/redoc

---

## 🆘 需要幫助？

如果遇到問題：
1. 檢查 WebSocket 連線狀態
2. 查看瀏覽器 console 的錯誤訊息
3. 確認後端伺服器正在運行
4. 檢查 Pokemon ID 是否正確

**後端開發者**: cypher
**建立日期**: 2025-11-02
**版本**: 1.0
