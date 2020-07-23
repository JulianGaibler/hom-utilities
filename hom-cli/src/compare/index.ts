import CliConfig from '../cli-config'
import CompareIndex from './compare-index'
import { compare } from './comparator'

export default async function(config: CliConfig, dateString?: string) {
  const index = await CompareIndex.new(config, dateString)

  for (const directory of index.fetchDirectories) {
    const result = await compare(directory, config.compareDirectory)
    index.setResult(result)
  }

  await index.generateIndex()
}
