"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
Object.defineProperty(exports, "useDefaultClassNames", {
  enumerable: true,
  get: function () {
    return _theme.useDefaultClassNames;
  }
});
Object.defineProperty(exports, "useDefaultStyles", {
  enumerable: true,
  get: function () {
    return _theme.useDefaultStyles;
  }
});
require("./locales");
require("./polyfill");
var _datetimePicker = _interopRequireDefault(require("./datetime-picker"));
var _theme = require("./theme");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = exports.default = _datetimePicker.default;
//# sourceMappingURL=index.js.map