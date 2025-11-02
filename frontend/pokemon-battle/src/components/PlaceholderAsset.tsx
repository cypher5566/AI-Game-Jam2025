import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlaceholderAssetProps {
  width: number;
  height: number;
  color: string;
  label?: string;
  style?: any;
}

/**
 * 彩色佔位符組件 - 用於在沒有真實美術素材時顯示
 * 可以輕鬆替換為真實的 Image 組件
 */
const PlaceholderAsset: React.FC<PlaceholderAssetProps> = ({
  width,
  height,
  color,
  label,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: color,
        },
        style,
      ]}
    >
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontSize: Math.min(width, height) / 5,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  label: {
    color: '#ffffff',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default PlaceholderAsset;
