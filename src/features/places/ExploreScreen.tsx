import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useLanguage } from '@/shared/i18n/LanguageProvider';
import { radius, spacing, useColors } from '@/shared/theme';
import { AppText, BackButton, Button, Card, EmptyState, PageHeading, Screen } from '@/shared/ui';
import type { TourCategory } from './domain/TourPlace';
import { getTourPlaceKey } from './domain/TourPlace';
import { useTourPlaces, useTourPlaceSearch } from './hooks/useTourPlaces';
import { contentTypeIds } from './services/tourPlaceMapper';
import { PlaceFeedback } from './ui/PlaceFeedback';
import { PlaceImage } from './ui/PlaceImage';

export function ExploreScreen({ tripId, day }: { tripId?: string; day?: string } = {}) {
  const { language } = useLanguage();
  return <PlaceBrowser key={language} language={language} tripId={tripId} day={day} />;
}

function PlaceBrowser({
  language,
  tripId,
  day,
}: {
  language: 'ko' | 'en';
  tripId?: string;
  day?: string;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<TourCategory>();
  const [page, setPage] = useState(1);
  const searching = !!keyword.trim();
  const list = useTourPlaces({ language, category, page, pageSize: 10 }, !searching);
  const search = useTourPlaceSearch({ language, keyword, page, pageSize: 10 });
  const query = searching ? search : list;
  const debouncing = searching && search.isDebouncing;
  const result = debouncing ? undefined : query.data;
  const changePage = (next: number) => {
    setPage(next);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };
  return (
    <Screen scrollRef={scroll}>
      {tripId !== undefined && (
        <BackButton
          label={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/my-trips'))}
        />
      )}
      <PageHeading title={t('explore.title')} description={t('explore.description')} />
      {!!tripId && <AppText>{t('places.targetDay', { day })}</AppText>}
      <TextInput
        value={keyword}
        accessibilityLabel={t('places.search')}
        placeholder={t('places.search')}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onChangeText={(text) => {
          setKeyword(text);
          setCategory(undefined);
          setPage(1);
        }}
      />
      {searching ? (
        <>
          <AppText muted>{t('places.searchHint')}</AppText>
          <Button
            secondary
            label={t('places.clearSearch')}
            onPress={() => {
              setKeyword('');
              setPage(1);
            }}
          />
        </>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Button
            secondary={!!category}
            label={t('places.categories.all')}
            accessibilityState={{ selected: !category }}
            onPress={() => {
              setCategory(undefined);
              setPage(1);
            }}
          />
          {(Object.keys(contentTypeIds[language]) as TourCategory[]).map((item) => (
            <Button
              key={item}
              secondary={category !== item}
              label={t(`places.categories.${item}`)}
              accessibilityState={{ selected: category === item }}
              onPress={() => {
                setCategory(item);
                setPage(1);
              }}
            />
          ))}
        </ScrollView>
      )}
      {query.error && !debouncing ? (
        <PlaceFeedback
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : !result ? (
        <PlaceFeedback />
      ) : null}
      {result && (
        <>
          <AppText muted accessibilityLiveRegion="polite">
            {t('places.results', { count: result.totalCount, page: result.page })}
          </AppText>
          {result.places.length === 0 && (
            <EmptyState title={t('places.empty')} description={t('places.emptyHint')} />
          )}
          {result.places.map((place) => (
            <Card key={getTourPlaceKey(place)}>
              <PlaceImage uri={place.imageUrl} title={place.title} copyright={place.copyright} />
              <AppText variant="heading">{place.title}</AppText>
              {!!place.address && <AppText muted>{place.address}</AppText>}
              <Button
                secondary
                label={t('places.viewDetails')}
                accessibilityLabel={`${t('places.viewDetails')}, ${place.title}`}
                onPress={() =>
                  router.push({
                    pathname: '/places/[placeId]',
                    params: {
                      placeId: place.contentId,
                      locale: place.sourceLanguage,
                      ...(tripId !== undefined ? { tripId, day: day ?? '' } : {}),
                    },
                  })
                }
              />
            </Card>
          ))}
          <View style={styles.pages}>
            <Button
              secondary
              label={t('places.previousPage')}
              disabled={page <= 1 || query.isFetching}
              onPress={() => changePage(page - 1)}
            />
            <Button
              secondary
              label={t('places.nextPage')}
              disabled={!result.hasNextPage || query.isFetching}
              onPress={() => changePage(page + 1)}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
  },
  pages: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
