import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type KeyHandler = (key: string) => void;

export const useKeyboard = (onKeyPress: KeyHandler) => {
  const handlerRef = useRef(onKeyPress);

  useEffect(() => {
    handlerRef.current = onKeyPress;
  }, [onKeyPress]);

  useEffect(() => {
    // 只在 Web 平台監聽鍵盤事件
    if (Platform.OS !== 'web') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      handlerRef.current(event.key);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};
