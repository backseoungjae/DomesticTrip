import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, Button, Card, EmptyState, PageHeading, Screen } from '@/shared/ui';
import { useTourPlaceDetail } from './hooks/useTourPlaces';
import { AddPlaceDialog, type PlaceTarget } from './ui/AddPlaceDialog';
import { PlaceFeedback } from './ui/PlaceFeedback';
import { PlaceImage } from './ui/PlaceImage';

export function PlaceDetailScreen({
  placeId,
  locale,
  tripId,
  day,
}: {
  placeId: string;
  locale: string;
  tripId?: string;
  day?: string;
}) {
  const { t } = useTranslation();
  const validLocale = locale === 'ko' || locale === 'en';
  const detail = useTourPlaceDetail(validLocale ? locale : 'en', validLocale ? placeId : '');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<PlaceTarget | null>(null);
  const hasTarget = tripId !== undefined || day !== undefined;
  const dayNumber = Number(day);
  const validTarget =
    !hasTarget ||
    (!!tripId && /^\d+$/.test(day ?? '') && Number.isSafeInteger(dayNumber) && dayNumber >= 1);
  const target = hasTarget && validTarget ? { tripId: tripId!, dayNumber } : undefined;
  const place = validLocale ? detail.data : undefined;
  return (
    <Screen>
      <BackButton
        label={t('common.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
      />
      {!validLocale || !placeId ? (
        <EmptyState title={t('places.missing')} description={t('places.missingHint')} />
      ) : (
        <>
          {detail.error && (
            <PlaceFeedback
              error={detail.error}
              retrying={detail.isFetching}
              retry={() => {
                void detail.refetch();
              }}
            />
          )}
          {detail.isPending ? (
            <PlaceFeedback />
          ) : detail.data === null ? (
            <EmptyState title={t('places.missing')} description={t('places.missingHint')} />
          ) : null}
          {place && (
            <>
              <PageHeading
                title={place.title}
                description={t(
                  place.sourceLanguage === 'ko' ? 'places.sourceKo' : 'places.sourceEn',
                )}
              />
              <PlaceImage uri={place.imageUrl} title={place.title} copyright={place.copyright} />
              {!validTarget ? (
                <AppText accessibilityRole="alert">{t('places.targetMissing')}</AppText>
              ) : (
                <Button
                  label={t('places.add')}
                  onPress={() => {
                    setAdded(null);
                    setAdding(true);
                  }}
                />
              )}
              {added && (
                <Card>
                  <AppText accessibilityLiveRegion="polite">
                    {t('places.added', { day: added.dayNumber })}
                  </AppText>
                  <Button
                    secondary
                    label={t('places.viewTrip')}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/[tripId]',
                        params: { tripId: added.tripId, day: String(added.dayNumber) },
                      })
                    }
                  />
                </Card>
              )}
              {!!place.address && (
                <Card>
                  <AppText variant="label">{t('places.address')}</AppText>
                  <AppText selectable>{place.address}</AppText>
                </Card>
              )}
              {!!place.telephone && <AppText selectable>{place.telephone}</AppText>}
              {place.overview ? (
                <AppText selectable>{place.overview}</AppText>
              ) : (
                <AppText muted>{t('places.noDescription')}</AppText>
              )}
              {adding && (
                <AddPlaceDialog
                  place={place}
                  target={target}
                  onClose={() => setAdding(false)}
                  onAdded={(destination) => {
                    setAdded(destination);
                    setAdding(false);
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
