import CliConfig from '../cli-config'
import HomTest from './homtest'

export default async function(config: CliConfig, urls: string[]) {

  const homtest = await HomTest.new(config)

  for (const url of urls) {
    await homtest.run(url)
  }

  await homtest.cleanup()
}
