import Profiles from './profiles'
import yaml from 'yaml'
import path from 'path'
import { fork } from 'child_process'
import Timeout from 'await-timeout'
import * as jetpack from 'fs-jetpack'
import CliConfig from '../cli-config'
import { rejects } from 'assert'

// Increment if code changes result in different outputs
const HOM_FETCH_RESULT_VERSION = 1

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
    const strippedUrl = url.replace(/(http|https)\:\/\//, '').toLowerCase()
    // Replace all non-letters with an underscore so we have a safe ID
    const folderName = strippedUrl.replace(/\W/g, '_').toLowerCase()

    console.error(`🌐 Running hom test for ${strippedUrl} (${folderName})`)

    // If we fetched this website before, empty it's directory
    jetpack.dir(path.join(this.fetchDirectory, folderName), { empty: true })

    console.error('\t🍎 Starting Firefox with hom disabled...')
    const disabledScreenshotPath = path.join(this.fetchDirectory, folderName, 'disabled.png')
    const homDisabled = await this.tryFetch(strippedUrl, false, disabledScreenshotPath, 'disabled.png', folderName)

    console.error('\t🍏 Starting Firefox with hom enabled...')
    const enabledScreenshotPath = path.join(this.fetchDirectory, folderName, 'enabled.png')
    const homEnabled = await this.tryFetch(strippedUrl, true, enabledScreenshotPath, 'enabled.png', folderName)

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

    console.error('\t💾 Saving results...')
    await jetpack.writeAsync(path.join(this.fetchDirectory, folderName, 'result.yaml'), yaml.stringify(result))
    return true
  }

  async tryFetch(url: string, homEnabled: boolean, screenshotPath: string, screenshotName: string, folderName: string): Promise<FetchRun | null> {

    const profilePath = await this.profiles.getProfile()

    const fetchArgs = [url, homEnabled ? 'true' : 'false', screenshotPath, screenshotName, profilePath, this.binaryPath]

    const spawnProcess = (): Promise<FetchRun> => {
      return new Promise((resolve, reject) => {
        const childProcess = fork('./src/index.ts', ['singlefetch', ...fetchArgs], { execArgv: ['-r', 'ts-node/register'] })
        childProcess.on('message', (msg: any) => {
          if (msg.resultObject) {
            resolve(msg.resultObject)
          }
        })
        childProcess.on('exit', () => {
          reject()
        })
      })
    }

    return Promise.race([spawnProcess(), Timeout.set(90000, null)])
  }

  cleanup() {
    return this.profiles.cleanup()
  }

  async resetProfile() {
    await Timeout.set(6000)
    await this.profiles.cleanup()
    await Timeout.set(1000)
    this.profiles = await Profiles.new(this.binaryPath, this.extensionPath)
    await Timeout.set(4000)
  }
}

export default HomTest
