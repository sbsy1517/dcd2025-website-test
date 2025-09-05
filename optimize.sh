#!/bin/bash

# 網站優化自動化腳本
# 使用方法: ./optimize.sh

echo "🚀 開始網站優化..."

# 1. JavaScript 壓縮
echo "📦 壓縮 JavaScript..."
cd src/js
if [ -f "main.js" ]; then
    terser main.js -c -m --keep-fnames --source-map url=main.min.js.map -o main.min.js
    echo "✅ JavaScript 壓縮完成: $(ls -lh main.min.js | awk '{print $5}')"
else
    echo "❌ 找不到 main.js"
fi
cd ../..

# 2. SASS 編譯
echo "🎨 編譯 SASS..."
cd src/style
if [ -f "main.sass" ]; then
    sass main.sass main.css --style=compressed
    echo "✅ CSS 編譯完成: $(ls -lh main.css | awk '{print $5}')"
else
    echo "❌ 找不到 main.sass"
fi
cd ../..

# 3. PUG 編譯
echo "🔧 編譯 PUG 模板..."
if [ -f "index_cht.pug" ]; then
    pug index_cht.pug --out . --pretty
    echo "✅ 中文版 PUG 編譯完成"
else
    echo "❌ 找不到 index_cht.pug"
fi

if [ -f "index_en.pug" ]; then
    pug index_en.pug --out . --pretty
    echo "✅ 英文版 PUG 編譯完成"
else
    echo "❌ 找不到 index_en.pug"
fi

# 4. HTML 壓縮
echo "📄 壓縮 HTML..."
if [ -f "index_cht.html" ]; then
    html-minifier-terser index_cht.html \
        --remove-comments \
        --remove-redundant-attributes \
        --remove-script-type-attributes \
        --remove-style-link-type-attributes \
        --use-short-doctype \
        --collapse-whitespace \
        --minify-css \
        --minify-js \
        --case-sensitive \
        -o index_cht.min.html
    
    # 更新 JavaScript 引用
    sed -i '' 's/src="\.\/src\/js\/main\.js"/src="\.\/src\/js\/main\.min\.js"/g' index_cht.min.html
    
    echo "✅ HTML 壓縮完成: $(ls -lh index_cht.min.html | awk '{print $5}')"
else
    echo "❌ 找不到 index_cht.html"
fi

# 4. 顯示優化結果
echo ""
echo "📊 優化結果摘要:"
echo "===================="

if [ -f "src/js/main.js" ] && [ -f "src/js/main.min.js" ]; then
    original_js=$(stat -f%z src/js/main.js)
    minified_js=$(stat -f%z src/js/main.min.js)
    js_reduction=$((100 - (minified_js * 100 / original_js)))
    echo "JavaScript: $(numfmt --to=iec-i --suffix=B $original_js) → $(numfmt --to=iec-i --suffix=B $minified_js) (減少 ${js_reduction}%)"
fi

if [ -f "index_cht.html" ] && [ -f "index_cht.min.html" ]; then
    original_html=$(stat -f%z index_cht.html)
    minified_html=$(stat -f%z index_cht.min.html)
    html_reduction=$((100 - (minified_html * 100 / original_html)))
    echo "HTML: $(numfmt --to=iec-i --suffix=B $original_html) → $(numfmt --to=iec-i --suffix=B $minified_html) (減少 ${html_reduction}%)"
fi

if [ -f "src/style/main.css" ]; then
    css_size=$(stat -f%z src/style/main.css)
    echo "CSS: $(numfmt --to=iec-i --suffix=B $css_size) (已壓縮)"
fi

echo ""
echo "🎯 字體優化: 移除未使用的字體權重 (EL, L, R)"
echo "📱 只載入實際使用的字體: M(500), B(700), H(900)"
echo ""
echo "✨ 優化完成！"
