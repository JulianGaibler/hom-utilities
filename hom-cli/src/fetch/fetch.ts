import foxr from 'foxr'
import Timeout from 'await-timeout'
import DevTools from './devtools'
import { FetchRun } from './homtest'

export default async function fetch(url: string, homEnabled: string, screenshotPath: string, screenshotName: string, profilePath: string, binaryPath: string): Promise<FetchRun | boolean> {

  const resultObject: FetchRun = {
    failedToLoad: false,
    httpsOnlyErrorPage: false,
    screenshotPath: null,
    networkEvents: null,
  }

  // Start Firefox
  const [browser, killSwitch] = await foxr.launch({
    executablePath: binaryPath,
    headless: false,
    safeMode: false,
    defaultViewport: {
      width: 1200,
      height: 1000,
    },
    args: ['--start-debugger-server', 'ws:6003', '--profile', profilePath],
  })

  // Set the HTTPS-Only pref
  await browser.setPref('dom.security.https_only_mode', homEnabled === 'true')
  await browser.setTimeouts({ pageLoad: 20000, script: 20000 })

  // Connect to DevTools API, disable the cache and start monitoring network activity
  const client = await DevTools.new('ws://127.0.0.1:6003')
  await client.disableCache(true)
  const key = await client.monitorNetworkActivity()


  let error = false
  let noResponse = false

  const page = await browser.newPage()
  try {
    // The first load is going to get upgraded to https anyway.
    // If we declare it here we don't have to count this upgrade out later.
    await Promise.race([page.goto(`http://${url}`), throwAfter(35000)])
    // If the page never finishes loading, we just time out after 3 seconds
  } catch (e) {
    if (e.message !== 'failed_because_timeout') {
      console.log('\t\t⚠️ Website failed to load')
      resultObject.failedToLoad = true
    } else {
      noResponse = true
      console.log('\t\t⚠️ GoTo timed out :/')
    }
    error = true
    resultObject.httpsOnlyErrorPage = e.message.startsWith('Reached error page: about:httpsonlyerror')
  }
  if (!error) {
    console.log('\t\t😊 Nothing bad happened!')
    // Let's wait 1.5 seconds for the site to finish loading other stuff
    await Timeout.set(2500)
    await page.screenshot({ path: screenshotPath })
    resultObject.screenshotPath = screenshotName
  }

  // Unsubscribe from network activity and get the data
  const map = await client.finishNetworkActivity(key)
  resultObject.networkEvents = Array.from(map.entries()).map(arr => arr[1])

  if (noResponse) {
    resultObject.failedToLoad = !resultObject.networkEvents.some(event => event.cause.type !== 'document')

    killSwitch()
  } else {
    await page.goto('about:blank')
    await browser.close()
    // Wait a bit to make sure Firefox is really closed
    // (Otherwise weird stuff happens)
    await Timeout.set(1500)
  }

  process.send({ resultObject })
  return resultObject
}

async function throwAfter(ms) {
  await Timeout.set(ms)
  throw new Error('failed_because_timeout')
}
