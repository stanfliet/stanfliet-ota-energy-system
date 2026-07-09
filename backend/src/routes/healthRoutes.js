const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components: { server: 'running', websocket: 'ready' }
  };
  try {
    const pool = req.app.get('dbPool');
    if (pool) {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      health.components.database = 'connected';
    }
  } catch (err) { health.components.database = 'disconnected'; health.status = 'degraded'; }
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

module.exports = router;
