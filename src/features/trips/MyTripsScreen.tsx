import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, EmptyState, PageHeading, Screen } from '@/shared/ui';
import { getTripStatus } from './domain/trip';
import { useSeoulToday, useTrips } from './hooks/useTrips';
import { TripCard } from './ui/TripCard';
import { TripFeedback } from './ui/TripFeedback';

export function MyTripsScreen() {
  const { t } = useTranslation();
  const { data: trips, loading, error, retry } = useTrips();
  const today = useSeoulToday();
  return (
    <Screen>
      <PageHeading title={t('trips.title')} description={t('trips.description')} />
      {error || (loading && !trips) ? (
        <TripFeedback error={error} retry={retry} />
      ) : !trips?.length ? (
        <EmptyState title={t('trips.empty')} description={t('trips.emptyDescription')} />
      ) : (
        (['ongoing', 'upcoming', 'past'] as const).map((status) => {
          const group = trips.filter((trip) => getTripStatus(trip, today) === status);
          if (!group.length) return null;
          return (
            <TripGroup key={status} label={t(`tripFlow.${status}`)}>
              {group.map((trip) => (
                <TripCard key={trip.id} trip={trip} today={today} />
              ))}
            </TripGroup>
          );
        })
      )}
      <Button label={t('common.createTrip')} onPress={() => router.push('/trips/create')} />
    </Screen>
  );
}

function TripGroup({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <>
      <AppText variant="heading" accessibilityRole="header">
        {label}
      </AppText>
      {children}
    </>
  );
}
