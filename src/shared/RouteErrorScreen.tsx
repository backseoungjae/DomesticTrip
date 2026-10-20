import type { ErrorBoundaryProps } from 'expo-router';
import { useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18n } from './i18n/instance';
import { AppText, Button, Card, Screen } from './ui';

/** The root boundary also works when the normal app providers could not mount. */
export function RouteErrorScreen({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <RecoveryScreen retry={retry} />
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

function RecoveryScreen({ retry }: Pick<ErrorBoundaryProps, 'retry'>) {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);
  return (
    <Screen>
      <Card>
        <AppText variant="heading" accessibilityRole="alert">
          {t('common.unexpectedError')}
        </AppText>
        <AppText>{t('common.recoveryHint')}</AppText>
        <Button
          label={t('settings.retry')}
          busy={retrying}
          onPress={() => {
            setRetrying(true);
            // Never render or forward arbitrary error messages/causes to a logger.
            void retry()
              .catch(() => {})
              .finally(() => setRetrying(false));
          }}
        />
      </Card>
    </Screen>
  );
}
