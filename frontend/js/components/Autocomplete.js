'use strict';
window.PF = window.PF || {};

PF.Autocomplete = function Autocomplete({ label, placeholder, buscar, renderItem, getLabel, onSelect, resetKey }) {
  const { useState, useEffect, useRef } = React;
  const { h, useDebounce } = PF;
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrap = useRef(null);
  const dq = useDebounce(q, 280);

  useEffect(() => {
    setQ('');
    setItems([]);
    setOpen(false);
  }, [resetKey]);

  useEffect(() => {
    const hh = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', hh);
    return () => document.removeEventListener('mousedown', hh);
  }, []);

  useEffect(() => {
    if (dq.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    buscar(dq)
      .then((r) => {
        setItems(r);
        setOpen(r.length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dq]);

  const select = (item) => {
    setQ(getLabel(item));
    setOpen(false);
    onSelect(item);
  };

  return h(
    'div',
    { className: 'field' },
    h('label', { className: 'field-label' }, label),
    h(
      'div',
      { className: 'ac-wrap', ref: wrap },
      h(
        'div',
        { style: { position: 'relative' } },
        h('input', {
          type: 'text',
          placeholder,
          value: q,
          autoComplete: 'off',
          onChange: (e) => {
            setQ(e.target.value);
            if (e.target.value.length > 1) setOpen(true);
          },
        }),
        loading &&
          h(
            'div',
            { style: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' } },
            h('div', { className: 'spin', style: { width: 14, height: 14 } })
          )
      ),
      open &&
        items.length > 0 &&
        h(
          'div',
          { className: 'ac-drop' },
          items.map((item, i) =>
            h('div', { key: i, className: 'ac-item', onMouseDown: () => select(item) }, renderItem(item))
          )
        ),
      open &&
        items.length === 0 &&
        !loading &&
        dq.length >= 2 &&
        h('div', { className: 'ac-drop' }, h('div', { className: 'ac-empty' }, 'Nenhum resultado'))
    )
  );
};
