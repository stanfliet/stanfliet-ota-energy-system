const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const tariffRoutes = require('./routes/tariffs');
const meterRoutes = require('./routes/meters');
const alertRoutes = require('./routes/alerts');
const paymentRoutes = require('./routes/payments');
const firmwareRoutes = require('./routes/firmware');

const app = express();
const PORT = process.env.PORT || 3001;

// Premium middleware stack
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ name: 'Stanfliet OTA Energy System API', version: '1.0.0', status: 'operational' });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tariff', tariffRoutes);
app.use('/api/v1/meters', meterRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/firmware', firmwareRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stanfliet OTA API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
