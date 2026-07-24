/* =============================================
   LIFEVERSE — PREMIUM SYSTEM
   js/premium.js
   Handles: plan state, purchase flow, feature
            gating, badge injection, XP bonuses
============================================= */

// ===== PLAN DEFINITIONS =====
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    xpBonus: 1.0,
    coinBonus: 1.0,
    extraQuests: false,
    extraChallenges: false,
    analytics: false,
    prioritySupport: false,
    customBadge: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 4.99,
    period: 'month',
    xpBonus: 1.5,       // 50% more XP
    coinBonus: 1.5,
    extraQuests: true,  // 4 extra quests
    extraChallenges: true, // 4 extra challenges
    analytics: true,
    prioritySupport: false,
    customBadge: true,
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 9.99,
    period: 'month',
    xpBonus: 2.0,       // 2× XP
    coinBonus: 2.0,
    extraQuests: true,  // 7 extra quests
    extraChallenges: true, // 8 extra challenges
    analytics: true,
    prioritySupport: true,
    customBadge: true,
  },
};

// ===== READ / WRITE PLAN =====
function getCurrentPlan() {
  return localStorage.getItem('premiumPlan') || 'free';
}

function getPlanData(planId) {
  return PLANS[planId] || PLANS.free;
}

function getCurrentPlanData() {
  return getPlanData(getCurrentPlan());
}

function isPremium() {
  const plan = getCurrentPlan();
  return plan === 'pro' || plan === 'elite';
}

function isElite() {
  return getCurrentPlan() === 'elite';
}

// ===== APPLY XP/COIN BONUS (called from addRewards wrapper) =====
// Pages should call premiumAddRewards instead of addRewards directly
// when a bonus is desired — or game.js auto-applies it
function getPremiumXpMultiplier() {
  return getCurrentPlanData().xpBonus;
}

function getPremiumCoinMultiplier() {
  return getCurrentPlanData().coinBonus;
}

// ===== INJECT PLAN BADGE IN SIDEBAR =====
function injectPlanBadge() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Remove stale badge
  const old = sidebar.querySelector('.plan-badge-wrap');
  if (old) old.remove();

  const plan = getCurrentPlan();
  if (plan === 'free') return;

  const wrap = document.createElement('div');
  wrap.className = 'plan-badge-wrap';

  const colors = { pro: '#F57F17', elite: '#6A1B9A' };
  const icons  = { pro: '⚡',       elite: '👑' };

  wrap.innerHTML = `
    <div class="plan-badge" style="background:${colors[plan]}">
      ${icons[plan]} ${plan.charAt(0).toUpperCase() + plan.slice(1)} Member
    </div>
  `;

  sidebar.appendChild(wrap);
}

// ===== SHOW UPGRADE PROMPT (called from locked content) =====
function showUpgradePrompt(featureName) {
  // Remove any existing prompt
  const existing = document.getElementById('upgradePrompt');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'upgradePrompt';
  overlay.className = 'upgrade-overlay';
  overlay.innerHTML = `
    <div class="upgrade-modal">
      <button class="upgrade-close" onclick="document.getElementById('upgradePrompt').remove()">
        <i class="fas fa-times"></i>
      </button>
      <div class="upgrade-icon">👑</div>
      <h2>Premium Feature</h2>
      <p><strong>${featureName}</strong> is available on Pro and Elite plans.</p>
      <p>Upgrade now to unlock exclusive quests, 2× XP, advanced analytics, and much more.</p>
      <div class="upgrade-actions">
        <a href="premium.html" class="upgrade-btn-primary">
          <i class="fas fa-crown"></i> View Plans
        </a>
        <button class="upgrade-btn-secondary"
                onclick="document.getElementById('upgradePrompt').remove()">
          Maybe Later
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
}

// ===== PURCHASE FLOW (called from premium.html) =====
function openPaymentModal(planId) {
  const plan = PLANS[planId];
  if (!plan || plan.price === 0) return;

  // Remove old modal
  const existing = document.getElementById('paymentModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.className = 'payment-overlay';
  modal.innerHTML = `
    <div class="payment-modal">
      <button class="payment-close" onclick="closePaymentModal()">
        <i class="fas fa-times"></i>
      </button>

      <div class="payment-header">
        <div class="payment-plan-icon">${planId === 'elite' ? '👑' : '⚡'}</div>
        <h2>Upgrade to ${plan.name}</h2>
        <p class="payment-price">$${plan.price} <span>/ ${plan.period}</span></p>
      </div>

      <form id="paymentForm" onsubmit="processPayment(event,'${planId}')">

        <div class="payment-field">
          <label>Cardholder Name</label>
          <div class="payment-input-wrap">
            <i class="fas fa-user"></i>
            <input type="text" id="cardName" placeholder="John Doe" required autocomplete="cc-name">
          </div>
        </div>

        <div class="payment-field">
          <label>Card Number</label>
          <div class="payment-input-wrap">
            <i class="fas fa-credit-card"></i>
            <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456"
                   maxlength="19" required autocomplete="cc-number"
                   oninput="formatCardNumber(this)">
          </div>
        </div>

        <div class="payment-row">
          <div class="payment-field">
            <label>Expiry</label>
            <div class="payment-input-wrap">
              <i class="fas fa-calendar"></i>
              <input type="text" id="cardExpiry" placeholder="MM / YY"
                     maxlength="7" required autocomplete="cc-exp"
                     oninput="formatExpiry(this)">
            </div>
          </div>
          <div class="payment-field">
            <label>CVV</label>
            <div class="payment-input-wrap">
              <i class="fas fa-lock"></i>
              <input type="text" id="cardCvv" placeholder="123"
                     maxlength="4" required autocomplete="cc-csc">
            </div>
          </div>
        </div>

        <div class="payment-summary">
          <span>Total today</span>
          <strong>$${plan.price} / ${plan.period}</strong>
        </div>

        <div id="paymentError" class="payment-error" style="display:none;"></div>

        <button type="submit" class="payment-submit" id="paySubmitBtn">
          <i class="fas fa-lock"></i> Pay $${plan.price} Securely
        </button>

        <p class="payment-secure">
          <i class="fas fa-shield-halved"></i>
          256-bit SSL encrypted &mdash; Cancel anytime
        </p>

      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closePaymentModal(); });
}

