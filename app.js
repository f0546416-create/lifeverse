/* =============================================
   LIFEVERSE — APP HELPERS
   js/app.js
============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ===== MOBILE SIDEBAR TOGGLE =====
  const sidebar  = document.querySelector('.sidebar');
  const menuBtn  = document.querySelector('.menu-btn');
  const closeBtn = document.querySelector('.sidebar-close');

  // Create dark overlay for sidebar
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:250;opacity:0;transition:opacity 0.3s;';
  document.body.appendChild(overlay);

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    overlay.style.display = 'block';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
    document.body.style.overflow = '';
  }

  if (menuBtn)  menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Close sidebar when a nav link is tapped on mobile
  if (sidebar) {
    sidebar.querySelectorAll('li[onclick]').forEach(li => {
      li.addEventListener('click', () => {
        if (window.innerWidth <= 900) closeSidebar();
      });
    });
  }

  // ===== INJECT MOBILE BOTTOM NAV =====
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';

  const navItems = [
    { icon: 'fa-house',        label: 'Home',      href: 'dashboard.html' },
    { icon: 'fa-leaf',         label: 'Eco',       href: 'eco.html'       },
    { icon: 'fa-flag',         label: 'Quests',    href: 'quests.html'    },
    { icon: 'fa-chart-line',   label: 'Analytics', href: 'analytics.html' },
    { icon: 'fa-user',         label: 'Profile',   href: 'profile.html'   },
  ];

  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';
  bottomNav.setAttribute('role', 'navigation');
  bottomNav.setAttribute('aria-label', 'Mobile navigation');

  navItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.className = 'bottom-nav-item' + (page === item.href ? ' active' : '');
    a.setAttribute('aria-label', item.label);
    a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
    bottomNav.appendChild(a);
  });

  document.body.appendChild(bottomNav);

  // Add bottom padding to content so it doesn't hide behind the nav bar
  const content = document.querySelector('.content');
  if (content) content.style.paddingBottom = 'calc(72px + env(safe-area-inset-bottom))';

  // ===== PROFILE IMAGE SYNC =====
  const savedImg = localStorage.getItem('profileImage');
  const name     = localStorage.getItem('profileName') || 'LV';

  document.querySelectorAll('.header-avatar').forEach(img => {
    img.src = savedImg ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2E7D32&color=ffffff`;
  });

  // Profile photo upload (profile page only)
  const imageUpload = document.getElementById('imageUpload');
  const profileImg  = document.getElementById('profileImage');
  if (imageUpload && profileImg) {
    if (savedImg) profileImg.src = savedImg;
    imageUpload.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        profileImg.src = e.target.result;
        localStorage.setItem('profileImage', e.target.result);
        document.querySelectorAll('.header-avatar').forEach(img => { img.src = e.target.result; });
        showNotification('📸 Profile photo updated!');
      };
      reader.readAsDataURL(file);
    });
  }

  // ===== BUTTON PRESS FEEDBACK =====
  document.addEventListener('click', e => {
    const btn = e.target.closest('button, .green-btn, .red-btn');
    if (!btn) return;
    btn.style.transform = 'scale(0.97)';
    setTimeout(() => { btn.style.transform = ''; }, 150);
  });

  console.log('🌱 LifeVerse App Ready');
});
