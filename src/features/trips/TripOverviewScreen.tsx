import { router, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecordNotFoundError } from '@/database/records';
import { tripRepository } from '@/database/tripRepository';
import { tripPlaceRepository } from '@/database/tripPlaceRepository';
import { Dialog } from '@/shared/Dialog';
import { useColors } from '@/shared/theme';
import { AppText, BackButton, Button, Card, PageHeading, Screen } from '@/shared/ui';

import { getTripDayCount, getTripStatus } from './domain/trip';
import { getDayPlaces } from './domain/tripPlaces';
import type { TripPlace } from './domain/types';
import { useSeoulToday, useTripDetail } from './hooks/useTrips';
import { TripFeedback } from './ui/TripFeedback';
import { TripDayPicker } from './ui/TripDayPicker';
import { TripPlaceCard } from './ui/TripPlaceCard';
import { formatTripDate } from './ui/tripDate';

type PlaceAction = { kind: 'remove' | 'move'; entryId: string; destination: number };
type PlaceChange =
  | { kind: 'remove'; entry: TripPlace }
  | { kind: 'move' | 'reorder'; entry: TripPlace; destination: number; position?: number };

export function TripOverviewScreen({
  tripId,
  initialDay = 1,
}: {
  tripId: string;
  initialDay?: number;
}) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, retry, refresh } = useTripDetail(tripId);
  const today = useSeoulToday();
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [placeAction, setPlaceAction] = useState<PlaceAction | null>(null);
  const [changingPlace, setChangingPlace] = useState(false);
  const [placeError, setPlaceError] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'removed' | 'moved' | 'reordered';
    title: string;
    day: number;
  } | null>(null);
  const changingPlaceRef = useRef(false);
  const day = data
    ? Math.max(
        1,
        Math.min(Number.isSafeInteger(selectedDay) ? selectedDay : 1, getTripDayCount(data.trip)),
      )
    : 1;
  const deletingRef = useRef(false);
  const busy = deleting || changingPlace;
  const locked = busy || loading || error;
  const disablePrevention = usePreventRemove(busy);
  const dayCount = data ? getTripDayCount(data.trip) : 1;
  const dayPlaces = data ? getDayPlaces(data.trip, data.places, day) : [];
  const actionEntry = data?.places.find((entry) => entry.id === placeAction?.entryId);
  const validDestination =
    !!placeAction && placeAction.destination >= 1 && placeAction.destination <= dayCount;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/my-trips'));

  function openPlaceAction(entry: TripPlace, kind: PlaceAction['kind']) {
    if (locked) return;
    setPlaceError(false);
    setNotice(null);
    setPlaceAction({ kind, entryId: entry.id, destination: entry.dayNumber });
  }

  async function changePlace(change: PlaceChange) {
    if (changingPlaceRef.current || deletingRef.current || loading || error) return;
    changingPlaceRef.current = true;
    setChangingPlace(true);
    setPlaceError(false);
    setNotice(null);
    try {
      if (change.kind === 'remove') await tripPlaceRepository.remove(tripId, change.entry.id);
      else
        await tripPlaceRepository.move(
          tripId,
          change.entry.id,
          change.destination,
          change.position,
        );
      // Keep controls locked until the authoritative SQLite read has settled.
      const refreshed = await refresh();
      setPlaceAction(null);
      if (refreshed)
        setNotice({
          kind:
            change.kind === 'remove' ? 'removed' : change.kind === 'move' ? 'moved' : 'reordered',
          title: change.entry.placeSnapshot.title,
          day: change.kind === 'remove' ? change.entry.dayNumber : change.destination,
        });
    } catch {
      setPlaceError(true);
    } finally {
      changingPlaceRef.current = false;
      setChangingPlace(false);
    }
  }

  async function remove() {
    if (deletingRef.current || changingPlaceRef.current || loading || error) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError(false);
    try {
      try {
        await tripRepository.remove(tripId);
      } catch (error) {
        if (!(error instanceof RecordNotFoundError)) throw error;
      }
      setConfirming(false);
      setDeleting(false);
      disablePrevention();
      router.dismissTo('/my-trips');
    } catch {
      setDeleteError(true);
      setDeleting(false);
    } finally {
      deletingRef.current = false;
    }
  }

  return (
    <Screen>
      <BackButton label={t('common.back')} onPress={back} disabled={busy} />
      {data === undefined && (error || loading) ? (
        <TripFeedback error={error} retry={retry} />
      ) : !data ? (
        <Card>
          <AppText>{t('tripFlow.missing')}</AppText>
          <Button label={t('tripFlow.allTrips')} onPress={() => router.replace('/my-trips')} />
        </Card>
      ) : (
        <>
          {error && <TripFeedback error retry={retry} />}
          <PageHeading
            title={data.trip.title}
            description={t(`tripFlow.${getTripStatus(data.trip, today)}`)}
          />
          <Card>
            <AppText>
              {formatTripDate(data.trip.startDate, i18n.language)} –{' '}
              {formatTripDate(data.trip.endDate, i18n.language)}
            </AppText>
            <AppText muted>{t('tripFlow.duration', { count: getTripDayCount(data.trip) })}</AppText>
            <AppText muted>{t('tripFlow.placeCount', { count: data.places.length })}</AppText>
          </Card>
          <Button
            label={t('tripFlow.edit')}
            disabled={locked}
            onPress={() => router.push({ pathname: '/trips/[tripId]/edit', params: { tripId } })}
          />
          <TripDayPicker
            trip={data.trip}
            value={day}
            disabled={locked}
            showDays
            onChange={(next) => {
              setSelectedDay(next);
              setNotice(null);
              setPlaceError(false);
            }}
          />
          {notice && (
            <AppText accessibilityLiveRegion="polite">
              {t(`itinerary.${notice.kind}`, { title: notice.title, day: notice.day })}
            </AppText>
          )}
          {changingPlace && (
            <AppText accessibilityLiveRegion="polite">{t('itinerary.saving')}</AppText>
          )}
          {placeError && !placeAction && (
            <Card>
              <AppText accessibilityRole="alert">{t('itinerary.saveError')}</AppText>
              <Button
                secondary
                label={t('settings.retry')}
                disabled={busy}
                onPress={() => {
                  setPlaceError(false);
                  void refresh();
                }}
              />
            </Card>
          )}
          <Button
            label={t('places.add')}
            disabled={locked}
            onPress={() =>
              router.push({ pathname: '/places/explore', params: { tripId, day: String(day) } })
            }
          />
          <AppText variant="heading" accessibilityRole="header">
            {t('places.savedPlaces')}
          </AppText>
          {dayPlaces.length === 0 && <AppText muted>{t('tripFlow.noPlaces')}</AppText>}
          {dayPlaces.map((entry) => (
            <TripPlaceCard
              key={entry.id}
              entry={entry}
              count={dayPlaces.length}
              dayCount={dayCount}
              disabled={locked}
              onUp={() => {
                void changePlace({
                  kind: 'reorder',
                  entry,
                  destination: day,
                  position: entry.position - 1,
                });
              }}
              onDown={() => {
                void changePlace({
                  kind: 'reorder',
                  entry,
                  destination: day,
                  position: entry.position + 1,
                });
              }}
              onMove={() => openPlaceAction(entry, 'move')}
              onRemove={() => openPlaceAction(entry, 'remove')}
            />
          ))}
          <Button
            destructive
            label={t('tripFlow.delete')}
            disabled={locked}
            onPress={() => {
              setDeleteError(false);
              setConfirming(true);
            }}
          />
          <Dialog
            visible={placeAction !== null}
            title={t(
              placeAction?.kind === 'move' ? 'itinerary.moveTitle' : 'itinerary.removeTitle',
            )}
            onClose={() => {
              if (!changingPlaceRef.current) setPlaceAction(null);
            }}
          >
            {actionEntry && placeAction ? (
              <>
                <AppText variant="label">{actionEntry.placeSnapshot.title}</AppText>
                {placeAction.kind === 'move' ? (
                  <>
                    <AppText>{t('itinerary.moveHint', { day: actionEntry.dayNumber })}</AppText>
                    {validDestination ? (
                      <TripDayPicker
                        trip={data.trip}
                        value={placeAction.destination}
                        disabled={locked}
                        showDays
                        onChange={(destination) => {
                          setPlaceAction({ ...placeAction, destination });
                          setPlaceError(false);
                        }}
                      />
                    ) : (
                      <AppText accessibilityRole="alert">{t('places.targetMissing')}</AppText>
                    )}
                  </>
                ) : (
                  <AppText>{t('itinerary.removeBody', { day: actionEntry.dayNumber })}</AppText>
                )}
                {placeError && (
                  <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
                    {t('itinerary.saveError')}
                  </AppText>
                )}
                <Button
                  label={t(
                    placeAction.kind === 'move' ? 'itinerary.confirmMove' : 'itinerary.remove',
                  )}
                  destructive={placeAction.kind === 'remove'}
                  busy={changingPlace}
                  disabled={
                    locked ||
                    (placeAction.kind === 'move' &&
                      (!validDestination || placeAction.destination === actionEntry.dayNumber))
                  }
                  onPress={() => {
                    void changePlace(
                      placeAction.kind === 'remove'
                        ? { kind: 'remove', entry: actionEntry }
                        : {
                            kind: 'move',
                            entry: actionEntry,
                            destination: placeAction.destination,
                          },
                    );
                  }}
                />
              </>
            ) : (
              <AppText accessibilityRole="alert">{t('itinerary.missingPlace')}</AppText>
            )}
            <Button
              secondary
              label={t('tripFlow.cancel')}
              disabled={changingPlace}
              onPress={() => setPlaceAction(null)}
            />
          </Dialog>
          <Dialog
            visible={confirming}
            title={t('tripFlow.deleteTitle')}
            onClose={() => {
              if (!deletingRef.current) setConfirming(false);
            }}
          >
            <AppText>{t('tripFlow.deleteBody', { title: data.trip.title })}</AppText>
            {deleteError && (
              <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
                {t('tripFlow.deleteError')}
              </AppText>
            )}
            <Button
              secondary
              label={t('tripFlow.cancel')}
              disabled={deleting}
              onPress={() => setConfirming(false)}
            />
            <Button
              destructive
              label={t('tripFlow.delete')}
              busy={deleting}
              onPress={() => void remove()}
            />
          </Dialog>
        </>
      )}
    </Screen>
  );
}
