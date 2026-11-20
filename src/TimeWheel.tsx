import * as React from 'react';
import Box from '@mui/material/Box';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import { ScrollWheel, type ScrollWheelItem } from './ScrollWheel';

export interface TimeWheelValue {
  /** 0–23 */
  hours: number;
  /** 0–59 */
  minutes: number;
}

export type TimeWheelUnit = 'hours' | 'minutes' | 'meridiem';

export interface TimeWheelProps {
  /** Controlled value. When null/undefined the wheels start at the current time without emitting. */
  value?: TimeWheelValue | null;
  onChange?: (value: TimeWheelValue) => void;
  /** 12h with an AM/PM wheel. Default: 24h. */
  ampm?: boolean;
  minutesStep?: number;
  /** Wrap hours/minutes around. Default true. */
  loop?: boolean;
  /** Return true to grey out an option. `candidate` is the value that picking it would produce. */
  isTimeDisabled?: (candidate: TimeWheelValue, unit: TimeWheelUnit) => boolean;
  /** Zero-pad hours (e.g. 07). Default true. */
  padHours?: boolean;
  separator?: React.ReactNode;
  /**
   * BCP 47 locale (e.g. 'ar-EG', 'de'). Formats the digits with `Intl.NumberFormat` and derives the
   * AM/PM text from `Intl.DateTimeFormat`. Without it: ASCII digits and "AM"/"PM".
   * Inside the MUI pickers it defaults to the adapter's locale. `meridiemLabels` still wins.
   */
  locale?: string | string[];
  meridiemLabels?: { am: string; pm: string };
  /** aria-labels for each wheel. */
  labels?: Partial<Record<TimeWheelUnit, string>>;
  visibleRows?: number;
  itemHeight?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
  /**
   * Styles for the selection band. Also restylable from anywhere with CSS variables on an ancestor
   * (`--alarm-wheel-radius`, `--alarm-wheel-inset`, `--alarm-wheel-highlight-color`) or the
   * `.AlarmTimeWheel-highlight` class.
   */
  highlightSx?: SxProps<Theme>;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const makeNumberFormat = (locale: string | string[] | undefined, pad: boolean) => {
  if (!locale) return (n: number) => (pad ? pad2(n) : String(n));
  try {
    const f = new Intl.NumberFormat(locale, { minimumIntegerDigits: pad ? 2 : 1, useGrouping: false });
    return (n: number) => f.format(n);
  } catch {
    return (n: number) => (pad ? pad2(n) : String(n));
  }
};

const localeMeridiem = (locale: string | string[] | undefined, pm: boolean) => {
  const fallback = pm ? 'PM' : 'AM';
  if (!locale) return fallback;
  try {
    const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true }).formatToParts(
      new Date(2024, 0, 1, pm ? 13 : 1),
    );
    return parts.find((p) => p.type === 'dayPeriod')?.value ?? fallback;
  } catch {
    return fallback;
  }
};

export function TimeWheel(props: TimeWheelProps) {
  const {
    value,
    onChange,
    ampm = false,
    minutesStep = 1,
    loop = true,
    isTimeDisabled,
    padHours = true,
    separator = ':',
    locale,
    meridiemLabels,
    labels,
    visibleRows = 5,
    itemHeight = 44,
    disabled,
    readOnly,
    className,
    sx,
    highlightSx,
  } = props;

  const fallback = React.useMemo<TimeWheelValue>(() => {
    const d = new Date();
    return { hours: d.getHours(), minutes: d.getMinutes() };
  }, []);
  const current = value ?? fallback;
  const minutes = Math.floor(current.minutes / minutesStep) * minutesStep;
  const isPm = current.hours >= 12;

  const fmtHour = React.useMemo(() => makeNumberFormat(locale, padHours), [locale, padHours]);
  const fmtMinute = React.useMemo(() => makeNumberFormat(locale, true), [locale]);
  const am = meridiemLabels?.am ?? localeMeridiem(locale, false);
  const pm = meridiemLabels?.pm ?? localeMeridiem(locale, true);

  const emit = (next: TimeWheelValue) => onChange?.(next);
  const off = (c: TimeWheelValue, u: TimeWheelUnit) => !!isTimeDisabled?.(c, u);

  const hourItems = React.useMemo<ScrollWheelItem<number>[]>(() => {
    const count = ampm ? 12 : 24;
    return Array.from({ length: count }, (_, v) => {
      const h24 = ampm ? v + (isPm ? 12 : 0) : v;
      const shown = ampm ? (v === 0 ? 12 : v) : v;
      return {
        value: v,
        label: fmtHour(shown),
        disabled: off({ hours: h24, minutes }, 'hours'),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ampm, isPm, minutes, fmtHour, isTimeDisabled]);

  const minuteItems = React.useMemo<ScrollWheelItem<number>[]>(
    () =>
      Array.from({ length: Math.ceil(60 / minutesStep) }, (_, k) => {
        const m = k * minutesStep;
        return { value: m, label: fmtMinute(m), disabled: off({ hours: current.hours, minutes: m }, 'minutes') };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minutesStep, current.hours, isTimeDisabled, fmtMinute],
  );

  const meridiemItems: ScrollWheelItem<'am' | 'pm'>[] = [
    { value: 'am', label: am, disabled: off({ hours: current.hours % 12, minutes }, 'meridiem') },
    { value: 'pm', label: pm, disabled: off({ hours: (current.hours % 12) + 12, minutes }, 'meridiem') },
  ];

  const shared = { visibleRows, itemHeight, disabled, readOnly };
  const pad = ((visibleRows % 2 === 0 ? visibleRows + 1 : visibleRows) - 1) / 2;

  return (
    <Box
      role="group"
      className={className}
      sx={[
        {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          // Breathing room so the selection band wraps the numbers instead of hugging them.
          paddingInline: 'var(--alarm-wheel-inset, 16px)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        aria-hidden
        className="AlarmTimeWheel-highlight"
        sx={[
          (t) => ({
            position: 'absolute',
            left: 0,
            right: 0,
            top: pad * itemHeight,
            height: itemHeight,
            borderRadius: 'var(--alarm-wheel-radius, 999px)',
            bgcolor: `var(--alarm-wheel-highlight-color, ${alpha(t.palette.primary.main, 0.14)})`,
            pointerEvents: 'none',
          }),
          ...(Array.isArray(highlightSx) ? highlightSx : [highlightSx]),
        ]}
      />
      <ScrollWheel
        {...shared}
        highlight={false}
        loop={loop}
        aria-label={labels?.hours ?? 'Hours'}
        items={hourItems}
        value={ampm ? current.hours % 12 : current.hours}
        onChange={(v) => emit({ hours: ampm ? v + (isPm ? 12 : 0) : v, minutes })}
      />
      <Box aria-hidden sx={{ fontSize: '1.9rem', fontWeight: 600, pb: 0.5 }}>
        {separator}
      </Box>
      <ScrollWheel
        {...shared}
        highlight={false}
        loop={loop}
        aria-label={labels?.minutes ?? 'Minutes'}
        items={minuteItems}
        value={minutes}
        onChange={(m) => emit({ hours: current.hours, minutes: m })}
      />
      {ampm && (
        <ScrollWheel
          {...shared}
          highlight={false}
          aria-label={labels?.meridiem ?? 'AM/PM'}
          items={meridiemItems}
          value={isPm ? 'pm' : 'am'}
          onChange={(m) => emit({ hours: (current.hours % 12) + (m === 'pm' ? 12 : 0), minutes })}
        />
      )}
    </Box>
  );
}
