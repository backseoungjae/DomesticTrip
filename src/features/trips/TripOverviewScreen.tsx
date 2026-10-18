import { router, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecordNotFoundError } from '@/database/records';
import { tripRepository } from '@/database/tripRepository';
import { Dialog } from '@/shared/Dialog';
import { useColors } from '@/shared/theme';
import { AppText, BackButton, Button, Card, PageHeading, Screen } from '@/shared/ui';

import { getTripDayCount, getTripStatus } from './domain/trip';
import { useSeoulToday, useTripDetail } from './hooks/useTrips';
import { TripFeedback } from './ui/TripFeedback';
import { formatTripDate } from './ui/tripDate';

export function TripOverviewScreen({ tripId }: { tripId: string }) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, retry } = useTripDetail(tripId);
  const today = useSeoulToday();
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const deletingRef = useRef(false);
  const disablePrevention = usePreventRemove(deleting);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/my-trips'));

  async function remove() {
    if (deletingRef.current) return;
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
      <BackButton label={t('common.back')} onPress={back} disabled={deleting} />
      {error || (loading && data === undefined) ? (
        <TripFeedback error={error} retry={retry} />
      ) : !data ? (
        <Card>
          <AppText>{t('tripFlow.missing')}</AppText>
          <Button label={t('tripFlow.allTrips')} onPress={() => router.replace('/my-trips')} />
        </Card>
      ) : (
        <>
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
            disabled={deleting}
            onPress={() => router.push({ pathname: '/trips/[tripId]/edit', params: { tripId } })}
          />
          <Button
            destructive
            label={t('tripFlow.delete')}
            disabled={deleting}
            onPress={() => {
              setDeleteError(false);
              setConfirming(true);
            }}
          />
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
