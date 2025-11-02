import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface HPBarProps {
  currentHp: number;
  maxHp: number;
  showNumbers?: boolean;
}

const HPBar: React.FC<HPBarProps> = ({ currentHp, maxHp, showNumbers = true }) => {
  const hpPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const animatedWidth = useRef(new Animated.Value(hpPercentage)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: hpPercentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [hpPercentage]);

  // HP 顏色根據百分比變化
  const getHPColor = () => {
    if (hpPercentage > 50) return '#4caf50'; // 綠色
    if (hpPercentage > 25) return '#ff9800'; // 橙色
    return '#f44336'; // 紅色
  };

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={styles.barBackground} />
        <Animated.View
          style={[
            styles.barFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: getHPColor(),
            },
          ]}
        />
      </View>
      {showNumbers && (
        <Text style={styles.hpText}>
          {Math.max(0, currentHp)} / {maxHp}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barContainer: {
    height: 16,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#424242',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  hpText: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 6,
    textAlign: 'right',
    fontWeight: 'bold',
  },
});

export default HPBar;
