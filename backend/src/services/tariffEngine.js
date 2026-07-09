const CryptoUtils = require('../utils/crypto');

class TariffEngine {
  static computeTariff(inputs) {
    const { RAB, depreciation, returnOnAssets, totalVolumes, primaryEnergy, oAndM, iprep = 0, efficiencyFactor = 1.0, inflationAdjustment = 1.0 } = inputs;
    const returnAmount = RAB * (returnOnAssets / 100);
    const totalRevenue = returnAmount + depreciation + primaryEnergy + oAndM + parseFloat(iprep);
    const adjustedRevenue = totalRevenue * efficiencyFactor * inflationAdjustment;
    const tariffPerKwh = Math.round((adjustedRevenue / totalVolumes) * 10000) / 10000;
    const computationHash = CryptoUtils.computeTariffHash(inputs);
    const versionHash = CryptoUtils.computeVersionHash(inputs);
    const zkpProof = CryptoUtils.generateZKPProof(inputs, { tariffPerKwh });

    return { tariffPerKwh, returnAmount, totalRevenue, adjustedRevenue, computationHash, versionHash, zkpProof };
  }

  static verifyTariff(submission) {
    const inputs = {
      RAB: parseFloat(submission.rab),
      depreciation: parseFloat(submission.depreciation),
      returnOnAssets: parseFloat(submission.return_on_assets),
      totalVolumes: parseFloat(submission.total_volumes_kwh),
      primaryEnergy: parseFloat(submission.primary_energy_cost),
      oAndM: parseFloat(submission.o_and_m_cost),
      iprep: parseFloat(submission.iprep_cost || 0),
      efficiencyFactor: parseFloat(submission.efficiency_factor || 1.0),
      inflationAdjustment: parseFloat(submission.inflation_adjustment || 1.0)
    };
    const result = this.computeTariff(inputs);
    return { isValid: result.computationHash === submission.computation_hash, storedTariff: parseFloat(submission.tariff_per_kwh), computedTariff: result.tariffPerKwh, storedHash: submission.computation_hash, computedHash: result.computationHash };
  }

  static generateSubmissionId() {
    return 'TARIFF-' + Date.now().toString(36).toUpperCase();
  }
}

module.exports = TariffEngine;
