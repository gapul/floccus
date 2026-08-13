import app from '../ui'
import Controller from '../lib/Controller'
import BrowserController from '../lib/browser/BrowserController'

const BACKGROUND_PROBE_TIMEOUT = 2000

// Orion (especially on iOS) does not reliably run our background context, so messages from the
// panel go nowhere and clicking "sync now" does nothing at all. Probe the background once and,
// if it doesn't answer, run the controller right here in the panel instead.
async function ensureController() {
  if (!window.KAGI) {
    return
  }
  try {
    const proxy = await Controller.getSingleton()
    const alive = await Promise.race([
      proxy.getUnlocked().then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), BACKGROUND_PROBE_TIMEOUT)),
    ])
    if (alive) return
  } catch (e) {
    console.warn('Background probe failed', e)
  }
  console.warn('No background context responding: running the controller in the panel')
  const controller = new BrowserController() // constructor sets Controller.singleton = this
  await controller.onLoad()
}

// DIAGNOSTIC BUILD -- not for upstream. Reports what the background context managed to do.
async function reportDiag() {
  let text
  try {
    const browser = (await import('../lib/browser-api')).default
    const { floccusDiag } = await browser.storage.local.get('floccusDiag')
    text = floccusDiag
      ? `${JSON.stringify(floccusDiag)} (${Math.round((Date.now() - floccusDiag.at) / 1000)}s ago)`
      : 'background wrote nothing at all'
  } catch (e) {
    text = 'could not read diag: ' + e
  }
  // eslint-disable-next-line no-alert
  window.alert('floccus diag: ' + text)
  app()
}

ensureController().then(reportDiag, reportDiag)
