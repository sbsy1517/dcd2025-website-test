#!/bin/bash

# DCD2025 專案 GitHub 上傳腳本
# 使用方法: chmod +x upload_to_github.sh && ./upload_to_github.sh

echo "🚀 DCD2025 專案 GitHub 上傳腳本"
echo "================================="

# 檢查是否在正確的目錄
if [ ! -f "index_cht.html" ]; then
    echo "❌ 錯誤: 請在專案根目錄執行此腳本"
    exit 1
fi

# 檢查 Git 是否已安裝
if ! command -v git &> /dev/null; then
    echo "❌ 錯誤: 請先安裝 Git"
    exit 1
fi

echo "📋 專案資訊:"
echo "   檔案總數: $(find . -type f | wc -l)"
echo "   專案大小: $(du -sh . | cut -f1)"

# 初始化 Git repository (如果尚未初始化)
if [ ! -d ".git" ]; then
    echo "🔧 初始化 Git repository..."
    git init
    echo "✅ Git repository 已初始化"
fi

# 添加所有檔案到 staging area
echo "📁 添加檔案到 Git..."
git add .

# 檢查是否有檔案需要提交
if git diff --cached --quiet; then
    echo "ℹ️  沒有新的變更需要提交"
else
    # 提交變更
    echo "💾 提交變更..."
    git commit -m "🎽 DCD2025: 香港公益金便服日 2025 官方網站

📋 專案特色:
- 響應式設計 (RWD) 支援桌面/平板/手機
- JavaScript 效能優化 (30-40% 提升)
- 圖片懶加載技術 (120+ 張圖片)
- SASS 模組化架構
- 多語言支援 (繁體中文/英文)
- PUG 模板系統

🚀 技術優化:
- DOM 快取系統
- 事件委派優化
- 防抖函數應用
- 模組化設計模式
- IntersectionObserver API

📱 響應式特色:
- 手機版滑動選單
- 觸控友善介面
- 多螢幕適配
- 流暢動畫效果

Made with ❤️ for Hong Kong Community Chest"
    
    echo "✅ 變更已提交"
fi

# 提示用戶設定 remote repository
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "🔗 請設定 GitHub repository:"
    echo "   1. 前往 https://github.com/ 創建新的 repository"
    echo "   2. Repository 名稱建議: dcd2025-website"
    echo "   3. 執行以下命令連接 repository:"
    echo ""
    echo "      git remote add origin https://github.com/你的用戶名/dcd2025-website.git"
    echo "      git branch -M main"
    echo "      git push -u origin main"
    echo ""
else
    # 推送到 GitHub
    echo "🚀 推送到 GitHub..."
    
    # 檢查是否需要設定上游分支
    if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} &> /dev/null; then
        git push -u origin main
    else
        git push
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ 成功推送到 GitHub!"
        
        # 顯示 repository URL
        REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
        echo ""
        echo "🌐 你的專案現在可以在以下位置查看:"
        echo "   Repository: $REPO_URL"
        echo "   Live Demo:  ${REPO_URL/github.com/$(git remote get-url origin | sed 's/.*github\.com[:\/]//' | sed 's/\.git$//' | sed 's/\//.github.io\//')}"
        echo ""
        echo "💡 要啟用 GitHub Pages:"
        echo "   1. 前往 Repository Settings"
        echo "   2. 找到 Pages 設定"
        echo "   3. Source 選擇: Deploy from a branch"
        echo "   4. Branch 選擇: main"
        echo "   5. 儲存設定"
    else
        echo "❌ 推送失敗，請檢查網路連線和權限設定"
    fi
fi

echo ""
echo "📚 更多資訊請參考:"
echo "   📄 GITHUB_PROJECT_UPLOAD.md - 詳細上傳指南"
echo "   📄 README.md - 專案說明文件"
echo "   📄 OPTIMIZATION_GUIDE.md - 效能優化指南"
echo ""
echo "🎉 腳本執行完成!"
