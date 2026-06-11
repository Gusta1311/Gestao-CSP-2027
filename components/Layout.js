import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/calendario', icon: '📅', label: 'Calendário' },
  { href: '/eventos', icon: '🎉', label: 'Eventos' },
  { href: '/reunioes', icon: '🤝', label: 'Reuniões' },
  { href: '/indicadores', icon: '📈', label: 'Indicadores' },
  { href: '/projetos', icon: '🔬', label: 'Projetos' },
  { href: '/checklist', icon: '✅', label: 'Checklist' },
];

const COORD_ITEMS = [
  { href: '/equipe', icon: '👩‍🏫', label: 'Equipe' },
];

export default function Layout({ children, title = 'CSP Gestão 2027', subtitle = '' }) {
  const { user, profile, loading, signOut, updateProfile, isCoord } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [nomeEdit, setNomeEdit] = useState('');
  const [savingNome, setSavingNome] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Carregando...</span>
      </div>
    );
  }

  function getInitials(nome) {
    if (!nome) return '?';
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  function getRoleLabel(role) {
    const map = { coordenadora: 'Coordenadora', direcao: 'Direção', professor: 'Professor(a)' };
    return map[role] || role;
  }

  return (
    <>
      <Head>
        <title>{title} — CSP 2027</title>
      </Head>
      <div className="app-layout">
        {/* OVERLAY MOBILE */}
        <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* SIDEBAR */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-logo">
            <div className="csp-logo-letters">
              <span className="c">c</span><span className="s">s</span><span className="p">p</span>
            </div>
            <div className="sidebar-logo-text">
              <strong>Colégio São Paulo</strong>
              <span>Gestão 2027</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Principal</div>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${router.pathname === item.href ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {isCoord && (
              <>
                <div className="nav-section-label" style={{ marginTop: '8px' }}>Administração</div>
                {COORD_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item${router.pathname === item.href ? ' active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>

          <div className="sidebar-user">
            <div
              className="sidebar-user-info"
              style={{ cursor: 'pointer' }}
              title="Clique para editar seu nome"
              onClick={() => { setNomeEdit(profile?.nome || ''); setShowProfile(true); }}
            >
              <div className="sidebar-avatar">{getInitials(profile?.nome)}</div>
              <div>
                <div className="sidebar-user-name">{profile?.nome || 'Usuário'} ✏️</div>
                <div className="sidebar-user-role">{getRoleLabel(profile?.role)}</div>
              </div>
            </div>
            <button className="sidebar-logout" onClick={signOut}>
              🚪 Sair do sistema
            </button>
          </div>
        </aside>

        {/* MAIN */}
        {/* MODAL EDITAR PERFIL */}
        {showProfile && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowProfile(false)}>
            <div className="modal" style={{ maxWidth: '360px' }}>
              <div className="modal-header">
                <h3>Meu Perfil</h3>
                <button className="modal-close" onClick={() => setShowProfile(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome de exibição</label>
                  <input
                    className="form-control"
                    value={nomeEdit}
                    onChange={e => setNomeEdit(e.target.value)}
                    placeholder="Seu nome completo"
                    autoFocus
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--cinza-texto)' }}>
                  E-mail: {user?.email}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowProfile(false)}>Cancelar</button>
                <button
                  className="btn btn-primary"
                  disabled={savingNome || !nomeEdit.trim()}
                  onClick={async () => {
                    setSavingNome(true);
                    await updateProfile(nomeEdit.trim());
                    setSavingNome(false);
                    setShowProfile(false);
                  }}
                >
                  {savingNome ? 'Salvando...' : '✅ Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
                <span /><span /><span />
              </button>
              <div>
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--cinza-texto)' }}>
              📅 {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="page-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
