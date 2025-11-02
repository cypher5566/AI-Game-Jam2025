import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerInBattle } from '../data/mockPlayers';
import HPBar from './HPBar';
import PlaceholderAsset from './PlaceholderAsset';

interface PlayerCardProps {
  player: PlayerInBattle;
  isCurrentPlayer?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentPlayer }) => {
  // 根據寶可夢類型選擇顏色和標籤
  const getPokemonStyle = () => {
    switch (player.pokemon.type) {
      case 'fire':
        return { color: '#FFA500', label: '🔥' };
      case 'water':
        return { color: '#4A90E2', label: '💧' };
      case 'electric':
        return { color: '#FFD700', label: '⚡' };
      default:
        return { color: '#A0A0A0', label: '⭐' };
    }
  };

  const style = getPokemonStyle();

  return (
    <View style={[
      styles.container,
      isCurrentPlayer && styles.currentPlayerContainer,
    ]}>
      {/* 玩家名稱 */}
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>
          {player.name}
          {isCurrentPlayer && ' (你)'}
        </Text>
        {!player.isOnline && (
          <Text style={styles.offlineText}>(離線)</Text>
        )}
      </View>

      {/* 寶可夢精靈圖 */}
      <View style={styles.spriteContainer}>
        <PlaceholderAsset
          width={64}
          height={64}
          color={style.color}
          label={style.label}
        />
      </View>

      {/* 選擇狀態指示 */}
      {player.hasSelected && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>✓</Text>
        </View>
      )}

      {/* HP 條 */}
      <View style={styles.hpContainer}>
        <HPBar
          currentHp={player.pokemon.currentHp}
          maxHp={player.pokemon.maxHp}
          showNumbers={false}
        />
      </View>

      {/* 寶可夢名稱和等級 */}
      <Text style={styles.pokemonName}>
        {player.pokemon.name}
      </Text>
      <Text style={styles.pokemonLevel}>
        Lv.{player.pokemon.level}
      </Text>
      <Text style={styles.hpText}>
        HP: {player.pokemon.currentHp}/{player.pokemon.maxHp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 12,
    margin: 8,
    backgroundColor: 'rgba(45, 53, 97, 0.8)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4a5a9e',
    minWidth: 120,
    position: 'relative',
  },
  currentPlayerContainer: {
    borderColor: '#4ecca3',
    borderWidth: 3,
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 5,
  },
  spriteContainer: {
    marginBottom: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4ecca3',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#45b393',
  },
  selectedBadgeText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hpContainer: {
    width: '100%',
    marginBottom: 8,
  },
  hpText: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 4,
  },
  pokemonName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  pokemonLevel: {
    color: '#ffde00',
    fontSize: 12,
    marginTop: 2,
  },
});

export default PlayerCard;
