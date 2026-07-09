const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const pool = req.app.get('dbPool');
    const { rows } = await pool.query('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = ', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.first_name + ' ' + user.last_name },
      process.env.JWT_SECRET || 'stanfliet_secret',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) return res.status(400).json({ error: 'All fields required' });

    const pool = req.app.get('dbPool');
    const existing = await pool.query('SELECT id FROM users WHERE email = ', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (, , , , ) RETURNING id, email, first_name, last_name, role',
      [email, hash, firstName, lastName, role || 'operator']
    );
    res.status(201).json({ message: 'User registered', user: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
