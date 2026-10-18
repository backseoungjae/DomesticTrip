import { useLocalSearchParams } from 'expo-router';

import { TripOverviewScreen } from '@/features/trips/TripOverviewScreen';

export default function TripDetailRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  return <TripOverviewScreen tripId={tripId} />;
}
