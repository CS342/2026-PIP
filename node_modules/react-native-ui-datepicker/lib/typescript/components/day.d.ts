import React from 'react';
import { ClassNames, CalendarDay, Styles, CalendarComponents, DateType } from '../types';
interface Props {
    day: CalendarDay;
    onSelectDate: (date: DateType) => void;
    containerHeight?: number;
    weekdaysHeight?: number;
    styles?: Styles;
    classNames?: ClassNames;
    components?: CalendarComponents;
}
export declare const EmptyDay: React.MemoExoticComponent<() => JSX.Element>;
declare const _default: React.MemoExoticComponent<({ day, onSelectDate, containerHeight, weekdaysHeight, styles, classNames, components, }: Props) => JSX.Element>;
export default _default;
//# sourceMappingURL=day.d.ts.map