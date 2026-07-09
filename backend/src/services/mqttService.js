const EventEmitter = require('events');

class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.topics = {};
    this.subscriptions = [];
    this.meters = {};
    this.messageLog = [];
  }

  connect() {
    this.connected = true;
    this.emit('connected');
    return true;
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnected');
  }

  publish(topic, message, qos, retain) {
    if (!this.connected) {
      this.emit('error', new Error('MQTT not connected'));
      return false;
    }
    var msgObj = {
      topic: topic,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      qos: qos || 1,
      retain: retain || false,
      timestamp: new Date().toISOString()
    };
    this.messageLog.push(msgObj);
    this.emit('message', msgObj);

    // Simulate meter acknowledgment
    var topicParts = topic.split('/');
    if (topicParts.length >= 5 && topicParts[4] === 'commands') {
      var meterId = topicParts[3];
      this.simulateMeterAck(meterId, topic, msgObj);
    }

    return true;
  }

  subscribe(topic, callback) {
    this.subscriptions.push({ topic: topic, callback: callback });
    this.emit('subscribed', topic);
  }

  simulateMeterAck(meterId, commandTopic, commandMsg) {
    var self = this;
    setTimeout(function() {
      var ackTopic = 'stanfliet/ota/v1/meters/' + meterId + '/status/command_ack';
      var ack = {
        command_topic: commandTopic,
        status: 'received',
        meter_id: meterId,
        timestamp: Date.now(),
        message: 'Command received and processing'
      };
      self.emit('message', { topic: ackTopic, message: JSON.stringify(ack), timestamp: new Date().toISOString() });
      if (self.subscriptions.length > 0) {
        self.subscriptions.forEach(function(sub) {
          if (ackTopic.includes(sub.topic.replace('+', '').replace('#', ''))) {
            sub.callback(ackTopic, JSON.stringify(ack));
          }
        });
      }
    }, 500 + Math.random() * 1000);
  }

  registerMeter(meterId, config) {
    this.meters[meterId] = config || { status: 'online' };
    var statusTopic = 'stanfliet/ota/v1/meters/' + meterId + '/status';
    this.publish(statusTopic, JSON.stringify({ meter_id: meterId, status: 'registered', timestamp: Date.now() }), 1, true);
  }

  getMeterStatus(meterId) {
    return this.meters[meterId] || null;
  }

  getMetrics() {
    return {
      connected: this.connected,
      meterCount: Object.keys(this.meters).length,
      totalMessages: this.messageLog.length,
      activeSubscriptions: this.subscriptions.length
    };
  }
}

module.exports = new MQTTService();
