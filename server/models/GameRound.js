// GameRound.js
const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
  roundId: String,
  startTime: Date,
  crashPoint: Number,
  bets: [{
    playerId: mongoose.Schema.Types.ObjectId,
    usd: Number,
    crypto: Number,
    currency: String,
    cashedOut: Boolean,
    cashoutMultiplier: Number,
  }],
});

module.exports = mongoose.model('GameRound', gameRoundSchema);