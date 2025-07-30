const { generateCrashPoint } = require('./cryptoUtils');
const { currentRound } = require('./gameState');
const { resetLockedCryptoAfterCrash } = require('../controllers/gameController');

let io = null; // Store io here
let roundNumber = 1;

exports.setIO = (socketIO) => {
  io = socketIO; // ✅ save it here, NOT in currentRound
};

exports.startGameEngine = () => {
  setInterval(() => startNewRound(), 10000); // Start round every 10 seconds
};

async function startNewRound() {
  const crashPoint = parseFloat(generateCrashPoint("seed", roundNumber));
  currentRound.crashPoint = crashPoint;
  currentRound.multiplier = 1.0;

  io.emit("round_started", { roundId: roundNumber, crashPoint });
  const startTime = Date.now();
  const growthFactor = 0.07;

  const interval = setInterval(async () => {
    const elapsed = (Date.now() - startTime) / 1000;
    const multiplier = parseFloat((1 + Math.exp(growthFactor * elapsed) / 100).toFixed(2));
    currentRound.multiplier = multiplier;

    io.emit("multiplier_update", { multiplier });

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("round_crashed", { crashPoint });

      // Handle losses for players who didn’t cash out
      await resetLockedCryptoAfterCrash();

      currentRound.players = {};
      roundNumber++;
    }
  }, 100);
}
