const express = require('express');
const router = express.Router();

const alerts = [
  { id: 'ALT-001', meterSerial: 'SM-2026-0004', type: 'tamper_magnetic', severity: 'critical', status: 'active', title: 'Magnetic Tamper Detected', description: 'Hall effect sensor triggered on meter SM-2026-0004', createdAt: new Date().toISOString() },
  { id: 'ALT-002', meterSerial: 'SM-2026-0002', type: 'voltage_sag', severity: 'high', status: 'active', title: 'Voltage Sag Below Threshold', description: 'Voltage dropped to 187V on phase A', createdAt: new Date().toISOString() },
  { id: 'ALT-003', meterSerial: 'SM-2026-0003', type: 'heartbeat_missed', severity: 'medium', status: 'acknowledged', title: 'Heartbeat Missed', description: 'No communication from meter for 15 minutes', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ALT-004', meterSerial: 'SM-2026-0001', type: 'low_balance', severity: 'low', status: 'active', title: 'Low Balance Warning', description: 'Balance below R50 threshold', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'ALT-005', meterSerial: 'SM-2026-0005', type: 'phase_imbalance', severity: 'high', status: 'active', title: 'Phase Imbalance Detected', description: 'Current imbalance of 15% between phases', createdAt: new Date(Date.now() - 1800000).toISOString() }
];

// GET / — list alerts
router.get('/', (req, res) => {
  const { severity, status } = req.query;
  let filtered = [...alerts];
  if (severity) filtered = filtered.filter(a => a.severity === severity);
  if (status) filtered = filtered.filter(a => a.status === status);
  res.json(filtered);
  // In-memory action log
});

// GET /stats
router.get('/stats', (req, res) => {
  res.json({
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length
  });
});

// PATCH /:id/acknowledge
router.patch('/:id/acknowledge', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.status = 'acknowledged';
  res.json({ success: true, id: alert.id, status: 'acknowledged' });
});

// POST /simulate
router.post('/simulate', (req, res) => {
  const types = ['tamper_magnetic', 'voltage_sag', 'heartbeat_missed', 'low_balance', 'phase_imbalance', 'overcurrent', 'power_quality'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const newAlert = {
    id: 'ALT-' + String(alerts.length + 1).padStart(3, '0'),
    meterSerial: 'SM-2026-000' + Math.floor(Math.random() * 5 + 1),
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    status: 'active',
    title: 'New Simulated Alert',
    description: 'This is an auto-generated test alert',
    createdAt: new Date().toISOString()
  };
  alerts.push(newAlert);
  res.json({ success: true, alert: newAlert });
});

module.exports = router;
