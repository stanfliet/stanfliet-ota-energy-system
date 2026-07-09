class TariffEngine {
  constructor() {
    this.historicalTariffs = {
      'MYPD4': { year: 2019, tariff: 1.2346 },
      'MYPD5': { year: 2022, tariff: 1.5842 },
      'MYPD6_original': { year: 2025, tariff: 2.1437 },
      'MYPD6_error': { year: 2025, tariff: 2.8574 }
    };
  }

  calculateTariff(inputs) {
    const revenueRequirement =
      inputs.rab * (inputs.returnOnAssets / 100) +
      inputs.depreciation +
      inputs.primaryEnergyCost +
      inputs.oAndMCost +
      (inputs.iprepCost || 0);

    const adjustedVolume = inputs.totalVolumesKwh * (inputs.efficiencyFactor || 1.0);
    const tariff = (revenueRequirement / adjustedVolume) * (inputs.inflationAdjustment || 1.0);

    return Math.round(tariff * 10000) / 10000;
  }

  getHistoricalComparison(currentTariff) {
    const last = this.historicalTariffs['MYPD5'].tariff;
    const change = ((currentTariff - last) / last) * 100;
    return { previousTariff: last, changePercent: Math.round(change * 100) / 100 };
  }
}

module.exports = TariffEngine;
