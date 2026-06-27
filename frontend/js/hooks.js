'use strict';
window.PF = window.PF || {};

PF.useDebounce = function useDebounce(val, delay) {
  const { useState, useEffect } = React;
  const [dv, setDv] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDv(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return dv;
};
