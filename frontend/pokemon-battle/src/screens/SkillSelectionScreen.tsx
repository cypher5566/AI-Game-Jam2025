import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { Skill } from '../types';
import { fetchPokemonMoves } from '../services/pokemonMovesAPI';
import PreloadStatus from '../components/PreloadStatus';

const { width, height } = Dimensions.get('window');

const SkillSelectionScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [currentRound, setCurrentRound] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // 卡牌動畫
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getSkillsForRound = (round: number): Skill[] => {
    if (!state.fetchedMoves || state.fetchedMoves.length < 12) return [];
    const startIndex = (round - 1) * 3;
    return state.fetchedMoves.slice(startIndex, startIndex + 3);
  };

  const currentSkills = getSkillsForRound(currentRound);

  // 初始化：技能已從緩衝池載入
  useEffect(() => {
    // 技能已經從緩衝池載入到 state.fetchedMoves
    if (state.fetchedMoves && state.fetchedMoves.length >= 12) {
      setIsLoading(false);
    } else {
      // 如果沒有技能，顯示錯誤
      setError('技能載入失敗，請重試');
      setIsLoading(false);
    }
  }, []);

  // 卡牌進場動畫
  useEffect(() => {
    if (currentSkills.length === 3) {
      // 重置動畫
      cardAnims.forEach(anim => anim.setValue(0));
      fadeAnim.setValue(0);

      // 背景淡入
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 卡牌依序飛入
      Animated.stagger(
        150,
        cardAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [currentRound, currentSkills]);

  // 處理技能選擇
  const handleSkillSelect = (skill: Skill, index: number) => {
    // 防止重複選擇
    if (isSelecting) return;

    setIsSelecting(true);
    setHoveredCard(null); // 清除懸停狀態

    // 選中的卡牌放大並淡出
    Animated.parallel([
      Animated.spring(cardAnims[index], {
        toValue: 1.2,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newSelected = [...selectedSkills, skill];
      setSelectedSkills(newSelected);
      setIsSelecting(false); // 先重置狀態

      // 延遲切換到下一輪，確保動畫不衝突
      setTimeout(() => {
        if (currentRound < 4) {
          setCurrentRound(currentRound + 1);
        } else {
          dispatch({ type: 'SET_SELECTED_SKILLS', skills: newSelected });
          dispatch({ type: 'START_BATTLE' });
        }
      }, 100);
    });
  };

  const getDialogueText = (): string => {
    const nickname = state.pokemonNickname || '小火龍';
    switch (currentRound) {
      case 1:
        return `選擇${nickname}的第 1 個技能`;
      case 2:
        return `選擇${nickname}的第 2 個技能`;
      case 3:
        return `選擇${nickname}的第 3 個技能`;
      case 4:
        return `選擇${nickname}的第 4 個技能`;
      default:
        return '';
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>正在載入招式...</Text>
        </View>
      </View>
    );
  }

  // 載入失敗
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              fetchPokemonMoves('火')
                .then(moves => {
                  dispatch({ type: 'SET_FETCHED_MOVES', moves });
                  setIsLoading(false);
                })
                .catch(() => {
                  setError('招式載入失敗，請重試');
                  setIsLoading(false);
                });
            }}
          >
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 暗化背景 */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

      {/* 標題文字 */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{getDialogueText()}</Text>
        <Text style={styles.subtitle}>已選擇 {selectedSkills.length} / 4</Text>
      </Animated.View>

      {/* 三張卡牌 */}
      <View style={styles.cardsContainer}>
        {currentSkills.map((skill, index) => {
          const isHovered = hoveredCard === index;
          const cardAnim = cardAnims[index];

          return (
            <Animated.View
              key={skill.id}
              style={[
                styles.cardWrapper,
                {
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [200, 0],
                      }),
                    },
                    {
                      scale: cardAnim.interpolate({
                        inputRange: [0, 1, 1.2],
                        outputRange: [0.8, (isHovered && !isSelecting) ? 1.05 : 1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    borderColor: getTypeColor(skill.type),
                    shadowColor: getTypeColor(skill.type),
                  },
                ]}
                onPress={() => handleSkillSelect(skill, index)}
                onPressIn={() => !isSelecting && setHoveredCard(index)}
                onPressOut={() => setHoveredCard(null)}
                activeOpacity={isSelecting ? 1 : 0.9}
              >
                {/* 卡牌頂部色條 */}
                <View style={[styles.cardHeader, { backgroundColor: getTypeColor(skill.type) }]} pointerEvents="none" />

                {/* 卡牌內容 */}
                <View style={styles.cardBody} pointerEvents="none">
                  {/* 技能名稱 */}
                  <Text style={styles.cardTitle}>{skill.name}</Text>

                  {/* 屬性標籤 */}
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(skill.type) }]} pointerEvents="none">
                    <Text style={styles.typeText}>{getTypeText(skill.type)}</Text>
                  </View>

                  {/* 威力區域 */}
                  <View style={styles.powerContainer} pointerEvents="none">
                    <Text style={styles.powerLabel}>威力</Text>
                    <Text style={[styles.powerValue, { color: getTypeColor(skill.type) }]}>{skill.power}</Text>
                  </View>

                  {/* 分隔線 */}
                  <View style={styles.divider} pointerEvents="none" />

                  {/* 技能說明 */}
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {skill.description}
                  </Text>

                  {/* 命中率 */}
                  <View style={styles.accuracyContainer} pointerEvents="none">
                    <Text style={styles.accuracyText}>命中率: {skill.accuracy}%</Text>
                  </View>
                </View>

                {/* 選擇按鈕 */}
                <View style={[styles.selectButton, { backgroundColor: getTypeColor(skill.type) }]} pointerEvents="none">
                  <Text style={styles.selectButtonText}>選擇</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* 已學習技能列表 */}
      {selectedSkills.length > 0 && (
        <Animated.View style={[styles.learnedSkillsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.learnedSkillsTitle}>已學習技能</Text>
          <View style={styles.learnedSkillsList}>
            {selectedSkills.map((skill, index) => (
              <View
                key={skill.id}
                style={[styles.learnedSkillItem, { backgroundColor: getTypeColor(skill.type) }]}
              >
                <Text style={styles.learnedSkillName}>{skill.name}</Text>
                <Text style={styles.learnedSkillPower}>威力 {skill.power}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* 進度指示器 */}
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        {[1, 2, 3, 4].map(round => (
          <View
            key={round}
            style={[
              styles.progressDot,
              round <= selectedSkills.length && styles.progressDotCompleted,
              round === currentRound && styles.progressDotActive,
            ]}
          >
            {round <= selectedSkills.length && (
              <Text style={styles.progressDotText}>✓</Text>
            )}
          </View>
        ))}
      </Animated.View>

      {/* 背景下載狀態 */}
      <PreloadStatus />
    </View>
  );
};

// 取得屬性顏色
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'fire':
      return '#ff6b35';
    case 'water':
      return '#4a90e2';
    case 'electric':
      return '#f7b731';
    case 'grass':
      return '#26de81';
    default:
      return '#95a5a6';
  }
};

// 取得屬性中文
const getTypeText = (type: string): string => {
  switch (type) {
    case 'fire':
      return '火';
    case 'water':
      return '水';
    case 'electric':
      return '電';
    case 'grass':
      return '草';
    default:
      return '一般';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ecf0f1',
    fontWeight: '600',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  cardWrapper: {
    width: width > 900 ? 280 : width > 600 ? 220 : 180,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 3,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    height: 8,
    width: '100%',
  },
  cardBody: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  powerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  powerLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '600',
  },
  powerValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#ecf0f1',
    marginVertical: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 60,
  },
  accuracyContainer: {
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  selectButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  learnedSkillsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  learnedSkillsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  learnedSkillsList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  learnedSkillItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  learnedSkillName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  learnedSkillPower: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
  },
  progressDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  progressDotActive: {
    backgroundColor: '#ffd700',
    borderColor: '#f39c12',
    transform: [{ scale: 1.2 }],
  },
  progressDotText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#ffd700',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SkillSelectionScreen;
