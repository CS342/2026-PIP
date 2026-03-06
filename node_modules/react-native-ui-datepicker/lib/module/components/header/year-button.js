import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCalendarContext } from '../../calendar-context';
import { formatNumber, getDateYear, getYearRange } from '../../utils';
import dayjs from 'dayjs';
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
  } = useCalendarContext();
  const years = getYearRange(currentYear);
  return /*#__PURE__*/React.createElement(Pressable, {
    disabled: disableYearPicker,
    onPress: () => {
      setCalendarView(calendarView === 'year' ? 'day' : 'year');
      onChangeYear(getDateYear(currentDate));
    },
    testID: "btn-year",
    accessibilityRole: "button",
    accessibilityLabel: dayjs(currentDate).calendar(calendar).format('YYYY')
  }, /*#__PURE__*/React.createElement(View, {
    style: [defaultStyles.container, styles === null || styles === void 0 ? void 0 : styles.year_selector],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.year_selector
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.year_selector_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.year_selector_label
  }, calendarView === 'year' ? `${formatNumber(years[0] || 0, numerals)} - ${formatNumber(years[years.length - 1] || 0, numerals)}` : formatNumber(parseInt(dayjs(currentDate).calendar(calendar).format('YYYY')), numerals))));
};
export default /*#__PURE__*/memo(YearButton);
const defaultStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
//# sourceMappingURL=year-button.js.map