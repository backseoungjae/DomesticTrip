export type TourApiErrorKind =
  | 'configuration'
  | 'authentication'
  | 'quota'
  | 'invalid_request'
  | 'network'
  | 'timeout'
  | 'http'
  | 'service'
  | 'invalid_response';

/** Safe to display/log: never retain URLs, raw responses, service messages or fetch causes. */
export class TourApiError extends Error {
  constructor(
    readonly kind: TourApiErrorKind,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(`TourAPI ${kind}`);
    this.name = 'TourApiError';
  }
}

export function serviceError(code: string, status?: number): TourApiError {
  const normalized = code.replace(/^0+(?=\d)/, '');
  const kind = ['20', '21', '29', '30', '31', '32', '33'].includes(normalized)
    ? 'authentication'
    : ['22', '23'].includes(normalized)
      ? 'quota'
      : ['10', '11', '12'].includes(normalized)
        ? 'invalid_request'
        : 'service';
  // Keep only numeric codes; provider error text may contain request details.
  return new TourApiError(kind, /^\d{1,4}$/.test(code) ? code : undefined, status);
}
