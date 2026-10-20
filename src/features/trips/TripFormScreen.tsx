import { randomUUID } from 'expo-crypto';
import { router, usePreventRemove } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import type { StoredTrip } from '@/database/records';
import { tripRepository } from '@/database/tripRepository';
import { Dialog } from '@/shared/Dialog';
import { getSeoulToday } from '@/shared/date/calendarDate';
import { radius, spacing, useColors } from '@/shared/theme';
import { AppText, BackButton, Button, Card, PageHeading, Screen } from '@/shared/ui';

import { getTripDayCount, validateTripInput } from './domain/trip';
import type { TripValidationIssue } from './domain/types';
import { useSeoulToday, useTrip } from './hooks/useTrips';
import { TripDatePicker } from './ui/TripDatePicker';
import { TripFeedback } from './ui/TripFeedback';
import { formatTripDate } from './ui/tripDate';

export function EditTripScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useTrip(tripId);
  // Keep the mounted form and its draft during a failed background refresh.
  if (data === undefined && (error || loading)) {
    return (
      <Screen>
        <BackButton
          label={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/my-trips'))}
        />
        <TripFeedback error={error} retry={retry} />
      </Screen>
    );
  }
  if (!data)
    return (
      <Screen>
        <AppText>{t('tripFlow.missing')}</AppText>
        <Button label={t('tripFlow.allTrips')} onPress={() => router.replace('/my-trips')} />
      </Screen>
    );
  return <TripFormScreen key={data.id} initialTrip={data} />;
}

