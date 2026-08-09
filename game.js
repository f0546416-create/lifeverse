/* =============================================
   LIFEVERSE — GAME ENGINE
   js/game.js
   Core game state: XP, coins, level, streak.
   Must be loaded FIRST on every inner page.
============================================= */

// ===== DEFAULT STATE =====
// Only set defaults if values don't already exist
(function initDefaults() {
  const defaults = { xp: 850, coins: 1250, level: 5, streak: 12, completedQuests: 0 };
  Object.entries(defaults).forEach(([key, val]) => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, String(val));
    }
  });
})();

// ===== READ STATE =====
function getXP()     { return Number(localStorage.getItem('xp'))     || 0; }
function getCoins()  { return Number(localStorage.getItem('coins'))   || 0; }
function getLevel()  { return Number(localStorage.getItem('level'))   || 1; }
function getStreak() { return Number(localStorage.getItem('streak'))  || 0; }
function getCompletedQuests() { return Number(localStorage.getItem('completedQuests')) || 0; }

// ===== ADD REWARDS =====
function addRewards(xpReward, coinReward) {
  let xp     = getXP()    + xpReward;
  let coins  = getCoins() + coinReward;
  let level  = getLevel();

  // Level up every 1000 XP
  while (xp >= 1000) {
    xp -= 1000;
    level++;
    showNotification('🎉 Level Up! You are now Level ' + level, 'success');
  }

  localStorage.setItem('xp',    String(xp));
  localStorage.setItem('coins', String(coins));
  localStorage.setItem('level', String(level));

  updateStats();
}

// ===== UPDATE ALL STAT ELEMENTS =====
function updateStats() {
  const map = {
    xp:              getXP(),
    coins:           getCoins(),
    level:           getLevel(),
    streak:          getStreak() + ' Days',
    completedQuests: getCompletedQuests(),
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// ===== RESET GAME STATE =====
function resetGame() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  const defaults = { xp: 0, coins: 0, level: 1, streak: 0, completedQuests: 0 };
  Object.entries(defaults).forEach(([k, v]) => localStorage.setItem(k, String(v)));
  showNotification('🔄 Progress reset!', 'info');
  setTimeout(() => updateStats(), 100);
}

// ===== SHOW NOTIFICATION TOAST =====
// Declared here so it's always available regardless of app.js load order
function showNotification(message, type = 'success') {
  // Remove any existing toasts
  document.querySelectorAll('.notification').forEach(n => n.remove());

  const box = document.createElement('div');
  box.className = 'notification ' + type;
  box.textContent = message;
  document.body.appendChild(box);

  setTimeout(() => { if (box.parentNode) box.remove(); }, 3000);
}

// ===== AUTO-RUN ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', updateStats);
