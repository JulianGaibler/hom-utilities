![hom utilities](http://qvieo.com/githubimg/banner_homutils.png)

## Introduction

Archive is a web platform that helps you to share, store, and index media files.

## Usage

`npm run dev fetch <config> <urls..>`
`npm run dev compare <config> [date]`

## Setup and Configuration

### hom cli

The CLI consists of 'hom fetch' and 'hom compare'

``` bash
# Install dependencies
npm install
# Run hom fetch
npm run dev fetch <config> <urls..>
# Run hom compare
npm run dev compare <config> [date]
```

So the Foxr module and Firefox's Marionette both seem to have some shortcomings in terms of API and reliability. Because this is more of a side project, I made some [light](https://youtu.be/q0GCKXZTV8E) modifications to the Foxr code to mitigate all of that a bit. It's all somewhat experimental, and at this point doesn't warrant a pull request, I think.

After calling `npm install`, go to `node_modules/foxr/build/api/Foxr.js` and make two changes:
1. Change both `defaultViewport` values to 1000 in the `connect()` function
2. In the `launch()` function, remove the `-safe-mode` argument from args
3. Change the return value in `launch()` from `return this.connect(options);` to `return [await this.connect(options), firefoxProcess];`
4. Finally go to `node_modules/foxr/build/api/Foxr.d.ts` and change `launch(userOptions: TLaunchOptions): Promise<Browser>;` to `launch(userOptions: TLaunchOptions): Promise<[Browser, any]>;` so Typescript won't scream at you.

### hom viewer

``` bash
# Install dependencies
npm install
# Run dev-server
npm run dev
# Build server
npm run build
```

## Contribution and Commits

Contributions such as pull requests, reporting bugs and suggesting enhancements are always welcome!

We're using [gitmoji](https://gitmoji.carloscuesta.me/) for all commits.
