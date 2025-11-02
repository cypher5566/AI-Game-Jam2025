import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import PreloadStatus from '../components/PreloadStatus';

const ErrorScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 淡入動畫
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 震動動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const handleRestart = () => {
    // 重新載入頁面（重啟遊戲）
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      // React Native 環境
      dispatch({ type: 'SET_SCREEN', screen: 'start' });
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* 背景 */}
      <View style={styles.background} />

      {/* 錯誤內容 */}
      <View style={styles.content}>
        {/* 錯誤圖示 */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <Text style={styles.icon}>⚠️</Text>
        </Animated.View>

        {/* 錯誤標題 */}
        <Text style={styles.title}>連線異常</Text>

        {/* 錯誤訊息 */}
        <Text style={styles.message}>
          {state.errorMessage || '連線異常 請重啟遊戲'}
        </Text>

        {/* 重啟按鈕 */}
        <TouchableOpacity
          style={styles.restartButton}
          onPress={handleRestart}
          activeOpacity={0.8}
        >
          <Text style={styles.restartButtonText}>重啟遊戲</Text>
        </TouchableOpacity>

        {/* 提示文字 */}
        <Text style={styles.hintText}>
          請確認網路連線後重新啟動遊戲
        </Text>
      </View>

      {/* 背景下載狀態 */}
      <PreloadStatus />
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
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
    textShadowColor: 'rgba(231, 76, 60, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  message: {
    fontSize: 20,
    color: '#ecf0f1',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 28,
  },
  restartButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  restartButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  hintText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ErrorScreen;
