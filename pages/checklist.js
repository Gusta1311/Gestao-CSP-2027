import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const FREQ = ['Diário','Semanal','Mensal','Bimestral','Semestral','Anual'];
const PRIOR = ['Crítico','Importante','Complementar'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const EMPTY = { atividade: '', categoria: '', frequencia: 'Mensal', mes: '', prazo: '', responsavel: 'Coordenação', prioridade: 'Importante' };

export default function Checklist() {
  const { canEdit, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filtroFreq, setFiltroFreq] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { loadItems(); }, [filtroFreq]);

  async function loadItems() {
    setLoading(true);
    let q = supabase.from('checklist_items').select('*').order('prazo', { ascending: true, nullsFirst: false });
    if (filtroFreq) q = q.eq('frequencia', filtroFreq);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }

  async function toggleConcluido(item) {
    const concluido = !item.concluido;
    await supabase.from('checklist_items').update({ concluido, data_conclusao: concluido ? new Date().toISOString().split('T')[0] : null }).eq('id', item.id);
    loadItems();
  }

  async function saveItem() {
    if (!form.atividade) return;
    setSaving(true);
    const payload = { ...form, mes: form.mes ? parseInt(form.mes) : null, created_by: user.id };
    let err;
    if (editId) ({ error: err } = await supabase.from('checklist_items').update(payload).eq('id', editId));
    else ({ error: err } = await supabase.from('checklist_items').insert(payload));
    if (!err) { setMsg('Item salvo!'); setShowModal(false); setForm(EMPTY); setEditId(null); loadItems(); }
    setSaving(false);
    setTimeout(() => setMsg(''), 2500);
  }

  async function deleteItem(id) {
    if (!confirm('Excluir este item?')) return;
    await supabase.from('checklist_items').delete().eq('id', id);
    loadItems();
  }

  const pendentes = items.filter(i => !i.concluido).length;
  const concluidos = items.filter(i => i.concluido).length;
  const hoje = new Date().toISOString().split('T')[0];
  const vencidos = items.filter(i => !i.concluido && i.prazo && i.prazo < hoje).length;

  function priorColor(p) { return { 'Crítico':'vermelho','Importante':'amarelo','Complementar':'verde' }[p]||'cinza'; }
  function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}`; }
  function prazoStatus(item) {
    if (item.concluido) return null;
    if (!item.prazo) return null;
    if (item.prazo < hoje) return <span className="badge badge-vermelho">Vencido</span>;
    const diff = Math.ceil((new Date(item.prazo) - new Date()) / 86400000);
    if (diff <= 7) return <span className="badge badge-amarelo">{diff}d</span>;
    return null;
  }

  return (
    <Layout title="Checklist" subtitle="Lista de atividades e tarefas da Coordenação Pedagógica">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ flex: 1, minWidth: '120px', padding: '14px' }}>
          <div className="stat-value" style={{ fontSize: '22px' }}>{pendentes}</div>
          <div className="stat-label">Pendentes</div>
        </div>
        <div className="stat-card verde" style={{ flex: 1, minWidth: '120px', padding: '14px' }}>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--verde-escuro)' }}>{concluidos}</div>
          <div className="stat-label">Concluídos</div>
        </div>
        <div className="stat-card vermelho" style={{ flex: 1, minWidth: '120px', padding: '14px' }}>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--vermelho)' }}>{vencidos}</div>
          <div className="stat-label">Vencidos</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <select className="form-control" style={{ width: '160px' }} value={filtroFreq} onChange={e => setFiltroFreq(e.target.value)}>
          <option value="">Todas as frequências</option>
          {FREQ.map(f => <option key={f}>{f}</option>)}
        </select>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true); }}>+ Nova Tarefa</button>}
      </div>

      {msg && <div className="alert alert-success">✅ {msg}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <h3>Nenhuma tarefa cadastrada</h3>
            <p>Adicione as atividades do checklist da coordenação.</p>
            {canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Adicionar Tarefa</button>}
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px',
                borderBottom: '1px solid var(--cinza-medio)',
                opacity: item.concluido ? 0.55 : 1,
                background: item.prazo && item.prazo < hoje && !item.concluido ? '#FFF8F8' : 'white'
              }}>
                <input
                  type="checkbox"
                  checked={item.concluido}
                  onChange={() => toggleConcluido(item)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', textDecoration: item.concluido ? 'line-through' : 'none' }}>
                      {item.atividade}
                    </span>
                    <span className={`badge badge-${priorColor(item.prioridade)}`}>{item.prioridade}</span>
                    <span className="badge badge-cinza">{item.frequencia}</span>
                    {prazoStatus(item)}
                  </div>
                  {(item.categoria || item.prazo) && (
                    <div style={{ fontSize: '11px', color: 'var(--cinza-texto)', marginTop: '3px' }}>
                      {item.categoria && <span>{item.categoria} · </span>}
                      {item.responsavel && <span>{item.responsavel}</span>}
                      {item.prazo && <span> · Prazo: {fmtDate(item.prazo)}</span>}
                      {item.concluido && item.data_conclusao && <span> · Concluído em: {fmtDate(item.data_conclusao)}</span>}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setForm({atividade:item.atividade,categoria:item.categoria||'',frequencia:item.frequencia,mes:item.mes||'',prazo:item.prazo||'',responsavel:item.responsavel||'',prioridade:item.prioridade}); setEditId(item.id); setShowModal(true); }}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setShowModal(false), setEditId(null))}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Atividade *</label>
                <input className="form-control" value={form.atividade} onChange={e => setForm(f=>({...f,atividade:e.target.value}))} placeholder="Ex: Reunião pedagógica mensal" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Frequência</label>
                  <select className="form-control" value={form.frequencia} onChange={e => setForm(f=>({...f,frequencia:e.target.value}))}>
                    {FREQ.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select className="form-control" value={form.prioridade} onChange={e => setForm(f=>({...f,prioridade:e.target.value}))}>
                    {PRIOR.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <input type="date" className="form-control" value={form.prazo} onChange={e => setForm(f=>({...f,prazo:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input className="form-control" value={form.responsavel} onChange={e => setForm(f=>({...f,responsavel:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <input className="form-control" value={form.categoria} onChange={e => setForm(f=>({...f,categoria:e.target.value}))} placeholder="Ex: Pedagógico, Administrativo..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveItem} disabled={saving || !form.atividade}>
                {saving ? 'Salvando...' : '✅ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
