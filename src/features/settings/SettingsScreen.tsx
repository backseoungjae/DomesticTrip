import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLanguage } from '@/shared/i18n/LanguageProvider';
import { radius, spacing, useColors } from '@/shared/theme';
import { AppText, Card, PageHeading, Screen } from '@/shared/ui';

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
] as const;

export function SettingsScreen() {
  const { t } = useTranslation();
  const { language, changeLanguage, saving, saveError, persistent } = useLanguage();
  const colors = useColors();
  return (
    <Screen>
      <PageHeading title={t('settings.title')} description={t('settings.description')} />
      <Card>
        <AppText variant="heading" accessibilityRole="header">
          {t('settings.language')}
        </AppText>
        <AppText muted>{t('settings.languageDescription')}</AppText>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('settings.language')}
          style={styles.options}
        >
          {languages.map((item) => {
            const selected = language === item.code;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityLanguage={item.code}
                accessibilityState={{ checked: selected, disabled: saving, busy: saving }}
                disabled={saving}
                onPress={() => void changeLanguage(item.code)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.tint : colors.surface,
                    opacity: pressed || saving ? 0.65 : 1,
                  },
                ]}
              >
                <AppText variant="label" style={styles.optionLabel}>
                  {item.label}
                </AppText>
                <AppText accessible={false} style={{ color: colors.primary }}>
                  {selected ? '●' : '○'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText muted variant="caption">
          {t(persistent ? 'settings.saved' : 'settings.temporary')}
        </AppText>
        {saveError && (
          <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
            {t('settings.saveError')}
          </AppText>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  option: {
    minHeight: 56,
    borderWidth: 2,
    borderRadius: radius.sm,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabel: { flex: 1 },
});
