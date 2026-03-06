"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YEAR_PAGE_SIZE = exports.VALID_JALALI_LOCALES = exports.JALALI_MONTHS = exports.DATE_FORMAT = exports.CALENDAR_FORMAT = void 0;
exports.areDatesOnSameDay = areDatesOnSameDay;
exports.cn = cn;
exports.dateToUnix = dateToUnix;
exports.formatNumber = formatNumber;
exports.getDateYear = exports.getDateMonth = exports.getDate = void 0;
exports.getDaysInMonth = getDaysInMonth;
exports.getEndOfDay = getEndOfDay;
exports.getFirstDayOfMonth = getFirstDayOfMonth;
exports.getParsedDate = exports.getMonthsArray = exports.getMonths = exports.getMonthName = exports.getMonthDays = exports.getJalaliMonths = exports.getFormatedDate = exports.getFormated = void 0;
exports.getStartOfDay = getStartOfDay;
exports.getYearRange = exports.getWeekdays = void 0;
exports.isDateBetween = isDateBetween;
exports.isDateDisabled = isDateDisabled;
exports.isMonthDisabled = isMonthDisabled;
exports.isValidJalaliLocale = void 0;
exports.isYearDisabled = isYearDisabled;
exports.removeTime = removeTime;
exports.useDeepCompareMemo = useDeepCompareMemo;
var _dayjs = _interopRequireDefault(require("dayjs"));
var _clsx = require("clsx");
var _tailwindMerge = require("tailwind-merge");
var _react = require("react");
var _lodash = require("lodash");
var _numerals = require("./numerals");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const CALENDAR_FORMAT = exports.CALENDAR_FORMAT = 'YYYY-MM-DD HH:mm';
const DATE_FORMAT = exports.DATE_FORMAT = 'YYYY-MM-DD';
const YEAR_PAGE_SIZE = exports.YEAR_PAGE_SIZE = 12;
const VALID_JALALI_LOCALES = exports.VALID_JALALI_LOCALES = new Set(['fa', 'en']);
const JALALI_MONTHS = exports.JALALI_MONTHS = {
  en: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
  fa: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
};
const isValidJalaliLocale = locale => VALID_JALALI_LOCALES.has(locale);
exports.isValidJalaliLocale = isValidJalaliLocale;
const getJalaliMonths = locale => JALALI_MONTHS[locale] || JALALI_MONTHS.en;
exports.getJalaliMonths = getJalaliMonths;
const getMonths = () => _dayjs.default.months();
exports.getMonths = getMonths;
const getMonthName = month => _dayjs.default.months()[month];

/**
 * Get months array
 *
 * @returns months array
 */
exports.getMonthName = getMonthName;
const getMonthsArray = ({
  calendar,
  locale
}) => {
  const monthNames = calendar === 'jalali' ? getJalaliMonths(locale) : _dayjs.default.months();
  const monthShortNames = calendar === 'jalali' ? getJalaliMonths(locale) : _dayjs.default.monthsShort();
  return monthNames.map((name, index) => ({
    index,
    name: {
      full: name,
      short: monthShortNames[index] || ''
    },
    isSelected: false
  }));
};

/**
 * Get weekdays
 *
 * @param locale - locale
 * @param firstDayOfWeek - first day of week
 * @param format - format short, min or full
 *
 * @returns weekdays
 */
