import * as hooks from '@mui/x-date-pickers/hooks';
import * as internals from '@mui/x-date-pickers/internals';
import type { MuiPickersAdapter } from '@mui/x-date-pickers/models';

/**
 * Returns the date adapter of the surrounding LocalizationProvider.
 * `usePickerAdapter` is the public hook in recent MUI X; older versions only expose `useUtils`.
 */
export function useAdapter(): MuiPickersAdapter<any> {
  const h = hooks as any;
  const i = internals as any;
  const hook = h.usePickerAdapter ?? i.usePickerAdapter ?? i.useUtils;
  return hook();
}
