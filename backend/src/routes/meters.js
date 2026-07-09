const express = require('express');
const router = express.Router();

const meters = [
  { meterSerial: 'SM-2026-0001', type: 'single_phase', status: 'online', latitude: -26.2041, longitude: 28.0473, firmware: '1.0.0', customer: 'John Dube', balance: 245.50, relayConnected: true, lastReading: { voltage: 230.1, current: 5.2, power: 1196, energy: 4523.7, timestamp: new Date().toISOString() } },
  { meterSerial: 'SM-2026-0002', type: 'single_phase', status: 'online', latitude: -26.1076, longitude: 28.0567, firmware: '1.0.0', customer: 'Mary Molefe', balance: 510.00, relayConnected: true, lastReading: { voltage: 228.4, current: 3.8, power: 867, energy: 2105.3, timestamp: new Date().toISOString() } },
  { meterSerial: 'SM-2026-0003', type: 'three_phase', status: 'online', latitude: -26.1923, longitude: 28.0324, firmware: '1.0.1', customer: 'Peter Nkosi', balance: 1220.75, relayConnected: true, lastReading: { voltage: 410.2, current: 12.1, power: 5012, energy: 15892.1, timestamp: new Date().toISOString() } },
  { meterSerial: 'SM-2026-0004', type: 'single_phase', status: 'warning', latitude: -26.2345, longitude: 28.1123, firmware: '1.0.0', customer: 'Sarah Botha', balance: 89.20, relayConnected: true, lastReading: { voltage: 215.6, current: 6.7, power: 1444, energy: 7891.4, timestamp: new Date().toISOString() } },
  { meterSerial: 'SM-2026-0005', type: 'three_phase_industrial', status: 'online', latitude: -26.1512, longitude: 28.0891, firmware: '1.1.0', customer: 'Eskom Industrial Park', balance: 45000.00, relayConnected: true, lastReading: { voltage: 398.5, current: 45.2, power: 18000, energy: 245000.0, timestamp: new Date().toISOString() } }
];

// GET / — list all meters
router.get('/', (req, res) => {
  res.json(meters.map(m => ({
    meterSerial: m.meterSerial, type: m.type, status: m.status,
    latitude: m.latitude, longitude: m.longitude, firmware: m.firmware,
    customer: m.customer, balance: m.balance, relayConnected: m.relayConnected
  })));
});

// GET /:serial — single meter
router.get('/:serial', (req, res) => {
  const meter = meters.find(m => m.meterSerial === req.params.serial);
  if (!meter) return res.status(404).json({ error: 'Meter not found' });
  res.json(meter);
});

// GET /:serial/readings — meter readings
router.get('/:serial/readings', (req, res) => {
  const meter = meters.find(m => m.meterSerial === req.params.serial);
  if (!meter) return res.status(404).json({ error: 'Meter not found' });

  const readings = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    voltage: meter.lastReading.voltage + (Math.random() - 0.5) * 10,
    current: meter.lastReading.current * (0.8 + Math.random() * 0.4),
    power: meter.lastReading.power * (0.8 + Math.random() * 0.4),
    energy: meter.lastReading.energy - Math.random() * 0.5
  }));
  res.json(readings);
});

// POST /:serial/disconnect
router.post('/:serial/disconnect', (req, res) => {
  const meter = meters.find(m => m.meterSerial === req.params.serial);
  if (!meter) return res.status(404).json({ error: 'Meter not found' });
  meter.relayConnected = false;
  res.json({ success: true, meterSerial: meter.meterSerial, relayConnected: false });
});

// POST /:serial/reconnect
router.post('/:serial/reconnect', (req, res) => {
  const meter = meters.find(m => m.meterSerial === req.params.serial);
  if (!meter) return res.status(404).json({ error: 'Meter not found' });
  meter.relayConnected = true;
  res.json({ success: true, meterSerial: meter.meterSerial, relayConnected: true });
});

module.exports = router;
