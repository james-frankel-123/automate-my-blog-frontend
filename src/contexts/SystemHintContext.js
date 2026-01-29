/**
 * SystemHintContext — one consistent slot for hints, confirmations, and non-critical errors.
 * Any component can set a one-line message that appears in the hint strip below the header.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SystemHintContext = createContext(null);

export function SystemHintProvider({ children }) {
  const [hint, setHintState] = useState({ message: null, variant: 'hint', duration: 0 });
  const timerRef = useRef(null);

  const clearHint = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHintState({ message: null, variant: 'hint', duration: 0 });
  }, []);

  const setHint = useCallback((message, variant = 'hint', duration = 5000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHintState({ message, variant, duration });
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setHintState((prev) => (prev.message === message ? { message: null, variant: 'hint', duration: 0 } : prev));
        timerRef.current = null;
      }, duration);
    }
  }, []);

  const value = { hint, setHint, clearHint };
  return (
    <SystemHintContext.Provider value={value}>
      {children}
    </SystemHintContext.Provider>
  );
}

export function useSystemHint() {
  const ctx = useContext(SystemHintContext);
  if (!ctx) return { hint: { message: null, variant: 'hint', duration: 0 }, setHint: () => {}, clearHint: () => {} };
  return ctx;
}

export default SystemHintContext;
