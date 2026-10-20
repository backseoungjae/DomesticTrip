import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button } from '@/shared/ui';
import { spacing } from '@/shared/theme';
import { getTripDayCount, getTripDayDate } from '../domain/trip';
import type { TripDetails } from '../domain/types';
import { formatTripDate } from './tripDate';

export function TripDayPicker({
  trip,
  value,
  onChange,
  disabled = false,
}: {
  trip: TripDetails;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const count = getTripDayCount(trip);
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="heading" accessibilityRole="header" accessibilityLiveRegion="polite">
        {t('tripFlow.day', { number: value })} ·{' '}
        {formatTripDate(getTripDayDate(trip, value), i18n.language)}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Button
          secondary
          label={t('places.previousDay')}
          disabled={disabled || value <= 1}
          onPress={() => onChange(value - 1)}
        />
        <Button
          secondary
          label={t('places.nextDay')}
          disabled={disabled || value >= count}
          onPress={() => onChange(value + 1)}
        />
      </View>
    </View>
  );
}
