"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _calendarContext = require("../calendar-context");
var _wheel = _interopRequireDefault(require("./time-picker/wheel"));
var _enums = require("../enums");
var _utils = require("../utils");
var _dayjs = _interopRequireDefault(require("dayjs"));
var _periodPicker = _interopRequireDefault(require("./time-picker/period-picker"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const createNumberList = (num, numerals, startFrom = 0) => {
  return Array.from({
    length: num
  }, (_, i) => ({
    value: i + startFrom,
    text: i + startFrom < 10 ? `${(0, _utils.formatNumber)(0, numerals)}${(0, _utils.formatNumber)(i + startFrom, numerals)}` : `${(0, _utils.formatNumber)(i + startFrom, numerals)}`
  }));
};
const TimePicker = () => {
  const {
    currentDate,
    date,
    onSelectDate,
    styles,
    classNames,
    timeZone,
    numerals = 'latn',
    use12Hours
  } = (0, _calendarContext.useCalendarContext)();
  const hours = (0, _react.useMemo)(() => createNumberList(use12Hours ? 12 : 24, numerals, use12Hours ? 1 : 0), [numerals, use12Hours]);
  const minutes = (0, _react.useMemo)(() => createNumberList(60, numerals), [numerals]);
  const {
    hour,
    hour12,
    minute,
    period
  } = (0, _utils.getParsedDate)(date || currentDate);
  const handleChangeHour = (0, _react.useCallback)(value => {
    let hour24 = value;
    if (use12Hours) {
      if (period === 'PM' && value < 12) {
        hour24 = value + 12;
      } else if (period === 'PM' && value === 12) {
        hour24 = 0;
      }
    }
    const newDate = _dayjs.default.tz(date, timeZone).hour(hour24).minute(minute);
    onSelectDate(newDate);
  }, [date, onSelectDate, timeZone, use12Hours, period, minute]);
  const handleChangeMinute = (0, _react.useCallback)(value => {
    const newDate = _dayjs.default.tz(date, timeZone).minute(value);
    onSelectDate(newDate);
  }, [date, onSelectDate, timeZone]);
  const handlePeriodChange = (0, _react.useCallback)(newPeriod => {
    let newHour = hour12;
    if (newPeriod === 'PM' && hour12 < 12) {
      newHour = hour12 + 12;
    } else if (newPeriod === 'AM' && hour12 === 12) {
      newHour = 0;
    } else if (newPeriod === 'AM' && hour >= 12) {
      newHour = hour12;
    }
    const newDate = _dayjs.default.tz(date || currentDate, timeZone).hour(newHour);
    onSelectDate(newDate);
  }, [date, currentDate, onSelectDate, timeZone, hour, hour12]);
  const timePickerContainerStyle = (0, _react.useMemo)(() => ({
    ...defaultStyles.timePickerContainer,
    flexDirection: _reactNative.I18nManager.isRTL ? 'row-reverse' : 'row'
  }), [_reactNative.I18nManager.isRTL]);
  const timePickerTextStyle = (0, _react.useMemo)(() => ({
    ...defaultStyles.timeSeparator,
    ...(styles === null || styles === void 0 ? void 0 : styles.time_label)
  }), [styles === null || styles === void 0 ? void 0 : styles.time_label]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    horizontal: true,
    scrollEnabled: false,
    contentContainerStyle: defaultStyles.container,
    testID: "time-selector"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: timePickerContainerStyle
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: defaultStyles.wheelContainer
  }, /*#__PURE__*/_react.default.createElement(_wheel.default, {
    value: use12Hours ? hour12 : hour,
    items: hours,
    setValue: handleChangeHour,
    styles: styles,
    classNames: classNames
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: timePickerTextStyle,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_label
  }, ":"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: defaultStyles.wheelContainer
  }, /*#__PURE__*/_react.default.createElement(_wheel.default, {
    value: minute,
    items: minutes,
    setValue: handleChangeMinute,
    styles: styles,
    classNames: classNames
  }))), use12Hours && period ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: defaultStyles.periodContainer
  }, /*#__PURE__*/_react.default.createElement(_periodPicker.default, {
    value: period,
    setValue: handlePeriodChange,
    styles: styles,
    classNames: classNames
  })) : null);
};
const defaultStyles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wheelContainer: {
    flex: 1
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: _enums.CONTAINER_HEIGHT / 2,
    height: _enums.CONTAINER_HEIGHT / 2
  },
  timeSeparator: {
    marginHorizontal: 5
  },
  periodContainer: {
    marginLeft: 10
  }
});
var _default = exports.default = TimePicker;
//# sourceMappingURL=time-picker.js.map