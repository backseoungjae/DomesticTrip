import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, PageHeading, Screen } from '@/shared/ui';

export function ExploreScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <PageHeading title={t('explore.title')} description={t('explore.description')} />
      <EmptyState title={t('explore.empty')} description={t('explore.emptyDescription')} />
      <Button
        secondary
        label={t('common.preview')}
        onPress={() => router.push('/places/preview')}
      />
    </Screen>
  );
}
