// Lightweight vanilla JS component factory for selecting research sources
// Usage: const el = createSourceSelector({ sources, onChange }); container.appendChild(el);
export function createSourceSelector({ sources = [], selected = [], onChange = () => {} } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'research-source-selector';
  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.paddingLeft = '0';

  const sel = new Set(selected);

  function emit() {
    onChange(Array.from(sel));
  }

  sources.forEach(name => {
    const li = document.createElement('li');
    li.style.margin = '4px 0';
    const id = `src_${name.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.style.cursor = 'pointer';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.checked = sel.has(name);
    cb.addEventListener('change', () => {
      if (cb.checked) sel.add(name); else sel.delete(name);
      emit();
    });
    label.appendChild(cb);
    const span = document.createElement('span');
    span.textContent = ' ' + name;
    label.appendChild(span);
    li.appendChild(label);
    list.appendChild(li);
  });

  wrapper.appendChild(list);
  return wrapper;
}
