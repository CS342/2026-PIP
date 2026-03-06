"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _dayjs = _interopRequireDefault(require("dayjs"));
var _calendarContext = require("../calendar-context");
var _day = _interopRequireWildcard(require("./day"));
var _utils = require("../utils");
var _weekdays = _interopRequireDefault(require("./weekdays"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const Days = () => {
  const {
    mode,
    calendar,
    locale,
    numerals = 'latn',
    timeZone,
    date,
    startDate,
    endDate,
    dates,
    currentDate,
    onSelectDate,
    showOutsideDays,
    minDate,
    maxDate,
    enabledDates,
    disabledDates,
    firstDayOfWeek,
    containerHeight,
    weekdaysHeight,
    styles,
    classNames,
    weekdaysFormat,
    multiRangeMode,
    hideWeekdays,
    components,
    isRTL
  } = (0, _calendarContext.useCalendarContext)();
  const style = (0, _react.useMemo)(() => createDefaultStyles(isRTL), [isRTL]);
  const {
    year,
    month,
    hour,
    minute
  } = (0, _utils.getParsedDate)(currentDate);
  const handleSelectDate = (0, _react.useCallback)(selectedDate => {
    const newDate = (0, _utils.getDate)(selectedDate).hour(hour).minute(minute);
    onSelectDate(newDate);
  }, [onSelectDate, hour, minute]);
  const containerStyle = (0, _react.useMemo)(() => [style.daysContainer, styles === null || styles === void 0 ? void 0 : styles.days], [style.daysContainer, styles === null || styles === void 0 ? void 0 : styles.days]);
  const daysGrid = (0, _react.useMemo)(() => {
    const today = (0, _dayjs.default)().tz(timeZone);
    _dayjs.default.tz.setDefault(timeZone);
    const {
      fullDaysInMonth,
      prevMonthDays,
      prevMonthOffset,
      daysInCurrentMonth,
      daysInNextMonth
    } = (0, _utils.getDaysInMonth)(currentDate, showOutsideDays, firstDayOfWeek);
    return (0, _utils.getMonthDays)(currentDate, showOutsideDays, minDate, maxDate, firstDayOfWeek, enabledDates, disabledDates, prevMonthDays, prevMonthOffset, daysInCurrentMonth, daysInNextMonth, numerals).map((day, index) => {
      if (!day) return null;
      let leftCrop = day.dayOfMonth === 1;
      let rightCrop = day.dayOfMonth === fullDaysInMonth;
      const isFirstDayOfMonth = day.dayOfMonth === 1;
      const isLastDayOfMonth = day.dayOfMonth === fullDaysInMonth;
      const isToday = (0, _utils.areDatesOnSameDay)(day.date, today);
      let inRange = false;
      let isSelected = false;
      let isCrop = false;
      let inMiddle = false;
      let rangeStart = false;
      let rangeEnd = false;
      if (mode === 'range') {
        rightCrop = false;
        const selectedStartDay = (0, _utils.areDatesOnSameDay)(day.date, startDate);
        const selectedEndDay = (0, _utils.areDatesOnSameDay)(day.date, endDate);
        isSelected = selectedStartDay || selectedEndDay;
        inRange = (0, _utils.isDateBetween)(day.date, {
          startDate,
          endDate
        });
        if (selectedStartDay) leftCrop = true;
        if (selectedEndDay) rightCrop = true;
        if (index % 7 === 0 && !selectedStartDay) leftCrop = false;
        if (index % 7 === 6 && !selectedEndDay) rightCrop = false;
        if (isFirstDayOfMonth && selectedEndDay || isLastDayOfMonth && selectedStartDay || (0, _dayjs.default)(startDate).format('DDMMYYYY') === (0, _dayjs.default)(endDate).format('DDMMYYYY')) {
          inRange = false;
        }
        isCrop = inRange && (leftCrop || rightCrop) && !(leftCrop && rightCrop);
        inMiddle = inRange && !leftCrop && !rightCrop;
        rangeStart = inRange && leftCrop;
        rangeEnd = inRange && rightCrop;
      } else if (mode === 'multiple') {
        const safeDates = dates || [];
        isSelected = safeDates.some(d => (0, _utils.areDatesOnSameDay)(day.date, d));

        // if the selected days in a row, implements range mode style to selected days
        if (multiRangeMode) {
          const yesterday = (0, _dayjs.default)(day.date).subtract(1, 'day');
          const tomorrow = (0, _dayjs.default)(day.date).add(1, 'day');
          const yesterdaySelected = safeDates.some(d => (0, _utils.areDatesOnSameDay)(d, yesterday));
          const tomorrowSelected = safeDates.some(d => (0, _utils.areDatesOnSameDay)(d, tomorrow));

          // Reset all flags
          inRange = false;
          leftCrop = false;
          rightCrop = false;
          if (isSelected) {
            // Case: both adjacent days are selected - this is a middle day
            if (yesterdaySelected && tomorrowSelected) {
              inRange = true;
            }
            // Case: only tomorrow is selected - this is the start of a range
            else if (tomorrowSelected) {
              inRange = true;
              leftCrop = true;
            }
            // Case: only yesterday is selected - this is the end of a range
            else if (yesterdaySelected) {
              inRange = true;
              rightCrop = true;
            }

            // Handle edge cases for first and last days of month
            // Only apply these special cases when the day is actually part of a range
            if (inRange) {
              if (isFirstDayOfMonth && !tomorrowSelected) {
                inRange = false;
              }
              if (isLastDayOfMonth && !yesterdaySelected) {
                inRange = false;
              }
            }
          }
          // Set derived flags based on the core flags
          isCrop = inRange && (leftCrop || rightCrop);
          inMiddle = inRange && !leftCrop && !rightCrop;
          rangeStart = inRange && leftCrop;
          rangeEnd = inRange && rightCrop;
        }
      } else if (mode === 'single') {
        isSelected = (0, _utils.areDatesOnSameDay)(day.date, date);
      }
      return {
        ...day,
        isToday,
        isSelected,
        inRange,
        leftCrop,
        rightCrop,
        isCrop,
        inMiddle,
        rangeStart,
        rangeEnd
      };
    });
  }, [mode, calendar, numerals, timeZone, month, year, showOutsideDays, firstDayOfWeek, minDate, maxDate, enabledDates, disabledDates, date, startDate, endDate, dates, multiRangeMode, currentDate]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: style.container,
    testID: "day-selector"
  }, !hideWeekdays ? /*#__PURE__*/_react.default.createElement(_weekdays.default, {
    locale: locale,
    firstDayOfWeek: firstDayOfWeek,
    styles: styles,
    classNames: classNames,
    weekdaysFormat: weekdaysFormat,
    weekdaysHeight: weekdaysHeight,
    components: components,
    isRTL: isRTL
  }) : null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: containerStyle,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.days,
    testID: "days"
  }, daysGrid === null || daysGrid === void 0 ? void 0 : daysGrid.map((day, index) => {
    return day ? /*#__PURE__*/_react.default.createElement(_day.default, {
      key: index,
      day: day,
      onSelectDate: handleSelectDate,
      containerHeight: containerHeight,
      weekdaysHeight: weekdaysHeight,
      styles: styles,
      classNames: classNames,
      components: components
    }) : /*#__PURE__*/_react.default.createElement(_day.EmptyDay, {
      key: index
    });
  })));
};
const createDefaultStyles = isRTL => _reactNative.StyleSheet.create({
  container: {
    width: '100%',
    height: '100%'
  },
  daysContainer: {
    width: '100%',
    height: '100%',
    flexWrap: 'wrap',
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignContent: 'flex-start'
  }
});
var _default = exports.default = Days;
//# sourceMappingURL=days.js.map