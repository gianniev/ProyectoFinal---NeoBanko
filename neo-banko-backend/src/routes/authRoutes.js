const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const authMiddleware = require ('../middleware/auth');
const {getBalance} = require('../controllers/accountController');
const { transfer, getTransactionHistory } = require('../controllers/transactionController');
const { listCryptos, listMarketCryptos, getPortfolio, buyCrypto } = require('../controllers/cryptoController');

// Rutas públicas
router.post('/register', register); // Ruta registro

router.post('/login', login); // Ruta de login 

router.post('/transactions/transfer', authMiddleware, transfer)
router.post('/crypto/buy', authMiddleware, buyCrypto)

//ruta protegida
router.get('/me', authMiddleware, getMe);
router.get('/account/balance', authMiddleware, getBalance);
router.get('/transactions/history', authMiddleware, getTransactionHistory);
router.get('/crypto', authMiddleware, listCryptos);
router.get('/crypto/market', authMiddleware, listMarketCryptos);
router.get('/crypto/portfolio', authMiddleware, getPortfolio);
router.put('/password', authMiddleware, changePassword);


module.exports = router;
