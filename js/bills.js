/* =============================================
   LIFEVERSE — BILLS SYSTEM
   js/bills.js
   Sends bill image to localhost:3000/analyze
   Falls back to estimated values if server down
============================================= */

document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  loadHistory();
});

// ===== UPLOAD ZONE DRAG & DROP =====
function setupUploadZone() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('billImage');
  if (!zone || !input) return;

  // Show filename on selection
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    zone.classList.add('has-file');
    document.getElementById('uploadLabel').textContent = '📄 ' + file.name;
  });

  // Drag & drop
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
    // Assign to input via DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    zone.classList.add('has-file');
    document.getElementById('uploadLabel').textContent = '📄 ' + file.name;
  });
}

// ===== ANALYZE BILL =====
async function analyzeBill() {
  const input = document.getElementById('billImage');
  if (!input || !input.files.length) {
    showNotification('Please select a bill file first.', 'error');
    return;
  }

  const btn = document.getElementById('analyzeBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="analyzing-spinner"></span> Analyzing…';
  }

  setResult('usage',    'Analyzing…');
  setResult('cost',     'Analyzing…');
  setResult('carbon',   'Analyzing…');
  setResult('ecoScore', 'Analyzing…');
  setTips(['🤖 AI is reading your bill…']);

  try {
    const formData = new FormData();
    formData.append('bill', input.files[0]);

    const response = await fetch('http://localhost:3000/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Server error ' + response.status);

    const raw  = await response.text();
    const data = JSON.parse(raw);

    const usage  = parseFloat(data.usage)  || 0;
    const cost   = parseFloat(data.cost)   || 0;
    const carbon = parseFloat(data.carbon) || 0;

    setResult('usage',  data.usage  + ' kWh');
    setResult('cost',   data.cost   + ' ' + (data.currency || ''));
    setResult('carbon', data.carbon + ' kg CO₂');

    // Eco score: lower carbon = better
    const score = Math.max(0, Math.min(100, Math.round(100 - carbon)));
    setResult('ecoScore', score + ' / 100');

    // Progress bar
    const prog = document.getElementById('energyProgress');
    const txt  = document.getElementById('progressText');
    if (prog) prog.value = score;
    if (txt)  txt.textContent = score + '%';

    // Tips
    if (Array.isArray(data.tips) && data.tips.length) {
      setTips(data.tips);
    }

    // Save to history
    saveHistory({
      date:  new Date().toLocaleDateString(),
      usage: data.usage + ' kWh',
      cost:  data.cost  + ' ' + (data.currency || ''),
      carbon: data.carbon + ' kg',
    });

    showNotification('✅ Bill analyzed successfully!');

  } catch (err) {
    console.warn('Server unavailable, using estimation fallback.', err);
    useFallback(input.files[0].name);
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-magnifying-glass"></i> Analyze Bill';
  }
}

// ===== FALLBACK (server offline) =====
function useFallback(filename) {
  // Show a notice
  const card = document.querySelector('.bill-upload-card');
  if (card && !card.querySelector('.server-notice')) {
    const notice = document.createElement('div');
    notice.className = 'server-notice';
    notice.innerHTML = '<i class="fas fa-triangle-exclamation"></i> AI server offline — showing estimated values. Run <code>npm start</code> in the project folder for full analysis.';
    card.prepend(notice);
  }

  const usage  = Math.floor(Math.random() * 300) + 150;
  const cost   = (usage * 0.12).toFixed(2);
  const carbon = (usage * 0.4).toFixed(1);
  const score  = Math.max(20, Math.min(95, Math.round(100 - carbon / 4)));

  setResult('usage',  usage  + ' kWh');
  setResult('cost',   cost   + ' USD');
  setResult('carbon', carbon + ' kg CO₂');
  setResult('ecoScore', score + ' / 100');

  const prog = document.getElementById('energyProgress');
  const txt  = document.getElementById('progressText');
  if (prog) prog.value = score;
  if (txt)  txt.textContent = score + '%';

  setTips([
    '💡 Switch to LED bulbs — they use 80% less energy.',
    '🔌 Unplug devices on standby to cut phantom power drain.',
    '🌡️ Lower your thermostat by 1°C to save up to 10% on heating.',
  ]);

  saveHistory({
    date:  new Date().toLocaleDateString(),
    usage: usage + ' kWh',
    cost:  cost  + ' USD (est.)',
    carbon: carbon + ' kg',
  });

  showNotification('⚠️ Estimated values shown — AI server offline.', 'info');
}

// ===== HELPERS =====
function setResult(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setTips(tipsArray) {
  const ul = document.getElementById('tips');
  if (!ul) return;
  ul.innerHTML = tipsArray.map(t =>
    `<li><i class="fas fa-leaf"></i> ${t}</li>`
  ).join('');
}

// ===== HISTORY =====
function saveHistory(entry) {
  const history = JSON.parse(localStorage.getItem('billHistory') || '[]');
  history.unshift(entry); // newest first
  if (history.length > 10) history.pop(); // keep last 10
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
      <span>📅 ${h.date} — ${h.usage}</span>
      <span class="history-badge">${h.cost}</span>
    </li>
  `).join('');
}

function clearHistory() {
  if (!confirm('Clear all bill history?')) return;
  localStorage.removeItem('billHistory');
  loadHistory();
  showNotification('🗑️ Bill history cleared.', 'info');
}
