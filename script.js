// ═══════════════════════════════════════════════════════════
// CareerMatch AI — Main JavaScript
// ═══════════════════════════════════════════════════════════

// ── SESSION HELPER FUNCTIONS ──
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

// Get clean page name
const path = window.location.pathname.split('/').pop().toLowerCase();
const pageName = path || 'index.html';

// ── ROUTE GUARDS ──
const user = getCurrentUser();
const protectedPages = [
  'dashboard.html',
  'resume-upload.html',
  'ats-score.html',
  'jobs.html',
  'skill-gap.html',
  'admin.html',
  'resume-templates.html'
];

if (!user && protectedPages.includes(pageName)) {
  window.location.href = 'auth.html';
}

if (user && pageName === 'auth.html') {
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'dashboard.html';
  }
}

if (user && pageName === 'admin.html' && user.role !== 'admin') {
  window.location.href = 'dashboard.html';
}

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── HAMBURGER MENU ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
}

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (navLinks) navLinks.classList.remove('open');
    }
  });
});

// ── FAQ TOGGLE ──
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const isOpen = btn.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-question.open').forEach(q => {
    q.classList.remove('open');
    q.closest('.faq-item').querySelector('.faq-answer').classList.remove('open');
  });
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}

// ── CONTACT FORM ──
function handleContact(e) {
  e.preventDefault();
  showToast('✅ Message sent! We will get back to you within 24 hours.');
  e.target.reset();
}

// ── TOAST NOTIFICATION ──
function showToast(msg, duration = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ── SCROLL ANIMATIONS ──
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .why-card, .testimonial-card, .step-item, .stat-card, .job-card, .timeline-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── ANIMATED COUNTER ──
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current) + suffix;
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// ── PROGRESS BAR ANIMATION ──
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.progress-bar-fill, .rp-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => { bar.style.width = width; }, 100);
      });
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.rp-bars, .progress-section').forEach(el => progressObserver.observe(el));

// ── DYNAMIC NAVBAR RENDERER ──
function renderNavbar() {
  const navLinksEl = document.getElementById('navLinks');
  const navActionsEl = document.querySelector('.nav-actions');
  const user = getCurrentUser();

  if (!navLinksEl) return;

  if (user) {
    let adminLink = '';
    if (user.role === 'admin') {
      adminLink = `<li><a href="admin.html" class="nav-link ${pageName === 'admin.html' ? 'active' : ''}">Admin Panel</a></li>`;
    }
    navLinksEl.innerHTML = `
      <li><a href="index.html" class="nav-link ${pageName === 'index.html' ? 'active' : ''}">Home</a></li>
      <li><a href="dashboard.html" class="nav-link ${pageName === 'dashboard.html' ? 'active' : ''}">Dashboard</a></li>
      <li><a href="resume-upload.html" class="nav-link ${pageName === 'resume-upload.html' ? 'active' : ''}">Upload Resume</a></li>
      <li><a href="resume-templates.html" class="nav-link ${pageName === 'resume-templates.html' ? 'active' : ''}">Templates</a></li>
      <li><a href="jobs.html" class="nav-link ${pageName === 'jobs.html' ? 'active' : ''}">Jobs</a></li>
      <li><a href="skill-gap.html" class="nav-link ${pageName === 'skill-gap.html' ? 'active' : ''}">Skill Gap</a></li>
      ${adminLink}
    `;

    if (navActionsEl) {
      navActionsEl.innerHTML = `
        <span class="user-greeting" style="font-size:13px; font-weight:600; color:var(--text-secondary); margin-right:12px">Hi, ${user.fullName.split(' ')[0]}</span>
        <button class="btn-ghost" id="btnLogout" style="padding: 7px 14px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: 'Plus Jakarta Sans';">Logout</button>
      `;
      document.getElementById('btnLogout').addEventListener('click', async (e) => {
        e.preventDefault();
        // AUTH SYSTEM ADDED: Call backend logout API
        try {
          await fetch('http://127.0.0.1:5000/api/logout', { method: 'POST' });
        } catch (err) {
          console.error('Logout API failed:', err);
        }
        localStorage.removeItem('currentUser');
        showToast('👋 Logged out successfully!');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      });
    }
  } else {
    navLinksEl.innerHTML = `
      <li><a href="index.html" class="nav-link ${pageName === 'index.html' ? 'active' : ''}">Home</a></li>
      <li><a href="index.html#features" class="nav-link">Features</a></li>
      <li><a href="resume-upload.html" class="nav-link">Upload Resume</a></li>
      <li><a href="jobs.html" class="nav-link">Jobs</a></li>
    `;

    if (navActionsEl) {
      navActionsEl.innerHTML = `
        <a href="auth.html" class="btn-ghost">Login</a>
        <a href="auth.html" class="btn-primary-sm">Get Started</a>
      `;
    }
  }
}

// ── RESUME UPLOAD DRAG & DROP ──
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  if (!zone || !fileInput) return;

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  });
  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
  });
}

async function handleFileUpload(file) {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
    showToast('❌ Please upload a PDF or DOCX file only.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('❌ File size must be under 5MB.');
    return;
  }
  
  const user = getCurrentUser();
  if (!user) {
    showToast('⚠️ Please log in to parse your resume.');
    setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
    return;
  }

  // Show progress section
  const zone = document.getElementById('uploadZone');
  const progressSection = document.getElementById('uploadProgress');
  const fileName = document.getElementById('uploadFileName');
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');

  if (zone) zone.style.display = 'none';
  if (progressSection) progressSection.style.display = 'block';
  if (fileName) fileName.textContent = file.name;

  // Animate progress steps and progress bar smoothly up to 90% while uploading
  let pct = 0;
  const timer = setInterval(() => {
    if (pct < 90) {
      pct += Math.random() * 8;
      if (pct > 90) pct = 90;
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressPct) progressPct.textContent = Math.floor(pct) + '%';
      
      // Update step active classes as progress increases
      if (pct > 75) {
        document.getElementById('step4').classList.add('active');
        document.getElementById('step3').classList.add('done');
      } else if (pct > 50) {
        document.getElementById('step3').classList.add('active');
        document.getElementById('step2').classList.add('done');
      } else if (pct > 25) {
        document.getElementById('step2').classList.add('active');
        document.getElementById('step1').classList.add('done');
      }
    }
  }, 100);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', user.id);

  try {
    const res = await fetch('http://127.0.0.1:5000/api/upload-resume', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    
    clearInterval(timer);
    
    if (res.ok && data.success) {
      if (progressFill) progressFill.style.width = '100%';
      if (progressPct) progressPct.textContent = '100%';
      
      document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.add('done');
        step.classList.remove('active');
      });
      
      setTimeout(() => {
        showToast('✅ Resume parsed and analyzed successfully!');
        renderUploadResults(data);
      }, 500);
    } else {
      showToast('❌ Parsing failed: ' + (data.error || 'Unknown error'));
      resetUpload();
    }
  } catch (err) {
    clearInterval(timer);
    console.error(err);
    showToast('❌ Server error during resume parsing.');
    resetUpload();
  }
}

