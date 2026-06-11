import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const KPIS_DEFAULT = [
  { key: 'frequencia_media', label: 'Frequência Média dos Alunos', meta: 90, unidade: '%', icon: '👥', color: 'verde' },
  { key: 'media_geral', label: 'Média Geral de Desempenho', meta: 7.0, unidade: '', icon: '📊', color: 'azul' },
  { key: 'pct_abaixo_media', label: 'Alunos Abaixo da Média', meta: 10, unidade: '%', icon: '⚠️', color: 'amarelo', inverso: true },
  { key: 'reuniao_presenca', label: 'Presença nas Reuniões de Pais', meta: 70, unidade: '%', icon: '👪', color: 'verde' },
  { key: 'notas_prazo', label: 'Notas Entregues no Prazo', meta: 100, unidade: '%', icon: '📝', color: 'azul' },
  { key: 'projetos_concluidos', label: 'Projetos Concluídos', meta: 85, unidade: '%', icon: '🔬', color: 'verde' },
  { key: 'simulados_realizados', label: 'Simulados Realizados', meta: 3, unidade: '', icon: '📋', color: 'azul' },
  { key: 'formacoes_presenca', label: 'Presença em Formações', meta: 90, unidade: '%', icon: '👩‍🏫', color: 'verde' },
];

export default function Indicadores() {
  const { canEdit, user } = useAuth();
  const [kpiValues, setKpiValues] = useState({});
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [simulados, setSimulados] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: avs }, { data: sims }] = await Promise.all([
      supabase.from('avaliacoes').select('*').order('created_at', { ascending: false }),
      supabase.from('simulados').select('*').order('numero'),
    ]);
    setAvaliacoes(avs || []);
    setSimulados(sims || []);
    const stored = localStorage.getItem('csp_kpis');
    if (stored) setKpiValues(JSON.parse(stored));
    setLoading(false);
  }

  function saveKpis() {
    localStorage.setItem('csp_kpis', JSON.stringify(kpiValues));
    setEditing(false);
    setMsg('Indicadores atualizados!');
    setTimeout(() => setMsg(''), 2500);
  }

  function getStatus(kpi, value) {
    if (value === undefined || value === null || value === '') return 'sem-dado';
    const num = parseFloat(value);
    const meta = kpi.meta;
    if (kpi.inverso) {
      if (num <= meta * 0.6) return 'verde';
      if (num <= meta) return 'amarelo';
      return 'vermelho';
    }
    if (num >= meta) return 'verde';
    if (num >= meta * 0.8) return 'amarelo';
    return 'vermelho';
  }

  function statusBadge(status) {
    const map = { verde: ['badge-verde','✅ Meta atingida'], amarelo: ['badge-amarelo','⚠️ Atenção'], vermelho: ['badge-vermelho','🔴 Abaixo da meta'], 'sem-dado': ['badge-cinza','— Sem dado'] };
    const [cls, label] = map[status] || ['badge-cinza','—'];
    return <span className={`badge ${cls}`}>{label}</span>;
  }

  if (loading) return <Layout title="Indicadores"><div className="loading-spinner"><div className="spinner"></div></div></Layout>;

  return (
    <Layout title="Indicadores" subtitle="Dashboard de KPIs da Coordenação Pedagógica CSP 2027">

      {msg && <div className="alert alert-success">✅ {msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>
          Atualize os indicadores manualmente conforme os dados do sistema escolar.
        </p>
        {canEdit && !editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ Editar Indicadores</button>
        )}
        {editing && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
            <button className="btn btn-success" onClick={saveKpis}>✅ Salvar</button>
          </div>
        )}
      </div>

      {/* KPI CARDS */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {KPIS_DEFAULT.map(kpi => {
          const val = kpiValues[kpi.key];
          const status = getStatus(kpi, val);
          const statusColor = { verde: 'var(--verde-escuro)', amarelo: '#E65100', vermelho: 'var(--vermelho)', 'sem-dado': 'var(--cinza-texto)' }[status];
          return (
            <div className={`stat-card ${kpi.color}`} key={kpi.key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cinza-texto)' }}>{kpi.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {editing ? (
                    <input
                      type="number"
                      step="0.1"
                      style={{ width: '80px', padding: '4px 8px', border: '2px solid var(--azul)', borderRadius: '6px', fontSize: '16px', fontWeight: 700, textAlign: 'right' }}
                      value={val ?? ''}
                      onChange={e => setKpiValues(v => ({ ...v, [kpi.key]: e.target.value }))}
                    />
                  ) : (
                    <div className="stat-value" style={{ color: statusColor }}>
                      {val !== undefined && val !== '' ? `${val}${kpi.unidade}` : '—'}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: 'var(--cinza-texto)', marginTop: '2px' }}>Meta: {kpi.meta}{kpi.unidade}</div>
                </div>
              </div>
              {statusBadge(status)}
            </div>
          );
        })}
      </div>

      {/* AVALIAÇÕES */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>📝 Avaliações Registradas</h3>
            <span className="badge badge-azul">{avaliacoes.length}</span>
          </div>
          {avaliacoes.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>Nenhuma avaliação registrada ainda.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Bimestre</th><th>Disciplina</th><th>Média</th><th>% &lt;5,0</th></tr></thead>
                <tbody>
                  {avaliacoes.slice(0, 8).map(a => (
                    <tr key={a.id}>
                      <td><span className="badge badge-cinza">{a.bimestre}</span></td>
                      <td style={{ fontWeight: 600 }}>{a.disciplina}</td>
                      <td>
                        <span className={`badge ${parseFloat(a.media) >= 7 ? 'badge-verde' : parseFloat(a.media) >= 5 ? 'badge-amarelo' : 'badge-vermelho'}`}>
                          {a.media ?? '—'}
                        </span>
                      </td>
                      <td style={{ color: parseFloat(a.pct_abaixo_5) > 20 ? 'var(--vermelho)' : 'inherit' }}>
                        {a.pct_abaixo_5 !== null ? `${a.pct_abaixo_5}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>📋 Simulados ENEM</h3>
            <span className="badge badge-azul">{simulados.length}/3</span>
          </div>
          {simulados.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>Nenhum simulado registrado ainda.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Simulado</th><th>Data</th><th>Participantes</th><th>Média Geral</th><th>Meta</th></tr></thead>
                <tbody>
                  {simulados.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>#{s.numero}</td>
                      <td>{s.data ? s.data.split('-').reverse().join('/') : '—'}</td>
                      <td>{s.n_participantes || '—'}</td>
                      <td>
                        <span className={`badge ${s.media_geral >= s.meta ? 'badge-verde' : 'badge-amarelo'}`}>
                          {s.media_geral ?? '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--cinza-texto)' }}>{s.meta ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
