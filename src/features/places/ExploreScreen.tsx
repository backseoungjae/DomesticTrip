import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useLanguage } from '@/shared/i18n/LanguageProvider';
import { radius, spacing, useColors } from '@/shared/theme';
import {
  AppText,
  BackButton,
  Button,
  Card,
  EmptyState,
  ListScreen,
  PageHeading,
  listStyles,
} from '@/shared/ui';
import type { TourCategory, TourPlace } from './domain/TourPlace';
import { getTourPlaceKey } from './domain/TourPlace';
import { useInfiniteTourPlaces } from './hooks/useTourPlaces';
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
  const scroll = useRef<FlatList<TourPlace>>(null);
  const fetchingMore = useRef(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<TourCategory>();
  const searching = !!keyword.trim();
  const query = useInfiniteTourPlaces({ language, keyword, category, pageSize: 10 });
  const pages = query.data?.pages;
  const places = useMemo(() => {
    const unique = new Map<string, TourPlace>();
    for (const page of pages ?? [])
      for (const place of page.places) unique.set(getTourPlaceKey(place), place);
    return [...unique.values()];
  }, [pages]);
  const resetScroll = () => scroll.current?.scrollToOffset({ offset: 0, animated: false });
  const loadMore = async (retry = false) => {
    if (
      fetchingMore.current ||
      query.isFetching ||
      query.isDebouncing ||
      !query.hasNextPage ||
      (query.isFetchNextPageError && !retry)
    )
      return;
    fetchingMore.current = true;
    try {
      await query.fetchNextPage();
    } finally {
      fetchingMore.current = false;
    }
  };
  return (
    <ListScreen>
      <FlatList
        style={{ flex: 1 }}
        ref={scroll}
        data={places}
        keyExtractor={getTourPlaceKey}
        contentContainerStyle={listStyles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ItemSeparatorComponent={() => <View style={listStyles.separator} />}
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View style={listStyles.header}>
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
                resetScroll();
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
                    resetScroll();
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
                    resetScroll();
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
                      resetScroll();
                    }}
                  />
                ))}
              </ScrollView>
            )}
            {query.error && !query.isDebouncing && !query.isFetchNextPageError ? (
              <PlaceFeedback
                error={query.error}
                retrying={query.isFetching}
                retry={() => {
                  void query.refetch();
                }}
              />
            ) : !pages ? (
              <PlaceFeedback />
            ) : null}
            {pages && (
              <AppText muted accessibilityLiveRegion="polite">
                {t('places.resultCount', {
                  count: pages[0]?.totalCount ?? 0,
                  category: searching
                    ? t('places.searchResults')
                    : t(`places.categories.${category ?? 'all'}`),
                })}
              </AppText>
            )}
          </View>
        }
        ListEmptyComponent={
          pages && !places.length ? (
            <EmptyState title={t('places.empty')} description={t('places.emptyHint')} />
          ) : null
        }
        ListFooterComponent={
          !pages ? null : query.isFetchingNextPage ? (
            <View style={listStyles.footer}>
              <PlaceFeedback />
            </View>
          ) : query.isFetchNextPageError ? (
            <View style={listStyles.footer}>
              <PlaceFeedback
                error={query.error}
                retrying={query.isFetchingNextPage}
                retry={() => {
                  void loadMore(true);
                }}
              />
            </View>
          ) : null
        }
        renderItem={({ item: place }) => (
          <Card>
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
        )}
      />
    </ListScreen>
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
});
