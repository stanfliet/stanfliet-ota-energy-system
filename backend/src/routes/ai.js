const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('./auth');

// AI Knowledge Base
const knowledgeBase = {
  system: `You are the Stanfliet OTA Energy System AI Assistant. You help users with:

SYSTEM OVERVIEW:
Stanfliet OTA Energy System is a prepaid electricity management system for South Africa.
It delivers credits to smart meters Over-The-Air (OTA) without manual token entry.
Features: OTA credit delivery, P2P transfers between meters, transaction reversals,
ITVM tariff verification, blockchain audit trail, 11-digit SA meter numbers.

KEY FACTS:
- Meter numbers are 11 digits (e.g., 77012345678)
- South African prepaid electricity market serves 8M+ households
- STS (Standard Transfer Specification) is the token standard
- NERSA is the national energy regulator
- MyPd6 reference case: R78M overcharge due to manual entry error
- Tariff rates: Standard R2.1437/kWh, Commercial R4.1175/kWh, Industrial R3.8920/kWh

FEATURES:
1. OTA Credit Delivery: Real-time credit to meter via MQTT (2-5 seconds)
2. P2P Transfer: Send credits between meters (max 50kWh/tx, 200kWh/day, 2% fee)
3. Reversals: 7 days for purchases, 48h for transfers
4. ITVM: 10-point tariff validation (Z-score, RAB change, ML anomaly, etc.)
5. Blockchain: Immutable audit trail for all tariff actions
6. STS Tokens: 20-digit backup tokens, STS Edition 2 compliant

HOW-TO:
- Sign in: Use email/password at https://stanfliet-ota-energy-system.vercel.app
- Buy electricity: Go to "Buy Electricity" tab, enter meter and amount
- Transfer: Go to "Send Credits" tab, enter source/destination/kWh
- Reverse: Go to "Send Credits" > "Reverse Transaction" tab
- View meter: Go to "Meters" tab to see all registered meters

TROUBLESHOOTING:
- "Cold start": Backend on free tier may take 30s to wake up
- "Invalid credentials": Check email/password or create new account
- Meter not receiving: Check meter is online and has network
- Transfer failed: Check balance, limits (50kWh/tx), meter status

PATENT INFORMATION:
Patent pending: South African provisional patent for OTA credit delivery system
with ITVM module, P2P transfers, reversals, and blockchain audit trail.
Patent covers: Components A-E (version control, 10-point validation, ZKP,
multi-party signatures, blockchain chain) + OTA delivery, P2P, reversals.`,

  // Context from user's data if available
  getUserContext: async function(userId) {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('name, email, role')
        .eq('id', userId)
        .single();

      const { data: meters } = await supabaseAdmin
        .from('meters')
        .select('meter_number, credit_balance, status')
        .eq('customer_id', userId);

      const { data: recentTx } = await supabaseAdmin
        .from('transactions')
        .select('transaction_id, type, amount_kwh, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        user: user || null,
        meters: meters || [],
        recentTransactions: recentTx || []
      };
    } catch (e) {
      return null;
    }
  },

  // Generate response based on query
  generateResponse: function(query, context) {
    query = query.toLowerCase();
    const responses = [];

    // Check for specific topics
    if (query.includes('meter') && query.includes('number')) {
      responses.push('South African prepaid meter numbers are 11 digits long. They typically start with a 3-digit prefix (e.g., 770) followed by 8 digits. You can find your meter number on the front of your meter or in your account dashboard.');
    }

    if (query.includes('buy') || query.includes('purchase') || query.includes('electricity')) {
      responses.push('To buy electricity: Go to the "Buy Electricity" tab, enter your 11-digit meter number and amount in Rands. Payment is processed and credits are delivered to your meter via OTA in 2-5 seconds. No manual token entry needed!');
    }

    if (query.includes('transfer') || query.includes('send')) {
      responses.push('P2P transfers let you send prepaid credits to another meter. Limits: 50 kWh per transaction, 200 kWh per day. Fee: 2% (min 0.5 kWh). Go to "Send Credits" tab and enter source meter, destination meter, and kWh amount.');
    }

    if (query.includes('reversal') || query.includes('reverse') || query.includes('refund')) {
      responses.push('You can reverse purchases within 7 days and transfers within 48 hours. Go to "Send Credits" > "Reverse Transaction" tab, enter the transaction ID and reason. The system will automatically re-credit the correct meters.');
    }

    if (query.includes('ota') || query.includes('over-the-air') || query.includes('over the air')) {
      responses.push('OTA (Over-The-Air) credit delivery is our patented technology that sends electricity credits directly to your smart meter via MQTT protocol. No 20-digit token entry required! The command is signed with HMAC-SHA256 and has a 60-second anti-replay window for security.');
    }

    if (query.includes('itvm') || query.includes('tariff') || query.includes('nersa')) {
      responses.push('The ITVM (Immutability Tariff Verification Module) is a patented 10-point validation pipeline that automatically checks tariff submissions for errors. It uses SHA-256 version integrity, Z-score anomaly detection, XGBoost ML scoring, and requires multi-party ECDSA signatures. All actions are recorded on an immutable blockchain.');
    }

    if (query.includes('sts') || query.includes('token')) {
      responses.push('STS (Standard Transfer Specification) tokens are 20-digit codes used as a backup delivery mechanism. Our system generates STS Edition 2 compliant tokens for every purchase. You can find the token on your receipt.');
    }

    if (query.includes('balance') || query.includes('credit') || query.includes('how much')) {
      if (context && context.meters && context.meters.length > 0) {
        const balanceInfo = context.meters.map(function(m) {
          return m.meter_number + ': ' + m.credit_balance + ' kWh (' + m.status + ')';
        }).join('\n');
        responses.push('Your meter balances:\n' + balanceInfo);
      } else {
        responses.push('You can check your meter balance in the "Meters" tab of your dashboard. Each meter shows its current credit balance in kWh and its online/offline status.');
      }
    }

    if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
      responses.push('Hello! I am the Stanfliet OTA Energy System AI Assistant. I can help you with buying electricity, transferring credits, reversing transactions, understanding the ITVM tariff system, and more. What would you like to know?');
    }

    if (query.includes('help') || query.includes('what can')) {
      responses.push('I can help with:\n- Buying prepaid electricity via OTA\n- Sending credits to another meter (P2P transfer)\n- Reversing a purchase or transfer\n- Checking meter balances and status\n- Understanding the ITVM tariff verification system\n- Explaining the blockchain audit trail\n- Troubleshooting login or delivery issues\n- Answering questions about the patent\nJust ask me anything about your energy system!');
    }

    if (query.includes('patent')) {
      responses.push('The Stanfliet OTA Energy System has a patent pending with the following key claims:\n1. OTA credit delivery to smart meters without manual token entry\n2. Peer-to-peer credit transfer between prepaid meters\n3. Transaction reversal mechanism with blockchain audit\n4. ITVM 10-point validation pipeline for tariff submissions\n5. SHA-256 version integrity with automatic NERSA prevention hold\n6. Zero-knowledge proof generation for regulator verification\n7. Multi-party ECDSA P-384 signature consensus\n8. Blockchain chain-of-custody for all tariff actions');
    }

    // Default fallback
    if (responses.length === 0) {
      responses.push('I understand you are asking about: "' + query + '". Here is what I can help with:\n\nYou can ask me about:\n- Buying electricity (OTA credit delivery)\n- Sending credits to another meter (P2P transfers)\n- Reversing transactions\n- Checking meter balances\n- Understanding the ITVM tariff system\n- The patent and technology\n- Troubleshooting issues\n\nIf your question is specific to your account, please use the dashboard. Otherwise, please rephrase your question for me to better assist you.');
    }

    return responses.join('\n\n');
  }
};

// POST /ai/chat - Ask the AI assistant
router.post('/chat', authenticate, async function(req, res) {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user context
    const context = await knowledgeBase.getUserContext(req.user.id);

    // Generate AI response
    const response = knowledgeBase.generateResponse(message, context);

    // Store in chat history
    const session_id = sessionId || ('session_' + req.user.id + '_' + Date.now());

    await supabaseAdmin
      .from('ai_chat_history')
      .insert([
        { user_id: req.user.id, session_id: session_id, role: 'user', content: message },
        { user_id: req.user.id, session_id: session_id, role: 'assistant', content: response }
      ]);

    res.json({
      response: response,
      session_id: session_id,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI service error', message: err.message });
  }
});

// GET /ai/history - Get chat history
router.get('/history', authenticate, async function(req, res) {
  try {
    const { data: history } = await supabaseAdmin
      .from('ai_chat_history')
      .select('session_id, role, content, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ history: history || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /ai/context - Get user context for AI
router.get('/context', authenticate, async function(req, res) {
  try {
    const context = await knowledgeBase.getUserContext(req.user.id);
    res.json(context);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get context' });
  }
});

module.exports = router;
