const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase, supabaseAdmin } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_secret_key_2026';

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'customer', name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateMeterNumber() {
  const prefix = 'SG';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return prefix + timestamp + random;
}

// ==================== SIGN IN ====================
async function signInHandler(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, name, role, phone')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const { data: meters } = await supabaseAdmin
      .from('meters')
      .select('meter_number, credit_balance, status, location')
      .eq('customer_id', user.id);

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({
      message: 'Sign in successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      meters: meters || [],
      ...tokens
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}

// ==================== SIGN UP ====================
async function signUpHandler(req, res) {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = uuidv4();
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        password_hash: passwordHash,
        name: name,
        role: 'customer',
        phone: phone || null,
        created_at: new Date().toISOString()
      })
      .select('id, email, name, role')
      .single();

    if (insertError) {
      console.error('User insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    const meterNumber = generateMeterNumber();
    const { data: meter, error: meterError } = await supabaseAdmin
      .from('meters')
      .insert({
        meter_number: meterNumber,
        customer_id: userId,
        credit_balance: 0,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select('meter_number')
      .single();

    if (meterError) {
      console.error('Meter creation error (non-fatal):', meterError);
    }

    const tokens = generateTokens(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      meter: { meter_number: meterNumber },
      ...tokens
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== REFRESH TOKEN ====================
router.post('/refresh', async function(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', decoded.id)
      .single();

    if (!user) return res.status(401).json({ error: 'User not found' });

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Token expired. Please sign in again.' });
  }
});

// ==================== GET PROFILE ====================
router.get('/profile', authenticateMiddleware, async function(req, res) {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, phone, created_at, last_login')
      .eq('id', req.user.id)
      .single();

    const { data: meters } = await supabaseAdmin
      .from('meters')
      .select('*')
      .eq('customer_id', req.user.id);

    res.json({ user, meters: meters || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile', authenticateMiddleware, async function(req, res) {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, name, role, phone')
      .single();

    if (error) return res.status(500).json({ error: 'Update failed' });
    res.json({ message: 'Profile updated', user: data });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ==================== CHANGE PASSWORD ====================
router.put('/change-password', authenticateMiddleware, async function(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);

    await supabaseAdmin
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', req.user.id);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Middleware for protected routes
function authenticateMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Register routes - BOTH /signin AND /login work
router.post('/signin', signInHandler);
router.post('/login', signInHandler);   // <-- Added /login alias
router.post('/signup', signUpHandler);

module.exports = router;
module.exports.authenticate = authenticateMiddleware;
