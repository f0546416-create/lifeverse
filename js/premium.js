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

// ===== SAVED CARDS =====
// Cards are stored as an array in localStorage under 'savedCards'.
// We never store the CVV — only name, masked number, expiry, and last4.

function getSavedCards() {
  try {
    return JSON.parse(localStorage.getItem('savedCards') || '[]');
  } catch {
    return [];
  }
}

function saveCard(name, fullNumber, expiry) {
  const cards  = getSavedCards();
  const last4  = fullNumber.replace(/\s/g, '').slice(-4);
  const masked = '**** **** **** ' + last4;

  // Avoid duplicate (same last4 + expiry)
  const exists = cards.some(c => c.last4 === last4 && c.expiry === expiry);
  if (exists) return;

  cards.push({ name, masked, last4, expiry, id: Date.now() });
  localStorage.setItem('savedCards', JSON.stringify(cards));
}

function removeSavedCard(cardId) {
  const cards = getSavedCards().filter(c => c.id !== cardId);
  localStorage.setItem('savedCards', JSON.stringify(cards));
  // Refresh the picker inside the open modal
  const picker = document.getElementById('savedCardsPicker');
  if (picker) picker.replaceWith(buildSavedCardsPicker());
}

// ===== PURCHASE FLOW (called from premium.html) =====
// Builds the saved-card picker DOM node (re-used on delete)
function buildSavedCardsPicker() {
  const cards = getSavedCards();
  const wrap  = document.createElement('div');
  wrap.id = 'savedCardsPicker';

  if (!cards.length) return wrap; // empty — nothing to show

  wrap.className = 'saved-cards-section';
  wrap.innerHTML = `
    <div class="saved-cards-label">
      <i class="fas fa-wallet"></i> Saved Cards
    </div>
    <div class="saved-cards-list" id="savedCardsList">
      ${cards.map(c => `
        <div class="saved-card-item" data-id="${c.id}"
             onclick="fillFromSavedCard(${c.id})">
          <div class="saved-card-info">
            <span class="saved-card-icon"><i class="fas fa-credit-card"></i></span>
            <span class="saved-card-masked">${c.masked}</span>
            <span class="saved-card-exp">${c.expiry}</span>
          </div>
          <button type="button" class="saved-card-remove"
                  onclick="event.stopPropagation(); removeSavedCard(${c.id})"
                  title="Remove card">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('')}
    </div>
    <div class="saved-cards-divider">— or enter a new card —</div>
  `;
  return wrap;
}

// Auto-fill form from a saved card (CVV stays blank — user must re-enter)
function fillFromSavedCard(cardId) {
  const card = getSavedCards().find(c => c.id === cardId);
  if (!card) return;

  document.getElementById('cardName').value   = card.name;
  document.getElementById('cardNumber').value = card.masked;
  document.getElementById('cardExpiry').value = card.expiry;
  document.getElementById('cardCvv').focus();

  // Highlight selected card
  document.querySelectorAll('.saved-card-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.id == cardId);
  });
}

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

        <label class="save-card-check">
          <input type="checkbox" id="saveCardCheck"> Save this card for future payments
        </label>

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

  // Inject saved-card picker above the form fields
  const form = document.getElementById('paymentForm');
  form.insertBefore(buildSavedCardsPicker(), form.firstChild);
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

  const saveCard_checked = document.getElementById('saveCardCheck')?.checked;
  // Don't re-save a masked number (filled from saved card)
  const isMasked = number.startsWith('****');

  // Disable button, show loading
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Processing…';
  if (errEl) errEl.style.display = 'none';

  // Simulate payment processing (1.8 s)
  setTimeout(() => {
    if (saveCard_checked && !isMasked) {
      saveCard(name, number, expiry);
    }
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

// ===== CANCEL PLAN (legacy — kept for backward compat) =====
function cancelPlan() {
  openDowngradeModal('free');
}

// ===== DOWNGRADE MODAL =====
function openDowngradeModal(targetPlanId) {
  const existing = document.getElementById('downgradeModal');
  if (existing) existing.remove();

  const currentPlanId = getCurrentPlan();
  const currentPlan   = PLANS[currentPlanId];
  const targetPlan    = PLANS[targetPlanId] || PLANS.free;

  // ---- Refund calculation ----
  // We refund prorated unused days (max 30-day window).
  const since        = localStorage.getItem('premiumSince');
  const purchaseDate = since ? new Date(since) : null;
  const now          = new Date();

  let refundAmount   = 0;
  let refundNote     = '';
  let daysUsed       = 0;
  let daysRemaining  = 0;

  if (purchaseDate && currentPlan.price > 0) {
    daysUsed      = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, 30 - daysUsed);

    if (daysUsed <= 30) {
      // Prorated: price × (days remaining / 30), rounded to 2 dp
      refundAmount = parseFloat(((currentPlan.price * daysRemaining) / 30).toFixed(2));
      refundNote   = `You used ${daysUsed} of 30 days — ${daysRemaining} days remaining.`;
    } else {
      refundNote = 'Your 30-day refund window has passed. No refund is available.';
    }
  } else if (!purchaseDate) {
    refundNote = 'No purchase date found. Refund cannot be calculated.';
  }

  const targetLabel  = targetPlan.name;
  const refundLine   = refundAmount > 0
    ? `<div class="downgrade-refund-amount">$${refundAmount.toFixed(2)} <span>refund</span></div>
       <p class="downgrade-refund-note">${refundNote}</p>
       <p class="downgrade-refund-note">Refund will be credited to your original payment method within 5–10 business days.</p>`
    : `<p class="downgrade-refund-note no-refund">${refundNote}</p>`;

  const lostFeatures = currentPlanId === 'elite'
    ? ['2× XP & Coin multiplier', 'Elite leaderboard access', 'Monthly eco report', 'Priority support', 'Exclusive elite quests & challenges']
    : ['1.5× XP & Coin bonus', 'Pro exclusive quests & challenges', 'Advanced analytics', 'AI bill analysis', 'Pro profile badge'];

  const featuresHtml = lostFeatures
    .map(f => `<li><i class="fas fa-times"></i> ${f}</li>`)
    .join('');

  const overlay = document.createElement('div');
  overlay.id        = 'downgradeModal';
  overlay.className = 'payment-overlay';
  overlay.innerHTML = `
    <div class="downgrade-modal">
      <button class="payment-close" onclick="closeDowngradeModal()">
        <i class="fas fa-times"></i>
      </button>

      <div class="downgrade-header">
        <div class="downgrade-icon">⬇️</div>
        <h2>Downgrade to ${targetLabel}</h2>
        <p>You are about to lose access to the following features:</p>
      </div>

      <ul class="downgrade-lost-features">
        ${featuresHtml}
      </ul>

      <div class="downgrade-refund-box">
        <div class="downgrade-refund-label">
          <i class="fas fa-rotate-left"></i> Refund Estimate
        </div>
        ${refundLine}
      </div>

      <div class="downgrade-actions">
        <button class="downgrade-confirm-btn" onclick="processDowngrade('${targetPlanId}', ${refundAmount})">
          <i class="fas fa-arrow-down"></i> Confirm Downgrade
        </button>
        <button class="downgrade-cancel-btn" onclick="closeDowngradeModal()">
          Keep My ${currentPlan.name} Plan
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeDowngradeModal(); });
}

