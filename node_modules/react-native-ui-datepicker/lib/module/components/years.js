import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useCalendarContext } from '../calendar-context';
import { cn, formatNumber, getDateYear, getYearRange, isYearDisabled } from '../utils';
import { CONTAINER_HEIGHT } from '../enums';
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
    containerHeight = CONTAINER_HEIGHT,
    minDate,
    maxDate,
    isRTL
  } = useCalendarContext();
  const style = useMemo(() => createDefaultStyles(containerHeight, isRTL), [containerHeight, isRTL]);
  const selectedYear = getDateYear(date);
  const generateCells = useCallback(() => {
    const years = getYearRange(currentYear);
    const activeYear = getDateYear(currentDate);
    const column = years.map(year => {
      const isSelected = year === selectedYear;
      const isActivated = year === activeYear;
      const isDisabled = isYearDisabled(year, {
        minDate,
        maxDate
      });
      const containerStyle = StyleSheet.flatten([style.year, styles.year, isActivated && styles.active_year, isSelected && styles.selected_year, isDisabled && styles.disabled]);
      const textStyle = StyleSheet.flatten([styles.year_label, isActivated && styles.active_year_label, isSelected && styles.selected_year_label, isDisabled && styles.disabled_label]);
      const containerClassName = cn(classNames.year, isActivated && classNames.active_year, isSelected && classNames.selected_year, isDisabled && classNames.disabled);
      const textClassName = cn(classNames.year_label, isActivated && classNames.active_year_label, isSelected && classNames.selected_year_label, isDisabled && classNames.disabled_label);
      return /*#__PURE__*/React.createElement(View, {
        key: year,
        style: style.yearCell
      }, components.Year ? /*#__PURE__*/React.createElement(Pressable, {
        disabled: isDisabled,
        onPress: () => onSelectYear(year),
        accessibilityRole: "button",
        accessibilityLabel: year.toString(),
        style: style.year
      }, components.Year({
        number: year,
        text: formatNumber(year, numerals),
        isSelected,
        isActivated
      })) : /*#__PURE__*/React.createElement(Pressable, {
        disabled: isDisabled,
        onPress: () => onSelectYear(year),
        accessibilityRole: "button",
        accessibilityLabel: year.toString(),
        style: containerStyle,
        className: containerClassName
      }, /*#__PURE__*/React.createElement(Text, {
        key: year,
        style: textStyle,
        className: textClassName
      }, formatNumber(year, numerals))));
    });
    return column;
  }, [onSelectYear, selectedYear, currentYear, currentDate, styles, mode, classNames, components === null || components === void 0 ? void 0 : components.Year, minDate, maxDate, numerals, style.year, style.yearCell, calendar]);
  return /*#__PURE__*/React.createElement(View, {
    style: [style.container, styles.years],
    testID: "year-selector"
  }, /*#__PURE__*/React.createElement(View, {
    style: style.years
  }, generateCells()));
};
const createDefaultStyles = (containerHeight, isRTL) => StyleSheet.create({
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
export default Years;
//# sourceMappingURL=years.js.map