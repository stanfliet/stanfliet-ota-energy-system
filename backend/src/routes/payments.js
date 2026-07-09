const express = require('express');
const router = express.Router();

const payments = [];
const TARIFF_PER_KWH = 2.1437;

// POST /purchase
router.post('/purchase', (req, res) => {
  const { meterSerial, amount, method } = req.body;
  if (!meterSerial || !amount) return res.status(400).json({ error: 'meterSerial and amount required' });

  const units = parseFloat(amount) / TARIFF_PER_KWH;
  const payment = {
    id: 'PAY-' + Date.now().toString(36).toUpperCase(),
    meterSerial,
    amount: parseFloat(amount),
    units: Math.round(units * 100) / 100,
    tariff: TARIFF_PER_KWH,
    method: method || 'payfast',
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  payments.push(payment);
  res.json({ success: true, ...payment });
});

// POST /transfer
router.post('/transfer', (req, res) => {
  const { senderSerial, receiverSerial, amount } = req.body;
  if (!senderSerial || !receiverSerial || !amount) {
    return res.status(400).json({ error: 'senderSerial, receiverSerial, and amount required' });
  }

  const units = parseFloat(amount) / TARIFF_PER_KWH;
  const transfer = {
    id: 'TRF-' + Date.now().toString(36).toUpperCase(),
    senderSerial,
    receiverSerial,
    amount: parseFloat(amount),
    units: Math.round(units * 100) / 100,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  res.json({ success: true, ...transfer });
});

// GET /history
router.get('/history', (req, res) => {
  res.json(payments);
});

module.exports = router;
