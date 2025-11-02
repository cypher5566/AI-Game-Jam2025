# 🚀 部署指南

本指南說明如何將寶可夢對戰遊戲部署到各個網路平台。

## 📋 前置準備

確保已完成：
- ✅ 開發環境正常運行 (`npm run web`)
- ✅ 所有依賴已安裝
- ✅ 專案通過本地測試

---

## 1️⃣ 部署到 Vercel（推薦）

### 方法 A：使用 Vercel CLI

1. **安裝 Vercel CLI**

```bash
npm install -g vercel
```

2. **登入 Vercel**

```bash
vercel login
```

3. **構建專案**

```bash
npm run build:web
```

4. **部署**

```bash
cd web-build
vercel --prod
```

### 方法 B：使用 Git + Vercel Dashboard

1. **將專案推送到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pokemon-battle.git
git push -u origin main
```

2. **在 Vercel Dashboard 中導入**

- 訪問 https://vercel.com
- 點擊 "Import Project"
- 選擇你的 GitHub repository
- 構建設置：
  - **Framework Preset**: Other
  - **Build Command**: `npm run build:web`
  - **Output Directory**: `web-build`
  - **Install Command**: `npm install`

3. **部署**

點擊 "Deploy" 按鈕，Vercel 會自動構建和部署你的專案。

### 環境變數（如果需要）

如果你的專案需要 API 端點，在 Vercel Dashboard 中設置環境變數：

- `REACT_APP_API_BASE_URL`: 你的 API 基礎 URL

---

## 2️⃣ 部署到 Netlify

### 方法 A：使用 Netlify CLI

1. **安裝 Netlify CLI**

```bash
npm install -g netlify-cli
```

2. **登入 Netlify**

```bash
netlify login
```

3. **構建專案**

```bash
npm run build:web
```

4. **初始化並部署**

```bash
netlify init
netlify deploy --prod --dir=web-build
```

### 方法 B：使用拖放部署

1. **構建專案**

```bash
npm run build:web
```

2. **訪問 Netlify**

前往 https://app.netlify.com/drop

3. **拖放資料夾**

將 `web-build` 資料夾直接拖放到頁面上

### 方法 C：使用 Git + Netlify Dashboard

1. **將專案推送到 GitHub**（同上）

2. **在 Netlify Dashboard 中導入**

- 訪問 https://app.netlify.com
- 點擊 "New site from Git"
- 選擇你的 repository
- 構建設置：
  - **Build command**: `npm run build:web`
  - **Publish directory**: `web-build`

---

## 3️⃣ 部署到 GitHub Pages

1. **安裝 gh-pages**

```bash
npm install --save-dev gh-pages
```

2. **更新 package.json**

添加以下內容：

```json
{
  "homepage": "https://yourusername.github.io/pokemon-battle",
  "scripts": {
    "predeploy": "npm run build:web",
    "deploy": "gh-pages -d web-build"
  }
}
```

3. **部署**

```bash
npm run deploy
```

4. **啟用 GitHub Pages**

- 前往你的 GitHub repository
- Settings → Pages
- Source: 選擇 `gh-pages` 分支
- 保存

幾分鐘後，你的遊戲會在 `https://yourusername.github.io/pokemon-battle` 上線。

---

## 4️⃣ 部署到 AWS S3 + CloudFront

### 步驟

1. **創建 S3 Bucket**

```bash
aws s3 mb s3://pokemon-battle-game
```

2. **配置靜態網站托管**

```bash
aws s3 website s3://pokemon-battle-game --index-document index.html --error-document index.html
```

3. **構建並上傳**

```bash
npm run build:web
aws s3 sync web-build/ s3://pokemon-battle-game --acl public-read
```

4. **（可選）設置 CloudFront**

創建 CloudFront 分配以獲得更好的性能和 HTTPS 支持。

---

## 🔧 構建優化

### 優化包大小

1. **檢查包大小**

```bash
npx expo export:web --analyze
```

2. **減小包體積的建議**
- 移除未使用的依賴
- 使用動態導入拆分代碼
- 壓縮圖片資源

### 性能優化

在部署前檢查：
- ✅ 圖片已優化（使用 WebP 格式）
- ✅ 啟用 gzip/brotli 壓縮
- ✅ 配置緩存頭
- ✅ 使用 CDN

---

## 🌐 自定義域名

### Vercel

1. 在 Vercel Dashboard → Settings → Domains
2. 添加你的自定義域名
3. 按照說明配置 DNS

### Netlify

1. 在 Netlify Dashboard → Domain settings
2. 添加自定義域名
3. 更新你的 DNS 記錄

### GitHub Pages

1. 在 repository Settings → Pages
2. 添加自定義域名
3. 創建 `CNAME` 文件在 `web-build` 目錄

---

## 🔐 環境變數

如果需要使用環境變數（例如 API 端點）：

### 在本地

創建 `.env` 文件：

```env
REACT_APP_API_BASE_URL=https://api.example.com
```

### 在 Vercel

Dashboard → Settings → Environment Variables

### 在 Netlify

Dashboard → Site settings → Build & deploy → Environment

### 在代碼中使用

```typescript
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
```

---

## 🐛 常見問題

### 問題 1: 路由不工作（404 錯誤）

**解決方案**:
- Vercel: 已在 `vercel.json` 中配置
- Netlify: 創建 `_redirects` 文件

```
# netlify/_redirects
/*    /index.html   200
```

### 問題 2: 資源載入失敗

**解決方案**:
檢查 `app.json` 中的 `assetBundlePatterns`：

```json
{
  "expo": {
    "assetBundlePatterns": [
      "**/*"
    ]
  }
}
```

### 問題 3: 構建失敗

**解決方案**:
1. 清除快取: `rm -rf node_modules .expo`
2. 重新安裝: `npm install`
3. 重新構建: `npm run build:web`

### 問題 4: 版本衝突警告

如果看到類似的警告：
```
react-native-screens@4.18.0 - expected version: ~4.16.0
```

**解決方案**:
```bash
npx expo install --fix
```

---

## 📊 監控與分析

### 添加 Google Analytics

1. 安裝依賴

```bash
npm install react-ga4
```

2. 在 `App.tsx` 中初始化

```typescript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
```

### 錯誤追蹤

考慮集成：
- Sentry
- LogRocket
- Bugsnag

---

## ✅ 部署檢查清單

部署前確認：

- [ ] 本地測試通過
- [ ] 所有功能正常運作
- [ ] 圖片和資源已優化
- [ ] 環境變數已設置
- [ ] API 端點已配置
- [ ] HTTPS 已啟用
- [ ] 自定義域名已設置（如需要）
- [ ] 錯誤追蹤已配置
- [ ] 分析工具已添加

---

## 🎉 部署完成！

你的遊戲現在已經在網路上運行了！

### 分享你的遊戲

- 📱 分享 URL 給朋友測試
- 🐦 在社交媒體上分享
- 🎮 收集用戶反饋
- 🔧 持續優化和改進

---

## 📚 更多資源

- [Expo 文檔](https://docs.expo.dev/)
- [React Native Web 文檔](https://necolas.github.io/react-native-web/)
- [Vercel 文檔](https://vercel.com/docs)
- [Netlify 文檔](https://docs.netlify.com/)

---

**祝你部署順利！** 🚀
