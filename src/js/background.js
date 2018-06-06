import '../img/icon-128.png'
import '../img/icon-128-disabled.png'
import '../img/icon-48.png'
import '../img/icon-48-disabled.png'
import '../img/icon-32.png'
import '../img/icon-32-disabled.png'

import toShavian from 'to-shavian'

let enabled = false

function injectScript(tab) {
  chrome.tabs.executeScript(tab.id, {
    file: 'injected.bundle.js'
  })
}

chrome.browserAction.onClicked.addListener(function(tab) {
  enabled = !enabled
  injectScript(tab)
  chrome.browserAction.setIcon({
    path: {
      '32': enabled ? 'icon-32.png' : 'icon-32-disabled.png'
    }
  })
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === 'transliterate' && request.values) {
      const transliterated = request.values.map(toShavian)
      sendResponse({ transliterated })
    }

    if (request.action === 'dom-ready') {
      console.log('dom-ready! / enabled:', enabled)
      if (enabled) {
        injectScript(sender.tab)
      }
    }
  }
)