function resetUpload() {
  const zone = document.getElementById('uploadZone');
  const progressSection = document.getElementById('uploadProgress');
  const resultsSection = document.getElementById('analysisResults');
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');

  if (zone) zone.style.display = 'block';
  if (progressSection) progressSection.style.display = 'none';
  if (resultsSection) resultsSection.style.display = 'none';
  if (progressFill) progressFill.style.width = '0%';
  if (progressPct) progressPct.textContent = '0%';
  
  document.querySelectorAll('.progress-step').forEach((step, idx) => {
    step.classList.remove('done');
    step.classList.remove('active');
    if (idx === 0) step.classList.add('active');
  });
}

function renderUploadResults(data) {
  const resultsSection = document.getElementById('analysisResults');
  if (!resultsSection) return;
  
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });
  
  const scoreNum = resultsSection.querySelector('.ats-big-num');
  if (scoreNum) scoreNum.textContent = data.atsScore;
  
  const circle = resultsSection.querySelector('.ats-circle-wrap circle:nth-child(2)');
  if (circle) {
    const circumference = 251.3;
    circle.style.strokeDashoffset = circumference - (data.atsScore / 100) * circumference;
  }
  
  const bars = resultsSection.querySelectorAll('.ats-breakdown .ats-mini-fill');
  const scores = resultsSection.querySelectorAll('.ats-breakdown .ats-row span:last-child');
  const keys = ['keywords', 'format', 'content', 'verbs', 'metrics'];
  
  if (bars.length >= 5) {
    keys.forEach((key, idx) => {
      const score = data.breakdown[key] || 0;
      bars[idx].style.width = `${score}%`;
      scores[idx].textContent = score;
      if (score < 50) scores[idx].style.color = 'var(--accent-red)';
      else if (score < 80) scores[idx].style.color = 'var(--accent-amber)';
      else scores[idx].style.color = 'var(--accent-green)';
    });
  }
  
  const skillsContainer = resultsSection.querySelector('.extracted-skills');
  if (skillsContainer) {
    skillsContainer.innerHTML = '';
    data.skills.forEach((skill, idx) => {
      let cls = 'medium';
      if (idx < 4) cls = 'strong';
      else if (idx >= 8) cls = 'weak';
      skillsContainer.innerHTML += `<span class="skill-tag ${cls}">${skill}</span>`;
    });
    
    const strongCount = data.skills.slice(0, 4).length;
    const mediumCount = data.skills.length > 4 ? data.skills.slice(4, 8).length : 0;
    const weakCount = data.skills.length > 8 ? data.skills.slice(8).length : 0;
    
    const legend = resultsSection.querySelector('.extracted-skills + div');
    if (legend) {
      legend.innerHTML = `
        <span style="color:var(--accent-green)">● Strong (${strongCount})</span>
        <span style="color:var(--accent-violet)">● Medium (${mediumCount})</span>
        <span style="color:var(--accent-amber)">● Needs Work (${weakCount})</span>
      `;
    }
  }
  
  const sugList = resultsSection.querySelector('.suggestions-list');
  if (sugList) {
    sugList.innerHTML = '';
    data.suggestions.forEach(sug => {
      const icon = sug.type === 'error' ? '✗' : sug.type === 'warning' ? '!' : '✓';
      sugList.innerHTML += `
        <div class="suggestion-item ${sug.type}">
          <div class="suggestion-icon">${icon}</div>
          <div class="suggestion-text">${sug.text}</div>
        </div>
      `;
    });
  }
}

// ── SALARY RANGE SLIDER ──
function initRangeSlider() {
  const slider = document.getElementById('salaryRange');
  const display = document.getElementById('salaryDisplay');
  if (!slider || !display) return;
  slider.addEventListener('input', () => {
    display.textContent = '₹' + (slider.value / 100000).toFixed(1) + 'L';
  });
}

