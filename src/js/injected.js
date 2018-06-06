import DOMIterator from './DOMIterator'

const key = '__SHAVIANIZED__'

let observer

run()

function run() {
  const state = document.documentElement[key] || { enabled: false, observing: false }
  if (state.enabled === true) {
    restoreAll()
    state.enabled = false
    if (!state.observing) {
      stopObserving()
      state.observing = false
    }
  }
  else {
    transliterateAll()
    state.enabled = true
    if (!state.observing) {
      startObserving()
      state.observing = true
    }
  }
  document.documentElement[key] = state
}

function startObserving() {
  observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        transliterateNodes(mutation.addedNodes)
      }
    })
  })
   
  const observerConfig = {
    childList: true, 
  }
   
  observer.observe(document.documentElement, observerConfig)
}

function stopObserving() {
  if (observer) {
    observer.disconnect()
  }
}

function matchesExclude(el) {
  return DOMIterator.matches(el, [].concat([
    // ignores the elements itself, not their childrens (selector *)
    'script', 'style', 'title', 'head', 'html', 'code'
  ]));
}

function getTextNodes(root, cb) {
  const iterator = new DOMIterator(root)

  let val = ''
  let nodes = []
  iterator.forEachNode(
    NodeFilter.SHOW_TEXT,
    node => nodes.push({
      start: val.length,
      end: (val += node.textContent).length,
      node
    }),
    node => (
      matchesExclude(node.parentNode)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
    ),
    () => cb({ value: val, nodes: nodes })
  )
}

function transliterateTextNodes(nodes) {
  const virgins = nodes.filter(node => !node.node[key])
  const values = virgins.map(node => node.node.nodeValue)

  performTransliteration(values, result => {
    if (!result) return
    virgins.forEach((node, i) => {
      const original = node.node.nodeValue
      const transliterated = result.transliterated[i] || original
      node.node[key] = { original, transliterated }
      node.node.nodeValue = transliterated
    })
  })

  if (virgins.length === nodes.length) return

  const priors = nodes.filter(node => node.node[key])
  priors.forEach((node, i) => {
    node.node.nodeValue = node.node[key].transliterated
  })
}

function transliterateNodes(nodes) {
  nodes.forEach(node =>
    getTextNodes(node, result =>
      transliterateTextNodes(result.nodes)
    )
  )
}

function transliterateAll() {
  return transliterateNodes([document.documentElement])
}

function restoreAll() {
  getTextNodes(document.documentElement, result =>
    result.nodes.forEach(node => {
      if (node.node[key]) {
        node.node.nodeValue = node.node[key].original
      }
    })
  )
}

function performTransliteration(values, callback) {
  chrome.runtime.sendMessage({ action: 'transliterate', values }, callback)
}