const KEY = 'pps-v2';
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
  plans: [],
  done: {},
  log: []
};

let s;
try { s = JSON.parse(localStorage.getItem(KEY)) || seed; } catch (e) { s = seed; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
const $ = (q) => document.querySelector(q);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const id = () => Math.random().toString(36).slice(2, 9);
const person = (pid) => s.people.find((p) => p.id === pid);
const care = (cid) => s.cares.find((c) => c.id === cid);
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

document.querySelectorAll('.nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
function show(v) {
  document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('on', x.id === v));
}

function render() {
  $('#tripCare').innerHTML = s.cares.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('#tripPerson').innerHTML = s.people.map((p) => `<option value="${p.id}">${esc(p.name)} (${esc(p.relation)})</option>`).join('');

  $('#plans').innerHTML = s.plans.length
    ? s.plans.map((pl) => `<div class="card"><h3>${esc(care(pl.careId)?.name)}</h3>
        <p class="muted">${esc(pl.start)} – ${esc(pl.end)}<br>Looked after by ${esc(person(pl.personId)?.name)}</p>
        <button class="btn small" data-del-plan="${pl.id}">Remove</button></div>`).join('')
    : '<p class="muted">No trips planned yet.</p>';

  $('#people').innerHTML = s.people.map((p) => `<div class="card person">
      <div class="avatar">${esc(p.name[0] || '?')}</div>
      <div style="flex:1"><strong>${esc(p.name)}</strong><br><span class="tag">${esc(p.relation)}</span> <span class="muted">${esc(p.phone)}</span></div>
      <button class="btn small" data-del-person="${p.id}">×</button></div>`).join('');

  $('#cards').innerHTML = s.cares.map((c) => `<div class="card stack">
      <h3>${esc(c.name)} <span class="tag">${esc(c.type)}</span></h3>
      <div><span class="muted">Daily checklist</span><br>${c.tasks.map((t) => '☐ ' + esc(t)).join('<br>')}</div>
      <div class="muted">Vet: ${esc(c.vet || '–')}<br>Key: ${esc(c.key || '–')}</div>
      ${c.notes ? `<div class="important">⚠ ${esc(c.notes)}</div>` : ''}
      <button class="btn small" data-del-care="${c.id}">Remove</button></div>`).join('');

  const d = s.done[today()] || {};
  const items = s.cares.flatMap((c) => c.tasks.map((t) => ({ k: c.id + '|' + t, label: `${c.name}: ${t}` })));
  $('#todo').innerHTML = items.map((it) => `<label class="check ${d[it.k] ? 'done' : ''}">
      <input type="checkbox" data-task="${esc(it.k)}" ${d[it.k] ? 'checked' : ''}><span>${esc(it.label)}</span></label>`).join('');

  const doneCount = items.filter((it) => d[it.k]).length;
  $('#status').innerHTML = items.length && doneCount === items.length
    ? `<div class="big">Everything is fine ✓</div><p class="muted">All ${items.length} tasks done today</p>`
    : `<div class="big">${doneCount} / ${items.length}</div><p class="muted">tasks done today</p>`;

  $('#timeline').innerHTML = s.log.slice().reverse().map((l) => `<li><time>${esc(l.date)} ${esc(l.time)}</time>${esc(l.text)}</li>`).join('') || '<li class="muted">No updates yet.</li>';
}

document.addEventListener('click', (e) => {
  const t = e.target.dataset;
  if (t.delPlan) s.plans = s.plans.filter((x) => x.id !== t.delPlan);
  else if (t.delPerson) s.people = s.people.filter((x) => x.id !== t.delPerson);
  else if (t.delCare) s.cares = s.cares.filter((x) => x.id !== t.delCare);
  else return;
  save(); render();
});

document.addEventListener('change', (e) => {
  const k = e.target.dataset.task;
  if (!k) return;
  const d = (s.done[today()] = s.done[today()] || {});
  d[k] = e.target.checked;
  if (e.target.checked) s.log.push({ date: today(), time: now(), text: k.split('|')[1] + ' ✓ (' + (care(k.split('|')[0])?.name || '') + ')' });
  save(); render();
});

$('#tripForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (f.end < f.start) { alert('End date must be after start date.'); return; }
  s.plans.push({ id: id(), ...f });
  save(); render(); e.target.reset();
});

$('#personForm').addEventListener('submit', (e) => {
  e.preventDefault();
  s.people.push({ id: id(), ...Object.fromEntries(new FormData(e.target)) });
  save(); render(); e.target.reset();
});

$('#careForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  f.tasks = (f.tasks || '').split('\n').map((x) => x.trim()).filter(Boolean);
  s.cares.push({ id: id(), ...f });
  save(); render(); e.target.reset();
});

$('#noteForm').addEventListener('submit', (e) => {
  e.preventDefault();
  s.log.push({ date: today(), time: now(), text: e.target.text.value });
  save(); render(); e.target.reset();
});

render();
