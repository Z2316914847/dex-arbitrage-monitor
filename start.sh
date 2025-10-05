#!/bin/bash
# Shell脚本

echo "🚀 启动DEX套利监控工具..."
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 检查环境配置文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，使用默认配置"
    echo "💡 如需自定义RPC节点，请复制env.example为.env并编辑"
    echo ""
fi

# 启动监控
echo "🔍 开始监控Uniswap和SushiSwap ETH-USDT价格..."
echo "按Ctrl+C停止监控"
echo ""

# npm start 会执行 package.json 中定义的脚本：node monitor.js
npm start
