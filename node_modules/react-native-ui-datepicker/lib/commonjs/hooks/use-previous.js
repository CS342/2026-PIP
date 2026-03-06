"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePrevious = void 0;
var _react = require("react");
const usePrevious = value => {
  const ref = (0, _react.useRef)();
  (0, _react.useEffect)(() => {
    ref.current = value;
  });
  return ref.current;
};
exports.usePrevious = usePrevious;
//# sourceMappingURL=use-previous.js.map