const express = require('express');
const router = express.Router();

// POST /api/v1/reversal
router.post('/', async (req, res) => {
  console.log('Reversal: POST /api/v1/reversal', req.body || {});
  res.json({ message: 'reversal received (stub)', body: req.body || {} });
});

module.exports = router;
