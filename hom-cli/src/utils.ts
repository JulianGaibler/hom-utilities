export function round(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export function stripProtocol(url: string): string {
  return url.replace(/(http|https)\:\/\//, '')
}
