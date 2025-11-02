# 音樂系統整合說明

## 📝 概述

遊戲已成功整合背景音樂系統，使用 `expo-av` 套件管理音樂播放。

## 🎵 音樂檔案

### 探索音樂 (Pixel Dreams)
- **檔案位置**: `assets/music/Pixel Dreams.mp3`
- **使用場景**: 遊戲開始、對話、地圖探索、技能選擇、載入畫面
- **播放特性**: 循環播放，切換場景時不中斷

### 戰鬥音樂 (Pixelated Showdown)
- **檔案位置**: `assets/music/Pixelated Showdown.mp3`
- **使用場景**: 戰鬥畫面
- **播放特性**: 循環播放，每次進入戰鬥時從頭開始

## 🔧 技術實作

### MusicManager 服務

位置: `src/services/MusicManager.ts`

主要功能：
- `initialize()` - 初始化音樂系統，預載所有音樂檔案
- `playOverworldMusic()` - 播放探索音樂
- `playBattleMusic()` - 播放戰鬥音樂（從頭開始）
- `stopAll()` - 停止所有音樂
- `pause()` / `resume()` - 暫停/恢復播放
- `setVolume(volume)` - 設置音量 (0.0 - 1.0)
- `cleanup()` - 清理音樂資源

### 自動切換邏輯

在 `App.tsx` 中實作：

```typescript
useEffect(() => {
  const handleMusicChange = async () => {
    switch (state.currentScreen) {
      case 'battle':
        // 戰鬥畫面 → 播放戰鬥音樂
        await musicManager.playBattleMusic();
        break;
      case 'start':
      case 'dialogue':
      case 'map':
      case 'skillSelection':
      case 'loading':
        // 其他畫面 → 播放探索音樂
        await musicManager.playOverworldMusic();
        break;
    }
  };
  handleMusicChange();
}, [state.currentScreen]);
```

## 🎮 使用流程

1. **遊戲啟動** → 音樂系統初始化
2. **開始畫面** → 播放 Pixel Dreams
3. **對話畫面** → 繼續播放 Pixel Dreams（不中斷）
4. **載入技能** → 繼續播放 Pixel Dreams（不中斷）
5. **地圖探索** → 繼續播放 Pixel Dreams（不中斷）
6. **進入戰鬥** → 切換到 Pixelated Showdown（從頭播放）
7. **戰鬥結束** → 返回 Pixel Dreams

## 📊 音量設置

- **探索音樂**: 60% (0.6)
- **戰鬥音樂**: 70% (0.7)

可通過 `musicManager.setVolume()` 調整。

## 🐛 錯誤處理

所有音樂操作都包含 try-catch 錯誤處理：
- 初始化失敗會在控制台記錄錯誤
- 播放失敗不會影響遊戲正常運行
- 音樂問題不會導致遊戲崩潰

## 🔍 除錯

檢查控制台輸出：
- ✅ `音樂系統初始化成功` - 系統啟動成功
- 🎵 `播放探索音樂: Pixel Dreams` - 探索音樂開始
- ⚔️ `播放戰鬥音樂: Pixelated Showdown` - 戰鬥音樂開始
- ❌ `音樂系統初始化失敗` - 初始化錯誤

## 📦 相關依賴

```json
{
  "expo-av": "^16.0.7"
}
```

## 🚀 測試方法

1. 啟動遊戲：`npm start` 或 `npm run web`
2. 檢查控制台是否顯示 "音樂系統已啟動"
3. 開始遊戲，確認播放 Pixel Dreams
4. 觸發戰鬥，確認切換到 Pixelated Showdown
5. 戰鬥結束，確認返回 Pixel Dreams

## 🎯 未來改進

- [ ] 添加音量控制 UI
- [ ] 添加音樂開關選項
- [ ] 支援音效系統（攻擊、受傷等）
- [ ] 添加淡入淡出效果
- [ ] 支援多種戰鬥音樂隨機播放

## 📝 注意事項

1. 音樂檔案必須放在 `assets/music/` 目錄下
2. 檔案名稱包含空格需要在 require 中正確引用
3. Web 版本可能需要用戶互動後才能播放音樂（瀏覽器限制）
4. 在 iOS 上需要設置 `playsInSilentModeIOS: true` 才能在靜音模式下播放

## 🔗 相關文件

- [Expo AV 官方文檔](https://docs.expo.dev/versions/latest/sdk/av/)
- [Audio API 參考](https://docs.expo.dev/versions/latest/sdk/audio/)
