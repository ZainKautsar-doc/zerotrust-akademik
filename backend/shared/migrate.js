// global fetch is native in Node.js 18+
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MANAGEMENT_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || '';

const ddl = `
-- Drop existing tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'dosen', 'mahasiswa', 'service')),
    nim_or_nip VARCHAR(30) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices (Zero Trust Device Context)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Tokens (Revocable)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_mk VARCHAR(20) NOT NULL,
    nama_mk VARCHAR(100) NOT NULL,
    dosen_id UUID NOT NULL REFERENCES users(id),
    sks INT NOT NULL DEFAULT 3,
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES users(id),
    nilai_tugas NUMERIC(5,2) DEFAULT 0,
    nilai_uts NUMERIC(5,2) DEFAULT 0,
    nilai_uas NUMERIC(5,2) DEFAULT 0,
    nilai_akhir NUMERIC(5,2) DEFAULT 0,
    grade_letter VARCHAR(2) DEFAULT 'E',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_mahasiswa UNIQUE (class_id, mahasiswa_id)
);

-- Transcripts
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_id UUID NOT NULL REFERENCES users(id),
    kode_mk VARCHAR(20) NOT NULL,
    nama_mk VARCHAR(100) NOT NULL,
    sks INT NOT NULL,
    grade_letter VARCHAR(2) NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_transcript_mk UNIQUE (mahasiswa_id, kode_mk)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    subject VARCHAR(100) NOT NULL,
    role VARCHAR(30),
    endpoint VARCHAR(150) NOT NULL,
    method VARCHAR(10) NOT NULL,
    device_id VARCHAR(100),
    decision VARCHAR(10) NOT NULL CHECK (decision IN ('ALLOW', 'DENY')),
    reason TEXT NOT NULL,
    ip_address VARCHAR(50)
);

-- Seed Data (Password default: 'password123' bcrypt hash)
-- bcrypt: $2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.
INSERT INTO users (id, username, password_hash, full_name, role, nim_or_nip) VALUES
('10000000-0000-0000-0000-000000000001', 'admin_utama', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Administrator Akademik', 'admin', 'ADM001'),
('20000000-0000-0000-0000-000000000001', 'dosen_budi', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Dr. Budi Santoso, M.T.', 'dosen', '198001012005011001'),
('20000000-0000-0000-0000-000000000002', 'dosen_ani', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Ani Rahmawati, M.Kom.', 'dosen', '198502022008042002'),
('30000000-0000-0000-0000-000000000001', 'mhs_andi', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Andi Pratama', 'mahasiswa', '2207001'),
('30000000-0000-0000-0000-000000000002', 'mhs_bima', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Bima Satria', 'mahasiswa', '2207002'),
('30000000-0000-0000-0000-000000000003', 'mhs_citra', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Citra Lestari', 'mahasiswa', '2207003'),
('30000000-0000-0000-0000-000000000004', 'mhs_dimas', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Dimas Wahyu Prasetyo', 'mahasiswa', '2207004'),
('30000000-0000-0000-0000-000000000005', 'mhs_eka', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Eka Putri Handayani', 'mahasiswa', '2207005'),
('30000000-0000-0000-0000-000000000006', 'mhs_fajar', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Fajar Nugraha', 'mahasiswa', '2207006'),
('30000000-0000-0000-0000-000000000007', 'mhs_gita', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Gita Ayu Saraswati', 'mahasiswa', '2207007'),
('30000000-0000-0000-0000-000000000008', 'mhs_hadi', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Hadi Kusuma', 'mahasiswa', '2207008'),
('30000000-0000-0000-0000-000000000009', 'mhs_indah', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Indah Permatasari', 'mahasiswa', '2207009'),
('30000000-0000-0000-0000-000000000010', 'mhs_joko', '$2a$10$7v1b1lKkYwI5E17M2L6W9.nO4VvjQ8V7aC4rKkM0wP3T5a1a1a1a.', 'Joko Tri Pamungkas', 'mahasiswa', '2207010');

-- Devices
INSERT INTO devices (user_id, device_id, device_name) VALUES
('10000000-0000-0000-0000-000000000001', 'DEV-ADMIN-01', 'Laptop Admin Asus Zenbook'),
('20000000-0000-0000-0000-000000000001', 'DEV-DOSEN-BUDI', 'MacBook Air Dosen Budi'),
('20000000-0000-0000-0000-000000000002', 'DEV-DOSEN-ANI', 'ThinkPad Dosen Ani'),
('30000000-0000-0000-0000-000000000001', 'DEV-MHS-ANDI', 'Smartphone Andi Galaxy'),
('30000000-0000-0000-0000-000000000002', 'DEV-MHS-BIMA', 'Laptop Acer Bima'),
('30000000-0000-0000-0000-000000000003', 'DEV-MHS-CITRA', 'iPad Air Citra'),
('30000000-0000-0000-0000-000000000004', 'DEV-MHS-DIMAS', 'Laptop Lenovo Dimas'),
('30000000-0000-0000-0000-000000000005', 'DEV-MHS-EKA', 'MacBook Air Eka'),
('30000000-0000-0000-0000-000000000006', 'DEV-MHS-FAJAR', 'HP Pavilion Fajar'),
('30000000-0000-0000-0000-000000000007', 'DEV-MHS-GITA', 'iPad Pro Gita'),
('30000000-0000-0000-0000-000000000008', 'DEV-MHS-HADI', 'Dell Inspiron Hadi'),
('30000000-0000-0000-0000-000000000009', 'DEV-MHS-INDAH', 'Xiaomi Redmi Indah'),
('30000000-0000-0000-0000-000000000010', 'DEV-MHS-JOKO', 'Asus Vivobook Joko');

-- Classes
INSERT INTO classes (id, kode_mk, nama_mk, dosen_id, sks, is_finalized) VALUES
('40000000-0000-0000-0000-000000000001', 'KP70065004', 'Keamanan Informasi', '20000000-0000-0000-0000-000000000001', 3, FALSE),
('40000000-0000-0000-0000-000000000002', 'IF40023002', 'Jaringan Komputer Lanjut', '20000000-0000-0000-0000-000000000002', 3, FALSE);

-- Grades
INSERT INTO grades (class_id, mahasiswa_id, nilai_tugas, nilai_uts, nilai_uas, nilai_akhir, grade_letter) VALUES
-- Kelas Keamanan Informasi (Dosen Budi)
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 85, 80, 90, 85.5, 'A'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 75, 70, 80, 75.0, 'B'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 90, 85, 95, 90.0, 'A'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 78, 82, 80, 80.0, 'A'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 88, 90, 86, 88.0, 'A'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 70, 68, 75, 71.4, 'B'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007', 92, 94, 91, 92.2, 'A'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000008', 65, 70, 68, 67.7, 'C'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000009', 84, 86, 88, 86.2, 'A'),
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000010', 74, 76, 78, 76.2, 'B'),
-- Kelas Jaringan Komputer Lanjut (Dosen Ani)
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 80, 75, 85, 80.0, 'A'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 65, 70, 70, 68.5, 'B'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 85, 80, 88, 84.7, 'A'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 78, 82, 80, 80.0, 'A'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000007', 90, 88, 92, 90.2, 'A');
`;

async function runMigration() {
  console.log('Sending DDL & Seed SQL to Supabase Management API...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: ddl })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Migration failed:', res.status, text);
    process.exit(1);
  }

  const result = await res.json();
  console.log('Migration successfully completed!');
  console.log('Result:', result);
}

runMigration().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
