import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { INTRO_DIALOGUES } from '../data/dialogues';
import PreloadStatus from '../components/PreloadStatus';
import { useKeyboard } from '../hooks/useKeyboard';
import ImageUploadScreen from './ImageUploadScreen';

const { width, height } = Dimensions.get('window');

const DialogueScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [justSetNickname, setJustSetNickname] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentDialogue = INTRO_DIALOGUES[state.dialogueIndex];
  const isLastDialogue = state.dialogueIndex >= INTRO_DIALOGUES.length - 1;

  // 當設定暱稱後，自動進入下一個對話
  useEffect(() => {
    if (justSetNickname && state.pokemonNickname) {
      setJustSetNickname(false);
      dispatch({ type: 'NEXT_DIALOGUE' });
    }
  }, [justSetNickname, state.pokemonNickname]);

  // 鍵盤控制
  useKeyboard((key) => {
    // 如果是圖片上傳模式，不處理鍵盤（由 modal 處理）
    if (currentDialogue?.requiresImageUpload) {
      return;
    }

    // 如果是文字輸入模式，只處理 Enter
    if (currentDialogue?.requiresInput && !isTyping) {
      if (key === 'Enter') {
        handleNext();
      }
      return;
    }

    // 一般對話模式，空白鍵繼續
    if (key === ' ' || key === 'Spacebar') {
      handleNext();
    }
  });

  useEffect(() => {
    // 對話框淡入
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 箭頭動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 10,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 打字機效果
  useEffect(() => {
    if (!currentDialogue) return;

    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    // 直接在這裡替換文字，確保使用最新的 nickname
    const text = currentDialogue.text.replace(/{nickname}/g, state.pokemonNickname || '小火龍');

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 50); // 每50ms顯示一個字

    return () => clearInterval(interval);
  }, [state.dialogueIndex, state.pokemonNickname]);

  // 當打字完成且需要圖片上傳時，自動彈出 modal
  useEffect(() => {
    if (!isTyping && currentDialogue?.requiresImageUpload && !showImageUpload) {
      setShowImageUpload(true);
    }
  }, [isTyping, currentDialogue, showImageUpload]);

  const handleNext = () => {
    if (isTyping) {
      // 如果正在打字，直接顯示全部文字
      const fullText = currentDialogue.text.replace(/{nickname}/g, state.pokemonNickname || '小火龍');
      setDisplayedText(fullText);
      setIsTyping(false);
    } else {
      // 如果需要圖片上傳（已經由 useEffect 自動彈出，這裡不處理）
      if (currentDialogue.requiresImageUpload) {
        return;
      }

      // 如果需要文字輸入（命名）
      if (currentDialogue.requiresInput) {
        if (inputValue.trim()) {
          // 保存寶可夢暱稱
          dispatch({ type: 'SET_POKEMON_NICKNAME', nickname: inputValue.trim() });
          setInputValue('');
          setJustSetNickname(true);  // 標記已設定暱稱，觸發 useEffect 進入下一個對話
        }
        return;
      }

      // 進入下一段對話
      if (isLastDialogue) {
        // 最後一段對話，進入載入畫面
        dispatch({ type: 'SET_HAS_SEEN_INTRO', value: true });
        dispatch({ type: 'RESET_DIALOGUE' });
        dispatch({ type: 'START_LOADING_SKILLS' });
      } else {
        dispatch({ type: 'NEXT_DIALOGUE' });
      }
    }
  };

  // 圖片上傳完成後的回調
  const handleImageUploadComplete = () => {
    setShowImageUpload(false);
    // 立即進入下一段對話（命名）
    dispatch({ type: 'NEXT_DIALOGUE' });
  };

  if (!currentDialogue) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 背景 */}
      <View style={styles.background}>
        <View style={styles.lab}>
          <Text style={styles.labText}>博士的研究所</Text>
        </View>

        {/* 博士人物圖片 */}
        <View style={styles.professorContainer}>
          <Image
            source={require('../../assets/NPCs/Prof.png')}
            style={styles.professorImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 對話框 */}
      <Animated.View style={[styles.dialogueBox, { opacity: fadeAnim }]}>
        {/* 說話者名稱 */}
        <View style={styles.speakerBox}>
          <Text style={styles.speakerText}>{currentDialogue.speaker}</Text>
        </View>

        {/* 對話文字 */}
        <View style={styles.textBox}>
          <Text style={styles.dialogueText}>{displayedText}</Text>
        </View>

        {/* 輸入框 (只在需要文字輸入時顯示，排除圖片上傳) */}
        {!isTyping && currentDialogue.requiresInput && !currentDialogue.requiresImageUpload && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="請輸入名稱..."
              placeholderTextColor="#95a5a6"
              maxLength={10}
              autoFocus
              onSubmitEditing={handleNext}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !inputValue.trim() && styles.confirmButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!inputValue.trim()}
            >
              <Text style={styles.confirmButtonText}>確定</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 繼續指示 (只在一般對話時顯示，排除輸入和圖片上傳) */}
        {!isTyping && !currentDialogue.requiresInput && !currentDialogue.requiresImageUpload && (
          <>
            <Animated.View
              style={[
                styles.continueArrow,
                { transform: [{ translateY: arrowAnim }] },
              ]}
            >
              <Text style={styles.arrowText}>▼</Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.continueHint,
                { opacity: arrowAnim.interpolate({
                  inputRange: [0, 10],
                  outputRange: [0.7, 1],
                })},
              ]}
            >
              <Text style={styles.continueHintText}>點擊繼續</Text>
            </Animated.View>
          </>
        )}

        {/* 點擊區域 (只在一般對話時啟用，排除輸入和圖片上傳) */}
        {!currentDialogue.requiresInput && !currentDialogue.requiresImageUpload && (
          <TouchableOpacity
            style={styles.touchArea}
            onPress={handleNext}
            activeOpacity={1}
          />
        )}
      </Animated.View>

      {/* 進度指示 */}
      <View style={styles.progressContainer}>
        {INTRO_DIALOGUES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === state.dialogueIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* 背景下載狀態 */}
      <PreloadStatus />

      {/* 圖片上傳彈窗 */}
      {showImageUpload && (
        <ImageUploadScreen onComplete={handleImageUploadComplete} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
  },
  lab: {
    padding: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderRadius: 10,
    position: 'absolute',
    top: 40,
  },
  labText: {
    fontSize: 24,
    color: '#ecf0f1',
    fontWeight: 'bold',
  },
  professorContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    top: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  professorImage: {
    width: '100%',
    height: '100%',
    maxWidth: 600,
  },
  dialogueBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 180,
  },
  speakerBox: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  speakerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textBox: {
    marginBottom: 10,
  },
  dialogueText: {
    fontSize: 18,
    color: '#2c3e50',
    lineHeight: 26,
  },
  continueArrow: {
    position: 'absolute',
    bottom: 10,
    right: 20,
  },
  arrowText: {
    fontSize: 20,
    color: '#3498db',
  },
  continueHint: {
    position: 'absolute',
    bottom: 15,
    right: 50,
  },
  continueHintText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  progressContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#3498db',
    width: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  confirmButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DialogueScreen;
