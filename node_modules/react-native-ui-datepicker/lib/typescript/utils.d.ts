import dayjs from 'dayjs';
import type { DateType, CalendarDay, CalendarMonth, CalendarWeek, Numerals, CalendarType } from './types';
import { type ClassValue } from 'clsx';
export declare const CALENDAR_FORMAT = "YYYY-MM-DD HH:mm";
export declare const DATE_FORMAT = "YYYY-MM-DD";
export declare const YEAR_PAGE_SIZE = 12;
export declare const VALID_JALALI_LOCALES: Set<string>;
export declare const JALALI_MONTHS: {
    en: string[];
    fa: string[];
};
export declare const isValidJalaliLocale: (locale: string) => boolean;
export declare const getJalaliMonths: (locale: string) => string[];
export declare const getMonths: () => dayjs.MonthNames;
export declare const getMonthName: (month: number) => string | undefined;
/**
 * Get months array
 *
 * @returns months array
 */
export declare const getMonthsArray: ({ calendar, locale, }: {
    calendar: CalendarType;
    locale: string;
}) => CalendarMonth[];
/**
 * Get weekdays
 *
 * @param locale - locale
 * @param firstDayOfWeek - first day of week
 * @param format - format short, min or full
 *
 * @returns weekdays
 */
export declare const getWeekdays: (locale: string, firstDayOfWeek: number) => CalendarWeek[];
export declare const getFormated: (date: DateType) => string;
export declare const getDateMonth: (date: DateType) => number;
export declare const getDateYear: (date: DateType) => number;
/**
 * Check if two dates are on the same day
 *
 * @param a - date to check
 * @param b - date to check
 *
 * @returns true if dates are on the same day, false otherwise
 */
export declare function areDatesOnSameDay(a: DateType, b: DateType): boolean;
/**
 * Check if date is between two dates
 *
 * @param date - date to check
 * @param options - options
 *
 * @returns true if date is between two dates, false otherwise
 */
export declare function isDateBetween(date: DateType, { startDate, endDate, }: {
    startDate?: DateType;
    endDate?: DateType;
}): boolean;
/**
 * Check if date is disabled
 *
 * @param date - date to check
 * @param options - options
 *
 * @returns true if date is disabled, false otherwise
 */
export declare function isDateDisabled(date: dayjs.Dayjs, { minDate, maxDate, enabledDates, disabledDates, }: {
    minDate?: DateType;
    maxDate?: DateType;
    enabledDates?: DateType[] | ((date: DateType) => boolean) | undefined;
    disabledDates?: DateType[] | ((date: DateType) => boolean) | undefined;
}): boolean;
/**
 * Check if year is disabled
 *
 * @param year - year to check
 * @param options - options
 *
 * @returns true if year is disabled, false otherwise
 */
export declare function isYearDisabled(year: number, { minDate, maxDate, }: {
    minDate?: DateType;
    maxDate?: DateType;
}): boolean;
/**
 * Check if month is disabled
 *
 * @param month - month to check
 * @param date - date to check
 * @param options - options
 *
 * @returns true if month is disabled, false otherwise
 */
export declare function isMonthDisabled(month: number, date: DateType, { minDate, maxDate, }: {
    minDate?: DateType;
    maxDate?: DateType;
}): boolean;
/**
 * Get formated date
 *
 * @param date - date to get formated date from
 * @param format - format to get formated date from
 *
 * @returns formated date
 */
export declare const getFormatedDate: (date: DateType, format: string) => string;
/**
 * Get date
 *
 * @param date - date to get
 *
 * @returns date
 */
export declare const getDate: (date: DateType) => dayjs.Dayjs;
/**
 * Get year range
 *
 * @param year - year to get year range from
 *
 * @returns year range
 */
export declare const getYearRange: (year: number) => number[];
/**
 * Get days in month
 *
 * @param date - date to get days in month from
 * @param showOutsideDays - whether to show outside days
 * @param firstDayOfWeek - first day of week, number 0-6, 0 – Sunday, 6 – Saturday
 *
 * @returns days in month
 */
export declare function getDaysInMonth(date: DateType, showOutsideDays: boolean | undefined, firstDayOfWeek: number): {
    prevMonthDays: number;
    prevMonthOffset: number;
    daysInCurrentMonth: number;
    daysInNextMonth: number;
    fullDaysInMonth: number;
};
/**
 * Get first day of month
 *
 * @param date - date to get first day of month from
 * @param firstDayOfWeek - first day of week, number 0-6, 0 – Sunday, 6 – Saturday
 *
 * @returns first day of month
 */
export declare function getFirstDayOfMonth(date: DateType, firstDayOfWeek: number): number;
/**
 * Get start of day
 *
 * @param date - date to get start of day from
 *
 * @returns start of day
 */
export declare function getStartOfDay(date: DateType): DateType;
/**
 * Get end of day
 *
 * @param date - date to get end of day from
 *
 * @returns end of day
 */
export declare function getEndOfDay(date: DateType): DateType;
/**
 * Convert date to unix timestamp
 *
 * @param date - date to convert
 *
 * @returns unix timestamp
 */
export declare function dateToUnix(date: DateType): number;
/**
 * Remove time from date
 *
 * @param date - date to remove time from
 *
 * @returns date with time removed
 */
export declare function removeTime(date: DateType, timeZone: string | undefined): DateType;
/**
 * Get detailed date object
 *
 * @param date Get detailed date object
 *
 * @returns parsed date object
 */
export declare const getParsedDate: (date: DateType) => {
    year: number;
    month: number;
    hour: number;
    hour12: number;
    minute: number;
    period: string;
};
/**
 * Calculate month days array based on current date
 *
 * @param datetime - The current date that selected
 * @param showOutsideDays
 * @param minDate - min selectable date
 * @param maxDate - max selectable date
 * @param firstDayOfWeek - first day of week, number 0-6, 0 – Sunday, 6 – Saturday
 * @param enabledDates - array of enabled dates, or a function that returns true for a given date (takes precedence over disabledDates)
 * @param disabledDates - array of disabled dates, or a function that returns true for a given date
 * @param prevMonthDays - number of days in the previous month
 * @param prevMonthOffset - number of days to offset the previous month
 * @param daysInCurrentMonth - number of days in the current month
 * @param daysInNextMonth - number of days in the next month
 *
 * @returns days array based on current date
 */
export declare const getMonthDays: (datetime: DateType, showOutsideDays: boolean, minDate: DateType, maxDate: DateType, firstDayOfWeek: number, enabledDates: DateType[] | ((date: DateType) => boolean) | undefined, disabledDates: DateType[] | ((date: DateType) => boolean) | undefined, prevMonthDays: number, prevMonthOffset: number, daysInCurrentMonth: number, daysInNextMonth: number, numerals: Numerals) => CalendarDay[];
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Deep compare memo
 *
 * @param value - value to compare
 * @param deps - dependencies
 *
 * @returns memoized value
 */
export declare function useDeepCompareMemo<T>(value: T, deps: any[]): T;
export declare function formatNumber(value: number, numerals: Numerals): string;
//# sourceMappingURL=utils.d.ts.map