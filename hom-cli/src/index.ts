import yargs from 'yargs'
import CliConfig from './cli-config'
import Fetch from './fetch'
import doFetch from './fetch/fetch'
import Compare from './compare'


const args = yargs
  .command('fetch <config> <urls..>', 'Loads websites once with hom enabled and once with hom disabled', y => {
    y.positional('config', {
      describe: 'yaml configuration file for hom',
      type: 'string',
      normalize: true,
    })
    y.positional('urls', {
      describe: 'urls to fetch from',
      type: 'string',
    })
  })
  .command('singlefetch <args...>', 'Loads websites once with hom enabled and once with hom disabled')
  .command('compare <config> [date]', 'Loads websites once with hom enabled and once with hom disabled', y => {
    y.positional('config', {
      describe: 'yaml configuration file for hom',
      type: 'string',
      normalize: true,
    })
    y.positional('date', {
      describe: 'date of oldest fetch result to look at',
      type: 'string',
    })
  })
  .demandCommand()
  .help()
  .argv

if (args._[0] === 'singlefetch') {
  doFetch.apply(null, args.args)
} else {
  CliConfig.new(args.config).then(async config => {
    switch (args._[0]) {
      case 'fetch':
        await Fetch(config, args.urls as string[])
        break
      case 'compare':
        await Compare(config, args.date as string)
        break
    }
    process.exit(0)
  }).catch(e => {
    console.error('🔥 Hmm, something went wrong:', e)
  })
}
