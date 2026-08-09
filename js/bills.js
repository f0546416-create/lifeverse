/* =============================================
   LIFEVERSE — BILLS SYSTEM
   js/bills.js

   Sends the uploaded bill to localhost:3000/analyze
   (Gemini Vision AI). Displays real price, real
   currency, bill details and eco tips.
   Falls back to estimation if server is offline.
============================================= */

document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  loadHistory();
});

// =============================================
//  UPLOAD ZONE — click + drag & drop
// =============================================
function setupUploadZone() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('billImage');
  if (!zone || !input) return;

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    zone.classList.add('has-file');
    document.getElementById('uploadLabel').textContent = '📄 ' + file.name;
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('has-file');
  });

  zone.addEventListener('dragleave', () => {
    if (!input.files.length) zone.classList.remove('has-file');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    zone.classList.add('has-file');
    document.getElementById('uploadLabel').textContent = '📄 ' + file.name;
  });
}

// =============================================
//  ANALYZE BILL — main entry point
// =============================================
async function analyzeBill() {
  const input = document.getElementById('billImage');
  if (!input || !input.files.length) {
    showNotification('Please select a bill file first.', 'error');
    return;
  }

  const btn = document.getElementById('analyzeBtn');
  setAnalyzing(btn, true);

  // Reset all result fields to scanning state
  setResult('usage',    '🔍 Scanning…');
  setResult('cost',     '🔍 Scanning…');
  setResult('currency', '🔍 Scanning…');
  setResult('carbon',   '🔍 Scanning…');
  setResult('ecoScore', '🔍 Scanning…');
  setTips(['🤖 Gemini AI is reading your bill — this takes a few seconds…']);
  hideBillDetails();

  try {
    const formData = new FormData();
    formData.append('bill', input.files[0]);

    const response = await fetch('http://localhost:3000/analyze', {
      method: 'POST',
      body:   formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Server returned ' + response.status);
    }

    const data = await response.json();
    displayResults(data);

  } catch (err) {
    console.warn('AI server error, using estimation fallback.', err);
    removeServerNotice();
    showServerNotice(err.message || 'Server unavailable');
    useFallback();
  }

  setAnalyzing(btn, false);
}

// =============================================
//  DISPLAY REAL AI RESULTS
// =============================================
function displayResults(data) {
  const usage         = data.usage         || '0';
  const cost          = data.cost          || '0';
  const currencyCode  = data.currencyCode  || '';
  const currencySymbol= data.currencySymbol|| currencyCode;
  const formattedCost = data.formattedCost || (currencySymbol + cost);
  const carbon        = data.carbon        || '0';
  const ecoScore      = data.ecoScore      || '0';

  // ---- Core results ----
  setResult('usage',    usage + ' kWh');
  setResult('cost',     formattedCost);          // e.g.  "EGP 145.75"
  setResult('currency', currencyCode || '—');    // e.g.  "EGP"
  setResult('carbon',   carbon + ' kg CO₂');
  setResult('ecoScore', ecoScore + ' / 100');

  // ---- Progress bar ----
  const score = parseInt(ecoScore) || 0;
  const prog  = document.getElementById('energyProgress');
  const txt   = document.getElementById('progressText');
  if (prog) prog.value       = score;
  if (txt)  txt.textContent  = score + '%';

  // ---- Colour the cost green/amber/red based on eco score ----
  const costEl = document.getElementById('cost');
  if (costEl) {
    costEl.style.color = score >= 70 ? '#2E7D32'
                        : score >= 40 ? '#F57F17'
                        : '#C62828';
  }

  // ---- Tips ----
  if (Array.isArray(data.tips) && data.tips.length) {
    setTips(data.tips);
  }

  // ---- Bill details panel ----
  showBillDetails(data.billDetails || {});

  // ---- History ----
  saveHistory({
    date:     new Date().toLocaleDateString(),
    usage:    usage + ' kWh',
    cost:     formattedCost,
    carbon:   carbon + ' kg',
    currency: currencyCode,
  });

  removeServerNotice();
  showNotification('✅ Bill scanned — real price: ' + formattedCost);
}

// =============================================
//  BILL DETAILS PANEL
// =============================================
function showBillDetails(details) {
  const panel = document.getElementById('billDetailsPanel');
  if (!panel) return;

  const rows = [
    { label: '🏢 Provider',      value: details.provider    },
    { label: '📅 Billing Period', value: details.period      },
    { label: '🔢 Account No.',    value: details.accountNo   },
    { label: '📆 Due Date',       value: details.dueDate     },
    { label: '📊 Meter Reading',  value: details.meterReading},
  ].filter(r => r.value && r.value.trim());

  if (!rows.length) {
    panel.style.display = 'none';
    return;
  }

  const inner = document.getElementById('billDetailsRows');
  if (inner) {
    inner.innerHTML = rows.map(r => `
      <div class="result-row">
        <span>${r.label}</span>
        <strong>${r.value}</strong>
      </div>`).join('');
  }

  panel.style.display = 'block';
}

function hideBillDetails() {
  const panel = document.getElementById('billDetailsPanel');
  if (panel) panel.style.display = 'none';
}

// =============================================
//  FALLBACK — server offline
// =============================================
function useFallback() {
  const usage   = Math.floor(Math.random() * 300) + 150;
  const cost    = (usage * 0.12).toFixed(2);
  const carbon  = (usage * 0.4).toFixed(1);
  const score   = Math.max(20, Math.min(95, Math.round(100 - parseFloat(carbon) / 4)));

  setResult('usage',    usage  + ' kWh');
  setResult('cost',     '$' + cost + ' (estimated)');
  setResult('currency', 'USD (est.)');
  setResult('carbon',   carbon + ' kg CO₂');
  setResult('ecoScore', score  + ' / 100');

  const prog = document.getElementById('energyProgress');
  const txt  = document.getElementById('progressText');
  if (prog) prog.value      = score;
  if (txt)  txt.textContent = score + '%';

  setTips([
    '💡 Switch to LED bulbs — they use 80% less energy.',
    '🔌 Unplug standby devices to cut phantom power drain.',
    '🌡️ Lower your thermostat by 1 °C to save up to 10% on heating.',
  ]);

  hideBillDetails();

  saveHistory({
    date:    new Date().toLocaleDateString(),
    usage:   usage  + ' kWh',
    cost:    '$' + cost + ' (est.)',
    carbon:  carbon + ' kg',
    currency:'USD',
  });
}

// =============================================
//  SERVER NOTICE BANNER
// =============================================
function showServerNotice(reason) {
  const card = document.querySelector('.bill-upload-card');
  if (!card || card.querySelector('.server-notice')) return;

  const notice = document.createElement('div');
  notice.className = 'server-notice';
  notice.innerHTML = `
    <i class="fas fa-triangle-exclamation"></i>
    AI server offline — showing estimated values.
    Run <code>npm start</code> in the project folder for real bill scanning.
    <small style="display:block;margin-top:4px;opacity:0.7;">${reason}</small>`;
  card.prepend(notice);
}

function removeServerNotice() {
  document.querySelectorAll('.server-notice').forEach(n => n.remove());
}

// =============================================
//  BUTTON STATE
// =============================================
function setAnalyzing(btn, analyzing) {
  if (!btn) return;
  btn.disabled = analyzing;
  btn.innerHTML = analyzing
    ? '<span class="analyzing-spinner"></span> Analyzing…'
    : '<i class="fas fa-magnifying-glass"></i> Analyze Bill';
}

// =============================================
//  GENERIC HELPERS
// =============================================
function setResult(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setTips(arr) {
  const ul = document.getElementById('tips');
  if (!ul) return;
  ul.innerHTML = arr.map(t =>
    `<li><i class="fas fa-leaf"></i> ${t}</li>`
  ).join('');
}

// =============================================
//  HISTORY
// =============================================
function saveHistory(entry) {
  const history = JSON.parse(localStorage.getItem('billHistory') || '[]');
  history.unshift(entry);
  if (history.length > 10) history.pop();
  localStorage.setItem('billHistory', JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const ul = document.getElementById('history');
  if (!ul) return;

  const history = JSON.parse(localStorage.getItem('billHistory') || '[]');
  if (!history.length) {
    ul.innerHTML = '<li class="history-empty">No bills uploaded yet.</li>';
    return;
  }

  ul.innerHTML = history.map(h => `
    <li>
      <span>📅 ${h.date} &mdash; ${h.usage}</span>
      <span class="history-badge">${h.cost}</span>
    </li>`).join('');
}

function clearHistory() {
  if (!confirm('Clear all bill history?')) return;
  localStorage.removeItem('billHistory');
  loadHistory();
  showNotification('🗑️ Bill history cleared.', 'info');
}
