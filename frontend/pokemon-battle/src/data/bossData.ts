import { Pokemon } from '../types';

/**
 * Boss 資料定義
 */
export const BOSSES: { [key: string]: Omit<Pokemon, 'currentHp'> } = {
  snorlax: {
    id: 'boss-snorlax',
    name: '卡比獸 (Boss)',
    type: 'normal',
    level: 50,
    maxHp: 3000,
    attack: 110,
    defense: 65,
    speed: 30,
    skills: [
      {
        id: 'body-slam',
        name: '泰山壓頂',
        type: 'normal',
        power: 85,
        accuracy: 100,
        description: '用整個身體壓住對手攻擊',
      },
      {
        id: 'hyper-beam',
        name: '破壞光線',
        type: 'normal',
        power: 150,
        accuracy: 90,
        description: '發射強烈的光線攻擊對手',
      },
      {
        id: 'rest',
        name: '睡覺',
        type: 'normal',
        power: 0,
        accuracy: 100,
        description: '睡2回合恢復全部HP',
      },
    ],
    frontSprite: 'snorlax_front',
    backSprite: 'snorlax_back',
  },

  mewtwo: {
    id: 'boss-mewtwo',
    name: '超夢 (Boss)',
    type: 'normal',
    level: 70,
    maxHp: 5000,
    attack: 154,
    defense: 90,
    speed: 130,
    skills: [
      {
        id: 'psychic',
        name: '精神強念',
        type: 'normal',
        power: 90,
        accuracy: 100,
        description: '用強大的念力攻擊對手',
      },
      {
        id: 'shadow-ball',
        name: '暗影球',
        type: 'normal',
        power: 80,
        accuracy: 100,
        description: '投擲一團黑影進行攻擊',
      },
      {
        id: 'aura-sphere',
        name: '波導彈',
        type: 'normal',
        power: 80,
        accuracy: 100,
        description: '從體內產生出波導之力',
      },
    ],
    frontSprite: 'mewtwo_front',
    backSprite: 'mewtwo_back',
  },
};

/**
 * 創建 Boss 實例
 */
export const createBoss = (bossId: string): Pokemon => {
  const template = BOSSES[bossId];
  if (!template) {
    throw new Error(`Boss ${bossId} not found`);
  }

  return {
    ...template,
    currentHp: template.maxHp,
  };
};

/**
 * 獲取隨機 Boss
 */
export const getRandomBoss = (): Pokemon => {
  const bossKeys = Object.keys(BOSSES);
  const randomKey = bossKeys[Math.floor(Math.random() * bossKeys.length)];
  return createBoss(randomKey);
};
