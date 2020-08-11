export type PathFunction = (fileName: string) => string

export enum SecurityState {
  Secure = 'secure',
  Insecure = 'insecure',
  Broken = 'broken',
  Weak = 'weak',
  XHR = 'xhr',
}

export enum WhenRequested {
  HomDisabled = 'homDisabled',
  HomEnabled = 'homEnabled',
  Both = 'both',
}

export enum LoadResult {
  Loaded = 'loaded',
  Failed = 'failed',
  ErrorCode = 'errorCode',
  FailedWithHomError = 'failedWithHomError',
}

export interface Stats {
  visualDiff: number | null,
  requestDiff: number | null,
  upgradeDiffSmart: number | null,

  loadedDisabled: LoadResult,
  loadedEnabled: LoadResult,
}

export interface NetStats {
  overallRequests: number,
  overallSubresourceRequests: number,

  requestsOnlyDisabled: number,
  requestsOnlyEnabled: number,
  requestsBoth: number,

  requestsIgnored: number,

  upgradedWithHom: number,
  failedOnHomNaive: number,
  upgradedWithHomAndFailedNaive: number,
  failedOnHomSmart: number,
  upgradedWithHomAndFailedSmart: number,

  byType: TypeSummary[],
}

export interface ScreenshotFiles {
  thumbnailDisabled: string | null,
  thumbnailEnabled: string | null,

  screenshotDisabled: string | null,
  screenshotEnabled: string | null,

  screenshotDiff: string | null,
}

export interface CompareResult {
  id: string,
  websiteUrl: string,

  // Fetch and compare dates in ISO format
  dateFetched: string,
  dateCompared: string,

  homFetchVersion: number,
  homCompareVersion: number,

  adult?: boolean,

  // Names of image files
  images: ScreenshotFiles,

  stats: Stats,
  netStats: NetStats,
  eventResults: EventsResult[],
}

export interface TypeSummary {
  name: string,
  requested: number,
  upgraded: number,
  failed: number,
}

export interface EventsResult {
  url: string,
  ignored: boolean,
  whenRequested: WhenRequested,
  type: string,
  homDisabled: EventResult | null,
  homEnabled: EventResult | null,
}

export interface EventResult {
  homUpgraded: boolean,

  loaded: {
    securityState: SecurityState,
    status: string | null,
    statusText: string | null,
  } | false,

  failed: {
    blocked: boolean,
    blockedReason: string | null,
  } | false,

  rawEvent: any,
}

export function stringToSecurityState(str: string): SecurityState {
  switch (str) {
    case 'secure':
      return SecurityState.Secure
      break
    case 'insecure':
      return SecurityState.Insecure
      break
    case 'broken':
      return SecurityState.Broken
      break
    case 'weak':
      return SecurityState.Weak
      break
    case 'xhr':
      return SecurityState.XHR
      break
    default:
      throw new Error('Unknown security state!')
      break
  }
}
