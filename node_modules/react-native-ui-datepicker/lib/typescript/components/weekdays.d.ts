import React from 'react';
import { Styles, ClassNames, WeekdayFormat, CalendarComponents } from '../types';
type WeekdaysProps = {
    locale: string;
    firstDayOfWeek: number;
    styles?: Styles;
    classNames?: ClassNames;
    weekdaysFormat?: WeekdayFormat;
    weekdaysHeight?: number;
    components?: CalendarComponents;
    isRTL: boolean;
};
declare const _default: React.MemoExoticComponent<({ locale, firstDayOfWeek, styles, classNames, weekdaysFormat, weekdaysHeight, components, isRTL, }: WeekdaysProps) => JSX.Element>;
export default _default;
//# sourceMappingURL=weekdays.d.ts.map