const KEY = 'pps-v4';
const seed = {
  people: [
    { id: 'p1', name: 'Arda', relation: 'friend', phone: '+49 151 0000001' },
    { id: 'p2', name: 'Ata', relation: 'neighbour', phone: '+49 151 0000002' },
    { id: 'p3', name: 'Mum', relation: 'family', phone: '+49 151 0000003' }
  ],
  cares: [
    { id: 'c1', name: 'Ruby', type: 'dog', tasks: ['Food 2x', 'Fresh water', 'Brush', 'Play 10 min'], vet: '+49 331 000000', key: 'Under the mat', notes: 'Keep window closed' },
    { id: 'c2', name: 'Balcony plants', type: 'plants', tasks: ['Water every 2 days', 'Check soil'], vet: '', key: 'Under the mat', notes: 'Do not water in direct sun' }
  ],
  plans: [
    { id: 't1', careId: 'c1', personId: 'p1', start: '2026-11-03', end: '2026-11-10' },
    { id: 't2', careId: 'c2', personId: 'p2', start: '2026-11-03', end: '2026-11-10' }
  ],
  done: {},
  log: [
    { date: '2026-10-26', time: '18:40', text: 'Played and brushed ✓ (Ruby)', task: true, by: 'Arda' },
    { date: '2026-10-26', time: '09:12', text: 'Food given ✓ (Ruby)', task: true, by: 'Arda', photo: '🐶' }
  ],
  selected: 'c1'
};

