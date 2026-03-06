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
const Years = () => {
  const {
    mode,
    calendar = 'gregory',
    numerals = 'latn',
    currentDate,
    currentYear,
    date,
    onSelectYear,
    styles = {},
    classNames = {},
    components = {},
    containerHeight = _enums.CONTAINER_HEIGHT,
    minDate,
    maxDate,
    isRTL
  } = (0, _calendarContext.useCalendarContext)();
  const style = (0, _react.useMemo)(() => createDefaultStyles(containerHeight, isRTL), [containerHeight, isRTL]);
  const selectedYear = (0, _utils.getDateYear)(date);
  const generateCells = (0, _react.useCallback)(() => {
    const years = (0, _utils.getYearRange)(currentYear);
    const activeYear = (0, _utils.getDateYear)(currentDate);
    const column = years.map(year => {
      const isSelected = year === selectedYear;
      const isActivated = year === activeYear;
      const isDisabled = (0, _utils.isYearDisabled)(year, {
        minDate,
        maxDate
      });
      const containerStyle = _reactNative.StyleSheet.flatten([style.year, styles.year, isActivated && styles.active_year, isSelected && styles.selected_year, isDisabled && styles.disabled]);
      const textStyle = _reactNative.StyleSheet.flatten([styles.year_label, isActivated && styles.active_year_label, isSelected && styles.selected_year_label, isDisabled && styles.disabled_label]);
      const containerClassName = (0, _utils.cn)(classNames.year, isActivated && classNames.active_year, isSelected && classNames.selected_year, isDisabled && classNames.disabled);
      const textClassName = (0, _utils.cn)(classNames.year_label, isActivated && classNames.active_year_label, isSelected && classNames.selected_year_label, isDisabled && classNames.disabled_label);
      return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        key: year,
        style: style.yearCell
      }, components.Year ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
        disabled: isDisabled,
        onPress: () => onSelectYear(year),
        accessibilityRole: "button",
        accessibilityLabel: year.toString(),
        style: style.year
      }, components.Year({
        number: year,
        text: (0, _utils.formatNumber)(year, numerals),
        isSelected,
        isActivated
      })) : /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
        disabled: isDisabled,
        onPress: () => onSelectYear(year),
        accessibilityRole: "button",
        accessibilityLabel: year.toString(),
        style: containerStyle,
        className: containerClassName
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        key: year,
        style: textStyle,
        className: textClassName
      }, (0, _utils.formatNumber)(year, numerals))));
    });
    return column;
  }, [onSelectYear, selectedYear, currentYear, currentDate, styles, mode, classNames, components === null || components === void 0 ? void 0 : components.Year, minDate, maxDate, numerals, style.year, style.yearCell, calendar]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [style.container, styles.years],
    testID: "year-selector"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: style.years
  }, generateCells()));
};
const createDefaultStyles = (containerHeight, isRTL) => _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  years: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap'
  },
  year: {
    flex: 1,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  yearCell: {
    width: `${99.9 / 3}%`,
    height: containerHeight / 6
  }
});
var _default = exports.default = Years;
//# sourceMappingURL=years.js.map