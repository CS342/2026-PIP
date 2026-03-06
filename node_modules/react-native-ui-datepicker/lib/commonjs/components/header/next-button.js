"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _calendarContext = require("../../calendar-context");
var _utils = require("../../utils");
var _lodash = require("lodash");
var _theme = require("../../theme");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const arrow_right = require('../../assets/images/arrow_right.png');
const NextButton = ({
  style,
  imageStyle,
  className,
  imageClassName
}) => {
  const {
    currentYear,
    onChangeMonth,
    onChangeYear,
    calendarView,
    components = {},
    isRTL
  } = (0, _calendarContext.useCalendarContext)();
  const colorScheme = (0, _reactNative.useColorScheme)();
  const theme = colorScheme ?? 'light';
  const defaultStyles = (0, _react.useMemo)(() => createDefaultStyles(isRTL), [isRTL]);
  const onPress = (0, _react.useCallback)(() => {
    switch (calendarView) {
      case 'day':
        return onChangeMonth(1);
      case 'month':
        return onChangeYear(currentYear + 1);
      case 'year':
        return onChangeYear(currentYear + _utils.YEAR_PAGE_SIZE);
      default:
        return {};
    }
  }, [calendarView, currentYear, onChangeMonth, onChangeYear]);
  const iconStyle = (0, _react.useMemo)(() => ({
    ...defaultStyles.icon,
    tintColor: _theme.COLORS[theme].foreground,
    ...imageStyle
  }), [imageStyle, theme, defaultStyles.icon]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    disabled: calendarView === 'time',
    onPress: onPress,
    testID: "btn-next",
    accessibilityRole: "button",
    accessibilityLabel: "Next"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [defaultStyles.iconContainer, defaultStyles.next, style],
    className: className
  }, components.IconNext || /*#__PURE__*/_react.default.createElement(_reactNative.Image, {
    source: arrow_right,
    style: iconStyle,
    className: imageClassName
  })));
};
const customComparator = (prev, next) => {
  const areEqual = prev.className === next.className && (0, _lodash.isEqual)(prev.style, next.style) && (0, _lodash.isEqual)(prev.imageStyle, next.imageStyle) && (0, _lodash.isEqual)(prev.imageClassName, next.imageClassName);
  return areEqual;
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(NextButton, customComparator);
const createDefaultStyles = isRTL => _reactNative.StyleSheet.create({
  iconContainer: {
    padding: 4
  },
  next: {
    marginLeft: isRTL ? 0 : 3,
    marginRight: isRTL ? 3 : 0
  },
  icon: {
    width: 14,
    height: 14,
    transform: [{
      rotate: isRTL ? '180deg' : '0deg'
    }]
  }
});
//# sourceMappingURL=next-button.js.map