"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.COLORS = void 0;
exports.useDefaultClassNames = useDefaultClassNames;
exports.useDefaultStyles = useDefaultStyles;
var _reactNative = require("react-native");
var _ui = require("./ui");
function useDefaultClassNames() {
  const classNames = {
    [_ui.UI.days]: '',
    [_ui.UI.day_cell]: 'p-0.5',
    [_ui.UI.day]: 'group rounded-md web:hover:bg-accent',
    [_ui.UI.day_label]: 'web:whitespace-nowrap text-foreground font-normal',
    [_ui.UI.months]: '',
    [_ui.UI.month]: 'group rounded-md web:hover:bg-accent active:bg-accent',
    [_ui.UI.month_label]: 'web:whitespace-nowrap text-foreground group-active:text-accent-foreground font-normal',
    [_ui.UI.years]: '',
    [_ui.UI.year]: 'group rounded-md web:hover:bg-accent active:bg-accent',
    [_ui.UI.year_label]: 'web:whitespace-nowrap text-foreground group-active:text-accent-foreground font-normal',
    [_ui.UI.range_fill]: 'bg-accent',
    [_ui.UI.range_fill_weekstart]: '',
    [_ui.UI.range_fill_weekend]: '',
    [_ui.UI.header]: 'mb-1',
    [_ui.UI.month_selector]: '',
    [_ui.UI.month_selector_label]: 'font-semibold text-lg text-foreground',
    [_ui.UI.year_selector]: '',
    [_ui.UI.year_selector_label]: 'font-semibold text-lg text-foreground',
    [_ui.UI.time_selector]: '',
    [_ui.UI.time_selector_label]: 'font-semibold text-lg text-foreground',
    [_ui.UI.weekdays]: '',
    [_ui.UI.weekday]: '',
    [_ui.UI.weekday_label]: 'text-sm uppercase text-muted-foreground',
    [_ui.UI.button_next]: '',
    [_ui.UI.button_next_image]: '',
    [_ui.UI.button_prev]: '',
    [_ui.UI.button_prev_image]: '',
    [_ui.UI.time_label]: 'text-foreground text-2xl font-medium',
    [_ui.UI.time_selected_indicator]: 'bg-muted rounded-lg',
    [_ui.SelectionState.range_end]: '',
    [_ui.SelectionState.range_end_label]: 'text-primary-foreground',
    [_ui.SelectionState.range_middle]: 'bg-transparent',
    [_ui.SelectionState.range_middle_label]: 'text-accent-foreground',
    [_ui.SelectionState.range_start]: '',
    [_ui.SelectionState.range_start_label]: 'text-primary-foreground',
    [_ui.SelectionState.selected]: 'group bg-primary web:hover:bg-primary web:hover:opacity-90 active:opacity-90',
    [_ui.SelectionState.selected_label]: 'text-primary-foreground',
    [_ui.CalenderFlag.disabled]: '',
    [_ui.CalenderFlag.disabled_label]: 'text-muted-foreground opacity-50',
    [_ui.DayFlag.hidden]: '',
    [_ui.DayFlag.outside]: '',
    [_ui.DayFlag.outside_label]: 'text-muted-foreground',
    [_ui.DayFlag.today]: 'bg-accent',
    [_ui.DayFlag.today_label]: 'text-accent-foreground',
    [_ui.MonthState.selected_month]: 'group bg-primary web:hover:bg-primary web:hover:opacity-90 active:opacity-90',
    [_ui.MonthState.selected_month_label]: 'text-primary-foreground',
    [_ui.YearState.selected_year]: 'group bg-primary web:hover:bg-primary web:hover:opacity-90 active:opacity-90',
    [_ui.YearState.selected_year_label]: 'text-primary-foreground',
    [_ui.YearState.active_year]: 'bg-accent',
    [_ui.YearState.active_year_label]: 'text-accent-foreground'
  };
  return classNames;
}
function useDefaultStyles(scheme) {
  const colorScheme = (0, _reactNative.useColorScheme)();
  const theme = scheme || (colorScheme ?? 'light');
  const styles = {
    [_ui.UI.days]: {},
    [_ui.UI.day_cell]: {
      padding: 1.5
    },
    [_ui.UI.day]: {
      borderRadius: 5
    },
    [_ui.UI.day_label]: {
      color: COLORS[theme].accentForeground
    },
    [_ui.UI.months]: {},
    [_ui.UI.month]: {
      borderColor: COLORS[theme].border,
      borderWidth: 1,
      borderRadius: 5
    },
    [_ui.UI.month_label]: {
      color: COLORS[theme].accentForeground
    },
    [_ui.UI.years]: {},
    [_ui.UI.year]: {
      borderColor: COLORS[theme].border,
      borderWidth: 1,
      borderRadius: 5
    },
    [_ui.UI.year_label]: {
      color: COLORS[theme].accentForeground
    },
    [_ui.UI.range_fill]: {
      backgroundColor: COLORS[theme].accent
    },
    [_ui.UI.range_fill_weekstart]: {},
    [_ui.UI.range_fill_weekend]: {},
    [_ui.UI.header]: {
      marginBottom: 5
    },
    [_ui.UI.month_selector]: {},
    [_ui.UI.month_selector_label]: {
      fontSize: 16,
      fontWeight: '500',
      color: COLORS[theme].foreground
    },
    [_ui.UI.year_selector]: {},
    [_ui.UI.year_selector_label]: {
      fontSize: 16,
      fontWeight: '500',
      color: COLORS[theme].foreground
    },
    [_ui.UI.time_selector]: {},
    [_ui.UI.time_selector_label]: {
      fontSize: 16,
      fontWeight: '500',
      color: COLORS[theme].foreground
    },
    [_ui.UI.weekdays]: {},
    [_ui.UI.weekday]: {},
    [_ui.UI.weekday_label]: {
      fontSize: 12,
      textTransform: 'uppercase',
      color: COLORS[theme].mutedForeground
    },
    [_ui.UI.button_next]: {},
    [_ui.UI.button_next_image]: {},
    [_ui.UI.button_prev]: {},
    [_ui.UI.button_prev_image]: {},
    [_ui.UI.time_label]: {
      fontSize: 22,
      fontWeight: '500',
      color: COLORS[theme].foreground
    },
    [_ui.UI.time_selected_indicator]: {
      backgroundColor: COLORS[theme].muted,
      borderRadius: 5
    },
    [_ui.SelectionState.range_end]: {},
    [_ui.SelectionState.range_end_label]: {
      color: COLORS[theme].primaryForeground
    },
    [_ui.SelectionState.range_middle]: {
      backgroundColor: 'transparent'
    },
    [_ui.SelectionState.range_middle_label]: {
      color: COLORS[theme].accentForeground
    },
    [_ui.SelectionState.range_start]: {},
    [_ui.SelectionState.range_start_label]: {
      color: COLORS[theme].primaryForeground
    },
    [_ui.SelectionState.selected]: {
      backgroundColor: COLORS[theme].primary
    },
    [_ui.SelectionState.selected_label]: {
      color: COLORS[theme].primaryForeground
    },
    [_ui.CalenderFlag.disabled]: {},
    [_ui.CalenderFlag.disabled_label]: {
      color: COLORS[theme].mutedForeground,
      opacity: 0.5
    },
    [_ui.DayFlag.hidden]: {},
    [_ui.DayFlag.outside]: {},
    [_ui.DayFlag.outside_label]: {
      color: COLORS[theme].mutedForeground
    },
    [_ui.DayFlag.today]: {
      backgroundColor: COLORS[theme].accent
    },
    [_ui.DayFlag.today_label]: {
      color: COLORS[theme].accentForeground
    },
    [_ui.MonthState.selected_month]: {
      backgroundColor: COLORS[theme].primary,
      borderColor: COLORS[theme].primary
    },
    [_ui.MonthState.selected_month_label]: {
      color: COLORS[theme].primaryForeground
    },
    [_ui.YearState.selected_year]: {
      backgroundColor: COLORS[theme].primary,
      borderColor: COLORS[theme].primary
    },
    [_ui.YearState.selected_year_label]: {
      color: COLORS[theme].primaryForeground
    },
    [_ui.YearState.active_year]: {
      backgroundColor: COLORS[theme].accent,
      borderColor: COLORS[theme].accent
    },
    [_ui.YearState.active_year_label]: {
      color: COLORS[theme].accentForeground
    }
  };
  return styles;
}
const COLORS = exports.COLORS = {
  light: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(240 10% 3.9%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(240 10% 3.9%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(240 10% 3.9%)',
    primary: 'hsl(240 5.9% 10%)',
    primaryForeground: 'hsl(0 0% 98%)',
    secondary: 'hsl(240 4.8% 95.9%)',
    secondaryForeground: 'hsl(240 5.9% 10%)',
    muted: 'hsl(240 4.8% 95.9%)',
    mutedForeground: 'hsl(240 3.8% 46.1%)',
    accent: 'hsl(240 4.8% 95.9%)',
    accentForeground: 'hsl(240 5.9% 10%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    destructiveForeground: 'hsl(0 0% 98%)',
    border: 'hsl(240 5.9% 90%)'
  },
  dark: {
    background: 'hsl(240 10% 3.9%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(240 10% 3.9%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(240 10% 3.9%)',
    popoverForeground: 'hsl(0 0% 98%)',
    primary: 'hsl(0 0% 98%)',
    primaryForeground: 'hsl(240 5.9% 10%)',
    secondary: 'hsl(240 3.7% 15.9%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    muted: 'hsl(240 3.7% 15.9%)',
    mutedForeground: 'hsl(240 5% 64.9%)',
    accent: 'hsl(240 3.7% 15.9%)',
    accentForeground: 'hsl(0 0% 98%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    destructiveForeground: 'hsl(0 0% 98%)',
    border: 'hsl(240 3.7% 15.9%)'
  }
};
//# sourceMappingURL=theme.js.map