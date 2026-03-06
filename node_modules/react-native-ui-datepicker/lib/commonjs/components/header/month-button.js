"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _dayjs = _interopRequireDefault(require("dayjs"));
var _reactNative = require("react-native");
var _calendarContext = require("../../calendar-context");
var _utils = require("../../utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const MonthButton = () => {
  const {
    currentDate,
    calendarView,
    setCalendarView,
    calendar = 'gregory',
    locale,
    styles,
    classNames,
    disableMonthPicker,
    monthCaptionFormat
  } = (0, _calendarContext.useCalendarContext)();
  const currentMonthText = (0, _dayjs.default)(currentDate).calendar(calendar).locale(calendar === 'jalali' && !(0, _utils.isValidJalaliLocale)(locale) ? 'en' : locale).format(monthCaptionFormat === 'full' ? 'MMMM' : 'MMM');
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    disabled: disableMonthPicker,
    onPress: () => setCalendarView(calendarView === 'month' ? 'day' : 'month'),
    testID: "btn-month",
    accessibilityRole: "button",
    accessibilityLabel: currentMonthText
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles === null || styles === void 0 ? void 0 : styles.month_selector,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.month_selector
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.month_selector_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.month_selector_label
  }, currentMonthText)));
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(MonthButton);
//# sourceMappingURL=month-button.js.map