const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connection', status: 'connected', timestamp: new Date().toISOString() }));
});

app.broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
};

// Health check
app.get('/', (req, res) => {
  res.json({ name: 'Stanfliet OTA Energy System API', version: '1.0.0', status: 'operational' });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Routes
const tariffRoutes = require('./routes/tariffRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');

app.use('/api/v1/tariff', tariffRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', healthRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('Stanfliet OTA Energy System API running on port ' + PORT);
});

module.exports = { app, server, wss };
