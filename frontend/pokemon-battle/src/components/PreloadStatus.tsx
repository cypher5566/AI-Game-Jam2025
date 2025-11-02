import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { skillPreloader } from '../services/skillPreloader';

const PreloadStatus: React.FC = () => {
  const [status, setStatus] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 檢查預加載狀態
    const checkStatus = () => {
      const isPreloading = skillPreloader.isCurrentlyPreloading();
      if (isPreloading) {
        setStatus('正在背景載入技能...');
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // 每500ms檢查一次
    const interval = setInterval(checkStatus, 500);
    checkStatus();

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 1000,
  },
  text: {
    fontSize: 12,
    color: '#ecf0f1',
    fontWeight: '600',
  },
});

export default PreloadStatus;
