import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const STATUS_LIST = ['Planejamento','Em execução','Concluído','Suspenso'];
const EMPTY = { nome: '', objetivo: '', disciplinas: '', turmas: '', data_inicio: '', data_fim: '', status: 'Planejamento', progresso: 0 };

export default function Projetos() {
  const { canEdit, user } = useAuth();
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadProjetos(); }, []);

  async function loadProjetos() {
    setLoading(true);
    const { data } = await supabase.from('projetos').select('*').order('created_at', { ascending: false });
    setProjetos(data || []);
    setLoading(false);
  }

  function openNew() { setForm(EMPTY); setEditId(null); setShowModal(true); }
  function openEdit(p) {
    setForm({ nome: p.nome, objetivo: p.objetivo||'', disciplinas: (p.disciplinas||[]).join(', '), turmas: (p.turmas||[]).join(', '), data_inicio: p.data_inicio||'', data_fim: p.data_fim||'', status: p.status, progresso: p.progresso||0 });
    setEditId(p.id); setShowModal(true);
  }
  function closeModal() { setShowModal(false); setForm(EMPTY); setEditId(null); }

  async function saveProjeto() {
    if (!form.nome) return;
    setSaving(true);
    const payload = {
      ...form,
      disciplinas: form.disciplinas.split(',').map(s => s.trim()).filter(Boolean),
      turmas: form.turmas.split(',').map(s => s.trim()).filter(Boolean),
      progresso: parseInt(form.progresso)||0,
      created_by: user.id
    };
    let err;
    if (editId) ({ error: err } = await supabase.from('projetos').update(payload).eq('id', editId));
    else ({ error: err } = await supabase.from('projetos').insert(payload));
    if (!err) { setMsg('Projeto salvo!'); closeModal(); loadProjetos(); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteProjeto(id) {
    if (!confirm('Excluir este projeto?')) return;
    await supabase.from('projetos').delete().eq('id', id);
    loadProjetos();
  }

  function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }
  function statusColor(s) {
    const map = { 'Concluído':'verde','Em execução':'amarelo','Planejamento':'azul','Suspenso':'vermelho' };
    return `badge badge-${map[s]||'cinza'}`;
  }

  return (
    <Layout title="Projetos Pedagógicos" subtitle="Acompanhamento dos projetos interdisciplinares CSP 2027">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>{projetos.length} projeto(s) cadastrado(s)</span>
        {canEdit && <button className="btn btn-primary" onClick={openNew}>+ Novo Projeto</button>}
      </div>

      {msg && <div className="alert alert-success">✅ {msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : projetos.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="icon">🔬</div><h3>Nenhum projeto cadastrado</h3><p>Adicione os projetos pedagógicos do ano letivo.</p>{canEdit && <button className="btn btn-primary" onClick={openNew}>+ Novo Projeto</button>}</div></div>
        ) : (
          projetos.map(p => (
            <div className="card" key={p.id}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{p.nome}</h3>
                      <span className={statusColor(p.status)}>{p.status}</span>
                    </div>
                    {p.objetivo && <p style={{ fontSize: '12px', color: 'var(--cinza-texto)', marginBottom: '10px' }}>{p.objetivo}</p>}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--cinza-texto)', flexWrap: 'wrap' }}>
                      {p.disciplinas?.length > 0 && <span>📚 {p.disciplinas.join(', ')}</span>}
                      {p.turmas?.length > 0 && <span>🏫 {p.turmas.join(', ')}</span>}
                      {p.data_inicio && <span>📅 {fmtDate(p.data_inicio)}{p.data_fim ? ` a ${fmtDate(p.data_fim)}` : ''}</span>}
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--cinza-texto)', marginBottom: '4px' }}>
                        <span>Progresso</span><span><strong>{p.progresso}%</strong></span>
                      </div>
                      <div className="progress-bar">
                        <div className={`progress-fill${p.progresso >= 100 ? '' : p.progresso >= 50 ? ' amarelo' : ''}`} style={{ width: `${p.progresso}%` }}></div>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProjeto(p.id)}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Editar Projeto' : 'Novo Projeto Pedagógico'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome do Projeto *</label>
                <input className="form-control" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Projeto Sustentabilidade 2027" />
              </div>
              <div className="form-group">
                <label className="form-label">Objetivo</label>
                <textarea className="form-control" value={form.objetivo} onChange={e => setForm(f=>({...f,objetivo:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Disciplinas (separadas por vírgula)</label>
                <input className="form-control" value={form.disciplinas} onChange={e => setForm(f=>({...f,disciplinas:e.target.value}))} placeholder="Ex: Ciências, Português, Arte" />
              </div>
              <div className="form-group">
                <label className="form-label">Turmas (separadas por vírgula)</label>
                <input className="form-control" value={form.turmas} onChange={e => setForm(f=>({...f,turmas:e.target.value}))} placeholder="Ex: 6A, 6B, 7A" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Início</label>
                  <input type="date" className="form-control" value={form.data_inicio} onChange={e => setForm(f=>({...f,data_inicio:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fim</label>
                  <input type="date" className="form-control" value={form.data_fim} onChange={e => setForm(f=>({...f,data_fim:e.target.value}))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
                    {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Progresso ({form.progresso}%)</label>
                  <input type="range" min="0" max="100" step="5" value={form.progresso} onChange={e => setForm(f=>({...f,progresso:e.target.value}))} style={{ width: '100%', marginTop: '8px' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveProjeto} disabled={saving || !form.nome}>
                {saving ? 'Salvando...' : '✅ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
