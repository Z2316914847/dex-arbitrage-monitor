const { createPublicClient, http, formatUnits, parseUnits } = require('viem');
const { mainnet } = require('viem/chains');
require('dotenv').config();

// 是哦那个 Viem 监控 两个uniswap和shusi池子的价格，池子时ETH-usdt。
// 启动文件: cd /home/test01/DEX_Arbrtrage_Viem && node test-monitor.js
// cd /home/test01/DEX_Arbrtrage_Viem && timeout 30s npm start
// 给脚本赋予权限(执行权限)：chmod +x /home/test01/DEX_Arbrtrage_Viem/start.sh

// 配置
const RPC_URL = process.env.RPC_URL || 'https://eth.llamarpc.com';
const MONITOR_INTERVAL = 5000; // 5秒监控间隔

// 代币地址 (以太坊主网)
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT

// 已知的池子地址 (直接使用，避免通过工厂查询)
const UNISWAP_V2_ETH_USDT_PAIR = '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852'; // Uniswap V2 WETH-USDT
const SUSHI_ETH_USDT_PAIR = '0x06da0fd433C1A5d7a4faa01111c044910A184553'; // SushiSwap WETH-USDT

// Uniswap V2 工厂和路由器地址
const UNISWAP_V2_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const UNISWAP_V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// SushiSwap 工厂和路由器地址
const SUSHI_FACTORY = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';
const SUSHI_ROUTER = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';

// 创建客户端
const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL)
});

// Uniswap V2 Pair ABI
const PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {"internalType": "uint112", "name": "_reserve0", "type": "uint112"},
      {"internalType": "uint112", "name": "_reserve1", "type": "uint112"},
      {"internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token1",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Uniswap V2 Factory ABI
const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"}
    ],
    "name": "getPair",
    "outputs": [{"internalType": "address", "name": "pair", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// 获取池子地址 (现在直接使用已知地址)
async function getPairAddress(pairAddress, poolName) {
  try {
    // 验证池子是否存在
    const code = await client.getCode({ address: pairAddress });
    if (code === '0x') {
      console.log(`${poolName}: 池子不存在`);
      return null;
    }
    return pairAddress;
  } catch (error) {
    console.error(`获取${poolName}池子地址失败:`, error);
    return null;
  }
}

// 获取池子储备量和价格
async function getPoolPrice(pairAddress, poolName) {
  try {
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`${poolName}: 池子不存在`);
      return null;
    }

    const [reserves, token0] = await Promise.all([
      client.readContract({
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'getReserves'
      }),
      client.readContract({
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'token0'
      })
    ]);

    const [reserve0, reserve1] = reserves;
    
    // 判断哪个是WETH，哪个是USDT
    const isToken0WETH = token0.toLowerCase() === WETH_ADDRESS.toLowerCase();
    const wethReserve = isToken0WETH ? reserve0 : reserve1;
    const usdtReserve = isToken0WETH ? reserve1 : reserve0;
    
    // 计算价格 (USDT per WETH)
    const price = Number(formatUnits(usdtReserve, 6)) / Number(formatUnits(wethReserve, 18));
    
    return {
      poolName,
      pairAddress,
      wethReserve: formatUnits(wethReserve, 18),
      usdtReserve: formatUnits(usdtReserve, 6),
      price: price.toFixed(2),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`获取${poolName}价格失败:`, error);
    return null;
  }
}

// 计算套利机会
function calculateArbitrage(uniswapPrice, sushiPrice) {
  if (!uniswapPrice || !sushiPrice) return null;
  
  const uniswapPriceNum = parseFloat(uniswapPrice.price);
  const sushiPriceNum = parseFloat(sushiPrice.price);
  
  const priceDiff = Math.abs(uniswapPriceNum - sushiPriceNum);
  const avgPrice = (uniswapPriceNum + sushiPriceNum) / 2;
  const arbitragePercent = (priceDiff / avgPrice) * 100;
  
  let arbitrageDirection = '';
      if (uniswapPriceNum > sushiPriceNum) {
        arbitrageDirection = '在SushiSwap买入WETH，在Uniswap卖出';
      } else if (sushiPriceNum > uniswapPriceNum) {
        arbitrageDirection = '在Uniswap买入WETH，在SushiSwap卖出';
      }
  
  return {
    priceDifference: priceDiff.toFixed(2),
    arbitragePercent: arbitragePercent.toFixed(4),
    direction: arbitrageDirection,
    isProfitable: arbitragePercent > 0.5 // 0.5%以上认为有套利机会
  };
}

// 主监控函数
async function monitorPrices() {
  console.log('🚀 开始监控DEX价格...\n');
  
  try {
    // 获取池子地址
    const [uniswapPair, sushiPair] = await Promise.all([
      getPairAddress(UNISWAP_V2_ETH_USDT_PAIR, 'Uniswap V2'),
      getPairAddress(SUSHI_ETH_USDT_PAIR, 'SushiSwap')
    ]);
    
    console.log(`Uniswap V2 WETH-USDT 池子地址: ${uniswapPair}`);
    console.log(`SushiSwap WETH-USDT 池子地址: ${sushiPair}\n`);
    
    // 获取价格
    const [uniswapData, sushiData] = await Promise.all([
      getPoolPrice(uniswapPair, 'Uniswap V2'),
      getPoolPrice(sushiPair, 'SushiSwap')
    ]);
    
    if (uniswapData) {
      console.log(`📊 Uniswap V2 WETH-USDT:`);
      console.log(`   价格: $${uniswapData.price}`);
      console.log(`   WETH储备: ${uniswapData.wethReserve}`);
      console.log(`   USDT储备: ${uniswapData.usdtReserve}`);
      console.log(`   时间: ${uniswapData.timestamp}\n`);
    }
    
    if (sushiData) {
      console.log(`🍣 SushiSwap WETH-USDT:`);
      console.log(`   价格: $${sushiData.price}`);
      console.log(`   WETH储备: ${sushiData.wethReserve}`);
      console.log(`   USDT储备: ${sushiData.usdtReserve}`);
      console.log(`   时间: ${sushiData.timestamp}\n`);
    }
    
    // 计算套利机会
    const arbitrage = calculateArbitrage(uniswapData, sushiData);
    if (arbitrage) {
      console.log(`💰 套利分析:`);
      console.log(`   价格差异: $${arbitrage.priceDifference}`);
      console.log(`   套利百分比: ${arbitrage.arbitragePercent}%`);
      console.log(`   套利方向: ${arbitrage.direction}`);
      
      if (arbitrage.isProfitable) {
        console.log(`   🎯 发现套利机会! 差异超过0.5%`);
      } else {
        console.log(`   ⚪ 当前无显著套利机会`);
      }
    }
    
  } catch (error) {
    console.error('监控过程中发生错误:', error);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// 启动监控
async function startMonitoring() {
  console.log('🔍 DEX套利监控工具启动');
  console.log(`📡 RPC节点: ${RPC_URL}`);
  console.log(`⏱️  监控间隔: ${MONITOR_INTERVAL}ms\n`);
  
  // 立即执行一次
  await monitorPrices();
  
  // 设置定时器
  setInterval(monitorPrices, MONITOR_INTERVAL);
}

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n👋 监控已停止');
  process.exit(0);
});

// 启动监控
startMonitoring().catch(console.error);
