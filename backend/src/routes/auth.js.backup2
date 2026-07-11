const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase, supabaseAdmin } = require('../config/supabase');

// JWT_SECRET is used ONLY by our backend to sign/verify tokens
// It is NOT sent to Supabase - Supabase uses its own key system
const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_jwt_super_secret_key_2026_64_chars_long!!';
const ADMIN_SECRET = 'ota';

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

function isValidMeterNumber(meter) {
  return /^\d{11}$/.test(meter);
}

function checkAdminByEmail(email) {
  if (!email) return false;
  const localPart = email.split('@')[0].toLowerCase();
  return localPart.endsWith('ota');
}

// ==================== SIGN IN ====================
async function signInHandler(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Sign in attempt for:', email);

    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, name, role, phone')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      console.error('Supabase lookup error:', findError);
      return res.status(500).json({ error: 'Database error. Please try again.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login (non-critical - catch errors)
    try {
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
    } catch (e) {
      console.warn('Failed to update last_login:', e.message);
    }

    // Get meters (non-critical - catch errors)
    let meters = [];
    try {
      const { data: m } = await supabaseAdmin
        .from('meters')
        .select('*')
        .eq('customer_id', user.id);
      if (m) meters = m;
    } catch (e) {
      console.warn('Failed to fetch meters:', e.message);
    }

    const tokens = generateTokens(user);

    console.log('Sign in successful for:', email);

    res.json({
      message: 'Sign in successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      meters: meters,
      ...tokens
    });
  } catch (err) {
    console.error('Sign in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== SIGN UP ====================
async function signUpHandler(req, res) {
  try {
    const { email, password, name, phone, meter_number, secret_key } = req.body;

    if (!email || !password || !name || !meter_number) {
      return res.status(400).json({
        error: 'Email, password, name, and 11-digit meter number are required'
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isValidMeterNumber(meter_number)) {
      return res.status(400).json({ error: 'Meter number must be exactly 11 digits' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check existing user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });
    }

    // Check existing meter
    const { data: existingMeter } = await supabaseAdmin
      .from('meters')
      .select('id')
      .eq('meter_number', meter_number)
      .maybeSingle();

    if (existingMeter) {
      return res.status(409).json({ error: 'Meter number already registered. Contact support.' });
    }

    let role = 'customer';
    let secretUsed = null;

    if (secret_key && secret_key.trim().toLowerCase() === ADMIN_SECRET) {
      role = 'admin';
      secretUsed = ADMIN_SECRET;
    }
    else if (checkAdminByEmail(email)) {
      role = 'admin';
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
        role: role,
        phone: phone || null,
        meter_number: meter_number,
        secret_key: secretUsed,
        created_at: new Date().toISOString()
      })
      .select('id, email, name, role')
      .single();

    if (insertError) {
      console.error('User insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create account: ' + insertError.message });
    }

    // Create meter
    try {
      const { data: meterExists } = await supabaseAdmin
        .from('meters')
        .select('id, meter_number')
        .eq('meter_number', meter_number)
        .maybeSingle();

      if (meterExists) {
        await supabaseAdmin
          .from('meters')
          .update({ customer_id: userId, status: 'active' })
          .eq('id', meterExists.id);
      } else {
        await supabaseAdmin
          .from('meters')
          .insert({
            meter_number: meter_number,
            customer_id: userId,
            credit_balance: 0,
            status: 'active',
            created_at: new Date().toISOString()
          });
      }
    } catch (e) {
      console.warn('Meter creation warning (non-fatal):', e.message);
    }

    let meterData = { meter_number: meter_number };
    try {
      const { data: md } = await supabaseAdmin
        .from('meters')
        .select('*')
        .eq('meter_number', meter_number)
        .maybeSingle();
      if (md) meterData = md;
    } catch (e) {}

    const tokens = generateTokens(newUser);

    console.log('Sign up successful:', email, 'role:', role);

    res.status(201).json({
      message: role === 'admin'
        ? 'Admin account created successfully'
        : 'Consumer account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      meter: meterData,
      role_type: role,
      ...tokens
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
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
      .select('id, email, name, role, phone, meter_number, created_at, last_login')
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

// ==================== AUTHENTICATE MIDDLEWARE ====================
function authenticateMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    // Verify using OUR JWT_SECRET only - this has nothing to do with Supabase's JWT system
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.post('/signin', signInHandler);
router.post('/login', signInHandler);
router.post('/signup', signUpHandler);

module.exports = router;
module.exports.authenticate = authenticateMiddleware;
