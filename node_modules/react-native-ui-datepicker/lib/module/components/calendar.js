import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useCalendarContext } from '../calendar-context';
import Header from './header';
import Years from './years';
import Months from './months';
import Days from './days';
import TimePicker from './time-picker';
const CalendarView = {
  year: /*#__PURE__*/React.createElement(Years, null),
  month: /*#__PURE__*/React.createElement(Months, null),
  day: /*#__PURE__*/React.createElement(Days, null),
  time: /*#__PURE__*/React.createElement(TimePicker, null)
};
const Calendar = () => {
  const {
    hideHeader,
    calendarView,
    style = {},
    className = '',
    styles = {},
    classNames = {},
    containerHeight,
    navigationPosition,
    isRTL
  } = useCalendarContext();
  const containerStyle = useMemo(() => ({
    height: containerHeight
  }), [containerHeight]);
  return /*#__PURE__*/React.createElement(View, {
    style: style,
    className: className,
    testID: "calendar"
  }, !hideHeader ? /*#__PURE__*/React.createElement(Header, {
    navigationPosition: navigationPosition,
    styles: styles,
    classNames: classNames,
    isRTL: isRTL
  }) : null, /*#__PURE__*/React.createElement(View, {
    style: containerStyle
  }, CalendarView[calendarView]));
};
export default Calendar;
//# sourceMappingURL=calendar.js.map