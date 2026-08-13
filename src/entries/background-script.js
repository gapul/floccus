import browser from '../lib/browser-api'
import BrowserController from '../lib/browser/BrowserController'

// DIAGNOSTIC BUILD -- not for upstream. Records how far the background context gets, so the
// panel can report whether it never ran, threw during setup, or ran but never got our messages.
const stamp = (data) => {
  try {
    browser.storage.local.set({ floccusDiag: { ...data, at: Date.now() } })
  } catch (e) {
    // nothing we can do here
  }
}

stamp({ stage: 'boot' })

try {
  browser.runtime.onMessage.addListener((data) => {
    stamp({ stage: 'message', type: data && data.type })
  })
} catch (e) {
  stamp({ stage: 'no-onMessage', error: String(e) })
}

try {
  const controller = new BrowserController
  stamp({ stage: 'constructed' })
  controller.onLoad()
} catch (e) {
  stamp({ stage: 'error', error: String((e && e.stack) || e) })
}
