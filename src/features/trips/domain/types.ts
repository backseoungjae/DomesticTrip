import type { TourPlace } from '@/features/places/domain/TourPlace';
import type { CalendarDate } from '@/shared/date/calendarDate';

export interface TripDetails {
  readonly title: string;
  readonly startDate: CalendarDate;
  readonly endDate: CalendarDate;
}

export interface Trip extends TripDetails {
  readonly id: string;
}

export interface TripPlace {
  /** Identifies an itinerary entry, independently of the tourism content ID. */
  readonly id: string;
  readonly tripId: string;
  /** Day 1 is 1. The actual visit date is derived from the trip start date. */
  readonly dayNumber: number;
  /** Starts at 1 within each Day. */
  readonly position: number;
  readonly placeSnapshot: TourPlace;
}

export interface TripDay {
  readonly dayNumber: number;
  readonly date: CalendarDate;
}

export interface TripInput {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
}

export type TripStatus = 'upcoming' | 'ongoing' | 'past';

export interface TripValidationIssue {
  readonly field: keyof TripInput;
  readonly code: 'required' | 'invalid_date' | 'start_before_today' | 'end_before_start';
}

export type TripValidationResult =
  | { readonly ok: true; readonly details: TripDetails }
  | { readonly ok: false; readonly issues: readonly TripValidationIssue[] };

export type TripUpdateResult =
  | { readonly ok: true; readonly trip: Trip }
  | {
      readonly ok: false;
      readonly reason: 'invalid_input';
      readonly issues: readonly TripValidationIssue[];
    }
  | {
      readonly ok: false;
      readonly reason: 'occupied_days';
      readonly affectedPlaces: readonly TripPlace[];
    };
