import Profiles from './profiles'
import yaml from 'yaml'
import path from 'path'
import foxr from 'foxr'
import { wait } from './Utils'
import DevTools from './devtools'
import * as jetpack from 'fs-jetpack'
import CliConfig from '../cli-config'

// Increment if code changes result in different outputs
const HOM_FETCH_RESULT_VERSION = 1
const TIMEOUT_MS = 20000

export interface Fetch {
  websiteUrl: string,
  homFetchVersion: number,
  dateISO: string,
  homDisabled: FetchRun,
  homEnabled: FetchRun,
}

export interface FetchRun {
  failedToLoad: boolean,
  httpsOnlyErrorPage: boolean,
  screenshotPath: string | null,
  networkEvents: any,
}

class HomTest {
  binaryPath: string
  fetchDirectory: string
  extensionPath: string
  profiles: Profiles

  static async new(cliConfig: CliConfig) {
    // Launch Firefox once for pre-configuration
    const profiles = await Profiles.new(cliConfig.binaryPath, cliConfig.extensionPath)

    const that = new HomTest()
    that.profiles = profiles
    that.binaryPath = cliConfig.binaryPath
    that.fetchDirectory = cliConfig.fetchDirectory
    that.extensionPath = cliConfig.extensionPath
    return that
  }

  async run(url: string) {
    // Get datetime of fetch
    const date = new Date()
    // Strip url of http schemes
    const strippedUrl = url.replace(/(http|https)\:\/\//, '')
    // Replace all non-letters with an underscore so we have a safe ID
    const folderName = strippedUrl.replace(/\W/g, '_')

    console.error(`🌐 Running hom test for ${strippedUrl} (${folderName})`)

    // If we fetched this website before, empty it's directory
    jetpack.dir(path.join(this.fetchDirectory, folderName), { empty: true })

    console.error('\t🍎 Starting Firefox with hom disabled...')
    const disabledScreenshotPath = path.join(this.fetchDirectory, folderName, 'disabled.png')
    const homDisabled = await this.tryFetch(strippedUrl, false, disabledScreenshotPath, 'disabled.png')

    console.error('\t🍏 Starting Firefox with hom enabled...')
    const enabledScreenshotPath = path.join(this.fetchDirectory, folderName, 'enabled.png')
    const homEnabled = await this.tryFetch(strippedUrl, true, enabledScreenshotPath, 'enabled.png')

    if (homDisabled === null || homEnabled === null) {
      console.error(`🚨 OH MAN! ${strippedUrl} (${folderName}) did not generate a report!`)
      return false
    }

    const result: Fetch = {
      websiteUrl: strippedUrl,
      homFetchVersion: HOM_FETCH_RESULT_VERSION,
      dateISO: date.toISOString(),
      homDisabled,
      homEnabled,
    }

    await jetpack.writeAsync(path.join(this.fetchDirectory, folderName, 'result.yaml'), yaml.stringify(result))
    return true
  }

  async tryFetch(url: string, homEnabled: boolean, screenshotPath: string, screenshotName: string): Promise<FetchRun | null> {
    for (let i = 0; i < 3; ++i) {
      const shared = { firefoxProcess: null }
      const result = await Promise.race([this.fetch(url, homEnabled, screenshotPath, screenshotName, shared), raceTimout()])
      if (result !== false && result !== true) {
        return result
      }
      console.error(`\t🚨 HOM-test timed out after ${TIMEOUT_MS}ms. (Attempt ${i}/3)`)
      if (shared.firefoxProcess !== null) {
        await shared.firefoxProcess.kill()
        shared.firefoxProcess = null
        await this.resetProfile()
        await wait(9000)
        console.error('\t😔 Let\'s try that again...')
      }
    }
    return null
  }

  async fetch(url: string, homEnabled: boolean, screenshotPath: string, screenshotName: string, shared: any): Promise<FetchRun | boolean> {
    // Get the path of a copy of the profile folder
    const profilePath = await this.profiles.getProfile()

    const resultObject: FetchRun = {
      failedToLoad: false,
      httpsOnlyErrorPage: false,
      screenshotPath: null,
      networkEvents: null,
    }

    // Start Firefox
    const [browser, firefoxProcess] = await foxr.launch({
      executablePath: this.binaryPath,
      headless: false,
      args: ['--start-debugger-server', 'ws:6003', '--profile', profilePath],
    })
    shared.firefoxProcess = firefoxProcess

    // Set the HTTPS-Only pref
    await browser.setPref('dom.security.https_only_mode', homEnabled)

    // Connect to DevTools API, disable the cache and start monitoring network activity
    const client = await DevTools.new('ws://127.0.0.1:6003')
    await client.disableCache(true)
    const key = await client.monitorNetworkActivity()


    let error = false
    const page = await browser.newPage()
    try {
      // The first load is going to get upgraded to https anyway.
      // If we declare it here we don't have to count this upgrade out later.
      await page.goto(`http://${url}`)
      // If the page never finishes loading, we just time out after 3 seconds
    } catch (e) {
      resultObject.failedToLoad = true
      error = true
      resultObject.httpsOnlyErrorPage = e.message.startsWith('Reached error page: about:httpsonlyerror')
    }
    console.error('\t🙂 Done loading')
    if (!error) {
      // Let's wait 1.5 seconds for the site to finish loading other stuff
      await wait(2500)
      await page.screenshot({ path: screenshotPath })
      resultObject.screenshotPath = screenshotName
    }

    // Unsubscribe from network activity and get the data
    const map = await client.finishNetworkActivity(key)
    resultObject.networkEvents = Array.from(map.entries()).map(arr => arr[1])

    // This should usually get filtered when the isSystemPrincipal flag gets injected
    // resultObject.networkEvents = resultObject.networkEvents.filter(rawEvent => {
    //   if (rawEvent.cause.type === 'other') { return false }
    //   if (rawEvent.url.includes('mozilla.com')) { return false }
    //   if (rawEvent.url.includes('mozilla.net')) { return false }
    //   return true
    // })
    if (shared.firefoxProcess === null) {
      return false
    }
    await page.goto('about:blank')
    await browser.close()
    shared.firefoxProcess = null

    // Wait a bit to make sure Firefox is really closed
    // (Otherwise weird stuff happens)
    await wait(5500)
    return resultObject
  }

  cleanup() {
    return this.profiles.cleanup()
  }

  async resetProfile() {
    await wait(6000)
    await this.profiles.cleanup()
    await wait(1000)
    this.profiles = await Profiles.new(this.binaryPath, this.extensionPath)
    await wait(4000)
  }
}

async function raceTimout() {
  await wait(TIMEOUT_MS)
  return false
}

export default HomTest
