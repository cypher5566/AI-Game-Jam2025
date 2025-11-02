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
import { PlayerInBattle, generateMockPlayers, simulateMockPlayerChoice } from '../data/mockPlayers';
import { createBoss } from '../data/bossData';

const { width, height } = Dimensions.get('window');

const TURN_TIME_LIMIT = 30000; // 30 秒

const BattleScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  // Boss 狀態 (替代原 enemyPokemon)
  const [boss, setBoss] = useState<Pokemon>(createBoss('snorlax'));

  // 多玩家狀態
  const [players, setPlayers] = useState<PlayerInBattle[]>([]);
  const [currentPlayerId] = useState('player-1');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

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

  // 初始化玩家
  useEffect(() => {
    const mockPlayers = generateMockPlayers(3, false);
    const realPlayer: PlayerInBattle = {
      id: currentPlayerId,
      name: state.pokemonNickname || '玩家',
      pokemon: state.playerPokemon[0],
      isOnline: true,
      hasSelected: false,
      selectedSkillId: undefined,
    };
    setPlayers([realPlayer, ...mockPlayers]);

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

    // 模擬假玩家在隨機時間後選擇
    simulateMockPlayersChoice();
  };

  // 模擬假玩家選擇技能
  const simulateMockPlayersChoice = () => {
    players.forEach((player) => {
      if (player.id !== currentPlayerId) {
        // 假玩家在 5-20 秒之間隨機選擇
        const delay = 5000 + Math.random() * 15000;
        setTimeout(() => {
          if (!timer.isTimeUp && !isProcessing) {
            const skillId = simulateMockPlayerChoice(player);
            setPlayers((prev) => prev.map((p) =>
              p.id === player.id
                ? { ...p, hasSelected: true, selectedSkillId: skillId }
                : p
            ));
            addLog(`${player.name} 已選擇技能`);
          }
        }, delay);
      }
    });
  };

  // 玩家選擇技能
  const handleSkillSelect = (skill: Skill) => {
    if (isProcessing || timer.isTimeUp || selectedSkillId) return;

    setSelectedSkillId(skill.id);
    setPlayers((prev) => prev.map((p) =>
      p.id === currentPlayerId
        ? { ...p, hasSelected: true, selectedSkillId: skill.id }
        : p
    ));

    addLog(`你選擇了 ${skill.name}`);

    // 檢查是否所有玩家都已選擇
    const allSelected = players.every((p) =>
      p.id === currentPlayerId ? true : p.hasSelected
    );

    if (allSelected) {
      timer.stop();
      setTimeout(() => processTurn(), 500);
    }
  };

  // 時間到的回調
  function handleTurnTimeout() {
    addLog('時間到！開始結算...');
    processTurn();
  }

  // 處理回合結算
  const processTurn = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    setTimeout(() => {
      // 收集所有已選擇的玩家攻擊
      const attacks: { player: PlayerInBattle; skill: Skill }[] = [];

      players.forEach((player) => {
        if (player.hasSelected && player.selectedSkillId) {
          const skill = player.pokemon.skills.find((s) => s.id === player.selectedSkillId);
          if (skill) {
            attacks.push({ player, skill });
          }
        } else {
          addLog(`${player.name} 未選擇，跳過`);
        }
      });

      // 執行所有攻擊
      executeAttacks(attacks);
    }, 1000);
  };

  // 執行所有攻擊
  const executeAttacks = (attacks: { player: PlayerInBattle; skill: Skill }[]) => {
    if (attacks.length === 0) {
      // 沒有人攻擊,直接 Boss 反擊
      setTimeout(() => bossCounterAttack(), 1000);
      return;
    }

    let totalDamage = 0;
    let attackIndex = 0;

    const executeNextAttack = () => {
      if (attackIndex >= attacks.length) {
        // 所有攻擊結束,更新 Boss HP
        finalizeDamage(totalDamage);
        return;
      }

      const { player, skill } = attacks[attackIndex];
      const damage = calculateDamage(player.pokemon, boss, skill);
      totalDamage += damage;

      addLog(`${player.name} 使用 ${skill.name}！`);

      // 播放攻擊動畫
      if (player.id === currentPlayerId) {
        setIsPlayerAttacking(true);
        setTimeout(() => setIsPlayerAttacking(false), 400);
      }

      setTimeout(() => {
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

        attackIndex++;
        setTimeout(() => executeNextAttack(), 800);
      }, 400);
    };

    executeNextAttack();
  };

  // 最終更新 Boss HP
  const finalizeDamage = (totalDamage: number) => {
    const newHp = Math.max(0, boss.currentHp - totalDamage);
    setBoss((prev) => ({ ...prev, currentHp: newHp }));

    addLog(`Boss 受到總計 ${totalDamage} 傷害！`);

    // 檢查勝利條件
    if (newHp <= 0) {
      setTimeout(() => {
        addLog('🎉 Boss 被擊敗了！');
        addLog('你們獲勝了！');
        setTimeout(() => {
          dispatch({ type: 'END_BATTLE', result: 'win' });
        }, 3000);
      }, 1000);
      return;
    }

    // Boss 反擊
    setTimeout(() => bossCounterAttack(), 1500);
  };

  // Boss 反擊
  const bossCounterAttack = () => {
    const bossSkill = boss.skills[Math.floor(Math.random() * boss.skills.length)];
    const alivePlayers = players.filter((p) => p.pokemon.currentHp > 0);

    if (alivePlayers.length === 0) {
      // 所有玩家都死了
      addLog('💀 全員陣亡！');
      setTimeout(() => {
        dispatch({ type: 'END_BATTLE', result: 'lose' });
      }, 2000);
      return;
    }

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    const damage = calculateDamage(boss, target.pokemon, bossSkill);

    addLog(`\nBoss 使用 ${bossSkill.name}！`);
    addLog(`攻擊 ${target.name}，造成 ${damage} 傷害！`);

    // Boss 攻擊動畫
    setIsEnemyAttacking(true);
    setTimeout(() => setIsEnemyAttacking(false), 400);

    setTimeout(() => {
      if (target.id === currentPlayerId) {
        setIsPlayerTakingDamage(true);
        showDamage(damage, 'player');
        setTimeout(() => setIsPlayerTakingDamage(false), 200);
      }

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
      setPlayers((prev) => prev.map((p) => {
        if (p.id === target.id) {
          const newHp = Math.max(0, p.pokemon.currentHp - damage);
          return {
            ...p,
            pokemon: { ...p.pokemon, currentHp: newHp },
          };
        }
        return p;
      }));

      // 檢查失敗條件
      setTimeout(() => {
        const allDead = players.every((p) => p.pokemon.currentHp <= 0);
        if (allDead) {
          addLog('💀 全員陣亡！');
          setTimeout(() => {
            dispatch({ type: 'END_BATTLE', result: 'lose' });
          }, 2000);
          return;
        }

        // 開始下一回合
        setTurnNumber((prev) => prev + 1);
        setTimeout(() => startNewTurn(), 2000);
      }, 1000);
    }, 600);
  };

  // 計算傷害
  const calculateDamage = (attacker: Pokemon, defender: Pokemon, skill: Skill): number => {
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

  // 獲取當前玩家
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // 計時器顏色
  const getTimerColor = () => {
    const seconds = Math.ceil(timer.remaining / 1000);
    if (seconds > 10) return '#4ecca3';
    if (seconds > 5) return '#ff9800';
    return '#f44336';
  };

  if (!currentPlayer) return null;

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

      {/* 敵方 Boss */}
      <Animated.View
        style={[
          styles.enemySection,
          {
            transform: [{ translateX: enemySlideAnim }],
          },
        ]}
      >
        <View style={styles.pokemonInfo}>
          <Text style={styles.pokemonName}>{boss.name}</Text>
          <Text style={styles.level}>Lv.{boss.level}</Text>
          <HPBar currentHp={boss.currentHp} maxHp={boss.maxHp} />
        </View>
        <View style={styles.enemyPokemonContainer}>
          <PokemonSprite
            pokemon={boss}
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
            pokemon={currentPlayer.pokemon}
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
          <Text style={styles.pokemonName}>{currentPlayer.pokemon.name}</Text>
          <Text style={styles.level}>Lv.{currentPlayer.pokemon.level}</Text>
          <HPBar currentHp={currentPlayer.pokemon.currentHp} maxHp={currentPlayer.pokemon.maxHp} />
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
            {timer.isTimeUp ? '時間到！' : selectedSkillId ? '已選擇技能，等待其他玩家...' : '選擇你的技能'}
          </Text>
          <View style={styles.skillGrid}>
            {currentPlayer.pokemon.skills.map((skill) => (
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
