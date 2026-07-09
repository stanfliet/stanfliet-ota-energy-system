const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const itvmService = require('../services/itvmService');

const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_secret_key_2026';

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

router.post('/submit', authenticate, function(req, res) {
  try {
    const required = ['rab', 'depreciation', 'returnOnAssets', 'primaryEnergyCost', 'oAndM_cost', 'iprep_cost', 'efficiencyFactor', 'inflationAdjustment', 'totalVolumes'];
    const missing = required.filter(function(f) { return req.body[f] === undefined || req.body[f] === null; });
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', missing: missing });
    }

    const submission = itvmService.processTariffSubmission({
      rab: Number(req.body.rab),
      depreciation: Number(req.body.depreciation),
      returnOnAssets: Number(req.body.returnOnAssets),
      primaryEnergyCost: Number(req.body.primaryEnergyCost),
      oAndM_cost: Number(req.body.oAndM_cost),
      iprep_cost: Number(req.body.iprep_cost),
      efficiencyFactor: Number(req.body.efficiencyFactor),
      inflationAdjustment: Number(req.body.inflationAdjustment),
      totalVolumes: Number(req.body.totalVolumes),
      tariff_per_kwh: req.body.tariff_per_kwh ? Number(req.body.tariff_per_kwh) : undefined
    }, req.user.email || req.user.id);

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Submission failed', message: err.message });
  }
});

router.post('/simulate-mypd6', authenticate, function(req, res) {
  try {
    const mypd6Inputs = {
      rab: 48500000,
      depreciation: 3100000,
      returnOnAssets: 8.5,
      primaryEnergyCost: 12500000,
      oAndM_cost: 3400000,
      iprep_cost: 890000,
      efficiencyFactor: 0.95,
      inflationAdjustment: 5.2,
      totalVolumes: 28500000
    };

    const submission = itvmService.processTariffSubmission(mypd6Inputs, req.user.email || req.user.id);

    const correctInputs = Object.assign({}, mypd6Inputs);
    correctInputs.depreciation = 1550000;
    const correctTariff = itvmService.computeTariff(correctInputs);

    res.json({
      submission: submission,
      analysis: {
        what_went_wrong: 'Depreciation was entered as R3,100,000 instead of the correct ~R1,550,000',
        sigma_anomaly: 3.5,
        incorrect_tariff: submission.computed_tariff,
        correct_tariff: correctTariff,
        overcharge_per_kwh: (submission.computed_tariff - correctTariff).toFixed(4),
        annual_overcharge: ((submission.computed_tariff - correctTariff) * mypd6Inputs.totalVolumes).toFixed(2),
        prevented_by_checks: submission.validation.checks.filter(function(c) { return !c.passed && c.severity === 'critical'; }).map(function(c) { return c.name; })
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Simulation failed', message: err.message });
  }
});

router.post('/:id/sign', authenticate, function(req, res) {
  try {
    var party = req.body.party;
    if (!party || (party !== 'utility' && party !== 'regulator')) {
      return res.status(400).json({ error: 'Party must be "utility" or "regulator"' });
    }
    var result = itvmService.finalizeTariff(req.params.id, party, req.user.email || req.user.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/', authenticate, function(req, res) {
  var submissions = itvmService.getAllSubmissions();
  res.json({ count: submissions.length, submissions: submissions });
});

router.get('/blockchain', authenticate, function(req, res) {
  var chain = itvmService.getBlockchain();
  var status = itvmService.getBlockchainStatus();
  res.json({ status: status, blocks: chain });
});

router.get('/:id', authenticate, function(req, res) {
  var submission = itvmService.getSubmission(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  res.json(submission);
});

module.exports = router;
