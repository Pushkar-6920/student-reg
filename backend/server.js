require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2/promise');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── DB Connection Pool ────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'db',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'student_user',
  password: process.env.DB_PASSWORD || 'student_pass',
  database: process.env.DB_NAME     || 'student_db',
  waitForConnections: true,
  connectionLimit:    10,
});

// Wait for DB to be ready
async function waitForDB(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('✅  MySQL connected!');
      return;
    } catch (e) {
      console.log(`⏳  Waiting for DB... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Could not connect to MySQL after retries.');
}

// ── Health Check ─────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'ERROR', db: 'disconnected' });
  }
});

// ── GET /api/courses ─────────────────────────────────────
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/register ───────────────────────────────────
app.post('/api/register', async (req, res) => {
  const {
    firstName, lastName, dob, gender, nationality, email, phone,
    courseId, enrollYear, prevInstitution, prevGrade, scholarship,
    street, city, state, pinCode, country,
    emergencyName, emergencyPhone, emergencyRelation
  } = req.body;

  // Validate required fields
  const required = { firstName, lastName, dob, gender, email, phone, courseId, enrollYear, street, city, state, pinCode, emergencyName, emergencyPhone };
  const missing  = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}` });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Generate unique Application ID
    const appId = 'EDU-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Insert student
    const [stuResult] = await conn.execute(
      `INSERT INTO students (application_id, first_name, last_name, date_of_birth, gender, nationality, email, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appId, firstName, lastName, dob, gender, nationality || 'Indian', email, phone]
    );
    const studentId = stuResult.insertId;

    // 2. Insert academic details
    await conn.execute(
      `INSERT INTO academic_details (student_id, course_id, enroll_year, prev_institution, prev_grade, scholarship)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, courseId, enrollYear, prevInstitution || null, prevGrade || null, scholarship ? 1 : 0]
    );

    // 3. Insert address
    await conn.execute(
      `INSERT INTO addresses (student_id, street, city, state, pin_code, country)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, street, city, state, pinCode, country || 'India']
    );

    // 4. Insert emergency contact
    await conn.execute(
      `INSERT INTO emergency_contacts (student_id, name, phone, relation)
       VALUES (?, ?, ?, ?)`,
      [studentId, emergencyName, emergencyPhone, emergencyRelation || null]
    );

    await conn.commit();
    console.log(`✅  Registered: ${appId} — ${firstName} ${lastName}`);
    res.status(201).json({ success: true, applicationId: appId, message: 'Registration successful!' });

  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email already registered.' });
    res.status(500).json({ success: false, message: e.message });
  } finally {
    conn.release();
  }
});

// ── GET /api/registrations ───────────────────────────────
app.get('/api/registrations', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.application_id, s.first_name, s.last_name, s.email, s.phone,
             s.gender, s.status, s.created_at,
             c.name AS course, a.city, a.state
      FROM students s
      LEFT JOIN academic_details ad ON ad.student_id = s.id
      LEFT JOIN courses c           ON c.id = ad.course_id
      LEFT JOIN addresses a         ON a.student_id = s.id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /api/registrations/:id ───────────────────────────
app.get('/api/registrations/:appId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, c.name AS course, c.code AS course_code,
             ad.enroll_year, ad.prev_institution, ad.prev_grade, ad.scholarship,
             a.street, a.city, a.state, a.pin_code, a.country,
             ec.name AS emergency_name, ec.phone AS emergency_phone, ec.relation
      FROM students s
      LEFT JOIN academic_details ad ON ad.student_id = s.id
      LEFT JOIN courses c           ON c.id = ad.course_id
      LEFT JOIN addresses a         ON a.student_id = s.id
      LEFT JOIN emergency_contacts ec ON ec.student_id = s.id
      WHERE s.application_id = ?
    `, [req.params.appId]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Start ─────────────────────────────────────────────────
waitForDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀  Backend running on port ${PORT}`));
}).catch(err => { console.error(err.message); process.exit(1); });
