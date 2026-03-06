"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WEEKDAYS_HEIGHT = exports.CalendarActionKind = exports.CONTAINER_HEIGHT = void 0;
let CalendarActionKind = exports.CalendarActionKind = /*#__PURE__*/function (CalendarActionKind) {
  CalendarActionKind["SET_CALENDAR_VIEW"] = "SET_CALENDAR_VIEW";
  CalendarActionKind["CHANGE_CURRENT_DATE"] = "CHANGE_CURRENT_DATE";
  CalendarActionKind["CHANGE_CURRENT_YEAR"] = "CHANGE_CURRENT_YEAR";
  CalendarActionKind["CHANGE_SELECTED_DATE"] = "CHANGE_SELECTED_DATE";
  CalendarActionKind["CHANGE_SELECTED_RANGE"] = "CHANGE_SELECTED_RANGE";
  CalendarActionKind["CHANGE_SELECTED_MULTIPLE"] = "CHANGE_SELECTED_MULTIPLE";
  CalendarActionKind["SET_IS_RTL"] = "SET_IS_RTL";
  CalendarActionKind["RESET_STATE"] = "RESET_STATE";
  return CalendarActionKind;
}({});
const CONTAINER_HEIGHT = exports.CONTAINER_HEIGHT = 300;
const WEEKDAYS_HEIGHT = exports.WEEKDAYS_HEIGHT = 25;
//# sourceMappingURL=enums.js.map