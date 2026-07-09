-- Seed admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@stanfliet-ota.com', '', 'System', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed sample meters
INSERT INTO meters (meter_serial, meter_type, status, latitude, longitude, customer_name)
VALUES
  ('SM-2026-0001', 'single_phase', 'online', -26.2041, 28.0473, 'John Dube'),
  ('SM-2026-0002', 'single_phase', 'online', -26.1076, 28.0567, 'Mary Molefe'),
  ('SM-2026-0003', 'three_phase', 'online', -26.1923, 28.0324, 'Peter Nkosi'),
  ('SM-2026-0004', 'single_phase', 'warning', -26.2345, 28.1123, 'Sarah Botha'),
  ('SM-2026-0005', 'three_phase_industrial', 'online', -26.1512, 28.0891, 'Eskom Industrial Park')
ON CONFLICT (meter_serial) DO NOTHING;

-- Seed sample tariff submissions
INSERT INTO tariff_submissions (submission_id, utility_id, rab, depreciation, return_on_assets, total_volumes_kwh, primary_energy_cost, o_and_m_cost, tariff_per_kwh, status)
VALUES
  ('TARIFF-2025-001', 'ESKOM', 352000000000, 18500000000, 6.82, 220000000000, 43500000000, 27000000000, 2.1437, 'finalized'),
  ('TARIFF-2026-001', 'ESKOM', 362000000000, 19100000000, 6.82, 220000000000, 45000000000, 28000000000, 2.2154, 'pending')
ON CONFLICT (submission_id) DO NOTHING;
