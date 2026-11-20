# mui-alarm-pickers

OnePlus-alarm-style pickers for MUI X: scroll-wheel time, calendar + wheels date-time, calendar date, and a weekday selector.
Built on the stock MUI X pickers (fields, validation, localization, adapters all keep working).
Tested against MUI X 9 / MUI 9 / React 19 with the dayjs adapter.

```bash
yarn add mui-alarm-pickers
# peers: react, @mui/material, @mui/x-date-pickers, @emotion/react, @emotion/styled
```

## 1. Override every picker through the theme

```tsx
import { createTheme } from '@mui/material/styles';
import { withAlarmPickers } from 'mui-alarm-pickers';

const theme = withAlarmPickers(createTheme());
// or: createTheme({ components: { ...alarmPickersComponents } })
```

Your existing `<TimePicker />`, `<DateTimePicker />`, `<DatePicker />` (and Desktop/Mobile variants) now use the new UI.
Theme `defaultProps` are shallow: passing your own `slotProps` replaces the defaults (hidden toolbar, Cancel/OK).

## 2. Or use the drop-in components (slotProps are merged)

```tsx
import { AlarmTimePicker, AlarmDateTimePicker, AlarmDatePicker } from 'mui-alarm-pickers';
<AlarmTimePicker label="Wake up" value={v} onChange={setV} ampm />
```

| Component | UI |
|---|---|
| `AlarmTimePicker` | hour + minute wheels (+ AM/PM wheel when `ampm`) |
| `AlarmDateTimePicker` | calendar on top, wheels below |
| `AlarmDatePicker` | calendar only |

### Tabbed date-time

```tsx
<AlarmDateTimePicker tabbed label="Alarm" />
```

`tabbed` swaps the stacked calendar + wheels for **Date** and **Time** tabs: picking a day moves straight to the Time tab (you can tab back).
It is off by default. With the theme override (section 1) or hand-wired props, use `alarmTabbedDateTimePickerDefaults` or
`viewRenderers={{ day: renderAlarmTabbedDateTimeView, hours: () => null, minutes: () => null }}`.

Same props as the MUI components (`minTime`, `maxTime`, `shouldDisableTime`, `minutesStep`, `ampm`, `minDate`, ...).

## 3. Lower-level pieces

- `renderAlarmTimeView` / `renderAlarmDateTimeView`: pass via `viewRenderers`.
- `alarmTimePickerDefaults`, `alarmDateTimePickerDefaults`, `alarmDatePickerDefaults`: spreadable props.
- `TimeWheel`, `ScrollWheel`: standalone, no date library needed.

```tsx
<TimeWheel value={{ hours: 7, minutes: 30 }} onChange={setTime} ampm minutesStep={5} loop />
```

`TimeWheel` options: `ampm`, `minutesStep`, `loop`, `isTimeDisabled`, `padHours`, `separator`, `meridiemLabels`, `labels`, `visibleRows`, `itemHeight`, `disabled`, `readOnly`, `sx`.

### Restyling the selection band

The highlighted row defaults to a fully rounded pill with 16px of padding around the numbers. Override it from your app:

```css
/* anywhere above the wheels: global CSS, a theme styleOverride, a wrapper's sx */
:root {
  --alarm-wheel-radius: 12px;                 /* band corner radius */
  --alarm-wheel-inset: 24px;                  /* horizontal padding around the numbers */
  --alarm-wheel-highlight-color: #ffd54f66;   /* band colour */
}
/* or target it directly */
.AlarmTimeWheel-highlight { border: 2px solid currentColor; }
```

`TimeWheel` also takes `highlightSx`. On `AlarmTimePicker` / `AlarmDateTimePicker`, pass any `TimeWheel` prop through `wheelProps`:
`<AlarmTimePicker wheelProps={{ highlightSx: { borderRadius: 2 } }} />`.

## Text & localization

| Text | How to change it |
|---|---|
| Digits, AM/PM | `locale` on `TimeWheel` (Intl). In the pickers it follows `LocalizationProvider adapterLocale` automatically |
| AM/PM override, separator | `meridiemLabels={{ am, pm }}`, `separator`, `padHours` |
| Wheel aria-labels | `labels={{ hours, minutes, meridiem }}` (via `wheelProps` in the pickers) |
| Date / Time tabs | `tabLabels={{ date, time }}` on `AlarmDateTimePicker` |
| Weekday chips | `locale` + `labelFormat` (Intl), or `labels`; `everyDayLabel`, `aria-label` |
| Cancel / OK, field and calendar text | stock MUI X: `LocalizationProvider localeText={...}` and the adapter locale |

```tsx
<AlarmDateTimePicker tabbed tabLabels={{ date: 'Datum', time: 'Zeit' }} wheelProps={{ labels: { hours: 'Stunden', minutes: 'Minuten' } }} />
```

## WeekdaySelector

```tsx
<WeekdaySelector value={days} onChange={setDays} />                 // M T W T F S S
<WeekdaySelector value={days} onChange={setDays} showEveryDay />    // + "Every day" toggle
```

Days use `Date#getDay()` numbers (0 = Sunday ... 6 = Saturday). Options: `weekStartsOn` (default 1), `multiple`, `allowEmpty`,
`showEveryDay`, `everyDayLabel`, `labelFormat` (`narrow|short|long`), `locale`, `labels`, `disabledDays`, `disabled`, `readOnly`, `size`, `spacing`, `color`, `sx`.
