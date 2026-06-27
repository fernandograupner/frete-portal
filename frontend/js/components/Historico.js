'use strict';
window.PF = window.PF || {};

PF.Historico = function Historico({ token, refresh }) {
  const { useState, useEffect, useCallback } = React;
  const { h, api, brl, num3, dt } = PF;
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [page, setPage] = useState(1);
  const [loadErr, setLoadErr] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const LIMITE = 20;

  const carregar = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try {
      const p = new URLSearchParams({ page: String(page), limite: String(LIMITE) });
      if (busca) p.append('busca', busca);
      if (de) p.append('de', de);
      if (ate) p.append('ate', ate);
      const data = await api(`/calculos?${p}`, {}, token);
      setDados(data.dados || []);
      setTotal(Number(data.total) || 0);
    } catch (e) {
      setLoadErr(e.message || 'Falha ao carregar histórico.');
      setDados([]);
      setTotal(0);
    }
    setLoading(false);
  }, [page, busca, de, ate, token, refresh]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return h(
    'div',
    { className: 'page-wrap' },
    h(
      'div',
      { className: 'page-header' },
      h('span', { className: 'page-title' }, 'Histórico de Cálculos'),
      h('span', { style: { fontSize: 12, color: 'var(--ink3)' } }, `${total} registros`)
    ),
    loadErr && h('div', { className: 'alert alert-error' }, loadErr),
    h(
      'div',
      { className: 'filters' },
      h('input', {
        type: 'text',
        placeholder: '🔍 Buscar M3 ou cliente…',
        value: busca,
        onChange: (e) => {
          setBusca(e.target.value);
          setPage(1);
        },
        style: { minWidth: 220 },
      }),
      h('input', { type: 'date', value: de, onChange: (e) => { setDe(e.target.value); setPage(1); } }),
      h('span', { style: { color: 'var(--ink3)', fontSize: 12 } }, 'até'),
      h('input', { type: 'date', value: ate, onChange: (e) => { setAte(e.target.value); setPage(1); } }),
      (busca || de || ate) &&
        h(
          'button',
          {
            className: 'btn btn-ghost btn-sm',
            onClick: () => {
              setBusca('');
              setDe('');
              setAte('');
              setPage(1);
            },
          },
          '✕ Limpar'
        )
    ),
    h(
      'div',
      { className: 'card' },
      loading
        ? h('div', { className: 'loading-row' }, h('div', { className: 'spin' }), 'Carregando…')
        : dados.length === 0
          ? h(
              'div',
              { className: 'empty-tbl' },
              h('span', { style: { fontSize: 32, opacity: 0.3 } }, '📭'),
              h('span', { style: { fontSize: 13 } }, 'Nenhum cálculo encontrado')
            )
          : h(
              'table',
              { className: 'tbl' },
              h(
                'thead',
                null,
                h(
                  'tr',
                  null,
                  ['Data', 'M3 / Pedido', 'Cliente', 'Destino', 'Volume', 'Frete s/ ICMS', 'ICMS', 'Total'].map((c) =>
                    h('th', { key: c }, c)
                  )
                )
              ),
              h(
                'tbody',
                null,
                dados.map((r) =>
                  h(
                    'tr',
                    {
                      key: r.id,
                      className: 'hist-row',
                      onClick: () => setDetalhe(r),
                      title: 'Clique para ver quem registrou',
                    },
                    h('td', null, h('span', { className: 'mono' }, dt(r.created_at))),
                    h('td', null, h('span', { className: 'mono', style: { fontWeight: 600 } }, r.codigo_m3)),
                    h('td', null, r.cliente_nome || r.cliente_razao),
                    h(
                      'td',
                      null,
                      r.cidade || '—',
                      ' ',
                      r.uf && h('span', { className: `uf-tag uf-${String(r.uf).toLowerCase()}` }, r.uf)
                    ),
                    h('td', null, h('span', { className: 'mono' }, `${num3(r.m3)} m³`)),
                    h('td', null, h('span', { className: 'mono' }, brl(r.vl_sem_icms))),
                    h('td', null, h('span', { className: 'mono', style: { color: 'var(--amber)' } }, brl(r.vl_icms))),
                    h('td', null, h('span', { className: 'val-pos' }, brl(r.vl_total)))
                  )
                )
              )
            )
    ),
    detalhe &&
      h(
        'div',
        {
          className: 'modal-bg',
          onClick: (e) => {
            if (e.target === e.currentTarget) setDetalhe(null);
          },
        },
        h(
          'div',
          { className: 'modal-box' },
          h('div', { className: 'modal-title' }, 'Registro do cálculo'),
          h(
            'div',
            { className: 'modal-scroll' },
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'M3 / Pedido'),
              h('p', { style: { fontSize: 14, fontWeight: 600, margin: 0 }, className: 'mono' }, detalhe.codigo_m3)
            ),
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'Data e hora'),
              h(
                'p',
                { style: { margin: 0, fontSize: 13 } },
                new Date(detalhe.created_at).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' })
              )
            ),
            h('div', { className: 'sep' }),
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'Registrado por'),
              h('p', { style: { margin: 0, fontSize: 13, fontWeight: 600 } }, detalhe.usuario || '—')
            ),
            detalhe.usuario_login &&
              h(
                'div',
                { className: 'field' },
                h('label', { className: 'field-label' }, 'Usuário (login)'),
                h('p', { style: { margin: 0, fontSize: 13 }, className: 'mono' }, detalhe.usuario_login)
              ),
            detalhe.usuario_email &&
              h(
                'div',
                { className: 'field' },
                h('label', { className: 'field-label' }, 'E-mail'),
                h('p', { style: { margin: 0, fontSize: 13 }, className: 'mono' }, detalhe.usuario_email)
              ),
            h('div', { className: 'sep' }),
            h(
              'div',
              { className: 'field-row' },
              h(
                'div',
                { className: 'field' },
                h('label', { className: 'field-label' }, 'Cliente'),
                h('p', { style: { margin: 0, fontSize: 12 } }, detalhe.cliente_nome || detalhe.cliente_razao || '—')
              ),
              h(
                'div',
                { className: 'field' },
                h('label', { className: 'field-label' }, 'Destino'),
                h('p', { style: { margin: 0, fontSize: 12 } }, `${detalhe.cidade || '—'} / ${detalhe.uf || '—'}`)
              )
            ),
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'Total do frete'),
              h(
                'p',
                { style: { margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--brand)' }, className: 'mono' },
                brl(detalhe.vl_total)
              )
            )
          ),
          h(
            'div',
            { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-primary', onClick: () => setDetalhe(null) }, 'Fechar')
          )
        )
      ),
    total > LIMITE &&
      h(
        'div',
        { className: 'pagination' },
        h('button', { className: 'btn btn-outline btn-xs', disabled: page === 1, onClick: () => setPage((p) => p - 1) }, '← Anterior'),
        h('span', null, `Pág ${page} de ${Math.ceil(total / LIMITE)}`),
        h(
          'button',
          {
            className: 'btn btn-outline btn-xs',
            disabled: page >= Math.ceil(total / LIMITE),
            onClick: () => setPage((p) => p + 1),
          },
          'Próxima →'
        )
      )
  );
};
