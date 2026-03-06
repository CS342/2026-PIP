"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _calendarContext = require("../../calendar-context");
var _utils = require("../../utils");
var _dayjs = _interopRequireDefault(require("dayjs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const YearButton = () => {
  const {
    currentDate,
    calendarView,
    setCalendarView,
    currentYear,
    onChangeYear,
    styles,
    classNames,
    disableYearPicker,
    calendar = 'gregory',
    numerals = 'latn'
  } = (0, _calendarContext.useCalendarContext)();
  const years = (0, _utils.getYearRange)(currentYear);
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    disabled: disableYearPicker,
    onPress: () => {
      setCalendarView(calendarView === 'year' ? 'day' : 'year');
      onChangeYear((0, _utils.getDateYear)(currentDate));
    },
    testID: "btn-year",
    accessibilityRole: "button",
    accessibilityLabel: (0, _dayjs.default)(currentDate).calendar(calendar).format('YYYY')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [defaultStyles.container, styles === null || styles === void 0 ? void 0 : styles.year_selector],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.year_selector
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.year_selector_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.year_selector_label
  }, calendarView === 'year' ? `${(0, _utils.formatNumber)(years[0] || 0, numerals)} - ${(0, _utils.formatNumber)(years[years.length - 1] || 0, numerals)}` : (0, _utils.formatNumber)(parseInt((0, _dayjs.default)(currentDate).calendar(calendar).format('YYYY')), numerals))));
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(YearButton);
const defaultStyles = _reactNative.StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
//# sourceMappingURL=year-button.js.map