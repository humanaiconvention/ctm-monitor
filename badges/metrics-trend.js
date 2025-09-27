const HISTORY_URL = 'aggregate-history.json';
async function loadHistory(){
  const res = await fetch(HISTORY_URL, { cache: 'no-cache' });
  if(!res.ok) throw new Error('History fetch failed');
  return res.json();
}
function fmtTs(ts){
  return new Date(ts).toLocaleString();
}
function detectMetricKeys(entry){
  const exclude = new Set(['ts','sha','ref','generatedAt']);
  // Flatten nested objects (e.g., lighthouse, coverage, perfMarks.heroMounted) into dot paths
  const keys = [];
  function walk(obj, prefix=''){
    Object.entries(obj).forEach(([k,v])=>{
      if(exclude.has(k)) return;
      const path = prefix?`${prefix}.${k}`:k;
      if(v && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, path);
      } else if (typeof v === 'number') {
        keys.push(path);
      }
    });
  }
  walk(entry);
  return keys;
}
function getValue(entry, path){
  return path.split('.').reduce((acc,part)=>acc?acc[part]:undefined, entry);
}
function sparkline(values,width=100,height=30){
  if(!values.length) return '';
  const min = Math.min(...values), max = Math.max(...values);
  const range = max-min || 1;
  const step = width/(values.length-1||1);
  let d='';
  values.forEach((v,i)=>{
    const x = + (i*step).toFixed(2);
    const y = + (height - ((v-min)/range)*height).toFixed(2);
    d += (i?'L':'M')+x+','+y;
  });
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="60" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
}
function createChartCard(key, entries){
  const values = entries.map(e=>getValue(e,key)).filter(v=>typeof v==='number');
  if(!values.length) return null;
  const last = values[values.length-1];
  const first = values[0];
  const delta = last - first;
  const pct = first ? ((delta/first)*100).toFixed(1) : 'n/a';
  const card = document.createElement('div');
  card.className='card';
  card.innerHTML = `<h2 class="metric">${key}</h2>
    <div>${sparkline(values)}</div>
    <p class="metric-body">Latest: <strong>${last}</strong><br/>Δ (abs): ${delta.toFixed(2)} | Δ%: ${pct}%</p>`;
  return card;
}
(async () => {
  try {
    const history = await loadHistory();
    document.getElementById('raw').textContent = JSON.stringify(history,null,2);
    if(!history.length){
      document.getElementById('updated').textContent = 'no data';
      return;
    }
    document.getElementById('updated').textContent = fmtTs(history[history.length-1].ts);
    document.getElementById('commit').textContent = (history[history.length-1].sha||'').slice(0,7);
    const metricKeys = detectMetricKeys(history[0]);
    const container = document.getElementById('charts');
    metricKeys.forEach(k=>{
      const card = createChartCard(k, history);
      if(card) container.appendChild(card);
    });
  } catch(err){
    document.getElementById('updated').textContent = 'error';
    console.error(err);
  }
})();
