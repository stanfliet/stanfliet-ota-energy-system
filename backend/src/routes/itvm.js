const express = require('express');
const router = express.Router();

// GET /api/v1/itvm
router.get('/', async (req, res) => {
  console.log('ITVM: GET /api/v1/itvm');
  res.json({ message: 'itvm root (stub)' });
});

// POST /api/v1/itvm/submit
router.post('/submit', async (req, res) => {
  console.log('ITVM: POST /api/v1/itvm/submit', req.body || {});
  res.json({ message: 'itvm submit received (stub)', body: req.body || {} });
});

module.exports = router;
