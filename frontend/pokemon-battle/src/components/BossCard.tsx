import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Pokemon } from '../types';
import HPBar from './HPBar';

interface BossCardProps {
  boss: Pokemon;
  isTakingDamage?: boolean;
}

const BossCard: React.FC<BossCardProps> = ({ boss, isTakingDamage }) => {
  const hpPercentage = (boss.currentHp / boss.maxHp) * 100;

  return (
    <View style={styles.container}>
      {/* Boss 標籤 */}
      <View style={styles.bossLabel}>
        <Text style={styles.bossLabelText}>⚔️ BOSS ⚔️</Text>
      </View>

      {/* Boss 名稱和等級 */}
      <Text style={styles.bossName}>{boss.name}</Text>
      <Text style={styles.bossLevel}>Lv.{boss.level}</Text>

      {/* Boss 精靈圖 (使用卡比獸圖片) */}
      <View style={[
        styles.spriteContainer,
        isTakingDamage && styles.takingDamage,
      ]}>
        <Image
          source={require('../../assets/pokemon/Boss.png')}
          style={styles.bossImage}
          resizeMode="contain"
        />
      </View>

      {/* HP 條 (較大) */}
      <View style={styles.hpContainer}>
        <HPBar
          currentHp={boss.currentHp}
          maxHp={boss.maxHp}
          showNumbers={false}
        />
        <Text style={styles.hpText}>
          HP: {boss.currentHp} / {boss.maxHp}
        </Text>
        <Text style={styles.hpPercentage}>{hpPercentage.toFixed(1)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#e94560',
    margin: 10,
  },
  bossLabel: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  bossLabelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bossName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bossLevel: {
    color: '#4ecca3',
    fontSize: 20,
    marginBottom: 20,
  },
  spriteContainer: {
    marginBottom: 20,
  },
  takingDamage: {
    transform: [{ scale: 1.1 }],
  },
  bossImage: {
    width: 256,
    height: 256,
  },
  hpContainer: {
    alignItems: 'center',
    width: '100%',
    minWidth: 280,
  },
  hpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  hpPercentage: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
});

export default BossCard;
