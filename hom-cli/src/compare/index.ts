import CliConfig from '../cli-config'
import CompareIndex from './compare-index'
import { spawn, Pool, Worker } from 'threads'

export default async function(config: CliConfig, dateString?: string) {
  const index = await CompareIndex.new(config, dateString)

  const pool = Pool(() => spawn(new Worker('./comparator-worker.js')), 48)

  for (const directory of index.fetchDirectories) {
    pool.queue(async compare => {
      const result = await compare(directory, config.compareDirectory)
      index.setResult(result)
    })
  }

  await pool.completed()
  await pool.terminate()

  await index.generateIndex()
}
