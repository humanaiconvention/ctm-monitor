import { listModels, invokeModel } from '../../modules/azure/models/index.js'

// Minimal vanilla JS component factory (no framework dependency yet)
export function createAzureModelSelector({ onSelect, onInvoke } = {}) {
  const container = document.createElement('div')
  container.className = 'azure-model-selector'
  const heading = document.createElement('h3')
  heading.textContent = 'Azure Models'
  container.appendChild(heading)

  const ul = document.createElement('ul')
  ul.className = 'azure-model-list'
  const models = listModels()
  models.forEach(m => {
    const li = document.createElement('li')
    li.innerHTML = `<button type="button" data-model="${m.name}">${m.displayName || m.name}</button>`
    ul.appendChild(li)
  })
  container.appendChild(ul)

  const output = document.createElement('pre')
  output.className = 'azure-model-output'
  container.appendChild(output)

  ul.addEventListener('click', async e => {
    if (!(e.target instanceof HTMLButtonElement)) return
    const model = e.target.getAttribute('data-model')
    onSelect?.(model)
    output.textContent = 'Invoking…'
    try {
      const result = await invokeModel(model, 'Hello model')
      onInvoke?.(model, result)
      output.textContent = JSON.stringify(result, null, 2)
    } catch (err) {
      output.textContent = 'Error: ' + err.message
    }
  })

  return container
}

export default { createAzureModelSelector }