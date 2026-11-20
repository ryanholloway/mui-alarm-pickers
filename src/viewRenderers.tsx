import * as React from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { TimeWheel, type TimeWheelProps, type TimeWheelUnit, type TimeWheelValue } from './TimeWheel';
import { useAdapter } from './useAdapter';

/** Props MUI X passes to a view renderer (loosely typed so it fits every picker/version). */
export interface AlarmViewRendererProps {
  value?: any;
  referenceDate?: any;
  onChange: (value: any, selectionState?: 'partial' | 'shallow' | 'finish') => void;
  ampm?: boolean;
  minutesStep?: number;
  minTime?: any;
  maxTime?: any;
  shouldDisableTime?: (value: any, view: 'hours' | 'minutes' | 'seconds') => boolean;
  disabled?: boolean;
  readOnly?: boolean;
  timezone?: string;
  [key: string]: any;
}

/** Extra TimeWheel props, set through `slotProps`-style config on the wrappers. */
export type AlarmWheelProps = Omit<TimeWheelProps, 'value' | 'onChange' | 'ampm' | 'minutesStep' | 'isTimeDisabled'>;

const minuteOfDay = (adapter: any, d: any) => adapter.getHours(d) * 60 + adapter.getMinutes(d);

function useWheel(props: AlarmViewRendererProps) {
  const adapter = useAdapter();
  const { value, referenceDate, onChange, minTime, maxTime, shouldDisableTime, timezone } = props;

  const source = value ?? referenceDate ?? null;
  const wheelValue: TimeWheelValue | null =
    source && adapter.isValid(source)
      ? { hours: adapter.getHours(source), minutes: adapter.getMinutes(source) }
      : null;

  const build = (next: TimeWheelValue) => {
    const hasBase = value && adapter.isValid(value);
    let d = hasBase ? value : (referenceDate ?? adapter.date(undefined, timezone));
    d = adapter.setMinutes(adapter.setHours(d, next.hours), next.minutes);
    return hasBase ? d : adapter.setSeconds(d, 0);
  };

  const min = minTime && adapter.isValid(minTime) ? minuteOfDay(adapter, minTime) : null;
  const max = maxTime && adapter.isValid(maxTime) ? minuteOfDay(adapter, maxTime) : null;

  const isTimeDisabled = (c: TimeWheelValue, unit: TimeWheelUnit) => {
    // For the hours wheel the whole hour is out of range only if every minute in it is.
    const lo = c.hours * 60 + (unit === 'hours' ? 0 : c.minutes);
    const hi = c.hours * 60 + (unit === 'hours' ? 59 : c.minutes);
    if (min !== null && hi < min) return true;
    if (max !== null && lo > max) return true;
    if (shouldDisableTime) return shouldDisableTime(build(c), unit === 'minutes' ? 'minutes' : 'hours');
    return false;
  };

  return {
    wheelValue,
    isTimeDisabled,
    commit: (next: TimeWheelValue) => onChange(build(next), 'partial'),
  };
}

export function AlarmTimeView(props: AlarmViewRendererProps & { wheelProps?: AlarmWheelProps }) {
  const { ampm, minutesStep, disabled, readOnly, wheelProps } = props;
  const { wheelValue, isTimeDisabled, commit } = useWheel(props);
  // Follow the LocalizationProvider's locale (dayjs/date-fns/luxon adapters expose a locale string or object).
  const adapterLocale = (useAdapter() as any).locale;
  const locale = typeof adapterLocale === 'string' ? adapterLocale : adapterLocale?.code;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, px: 3 }}>
      <TimeWheel
        locale={locale}
        {...wheelProps}
        value={wheelValue}
        onChange={commit}
        ampm={ampm}
        minutesStep={minutesStep}
        isTimeDisabled={isTimeDisabled}
        disabled={disabled}
        readOnly={readOnly}
      />
    </Box>
  );
}

export interface AlarmDateTimeViewOptions {
  /** Show "Date" / "Time" tabs instead of stacking the calendar over the wheels. Picking a day jumps to the Time tab. */
  tabbed?: boolean;
  /** Tab captions when `tabbed`. */
  tabLabels?: { date?: string; time?: string };
  wheelProps?: AlarmWheelProps;
}

export function AlarmDateTimeView(props: AlarmViewRendererProps & AlarmDateTimeViewOptions) {
  const {
    value, referenceDate, onChange, minDate, maxDate, disablePast, disableFuture, shouldDisableDate,
    shouldDisableMonth, shouldDisableYear, showDaysOutsideCurrentMonth, displayWeekNumber, fixedWeekNumber,
    reduceAnimations, slots, slotProps, readOnly, disabled, timezone, dayOfWeekFormatter,
    tabbed, tabLabels,
  } = props;
  const [tab, setTab] = React.useState<'date' | 'time'>('date');
  const id = React.useId();

  const calendar = (
    <DateCalendar
      value={value}
      referenceDate={referenceDate}
      // Always 'partial': the picker must not auto-advance or close while the user is still choosing a time.
      onChange={(v) => {
        onChange(v, 'partial');
        if (tabbed) setTab('time');
      }}
      {...{
        minDate, maxDate, disablePast, disableFuture, shouldDisableDate, shouldDisableMonth,
        shouldDisableYear, showDaysOutsideCurrentMonth, displayWeekNumber, fixedWeekNumber,
        reduceAnimations, slots, slotProps, readOnly, disabled, timezone, dayOfWeekFormatter,
      }}
    />
  );

  if (!tabbed) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {calendar}
        <Box sx={{ width: '100%', borderTop: 1, borderColor: 'divider' }}>
          <AlarmTimeView {...props} />
        </Box>
      </Box>
    );
  }

  // Both panels stay laid out in the same grid cell (the inactive one is only `visibility: hidden`) so the
  // picker keeps a constant size and the wheels' scroll position is set while they have real dimensions.
  const panel = (name: 'date' | 'time', active: boolean, children: React.ReactNode, center = false) => (
    <Box
      role="tabpanel"
      id={`${id}-panel-${name}`}
      aria-labelledby={`${id}-tab-${name}`}
      aria-hidden={!active}
      sx={{
        gridArea: '1 / 1',
        visibility: active ? 'visible' : 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: center ? 'center' : 'flex-start',
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="date" label={tabLabels?.date ?? 'Date'} id={`${id}-tab-date`} aria-controls={`${id}-panel-date`} />
        <Tab value="time" label={tabLabels?.time ?? 'Time'} id={`${id}-tab-time`} aria-controls={`${id}-panel-time`} />
      </Tabs>
      <Box sx={{ display: 'grid' }}>
        {panel('date', tab === 'date', calendar)}
        {panel('time', tab === 'time', <AlarmTimeView {...props} />, true)}
      </Box>
    </Box>
  );
}

/** Drop-in for `viewRenderers.hours` / `.minutes` (time pickers). */
export const renderAlarmTimeView = (props: AlarmViewRendererProps) => <AlarmTimeView {...props} />;

/** Drop-in for `viewRenderers.day` / `.hours` / `.minutes` (date-time pickers): calendar on top, wheels below. */
export const renderAlarmDateTimeView = (props: AlarmViewRendererProps) => <AlarmDateTimeView {...props} />;

/** Like `renderAlarmDateTimeView`, with Date / Time tabs; choosing a day moves on to the Time tab. */
export const renderAlarmTabbedDateTimeView = (props: AlarmViewRendererProps) => (
  <AlarmDateTimeView {...props} tabbed />
);
