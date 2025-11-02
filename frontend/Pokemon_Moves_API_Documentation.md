# 寶可夢招式 API 文件

## API 概述
這是一個基於 Google Apps Script 的 RESTful API,用於從 Google Sheets 中隨機獲取寶可夢招式資料。

## 基本資訊
- **請求方法**: GET
- **回應格式**: JSON
- **字元編碼**: UTF-8
- **API 端點**: `https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec`

## 請求參數

| 參數名 | 類型 | 必填 | 說明 | 範例 |
|--------|------|------|------|------|
| type1 | string | 是 | 第一個屬性 | 火、水、草 |
| type2 | string | 否 | 第二個屬性 | 電、冰、龍 |

## 請求範例

### 單一屬性查詢
```
GET https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec?type1=火
```

### 兩個屬性查詢
```
GET https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec?type1=火&type2=水
```

### cURL 範例
```bash
curl "https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec?type1=火"
```

### JavaScript Fetch 範例
```javascript
fetch('https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec?type1=火')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Python 範例
```python
import requests

url = "https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec"
params = {"type1": "火"}
response = requests.get(url, params=params)
data = response.json()
print(data)
```

### Node.js (Axios) 範例
```javascript
const axios = require('axios');

axios.get('https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec', {
  params: { type1: '火' }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

## 回應格式

### 成功回應
```json
{
  "success": true,
  "count": 12,
  "moves": [
    {
      "編號": 1,
      "中文名": "火花",
      "日文名": "ひのこ",
      "英文名": "Ember",
      "屬性": "火",
      "分類": "特殊",
      "威力": 40,
      "說明": "向對手發射小火焰進行攻擊。有時會讓對手陷入灼傷狀態。",
      "命中": 100,
      "PP": 25
    }
    // ... 最多12個招式
  ]
}
```

### 錯誤回應
```json
{
  "error": "請至少輸入一個屬性"
}
```

### 無符合招式回應
```json
{
  "success": true,
  "count": 0,
  "moves": []
}
```

## 回應欄位說明

### 主要欄位

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| success | boolean | 請求是否成功 |
| count | integer | 返回的招式數量(0-12) |
| moves | array | 招式物件陣列 |
| error | string | 錯誤訊息(僅在失敗時出現) |

### 招式物件結構

| 欄位名 | 類型 | 說明 | 範例 |
|--------|------|------|------|
| 編號 | integer | 招式編號 | 1 |
| 中文名 | string | 招式中文名稱 | 火花 |
| 日文名 | string | 招式日文名稱 | ひのこ |
| 英文名 | string | 招式英文名稱 | Ember |
| 屬性 | string | 招式屬性 | 火 |
| 分類 | string | 招式分類 | 特殊 |
| 威力 | integer | 招式威力值 | 40 |
| 說明 | string | 招式效果說明 | 向對手發射小火焰進行攻擊... |
| 命中 | integer | 命中率(0-100) | 100 |
| PP | integer | 可使用次數 | 25 |

## 寶可夢屬性列表

可用的屬性值包括:

| 屬性 | 說明 |
|------|------|
| 一般 | Normal 系 |
| 火 | Fire 系 |
| 水 | Water 系 |
| 草 | Grass 系 |
| 電 | Electric 系 |
| 冰 | Ice 系 |
| 格鬥 | Fighting 系 |
| 毒 | Poison 系 |
| 地面 | Ground 系 |
| 飛行 | Flying 系 |
| 超能力 | Psychic 系 |
| 蟲 | Bug 系 |
| 岩石 | Rock 系 |
| 幽靈 | Ghost 系 |
| 龍 | Dragon 系 |
| 惡 | Dark 系 |
| 鋼 | Steel 系 |
| 妖精 | Fairy 系 |

## API 行為說明

### 隨機性
每次請求會從符合條件的招式中隨機選取12個招式,保證每次結果都不同。

### 數量限制
- 最多返回 **12個招式**
- 如果符合條件的招式少於12個,則返回所有符合的招式
- 如果沒有符合條件的招式,返回空陣列

### 屬性篩選邏輯
1. **僅提供 type1**: 返回該屬性的招式
   ```
   ?type1=火  → 只返回火屬性招式
   ```

2. **同時提供 type1 和 type2**: 返回兩種屬性的招式混合
   ```
   ?type1=火&type2=水  → 返回火屬性或水屬性的招式
   ```

### 不重複保證
單次請求中不會返回重複的招式。

## 錯誤處理

| 情況 | HTTP 狀態碼 | 回應內容 |
|------|-------------|----------|
| 缺少 type1 參數 | 200 | `{"error": "請至少輸入一個屬性"}` |
| 沒有符合的招式 | 200 | `{"success": true, "count": 0, "moves": []}` |
| 無效的屬性名稱 | 200 | `{"success": true, "count": 0, "moves": []}` |
| 伺服器錯誤 | 500 | Google Apps Script 預設錯誤訊息 |

## 使用限制

### Google Apps Script 配額
- **每日觸發次數**: 約 20,000 次
- **執行時間限制**: 每次 6 分鐘
- **URL Fetch 呼叫**: 每日約 20,000 次

### 建議
1. 實作快取機制以減少 API 呼叫次數
2. 避免在短時間內發送大量請求
3. 生產環境中建議加入錯誤重試機制
4. 考慮將常用結果快取在本地

## 資料來源

資料來源於 Google Sheets 文件中的 **"Moves"** 工作表,包含完整的寶可夢招式資料庫。

### 資料表結構
| 欄位順序 | 欄位名稱 | 說明 |
|----------|----------|------|
| A | 編號 | 招式編號 |
| B | 中文名 | 中文名稱 |
| C | 日文名 | 日文名稱 |
| D | 英文名 | 英文名稱 |
| E | 屬性 | 屬性類型 |
| F | 分類 | 物理/特殊/變化 |
| G | 威力 | 威力數值 |
| H | 說明 | 效果說明 |
| I | 命中 | 命中率 |
| J | PP | 使用次數 |

## 測試方法

### 方法 1: 瀏覽器直接測試
直接在瀏覽器網址列輸入:
```
https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec?type1=火
```

### 方法 2: 使用 Postman
1. 建立新的 GET 請求
2. 輸入 API 端點 URL
3. 在 Params 中添加 `type1` 和 `type2` (可選)
4. 發送請求查看結果

### 方法 3: 使用線上工具
使用 [ReqBin](https://reqbin.com/) 或 [Hoppscotch](https://hoppscotch.io/) 等線上 API 測試工具

## 常見問題 (FAQ)

### Q: 為什麼返回的招式數量少於12個?
A: 可能是因為符合該屬性條件的招式總數少於12個。

### Q: 可以一次查詢三個以上的屬性嗎?
A: 目前只支援最多兩個屬性 (type1 和 type2)。

### Q: 屬性名稱有大小寫區分嗎?
A: 必須使用正確的中文屬性名稱,如「火」而非「Fire」。

### Q: API 有速率限制嗎?
A: 受 Google Apps Script 配額限制,建議不要在短時間內發送過多請求。

### Q: 可以指定返回的招式數量嗎?
A: 目前固定返回最多12個招式,無法自訂數量。

### Q: 如何獲取所有屬性的招式?
A: 需要分別對每個屬性發送請求,API 不支援一次獲取所有屬性。

## 版本資訊

- **API 版本**: 1.0
- **文件版本**: 1.0
- **最後更新**: 2025-11-01
- **維護狀態**: 活躍開發中

## 技術支援

如有問題或建議,請聯繫 API 維護者。

## 注意事項

1. ⚠️ URL 中的中文字元會自動進行 URL 編碼
2. ⚠️ 參數名稱區分大小寫 (`type1` 不等於 `Type1`)
3. ⚠️ API 沒有認證機制,為公開 API
4. ⚠️ 建議在生產環境中加入錯誤重試機制
5. ⚠️ Google Sheets 資料變更會立即反映在 API 回應中

## 授權聲明

本 API 僅供學習和個人使用。寶可夢相關內容版權歸任天堂、Game Freak 和 Creatures Inc. 所有。

---

**文件生成時間**: 2025-11-01  
**API 端點**: https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec
