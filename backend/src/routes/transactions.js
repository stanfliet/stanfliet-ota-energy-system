const express = require('express');
const router = express.Router();

// GET /api/v1/transactions
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  console.log('Transactions: GET /api/v1/transactions?limit=' + limit);
  res.json({ transactions: [], limit });
});

// GET /api/v1/transactions/purchases
router.get('/purchases', async (req, res) => {
  console.log('Transactions: GET /api/v1/transactions/purchases');
  res.json({ purchases: [] });
});

module.exports = router;
