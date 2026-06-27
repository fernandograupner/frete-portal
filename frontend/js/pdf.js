'use strict';
window.PF = window.PF || {};

PF.gerarPDF = function gerarPDF(resultado) {
  const { brl, num3 } = PF;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const prim = [31, 122, 98];
  const primEsc = [22, 88, 71];
  const preto = [40, 53, 49];
  const cinza = [95, 116, 108];
  const branco = [255, 255, 255];
  doc.setFillColor(...primEsc);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setFillColor(...prim);
  doc.rect(0, 35, 210, 2, 'F');
  doc.setFillColor(...prim);
  doc.roundedRect(14, 8, 18, 18, 3, 3, 'F');
  doc.setTextColor(...branco);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PF', 23, 20, { align: 'center' });
  doc.setFontSize(18);
  doc.text('PORTAL FRETE', 40, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Espelho de Frete', 40, 24);
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 188);
  doc.text(new Date().toLocaleString('pt-BR'), 196, 20, { align: 'right' });
  doc.setTextColor(...prim);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPELHO DE FRETE', 14, 48);
  doc.setTextColor(...preto);
  doc.setFontSize(22);
  doc.text(resultado.entrada.codigoM3, 14, 60);
  doc.setTextColor(...prim);
  doc.setFontSize(9);
  doc.text('TOTAL DO FRETE', 196, 48, { align: 'right' });
  doc.setFontSize(22);
  doc.text(brl(resultado.totais.vlTotal), 196, 60, { align: 'right' });
  doc.setDrawColor(...prim);
  doc.setLineWidth(0.5);
  doc.line(14, 65, 196, 65);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 68, 85, 65, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(14, 68, 85, 65);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cinza);
  doc.text('DADOS DA OPERAÇÃO', 18, 76);
  const dadosOp = [
    ['Cliente', resultado.cliente.nome],
    ['Destino', `${resultado.destino.cidade} / ${resultado.destino.uf}`],
    ['Messorregião', resultado.destino.meso],
    ['Volume', `${num3(resultado.entrada.m3)} m³`],
    ['Valor da NF', brl(resultado.entrada.valorNF)],
    ['Tarifa R$/m³', `${resultado.tarifa.valorM3.toFixed(2)} · faixa ${resultado.tarifa.faixaMin}–${resultado.tarifa.faixaMax}`],
  ];
  let y = 84;
  dadosOp.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cinza);
    doc.setFontSize(7.5);
    doc.text(k, 18, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...preto);
    doc.setFontSize(8);
    doc.text(String(v), 18, y + 5);
    y += 12;
  });
  doc.setFillColor(248, 250, 252);
  doc.rect(103, 68, 93, 65, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(103, 68, 93, 65);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cinza);
  doc.text('COMPONENTES DO FRETE', 107, 76);
  const comp = [
    ['Frete Peso', resultado.componentes.fretePeso],
    ['Ad Valorem (0,05%)', resultado.componentes.advalorem],
    ['Pedágio', resultado.componentes.pedagio],
  ];
  if (resultado.cliente.paletizado) comp.push(['Paletização (R$38,60/m³)', resultado.componentes.paletizacao]);
  if (resultado.cliente.dedicado) comp.push(['Dedicado (+10%)', resultado.componentes.dedicado]);
  let yc = 84;
  comp.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cinza);
    doc.setFontSize(7.5);
    doc.text(k, 107, yc);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...preto);
    doc.setFontSize(8);
    doc.text(brl(v), 193, yc + 5, { align: 'right' });
    yc += 12;
  });
  const rY = 140;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, rY, 182, 30, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, rY, 182, 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...preto);
  doc.setFontSize(9);
  doc.text('Frete sem ICMS', 18, rY + 10);
  doc.setTextColor(21, 128, 61);
  doc.text(brl(resultado.totais.vlSemIcms), 193, rY + 10, { align: 'right' });
  doc.setTextColor(...cinza);
  doc.setFontSize(8.5);
  doc.text(`ICMS ${(resultado.totais.aliquotaIcms * 100).toFixed(0)}% (por dentro)`, 18, rY + 22);
  doc.setTextColor(180, 83, 9);
  doc.text(brl(resultado.totais.vlIcms), 193, rY + 22, { align: 'right' });
  doc.setFillColor(...primEsc);
  doc.rect(14, 175, 182, 20, 'F');
  doc.setFillColor(...prim);
  doc.rect(14, 195, 182, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...branco);
  doc.setFontSize(11);
  doc.text('VALOR TOTAL DO FRETE', 18, 188);
  doc.setFontSize(16);
  doc.setTextColor(120, 212, 178);
  doc.text(brl(resultado.totais.vlTotal), 193, 188, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(...cinza);
  doc.text('Documento gerado pelo Portal Frete', 105, 210, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 216, { align: 'center' });
  doc.save(`espelho_${resultado.entrada.codigoM3}.pdf`);
};
