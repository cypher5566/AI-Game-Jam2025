# 技能資料

## 使用說明

將從 Google Sheets 下載的技能 CSV 檔案放在這個資料夾中。

### 檔案名稱

`pokemon_moves.csv`

### 下載來源

Google Sheets: https://docs.google.com/spreadsheets/d/1lKgXsTRGTPJJDH1EZoaEfCRVVVpG7uYRn19wPDAPw5M/edit?gid=2143315530#gid=2143315530

### 下載步驟

1. 開啟上方連結
2. 檔案 → 下載 → 逗號分隔值 (.csv)
3. 將下載的檔案重新命名為 `pokemon_moves.csv`
4. 放入此資料夾

### 預期格式

CSV 應該包含以下欄位：
- 編號
- 中文名
- 日文名
- 英文名
- 屬性
- 分類
- 威力
- 命中
- PP
- 說明

### 範例

```csv
編號,中文名,日文名,英文名,屬性,分類,威力,命中,PP,說明
1,拍擊,はたく,Pound,一般,物理,40,100,35,用長長的尾巴或手等拍打對手進行攻擊
...
```