exports.getMonthsArray = getMonthsArray;
const getWeekdays = (locale, firstDayOfWeek) => {
  _dayjs.default.locale(locale);
  const weekdayNames = _dayjs.default.weekdays();
  const weekdayShortNames = _dayjs.default.weekdaysShort();
  const weekdayMinNames = _dayjs.default.weekdaysMin();
  let weekdays = weekdayNames.map((name, index) => ({
    index,
    name: {
      full: name,
      short: weekdayShortNames[index] || '',
      min: weekdayMinNames[index] || ''
    }
  }));
  if (firstDayOfWeek > 0) {
    weekdays = [...weekdays.slice(firstDayOfWeek, weekdays.length), ...weekdays.slice(0, firstDayOfWeek)];
  }
  return weekdays;
};
exports.getWeekdays = getWeekdays;
const getFormated = date => (0, _dayjs.default)(date).format(CALENDAR_FORMAT);
exports.getFormated = getFormated;
const getDateMonth = date => (0, _dayjs.default)(date).month();
exports.getDateMonth = getDateMonth;
const getDateYear = date => (0, _dayjs.default)(date).year();

/**
 * Check if two dates are on the same day
 *
 * @param a - date to check
 * @param b - date to check
 *
 * @returns true if dates are on the same day, false otherwise
 */
exports.getDateYear = getDateYear;
function areDatesOnSameDay(a, b) {
  if (!a || !b) {
    return false;
  }
  const date_a = (0, _dayjs.default)(a).format(DATE_FORMAT);
  const date_b = (0, _dayjs.default)(b).format(DATE_FORMAT);
  return date_a === date_b;
}

/**
 * Check if date is between two dates
 *
 * @param date - date to check
 * @param options - options
 *
 * @returns true if date is between two dates, false otherwise
 */
function isDateBetween(date, {
  startDate,
  endDate
}) {
  if (!startDate || !endDate) {
    return false;
  }
  return (0, _dayjs.default)(date) <= endDate && (0, _dayjs.default)(date) >= startDate;
}

/**
 * Check if date is disabled
 *
 * @param date - date to check
 * @param options - options
 *
 * @returns true if date is disabled, false otherwise
 */
function isDateDisabled(date, {
  minDate,
  maxDate,
  enabledDates,
  disabledDates
}) {
  if (minDate && date.isBefore((0, _dayjs.default)(minDate).startOf('day'))) {
    return true;
  }
  if (maxDate && date.isAfter((0, _dayjs.default)(maxDate).endOf('day'))) {
    return true;
  }
  if (enabledDates) {
    if (Array.isArray(enabledDates)) {
      const isEnabled = enabledDates.some(enabledDate => areDatesOnSameDay(date, enabledDate));
      return !isEnabled;
    } else if (enabledDates instanceof Function) {
      return !enabledDates(date);
    }
  } else if (disabledDates) {
    if (Array.isArray(disabledDates)) {
      const isDisabled = disabledDates.some(disabledDate => areDatesOnSameDay(date, disabledDate));
      return isDisabled;
    } else if (disabledDates instanceof Function) {
      return disabledDates(date);
    }
  }
  return false;
}

/**
 * Check if year is disabled
 *
 * @param year - year to check
 * @param options - options
 *
 * @returns true if year is disabled, false otherwise
 */
function isYearDisabled(year, {
  minDate,
  maxDate
}) {
  if (minDate && year < getDateYear(minDate)) return true;
  if (maxDate && year > getDateYear(maxDate)) return true;
  return false;
}

/**
 * Check if month is disabled
 *
 * @param month - month to check
 * @param date - date to check
 * @param options - options
 *
 * @returns true if month is disabled, false otherwise
 */
function isMonthDisabled(month, date, {
  minDate,
  maxDate
}) {
  if (minDate && month < getDateMonth(minDate) && getDateYear(date) === getDateYear(minDate)) return true;
  if (maxDate && month > getDateMonth(maxDate) && getDateYear(date) === getDateYear(maxDate)) return true;
  return false;
}

/**
 * Get formated date
 *
 * @param date - date to get formated date from
 * @param format - format to get formated date from
 *
 * @returns formated date
 */
const getFormatedDate = (date, format) => (0, _dayjs.default)(date).format(format);

/**
 * Get date
 *
 * @param date - date to get
 *
 * @returns date
 */
exports.getFormatedDate = getFormatedDate;
const getDate = date => (0, _dayjs.default)(date);

/**
 * Get year range
 *
 * @param year - year to get year range from
 *
 * @returns year range
 */
exports.getDate = getDate;
const getYearRange = year => {
  const endYear = YEAR_PAGE_SIZE * Math.ceil(year / YEAR_PAGE_SIZE);
  let startYear = endYear === year ? endYear : endYear - YEAR_PAGE_SIZE;
  if (startYear < 0) {
    startYear = 0;
  }
  return Array.from({
    length: YEAR_PAGE_SIZE
  }, (_, i) => startYear + i);
};

/**
 * Get days in month
 *
 * @param date - date to get days in month from
 * @param showOutsideDays - whether to show outside days
 * @param firstDayOfWeek - first day of week, number 0-6, 0 – Sunday, 6 – Saturday
 *
 * @returns days in month
 */
exports.getYearRange = getYearRange;
function getDaysInMonth(date, showOutsideDays, firstDayOfWeek) {
  const daysInCurrentMonth = (0, _dayjs.default)(date).daysInMonth();
  const prevMonthDays = (0, _dayjs.default)(date).add(-1, 'month').daysInMonth();
  const firstDay = (0, _dayjs.default)(date).date(1 - firstDayOfWeek);
  const prevMonthOffset = firstDay.day() % 7;
  const daysInPrevMonth = showOutsideDays ? prevMonthOffset : 0;
  const monthDaysOffset = prevMonthOffset + daysInCurrentMonth;
  const daysInNextMonth = showOutsideDays ? monthDaysOffset > 35 ? 42 - monthDaysOffset : 35 - monthDaysOffset : 0;
  const fullDaysInMonth = daysInPrevMonth + daysInCurrentMonth + daysInNextMonth;
  return {
    prevMonthDays,
    prevMonthOffset,
    daysInCurrentMonth,
    daysInNextMonth,
    fullDaysInMonth
  };
}

/**
 * Get first day of month
 *
 * @param date - date to get first day of month from
 * @param firstDayOfWeek - first day of week, number 0-6, 0 – Sunday, 6 – Saturday
 *
 * @returns first day of month
 */
function getFirstDayOfMonth(date, firstDayOfWeek) {
  const d = getDate(date);
  return d.date(1 - firstDayOfWeek).day();
}

/**
 * Get start of day
 *
 * @param date - date to get start of day from
 *
 * @returns start of day
 */
function getStartOfDay(date) {
  return (0, _dayjs.default)(date).startOf('day');
}

/**
 * Get end of day
 *
 * @param date - date to get end of day from
 *
 * @returns end of day
 */
function getEndOfDay(date) {
  return (0, _dayjs.default)(date).endOf('day');
}

/**
 * Convert date to unix timestamp
 *
 * @param date - date to convert
 *
 * @returns unix timestamp
 */
function dateToUnix(date) {
  return (0, _dayjs.default)(date).unix();
}

/**
 * Remove time from date
 *
 * @param date - date to remove time from
 *
 * @returns date with time removed
 */
function removeTime(date, timeZone) {
  return date ? _dayjs.default.tz(date, timeZone).startOf('day') : undefined;
}

/**
 * Get detailed date object
 *
 * @param date Get detailed date object
 *
 * @returns parsed date object
 */
