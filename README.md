![hom utilities](http://qvieo.com/githubimg/banner_homutils.png)

## Introduction

Archive is a web platform that helps you to share, store, and index media files.

## Usage

`npm run dev fetch <config> <urls..>`
`npm run dev compare <config> [date]`

## Setup and Configuration

### hom cli

The CLI consists of 'hom fetch' and 'hom compare'

I forked a module called [Foxr](https://github.com/JulianWels/foxr) and added it as a local submodule, so it has to be packaged seperately:

Fetching websites requires a modified version of Firefox. In the root directory of this repository is a file called `firefox.patch` which applies all neccesary changes.

``` bash
# Navigate to the foxr directory
cd forx
# Install dependencies
yarn install
# Package the module
yarn start pack
# Done :)
```

Now we can install and run the CLI:

``` bash
# Install dependencies
npm install
# Run hom fetch
npm run dev fetch <config> <urls..>
# Run hom compare
npm run dev compare <config> [date]
```

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
