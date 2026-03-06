"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeButton = void 0;
var _react = _interopRequireWildcard(require("react"));
var _dayjs = _interopRequireDefault(require("dayjs"));
var _reactNative = require("react-native");
var _calendarContext = require("../../calendar-context");
var _utils = require("../../utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const TimeButton = () => {
  const {
    currentDate,
    date,
    calendarView,
    setCalendarView,
    styles,
    classNames,
    numerals = 'latn',
    use12Hours
  } = (0, _calendarContext.useCalendarContext)();
  const {
    hour,
    hour12,
    minute,
    period
  } = (0, _react.useMemo)(() => (0, _utils.getParsedDate)(date || currentDate), [date, currentDate]);
  const labelText = (0, _react.useMemo)(() => {
    const hourValue = use12Hours ? hour12 : hour;
    const hourLabel = hourValue < 10 ? `${(0, _utils.formatNumber)(0, numerals)}${(0, _utils.formatNumber)(hourValue, numerals)}` : `${(0, _utils.formatNumber)(hourValue, numerals)}`;
    const minuteLabel = minute < 10 ? `${(0, _utils.formatNumber)(0, numerals)}${(0, _utils.formatNumber)(minute, numerals)}` : `${(0, _utils.formatNumber)(minute, numerals)}`;
    return `${hourLabel}:${minuteLabel} ${use12Hours ? period : ''}`.trim();
  }, [numerals, hour, hour12, minute, use12Hours, period]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => setCalendarView(calendarView === 'time' ? 'day' : 'time'),
    accessibilityRole: "button",
    accessibilityLabel: (0, _dayjs.default)(date || currentDate).format('HH:mm')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles === null || styles === void 0 ? void 0 : styles.time_selector,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_selector
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.time_selector_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_selector_label
  }, labelText)));
};
exports.TimeButton = TimeButton;
//# sourceMappingURL=time-button.js.map