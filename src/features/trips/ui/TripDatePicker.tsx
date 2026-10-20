import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ComponentRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View, useColorScheme } from 'react-native';

import { getSeoulToday, type CalendarDate } from '@/shared/date/calendarDate';
import { Dialog } from '@/shared/Dialog';
import { Button } from '@/shared/ui';
import { spacing } from '@/shared/theme';

import { toPickerDate } from './tripDate';

export function TripDatePicker({
  value,
  minimum,
  title,
  onSelect,
  onClose,
  returnFocusRef,
}: {
  value: CalendarDate;
  minimum?: CalendarDate;
  title: string;
  onSelect: (date: CalendarDate) => void;
  onClose: () => void;
  returnFocusRef?: RefObject<ComponentRef<typeof View> | null>;
}) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const [selected, setSelected] = useState(minimum && value < minimum ? minimum : value);
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={toPickerDate(selected)}
        mode="date"
        display="calendar"
        timeZoneName="Asia/Seoul"
        minimumDate={minimum ? toPickerDate(minimum) : undefined}
        positiveButton={{ label: t('tripFlow.chooseDate') }}
        negativeButton={{ label: t('tripFlow.cancel') }}
        onDismiss={onClose}
        onValueChange={(_, date) => {
          onClose();
          onSelect(getSeoulToday(date));
        }}
      />
    );
  }
  return (
    <Dialog
      visible
      title={title}
      onClose={onClose}
      contentStyle={{ paddingHorizontal: spacing.sm }}
      returnFocusRef={returnFocusRef}
    >
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <DateTimePicker
          value={toPickerDate(selected)}
          mode="date"
          display="inline"
          timeZoneName="Asia/Seoul"
          minimumDate={minimum ? toPickerDate(minimum) : undefined}
          locale={i18n.resolvedLanguage === 'ko' ? 'ko-KR' : 'en-US'}
          themeVariant={scheme === 'dark' ? 'dark' : 'light'}
          onValueChange={(_, date) => setSelected(getSeoulToday(date))}
        />
      </ScrollView>
      <Button
        label={t('tripFlow.chooseDate')}
        onPress={() => {
          onSelect(selected);
          onClose();
        }}
      />
      <Button secondary label={t('tripFlow.cancel')} onPress={onClose} />
    </Dialog>
  );
}
