import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { AppText, Button, Card, Screen } from '@/shared/ui';

import { getDeviceLanguage, i18n, isAppLanguage, type AppLanguage } from './instance';

export interface LanguageStorage {
  persistent: boolean;
  load: () => Promise<AppLanguage | null>;
  save: (language: AppLanguage) => Promise<void>;
}

const LanguageContext = createContext<{
  language: AppLanguage;
  changeLanguage: (language: AppLanguage) => Promise<void>;
  saving: boolean;
  saveError: boolean;
  persistent: boolean;
} | null>(null);

export function LanguageProvider({
  children,
  storage,
}: PropsWithChildren<{ storage: LanguageStorage }>) {
  const [language, setLanguage] = useState<AppLanguage>(getDeviceLanguage);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    void (async () => {
      try {
        const saved = await storage.load();
        if (!active) return;
        const nextLanguage = isAppLanguage(saved) ? saved : getDeviceLanguage();
        await i18n.changeLanguage(nextLanguage);
        if (active) {
          setLanguage(nextLanguage);
          setReady(true);
        }
      } catch {
        if (active) setLoadError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [storage, attempt]);

  async function changeLanguage(nextLanguage: AppLanguage) {
    // Selecting the current device language also records an explicit preference.
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await storage.save(nextLanguage);
      await i18n.changeLanguage(nextLanguage);
      setLanguage(nextLanguage);
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <I18nextProvider i18n={i18n}>
      {ready ? (
        <LanguageContext.Provider
          value={{ language, changeLanguage, saving, saveError, persistent: storage.persistent }}
        >
          {children}
        </LanguageContext.Provider>
      ) : (
        <StartupScreen failed={loadError} retry={() => setAttempt((value) => value + 1)} />
      )}
    </I18nextProvider>
  );
}

function StartupScreen({ failed, retry }: { failed: boolean; retry: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Card>
        <AppText accessibilityRole="alert">
          {t(failed ? 'settings.loadError' : 'settings.loading')}
        </AppText>
        {failed && <Button label={t('settings.retry')} onPress={retry} />}
      </Card>
    </Screen>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used within LanguageProvider');
  return value;
}
