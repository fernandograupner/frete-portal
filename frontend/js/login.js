'use strict';

(function () {
  const { useState } = React;
  const { h, api, saveSession } = PF;

  function IconEye(hidden) {
    if (hidden) {
      return h(
        'svg',
        { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true },
        h('path', { d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' }),
        h('line', { x1: 1, y1: 1, x2: 23, y2: 23 })
      );
    }
    return h(
      'svg',
      { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true },
      h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
      h('circle', { cx: 12, cy: 12, r: 3 })
    );
  }

  function LoginBackdrop() {
    return h('div', { className: 'login-backdrop', 'aria-hidden': 'true' });
  }

  function LoginPage() {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      setErro('');
      setLoading(true);
      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ login: usuario.trim().toLowerCase(), senha }),
        });
        saveSession(data.token, data.usuario);
        window.location.href = 'app.html';
      } catch (err) {
        setErro(err.message);
      }
      setLoading(false);
    };

    return h(
      'div',
      { className: 'login-page' },
      h(LoginBackdrop),
      h(
        'div',
        { className: 'login-box-wrap' },
        h(
          'div',
          { className: 'login-box' },
          h(
            'div',
            { className: 'login-logo-row' },
            h('div', { className: 'login-logo-sq' }, 'PF'),
            h('div', { className: 'login-title' }, 'Portal Frete')
          ),
          h('p', { className: 'login-sub' }, 'Acesso corporativo · Espelho de Frete'),
          erro && h('div', { className: 'alert alert-error' }, erro),
          h(
            'form',
            { onSubmit: submit, autoComplete: 'on' },
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'Usuário'),
              h('input', {
                type: 'text',
                name: 'username',
                autoCapitalize: 'none',
                autoCorrect: 'off',
                spellCheck: false,
                value: usuario,
                onChange: (e) => setUsuario(e.target.value),
                placeholder: 'seu.usuario',
                autoComplete: 'username',
                required: true,
              })
            ),
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'Senha'),
              h(
                'div',
                { className: 'pwd-field' },
                h('input', {
                  type: mostrarSenha ? 'text' : 'password',
                  name: 'password',
                  value: senha,
                  onChange: (e) => setSenha(e.target.value),
                  placeholder: 'Digite sua senha',
                  required: true,
                  autoComplete: 'current-password',
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'pwd-toggle',
                    onClick: () => setMostrarSenha((v) => !v),
                    title: mostrarSenha ? 'Ocultar senha' : 'Mostrar senha',
                    'aria-label': mostrarSenha ? 'Ocultar senha' : 'Mostrar senha',
                  },
                  h(IconEye, mostrarSenha)
                )
              )
            ),
            h(
              'button',
              { className: 'btn btn-primary btn-full', type: 'submit', disabled: loading },
              loading ? h('div', { className: 'spin' }) : 'Entrar'
            )
          )
        )
      )
    );
  }

  const session = PF.getSession();
  if (session.token && session.usuario) {
    window.location.replace('app.html');
    return;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(LoginPage));
})();
