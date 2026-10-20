import { useLocalSearchParams } from 'expo-router';
import { PlaceDetailScreen } from '@/features/places/PlaceDetailScreen';

export default function PlaceDetailRoute() {
  const { placeId, locale, tripId, day } = useLocalSearchParams<{
    placeId: string;
    locale: string;
    tripId?: string;
    day?: string;
  }>();
  return (
    <PlaceDetailScreen
      key={`${locale}:${placeId}:${tripId ?? ''}:${day ?? ''}`}
      placeId={typeof placeId === 'string' ? placeId : ''}
      locale={typeof locale === 'string' ? locale : ''}
      tripId={tripId === undefined ? undefined : typeof tripId === 'string' ? tripId : ''}
      day={day === undefined ? undefined : typeof day === 'string' ? day : ''}
    />
  );
}
