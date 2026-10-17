import { useLocalSearchParams } from 'expo-router';

import { DetailPlaceholder } from '@/shared/DetailPlaceholder';

export default function TripDetailRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  return <DetailPlaceholder kind="trip" tripId={tripId} />;
}
