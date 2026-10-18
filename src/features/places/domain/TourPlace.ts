/** App-facing data, not the raw TourAPI response. Keep the original language. */
export interface TourPlace {
  readonly sourceLanguage: 'ko' | 'en';
  readonly contentId: string;
  readonly title: string;
  readonly address: string | null;
  readonly imageUrl: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  /** Original copyright/usage information, when supplied by the source. */
  readonly copyright?: string | null;
}
