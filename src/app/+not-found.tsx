import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, PageHeading, Screen } from '@/shared/ui';

export default function NotFoundRoute() {
  const { t } = useTranslation();
  return (
    <Screen>
      <PageHeading
        title={t('details.missingTitle')}
        description={t('details.missingDescription')}
      />
      <Button label={t('common.home')} onPress={() => router.replace('/')} />
    </Screen>
  );
}
