import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, Pokemon, BattleState, Position, Skill, PokemonType } from '../types';
import { PLAYER_START_POSITION } from '../data/maps';
import { createPokemon } from '../data/pokemon';
import { skillPreloader } from '../services/skillPreloader';

// 初始狀態
const initialState: GameState = {
  currentScreen: 'start',
  playerPosition: PLAYER_START_POSITION,
  playerPokemon: [createPokemon('charmander', 5)],
  dialogueIndex: 0,
  hasSeenIntro: false,
  // 技能預加載相關狀態
  skillBuffer: [],
  isPreloading: false,
  skillsLoaded: false,
};

// Action 類型
type GameAction =
  | { type: 'SET_SCREEN'; screen: GameState['currentScreen'] }
  | { type: 'MOVE_PLAYER'; position: Position }
  // 圖片上傳相關
  | { type: 'SKIP_IMAGE_UPLOAD' }
  | { type: 'SET_UPLOADED_IMAGE'; image: string }
  | { type: 'SET_POKEMON_TYPE'; pokemonType: PokemonType }
  | { type: 'SET_POKEMON_IMAGES'; frontImage: string; backImage: string }
  | { type: 'SET_AI_TYPE'; pokemonType: string }
  // 技能預加載相關
  | { type: 'START_LOADING_SKILLS' }
  | { type: 'SKILLS_LOADED' }
  | { type: 'SET_SKILL_BUFFER'; skills: Skill[] }
  | { type: 'START_PRELOADING' }
  | { type: 'PRELOADING_COMPLETE' }
  // 技能選擇相關
  | { type: 'START_SKILL_SELECTION'; enemyPokemon: Pokemon }
  | { type: 'SET_FETCHED_MOVES'; moves: Skill[] }
  | { type: 'SET_SELECTED_SKILLS'; skills: Skill[] }
  // 戰鬥相關
  | { type: 'START_BATTLE' }
  | { type: 'UPDATE_BATTLE'; battleState: Partial<BattleState> }
  | { type: 'END_BATTLE'; result: 'win' | 'lose' }
  // 對話相關
  | { type: 'NEXT_DIALOGUE' }
  | { type: 'RESET_DIALOGUE' }
  | { type: 'SET_HAS_SEEN_INTRO'; value: boolean }
  | { type: 'SET_POKEMON_NICKNAME'; nickname: string }
  // 錯誤處理
  | { type: 'SET_ERROR'; message: string };

// Reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.screen };

    case 'MOVE_PLAYER':
      return { ...state, playerPosition: action.position };

    // 開始載入技能（對話結束後）
    case 'START_LOADING_SKILLS':
      return {
        ...state,
        currentScreen: 'loading',
        skillsLoaded: false,
      };

    // 技能載入完成
    case 'SKILLS_LOADED':
      // 從 skillPreloader 取得緩衝池
      const buffer = skillPreloader.getBufferedSkills();
      return {
        ...state,
        currentScreen: 'map',
        skillBuffer: buffer,
        skillsLoaded: true,
      };

    // 設定技能緩衝池
    case 'SET_SKILL_BUFFER':
      return {
        ...state,
        skillBuffer: action.skills,
      };

    // 開始背景預加載
    case 'START_PRELOADING':
      return {
        ...state,
        isPreloading: true,
      };

    // 預加載完成
    case 'PRELOADING_COMPLETE':
      const updatedBuffer = skillPreloader.getBufferedSkills();
      return {
        ...state,
        skillBuffer: updatedBuffer,
        isPreloading: false,
      };

    // 開始技能選擇（觸發戰鬥時）
    case 'START_SKILL_SELECTION':
      // 從緩衝池中消耗12個技能
      try {
        const consumedSkills = skillPreloader.consumeSkills();

        return {
          ...state,
          currentScreen: 'skillSelection',
          currentEnemy: action.enemyPokemon,
          fetchedMoves: consumedSkills, // 使用緩衝池的技能
          selectedSkills: undefined,
        };
      } catch (error) {
        console.error('技能緩衝池不足:', error);
        // 如果緩衝池不足，進入載入畫面
        return {
          ...state,
          currentScreen: 'loading',
          currentEnemy: action.enemyPokemon,
        };
      }

    case 'SET_FETCHED_MOVES':
      return {
        ...state,
        fetchedMoves: action.moves,
      };

    case 'SET_SELECTED_SKILLS':
      return {
        ...state,
        selectedSkills: action.skills,
      };

    // 開始戰鬥
    case 'START_BATTLE':
      if (!state.currentEnemy || !state.selectedSkills) return state;

      // 將選擇的技能設定給玩家的寶可夢
      const playerPokemonWithSkills = {
        ...state.playerPokemon[0],
        skills: state.selectedSkills,
      };

      return {
        ...state,
        currentScreen: 'battle',
        battleState: {
          playerPokemon: playerPokemonWithSkills,
          enemyPokemon: state.currentEnemy,
          turn: 'player',
          isAnimating: false,
          battleLog: [],
          battleResult: null,
        },
      };

    case 'UPDATE_BATTLE':
      if (!state.battleState) return state;
      return {
        ...state,
        battleState: { ...state.battleState, ...action.battleState },
      };

    // 戰鬥結束
    case 'END_BATTLE':
      // 背景預加載下一批技能
      if (skillPreloader.hasEnoughSkills()) {
        // 在背景預加載（不阻塞UI）
        skillPreloader.preloadNextBatch('火')
          .then(() => {
            console.log('背景預加載成功');
            // 這裡不需要 dispatch，因為下次觸發戰鬥時會自動使用新的緩衝池
          })
          .catch((error) => {
            console.error('背景預加載失敗:', error);
            // 預加載失敗不影響當前流程
          });
      }

      return {
        ...state,
        currentScreen: 'map',
        battleState: undefined,
        currentEnemy: undefined,
        fetchedMoves: undefined,
        selectedSkills: undefined,
      };

    // 圖片上傳相關
    case 'SKIP_IMAGE_UPLOAD':
      // 跳過圖片上傳，繼續對話流程
      return {
        ...state,
        currentScreen: 'dialogue',
        dialogueIndex: state.dialogueIndex + 1,
      };

    case 'SET_UPLOADED_IMAGE':
      return {
        ...state,
        uploadedImage: action.image,
      };

    case 'SET_POKEMON_TYPE':
      // TODO: 根據 AI 判定的屬性更新玩家寶可夢
      return {
        ...state,
        pokemonType: action.pokemonType,
      };

    case 'SET_POKEMON_IMAGES':
      // 儲存 AI 生成的前後圖片，並立即應用到玩家寶可夢
      const updatedPokemonWithImages = state.playerPokemon.map((pokemon, index) => {
        if (index === 0) {
          // 更新第一隻寶可夢的圖片（base64 data URI 格式）
          return {
            ...pokemon,
            frontSprite: action.frontImage,  // data:image/png;base64,...
            backSprite: action.backImage,    // data:image/png;base64,...
          };
        }
        return pokemon;
      });

      console.log('[GameContext] 已更新玩家寶可夢圖片');

      return {
        ...state,
        uploadedFrontImage: action.frontImage,
        uploadedBackImage: action.backImage,
        playerPokemon: updatedPokemonWithImages,
      };

    case 'SET_AI_TYPE':
      // 儲存 AI 判定的屬性，並更新玩家寶可夢的屬性
      const updatedPokemonWithType = state.playerPokemon.map((pokemon, index) => {
        if (index === 0) {
          // 更新第一隻寶可夢的屬性
          return {
            ...pokemon,
            type: action.pokemonType as any,
          };
        }
        return pokemon;
      });

      console.log('[GameContext] 已更新玩家寶可夢屬性:', action.pokemonType);

      return {
        ...state,
        aiDeterminedType: action.pokemonType,
        playerPokemon: updatedPokemonWithType,
      };

    // 對話相關
    case 'NEXT_DIALOGUE':
      return { ...state, dialogueIndex: state.dialogueIndex + 1 };

    case 'RESET_DIALOGUE':
      return { ...state, dialogueIndex: 0 };

    case 'SET_HAS_SEEN_INTRO':
      return { ...state, hasSeenIntro: action.value };

    case 'SET_POKEMON_NICKNAME':
      // 更新玩家寶可夢的名稱
      const updatedPlayerPokemon = state.playerPokemon.map((pokemon, index) => {
        if (index === 0) {  // 更新第一隻寶可夢
          return { ...pokemon, name: action.nickname };
        }
        return pokemon;
      });
      return {
        ...state,
        pokemonNickname: action.nickname,
        playerPokemon: updatedPlayerPokemon,
      };

    // 錯誤處理
    case 'SET_ERROR':
      return {
        ...state,
        currentScreen: 'error',
        errorMessage: action.message,
      };

    default:
      return state;
  }
};

// Context
const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

// Provider
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Hook
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
