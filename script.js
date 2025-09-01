/* script.js — Versão final (opções do select mostram apenas 'x-x-x-x (Estilo)',
   detalhes e 'Base' movidos para title). Mantém reservas com headers, offsets, spread/repulsão,
   sync mental/line, reset, export e responsividade.
*/

/* DOM hooks */
const field = document.getElementById('field');
const viewSelect = document.getElementById('viewSelect');
const mentalSelect = document.getElementById('mentalSelect');
const lineSelect = document.getElementById('lineSelect');
const resetBtn = document.getElementById('resetBtn');
const offsetListEl = document.getElementById('offsetList');

/* map de posições desenhadas (usado para offsets) */
const displayedPositions = {}; // { "Name": {x:..., y:...} }

/* ---------- utilitários ---------- */
function coordToPixels(xPct, yPct) {
  const rect = field.getBoundingClientRect();
  return {
    left: (xPct / 100) * rect.width,
    top: ((100 - yPct) / 100) * rect.height,
    rect
  };
}
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

/* compressão/ spread não-linear — abre mais em telas maiores */
function computeSpreadFactor(rectWidth){
  const base = 0.28;
  const ratio = rectWidth / 1080;
  const factor = base * (0.9 + 0.6 * Math.log(1 + ratio));
  return clamp(factor, 0.10, 0.75);
}

/* ---------- reserveArea (criação e estilo inline para garantir) ---------- */
function ensureReserveArea(){
  let reserveArea = document.getElementById('reserveArea');
  if(!reserveArea){
    reserveArea = document.createElement('div');
    reserveArea.id = 'reserveArea';
    Object.assign(reserveArea.style, {
      position: 'absolute',
      left: '2%',
      top: '5%',
      width: '16%',
      height: '90%',
      background: 'linear-gradient(180deg, rgba(10,30,18,0.28), rgba(8,20,12,0.22))',
      borderRadius: '10px',
      padding: '6px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridAutoRows: '40px',
      gap: '6px',
      overflowY: 'auto',
      zIndex: 60,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
      pointerEvents: 'auto'
    });
    field.appendChild(reserveArea);
  }
  return reserveArea;
}

/* makeReservePill: cria botão estilizado para reservas (usado em renderReserves) */
function makeReservePill(name, role){
  const pill = document.createElement('button');
  pill.className = 'reserve-pill';
  pill.type = 'button';
  pill.title = name;
  Object.assign(pill.style, { outline: 'none' });
  // color by role (kept inline to ensure high contrast)
  const r = (role||'').toUpperCase();
  if(r.startsWith('G')) pill.style.background = '#2b7d2f';
  else if(r.includes('DEF') || r.includes('ZAG')) pill.style.background = '#2e9b63';
  else if(r.includes('MID') || r.includes('VOL') || r.includes('MEI') || r.includes('MC')) pill.style.background = '#ffb547';
  else pill.style.background = '#ff3b3b';
  pill.textContent = name.split(' ')[0];
  pill.addEventListener('mouseenter', ()=> pill.style.boxShadow = '0 8px 22px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,255,255,0.03)');
  pill.addEventListener('mouseleave', ()=> pill.style.boxShadow = 'none');
  pill.addEventListener('click', ()=> {
    // toggle selection
    const all = pill.parentElement.querySelectorAll('.reserve-pill');
    all.forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
  });
  return pill;
}

/* ---------- pitch skeleton ---------- */
function initPitch(){
  // remove previous field elements (but keep reserveArea if exists)
  field.querySelectorAll('.field-element').forEach(e=>e.remove());
  // center rect
  const cr = document.createElement('div'); cr.className='center-rect field-element'; field.appendChild(cr);
  // lines
  const topMargin = 6, bottomMargin = 6;
  const usable = 100 - topMargin - bottomMargin;
  for(let i=1;i<10;i++){
    const line = document.createElement('div'); line.className='zone-line field-element';
    line.style.top = (topMargin + usable*(i/10)) + '%';
    field.appendChild(line);
  }
  // guide
  const guide = document.createElement('div'); guide.className='center-guide field-element'; field.appendChild(guide);
  // ensure reserve area exists
  ensureReserveArea();
}

