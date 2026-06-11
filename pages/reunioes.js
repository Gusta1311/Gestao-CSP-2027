import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const TIPOS = ['Pedagógica','Com Pais','Diretiva','Conselho de Classe','Formação Docente'];
const BIMESTRES = ['Pré-ano','1º','2º','3º','4º','Pós-ano'];
const EMPTY = { tipo: 'Pedagógica', data: '', pauta: '', participantes_convocados: '', participantes_presentes: '', decisoes: '', proxima_data: '', bimestre: '1º' };

export default function Reunioes() {
  const { canEdit, user } = useAuth();
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadReunioes(); }, []);

  async function loadReunioes() {
    setLoading(true);
    const { data } = await supabase.from('reunioes').select('*').order('data', { ascending: false });
    setReunioes(data || []);
    setLoading(false);
  }

  function openNew() { setForm(EMPTY); setEditId(null); setShowModal(true); }
  function openEdit(r) {
    setForm({
      tipo: r.tipo, data: r.data?.slice(0, 16) || '', pauta: r.pauta || '',
      participantes_convocados: r.participantes_convocados || '',
      participantes_presentes: r.participantes_presentes || '',
      decisoes: r.decisoes || '', proxima_data: r.proxima_data || '', bimestre: r.bimestre || '1º'
    });
    setEditId(r.id); setShowModal(true);
  }
  function closeModal() { setShowModal(false); setForm(EMPTY); setEditId(null); }

  async function saveReunioes() {
    if (!form.data) return;
    setSaving(true);
    const payload = {
      ...form,
      participantes_convocados: parseInt(form.participantes_convocados) || 0,
      participantes_presentes: parseInt(form.participantes_presentes) || 0,
      created_by: user.id
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('reunioes').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('reunioes').insert(payload));
    }
    if (!err) { setMsg('Reunião salva!'); closeModal(); loadReunioes(); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteR(id) {
    if (!confirm('Excluir esta reunião?')) return;
    await supabase.from('reunioes').delete().eq('id', id);
    loadReunioes();
  }

  function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function pctPresenca(conv, pres) {
    if (!conv || conv === 0) return null;
    const pct = Math.round((pres / conv) * 100);
    const color = pct >= 90 ? 'verde' : pct >= 70 ? 'amarelo' : 'vermelho';
    return <span className={`badge badge-${color}`}>{pct}%</span>;
  }

  function tipoColor(tipo) {
    const map = { 'Pedagógica':'azul','Com Pais':'verde','Diretiva':'roxo','Conselho de Classe':'amarelo','Formação Docente':'cinza' };
    return `badge badge-${map[tipo]||'cinza'}`;
  }

  return (
    <Layout title="Reuniões" subtitle="Registro de todas as reuniões pedagógicas, com pais e diretivas">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>
          Total: <strong>{reunioes.length}</strong> reuniões registradas
        </div>
        {canEdit && <button className="btn btn-primary" onClick={openNew}>+ Nova Reunião</button>}
      </div>

      {msg && <div className="alert alert-success">✅ {msg}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : reunioes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🤝</div>
            <h3>Nenhuma reunião registrada</h3>
            <p>Adicione as reuniões realizadas para manter o histórico.</p>
            {canEdit && <button className="btn btn-primary" onClick={openNew}>+ Registrar Reunião</button>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th><th>Tipo</th><th>Pauta</th><th>Bimestre</th><th>Presença</th><th>Próxima</th>
                  {canEdit && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {reunioes.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fmtDate(r.data)}</td>
                    <td><span className={tipoColor(r.tipo)}>{r.tipo}</span></td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{r.pauta?.slice(0,60) || '—'}{r.pauta?.length > 60 ? '...' : ''}</div>
                      {r.decisoes && <div style={{ fontSize: '11px', color: 'var(--cinza-texto)', marginTop: '2px' }}>{r.decisoes.slice(0,50)}...</div>}
                    </td>
                    <td><span className="badge badge-cinza">{r.bimestre}</span></td>
                    <td>{pctPresenca(r.participantes_convocados, r.participantes_presentes) || <span style={{color:'var(--cinza-texto)'}}>—</span>}</td>
                    <td style={{ fontSize: '12px', color: 'var(--cinza-texto)' }}>
                      {r.proxima_data ? r.proxima_data.split('-').reverse().join('/') : '—'}
                    </td>
                    {canEdit && (
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ marginRight: '6px' }} onClick={() => openEdit(r)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteR(r.id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Editar Reunião' : 'Registrar Reunião'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo de Reunião</label>
                  <select className="form-control" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bimestre</label>
                  <select className="form-control" value={form.bimestre} onChange={e => setForm(f => ({...f, bimestre: e.target.value}))}>
                    {BIMESTRES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Data e Hora *</label>
                <input type="datetime-local" className="form-control" value={form.data} onChange={e => setForm(f => ({...f, data: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Pauta / Assuntos</label>
                <textarea className="form-control" value={form.pauta} onChange={e => setForm(f => ({...f, pauta: e.target.value}))} placeholder="Descreva os assuntos discutidos..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Convocados</label>
                  <input type="number" className="form-control" value={form.participantes_convocados} onChange={e => setForm(f => ({...f, participantes_convocados: e.target.value}))} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Presentes</label>
                  <input type="number" className="form-control" value={form.participantes_presentes} onChange={e => setForm(f => ({...f, participantes_presentes: e.target.value}))} min="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Decisões e Encaminhamentos</label>
                <textarea className="form-control" value={form.decisoes} onChange={e => setForm(f => ({...f, decisoes: e.target.value}))} placeholder="Registre as decisões tomadas..." />
              </div>
              <div className="form-group">
                <label className="form-label">Próxima Reunião</label>
                <input type="date" className="form-control" value={form.proxima_data} onChange={e => setForm(f => ({...f, proxima_data: e.target.value}))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveReunioes} disabled={saving || !form.data}>
                {saving ? 'Salvando...' : '✅ Salvar Reunião'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
