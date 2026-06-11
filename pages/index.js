import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError('E-mail ou senha incorretos. Verifique seus dados.');
    } else {
      router.push('/dashboard');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span style={{ color: 'white' }}>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login — CSP Gestão 2027</title>
        <meta name="description" content="Sistema de Gestão Escolar Colégio São Paulo 2027" />
      </Head>
      <div className="login-page">
        <div className="login-box">
          <div className="login-logo">
            <div className="login-logo-letters">
              <span className="c">c</span><span className="s">s</span><span className="p">p</span>
            </div>
            <div className="login-logo-subtitle">Colégio São Paulo</div>
          </div>

          <h2 className="login-title">Bem-vinda ao Sistema CSP</h2>
          <p className="login-desc">Gestão Escolar · Ano Letivo 2027</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-control"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Entrando...' : '🔐 Entrar no Sistema'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#9E9E9E' }}>
            Dificuldades de acesso? Contate a coordenação.
          </p>
        </div>
      </div>
    </>
  );
}
