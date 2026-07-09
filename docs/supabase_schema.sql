-- ============================================================================
-- STANFLEIT OTA ENERGY SYSTEM - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'auditor', 'customer');
CREATE TYPE meter_status AS ENUM ('online', 'offline', 'tampered', 'low_battery');
CREATE TYPE transaction_type AS ENUM ('purchase', 'transfer', 'reversal', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE tariff_status AS ENUM ('draft', 'validating', 'held', 'pending_signatures', 'partial_signed', 'finalized', 'submitted_nersa', 'approved', 'rejected', 'expired', 'archived');

-- 2. USERS TABLE (Primary auth table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    phone VARCHAR(20),
    location TEXT,
    email_verified BOOLEAN DEFAULT false,
    mfa_enabled BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. METERS TABLE (11-digit South African meter numbers)
CREATE TABLE IF NOT EXISTS meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_number VARCHAR(11) UNIQUE NOT NULL CHECK (char_length(meter_number) = 11),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    location TEXT,
    credit_balance DECIMAL(12,2) DEFAULT 0.00,
    status meter_status DEFAULT 'offline',
    firmware_version VARCHAR(20) DEFAULT '1.0.0',
    last_online TIMESTAMPTZ,
    meter_type VARCHAR(50) DEFAULT 'residential',
    tariff_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    type transaction_type NOT NULL,
    source_meter_id UUID REFERENCES meters(id),
    dest_meter_id UUID REFERENCES meters(id),
    amount_kwh DECIMAL(12,2) NOT NULL,
    amount_zar DECIMAL(12,2),
    fee_kwh DECIMAL(12,2) DEFAULT 0,
    fee_zar DECIMAL(12,2) DEFAULT 0,
    status transaction_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    created_by UUID REFERENCES users(id),
    reversal_ref UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TARIFF SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS tariff_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    input_parameters JSONB NOT NULL,
    computation_hash VARCHAR(64) NOT NULL,
    computed_tariff DECIMAL(10,4),
    submitted_tariff DECIMAL(10,4),
    validation_results JSONB,
    zkp_proof JSONB,
    status tariff_status DEFAULT 'draft',
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BLOCKCHAIN BLOCKS TABLE
CREATE TABLE IF NOT EXISTS blockchain_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_index INTEGER NOT NULL,
    block_hash VARCHAR(64) UNIQUE NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255),
    actor_id UUID REFERENCES users(id),
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OTA COMMANDS TABLE
CREATE TABLE IF NOT EXISTS ota_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id VARCHAR(50) UNIQUE NOT NULL,
    meter_id UUID REFERENCES meters(id),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(128) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 9. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open',
    ai_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AI CHAT HISTORY TABLE
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FIRMWARE VERSIONS TABLE
CREATE TABLE IF NOT EXISTS firmware_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    changelog TEXT,
    rollout_percentage INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_meters_meter_number ON meters(meter_number);
CREATE INDEX idx_meters_customer ON meters(customer_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_meter ON transactions(source_meter_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_blockchain_index ON blockchain_blocks(block_index);
CREATE INDEX idx_ai_chat_session ON ai_chat_history(session_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_own ON users FOR ALL USING (id = auth.uid());
-- Customers can read their own meters
CREATE POLICY meters_own ON meters FOR ALL USING (customer_id = auth.uid());
-- Customers can read their own transactions
CREATE POLICY transactions_own ON transactions FOR ALL USING (created_by = auth.uid());
-- Customers can read their own notifications
CREATE POLICY notifications_own ON notifications FOR ALL USING (user_id = auth.uid());
-- Customers can read their own chat history
CREATE POLICY ai_chat_own ON ai_chat_history FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- SEED DATA: Test user
-- ============================================================================
-- Password: test1234 (bcrypt hash)
INSERT INTO users (email, password_hash, name, role) VALUES
('test@stanfliet.co.za', '$2a$12$LJ3m4ys3Lg3YOBGkMN7OcOX5G4G5YH4g4g4g4g4g4g4g4g4g4O', 'Test User', 'customer');

-- Test meters (11-digit)
INSERT INTO meters (meter_number, customer_id, customer_name, location, credit_balance, status) VALUES
('77012345678', (SELECT id FROM users WHERE email = 'test@stanfliet.co.za'), 'Test User', 'Cape Town, South Africa', 150.50, 'online'),
('77087654321', (SELECT id FROM users WHERE email = 'test@stanfliet.co.za'), 'Test User', 'Johannesburg, South Africa', 75.25, 'offline');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