let s;
try { s = JSON.parse(localStorage.getItem(KEY)) || structuredClone(seed); } catch (e) { s = structuredClone(seed); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
const $ = (q) => document.querySelector(q);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const person = (pid) => s.people.find((p) => p.id === pid);
const care = (cid) => s.cares.find((c) => c.id === cid);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const now = () => new Date().toTimeString().slice(0, 5);
const fmt = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
const range = (a, b) => { const [x, y] = [fmt(a), fmt(b)]; return x.split(' ')[1] === y.split(' ')[1] ? `${x.split(' ')[0]}–${y}` : `${x} – ${y}`; };
const COLORS = ['#2f6f63', '#b45309', '#4f46e5', '#be185d', '#0369a1', '#65a30d'];
const color = (name) => COLORS[[...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const kind = (c) => /plant|flower|tree|herb/i.test(c?.type || c?.name || '') ? 'plant' : (c?.type ? 'pet' : 'other');
const emoji = (c) => {
  const t = (c?.type || '').toLowerCase();
  if (kind(c) === 'plant') return '🌿';
  if (t.includes('cat')) return '🐱';
  if (t.includes('dog')) return '🐶';
  if (t.includes('bird')) return '🐦';
  if (t.includes('fish')) return '🐠';
  if (t.includes('rabbit')) return '🐰';
  return '🐾';
};
const status = (pl) => {
  const t = today();
  if (t < pl.start) return '<span class="pill amber"><span class="dot"></span>Upcoming</span>';
  if (t > pl.end) return '<span class="pill" style="background:#f1f5f9;color:#64748b"><span class="dot"></span>Finished</span>';
  return '<span class="pill"><span class="dot"></span>In progress</span>';
};

function show(v) {
  document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('on', x.id === v));
  window.scrollTo(0, 0);
}

function render() {
  const d = s.done[today()] || {};
  const allTasks = s.cares.flatMap((x) => x.tasks.map((t) => x.id + '|' + t));
  const doneAll = allTasks.filter((k) => d[k]).length;

  $('#tripCare').innerHTML = s.cares.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('#tripPerson').innerHTML = s.people.map((p) => `<option value="${p.id}">${esc(p.name)} (${esc(p.relation)})</option>`).join('');

  $('#stats').innerHTML = [
    ['🗓️', s.plans.length, 'Care plans'],
    ['🤝', s.people.length, 'Trusted people'],
    ['✅', `${doneAll}/${allTasks.length}`, 'Tasks done today']
  ].map(([i, n, l]) => `<div class="stat"><div class="stat-ico">${i}</div><div><b>${n}</b><span>${l}</span></div></div>`).join('');

  $('#plans').innerHTML = s.plans.length ? s.plans.map((pl) => {
    const c = care(pl.careId), p = person(pl.personId);
    return `<div class="plan"><div class="thumb t-${kind(c)}">${emoji(c)}</div>
      <div class="meta"><h3>${esc(c?.name || 'Removed')}${c?.type && kind(c) === 'pet' ? ` <span style="color:var(--muted);font-weight:500">(${esc(c.type)})</span>` : ''}</h3>
      <p>${esc(range(pl.start, pl.end))} · Sitter: <b style="color:var(--text)">${esc(p?.name || '?')}</b></p>${status(pl)}</div>
      <button class="icon-btn" title="Remove" aria-label="Remove plan" data-del-plan="${pl.id}">✕</button></div>`;
  }).join('') : '<p class="empty">No trips planned yet. Use “+ Plan a trip” above.</p>';

  $('#people').innerHTML = s.people.map((p) => {
    const active = s.plans.filter((pl) => pl.personId === p.id).length;
    return `<div class="person">
      <div class="avatar" style="background:${color(p.name)}">${esc((p.name || '?')[0].toUpperCase())}</div>
      <div class="info"><h3>${esc(p.name)}</h3><p>${esc(p.relation)}${p.phone ? ' · ' + esc(p.phone) : ''}</p>
      ${active ? `<span class="pill"><span class="dot"></span>${active} care plan${active > 1 ? 's' : ''}</span>` : ''}</div>
      <button class="icon-btn" title="Remove" aria-label="Remove person" data-del-person="${p.id}">✕</button></div>`;
  }).join('') || '<p class="empty">Add someone you trust.</p>';

  if (!care(s.selected)) s.selected = s.cares[0]?.id;
  $('#careTabs').innerHTML = s.cares.map((c) => `<button class="chip ${c.id === s.selected ? 'on' : ''}" data-select="${c.id}">${emoji(c)} ${esc(c.name)}</button>`).join('');
  const c = care(s.selected);
  if (c) {
    const done = c.tasks.filter((t) => d[c.id + '|' + t]).length;
    const pct = c.tasks.length ? Math.round((done / c.tasks.length) * 100) : 0;
    const bg = kind(c) === 'plant' ? 'linear-gradient(135deg,#e6f4ea,#f6f8fb)' : 'linear-gradient(135deg,#fdf0e3,#f6f8fb)';
    $('#careDetail').innerHTML = `
      <div class="care-hero" style="background:${bg}">
        <div class="thumb">${emoji(c)}</div>
        <div class="grow"><h1>${esc(c.name)}</h1><p class="sub">${esc(c.type || 'Care card')} · ${done} of ${c.tasks.length} tasks done today</p>
          <div class="progress"><i style="width:${pct}%"></i></div></div>
      </div>
      <div class="care-grid">
        <div class="box"><h2>Daily checklist</h2>
          ${c.tasks.map((t) => { const k = c.id + '|' + t; return `<label class="check ${d[k] ? 'done' : ''}"><input type="checkbox" data-task="${esc(k)}" ${d[k] ? 'checked' : ''}><span>${esc(t)}</span></label>`; }).join('') || '<p class="sub">No tasks yet.</p>'}
        </div>
        <div class="box important"><h2>⚠️ Important</h2>
          <div class="info-row">📞<div><b>Vet</b>${esc(c.vet || 'Not added')}</div></div>
          <div class="info-row">🔑<div><b>Key</b>${esc(c.key || 'Not added')}</div></div>
          ${c.notes ? `<div class="info-row">📌<div><b>Note</b>${esc(c.notes)}</div></div>` : ''}
          <div class="box-foot"><button class="btn ghost small" data-del-care="${c.id}">Remove card</button></div>
        </div>
      </div>`;
  } else {
    $('#careDetail').innerHTML = '<p class="empty">Add your first pet or plant.</p>';
  }

  const sitter = person(s.plans[0]?.personId)?.name || 'your sitter';
  const ok = allTasks.length && doneAll === allTasks.length;
  const st = $('#status');
  st.className = 'status-card' + (ok || s.log.length ? ' ok' : '');
  st.innerHTML = `<div class="status-ico">${ok ? '✅' : '💚'}</div>
    <div class="grow"><h2>${ok ? 'Everything is done for today' : 'Everything is fine'} – Updates from ${esc(sitter)}</h2>
    <p>${doneAll} of ${allTasks.length} tasks done today · ${s.log.length} update${s.log.length === 1 ? '' : 's'}</p></div>`;

  $('#timeline').innerHTML = s.log.map((l) => `<li class="${l.task ? '' : 'note'}">
      <div class="tl-head"><span>${esc(l.text)}</span><time>${esc(fmt(l.date))}, ${esc(l.time)}</time></div>
      ${l.by ? `<p class="sub" style="font-size:13px;margin-top:2px">by ${esc(l.by)}</p>` : ''}
      ${l.photo ? `<div class="photo">${esc(l.photo)}</div>` : ''}</li>`).join('')
    || '<p class="empty">No updates yet. Tick tasks on the Care page or send a short update.</p>';
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('button')?.dataset || {};
  if (t.view) return show(t.view);
  if (t.toggle) { const f = document.getElementById(t.toggle); f.hidden = !f.hidden; return; }
  if (t.select) s.selected = t.select;
  else if (t.delPlan) s.plans = s.plans.filter((x) => x.id !== t.delPlan);
  else if (t.delPerson) s.people = s.people.filter((x) => x.id !== t.delPerson);
  else if (t.delCare) { if (!confirm('Remove this care card?')) return; s.cares = s.cares.filter((x) => x.id !== t.delCare); }
  else return;
  save(); render();
});

document.addEventListener('change', (e) => {
  const k = e.target.dataset.task;
  if (!k) return;
  const d = (s.done[today()] = s.done[today()] || {});
  d[k] = e.target.checked;
  const [cid, task] = k.split('|');
  const c = care(cid);
  if (e.target.checked) s.log.unshift({ date: today(), time: now(), text: `${task} ✓ (${c?.name || ''})`, task: true, by: person(s.plans.find((p) => p.careId === cid)?.personId)?.name, photo: d && Object.values(d).filter(Boolean).length === 1 ? emoji(c) : '' });
  save(); render();
});

const onSubmit = (sel, fn) => $(sel).addEventListener('submit', (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (fn(f) === false) return;
  save(); render(); e.target.reset();
  if (e.target.classList.contains('panel')) e.target.hidden = true;
});

onSubmit('#tripForm', (f) => {
  if (f.end < f.start) { alert('The end date must be after the start date.'); return false; }
  s.plans.push({ id: uid(), ...f });
});
onSubmit('#personForm', (f) => { s.people.push({ id: uid(), ...f }); });
onSubmit('#careForm', (f) => {
  f.tasks = (f.tasks || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const id = uid();
  s.cares.push({ id, ...f });
  s.selected = id;
});
onSubmit('#noteForm', (f) => { s.log.unshift({ date: today(), time: now(), text: f.text }); });

render();
