
import yaml from 'yaml'
import * as jetpack from 'fs-jetpack'
import CliConfig from '../cli-config'
import { CompareResult, LoadResult } from './types'

export interface FetchDirectory {
  path: string,
  name: string,
}

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
      // Sites crawled total
      sitesCrawled: allResults.length,
      // Didn’t load with HOM enabled
      failedOnHom: 0,
      // Had over 15% failed subresource loads
      subresourceDiffOver15: 0,
      // Had a visual difference of 15% or higher
      visualDiffOver15: 0,
    }

    const indexResults = allResults.map((result: CompareResult) => {

      if (result.stats.loadedEnabled === LoadResult.FailedWithHomError) {
        stats.failedOnHom++
      }
      if (result.stats.requestDiff > 15.0) {
        stats.subresourceDiffOver15++
      }
      if (result.stats.visualDiff > 15.0) {
        stats.visualDiffOver15++
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