/* ---------- lógica de seleção starters/reserves (mantive heurística) ---------- */
function splitStartersAndReserves(formation){
  const formationPlayers = formation.players || {};
  const keys = Object.keys(formationPlayers);
  const allSquadKeys = Object.keys(squad);

  if(keys.length > 11){
    // choose 1 GK + top 10 by y (descending)
    const gkCandidate = keys.find(k => ((formationPlayers[k].role || (squad[k] && squad[k].role) || '').toUpperCase().startsWith('G'))) || keys.find(k => (squad[k] && (squad[k].role||'').toUpperCase().startsWith('G')));
    const others = keys.filter(k => k !== gkCandidate);
    others.sort((a,b)=>{
      const ay = (formationPlayers[a].y ?? (squad[a] && squad[a].y) ?? 50);
      const by = (formationPlayers[b].y ?? (squad[b] && squad[b].y) ?? 50);
      return by - ay;
    });
    const top10 = others.slice(0,10);
    const starters = {};
    if(gkCandidate) starters[gkCandidate] = formationPlayers[gkCandidate] || squad[gkCandidate];
    top10.forEach(k => starters[k] = formationPlayers[k] || squad[k]);
    const reserves = {};
    keys.concat(allSquadKeys).forEach(k=>{
      if(!starters[k]) reserves[k] = formationPlayers[k] || squad[k];
    });
    return { starters, reserves };
  } else {
    const starters = {};
    keys.forEach(k => starters[k] = formationPlayers[k] || squad[k]);
    const reserves = {};
    allSquadKeys.forEach(k => { if(!starters[k]) reserves[k] = squad[k]; });
    return { starters, reserves };
  }
}

/* ---------- render starters on field (spread + repulsion) ---------- */
function clearDisplayedPositions(){ for(const k in displayedPositions) delete displayedPositions[k]; }

function renderStartersOnField(starters){
  // remove previous on-field players
  field.querySelectorAll('.player.on-field').forEach(e=>e.remove());
  clearDisplayedPositions();

  const rect = field.getBoundingClientRect();
  const spreadFactor = computeSpreadFactor(rect.width);
  const baseFieldWidth = 1080;
  const scale = Math.max(0.55, rect.width / baseFieldWidth);
  const playerSize = Math.max(30, Math.round(72 * scale));

  const temp = [];
  Object.keys(starters).forEach(name=>{
    const p = starters[name];
    const rawRole = (p.role || (squad[name] && squad[name].role) || 'ATT').toUpperCase();
    let x = (typeof p.x === 'number') ? p.x : (squad[name] && squad[name].x) || 50;
    let y = (typeof p.y === 'number') ? p.y : (squad[name] && squad[name].y) || 50;
    const delta = x - 50;
    const displayX = clamp(50 + delta * spreadFactor, 4, 96);
    temp.push({ name, x: displayX, y, role: rawRole });
  });

  // repulsion
  function xpctToPx(xpct){ return (xpct/100)*rect.width; }
  const minPx = Math.max(36, playerSize * 0.9);
  for(let iter=0; iter<6; iter++){
    let moved = false;
    for(let i=0;i<temp.length;i++){
      for(let j=i+1;j<temp.length;j++){
        const a=temp[i], b=temp[j];
        const ay = ((100 - a.y)/100) * rect.height;
        const by = ((100 - b.y)/100) * rect.height;
        if(Math.abs(ay - by) > playerSize*1.2) continue;
        const ax = xpctToPx(a.x), bx = xpctToPx(b.x);
        const diff = bx - ax;
        const abs = Math.abs(diff);
        if(abs < minPx){
          const push = (minPx - abs)/2 + 1;
          const dir = diff >= 0 ? 1 : -1;
          const pushPct = (push / rect.width) * 100;
          a.x = clamp(a.x - dir*pushPct, 4, 96);
          b.x = clamp(b.x + dir*pushPct, 4, 96);
          moved = true;
        }
      }
    }
    if(!moved) break;
  }

  // render
  temp.forEach(item=>{
    const pos = coordToPixels(item.x, item.y);
    const el = document.createElement('div');
    el.className = 'player on-field';
    if(item.role.startsWith('G')) el.classList.add('keeper');
    else if(item.role.includes('DEF') || item.role.includes('ZAG')) el.classList.add('def');
    else if(item.role.includes('MID') || item.role.includes('VOL') || item.role.includes('MEI') || item.role.includes('MC')) el.classList.add('mid');
    else el.classList.add('att');

    el.style.width = playerSize + 'px';
    el.style.height = playerSize + 'px';
    el.style.left = Math.round(pos.left) + 'px';
    el.style.top = Math.round(pos.top) + 'px';
    el.dataset.player = item.name;

    const nameEl = document.createElement('div'); nameEl.className='name'; nameEl.textContent = item.name.split(' ')[0];
    const tag = document.createElement('div'); tag.className='tag'; tag.textContent = `${Math.round(item.x)}, ${Math.round(item.y)}`;
    el.appendChild(nameEl); el.appendChild(tag);
    field.appendChild(el);

    displayedPositions[item.name] = { x: Math.round(item.x), y: Math.round(item.y) };
  });
}

