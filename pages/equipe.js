import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

const ROLES = ['coordenadora','direcao','professor'];
const EMPTY = { nome: '', email: '', role: 'professor', turma: '' };

export default function Equipe() {
  const { isCoord } = useAuth();
  const router = useRouter();
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCoord) { router.replace('/dashboard'); return; }
    loadEquipe();
  }, [isCoord]);

  async function loadEquipe() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('nome');
    setEquipe(data || []);
    setLoading(false);
  }

  async function saveUser() {
    if (!form.email || !form.nome) return;
    setSaving(true); setError('');
    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, nome: form.nome, role: form.role })
    });
    const data = await res.json();
    if (!res.ok) {
      setError('Erro ao convidar: ' + data.error);
    } else {
      setMsg('Convite enviado para ' + form.email);
      setShowModal(false);
      setForm(EMPTY);
      loadEquipe();
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 4000);
  }

  async function updateRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    loadEquipe();
  }

  function roleLabel(r) { return { coordenadora:'Coordenadora', direcao:'Direção', professor:'Professor(a)' }[r]||r; }
  function roleColor(r) { return { coordenadora:'azul', direcao:'roxo', professor:'verde' }[r]||'cinza'; }
  function initials(nome) { return nome?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() || '?'; }

  return (
    <Layout title="Equipe" subtitle="Gerenciamento de usuários do sistema CSP 2027">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>{equipe.length} membro(s) na equipe</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Convidar Usuário</button>
      </div>

      {msg && <div className="alert alert-success">✅ {msg}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="grid-3">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : equipe.map(u => (
          <div className="card" key={u.id} style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', background: 'var(--azul)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '16px', flexShrink: 0
              }}>
                {initials(u.nome)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{u.nome}</div>
                <div style={{ fontSize: '11px', color: 'var(--cinza-texto)' }}>{u.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge badge-${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '3px 8px', fontSize: '11px' }}
                value={u.role}
                onChange={e => updateRole(u.id, e.target.value)}
              >
                {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
            {u.turma && <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--cinza-texto)' }}>Turma: {u.turma}</div>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Convidar Novo Usuário</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                O usuário receberá um e-mail para definir sua senha e acessar o sistema.
              </div>
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input className="form-control" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Papel no sistema</label>
                <select className="form-control" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveUser} disabled={saving || !form.email || !form.nome}>
                {saving ? 'Enviando...' : '📨 Enviar Convite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
