import { useEffect, useRef } from 'react';

export function useDomEvent<T extends keyof GlobalEventHandlersEventMap>(
  eventName: T,
  handler: (event: GlobalEventHandlersEventMap[T]) => void,
  element?: HTMLElement | Window | Document,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    const isSupported = targetElement && targetElement.addEventListener;
    
    if (!isSupported) return;

    const eventListener = (event: GlobalEventHandlersEventMap[T]) => {
      savedHandler.current(event);
    };

    targetElement.addEventListener(eventName, eventListener as EventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener as EventListener, options);
    };
  }, [eventName, element, options]);
}