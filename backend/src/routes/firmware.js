const express = require('express');
const router = express.Router();

const firmwareVersions = [
  { version: '1.0.0', released: '2025-06-01', mandatory: true, changelog: 'Initial release', size: 524288, hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2' },
  { version: '1.0.1', released: '2025-09-15', mandatory: false, changelog: 'GPS fix, improved tamper detection', size: 532480, hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3' },
  { version: '1.1.0', released: '2026-01-20', mandatory: true, changelog: 'LSTM fraud detection, OTA optimization', size: 548864, hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4' }
];

// GET /latest
router.get('/latest', (req, res) => {
  res.json(firmwareVersions[firmwareVersions.length - 1]);
});

// GET /versions
router.get('/versions', (req, res) => {
  res.json(firmwareVersions);
});

// POST /check
router.post('/check', (req, res) => {
  const currentVersion = req.body.currentVersion;
  const latest = firmwareVersions[firmwareVersions.length - 1];
  res.json({
    updateAvailable: currentVersion !== latest.version,
    currentVersion,
    latestVersion: latest.version,
    mandatory: latest.mandatory,
    changelog: latest.changelog,
    size: latest.size,
    hash: latest.hash
  });
});

module.exports = router;
