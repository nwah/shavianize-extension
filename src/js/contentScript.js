setTimeout(() => {
	chrome.runtime.sendMessage({ action: 'dom-ready' })
}, 50)