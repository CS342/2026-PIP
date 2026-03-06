"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _wheelPicker = _interopRequireDefault(require("./wheel-picker"));
var _lodash = require("lodash");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
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
  return /*#__PURE__*/_react.default.createElement(_wheelPicker.default, {
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
  const areEqual = prev.value === next.value && prev.setValue === next.setValue && (0, _lodash.isEqual)(prev.styles, next.styles) && (0, _lodash.isEqual)(prev.classNames, next.classNames);
  return areEqual;
};
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(PeriodNative, customComparator);
//# sourceMappingURL=period-native.js.map