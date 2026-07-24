/* =============================================
   LIFEVERSE — AUTH SYSTEM
   js/auth.js
   Handles: login, signup, password toggle,
            strength meter, form validation
============================================= */

// ===== HELPERS =====

function showMessage(msg, type = 'error') {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-message ' + type;
  el.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.querySelector('span').textContent = loading ? 'Please wait…' : btn.dataset.label;
}

// ===== PASSWORD TOGGLE =====

function setupToggle(inputId, btnId, iconId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  });
}

// ===== PASSWORD STRENGTH =====

function measureStrength(password) {
  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function setupStrengthMeter() {
  const input = document.getElementById('signupPassword');
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!input || !fill || !label) return;

  input.addEventListener('input', () => {
    const score = measureStrength(input.value);
    const levels = [
      { pct: '0%',   color: '#EF5350', text: '' },
      { pct: '20%',  color: '#EF5350', text: 'Too short' },
      { pct: '40%',  color: '#FF9800', text: 'Weak' },
      { pct: '60%',  color: '#FFC107', text: 'Fair' },
      { pct: '80%',  color: '#8BC34A', text: 'Good' },
      { pct: '100%', color: '#2E7D32', text: 'Strong' },
    ];
    const lvl = levels[score];
    fill.style.width = lvl.pct;
    fill.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;
  });
}

// ===== LOGIN =====

function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const btn = document.getElementById('loginBtn');
  if (btn) btn.dataset.label = 'Login';

  setupToggle('loginPassword', 'togglePw', 'togglePwIcon');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      showMessage('Please fill in all fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showMessage('Please enter a valid email address.');
      return;
    }

    setLoading('loginBtn', true);

    // Simulate brief check delay
    setTimeout(() => {
      // Save session
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userEmail', email);

      // Restore remember-me preference
      const remember = document.getElementById('rememberMe');
      if (remember && remember.checked) {
        localStorage.setItem('savedEmail', email);
      }

      // Ensure default game values exist
      if (!localStorage.getItem('xp'))    localStorage.setItem('xp', '850');
      if (!localStorage.getItem('coins')) localStorage.setItem('coins', '1250');
      if (!localStorage.getItem('level')) localStorage.setItem('level', '5');
      if (!localStorage.getItem('streak'))localStorage.setItem('streak', '12');
      if (!localStorage.getItem('completedQuests')) localStorage.setItem('completedQuests', '0');

      showMessage('Login successful! Redirecting…', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    }, 500);
  });

  // Pre-fill saved email
  const saved = localStorage.getItem('savedEmail');
  const emailInput = document.getElementById('loginEmail');
  if (saved && emailInput) {
    emailInput.value = saved;
    const rem = document.getElementById('rememberMe');
    if (rem) rem.checked = true;
  }
}

// ===== SIGNUP =====

function setupSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const btn = document.getElementById('signupBtn');
  if (btn) btn.dataset.label = 'Create Account';

  setupToggle('signupPassword', 'togglePwSignup', 'togglePwSignupIcon');
  setupStrengthMeter();

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name     = document.getElementById('signupName').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm  = document.getElementById('signupConfirm').value;
    const agreed   = document.getElementById('agreeTerms').checked;

    if (!name || !email || !password || !confirm) {
      showMessage('Please fill in all fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      showMessage('Passwords do not match.');
      return;
    }

    if (!agreed) {
      showMessage('Please agree to the Terms & Conditions.');
      return;
    }

    setLoading('signupBtn', true);

    setTimeout(() => {
      // Store account info
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('profileName', name);
      localStorage.setItem('profileEmail', email);
      localStorage.setItem('profileBio', '🌱 Making the planet greener one challenge at a time.');
      localStorage.setItem('joinDate', new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

      // Initialize game state
      localStorage.setItem('xp', '0');
      localStorage.setItem('coins', '0');
      localStorage.setItem('level', '1');
      localStorage.setItem('streak', '0');
      localStorage.setItem('completedQuests', '0');

      showMessage('Account created! Redirecting…', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    }, 600);
  });
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupSignup();
});
