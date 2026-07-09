const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_secret_key_2026';

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Simulated firmware versions
const firmwareVersions = [
  { version: '1.0.0', released: '2026-01-15', sha256: 'a1b2c3d4e5f6...', size: 262144, status: 'stable' },
  { version: '1.1.0', released: '2026-04-20', sha256: 'f6e5d4c3b2a1...', size: 274432, status: 'stable' },
  { version: '1.2.0', released: '2026-07-01', sha256: '9i8u7y6t5r4e...', size: 289568, status: 'beta' }
];

// GET / - list firmware versions
router.get('/', authenticate, (req, res) => {
  res.json({ firmware: firmwareVersions });
});

// POST /schedule - schedule firmware update for meters
router.post('/schedule', authenticate, (req, res) => {
  const { meterIds, targetVersion } = req.body;
  if (!meterIds || !targetVersion) {
    return res.status(400).json({ error: 'meterIds and targetVersion required' });
  }
  const version = firmwareVersions.find(v => v.version === targetVersion);
  if (!version) return res.status(404).json({ error: 'Version not found' });
  res.json({
    scheduled: true,
    meters: meterIds,
    target: targetVersion,
    estimated_completion: new Date(Date.now() + 300000).toISOString()
  });
});

module.exports = router;
