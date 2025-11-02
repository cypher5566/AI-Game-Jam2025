import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameProvider, useGame } from './src/contexts/GameContext';
import StartScreen from './src/screens/StartScreen';
import DialogueScreen from './src/screens/DialogueScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ErrorScreen from './src/screens/ErrorScreen';
import MapScreen from './src/screens/MapScreen';
import SkillSelectionScreen from './src/screens/SkillSelectionScreen';
import BattleScreen from './src/screens/BattleScreen';

// 遊戲主邏輯
function GameRouter() {
  const { state } = useGame();

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
}

// App 根組件
export default function App() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <GameRouter />
    </GameProvider>
  );
}