function closePaymentModal() {
  const m = document.getElementById('paymentModal');
  if (m) m.remove();
}

// ===== CARD FORMAT HELPERS =====
function formatCardNumber(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
  input.value = v;
}

// ===== PROCESS PAYMENT =====
function processPayment(e, planId) {
  e.preventDefault();

  const name   = document.getElementById('cardName').value.trim();
  const number = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const expiry = document.getElementById('cardExpiry').value.trim();
  const cvv    = document.getElementById('cardCvv').value.trim();
  const errEl  = document.getElementById('paymentError');
  const btn    = document.getElementById('paySubmitBtn');

  // Basic validation
  if (!name) { showPaymentError('Please enter the cardholder name.'); return; }
  if (number.length < 13) { showPaymentError('Please enter a valid card number.'); return; }
  if (!expiry || expiry.length < 7) { showPaymentError('Please enter a valid expiry date.'); return; }
  if (cvv.length < 3) { showPaymentError('Please enter a valid CVV.'); return; }

  // Disable button, show loading
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Processing…';
  if (errEl) errEl.style.display = 'none';

  // Simulate payment processing (1.8 s)
  setTimeout(() => {
    activatePlan(planId);
  }, 1800);
}

function showPaymentError(msg) {
  const el = document.getElementById('paymentError');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

// ===== ACTIVATE PLAN =====
function activatePlan(planId) {
  const plan = PLANS[planId];
  if (!plan) return;

  localStorage.setItem('premiumPlan', planId);
  localStorage.setItem('premiumSince', new Date().toISOString());

  closePaymentModal();
  showSuccessModal(plan);
  refreshPageAfterPurchase();
}

function showSuccessModal(plan) {
  const existing = document.getElementById('successModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'successModal';
  modal.className = 'payment-overlay';
  modal.innerHTML = `
    <div class="success-modal">
      <div class="success-icon">🎉</div>
      <h2>Welcome to ${plan.name}!</h2>
      <p>Your plan is now active. Enjoy your new features!</p>
      <ul class="success-perks">
        <li>✅ ${plan.xpBonus}× XP on every action</li>
        <li>✅ ${plan.coinBonus}× Eco Coins earned</li>
        ${plan.extraQuests ? '<li>✅ Premium quests unlocked</li>' : ''}
        ${plan.extraChallenges ? '<li>✅ Exclusive challenges unlocked</li>' : ''}
        ${plan.analytics ? '<li>✅ Advanced analytics enabled</li>' : ''}
        ${plan.prioritySupport ? '<li>✅ Priority support activated</li>' : ''}
      </ul>
      <button class="payment-submit" onclick="dismissSuccess()">
        <i class="fas fa-rocket"></i> Start Exploring
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

function dismissSuccess() {
  const m = document.getElementById('successModal');
  if (m) m.remove();
  // Reload to apply all unlocked content
  setTimeout(() => location.reload(), 100);
}

function refreshPageAfterPurchase() {
  // Badge refresh without full reload (fired right after modal closes)
  injectPlanBadge();
}

// ===== CANCEL PLAN =====
function cancelPlan() {
  if (!confirm('Cancel your Premium subscription? You will be downgraded to Free.')) return;
  localStorage.setItem('premiumPlan', 'free');
  localStorage.removeItem('premiumSince');
  showNotification('Plan cancelled. You are now on Free.', 'info');
  setTimeout(() => location.reload(), 1200);
}

// ===== AUTO-INIT ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  injectPlanBadge();
});