const getParsedDate = date => {
  return {
    year: (0, _dayjs.default)(date).year(),
    month: (0, _dayjs.default)(date).month(),
    hour: (0, _dayjs.default)(date).hour(),
    hour12: parseInt((0, _dayjs.default)(date).format('hh')),
    minute: (0, _dayjs.default)(date).minute(),
    period: (0, _dayjs.default)(date).format('A')
  };
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
exports.getParsedDate = getParsedDate;
const getMonthDays = (datetime, showOutsideDays, minDate, maxDate, firstDayOfWeek, enabledDates, disabledDates, prevMonthDays, prevMonthOffset, daysInCurrentMonth, daysInNextMonth, numerals) => {
  const date = (0, _dayjs.default)(datetime);
  const prevDays = showOutsideDays ? Array.from({
    length: prevMonthOffset
  }, (_, index) => {
    const number = index + (prevMonthDays - prevMonthOffset + 1);
    const thisDay = date.add(-1, 'month').date(number);
    return generateCalendarDay(number, thisDay, minDate, maxDate, enabledDates, disabledDates, false, index + 1, firstDayOfWeek, numerals);
  }) : Array(prevMonthOffset).fill(null);
  const currentDays = Array.from({
    length: daysInCurrentMonth
  }, (_, index) => {
    const day = index + 1;
    const thisDay = date.date(day);
    return generateCalendarDay(day, thisDay, minDate, maxDate, enabledDates, disabledDates, true, prevMonthOffset + day, firstDayOfWeek, numerals);
  });
  const nextDays = Array.from({
    length: daysInNextMonth
  }, (_, index) => {
    const day = index + 1;
    const thisDay = date.add(1, 'month').date(day);
    return generateCalendarDay(day, thisDay, minDate, maxDate, enabledDates, disabledDates, false, daysInCurrentMonth + prevMonthOffset + day, firstDayOfWeek, numerals);
  });
  return [...prevDays, ...currentDays, ...nextDays];
};

/**
 * Generate day object for displaying inside day cell
 *
 * @param number - number of day
 * @param date - calculated date based on day, month, and year
 * @param minDate - min selectable date
 * @param maxDate - max selectable date
 * @param enabledDates - array of enabled dates, or a function that returns true for a given date (takes precedence over disabledDates)
 * @param disabledDates - array of disabled dates, or a function that returns true for a given date
 * @param isCurrentMonth - define the day is in the current month
 * @param dayOfMonth - number the day in the current month
 * @param firstDayOfWeek - first day of week, number 0-6, 0 – Sunday, 6 – Saturday
 *
 * @returns days object based on current date
 */
exports.getMonthDays = getMonthDays;
const generateCalendarDay = (number, date, minDate, maxDate, enabledDates, disabledDates, isCurrentMonth, dayOfMonth, firstDayOfWeek, numerals) => {
  const startOfWeek = (0, _dayjs.default)(date).startOf('week').add(firstDayOfWeek, 'day');
  return {
    text: formatNumber(number, numerals),
    number,
    date: date,
    isDisabled: isDateDisabled(date, {
      minDate,
      maxDate,
      enabledDates,
      disabledDates
    }),
    isCurrentMonth,
    dayOfMonth,
    isStartOfWeek: date.isSame(startOfWeek, 'day'),
    isEndOfWeek: date.day() === (firstDayOfWeek + 6) % 7
  };
};
function cn(...inputs) {
  return (0, _tailwindMerge.twMerge)((0, _clsx.clsx)(inputs));
}

/**
 * Deep compare memo
 *
 * @param value - value to compare
 * @param deps - dependencies
 *
 * @returns memoized value
 */
function useDeepCompareMemo(value, deps) {
  const ref = (0, _react.useRef)();
  const depsRef = (0, _react.useRef)();
  if (!depsRef.current || !deps.every((dep, i) => (0, _lodash.isEqual)(dep, depsRef.current[i]))) {
    ref.current = value;
    depsRef.current = deps;
  }
  return ref.current;
}
function getDigitMap(numerals) {
  const digitMap = {};
  const numeralDigits = _numerals.numeralSystems[numerals];
  for (let i = 0; i < 10; i++) {
    digitMap[i.toString()] = numeralDigits[i];
  }
  return digitMap;
}
function replaceDigits(input, numerals) {
  const digitMap = getDigitMap(numerals);
  return input.replace(/\d/g, digit => digitMap[digit] || digit);
}
function formatNumber(value, numerals) {
  return replaceDigits(value.toString(), numerals);
}
//# sourceMappingURL=utils.js.map