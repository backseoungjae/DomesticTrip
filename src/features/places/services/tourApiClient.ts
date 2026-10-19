import { Platform } from 'react-native';

import type { TourCategory, TourLocale, TourPlace, TourPlaceDetail } from '../domain/TourPlace';

import { TourApiError } from './tourApiError';
import { parseTourApiResponse } from './tourApiResponse';
import { contentTypeIds, mapTourPlace, mapTourPlaceDetail } from './tourPlaceMapper';

export type TourArrange = 'A' | 'C' | 'D' | 'O' | 'Q' | 'R';

export interface TourFilters {
  readonly regionCode?: string;
  readonly districtCode?: string;
  readonly classification1?: string;
  readonly classification2?: string;
  readonly classification3?: string;
}

export interface TourListRequest {
  readonly language: TourLocale;
  readonly page?: number;
  readonly pageSize?: number;
  readonly arrange?: TourArrange;
  readonly filters?: TourFilters;
  readonly category?: TourCategory;
}

// searchKeyword2 no longer accepts contentTypeId (국문/영문 v4.4).
export interface TourSearchRequest extends Omit<TourListRequest, 'category'> {
  readonly keyword: string;
}

export interface TourPlacesPage {
  readonly places: TourPlace[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
}

export function normalizeTourList(request: TourListRequest) {
  if (!['ko', 'en'].includes(request.language)) throw new TourApiError('invalid_request');
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 20;
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new TourApiError('invalid_request');
  }
  const arrange = request.arrange ?? 'A';
  if (!['A', 'C', 'D', 'O', 'Q', 'R'].includes(arrange)) throw new TourApiError('invalid_request');
  const input = request.filters;
  const filters = {
    regionCode: input?.regionCode?.trim() || undefined,
    districtCode: input?.districtCode?.trim() || undefined,
    classification1: input?.classification1?.trim() || undefined,
    classification2: input?.classification2?.trim() || undefined,
    classification3: input?.classification3?.trim() || undefined,
  };
  if (
    (filters.districtCode && !filters.regionCode) ||
    (filters.classification2 && !filters.classification1) ||
    (filters.classification3 && (!filters.classification1 || !filters.classification2)) ||
    (request.category && !contentTypeIds[request.language][request.category])
  )
    throw new TourApiError('invalid_request');
  return {
    language: request.language,
    page,
    pageSize,
    arrange,
    filters,
    category: request.category,
  };
}

export function normalizeTourSearch(request: TourSearchRequest) {
  // Do not silently accept a runtime caller's unsupported category filter.
  if ('category' in request && request.category != null) throw new TourApiError('invalid_request');
  const { category: _category, ...list } = normalizeTourList(request);
  return { ...list, keyword: request.keyword.trim() };
}

function listParameters(request: ReturnType<typeof normalizeTourList>): Record<string, string> {
  const params: Record<string, string> = {
    pageNo: String(request.page),
    numOfRows: String(request.pageSize),
    arrange: request.arrange,
  };
  const names = {
    regionCode: 'lDongRegnCd',
    districtCode: 'lDongSignguCd',
    classification1: 'lclsSystm1',
    classification2: 'lclsSystm2',
    classification3: 'lclsSystm3',
  } as const;
  for (const key of Object.keys(names) as (keyof typeof names)[]) {
    const value = request.filters[key];
    if (value) params[names[key]] = value;
  }
  if (request.category) params.contentTypeId = contentTypeIds[request.language][request.category]!;
  return params;
}

async function requestPage(
  language: TourLocale,
  operation: 'areaBasedList2' | 'searchKeyword2' | 'detailCommon2',
  parameters: Record<string, string>,
  signal?: AbortSignal,
) {
  if (!['ko', 'en'].includes(language)) throw new TourApiError('invalid_request');
  let key = process.env.EXPO_PUBLIC_TOUR_API_KEY?.trim();
  if (!key) throw new TourApiError('configuration');
  // Accept the portal's encoded or decoded key, encoding exactly once below.
  try {
    key = decodeURIComponent(key);
  } catch {
    throw new TourApiError('configuration');
  }
  const service = language === 'ko' ? 'KorService2' : 'EngService2';
  const mobileOS = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'AND' : 'ETC';
  const params = new URLSearchParams({
    serviceKey: key,
    MobileOS: mobileOS,
    MobileApp: 'DomesticTrip',
    _type: 'json',
    ...parameters,
  });
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);
  try {
    const response = await fetch(
      `https://apis.data.go.kr/B551011/${service}/${operation}?${params}`,
      {
        signal: controller.signal,
      },
    );
    return parseTourApiResponse(await response.text(), response.status);
  } catch (error) {
    if (error instanceof TourApiError) throw error;
    // Fetch exceptions can include the full URL. Replace, never forward them.
    throw new TourApiError(timedOut ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

function mapPage(
  page: Awaited<ReturnType<typeof requestPage>>,
  language: TourLocale,
  requestedPage: number,
  pageSize: number,
): TourPlacesPage {
  if (page.pageNo !== requestedPage || page.items.length > pageSize) {
    throw new TourApiError('invalid_response');
  }
  return {
    places: page.items.map((item) => mapTourPlace(item, language)),
    totalCount: page.totalCount,
    page: page.pageNo,
    // TourAPI returns actual rows (0 for empty results), not the requested size.
    pageSize,
    hasNextPage: page.items.length > 0 && page.pageNo * pageSize < page.totalCount,
  };
}

export const tourApiClient = {
  async list(input: TourListRequest, signal?: AbortSignal): Promise<TourPlacesPage> {
    const request = normalizeTourList(input);
    return mapPage(
      await requestPage(request.language, 'areaBasedList2', listParameters(request), signal),
      request.language,
      request.page,
      request.pageSize,
    );
  },
  async search(input: TourSearchRequest, signal?: AbortSignal): Promise<TourPlacesPage> {
    const request = normalizeTourSearch(input);
    if (!request.keyword) throw new TourApiError('invalid_request');
    return mapPage(
      await requestPage(
        request.language,
        'searchKeyword2',
        {
          ...listParameters({ ...request, category: undefined }),
          keyword: request.keyword,
        },
        signal,
      ),
      request.language,
      request.page,
      request.pageSize,
    );
  },
  async detail(
    language: TourLocale,
    contentId: string,
    signal?: AbortSignal,
  ): Promise<TourPlaceDetail | null> {
    if (!contentId.trim()) throw new TourApiError('invalid_request');
    const page = await requestPage(
      language,
      'detailCommon2',
      { contentId: contentId.trim(), numOfRows: '1', pageNo: '1' },
      signal,
    );
    if (!page.items.length) return null;
    const place = mapTourPlaceDetail(page.items[0], language);
    if (place.contentId !== contentId.trim() || page.items.length !== 1)
      throw new TourApiError('invalid_response');
    return place;
  },
};
