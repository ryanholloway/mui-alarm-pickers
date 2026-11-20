import * as React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AlarmDateTimeView, AlarmTimeView, type AlarmWheelProps } from './viewRenderers';
import {
  alarmDatePickerDefaults,
  alarmDateTimePickerDefaults,
  alarmTimePickerDefaults,
  mergeSlotProps,
} from './defaults';

type Defaults = { slotProps: Record<string, any>; viewRenderers?: Record<string, any> } & Record<string, any>;

function withDefaults<P extends { slotProps?: any; viewRenderers?: any }>(
  Base: React.ComponentType<P>,
  defaults: Defaults,
  displayName: string,
) {
  const Comp = React.forwardRef<HTMLDivElement, P>((props, ref) => {
    const merged = {
      ...defaults,
      ...props,
      slotProps: mergeSlotProps(defaults.slotProps, props.slotProps),
      viewRenderers: { ...defaults.viewRenderers, ...props.viewRenderers },
    } as unknown as P;
    return <Base {...merged} ref={ref} />;
  });
  Comp.displayName = displayName;
  return Comp;
}

/** MUI DatePicker with the alarm look (calendar only). Same props as `DatePicker`. */
export const AlarmDatePicker = withDefaults<React.ComponentProps<typeof DatePicker>>(
  DatePicker as any,
  alarmDatePickerDefaults,
  'AlarmDatePicker',
);

export type AlarmTimePickerProps = React.ComponentProps<typeof TimePicker> & {
  /** Extra `TimeWheel` props: `locale`, `labels`, `meridiemLabels`, `separator`, `highlightSx`, `sx`, ... */
  wheelProps?: AlarmWheelProps;
};

/** MUI TimePicker with scroll wheels. Same props as `TimePicker`, plus `wheelProps`. */
export const AlarmTimePicker = React.forwardRef<HTMLDivElement, AlarmTimePickerProps>(
  ({ wheelProps, ...props }, ref) => {
    const render = (p: any) => <AlarmTimeView {...p} wheelProps={wheelProps} />;
    const merged: any = {
      ...alarmTimePickerDefaults,
      ...props,
      slotProps: mergeSlotProps(alarmTimePickerDefaults.slotProps, props.slotProps),
      viewRenderers: { hours: render, minutes: render, ...props.viewRenderers },
    };
    return <TimePicker {...merged} ref={ref} />;
  },
);
AlarmTimePicker.displayName = 'AlarmTimePicker';

export type AlarmDateTimePickerProps = React.ComponentProps<typeof DateTimePicker> & {
  /** Date / Time tabs instead of calendar-over-wheels. Picking a day moves to the Time tab. Default false. */
  tabbed?: boolean;
  /** Tab captions when `tabbed` (default "Date" / "Time"). */
  tabLabels?: { date?: string; time?: string };
  /** Extra `TimeWheel` props: `locale`, `labels`, `meridiemLabels`, `separator`, `highlightSx`, `sx`, ... */
  wheelProps?: AlarmWheelProps;
};

/**
 * MUI DateTimePicker with calendar on top and hour/minute wheels below, or, with `tabbed`,
 * a Date tab that moves on to a Time tab once a day is chosen. Otherwise same props as `DateTimePicker`.
 */
export const AlarmDateTimePicker = React.forwardRef<HTMLDivElement, AlarmDateTimePickerProps>(
  ({ tabbed = false, tabLabels, wheelProps, ...props }, ref) => {
    const merged: any = {
      ...alarmDateTimePickerDefaults,
      ...props,
      slotProps: mergeSlotProps(alarmDateTimePickerDefaults.slotProps, props.slotProps),
      viewRenderers: {
        // The 'day' view holds calendar + wheels; the separate time views render nothing.
        day: (p: any) => <AlarmDateTimeView {...p} tabbed={tabbed} tabLabels={tabLabels} wheelProps={wheelProps} />,
        hours: () => null,
        minutes: () => null,
        ...props.viewRenderers,
      },
    };
    return <DateTimePicker {...merged} ref={ref} />;
  },
);
AlarmDateTimePicker.displayName = 'AlarmDateTimePicker';
