import React, { memo } from 'react';
import { Platform } from 'react-native';
import PeriodNative from './period-native';
import PeriodWeb from './period-web';
const PeriodPicker = props => {
  const Component = Platform.OS === 'web' ? PeriodWeb : PeriodNative;
  return /*#__PURE__*/React.createElement(Component, props);
};
export default /*#__PURE__*/memo(PeriodPicker);
//# sourceMappingURL=period-picker.js.map