/* ---------- renderReserves (com labels por bucket) ---------- */
function renderReserves(reserves){
  const reserveArea = ensureReserveArea();
  reserveArea.innerHTML = '';

  const buckets = { GK: [], DEF: [], MID: [], ATT: [] };
  Object.keys(reserves).forEach(name => {
    const raw = (reserves[name].role || (squad[name] && squad[name].role) || '').toUpperCase();
    if(raw.startsWith('G')) buckets.GK.push(name);
    else if(raw.includes('DEF') || raw.includes('ZAG') || raw.includes('CB') || raw.includes('LB') || raw.includes('RB')) buckets.DEF.push(name);
    else if(raw.includes('MID') || raw.includes('VOL') || raw.includes('MEI') || raw.includes('MC')) buckets.MID.push(name);
    else buckets.ATT.push(name);
  });

  const order = ['GK','DEF','MID','ATT'];
  order.forEach(bucket=>{
    const arr = buckets[bucket];
    if(!arr || arr.length === 0) return;
    const label = document.createElement('div');
    label.className = 'reserve-label ' + (bucket === 'GK' ? 'gk' : bucket === 'DEF' ? 'def' : bucket === 'MID' ? 'mid' : 'att');
    label.textContent = bucket;
    reserveArea.appendChild(label);

    arr.forEach(name=>{
      const role = reserves[name].role || (squad[name] && squad[name].role) || '';
      const pill = makeReservePill(name, role);
      reserveArea.appendChild(pill);
      const fieldRect = field.getBoundingClientRect();
      const areaRect = reserveArea.getBoundingClientRect();
      const approxXpct = ((areaRect.left + areaRect.width/2) - fieldRect.left) / fieldRect.width * 100;
      displayedPositions[name] = { x: Math.round(approxXpct), y: 50 };
    });
  });

  // update Y after layout
  requestAnimationFrame(()=>{
    const areaRect = reserveArea.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    Array.from(reserveArea.children).forEach(child=>{
      if(child.classList && child.classList.contains('reserve-pill')){
        const rectChild = child.getBoundingClientRect();
        const centerY = (rectChild.top + rectChild.bottom) / 2;
        const approxYpct = clamp((1 - (centerY - fieldRect.top) / fieldRect.height) * 100, 4, 96);
        const name = child.title || child.textContent;
        if(name && displayedPositions[name]) displayedPositions[name].y = Math.round(approxYpct);
      }
    });
  });
}

/* ---------- show offsets from displayed positions ---------- */
function showOffsetsFromDisplayed(formationKey){
  offsetListEl.innerHTML = '';
  const baseRef = tactics.principal.players;
  Object.keys(squad).forEach(name=>{
    const baseEntry = squad[name];
    const baseX = baseEntry.base ? baseEntry.base[0] : (baseEntry.x ?? 50);
    const baseY = baseEntry.base ? baseEntry.base[1] : (baseEntry.y ?? 50);
    const disp = displayedPositions[name];
    let dx = 0, dy = 0;
    if(disp){
      dx = Math.round(disp.x - baseX);
      dy = Math.round(disp.y - baseY);
    } else {
      const formation = tactics[formationKey] || tactics.principal;
      const p = formation.players[name];
      if(p){ dx = Math.round((p.x ?? baseX) - baseX); dy = Math.round((p.y ?? baseY) - baseY); }
    }
    const dxs = dx>0? `+${dx}` : `${dx}`;
    const dys = dy>0? `+${dy}` : `${dy}`;
    const item = document.createElement('div');
    item.style.padding='6px 4px';
    item.style.borderBottom='1px dashed rgba(255,255,255,0.03)';
    item.innerHTML = `<strong>${name}</strong><div style="color:#bfe8c5">Δx: ${dxs} / Δy: ${dys}</div>`;
    offsetListEl.appendChild(item);
  });
}

/* ---------- select options formatting: show compact text, full details in title ---------- */
/* parentTacticMap defines to which main tactic a given subtactic belongs */
const parentTacticMap = {
  principal: 'principal',
  counter: 'principal',
  long: 'principal',
  hold: 'principal',
  ultra: 'ultra'
};

function getParentTactic(key){
  return parentTacticMap[key] || 'principal';
}

/* Compact option text: only numeric formation + style, e.g. "4-2-3-1 (Posse)" or fallback to name */
function compactOptionTextForTactic(key){
  const formation = tactics[key] || {};
  const name = formation.name || key;
  const numericMatch = (String(name)).match(/\d+(-\d+)+/);
  const numeric = numericMatch ? numericMatch[0] : name;
  const style = formation.style ? ` (${formation.style})` : '';
  return `${numeric}${style}`;
}

