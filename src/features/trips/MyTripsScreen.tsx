import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, PageHeading, Screen } from '@/shared/ui';

export function MyTripsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <PageHeading title={t('trips.title')} description={t('trips.description')} />
      <EmptyState title={t('trips.empty')} description={t('trips.emptyDescription')} />
      <Button label={t('common.createTrip')} onPress={() => router.push('/trips/create')} />
      <Button secondary label={t('trips.preview')} onPress={() => router.push('/trips/preview')} />
    </Screen>
  );
}
