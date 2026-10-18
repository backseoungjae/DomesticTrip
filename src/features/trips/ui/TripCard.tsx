import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import type { Trip } from '@/features/trips/domain/types';
import { getTripDayCount, getTripStatus } from '@/features/trips/domain/trip';
import type { CalendarDate } from '@/shared/date/calendarDate';
import { useColors } from '@/shared/theme';
import { AppText, Card } from '@/shared/ui';

import { formatTripDate } from './tripDate';

export function TripCard({ trip, today }: { trip: Trip; today: CalendarDate }) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const status = t(`tripFlow.${getTripStatus(trip, today)}`);
  const range = `${formatTripDate(trip.startDate, i18n.language)} – ${formatTripDate(trip.endDate, i18n.language)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}, ${status}, ${range}`}
      onPress={() => router.push({ pathname: '/trips/[tripId]', params: { tripId: trip.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
    >
      <Card>
        <AppText variant="caption" style={{ color: colors.primary }}>
          {status}
        </AppText>
        <AppText variant="heading">{trip.title}</AppText>
        <AppText muted>{range}</AppText>
        <AppText variant="caption" muted>
          {t('tripFlow.duration', { count: getTripDayCount(trip) })}
        </AppText>
      </Card>
    </Pressable>
  );
}
