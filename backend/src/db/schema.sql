CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile_picture_url VARCHAR(255),
    cell_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    date_of_birth DATE,
    education VARCHAR(100),
    cnic VARCHAR(20) UNIQUE,
    religion VARCHAR(50),
    father_name VARCHAR(255),
    father_cell_number VARCHAR(20),
    father_whatsapp_number VARCHAR(20),
    father_cnic VARCHAR(20),
    father_occupation VARCHAR(100),
    address TEXT,
    lead_source VARCHAR(50) CHECK (lead_source IN ('Sign Board', 'Social Media', 'Friends', 'Teacher', 'Other')),

    gr_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    thumbnail_url VARCHAR(255),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    gateway VARCHAR(100) NOT NULL,
    gateway_ref VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS section_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(255),
    position INTEGER NOT NULL,
    duration_sec INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES section_lectures(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (student_id, lecture_id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    certificate_url VARCHAR(255),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_course ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_course ON section_lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_lecture ON progress(lecture_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lectures_course_position
ON section_lectures(course_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cert_student_course
ON certificates(student_id, course_id);


ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS board_registration VARCHAR(50) CHECK (board_registration IN ('SDC', 'SBTE', 'None')),
ADD COLUMN IF NOT EXISTS batch_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_timing VARCHAR(100),
ADD COLUMN IF NOT EXISTS admission_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS lumpsum_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS slip_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS remarks TEXT;