// ── CIRCULAR PROGRESS ANIMATION ──
function animateCircularProgress(svgId, targetPct) {
  const circle = document.getElementById(svgId);
  if (!circle) return;
  const r = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * r;
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;
  let current = 0;
  const timer = setInterval(() => {
    current += 1;
    if (current > targetPct) { clearInterval(timer); return; }
    const offset = circumference - (current / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }, 20);
}

// ── JOB ALERT TOGGLE ──
function toggleJobAlert(toggle) {
  const label = toggle.nextElementSibling;
  if (toggle.checked) {
    showToast('🔔 Job alerts enabled! You will receive email notifications for new matches.');
    if (label) label.textContent = 'Alerts On';
  } else {
    showToast('🔕 Job alerts disabled.');
    if (label) label.textContent = 'Enable Alerts';
  }
}

// ── INTERVIEW QUESTION GENERATOR ──
const interviewData = {
  java: {
    technical: [
      'What is Object-Oriented Programming? Explain its four pillars.',
      'What is the difference between JDK, JRE, and JVM?',
      'Explain the concept of inheritance in Java with an example.',
      'What is the difference between ArrayList and LinkedList?',
      'What is a REST API? How do you create one in Spring Boot?',
      'Explain JDBC and how it connects Java to a database.'
    ],
    hr: [
      'Tell me about yourself and your background.',
      'Why should we hire you for this Java Developer position?',
      'Describe a challenging project you worked on and how you solved it.',
      'Where do you see yourself in 5 years?',
      'Describe your experience working in a team environment.'
    ]
  },
  python: {
    technical: [
      'What are Python decorators and how do they work?',
      'Explain the difference between list, tuple, and dictionary.',
      'What is the difference between Django and Flask?',
      'Explain Python generators and their use cases.',
      'How does Python handle memory management?',
      'Explain REST API development using Django REST Framework.'
    ],
    hr: [
      'Tell me about yourself and your Python experience.',
      'Why do you prefer Python over other programming languages?',
      'Describe a Python project you are most proud of.',
      'How do you stay updated with the latest Python developments?',
      'How do you handle code reviews and feedback?'
    ]
  },
  web: {
    technical: [
      'What is the difference between HTML, CSS, and JavaScript?',
      'Explain the CSS Box Model.',
      'What is React and what problem does it solve?',
      'What are React hooks? Explain useState and useEffect.',
      'What is responsive web design and how do you implement it?',
      'What is the difference between localStorage and sessionStorage?'
    ],
    hr: [
      'Tell me about your web development experience.',
      'Show me a project you built and explain your design decisions.',
      'How do you ensure cross-browser compatibility?',
      'How do you optimize website performance?',
      'How do you approach UI/UX design in your projects?'
    ]
  }
};

function generateInterviewQuestions(role) {
  const data = interviewData[role] || interviewData.java;
  const techList = document.getElementById('techQuestions');
  const hrList = document.getElementById('hrQuestions');
  if (!techList || !hrList) return;

  techList.innerHTML = data.technical.map((q, i) =>
    `<div class="interview-q">
      <div class="q-num">${i + 1}</div>
      <div class="q-text">${q}</div>
      <button class="q-practice-btn" onclick="markPracticed(this)">Mark Practiced</button>
    </div>`
  ).join('');

  hrList.innerHTML = data.hr.map((q, i) =>
    `<div class="interview-q">
      <div class="q-num">${i + 1}</div>
      <div class="q-text">${q}</div>
      <button class="q-practice-btn" onclick="markPracticed(this)">Mark Practiced</button>
    </div>`
  ).join('');

  showToast('✅ Interview questions generated for ' + role.charAt(0).toUpperCase() + role.slice(1) + ' Developer!');
}

function markPracticed(btn) {
  const q = btn.closest('.interview-q');
  q.classList.toggle('practiced');
  btn.textContent = q.classList.contains('practiced') ? '✓ Practiced' : 'Mark Practiced';
}

// ── CHART DRAWING HELPERS ──
function drawSkillChartDynamic(skills) {
  const canvas = document.getElementById('skillChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 20;

  const n = skills.length;
  if (n === 0) return;
  const angleStep = (2 * Math.PI) / n;

  // Draw grid
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + (r * level / 5) * Math.cos(angle);
      const y = cy + (r * level / 5) * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(108,99,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw axes
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = 'rgba(108,99,255,0.2)';
    ctx.stroke();

    // Labels
    const lx = cx + (r + 14) * Math.cos(angle);
    const ly = cy + (r + 14) * Math.sin(angle);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(skills[i].label, lx, ly);
  }

  // Draw data polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + r * skills[i].value * Math.cos(angle);
    const y = cy + r * skills[i].value * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, 'rgba(108,99,255,0.4)');
  grad.addColorStop(1, 'rgba(0,212,255,0.4)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#6C63FF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + r * skills[i].value * Math.cos(angle);
    const y = cy + r * skills[i].value * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#00D4FF';
    ctx.fill();
  }
}

function drawDonutChartDynamic(canvasId, data, totalJobs) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 20;
  const innerR = r * 0.6;
  let startAngle = -Math.PI / 2;
  const total = data.reduce((s, d) => s + d.value, 0);

  data.forEach(item => {
    const slice = total > 0 ? (item.value / total) * 2 * Math.PI : 0;
    if (slice === 0) return;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    startAngle += slice;
  });

  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#050816';
  ctx.fill();

  ctx.fillStyle = '#F0F0FF';
  ctx.font = 'bold 18px Syne';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(totalJobs.toString(), cx, cy - 8);
  ctx.fillStyle = '#64748B';
  ctx.font = '11px Plus Jakarta Sans';
  ctx.fillText('Matches', cx, cy + 12);
}

function drawBarChartDynamic(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const w = canvas.width, h = canvas.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxVal = Math.max(...values, 5);
  const barW = (chartW / labels.length) * 0.6;
  const gap = (chartW / labels.length) * 0.4;

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Plus Jakarta Sans';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padding.left - 6, y + 4);
  }

  // Bars
  labels.forEach((label, i) => {
    const x = padding.left + i * (barW + gap) + gap / 2;
    const barH = (values[i] / maxVal) * chartH;
    const y = padding.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, colors[i] || '#6C63FF');
    grad.addColorStop(1, 'rgba(108,99,255,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barW / 2, h - padding.bottom + 16);
  });
}

// Helper to categorize jobs based on properties
function getJobCategory(job) {
  const title = job.title.toLowerCase();
  const skills = (job.requiredSkills || []).map(s => s.toLowerCase());
  
  if (title.includes('java') || skills.includes('java') || skills.includes('spring boot')) {
    return 'java';
  } else if (title.includes('python') || skills.includes('python') || skills.includes('flask') || skills.includes('django')) {
    return 'python';
  } else if (title.includes('data') || skills.includes('data analysis') || skills.includes('power bi') || skills.includes('excel')) {
    return 'data';
  } else if (title.includes('full stack') || title.includes('fullstack') || (skills.includes('react') && (skills.includes('node.js') || skills.includes('express.js') || skills.includes('spring boot')))) {
    return 'fullstack';
  } else if (title.includes('web') || title.includes('frontend') || skills.includes('html') || skills.includes('css') || skills.includes('javascript') || skills.includes('react') || skills.includes('angular')) {
    return 'web';
  }
  return 'java';
}

function getCategoryColor(cat) {
  switch (cat) {
    case 'java': return 'linear-gradient(135deg,#6C63FF,#00D4FF)';
    case 'python': return 'linear-gradient(135deg,#F59E0B,#EF4444)';
    case 'web': return 'linear-gradient(135deg,#34D399,#0EA5E9)';
    case 'data': return 'linear-gradient(135deg,#A78BFA,#6C63FF)';
    case 'fullstack': return 'linear-gradient(135deg,#0EA5E9,#6C63FF)';
    default: return 'linear-gradient(135deg,#6C63FF,#00D4FF)';
  }
}

