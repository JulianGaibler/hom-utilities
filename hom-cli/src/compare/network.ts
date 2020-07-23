import { NetStats, EventsResult, EventResult, stringToSecurityState, WhenRequested, TypeSummary } from './types'
import { FetchRun } from '../fetch/homtest'
import { stripProtocol, round } from '../utils'

interface MergedRawEvents {
  url: string,
  disabledEvent: RawEvent | null,
  enabledEvent: RawEvent | null,
}

export default async function(disabledRun: FetchRun, enabledRun: FetchRun): Promise<[number, EventsResult[], NetStats]> {
  const mergedEvents = mergeNetworkEvents(disabledRun, enabledRun)

  const netStats: NetStats = {
    overallRequests: mergedEvents.length,

    requestsOnlyDisabled: 0,
    requestsOnlyEnabled: 0,
    requestsBoth: 0,

    requestsIgnored: 0,

    upgradedWithHom: 0,
    failedOnHom: 0,

    byType: [],
  }

  const analyzedEvents: EventsResult[] = mergedEvents.map(netEvent => {
    // Get values
    const [homDisabled, ignored1] = getEventResult(netEvent.disabledEvent)
    const [homEnabled, ignored2] = getEventResult(netEvent.enabledEvent)

    const url = netEvent.url
    const ignored = ignored1 || ignored2 || isIgnored(netEvent)
    const whenRequested = getWhenRequested(netEvent)
    const type = getType(netEvent, whenRequested)
    const failedOnHom = false

    // Stats
    increaseTypeStats(netStats, type, failedOnHom)

    if (ignored) { netStats.requestsIgnored++ }

    if (whenRequested === WhenRequested.HomEnabled) { netStats.requestsOnlyEnabled++ }
    else if (whenRequested === WhenRequested.HomDisabled) { netStats.requestsOnlyDisabled++ }
    else { netStats.requestsBoth++ }

    if (homEnabled && homEnabled.homUpgraded) {
      netStats.upgradedWithHom++
    }
    if (homEnabled && homEnabled.failed !== false && homEnabled.failed.blocked === false) {
      netStats.failedOnHom++
    }

    // Assemble result object
    return {
      url,
      ignored,
      whenRequested,
      type,
      homDisabled,
      homEnabled,
    }
  })

  const diff = round((netStats.failedOnHom / netStats.overallRequests) * 100)
  return [diff, analyzedEvents, netStats]
}

function increaseTypeStats(netStats: NetStats, type: string, failedOnHom: boolean) {
  let index = netStats.byType.findIndex((summary: TypeSummary) => summary.name === type)

  if (index === -1) {
    index = netStats.byType.push({
      name: type,
      requested: 0,
      failed: 0,
    }) - 1
  }

  netStats.byType[index].requested++
  if (failedOnHom) {
    netStats.byType[index].failed++
  }
}

function isIgnored(mergedEvents: MergedRawEvents): boolean {
  if (
    mergedEvents.disabledEvent &&
    mergedEvents.disabledEvent.blockedReason !== undefined &&
    mergedEvents.disabledEvent.blockedReason > 2001
  ) {
    return true
  }
  if (
    mergedEvents.enabledEvent &&
    mergedEvents.enabledEvent.blockedReason !== undefined &&
    mergedEvents.enabledEvent.blockedReason > 2001
  ) {
    return true
  }

  return false
}

function getWhenRequested(mergedEvents: MergedRawEvents): WhenRequested {
  if (mergedEvents.disabledEvent && mergedEvents.enabledEvent) {
    return WhenRequested.Both
  } else if (mergedEvents.disabledEvent) {
    return WhenRequested.HomDisabled
  } else if (mergedEvents.enabledEvent) {
    return WhenRequested.HomEnabled
  }
  throw new Error('🔥 Impossible Case!')
}

function getType(mergedEvents: MergedRawEvents, whenRequested: WhenRequested): string {
  if (whenRequested === WhenRequested.HomEnabled || whenRequested === WhenRequested.Both) {
    return mergedEvents.enabledEvent.cause.type
  }
  return mergedEvents.disabledEvent.cause.type
}


function mergeNetworkEvents(disabledRun: FetchRun, enabledRun: FetchRun): MergedRawEvents[] {
  const uriMap: Map<string, MergedRawEvents> = new Map()

  const populateMap = (run: FetchRun, field) => run.networkEvents.forEach((event: RawEvent) => {
    const key = stripProtocol(event.url)
    const entry = uriMap.get(key)
    if (entry) {
      entry[field] = event
    } else {
      const obj = {
        url: key,
        disabledEvent: null,
        enabledEvent: null,
      }
      obj[field] = event
      uriMap.set(key, obj)
    }
  })

  populateMap(disabledRun, 'disabledEvent')
  populateMap(enabledRun, 'enabledEvent')
  return Array.from(uriMap.entries()).map(arr => arr[1])
}

