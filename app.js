const STORAGE_KEY = 'pps_requests_v1'
const form = document.getElementById('requestForm')
const requestsEl = document.getElementById('requests')
const template = document.getElementById('requestTemplate')
const search = document.getElementById('search')
const fileInput = document.getElementById('fileInput')

let requests = load()

function uid(){return Math.random().toString(36).slice(2,9)}

function load(){
  try{const raw = localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):[] }catch(e){return []}
}

function save(){localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))}

function render(filter=''){
  requestsEl.innerHTML=''
  const q = filter.trim().toLowerCase()
  const list = requests.filter(r=>!q || (r.title+r.owner+r.details).toLowerCase().includes(q))
  if(list.length===0){requestsEl.innerHTML='<p style="color:#666">No requests yet.</p>';return}
  list.forEach(r=>{
    const node = template.content.cloneNode(true)
    node.querySelector('.title').textContent = r.title
    node.querySelector('.meta').textContent = r.reward? r.reward : ''
    node.querySelector('.details').textContent = r.details || ''
    node.querySelector('.instructions').textContent = r.instructions? 'Notes: '+r.instructions : ''
    node.querySelector('.owner').textContent = r.owner
    node.querySelector('.dates').textContent = r.start + ' → ' + r.end
    const claimBtn = node.querySelector('.claim')
    const editBtn = node.querySelector('.edit')
    const delBtn = node.querySelector('.delete')
    const vol = node.querySelector('.volunteers')
    vol.textContent = r.volunteers && r.volunteers.length? 'Volunteers: '+ r.volunteers.join(', ') : ''

    claimBtn.addEventListener('click', ()=>{
      const name = prompt('Your name to volunteer?')
      if(!name) return
      r.volunteers = r.volunteers||[]
      if(!r.volunteers.includes(name)) r.volunteers.push(name)
      save(); render(search.value)
    })

    editBtn.addEventListener('click', ()=>{
      populateForm(r)
      window.scrollTo({top:0,behavior:'smooth'})
    })

    delBtn.addEventListener('click', ()=>{
      if(!confirm('Delete this request?')) return
      requests = requests.filter(x=>x.id!==r.id)
      save(); render(search.value)
    })

    requestsEl.appendChild(node)
  })
}

function populateForm(r){
  form.title.value = r.title || ''
  form.owner.value = r.owner || ''
  form.start.value = r.start || ''
  form.end.value = r.end || ''
  form.details.value = r.details || ''
  form.instructions.value = r.instructions || ''
  form.reward.value = r.reward || ''
  form.contact.value = r.contact || ''
  form.dataset.editId = r.id
}

form.addEventListener('submit', e=>{
  e.preventDefault()
  const data = Object.fromEntries(new FormData(form).entries())
  const id = form.dataset.editId
  if(id){
    const idx = requests.findIndex(r=>r.id===id)
    if(idx>-1){requests[idx] = {...requests[idx], ...data}; delete form.dataset.editId }
  }else{
    const r = {...data, id:uid(), volunteers:[]}
    requests.unshift(r)
  }
  form.reset(); save(); render(search.value)
})

document.getElementById('clearForm').addEventListener('click', ()=>{form.reset(); delete form.dataset.editId})
search.addEventListener('input', e=>render(e.target.value))

document.getElementById('clearAll').addEventListener('click', ()=>{
  if(confirm('Clear all requests?')){ requests=[]; save(); render() }
})

document.getElementById('exportBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(requests, null, 2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='pps-requests.json'; a.click(); URL.revokeObjectURL(url)
})

document.getElementById('importBtn').addEventListener('click', ()=>fileInput.click())
fileInput.addEventListener('change', ()=>{
  const f = fileInput.files[0]; if(!f) return
  const reader = new FileReader(); reader.onload = ()=>{
    try{const imported = JSON.parse(reader.result); if(Array.isArray(imported)){ requests = imported.concat(requests); save(); render() }else alert('Invalid file') }catch(e){alert('Invalid JSON')}
    fileInput.value = ''
  }
  reader.readAsText(f)
})

if(requests.length===0){
  requests = [
    {id:uid(), title:'Feed Milo & water succulents', owner:'Aisha', start:'2026-11-02', end:'2026-11-09', details:'Feed twice daily, wet food in small tins. Water succulents once on day 3.', instructions:'Keys with neighbour', reward:'Coffee + thanks', contact:'', volunteers:[]}
  ]
  save()
}

render()