// ── SIDEBAR ACTIVE STATE ──
function initSidebar() {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ── PAGE SPECIFIC INITIALIZERS ──

// 1. Dashboard Page
async function initDashboardPage() {
  const user = getCurrentUser();
  if (!user) return;
  
  const welcomeEl = document.querySelector('.topbar-left h1');
  if (welcomeEl) {
    welcomeEl.innerHTML = `Welcome back, <span class="gradient-text">${user.fullName.split(' ')[0]}</span> 👋`;
  }
  
  const avatarEl = document.querySelector('.user-avatar');
  if (avatarEl) {
    const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    avatarEl.textContent = initials;
  }
  
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('href') === 'admin.html' && user.role !== 'admin') {
      link.style.display = 'none';
    }
  });

  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav && !document.getElementById('btnSidebarLogout')) {
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.background = 'var(--border)';
    divider.style.margin = '12px 0';
    sidebarNav.appendChild(divider);

    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.className = 'sidebar-link';
    logoutLink.id = 'btnSidebarLogout';
    logoutLink.style.color = 'var(--accent-red)';
    logoutLink.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout`;
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      // AUTH SYSTEM ADDED: Call backend logout API
      try {
        await fetch('http://127.0.0.1:5000/api/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout API failed:', err);
      }
      localStorage.removeItem('currentUser');
      showToast('👋 Logged out successfully!');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    });
    sidebarNav.appendChild(logoutLink);
  }

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/dashboard/${user.id}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    const data = await res.json();
    
    if (!data.stats.hasResume) {
      const statsGrid = document.querySelector('.stats-grid');
      if (statsGrid && !document.querySelector('.banner-no-resume')) {
        const banner = document.createElement('div');
        banner.className = 'banner-no-resume';
        banner.style.cssText = 'background: linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(0, 212, 255, 0.08)); border: 1px solid rgba(108, 99, 255, 0.2); border-radius: var(--radius-xl); padding: 32px; text-align: center; margin-bottom: 24px; backdrop-filter: blur(10px); animation: fadeInUp 0.5s ease;';
        banner.innerHTML = `
          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">🚀 Welcome to CareerMatch AI!</h2>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px; max-width: 550px; margin-left: auto; margin-right: auto; line-height: 1.6;">You haven't uploaded a resume yet. Upload your PDF or DOCX resume to get your real ATS score compatibility report, personalized learning roadmaps, and custom interview questions!</p>
          <a href="resume-upload.html" class="btn-primary" style="display: inline-flex; text-decoration: none; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Resume Now
          </a>
        `;
        statsGrid.parentNode.insertBefore(banner, statsGrid);
      }
    }
    
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
      statCards[0].querySelector('.sc-num').innerHTML = `${data.stats.atsScore}<span style="font-size:16px">/100</span>`;
      statCards[0].querySelector('.sc-trend').textContent = data.stats.hasResume ? `Score` : `N/A`;
      
      statCards[1].querySelector('.sc-num').textContent = data.stats.totalJobs;
      statCards[1].querySelector('.sc-trend').textContent = `Total`;
      
      statCards[2].querySelector('.sc-num').textContent = `${data.stats.bestMatch}%`;
      statCards[2].querySelector('.sc-trend').textContent = data.stats.hasResume ? `Match` : `N/A`;
      
      statCards[3].querySelector('.sc-num').textContent = data.stats.missingSkillsCount;
      statCards[3].querySelector('.sc-trend').textContent = data.stats.hasResume ? `Gaps` : `N/A`;
    }
    
    drawSkillChartDynamic(data.radarSkills);
    
    const categoriesCount = {};
    data.recentJobs.forEach(job => {
      const category = getJobCategory(job);
      categoriesCount[category] = (categoriesCount[category] || 0) + 1;
    });
    
    const donutData = [
      { label: 'Backend', value: categoriesCount['java'] || 1, color: '#6C63FF' },
      { label: 'Frontend', value: categoriesCount['web'] || 1, color: '#00D4FF' },
      { label: 'Full Stack', value: categoriesCount['fullstack'] || 1, color: '#34D399' },
      { label: 'Data Science', value: categoriesCount['data'] || 1, color: '#F59E0B' }
    ];
    drawDonutChartDynamic('categoryChart', donutData, data.stats.totalJobs);
    
    const strengthBars = document.querySelectorAll('.chart-card:nth-child(3) .progress-bar-fill');
    const strengthLabels = document.querySelectorAll('.chart-card:nth-child(3) span:last-child');
    if (strengthBars.length >= 5 && data.stats.hasResume) {
      const breakKeys = ['keywords', 'format', 'content', 'verbs', 'metrics'];
      breakKeys.forEach((key, idx) => {
        const val = data.atsBreakdown[key] || 0;
        strengthBars[idx].style.width = `${val}%`;
        strengthLabels[idx].textContent = `${val}%`;
        
        if (val < 50) {
          strengthBars[idx].style.background = 'linear-gradient(135deg,#EF4444,#DC2626)';
          strengthLabels[idx].style.color = 'var(--accent-red)';
        } else if (val < 80) {
          strengthBars[idx].style.background = 'linear-gradient(135deg,#F59E0B,#EF4444)';
          strengthLabels[idx].style.color = 'var(--accent-amber)';
        } else {
          strengthBars[idx].style.background = 'linear-gradient(135deg,#6C63FF,#00D4FF)';
          strengthLabels[idx].style.color = 'var(--accent-green)';
        }
      });
    }

    const recentJobsPanel = document.querySelector('.panel:first-child');
    if (recentJobsPanel) {
      const miniJobs = recentJobsPanel.querySelectorAll('.mini-job');
      miniJobs.forEach(el => el.remove());
      
      const jobsToRender = data.recentJobs.slice(0, 5);
      jobsToRender.forEach(job => {
        const logoText = job.company.includes('(') ? job.company.split('(')[1].replace(')', '') : job.company.slice(0, 3).toUpperCase();
        const categoryColor = getCategoryColor(getJobCategory(job));
        
        const jobRow = document.createElement('div');
        jobRow.className = 'mini-job';
        jobRow.innerHTML = `
          <div class="mj-logo" style="background:${categoryColor}">${logoText}</div>
          <div class="mj-info">
            <div class="mj-title" style="cursor:pointer;" onclick="window.location.href='jobs.html'">${job.title}</div>
            <div class="mj-company">${job.company.split('(')[0].trim()} · ${job.location.split(',')[0]} · ${job.salary}</div>
          </div>
          <span class="mj-match" style="color:${data.stats.hasResume ? 'var(--accent-green)' : 'var(--text-muted)'}">
            ${data.stats.hasResume ? job.matchPercentage + '%' : 'N/A'}
          </span>
        `;
        recentJobsPanel.appendChild(jobRow);
      });
    }

    const rolePanel = document.querySelector('.panel:last-child');
    if (rolePanel) {
      const roleCards = rolePanel.querySelectorAll('.role-card');
      roleCards.forEach(el => el.remove());
      
      const predictedRoles = [
        { name: 'Java Developer', icon: '☕', weight: data.stats.hasResume ? Math.min(100, data.stats.bestMatch + 5) : 60 },
        { name: 'Backend Developer', icon: '⚙️', weight: data.stats.hasResume ? Math.max(30, data.stats.bestMatch - 10) : 45 },
        { name: 'Web Developer', icon: '🌐', weight: data.stats.hasResume ? Math.max(40, data.stats.bestMatch - 5) : 55 },
        { name: 'Database Engineer', icon: '🗄️', weight: data.stats.hasResume ? Math.max(30, data.stats.bestMatch - 15) : 40 },
        { name: 'Python Developer', icon: '🐍', weight: data.stats.hasResume ? Math.max(35, data.stats.bestMatch - 8) : 50 }
      ];
      
      predictedRoles.forEach(role => {
        const card = document.createElement('div');
        card.className = 'role-card';
        card.innerHTML = `
          <div class="role-icon">${role.icon}</div>
          <div class="role-info">
            <div class="role-name">${role.name}</div>
            <div class="role-bar-wrap"><div class="role-bar-fill" style="width:${role.weight}%"></div></div>
          </div>
          <span class="role-pct">${role.weight}%</span>
        `;
        rolePanel.appendChild(card);
      });
    }
    
    const skillListPanel = document.querySelector('.skill-list');
    if (skillListPanel) {
      skillListPanel.innerHTML = '';
      if (!data.stats.hasResume) {
        skillListPanel.innerHTML = '<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px 0;">No skills extracted. Upload resume to populate.</p>';
      } else {
        const skillsToDisplay = Object.keys(data.profileData.sections).includes('skills') ? data.profileData.sections.skills : data.radarSkills.map(s => s.label);
        const uniqueSkills = [...new Set(skillsToDisplay.concat(data.radarSkills.map(s => s.label)))].slice(0, 6);
        
        uniqueSkills.forEach((skill, idx) => {
          const val = idx === 0 ? 88 : idx === 1 ? 82 : idx === 2 ? 75 : idx === 3 ? 68 : idx === 4 ? 60 : 55;
          const barColor = val > 75 ? 'linear-gradient(135deg,#6C63FF,#00D4FF)' : val > 60 ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : 'linear-gradient(135deg,#EF4444,#DC2626)';
          
          const row = document.createElement('div');
          row.className = 'skill-row';
          row.innerHTML = `
            <span class="skill-name">${skill}</span>
            <div class="skill-bar-wrap"><div class="skill-bar-fill" style="width:${val}%; background:${barColor}"></div></div>
            <span class="skill-pct">${val}%</span>
          `;
          skillListPanel.appendChild(row);
        });
      }
    }
    
    if (data.stats.hasResume && data.recentJobs.length > 0) {
      const topJob = data.recentJobs[0];
      const resumeSkills = data.radarSkills.map(s => s.label);
      const jobSkills = topJob.requiredSkills || [];
      
      const resumeContainer = document.getElementById('resumeSkillsComp');
      const jobContainer = document.getElementById('jobSkillsComp');
      if (resumeContainer && jobContainer) {
        resumeContainer.innerHTML = resumeSkills.slice(0, 8).map(skill => {
          const matched = jobSkills.some(js => js.toLowerCase() === skill.toLowerCase());
          return `<span class="skill-badge ${matched ? 'matched' : 'neutral'}">${matched ? '✓' : ''} ${skill}</span>`;
        }).join('');

        jobContainer.innerHTML = jobSkills.slice(0, 8).map(skill => {
          const matched = resumeSkills.some(rs => rs.toLowerCase() === skill.toLowerCase());
          return `<span class="skill-badge ${matched ? 'matched' : 'missing'}">${matched ? '✓' : '✗'} ${skill}</span>`;
        }).join('');
      }
      
      const missingSkillsContainer = document.querySelector('.panel:last-child div[style*="margin-top"]');
      if (missingSkillsContainer) {
        const badgesContainer = missingSkillsContainer.querySelector('div[style*="display:flex"]');
        if (badgesContainer) {
          badgesContainer.innerHTML = topJob.missingSkills.slice(0, 5).map(skill => {
            return `<span class="skill-badge missing">${skill}</span>`;
          }).join('') || '<span style="font-size:12px; color:var(--accent-green)">None! You are a perfect match.</span>';
        }
      }
    } else {
      const compGrid = document.querySelector('.comparison-grid');
      if (compGrid) {
        compGrid.innerHTML = '<p style="grid-column:1/-1; font-size:12px; color:var(--text-muted); text-align:center; padding:20px 0;">Resume comparison not available. Please upload a resume first.</p>';
      }
    }

  } catch (err) {
    console.error(err);
    showToast('❌ Failed to load dashboard data.');
  }
}

// 2. Jobs Page
async function initJobsPage() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/recommended-jobs/${user.id}`);
    if (!res.ok) throw new Error('Failed to fetch job recommendations');
    const jobs = await res.json();
    
    window.allMatchedJobs = jobs;
    
    const headerTitle = document.querySelector('.jobs-header h2');
    const headerSub = document.querySelector('.jobs-header p');
    if (headerTitle) {
      headerTitle.innerHTML = `Job <span class="gradient-text">Matches</span>`;
    }
    if (headerSub) {
      headerSub.textContent = `${jobs.length} jobs matched based on your profile · Sorted by match score`;
    }
    
    const javaCount = jobs.filter(j => getJobCategory(j) === 'java').length;
    const pythonCount = jobs.filter(j => getJobCategory(j) === 'python').length;
    const webCount = jobs.filter(j => getJobCategory(j) === 'web').length;
    const dataCount = jobs.filter(j => getJobCategory(j) === 'data').length;
    const fullstackCount = jobs.filter(j => getJobCategory(j) === 'fullstack').length;
    
    const filterBtns = document.querySelectorAll('.filter-tabs .filter-btn');
    if (filterBtns.length >= 6) {
      filterBtns[0].textContent = `All Jobs (${jobs.length})`;
      filterBtns[1].textContent = `Java (${javaCount})`;
      filterBtns[2].textContent = `Python (${pythonCount})`;
      filterBtns[3].textContent = `Web Dev (${webCount})`;
      filterBtns[4].textContent = `Data (${dataCount})`;
      filterBtns[5].textContent = `Full Stack (${fullstackCount})`;
    }
    
    const sidebarCounts = document.querySelectorAll('.filters-panel .count');
    if (sidebarCounts.length >= 5) {
      sidebarCounts[0].textContent = jobs.filter(j => getJobCategory(j) === 'java' || getJobCategory(j) === 'fullstack').length;
      sidebarCounts[1].textContent = jobs.filter(j => getJobCategory(j) === 'web').length;
      sidebarCounts[2].textContent = jobs.filter(j => getJobCategory(j) === 'data').length;
      sidebarCounts[3].textContent = jobs.filter(j => getJobCategory(j) === 'python').length;
      sidebarCounts[4].textContent = jobs.filter(j => getJobCategory(j) === 'web' || getJobCategory(j) === 'fullstack').length;
    }

    renderJobCards(jobs);
    
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to load matched jobs.');
  }
}

