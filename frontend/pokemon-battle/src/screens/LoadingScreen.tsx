import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { skillPreloader } from '../services/skillPreloader';

const LoadingScreen: React.FC = () => {
  const { dispatch } = useGame();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('正在載入招式...');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 淡入動畫
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 脈衝動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 開始載入
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      // 第一批
      setProgress(0);
      setLoadingText('正在載入第 1 批招式...');

      // 初始化會自動加載兩批
      await skillPreloader.initializeSkills('火');

      setProgress(50);
      setLoadingText('正在載入第 2 批招式...');

      // 等待一小段時間讓用戶看到進度
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);
      setLoadingText('載入完成！');

      // 淡出動畫
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // 載入完成，進入地圖
        dispatch({ type: 'SKILLS_LOADED' });
      });
    } catch (error) {
      console.error('載入技能失敗:', error);
      // 進入錯誤畫面
      dispatch({ type: 'SET_ERROR', message: '連線異常 請重啟遊戲' });
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* 背景漸層 */}
      <View style={styles.background} />

      {/* 載入內容 */}
      <View style={styles.content}>
        {/* 標題 */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.title}>準備中</Text>
        </Animated.View>

        {/* 載入指示器 */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
        </View>

        {/* 進度條 */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {/* 左下角載入狀態文字 */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{loadingText}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 40,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  loaderContainer: {
    marginBottom: 30,
  },
  progressBarContainer: {
    width: 300,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#ecf0f1',
    fontWeight: '600',
  },
});

export default LoadingScreen;
