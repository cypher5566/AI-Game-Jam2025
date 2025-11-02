// 創建彩色佔位符圖片的腳本
// 使用 Node.js Canvas 或簡單的 SVG

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../src/assets');

// 創建 SVG 佔位符
function createSVGPlaceholder(width, height, color, label, outputPath) {
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${color}"/>
  <text x="50%" y="50%" text-anchor="middle" fill="white" font-family="monospace" font-size="8">
    ${label}
  </text>
</svg>
  `.trim();

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, svg);
  console.log(`✓ Created: ${outputPath}`);
}

// Phase 1 必須素材（佔位符）
const placeholders = [
  // 主角
  { path: 'characters/player/front/idle_1.png', size: 32, color: '#FF6B6B', label: 'Player F' },
  { path: 'characters/player/back/idle_1.png', size: 32, color: '#FF6B6B', label: 'Player B' },

  // 小火龍
  { path: 'pokemon/charmander/front/idle_1.png', size: 64, color: '#FFA500', label: 'Char F' },
  { path: 'pokemon/charmander/back/idle_1.png', size: 64, color: '#FFA500', label: 'Char B' },
  { path: 'pokemon/charmander/front/attack_1.png', size: 64, color: '#FF4500', label: 'Char A' },
  { path: 'pokemon/charmander/back/attack_1.png', size: 64, color: '#FF4500', label: 'Char A' },

  // 傑尼龜
  { path: 'pokemon/squirtle/front/idle_1.png', size: 64, color: '#4A90E2', label: 'Squir F' },
  { path: 'pokemon/squirtle/back/idle_1.png', size: 64, color: '#4A90E2', label: 'Squir B' },
  { path: 'pokemon/squirtle/front/attack_1.png', size: 64, color: '#2E5C8A', label: 'Squir A' },
  { path: 'pokemon/squirtle/back/attack_1.png', size: 64, color: '#2E5C8A', label: 'Squir A' },

  // 地圖磚塊
  { path: 'maps/tiles/grass.png', size: 32, color: '#7CB342', label: 'Grass' },
  { path: 'maps/tiles/path.png', size: 32, color: '#D4A373', label: 'Path' },
  { path: 'maps/tiles/tree.png', size: 32, color: '#558B2F', label: 'Tree' },
];

console.log('Creating placeholder assets...\n');

placeholders.forEach(({ path: relPath, size, color, label }) => {
  const fullPath = path.join(ASSETS_DIR, relPath);
  createSVGPlaceholder(size, size, color, label, fullPath);
});

console.log('\n✅ All placeholders created!');
console.log('📁 Location: src/assets/');
console.log('💡 Replace these with real assets from AI generation tools');
