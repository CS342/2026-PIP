"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _utils = require("../utils");
var _enums = require("../enums");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const Weekdays = ({
  locale,
  firstDayOfWeek,
  styles = {},
  classNames = {},
  weekdaysFormat = 'min',
  weekdaysHeight = _enums.WEEKDAYS_HEIGHT,
  components = {},
  isRTL
}) => {
  var _getWeekdays;
  const style = (0, _react.useMemo)(() => createDefaultStyles(weekdaysHeight, isRTL), [weekdaysHeight, isRTL]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [style.container, styles.weekdays],
    className: classNames.weekdays,
    testID: "weekdays"
  }, (_getWeekdays = (0, _utils.getWeekdays)(locale, firstDayOfWeek)) === null || _getWeekdays === void 0 ? void 0 : _getWeekdays.map((weekday, index) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: index,
    style: [style.weekday, styles.weekday],
    className: classNames.weekday
  }, components.Weekday ? components.Weekday(weekday) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.weekday_label,
    className: classNames.weekday_label
  }, weekday.name[weekdaysFormat]))));
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(Weekdays);
const createDefaultStyles = (weekdaysHeight, isRTL) => _reactNative.StyleSheet.create({
  container: {
    height: weekdaysHeight,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center'
  },
  weekday: {
    width: `${99.9 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
//# sourceMappingURL=weekdays.js.map