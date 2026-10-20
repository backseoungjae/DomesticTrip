import { queryOptions, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { TourLocale } from '../domain/TourPlace';
import {
  normalizeTourList,
  normalizeTourSearch,
  tourApiClient,
  type TourListRequest,
  type TourSearchRequest,
} from '../services/tourApiClient';
import { TourApiError } from '../services/tourApiError';

const cacheOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: (failureCount: number, error: Error) =>
    failureCount < 1 &&
    error instanceof TourApiError &&
    ['network', 'timeout'].includes(error.kind),
};

export const tourPlaceKeys = {
  list: (request: TourListRequest) => ['tourPlaces', 'list', normalizeTourList(request)] as const,
  search: (request: TourSearchRequest) =>
    ['tourPlaces', 'search', normalizeTourSearch(request)] as const,
  detail: (language: TourLocale, contentId: string) =>
    ['tourPlaces', 'detail', language, contentId.trim()] as const,
};

export function tourListOptions(input: TourListRequest) {
  const request = normalizeTourList(input);
  return queryOptions({
    ...cacheOptions,
    queryKey: tourPlaceKeys.list(request),
    queryFn: ({ signal }) => tourApiClient.list(request, signal),
  });
}

export function tourSearchOptions(input: TourSearchRequest) {
  const request = normalizeTourSearch(input);
  return queryOptions({
    ...cacheOptions,
    queryKey: tourPlaceKeys.search(request),
    queryFn: ({ signal }) => tourApiClient.search(request, signal),
    enabled: request.keyword.length > 0,
  });
}

export function tourDetailOptions(language: TourLocale, contentId: string) {
  const id = contentId.trim();
  return queryOptions({
    ...cacheOptions,
    queryKey: tourPlaceKeys.detail(language, id),
    queryFn: ({ signal }) => tourApiClient.detail(language, id, signal),
    enabled: id.length > 0,
  });
}

export function useTourPlaces(request: TourListRequest, enabled = true) {
  return useQuery({ ...tourListOptions(request), enabled });
}

export function useTourPlaceSearch(request: TourSearchRequest) {
  const keyword = request.keyword.trim();
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword]);
  const settled = keyword === debouncedKeyword;
  const query = useQuery({
    ...tourSearchOptions({ ...request, keyword: debouncedKeyword }),
    enabled: settled && debouncedKeyword.length > 0,
  });
  // Do not display old results as matches for the new text while debouncing.
  return { ...query, data: settled ? query.data : undefined, isDebouncing: !settled };
}

export function useTourPlaceDetail(language: TourLocale, contentId: string) {
  return useQuery(tourDetailOptions(language, contentId));
}
