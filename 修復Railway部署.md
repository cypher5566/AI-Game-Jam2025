# 🔧 Railway 部署修復方案

## 問題
Railway 還在使用舊的 requirements.txt，沒有拉取最新的 GitHub 代碼。

## ✅ 解決方案（2 種方式）

### **方式 1: 手動編輯 requirements.txt（最快）**

1. 在 Railway Dashboard
2. 點擊 GenPoke service
3. 點擊上方的 **"Code"** 或 **"Source"** 標籤
4. 找到並點擊 `requirements.txt` 文件
5. 找到這兩行並修改：

**修改前（舊的）：**
```
supabase==2.0.3
httpx==0.25.2
```

**修改後（新的）：**
```
supabase>=2.0.0
httpx>=0.24.0
```

6. 點擊保存
7. Railway 會自動觸發重新部署

---

### **方式 2: 強制從 GitHub 拉取最新代碼**

1. 在 Railway Dashboard
2. 點擊 GenPoke service
3. 點擊 **Settings** 標籤
4. 找到 **Source** 區域
5. 點擊 **"Reconnect"** 或 **"Redeploy"**
6. 確保選擇最新的 commit: `7b2a52c2 - fix: 修復 httpx 與 supabase 的依賴衝突`

---

## 🎯 推薦方式 1（最快）

直接在 Railway 編輯文件只需要 30 秒！

修改完成後，Railway 會自動：
1. 檢測到文件變更
2. 觸發重新部署
3. 這次應該會成功！

---

## ✅ 修改內容（複製這個）

找到 requirements.txt 中的這兩行：

**第 14 行：**
```
supabase>=2.0.0  # 使用最新版本以支援 httpx 0.25.x
```

**第 33 行：**
```
httpx>=0.24.0  # 與 supabase 兼容的版本
```

---

**修改完成後等待 3-5 分鐘，應該就會部署成功了！** 🚀
