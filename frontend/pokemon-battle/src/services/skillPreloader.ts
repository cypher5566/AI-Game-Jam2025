import { Skill } from '../types';
import { fetchPokemonMoves } from './pokemonMovesAPI';

/**
 * 技能預加載服務
 * 管理技能緩衝池，確保始終有24個技能可用
 */
class SkillPreloader {
  private skillBuffer: Skill[] = [];
  private isPreloading: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  /**
   * 初始化技能緩衝池
   * 加載2次API，總共24個技能
   */
  async initializeSkills(type: string = '火'): Promise<Skill[]> {
    this.skillBuffer = [];
    this.retryCount = 0;

    try {
      // 第一批12個技能
      const batch1 = await this.fetchWithRetry(type);
      this.skillBuffer.push(...batch1);

      // 第二批12個技能
      const batch2 = await this.fetchWithRetry(type);
      this.skillBuffer.push(...batch2);

      return [...this.skillBuffer];
    } catch (error) {
      console.error('初始化技能失敗:', error);
      throw new Error('連線異常 請重啟遊戲');
    }
  }

  /**
   * 從緩衝池中取出12個技能供戰鬥使用
   */
  consumeSkills(): Skill[] {
    if (this.skillBuffer.length < 12) {
      throw new Error('技能緩衝池不足');
    }

    // 取出前12個技能
    const consumed = this.skillBuffer.splice(0, 12);
    return consumed;
  }

  /**
   * 背景預加載下一批12個技能
   */
  async preloadNextBatch(type: string = '火'): Promise<void> {
    if (this.isPreloading) {
      console.log('已經在預加載中，跳過');
      return;
    }

    this.isPreloading = true;
    this.retryCount = 0;

    try {
      const newSkills = await this.fetchWithRetry(type);
      this.skillBuffer.push(...newSkills);
      console.log('預加載成功，當前緩衝池大小:', this.skillBuffer.length);
    } catch (error) {
      console.error('背景預加載失敗:', error);
      throw new Error('連線異常 請重啟遊戲');
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 帶重試機制的API請求
   * 使用 exponential backoff：1秒、2秒、4秒
   */
  private async fetchWithRetry(type: string, attempt: number = 0): Promise<Skill[]> {
    try {
      const skills = await fetchPokemonMoves(type);

      // 重置重試計數
      if (attempt > 0) {
        console.log(`第 ${attempt + 1} 次重試成功`);
      }

      return skills;
    } catch (error) {
      if (attempt < this.maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`API 請求失敗，${delay}ms 後重試 (${attempt + 1}/${this.maxRetries})`);

        await this.sleep(delay);
        return this.fetchWithRetry(type, attempt + 1);
      } else {
        console.error(`重試 ${this.maxRetries} 次後仍然失敗`);
        throw error;
      }
    }
  }

  /**
   * 獲取當前緩衝池狀態
   */
  getStatus(): {
    bufferSize: number;
    isPreloading: boolean;
    hasEnoughSkills: boolean;
  } {
    return {
      bufferSize: this.skillBuffer.length,
      isPreloading: this.isPreloading,
      hasEnoughSkills: this.skillBuffer.length >= 12,
    };
  }

  /**
   * 獲取當前緩衝池的技能（不消耗）
   */
  getBufferedSkills(): Skill[] {
    return [...this.skillBuffer];
  }

  /**
   * 檢查是否有足夠的技能
   */
  hasEnoughSkills(): boolean {
    return this.skillBuffer.length >= 12;
  }

  /**
   * 檢查是否正在預加載
   */
  isCurrentlyPreloading(): boolean {
    return this.isPreloading;
  }

  /**
   * 等待預加載完成
   */
  async waitForPreload(): Promise<void> {
    while (this.isPreloading) {
      await this.sleep(100);
    }
  }

  /**
   * 重置緩衝池（用於測試或重啟）
   */
  reset(): void {
    this.skillBuffer = [];
    this.isPreloading = false;
    this.retryCount = 0;
  }

  /**
   * 延遲函式
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 導出單例
export const skillPreloader = new SkillPreloader();
