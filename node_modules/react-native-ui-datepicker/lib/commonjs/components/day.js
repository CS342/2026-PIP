"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.EmptyDay = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _enums = require("../enums");
var _utils = require("../utils");
var _lodash = require("lodash");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const EmptyDay = exports.EmptyDay = /*#__PURE__*/_react.default.memo(() => {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: defaultStyles.dayWrapper
  });
});
const Day = ({
  day,
  onSelectDate,
  containerHeight = _enums.CONTAINER_HEIGHT,
  weekdaysHeight = _enums.WEEKDAYS_HEIGHT,
  styles = {},
  classNames = {},
  components = {}
}) => {
  const style = (0, _react.useMemo)(() => createDefaultStyles(containerHeight, weekdaysHeight), [containerHeight, weekdaysHeight]);
  const {
    text,
    date,
    isDisabled,
    isCurrentMonth,
    isToday,
    isSelected,
    inRange,
    leftCrop,
    rightCrop,
    isStartOfWeek,
    isEndOfWeek,
    isCrop,
    inMiddle,
    rangeStart,
    rangeEnd
  } = day;
  const containerStyle = _reactNative.StyleSheet.flatten([defaultStyles.dayContainer, styles.day, isToday && styles.today, !isCurrentMonth && styles.outside, isSelected && styles.selected, isDisabled && styles.disabled, inMiddle && styles.range_middle, rangeStart && styles.range_start, rangeEnd && styles.range_end]);
  const textStyle = _reactNative.StyleSheet.flatten([styles.day_label, isToday && styles.today_label, !isCurrentMonth && styles.outside_label, isSelected && styles.selected_label, isDisabled && styles.disabled_label, inMiddle && styles.range_middle_label, rangeStart && styles.range_start_label, rangeEnd && styles.range_end_label]);
  const containerClassName = (0, _utils.cn)(classNames.day, isToday && classNames.today, !isCurrentMonth && classNames.outside, isSelected && classNames.selected, isDisabled && classNames.disabled, inMiddle && classNames.range_middle, rangeStart && classNames.range_start, rangeEnd && classNames.range_end);
  const textClassName = (0, _utils.cn)(classNames.day_label, isToday && classNames.today_label, !isCurrentMonth && classNames.outside_label, isSelected && classNames.selected_label, isDisabled && classNames.disabled_label, inMiddle && classNames.range_middle_label, rangeStart && classNames.range_start_label, rangeEnd && classNames.range_end_label);
  const RangeFill = (0, _react.useMemo)(() => {
    if (!inRange) return null;
    if (!isCrop) {
      return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: [defaultStyles.rangeRoot, styles.range_fill, isEndOfWeek && styles.range_fill_weekend, isStartOfWeek && styles.range_fill_weekstart],
        className: (0, _utils.cn)(classNames.range_fill, isEndOfWeek && classNames.range_fill_weekend, isStartOfWeek && classNames.range_fill_weekstart)
      });
    }
    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, leftCrop && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [defaultStyles.rangeRoot, defaultStyles.leftCrop, styles.range_fill],
      className: classNames.range_fill
    }), rightCrop && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [defaultStyles.rangeRoot, defaultStyles.rightCrop, styles.range_fill],
      className: classNames.range_fill
    }));
  }, [inRange, isCrop, leftCrop, rightCrop, defaultStyles.rangeRoot, styles.range_fill, styles.range_fill_weekstart, styles.range_fill_weekend, classNames.range_fill, classNames.range_fill_weekstart, classNames.range_fill_weekend]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: defaultStyles.dayWrapper
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [style.dayCell, styles.day_cell],
    className: classNames.day_cell
  }, RangeFill, components.Day ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    disabled: isDisabled,
    onPress: () => onSelectDate(date),
    accessibilityRole: "button",
    accessibilityLabel: text,
    style: containerStyle
  }, components.Day(day)) : /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    disabled: isDisabled,
    onPress: () => onSelectDate(date),
    accessibilityRole: "button",
    accessibilityLabel: text,
    style: containerStyle,
    className: containerClassName
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: textStyle,
    className: textClassName
  }, text))));
};
const defaultStyles = _reactNative.StyleSheet.create({
  dayWrapper: {
    width: `${99.9 / 7}%`
  },
  dayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rangeWrapper: {
    flex: 1
  },
  rangeRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  leftCrop: {
    left: '50%'
  },
  rightCrop: {
    right: '50%'
  }
});
const createDefaultStyles = (containerHeight, weekdaysHeight) => _reactNative.StyleSheet.create({
  dayCell: {
    minHeight: (containerHeight - weekdaysHeight) / 6
  }
});
const customComparator = (prev, next) => {
  const areEqual = (0, _lodash.isEqual)(prev.day, next.day) && prev.onSelectDate === next.onSelectDate && prev.containerHeight === next.containerHeight && (0, _lodash.isEqual)(prev.styles, next.styles) && (0, _lodash.isEqual)(prev.classNames, next.classNames) && (0, _lodash.isEqual)(prev.components, next.components);
  return areEqual;
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(Day, customComparator);
//# sourceMappingURL=day.js.map