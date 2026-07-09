const mqtt = require('mqtt');

function connectMQTT(app) {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  const client = mqtt.connect(brokerUrl, {
    clientId: 'stanfliet-backend-' + Math.random().toString(36).substring(7),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 5000,
    connectTimeout: 30000
  });

  client.on('connect', () => {
    console.log('MQTT connected to', brokerUrl);
    client.subscribe('stanfliet/ota/v1/meters/+/telemetry', { qos: 1 });
    client.subscribe('stanfliet/ota/v1/meters/+/alert', { qos: 1 });
    client.subscribe('stanfliet/ota/v1/meters/+/heartbeat', { qos: 1 });
    app.set('mqttClient', client);
  });

  client.on('message', (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      const meterSerial = topic.split('/')[4];
      if (topic.includes('/telemetry') && app.broadcast) {
        app.broadcast({ type: 'meter_telemetry', meterSerial, data, timestamp: new Date().toISOString() });
      }
      if (topic.includes('/alert') && app.broadcast) {
        app.broadcast({ type: 'meter_alert', meterSerial, severity: data.severity, title: data.title, timestamp: new Date().toISOString() });
      }
    } catch (err) { console.error('MQTT error:', err.message); }
  });

  client.on('error', (err) => console.error('MQTT error:', err.message));
  app.set('mqttClient', client);
  return client;
}

module.exports = { connectMQTT };
