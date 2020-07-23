import yaml from 'yaml'
import path from 'path'
import * as jetpack from 'fs-jetpack'
import { Fetch, FetchRun } from '../fetch/homtest'
import { FetchDirectory } from './compare-index'
import { PathFunction, CompareResult, LoadResult } from './types'
import generateImages from './images'
import generateNetReport from './network'

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

      loadedDisabled: getLoadResult(fetchResults.homDisabled),
      loadedEnabled: getLoadResult(fetchResults.homEnabled),
    },
    netStats,
    eventResults,
  }

  await saveResults(results, destFilePath)

  return results
}

async function getResultFile(directoryPath: string): Promise<Fetch> {
  const fetchResultFile = await jetpack.readAsync(path.join(directoryPath, 'result.yaml'))
  return yaml.parse(fetchResultFile)
}

function getLoadResult(fetchRun: FetchRun): LoadResult {
  if (!fetchRun.failedToLoad) {
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
