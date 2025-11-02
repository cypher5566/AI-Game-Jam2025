import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameProvider, useGame } from './src/contexts/GameContext';
import StartScreen from './src/screens/StartScreen';
import DialogueScreen from './src/screens/DialogueScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ErrorScreen from './src/screens/ErrorScreen';
import MapScreen from './src/screens/MapScreen';
import SkillSelectionScreen from './src/screens/SkillSelectionScreen';
import BattleScreen from './src/screens/BattleScreen';
import { musicManager } from './src/services/MusicManager';

// 遊戲主邏輯
function GameRouter() {
  const { state } = useGame();

  // 根據當前畫面切換音樂
  useEffect(() => {
    const handleMusicChange = async () => {
      try {
        switch (state.currentScreen) {
          case 'battle':
            // 進入戰鬥時播放戰鬥音樂（每次從頭開始）
            await musicManager.playBattleMusic();
            break;
          case 'start':
          case 'dialogue':
          case 'map':
          case 'skillSelection':
          case 'loading':
            // 其他畫面播放探索音樂（不中斷）
            await musicManager.playOverworldMusic();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('音樂切換失敗:', error);
      }
    };

    handleMusicChange();
  }, [state.currentScreen]);

  // 取得當前主畫面
  const getCurrentScreen = () => {
    switch (state.currentScreen) {
      case 'start':
        return <StartScreen />;
      case 'dialogue':
        return <DialogueScreen />;
      case 'loading':
        return <LoadingScreen />;
      case 'error':
        return <ErrorScreen />;
      case 'map':
        return <MapScreen />;
      case 'skillSelection':
        return <SkillSelectionScreen />;
      case 'battle':
        return <BattleScreen />;
      default:
        return <StartScreen />;
    }
  };

  return getCurrentScreen();
}

// App 根組件
export default function App() {
  // 初始化音樂系統
  useEffect(() => {
    const initMusic = async () => {
      try {
        await musicManager.initialize();
        console.log('🎵 音樂系統已啟動');
      } catch (error) {
        console.error('音樂系統初始化失敗:', error);
      }
    };

    initMusic();

    // 清理函數
    return () => {
      musicManager.cleanup();
    };
  }, []);

  return (
    <GameProvider>
      <StatusBar style="light" />
      <GameRouter />
    </GameProvider>
  );
}
