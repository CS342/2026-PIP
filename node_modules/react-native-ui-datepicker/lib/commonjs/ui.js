"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YearState = exports.UI = exports.SelectionState = exports.MonthState = exports.DayFlag = exports.CalenderFlag = void 0;
let UI = exports.UI = /*#__PURE__*/function (UI) {
  /** The container of the displayed days. */
  UI["days"] = "days";
  /** Wrapper of the day cell in the days grid. */
  UI["day_cell"] = "day_cell";
  /** The day cell in the days grid. */
  UI["day"] = "day";
  /** The label of the day cell in the days grid. */
  UI["day_label"] = "day_label";
  /** The container of the displayed months. */
  UI["months"] = "months";
  /** Wrapper of the month cell in the months grid. */
  UI["month"] = "month";
  /** The label of the month cell in the months grid. */
  UI["month_label"] = "month_label";
  /** The container of the displayed years. */
  UI["years"] = "years";
  /** Wrapper of the year cell in the years grid. */
  UI["year"] = "year";
  /** The label of the year cell in the years grid. */
  UI["year_label"] = "year_label";
  /** The filled background for the selected range. */
  UI["range_fill"] = "range_fill";
  /** The background for the start days of each week within the selected range. */
  UI["range_fill_weekstart"] = "range_fill_weekstart";
  /** The background for the end days of each week within the selected range. */
  UI["range_fill_weekend"] = "range_fill_weekend";
  /** The calendar header with the previous and next buttons and selectors. */
  UI["header"] = "header";
  /** The cell containing the month selector in the header. */
  UI["month_selector"] = "month_selector";
  /** The label of the month selector cell in the header. */
  UI["month_selector_label"] = "month_selector_label";
  /** The cell containing the year selector in the header. */
  UI["year_selector"] = "year_selector";
  /** The label of the year selector cell in the header. */
  UI["year_selector_label"] = "year_selector_label";
  /** The cell containing the time selector in the header. */
  UI["time_selector"] = "time_selector";
  /** The label of the time selector cell in the header. */
  UI["time_selector_label"] = "time_selector_label";
  /** The row grouping the weekdays in the header. */
  UI["weekdays"] = "weekdays";
  /** The cell with the weekday in the header. */
  UI["weekday"] = "weekday";
  /** The label of the weekday in the header. */
  UI["weekday_label"] = "weekday_label";
  /** The next button in the header. */
  UI["button_next"] = "button_next";
  /** The previous button in the header. */
  UI["button_prev"] = "button_prev";
  /** The next button image in the header. */
  UI["button_next_image"] = "button_next_image";
  /** The previous button image in the header. */
  UI["button_prev_image"] = "button_prev_image";
  /** The label of the hour and minutes. */
  UI["time_label"] = "time_label";
  /** The indicator of the selected hour and minutes. */
  UI["time_selected_indicator"] = "time_selected_indicator";
  return UI;
}({});
let SelectionState = exports.SelectionState = /*#__PURE__*/function (SelectionState) {
  /** The day is at the end of a selected range. */
  SelectionState["range_end"] = "range_end";
  /** The label of the end range cell within a range. */
  SelectionState["range_end_label"] = "range_end_label";
  /** The day is at the middle of a selected range. */
  SelectionState["range_middle"] = "range_middle";
  /** The label of the middle range cell within a range. */
  SelectionState["range_middle_label"] = "range_middle_label";
  /** The day is at the start of a selected range. */
  SelectionState["range_start"] = "range_start";
  /** The label of the start range cell within a range. */
  SelectionState["range_start_label"] = "range_start_label";
  /** The day is selected. */
  SelectionState["selected"] = "selected";
  /** The label of the selected day. */
  SelectionState["selected_label"] = "selected_label";
  return SelectionState;
}({});
let CalenderFlag = exports.CalenderFlag = /*#__PURE__*/function (CalenderFlag) {
  /** The day/month/year is disabled. */
  CalenderFlag["disabled"] = "disabled";
  /** The label of the disabled day/month/year. */
  CalenderFlag["disabled_label"] = "disabled_label";
  return CalenderFlag;
}({});
let DayFlag = exports.DayFlag = /*#__PURE__*/function (DayFlag) {
  /** The day is hidden. */
  DayFlag["hidden"] = "hidden";
  /** The day is outside the current month. */
  DayFlag["outside"] = "outside";
  /** The label of the outsided day. */
  DayFlag["outside_label"] = "outside_label";
  /** The day is today. */
  DayFlag["today"] = "today";
  /** The label of the today. */
  DayFlag["today_label"] = "today_label";
  return DayFlag;
}({});
let MonthState = exports.MonthState = /*#__PURE__*/function (MonthState) {
  /** The month is selected. */
  MonthState["selected_month"] = "selected_month";
  /** The label of the selected month. */
  MonthState["selected_month_label"] = "selected_month_label";
  return MonthState;
}({});
let YearState = exports.YearState = /*#__PURE__*/function (YearState) {
  /** The year is selected. (for single mode) */
  YearState["selected_year"] = "selected_year";
  /** The label of the selected year. */
  YearState["selected_year_label"] = "selected_year_label";
  /** The year is activated (not selected). */
  YearState["active_year"] = "active_year";
  /** The label of the activated year. */
  YearState["active_year_label"] = "active_year_label";
  return YearState;
}({});
//# sourceMappingURL=ui.js.map