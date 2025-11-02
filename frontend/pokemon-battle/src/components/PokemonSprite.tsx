import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Pokemon } from '../types';
import PlaceholderAsset from './PlaceholderAsset';

interface PokemonSpriteProps {
  pokemon: Pokemon;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
}

const PokemonSprite: React.FC<PokemonSpriteProps> = ({
  pokemon,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const attackAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 受擊動畫
  useEffect(() => {
    if (isTakingDamage) {
      Animated.sequence([
        Animated.parallel([
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.3,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [isTakingDamage]);

  // 攻擊動畫
  useEffect(() => {
    if (isAttacking) {
      const direction = isEnemy ? -30 : 30;
      Animated.sequence([
        Animated.timing(attackAnim, {
          toValue: direction,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(attackAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAttacking, isEnemy]);

  // 根據寶可夢類型選擇顏色和標籤
  const getPokemonStyle = () => {
    switch (pokemon.type) {
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
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: Animated.add(shakeAnim, attackAnim) },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      {isEnemy ? (
        <Image
          source={require('../../assets/pokemon/Boss.png')}
          style={styles.bossImage}
          resizeMode="contain"
        />
      ) : (
        <PlaceholderAsset
          width={64}
          height={64}
          color={style.color}
          label={style.label}
          style={[styles.sprite]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  sprite: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  enemySprite: {
    borderColor: 'rgba(255, 100, 100, 0.6)',
  },
  bossImage: {
    width: 256,
    height: 256,
  },
});

export default PokemonSprite;
