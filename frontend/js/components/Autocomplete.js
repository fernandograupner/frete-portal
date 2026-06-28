'use strict';
window.PF = window.PF || {};

PF.Autocomplete = function Autocomplete({
  label,
  placeholder,
  buscar,
  renderItem,
  getLabel,
  onSelect,
  onClear,
  selectedLabel,
  resetKey,
  showListButton = false,
  listButtonLabel = 'Lista',
}) {
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

  const abrirLista = async () => {
    setLoading(true);
    try {
      const r = await buscar('');
      setItems(r || []);
      setOpen(true);
    } catch {
      setItems([]);
      setOpen(false);
    }
    setLoading(false);
  };

  const limparCampo = () => {
    setQ('');
    setItems([]);
    setOpen(false);
    if (onClear) onClear();
  };

  const inputEl = h('input', {
    type: 'text',
    placeholder,
    value: q,
    autoComplete: 'off',
    name: 'pf-ac-' + String(label || 'field').replace(/\s+/g, '-').toLowerCase(),
    onChange: (e) => {
      const v = e.target.value;
      if (selectedLabel && v !== selectedLabel && onClear) onClear();
      setQ(v);
      if (!v.trim() && onClear) onClear();
      else if (v.length > 1) setOpen(true);
    },
  });

  const clearBtn =
    q.length > 0 &&
    h(
      'button',
      {
        type: 'button',
        className: 'ac-clear-btn',
        onClick: limparCampo,
        title: 'Limpar seleção',
        'aria-label': 'Limpar seleção',
      },
      h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true },
        h('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
        h('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
      )
    );

  const inputWrap = h(
    'div',
    { className: showListButton ? 'ac-input-cell' : '', style: showListButton ? undefined : { position: 'relative' } },
    inputEl,
    clearBtn,
    loading &&
      h(
        'div',
        { className: 'ac-loading', style: { right: q.length > 0 ? 34 : 10 } },
        h('div', { className: 'spin', style: { width: 14, height: 14 } })
      )
  );

  return h(
    'div',
    { className: 'field' },
    h('label', { className: 'field-label' }, label),
    h(
      'div',
      { className: 'ac-wrap', ref: wrap },
      showListButton
        ? h(
            'div',
            { className: 'ac-input-row' },
            inputWrap,
            h(
              'button',
              {
                type: 'button',
                className: 'btn btn-outline btn-sm ac-list-btn',
                onClick: abrirLista,
                title: 'Exibir lista completa',
              },
              listButtonLabel
            )
          )
        : inputWrap,
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
        (dq.length >= 2 || showListButton) &&
        h('div', { className: 'ac-drop' }, h('div', { className: 'ac-empty' }, 'Nenhum resultado'))
    )
  );
};
