// User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  usdBalance: { type: Number, default: 100 },
  wallet: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 }
  },
  lockedCrypto: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('User', userSchema);
