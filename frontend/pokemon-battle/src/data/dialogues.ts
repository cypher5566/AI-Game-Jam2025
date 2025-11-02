import { DialogueMessage } from '../types';

// 前情提要對話
export const INTRO_DIALOGUES: DialogueMessage[] = [
  {
    speaker: '博士',
    text: '歡迎來到寶可夢的世界！',
  },
  {
    speaker: '博士',
    text: '在這個世界裡，有著許多神奇的生物，我們稱之為「寶可夢」。',
  },
  {
    speaker: '博士',
    text: '人們與寶可夢一起生活，互相幫助，成為最好的夥伴。',
  },
  {
    speaker: '博士',
    text: '在開始冒險前，告訴我你的寶可夢是什麼？請上傳一張圖片！',
    requiresInput: true,  // 觸發圖片上傳
  },
  {
    speaker: '博士',
    text: '很好！現在，給你的寶可夢取個名字吧！',
    requiresInput: true,  // 觸發命名輸入
  },
  {
    speaker: '博士',
    text: '{nickname}！真是個好名字！從今天起，{nickname}就是你的夥伴了！',
  },
  {
    speaker: '博士',
    text: '很好！現在和{nickname}一起到外面的草叢探索看看吧。',
  },
  {
    speaker: '博士',
    text: '當你遇到野生寶可夢時，就會進入戰鬥。用你的技能擊敗對手吧！',
  },
  {
    speaker: '博士',
    text: '祝你好運，新手訓練家！',
  }
];

// 戰鬥開始對話
export const BATTLE_START_MESSAGE = '野生的寶可夢出現了！';

// 戰鬥勝利對話
export const BATTLE_WIN_MESSAGES = [
  '你贏得了戰鬥！',
  '獲得了經驗值！',
];

// 戰鬥失敗對話
export const BATTLE_LOSE_MESSAGES = [
  '你的寶可夢失去戰鬥能力了...',
  '趕快回到精靈中心恢復吧！',
];
