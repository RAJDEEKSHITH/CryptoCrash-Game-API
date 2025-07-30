const express = require('express');
const router = express.Router();
const { placeBet, cashOut, getWallet, registerUser, buyCrypto } = require('../controllers/gameController');

router.post('/bet', placeBet);
router.post('/cashout', cashOut);
router.get('/wallet/:id', getWallet);
router.post('/register', registerUser);
router.post('/buy',buyCrypto);

module.exports = router;
