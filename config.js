// 监控配置
module.exports = {
  // RPC配置
  rpc: {
    url: process.env.RPC_URL || 'https://eth.llamarpc.com',
    timeout: 10000 // 10秒超时
  },
  
  // 监控配置
  monitor: {
    interval: 5000, // 监控间隔（毫秒）
    arbitrageThreshold: 0.5, // 套利阈值（百分比）
    maxRetries: 3 // 最大重试次数
  },
  
  // 池子配置
  pools: {
    uniswapV2: {
      name: 'Uniswap V2',
      pairAddress: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852',
      factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    },
    sushiswap: {
      name: 'SushiSwap',
      pairAddress: '0x06da0fd433C1A5d7a4faa01111c044910A184553',
      factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
    }
  },
  
  // 代币配置
  tokens: {
    weth: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      decimals: 18
    },
    usdt: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      decimals: 6
    }
  },
  
  // 日志配置
  logging: {
    level: 'info', // debug, info, warn, error
    showTimestamp: true,
    showArbitrageOnly: false // 只显示套利机会
  }
};
