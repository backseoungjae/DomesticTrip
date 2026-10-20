import { useTranslation } from 'react-i18next';
import { useRef, type ComponentRef, type RefObject } from 'react';
import { Pressable, View } from 'react-native';

import { PlaceImage } from '@/features/places/ui/PlaceImage';
import { spacing } from '@/shared/theme';
import { AppText, Button, Card } from '@/shared/ui';
import type { TripPlace } from '../domain/types';

export function TripPlaceCard({
  entry,
  count,
  disabled,
  isActive,
  onDrag,
  onDragEnd,
  onUp,
  onDown,
  onMore,
}: {
  entry: TripPlace;
  count: number;
  disabled: boolean;
  isActive: boolean;
  onDrag: () => void;
  onDragEnd: () => void;
  onUp: () => void;
  onDown: () => void;
  onMore: (trigger: RefObject<ComponentRef<typeof View> | null>) => void;
}) {
  const { t } = useTranslation();
  const place = entry.placeSnapshot;
  const moreButton = useRef<ComponentRef<typeof View>>(null);
  // Keep the active touch responder alive until DragList receives the release.
  const cannotDrag = (disabled && !isActive) || count < 2;
  const actionsDisabled = disabled || isActive || count < 2;
  const position = t('itinerary.position', {
    day: entry.dayNumber,
    position: entry.position,
    count,
  });
  return (
    <View style={{ opacity: isActive ? 0.85 : 1 }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Pressable
            style={{ flex: 1 }}
            onLongPress={onDrag}
            onPressOut={onDragEnd}
            delayLongPress={300}
            disabled={cannotDrag}
            accessibilityRole="adjustable"
            accessibilityLabel={place.title}
            accessibilityHint={t('itinerary.dragAccessibilityHint')}
            accessibilityValue={{ text: position }}
            accessibilityState={{ disabled: actionsDisabled }}
            accessibilityActions={
              actionsDisabled
                ? []
                : [
                    ...(entry.position > 1
                      ? [{ name: 'decrement', label: t('itinerary.up') }]
                      : []),
                    ...(entry.position < count
                      ? [{ name: 'increment', label: t('itinerary.down') }]
                      : []),
                  ]
            }
            onAccessibilityAction={({ nativeEvent }) => {
              if (actionsDisabled) return;
              if (nativeEvent.actionName === 'decrement' && entry.position > 1) onUp();
              if (nativeEvent.actionName === 'increment' && entry.position < count) onDown();
            }}
          >
            <AppText variant="heading" accessible={false} importantForAccessibility="no">
              {entry.position}. {place.title}
            </AppText>
          </Pressable>
          <Button
            ref={moreButton}
            secondary
            label="⋯"
            accessibilityLabel={t('itinerary.moreLabel', { title: place.title })}
            disabled={disabled || isActive}
            style={{ minHeight: 48, width: 48, paddingVertical: 0, paddingHorizontal: 0 }}
            onPress={() => onMore(moreButton)}
          />
        </View>
        <Pressable
          accessible={false}
          disabled={cannotDrag}
          onLongPress={onDrag}
          onPressOut={onDragEnd}
          delayLongPress={300}
          style={{ gap: spacing.md }}
        >
          <PlaceImage uri={place.imageUrl} title={place.title} copyright={place.copyright} />
          {!!place.address && <AppText>{place.address}</AppText>}
          <AppText variant="caption" muted>
            {t(place.sourceLanguage === 'ko' ? 'places.sourceKo' : 'places.sourceEn')}
          </AppText>
        </Pressable>
      </Card>
    </View>
  );
}
