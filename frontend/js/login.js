'use strict';

(function () {
  const { useState } = React;
  const { h, api, saveSession } = PF;

  function LoginBlobs() {
    return h(
      'div',
      { className: 'login-blobs', 'aria-hidden': 'true' },
      h('div', { className: 'login-blob login-blob-1' }),
      h('div', { className: 'login-blob login-blob-2' }),
      h('div', { className: 'login-blob login-blob-3' }),
      h('div', { className: 'login-blob login-blob-4' }),
      h('div', { className: 'login-blob login-blob-5' }),
      h('div', { className: 'login-blob login-blob-6' })
    );
  }

  function LoginPage() {
    const [usuario, setUsuario] = useState('fernando.alves');
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
      h(LoginBlobs),
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
          h('p', { className: 'login-sub' }, 'Espelho de Frete'),
          erro && h('div', { className: 'alert alert-error' }, '⚠ ', erro),
          h(
            'form',
            { onSubmit: submit },
            h(
              'div',
              { className: 'field' },
              h('label', { className: 'field-label' }, 'Usuário'),
              h('input', {
                type: 'text',
                autoCapitalize: 'none',
                autoCorrect: 'off',
                spellCheck: false,
                value: usuario,
                onChange: (e) => setUsuario(e.target.value),
                placeholder: 'fernando.alves',
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
                  value: senha,
                  onChange: (e) => setSenha(e.target.value),
                  placeholder: '••••••',
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
                  mostrarSenha ? '🙈' : '👁'
                )
              )
            ),
            h(
              'button',
              { className: 'btn btn-primary btn-full', type: 'submit', disabled: loading },
              loading ? h('div', { className: 'spin' }) : '→  Entrar'
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
