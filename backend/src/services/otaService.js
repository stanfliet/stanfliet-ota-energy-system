const crypto = require('crypto');
const EventEmitter = require('events');

class OTAService extends EventEmitter {
  constructor() {
    super();
    this.pendingCommands = new Map();
    this.meterSessions = new Map();
    this.transactionLog = [];
  }

  // STS Token generation (simulated STS Edition 2 compliant 20-digit token)
  generateSTSToken(meterNumber, amount, tariffRate, transactionId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const rand = crypto.randomInt(0, 9999);
    const raw = meterNumber.toString() + amount.toString() + tariffRate.toString() + timestamp.toString() + rand.toString() + transactionId;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    // Simulated 20-digit STS token format: 16 data digits + 4 check digits
    const dataPart = hash.substring(0, 16).replace(/[a-f]/g, function(c) { return (c.charCodeAt(0) - 87).toString(); }).substring(0, 16);
    const checkDigits = (parseInt(dataPart.substring(0, 8), 10) % 9973).toString().padStart(4, '0');
    return dataPart + checkDigits;
  }

  // OTA Credit Delivery - Real-time without manual token entry
  async deliverCredit(meterId, amountKWH, transactionId, meterMqttTopic) {
    const commandId = 'CMD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const payload = {
      command_id: commandId,
      type: 'CREDIT_UPDATE',
      meter_id: meterId,
      kwh: amountKWH,
      transaction_id: transactionId,
      timestamp: Date.now(),
      expiry: Date.now() + 60000, // 60 second anti-replay window
      signature: null // Will be signed below
    };
    payload.signature = crypto.createHash('sha256').update(JSON.stringify(payload) + 'stanfliet_ota_secret_key_2026').digest('hex');

    const command = {
      id: commandId,
      meterId: meterId,
      type: 'credit_delivery',
      payload: payload,
      status: 'pending',
      created_at: new Date().toISOString(),
      mqtt_topic: meterMqttTopic || ('stanfliet/ota/v1/meters/' + meterId + '/commands/credit'),
      retries: 0,
      maxRetries: 3,
      ack_received: false
    };

    this.pendingCommands.set(commandId, command);
    this.emit('command:publish', command);
    return command;
  }

  // P2P Credit Transfer between meters
  async p2pTransfer(sourceMeterId, destMeterId, amountKWH, userId) {
    const transferId = 'P2P-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

    // Debit source meter
    const debitCmd = await this.deliverCredit(sourceMeterId, -amountKWH, transferId, null);
    debitCmd.type = 'p2p_debit';

    // Credit destination meter
    const creditCmd = await this.deliverCredit(destMeterId, amountKWH, transferId, null);
    creditCmd.type = 'p2p_credit';

    const transfer = {
      transfer_id: transferId,
      source_meter: sourceMeterId,
      destination_meter: destMeterId,
      amount_kwh: amountKWH,
      user_id: userId,
      debit_command: debitCmd.id,
      credit_command: creditCmd.id,
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
      reversed: false
    };

    // Log the transaction
    this.transactionLog.push(transfer);
    this.emit('transfer:initiated', transfer);
    return transfer;
  }

  // Reversal feature - reverse any wrong purchase or transfer
  async reverseTransaction(originalTransactionId, reason, reversedBy) {
    const original = this.transactionLog.find(function(t) {
      return t.transfer_id === originalTransactionId || t.debit_command === originalTransactionId || t.credit_command === originalTransactionId;
    });

    if (!original) throw new Error('Transaction not found for reversal');
    if (original.reversed) throw new Error('Transaction already reversed');

    const reversalId = 'REV-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const reversal = {
      reversal_id: reversalId,
      original_transaction_id: originalTransactionId,
      reason: reason,
      reversed_by: reversedBy,
      created_at: new Date().toISOString(),
      completed_at: null,
      status: 'pending'
    };

    // If it was a transfer, reverse both debit and credit
    if (original.source_meter && original.destination_meter) {
      // Reverse: credit the source back, debit the destination back
      await this.deliverCredit(original.source_meter, original.amount_kwh, reversalId, null);
      await this.deliverCredit(original.destination_meter, -original.amount_kwh, reversalId, null);
      original.reversed = true;
      original.reversed_at = new Date().toISOString();
      original.reversal_reason = reason;
    }

    reversal.completed_at = new Date().toISOString();
    reversal.status = 'completed';

    this.transactionLog.push(reversal);
    this.emit('transaction:reversed', reversal);
    return reversal;
  }

  // Acknowledge command receipt from meter
  acknowledgeCommand(commandId, meterId, success) {
    const cmd = this.pendingCommands.get(commandId);
    if (!cmd) return false;
    cmd.ack_received = true;
    cmd.acknowledged_at = new Date().toISOString();
    cmd.status = success ? 'completed' : 'failed';
    this.emit('command:acknowledged', cmd);
    return cmd;
  }

  // Get pending commands for a meter
  getPendingCommands(meterId) {
    const result = [];
    this.pendingCommands.forEach(function(cmd) {
      if (cmd.meterId === meterId && cmd.status === 'pending') {
        result.push(cmd);
      }
    });
    return result;
  }

  // Get transaction history
  getTransactionHistory(meterId, limit) {
    limit = limit || 50;
    var result = [];
    for (var i = this.transactionLog.length - 1; i >= 0 && result.length < limit; i--) {
      var t = this.transactionLog[i];
      if (!meterId || t.source_meter === meterId || t.destination_meter === meterId) {
        result.push(t);
      }
    }
    return result;
  }

  // Validate token format (STS compliant)
  validateSTSToken(token) {
    if (!token || token.length !== 20) return { valid: false, reason: 'Token must be 20 digits' };
    if (!/^\d+$/.test(token)) return { valid: false, reason: 'Token must be numeric' };
    // Check digit verification (simplified)
    var dataPart = token.substring(0, 16);
    var checkDigits = token.substring(16);
    var expectedCheck = (parseInt(dataPart.substring(0, 8), 10) % 9973).toString().padStart(4, '0');
    if (checkDigits !== expectedCheck) {
      return { valid: false, reason: 'Check digit mismatch' };
    }
    return { valid: true, decoded: { data: dataPart, amount_kwh: parseInt(dataPart.substring(4, 10), 10) / 100 } };
  }
}

module.exports = new OTAService();
