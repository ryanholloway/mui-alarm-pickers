import * as React from 'react';
import Box from '@mui/material/Box';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

export interface ScrollWheelItem<T extends string | number = number> {
  value: T;
  label?: React.ReactNode;
  disabled?: boolean;
}

export interface ScrollWheelProps<T extends string | number = number> {
  items: ScrollWheelItem<T>[];
  value: T | null | undefined;
  onChange?: (value: T) => void;
  /** Wrap around at both ends (like a phone alarm wheel). */
  loop?: boolean;
  /** Rows visible at once. Rounded up to an odd number. */
  visibleRows?: number;
  /** Row height in px. */
  itemHeight?: number;
  disabled?: boolean;
  readOnly?: boolean;
  /** Draw the highlight band behind the selected row. Disable to draw your own. */
  highlight?: boolean;
  'aria-label'?: string;
  className?: string;
  sx?: SxProps<Theme>;
}

const SETTLE_MS = 100;

export function ScrollWheel<T extends string | number = number>(props: ScrollWheelProps<T>) {
  const {
    items,
    value,
    onChange,
    loop = false,
    visibleRows = 5,
    itemHeight = 44,
    disabled = false,
    readOnly = false,
    highlight = true,
    className,
    sx,
  } = props;

  const rows = visibleRows % 2 === 0 ? visibleRows + 1 : visibleRows;
  const pad = ((rows - 1) / 2) * itemHeight;
  const n = items.length;
  const copies = loop && n > 1 ? 3 : 1;
  const offset = copies === 3 ? n : 0;
  const selectedIndex = items.findIndex((i) => i.value === value);
  const interactive = !disabled && !readOnly;

  const ref = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstRender = React.useRef(true);
  const drag = React.useRef<{ y: number; top: number; moved: boolean } | null>(null);

  const targetTop = (index: number) => (index + offset) * itemHeight;

  const nearestEnabled = React.useCallback(
    (from: number) => {
      for (let d = 0; d < n; d += 1) {
        for (const i of [from + d, from - d]) {
          const idx = loop ? (i + n) % n : i;
          if (idx >= 0 && idx < n && !items[idx].disabled) return idx;
        }
      }
      return -1;
    },
    [items, loop, n],
  );

  // Keep the scroll position in sync with the controlled value.
  React.useEffect(() => {
    const el = ref.current;
    if (!el || n === 0) return;
    const top = targetTop(Math.max(selectedIndex, 0));
    if (Math.abs(el.scrollTop - top) <= 1) {
      firstRender.current = false;
      return;
    }
    if (!firstRender.current && typeof el.scrollTo === 'function') {
      el.scrollTo({ top, behavior: 'smooth' });
    } else {
      el.scrollTop = top;
    }
    firstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, n, copies, itemHeight]);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const settle = () => {
    const el = ref.current;
    if (!el || n === 0) return;
    const raw = Math.min(Math.max(Math.round(el.scrollTop / itemHeight), 0), n * copies - 1);
    const real = nearestEnabled(raw % n);
    if (real < 0) return;
    const top = targetTop(real);
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTop = top;
    if (items[real].value !== value) onChange?.(items[real].value);
  };

  const handleScroll = () => {
    if (!interactive || drag.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, SETTLE_MS);
  };

  const select = (index: number) => {
    if (!interactive || index < 0 || index >= n || items[index].disabled) return;
    if (items[index].value !== value) onChange?.(items[index].value);
  };

  const step = (dir: 1 | -1) => {
    if (n === 0) return;
    let idx = selectedIndex < 0 ? (dir === 1 ? -1 : n) : selectedIndex;
    for (let k = 0; k < n; k += 1) {
      idx += dir;
      if (loop) idx = (idx + n) % n;
      if (idx < 0 || idx >= n) return;
      if (!items[idx].disabled) return select(idx);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => step(1),
      ArrowUp: () => step(-1),
      PageDown: () => step(1),
      PageUp: () => step(-1),
      Home: () => select(nearestEnabled(0)),
      End: () => select(nearestEnabled(n - 1)),
    };
    const fn = keys[e.key];
    if (fn && interactive) {
      e.preventDefault();
      fn();
    }
  };

  // Mouse drag (touch and trackpads already scroll natively).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return;
    drag.current = { y: e.clientY, top: ref.current.scrollTop, moved: false };
    ref.current.style.scrollSnapType = 'none';
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !ref.current) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 4) d.moved = true;
    ref.current.scrollTop = d.top - dy;
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d || !ref.current) return;
    ref.current.style.scrollSnapType = '';
    if (d.moved) {
      drag.current = null;
      settle();
      // swallow the click that follows a drag
      const swallow = (ev: Event) => ev.stopPropagation();
      ref.current.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => ref.current?.removeEventListener('click', swallow, true), 0);
    } else {
      drag.current = null;
    }
  };

  const total = n * copies;

  return (
    <Box
      className={className}
      sx={[
        { position: 'relative', height: rows * itemHeight, minWidth: 64, userSelect: 'none' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {highlight && (
        <Box
          aria-hidden
          className="AlarmTimeWheel-highlight"
          sx={(t) => ({
            position: 'absolute',
            left: 0,
            right: 0,
            top: pad,
            height: itemHeight,
            borderRadius: 'var(--alarm-wheel-radius, 999px)',
            bgcolor: `var(--alarm-wheel-highlight-color, ${alpha(t.palette.primary.main, 0.14)})`,
            pointerEvents: 'none',
          })}
        />
      )}
      <Box
        ref={ref}
        role="listbox"
        aria-label={props['aria-label']}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        tabIndex={interactive ? 0 : -1}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        sx={{
          position: 'relative',
          height: '100%',
          overflowY: interactive ? 'auto' : 'hidden',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          paddingBlock: `${pad}px`,
          outline: 'none',
          cursor: interactive ? 'grab' : 'default',
          touchAction: 'pan-y',
          WebkitMaskImage:
            'linear-gradient(transparent, #000 28%, #000 72%, transparent)',
          maskImage: 'linear-gradient(transparent, #000 28%, #000 72%, transparent)',
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', borderRadius: 3 },
        }}
      >
        {Array.from({ length: total }, (_, k) => {
          const idx = k % n;
          const item = items[idx];
          const primaryCopy = copies === 1 || (k >= n && k < 2 * n);
          const selected = idx === selectedIndex;
          return (
            <Box
              key={k}
              role="option"
              aria-selected={primaryCopy ? selected : undefined}
              aria-hidden={primaryCopy ? undefined : true}
              aria-disabled={item.disabled || undefined}
              onClick={() => select(idx)}
              sx={(t) => ({
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                scrollSnapStop: 'always',
                fontVariantNumeric: 'tabular-nums',
                fontSize: selected ? '1.9rem' : '1.35rem',
                fontWeight: selected ? 600 : 400,
                color: selected ? t.palette.text.primary : t.palette.text.secondary,
                opacity: item.disabled ? 0.3 : 1,
                transition: 'font-size 120ms, color 120ms',
              })}
            >
              {item.label ?? String(item.value)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
