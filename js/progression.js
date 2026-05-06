const BELT_COLORS = {
  'Yellow Stripe': '#E8C800',
  'Yellow':        '#FFD700',
  'Gold':          '#D4A017',
  'Orange':        '#E85D04',
  'Green':         '#16A34A',
  'Blue':          '#2563EB',
  'Purple':        '#7C3AED',
  'Red':           '#DC2626',
  'Brown':         '#A16207',
  'Gray':          '#71717A',
  '1st Dan Black': '#E85D04',
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry = {};
    headers.forEach((header, i) => {
      const raw = (values[i] || '').trim();
      entry[header] = raw ? raw.split('|').map(v => v.trim()).filter(Boolean) : [];
    });
    return entry;
  }).filter(e => e['beltName'] && e['beltName'].length > 0);
}

function renderTags(items) {
  if (!items || items.length === 0) return '<span class="req-empty">—</span>';
  return items.map(item => `<span class="req-tag">${item}</span>`).join('');
}

function renderReqSection(label, items) {
  return `
    <div class="req-section">
      <div class="req-label">${label}</div>
      <div class="req-items">${renderTags(items)}</div>
    </div>`;
}

function renderCard(belt, index) {
  const name       = belt['beltName'][0] || '';
  const color      = BELT_COLORS[name] || '#888888';
  const evalTime   = (belt['evaluation time'] || [])[0] || '';
  const timeReq    = (belt['time'] || [])[0] || '';
  const tourns     = (belt['tournaments'] || [])[0] || '';
  const breaking   = (belt['breaking'] || [])[0] || '';
  const run        = (belt['run'] || [])[0] || '';
  const pushups    = (belt['pushups/situps'] || [])[0] || '';
  const kumite     = (belt['kumite'] || [])[0] || '';
  const additional = belt['additional requirements'] || [];

  const hasPhysical   = breaking || run || pushups;
  const hasAdditional = additional.length > 0;

  const tournLabel = tourns === '1' ? '1 tournament' : tourns ? `${tourns} tournaments` : '';

  return `
<div class="belt-card" id="belt-${index}" style="--belt-color:${color};">
  <div class="belt-card-header" onclick="toggleBeltCard(${index})">
    <div class="belt-card-left">
      <div class="belt-swatch"></div>
      <div>
        <div class="belt-name">${name}</div>
        ${evalTime ? `<div class="belt-eval-time"><i class="fa-regular fa-clock"></i> ${evalTime} evaluation</div>` : ''}
      </div>
    </div>
    <div class="belt-card-right">
      ${timeReq    ? `<span class="belt-badge"><i class="fa-regular fa-calendar"></i> ${timeReq}</span>` : ''}
      ${tournLabel ? `<span class="belt-badge"><i class="fa-solid fa-trophy"></i> ${tournLabel}</span>` : ''}
      <span class="belt-toggle"><i class="fa-solid fa-chevron-down"></i></span>
    </div>
  </div>
  <div class="belt-card-body">
    <div class="req-grid">
      ${renderReqSection('Kata',             belt['kata'])}
      ${renderReqSection('Defenses & Drills', belt['defenses/drills'])}
      ${renderReqSection('Kobudo',           belt['kobudo'])}
      ${renderReqSection('Strikes',          belt['strikes'])}
      ${renderReqSection('Blocks',           belt['blocks'])}
      ${renderReqSection('Kicks',            belt['kicks'])}
      ${renderReqSection('Stances',          belt['stances'])}
      ${kumite ? renderReqSection('Kumite Focus', [kumite]) : renderReqSection('Kumite Focus', [])}
    </div>
    ${hasPhysical ? `
    <div class="physical-requirements">
      <div class="physical-header"><i class="fa-solid fa-dumbbell"></i>&nbsp; Physical Requirements</div>
      <div class="physical-grid">
        ${breaking ? `<div class="physical-item"><span class="physical-label">Breaking</span><span class="physical-value">${breaking} board${breaking !== '1' ? 's' : ''}</span></div>` : ''}
        ${run      ? `<div class="physical-item"><span class="physical-label">Run</span><span class="physical-value">${run}</span></div>` : ''}
        ${pushups  ? `<div class="physical-item"><span class="physical-label">Pushups / Situps</span><span class="physical-value">${pushups} each</span></div>` : ''}
      </div>
    </div>` : ''}
    ${hasAdditional ? `
    <div class="additional-requirements">
      <div class="additional-header"><i class="fa-solid fa-circle-info"></i>&nbsp; Additional Requirements</div>
      <div class="additional-items">
        ${additional.map(r => `<span class="additional-tag">${r}</span>`).join('')}
      </div>
    </div>` : ''}
  </div>
</div>`;
}

function renderOverview(belts) {
  const container = document.getElementById('belt-overview');
  if (!container) return;
  container.innerHTML = belts.map((belt, i) => {
    const name  = belt['beltName'][0] || '';
    const color = BELT_COLORS[name] || '#888888';
    return `<button class="belt-pill"
      style="background:${color}18; border-color:${color}44; color:${color};"
      onclick="jumpToBelt(${i})"
      title="Jump to ${name}">
      <span class="belt-pip" style="background:${color};"></span>${name}
    </button>`;
  }).join('');
}

function toggleBeltCard(index) {
  document.getElementById(`belt-${index}`).classList.toggle('open');
}

function jumpToBelt(index) {
  const card = document.getElementById(`belt-${index}`);
  if (!card) return;
  card.classList.add('open');
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

async function initProgression() {
  const container = document.getElementById('belt-progression');
  if (!container) return;

  try {
    const res = await fetch('progression.csv');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text  = await res.text();
    const belts = parseCSV(text);

    renderOverview(belts);

    container.innerHTML = `<div class="belt-cards">${belts.map(renderCard).join('')}</div>`;

    // Open the first card by default
    const first = document.getElementById('belt-0');
    if (first) first.classList.add('open');

  } catch (err) {
    container.innerHTML = `
      <div class="prog-error">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p style="margin-bottom:.5rem;">Could not load <code>progression.csv</code>.</p>
        <p style="font-size:.875rem;">This page requires a local web server. Open with <strong>VS Code Live Server</strong> or run:<br>
        <code>python -m http.server 8000</code></p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', initProgression);
