import type { TourCategory, TourLocale, TourPlace, TourPlaceDetail } from '../domain/TourPlace';

import { TourApiError } from './tourApiError';
import { tourText } from './tourText';

// 국문/영문 활용매뉴얼 v4.4: a category absent in a locale is not substituted.
export const contentTypeIds: Record<TourLocale, Partial<Record<TourCategory, string>>> = {
  ko: {
    attraction: '12',
    culture: '14',
    festival: '15',
    course: '25',
    leisure: '28',
    accommodation: '32',
    shopping: '38',
    restaurant: '39',
  },
  en: {
    attraction: '76',
    culture: '78',
    festival: '85',
    transport: '77',
    leisure: '75',
    accommodation: '80',
    shopping: '79',
    restaurant: '82',
  },
};

function optionalText(item: Record<string, unknown>, key: string): string | null {
  const value = item[key];
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new TourApiError('invalid_response');
  return value.trim() || null;
}

function requiredText(item: Record<string, unknown>, key: string): string {
  const value = optionalText(item, key);
  if (!value) throw new TourApiError('invalid_response');
  return value;
}

function coordinate(item: Record<string, unknown>, key: string, limit: number): number | null {
  const value = item[key];
  if (value == null || value === '') return null;
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new TourApiError('invalid_response');
  }
  if (typeof value === 'string' && !value.trim()) return null;
  const result = Number(value);
  if (!Number.isFinite(result) || Math.abs(result) > limit) {
    throw new TourApiError('invalid_response');
  }
  return result;
}

function mapPlace(item: Record<string, unknown>, language: TourLocale): TourPlace {
  const contentTypeId = requiredText(item, 'contenttypeid');
  const category = Object.entries(contentTypeIds[language]).find(
    ([, id]) => id === contentTypeId,
  )?.[0] as TourCategory | undefined;
  const address = [optionalText(item, 'addr1'), optionalText(item, 'addr2')]
    .filter(Boolean)
    .join(' ');
  let latitude = coordinate(item, 'mapy', 90);
  let longitude = coordinate(item, 'mapx', 180);
  // A zero pair is TourAPI's missing-coordinate value, outside domestic coverage.
  if (latitude === 0 && longitude === 0) latitude = longitude = null;
  return {
    sourceLanguage: language,
    contentId: requiredText(item, 'contentid'),
    title: requiredText(item, 'title'),
    contentTypeId,
    category: category ?? null,
    address: address || null,
    imageUrl: optionalText(item, 'firstimage') ?? optionalText(item, 'firstimage2'),
    latitude,
    longitude,
    copyright: optionalText(item, 'cpyrhtDivCd'),
  };
}

export function mapKoreanPlace(item: Record<string, unknown>): TourPlace {
  return mapPlace(item, 'ko');
}

export function mapEnglishPlace(item: Record<string, unknown>): TourPlace {
  return mapPlace(item, 'en');
}

export function mapTourPlace(item: Record<string, unknown>, language: TourLocale): TourPlace {
  return language === 'ko' ? mapKoreanPlace(item) : mapEnglishPlace(item);
}

export function mapTourPlaceDetail(
  item: Record<string, unknown>,
  language: TourLocale,
): TourPlaceDetail {
  return {
    ...mapTourPlace(item, language),
    overview: tourText(optionalText(item, 'overview')),
    homepage: optionalText(item, 'homepage'),
    telephone: optionalText(item, 'tel'),
  };
}
