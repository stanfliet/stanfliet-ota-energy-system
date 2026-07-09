const express = require('express');
const router = express.Router();
const TariffEngine = require('../services/tariffEngine');

router.post('/tariff/validate', async (req, res) => {
  try {
    const nersa = req.app.get('nersaService');
    const result = await nersa.validateTariffInputs(req.body, req.body.utilityId || 'ESKOM');
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tariff/submit', async (req, res) => {
  try {
    const pool = req.app.get('dbPool');
    const nersa = req.app.get('nersaService');
    const inputs = req.body.inputs || req.body;
    const preventionResult = await nersa.validateTariffInputs(inputs, req.body.utilityId || 'ESKOM');
    const isHeld = preventionResult.overallStatus === 'held';
    const computation = TariffEngine.computeTariff(inputs);
    const submissionId = TariffEngine.generateSubmissionId();

    const { rows } = await pool.query(
      'INSERT INTO tariff_submissions (submission_id, utility_id, rab, depreciation, return_on_assets, total_volumes_kwh, primary_energy_cost, o_and_m_cost, iprep_cost, efficiency_factor, inflation_adjustment, tariff_per_kwh, computation_hash, nersa_prevention_held, nersa_prevention_result, status) VALUES (,,,,,,,,,,,,,,,) RETURNING *',
      [submissionId, req.body.utilityId || 'ESKOM', inputs.RAB, inputs.depreciation, inputs.returnOnAssets, inputs.totalVolumes, inputs.primaryEnergy, inputs.oAndM, inputs.iprep || 0, inputs.efficiencyFactor || 1, inputs.inflationAdjustment || 1, computation.tariffPerKwh, computation.computationHash, isHeld, JSON.stringify(preventionResult), isHeld ? 'held' : 'pending']
    );

    if (req.app.broadcast) {
      req.app.broadcast({ type: 'tariff_submitted', submissionId, tariffPerKwh: computation.tariffPerKwh, status: rows[0].status, nersaStatus: preventionResult.overallStatus });
    }

    res.status(201).json({ submissionId, tariffPerKwh: computation.tariffPerKwh, computationHash: computation.computationHash, versionHash: computation.versionHash, status: rows[0].status, nersaPrevention: preventionResult, zkpProof: computation.zkpProof });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tariff/verify/:submissionId', async (req, res) => {
  try {
    const pool = req.app.get('dbPool');
    const { rows } = await pool.query('SELECT * FROM tariff_submissions WHERE submission_id = ', [req.params.submissionId]);
    if (rows.length === 0) return res.json({ valid: false, reason: 'Submission not found' });
    const sub = rows[0];
    res.json({ valid: true, submissionId: sub.submission_id, tariffPerKwh: parseFloat(sub.tariff_per_kwh), status: sub.status, nersaPreventionHeld: sub.nersa_prevention_held, verificationTimestamp: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tariff/history', async (req, res) => {
  try {
    const pool = req.app.get('dbPool');
    const { rows } = await pool.query('SELECT submission_id, utility_id, tariff_per_kwh, status, nersa_prevention_held, created_at FROM tariff_submissions ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tariff/:submissionId/sign', async (req, res) => {
  try {
    const pool = req.app.get('dbPool');
    const { role } = req.body;
    if (!['utility', 'regulator'].includes(role)) return res.status(400).json({ error: 'Role must be utility or regulator' });

    const column = role === 'utility' ? 'utility_signed_at' : 'regulator_signed_at';
    const { rows } = await pool.query(
      'UPDATE tariff_submissions SET ' + column + ' = CURRENT_TIMESTAMP, status = CASE WHEN utility_signed_at IS NOT NULL AND regulator_signed_at IS NOT NULL THEN \'finalized\' ELSE \'partially_signed\' END, finalized_at = CASE WHEN utility_signed_at IS NOT NULL AND regulator_signed_at IS NOT NULL THEN CURRENT_TIMESTAMP ELSE finalized_at END WHERE submission_id =  RETURNING status, tariff_per_kwh',
      [req.params.submissionId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ message: 'Signed as ' + role, status: rows[0].status, isFinalized: rows[0].status === 'finalized' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
