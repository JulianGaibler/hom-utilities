import CliConfig from '../cli-config'
import HomTest from './homtest'
import { wait } from './Utils'

export default async function(config: CliConfig, urls: string[]) {

  const homtest = await HomTest.new(config)
  let counter = 0

  for (const url of urls) {
    await homtest.run(url)
    if (++counter > 2) {
      counter = 0
      await homtest.resetProfile()
    }
  }

  await homtest.cleanup()
}
