import React from 'react';
import { StyleProp, TextStyle, ViewStyle, ViewProps, FlatListProps } from 'react-native';
import { PickerOption } from '../../../types';
interface Props {
    value: number | string;
    options: PickerOption[];
    onChange: (index: number | string) => void;
    selectedIndicatorStyle?: StyleProp<ViewStyle>;
    itemTextStyle?: TextStyle;
    itemTextClassName?: string;
    itemStyle?: ViewStyle;
    selectedIndicatorClassName?: string;
    itemHeight?: number;
    containerStyle?: ViewStyle;
    containerProps?: Omit<ViewProps, 'style'>;
    scaleFunction?: (x: number) => number;
    rotationFunction?: (x: number) => number;
    opacityFunction?: (x: number) => number;
    visibleRest?: number;
    decelerationRate?: 'normal' | 'fast' | number;
    flatListProps?: Omit<FlatListProps<string | null>, 'data' | 'renderItem'>;
}
declare const _default: React.NamedExoticComponent<Props>;
export default _default;
//# sourceMappingURL=wheel-picker.d.ts.map