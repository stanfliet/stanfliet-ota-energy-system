const express = require('express');
const router = express.Router();

// POST /api/v1/p2p/transfer
router.post('/transfer', async (req, res) => {
  console.log('P2P: POST /api/v1/p2p/transfer', req.body || {});
  res.json({ message: 'transfer received (stub)', body: req.body || {} });
});

module.exports = router;
