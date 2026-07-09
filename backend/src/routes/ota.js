const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const otaService = require('../services/otaService');
const paymentService = require('../services/paymentService');

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

// ===================== OTA CREDIT DELIVERY =====================

// POST /ota/deliver - Deliver credit to meter (real-time OTA)
router.post('/ota/deliver', authenticate, async function(req, res) {
  try {
    var meterId = req.body.meter_id;
    var amountKWH = req.body.kwh;
    var transactionId = req.body.transaction_id || ('TXN-' + Date.now());

    if (!meterId || !amountKWH) {
      return res.status(400).json({ error: 'meter_id and kwh required' });
    }

    var command = await otaService.deliverCredit(meterId, amountKWH, transactionId, req.body.mqtt_topic);

    res.json({
      success: true,
      command_id: command.id,
      message: 'Credit delivery command sent to meter',
      payload: command.payload,
      estimated_delivery_seconds: 2
    });
  } catch (err) {
    res.status(500).json({ error: 'Delivery failed', message: err.message });
  }
});

// POST /ota/purchase - Purchase and deliver electricity in one step
router.post('/ota/purchase', authenticate, async function(req, res) {
  try {
    var meterNumber = req.body.meter_number;
    var amountZAR = req.body.amount_zar;
    var paymentMethod = req.body.payment_method || 'card';
    var tariffType = req.body.tariff_type || 'standard';

    if (!meterNumber || !amountZAR) {
      return res.status(400).json({ error: 'meter_number and amount_zar required' });
    }

    // Process payment
    var purchase = await paymentService.processPurchase(meterNumber, amountZAR, paymentMethod, {
      tariffType: tariffType,
      customerName: req.body.customer_name || 'Walk-in Customer',
      email: req.body.email || null,
      phone: req.body.phone || null
    });

    // Generate STS token
    var token = otaService.generateSTSToken(meterNumber, purchase.kwh_units, purchase.tariff_rate, purchase.transaction_id);

    // Deliver via OTA
    var command = await otaService.deliverCredit(meterNumber, purchase.kwh_units, purchase.transaction_id, req.body.mqtt_topic);

    res.json({
      success: true,
      transaction: purchase,
      units_kwh: purchase.kwh_units,
      amount_zar: purchase.amount_zar,
      tariff_rate: purchase.tariff_rate,
      sts_token: token,
      ota_command: command,
      receipt: {
        number: purchase.receipt_number,
        issued_at: purchase.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Purchase failed', message: err.message });
  }
});

// Generate STS token (for POS/offline scenarios)
router.post('/ota/generate-token', authenticate, function(req, res) {
  try {
    var meterNumber = req.body.meter_number;
    var amountKWH = req.body.kwh;
    var tariffRate = req.body.tariff_rate || 2.1437;
    var transactionId = req.body.transaction_id || ('TXN-' + Date.now());

    if (!meterNumber || !amountKWH) {
      return res.status(400).json({ error: 'meter_number and kwh required' });
    }

    var token = otaService.generateSTSToken(meterNumber, amountKWH, tariffRate, transactionId);

    res.json({
      success: true,
      sts_token: token,
      token_format: '20-digit STS Edition 2',
      meter_number: meterNumber,
      kwh: amountKWH,
      tariff_rate: tariffRate,
      transaction_id: transactionId,
      alternative_ota: 'Also delivered via OTA if meter is online'
    });
  } catch (err) {
    res.status(500).json({ error: 'Token generation failed', message: err.message });
  }
});

// Validate an STS token
router.post('/ota/validate-token', function(req, res) {
  try {
    var token = req.body.token;
    if (!token) return res.status(400).json({ error: 'Token required' });

    var result = otaService.validateSTSToken(token);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Validation failed', message: err.message });
  }
});

// ===================== P2P TRANSFER =====================

// POST /p2p/transfer - Transfer credits between meters
router.post('/p2p/transfer', authenticate, async function(req, res) {
  try {
    var sourceMeter = req.body.source_meter;
    var destMeter = req.body.destination_meter;
    var amountKWH = req.body.kwh;

    if (!sourceMeter || !destMeter || !amountKWH) {
      return res.status(400).json({ error: 'source_meter, destination_meter, and kwh required' });
    }

    if (sourceMeter === destMeter) {
      return res.status(400).json({ error: 'Source and destination cannot be the same meter' });
    }

    // Enforce transfer limits (Claim 13)
    if (amountKWH > 50) {
      return res.status(400).json({ error: 'Transfer limit: max 50 kWh per transaction' });
    }

    var transfer = await otaService.p2pTransfer(sourceMeter, destMeter, amountKWH, req.user.email || req.user.id);

    res.json({
      success: true,
      transfer_id: transfer.transfer_id,
      source_meter: sourceMeter,
      destination_meter: destMeter,
      kwh: amountKWH,
      status: transfer.status,
      message: 'Transfer initiated. Credits are being transferred in real-time.',
      estimated_completion_seconds: 5
    });
  } catch (err) {
    res.status(500).json({ error: 'Transfer failed', message: err.message });
  }
});

// ===================== REVERSALS =====================

// POST /reversal - Reverse a transaction (purchase, transfer, or credit)
router.post('/reversal', authenticate, async function(req, res) {
  try {
    var originalTransactionId = req.body.transaction_id;
    var reason = req.body.reason || 'Customer request';
    var reversedBy = req.user.email || req.user.id;
    var type = req.body.type || 'auto'; // auto, purchase, transfer

    if (!originalTransactionId) {
      return res.status(400).json({ error: 'transaction_id required' });
    }

    var result;

    if (type === 'purchase') {
      result = await paymentService.reversePurchase(originalTransactionId, reason, reversedBy);
    } else {
      result = await otaService.reverseTransaction(originalTransactionId, reason, reversedBy);
    }

    res.json({
      success: true,
      reversal: result.reversal || result,
      message: 'Transaction reversed successfully. Corresponding credits have been adjusted.',
      original_transaction_id: originalTransactionId,
      reversed_by: reversedBy,
      reason: reason
    });
  } catch (err) {
    res.status(400).json({ error: 'Reversal failed', message: err.message });
  }
});

// ===================== QUERIES =====================

// GET /ota/status/:meterId - Get pending commands for a meter
router.get('/ota/status/:meterId', authenticate, function(req, res) {
  var commands = otaService.getPendingCommands(req.params.meterId);
  res.json({
    meter_id: req.params.meterId,
    pending_commands: commands.length,
    commands: commands
  });
});

// GET /transactions - Get transaction history
router.get('/transactions', authenticate, function(req, res) {
  var meterId = req.query.meter_id;
  var limit = parseInt(req.query.limit) || 50;
  var history = otaService.getTransactionHistory(meterId, limit);
  res.json({ count: history.length, transactions: history });
});

// GET /transactions/purchases - Get purchase history
router.get('/transactions/purchases', authenticate, function(req, res) {
  var filters = {};
  if (req.query.meter_number) filters.meterNumber = req.query.meter_number;
  if (req.query.status) filters.status = req.query.status;
  var purchases = paymentService.getTransactions(filters);
  res.json({ count: purchases.length, purchases: purchases });
});

module.exports = router;
