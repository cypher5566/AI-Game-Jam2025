import { Pokemon, Skill } from '../types';

// 技能數據
export const SKILLS: Record<string, Skill> = {
  // 火系技能
  ember: {
    id: 'ember',
    name: '火花',
    type: 'fire',
    power: 40,
    accuracy: 100,
    description: '發射小火焰攻擊對手'
  },
  flamethrower: {
    id: 'flamethrower',
    name: '噴射火焰',
    type: 'fire',
    power: 90,
    accuracy: 100,
    description: '向對手噴射烈焰'
  },
  fireBlast: {
    id: 'fireBlast',
    name: '大字爆炎',
    type: 'fire',
    power: 110,
    accuracy: 85,
    description: '用大字型火焰燒盡對手'
  },

  // 水系技能
  waterGun: {
    id: 'waterGun',
    name: '水槍',
    type: 'water',
    power: 40,
    accuracy: 100,
    description: '向對手噴射水柱'
  },
  bubble: {
    id: 'bubble',
    name: '泡泡',
    type: 'water',
    power: 40,
    accuracy: 100,
    description: '向對手發射大量泡泡'
  },
  hydroPump: {
    id: 'hydroPump',
    name: '水炮',
    type: 'water',
    power: 110,
    accuracy: 80,
    description: '向對手猛烈地噴射水柱'
  },
  surf: {
    id: 'surf',
    name: '衝浪',
    type: 'water',
    power: 90,
    accuracy: 100,
    description: '掀起大浪攻擊對手'
  },

  // 電系技能
  thunderShock: {
    id: 'thunderShock',
    name: '電擊',
    type: 'electric',
    power: 40,
    accuracy: 100,
    description: '用電擊攻擊對手'
  },
  thunderbolt: {
    id: 'thunderbolt',
    name: '十萬伏特',
    type: 'electric',
    power: 90,
    accuracy: 100,
    description: '向對手發射強力電流'
  },

  // 普通技能
  tackle: {
    id: 'tackle',
    name: '撞擊',
    type: 'normal',
    power: 40,
    accuracy: 100,
    description: '用整個身體撞向對手'
  },
  scratch: {
    id: 'scratch',
    name: '抓',
    type: 'normal',
    power: 40,
    accuracy: 100,
    description: '用尖銳的爪子抓對手'
  }
};

// 2 隻寶可夢數據
export const POKEMON_DATA: Record<string, Omit<Pokemon, 'currentHp'>> = {
  charmander: {
    id: 'charmander',
    name: '小火龍',
    type: 'fire',
    level: 5,
    maxHp: 39,
    attack: 52,
    defense: 43,
    speed: 65,
    skills: [
      SKILLS.ember,
      SKILLS.scratch,
      SKILLS.flamethrower,
      SKILLS.fireBlast
    ],
    frontSprite: 'charmander_front',
    backSprite: 'charmander_back'
  },
  squirtle: {
    id: 'squirtle',
    name: '傑尼龜',
    type: 'water',
    level: 5,
    maxHp: 44,
    attack: 48,
    defense: 65,
    speed: 43,
    skills: [
      SKILLS.waterGun,
      SKILLS.tackle,
      SKILLS.bubble,
      SKILLS.surf
    ],
    frontSprite: 'squirtle_front',
    backSprite: 'squirtle_back'
  }
};

// 創建寶可夢實例的輔助函數
export const createPokemon = (pokemonId: string, level?: number): Pokemon => {
  const template = POKEMON_DATA[pokemonId];
  if (!template) {
    throw new Error(`Pokemon ${pokemonId} not found`);
  }

  return {
    ...template,
    level: level || template.level,
    currentHp: template.maxHp,
  };
};

// 屬性相剋表
export const TYPE_EFFECTIVENESS: Record<PokemonType, Record<PokemonType, number>> = {
  fire: {
    fire: 0.5,
    water: 0.5,
    electric: 1,
    normal: 1
  },
  water: {
    fire: 2,
    water: 0.5,
    electric: 0.5,
    normal: 1
  },
  electric: {
    fire: 1,
    water: 2,
    electric: 0.5,
    normal: 1
  },
  normal: {
    fire: 1,
    water: 1,
    electric: 1,
    normal: 1
  }
};

// 用於 TypeScript
type PokemonType = 'fire' | 'water' | 'electric' | 'normal';
