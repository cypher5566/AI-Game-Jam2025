import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Modal, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGame } from '../contexts/GameContext';
import { uploadPokemonImage, pollProcessStatus, validateImageFile } from '../services/pokemonAPI';
import { TYPE_EN_TO_ZH } from '../services/apiConfig';

interface ImageUploadScreenProps {
  onComplete?: () => void;
}

/**
 * 圖片上傳畫面（彈窗式介面）
 * 整合後端 API 進行圖片上傳和 AI 處理
 */
const ImageUploadScreen: React.FC<ImageUploadScreenProps> = ({ onComplete }) => {
  const { dispatch } = useGame();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 選擇圖片
  const handleSelectImage = async () => {
    try {
      console.log('[ImageUpload] 開始選擇圖片...');

      // 請求權限（web 環境會自動授予）
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[ImageUpload] 權限結果:', permissionResult);

      if (!permissionResult.granted) {
        console.warn('[ImageUpload] 權限被拒絕');
        Alert.alert('需要權限', '請允許存取相簿以選擇圖片');
        return;
      }

      console.log('[ImageUpload] 開啟圖片選擇器...');
      // 開啟圖片選擇器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('[ImageUpload] 選擇結果:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[ImageUpload] 圖片資訊:', asset);

        // 驗證圖片（web 環境使用 mimeType，原生環境使用 uri）
        const validation = validateImageFile(
          asset.uri,
          asset.fileSize,
          asset.mimeType
        );
        if (!validation.valid) {
          console.warn('[ImageUpload] 圖片驗證失敗:', validation.error);
          Alert.alert('圖片無效', validation.error || '請選擇有效的圖片檔案');
          return;
        }

        setSelectedImage(asset.uri);
        console.log('[ImageUpload] 圖片已選擇:', asset.uri);
        Alert.alert('成功', '圖片已選擇！請點擊「確認上傳」');
      } else {
        console.log('[ImageUpload] 用戶取消選擇');
      }
    } catch (error) {
      console.error('[ImageUpload] 選擇圖片失敗:', error);
      Alert.alert('錯誤', `無法選擇圖片: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 跳過上傳，使用預設寶可夢
  const handleSkip = () => {
    setModalVisible(false);
    // 立即調用完成回調
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  // 確認上傳（背景處理）
  const handleConfirm = async () => {
    if (!selectedImage) {
      Alert.alert('提示', '請先選擇圖片，或點擊「跳過」使用預設寶可夢');
      return;
    }

    // 立即關閉彈窗並進入下一段對話
    setModalVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 300);

    // 在背景處理圖片上傳
    console.log('[ImageUpload] 開始背景上傳圖片');

    try {
      // 步驟 1: 上傳圖片
      const uploadId = await uploadPokemonImage(selectedImage);
      console.log('[ImageUpload] 背景上傳成功，ID:', uploadId);

      // 步驟 2: 輪詢處理狀態（在背景執行）
      const result = await pollProcessStatus(uploadId, (status, attempt) => {
        console.log(`[ImageUpload] 背景處理中... (${attempt}/30)`);
      });

      console.log('[ImageUpload] 背景處理完成:', result);

      // 步驟 3: 儲存結果
      if (result.status === 'completed' && result.data) {
        const { front_image, back_image, type, type_chinese } = result.data;

        console.log('[ImageUpload] AI 判定屬性:', type_chinese, `(${type})`);

        // 儲存圖片和屬性到 GameContext
        dispatch({
          type: 'SET_POKEMON_IMAGES',
          frontImage: front_image,
          backImage: back_image,
        });

        dispatch({
          type: 'SET_AI_TYPE',
          pokemonType: type,
        });

        console.log('[ImageUpload] 背景處理完成，已儲存到 GameContext');
      } else {
        console.error('[ImageUpload] 背景處理失敗：結果無效');
      }

    } catch (error) {
      console.error('[ImageUpload] 背景上傳/處理失敗:', error);
      // 背景失敗不影響流程，使用預設值
    }
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
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handleSelectImage}
                >
                  <Text style={styles.changeButtonText}>更換圖片</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={handleSelectImage}
              >
                <Text style={styles.selectButtonText}>📷 選擇圖片</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 說明文字 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 上傳說明</Text>
            <Text style={styles.infoText}>• 建議上傳清晰的寶可夢圖片</Text>
            <Text style={styles.infoText}>• AI 會自動判定屬性（火、水、電、普通）</Text>
            <Text style={styles.infoText}>• 上傳後會在背景處理，不影響遊戲流程</Text>
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
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  changeButton: {
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ecca3',
  },
  changeButtonText: {
    color: '#4ecca3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  statusText: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
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
