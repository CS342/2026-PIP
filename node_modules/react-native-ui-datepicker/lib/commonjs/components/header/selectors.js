"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _calendarContext = require("../../calendar-context");
var _monthButton = _interopRequireDefault(require("./month-button"));
var _yearButton = _interopRequireDefault(require("./year-button"));
var _timeButton = require("./time-button");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const Selectors = ({
  position
}) => {
  const {
    mode,
    calendarView,
    timePicker
  } = (0, _calendarContext.useCalendarContext)();
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [defaultStyles.container,
    // eslint-disable-next-line react-native/no-inline-styles
    position === 'around' ? {
      justifyContent: 'space-evenly'
    } : {
      justifyContent: 'space-between',
      flexDirection: position === 'left' ? 'row-reverse' : 'row'
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: defaultStyles.monthAndYear
  }, calendarView !== 'year' ? /*#__PURE__*/_react.default.createElement(_monthButton.default, null) : null, /*#__PURE__*/_react.default.createElement(_yearButton.default, null)), timePicker && mode === 'single' && calendarView !== 'year' ? /*#__PURE__*/_react.default.createElement(_timeButton.TimeButton, null) : null);
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(Selectors);
const defaultStyles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  monthAndYear: {
    gap: 5,
    flexDirection: 'row',
    alignItems: 'center'
  }
});
//# sourceMappingURL=selectors.js.map