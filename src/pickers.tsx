import * as React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
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

/** MUI TimePicker with scroll wheels. Same props as `TimePicker`. */
export const AlarmTimePicker = withDefaults<React.ComponentProps<typeof TimePicker>>(
  TimePicker as any,
  alarmTimePickerDefaults,
  'AlarmTimePicker',
);

/** MUI DateTimePicker with calendar on top and hour/minute wheels below. Same props as `DateTimePicker`. */
export const AlarmDateTimePicker = withDefaults<React.ComponentProps<typeof DateTimePicker>>(
  DateTimePicker as any,
  alarmDateTimePickerDefaults,
  'AlarmDateTimePicker',
);
