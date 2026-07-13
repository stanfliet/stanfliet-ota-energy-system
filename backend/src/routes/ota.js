const express = require('express');
const router = express.Router();

// POST /api/v1/ota/purchase
router.post('/purchase', async (req, res) => {
  console.log('OTA: POST /api/v1/ota/purchase', req.body ? { ...req.body } : {});
  res.json({ message: 'purchase received (stub)', body: req.body || {} });
});

// GET /api/v1/ota/status/:meter
router.get('/status/:meter', async (req, res) => {
  const { meter } = req.params;
  console.log('OTA: GET /api/v1/ota/status/' + meter);
  res.json({ meter, status: 'unknown' });
});

module.exports = router;
