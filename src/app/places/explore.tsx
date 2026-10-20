import { useLocalSearchParams } from 'expo-router';
import { ExploreScreen } from '@/features/places/ExploreScreen';

export default function TripPlaceExploreRoute() {
  const { tripId, day } = useLocalSearchParams<{ tripId: string; day: string }>();
  return (
    <ExploreScreen
      tripId={typeof tripId === 'string' ? tripId : ''}
      day={typeof day === 'string' ? day : ''}
    />
  );
}
