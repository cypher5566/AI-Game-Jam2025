import { Audio } from 'expo-av';

/**
 * 音樂管理器
 * 負責管理遊戲中的背景音樂和音效播放
 */
class MusicManager {
  private overworkMusic: Audio.Sound | null = null;  // Pixel Dreams (探索音樂)
  private battleMusic: Audio.Sound | null = null;    // Pixelated Showdown (戰鬥音樂)
  private hitSfx: Audio.Sound | null = null;          // 攻擊音效
  private currentTrack: 'overwork' | 'battle' | null = null;
  private isInitialized: boolean = false;

  /**
   * 初始化音樂系統
   * 預先載入所有音樂檔案
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 設置音頻模式
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 載入探索音樂 (Pixel Dreams)
      const { sound: overworldSound } = await Audio.Sound.createAsync(
        require('../../assets/music/Pixel Dreams.mp3'),
        { shouldPlay: false, isLooping: true, volume: 0.6 }
      );
      this.overworkMusic = overworldSound;

      // 載入戰鬥音樂 (Pixelated Showdown)
      const { sound: battleSound } = await Audio.Sound.createAsync(
        require('../../assets/music/Pixelated Showdown.mp3'),
        { shouldPlay: false, isLooping: true, volume: 0.7 }
      );
      this.battleMusic = battleSound;

      // 載入攻擊音效 (Hit SFX)
      const { sound: hitSound } = await Audio.Sound.createAsync(
        require('../../assets/sfx/Hit SFX.mp3'),
        { shouldPlay: false, isLooping: false, volume: 0.8 }
      );
      this.hitSfx = hitSound;

      this.isInitialized = true;
      console.log('✅ 音樂系統初始化成功');
    } catch (error) {
      console.error('❌ 音樂系統初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 播放探索音樂 (Pixel Dreams)
   * 在遊戲開始和草叢探索時播放
   * 切換場景時不中斷
   */
  async playOverworldMusic(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 如果已經在播放探索音樂，不做任何事
    if (this.currentTrack === 'overwork') {
      return;
    }

    try {
      // 停止戰鬥音樂
      if (this.battleMusic) {
        await this.battleMusic.stopAsync();
      }

      // 播放探索音樂
      if (this.overworkMusic) {
        await this.overworkMusic.setPositionAsync(0); // 可選：從頭播放
        await this.overworkMusic.playAsync();
        this.currentTrack = 'overwork';
        console.log('🎵 播放探索音樂: Pixel Dreams');
      }
    } catch (error) {
      console.error('❌ 播放探索音樂失敗:', error);
    }
  }

  /**
   * 播放戰鬥音樂 (Pixelated Showdown)
   * 每次進入戰鬥時從頭播放
   */
  async playBattleMusic(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 停止探索音樂
      if (this.overworkMusic) {
        await this.overworkMusic.stopAsync();
      }

      // 從頭播放戰鬥音樂
      if (this.battleMusic) {
        await this.battleMusic.setPositionAsync(0); // 從頭開始
        await this.battleMusic.playAsync();
        this.currentTrack = 'battle';
        console.log('⚔️ 播放戰鬥音樂: Pixelated Showdown');
      }
    } catch (error) {
      console.error('❌ 播放戰鬥音樂失敗:', error);
    }
  }

  /**
   * 停止所有音樂
   */
  async stopAll(): Promise<void> {
    try {
      if (this.overworkMusic) {
        await this.overworkMusic.stopAsync();
      }
      if (this.battleMusic) {
        await this.battleMusic.stopAsync();
      }
      this.currentTrack = null;
      console.log('🔇 停止所有音樂');
    } catch (error) {
      console.error('❌ 停止音樂失敗:', error);
    }
  }

  /**
   * 暫停當前音樂
   */
  async pause(): Promise<void> {
    try {
      if (this.currentTrack === 'overwork' && this.overworkMusic) {
        await this.overworkMusic.pauseAsync();
      } else if (this.currentTrack === 'battle' && this.battleMusic) {
        await this.battleMusic.pauseAsync();
      }
      console.log('⏸️ 音樂已暫停');
    } catch (error) {
      console.error('❌ 暫停音樂失敗:', error);
    }
  }

  /**
   * 繼續播放當前音樂
   */
  async resume(): Promise<void> {
    try {
      if (this.currentTrack === 'overwork' && this.overworkMusic) {
        await this.overworkMusic.playAsync();
      } else if (this.currentTrack === 'battle' && this.battleMusic) {
        await this.battleMusic.playAsync();
      }
      console.log('▶️ 音樂已恢復');
    } catch (error) {
      console.error('❌ 恢復音樂失敗:', error);
    }
  }

  /**
   * 設置音量
   * @param volume 音量 (0.0 - 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    try {
      if (this.overworkMusic) {
        await this.overworkMusic.setVolumeAsync(clampedVolume);
      }
      if (this.battleMusic) {
        await this.battleMusic.setVolumeAsync(clampedVolume);
      }
      console.log(`🔊 音量設置為: ${clampedVolume}`);
    } catch (error) {
      console.error('❌ 設置音量失敗:', error);
    }
  }

  /**
   * 播放攻擊音效
   * 用於戰鬥中的攻擊動作
   */
  async playHitSound(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.hitSfx) {
        // 重置音效位置到開頭
        await this.hitSfx.setPositionAsync(0);
        await this.hitSfx.playAsync();
        console.log('💥 播放攻擊音效');
      }
    } catch (error) {
      console.error('❌ 播放攻擊音效失敗:', error);
    }
  }

  /**
   * 清理音樂資源
   */
  async cleanup(): Promise<void> {
    try {
      if (this.overworkMusic) {
        await this.overworkMusic.unloadAsync();
        this.overworkMusic = null;
      }
      if (this.battleMusic) {
        await this.battleMusic.unloadAsync();
        this.battleMusic = null;
      }
      if (this.hitSfx) {
        await this.hitSfx.unloadAsync();
        this.hitSfx = null;
      }
      this.currentTrack = null;
      this.isInitialized = false;
      console.log('🗑️ 音樂資源已清理');
    } catch (error) {
      console.error('❌ 清理音樂資源失敗:', error);
    }
  }

  /**
   * 獲取當前播放的音樂
   */
  getCurrentTrack(): 'overwork' | 'battle' | null {
    return this.currentTrack;
  }

  /**
   * 檢查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// 導出單例
export const musicManager = new MusicManager();
