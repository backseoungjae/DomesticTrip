import { useLocalSearchParams } from 'expo-router';

import { TripOverviewScreen } from '@/features/trips/TripOverviewScreen';

export default function TripDetailRoute() {
  const { tripId, day } = useLocalSearchParams<{ tripId: string; day?: string }>();
  return (
    <TripOverviewScreen
      key={`${tripId}:${day ?? ''}`}
      tripId={tripId}
      initialDay={typeof day === 'string' ? Number(day) : 1}
    />
  );
}
