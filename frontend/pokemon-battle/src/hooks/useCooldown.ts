import { useState, useEffect, useRef } from 'react';

/**
 * 限時選擇倒數計時 Hook
 * @param duration 倒數時長（毫秒）
 * @param onTimeout 時間到的回調函數
 * @param autoStart 是否自動開始
 */
export const useTimer = (
  duration: number = 30000,
  onTimeout?: () => void,
  autoStart: boolean = false
) => {
  const [remaining, setRemaining] = useState(autoStart ? duration : 0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 開始倒數
  const start = () => {
    setRemaining(duration);
    setIsRunning(true);
    setIsTimeUp(false);
  };

  // 停止倒數
  const stop = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 重置
  const reset = () => {
    setRemaining(duration);
    setIsRunning(false);
    setIsTimeUp(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 倒數計時
  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 100;  // 每 100ms 更新一次
          if (next <= 0) {
            setIsRunning(false);
            setIsTimeUp(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            if (onTimeout) {
              onTimeout();
            }
            return 0;
          }
          return next;
        });
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, remaining, onTimeout]);

  return {
    remaining,       // 剩餘時間（毫秒）
    isRunning,       // 是否正在倒數
    isTimeUp,        // 時間是否到了
    start,           // 開始倒數
    stop,            // 停止倒數
    reset,           // 重置
  };
};
