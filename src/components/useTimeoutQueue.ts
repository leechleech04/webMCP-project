import { useCallback, useEffect, useRef } from "react";

export const useTimeoutQueue = () => {
  const timers = useRef<Set<number>>(new Set());
  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout);
    timers.current.clear();
  }, []);

  return useCallback((callback: () => void, delay: number) => {
    timers.current.forEach(window.clearTimeout);
    timers.current.clear();
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
  }, []);
};
