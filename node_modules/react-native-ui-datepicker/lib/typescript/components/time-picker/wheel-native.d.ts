import React from 'react';
import { ClassNames, PickerOption, Styles } from '../../types';
interface WheelProps {
    value: number | string;
    setValue?: (value: any) => void;
    items: PickerOption[];
    styles?: Styles;
    classNames?: ClassNames;
}
declare const _default: React.MemoExoticComponent<({ value, setValue, items, styles, classNames, }: WheelProps) => JSX.Element>;
export default _default;
//# sourceMappingURL=wheel-native.d.ts.map