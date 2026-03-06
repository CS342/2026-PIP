import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isEqual } from 'lodash';
const PeriodWeb = ({
  value,
  setValue = () => {},
  styles,
  classNames
}) => {
  return /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => setValue(value == 'AM' ? 'PM' : 'AM')
  }, /*#__PURE__*/React.createElement(View, {
    style: [defaultStyles.period, styles === null || styles === void 0 ? void 0 : styles.time_selected_indicator],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_selected_indicator
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.time_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_label
  }, value)));
};
const defaultStyles = StyleSheet.create({
  period: {
    width: 65,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
const customComparator = (prev, next) => {
  const areEqual = prev.value === next.value && prev.setValue === next.setValue && isEqual(prev.styles, next.styles) && isEqual(prev.classNames, next.classNames);
  return areEqual;
};
export default /*#__PURE__*/memo(PeriodWeb, customComparator);
//# sourceMappingURL=period-web.js.map