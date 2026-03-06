function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Animated, View, Platform } from 'react-native';
import styles from './wheel-picker.style';
import WheelPickerItem from './wheel-picker-item';
const WheelPicker = ({
  value,
  options,
  onChange,
  selectedIndicatorStyle = {},
  containerStyle = {},
  itemStyle = {},
  itemTextStyle = {},
  selectedIndicatorClassName = '',
  itemTextClassName = '',
  itemHeight = 40,
  scaleFunction = x => 1.0 ** x,
  rotationFunction = x => 1 - Math.pow(1 / 2, x),
  opacityFunction = x => Math.pow(1 / 3, x),
  visibleRest = 2,
  decelerationRate = 'normal',
  containerProps = {},
  flatListProps = {}
}) => {
  const momentumStarted = useRef(false);
  const selectedIndex = options.findIndex(item => item.value === value);
  const flatListRef = useRef(null);
  const [scrollY] = useState(new Animated.Value(selectedIndex * itemHeight));
  const containerHeight = (1 + visibleRest * 2) * itemHeight;
  const paddedOptions = useMemo(() => {
    const array = [...options];
    for (let i = 0; i < visibleRest; i++) {
      array.unshift(null);
      array.push(null);
    }
    return array;
  }, [options, visibleRest]);
  const offsets = useMemo(() => [...Array(paddedOptions.length)].map((_, i) => i * itemHeight), [paddedOptions, itemHeight]);
  const currentScrollIndex = useMemo(() => Animated.add(Animated.divide(scrollY, itemHeight), visibleRest), [visibleRest, scrollY, itemHeight]);
  const handleScrollEnd = event => {
    const offsetY = Math.min(itemHeight * (options.length - 1), Math.max(event.nativeEvent.contentOffset.y, 0));
    let index = Math.floor(offsetY / itemHeight);
    const remainder = offsetY % itemHeight;
    if (remainder > itemHeight / 2) {
      index++;
    }
    if (index !== selectedIndex) {
      var _options$index;
      onChange(((_options$index = options[index]) === null || _options$index === void 0 ? void 0 : _options$index.value) || 0);
    }
  };
  const handleMomentumScrollBegin = () => {
    momentumStarted.current = true;
  };
  const handleMomentumScrollEnd = event => {
    momentumStarted.current = false;
    handleScrollEnd(event);
  };
  const handleScrollEndDrag = event => {
    var _event$nativeEvent$co;
    // Capture the offset value immediately
    const offsetY = (_event$nativeEvent$co = event.nativeEvent.contentOffset) === null || _event$nativeEvent$co === void 0 ? void 0 : _event$nativeEvent$co.y;

    // We'll start a short timer to see if momentum scroll begins
    setTimeout(() => {
      // If momentum scroll hasn't started within the timeout,
      // then it was a slow scroll that won't trigger momentum
      if (!momentumStarted.current && offsetY !== undefined) {
        // Create a synthetic event with just the data we need
        const syntheticEvent = {
          nativeEvent: {
            contentOffset: {
              y: offsetY
            }
          }
        };
        handleScrollEnd(syntheticEvent);
      }
    }, 50);
  };
  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= options.length) {
      throw new Error(`Selected index ${selectedIndex} is out of bounds [0, ${options.length - 1}]`);
    }
  }, [selectedIndex, options]);

  /**
   * If selectedIndex is changed from outside (not via onChange) we need to scroll to the specified index.
   * This ensures that what the user sees as selected in the picker always corresponds to the value state.
   */
  useEffect(() => {
    var _flatListRef$current;
    (_flatListRef$current = flatListRef.current) === null || _flatListRef$current === void 0 || _flatListRef$current.scrollToIndex({
      index: selectedIndex,
      animated: Platform.OS === 'ios'
    });
  }, [selectedIndex, itemHeight]);
  return /*#__PURE__*/React.createElement(View, _extends({
    style: [styles.container, {
      height: containerHeight
    }, containerStyle]
  }, containerProps), /*#__PURE__*/React.createElement(View, {
    style: [styles.selectedIndicator, selectedIndicatorStyle, {
      transform: [{
        translateY: -itemHeight / 2
      }],
      height: itemHeight
    }],
    className: selectedIndicatorClassName
  }), /*#__PURE__*/React.createElement(Animated.FlatList, _extends({}, flatListProps, {
    ref: flatListRef,
    nestedScrollEnabled: true,
    style: styles.scrollView,
    showsVerticalScrollIndicator: false,
    onScroll: Animated.event([{
      nativeEvent: {
        contentOffset: {
          y: scrollY
        }
      }
    }], {
      useNativeDriver: true
    }),
    onScrollEndDrag: handleScrollEndDrag,
    onMomentumScrollBegin: handleMomentumScrollBegin,
    onMomentumScrollEnd: handleMomentumScrollEnd,
    snapToOffsets: offsets,
    decelerationRate: decelerationRate,
    initialScrollIndex: selectedIndex,
    getItemLayout: (_, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index
    }),
    data: paddedOptions,
    keyExtractor: (item, index) => item ? `${item.value}-${item.text}-${index}` : `null-${index}`,
    renderItem: ({
      item: option,
      index
    }) => /*#__PURE__*/React.createElement(WheelPickerItem, {
      key: `option-${index}`,
      index: index,
      option: option,
      style: itemStyle,
      textStyle: itemTextStyle,
      textClassName: itemTextClassName,
      height: itemHeight,
      currentScrollIndex: currentScrollIndex,
      scaleFunction: scaleFunction,
      rotationFunction: rotationFunction,
      opacityFunction: opacityFunction,
      visibleRest: visibleRest
    })
  })));
};
export default /*#__PURE__*/memo(WheelPicker);
//# sourceMappingURL=wheel-picker.js.map