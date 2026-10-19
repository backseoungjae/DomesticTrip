import { serviceError, TourApiError } from './tourApiError';

export function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TourApiError('invalid_response');
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown): number {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !/^\d+$/.test(value))
  ) {
    throw new TourApiError('invalid_response');
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new TourApiError('invalid_response');
  return result;
}

export interface TourApiPage {
  readonly items: Record<string, unknown>[];
  readonly totalCount: number;
  readonly pageNo: number;
  readonly numOfRows: number;
}

/** v4.4 documents XML gateway errors even with _type=json. */
export function parseTourApiResponse(text: string, status: number): TourApiPage {
  const xml = text.trimStart().startsWith('<');
  if (xml) {
    const code = text.match(
      /<(?:\w+:)?(?:returnReasonCode|resultCode)\b[^>]*>\s*(\d{1,4})\s*<\//,
    )?.[1];
    if (code && !/^0+$/.test(code)) throw serviceError(code, status);
  }
  if (status === 401 || status === 403) throw new TourApiError('authentication', undefined, status);
  if (status === 429) throw new TourApiError('quota', undefined, status);

  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    throw new TourApiError(status >= 400 ? 'http' : 'invalid_response', undefined, status);
  }
  const root = requireRecord(decoded);
  if (!root.response && status >= 400) throw new TourApiError('http', undefined, status);
  const response = requireRecord(root.response);
  const header = requireRecord(response.header);
  if (typeof header.resultCode !== 'string' || !/^\d{1,4}$/.test(header.resultCode)) {
    throw new TourApiError('invalid_response');
  }
  if (!/^0+$/.test(header.resultCode)) throw serviceError(header.resultCode, status);
  if (status >= 400) throw new TourApiError('http', undefined, status);
  const body = requireRecord(response.body);
  const totalCount = integer(body.totalCount);
  const pageNo = integer(body.pageNo);
  const numOfRows = integer(body.numOfRows);
  if (pageNo < 1) throw new TourApiError('invalid_response');

  const container = body.items;
  let items: Record<string, unknown>[];
  if (container === '' || container == null) {
    if (totalCount !== 0 && numOfRows !== 0) throw new TourApiError('invalid_response');
    items = [];
  } else {
    const item = requireRecord(container).item;
    if (item == null || item === '') {
      if (totalCount !== 0 && numOfRows !== 0) throw new TourApiError('invalid_response');
      items = [];
    } else {
      items = (Array.isArray(item) ? item : [item]).map(requireRecord);
    }
  }
  if ((totalCount === 0 && items.length > 0) || items.length > numOfRows) {
    throw new TourApiError('invalid_response');
  }
  return { items, totalCount, pageNo, numOfRows };
}
