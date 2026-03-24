-- ============================================================
--  DATABASE: student_db
--  MySQL Schema — All Tables + Seed Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

-- ============================================================
--  TABLE 1: courses  (master list of programmes)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    department  VARCHAR(100),
    duration    VARCHAR(30),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO courses (code, name, department, duration) VALUES
('BTECH-CS',  'B.Tech - Computer Science',      'Engineering', '4 Years'),
('BTECH-EC',  'B.Tech - Electronics',           'Engineering', '4 Years'),
('BTECH-ME',  'B.Tech - Mechanical',            'Engineering', '4 Years'),
('BSC-DS',    'B.Sc - Data Science',            'Science',     '3 Years'),
('BBA',       'BBA - Business Administration',  'Management',  '3 Years'),
('MBA',       'MBA - General Management',       'Management',  '2 Years'),
('MTECH-AI',  'M.Tech - AI & ML',               'Engineering', '2 Years');


-- ============================================================
--  TABLE 2: students  (personal information)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    application_id  VARCHAR(20)  NOT NULL UNIQUE,
    first_name      VARCHAR(80)  NOT NULL,
    last_name       VARCHAR(80)  NOT NULL,
    date_of_birth   DATE         NOT NULL,
    gender          ENUM('Male','Female','Non-binary','Prefer not to say') NOT NULL,
    nationality     VARCHAR(80)  NOT NULL DEFAULT 'Indian',
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20)  NOT NULL,
    status          ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
--  TABLE 3: academic_details  (course + education background)
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_details (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    student_id          INT NOT NULL,
    course_id           INT NOT NULL,
    enroll_year         YEAR NOT NULL,
    prev_institution    VARCHAR(200),
    prev_grade          VARCHAR(20),
    scholarship         TINYINT(1) DEFAULT 0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)
);


-- ============================================================
--  TABLE 4: addresses  (contact + address details)
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL UNIQUE,
    street      VARCHAR(255) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    pin_code    VARCHAR(15)  NOT NULL,
    country     VARCHAR(80)  NOT NULL DEFAULT 'India',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);


-- ============================================================
--  TABLE 5: emergency_contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    relation    VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
