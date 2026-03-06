"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCalendarContext = exports.CalendarContext = void 0;
var _react = require("react");
const CalendarContext = exports.CalendarContext = /*#__PURE__*/(0, _react.createContext)({});
const useCalendarContext = () => (0, _react.useContext)(CalendarContext);
exports.useCalendarContext = useCalendarContext;
//# sourceMappingURL=calendar-context.js.map