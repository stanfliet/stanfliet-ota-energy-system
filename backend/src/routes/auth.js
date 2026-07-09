const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'stanfliet_ota_secret_key_2026';

// In-memory user store (fallback when no DB)
const users = [
  { id: '1', email: 'admin@stanfliet-ota.com', password: bcrypt.hashSync('admin123', 10), role: 'admin', firstName: 'System', lastName: 'Admin' },
  { id: '2', email: 'inspector@stanfliet-ota.com', password: bcrypt.hashSync('inspector123', 10), role: 'inspector', firstName: 'Field', lastName: 'Inspector' },
  { id: '3', email: 'regulator@nersa.gov.za', password: bcrypt.hashSync('regulator123', 10), role: 'regulator', firstName: 'NERSA', lastName: 'Official' }
];

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// GET /me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
