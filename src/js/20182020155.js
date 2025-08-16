// ====== Tabla de contenidos activa ======
const links = [...document.querySelectorAll('.toc-link')]
const sections = links.map(a => document.querySelector(a.getAttribute('href')))
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e => {
    if(e.isIntersecting){
      links.forEach(l => l.classList.remove('active'))
      const idx = sections.indexOf(e.target)
      if(idx>=0) links[idx].classList.add('active')
    }
  })
}, {rootMargin: '-40% 0px -50% 0px', threshold: .01})
sections.forEach(s => s && io.observe(s))

// ====== Copiar snippets ======
function copyText(txt){
  navigator.clipboard.writeText(txt).then(()=>{
    const note = document.createElement('div')
    note.textContent = 'Copiado ✅'
    Object.assign(note.style, {position:'fixed', bottom:'20px', right:'20px', background:'var(--panel)', color:'var(--text)', padding:'10px 12px', borderRadius:'10px', border:'1px solid var(--border)', boxShadow:'var(--shadow)'} )
    document.body.appendChild(note)
    setTimeout(()=> note.remove(), 1400)
  })
}
document.querySelectorAll('.copy').forEach(btn =>{
  btn.addEventListener('click', ()=> copyText(btn.dataset.copy || document.getElementById('out').innerText))
})

// ====== Tabs versiones ======
const tabs = [...document.querySelectorAll('.tab')]
const panes = {
  v10: document.getElementById('v10'),
  v11: document.getElementById('v11'),
  v20: document.getElementById('v20')
}
tabs.forEach(t => t.addEventListener('click', ()=>{
  tabs.forEach(x=>x.classList.remove('active'))
  t.classList.add('active')
  const id = t.dataset.tab
  Object.entries(panes).forEach(([k,el])=> el.hidden = (k!==id))
}))

// ====== Playground ======
const qs = sel => document.querySelector(sel)
function buildURL(){
  const base = qs('#base').value.trim().replace(/\/$/, '')
  const ver = qs('#ver').value
  const layer = qs('#layer').value.trim()
  const props = qs('#props').value.trim()
  const cql = qs('#cql').value.trim()
  const fmt = qs('#fmt').value
  const count = qs('#count').value
  const typeKey = ver === '2.0.0' ? 'typeNames' : 'typeName'
  const params = new URLSearchParams()
  params.set('service','WFS')
  params.set('version',ver)
  params.set('request','GetFeature')
  params.set(typeKey, layer)
  params.set('outputFormat', fmt)
  if(props) params.set('propertyName', props)
  if(cql) params.set('CQL_FILTER', cql)
  if(count) params.set('count', count)
  const url = `${base}?${params.toString()}`
  qs('#out').innerHTML = `<code>${url}</code>`
  return url
}
qs('#build').addEventListener('click', buildURL)
qs('#copy-url').addEventListener('click', ()=> copyText(buildURL()))
// Primer render
buildURL()