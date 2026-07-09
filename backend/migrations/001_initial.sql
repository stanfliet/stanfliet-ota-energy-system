CREATE EXTENSION IF NOT EXISTS ""uuid-ossp"";

CREATE TYPE meter_status AS ENUM ('online', 'offline', 'warning', 'alert', 'disconnected', 'commissioning');
CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE tariff_status AS ENUM ('pending', 'partially_signed', 'finalized', 'rejected', 'held');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_serial VARCHAR(50) UNIQUE NOT NULL,
    meter_type VARCHAR(50) DEFAULT 'single_phase',
    firmware_version VARCHAR(50) DEFAULT '1.0.0',
    status meter_status DEFAULT 'commissioning',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    relay_connected BOOLEAN DEFAULT true,
    current_tariff_per_kwh DECIMAL(8, 4) DEFAULT 2.1437,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meter_readings (
    id BIGSERIAL PRIMARY KEY,
    meter_id UUID REFERENCES meters(id) ON DELETE CASCADE,
    voltage DECIMAL(7, 2),
    current DECIMAL(7, 2),
    power DECIMAL(10, 2),
    power_factor DECIMAL(4, 3),
    frequency DECIMAL(5, 2),
    energy_accumulated_kwh DECIMAL(12, 4),
    temperature DECIMAL(5, 1),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_readings_meter_time ON meter_readings(meter_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID REFERENCES meters(id),
    alert_type VARCHAR(100) NOT NULL,
    severity alert_severity DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'active',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