function closeDowngradeModal() {
  const m = document.getElementById('downgradeModal');
  if (m) m.remove();
}

// ===== PROCESS DOWNGRADE =====
function processDowngrade(targetPlanId, refundAmount) {
  closeDowngradeModal();

  // Apply the downgrade
  localStorage.setItem('premiumPlan', targetPlanId);
  localStorage.removeItem('premiumSince');

  // Show refund confirmation
  showRefundModal(targetPlanId, refundAmount);
}

// ===== REFUND CONFIRMATION MODAL =====
function showRefundModal(targetPlanId, refundAmount) {
  const existing = document.getElementById('refundModal');
  if (existing) existing.remove();

  const hasRefund = refundAmount > 0;

  const overlay = document.createElement('div');
  overlay.id        = 'refundModal';
  overlay.className = 'payment-overlay';
  overlay.innerHTML = `
    <div class="success-modal refund-modal">
      <div class="success-icon">${hasRefund ? '💸' : '✅'}</div>
      <h2>${hasRefund ? 'Refund Issued!' : 'Plan Downgraded'}</h2>
      ${hasRefund
        ? `<p>A refund of <strong>$${refundAmount.toFixed(2)}</strong> has been issued to your original payment method.</p>
           <p class="refund-eta">Allow 5–10 business days for the funds to appear.</p>`
        : `<p>Your plan has been downgraded to <strong>Free</strong>.</p>
           <p class="refund-eta">Your eco progress, XP, and coins are all kept.</p>`
      }
      <ul class="success-perks">
        <li>✅ All your XP &amp; Eco Coins are kept</li>
        <li>✅ Completed challenges stay on record</li>
        <li>✅ Your profile and streak are preserved</li>
      </ul>
      <button class="payment-submit" onclick="dismissRefundModal()">
        <i class="fas fa-check"></i> Got It
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function dismissRefundModal() {
  const m = document.getElementById('refundModal');
  if (m) m.remove();
  setTimeout(() => location.reload(), 100);
}

// ===== AUTO-INIT ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  injectPlanBadge();
});
