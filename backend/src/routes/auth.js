const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_secret_key_2026';
const JWT_EXPIRY = '24h'; // Long-lived session for utility use
const REFRESH_EXPIRY = '7d';

// Helper to generate JWT
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

// Helper to validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==================== SIGN UP ====================
router.post('/signup', async function(req, res) {
  try {
    const { email, password, name, phone } = req.body;

    // Validate inputs
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists in Supabase
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in Supabase
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        password_hash: passwordHash,
        name: name,
        phone: phone || null,
        role: 'customer',
        created_at: new Date().toISOString()
      })
      .select('id, email, name, role, created_at')
      .single();

    if (createError) {
      console.error('Supabase create error:', createError);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    // Create a default meter for the user (11-digit SA meter number format)
    const meterNumber = '770' + Date.now().toString().slice(-8); // 770 prefix + 8 digits = 11 digits
    await supabaseAdmin
      .from('meters')
      .insert({
        meter_number: meterNumber,
        customer_id: newUser.id,
        customer_name: name,
        location: req.body.location || 'Not specified',
        credit_balance: 0,
        status: 'offline',
        firmware_version: '1.0.0',
        created_at: new Date().toISOString()
      });

    // Generate tokens
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
});

// ==================== SIGN IN ====================
router.post('/signin', async function(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, name, role, phone')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get user's meters
    const { data: meters } = await supabaseAdmin
      .from('meters')
      .select('meter_number, credit_balance, status, location')
      .eq('customer_id', user.id);

    // Generate tokens
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
});

// ==================== REFRESH TOKEN ====================
router.post('/refresh', async function(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get fresh user data
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
    if (req.body.location) updates.location = req.body.location;

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

    // Verify current password
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    // Hash new password
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

module.exports = router;
module.exports.authenticate = authenticateMiddleware;
