"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _wheelPicker = _interopRequireDefault(require("./wheel-picker.style"));
var _lodash = require("lodash");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const WheelPickerItem = ({
  textStyle,
  textClassName,
  style,
  height,
  option,
  index,
  visibleRest,
  currentScrollIndex,
  opacityFunction,
  rotationFunction,
  scaleFunction
}) => {
  const relativeScrollIndex = _reactNative.Animated.subtract(index, currentScrollIndex);
  const translateY = relativeScrollIndex.interpolate({
    inputRange: (() => {
      const range = [0];
      for (let i = 1; i <= visibleRest + 1; i++) {
        range.unshift(-i);
        range.push(i);
      }
      return range;
    })(),
    outputRange: (() => {
      const range = [0];
      for (let i = 1; i <= visibleRest + 1; i++) {
        let y = height / 2 * (1 - Math.sin(Math.PI / 2 - rotationFunction(i)));
        for (let j = 1; j < i; j++) {
          y += height * (1 - Math.sin(Math.PI / 2 - rotationFunction(j)));
        }
        range.unshift(y);
        range.push(-y);
      }
      return range;
    })()
  });
  const opacity = relativeScrollIndex.interpolate({
    inputRange: (() => {
      const range = [0];
      for (let i = 1; i <= visibleRest + 1; i++) {
        range.unshift(-i);
        range.push(i);
      }
      return range;
    })(),
    outputRange: (() => {
      const range = [1];
      for (let x = 1; x <= visibleRest + 1; x++) {
        const y = opacityFunction(x);
        range.unshift(y);
        range.push(y);
      }
      return range;
    })()
  });
  const scale = relativeScrollIndex.interpolate({
    inputRange: (() => {
      const range = [0];
      for (let i = 1; i <= visibleRest + 1; i++) {
        range.unshift(-i);
        range.push(i);
      }
      return range;
    })(),
    outputRange: (() => {
      const range = [1.0];
      for (let x = 1; x <= visibleRest + 1; x++) {
        const y = scaleFunction(x);
        range.unshift(y);
        range.push(y);
      }
      return range;
    })()
  });
  const rotateX = relativeScrollIndex.interpolate({
    inputRange: (() => {
      const range = [0];
      for (let i = 1; i <= visibleRest + 1; i++) {
        range.unshift(-i);
        range.push(i);
      }
      return range;
    })(),
    outputRange: (() => {
      const range = ['0deg'];
      for (let x = 1; x <= visibleRest + 1; x++) {
        const y = rotationFunction(x);
        range.unshift(`${y}deg`);
        range.push(`${y}deg`);
      }
      return range;
    })()
  });
  return /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    style: [_wheelPicker.default.option, style, {
      height,
      opacity,
      transform: [{
        translateY
      }, {
        rotateX
      }, {
        scale
      }]
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: textStyle,
    className: textClassName
  }, option === null || option === void 0 ? void 0 : option.text));
};
const customComparator = (prevProps, nextProps) => {
  return prevProps.textClassName === nextProps.textClassName && (0, _lodash.isEqual)(prevProps.textStyle, nextProps.textStyle);
};
var _default = exports.default = /*#__PURE__*/_react.default.memo(WheelPickerItem, customComparator);
//# sourceMappingURL=wheel-picker-item.js.map