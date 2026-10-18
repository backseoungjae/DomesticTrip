import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { AppText, Button, Card } from '@/shared/ui';
import { useColors } from '@/shared/theme';

export function TripFeedback({ error, retry }: { error: boolean; retry: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <Card>
      {!error && <ActivityIndicator color={colors.primary} />}
      <AppText accessibilityRole={error ? 'alert' : undefined}>
        {t(error ? 'tripFlow.loadError' : 'tripFlow.loading')}
      </AppText>
      {error && <Button secondary label={t('settings.retry')} onPress={retry} />}
    </Card>
  );
}
