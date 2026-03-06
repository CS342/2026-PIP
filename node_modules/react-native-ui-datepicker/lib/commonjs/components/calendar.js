"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _calendarContext = require("../calendar-context");
var _header = _interopRequireDefault(require("./header"));
var _years = _interopRequireDefault(require("./years"));
var _months = _interopRequireDefault(require("./months"));
var _days = _interopRequireDefault(require("./days"));
var _timePicker = _interopRequireDefault(require("./time-picker"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const CalendarView = {
  year: /*#__PURE__*/_react.default.createElement(_years.default, null),
  month: /*#__PURE__*/_react.default.createElement(_months.default, null),
  day: /*#__PURE__*/_react.default.createElement(_days.default, null),
  time: /*#__PURE__*/_react.default.createElement(_timePicker.default, null)
};
const Calendar = () => {
  const {
    hideHeader,
    calendarView,
    style = {},
    className = '',
    styles = {},
    classNames = {},
    containerHeight,
    navigationPosition,
    isRTL
  } = (0, _calendarContext.useCalendarContext)();
  const containerStyle = (0, _react.useMemo)(() => ({
    height: containerHeight
  }), [containerHeight]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: style,
    className: className,
    testID: "calendar"
  }, !hideHeader ? /*#__PURE__*/_react.default.createElement(_header.default, {
    navigationPosition: navigationPosition,
    styles: styles,
    classNames: classNames,
    isRTL: isRTL
  }) : null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: containerStyle
  }, CalendarView[calendarView]));
};
var _default = exports.default = Calendar;
//# sourceMappingURL=calendar.js.map