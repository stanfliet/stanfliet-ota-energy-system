const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.transactions = [];
    this.rates = {
      'standard': 2.1437,  // ZAR/kWh
      'commercial': 4.1175,
      'industrial': 3.8920,
      'night_saver': 1.5432
    };
  }

  // Process a purchase
  async processPurchase(meterNumber, amountZAR, paymentMethod, customerInfo) {
    var tariffRate = this.rates[customerInfo.tariffType] || this.rates.standard;
    var kwhUnits = amountZAR / tariffRate;

    var transaction = {
      transaction_id: 'TXN-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      meter_number: meterNumber,
      amount_zar: amountZAR,
      kwh_units: kwhUnits,
      tariff_rate: tariffRate,
      payment_method: paymentMethod,
      customer_info: customerInfo,
      status: 'completed',
      created_at: new Date().toISOString(),
      receipt_number: 'RCP-' + Date.now().toString(36).toUpperCase()
    };

    this.transactions.push(transaction);
    return transaction;
  }

  // Reverse a purchase (full refund)
  async reversePurchase(transactionId, reason, reversedBy) {
    var txn = this.transactions.find(function(t) { return t.transaction_id === transactionId; });
    if (!txn) throw new Error('Transaction not found');
    if (txn.reversed) throw new Error('Transaction already reversed');

    txn.reversed = true;
    txn.reversed_at = new Date().toISOString();
    txn.reversal_reason = reason;
    txn.reversed_by = reversedBy;

    var reversal = {
      reversal_id: 'REV-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      original_transaction_id: transactionId,
      refund_amount_zar: txn.amount_zar,
      reason: reason,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    return { reversal: reversal, original: txn };
  }

  // Get all transactions with optional filters
  getTransactions(filters) {
    filters = filters || {};
    var result = this.transactions;
    if (filters.meterNumber) result = result.filter(function(t) { return t.meter_number === filters.meterNumber; });
    if (filters.status) result = result.filter(function(t) { return t.status === filters.status; });
    if (filters.startDate) result = result.filter(function(t) { return new Date(t.created_at) >= new Date(filters.startDate); });
    if (filters.endDate) result = result.filter(function(t) { return new Date(t.created_at) <= new Date(filters.endDate); });
    return result;
  }
}

module.exports = new PaymentService();
