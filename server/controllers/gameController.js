// gameController
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getPrice } = require('../utils/cryptoUtils');
const { currentRound } = require('../utils/gameState');
const crypto = require('crypto');

exports.registerUser = async (req, res) => {
  try {
    const { username, usdBalance = 100 } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required." });

    const user = new User({
      username,
      usdBalance,
      wallet: { BTC: 0, ETH: 0 },
      lockedCrypto: { BTC: 0, ETH: 0 }
    });
    await user.save();

    res.json({ success: true, userId: user._id, username, usdBalance });
  } catch (err) {
    res.status(500).json({ error: "Registration failed." });
  }
};

exports.buyCrypto = async (req, res) => {
  try {
    const { userId, usd, currency } = req.body;
    if (usd <= 0 || !['BTC', 'ETH'].includes(currency)) return res.status(400).json({ error: 'Invalid input' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.usdBalance < usd) return res.status(400).json({ error: 'Insufficient USD balance' });

    const price = await getPrice(currency);
    const cryptoAmount = usd / price;

    user.usdBalance -= usd;
    user.wallet[currency] += cryptoAmount;
    await user.save();

    await Transaction.create({
      playerId: userId,
      usdAmount: usd,
      cryptoAmount,
      currency,
      transactionType: 'buy',
      transactionHash: crypto.randomUUID(),
      priceAtTime: price
    });

    res.json({ success: true, cryptoAmount, remainingUsd: user.usdBalance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to buy crypto' });
  }
};

exports.placeBet = async (req, res) => {
  const { userId, cryptoAmount, currency } = req.body;
  if (cryptoAmount <= 0 || !['BTC', 'ETH'].includes(currency)) return res.status(400).json({ error: 'Invalid bet.' });

  try {
    const user = await User.findById(userId);
    if (user.wallet[currency] < cryptoAmount) return res.status(400).json({ error: 'Insufficient crypto balance.' });

    user.wallet[currency] -= cryptoAmount;
    user.lockedCrypto[currency] += cryptoAmount;
    await user.save();

    const price = await getPrice(currency);
    const usd = cryptoAmount * price;

    currentRound.players[userId] = {
      playerId: userId,
      usd,
      crypto: cryptoAmount,
      currency,
      cashedOut: false,
      cashoutMultiplier: null
    };

    await Transaction.create({
      playerId: userId,
      usdAmount: usd,
      cryptoAmount,
      currency,
      transactionType: 'bet',
      transactionHash: crypto.randomUUID(),
      priceAtTime: price
    });

    res.json({ success: true, cryptoAmount });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.cashOut = async (req, res) => {
  const { userId } = req.body;
  const player = currentRound.players[userId];

  if (!player || player.cashedOut || currentRound.multiplier >= currentRound.crashPoint) {
    return res.status(400).json({ error: 'Invalid or late cashout.' });
  }

  try {
    const user = await User.findById(userId);
    const cryptoGain = player.crypto * currentRound.multiplier;
    const price = await getPrice(player.currency);
    const usdPayout = cryptoGain * price;

    const originalBet = player.usd;
    const profit = usdPayout - originalBet;

    user.lockedCrypto[player.currency] -= player.crypto;
    user.usdBalance += usdPayout;
    await user.save();

    player.cashedOut = true;
    player.cashoutMultiplier = currentRound.multiplier;

    await Transaction.create({
      playerId: userId,
      usdAmount: usdPayout,
      cryptoAmount: cryptoGain,
      currency: player.currency,
      transactionType: 'cashout',
      transactionHash: crypto.randomUUID(),
      priceAtTime: price
    });

    res.json({
      success: true,
      usdPayout : parseFloat(usdPayout.toFixed(2)),
      profit : parseFloat(profit.toFixed(2)) ,
      originalBet : parseFloat(originalBet.toFixed(2)),
      cashoutMultiplier: player.cashoutMultiplier,
      crashPoint: currentRound.crashPoint
    });
  } catch (err) {
    res.status(500).json({ error: 'Cashout failed.' });
  }
};

exports.cashOutSocket = exports.cashOut;

exports.getWallet = async (req, res) => {
  try {
    const userId = req.params.id.trim();
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const btcPrice = await getPrice('BTC') || 0;
    const ethPrice = await getPrice('ETH') || 0;

    return res.json({
      usdBalance: parseFloat(user.usdBalance.toFixed(2)),
      BTC: {
        available: user.wallet.BTC,
        locked: user.lockedCrypto.BTC,
        totalUsd: Number(((user.wallet.BTC + user.lockedCrypto.BTC) * btcPrice).toFixed(2))
      },
      ETH: {
        available: user.wallet.ETH,
        locked: user.lockedCrypto.ETH,
        totalUsd: Number(((user.wallet.ETH + user.lockedCrypto.ETH) * ethPrice).toFixed(2))
      }
    });
  } catch (err) {
    console.error("❌ Wallet fetch error:", err);
    return res.status(500).json({ error: 'Server error' });
  }
};



exports.resetLockedCryptoAfterCrash = async () => {
  try {
    const playerIds = Object.keys(currentRound.players);
    for (const playerId of playerIds) {
      const player = currentRound.players[playerId];
      if (!player.cashedOut) {
        const user = await User.findById(playerId);
        if (user) {
          user.lockedCrypto[player.currency] -= player.crypto;
          await user.save();
        }
      }
    }
  } catch (err) {
    console.error("❌ Error resetting locked crypto:", err);
  }
};
