import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const FERIADOS_2027 = {
  '2027-01-01': 'Confraternização Universal',
  '2027-02-08': 'Carnaval',
  '2027-02-09': 'Carnaval',
  '2027-02-10': 'Quarta-feira de Cinzas',
  '2027-03-28': 'Páscoa',
  '2027-04-21': 'Tiradentes',
  '2027-05-01': 'Dia do Trabalhador',
  '2027-05-27': 'Corpus Christi',
  '2027-07-09': 'Revolução Constitucionalista (SP)',
  '2027-09-07': 'Independência do Brasil',
  '2027-10-12': 'N.S. Aparecida / Dia das Crianças',
  '2027-11-02': 'Finados',
  '2027-11-15': 'Proclamação da República',
  '2027-11-20': 'Consciência Negra',
  '2027-12-25': 'Natal',
};

export default function Calendario() {
  const [eventos, setEventos] = useState({});
  const [loading, setLoading] = useState(true);
  const [mesAtivo, setMesAtivo] = useState(null);
  const [eventosDoMes, setEventosDoMes] = useState([]);

  useEffect(() => { loadEventos(); }, []);

  async function loadEventos() {
    setLoading(true);
    const { data } = await supabase.from('eventos').select('*').order('data_inicio');
    const byDate = {};
    (data || []).forEach(ev => {
      if (!byDate[ev.data_inicio]) byDate[ev.data_inicio] = [];
      byDate[ev.data_inicio].push(ev);
    });
    setEventos(byDate);
    setLoading(false);
  }

  function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
  function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

  function dateKey(y, m, d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function getCellClass(y, m, d) {
    const key = dateKey(y, m, d);
    const dow = new Date(y, m, d).getDay();
    if (FERIADOS_2027[key]) return 'day-cell holiday';
    if (eventos[key]) return 'day-cell event';
    if (dow === 0 || dow === 6) return 'day-cell weekend';
    return 'day-cell';
  }

  function openMes(mesIdx) {
    const data = [];
    const y = 2027;
    Object.keys(FERIADOS_2027).forEach(k => {
      const [ky, km] = k.split('-');
      if (parseInt(ky) === y && parseInt(km) - 1 === mesIdx) {
        data.push({ data: k, nome: FERIADOS_2027[k], tipo: 'Feriado' });
      }
    });
    Object.keys(eventos).forEach(k => {
      const [ky, km] = k.split('-');
      if (parseInt(ky) === y && parseInt(km) - 1 === mesIdx) {
        eventos[k].forEach(ev => data.push({ data: k, nome: ev.nome, tipo: ev.tipo, status: ev.status }));
      }
    });
    data.sort((a, b) => a.data.localeCompare(b.data));
    setEventosDoMes(data);
    setMesAtivo(mesIdx);
  }

  function tipoColor(tipo) {
    const map = { 'Feriado':'vermelho','Avaliação':'amarelo','Pedagógico':'azul','Cultural':'verde','Formação':'roxo','Reunião':'azul','Recesso':'roxo' };
    return `badge badge-${map[tipo]||'cinza'}`;
  }

  if (loading) return <Layout title="Calendário 2027"><div className="loading-spinner"><div className="spinner"></div></div></Layout>;

  return (
    <Layout title="Calendário 2027" subtitle="Visão anual do calendário acadêmico do Colégio São Paulo">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
        {[
          { color: '#FFCDD2', label: 'Feriado' },
          { color: '#BBDEFB', label: 'Evento cadastrado' },
          { color: '#FAFAFA', label: 'Fim de semana' },
          { color: 'white', label: 'Dia letivo' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '14px', background: l.color, border: '1px solid #ddd', borderRadius: '3px' }}></div>
            <span style={{ color: 'var(--cinza-texto)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="calendario-grid">
        {MESES.map((nomeMes, mesIdx) => {
          const y = 2027;
          const dias = getDaysInMonth(y, mesIdx);
          const primeiroDia = getFirstDayOfMonth(y, mesIdx);
          const cells = [];
          for (let i = 0; i < primeiroDia; i++) cells.push(null);
          for (let d = 1; d <= dias; d++) cells.push(d);

          return (
            <div className="mes-card" key={nomeMes}>
              <div className="mes-header" style={{ cursor: 'pointer' }} onClick={() => openMes(mesIdx === mesAtivo ? null : mesIdx)}>
                <span>{nomeMes} 2027</span>
                <span className="mes-header-badge">2027</span>
              </div>
              <div className="mes-days">
                {DIAS.map(d => <div key={d} className="day-name">{d}</div>)}
                {cells.map((d, i) => (
                  <div
                    key={i}
                    className={d ? getCellClass(y, mesIdx, d) : 'day-cell empty'}
                    title={d ? (FERIADOS_2027[dateKey(y, mesIdx, d)] || (eventos[dateKey(y, mesIdx, d)] ? eventos[dateKey(y, mesIdx, d)].map(e=>e.nome).join(', ') : '')) : ''}
                  >
                    {d && <span className="day-num">{d}</span>}
                  </div>
                ))}
              </div>

              {/* EVENTOS DO MÊS EXPANDIDO */}
              {mesAtivo === mesIdx && eventosDoMes.length > 0 && (
                <div style={{ padding: '10px 12px', borderTop: '2px solid var(--cinza-medio)', background: '#FAFEFF' }}>
                  {eventosDoMes.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '4px 0', fontSize: '11px', borderBottom: i < eventosDoMes.length - 1 ? '1px solid #eee' : 'none' }}>
                      <span style={{ fontWeight: 700, color: 'var(--azul)', whiteSpace: 'nowrap' }}>
                        {ev.data.split('-')[2]}/{ev.data.split('-')[1]}
                      </span>
                      <span className={tipoColor(ev.tipo)} style={{ flexShrink: 0 }}>{ev.tipo}</span>
                      <span style={{ color: 'var(--preto-suave)', lineHeight: 1.3 }}>{ev.nome}</span>
                    </div>
                  ))}
                </div>
              )}
              {mesAtivo === mesIdx && eventosDoMes.length === 0 && (
                <div style={{ padding: '10px 12px', borderTop: '2px solid var(--cinza-medio)', fontSize: '11px', color: 'var(--cinza-texto)', textAlign: 'center' }}>
                  Nenhum evento cadastrado neste mês.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
