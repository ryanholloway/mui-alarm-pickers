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
  meridiemLabels?: { am: string; pm: string };
  /** aria-labels for each wheel. */
  labels?: Partial<Record<TimeWheelUnit, string>>;
  visibleRows?: number;
  itemHeight?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

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
    meridiemLabels = { am: 'AM', pm: 'PM' },
    labels,
    visibleRows = 5,
    itemHeight = 44,
    disabled,
    readOnly,
    className,
    sx,
  } = props;

  const fallback = React.useMemo<TimeWheelValue>(() => {
    const d = new Date();
    return { hours: d.getHours(), minutes: d.getMinutes() };
  }, []);
  const current = value ?? fallback;
  const minutes = Math.floor(current.minutes / minutesStep) * minutesStep;
  const isPm = current.hours >= 12;

  const emit = (next: TimeWheelValue) => onChange?.(next);
  const off = (c: TimeWheelValue, u: TimeWheelUnit) => !!isTimeDisabled?.(c, u);

  const hourItems = React.useMemo<ScrollWheelItem<number>[]>(() => {
    const count = ampm ? 12 : 24;
    return Array.from({ length: count }, (_, v) => {
      const h24 = ampm ? v + (isPm ? 12 : 0) : v;
      const shown = ampm ? (v === 0 ? 12 : v) : v;
      return {
        value: v,
        label: padHours ? pad2(shown) : String(shown),
        disabled: off({ hours: h24, minutes }, 'hours'),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ampm, isPm, minutes, padHours, isTimeDisabled]);

  const minuteItems = React.useMemo<ScrollWheelItem<number>[]>(
    () =>
      Array.from({ length: Math.ceil(60 / minutesStep) }, (_, k) => {
        const m = k * minutesStep;
        return { value: m, label: pad2(m), disabled: off({ hours: current.hours, minutes: m }, 'minutes') };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minutesStep, current.hours, isTimeDisabled],
  );

  const meridiemItems: ScrollWheelItem<'am' | 'pm'>[] = [
    { value: 'am', label: meridiemLabels.am, disabled: off({ hours: current.hours % 12, minutes }, 'meridiem') },
    { value: 'pm', label: meridiemLabels.pm, disabled: off({ hours: (current.hours % 12) + 12, minutes }, 'meridiem') },
  ];

  const shared = { visibleRows, itemHeight, disabled, readOnly };
  const pad = ((visibleRows % 2 === 0 ? visibleRows + 1 : visibleRows) - 1) / 2;

  return (
    <Box
      role="group"
      className={className}
      sx={[
        { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        aria-hidden
        sx={(t) => ({
          position: 'absolute',
          left: 0,
          right: 0,
          top: pad * itemHeight,
          height: itemHeight,
          borderRadius: 3,
          bgcolor: alpha(t.palette.primary.main, 0.14),
          pointerEvents: 'none',
        })}
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
