"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _prevButton = _interopRequireDefault(require("./prev-button"));
var _nextButton = _interopRequireDefault(require("./next-button"));
var _selectors = _interopRequireDefault(require("./selectors"));
var _lodash = require("lodash");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const createDefaultStyles = isRTL => _reactNative.StyleSheet.create({
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
  const style = (0, _react.useMemo)(() => createDefaultStyles(isRTL), [isRTL]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: style.navigation
  }, /*#__PURE__*/_react.default.createElement(_prevButton.default, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_prev,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_prev_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev_image
  }), /*#__PURE__*/_react.default.createElement(_nextButton.default, {
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
  const style = (0, _react.useMemo)(() => createDefaultStyles(isRTL), [isRTL]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [style.headerContainer, styles === null || styles === void 0 ? void 0 : styles.header],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.header
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: style.container
  }, navigationPosition === 'left' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(NavigationButtons, {
    styles: styles,
    classNames: classNames,
    isRTL: isRTL
  }), /*#__PURE__*/_react.default.createElement(_selectors.default, {
    position: "left"
  })) : navigationPosition === 'right' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_selectors.default, {
    position: "right"
  }), /*#__PURE__*/_react.default.createElement(NavigationButtons, {
    styles: styles,
    classNames: classNames,
    isRTL: isRTL
  })) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_prevButton.default, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_prev,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_prev_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_prev_image
  }), /*#__PURE__*/_react.default.createElement(_selectors.default, {
    position: "around"
  }), /*#__PURE__*/_react.default.createElement(_nextButton.default, {
    style: styles === null || styles === void 0 ? void 0 : styles.button_next,
    imageStyle: styles === null || styles === void 0 ? void 0 : styles.button_next_image,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.button_next,
    imageClassName: classNames === null || classNames === void 0 ? void 0 : classNames.button_next_image
  }))));
};
const customComparator = (prev, next) => {
  const areEqual = prev.PrevIcon === next.PrevIcon && prev.NextIcon === next.NextIcon && prev.navigationPosition === next.navigationPosition && prev.isRTL === next.isRTL && (0, _lodash.isEqual)(prev.styles, next.styles) && (0, _lodash.isEqual)(prev.classNames, next.classNames);
  return areEqual;
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(Header, customComparator);
//# sourceMappingURL=index.js.map