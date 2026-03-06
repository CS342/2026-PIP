import { CalendarViews } from './enums';
import type { DateType, DatePickerBaseProps } from './types';
export interface CalendarContextType extends DatePickerBaseProps {
    locale: string;
    showOutsideDays: boolean;
    firstDayOfWeek: number;
    calendarView: CalendarViews;
    currentDate: DateType;
    currentYear: number;
    isRTL: boolean;
    setCalendarView: (value: CalendarViews) => void;
    onSelectDate: (date: DateType) => void;
    onSelectMonth: (month: number) => void;
    onSelectYear: (year: number) => void;
    onChangeMonth: (value: number) => void;
    onChangeYear: (value: number) => void;
}
export declare const CalendarContext: import("react").Context<CalendarContextType>;
export declare const useCalendarContext: () => CalendarContextType;
//# sourceMappingURL=calendar-context.d.ts.map