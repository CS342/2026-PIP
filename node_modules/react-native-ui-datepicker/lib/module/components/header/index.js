import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import PrevButton from './prev-button';
import NextButton from './next-button';
import Selectors from './selectors';
import { isEqual } from 'lodash';
const createDefaultStyles = isRTL => StyleSheet.create({
  headerContainer: {
    paddingVertical: 3
  },
  container: {
    padding: 5,
    gap: 20,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navigation: {
    flexDirection: isRTL ? 'row-reverse' : 'row'
  }
});
const NavigationButtons = ({
  styles,
  classNames,
  isRTL
}) => {
  const style = useMemo(() => createDefaultStyles(isRTL), [isRTL]);
  return /*#__PURE__*/React.createElement(View, {
    style: style.navigation
  }, /*#__PURE__*/React.createElement(PrevButton, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_prev,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_prev_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev_image
  }), /*#__PURE__*/React.createElement(NextButton, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_next,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_next_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_next,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_next_image
  }));
};
const Header = ({
  navigationPosition = 'around',
  styles = {},
  classNames = {},
  isRTL
}) => {
  const style = useMemo(() => createDefaultStyles(isRTL), [isRTL]);
  return /*#__PURE__*/React.createElement(View, {
    style: [style.headerContainer, styles === null || styles === void 0 ? void 0 : styles.header],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.header
  }, /*#__PURE__*/React.createElement(View, {
    style: style.container
  }, navigationPosition === 'left' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(NavigationButtons, {
    styles: styles,
    classNames: classNames,
    isRTL: isRTL
  }), /*#__PURE__*/React.createElement(Selectors, {
    position: "left"
  })) : navigationPosition === 'right' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Selectors, {
    position: "right"
  }), /*#__PURE__*/React.createElement(NavigationButtons, {
    styles: styles,
    classNames: classNames,
    isRTL: isRTL
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PrevButton, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_prev,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_prev_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev_image
  }), /*#__PURE__*/React.createElement(Selectors, {
    position: "around"
  }), /*#__PURE__*/React.createElement(NextButton, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_next,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_next_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_next,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_next_image
  }))));
};
const customComparator = (prev, next) => {
  const areEqual = prev.PrevIcon === next.PrevIcon && prev.NextIcon === next.NextIcon && prev.navigationPosition === next.navigationPosition && prev.isRTL === next.isRTL && isEqual(prev.styles, next.styles) && isEqual(prev.classNames, next.classNames);
  return areEqual;
};
export default /*#__PURE__*/memo(Header, customComparator);
//# sourceMappingURL=index.js.map