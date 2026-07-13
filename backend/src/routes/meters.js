const express = require('express');
const router = express.Router();

// GET /api/v1/meters
router.get('/', async (req, res) => {
  console.log('Meters: GET /api/v1/meters');
  res.json({ meters: [] });
});

// GET /api/v1/meters/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Meters: GET /api/v1/meters/' + id);
  res.json({ meter: { id, status: 'unknown' } });
});

module.exports = router;
