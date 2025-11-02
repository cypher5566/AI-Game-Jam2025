import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import PreloadStatus from '../components/PreloadStatus';

const { width, height } = Dimensions.get('window');

const StartScreen: React.FC = () => {
  const { dispatch } = useGame();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 標題淡入動畫
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 按鈕脈衝動畫
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
  }, []);

  const handleStart = () => {
    // 淡出後進入對話場景
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      dispatch({ type: 'SET_SCREEN', screen: 'dialogue' });
    });
  };

  return (
    <View style={styles.container}>
      {/* 背景漸層效果 */}
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* 主要內容 */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>POKEMON</Text>
          <Text style={styles.logoSubText}>對戰冒險</Text>
        </View>

        {/* 開始按鈕 */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>開始遊戲</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 提示文字 */}
        <Text style={styles.hintText}>按下開始鍵開始你的冒險！</Text>
      </Animated.View>

      {/* 裝飾元素 */}
      <View style={styles.decorations}>
        <View style={[styles.pokeball, styles.pokeball1]} />
        <View style={[styles.pokeball, styles.pokeball2]} />
        <View style={[styles.pokeball, styles.pokeball3]} />
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
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    flex: 1,
    backgroundColor: '#0f3460',
  },
  gradientBottom: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 80,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold' as const,
    color: '#ffde00',
    textShadowColor: '#3d5a80',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
    letterSpacing: 4,
  },
  logoSubText: {
    fontSize: 24,
    color: '#e94560',
    marginTop: 10,
    letterSpacing: 8,
  },
  startButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    boxShadow: '0px 4px 8px rgba(233, 69, 96, 0.6)',
    elevation: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hintText: {
    marginTop: 30,
    color: '#98c1d9',
    fontSize: 14,
    opacity: 0.7,
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  pokeball: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  pokeball1: {
    top: 50,
    left: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  pokeball2: {
    bottom: 100,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  pokeball3: {
    top: height * 0.4,
    left: width - 100,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default StartScreen;
