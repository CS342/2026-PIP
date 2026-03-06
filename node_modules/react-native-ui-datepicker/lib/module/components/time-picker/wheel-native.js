import React, { memo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import WheelPicker from './wheel-picker';
const WheelNative = ({
  value,
  setValue = () => {},
  items,
  styles,
  classNames
}) => {
  return /*#__PURE__*/React.createElement(WheelPicker, {
    value: value,
    options: items,
    onChange: setValue,
    containerStyle: defaultStyles.container,
    itemTextStyle: styles === null || styles === void 0 ? void 0 : styles.time_label,
    itemTextClassName: classNames === null || classNames === void 0 ? void 0 : classNames.time_label,
    selectedIndicatorClassName: classNames === null || classNames === void 0 ? void 0 : classNames.time_selected_indicator,
    selectedIndicatorStyle: styles === null || styles === void 0 ? void 0 : styles.time_selected_indicator,
    itemHeight: 44,
    decelerationRate: "fast"
  });
};
export default /*#__PURE__*/memo(WheelNative);
const defaultStyles = StyleSheet.create({
  container: {
    display: 'flex',
    ...Platform.select({
      web: {
        userSelect: 'none'
      }
    })
  }
});
//# sourceMappingURL=wheel-native.js.map