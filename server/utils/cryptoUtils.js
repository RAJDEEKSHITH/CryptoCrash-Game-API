const axios = require('axios');
const crypto = require('crypto');

let cache = {};
const COIN_ID_MAP = { BTC: 'bitcoin', ETH: 'ethereum' };

exports.getPrice = async (currency) => {
  const coinId = COIN_ID_MAP[currency.toUpperCase()];
  if (!coinId) throw new Error(`Unsupported currency: ${currency}`);

  if (cache[coinId] && Date.now() - cache[coinId].ts < 10000) {
    return cache[coinId].price;
  }

  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: coinId, vs_currencies: 'usd' }
    });

    const price = res.data[coinId]?.usd;
    if (!price) throw new Error("Price not found in public API");

    cache[coinId] = { price, ts: Date.now() };
    return price;
  } catch (err) {
    console.error("❌ Public API failed:", err.message);
    throw new Error("Failed to fetch crypto price.");
  }
};

exports.generateCrashPoint = (seed, roundNumber, max = 120) => {
  const hash = crypto.createHash('sha256').update(seed + roundNumber).digest('hex');
  const decimal = parseInt(hash.slice(0, 8), 16);
  return (1 + (decimal % (max * 100)) / 100).toFixed(2);
};
