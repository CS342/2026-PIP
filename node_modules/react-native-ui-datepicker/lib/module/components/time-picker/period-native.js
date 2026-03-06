import React, { memo } from 'react';
import WheelPicker from './wheel-picker';
import { isEqual } from 'lodash';
const options = [{
  value: 'AM',
  text: 'AM'
}, {
  value: 'PM',
  text: 'PM'
}];
const PeriodNative = ({
  value,
  setValue = () => {},
  styles,
  classNames
}) => {
  return /*#__PURE__*/React.createElement(WheelPicker, {
    value: value,
    options: options,
    onChange: setValue
    //containerStyle={defaultStyles.container}
    ,
    itemTextStyle: styles === null || styles === void 0 ? void 0 : styles.time_label,
    itemTextClassName: classNames === null || classNames === void 0 ? void 0 : classNames.time_label,
    selectedIndicatorClassName: classNames === null || classNames === void 0 ? void 0 : classNames.time_selected_indicator,
    selectedIndicatorStyle: styles === null || styles === void 0 ? void 0 : styles.time_selected_indicator,
    itemHeight: 44,
    decelerationRate: "fast"
  });
};
const customComparator = (prev, next) => {
  const areEqual = prev.value === next.value && prev.setValue === next.setValue && isEqual(prev.styles, next.styles) && isEqual(prev.classNames, next.classNames);
  return areEqual;
};
export default /*#__PURE__*/memo(PeriodNative, customComparator);
//# sourceMappingURL=period-native.js.map