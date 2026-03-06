import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCalendarContext } from '../../calendar-context';
import MonthButton from './month-button';
import YearButton from './year-button';
import { TimeButton } from './time-button';
const Selectors = ({
  position
}) => {
  const {
    mode,
    calendarView,
    timePicker
  } = useCalendarContext();
  return /*#__PURE__*/React.createElement(View, {
    style: [defaultStyles.container,
    // eslint-disable-next-line react-native/no-inline-styles
    position === 'around' ? {
      justifyContent: 'space-evenly'
    } : {
      justifyContent: 'space-between',
      flexDirection: position === 'left' ? 'row-reverse' : 'row'
    }]
  }, /*#__PURE__*/React.createElement(View, {
    style: defaultStyles.monthAndYear
  }, calendarView !== 'year' ? /*#__PURE__*/React.createElement(MonthButton, null) : null, /*#__PURE__*/React.createElement(YearButton, null)), timePicker && mode === 'single' && calendarView !== 'year' ? /*#__PURE__*/React.createElement(TimeButton, null) : null);
};
export default /*#__PURE__*/memo(Selectors);
const defaultStyles = StyleSheet.create({
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