function getEventResult(rawEvent: RawEvent): [EventResult, boolean] {
  if (rawEvent === null) return [null, false]

  let loaded: EventResult['loaded'] = false
  let failed: EventResult['failed'] = false
  let ignored = false

  if (!rawEvent.blockedReason && rawEvent.updates.securityInfo || rawEvent.isXHR) {
    loaded = {
      securityState: stringToSecurityState(rawEvent.isXHR ? 'xhr' : rawEvent.updates.securityInfo.state),
      status: rawEvent.updates.responseStart ? rawEvent.updates.responseStart.response.status : null,
      statusText: rawEvent.updates.responseStart ? rawEvent.updates.responseStart.response.statusText : null,
    }
  } else if (rawEvent.blockedReason !== undefined && rawEvent.blockedReason > 0) {
    failed = {
      blocked: true,
      blockedReason: BLOCKED_REASON_MESSAGES[rawEvent.blockedReason],
    }
  } else if (rawEvent.updates.responseContent && rawEvent.updates.responseContent.transferredSize === 0) {
    failed = {
      blocked: false,
      blockedReason: '',
    }
  } else {
    console.error('🔥 [rawEvent]', rawEvent)
    ignored = true
  }

  const result: EventResult = {
    // eslint-disable-next-line no-bitwise
    homUpgraded: !!(rawEvent.httpsOnlyStatus & HTTPS_ONLY_UPGRADED_LISTENER_REGISTERED),
    loaded,
    failed,
    rawEvent,
  }

  return [result, ignored]
}

// eslint-disable-next-line no-bitwise
const HTTPS_ONLY_UNINITIALIZED = (1 << 0)
// eslint-disable-next-line no-bitwise
const HTTPS_ONLY_UPGRADED_LISTENER_NOT_REGISTERED = (1 << 1)
// eslint-disable-next-line no-bitwise
const HTTPS_ONLY_UPGRADED_LISTENER_REGISTERED = (1 << 2)
// eslint-disable-next-line no-bitwise
const HTTPS_ONLY_EXEMPT = (1 << 3)

const BLOCKED_REASON_MESSAGES = {
  devtools: 'Blocked by DevTools',
  1001: 'CORS disabled',
  1002: 'CORS Failed',
  1003: 'CORS Not HTTP',
  1004: 'CORS Multiple Origin Not Allowed',
  1005: 'CORS Missing Allow Origin',
  1006: 'CORS No Allow Credentials',
  1007: 'CORS Allow Origin Not Matching Origin',
  1008: 'CORS Missing Allow Credentials',
  1009: 'CORS Origin Header Missing',
  1010: 'CORS External Redirect Not Allowed',
  1011: 'CORS Preflight Did Not Succeed',
  1012: 'CORS Invalid Allow Method',
  1013: 'CORS Method Not Found',
  1014: 'CORS Invalid Allow Header',
  1015: 'CORS Missing Allow Header',
  2001: 'Malware',
  2002: 'Phishing',
  2003: 'Unwanted',
  2004: 'Tracking',
  2005: 'Blocked',
  2006: 'Harmful',
  2007: 'Cryptomining',
  2008: 'Fingerprinting',
  2009: 'Socialtracking',
  3001: 'Mixed Block',
  4000: 'CSP',
  4001: 'CSP No Data Protocol',
  4002: 'CSP Web Extension',
  4003: 'CSP ContentBlocked',
  4004: 'CSP Data Document',
  4005: 'CSP Web Browser',
  4006: 'CSP Preload',
  5000: 'Not same-origin',
  6000: 'Blocked By Extension',
}

interface RawEvent {
  actor: string,
  startedDateTime: string,
  timeStamp: number,
  url: string,
  method: string,
  isXHR: boolean,
  httpsOnlyStatus: number,
  cause: {
    type: string,
    loadingDocumentUri: string,
    stacktraceAvailable: boolean,
  },
  private: boolean,
  isThirdPartyTrackingResource: boolean,
  referrerPolicy: string,
  channelId: number,
  blockedReason: number,
  blockingExtension: string,
  updates: {
    requestHeaders?: {
      headers: number,
      headersSize: number,
    },
    requestCookies?: {
      cookies: number,
    },
    responseStart?: {
      response: {
        httpVersion: string,
        remoteAddress: string,
        remotePort: number,
        status: string,
        statusText: string,
        headersSize: number,
        waitingTime: number,
        discardResponseBody: boolean,
      },
    },
    eventTimings?: {
      totalTime: number,
    },
    securityInfo?: {
      state: string,
      isRacing: boolean,
    },
    responseHeaders?: {
      headers: number,
      headersSize: number,
    },
    responseCookies?: {
      cookies: number,
    },
    responseContent?: {
      mimeType: string,
      contentSize: number,
      transferredSize: number,
      discardResponseBody: boolean,
      blockedReason: number,
    },
  },
}
