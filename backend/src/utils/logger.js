const logger = {
  info: (msg) => { const d = new Date(); console.log('[' + d.toISOString() + '] [INFO]', msg); },
  warn: (msg) => { const d = new Date(); console.warn('[' + d.toISOString() + '] [WARN]', msg); },
  error: (msg, data) => { const d = new Date(); console.error('[' + d.toISOString() + '] [ERROR]', msg, data || ''); },
  debug: (msg) => { const d = new Date(); console.log('[' + d.toISOString() + '] [DEBUG]', msg); }
};

module.exports = logger;
