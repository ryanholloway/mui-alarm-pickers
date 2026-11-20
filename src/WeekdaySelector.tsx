import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

/** Day numbers follow JavaScript / dayjs `.day()`: 0 = Sunday … 6 = Saturday. */
export type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeekdaySelectorProps {
  value: number[];
  onChange?: (value: number[]) => void;
  /** First day shown. Default 1 (Monday). */
  weekStartsOn?: WeekdayNumber;
  /** Allow several days. Default true; false = single select. */
  multiple?: boolean;
  /** Allow deselecting the last selected day. Default true. */
  allowEmpty?: boolean;
  /** Show an extra "Every day" toggle that selects / clears all days. Default false. */
  showEveryDay?: boolean;
  everyDayLabel?: React.ReactNode;
  /** Intl weekday format for the chips, or pass `labels`. Default 'narrow' (M T W T F S S). */
  labelFormat?: 'narrow' | 'short' | 'long';
  /** Locale for `labelFormat`. */
  locale?: string | string[];
  /** Custom chip labels, indexed by day number (0 = Sunday). Overrides `labelFormat`. */
  labels?: readonly React.ReactNode[];
  /** Days that can't be toggled. */
  disabledDays?: number[];
  disabled?: boolean;
  readOnly?: boolean;
  /** Chip diameter in px. Default 40. */
  size?: number;
  /** Gap between chips (theme spacing units). Default 1. */
  spacing?: number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  'aria-label'?: string;
  className?: string;
  sx?: SxProps<Theme>;
}

// 2024-01-07 was a Sunday.
const dayName = (day: number, format: 'narrow' | 'short' | 'long', locale?: string | string[]) =>
  new Intl.DateTimeFormat(locale, { weekday: format }).format(new Date(2024, 0, 7 + day));

export function WeekdaySelector(props: WeekdaySelectorProps) {
  const {
    value,
    onChange,
    weekStartsOn = 1,
    multiple = true,
    allowEmpty = true,
    showEveryDay = false,
    everyDayLabel = 'Every day',
    labelFormat = 'narrow',
    locale,
    labels,
    disabledDays = [],
    disabled = false,
    readOnly = false,
    size = 40,
    spacing = 1,
    color = 'primary',
    className,
    sx,
  } = props;

  const days = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
  const selected = new Set(value);
  const allSelected = days.every((d) => selected.has(d));
  const interactive = !disabled && !readOnly;

  const emit = (next: number[]) => {
    if (!allowEmpty && next.length === 0) return;
    onChange?.(days.filter((d) => next.includes(d)));
  };

  const toggle = (day: number) => {
    if (!interactive || disabledDays.includes(day)) return;
    if (!multiple) return emit(selected.has(day) ? [] : [day]);
    emit(selected.has(day) ? value.filter((d) => d !== day) : [...value, day]);
  };

  const toggleAll = () => {
    if (!interactive || !multiple) return;
    emit(allSelected ? [] : days.filter((d) => !disabledDays.includes(d) || selected.has(d)));
  };

  const chip = (on: boolean) => (t: Theme) => ({
    borderRadius: '50%',
    width: size,
    height: size,
    fontSize: size * 0.38,
    fontWeight: 600,
    color: on ? t.palette[color].contrastText : t.palette.text.secondary,
    bgcolor: on ? t.palette[color].main : 'transparent',
    border: '1.5px solid',
    borderColor: on ? t.palette[color].main : alpha(t.palette.text.primary, 0.23),
    transition: 'background-color 120ms, border-color 120ms',
    '&:hover': { bgcolor: on ? t.palette[color].dark : alpha(t.palette[color].main, 0.08) },
    '&.Mui-disabled': { opacity: 0.38 },
    '&.Mui-focusVisible': { outline: '2px solid', outlineColor: t.palette[color].main, outlineOffset: 2 },
  });

  return (
    <Box
      role="group"
      aria-label={props['aria-label'] ?? 'Days of the week'}
      className={className}
      sx={[
        { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {days.map((day) => {
        const on = selected.has(day);
        return (
          <ButtonBase
            key={day}
            aria-pressed={on}
            aria-label={dayName(day, 'long', locale)}
            disabled={disabled || disabledDays.includes(day)}
            onClick={() => toggle(day)}
            sx={chip(on)}
          >
            {labels?.[day] ?? dayName(day, labelFormat, locale)}
          </ButtonBase>
        );
      })}
      {showEveryDay && multiple && (
        <ButtonBase
          aria-pressed={allSelected}
          disabled={disabled}
          onClick={toggleAll}
          sx={(t) => ({ ...chip(allSelected)(t), width: 'auto', borderRadius: size, px: 2, fontSize: size * 0.35 })}
        >
          {everyDayLabel}
        </ButtonBase>
      )}
    </Box>
  );
}
