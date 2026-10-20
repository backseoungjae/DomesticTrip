import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card } from '@/shared/ui';
import { TourApiError } from '../services/tourApiError';

export function PlaceFeedback({
  error,
  retry,
  retrying = false,
}: {
  error?: Error | null;
  retry?: () => void;
  retrying?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      {!error && <ActivityIndicator />}
      <AppText accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite">
        {t(
          error
            ? `places.errors.${error instanceof TourApiError ? error.kind : 'service'}`
            : 'places.loading',
        )}
      </AppText>
      {!!error && retry && <Button label={t('settings.retry')} busy={retrying} onPress={retry} />}
    </Card>
  );
}
