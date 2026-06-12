import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ eventos: 0, reunioes: 0, projetos: 0, checklist: 0 });
  const [proximosEventos, setProximosEventos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const [{ count: totalEventos }, { count: totalReunioes }, { count: totalProjetos }, { count: checksPendentes }] = await Promise.all([
        supabase.from('eventos').select('*', { count: 'exact', head: true }),
        supabase.from('reunioes').select('*', { count: 'exact', head: true }),
        supabase.from('projetos').select('*', { count: 'exact', head: true }).neq('status', 'Concluído'),
        supabase.from('checklist_items').select('*', { count: 'exact', head: true }).eq('concluido', false),
      ]);

      setStats({ eventos: totalEventos || 0, reunioes: totalReunioes || 0, projetos: totalProjetos || 0, checklist: checksPendentes || 0 });

      const { data: proximos } = await supabase
        .from('eventos')
        .select('*')
        .gte('data_inicio', hoje)
        .order('data_inicio', { ascending: true })
        .limit(8);

      setProximosEventos(proximos || []);

      const { data: itemsVencidos } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('concluido', false)
        .lte('prazo', hoje)
        .not('prazo', 'is', null)
        .limit(5);

      setAlertas(itemsVencidos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  }

  function tipoColor(tipo) {
    const map = {
      'Feriado': 'vermelho', 'Avaliação': 'amarelo', 'Simulado': 'amarelo',
      'Pedagógico': 'azul', 'Cultural': 'verde', 'Formação': 'roxo',
      'Reunião': 'azul', 'Administrativo': 'cinza', 'Recesso': 'roxo',
    };
    return `badge badge-${map[tipo] || 'cinza'}`;
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) return <Layout title="Dashboard"><div className="loading-spinner"><div className="spinner"></div></div></Layout>;

  return (
    <Layout
      title="Dashboard"
      subtitle="Visão geral do ano letivo 2027"
    >
      {/* SAUDAÇÃO */}
      <div style={{
        background: 'linear-gradient(135deg, var(--azul-escuro), var(--azul))',
        color: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
            {greeting()}, {profile?.nome?.split(' ')[0] || 'Coordenadora'}! 👋
          </h2>
          <p style={{ opacity: 0.85, fontSize: '13px', marginTop: '4px' }}>
            Ano Letivo 2027 · Colégio São Paulo · Coordenação Pedagógica
          </p>
        </div>
        <div style={{ fontSize: '40px' }}>🏫</div>
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <span>⚠️</span>
          <div>
            <strong>Atenção:</strong> Você tem {alertas.length} item(ns) do checklist com prazo vencido.
            <Link href="/checklist" style={{ marginLeft: '8px', fontWeight: 700 }}>Ver checklist →</Link>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.eventos}</div>
          <div className="stat-label">Eventos Cadastrados</div>
          <div className="stat-sub">No ano letivo 2027</div>
        </div>
        <div className="stat-card verde">
          <div className="stat-value">{stats.reunioes}</div>
          <div className="stat-label">Reuniões Registradas</div>
          <div className="stat-sub">Pedagógicas e com pais</div>
        </div>
        <div className="stat-card amarelo">
          <div className="stat-value">{stats.projetos}</div>
          <div className="stat-label">Projetos em Andamento</div>
          <div className="stat-sub">Projetos pedagógicos ativos</div>
        </div>
        <div className="stat-card vermelho">
          <div className="stat-value">{stats.checklist}</div>
          <div className="stat-label">Tarefas Pendentes</div>
          <div className="stat-sub">No checklist da coordenação</div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid-2">
        {/* PRÓXIMOS EVENTOS */}
        <div className="card">
          <div className="card-header">
            <h3>📅 Próximos Eventos</h3>
            <Link href="/eventos" className="btn btn-secondary btn-sm">Ver todos</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {proximosEventos.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>Nenhum evento futuro cadastrado.</p>
                <Link href="/eventos" className="btn btn-primary btn-sm">+ Adicionar evento</Link>
              </div>
            ) : (
              <table>
                <tbody>
                  {proximosEventos.map(ev => (
                    <tr key={ev.id}>
                      <td style={{ width: '50px', fontWeight: 700, color: 'var(--azul)', fontSize: '12px' }}>
                        {formatDate(ev.data_inicio)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{ev.nome}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={tipoColor(ev.tipo)}>{ev.tipo}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ACESSO RÁPIDO */}
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3>⚡ Acesso Rápido</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Link href="/eventos" className="btn btn-primary">📅 Novo Evento</Link>
                <Link href="/reunioes" className="btn btn-success">🤝 Nova Reunião</Link>
                <Link href="/projetos" className="btn btn-secondary">🔬 Novo Projeto</Link>
                <Link href="/checklist" className="btn btn-secondary">✅ Checklist</Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>📊 Bimestres 2027</h3>
            </div>
            <div className="card-body">
              {(() => {
                const hoje = new Date().toISOString().split('T')[0];
                const bimestres = [
                  { label: '1º Bimestre', periodo: 'Fev-Abr', inicio: '2027-02-01', fim: '2027-04-30' },
                  { label: '2º Bimestre', periodo: 'Mai-Jun', inicio: '2027-05-01', fim: '2027-06-30' },
                  { label: '3º Bimestre', periodo: 'Jul-Set', inicio: '2027-07-01', fim: '2027-09-30' },
                  { label: '4º Bimestre', periodo: 'Out-Dez', inicio: '2027-10-01', fim: '2027-12-31' },
                ];
                return bimestres.map(b => {
                  let status, color;
                  if (hoje > b.fim) { status = 'Encerrado'; color = 'verde'; }
                  else if (hoje >= b.inicio) { status = 'Em andamento'; color = 'amarelo'; }
                  else { status = 'Futuro'; color = 'cinza'; }
                  return { ...b, status, color };
                });
              })().map(b => (
                <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--cinza-medio)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--cinza-texto)' }}>{b.periodo}</div>
                  </div>
                  <span className={`badge badge-${b.color}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
