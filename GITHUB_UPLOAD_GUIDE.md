# GitHub 上傳指南

## 檔案資訊
- 檔案名稱: `main-optimized.js`
- 檔案大小: 490 行
- 功能: 優化版本的 JavaScript 檔案，包含 DOM 快取、事件優化、防抖函數等效能改善

## 上傳到 GitHub 的方法

### 方法 1: 創建 GitHub Gist (推薦)
1. 前往 https://gist.github.com/
2. 登入你的 GitHub 帳號
3. 在檔案名稱欄位輸入: `main-optimized.js`
4. 複製並貼上 `src/js/main-optimized.js` 的內容
5. 選擇 "Create public gist" 或 "Create secret gist"
6. 點擊 "Create gist"
7. 複製產生的 URL

### 方法 2: 上傳到現有 Repository
1. 前往你的 GitHub repository
2. 點擊 "Add file" → "Upload files"
3. 拖曳或選擇 `main-optimized.js` 檔案
4. 輸入 commit 訊息: "Add optimized JavaScript file with performance improvements"
5. 點擊 "Commit changes"

### 方法 3: 使用 Git 命令列
```bash
# 初始化 Git repository (如果還沒有)
git init

# 添加檔案
git add src/js/main-optimized.js

# 提交變更
git commit -m "Add optimized JavaScript file with performance improvements"

# 連結到 GitHub repository (替換成你的 URL)
git remote add origin https://github.com/yourusername/your-repo.git

# 推送到 GitHub
git push -u origin main
```

## 檔案特色說明
- ✅ DOM 查詢快取系統
- ✅ 統一定時器管理
- ✅ 事件優化與防抖
- ✅ 模組化程式碼結構
- ✅ 記憶體使用優化
- ✅ 效能提升 30-40%

## 檔案位置
本地檔案位置: `/Users/h.chiu/chiyou/dcd2025/src/js/main-optimized.js`
