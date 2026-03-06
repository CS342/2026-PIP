"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _calendarContext = require("../calendar-context");
var _utils = require("../utils");
var _enums = require("../enums");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const Months = () => {
  const {
    currentDate,
    onSelectMonth,
    styles = {},
    classNames = {},
    components = {},
    containerHeight = _enums.CONTAINER_HEIGHT,
    monthsFormat = 'full',
    minDate,
    maxDate,
    calendar = 'gregory',
    locale,
    isRTL
  } = (0, _calendarContext.useCalendarContext)();
  const style = (0, _react.useMemo)(() => createDefaultStyles(containerHeight, isRTL), [containerHeight, isRTL]);
  const {
    month
  } = (0, _utils.getParsedDate)(currentDate);
  const containerStyle = _reactNative.StyleSheet.flatten([style.container, styles === null || styles === void 0 ? void 0 : styles.months]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: containerStyle,
    testID: "month-selector"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: style.months
  }, (0, _utils.getMonthsArray)({
    calendar,
    locale
  }).map((item, index) => {
    const isSelected = index === month;
    const isDisabled = (0, _utils.isMonthDisabled)(index, currentDate, {
      minDate,
      maxDate
    });
    const itemStyle = _reactNative.StyleSheet.flatten([style.month, styles.month, isSelected && styles.selected_month, isDisabled && styles.disabled]);
    const textStyle = _reactNative.StyleSheet.flatten([styles.month_label, isSelected && styles.selected_month_label, isDisabled && styles.disabled_label]);
    const containerClassName = (0, _utils.cn)(classNames.month, isSelected && classNames.selected_month, isDisabled && classNames.disabled);
    const textClassName = (0, _utils.cn)(classNames.month_label, isSelected && classNames.selected_month_label, isDisabled && classNames.disabled_label);
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: index,
      style: style.monthCell
    }, components.Month ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      disabled: isDisabled,
      onPress: () => onSelectMonth(index),
      accessibilityRole: "button",
      accessibilityLabel: item.name.full,
      style: style.month
    }, components.Month({
      ...item,
      isSelected
    })) : /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      disabled: isDisabled,
      onPress: () => onSelectMonth(index),
      accessibilityRole: "button",
      accessibilityLabel: item.name.full,
      style: itemStyle,
      className: containerClassName
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      key: index,
      style: textStyle,
      className: textClassName
    }, item.name[monthsFormat])));
  })));
};
const createDefaultStyles = (containerHeight, isRTL) => _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  months: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap'
  },
  month: {
    flex: 1,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthCell: {
    width: `${99.9 / 3}%`,
    height: containerHeight / 6
  }
});
var _default = exports.default = Months;
//# sourceMappingURL=months.js.map