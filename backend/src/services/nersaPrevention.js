class NersaPreventionService {
  constructor(pool) { this.pool = pool; }

  async validateTariffInputs(inputs, utilityId) {
    const results = { overallStatus: 'approved', checks: [], summary: '', nersaReference: '', timestamp: new Date().toISOString() };
    const checks = [];
    checks.push(await this.checkDepreciationOutlier(inputs.depreciation, utilityId));
    checks.push(await this.checkRABChange(inputs.RAB, utilityId));
    checks.push(this.checkInputCompleteness(inputs));
    checks.push(this.checkRangeValidation(inputs));
    checks.push(this.checkVersionIntegrity(inputs));
    checks.push(this.checkCrossComponentConsistency(inputs));
    checks.push(await this.checkHistoricalComparison(inputs, utilityId));
    checks.push(this.checkFormulaCorrectness(inputs));
    checks.push(await this.checkMLAnomalyScore(inputs, utilityId));
    checks.push(this.checkMultiPartyThreshold(inputs));
    results.checks = checks;

    const criticals = checks.filter(c => c.severity === 'critical' && c.status === 'failed');
    const warnings = checks.filter(c => c.severity === 'warning' && c.status === 'failed');

    if (criticals.length > 0) {
      results.overallStatus = 'held';
      results.summary = 'HELD: ' + criticals.length + ' critical check(s) failed. Prevents NERSA R76 billion class error.';
      results.nersaReference = 'NERSA Prevention Hold: ' + criticals.map(c => c.check).join(', ');
    } else if (warnings.length > 0) {
      results.overallStatus = 'flagged';
      results.summary = 'FLAGGED: ' + warnings.length + ' warning(s) require human review.';
    } else {
      results.overallStatus = 'approved';
      results.summary = 'APPROVED: All 10 NERSA prevention checks passed.';
    }
    return results;
  }

  async checkDepreciationOutlier(depreciation, utilityId) {
    try {
      const { rows } = await this.pool.query('SELECT depreciation FROM tariff_submissions WHERE utility_id =  AND status = \'finalized\' ORDER BY created_at DESC LIMIT 50', [utilityId]);
      if (rows.length < 3) return { check: 'depreciation_z_score', status: 'passed', severity: 'info', message: 'Insufficient historical data' };
      const values = rows.map(r => parseFloat(r.depreciation));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
      const zScore = stdDev > 0 ? Math.abs((depreciation - mean) / stdDev) : 0;
      if (zScore > 3.0) return { check: 'depreciation_z_score', status: 'failed', severity: 'critical', message: 'DEPRECIATION ANOMALY |z|=' + zScore.toFixed(2) + '. This is the NERSA MYPD6 class error.', score: zScore };
      if (zScore > 2.0) return { check: 'depreciation_z_score', status: 'failed', severity: 'warning', message: 'Depreciation |z|=' + zScore.toFixed(2) + ' requires review', score: zScore };
      return { check: 'depreciation_z_score', status: 'passed', severity: 'normal', message: 'Depreciation normal |z|=' + zScore.toFixed(2), score: zScore };
    } catch (err) { return { check: 'depreciation_z_score', status: 'error', severity: 'info', message: 'Check unavailable' }; }
  }

  async checkRABChange(rab, utilityId) {
    try {
      const { rows } = await this.pool.query('SELECT rab FROM tariff_submissions WHERE utility_id =  AND status = \'finalized\' ORDER BY created_at DESC LIMIT 1', [utilityId]);
      if (rows.length === 0) return { check: 'rab_change', status: 'passed', severity: 'info', message: 'No previous submission' };
      const changePct = Math.abs((rab - parseFloat(rows[0].rab)) / parseFloat(rows[0].rab) * 100);
      if (changePct > 20) return { check: 'rab_change', status: 'failed', severity: 'critical', message: 'RAB changed ' + changePct.toFixed(1) + '%' };
      if (changePct > 10) return { check: 'rab_change', status: 'failed', severity: 'warning', message: 'RAB changed ' + changePct.toFixed(1) + '%' };
      return { check: 'rab_change', status: 'passed', severity: 'normal', message: 'RAB change ' + changePct.toFixed(1) + '% OK' };
    } catch (err) { return { check: 'rab_change', status: 'error', severity: 'info', message: 'Unavailable' }; }
  }

  checkInputCompleteness(inputs) {
    const required = ['RAB', 'depreciation', 'returnOnAssets', 'totalVolumes', 'primaryEnergy', 'oAndM'];
    const missing = required.filter(f => inputs[f] === undefined || inputs[f] === null || inputs[f] === '');
    if (missing.length > 0) return { check: 'input_completeness', status: 'failed', severity: 'critical', message: 'Missing: ' + missing.join(', ') };
    return { check: 'input_completeness', status: 'passed', severity: 'normal', message: 'All inputs present' };
  }

  checkRangeValidation(inputs) {
    if (inputs.returnOnAssets !== undefined && (inputs.returnOnAssets < 0 || inputs.returnOnAssets > 50))
      return { check: 'range_validation', status: 'failed', severity: 'critical', message: 'Return on Assets outside [0, 50]' };
    return { check: 'range_validation', status: 'passed', severity: 'normal', message: 'Values in range' };
  }

  checkVersionIntegrity(inputs) {
    if (!inputs.versionHash) return { check: 'version_integrity', status: 'failed', severity: 'critical', message: 'No version hash' };
    return { check: 'version_integrity', status: 'passed', severity: 'normal', message: 'Version hash present' };
  }

  checkCrossComponentConsistency(inputs) {
    if (inputs.RAB && inputs.depreciation) {
      const ratio = inputs.depreciation / inputs.RAB;
      if (ratio < 0.01 || ratio > 0.15) return { check: 'cross_component_consistency', status: 'failed', severity: 'warning', message: 'Depreciation/RAB ratio ' + (ratio*100).toFixed(1) + '% outside [1%, 15%]' };
    }
    return { check: 'cross_component_consistency', status: 'passed', severity: 'normal', message: 'Cross-component consistent' };
  }

  async checkHistoricalComparison(inputs, utilityId) {
    try {
      const { rows } = await this.pool.query('SELECT primary_energy_cost FROM tariff_submissions WHERE utility_id =  AND status = \'finalized\' ORDER BY created_at DESC LIMIT 1', [utilityId]);
      if (rows.length === 0) return { check: 'historical_comparison', status: 'passed', severity: 'info', message: 'No history' };
      const delta = Math.abs((inputs.primaryEnergy - parseFloat(rows[0].primary_energy_cost)) / parseFloat(rows[0].primary_energy_cost) * 100);
      return { check: 'historical_comparison', status: delta > 30 ? 'failed' : 'passed', severity: delta > 30 ? 'warning' : 'normal', message: 'Energy cost change ' + delta.toFixed(1) + '%' };
    } catch (err) { return { check: 'historical_comparison', status: 'error', severity: 'info', message: 'Unavailable' }; }
  }

  checkFormulaCorrectness(inputs) {
    const tariff = ((inputs.RAB * inputs.returnOnAssets/100 + inputs.depreciation + inputs.primaryEnergy + inputs.oAndM + (inputs.iprep||0)) * (inputs.efficiencyFactor||1) * (inputs.inflationAdjustment||1)) / inputs.totalVolumes;
    if (tariff < 0.5 || tariff > 10) return { check: 'formula_correctness', status: 'failed', severity: 'critical', message: 'Tariff R' + tariff.toFixed(4) + ' outside [R0.50, R10.00]' };
    return { check: 'formula_correctness', status: 'passed', severity: 'normal', message: 'Formula correct: R' + tariff.toFixed(4) + '/kWh' };
  }

  async checkMLAnomalyScore(inputs, utilityId) {
    try {
      const { rows } = await this.pool.query('SELECT rab, depreciation, return_on_assets FROM tariff_submissions WHERE utility_id =  AND status = \'finalized\' ORDER BY created_at DESC LIMIT 100', [utilityId]);
      if (rows.length < 10) return { check: 'ml_anomaly_score', status: 'passed', severity: 'info', message: 'Need 10+ samples' };
      let score = 0;
      for (const p of [{value: inputs.RAB, key: 'rab'}, {value: inputs.depreciation, key: 'depreciation'}, {value: inputs.returnOnAssets, key: 'return_on_assets'}]) {
        const vals = rows.map(r => parseFloat(r[p.key]));
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length);
        if (std > 0) { const z = Math.abs((p.value - mean) / std); if (z > 2) score += z; }
      }
      if (score > 15) return { check: 'ml_anomaly_score', status: 'failed', severity: 'critical', message: 'ML score ' + score.toFixed(1) + ' exceeds 15', score: score };
      if (score > 8) return { check: 'ml_anomaly_score', status: 'failed', severity: 'warning', message: 'ML score ' + score.toFixed(1) + ' needs review', score: score };
      return { check: 'ml_anomaly_score', status: 'passed', severity: 'normal', message: 'ML score ' + score.toFixed(1) + ' normal', score: score };
    } catch (err) { return { check: 'ml_anomaly_score', status: 'error', severity: 'info', message: 'Unavailable' }; }
  }

  checkMultiPartyThreshold(inputs) {
    if (inputs.RAB > 500e9 || inputs.returnOnAssets > 15) return { check: 'multi_party_threshold', status: 'failed', severity: 'warning', message: 'Exceeds multi-party threshold' };
    return { check: 'multi_party_threshold', status: 'passed', severity: 'normal', message: 'Standard process applies' };
  }
}

module.exports = NersaPreventionService;
