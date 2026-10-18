import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, EmptyState, PageHeading, Screen } from '@/shared/ui';
import { getTripStatus } from '@/features/trips/domain/trip';
import { useSeoulToday, useTrips } from '@/features/trips/hooks/useTrips';
import { TripCard } from '@/features/trips/ui/TripCard';
import { TripFeedback } from '@/features/trips/ui/TripFeedback';

export function HomeScreen() {
  const { t } = useTranslation();
  const { data: trips, loading, error, retry } = useTrips();
  const today = useSeoulToday();
  const current = trips?.filter((trip) => getTripStatus(trip, today) === 'ongoing') ?? [];
  const next = trips?.find((trip) => getTripStatus(trip, today) === 'upcoming');
  return (
    <Screen>
      <AppText variant="caption">{t('appName')}</AppText>
      <PageHeading title={t('home.title')} description={t('home.description')} />
      {error || (loading && !trips) ? (
        <TripFeedback error={error} retry={retry} />
      ) : (
        <>
          <AppText variant="heading" accessibilityRole="header">
            {t('home.currentTitle')}
          </AppText>
          {current.length ? (
            current.map((trip) => <TripCard key={trip.id} trip={trip} today={today} />)
          ) : (
            <EmptyState title={t('home.currentEmpty')} description={t('home.currentDescription')} />
          )}
          <AppText variant="heading" accessibilityRole="header">
            {t('home.nextTitle')}
          </AppText>
          {next ? (
            <TripCard trip={next} today={today} />
          ) : (
            <EmptyState title={t('home.nextEmpty')} description={t('home.nextDescription')} />
          )}
        </>
      )}
      <Button label={t('common.createTrip')} onPress={() => router.push('/trips/create')} />
    </Screen>
  );
}
