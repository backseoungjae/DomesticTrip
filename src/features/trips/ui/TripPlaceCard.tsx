import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PlaceImage } from '@/features/places/ui/PlaceImage';
import { spacing } from '@/shared/theme';
import { AppText, Button, Card } from '@/shared/ui';
import type { TripPlace } from '../domain/types';

export function TripPlaceCard({
  entry,
  count,
  dayCount,
  disabled,
  onUp,
  onDown,
  onMove,
  onRemove,
}: {
  entry: TripPlace;
  count: number;
  dayCount: number;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const place = entry.placeSnapshot;
  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        {entry.position}. {place.title}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button
          secondary
          label={t('itinerary.up')}
          accessibilityLabel={t('itinerary.upLabel', { title: place.title })}
          disabled={disabled || entry.position === 1}
          onPress={onUp}
        />
        <Button
          secondary
          label={t('itinerary.down')}
          accessibilityLabel={t('itinerary.downLabel', { title: place.title })}
          disabled={disabled || entry.position === count}
          onPress={onDown}
        />
      </View>
      <Button
        secondary
        label={t('itinerary.move')}
        accessibilityLabel={t('itinerary.moveLabel', { title: place.title })}
        disabled={disabled || dayCount < 2}
        onPress={onMove}
      />
      <Button
        destructive
        label={t('itinerary.remove')}
        accessibilityLabel={t('itinerary.removeLabel', { title: place.title })}
        disabled={disabled}
        onPress={onRemove}
      />
      <PlaceImage uri={place.imageUrl} title={place.title} copyright={place.copyright} />
      {!!place.address && <AppText>{place.address}</AppText>}
      <AppText variant="caption" muted>
        {t(place.sourceLanguage === 'ko' ? 'places.sourceKo' : 'places.sourceEn')}
      </AppText>
    </Card>
  );
}
