'use strict';
window.PF = window.PF || {};

PF.Calculadora = function Calculadora({
  token,
  onNovoCalculo,
  form,
  setForm,
  clienteSel,
  setClienteSel,
  cidadeSel,
  setCidadeSel,
  resultado,
  setResultado,
  resetKey,
  setResetKey,
}) {
  const { useState, useCallback } = React;
  const { h, api, brl, Autocomplete, EspelhoFrete, gerarPDF } = PF;
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const buscarClientes = useCallback(
    async (q) => {
      const data = await api(`/clientes?busca=${encodeURIComponent(q)}`, {}, token);
      return data.dados;
    },
    [token]
  );

  const buscarCidades = useCallback(
    async (q) => {
      const data = await api(`/cidades?busca=${encodeURIComponent(q)}`, {}, token);
      return data.dados;
    },
    [token]
  );

  const onCliente = (c) => {
    setClienteSel(c);
    if (c.cidade_id)
      setCidadeSel({ id: c.cidade_id, nome: c.cidade_nome, uf: c.uf, meso_id: c.meso_id, meso_nome: c.meso_nome });
    else setCidadeSel(null);
  };

  const calcular = async () => {
    setErro('');
    setLoading(true);
    setResultado(null);
    try {
      const data = await api(
        '/calcular',
        {
          method: 'POST',
          body: JSON.stringify({
            codigoM3: form.codigoM3,
            valorNF: parseFloat(form.valorNF),
            m3: parseFloat(form.m3),
            clienteId: clienteSel?.id,
            cidadeId: cidadeSel?.id,
            qtdePallets: form.qtdePallets ? parseFloat(form.qtdePallets) : 0,
          }),
        },
        token
      );
      setResultado(data);
      onNovoCalculo && onNovoCalculo();
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  };

  const limpar = () => {
    setForm({ codigoM3: '', valorNF: '', m3: '', qtdePallets: '' });
    setClienteSel(null);
    setCidadeSel(null);
    setResultado(null);
    setErro('');
    setResetKey((k) => k + 1);
  };

  const ok = form.codigoM3 && form.valorNF && form.m3 && clienteSel && cidadeSel;

  return h(
    'div',
    { className: 'calc-wrap' },
    h(
      'div',
      { className: 'calc-left' },
      h(
        'div',
        { className: 'panel-header' },
        h('div', { className: 'panel-title' }, 'Novo Cálculo'),
        h('div', { className: 'panel-sub' }, 'Preencha os dados do embarque')
      ),
      h(
        'div',
        { className: 'form-inner' },
        h(
          'div',
          { className: 'field' },
          h('label', { className: 'field-label' }, 'Código M3 / Pedido'),
          h('input', {
            type: 'text',
            placeholder: 'Ex: PED-2026-001',
            value: form.codigoM3,
            onChange: (e) => set('codigoM3', e.target.value),
          })
        ),
        h(Autocomplete, {
          label: 'Cliente Destino',
          placeholder: 'Buscar por nome ou código…',
          resetKey,
          buscar: buscarClientes,
          onSelect: onCliente,
          getLabel: (c) => c.nome_fantasia || c.nome,
          renderItem: (c) =>
            h(
              'div',
              null,
              h(
                'div',
                { className: 'ac-main' },
                c.nome_fantasia || c.nome,
                c.paletizado && h('span', { className: 'chip chip-blue', style: { fontSize: 10 } }, 'PALET'),
                c.dedicado && h('span', { className: 'chip chip-teal', style: { fontSize: 10 } }, 'DEDIC')
              ),
              h('div', { className: 'ac-sub' }, `${c.municipio} / ${c.uf} · Cód ${c.codigo}`)
            ),
        }),
        clienteSel &&
          h(
            'div',
            { className: 'client-card' },
            h('div', { className: 'client-card-name' }, clienteSel.nome_fantasia || clienteSel.nome),
            h(
              'div',
              { className: 'client-card-tags' },
              h('span', { className: 'chip chip-gray' }, `📍 ${clienteSel.meso_nome || '—'}`),
              clienteSel.paletizado && h('span', { className: 'chip chip-blue' }, '📦 Paletizado'),
              clienteSel.dedicado && h('span', { className: 'chip chip-teal' }, '🚛 Dedicado'),
              h(
                'span',
                { className: `chip ${clienteSel.tipo_frete === 'CIF' ? 'chip-green' : 'chip-amber'}` },
                clienteSel.tipo_frete
              )
            )
          ),
        h('div', { className: 'sep' }),
        h(Autocomplete, {
          label: 'Cidade Destino',
          placeholder: 'Buscar cidade…',
          resetKey,
          buscar: buscarCidades,
          onSelect: setCidadeSel,
          getLabel: (c) => `${c.nome} / ${c.uf}`,
          renderItem: (c) =>
            h(
              'div',
              null,
              h('div', { className: 'ac-main' }, `${c.nome} / ${c.uf}`),
              h('div', { className: 'ac-sub' }, c.meso_nome)
            ),
        }),
        cidadeSel &&
          h(
            'div',
            { style: { fontSize: 11, color: 'var(--ink3)', margin: '-4px 0 8px', display: 'flex', gap: 8 } },
            h('span', null, `📍 ${cidadeSel.meso_nome}`),
            h('span', null, `· ${cidadeSel.uf}`)
          ),
        h('div', { className: 'sep' }),
        h(
          'div',
          { className: 'field-row' },
          h(
            'div',
            { className: 'field' },
            h('label', { className: 'field-label' }, 'Valor da NF (R$)'),
            h('input', {
              type: 'number',
              step: '.01',
              min: '0',
              placeholder: '0,00',
              value: form.valorNF,
              onChange: (e) => set('valorNF', e.target.value),
            })
          ),
          h(
            'div',
            { className: 'field' },
            h('label', { className: 'field-label' }, 'Volume (m³)'),
            h('input', {
              type: 'number',
              step: '.001',
              min: '0',
              placeholder: '0,000',
              value: form.m3,
              onChange: (e) => set('m3', e.target.value),
            })
          )
        ),
        clienteSel?.paletizado &&
          h(
            'div',
            { className: 'field' },
            h('label', { className: 'field-label' }, 'Qtde de Pallets'),
            h('input', {
              type: 'number',
              step: '1',
              min: '1',
              placeholder: 'Número de pallets',
              value: form.qtdePallets,
              onChange: (e) => set('qtdePallets', e.target.value),
            })
          ),
        h('div', { className: 'sep' }),
        erro && h('div', { className: 'alert alert-error' }, '⚠ ', erro),
        h(
          'div',
          { style: { display: 'flex', gap: 8 } },
          h(
            'button',
            { className: 'btn btn-primary', style: { flex: 1 }, onClick: calcular, disabled: !ok || loading },
            loading ? h('div', { className: 'spin' }) : '⚡ Calcular Frete'
          ),
          h('button', { className: 'btn btn-ghost', onClick: limpar, title: 'Limpar' }, '↺')
        )
      )
    ),
    h(
      'div',
      { className: 'calc-right' },
      loading && h('div', { className: 'calc-right-loading' }, h('div', { className: 'spin' }), 'Calculando frete…'),
      h(EspelhoFrete, {
        resultado,
        form,
        clienteSel,
        cidadeSel,
        loading,
        onLimpar: limpar,
        onPdf: () => gerarPDF(resultado),
      })
    )
  );
};
