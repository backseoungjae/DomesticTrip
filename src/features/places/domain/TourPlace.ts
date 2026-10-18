/** App-facing data, not the raw TourAPI response. Keep the original language. */
export interface TourPlace {
  readonly sourceLanguage: 'ko' | 'en';
  readonly contentId: string;
  readonly title: string;
  readonly address: string | null;
  readonly imageUrl: string | null;
}
