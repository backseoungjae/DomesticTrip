import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/ui';
import { radius, spacing, useColors } from '@/shared/theme';

export function PlaceImage({
  uri,
  title,
  copyright,
}: {
  uri: string | null;
  title: string;
  copyright?: string | null;
}) {
  return <RemoteImage key={uri} uri={uri} title={title} copyright={copyright} />;
}

function RemoteImage({
  uri,
  title,
  copyright,
}: {
  uri: string | null;
  title: string;
  copyright?: string | null;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={[styles.frame, { backgroundColor: colors.tint }]}>
        {uri && !failed ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessibilityLabel={title}
            onError={() => setFailed(true)}
          />
        ) : (
          <AppText muted>{t(failed ? 'places.imageFailed' : 'places.noImage')}</AppText>
        )}
      </View>
      {!!copyright && (
        <AppText variant="caption" muted>
          {t('places.copyright', { code: copyright })}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 1.6,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
});
