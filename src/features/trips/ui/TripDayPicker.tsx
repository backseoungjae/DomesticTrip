import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
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
  showDays = false,
}: {
  trip: TripDetails;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showDays?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const count = getTripDayCount(trip);
  return (
    <View style={{ gap: spacing.sm }}>
      {showDays && <DayStrip count={count} value={value} disabled={disabled} onChange={onChange} />}
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

function DayStrip({
  count,
  value,
  disabled,
  onChange,
}: {
  count: number;
  value: number;
  disabled: boolean;
  onChange: (day: number) => void;
}) {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const list = useRef<ComponentRef<typeof FlatList<number>>>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const days = useMemo(() => Array.from({ length: count }, (_, index) => index + 1), [count]);
  const width = Math.max(96, `Day ${count}`.length * 10 * fontScale + 32);
  useEffect(() => {
    if (!viewportWidth) return;
    const contentWidth = count * width + (count - 1) * spacing.sm;
    const centeredOffset = (value - 1) * (width + spacing.sm) - (viewportWidth - width) / 2;
    list.current?.scrollToOffset({
      offset: Math.max(0, Math.min(centeredOffset, contentWidth - viewportWidth)),
      animated: false,
    });
  }, [count, value, viewportWidth, width]);
  return (
    <FlatList
      ref={list}
      horizontal
      data={days}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      getItemLayout={(_, index) => ({ length: width, offset: (width + spacing.sm) * index, index })}
      keyExtractor={(day) => String(day)}
      accessibilityLabel={t('itinerary.days')}
      style={{ flexGrow: 0 }}
      ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
      renderItem={({ item }) => (
        <Button
          label={t('tripFlow.day', { number: item })}
          secondary={item !== value}
          disabled={disabled}
          accessibilityState={{ selected: item === value }}
          onPress={() => onChange(item)}
          style={{ width }}
        />
      )}
    />
  );
}
