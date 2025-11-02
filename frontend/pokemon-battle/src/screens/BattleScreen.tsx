import React, { useState, useRef, useEffect } from 'react';
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
import PreloadStatus from '../components/PreloadStatus';
import { Pokemon, Skill } from '../types';
import { musicManager } from '../services/MusicManager';
import { useTimer } from '../hooks/useCooldown';
import { createBoss } from '../data/bossData';
import { calculateDamage as apiCalculateDamage } from '../services/battleAPI';

const { width, height } = Dimensions.get('window');

const TURN_TIME_LIMIT = 30000; // 30 秒

const BattleScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  // 敵人狀態（可能是一般敵人或 Boss）
  const [enemy, setEnemy] = useState<Pokemon>(
    state.battleState?.enemyPokemon || createBoss('snorlax')
  );

  // 玩家寶可夢
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon>(state.playerPokemon[0]);

  // 玩家選擇狀態
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [playerHasSelected, setPlayerHasSelected] = useState(false);

  // 回合狀態
  const [turnNumber, setTurnNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // 原有動畫和視覺狀態
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [isPlayerTakingDamage, setIsPlayerTakingDamage] = useState(false);
  const [isEnemyTakingDamage, setIsEnemyTakingDamage] = useState(false);
  const [damageNumber, setDamageNumber] = useState<number | null>(null);
  const [damagePosition, setDamagePosition] = useState<'player' | 'enemy' | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  // 原有動畫引用
  const damageAnim = useRef(new Animated.Value(0)).current;
  const bgFlashAnim = useRef(new Animated.Value(0)).current;
  const enemySlideAnim = useRef(new Animated.Value(-200)).current;
  const playerSlideAnim = useRef(new Animated.Value(200)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const vsTextAnim = useRef(new Animated.Value(0)).current;
  const vsTextScale = useRef(new Animated.Value(0)).current;

  // 限時計時器
  const timer = useTimer(TURN_TIME_LIMIT, handleTurnTimeout, false);

  // 初始化戰鬥
  useEffect(() => {
    // 開始進場動畫
    startEntryAnimation();
  }, []);

  // 進場動畫效果 (保留原有)
  const startEntryAnimation = () => {
    Animated.sequence([
      Animated.timing(screenFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
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
          setBattleStarted(true);
          addLog(`BOSS ${boss.name} 出現了！`);
          addLog(`冒險者們，準備戰鬥！`);
          // 開始第一回合
          startNewTurn();
        });
      }, 800);
    });
  };

  // 添加戰鬥日誌
  const addLog = (message: string) => {
    setBattleLog((prev) => [...prev, message].slice(-8));
  };

  // 開始新回合
  const startNewTurn = () => {
    addLog(`\n=== 第 ${turnNumber} 回合 ===`);
    addLog('30 秒內選擇技能！');

    // 重置所有玩家的選擇狀態
    setPlayers((prev) => prev.map((p) => ({
      ...p,
      hasSelected: false,
      selectedSkillId: undefined,
    })));

    setSelectedSkillId(null);
    setIsProcessing(false);

    // 開始倒數計時
    timer.start();
  };

  // 玩家選擇技能
  const handleSkillSelect = (skill: Skill) => {
    if (isProcessing || timer.isTimeUp || selectedSkillId) return;

    setSelectedSkillId(skill.id);
    setPlayerHasSelected(true);

    addLog(`你選擇了 ${skill.name}`);

    // 立即停止計時器並進入動作環節
    timer.stop();
    setTimeout(() => processTurn(), 500);
  };

  // 時間到的回調
  function handleTurnTimeout() {
    if (!playerHasSelected) {
      addLog('時間到！未選擇技能，跳過本回合...');
    }
    processTurn();
  }

  // 處理回合結算
  const processTurn = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    setTimeout(() => {
      // 如果玩家已選擇，執行玩家攻擊
      if (playerHasSelected && selectedSkillId) {
        const skill = playerPokemon.skills.find((s) => s.id === selectedSkillId);
        if (skill) {
          executePlayerAttack(skill);
        } else {
          // 玩家未攻擊，直接進入敵人回合
          enemyCounterAttack();
        }
      } else {
        // 玩家未選擇，直接進入敵人回合
        addLog('你未選擇技能，跳過攻擊');
        enemyCounterAttack();
      }
    }, 1000);
  };

  // 執行玩家攻擊
  const executePlayerAttack = async (skill: Skill) => {
    addLog(`你使用 ${skill.name}！`);

    // 播放攻擊動畫
    setIsPlayerAttacking(true);
    setTimeout(() => setIsPlayerAttacking(false), 400);

    setTimeout(async () => {
      try {
        // 調用 Battle API 計算傷害
        const damageResult = await apiCalculateDamage({
          attacker_level: playerPokemon.level,
          attacker_attack: playerPokemon.attack,
          defender_defense: enemy.defense,
          skill_power: skill.power,
          skill_type: skill.type,
          defender_type: enemy.type,
          is_critical: Math.random() < 0.0625, // 6.25% 會心率
        });

        const damage = damageResult.damage;

        // 顯示效果訊息
        if (damageResult.message && damageResult.message !== '造成傷害') {
          addLog(damageResult.message);
        }

        setIsEnemyTakingDamage(true);
        showDamage(damage, 'enemy');
        musicManager.playHitSound();

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

        // 更新敵人 HP
        const newHp = Math.max(0, enemy.currentHp - damage);
        setEnemy((prev) => ({ ...prev, currentHp: newHp }));

        addLog(`造成 ${damage} 傷害！`);

        // 檢查勝利條件
        if (newHp <= 0) {
          setTimeout(() => {
            addLog('🎉 敵人被擊敗了！');
            addLog('你獲勝了！');
            setTimeout(() => {
              dispatch({ type: 'END_BATTLE', result: 'win' });
            }, 3000);
          }, 1000);
          return;
        }

        // 敵人反擊
        setTimeout(() => enemyCounterAttack(), 1500);

      } catch (error) {
        console.error('Battle API 調用失敗:', error);
        addLog('⚠️ 傷害計算異常，使用備用計算');

        // 使用本地計算作為備用
        const damage = calculateDamageLocal(playerPokemon, enemy, skill);
        setIsEnemyTakingDamage(true);
        showDamage(damage, 'enemy');

        setTimeout(() => {
          setIsEnemyTakingDamage(false);
          const newHp = Math.max(0, enemy.currentHp - damage);
          setEnemy((prev) => ({ ...prev, currentHp: newHp }));

          if (newHp <= 0) {
            setTimeout(() => {
              dispatch({ type: 'END_BATTLE', result: 'win' });
            }, 2000);
          } else {
            setTimeout(() => enemyCounterAttack(), 1500);
          }
        }, 500);
      }
    }, 400);
  };

  // 敵人反擊
  const enemyCounterAttack = async () => {
    const enemySkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];

    if (playerPokemon.currentHp <= 0) {
      addLog('💀 你的寶可夢已無法戰鬥！');
      setTimeout(() => {
        dispatch({ type: 'END_BATTLE', result: 'lose' });
      }, 2000);
      return;
    }

    addLog(`\n${enemy.name} 使用 ${enemySkill.name}！`);

    // 敵人攻擊動畫
    setIsEnemyAttacking(true);
    setTimeout(() => setIsEnemyAttacking(false), 400);

    setTimeout(async () => {
      try {
        // 調用 Battle API 計算敵人傷害
        const damageResult = await apiCalculateDamage({
          attacker_level: enemy.level,
          attacker_attack: enemy.attack,
          defender_defense: playerPokemon.defense,
          skill_power: enemySkill.power,
          skill_type: enemySkill.type,
          defender_type: playerPokemon.type,
          is_critical: Math.random() < 0.0625,
        });

        const damage = damageResult.damage;

        addLog(`造成 ${damage} 傷害！`);
        if (damageResult.message && damageResult.message !== '造成傷害') {
          addLog(damageResult.message);
        }

        setIsPlayerTakingDamage(true);
        showDamage(damage, 'player');
        setTimeout(() => setIsPlayerTakingDamage(false), 200);

        musicManager.playHitSound();

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

        // 更新玩家 HP
        const newHp = Math.max(0, playerPokemon.currentHp - damage);
        setPlayerPokemon((prev) => ({ ...prev, currentHp: newHp }));

        // 檢查失敗條件
        setTimeout(() => {
          if (newHp <= 0) {
            addLog('💀 你的寶可夢無法戰鬥了！');
            setTimeout(() => {
              dispatch({ type: 'END_BATTLE', result: 'lose' });
            }, 2000);
            return;
          }

          // 開始下一回合
          setTurnNumber((prev) => prev + 1);
          setPlayerHasSelected(false);
          setTimeout(() => startNewTurn(), 2000);
        }, 1000);

      } catch (error) {
        console.error('敵人攻擊 API 失敗:', error);
        // 使用本地計算
        const damage = calculateDamageLocal(enemy, playerPokemon, enemySkill);
        showDamage(damage, 'player');

        setTimeout(() => {
          const newHp = Math.max(0, playerPokemon.currentHp - damage);
          setPlayerPokemon((prev) => ({ ...prev, currentHp: newHp }));

          if (newHp <= 0) {
            setTimeout(() => {
              dispatch({ type: 'END_BATTLE', result: 'lose' });
            }, 2000);
          } else {
            setTurnNumber((prev) => prev + 1);
            setPlayerHasSelected(false);
            setTimeout(() => startNewTurn(), 2000);
          }
        }, 1000);
      }
    }, 600);
  };

  // 本地傷害計算（備用）
  const calculateDamageLocal = (attacker: Pokemon, defender: Pokemon, skill: Skill): number => {
    const baseDamage = Math.floor(
      ((2 * attacker.level / 5 + 2) * skill.power * attacker.attack) /
        (defender.defense * 50) +
        2
    );
    const randomFactor = 0.85 + Math.random() * 0.15;
    return Math.floor(baseDamage * randomFactor);
  };

  // 顯示傷害數字 (保留原有)
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

  // 計時器顏色
  const getTimerColor = () => {
    const seconds = Math.ceil(timer.remaining / 1000);
    if (seconds > 10) return '#4ecca3';
    if (seconds > 5) return '#ff9800';
    return '#f44336';
  };

  return (
    <View style={styles.container}>
      {/* 背景閃爍效果 */}
      <Animated.View
        style={[
          styles.flashOverlay,
          { opacity: bgFlashAnim },
        ]}
        pointerEvents="none"
      />

      {/* 背景 */}
      <View style={styles.background}>
        <View style={styles.grassFloor} />
      </View>

      {/* VS 文字 */}
      <Animated.View
        style={[
          styles.vsContainer,
          {
            opacity: vsTextAnim,
            transform: [{ scale: vsTextScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.vsText}>VS</Text>
      </Animated.View>

      {/* 簡約計時器 (頂部) */}
      {battleStarted && !isProcessing && (
        <View style={styles.timerBar}>
          <Text style={[styles.timerText, { color: getTimerColor() }]}>
            ⏱️ {Math.ceil(timer.remaining / 1000)}秒
          </Text>
          <Text style={styles.turnText}>第 {turnNumber} 回合</Text>
        </View>
      )}

      {/* 敵方 */}
      <Animated.View
        style={[
          styles.enemySection,
          {
            transform: [{ translateX: enemySlideAnim }],
          },
        ]}
      >
        <View style={styles.pokemonInfo}>
          <Text style={styles.pokemonName}>{enemy.name}</Text>
          <Text style={styles.level}>Lv.{enemy.level}</Text>
          <HPBar currentHp={enemy.currentHp} maxHp={enemy.maxHp} />
        </View>
        <View style={styles.enemyPokemonContainer}>
          <PokemonSprite
            pokemon={enemy}
            isEnemy
            isAttacking={isEnemyAttacking}
            isTakingDamage={isEnemyTakingDamage}
          />
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
      {battleStarted && !isProcessing && (
        <View style={styles.skillMenu}>
          <Text style={styles.menuTitle}>
            {timer.isTimeUp ? '時間到！' : selectedSkillId ? '已選擇技能！' : '選擇你的技能'}
          </Text>
          <View style={styles.skillGrid}>
            {playerPokemon.skills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={[
                  styles.skillButton,
                  selectedSkillId === skill.id && styles.skillButtonSelected,
                  (timer.isTimeUp || (selectedSkillId && selectedSkillId !== skill.id)) && styles.skillButtonDisabled,
                ]}
                onPress={() => handleSkillSelect(skill)}
                disabled={timer.isTimeUp || !!selectedSkillId}
                activeOpacity={0.7}
              >
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillType}>{skill.type}</Text>
                <Text style={styles.skillPower}>威力: {skill.power}</Text>
                {selectedSkillId === skill.id && (
                  <Text style={styles.selectedMark}>✓ 已選擇</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 背景下載狀態 */}
      <PreloadStatus />
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
    fontWeight: 'bold' as const,
    color: '#ffde00',
    textShadowColor: '#000',
    textShadowOffset: { width: 6, height: 6 },
    textShadowRadius: 0,
    letterSpacing: 20,
  },
  timerBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    zIndex: 100,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  turnText: {
    fontSize: 14,
    color: '#ffffff',
  },
  enemySection: {
    position: 'absolute',
    top: 70,
    right: 20,
    alignItems: 'flex-end',
  },
  enemyPokemonContainer: {
    marginTop: 40,
  },
  playerSection: {
    position: 'absolute',
    bottom: 240,
    left: 40,
    alignItems: 'flex-start',
  },
  playerPokemonContainer: {
    marginBottom: 20,
  },
  pokemonInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    minWidth: 240,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  level: {
    fontSize: 16,
    color: '#ffde00',
    marginBottom: 10,
  },
  battleLog: {
    position: 'absolute',
    top: 70,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
    maxWidth: 300,
    maxHeight: 200,
  },
  logText: {
    fontSize: 11,
    color: '#ffffff',
    marginBottom: 3,
  },
  skillMenu: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 16,
    zIndex: 10,
  },
  menuTitle: {
    fontSize: 16,
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
    cursor: 'pointer',
    borderWidth: 2,
    borderColor: '#2980b9',
    position: 'relative',
  },
  skillButtonSelected: {
    backgroundColor: '#4ecca3',
    borderColor: '#45b393',
    borderWidth: 3,
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
  selectedMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  damageNumber: {
    position: 'absolute',
  },
  enemyDamageNumber: {
    top: 100,
    right: 100,
  },
  playerDamageNumber: {
    top: 40,
    left: 40,
  },
  damageText: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: '#f44336',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
});

export default BattleScreen;
