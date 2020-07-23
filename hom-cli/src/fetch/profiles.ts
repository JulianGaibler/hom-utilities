import tmp from 'tmp'
import foxr from 'foxr'
import path from 'path'
import { wait } from './Utils'
import * as jetpack from 'fs-jetpack'

class Profiles {
  tmpDir: tmp.DirResult

  static async new(binaryPath, extensionPath) {
    const tmpDir = tmp.dirSync()
    console.error('📄 Creating new Firefox Profile...')
    // Start Firefox to generate new profile
    const [browser, _] = await foxr.launch({
      executablePath: binaryPath,
      headless: false,
      args: ['--profile', path.join(tmpDir.name, 'main')],
    })
    // Set prefs on profile
    await browser.setPref('devtools.chrome.enabled', true)
    await browser.setPref('browser.startup.homepage', 'about:blank')
    await browser.setPref('browser.newtabpage.enabled', false)
    await browser.setPref('devtools.debugger.remote-enabled', true)
    await browser.setPref('devtools.debugger.prompt-connection', false)
    await browser.setPref('privacy.sanitize.sanitizeOnShutdown', true)
    await browser.setPref('browser.formfill.enable', false)
    await browser.setPref('places.history.enabled', false)
    await browser.setPref('network.cookie.lifetimePolicy', 2)

    // If there is an extension, install it
    if (extensionPath) {
      await browser.install(extensionPath, false)
    }

    await wait(1000)

    // Close Firefox
    await browser.close()
    await wait(1500)

    const that = new Profiles()
    that.tmpDir = tmpDir
    return that
  }

  async getProfile() {
    const from = path.join(this.tmpDir.name, 'main')
    const to = path.join(this.tmpDir.name, 'copy')
    await jetpack.copyAsync(from, to, { overwrite: true })
    return to
  }

  async cleanup() {
    console.error('🧹 Cleaning up Firefox Profile folders...')
    await jetpack.dirAsync(this.tmpDir.name, { empty: true })
    this.tmpDir.removeCallback()
  }
}

export default Profiles
