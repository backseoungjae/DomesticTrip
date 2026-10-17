import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Button, EmptyState, PageHeading, Screen } from '@/shared/ui';

export function HomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="caption">{t('appName')}</AppText>
      <PageHeading title={t('home.title')} description={t('home.description')} />
      <AppText variant="heading" accessibilityRole="header">
        {t('home.currentTitle')}
      </AppText>
      <EmptyState title={t('home.currentEmpty')} description={t('home.currentDescription')} />
      <AppText variant="heading" accessibilityRole="header">
        {t('home.nextTitle')}
      </AppText>
      <EmptyState title={t('home.nextEmpty')} description={t('home.nextDescription')} />
      <Button label={t('common.createTrip')} onPress={() => router.push('/trips/create')} />
    </Screen>
  );
}
