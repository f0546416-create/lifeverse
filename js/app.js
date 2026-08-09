/* =============================================
   LIFEVERSE — APP HELPERS
   js/app.js
   Handles: sidebar mobile toggle, dark mode,
            profile image, active nav state
============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ===== MOBILE SIDEBAR TOGGLE =====
  const sidebar    = document.querySelector('.sidebar');
  const menuBtn    = document.querySelector('.menu-btn');
  const closeBtn   = document.querySelector('.sidebar-close');
  const overlay    = document.createElement('div');

  overlay.className = 'sidebar-overlay';
  overlay.style.cssText = [
    'display:none',
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,0.45)',
    'z-index:250',
    'transition:opacity 0.3s',
  ].join(';');
  document.body.appendChild(overlay);

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    overlay.style.display = 'block';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }

  if (menuBtn)  menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // ===== DARK MODE =====
  function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);

    // Sync all toggle checkboxes
    document.querySelectorAll('#darkMode').forEach(cb => { cb.checked = dark; });
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

  // Dark mode toggle (checkbox style)
  document.querySelectorAll('#darkMode').forEach(cb => {
    cb.addEventListener('change', () => {
      const dark = cb.checked;
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      applyTheme(dark);
      showNotification(dark ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
    });
  });

  // Button-style theme toggle
  document.querySelectorAll('.theme-toggle, #themeToggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const dark = !document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      applyTheme(dark);
      showNotification(dark ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
    });
  });

  // ===== PROFILE IMAGE SYNC =====
  const savedImg = localStorage.getItem('profileImage');

  // Update header avatar if present
  document.querySelectorAll('.header-avatar').forEach(img => {
    if (savedImg) img.src = savedImg;
    else {
      const name = localStorage.getItem('profileName') || 'LV';
      img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2E7D32&color=ffffff`;
    }
  });

  // Handle profile photo upload (profile page)
  const imageUpload = document.getElementById('imageUpload');
  const profileImg  = document.getElementById('profileImage');

  if (imageUpload && profileImg) {
    if (savedImg) profileImg.src = savedImg;

    imageUpload.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target.result;
        profileImg.src = src;
        localStorage.setItem('profileImage', src);
        showNotification('📸 Profile photo updated!');
      };
      reader.readAsDataURL(file);
    });
  }

  // ===== ACTIVE NAV HIGHLIGHT =====
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.sidebar li[data-page]').forEach(li => {
    if (li.dataset.page === currentPage) li.classList.add('active');
  });

  // ===== BUTTON PRESS FEEDBACK =====
  document.addEventListener('click', e => {
    const btn = e.target.closest('button, .green-btn, .red-btn');
    if (!btn) return;
    btn.style.transform = 'scale(0.97)';
    setTimeout(() => { btn.style.transform = ''; }, 150);
  });

  console.log('🌱 LifeVerse App Ready');
});
