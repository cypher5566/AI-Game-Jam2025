import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { useKeyboard } from '../hooks/useKeyboard';
import {
  MAP_LAYOUT,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  isWalkable,
  checkEncounter,
} from '../data/maps';
import { createPokemon } from '../data/pokemon';
import PlaceholderAsset from '../components/PlaceholderAsset';
import PreloadStatus from '../components/PreloadStatus';

const { width, height } = Dimensions.get('window');
const VIEWPORT_WIDTH = Math.min(width, 640);
const VIEWPORT_HEIGHT = Math.min(height - 100, 480);

const MapScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [playerPos, setPlayerPos] = useState(state.playerPosition);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [isMoving, setIsMoving] = useState(false);
  const encounterFlashAnim = useRef(new Animated.Value(0)).current;

  // 計算相機位置（讓玩家居中）
  const cameraX = Math.max(
    0,
    Math.min(
      playerPos.x * TILE_SIZE - VIEWPORT_WIDTH / 2 + TILE_SIZE / 2,
      MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH
    )
  );
  const cameraY = Math.max(
    0,
    Math.min(
      playerPos.y * TILE_SIZE - VIEWPORT_HEIGHT / 2 + TILE_SIZE / 2,
      MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT
    )
  );

  // 移動玩家
  const movePlayer = (dx: number, dy: number, newDirection: typeof direction) => {
    if (isMoving) return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    setDirection(newDirection);

    // 檢查是否可行走
    if (isWalkable(newX, newY)) {
      setIsMoving(true);
      setPlayerPos({ x: newX, y: newY });
      dispatch({ type: 'MOVE_PLAYER', position: { x: newX, y: newY } });

      setTimeout(() => {
        setIsMoving(false);

        // 檢查是否觸發遇敵
        if (checkEncounter(newX, newY)) {
          triggerEncounter();
        }
      }, 200);
    }
  };

  // 觸發遇敵
  const triggerEncounter = () => {
    // 遇敵閃爍效果
    Animated.sequence([
      Animated.timing(encounterFlashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(encounterFlashAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(encounterFlashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(encounterFlashAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 創建敵方寶可夢（隨機選擇）
      const enemyPokemon = createPokemon('squirtle', 5);
      // 進入技能選擇畫面（而不是直接開始戰鬥）
      dispatch({ type: 'START_SKILL_SELECTION', enemyPokemon });
    });
  };

  // 鍵盤控制
  useKeyboard((key) => {
    switch (key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        movePlayer(0, -1, 'up');
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        movePlayer(0, 1, 'down');
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        movePlayer(-1, 0, 'left');
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        movePlayer(1, 0, 'right');
        break;
      case ' ':
      case 'Spacebar':
        // 測試用：按空格鍵強制觸發戰鬥
        if (!isMoving) {
          triggerEncounter();
        }
        break;
    }
  });

  // 渲染磚塊
  const renderTile = (tileIndex: number, x: number, y: number) => {
    const tileColors = {
      0: '#7cb342', // 草地
      1: '#d4a373', // 路徑
      2: '#42a5f5', // 水域
      3: '#558b2f', // 樹
      4: '#8d6e63', // 建築
    };

    return (
      <View
        key={`${x}-${y}`}
        style={[
          styles.tile,
          {
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            backgroundColor: tileColors[tileIndex as keyof typeof tileColors],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 地圖視口 */}
      <View style={[styles.viewport, { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }]}>
        <View
          style={[
            styles.mapContainer,
            {
              transform: [{ translateX: -cameraX }, { translateY: -cameraY }],
            },
          ]}
        >
          {/* 渲染地圖磚塊 */}
          {MAP_LAYOUT.map((row, y) =>
            row.map((tile, x) => renderTile(tile, x, y))
          )}

          {/* 玩家角色 */}
          <View
            style={[
              styles.player,
              {
                left: playerPos.x * TILE_SIZE,
                top: playerPos.y * TILE_SIZE,
              },
            ]}
          >
            <PlaceholderAsset
              width={TILE_SIZE - 4}
              height={TILE_SIZE - 4}
              color="#FF6B6B"
              label="👤"
            />
          </View>
        </View>

        {/* 遇敵閃爍效果 */}
        <Animated.View
          style={[
            styles.encounterFlash,
            {
              opacity: encounterFlashAnim,
            },
          ]}
        />
      </View>

      {/* UI 資訊 */}
      <View style={styles.uiContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            位置: ({playerPos.x}, {playerPos.y})
          </Text>
          <Text style={styles.infoText}>方向: {direction}</Text>
        </View>

        <View style={styles.controlHint}>
          <Text style={styles.hintText}>使用 WASD 或方向鍵移動</Text>
          <Text style={styles.hintText}>在草地中行走可能遇到野生寶可夢！</Text>
          <Text style={styles.hintText}>按空格鍵立即觸發戰鬥（測試用）</Text>
        </View>
      </View>

      {/* 背景下載狀態 */}
      <PreloadStatus />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewport: {
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#3d5a80',
    borderRadius: 8,
  },
  mapContainer: {
    position: 'relative',
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE,
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  player: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  encounterFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 100,
  },
  uiContainer: {
    marginTop: 20,
    width: VIEWPORT_WIDTH,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 4,
  },
  controlHint: {
    backgroundColor: 'rgba(61, 90, 128, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    color: '#98c1d9',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default MapScreen;
