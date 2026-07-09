CREATE TABLE IF NOT EXISTS tariff_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    utility_id VARCHAR(50) NOT NULL,
    rab DECIMAL(16, 2) NOT NULL,
    depreciation DECIMAL(14, 2) NOT NULL,
    return_on_assets DECIMAL(6, 2) NOT NULL,
    total_volumes_kwh DECIMAL(16, 2) NOT NULL,
    primary_energy_cost DECIMAL(14, 2) NOT NULL,
    o_and_m_cost DECIMAL(14, 2) NOT NULL,
    iprep_cost DECIMAL(14, 2) DEFAULT 0,
    efficiency_factor DECIMAL(5, 4) DEFAULT 1.0,
    inflation_adjustment DECIMAL(6, 4) DEFAULT 1.0,
    tariff_per_kwh DECIMAL(8, 4),
    computation_hash VARCHAR(64),
    nersa_prevention_held BOOLEAN DEFAULT false,
    nersa_prevention_result JSONB DEFAULT '{}',
    status tariff_status DEFAULT 'pending',
    utility_signed_at TIMESTAMP WITH TIME ZONE,
    regulator_signed_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tariff_alerts (
    id BIGSERIAL PRIMARY KEY,
    submission_id VARCHAR(50) REFERENCES tariff_submissions(submission_id),
    check_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
