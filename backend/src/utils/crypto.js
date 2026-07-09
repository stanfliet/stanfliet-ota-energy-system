const crypto = require('crypto');

class CryptoUtils {
  static computeTariffHash(inputs) {
    const sorted = Object.keys(inputs).sort().reduce((acc, key) => { acc[key] = inputs[key]; return acc; }, {});
    return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
  }

  static computeVersionHash(inputs) {
    const data = inputs.RAB + '|' + inputs.depreciation + '|' + inputs.returnOnAssets + '|' + inputs.totalVolumes;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateZKPProof(inputs, result) {
    const commitment = crypto.createHash('sha256').update(JSON.stringify({ inputs, result })).digest('hex');
    const verificationKey = crypto.createHash('sha256').update('stanfliet-zkp-v1-' + result.tariffPerKwh).digest('hex');
    return { proofHash: commitment, verificationKey: verificationKey, timestamp: new Date().toISOString() };
  }
}

module.exports = CryptoUtils;
