// 素材管理器 - 統一管理所有遊戲素材

export const Assets = {
  // 主角角色動畫
  player: {
    front: {
      idle: require('./characters/player/front/idle_1.png'),
      walk1: require('./characters/player/front/walk_1.png'),
      walk2: require('./characters/player/front/walk_2.png'),
      walk3: require('./characters/player/front/walk_3.png'),
    },
    back: {
      idle: require('./characters/player/back/idle_1.png'),
      walk1: require('./characters/player/back/walk_1.png'),
      walk2: require('./characters/player/back/walk_2.png'),
      walk3: require('./characters/player/back/walk_3.png'),
    },
  },

  // 寶可夢素材
  pokemon: {
    charmander: {
      front: {
        idle: require('./pokemon/charmander/front/idle_1.png'),
        attack: require('./pokemon/charmander/front/attack_1.png'),
      },
      back: {
        idle: require('./pokemon/charmander/back/idle_1.png'),
        attack: require('./pokemon/charmander/back/attack_1.png'),
      },
    },
    squirtle: {
      front: {
        idle: require('./pokemon/squirtle/front/idle_1.png'),
        attack: require('./pokemon/squirtle/front/attack_1.png'),
      },
      back: {
        idle: require('./pokemon/squirtle/back/idle_1.png'),
        attack: require('./pokemon/squirtle/back/attack_1.png'),
      },
    },
  },

  // 地圖磚塊
  tiles: {
    grass: require('./maps/tiles/grass.png'),
    path: require('./maps/tiles/path.png'),
    tree: require('./maps/tiles/tree.png'),
    water: require('./maps/tiles/water.png'),
    building: require('./maps/tiles/building.png'),
  },

  // UI 元素
  ui: {
    logo: require('./ui/logo.png'),
    dialogueBox: require('./ui/dialogue_box.png'),
    hpBarBg: require('./ui/hp_bar_bg.png'),
    hpBarFill: require('./ui/hp_bar_fill.png'),
    skillButton: require('./ui/skill_button.png'),
  },

  // 特效
  vfx: {
    fire: {
      frame1: require('./vfx/fire/fire_1.png'),
      frame2: require('./vfx/fire/fire_2.png'),
      frame3: require('./vfx/fire/fire_3.png'),
    },
    water: {
      frame1: require('./vfx/water/water_1.png'),
      frame2: require('./vfx/water/water_2.png'),
      frame3: require('./vfx/water/water_3.png'),
    },
    impact: {
      frame1: require('./vfx/impact/impact_1.png'),
      frame2: require('./vfx/impact/impact_2.png'),
      frame3: require('./vfx/impact/impact_3.png'),
    },
  },

  // 背景
  backgrounds: {
    battle: require('./backgrounds/battle_grass.png'),
    startScreen: require('./backgrounds/start_screen.png'),
  },
};

// 輔助函數：獲取動畫幀
export const getAnimationFrames = (
  category: keyof typeof Assets,
  subcategory: string,
  animation: string
) => {
  const asset = Assets[category] as any;
  if (!asset || !asset[subcategory] || !asset[subcategory][animation]) {
    return [];
  }
  return Object.values(asset[subcategory][animation]);
};

export default Assets;
