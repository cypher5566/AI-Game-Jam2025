// 遊戲核心類型定義

export type PokemonType = 'fire' | 'water' | 'electric' | 'normal';

export interface Skill {
  id: string;
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;
  description: string;
}

export interface Pokemon {
  id: string;
  name: string;
  type: PokemonType;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  skills: Skill[];
  frontSprite: string;  // 正面圖（敵方）
  backSprite: string;   // 背面圖（我方）
}

export interface BattleState {
  playerPokemon: Pokemon;
  enemyPokemon: Pokemon;
  turn: 'player' | 'enemy';
  isAnimating: boolean;
  battleLog: string[];
  battleResult?: 'win' | 'lose' | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface MapTile {
  type: 'grass' | 'path' | 'water' | 'tree' | 'building';
  walkable: boolean;
  encounterRate?: number;  // 0-1，遇敵機率
}

export interface DialogueMessage {
  speaker: string;
  text: string;
  avatar?: string;
  requiresInput?: boolean;  // 是否需要玩家輸入
}

export interface GameState {
  currentScreen: 'start' | 'dialogue' | 'map' | 'battle' | 'skillSelection' | 'loading' | 'error' | 'imageUpload';
  playerPosition: Position;
  playerPokemon: Pokemon[];
  battleState?: BattleState;
  dialogueIndex: number;
  hasSeenIntro: boolean;
  pokemonNickname?: string;  // 玩家的寶可夢暱稱
  // 圖片上傳相關
  uploadedImage?: string;  // 上傳的圖片（base64 或 URL）
  pokemonType?: PokemonType;  // Server 返回的寶可夢屬性
  // 技能選擇相關狀態
  fetchedMoves?: Skill[];  // 當前戰鬥使用的 12 個招式
  selectedSkills?: Skill[];  // 玩家選擇的 4 個技能
  currentEnemy?: Pokemon;  // 當前要戰鬥的敵人
  // 技能預加載相關狀態
  skillBuffer: Skill[];  // 技能緩衝池（24個技能）
  isPreloading: boolean;  // 背景是否正在預加載
  skillsLoaded: boolean;  // 初始技能是否已載入
  // 錯誤處理
  errorMessage?: string;  // 錯誤訊息
}

// API 相關類型
export interface DamageCalculationRequest {
  attackerId: string;
  defenderId: string;
  skillId: string;
  attackerLevel: number;
  attackerAttack: number;
  defenderDefense: number;
  skillPower: number;
  typeEffectiveness: number;
}

export interface DamageCalculationResponse {
  damage: number;
  isCritical: boolean;
  effectiveness: 'super' | 'normal' | 'not-very';
  message: string;
}
