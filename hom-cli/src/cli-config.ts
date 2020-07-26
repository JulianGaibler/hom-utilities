import yaml from 'yaml'
import * as jetpack from 'fs-jetpack'

export default class CliConfig {
  binaryPath: string
  extensionPath: string
  fetchDirectory: string
  compareIndexPath: string
  compareDirectory: string

  static async new(path) {
    const file = await jetpack.readAsync(path)
    const object = yaml.parse(file)

    const c = new this()
    c.binaryPath = jetpack.path('..', object.homFetch.binaryPath)
    c.extensionPath = object.homFetch.extensionPath ? jetpack.path('..', object.homFetch.extensionPath) : undefined
    c.fetchDirectory = jetpack.path('..', object.homFetch.fetchDirectory)
    c.compareIndexPath = jetpack.path('..', object.homCompare.compareIndexPath)
    c.compareDirectory = jetpack.path('..', object.homCompare.compareDirectory)
    return c
  }
}
