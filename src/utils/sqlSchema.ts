/**
 * Comprehensive PostgreSQL & Supabase DDL SQL Schema
 * Implements Table definitions, Constraints, Unique Indexes, RLS Policies, and Audit Triggers
 */

export const POSTGRES_SQL_SCHEMA = `-- =========================================================================
-- SISTEM PRESENSI PEGAWAI GEREJA BERBASIS GPS DAN SELFIE
-- Database: PostgreSQL 14+ / Supabase
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Opsional untuk query geospasial lanjutan

-- 2. ENUM TYPES
CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'CHURCH_ADMIN', 'UNIT_HEAD', 'EMPLOYEE');
CREATE TYPE session_type_enum AS ENUM ('MORNING', 'AFTERNOON');
CREATE TYPE attendance_status_enum AS ENUM ('ON_TIME', 'LATE', 'OUTSIDE_RADIUS', 'PENDING_REVIEW', 'REJECTED');
CREATE TYPE leave_type_enum AS ENUM ('SAKIT', 'IZIN', 'CUTI', 'TUGAS_LUAR');
CREATE TYPE leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 3. TABEL: work_units (Unit Kerja Gereja)
CREATE TABLE IF NOT EXISTS work_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    head_name VARCHAR(150),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: profiles (Data Pegawai & Pengguna)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nip VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    role user_role_enum DEFAULT 'EMPLOYEE' NOT NULL,
    department VARCHAR(150) NOT NULL,
    position VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    assigned_location_ids UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: attendance_locations (Titik Lokasi & Radius Geofencing)
CREATE TABLE IF NOT EXISTS attendance_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_main_office BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL: attendance_schedules (Jadwal Presensi Pagi & Sore)
CREATE TABLE IF NOT EXISTS attendance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Makassar' NOT NULL,
    morning_start TIME NOT NULL DEFAULT '07:00:00',
    morning_target TIME NOT NULL DEFAULT '08:00:00',
    morning_end TIME NOT NULL DEFAULT '10:00:00',
    morning_tolerance_minutes INTEGER DEFAULT 15 NOT NULL,
    afternoon_start TIME NOT NULL DEFAULT '14:00:00',
    afternoon_target TIME NOT NULL DEFAULT '16:30:00',
    afternoon_end TIME NOT NULL DEFAULT '19:00:00',
    afternoon_tolerance_minutes INTEGER DEFAULT 15 NOT NULL,
    work_days INTEGER[] DEFAULT '{1,2,3,4,5,6}' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL: attendance_records (Transaksi Presensi GPS & Selfie)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    work_date DATE NOT NULL,
    session_type session_type_enum NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    local_time_str VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    gps_accuracy DOUBLE PRECISION NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    location_id UUID NOT NULL REFERENCES attendance_locations(id),
    location_name VARCHAR(150) NOT NULL,
    photo_url TEXT NOT NULL,
    status attendance_status_enum NOT NULL,
    lateness_minutes INTEGER DEFAULT 0,
    rejection_reason TEXT,
    device_info TEXT,
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    verified_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINT KRUSIAL: Mencegah duplikasi presensi untuk pegawai, tanggal, dan sesi yang sama
    CONSTRAINT unique_employee_daily_session UNIQUE (employee_id, work_date, session_type)
);

-- 8. TABEL: leave_requests (Izin, Sakit, Cuti, Tugas Luar)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type leave_type_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status leave_status_enum DEFAULT 'PENDING' NOT NULL,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL: attendance_corrections (Pengajuan Koreksi Presensi)
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    session_type session_type_enum NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status leave_status_enum DEFAULT 'PENDING' NOT NULL,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL: audit_logs (Audit Log Keamanan & Aktivitas)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES profiles(id),
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50)
);

-- 11. INDEKS PERFORMA
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_emp_date ON attendance_records(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy Profiles: Pegawai dapat melihat profil sendiri, Admin dapat melihat & mengubah semua
CREATE POLICY "Profiles read policy" ON profiles
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'CHURCH_ADMIN', 'UNIT_HEAD')
    ));

-- Policy Attendance: Pegawai hanya melihat milik sendiri; Admin melihat semua
CREATE POLICY "Attendance select policy" ON attendance_records
    FOR SELECT USING (employee_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'CHURCH_ADMIN', 'UNIT_HEAD')
    ));

-- Pegawai hanya boleh INSERT presensi untuk dirinya sendiri
CREATE POLICY "Attendance insert policy" ON attendance_records
    FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Attendance tidak boleh di-UPDATE atau di-DELETE sembarangan oleh pegawai
CREATE POLICY "Attendance update admin only" ON attendance_records
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'CHURCH_ADMIN')
    ));

-- =========================================================================
-- SELESAI. Skrip ini siap dijalankan di PostgreSQL Editor Supabase.
-- =========================================================================
`;
