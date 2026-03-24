/* ── CONFIG ───────────────────────────────────────────── */
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '/api-proxy';   // nginx will proxy /api-proxy → backend in production

/* ── STATE ────────────────────────────────────────────── */
let currentStep = 1;
const TOTAL     = 4;
let coursesData = [];

/* ── INIT ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadCourses();
  updateUI();
});

/* ── LOAD COURSES FROM BACKEND ────────────────────────── */
async function loadCourses() {
  try {
    const res  = await fetch(`${API}/api/courses`);
    const data = await res.json();
    coursesData = data.data || [];
    const sel  = document.getElementById('courseSelect');
    sel.innerHTML = '<option value="">Select programme</option>' +
      coursesData.map(c => `<option value="${c.id}">${c.name} (${c.duration})</option>`).join('');
  } catch {
    document.getElementById('courseSelect').innerHTML =
      '<option value="">⚠ Could not load courses</option>';
  }
}

/* ── NAVIGATION ───────────────────────────────────────── */
function navigate(dir) {
  if (dir === 1 && !validatePanel(currentStep)) return;

  const prev = currentStep;
  currentStep = Math.min(Math.max(currentStep + dir, 1), TOTAL);

  // Update sidebar steps
  const prevItem = document.querySelector(`.step-item[data-step="${prev}"]`);
  if (dir === 1) prevItem?.classList.replace('active','') || prevItem?.classList.add('done');
  if (dir === -1) {
    document.querySelector(`.step-item[data-step="${currentStep}"]`)?.classList.remove('done');
  }

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel${currentStep}`).classList.add('active');

  document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.step-item[data-step="${currentStep}"]`)?.classList.add('active');

  if (dir === 1) prevItem?.classList.add('done');

  if (currentStep === TOTAL) buildReview();
  updateUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateUI() {
  document.getElementById('btnBack').style.display   = currentStep > 1      ? '' : 'none';
  document.getElementById('btnNext').style.display   = currentStep < TOTAL  ? '' : 'none';
  document.getElementById('btnSubmit').style.display = currentStep === TOTAL ? '' : 'none';
  document.getElementById('progressBar').style.width = `${(currentStep / TOTAL) * 100}%`;
}

/* ── VALIDATION ───────────────────────────────────────── */
function validatePanel(step) {
  const panel    = document.getElementById(`panel${step}`);
  const fields   = panel.querySelectorAll('[required]');
  let   isValid  = true;

  fields.forEach(el => {
    const errEl = el.closest('.field')?.querySelector('.err');
    const val   = el.value.trim();
    let   msg   = '';

    if (!val)                                           msg = 'This field is required.';
    else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Invalid email.';
    else if (el.type === 'tel'   && !/^[\d\s\+\-\(\)]{6,}$/.test(val))       msg = 'Invalid phone.';

    if (msg) {
      el.classList.add('err-field');
      if (errEl) errEl.textContent = msg;
      isValid = false;
    } else {
      el.classList.remove('err-field');
      if (errEl) errEl.textContent = '';
    }
  });

  return isValid;
}

// Clear error on input
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', () => {
    if (el.value.trim()) {
      el.classList.remove('err-field');
      const errEl = el.closest('.field')?.querySelector('.err');
      if (errEl) errEl.textContent = '';
    }
  });
});

/* ── BUILD REVIEW ─────────────────────────────────────── */
function buildReview() {
  const f = Object.fromEntries(new FormData(document.getElementById('regForm')));
  const course = coursesData.find(c => String(c.id) === String(f.courseId));

  const sections = [
    {
      title: 'Personal Information',
      items: [
        ['First Name',   f.firstName],  ['Last Name',   f.lastName],
        ['Date of Birth',f.dob],        ['Gender',      f.gender],
        ['Nationality',  f.nationality]
      ]
    },
    {
      title: 'Academic Details',
      items: [
        ['Programme',         course?.name || f.courseId],
        ['Enrollment Year',   f.enrollYear],
        ['Prev. Institution', f.prevInstitution],
        ['Prev. Grade',       f.prevGrade],
        ['Scholarship',       f.scholarship === '1' ? 'Yes' : 'No']
      ]
    },
    {
      title: 'Contact & Address',
      items: [
        ['Email',         f.email],         ['Phone',    f.phone],
        ['Street',        f.street],        ['City',     f.city],
        ['State',         f.state],         ['PIN Code', f.pinCode],
        ['Country',       f.country]
      ]
    },
    {
      title: 'Emergency Contact',
      items: [
        ['Name',     f.emergencyName],
        ['Phone',    f.emergencyPhone],
        ['Relation', f.emergencyRelation || '—']
      ]
    }
  ];

  document.getElementById('reviewCard').innerHTML = sections.map(s => `
    <div class="review-section">
      <h4>${s.title}</h4>
      <div class="review-grid-inner">
        ${s.items.map(([k,v]) => `
          <div class="r-item">
            <strong>${k}</strong>
            <span>${v || '—'}</span>
          </div>`).join('')}
      </div>
    </div>
  `).join('');
}

/* ── SUBMIT ───────────────────────────────────────────── */
document.getElementById('regForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const agreeBox = document.getElementById('agreeBox');
  if (!agreeBox.checked) {
    document.getElementById('agreeErr').textContent = 'You must agree to the terms to continue.';
    return;
  }
  document.getElementById('agreeErr').textContent = '';

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.textContent = 'Submitting...';
  btnSubmit.disabled    = true;

  const f = Object.fromEntries(new FormData(e.target));

  try {
    const res  = await fetch(`${API}/api/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(f)
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Submission failed.');

    document.getElementById('appIdDisplay').textContent = data.applicationId;
    document.getElementById('regForm').style.display     = 'none';
    document.querySelector('.progress-track').style.display = 'none';
    document.getElementById('successScreen').style.display  = 'flex';

  } catch (err) {
    alert('❌ Error: ' + err.message);
    btnSubmit.textContent = 'Submit Application ✓';
    btnSubmit.disabled    = false;
  }
});

/* ── RESET ────────────────────────────────────────────── */
function resetForm() {
  document.getElementById('regForm').reset();
  document.getElementById('regForm').style.display            = 'block';
  document.querySelector('.progress-track').style.display     = 'block';
  document.getElementById('successScreen').style.display      = 'none';
  document.getElementById('btnSubmit').textContent            = 'Submit Application ✓';
  document.getElementById('btnSubmit').disabled               = false;

  currentStep = 1;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel1').classList.add('active');
  document.querySelectorAll('.step-item').forEach(el => { el.classList.remove('active','done'); });
  document.querySelector('.step-item[data-step="1"]').classList.add('active');
  loadCourses();
  updateUI();
}
