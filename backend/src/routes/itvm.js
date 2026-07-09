/**
 * ITVM API Routes
 * Handles tariff submission, validation, signing, and blockchain audit
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const {
  processTariffSubmission,
  finalizeTariff,
  getSubmission,
  getAllSubmissions,
  getBlockchain,
  getBlockchainStatus,
  computeTariff
} = require('../services/itvmService');

const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_secret_key_2026';

// Auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /submit - Submit a new tariff for ITVM validation
router.post('/submit', authenticate, (req, res) => {
  try {
    const {
      rab, depreciation, returnOnAssets, primaryEnergyCost,
      oAndM_cost, iprep_cost, efficiencyFactor, inflationAdjustment,
      totalVolumes, tariff_per_kwh
    } = req.body;

    // Validate required fields
    const required = ['rab', 'depreciation', 'returnOnAssets', 'primaryEnergyCost', 'oAndM_cost', 'iprep_cost', 'efficiencyFactor', 'inflationAdjustment', 'totalVolumes'];
    const missing = required.filter(f => req.body[f] === undefined || req.body[f] === null);
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', missing });
    }

    const submission = processTariffSubmission({
      rab: Number(rab),
      depreciation: Number(depreciation),
      returnOnAssets: Number(returnOnAssets),
      primaryEnergyCost: Number(primaryEnergyCost),
      oAndM_cost: Number(oAndM_cost),
      iprep_cost: Number(iprep_cost),
      efficiencyFactor: Number(efficiencyFactor),
      inflationAdjustment: Number(inflationAdjustment),
      totalVolumes: Number(totalVolumes),
      tariff_per_kwh: tariff_per_kwh ? Number(tariff_per_kwh) : undefined
    }, req.user.email || req.user.id);

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Submission failed', message: err.message });
  }
});

// POST /simulate-mypd6 - Simulate the MYPD6 error scenario
router.post('/simulate-mypd6', authenticate, (req, res) => {
  try {
    // The actual MYPD6 incorrect values (3.5 sigma depreciation anomaly)
    const mypd6Inputs = {
      rab: 48500000,
      depreciation: 3100000,  // 3.5 sigma anomaly - should have been ~1550000
      returnOnAssets: 8.5,
      primaryEnergyCost: 12500000,
      oAndM_cost: 3400000,
      iprep_cost: 890000,
      efficiencyFactor: 0.95,
      inflationAdjustment: 5.2,
      totalVolumes: 28500000
    };

    const submission = processTariffSubmission(mypd6Inputs, req.user.email || req.user.id);

    // Also compute what the correct tariff should have been
    const correctInputs = { ...mypd6Inputs, depreciation: 1550000 };
    const correctTariff = computeTariff(correctInputs);

    res.json({
      submission,
      analysis: {
        what_went_wrong: 'Depreciation was entered as R3,100,000 instead of the correct ~R1,550,000',
        sigma_anomaly: 3.5,
        incorrect_tariff: submission.computed_tariff,
        correct_tariff: correctTariff,
        overcharge_per_kwh: (submission.computed_tariff - correctTariff).toFixed(4),
        annual_overcharge: ((submission.computed_tariff - correctTariff) * mypd6Inputs.totalVolumes).toFixed(2),
        prevented_by_checks: submission.validation.checks
          .filter(c => !c.passed && c.severity === 'critical')
          .map(c => c.name)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Simulation failed', message: err.message });
  }
});

// POST /:id/sign - Sign a tariff submission (utility or regulator)
router.post('/:id/sign', authenticate, (req, res) => {
  try {
    const { party } = req.body; // 'utility' or 'regulator'
    if (!party || !['utility', 'regulator'].includes(party)) {
      return res.status(400).json({ error: 'Party must be "utility" or "regulator"' });
    }

    const result = finalizeTariff(req.params.id, party, req.user.email || req.user.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET / - List all submissions
router.get('/', authenticate, (req, res) => {
  const submissions = getAllSubmissions();
  res.json({ count: submissions.length, submissions });
});

// GET /blockchain - Get blockchain audit trail
router.get('/blockchain', authenticate, (req, res) => {
  const chain = getBlockchain();
  const status = getBlockchainStatus();
  res.json({ status, blocks: chain });
});

// GET /:id - Get specific submission
router.get('/:id', authenticate, (req, res) => {
  const submission = getSubmission(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  res.json(submission);
});

module.exports = router;
