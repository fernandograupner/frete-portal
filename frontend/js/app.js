'use strict';

(function () {
  const { useState } = React;
  const { h, clearSession, Calculadora, Historico, Admin } = PF;

  const session = PF.getSession();
  if (!session.token || !session.usuario) {
    window.location.replace('login.html');
    return;
  }

  const { token: initialToken, usuario: initialUsuario } = session;

  function App() {
    const [token] = useState(initialToken);
    const [usuario] = useState(initialUsuario);
    const [tab, setTab] = useState('calc');
    const [refreshHist, setRefreshHist] = useState(0);
    const emptyForm = { codigoM3: '', valorNF: '', m3: '', qtdePallets: '' };
    const [calcForm, setCalcForm] = useState(emptyForm);
    const [calcCliente, setCalcCliente] = useState(null);
    const [calcCidade, setCalcCidade] = useState(null);
    const [calcResultado, setCalcResultado] = useState(null);
    const [calcResetKey, setCalcResetKey] = useState(0);

    const logout = () => {
      clearSession();
      window.location.href = 'login.html';
    };

    return h(
      'div',
      { className: 'app-shell' },
      h(
        'div',
        { className: 'topbar' },
        h(
          'div',
          { className: 'tb-brand' },
          h('div', { className: 'tb-logo' }, 'PF'),
          h('span', { className: 'tb-name' }, 'Portal ', h('em', null, 'Frete'))
        ),
        h(
          'div',
          { className: 'tb-nav' },
          h(
            'button',
            { type: 'button', className: `tb-btn ${tab === 'calc' ? 'on' : ''}`, onClick: () => setTab('calc') },
            'Calcular'
          ),
          h(
            'button',
            {
              type: 'button',
              className: `tb-btn ${tab === 'hist' ? 'on' : ''}`,
              onClick: () => {
                setTab('hist');
                setRefreshHist((r) => r + 1);
              },
            },
            'Histórico'
          ),
          usuario.perfil === 'admin' &&
            h(
              'button',
              { type: 'button', className: `tb-btn ${tab === 'admin' ? 'on' : ''}`, onClick: () => setTab('admin') },
              'Admin'
            )
        ),
        h(
          'div',
          { className: 'tb-right' },
          h('span', { className: 'tb-chip' }, usuario.nome),
          h('button', { type: 'button', className: 'tb-out', onClick: logout }, 'Sair')
        )
      ),
      tab === 'calc' &&
        h(Calculadora, {
          token,
          onNovoCalculo: () => setRefreshHist((r) => r + 1),
          form: calcForm,
          setForm: setCalcForm,
          clienteSel: calcCliente,
          setClienteSel: setCalcCliente,
          cidadeSel: calcCidade,
          setCidadeSel: setCalcCidade,
          resultado: calcResultado,
          setResultado: setCalcResultado,
          resetKey: calcResetKey,
          setResetKey: setCalcResetKey,
        }),
      tab === 'hist' && h(Historico, { token, refresh: refreshHist }),
      tab === 'admin' && usuario.perfil === 'admin' && h(Admin, { token, usuarioAtual: usuario })
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
