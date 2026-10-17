import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BackButton, Button, EmptyState, PageHeading, Screen } from './ui';

export function DetailPlaceholder({
  kind,
  tripId,
}: {
  kind: 'create' | 'trip' | 'edit' | 'place';
  tripId?: string;
}) {
  const { t } = useTranslation();
  return (
    <Screen>
      <BackButton
        label={t('common.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <PageHeading
        title={t(`details.${kind}Title`)}
        description={t(`details.${kind}Description`)}
      />
      <EmptyState title={t(`details.${kind}Empty`)} description={t(`details.${kind}Body`)} />
      {kind === 'trip' && (
        <Button
          secondary
          label={t('details.editAction')}
          onPress={() =>
            router.push({
              pathname: '/trips/[tripId]/edit',
              params: { tripId: tripId ?? 'preview' },
            })
          }
        />
      )}
    </Screen>
  );
}
