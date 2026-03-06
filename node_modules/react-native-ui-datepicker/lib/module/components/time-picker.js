import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, I18nManager } from 'react-native';
import { useCalendarContext } from '../calendar-context';
import Wheel from './time-picker/wheel';
import { CONTAINER_HEIGHT } from '../enums';
import { getParsedDate, formatNumber } from '../utils';
import dayjs from 'dayjs';
import PeriodPicker from './time-picker/period-picker';
const createNumberList = (num, numerals, startFrom = 0) => {
  return Array.from({
    length: num
  }, (_, i) => ({
    value: i + startFrom,
    text: i + startFrom < 10 ? `${formatNumber(0, numerals)}${formatNumber(i + startFrom, numerals)}` : `${formatNumber(i + startFrom, numerals)}`
  }));
};
const TimePicker = () => {
  const {
    currentDate,
    date,
    onSelectDate,
    styles,
    classNames,
    timeZone,
    numerals = 'latn',
    use12Hours
  } = useCalendarContext();
  const hours = useMemo(() => createNumberList(use12Hours ? 12 : 24, numerals, use12Hours ? 1 : 0), [numerals, use12Hours]);
  const minutes = useMemo(() => createNumberList(60, numerals), [numerals]);
  const {
    hour,
    hour12,
    minute,
    period
  } = getParsedDate(date || currentDate);
  const handleChangeHour = useCallback(value => {
    let hour24 = value;
    if (use12Hours) {
      if (period === 'PM' && value < 12) {
        hour24 = value + 12;
      } else if (period === 'PM' && value === 12) {
        hour24 = 0;
      }
    }
    const newDate = dayjs.tz(date, timeZone).hour(hour24).minute(minute);
    onSelectDate(newDate);
  }, [date, onSelectDate, timeZone, use12Hours, period, minute]);
  const handleChangeMinute = useCallback(value => {
    const newDate = dayjs.tz(date, timeZone).minute(value);
    onSelectDate(newDate);
  }, [date, onSelectDate, timeZone]);
  const handlePeriodChange = useCallback(newPeriod => {
    let newHour = hour12;
    if (newPeriod === 'PM' && hour12 < 12) {
      newHour = hour12 + 12;
    } else if (newPeriod === 'AM' && hour12 === 12) {
      newHour = 0;
    } else if (newPeriod === 'AM' && hour >= 12) {
      newHour = hour12;
    }
    const newDate = dayjs.tz(date || currentDate, timeZone).hour(newHour);
    onSelectDate(newDate);
  }, [date, currentDate, onSelectDate, timeZone, hour, hour12]);
  const timePickerContainerStyle = useMemo(() => ({
    ...defaultStyles.timePickerContainer,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row'
  }), [I18nManager.isRTL]);
  const timePickerTextStyle = useMemo(() => ({
    ...defaultStyles.timeSeparator,
    ...(styles === null || styles === void 0 ? void 0 : styles.time_label)
  }), [styles === null || styles === void 0 ? void 0 : styles.time_label]);
  return /*#__PURE__*/React.createElement(ScrollView, {
    horizontal: true,
    scrollEnabled: false,
    contentContainerStyle: defaultStyles.container,
    testID: "time-selector"
  }, /*#__PURE__*/React.createElement(View, {
    style: timePickerContainerStyle
  }, /*#__PURE__*/React.createElement(View, {
    style: defaultStyles.wheelContainer
  }, /*#__PURE__*/React.createElement(Wheel, {
    value: use12Hours ? hour12 : hour,
    items: hours,
    setValue: handleChangeHour,
    styles: styles,
    classNames: classNames
  })), /*#__PURE__*/React.createElement(Text, {
    style: timePickerTextStyle,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_label
  }, ":"), /*#__PURE__*/React.createElement(View, {
    style: defaultStyles.wheelContainer
  }, /*#__PURE__*/React.createElement(Wheel, {
    value: minute,
    items: minutes,
    setValue: handleChangeMinute,
    styles: styles,
    classNames: classNames
  }))), use12Hours && period ? /*#__PURE__*/React.createElement(View, {
    style: defaultStyles.periodContainer
  }, /*#__PURE__*/React.createElement(PeriodPicker, {
    value: period,
    setValue: handlePeriodChange,
    styles: styles,
    classNames: classNames
  })) : null);
};
const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wheelContainer: {
    flex: 1
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CONTAINER_HEIGHT / 2,
    height: CONTAINER_HEIGHT / 2
  },
  timeSeparator: {
    marginHorizontal: 5
  },
  periodContainer: {
    marginLeft: 10
  }
});
export default TimePicker;
//# sourceMappingURL=time-picker.js.map