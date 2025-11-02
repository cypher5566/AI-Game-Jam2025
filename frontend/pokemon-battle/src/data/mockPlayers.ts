import { Pokemon } from '../types';
import { createPokemon, POKEMON_DATA } from './pokemon';

const mockNames = [
  '小智', '小霞', '小剛', '阿渡', '希巴',
  '菊子', '科拿', '綠', '赤紅', '銀'
];

/**
 * 玩家戰鬥數據
 */
export interface PlayerInBattle {
  id: string;
  name: string;
  pokemon: Pokemon;
  isOnline: boolean;
  hasSelected: boolean;  // 是否已選擇技能
  selectedSkillId?: string;  // 選擇的技能 ID
}

/**
 * 生成假玩家資料
 */
export const generateMockPlayers = (count: number, includeRealPlayer: boolean = false): PlayerInBattle[] => {
  const players: PlayerInBattle[] = [];
  const pokemonIds = Object.keys(POKEMON_DATA);

  // 如果包含真實玩家,count 減 1
  const mockCount = includeRealPlayer ? count - 1 : count;

  for (let i = 0; i < mockCount; i++) {
    const pokemonId = pokemonIds[i % pokemonIds.length];
    const pokemon = createPokemon(pokemonId, 5 + i);

    players.push({
      id: `mock-player-${i + 1}`,
      name: mockNames[i % mockNames.length],
      pokemon: pokemon,
      isOnline: true,
      hasSelected: false,
      selectedSkillId: undefined,
    });
  }

  return players;
};

/**
 * 模擬假玩家自動選擇技能
 */
export const simulateMockPlayerChoice = (player: PlayerInBattle): string => {
  // 隨機選擇一個技能
  const randomSkill = player.pokemon.skills[
    Math.floor(Math.random() * player.pokemon.skills.length)
  ];

  return randomSkill.id;
};
