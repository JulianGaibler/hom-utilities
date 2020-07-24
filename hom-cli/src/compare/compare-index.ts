
import yaml from 'yaml'
import * as jetpack from 'fs-jetpack'
import CliConfig from '../cli-config'
import { CompareResult, LoadResult } from './types'

export interface FetchDirectory {
  path: string,
  name: string,
}

const VISUAL_CUTOFF = 20.0 // in %
const SUBRESOURCE_CUTOFF = 5.0 // in %

class CompareIndex {
  fetchDirectories: FetchDirectory[]
  private compareResults: Map<string, CompareResult>
  private compareIndexPath: string

  static async new(cliConfig: CliConfig, dateStr: string) {
    // Parse date if we have one
    let smallestDate: undefined | Date
    if (dateStr) {
      smallestDate = new Date(dateStr)
      if (!(smallestDate instanceof Date && !isNaN(smallestDate.valueOf()))) {
        throw new Error('😡 Invalid Date String')
      }
    }
    // Get all directories we want to analyze
    const fetchDirectories = await CompareIndex.getDirectories(jetpack.path('..', cliConfig.fetchDirectory), smallestDate)
    // Create new map for compare results and populate it with the old index (if it exists)
    const compareResults = await CompareIndex.getCompareResults(cliConfig.compareIndexPath)

    const that = new CompareIndex()
    that.compareResults = compareResults
    that.fetchDirectories = fetchDirectories
    that.compareIndexPath = cliConfig.compareIndexPath
    return that
  }

  private static async getDirectories(fetchDirectory: string, from?: Date): Promise<FetchDirectory[]> {
    const treeResult = await jetpack.inspectTreeAsync(fetchDirectory, {
      times: true,
    })
    let directoryResults = treeResult.children.filter(dir => dir.type === 'dir')
    if (from) {
      directoryResults = directoryResults.filter(dir => dir.modifyTime > from)
    }

    return directoryResults
      .map(dir => ({
        path: jetpack.path(fetchDirectory, dir.name),
        name: dir.name,
      }))
  }

  private static async getCompareResults(indexPath: string): Promise<Map<string, any>> {
    const indexFile = await jetpack.readAsync(indexPath)
    const compareResults = new Map()
    if (indexFile) {
      yaml.parse(indexFile).results.forEach(result => compareResults.set(result.id, result))
    }
    return compareResults
  }

  setResult(result: CompareResult) {
    this.compareResults.set(result.id, result)
  }

  async generateIndex() {
    const allResults: CompareResult[] = Array.from(this.compareResults.entries()).map(arr => arr[1])
    const stats = {
      sitesCrawled: {
        value: allResults.length,
        name: 'Sites Crawled',
        description: 'Number of websites that were crawled and indexed',
      },
      failedOnHom: {
        value: 0,
        name: 'Failed with HOM',
        description: 'Websites that only failed when HTTPS-Only Mode was enabled',
      },
      highSubresourceDiff: {
        value: 0,
        name: 'High Subresource Difference',
        description: `Websites where over ${SUBRESOURCE_CUTOFF}% of requested subresources failed to load`,
      },
      highVisualDiff: {
        value: 0,
        name: 'High Visual Difference',
        description: `Websites where visual difference between screenshots was higher than ${VISUAL_CUTOFF}%`,
      },
    }

    const indexResults = allResults.map((result: CompareResult) => {

      if (result.stats.loadedEnabled === LoadResult.FailedWithHomError) {
        stats.failedOnHom.value++
      }
      if (result.stats.requestDiff > SUBRESOURCE_CUTOFF) {
        stats.highSubresourceDiff.value++
      }
      if (result.stats.visualDiff > VISUAL_CUTOFF) {
        stats.highVisualDiff.value++
      }

      return {
        id: result.id,
        websiteUrl: result.websiteUrl,
        dateFetched: result.dateFetched,
        dateCompared: result.dateCompared,
        homFetchVersion: result.homFetchVersion,
        homCompareVersion: result.homCompareVersion,
        stats: result.stats,
      }
    })

    await jetpack.writeAsync(jetpack.path('..', this.compareIndexPath), yaml.stringify({ stats, results: indexResults }))
  }
}

export default CompareIndex
