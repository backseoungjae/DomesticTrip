import { randomUUID } from 'expo-crypto';
import { router, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DuplicateTripPlaceError, tripPlaceRepository } from '@/database/tripPlaceRepository';
import { RecordNotFoundError } from '@/database/records';
import { getTripDayCount } from '@/features/trips/domain/trip';
import { useTrips } from '@/features/trips/hooks/useTrips';
import { TripDayPicker } from '@/features/trips/ui/TripDayPicker';
import { formatTripDate } from '@/features/trips/ui/tripDate';
import { Dialog } from '@/shared/Dialog';
import { AppText, Button } from '@/shared/ui';
import type { TourPlace } from '../domain/TourPlace';

export interface PlaceTarget {
  tripId: string;
  dayNumber: number;
}

export function AddPlaceDialog({
  place,
  target,
  onClose,
  onAdded,
}: {
  place: TourPlace;
  target?: PlaceTarget;
  onClose: () => void;
  onAdded: (target: PlaceTarget) => void;
}) {
  const { t, i18n } = useTranslation();
  const trips = useTrips();
  const [tripId, setTripId] = useState<string | null>(target?.tripId ?? null);
  const [day, setDay] = useState(target?.dayNumber ?? 1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [duplicates, setDuplicates] = useState<readonly number[] | null>(null);
  const savingRef = useRef(false);
  const disablePrevention = usePreventRemove(saving);
  const trip = trips.data?.find((entry) => entry.id === tripId);
  const validDay = !!trip && Number.isSafeInteger(day) && day >= 1 && day <= getTripDayCount(trip);

  async function save(allowDuplicate = false) {
    if (!trip || !validDay || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setMessage('');
    try {
      await tripPlaceRepository.add(trip.id, randomUUID(), day, place, allowDuplicate);
      disablePrevention();
      onAdded({ tripId: trip.id, dayNumber: day });
    } catch (error) {
      if (error instanceof DuplicateTripPlaceError) setDuplicates(error.days);
      else {
        setMessage(
          t(error instanceof RecordNotFoundError ? 'places.targetMissing' : 'places.saveError'),
        );
        trips.retry();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog
      visible
      title={t(tripId ? 'places.chooseDay' : 'places.chooseTrip')}
      onClose={() => {
        if (!savingRef.current) onClose();
      }}
    >
      <AppText variant="label">{place.title}</AppText>
      {trips.error ? (
        <>
          <AppText accessibilityRole="alert">{t('tripFlow.loadError')}</AppText>
          <Button label={t('settings.retry')} onPress={trips.retry} disabled={saving} />
        </>
      ) : trips.data === undefined ? (
        <AppText>{t('tripFlow.loading')}</AppText>
      ) : tripId ? (
        !trip || !validDay ? (
          <>
            <AppText accessibilityRole="alert">{t('places.targetMissing')}</AppText>
            <Button label={t('settings.retry')} onPress={trips.retry} disabled={saving} />
            {!target && (
              <Button
                secondary
                label={t('places.changeTrip')}
                onPress={() => {
                  setTripId(null);
                  setDay(1);
                  setDuplicates(null);
                  setMessage('');
                }}
              />
            )}
          </>
        ) : (
          <>
            <AppText>{trip.title}</AppText>
            <TripDayPicker
              trip={trip}
              value={day}
              disabled={saving || !!target}
              onChange={(value) => {
                setDay(value);
                setDuplicates(null);
                setMessage('');
              }}
            />
            {target ? (
              <AppText muted>{t('places.fixedTarget')}</AppText>
            ) : (
              <Button
                secondary
                label={t('places.changeTrip')}
                disabled={saving}
                onPress={() => {
                  setTripId(null);
                  setDay(1);
                  setDuplicates(null);
                  setMessage('');
                }}
              />
            )}
            {duplicates ? (
              <>
                <AppText accessibilityRole="alert">
                  {t('places.duplicate', {
                    days: duplicates.map((number) => t('tripFlow.day', { number })).join(', '),
                  })}
                </AppText>
                <Button
                  label={t('places.addAgain')}
                  busy={saving}
                  onPress={() => {
                    void save(true);
                  }}
                />
                <Button
                  secondary
                  label={t('places.keepExisting')}
                  disabled={saving}
                  onPress={onClose}
                />
              </>
            ) : (
              <Button
                label={t('places.add')}
                busy={saving}
                onPress={() => {
                  void save();
                }}
              />
            )}
          </>
        )
      ) : trips.data.length ? (
        trips.data.map((entry) => (
          <Button
            secondary
            key={entry.id}
            label={`${entry.title} · ${formatTripDate(entry.startDate, i18n.language)} – ${formatTripDate(entry.endDate, i18n.language)}`}
            onPress={() => {
              setTripId(entry.id);
              setDay(1);
            }}
          />
        ))
      ) : (
        <>
          <AppText>{t('places.noTrips')}</AppText>
          <Button
            label={t('common.createTrip')}
            onPress={() => {
              onClose();
              router.push('/trips/create');
            }}
          />
        </>
      )}
      {!!message && <AppText accessibilityRole="alert">{message}</AppText>}
      <Button secondary label={t('tripFlow.cancel')} disabled={saving} onPress={onClose} />
    </Dialog>
  );
}
