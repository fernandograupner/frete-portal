// ─── Constantes de negócio ───────────────────────────────────
const PALETIZACAO_POR_M3 = 38.60;
const ADVALOREM_PERC     = 0.0005;
const DEDICADO_ADICIONAL = 0.10;

function arred(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }

async function buscarTarifa(db, mesoId, m3) {
  const [rows] = await db.execute(
    `SELECT * FROM tarifas
     WHERE meso_id = ? AND faixa_min <= ? AND faixa_max >= ?
       AND (vigencia_fim IS NULL OR vigencia_fim >= CURDATE())
     ORDER BY vigencia_ini DESC LIMIT 1`,
    [mesoId, m3, m3]
  );
  if (!rows.length) throw new Error(`Tarifa não encontrada para messorregião ${mesoId} com ${m3} m³`);
  return rows[0];
}

async function buscarPedagio(db, mesoId) {
  const [rows] = await db.execute(
    `SELECT valor_por_m3 FROM pedagios
     WHERE meso_id = ? AND (vigencia_fim IS NULL OR vigencia_fim >= CURDATE())
     ORDER BY vigencia_ini DESC LIMIT 1`,
    [mesoId]
  );
  return rows.length ? parseFloat(rows[0].valor_por_m3) : 0;
}

async function buscarIcms(db, uf) {
  const [rows] = await db.execute('SELECT aliquota FROM icms_uf WHERE uf = ?', [uf]);
  if (!rows.length) throw new Error(`Alíquota ICMS não cadastrada para ${uf}`);
  return parseFloat(rows[0].aliquota);
}

async function calcularFrete(db, entrada) {
  const { codigoM3, valorNF, m3, clienteId, cidadeId, qtdePallets = 0, usuarioId } = entrada;

  const uid = Number(usuarioId);
  if (!Number.isFinite(uid)) throw new Error('Usuário inválido para gravar o cálculo.');

  if (!codigoM3?.trim()) throw new Error('Código M3 é obrigatório.');
  if (!valorNF || valorNF <= 0) throw new Error('Valor da NF deve ser maior que zero.');
  if (!m3 || m3 <= 0)          throw new Error('Volume M3 deve ser maior que zero.');
  if (!clienteId)              throw new Error('Selecione um cliente.');
  if (!cidadeId)               throw new Error('Selecione a cidade de destino.');

  const [cliRows] = await db.execute(
    `SELECT c.*, ci.nome AS cidade_nome, ci.meso_id, m.nome AS meso_nome
     FROM clientes c
     LEFT JOIN cidades ci ON ci.id = c.cidade_id
     LEFT JOIN messorregioes m ON m.id = ci.meso_id
     WHERE c.id = ? AND c.ativo = 1`,
    [clienteId]
  );
  if (!cliRows.length) throw new Error('Cliente não encontrado.');
  const cliente = cliRows[0];

  const [cidRows] = await db.execute(
    `SELECT ci.*, m.nome AS meso_nome
     FROM cidades ci
     LEFT JOIN messorregioes m ON m.id = ci.meso_id
     WHERE ci.id = ?`,
    [cidadeId]
  );
  if (!cidRows.length) throw new Error('Cidade não encontrada.');
  const cidade = cidRows[0];

  const tarifa       = await buscarTarifa(db, cidade.meso_id, m3);
  const vlFretePeso  = arred(m3 * parseFloat(tarifa.valor_m3));
  const vlAdvalorem  = arred(valorNF * ADVALOREM_PERC);
  const pedagioM3    = await buscarPedagio(db, cidade.meso_id);
  const vlPedagio    = arred(m3 * pedagioM3);

  let vlPaletizacao = 0;
  if (cliente.paletizado) {
    if (!qtdePallets || qtdePallets <= 0) throw new Error('Informe a quantidade de pallets.');
    vlPaletizacao = arred(PALETIZACAO_POR_M3 * m3);
  }

  const subtotalBase = arred(vlFretePeso + vlAdvalorem + vlPedagio + vlPaletizacao);
  const vlDedicado   = cliente.dedicado ? arred(subtotalBase * DEDICADO_ADICIONAL) : 0;
  const vlSemIcms    = arred(subtotalBase + vlDedicado);
  const aliquotaIcms = await buscarIcms(db, cidade.uf);
  const vlTotal      = arred(vlSemIcms / (1 - aliquotaIcms));
  const vlIcms       = arred(vlTotal - vlSemIcms);

  const resultado = {
    sucesso: true,
    entrada:   { codigoM3, valorNF, m3, qtdePallets },
    cliente:   { id: cliente.id, nome: cliente.nome_fantasia || cliente.nome, municipio: cliente.municipio, uf: cliente.uf, paletizado: !!cliente.paletizado, dedicado: !!cliente.dedicado },
    destino:   { cidadeId: cidade.id, cidade: cidade.nome, uf: cidade.uf, mesoId: cidade.meso_id, meso: cidade.meso_nome },
    tarifa:    { faixaMin: tarifa.faixa_min, faixaMax: tarifa.faixa_max, valorM3: parseFloat(tarifa.valor_m3) },
    componentes: { fretePeso: vlFretePeso, advalorem: vlAdvalorem, pedagio: vlPedagio, paletizacao: vlPaletizacao, dedicado: vlDedicado },
    totais:    { vlSemIcms, aliquotaIcms, vlIcms, vlTotal },
  };

  const [ins] = await db.execute(
    `INSERT INTO calculos
     (usuario_id,cliente_id,cidade_id,codigo_m3,valor_nf,m3,
      paletizado,qtde_pallets,dedicado,
      vl_frete_peso,vl_advalorem,vl_pedagio,vl_paletizacao,vl_dedicado,
      vl_sem_icms,aliquota_icms,vl_icms,vl_total,tarifa_m3_usada,snapshot_json)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [uid,clienteId,cidadeId,codigoM3,valorNF,m3,
     cliente.paletizado?1:0,qtdePallets,cliente.dedicado?1:0,
     vlFretePeso,vlAdvalorem,vlPedagio,vlPaletizacao,vlDedicado,
     vlSemIcms,aliquotaIcms,vlIcms,vlTotal,tarifa.valor_m3,JSON.stringify(resultado)]
  );

  resultado.calculoId = ins.insertId;
  return resultado;
}

module.exports = { calcularFrete };
