import { useEffect, useRef } from 'react';
export const usePrevious = value => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
//# sourceMappingURL=use-previous.js.map