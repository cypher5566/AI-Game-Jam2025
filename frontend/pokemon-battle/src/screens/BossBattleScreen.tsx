import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import PlayerCard from '../components/PlayerCard';
import BossCard from '../components/BossCard';
import SkillButtonWithTimer from '../components/SkillButtonWithTimer';
import { useTimer } from '../hooks/useCooldown';
import { Pokemon, Skill } from '../types';
import { PlayerInBattle, generateMockPlayers, simulateMockPlayerChoice } from '../data/mockPlayers';
import { createBoss } from '../data/bossData';

const { width, height } = Dimensions.get('window');

const TURN_TIME_LIMIT = 30000; // 30 秒

const BossBattleScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  // Boss 狀態
  const [boss, setBoss] = useState<Pokemon>(createBoss('snorlax'));
  const [isBossTakingDamage, setIsBossTakingDamage] = useState(false);

  // 玩家狀態
  const [players, setPlayers] = useState<PlayerInBattle[]>([]);
  const [currentPlayerId] = useState('player-1');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // 回合狀態
  const [turnNumber, setTurnNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  // 倒數計時器
  const timer = useTimer(TURN_TIME_LIMIT, handleTurnTimeout, false);

  // 初始化玩家(包含真實玩家 + 3個假玩家)
  useEffect(() => {
    const mockPlayers = generateMockPlayers(3, false);
    const realPlayer: PlayerInBattle = {
      id: currentPlayerId,
      name: state.pokemonNickname || '玩家',
      pokemon: state.playerPokemon[0] || state.playerPokemon[0],
      isOnline: true,
      hasSelected: false,
      selectedSkillId: undefined,
    };
    setPlayers([realPlayer, ...mockPlayers]);

    // 開始第一回合
    startNewTurn();
  }, []);

  // 開始新回合
  const startNewTurn = () => {
    addLog(`\n===== 第 ${turnNumber} 回合開始 =====`);
    addLog('所有玩家請在 30 秒內選擇技能！');

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
    players.forEach((player, index) => {
      if (player.id !== currentPlayerId) {
        // 假玩家在 5-20 秒之間隨機選擇
        const delay = 5000 + Math.random() * 15000;
        setTimeout(() => {
          if (!timer.isTimeUp) {
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
    if (isProcessing || timer.isTimeUp) return;

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
      processTurn();
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
          addLog(`${player.name} 未選擇技能，跳過本回合`);
        }
      });

      // 執行攻擊
      let totalDamage = 0;
      attacks.forEach(({ player, skill }) => {
        const damage = calculateDamage(player.pokemon, boss, skill);
        totalDamage += damage;
        addLog(`${player.name} 使用 ${skill.name}，造成 ${damage} 點傷害！`);
      });

      // 更新 Boss HP
      if (totalDamage > 0) {
        setIsBossTakingDamage(true);
        setTimeout(() => setIsBossTakingDamage(false), 500);

        const newHp = Math.max(0, boss.currentHp - totalDamage);
        setBoss((prev) => ({ ...prev, currentHp: newHp }));

        addLog(`Boss 受到總計 ${totalDamage} 點傷害！`);

        // 檢查勝利條件
        if (newHp <= 0) {
          addLog('\n🎉 Boss 被擊敗了！你們獲勝了！');
          setTimeout(() => {
            dispatch({ type: 'END_BATTLE', result: 'win' });
          }, 3000);
          return;
        }
      }

      // Boss 反擊
      setTimeout(() => {
        bossCounterAttack();
      }, 1500);
    }, 1000);
  };

  // Boss 反擊
  const bossCounterAttack = () => {
    const bossSkill = boss.skills[Math.floor(Math.random() * boss.skills.length)];
    const target = players[Math.floor(Math.random() * players.length)];
    const damage = calculateDamage(boss, target.pokemon, bossSkill);

    addLog(`\nBoss 使用 ${bossSkill.name} 攻擊 ${target.name}！`);
    addLog(`${target.name} 受到 ${damage} 點傷害！`);

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
        addLog('\n💀 所有玩家都失去戰鬥能力了！');
        setTimeout(() => {
          dispatch({ type: 'END_BATTLE', result: 'lose' });
        }, 3000);
        return;
      }

      // 開始下一回合
      setTurnNumber((prev) => prev + 1);
      setTimeout(() => {
        startNewTurn();
      }, 2000);
    }, 1500);
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

  // 添加戰鬥日誌
  const addLog = (message: string) => {
    setBattleLog((prev) => [...prev, message].slice(-20));
  };

  // 獲取當前玩家
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  return (
    <View style={styles.container}>
      {/* 倒數計時器 */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          ⏱️ {Math.ceil(timer.remaining / 1000)}秒
        </Text>
        <Text style={styles.turnText}>第 {turnNumber} 回合</Text>
      </View>

      {/* 主要戰鬥區域 */}
      <View style={styles.battleArea}>
        {/* Boss 區域（右側） */}
        <View style={styles.bossSection}>
          <BossCard
            boss={boss}
            isTakingDamage={isBossTakingDamage}
          />
        </View>

        {/* 玩家區域（左側） */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>冒險者們</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playersContainer}
          >
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 技能選擇區域 */}
      {currentPlayer && !isProcessing && (
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>
            {timer.isTimeUp ? '時間到！' : '選擇你的技能'}
          </Text>
          <View style={styles.skillsGrid}>
            {currentPlayer.pokemon.skills.map((skill) => (
              <SkillButtonWithTimer
                key={skill.id}
                skill={skill}
                selected={selectedSkillId === skill.id}
                onPress={() => handleSkillSelect(skill)}
                disabled={timer.isTimeUp || currentPlayer.hasSelected}
              />
            ))}
          </View>
        </View>
      )}

      {/* 戰鬥日誌 */}
      <View style={styles.logSection}>
        <Text style={styles.logTitle}>戰鬥記錄</Text>
        <ScrollView style={styles.logScrollView}>
          {battleLog.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0e17',
  },
  timerContainer: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  timerText: {
    color: '#4ecca3',
    fontSize: 24,
    fontWeight: 'bold',
  },
  turnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  battleArea: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
  },
  bossSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersSection: {
    flex: 1,
    paddingLeft: 10,
  },
  sectionTitle: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  playersContainer: {
    alignItems: 'center',
  },
  skillsSection: {
    backgroundColor: '#16213e',
    padding: 15,
    borderTopWidth: 2,
    borderTopColor: '#4a5a9e',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  logSection: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    maxHeight: 150,
    borderTopWidth: 1,
    borderTopColor: '#2d3561',
  },
  logTitle: {
    color: '#4ecca3',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logScrollView: {
    maxHeight: 100,
  },
  logText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 3,
  },
});

export default BossBattleScreen;
