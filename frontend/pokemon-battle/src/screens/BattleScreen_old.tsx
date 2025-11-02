import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import PokemonSprite from '../components/PokemonSprite';
import HPBar from '../components/HPBar';
import { Pokemon, Skill } from '../types';

const { width, height } = Dimensions.get('window');

const BattleScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const battleState = state.battleState;

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [isPlayerTakingDamage, setIsPlayerTakingDamage] = useState(false);
  const [isEnemyTakingDamage, setIsEnemyTakingDamage] = useState(false);
  const [damageNumber, setDamageNumber] = useState<number | null>(null);
  const [damagePosition, setDamagePosition] = useState<'player' | 'enemy' | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  const damageAnim = useRef(new Animated.Value(0)).current;
  const bgFlashAnim = useRef(new Animated.Value(0)).current;

  // 進場動畫
  const enemySlideAnim = useRef(new Animated.Value(-200)).current;
  const playerSlideAnim = useRef(new Animated.Value(200)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const vsTextAnim = useRef(new Animated.Value(0)).current;
  const vsTextScale = useRef(new Animated.Value(0)).current;

  if (!battleState) return null;

  const { playerPokemon, enemyPokemon, turn, isAnimating } = battleState;

  // 進場動畫效果
  useEffect(() => {
    // 開始進場動畫序列
    Animated.sequence([
      // 1. 螢幕淡入
      Animated.timing(screenFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 2. VS 文字出現
      Animated.parallel([
        Animated.timing(vsTextAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(vsTextScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 3. VS 文字消失，寶可夢滑入
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(vsTextAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(enemySlideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(playerSlideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // 動畫完成，顯示開始訊息
          setBattleStarted(true);
          addLog(`野生的${enemyPokemon.name}出現了！`);
          addLog(`上吧！${playerPokemon.name}！`);
        });
      }, 800);
    });
  }, []);

  // 添加戰鬥日誌
  const addLog = (message: string) => {
    setBattleLog((prev) => [...prev, message].slice(-5)); // 只保留最後5條
  };

  // 計算傷害（簡化版，實際應該調用 API）
  const calculateDamage = (
    attacker: Pokemon,
    defender: Pokemon,
    skill: Skill
  ): number => {
    // 簡化的傷害計算公式
    const baseDamage = skill.power;
    const attackRatio = attacker.attack / defender.defense;
    const damage = Math.floor(baseDamage * attackRatio * 0.5);
    return Math.max(1, damage);
  };

  // 顯示傷害數字動畫
  const showDamage = (damage: number, position: 'player' | 'enemy') => {
    setDamageNumber(damage);
    setDamagePosition(position);
    damageAnim.setValue(0);

    Animated.sequence([
      Animated.timing(damageAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(damageAnim, {
        toValue: 0,
        duration: 300,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDamageNumber(null);
      setDamagePosition(null);
    });
  };

  // 玩家使用技能
  const useSkill = useCallback((skill: Skill) => {
    console.log('useSkill called', { skill: skill.name, isAnimating, turn, battleStarted });

    if (!battleStarted || isAnimating || turn !== 'player') {
      console.log('useSkill blocked:', { battleStarted, isAnimating, turn });
      return;
    }

    console.log('useSkill executing');
    dispatch({ type: 'UPDATE_BATTLE', battleState: { isAnimating: true } });
    setSelectedSkill(skill);
    addLog(`${playerPokemon.name}使用了${skill.name}！`);

    // 攻擊動畫
    setIsPlayerAttacking(true);
    setTimeout(() => setIsPlayerAttacking(false), 400);

    // 受擊動畫
    setTimeout(() => {
      setIsEnemyTakingDamage(true);

      // 計算傷害
      const damage = calculateDamage(playerPokemon, enemyPokemon, skill);
      const newHp = Math.max(0, enemyPokemon.currentHp - damage);

      // 顯示傷害數字
      showDamage(damage, 'enemy');

      // 背景閃爍
      Animated.sequence([
        Animated.timing(bgFlashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bgFlashAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => setIsEnemyTakingDamage(false), 200);

      // 更新敵方 HP
      dispatch({
        type: 'UPDATE_BATTLE',
        battleState: {
          enemyPokemon: { ...enemyPokemon, currentHp: newHp },
        },
      });

      // 檢查戰鬥是否結束
      if (newHp <= 0) {
        setTimeout(() => {
          addLog(`${enemyPokemon.name}失去戰鬥能力了！`);
          addLog('你贏得了戰鬥！');
          setTimeout(() => {
            dispatch({ type: 'END_BATTLE', result: 'win' });
          }, 2000);
        }, 500);
      } else {
        // 敵方回合
        setTimeout(() => {
          enemyTurn();
        }, 1000);
      }
    }, 600);
  }, [battleStarted, isAnimating, turn, playerPokemon, enemyPokemon, dispatch]);

  // 敵方回合
  const enemyTurn = useCallback(() => {
    dispatch({
      type: 'UPDATE_BATTLE',
      battleState: { turn: 'enemy', isAnimating: true },
    });

    // 隨機選擇技能
    const randomSkill =
      enemyPokemon.skills[Math.floor(Math.random() * enemyPokemon.skills.length)];

    addLog(`${enemyPokemon.name}使用了${randomSkill.name}！`);

    // 攻擊動畫
    setIsEnemyAttacking(true);
    setTimeout(() => setIsEnemyAttacking(false), 400);

    setTimeout(() => {
      setIsPlayerTakingDamage(true);

      // 計算傷害
      const damage = calculateDamage(enemyPokemon, playerPokemon, randomSkill);
      const newHp = Math.max(0, playerPokemon.currentHp - damage);

      // 顯示傷害數字
      showDamage(damage, 'player');

      // 背景閃爍
      Animated.sequence([
        Animated.timing(bgFlashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bgFlashAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => setIsPlayerTakingDamage(false), 200);

      // 更新玩家 HP
      const updatedPlayerPokemon = { ...playerPokemon, currentHp: newHp };
      dispatch({
        type: 'UPDATE_BATTLE',
        battleState: {
          playerPokemon: updatedPlayerPokemon,
          turn: 'player',
          isAnimating: false,
        },
      });

      // 更新全局玩家寶可夢狀態
      const updatedPokemonList = [...state.playerPokemon];
      updatedPokemonList[0] = updatedPlayerPokemon;

      // 檢查戰鬥是否結束
      if (newHp <= 0) {
        setTimeout(() => {
          addLog(`${playerPokemon.name}失去戰鬥能力了！`);
          addLog('你輸掉了戰鬥...');
          setTimeout(() => {
            dispatch({ type: 'END_BATTLE', result: 'lose' });
          }, 2000);
        }, 500);
      }
    }, 600);
  }, [enemyPokemon, playerPokemon, state.playerPokemon, dispatch]);

  return (
    <View style={styles.container}>
      {/* 背景閃爍效果 */}
      <Animated.View
        style={[
          styles.flashOverlay,
          { opacity: bgFlashAnim },
        ]}
      />

      {/* 背景 */}
      <View style={styles.background}>
        <View style={styles.grassFloor} />
      </View>

      {/* VS 文字（進場動畫） */}
      <Animated.View
        style={[
          styles.vsContainer,
          {
            opacity: vsTextAnim,
            transform: [{ scale: vsTextScale }],
          },
        ]}
      >
        <Text style={styles.vsText}>VS</Text>
      </Animated.View>

      {/* 敵方寶可夢 */}
      <Animated.View
        style={[
          styles.enemySection,
          {
            transform: [{ translateX: enemySlideAnim }],
          },
        ]}
      >
        <View style={styles.pokemonInfo}>
          <Text style={styles.pokemonName}>{enemyPokemon.name}</Text>
          <Text style={styles.level}>Lv.{enemyPokemon.level}</Text>
          <HPBar currentHp={enemyPokemon.currentHp} maxHp={enemyPokemon.maxHp} />
        </View>
        <View style={styles.enemyPokemonContainer}>
          <PokemonSprite
            pokemon={enemyPokemon}
            isEnemy
            isAttacking={isEnemyAttacking}
            isTakingDamage={isEnemyTakingDamage}
          />
          {/* 敵方傷害數字 */}
          {damageNumber && damagePosition === 'enemy' && (
            <Animated.View
              style={[
                styles.damageNumber,
                styles.enemyDamageNumber,
                {
                  opacity: damageAnim,
                  transform: [
                    {
                      translateY: damageAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -50],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.damageText}>-{damageNumber}</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* 玩家寶可夢 */}
      <Animated.View
        style={[
          styles.playerSection,
          {
            transform: [{ translateX: playerSlideAnim }],
          },
        ]}
      >
        <View style={styles.playerPokemonContainer}>
          <PokemonSprite
            pokemon={playerPokemon}
            isAttacking={isPlayerAttacking}
            isTakingDamage={isPlayerTakingDamage}
          />
          {/* 玩家傷害數字 */}
          {damageNumber && damagePosition === 'player' && (
            <Animated.View
              style={[
                styles.damageNumber,
                styles.playerDamageNumber,
                {
                  opacity: damageAnim,
                  transform: [
                    {
                      translateY: damageAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -50],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.damageText}>-{damageNumber}</Text>
            </Animated.View>
          )}
        </View>
        <View style={styles.pokemonInfo}>
          <Text style={styles.pokemonName}>{playerPokemon.name}</Text>
          <Text style={styles.level}>Lv.{playerPokemon.level}</Text>
          <HPBar currentHp={playerPokemon.currentHp} maxHp={playerPokemon.maxHp} />
        </View>
      </Animated.View>

      {/* 戰鬥日誌 */}
      <View style={styles.battleLog}>
        {battleLog.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>

      {/* 技能選單 */}
      <View style={styles.skillMenu}>
        <Text style={styles.menuTitle}>選擇技能</Text>
        <View style={styles.skillGrid}>
          {playerPokemon.skills.map((skill) => (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.skillButton,
                isAnimating && styles.skillButtonDisabled,
              ]}
              onPress={() => useSkill(skill)}
              disabled={isAnimating || turn !== 'player'}
            >
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillType}>{skill.type}</Text>
              <Text style={styles.skillPower}>威力: {skill.power}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 回合指示 */}
      <View style={styles.turnIndicator}>
        <Text style={styles.turnText}>
          {turn === 'player' ? '你的回合' : '對手的回合'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87ceeb',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  grassFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#7cb342',
  },
  vsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  vsText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#ffde00',
    textShadowColor: '#000',
    textShadowOffset: { width: 6, height: 6 },
    textShadowRadius: 0,
    letterSpacing: 20,
  },
  enemySection: {
    position: 'absolute',
    top: 60,
    right: 40,
    alignItems: 'flex-end',
  },
  enemyPokemonContainer: {
    marginTop: 20,
  },
  playerSection: {
    position: 'absolute',
    bottom: 200,
    left: 40,
    alignItems: 'flex-start',
  },
  playerPokemonContainer: {
    marginBottom: 20,
  },
  pokemonInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  pokemonName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  level: {
    fontSize: 14,
    color: '#ffde00',
    marginBottom: 8,
  },
  battleLog: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
    maxWidth: 300,
  },
  logText: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 4,
  },
  skillMenu: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  skillButtonDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.5,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  skillType: {
    fontSize: 12,
    color: '#ecf0f1',
    marginBottom: 4,
  },
  skillPower: {
    fontSize: 12,
    color: '#ffde00',
  },
  turnIndicator: {
    position: 'absolute',
    top: height * 0.45,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  damageNumber: {
    position: 'absolute',
  },
  enemyDamageNumber: {
    top: 40,
    right: 40,
  },
  playerDamageNumber: {
    top: 40,
    left: 40,
  },
  damageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f44336',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});

export default BattleScreen;
