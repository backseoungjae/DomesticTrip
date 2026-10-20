import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { AppText, Button, EmptyState, ListScreen, PageHeading, listStyles } from '@/shared/ui';
import { getTripStatus } from './domain/trip';
import type { Trip } from './domain/types';
import { useSeoulToday, useTrips } from './hooks/useTrips';
import { TripCard } from './ui/TripCard';
import { TripFeedback } from './ui/TripFeedback';

type TripRow =
  | { kind: 'heading'; key: string; status: 'ongoing' | 'upcoming' | 'past' }
  | { kind: 'trip'; key: string; trip: Trip };

export function MyTripsScreen() {
  const { t } = useTranslation();
  const { data: trips, loading, error, retry } = useTrips();
  const today = useSeoulToday();
  const rows: TripRow[] = [];
  for (const status of ['ongoing', 'upcoming', 'past'] as const) {
    const group = trips?.filter((trip) => getTripStatus(trip, today) === status) ?? [];
    if (group.length) {
      rows.push({ kind: 'heading', key: status, status });
      for (const trip of group) rows.push({ kind: 'trip', key: trip.id, trip });
    }
  }
  return (
    <ListScreen
      footer={
        <Button label={t('common.createTrip')} onPress={() => router.push('/trips/create')} />
      }
    >
      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(row) => `${row.kind}:${row.key}`}
        contentContainerStyle={listStyles.content}
        ItemSeparatorComponent={() => <View style={listStyles.separator} />}
        ListHeaderComponent={
          <View style={listStyles.header}>
            <PageHeading title={t('trips.title')} description={t('trips.description')} />
            {(error || (loading && !trips)) && <TripFeedback error={error} retry={retry} />}
          </View>
        }
        ListEmptyComponent={
          !error && !loading ? (
            <EmptyState title={t('trips.empty')} description={t('trips.emptyDescription')} />
          ) : null
        }
        renderItem={({ item }) =>
          item.kind === 'heading' ? (
            <AppText variant="heading" accessibilityRole="header">
              {t(`tripFlow.${item.status}`)}
            </AppText>
          ) : (
            <TripCard trip={item.trip} today={today} />
          )
        }
      />
    </ListScreen>
  );
}