/* Full title: includes name, style, mental, line and base info (if different) */
function fullTitleForTactic(key){
  const f = tactics[key] || {};
  const parts = [];
  if(f.name) parts.push(`Nome: ${f.name}`);
  if(f.style) parts.push(`Estilo: ${f.style}`);
  if(f.mental) parts.push(`Mentalidade: ${f.mental}`);
  if(f.line) parts.push(`Linha: ${f.line}`);
  const parent = getParentTactic(key);
  if(parent && parent !== key) parts.push(`Base: ${parent}`);
  return parts.join(' — ') || key;
}

function updateTacticSelectOptions(){
  Array.from(viewSelect.options).forEach(opt => {
    const key = opt.value;
    opt.textContent = compactOptionTextForTactic(key);
    opt.title = fullTitleForTactic(key);
  });
}

/* ---------- sync mental/line and summary ---------- */
const defaultLineByTactic = {
  principal: 'Alta',
  counter: 'Média',
  long: 'Baixa',
  hold: 'Baixa',
  ultra: 'Alta'
};
function normalizeLineValue(v){
  if(!v) return null;
  const s = String(v).toLowerCase();
  if(s.includes('alta')) return 'Alta';
  if(s.includes('média') || s.includes('media')) return 'Média';
  if(s.includes('baixa')) return 'Baixa';
  return v;
}
function syncMentalLineToUI(formation, formationKey){
  if(formation && formation.mental){
    const val = String(formation.mental).toLowerCase();
    if([...mentalSelect.options].some(o => o.value === val)) mentalSelect.value = val;
  }
  let lineValue = normalizeLineValue(formation.line) || defaultLineByTactic[formationKey] || '—';
  const lineOptionValue = (lineValue && lineValue !== '—') ? String(lineValue).toLowerCase() : null;
  if(lineOptionValue && [...lineSelect.options].some(o => o.value === lineOptionValue)) lineSelect.value = lineOptionValue;
  const cards = document.querySelectorAll('.card');
  cards.forEach(c=>{
    const h3 = c.querySelector('h3');
    if(h3 && h3.textContent.trim().toLowerCase().includes('resumo tático')){
      let p = c.querySelector('p');
      if(!p){ p = document.createElement('p'); c.appendChild(p); }
      p.innerHTML = `<strong>Formação base:</strong> ${formation.name} — <strong>Mentalidade:</strong> ${formation.mental || '—'} ; <strong>Linha:</strong> ${lineValue}.`;
    }
  });
}

/* ---------- main render flow ---------- */
function renderFormation(formationKey){
  // keep tactic select options in sync (compact label + full title)
  updateTacticSelectOptions();

  const formation = tactics[formationKey] || tactics.principal;
  initPitch();
  syncMentalLineToUI(formation, formationKey);
  const { starters, reserves } = splitStartersAndReserves(formation);
  clearDisplayedPositions();
  renderStartersOnField(starters);
  renderReserves(reserves);
  setTimeout(()=> showOffsetsFromDisplayed(formationKey), 50);
}

/* ---------- events ---------- */
window.addEventListener('load', ()=> {
  // ensure select options are formatted before first render
  updateTacticSelectOptions();
  renderFormation('principal');
});
viewSelect.addEventListener('change', e => renderFormation(e.target.value));

mentalSelect.addEventListener('change', e => {
  const cur = viewSelect.value;
  if(tactics[cur]) tactics[cur].mental = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
  syncMentalLineToUI(tactics[cur], cur);
  updateTacticSelectOptions(); // update titles to reflect change
});
lineSelect.addEventListener('change', e => {
  const cur = viewSelect.value;
  if(tactics[cur]) tactics[cur].line = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
  syncMentalLineToUI(tactics[cur], cur);
  updateTacticSelectOptions(); // update titles to reflect change
});

resetBtn.addEventListener('click', ()=>{
  viewSelect.value = 'principal';
  renderFormation('principal');
});

document.getElementById('downloadBtn').addEventListener('click', function(e){
  e.preventDefault();
  const html = '<!doctype html>\n' + document.documentElement.outerHTML;
  const blob = new Blob([html], { type:'text/html' });
  const url = URL.createObjectURL(blob);
  this.href = url;
  setTimeout(()=> URL.revokeObjectURL(url), 10000);
  this.click();
});

let resizeTimer;
window.addEventListener('resize', ()=>{
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(()=> renderFormation(viewSelect.value), 120);
});

