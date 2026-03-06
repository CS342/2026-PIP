"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _lodash = require("lodash");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const PeriodWeb = ({
  value,
  setValue = () => {},
  styles,
  classNames
}) => {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => setValue(value == 'AM' ? 'PM' : 'AM')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [defaultStyles.period, styles === null || styles === void 0 ? void 0 : styles.time_selected_indicator],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_selected_indicator
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.time_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.time_label
  }, value)));
};
const defaultStyles = _reactNative.StyleSheet.create({
  period: {
    width: 65,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
const customComparator = (prev, next) => {
  const areEqual = prev.value === next.value && prev.setValue === next.setValue && (0, _lodash.isEqual)(prev.styles, next.styles) && (0, _lodash.isEqual)(prev.classNames, next.classNames);
  return areEqual;
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(PeriodWeb, customComparator);
//# sourceMappingURL=period-web.js.map