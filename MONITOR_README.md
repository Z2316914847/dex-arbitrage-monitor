# DEX套利监控工具

这是一个使用Viem监控Uniswap V2和SushiSwap ETH-USDT池子价格的工具，用于发现套利机会。

## 功能特性

- 🔍 实时监控Uniswap V2和SushiSwap ETH-USDT池子价格
- 📊 显示池子储备量信息
- 💰 自动计算套利机会和价格差异
- ⚡ 使用Viem库，性能优异
- 🎯 当套利机会超过0.5%时发出提醒

## 安装依赖

```bash
npm install
```

## 配置

1. 复制环境配置文件：
```bash
cp env.example .env
```

2. 编辑`.env`文件，配置RPC节点：
```bash
RPC_URL=https://eth.llamarpc.com
```

## 运行监控

### 方法1: 使用npm脚本
```bash
# 启动监控
npm start

# 或者使用开发模式（自动重启）
npm run dev
```

### 方法2: 使用启动脚本
```bash
# 使用便捷启动脚本
./start.sh
```

### 方法3: 直接运行
```bash
# 直接运行监控脚本
node monitor.js
```

## 输出示例

```
🚀 开始监控DEX价格...

Uniswap V2 ETH-USDT 池子地址: 0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852
SushiSwap ETH-USDT 池子地址: 0x06da0fd433C1A5d7a4faa01111c044910A184553

📊 Uniswap V2 WETH-USDT:
   价格: $4,562.72
   WETH储备: 10,320.34
   USDT储备: 47,088,815.44
   时间: 2025-01-15T10:30:00.000Z

🍣 SushiSwap WETH-USDT:
   价格: $4,563.78
   WETH储备: 255.70
   USDT储备: 1,166,970.15
   时间: 2025-01-15T10:30:00.000Z

💰 套利分析:
   价格差异: $0.45
   套利百分比: 0.0192%
   套利方向: 在Uniswap买入WETH，在SushiSwap卖出
   ⚪ 当前无显著套利机会
```

## 技术细节

### 监控的池子
- **Uniswap V2**: WETH-USDT池子 (0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852)
- **SushiSwap**: WETH-USDT池子 (0x06da0fd433C1A5d7a4faa01111c044910A184553)

### 价格计算
- 基于池子储备量计算WETH价格（USDT/WETH）
- 实时监控价格变化
- 自动检测套利机会

### 套利检测
- 当价格差异超过0.5%时认为有套利机会
- 显示套利方向和潜在收益
- 实时更新套利状态

## 注意事项

1. 确保RPC节点稳定可靠
2. 监控间隔设置为5秒，可根据需要调整
3. 套利机会检测仅供参考，实际交易需考虑gas费用
4. 建议在测试网络上先进行测试

## 故障排除

如果遇到连接问题：
1. 检查RPC节点是否可用
2. 尝试更换其他RPC节点
3. 检查网络连接

## 扩展功能

可以轻松扩展以支持：
- 更多DEX平台
- 更多交易对
- 更复杂的套利策略
- 自动交易执行
