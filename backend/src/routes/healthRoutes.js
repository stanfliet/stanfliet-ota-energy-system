const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().rss,
      free: os.freemem(),
      total: os.totalmem()
    },
    cpu: os.cpus().length,
    platform: process.platform,
    node: process.version,
    timestamp: new Date().toISOString()
  });
});

router.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: Date.now() });
});

module.exports = router;
