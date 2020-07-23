import sharp from 'sharp'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import path from 'path'
import * as jetpack from 'fs-jetpack'

import { PathFunction, ScreenshotFiles } from './types'
import { Fetch } from '../fetch/homtest'
import { round } from '../utils'

export default async function(srcDirPath: string, fetchResult: Fetch, destFilePath: PathFunction): Promise<[number, ScreenshotFiles]> {
  const screenshotPathOn = fetchResult.homDisabled.screenshotPath ? path.join(srcDirPath, fetchResult.homDisabled.screenshotPath) : null
  const screenshotPathOff = fetchResult.homEnabled.screenshotPath ? path.join(srcDirPath, fetchResult.homEnabled.screenshotPath) : null

  let visualDifference = null
  const files: ScreenshotFiles = {
    thumbnailDisabled: null,
    thumbnailEnabled: null,
    screenshotDisabled: null,
    screenshotEnabled: null,
    screenshotDiff: null,
  }

  if (screenshotPathOn) {
    files.thumbnailDisabled = 'thumbnailDisabled.jpg'
    await createThumbnail(screenshotPathOn, destFilePath(files.thumbnailDisabled))
  }
  if (screenshotPathOff) {
    files.thumbnailEnabled = 'thumbnailEnabled.jpg'
    await createThumbnail(screenshotPathOff, destFilePath(files.thumbnailEnabled))
  }
  if (screenshotPathOn && screenshotPathOff) {
    visualDifference = await compareImages(screenshotPathOn, screenshotPathOff, destFilePath, files)
  }

  return [visualDifference, files]
}

/**
 * Resizes image and saves at different location
 *
 * @param fileFrom Original screenshot path
 * @param fileTo Path where to save the thumbnail to other location
 */
async function createThumbnail(fileFrom: string, fileTo: string) {
  const buffer = await sharp(fileFrom)
    .resize({
      width: 640,
      height: 360,
      fit: 'cover',
      position: 'right top',
    })
    .jpeg({
      quality: 75,
    })
    .toBuffer()
  jetpack.writeAsync(fileTo, buffer)
}

/**
 * Saves full-size screenshots and diff-image
 *
 * @param path1 Path of first screenshot
 * @param path2 Path of second screenshot
 * @param createPath PathFunction function
 * @param compareResult ScreenshotFiles object
 * @returns Visual difference in %
 */
async function compareImages(path1: string, path2: string, createPath: PathFunction, compareResult: ScreenshotFiles): Promise<number> {
  const dimension = 1000
  const createBuffer = (filePath: string) => sharp(filePath)
    .resize({
      width: dimension,
      height: dimension,
      fit: 'cover',
      position: 'right top',
    }).toBuffer()

  const buffer1 = PNG.sync.read(await createBuffer(path1))
  const buffer2 = PNG.sync.read(await createBuffer(path2))
  const output = new PNG({width: buffer1.width, height: buffer1.height})

  const numDifferentPixels = pixelmatch(buffer1.data, buffer2.data, output.data, buffer1.width, buffer1.height, {
    threshold: 0.1,
    aaColor: [34,131,108],
    diffColor: [41,202,164],
  })

  compareResult.screenshotDisabled = 'disabled.png'
  compareResult.screenshotEnabled = 'enabled.png'
  compareResult.screenshotDiff = 'diff.png'

  jetpack.write(createPath(compareResult.screenshotDisabled), PNG.sync.write(buffer1))
  jetpack.write(createPath(compareResult.screenshotEnabled), PNG.sync.write(buffer2))
  jetpack.write(createPath(compareResult.screenshotDiff), PNG.sync.write(output))

  return round((numDifferentPixels / (dimension * dimension)) * 100)
}
