export type TourLocale = 'ko' | 'en';

export type TourCategory =
  | 'attraction'
  | 'culture'
  | 'festival'
  | 'course'
  | 'leisure'
  | 'accommodation'
  | 'shopping'
  | 'restaurant'
  | 'transport';

/** App-facing data, not the raw TourAPI response. Keep the original language. */
export interface TourPlace {
  readonly sourceLanguage: TourLocale;
  readonly contentId: string;
  readonly title: string;
  readonly address: string | null;
  readonly imageUrl: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  /** Original copyright/usage information, when supplied by the source. */
  readonly copyright?: string | null;
  readonly category?: TourCategory | null;
  readonly contentTypeId?: string | null;
}

export interface TourPlaceDetail extends TourPlace {
  readonly overview: string | null;
  /** Source HTML; never render as trusted HTML. */
  readonly homepage: string | null;
  readonly telephone: string | null;
}

export function getTourPlaceKey(place: Pick<TourPlace, 'sourceLanguage' | 'contentId'>): string {
  return `${place.sourceLanguage}:${place.contentId}`;
}
