import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const TIPOS = ['Pedagógico','Cultural','Esportivo','Administrativo','Feriado','Recesso','Avaliação','Simulado','Formação','Reunião'];
const STATUS = ['Planejado','Em andamento','Realizado','Cancelado'];
const BIMESTRES = ['Pré-ano','1º','2º','3º','4º','Pós-ano'];

const EMPTY_FORM = { nome: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'Pedagógico', bimestre: '1º', status: 'Planejado' };

export default function Eventos() {
  const { canEdit, user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState({ tipo: '', status: '', bimestre: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { loadEventos(); }, []);

  async function loadEventos() {
    setLoading(true);
    let query = supabase.from('eventos').select('*').order('data_inicio', { ascending: true });
    if (filtro.tipo) query = query.eq('tipo', filtro.tipo);
    if (filtro.status) query = query.eq('status', filtro.status);
    if (filtro.bimestre) query = query.eq('bimestre', filtro.bimestre);
    const { data } = await query;
    setEventos(data || []);
    setLoading(false);
  }

  useEffect(() => { loadEventos(); }, [filtro]);

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); }
  function openEdit(ev) {
    setForm({ nome: ev.nome, descricao: ev.descricao || '', data_inicio: ev.data_inicio, data_fim: ev.data_fim || '', tipo: ev.tipo, bimestre: ev.bimestre || '1º', status: ev.status });
    setEditId(ev.id);
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setForm(EMPTY_FORM); setEditId(null); }

  async function saveEvento() {
    if (!form.nome || !form.data_inicio) return;
    setSaving(true);
    const payload = { ...form, created_by: user.id };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('eventos').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('eventos').insert(payload));
    }
    if (!err) { setMsg('Evento salvo com sucesso!'); closeModal(); loadEventos(); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteEvento(id) {
    if (!confirm('Deseja excluir este evento?')) return;
    await supabase.from('eventos').delete().eq('id', id);
    loadEventos();
  }

  function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }
  function tipoColor(tipo) {
    const map = { 'Feriado':'vermelho','Avaliação':'amarelo','Simulado':'amarelo','Pedagógico':'azul','Cultural':'verde','Formação':'roxo','Reunião':'azul','Administrativo':'cinza','Recesso':'roxo','Esportivo':'verde' };
    return `badge badge-${map[tipo]||'cinza'}`;
  }
  function statusColor(s) {
    const map = { 'Realizado':'verde','Em andamento':'amarelo','Planejado':'azul','Cancelado':'vermelho' };
    return `badge badge-${map[s]||'cinza'}`;
  }

  return (
    <Layout title="Eventos Escolares" subtitle="Calendário e gestão de eventos do ano letivo 2027">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: '140px' }} value={filtro.tipo} onChange={e => setFiltro(f => ({...f, tipo: e.target.value}))}>
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="form-control" style={{ width: '140px' }} value={filtro.status} onChange={e => setFiltro(f => ({...f, status: e.target.value}))}>
            <option value="">Todos os status</option>
            {STATUS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width: '130px' }} value={filtro.bimestre} onChange={e => setFiltro(f => ({...f, bimestre: e.target.value}))}>
            <option value="">Todos os bim.</option>
            {BIMESTRES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openNew}>+ Novo Evento</button>
        )}
      </div>

      {msg && <div className="alert alert-success">✅ {msg}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : eventos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <h3>Nenhum evento encontrado</h3>
            <p>Adicione o primeiro evento do ano letivo 2027.</p>
            {canEdit && <button className="btn btn-primary" onClick={openNew}>+ Adicionar Evento</button>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th><th>Nome do Evento</th><th>Tipo</th><th>Bimestre</th><th>Status</th>
                  {canEdit && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {eventos.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--azul)' }}>
                      {fmtDate(ev.data_inicio)}{ev.data_fim && ev.data_fim !== ev.data_inicio ? ` a ${fmtDate(ev.data_fim)}` : ''}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ev.nome}</div>
                      {ev.descricao && <div style={{ fontSize: '11px', color: 'var(--cinza-texto)', marginTop: '2px' }}>{ev.descricao.slice(0, 80)}{ev.descricao.length > 80 ? '...' : ''}</div>}
                    </td>
                    <td><span className={tipoColor(ev.tipo)}>{ev.tipo}</span></td>
                    <td><span className="badge badge-cinza">{ev.bimestre}</span></td>
                    <td><span className={statusColor(ev.status)}>{ev.status}</span></td>
                    {canEdit && (
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ marginRight: '6px' }} onClick={() => openEdit(ev)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteEvento(ev.id)}>🗑️</button>
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
              <h3>{editId ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome do Evento *</label>
                <input className="form-control" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} placeholder="Ex: Feira de Ciências CSP 2027" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Data Início *</label>
                  <input type="date" className="form-control" value={form.data_inicio} onChange={e => setForm(f => ({...f, data_inicio: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data Fim</label>
                  <input type="date" className="form-control" value={form.data_fim} onChange={e => setForm(f => ({...f, data_fim: e.target.value}))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
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
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  {STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-control" value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} placeholder="Detalhes opcionais sobre o evento..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEvento} disabled={saving || !form.nome || !form.data_inicio}>
                {saving ? 'Salvando...' : '✅ Salvar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
