import yaml from 'yaml'
import path from 'path'
import * as jetpack from 'fs-jetpack'
import { Fetch, FetchRun } from '../fetch/homtest'
import { FetchDirectory } from './compare-index'
import { PathFunction, CompareResult, LoadResult } from './types'
import generateImages from './images'
import generateNetReport, { RawEvent } from './network'
import { round } from '../utils'
import { expose } from 'threads/worker'

const HOM_COMPARE_RESULT_VERSION = 1

export async function compare(srcDir: FetchDirectory, destDir: string): Promise<CompareResult> {
  console.log(`🧐 Comparing '${srcDir.name}'...`)
  // Helper method to create absolute file paths to the destination directory
  const destFilePath: PathFunction = (fileName: string) => path.join(destDir, srcDir.name, fileName)
  // Let's load the fetch results from file
  const fetchResults = await getResultFile(srcDir.path)

  const [visualDifference, files] = await generateImages(srcDir.path, fetchResults, destFilePath)
  const [netDifference, eventResults, netStats] = await generateNetReport(fetchResults.homDisabled, fetchResults.homEnabled)

  const results: CompareResult = {
    id: srcDir.name,
    websiteUrl: fetchResults.websiteUrl,

    dateFetched: fetchResults.dateISO,
    dateCompared: (new Date()).toISOString(),

    homFetchVersion: fetchResults.homFetchVersion,
    homCompareVersion: HOM_COMPARE_RESULT_VERSION,

    images: files,

    stats: {
      visualDiff: visualDifference,
      requestDiff: netDifference,
      upgradeDiff: netStats.upgradedWithHom > 0 ? round((netStats.upgradedWithHomAndFailed / netStats.upgradedWithHom) * 100) : null,

      loadedDisabled: getLoadResult(fetchResults.homDisabled),
      loadedEnabled: getLoadResult(fetchResults.homEnabled),
    },
    netStats,
    eventResults,
  }

  if (fetchResults.adult) {
    results.adult = fetchResults.adult
  }

  await saveResults(results, destFilePath)

  console.log(`✅ Done with '${srcDir.name}'...`)
  return results
}

async function getResultFile(directoryPath: string): Promise<Fetch> {
  try {
    const fetchResultFile = await jetpack.readAsync(path.join(directoryPath, 'result.yaml'))
    return yaml.parse(fetchResultFile)
  } catch (e) {
    console.error(e)
    throw new Error(`Something went wrong when reading and parsing '${directoryPath}'.`)
  }
}

function getLoadResult(fetchRun: FetchRun): LoadResult {
  if (!fetchRun.failedToLoad) {
    if ((fetchRun.networkEvents as RawEvent[]).some(event => {
      if (event.cause.type !== 'document') return false
      const status = event.updates?.responseStart?.response?.status
      if (status) {
        const statusNr = parseInt(status, 2)
        return statusNr >= 400
      }
      return false
    })) {
      return LoadResult.ErrorCode
    }
    return LoadResult.Loaded
  } else if (fetchRun.httpsOnlyErrorPage) {
    return LoadResult.FailedWithHomError
  } else {
    return LoadResult.Failed
  }
}

async function saveResults(compareResult: CompareResult, pathFunction: PathFunction) {
  await jetpack.writeAsync(pathFunction('result.yaml'), yaml.stringify(compareResult))
}

expose(compare)
