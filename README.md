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

Same props as the MUI components (`minTime`, `maxTime`, `shouldDisableTime`, `minutesStep`, `ampm`, `minDate`, ...).

## 3. Lower-level pieces

- `renderAlarmTimeView` / `renderAlarmDateTimeView`: pass via `viewRenderers`.
- `alarmTimePickerDefaults`, `alarmDateTimePickerDefaults`, `alarmDatePickerDefaults`: spreadable props.
- `TimeWheel`, `ScrollWheel`: standalone, no date library needed.

```tsx
<TimeWheel value={{ hours: 7, minutes: 30 }} onChange={setTime} ampm minutesStep={5} loop />
```

`TimeWheel` options: `ampm`, `minutesStep`, `loop`, `isTimeDisabled`, `padHours`, `separator`, `meridiemLabels`, `labels`, `visibleRows`, `itemHeight`, `disabled`, `readOnly`, `sx`.

## WeekdaySelector

```tsx
<WeekdaySelector value={days} onChange={setDays} />                 // M T W T F S S
<WeekdaySelector value={days} onChange={setDays} showEveryDay />    // + "Every day" toggle
```

Days use `Date#getDay()` numbers (0 = Sunday ... 6 = Saturday). Options: `weekStartsOn` (default 1), `multiple`, `allowEmpty`,
`showEveryDay`, `everyDayLabel`, `labelFormat` (`narrow|short|long`), `locale`, `labels`, `disabledDays`, `disabled`, `readOnly`, `size`, `spacing`, `color`, `sx`.
