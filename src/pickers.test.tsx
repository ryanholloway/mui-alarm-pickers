import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AlarmTimePicker, AlarmDateTimePicker, TimeWheel, WeekdaySelector, withAlarmPickers } from './index';

describe('WeekdaySelector', () => {
  it('shows M T W T F S S, Monday first, and toggles days', async () => {
    const onChange = vi.fn();
    render(<WeekdaySelector value={[1]} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(screen.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Friday' }));
    expect(onChange).toHaveBeenCalledWith([1, 5]);
  });

  it('supports weekStartsOn, single select and allowEmpty=false', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<WeekdaySelector value={[2]} onChange={onChange} weekStartsOn={0} multiple />);
    expect(screen.getAllByRole('button')[0]).toHaveAccessibleName('Sunday');
    rerender(<WeekdaySelector value={[2]} onChange={onChange} multiple={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Thursday' }));
    expect(onChange).toHaveBeenLastCalledWith([4]);
    rerender(<WeekdaySelector value={[2]} onChange={onChange} allowEmpty={false} />);
    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Tuesday' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('only shows the every-day toggle when asked, and it selects / clears all', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<WeekdaySelector value={[]} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Every day' })).toBeNull();
    rerender(<WeekdaySelector value={[]} onChange={onChange} showEveryDay />);
    await userEvent.click(screen.getByRole('button', { name: 'Every day' }));
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 3, 4, 5, 6, 0]);
    rerender(<WeekdaySelector value={[1, 2, 3, 4, 5, 6, 0]} onChange={onChange} showEveryDay />);
    await userEvent.click(screen.getByRole('button', { name: 'Every day' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe('TimeWheel', () => {
  it('emits hour / minute changes', () => {
    const onChange = vi.fn();
    render(<TimeWheel value={{ hours: 7, minutes: 30 }} onChange={onChange} />);
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getAllByRole('option', { name: '45' })[0]);
    expect(onChange).toHaveBeenLastCalledWith({ hours: 7, minutes: 45 });
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Hours' }), { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith({ hours: 8, minutes: 30 });
  });

  it('12h mode keeps AM/PM when changing hours and flips with the meridiem wheel', () => {
    const onChange = vi.fn();
    render(<TimeWheel ampm value={{ hours: 19, minutes: 0 }} onChange={onChange} />);
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Hours' })).getAllByRole('option', { name: '08' })[0]);
    expect(onChange).toHaveBeenLastCalledWith({ hours: 20, minutes: 0 });
    fireEvent.click(screen.getByRole('option', { name: 'AM' }));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 7, minutes: 0 });
  });

  it('does not emit for disabled options', () => {
    const onChange = vi.fn();
    render(
      <TimeWheel value={{ hours: 7, minutes: 0 }} onChange={onChange} isTimeDisabled={(c, u) => u === 'hours' && c.hours > 20} />,
    );
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Hours' })).getAllByRole('option', { name: '22' })[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('MUI X integration', () => {
  const wrap = (ui: React.ReactElement) => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={withAlarmPickers(createTheme())}>{ui}</ThemeProvider>
    </LocalizationProvider>
  );

  it('AlarmTimePicker renders wheels and writes back a dayjs value', () => {
    const onChange = vi.fn();
    render(wrap(<AlarmTimePicker open value={dayjs('2024-01-01T07:30')} onChange={onChange} />));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getAllByRole('option', { name: '45' })[0]);
    const next = onChange.mock.calls.at(-1)![0];
    expect(next.format('HH:mm')).toBe('07:45');
  });

  it('AlarmDateTimePicker shows calendar and wheels together and keeps date when time changes', () => {
    const onChange = vi.fn();
    render(wrap(<AlarmDateTimePicker open value={dayjs('2024-03-15T07:30')} onChange={onChange} />));
    expect(screen.getByRole('gridcell', { name: '15' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Hours' })).getAllByRole('option', { name: '09' })[0]);
    expect(onChange.mock.calls.at(-1)![0].format('YYYY-MM-DD HH:mm')).toBe('2024-03-15 09:30');
  });

  it('theme-level override applies to the stock MUI TimePicker', async () => {
    const { TimePicker } = await import('@mui/x-date-pickers/TimePicker');
    render(wrap(<TimePicker open value={dayjs('2024-01-01T07:30')} />));
    expect(screen.getByRole('listbox', { name: 'Hours' })).toBeInTheDocument();
  });
});
