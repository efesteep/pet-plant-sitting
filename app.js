const KEY = 'pps-v3';
const seed = {
  people: [
    { id: 'p1', name: 'Arda', relation: 'friend', phone: '' },
    { id: 'p2', name: 'Ata', relation: 'neighbour', phone: '' },
    { id: 'p3', name: 'Mum', relation: 'family', phone: '' }
  ],
  cares: [
    { id: 'c1', name: 'Ruby', type: 'dog', tasks: ['Food 2x', 'Fresh water', 'Brush', 'Play 10 min'], vet: '', key: 'Under the mat', notes: 'Keep window closed' },
    { id: 'c2', name: 'Balcony plants', type: 'plants', tasks: ['Water every 2 days'], vet: '', key: 'Under the mat', notes: '' }
  ],
  plans: [
    { id: 't1', careId: 'c1', personId: 'p1', start: '2026-11-03', end: '2026-11-10' },
    { id: 't2', careId: 'c2', personId: 'p2', start: '2026-11-03', end: '2026-11-10' }
  ],
  done: {},
  log: [],
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
const X = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="0" x2="100" y2="100" stroke="#8593a6" stroke-width=".6" vector-effect="non-scaling-stroke"/><line x1="100" y1="0" x2="0" y2="100" stroke="#8593a6" stroke-width=".6" vector-effect="non-scaling-stroke"/></svg>';
const fmt = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
const range = (a, b) => {
  const [x, y] = [fmt(a), fmt(b)];
  return x.split(' ')[1] === y.split(' ')[1] ? `${x.split(' ')[0]}–${y}` : `${x} – ${y}`;
};

function show(v) {
  document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('on', x.id === v));
  window.scrollTo(0, 0);
}

function render() {
  $('#tripCare').innerHTML = s.cares.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('#tripPerson').innerHTML = s.people.map((p) => `<option value="${p.id}">${esc(p.name)} (${esc(p.relation)})</option>`).join('');

  $('#plans').innerHTML = s.plans.length ? s.plans.map((pl) => {
    const c = care(pl.careId), p = person(pl.personId);
    const label = c ? (c.type && c.type !== 'plants' ? `${c.name} (${c.type})` : c.name) : 'Removed';
    return `<div class="plan"><div class="ph sq">${X}</div>
      <div class="meta"><h3>${esc(label)} – ${esc(range(pl.start, pl.end))} – ${esc(p?.name || '?')}</h3>
      <p>Sitter: ${esc(p?.name || '?')}</p></div>
      <button class="btn ghost small" data-del-plan="${pl.id}">Remove</button></div>`;
  }).join('') : '<p class="empty">No trips planned yet. Use "+ Plan a trip" above.</p>';

  $('#people').innerHTML = s.people.map((p) => `<div class="row-card">
      <div class="avatar">${esc((p.name || '?')[0])}</div>
      <div class="name">${esc(p.name)} <span>– ${esc(p.relation)}${p.phone ? ' – ' + esc(p.phone) : ' – phone'}</span></div>
      <button class="btn ghost small" data-del-person="${p.id}">Remove</button></div>`).join('')
    || '<p class="empty">Add someone you trust.</p>';

  if (!care(s.selected)) s.selected = s.cares[0]?.id;
  $('#careTabs').innerHTML = s.cares.map((c) => `<button class="chip ${c.id === s.selected ? 'on' : ''}" data-select="${c.id}">${esc(c.name)}</button>`).join('');
  const c = care(s.selected);
  const d = s.done[today()] || {};
  $('#careDetail').innerHTML = c ? `
    <div class="ph wide">${X}<div class="ph-label">${esc(c.name)}${c.type ? ' – ' + esc(c.type) : ''}</div></div>
    <div class="care-grid">
      <div class="box"><h2>Daily checklist</h2>
        ${c.tasks.map((t) => { const k = c.id + '|' + t; return `<label class="check ${d[k] ? 'done' : ''}"><input type="checkbox" data-task="${esc(k)}" ${d[k] ? 'checked' : ''}><span>${esc(t)}</span></label>`; }).join('') || '<p class="empty">No tasks yet.</p>'}
      </div>
      <div class="box important"><h2>Important</h2>
        <p>Vet: ${esc(c.vet || 'phone')}</p>
        <p>Key: ${esc(c.key || '–')}</p>
        ${c.notes ? `<p>${esc(c.notes)}</p>` : ''}
        <div class="box-foot"><span></span><button class="btn ghost small" data-del-care="${c.id}">Remove card</button></div>
      </div>
    </div>` : '<p class="empty">Add your first pet or plant.</p>';

  const items = s.cares.flatMap((x) => x.tasks.map((t) => x.id + '|' + t));
  const doneCount = items.filter((k) => d[k]).length;
  const sitter = person(s.plans[0]?.personId)?.name || 'your sitter';
  $('#status').textContent = items.length && doneCount === items.length
    ? `Everything is fine – Updates from ${sitter}`
    : `${doneCount} of ${items.length} tasks done today – Updates from ${sitter}`;

  $('#timeline').innerHTML = s.log.slice().reverse().map((l) => `<li><small>${esc(fmt(l.date))}</small>${esc(l.time)} – ${esc(l.text)}${l.photo ? `<div class="ph photo">${X}</div>` : ''}</li>`).join('')
    || '<p class="empty">No updates yet. Tick tasks on the Care page or send a short update.</p>';
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('button')?.dataset || {};
  if (t.view) return show(t.view);
  if (t.toggle) { const f = document.getElementById(t.toggle); f.hidden = !f.hidden; return; }
  if (t.select) { s.selected = t.select; }
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
  if (e.target.checked) s.log.push({ date: today(), time: now(), text: `${task} ✓ (${care(cid)?.name || ''})`, photo: s.log.length === 0 });
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
onSubmit('#noteForm', (f) => { s.log.push({ date: today(), time: now(), text: f.text }); });

render();
