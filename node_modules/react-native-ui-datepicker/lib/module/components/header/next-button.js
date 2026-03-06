import React, { memo, useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { useCalendarContext } from '../../calendar-context';
import { YEAR_PAGE_SIZE } from '../../utils';
import { isEqual } from 'lodash';
import { COLORS } from '../../theme';
const arrow_right = require('../../assets/images/arrow_right.png');
const NextButton = ({
  style,
  imageStyle,
  className,
  imageClassName
}) => {
  const {
    currentYear,
    onChangeMonth,
    onChangeYear,
    calendarView,
    components = {},
    isRTL
  } = useCalendarContext();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const defaultStyles = useMemo(() => createDefaultStyles(isRTL), [isRTL]);
  const onPress = useCallback(() => {
    switch (calendarView) {
      case 'day':
        return onChangeMonth(1);
      case 'month':
        return onChangeYear(currentYear + 1);
      case 'year':
        return onChangeYear(currentYear + YEAR_PAGE_SIZE);
      default:
        return {};
    }
  }, [calendarView, currentYear, onChangeMonth, onChangeYear]);
  const iconStyle = useMemo(() => ({
    ...defaultStyles.icon,
    tintColor: COLORS[theme].foreground,
    ...imageStyle
  }), [imageStyle, theme, defaultStyles.icon]);
  return /*#__PURE__*/React.createElement(Pressable, {
    disabled: calendarView === 'time',
    onPress: onPress,
    testID: "btn-next",
    accessibilityRole: "button",
    accessibilityLabel: "Next"
  }, /*#__PURE__*/React.createElement(View, {
    style: [defaultStyles.iconContainer, defaultStyles.next, style],
    className: className
  }, components.IconNext || /*#__PURE__*/React.createElement(Image, {
    source: arrow_right,
    style: iconStyle,
    className: imageClassName
  })));
};
const customComparator = (prev, next) => {
  const areEqual = prev.className === next.className && isEqual(prev.style, next.style) && isEqual(prev.imageStyle, next.imageStyle) && isEqual(prev.imageClassName, next.imageClassName);
  return areEqual;
};
export default /*#__PURE__*/memo(NextButton, customComparator);
const createDefaultStyles = isRTL => StyleSheet.create({
  iconContainer: {
    padding: 4
  },
  next: {
    marginLeft: isRTL ? 0 : 3,
    marginRight: isRTL ? 3 : 0
  },
  icon: {
    width: 14,
    height: 14,
    transform: [{
      rotate: isRTL ? '180deg' : '0deg'
    }]
  }
});
//# sourceMappingURL=next-button.js.map