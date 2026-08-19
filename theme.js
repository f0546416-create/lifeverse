/* =============================================
   LIFEVERSE — THEME SYSTEM
   Dark is the default (no class needed).
   Light mode = body.light-mode class.
   Saved to localStorage as 'lv-theme'.
============================================= */

/* Apply saved theme BEFORE first paint — prevents flash */
(function () {
  if (localStorage.getItem('lv-theme') === 'light') {
    document.documentElement.classList.add('light-mode');
    /* <html> class is set instantly; body class is synced below on DOMContentLoaded */
  }
})();

document.addEventListener('DOMContentLoaded', function () {

  /* Sync body with the html class set above */
  if (document.documentElement.classList.contains('light-mode')) {
    document.body.classList.add('light-mode');
  }

  /* Wire every toggle button — works for any id/class combo used across pages */
  document.querySelectorAll(
    '#themeToggle, .theme-toggle, [data-theme-toggle], [data-theme]'
  ).forEach(function (btn) {
    updateIcon(btn);
    btn.addEventListener('click', toggleTheme);
  });

});

/* -------------------------------------------------- */

function toggleTheme() {
  var isLight = document.body.classList.toggle('light-mode');

  /* keep <html> in sync too (helps with CSS cascade and flash prevention) */
  document.documentElement.classList.toggle('light-mode', isLight);

  /* persist */
  localStorage.setItem('lv-theme', isLight ? 'light' : 'dark');

  /* update all icons on the page */
  document.querySelectorAll(
    '#themeToggle, .theme-toggle, [data-theme-toggle], [data-theme]'
  ).forEach(updateIcon);

  /* optional toast */
  if (typeof showNotification === 'function') {
    showNotification(isLight ? '☀️ Light mode' : '🌙 Dark mode');
  }
}

function updateIcon(btn) {
  var isLight = document.body.classList.contains('light-mode');
  var icon = btn.querySelector('i');
  if (icon) {
    /* sun shown in dark mode (click → go light), moon shown in light mode (click → go dark) */
    icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
  }
  /* also update any emoji span if present */
  var span = btn.querySelector('.theme-icon');
  if (span) {
    span.textContent = isLight ? '🌙' : '☀️';
  }
  btn.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
}
