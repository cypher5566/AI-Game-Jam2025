import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Modal, Pressable } from 'react-native';
import { useGame } from '../contexts/GameContext';

/**
 * 圖片上傳畫面（彈窗式介面）
 * 實際的圖片上傳和 AI 判定功能由後端同事實作
 * 目前提供 UI 介面，點擊後使用預設寶可夢繼續流程
 */
const ImageUploadScreen: React.FC = () => {
  const { dispatch } = useGame();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(true);

  // 模擬圖片選擇（實際實作會使用 expo-image-picker）
  const handleSelectImage = () => {
    Alert.alert(
      '功能開發中',
      '圖片上傳功能將由後端同事整合實作。\n目前將使用預設寶可夢繼續遊戲。',
      [
        {
          text: '確定',
          onPress: () => {
            // 模擬選擇了一張圖片
            setSelectedImage('placeholder');
          },
        },
      ]
    );
  };

  // 跳過上傳，使用預設寶可夢
  const handleSkip = () => {
    setModalVisible(false);
    // 繼續到命名對話
    setTimeout(() => {
      dispatch({ type: 'SKIP_IMAGE_UPLOAD' });
    }, 300);
  };

  // 確認上傳（目前也是跳過）
  const handleConfirm = () => {
    if (!selectedImage) {
      Alert.alert('提示', '請先選擇圖片，或點擊「跳過」使用預設寶可夢');
      return;
    }

    // TODO: 實際實作時，這裡會呼叫 API 上傳圖片
    // const response = await uploadPokemonImage(imageFile);
    // dispatch({ type: 'SET_POKEMON_TYPE', pokemonType: response.type });

    // 目前直接跳過
    Alert.alert(
      '提示',
      '圖片上傳功能開發中，將使用預設寶可夢',
      [
        {
          text: '確定',
          onPress: handleSkip,
        },
      ]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleSkip}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={handleSkip}
      >
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 關閉按鈕 */}
          <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* 標題 */}
          <View style={styles.header}>
            <Text style={styles.title}>上傳你的寶可夢圖片</Text>
            <Text style={styles.subtitle}>AI 將分析圖片並判定你的寶可夢屬性</Text>
          </View>

          {/* 上傳區域 */}
          <View style={styles.uploadArea}>
            {selectedImage ? (
              <View style={styles.imagePreview}>
                <Text style={styles.placeholderText}>圖片已選擇</Text>
                <Text style={styles.hintText}>（實際圖片預覽將由後端整合實作）</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.selectButton} onPress={handleSelectImage}>
                <Text style={styles.selectButtonText}>📷 選擇圖片</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 說明文字 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 上傳說明</Text>
            <Text style={styles.infoText}>• 建議上傳清晰的寶可夢圖片</Text>
            <Text style={styles.infoText}>• AI 會自動判定屬性（火、水、電、普通）</Text>
            <Text style={styles.infoText}>• 圖片將用於生成專屬的像素化寶可夢</Text>
          </View>

          {/* 功能開發中提示 */}
          <View style={styles.devNotice}>
            <Text style={styles.devNoticeText}>
              🚧 此功能正在開發中
            </Text>
            <Text style={styles.devNoticeSubtext}>
              圖片上傳和 AI 判定功能將由後端團隊整合
            </Text>
          </View>

          {/* 按鈕區 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>跳過（使用預設）</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                !selectedImage && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedImage}
            >
              <Text style={styles.confirmButtonText}>
                {selectedImage ? '確認上傳' : '請先選擇圖片'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* API 整合說明（僅開發環境） */}
          {__DEV__ && (
            <View style={styles.devInfo}>
              <Text style={styles.devInfoTitle}>開發者資訊</Text>
              <Text style={styles.devInfoText}>
                API 端點: POST /api/v1/pokemon/upload{'\n'}
                預期回應: {'{ type: "fire" | "water" | ... }'}
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  uploadArea: {
    height: 180,
    backgroundColor: '#16213e',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#0f3460',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 10,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePreview: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#4ecca3',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoTitle: {
    color: '#4ecca3',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  devNotice: {
    backgroundColor: '#533483',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  devNoticeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  devNoticeSubtext: {
    color: '#ddd',
    fontSize: 11,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#6c757d',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4ecca3',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  devInfo: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffd700',
  },
  devInfoTitle: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  devInfoText: {
    color: '#bbb',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default ImageUploadScreen;
