import { renderAlarmDateTimeView, renderAlarmTimeView } from './viewRenderers';

const hiddenChrome = { toolbar: { hidden: true }, tabs: { hidden: true } };
const actions = { actionBar: { actions: ['cancel', 'accept'] as ('cancel' | 'accept')[] } };

/** Props that turn a MUI TimePicker into the wheel picker. */
export const alarmTimePickerDefaults = {
  views: ['hours', 'minutes'] as ('hours' | 'minutes')[],
  viewRenderers: { hours: renderAlarmTimeView, minutes: renderAlarmTimeView },
  slotProps: { ...hiddenChrome, ...actions },
};

/** Props that turn a MUI DateTimePicker into calendar + wheels. */
export const alarmDateTimePickerDefaults = {
  views: ['day', 'hours', 'minutes'] as ('day' | 'hours' | 'minutes')[],
  openTo: 'day' as const,
  orientation: 'portrait' as const,
  viewRenderers: {
    day: renderAlarmDateTimeView,
    // Desktop renders the date view plus the time view side by side; the 'day' view already
    // contains the wheels, so the time views render nothing.
    hours: () => null,
    minutes: () => null,
  },
  slotProps: { ...hiddenChrome, ...actions },
};

/** Props for a calendar-only DatePicker. */
export const alarmDatePickerDefaults = {
  slotProps: { toolbar: { hidden: true } },
};

type AnyRecord = Record<string, any>;

/** Merge slotProps one key deep: object entries are shallow-merged, function entries win. */
export function mergeSlotProps(defaults: AnyRecord = {}, overrides: AnyRecord = {}): AnyRecord {
  const out: AnyRecord = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const o = overrides[key];
    const d = defaults[key];
    out[key] =
      typeof o === 'function' || typeof d === 'function' || !d || !o ? (o ?? d) : { ...d, ...o };
  }
  return out;
}