function renderJobCards(jobs) {
  const grid = document.querySelector('.jobs-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  if (jobs.length === 0) {
    grid.innerHTML = `
      <div style="background:var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 48px; text-align: center; color: var(--text-muted);">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">No matching jobs found</h3>
        <p style="font-size: 13px; line-height: 1.6;">Try adding more skills to your resume and re-uploading it to improve matching criteria.</p>
      </div>
    `;
    return;
  }
  
  jobs.forEach(job => {
    const category = getJobCategory(job);
    const logoText = job.company.includes('(') ? job.company.split('(')[1].replace(')', '') : job.company.slice(0, 3).toUpperCase();
    const categoryColor = getCategoryColor(category);
    
    let matchClass = 'low';
    if (job.matchPercentage >= 80) matchClass = 'high';
    else if (job.matchPercentage >= 50) matchClass = 'medium';
    
    const skillsHtml = (job.requiredSkills || []).map(skill => {
      const isMissing = job.missingSkills.includes(skill);
      return `<span class="job-skill ${isMissing ? 'missing' : ''}">${skill}${isMissing ? ' ✗' : ''}</span>`;
    }).join('');
    
    let applyBtnHtml = `<button class="btn-apply" onclick="applyToJob(this, '${job.id}')">Apply Now</button>`;
    if (job.applied) {
      applyBtnHtml = `<button class="btn-apply" disabled style="background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text-muted); cursor: not-allowed; pointer-events: none;">Applied</button>`;
    }
    
    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('data-category', category);
    card.innerHTML = `
      <div class="job-card-top">
        <div class="job-logo" style="background:${categoryColor}">${logoText}</div>
        <div class="job-info">
          <div class="job-title" onclick="window.location.href='skill-gap.html?jobId=${job.id}'">${job.title}</div>
          <div class="job-company">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            ${job.company.split('(')[0].trim()}
          </div>
          <div class="job-meta">
            <span class="job-meta-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${job.location}</span>
            <span class="job-meta-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Full Time</span>
            <span class="job-meta-tag">${job.experience}</span>
            <span class="new-badge">NEW</span>
          </div>
        </div>
        <div class="job-right">
          <span class="match-badge ${matchClass}">${job.matchPercentage}% Match</span>
          <span class="job-salary">${job.salary}</span>
        </div>
      </div>
      <div class="job-skills">
        ${skillsHtml}
      </div>
      <div class="job-actions">
        ${applyBtnHtml}
        <button class="btn-save" onclick="saveJob(this)">♡ Save</button>
        <span class="job-posted">Posted 2 days ago</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function applyToJob(btn, jobId) {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const res = await fetch('http://127.0.0.1:5000/api/apply-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, jobId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('🎉 Applied successfully!');
      btn.textContent = 'Applied';
      btn.disabled = true;
      btn.style.cssText = 'background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text-muted); cursor: not-allowed; pointer-events: none;';
    } else {
      showToast('❌ ' + (data.error || 'Failed to apply.'));
    }
  } catch (err) {
    console.error(err);
    showToast('❌ Connection error to backend.');
  }
}

function searchJobs(query) {
  const q = query.toLowerCase().trim();
  if (!window.allMatchedJobs) return;
  const filtered = window.allMatchedJobs.filter(job => {
    return job.title.toLowerCase().includes(q) ||
           job.company.toLowerCase().includes(q) ||
           job.location.toLowerCase().includes(q) ||
           job.requiredSkills.some(s => s.toLowerCase().includes(q));
  });
  renderJobCards(filtered);
}

function initJobFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      if (!window.allMatchedJobs) return;
      
      const filtered = filter === 'all' ? 
        window.allMatchedJobs : 
        window.allMatchedJobs.filter(j => getJobCategory(j) === filter);
      renderJobCards(filtered);
    });
  });
}

// 3. ATS Score Page
async function initAtsReportPage() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/dashboard/${user.id}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    const data = await res.json();
    
    if (!data.stats.hasResume) {
      showToast('⚠️ Please upload a resume first to view the ATS report.');
      setTimeout(() => { window.location.href = 'resume-upload.html'; }, 1500);
      return;
    }
    
    setTimeout(() => {
      animateCircularProgress('atsProgressCircle', data.stats.atsScore);
    }, 500);
    
    const bigScoreNum = document.querySelector('.big-score');
    if (bigScoreNum) {
      bigScoreNum.textContent = data.stats.atsScore;
    }
    
    const gradeBadge = document.querySelector('.score-grade');
    if (gradeBadge) {
      if (data.stats.atsScore >= 80) {
        gradeBadge.textContent = '✓ Strong Profile';
        gradeBadge.style.cssText = 'background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.3); color: var(--accent-green)';
      } else if (data.stats.atsScore >= 50) {
        gradeBadge.textContent = '⚠ Fair Profile';
        gradeBadge.style.cssText = 'background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.3); color: var(--accent-amber)';
      } else {
        gradeBadge.textContent = '✗ Needs Improvement';
        gradeBadge.style.cssText = 'background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: var(--accent-red)';
      }
    }
    
    const biFills = document.querySelectorAll('.breakdown-items .bi-fill');
    const biScores = document.querySelectorAll('.breakdown-items .bi-score');
    const breakKeys = ['keywords', 'format', 'content', 'verbs', 'metrics'];
    const breakColors = {
      keywords: '#6C63FF',
      format: '#00D4FF',
      content: '#34D399',
      verbs: '#F59E0B',
      metrics: '#EF4444'
    };
    
    if (biFills.length >= 5) {
      breakKeys.forEach((key, idx) => {
        const scoreVal = data.atsBreakdown[key] || 0;
        biFills[idx].style.width = `${scoreVal}%`;
        biFills[idx].style.background = breakColors[key];
        biScores[idx].textContent = `${scoreVal}/100`;
      });
    }
    
    const kwGrid = document.querySelector('.keyword-grid');
    if (kwGrid && data.recentJobs.length > 0) {
      kwGrid.innerHTML = '';
      const topJob = data.recentJobs[0];
      const matched = topJob.matchedSkills || [];
      const missing = topJob.missingSkills || [];
      
      matched.forEach(skill => {
        kwGrid.innerHTML += `<span class="kw-tag found">${skill} (Found)</span>`;
      });
      missing.forEach(skill => {
        kwGrid.innerHTML += `<span class="kw-tag missing">${skill} (Missing)</span>`;
      });
      
      if (matched.length === 0 && missing.length === 0) {
        kwGrid.innerHTML = '<span class="kw-tag partial">No keywords found. Include more tech tags.</span>';
      }
    }
    
    const issueListContainer = document.querySelector('.issue-list');
    if (issueListContainer && data.profileData.suggestions) {
      issueListContainer.innerHTML = '';
      const suggestions = data.profileData.suggestions;
      
      suggestions.forEach(sug => {
        const item = document.createElement('div');
        item.className = `issue-item ${sug.type}`;
        item.innerHTML = `
          <div class="issue-dot"></div>
          <div class="issue-content">
            <h4>${sug.type.toUpperCase()}: ${sug.text.split('—')[0]}</h4>
            <p>${sug.text.split('—')[1] || sug.text}</p>
          </div>
        `;
        issueListContainer.appendChild(item);
      });
    }

    const jobSelBtnContainer = document.querySelector('.job-selector');
    if (jobSelBtnContainer && data.recentJobs.length > 0) {
      jobSelBtnContainer.innerHTML = '';
      data.recentJobs.slice(0, 3).forEach((job, idx) => {
        jobSelBtnContainer.innerHTML += `
          <button class="job-sel-btn ${idx === 0 ? 'active' : ''}" onclick="selectAtsComparisonJob('${job.id}')">${job.company.split('(')[0]} · ${job.title}</button>
        `;
      });
      
      window.atsReportJobs = data.recentJobs.slice(0, 3);
      window.userResumeSkills = data.radarSkills.map(s => s.label);
      renderAtsComparisonTable(data.recentJobs[0].id);
    }

  } catch (err) {
    console.error(err);
    showToast('❌ Failed to load ATS score analysis.');
  }
}

function selectAtsComparisonJob(jobId) {
  const selectorBtns = document.querySelectorAll('.job-sel-btn');
  selectorBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(jobId));
  });
  renderAtsComparisonTable(jobId);
}

function renderAtsComparisonTable(jobId) {
  const compTableBody = document.querySelector('.comp-table');
  if (!compTableBody || !window.atsReportJobs) return;
  
  const targetJob = window.atsReportJobs.find(j => j.id === jobId);
  if (!targetJob) return;
  
  const skills = targetJob.requiredSkills || [];
  const tbody = compTableBody.querySelector('tbody') || compTableBody;
  
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((r, idx) => { if (idx > 0) r.remove(); });
  
  skills.forEach(skill => {
    const isMatched = targetJob.matchedSkills.some(s => s.toLowerCase() === skill.toLowerCase());
    const statusText = isMatched ? 'Match' : 'Missing';
    const statusClass = isMatched ? 'match' : 'missing';
    const tipText = isMatched ? 'Optimal density found.' : `Add to experience/projects to close gap.`;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${skill}</strong></td>
      <td>${isMatched ? 'High Density' : 'Not Found'}</td>
      <td><span class="status-dot ${statusClass}">${statusText}</span></td>
      <td><span style="color:var(--text-muted)">${tipText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Skill Gap & Learning Roadmap Page
async function initSkillGapPage() {
  const user = getCurrentUser();
  if (!user) return;
  
  const urlParams = new URLSearchParams(window.location.search);
  let jobId = urlParams.get('jobId');
  
  try {
    if (!jobId) {
      const jobsRes = await fetch(`http://127.0.0.1:5000/api/recommended-jobs/${user.id}`);
      if (!jobsRes.ok) throw new Error('Failed to fetch jobs listing');
      const jobs = await jobsRes.json();
      if (jobs.length > 0) {
        jobId = jobs[0].id;
        history.replaceState(null, '', `?jobId=${jobId}`);
      } else {
        showToast('⚠️ Please upload a resume first to run skill gap analysis.');
        setTimeout(() => { window.location.href = 'resume-upload.html'; }, 1500);
        return;
      }
    }
    
    const res = await fetch(`http://127.0.0.1:5000/api/skill-gap/${user.id}/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch skill gap analysis');
    const data = await res.json();
    
    const overviewNums = document.querySelectorAll('.overview-num');
    if (overviewNums.length >= 3) {
      overviewNums[0].textContent = data.matchedSkills.length;
      overviewNums[1].textContent = data.missingSkills.length;
      overviewNums[2].textContent = `${data.missingSkills.length * 2} wks`;
    }
    
    const currentSkillsPanel = document.querySelector('.skills-panel:first-child');
    if (currentSkillsPanel) {
      const rows = currentSkillsPanel.querySelectorAll('.skill-row');
      rows.forEach(r => r.remove());
      
      data.matchedSkills.forEach((skill, idx) => {
        const val = 90 - (idx * 5);
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.innerHTML = `
          <span class="skill-name">${skill}</span>
          <div class="skill-bar-wrap"><div class="skill-bar-fill" style="width:${val}%; background:linear-gradient(135deg,#34D399,#0EA5E9)"></div></div>
          <span class="skill-pct" style="color:var(--accent-green)">${val}%</span>
        `;
        currentSkillsPanel.appendChild(row);
      });
      
      if (data.matchedSkills.length === 0) {
        currentSkillsPanel.innerHTML += '<p style="font-size:12px; color:var(--text-muted); padding:10px 0;">No matching skills found in resume.</p>';
      }
    }
    
    const missingSkillsPanel = document.querySelector('.skills-panel:last-child .gap-skills');
    if (missingSkillsPanel) {
      missingSkillsPanel.innerHTML = '';
      
      data.learningSuggestions.forEach(sug => {
        const item = document.createElement('div');
        item.className = 'gap-skill-item';
        
        let icon = '🔧';
        if (sug.skill === 'React' || sug.skill === 'HTML' || sug.skill === 'CSS' || sug.skill === 'JavaScript') icon = '🌐';
        else if (sug.skill === 'Docker') icon = '🐳';
        else if (sug.skill === 'REST API') icon = '⚡';
        
        item.innerHTML = `
          <div class="gap-skill-icon">${icon}</div>
          <div class="gap-skill-info">
            <div class="gap-skill-name">${sug.skill}</div>
            <div class="gap-skill-desc">${sug.desc}</div>
          </div>
          <span class="gap-skill-priority priority-${sug.priority === 'HIGH' ? 'high' : 'med'}">${sug.priority}</span>
        `;
        missingSkillsPanel.appendChild(item);
      });
      
      if (data.missingSkills.length === 0) {
        missingSkillsPanel.innerHTML = `
          <div style="text-align:center; padding: 20px 0; color: var(--accent-green)">
            <h4>🎉 Perfect Match!</h4>
            <p style="font-size:11px; color: var(--text-muted); margin-top:4px;">You already have all the skills required for this job catalog listings!</p>
          </div>
        `;
      }
    }
    
    const roadmapContainer = document.querySelector('.roadmap-items');
    if (roadmapContainer) {
      roadmapContainer.innerHTML = '';
      
      if (data.missingSkills.length === 0) {
        roadmapContainer.innerHTML = `
          <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-xl); padding:32px; text-align:center;">
            <h3>✨ Your Roadmap is Complete!</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">You don't have any missing skills for this target role. Go ahead and apply with full confidence!</p>
          </div>
        `;
      } else {
        data.missingSkills.forEach((skill, idx) => {
          const phase = idx + 1;
          const status = phase === 1 ? 'active' : 'upcoming';
          const phaseText = phase === 1 ? 'Phase 1 — In Progress' : `Phase ${phase} — Upcoming`;
          const duration = phase === 1 ? '1 week' : '2 weeks';
          const timelineText = phase === 1 ? 'Active study path' : `Starts after Phase ${idx}`;
          
          const item = document.createElement('div');
          item.className = 'roadmap-item';
          item.innerHTML = `
            <div class="roadmap-dot ${status}">${phase}</div>
            <div class="roadmap-content">
              <div class="roadmap-phase ${status}">${phaseText}</div>
              <div class="roadmap-title">Mastering ${skill}</div>
              <div class="roadmap-desc">Deep-dive into ${skill} fundamentals. Build 2 minor portfolio projects and study common platform implementation challenges. Understand core configuration settings and best practice patterns.</div>
              <div class="roadmap-skills"><span class="roadmap-skill">${skill}</span><span class="roadmap-skill">${skill} Core</span><span class="roadmap-skill">Best Practices</span></div>
              <div class="roadmap-duration"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${duration} · ${timelineText}</div>
              <div class="roadmap-resources" style="margin-top:10px">
                <span class="resource-link" onclick="showToast('📚 Opening official ${skill} guide...')">📚 ${skill} Docs</span>
                <span class="resource-link" onclick="showToast('📹 Opening YouTube crash course for ${skill}...')">📹 crash course</span>
              </div>
            </div>
          `;
          roadmapContainer.appendChild(item);
        });
      }
    }
    
    if (document.getElementById('techQuestions')) {
      const primarySkill = data.missingSkills[0] || data.matchedSkills[0] || 'Java';
      const category = primarySkill.toLowerCase().includes('py') ? 'python' : 
                       (primarySkill.toLowerCase().includes('react') || primarySkill.toLowerCase().includes('html') || primarySkill.toLowerCase().includes('js')) ? 'web' : 'java';
      generateInterviewQuestions(category);
    }
    
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to compute learning roadmap.');
  }
}

// 5. Admin Panel Page
async function initAdminPage() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return;
  
  const adminName = document.querySelector('.admin-user-name');
  if (adminName) adminName.textContent = user.fullName;
  const adminAv = document.querySelector('.admin-avatar');
  if (adminAv) adminAv.textContent = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  try {
    const res = await fetch('http://127.0.0.1:5000/api/admin/summary');
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    const data = await res.json();
    
    const statNums = document.querySelectorAll('.stat-num');
    if (statNums.length >= 4) {
      statNums[0].textContent = data.stats.totalUsers;
      statNums[1].textContent = data.stats.totalResumes;
      statNums[2].textContent = data.stats.totalApplications;
      statNums[3].textContent = `${data.stats.avgAts}/100`;
    }
    
    const tableBody = document.querySelector('.users-table tbody');
    if (tableBody) {
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach((r, idx) => { if (idx > 0) r.remove(); });
      
      data.recentUsers.forEach(u => {
        const initials = u.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="user-cell">
              <div class="user-av" style="background:linear-gradient(135deg,#6C63FF,#00D4FF)">${initials}</div>
              <div>
                <div class="user-name">${u.fullName}</div>
                <div class="user-email">${u.email}</div>
              </div>
            </div>
          </td>
          <td>${u.college || 'N/A'}<br/><span style="font-size:11px;color:var(--text-muted)">${u.branch || 'N/A'}</span></td>
          <td>${u.gradYear || 'N/A'}</td>
          <td><span class="status-pill active">Registered</span></td>
          <td><span style="font-size:12px;color:var(--text-muted)">${new Date(u.createdAt).toLocaleDateString()}</span></td>
        `;
        tableBody.appendChild(tr);
      });
      
      if (data.recentUsers.length === 0) {
        tableBody.innerHTML += '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted)">No registered users yet.</td></tr>';
      }
    }
    
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
      activityList.innerHTML = '';
      
      data.recentApplications.forEach(app => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
          <div class="activity-icon" style="background:rgba(52,211,153,0.12);color:var(--accent-green)">💼</div>
          <div class="activity-content">
            <div class="activity-text"><strong>${app.fullName}</strong> applied to <strong>${app.jobTitle}</strong> at ${app.company}</div>
            <div class="activity-time">${new Date(app.appliedAt).toLocaleString()}</div>
          </div>
        `;
        activityList.appendChild(item);
      });
      
      if (data.recentApplications.length === 0) {
        activityList.innerHTML = '<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px 0;">No job applications submitted yet.</p>';
      }
    }
    
    drawBarChartDynamic('resumeChart', 
      ['Total', 'Parsed', 'Applied'], 
      [data.stats.totalUsers, data.stats.totalResumes, data.stats.totalApplications],
      ['#6C63FF', '#00D4FF', '#34D399']
    );
    
    drawBarChartDynamic('jobsChart', 
      ['Google', 'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech M'], 
      [2, 4, 3, 2, 2, 2],
      ['#FF4B4B', '#6C63FF', '#00D4FF', '#34D399', '#F59E0B', '#EF4444']
    );

  } catch (err) {
    console.error(err);
    showToast('❌ Failed to retrieve admin panel statistics.');
  }
}

// ── INIT ALL ──
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  initSidebar();
  
  if (pageName === 'resume-upload.html') {
    initUploadZone();
  } else if (pageName === 'dashboard.html') {
    initDashboardPage();
  } else if (pageName === 'jobs.html') {
    initRangeSlider();
    initJobFilters();
    initJobsPage();
  } else if (pageName === 'ats-score.html') {
    initAtsReportPage();
  } else if (pageName === 'skill-gap.html') {
    initSkillGapPage();
  } else if (pageName === 'admin.html') {
    initAdminPage();
  }
});

// ── CSS ANIMATION KEYFRAMES (injected) ──
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .interview-q {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    margin-bottom: 10px;
    transition: all 0.3s ease;
  }
  .interview-q:hover { background: rgba(108,99,255,0.08); border-color: rgba(108,99,255,0.2); }
  .interview-q.practiced { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.25); }
  .q-num {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg,#6C63FF,#00D4FF);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .q-text { flex: 1; font-size: 14px; color: #CBD5E1; line-height: 1.6; }
  .q-practice-btn {
    padding: 5px 12px; font-size: 11px; font-weight: 600;
    background: rgba(108,99,255,0.12); border: 1px solid rgba(108,99,255,0.25);
    border-radius: 100px; color: #A78BFA; cursor: pointer;
    transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .q-practice-btn:hover { background: rgba(108,99,255,0.2); }
  .interview-q.practiced .q-practice-btn { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.3); color: #34D399; }
  .upload-zone.drag-over {
    border-color: #6C63FF !important;
    background: rgba(108,99,255,0.1) !important;
    transform: scale(1.02);
  }
`;
document.head.appendChild(style);