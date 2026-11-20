import { alpha, createTheme, type Components, type Theme } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import { alarmDatePickerDefaults, alarmDateTimePickerDefaults, alarmTimePickerDefaults } from './defaults';

const timeNames = ['MuiTimePicker', 'MuiDesktopTimePicker', 'MuiMobileTimePicker'] as const;
const dateTimeNames = ['MuiDateTimePicker', 'MuiDesktopDateTimePicker', 'MuiMobileDateTimePicker'] as const;
const dateNames = ['MuiDatePicker', 'MuiDesktopDatePicker', 'MuiMobileDatePicker'] as const;

const defaultProps: Record<string, { defaultProps: any }> = {};
timeNames.forEach((n) => (defaultProps[n] = { defaultProps: alarmTimePickerDefaults }));
dateTimeNames.forEach((n) => (defaultProps[n] = { defaultProps: alarmDateTimePickerDefaults }));
dateNames.forEach((n) => (defaultProps[n] = { defaultProps: alarmDatePickerDefaults }));

// The popper's theme key is MuiPickersPopper in MUI X <= 8 and MuiPickerPopper in 9; cover both.
const popper = {
  styleOverrides: {
    paper: ({ theme }: { theme: Theme }) => ({ borderRadius: 28, boxShadow: theme.shadows[8] }),
  },
};
const day = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      fontSize: '0.95rem',
      fontWeight: 500,
      '&.Mui-selected': { fontWeight: 700 },
      '&.MuiPickersDay-today:not(.Mui-selected), &.MuiPickerDay-today:not(.Mui-selected)': {
        border: `1.5px solid ${alpha(theme.palette.primary.main, 0.6)}`,
      },
    }),
  },
};
// Same rename for the day cell (MuiPickersDay -> MuiPickerDay).
const versionedOverrides: Record<string, unknown> = {
  MuiPickersPopper: popper,
  MuiPickerPopper: popper,
  MuiPickersDay: day,
  MuiPickerDay: day,
};

/**
 * Theme `components` that restyle every MUI X date/time picker and swap the time and date-time
 * views for the alarm wheels. Spread into `createTheme({ components: { ...alarmPickersComponents } })`
 * or use `withAlarmPickers(theme)`.
 *
 * Note: MUI theme `defaultProps` are shallow, so a `slotProps` prop on a picker replaces the
 * defaults here (hidden toolbar, Cancel/OK). Use `AlarmTimePicker` & co. if you want them merged.
 */
export const alarmPickersComponents: Components<Omit<Theme, 'components'>> = {
  ...(defaultProps as Components<Omit<Theme, 'components'>>),
  ...(versionedOverrides as Components<Omit<Theme, 'components'>>),
  MuiDayCalendar: {
    styleOverrides: {
      weekDayLabel: ({ theme }) => ({
        fontSize: '0.75rem',
        fontWeight: 600,
        color: theme.palette.text.secondary,
      }),
    },
  },
  MuiPickersCalendarHeader: {
    styleOverrides: {
      label: { fontWeight: 600 },
    },
  },
  MuiPickersLayout: {
    styleOverrides: {
      actionBar: ({ theme }) => ({
        padding: theme.spacing(1, 2, 2),
        justifyContent: 'space-between',
        '& .MuiButton-root': { borderRadius: 24, fontWeight: 600, paddingInline: theme.spacing(3) },
      }),
    },
  },
};

/** Returns `theme` with the alarm picker components merged on top. */
export function withAlarmPickers(theme: Theme): Theme {
  return createTheme(theme, { components: alarmPickersComponents });
}
