'use strict';
window.PF = window.PF || {};

PF.EspelhoFrete = function EspelhoFrete({ resultado, form, clienteSel, cidadeSel, loading, onLimpar, onPdf }) {
  const { h, brl, num3 } = PF;
  const filled = !!resultado;
  const ph = (v) => (filled ? v : h('span', { className: 'is-ph' }, v === '—' || v == null || v === '' ? '—' : v));
  const codigo = filled ? resultado.entrada.codigoM3 : form.codigoM3 || '—';
  const destino = filled
    ? `${resultado.destino.cidade} / ${resultado.destino.uf}`
    : cidadeSel
      ? `${cidadeSel.nome} / ${cidadeSel.uf}`
      : '—';
  const meso = filled ? resultado.destino.meso : cidadeSel?.meso_nome || '—';
  const cliente = filled
    ? resultado.cliente.nome
    : clienteSel
      ? clienteSel.nome_fantasia || clienteSel.nome
      : '—';
  const volume = filled ? `${num3(resultado.entrada.m3)} m³` : form.m3 ? `${num3(form.m3)} m³` : '—';
  const valorNf = filled ? brl(resultado.entrada.valorNF) : form.valorNF ? brl(parseFloat(form.valorNF)) : '—';
  const tarifa = filled
    ? `${resultado.tarifa.valorM3.toFixed(2)} · faixa ${resultado.tarifa.faixaMin}–${resultado.tarifa.faixaMax}`
    : '—';
  const showPalet = filled ? resultado.cliente.paletizado : !!clienteSel?.paletizado;
  const showDedic = filled ? resultado.cliente.dedicado : !!clienteSel?.dedicado;
  const comp = filled ? resultado.componentes : null;
  const totais = filled ? resultado.totais : null;
  const rowOp = (k, v) =>
    h(
      'div',
      { className: 'result-row' },
      h('span', { className: 'result-row-k' }, k),
      h('span', { className: 'result-row-v' + (!filled && v === '—' ? ' is-ph' : '') }, v)
    );
  const rowVal = (k, v) =>
    h(
      'div',
      { className: 'result-row' },
      h('span', { className: 'result-row-k' }, k),
      h('span', { className: 'result-row-v' }, filled ? v : ph('—'))
    );

  return h(
    'div',
    { className: `result-card ${filled ? '' : 'preview'} ${loading ? 'is-loading' : ''}` },
    h(
      'div',
      { className: 'result-head' },
      h(
        'div',
        null,
        h('div', { className: 'result-head-label' }, 'Espelho de Frete'),
        h('div', { className: `result-head-code${!filled && codigo === '—' ? ' empty' : ''}` }, codigo),
        h(
          'div',
          { className: 'result-head-dest' },
          filled ? `${destino}  ·  ${meso}` : `${destino}${meso !== '—' ? '  ·  ' + meso : ''}`
        )
      ),
      h(
        'div',
        null,
        h('div', { className: 'result-total-label' }, 'Total do Frete'),
        h('div', { className: `result-total-val ${filled ? '' : 'empty'}` }, filled ? brl(totais.vlTotal) : 'R$ —')
      )
    ),
    h(
      'div',
      { className: 'result-grid' },
      h(
        'div',
        { className: 'result-section' },
        h('div', { className: 'result-section-title' }, 'Dados da Operação'),
        rowOp('Cliente', cliente),
        rowOp('Destino', destino),
        rowOp('Messorregião', meso),
        rowOp('Volume', volume),
        rowOp('Valor da NF', valorNf),
        rowOp('Tarifa R$/m³', tarifa)
      ),
      h(
        'div',
        { className: 'result-section' },
        h('div', { className: 'result-section-title' }, 'Componentes do Frete'),
        rowVal('Frete Peso', filled ? brl(comp.fretePeso) : null),
        rowVal('Ad Valorem (0,05%)', filled ? brl(comp.advalorem) : null),
        rowVal('Pedágio', filled ? brl(comp.pedagio) : null),
        showPalet && rowVal('Paletização (R$38,60/m³)', filled ? brl(comp.paletizacao) : null),
        showDedic && rowVal('Dedicado (+10%)', filled ? brl(comp.dedicado) : null)
      ),
      h(
        'div',
        { className: 'result-full' },
        h('div', { className: 'result-section-title' }, 'Resumo de Valores'),
        h(
          'div',
          { className: 'result-row hl' },
          h('span', { className: 'result-row-k' }, 'Frete sem ICMS'),
          h('span', { className: 'result-row-v' }, filled ? brl(totais.vlSemIcms) : ph('—'))
        ),
        h(
          'div',
          { className: 'result-row icms' },
          h(
            'span',
            { className: 'result-row-k' },
            filled ? `ICMS ${(totais.aliquotaIcms * 100).toFixed(0)}% (por dentro)` : 'ICMS (por dentro)'
          ),
          h('span', { className: 'result-row-v' }, filled ? brl(totais.vlIcms) : ph('—'))
        )
      )
    ),
    h(
      'div',
      { className: 'result-footer' },
      h('span', { className: 'result-footer-k' }, '💰 VALOR TOTAL DO FRETE'),
      h('span', { className: `result-footer-v ${filled ? '' : 'empty'}` }, filled ? brl(totais.vlTotal) : 'R$ —')
    ),
    filled
      ? h(
          'div',
          { className: 'result-actions' },
          h('button', { className: 'btn btn-primary btn-sm', onClick: onPdf }, '📄 Baixar PDF'),
          h('button', { className: 'btn btn-outline btn-sm', onClick: () => window.print() }, '🖨 Imprimir'),
          h('button', { className: 'btn btn-ghost btn-sm', onClick: onLimpar }, '+ Novo Cálculo')
        )
      : h(
          'div',
          { className: 'result-preview-hint' },
          'Preencha o formulário à esquerda e clique em Calcular Frete para gerar o espelho.'
        )
  );
};
