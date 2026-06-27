'use strict';
window.PF = window.PF || {};

PF.API_URL = window.location.protocol === 'file:'
  ? 'http://localhost:3001/api'
  : `${window.location.origin}/api`;

PF.api = async function api(path, opts = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(PF.API_URL + path, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(res.ok ? 'Resposta inválida do servidor.' : 'Erro HTTP ' + res.status);
  }
  if (!res.ok || data.sucesso === false)
    throw new Error(data.erro || 'Erro HTTP ' + res.status);
  return data;
};

PF.brl = (v) => (v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
PF.num3 = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 3 });
PF.dt = (d) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
PF.h = (tag, props, ...ch) => React.createElement(tag, props, ...ch);

PF.getSession = function () {
  const token = localStorage.getItem('frete_tk');
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem('frete_usr') || 'null');
  } catch {
    usuario = null;
  }
  return { token, usuario };
};

PF.saveSession = function (token, usuario) {
  localStorage.setItem('frete_tk', token);
  localStorage.setItem('frete_usr', JSON.stringify(usuario));
};

PF.clearSession = function () {
  localStorage.removeItem('frete_tk');
  localStorage.removeItem('frete_usr');
};
