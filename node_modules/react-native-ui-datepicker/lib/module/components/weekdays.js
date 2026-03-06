import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getWeekdays } from '../utils';
import { WEEKDAYS_HEIGHT } from '../enums';
const Weekdays = ({
  locale,
  firstDayOfWeek,
  styles = {},
  classNames = {},
  weekdaysFormat = 'min',
  weekdaysHeight = WEEKDAYS_HEIGHT,
  components = {},
  isRTL
}) => {
  var _getWeekdays;
  const style = useMemo(() => createDefaultStyles(weekdaysHeight, isRTL), [weekdaysHeight, isRTL]);
  return /*#__PURE__*/React.createElement(View, {
    style: [style.container, styles.weekdays],
    className: classNames.weekdays,
    testID: "weekdays"
  }, (_getWeekdays = getWeekdays(locale, firstDayOfWeek)) === null || _getWeekdays === void 0 ? void 0 : _getWeekdays.map((weekday, index) => /*#__PURE__*/React.createElement(View, {
    key: index,
    style: [style.weekday, styles.weekday],
    className: classNames.weekday
  }, components.Weekday ? components.Weekday(weekday) : /*#__PURE__*/React.createElement(Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.weekday_label,
    className: classNames.weekday_label
  }, weekday.name[weekdaysFormat]))));
};
export default /*#__PURE__*/memo(Weekdays);
const createDefaultStyles = (weekdaysHeight, isRTL) => StyleSheet.create({
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