export function TripFormScreen({ initialTrip }: { initialTrip?: StoredTrip }) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const today = useSeoulToday();
  const [baseline] = useState(() => initialTrip ?? { title: '', startDate: today, endDate: today });
  const [id] = useState(() => initialTrip?.id ?? randomUUID());
  const [title, setTitle] = useState(baseline.title);
  const [startDate, setStartDate] = useState(baseline.startDate);
  const [endDate, setEndDate] = useState(baseline.endDate);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [issues, setIssues] = useState<readonly TripValidationIssue[]>([]);
  const [message, setMessage] = useState('');
  const [occupiedDay, setOccupiedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const savingRef = useRef(false);
  const repeatNavigation = useRef<(() => void) | null>(null);
  const titleInput = useRef<ComponentRef<typeof TextInput>>(null);
  const startDateButton = useRef<ComponentRef<typeof View>>(null);
  const endDateButton = useRef<ComponentRef<typeof View>>(null);
  const dirty =
    title !== baseline.title || startDate !== baseline.startDate || endDate !== baseline.endDate;
  const disablePrevention = usePreventRemove((dirty || saving) && !leaving, ({ repeat }) => {
    if (savingRef.current) return;
    repeatNavigation.current = repeat;
    setDiscarding(true);
  });
  const mode = initialTrip ? 'edit' : 'create';
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const errorText = (issue: TripValidationIssue) =>
    t(
      `tripFlow.${
        (
          {
            required: 'requiredTitle',
            invalid_date: 'invalidDate',
            start_before_today: 'pastStart',
            end_before_start: 'endBeforeStart',
          } as const
        )[issue.code]
      }`,
    );

  async function save() {
    if (savingRef.current) return;
    Keyboard.dismiss();
    setMessage('');
    setOccupiedDay(null);
    const input = { title, startDate, endDate };
    const validation = validateTripInput(input, mode);
    setIssues(validation.ok ? [] : validation.issues);
    if (!validation.ok) {
      if (validation.issues.some((issue) => issue.field === 'title')) titleInput.current?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const result = initialTrip
        ? await tripRepository.update(id, input)
        : await tripRepository.create(id, input);
      if (!result.ok) {
        if ('issues' in result) setIssues(result.issues);
        else {
          const days = [...new Set(result.affectedPlaces.map((place) => place.dayNumber))]
            .map((number) => t('tripFlow.day', { number }))
            .join(', ');
          setMessage(t('tripFlow.occupiedDays', { days }));
          setOccupiedDay(result.affectedPlaces[0]?.dayNumber ?? null);
        }
        return;
      }
      setLeaving(true);
      setSaving(false);
      disablePrevention();
      const detail = { pathname: '/trips/[tripId]' as const, params: { tripId: id } };
      if (initialTrip) router.dismissTo(detail);
      else router.replace(detail);
    } catch {
      setMessage(t('tripFlow.saveError'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Screen>
      <BackButton label={t('common.back')} onPress={back} disabled={saving} />
      <PageHeading
        title={t(initialTrip ? 'details.editTitle' : 'details.createTitle')}
        description={t(initialTrip ? 'tripFlow.editDateHint' : 'tripFlow.dateHint')}
      />
      <Card>
        <AppText variant="label">{t('tripFlow.titleLabel')}</AppText>
        <TextInput
          ref={titleInput}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setIssues((previous) => previous.filter((issue) => issue.field !== 'title'));
          }}
          editable={!saving}
          accessibilityLabel={t('tripFlow.titleLabel')}
          placeholder={t('tripFlow.titlePlaceholder')}
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: issues.some((issue) => issue.field === 'title')
                ? colors.danger
                : colors.border,
            },
          ]}
        />
        {issues
          .filter((issue) => issue.field === 'title')
          .map((issue) => (
            <AppText key={issue.code} accessibilityRole="alert" style={{ color: colors.danger }}>
              {errorText(issue)}
            </AppText>
          ))}
        <AppText variant="label">{t('tripFlow.startDate')}</AppText>
        <Button
          secondary
          label={formatTripDate(startDate, i18n.language)}
          ref={startDateButton}
          accessibilityLabel={`${t('tripFlow.startDate')}, ${formatTripDate(startDate, i18n.language)}`}
          disabled={saving}
          onPress={() => {
            Keyboard.dismiss();
            setPicker('start');
          }}
        />
        <AppText variant="label">{t('tripFlow.endDate')}</AppText>
        <Button
          secondary
          label={formatTripDate(endDate, i18n.language)}
          ref={endDateButton}
          accessibilityLabel={`${t('tripFlow.endDate')}, ${formatTripDate(endDate, i18n.language)}`}
          disabled={saving}
          onPress={() => {
            Keyboard.dismiss();
            setPicker('end');
          }}
        />
        {issues
          .filter((issue) => issue.field !== 'title' && issue.code !== 'end_before_start')
          .map((issue) => (
            <AppText
              key={`${issue.field}-${issue.code}`}
              accessibilityRole="alert"
              style={{ color: colors.danger }}
            >
              {errorText(issue)}
            </AppText>
          ))}
        {endDate < startDate ? (
          <AppText style={{ color: colors.danger }}>{t('tripFlow.endBeforeStart')}</AppText>
        ) : (
          <AppText muted>
            {t('tripFlow.duration', { count: getTripDayCount({ startDate, endDate }) })}
          </AppText>
        )}
      </Card>
      {!!message && (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {message}
        </AppText>
      )}
      {occupiedDay !== null && initialTrip && (
        <Button
          secondary
          label={t('itinerary.organizeDays', { day: occupiedDay })}
          disabled={saving}
          onPress={() =>
            router.dismissTo({
              pathname: '/trips/[tripId]',
              params: { tripId: initialTrip.id, day: String(occupiedDay) },
            })
          }
        />
      )}
      <Button label={t('tripFlow.save')} busy={saving} onPress={() => void save()} />
      {picker && (
        <TripDatePicker
          key={picker}
          returnFocusRef={picker === 'start' ? startDateButton : endDateButton}
          title={t(picker === 'start' ? 'tripFlow.startDate' : 'tripFlow.endDate')}
          value={picker === 'start' ? startDate : endDate}
          minimum={picker === 'end' ? startDate : mode === 'create' ? today : undefined}
          onClose={() => setPicker(null)}
          onSelect={(date) => {
            setIssues([]);
            setMessage('');
            setOccupiedDay(null);
            if (picker === 'start') {
              if (mode === 'create' && date < getSeoulToday())
                setIssues([{ field: 'startDate', code: 'start_before_today' }]);
              else setStartDate(date);
            } else setEndDate(date);
          }}
        />
      )}
      <Dialog
        visible={discarding}
        title={t('tripFlow.discardTitle')}
        onClose={() => setDiscarding(false)}
      >
        <AppText>{t('tripFlow.discardBody')}</AppText>
        <Button secondary label={t('tripFlow.cancel')} onPress={() => setDiscarding(false)} />
        <Button
          destructive
          label={t('tripFlow.discard')}
          onPress={() => {
            setDiscarding(false);
            setLeaving(true);
            repeatNavigation.current?.();
          }}
        />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    lineHeight: 24,
  },
});
