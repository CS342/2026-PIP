import type { DateType, DatePickerBaseProps, SingleChange, RangeChange, MultiChange } from './types';
export interface DatePickerSingleProps extends DatePickerBaseProps {
    mode: 'single';
    date?: DateType;
    onChange?: SingleChange;
}
export interface DatePickerRangeProps extends DatePickerBaseProps {
    mode: 'range';
    startDate?: DateType;
    endDate?: DateType;
    onChange?: RangeChange;
}
export interface DatePickerMultipleProps extends DatePickerBaseProps {
    mode: 'multiple';
    dates?: DateType[];
    onChange?: MultiChange;
}
declare const DateTimePicker: (props: DatePickerSingleProps | DatePickerRangeProps | DatePickerMultipleProps) => JSX.Element;
export default DateTimePicker;
//# sourceMappingURL=datetime-picker.d.ts.map